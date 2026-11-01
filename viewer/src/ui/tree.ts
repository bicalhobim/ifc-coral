import type { SpatialTreeItem } from "@thatopen/fragments";

import {descendantIds,rangeIds} from './tree-selection.ts';
const rowIds=new WeakMap<HTMLElement,number[]>();

export interface TreeHooks {
  onSelect: (localId: number, event: MouseEvent) => void;
  onSelectGroup?: (ids:number[],event:MouseEvent,range:boolean)=>void;
  onContextMenu?: (event:MouseEvent)=>void;
  labelMap?: Map<number, string>;
}

/** Fragments alterna contêineres de categoria com instâncias sem category.
 * A instância tem localId real e precisa herdar a categoria, não desaparecer. */
export function materializeSpatial(item:SpatialTreeItem,inherited:string|null=null):SpatialTreeItem[]{
 const category=item.category??inherited;
 const children=(item.children??[]).flatMap(child=>materializeSpatial(child,category));
 if(item.localId==null)return children;
 return [{localId:item.localId,category,children}];
}

/** Rótulo de um nó: labelMap override, categoria IFC "humanizada", ou #id. */
export function spatialLabel(item: SpatialTreeItem, labelMap?: Map<number, string>): string {
  if (item.localId != null && labelMap?.has(item.localId)) return labelMap.get(item.localId)!;
  if (item.category) return humanize(item.category);
  if (item.localId != null) return `#${item.localId}`;
  return "(sem nome)";
}

// Palavras compostas sem separador que a heurística genérica (só 1ª letra) erra.
// ponytail: tabela cobre só as categorias espaciais comuns; categoria composta
// desconhecida cai no fallback de 1ª-letra-maiúscula (cosmético, não quebra nada).
const KNOWN_COMPOUNDS: Record<string, string> = {
  buildingstorey: "BuildingStorey",
};

// "IFCBUILDINGSTOREY" → "IfcBuildingStorey", "IFCWALL" → "IfcWall" (só cosmético).
function humanize(cat: string): string {
  const low = cat.toLowerCase();
  if (!low.startsWith("ifc")) return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  const rest = low.slice(3);
  return "Ifc" + (KNOWN_COMPOUNDS[rest] ?? rest.replace(/^./, (c) => c.toUpperCase()));
}

/**
 * Nós sem `category` são wrappers de agregação. `IFCBUILDING` é pulado para
 * mostrar IfcSite ▸ IfcBuildingStorey direto (padrão BIM).
 */
const SKIP_CATEGORIES = new Set(["IFCBUILDING"]);

export function flatten(item: SpatialTreeItem): SpatialTreeItem[] {
  const kids = (item.children ?? []).flatMap(flatten);
  if (item.category == null || SKIP_CATEGORIES.has(item.category)) return kids;
  return [{ ...item, children: kids }];
}

/** Renderiza a árvore espacial com o arquivo como raiz. */
export function renderTree(
  container: HTMLElement,
  filename: string,
  root: SpatialTreeItem,
  hooks: TreeHooks,
): void {
  container.innerHTML = "";
  let anchor:number|undefined;
  let sequence=0;
  const bind=(row:HTMLElement,ids:number[])=>{
   const key=sequence++;row.dataset.treeKey=String(key);rowIds.set(row,ids);row.tabIndex=0;
   row.setAttribute('role','treeitem');row.setAttribute('aria-selected','false');
   row.title=ids.length>1?`${ids.length} elementos · Ctrl adiciona/remove · Shift seleciona intervalo`:'Ctrl adiciona/remove · Shift seleciona intervalo';
   const choose=(e:MouseEvent)=>{
    e.stopPropagation();const rows=[...container.querySelectorAll<HTMLElement>('.tree-node')].filter(r=>!r.closest('[hidden]')).map(r=>({key:Number(r.dataset.treeKey),ids:rowIds.get(r)??[]}));
    const selected=e.shiftKey?rangeIds(rows,anchor,key):ids;
    if(hooks.onSelectGroup)hooks.onSelectGroup(selected,e,e.shiftKey);else if(ids.length)hooks.onSelect(ids[0],e);
    if(!e.shiftKey)anchor=key;
   };
   row.addEventListener('click',choose);
   row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(new MouseEvent('click',{ctrlKey:e.ctrlKey,metaKey:e.metaKey,shiftKey:e.shiftKey}));}});
  };

  // Root node: filename with caret
  const wrap = document.createElement("div");
  const row = document.createElement("div");
  row.className = "tree-node tree-root";
  const caret = document.createElement("span");
  caret.className = "tree-caret";
  caret.textContent = "▾";
  const label = document.createElement("span");
  label.textContent = filename;
  row.append(caret, label);
  bind(row,descendantIds(root));
  if(hooks.onContextMenu){
    row.addEventListener('contextmenu',e=>{e.preventDefault();hooks.onContextMenu!(e);});
    const options=document.createElement('button');options.type='button';options.textContent='⋯';options.className='tree-file-options';options.setAttribute('aria-label',`Opções do modelo ${filename}`);
    options.onclick=e=>{e.stopPropagation();hooks.onContextMenu!(e);};row.append(options);
  }
  wrap.appendChild(row);

  const childBox = document.createElement("div");
  childBox.className = "tree-children";
  for (const item of flatten(root)) childBox.appendChild(node(item, hooks,bind));
  wrap.appendChild(childBox);

  caret.addEventListener("click", (e) => {
    e.stopPropagation();
    const hidden = childBox.hidden;
    childBox.hidden = !hidden;
    caret.textContent = hidden ? "▾" : "▸";
  });

  container.appendChild(wrap);
}

function node(item: SpatialTreeItem, hooks: TreeHooks,bind:(row:HTMLElement,ids:number[])=>void): HTMLElement {
  const wrap = document.createElement("div");
  const row = document.createElement("div");
  row.className = "tree-node";
  const kids = item.children ?? [];
  const initiallyClosed=kids.length>0&&item.category?.toUpperCase()==='IFCBUILDINGSTOREY';

  const caret = document.createElement("span");
  caret.className = "tree-caret";
  caret.textContent = kids.length ? (initiallyClosed?'▸':'▾') : "";
  const label = document.createElement("span");
  label.textContent = spatialLabel(item, hooks.labelMap);
  row.append(caret, label);

  if (item.localId != null) {
    row.dataset.localId = String(item.localId);
    bind(row,descendantIds(item));
  }
  wrap.appendChild(row);

  if (kids.length) {
    const childBox = document.createElement("div");
    childBox.className = "tree-children";
    childBox.hidden=initiallyClosed;
    for (const c of kids) childBox.appendChild(node(c, hooks,bind));
    caret.addEventListener("click", (e) => {
      e.stopPropagation();
      const hidden = childBox.hidden;
      childBox.hidden = !hidden;
      caret.textContent = hidden ? "▾" : "▸";
    });
    wrap.appendChild(childBox);
  }
  return wrap;
}

/** Seleciona um nó da árvore por localId (para sync viewport → tree). */
export function selectNodeById(container: HTMLElement, localId: number): void {
  selectNodesByIds(container,[localId],localId);
}

/** Synchronize all selected rows; expand/scroll only the last selected object. */
export function selectNodesByIds(container:HTMLElement,localIds:readonly number[],focusId?:number):void {
  const ids=new Set(localIds);
  for(const row of container.querySelectorAll<HTMLElement>('.tree-node')){
    const targets=rowIds.get(row)??[];const count=targets.filter(id=>ids.has(id)).length;
    const selected=targets.length>0&&count===targets.length;
    row.classList.toggle('partial',count>0&&!selected);
    row.classList.toggle('selected',selected);
    row.setAttribute('aria-selected',String(selected));
  }
  if(focusId===undefined||!ids.has(focusId))return;
  const row = container.querySelector<HTMLElement>(`.tree-node[data-local-id="${focusId}"]`);
  if (!row) return;
  let parent:HTMLElement|null=row.parentElement;
  while(parent&&parent!==container){if(parent.classList.contains('tree-children')){parent.hidden=false;const caret=parent.previousElementSibling?.querySelector('.tree-caret');if(caret)caret.textContent='▾';}parent=parent.parentElement;}
  row.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
