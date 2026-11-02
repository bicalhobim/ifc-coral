import {PlanningBoard} from './planning-board.ts';
import type {Project} from '../production/types.ts';
import type {ActivityRow} from '../production/planning-view.ts';
import type { ElementTask } from "../ifc/schedule";
import { groupTasks, taskGroupKey } from '../ifc/identity.ts';
import {csvCell} from './csv.ts';
import {downloadBlob} from '../workspace/downloads.ts';
import {simulationDates,simulationFrame} from '../ifc/simulation.ts';
import {summarizeVolumes} from '../ifc/quantities.ts';

export interface GanttHooks {
  project?:()=>Project;
  inspect?:(row:ActivityRow,activate?:boolean)=>void;
  onScrub: (date: Date, visible: ElementTask[], hidden: ElementTask[],active:ElementTask[]) => Promise<void>|void;
  onSelect: (tasks: ElementTask[]) => void;
}

interface TreeNode {
  id: string;
  label: string;
  depth: number;
  start: Date;
  finish: Date;
  durationDays: number;
  tasks: ElementTask[];
  children: TreeNode[];
  collapsed: boolean;
}

const MS_DAY = 86_400_000;
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const TASK_BAR_COLOR = "#a100ff";

export function monthTicks(start: Date, end: Date): { label: string; x: number; year: number; initial: string }[] {
  const span = end.getTime() - start.getTime() || 1;
  const ticks: { label: string; x: number; year: number; initial: string }[] = [];
  const d = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (d.getTime() < end.getTime()) {
    ticks.push({
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      x: ((d.getTime() - start.getTime()) / span) * 100,
      year: d.getFullYear(),
      initial: MONTH_INITIALS[d.getMonth()],
    });
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}

function fmt(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

function msDate(d: Date): number {
  return d.getTime();
}

function collectAllTasks(n: TreeNode): ElementTask[] {
  if (n.tasks.length > 0) return n.tasks;
  const out: ElementTask[] = [];
  for (const c of n.children) out.push(...collectAllTasks(c));
  return out;
}

export class Gantt {
  private domainStart = 0;
  private domainEnd = 1;
  private mode: "planner" | "gantt" | "table" = "planner";
  private board=new PlanningBoard();
  refresh(){if(this._hooks?.project)this.board.refresh(this._hooks.project(),this._tasks);}
  private _container!: HTMLElement;
  private _tasks: ElementTask[]=[];
  private _hooks!: GanttHooks;
  private _tree!: TreeNode[];
  private _flat: TreeNode[] = [];
  private _selected: TreeNode | null = null;
  private selection:ElementTask[]=[];
  private dates:number[]=[];private index=0;private scope='all';private playing=false;private run=0;private timer:ReturnType<typeof setTimeout>|undefined;
  private speed=850;private controls?:HTMLElement;private frameQueue:Promise<void>=Promise.resolve();
  private filter='';

  render(container: HTMLElement, tasks: ElementTask[], hooks: GanttHooks) {
    this.pause();this.selection=[];this.scope='all';this.dates=simulationDates(tasks);this.index=Math.max(0,this.dates.length-1);
    this._container = container;
    this._tasks = tasks;
    this._hooks = hooks;
    this.mode = hooks.project?"planner":"gantt";
    this._selected = null;
    this._tree = this.buildTree(tasks);
    this.updateDomain();
    this._renderView();
  }

  // ── construção da árvore ────────────────────────────────────────

  private buildTree(tasks: ElementTask[]): TreeNode[] {
    if (tasks.length === 0) return [];

    this.domainStart = Math.min(...tasks.map((t) => msDate(t.start)));
    this.domainEnd = Math.max(...tasks.map((t) => msDate(t.finish)));

    const nodes = new Map<string, TreeNode>();
    const mkKey = (label: string, depth: number, parentId: string) => JSON.stringify([parentId,depth,label]);

    const getOrCreate = (label: string, depth: number, parentId: string): TreeNode => {
      const key = mkKey(label, depth, parentId);
      if (nodes.has(key)) return nodes.get(key)!;
      const n: TreeNode = {
        id: key, label, depth,
        start: new Date(Infinity), finish: new Date(-Infinity),
        durationDays: 0, tasks: [], children: [], collapsed: false,
      };
      nodes.set(key, n);
      return n;
    };

    const root: TreeNode = {
      id: "root", label: "Cronograma", depth: -1,
      start: new Date(this.domainStart), finish: new Date(this.domainEnd),
      durationDays: 0, tasks: [], children: [], collapsed: false,
    };

    const byTaskName = groupTasks(tasks);

    for (const [, taskGroup] of byTaskName) {
      const t = taskGroup[0];
      const s1 = t.summary1 ?? t.building;
      const s2 = t.summary2 ?? t.storey;
      const s3 = t.summary3;
      const s4 = t.summary4 ?? t.eap;

      let parent = root;
      const chain: [string, number][] = [];
      if (s1) chain.push([s1, 0]);
      if (s2) chain.push([s2, 1]);
      if (s3) chain.push([s3, 2]);
      if (s4) chain.push([s4, 3]);

      for (const [label, depth] of chain) {
        const child = getOrCreate(label, depth, parent.id);
        if (!parent.children.includes(child)) parent.children.push(child);
        parent = child;
      }

      const taskStart = new Date(Math.min(...taskGroup.map((x) => msDate(x.start))));
      const taskFinish = new Date(Math.max(...taskGroup.map((x) => msDate(x.finish))));
      const leaf: TreeNode = {
        id: `task::${taskGroupKey(t)}`,
        label: t.name,
        depth: 4,
        start: taskStart,
        finish: taskFinish,
        durationDays: Math.round((msDate(taskFinish) - msDate(taskStart)) / MS_DAY),
        tasks: taskGroup,
        children: [],
        collapsed: false,
      };
      parent.children.push(leaf);

    }

    const calcDur = (n: TreeNode) => {
      for (const c of n.children) calcDur(c);
      if (n.children.length > 0 && n.tasks.length === 0) {
        n.start = new Date(Math.min(...n.children.map((c) => msDate(c.start))));
        n.finish = new Date(Math.max(...n.children.map((c) => msDate(c.finish))));
        n.durationDays = Math.round((msDate(n.finish) - msDate(n.start)) / MS_DAY);
      }
    };
    calcDur(root);

    return root.children;
  }

  // ── renderização ────────────────────────────────────────────────

  private flatten(nodes: TreeNode[], includeCollapsed=false): TreeNode[] {
    const out: TreeNode[] = [];
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        out.push(n);
        if ((includeCollapsed||!n.collapsed) && n.children.length > 0) walk(n.children);
      }
    };
    walk(nodes);
    return out;
  }

  private _renderView() {
    const { _container: container, _tasks: tasks } = this;
    const previousScroll=container.querySelector('.gantt-body')?.scrollTop??0;
    container.innerHTML = "";
    if(this.mode!=='planner')container.appendChild(this.toolbar());

    if (tasks.length === 0) {
      const msg = document.createElement("p");
      msg.className = "empty";
      msg.textContent = "Nenhum elemento com cronograma encontrado.";
      container.appendChild(msg);
      return;
    }

    this._flat = this.flatten(this._tree);

    if(this.mode==='planner' && this._hooks.project){
      const host=document.createElement('div');container.append(host);this.board.render(host,this._hooks.project(),tasks,{hierarchy:()=>{this.mode='gantt';this._renderView();},select:tasks=>{this.pause();this.selection=tasks;this.scope=tasks.length?'selection':'all';this.dates=simulationDates(this.scopeTasks());this.index=Math.max(0,this.dates.length-1);this.updateDomain();this.syncControls();this._hooks.onSelect(tasks);},inspect:(r,activate)=>this._hooks.inspect?.(r,activate)});
    } else if (this.mode === "gantt") {
      const body = document.createElement("div");
      body.className = "gantt-body";
      body.append(this.combinedPanel());
      container.appendChild(body);
      body.scrollTop=previousScroll;
    } else {
      container.appendChild(this.fullTable(tasks));
    }
    container.appendChild(this.playback());
  }

  private x(t: number): number {
    const span = this.domainEnd - this.domainStart || 1;
    return ((t - this.domainStart) / span) * 100;
  }

  /** Toggle: se já está selecionado, desmarca. Senão, seleciona. */
  private selectNode(n: TreeNode | null) {
    this.pause();
    if (n && this._selected === n) {
      this._selected = null;
      this.selection=[];
      this._hooks.onSelect([]);
    } else {
      this._selected = n;
      this.selection=n?collectAllTasks(n):[];
      if (n) this._hooks.onSelect(this.selection);
    }
    this.scope=this.selection.length?'selection':'all';this.dates=simulationDates(this.scopeTasks());this.index=Math.max(0,this.dates.length-1);this.updateDomain();
  }

  // ── toolbar (toggle + export) ───────────────────────────────────

  private toolbar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "gantt-toolbar";

    const toggle = document.createElement("button");
    toggle.className = "gantt-btn gantt-toggle";
    toggle.textContent = this.mode === "planner" ? "Hierarquia IFC" : this.mode === "gantt" ? "Tabela IFC" : "Planejamento integrado";
    toggle.title = "Alternar visualização";
    toggle.addEventListener("click", () => {
      this.mode = this.mode === "planner" ? "gantt" : this.mode === "gantt" ? "table" : this._hooks.project?"planner":"gantt";
      this._renderView();
    });

    const exportBtn = document.createElement("button");
    exportBtn.className = "gantt-btn";
    exportBtn.textContent = "⬇ CSV";
    exportBtn.title = "Exportar tabela para CSV";
    exportBtn.addEventListener("click", () => this.exportCSV());

    bar.appendChild(toggle);
    bar.appendChild(exportBtn);
    const search=document.createElement('input');search.type='search';search.className='gantt-search';search.placeholder='Buscar atividade ou pavimento';search.setAttribute('aria-label','Buscar atividade no 4D');search.value=this.filter;search.oninput=()=>{this.filter=search.value.toLocaleLowerCase('pt-BR');for(const row of this._container.querySelectorAll<HTMLElement>('[data-activity-search]'))row.hidden=!!this.filter&&!row.dataset.activitySearch?.includes(this.filter);};if(this.mode!=='planner')bar.append(search);
    const quantity=document.createElement('span');quantity.className='gantt-selection-summary';
    const summary=summarizeVolumes(this.selection);
    quantity.textContent=summary.count?`${summary.count} elementos · ${summary.totalM3===null?`${summary.measured}/${summary.count} com volume`:summary.totalM3.toLocaleString('pt-BR',{maximumFractionDigits:3})+' m³'}`:'Selecione uma atividade';
    quantity.title=summary.source;bar.append(quantity);
    return bar;
  }

  // ── export CSV ──────────────────────────────────────────────────

  private exportCSV() {
    const rows = [["#", "Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4", "Pavimento", "Tarefa", "Início", "Término", "Dias", "Volume IFC (m³)"]];
    const byTaskName = groupTasks(this._tasks);
    const sorted = [...byTaskName.values()]
      .map((ts) => ts[0])
      .sort((a, b) => msDate(a.start) - msDate(b.start));
    sorted.forEach((t, i) => {
      rows.push([
        String(i + 1), t.summary1 || "—", t.summary2 || "—", t.summary3 || "—", t.summary4 || "—",
        t.storey || "—",
        t.name, fmt(t.start), fmt(t.finish), `${t.durationDays}`,this.volumeLabel(byTaskName.get(taskGroupKey(t))??[t]),
      ]);
    });
    const csv = rows.map((r) => r.map(csvCell).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob('cronograma.csv',blob);
  }

  // ── painel combinado (info + barras) ──────────────────────────

  private combinedPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "gantt-combined";

    const monthsRow = document.createElement("div");
    monthsRow.className = "gantt-combined-months";
    const monthsInfo = document.createElement("div");
    monthsInfo.className = "gantt-combined-months-info";
    monthsInfo.textContent = "Tarefa";
    const monthsBars = document.createElement("div");
    monthsBars.className = "gantt-combined-months-bars";

    const ticks = this.domainEnd-this.domainStart<=62*MS_DAY
      ? Array.from({length:Math.floor((this.domainEnd-this.domainStart)/MS_DAY)+1},(_,i)=>{const d=new Date(this.domainStart+i*MS_DAY);return {label:fmt(d),x:this.x(+d),year:d.getFullYear(),initial:String(d.getDate())};}).filter((_,i)=>i%Math.max(1,Math.ceil((this.domainEnd-this.domainStart)/MS_DAY/12))===0)
      : monthTicks(new Date(this.domainStart), new Date(this.domainEnd));

    const yearsRow = document.createElement("div");
    yearsRow.className = "gantt-years-row";
    let lastYear = 0;
    for (const tick of ticks) {
      if (tick.year !== lastYear) {
        const y = document.createElement("span");
        y.className = "gantt-year-label";
        y.style.left = `${tick.x}%`;
        y.textContent = String(tick.year);
        yearsRow.appendChild(y);
        lastYear = tick.year;
      }
    }

    const initialsRow = document.createElement("div");
    initialsRow.className = "gantt-initials-row";
    for (const tick of ticks) {
      const m = document.createElement("span");
      m.className = "gantt-month-initial";
      m.style.left = `${tick.x}%`;
      m.textContent = tick.initial;
      initialsRow.appendChild(m);
    }

    monthsBars.append(yearsRow, initialsRow);
    monthsRow.append(monthsInfo, monthsBars);
    panel.appendChild(monthsRow);

    this._flat.forEach((n) => {
      const row = document.createElement("div");
      row.className = `gantt-combined-row gantt-depth-${Math.min(n.depth, 4)}`;
      const isLeaf = n.tasks.length > 0 && n.children.length === 0;
      if (isLeaf) row.classList.add("gantt-leaf");
      if (n === this._selected) row.classList.add("gantt-selected");

      const info = document.createElement("div");
      info.className = "gantt-combined-info";
      const indent = n.depth >= 0 ? (n.depth + 1) * 14 : 0;
      const allTasks = collectAllTasks(n);
      const elemCount = new Set(allTasks.map((x) => JSON.stringify([x.modelKey,x.globalId ?? x.localId]))).size;

      const hasChildren = n.children.length > 0;
      if (hasChildren) {
        const caret = document.createElement("span");
        caret.className = "gantt-caret";
        caret.textContent = n.collapsed ? "▸" : "▾";
        caret.style.cursor = "pointer";
        caret.style.marginRight = "4px";
        caret.style.color = "#9ca3af";
        caret.addEventListener("click", (e) => {
          e.stopPropagation();
          n.collapsed = !n.collapsed;
          this._flat = this.flatten(this._tree);
          this._renderView();
        });
        info.appendChild(caret);
      } else {
        const spacer = document.createElement("span");
        spacer.style.display = "inline-block";
        spacer.style.width = "18px";
        info.appendChild(spacer);
      }

      const labelSpan = document.createElement("span");
      labelSpan.textContent = n.label;
      labelSpan.style.overflow = "hidden";
      labelSpan.style.textOverflow = "ellipsis";
      labelSpan.style.whiteSpace = "nowrap";
      labelSpan.title = `${n.label}\n${elemCount} elementos · Volume IFC: ${this.volumeLabel(allTasks)} m³`;
      info.appendChild(labelSpan);

      const datesSpan = document.createElement("span");
      datesSpan.className = "gantt-combined-dates";
      datesSpan.textContent = `${fmt(n.start)} → ${fmt(n.finish)} (${n.durationDays}d)`;
      info.appendChild(datesSpan);

      info.style.paddingLeft = `${indent}px`;
      row.appendChild(info);

      const bars = document.createElement("div");
      bars.className = "gantt-combined-bars";
      const bar = document.createElement("div");
      bar.className = "gantt-bar";
      bar.style.left = `${this.x(msDate(n.start))}%`;
      bar.style.width = `${Math.max(0.5, this.x(msDate(n.finish)) - this.x(msDate(n.start)))}%`;

      const isSummary = n.tasks.length === 0 && n.children.length > 0;
      bar.title = `${n.label}\n${fmt(n.start)} → ${fmt(n.finish)} (${n.durationDays}d)`;

      if (isSummary) {
        const wrap = document.createElement("div");
        wrap.className = "gantt-bar-summary-wrap";
        wrap.style.left = bar.style.left;
        wrap.style.width = bar.style.width;
        wrap.title = bar.title;
        const line = document.createElement("div");
        line.className = "gantt-bar-summary-line";
        const triStart = document.createElement("div");
        triStart.className = "gantt-bar-summary-tri gantt-bar-summary-tri-start";
        const triEnd = document.createElement("div");
        triEnd.className = "gantt-bar-summary-tri gantt-bar-summary-tri-end";
        wrap.appendChild(line);
        wrap.appendChild(triStart);
        wrap.appendChild(triEnd);
        bars.appendChild(wrap);
      } else {
        bar.style.background = TASK_BAR_COLOR;
        bars.appendChild(bar);
      }
      row.appendChild(bars);

      row.style.cursor = "pointer";
      row.dataset.activitySearch=n.label.toLocaleLowerCase('pt-BR');row.hidden=!!this.filter&&!row.dataset.activitySearch.includes(this.filter);
      row.setAttribute('role','button');row.tabIndex=0;row.setAttribute('aria-label',n.label);
      row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectNode(n);this._renderView();}});
      row.addEventListener("click", () => {
        this.selectNode(n);
        this._renderView();
      });
      panel.appendChild(row);
    });

    const today = this.dates[this.index];
    if (today!==undefined&&today >= this.domainStart && today <= this.domainEnd) {
      const line = document.createElement("div");
      line.className = "gantt-today-combined simulation-cursor";
      line.style.left = `calc(50% + ${this.x(today)/2}%)`;
      panel.appendChild(line);
    }

    return panel;
  }

  // ── tabela completa (modo tabela) ───────────────────────────────

  private fullTable(tasks: ElementTask[]): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "gantt-full-table";
    const cols = ["#", "Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4", "Pavimento", "Tarefa", "Início", "Término", "Dias", "Volume IFC (m³)"];
    const header = document.createElement("div");
    header.className = "gantt-tr gantt-th";
    for (const c of cols) {
      const cell = document.createElement("span");
      cell.textContent = c;
      header.appendChild(cell);
    }
    wrap.appendChild(header);

    const byTaskName = groupTasks(tasks);
    const groups = [...byTaskName.values()]
      .map((ts) => ts[0])
      .sort((a, b) => msDate(a.start) - msDate(b.start));

    const nodes=new Map(this.flatten(this._tree,true).map(n=>[n.id,n]));
    let selectedIdx = groups.findIndex(t=>this._selected?.id===`task::${taskGroupKey(t)}`);
    groups.forEach((t, i) => {
      const tr = document.createElement("div");
      tr.className = "gantt-tr";
      tr.classList.toggle('gantt-table-selected',i===selectedIdx);
      tr.dataset.activitySearch=[t.name,t.summary1,t.summary2,t.summary3,t.summary4].join(' ').toLocaleLowerCase('pt-BR');tr.hidden=!!this.filter&&!tr.dataset.activitySearch.includes(this.filter);
      tr.style.cursor = "pointer";
      const cells = [
        String(i + 1), t.summary1 || "—", t.summary2 || "—", t.summary3 || "—", t.summary4 || "—",
        t.storey || "—",
        t.name, fmt(t.start), fmt(t.finish), `${t.durationDays}d`,this.volumeLabel(byTaskName.get(taskGroupKey(t))??[t]),
      ];
      for (const c of cells) {
        const cell = document.createElement("span");
        cell.textContent = c;
        cell.title = c;
        tr.appendChild(cell);
      }
      tr.addEventListener("click", () => {
        this.selectNode(nodes.get(`task::${taskGroupKey(t)}`)??null);
        selectedIdx=this._selected?i:-1;this.syncControls();
        wrap.querySelectorAll(".gantt-tr").forEach((r, ri) => {
          r.classList.toggle("gantt-table-selected", ri === selectedIdx + 1 && selectedIdx >= 0);
        });
      });
      wrap.appendChild(tr);
    });
    return wrap;
  }

  // ── scrubber 4D ─────────────────────────────────────────────────

  private volumeLabel(tasks:ElementTask[]){const q=summarizeVolumes(tasks);return q.totalM3===null?`A conferir (${q.measured}/${q.count})`:q.totalM3.toLocaleString('pt-BR',{maximumFractionDigits:3});}
  private scopeTasks(){return this.scope==='selection'&&this.selection.length?this.selection:this._tasks;}
  private updateDomain(){if(this.dates.length){this.domainStart=this.dates[0];this.domainEnd=this.dates.at(-1)!;}}
  pause(){this.playing=false;this.run++;if(this.timer)clearTimeout(this.timer);this.timer=undefined;this.syncControls();}
  /** Viewport/tree selection also defines the available playback selection. */
  setSelection(tasks:ElementTask[]){
    this.pause();this.selection=[...tasks];this._selected=null;this.board.setSelection(tasks);
    this.scope=tasks.length?'selection':'all';this.dates=simulationDates(this.scopeTasks());
    this.index=Math.max(0,this.dates.length-1);this.updateDomain();
    if(this._container)this._renderView();
  }
  private async applyFrame(){
    const tasks=this.scopeTasks(),at=this.dates[this.index];if(at===undefined)return;
    const {visible,active}=simulationFrame(tasks,at),keys=new Set(visible.map(t=>JSON.stringify([t.modelKey,t.globalId??t.localId])));
    const hidden=simulationFrame(this._tasks,Number.NEGATIVE_INFINITY).hidden.filter(t=>!keys.has(JSON.stringify([t.modelKey,t.globalId??t.localId])));
    const hooks=this._hooks,run=this.run;
    this.syncControls();this.frameQueue=this.frameQueue.catch(()=>{}).then(()=>run===this.run?hooks.onScrub(new Date(at),visible,hidden,active):undefined);
    try{await this.frameQueue;}catch{this.pause();}
  }
  private async play(){
    if(this.playing){this.pause();return;}if(!this.dates.length)return;
    if(this.index>=this.dates.length-1)this.index=0;
    this.playing=true;const run=++this.run;this.syncControls();await this.applyFrame();
    const next=async()=>{if(!this.playing||run!==this.run)return;if(this.index>=this.dates.length-1){this.pause();return;}this.index++;await this.applyFrame();if(this.playing&&run===this.run)this.timer=setTimeout(()=>void next(),this.speed);};
    if(this.playing&&run===this.run)this.timer=setTimeout(()=>void next(),this.speed);
  }
  private syncControls(){
    const summary=this._container?.querySelector<HTMLElement>('.gantt-selection-summary'),q=summarizeVolumes(this.selection);
    if(summary){summary.textContent=q.count?`${q.count} elementos · ${q.totalM3===null?`${q.measured}/${q.count} com volume`:q.totalM3.toLocaleString('pt-BR',{maximumFractionDigits:3})+' m³'}`:'Selecione uma atividade';summary.title=q.source;}
    const root=this.controls;if(!root)return;const range=root.querySelector<HTMLInputElement>('input'),date=root.querySelector('.gantt-date'),play=root.querySelector<HTMLButtonElement>('.play'),scope=root.querySelector<HTMLSelectElement>('[aria-label="Escopo da simulação"]');
    if(range){range.max=String(Math.max(0,this.dates.length-1));range.value=String(this.index);}if(date)date.textContent=this.dates[this.index]===undefined?'Sem datas':fmt(new Date(this.dates[this.index]));
    if(play){play.textContent=this.playing?'❚❚':'▶';play.setAttribute('aria-label',this.playing?'Pausar simulação':'Reproduzir simulação');play.title=this.playing?'Pausar':'Reproduzir';}
    if(scope){scope.value=this.scope;const option=scope.querySelector<HTMLOptionElement>('option[value=selection]');if(option)option.disabled=!this.selection.length;}
    const cursor=this._container?.querySelector<HTMLElement>('.simulation-cursor');if(cursor&&this.dates[this.index]!==undefined)cursor.style.left=`calc(50% + ${this.x(this.dates[this.index])/2}%)`;
  }
  private playback(){
    const wrap=document.createElement('div');wrap.className='gantt-playback';this.controls=wrap;
    const buttons=document.createElement('div');buttons.className='playback-buttons';
    const control=(name:string,symbol:string,fn:()=>void,cls='')=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',name);b.title=name;b.textContent=symbol;b.className=cls;b.onclick=fn;buttons.append(b);};
    control('Voltar ao início','↤',()=>{this.pause();this.index=0;void this.applyFrame();});
    control('Etapa anterior','‹',()=>{this.pause();this.index=Math.max(0,this.index-1);void this.applyFrame();});
    control('Reproduzir simulação','▶',()=>void this.play(),'play');
    control('Próxima etapa','›',()=>{this.pause();this.index=Math.min(this.dates.length-1,this.index+1);void this.applyFrame();});
    const opts=document.createElement('div');opts.className='playback-controls';const date=document.createElement('span');date.className='gantt-date';date.setAttribute('aria-label','Data da simulação');
    const scope=document.createElement('select');scope.setAttribute('aria-label','Escopo da simulação');for(const [value,label]of [['all','Modelo inteiro'],['selection','Seleção']]){const o=document.createElement('option');o.value=value;o.textContent=label;o.disabled=value==='selection'&&!this.selection.length;scope.append(o);}scope.value=this.scope;scope.onchange=()=>{const value=scope.value;this.pause();this.scope=value;this.dates=simulationDates(this.scopeTasks());this.index=0;this.updateDomain();this._renderView();void this.applyFrame();};
    const speed=document.createElement('select');speed.setAttribute('aria-label','Velocidade da simulação');for(const [value,label]of [[1600,'Lenta'],[850,'Normal'],[300,'Rápida']] as const){const o=document.createElement('option');o.value=String(value);o.textContent=label;speed.append(o);}speed.value=String(this.speed);speed.onchange=()=>{this.speed=Number(speed.value);};
    opts.append(date,scope,speed);const range=document.createElement('input');range.type='range';range.className='playback-range';range.min='0';range.step='1';range.setAttribute('aria-label','Data do planejamento 4D');range.oninput=()=>{const value=Number(range.value);this.pause();this.index=value;void this.applyFrame();};
    wrap.append(buttons,opts,range);this.syncControls();return wrap;
  }
}
