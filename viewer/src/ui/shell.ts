import {mountWindows} from './windows.ts';
export type ViewerPanel='model'|'properties'|'timeline'|'quantification'|'production'|'packages'|'macro'|'supplies'|'catalogues'|'restrictions'|'activity';
export interface ShellHandles {
 viewportEl:HTMLElement;ganttEl:HTMLElement;treeEl:HTMLElement;propsEl:HTMLElement;quantEl:HTMLElement;fileInput:HTMLInputElement;
 fitButton:HTMLButtonElement;allButton:HTMLButtonElement;viewButtons:Record<string,HTMLButtonElement>;
 multiSelectButton:HTMLButtonElement;clearSelectionButton:HTMLButtonElement;selectionCountEl:HTMLElement;
 setPanel:(name:ViewerPanel,open:boolean)=>void;
 focusPanel:(name:ViewerPanel)=>void;
 isPanelOpen:(name:ViewerPanel)=>boolean;
 addPanel:(name:ViewerPanel,title:string,content:HTMLElement,place?:'left'|'right'|'bottom'|'float')=>void;
}
const icons={model:'<path d="M4 3h6v6H4zM14 15h6v6h-6zM4 15h6v6H4zM7 9v3h10v3M7 12v3"/>',properties:'<path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h3"/>',timeline:'<path d="M4 4v16h17M7 7h8M10 11h10M7 15h5"/>',fit:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5M8 8h8v8H8z"/>',all:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',cube:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>'};
function node(tag:string,cls:string){const n=document.createElement(tag);n.className=cls;return n;}
function tool(label:string,icon:string,fn:()=>void){const b=document.createElement('button');b.type='button';b.className='viewer-tool';b.title=label;b.setAttribute('aria-label',label);b.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>`;b.onclick=fn;return b;}
/** Painéis encaixados reservam espaço. O canvas nunca fica por baixo deles. */
export function buildShell(root:HTMLElement,onPanelChange?:(name:ViewerPanel,open:boolean)=>void):ShellHandles{
 root.replaceChildren();root.classList.add('shell');
 const toolbar=node('div','viewer-toolbar');toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Ferramentas do visualizador');
 const viewportEl=node('div','viewport'),dock=node('div','model-dock');
 const treeEl=node('div','tree'),propsEl=node('div','props'),ganttEl=node('section','gantt');
 const fileInput=document.createElement('input');Object.assign(fileInput,{type:'file',accept:'.ifc',multiple:true,hidden:true});
 const panes={} as Record<ViewerPanel,HTMLElement>,buttons={} as Record<ViewerPanel,HTMLButtonElement>;
 let windows:ReturnType<typeof mountWindows>;
 const setPanel=(name:ViewerPanel,open:boolean)=>windows.setPanel(name,open);
 const panel=(name:ViewerPanel,title:string,cls:string)=>{
  const p=node('aside',`panel ${cls}`);p.hidden=true;p.id=`viewer-${name}`;p.setAttribute('aria-label',title);
  const head=node('div','panel-head'),label=node('span','panel-title');label.textContent=title;
  const close=tool(`Fechar ${title.toLowerCase()}`,'<path d="m6 6 12 12M18 6 6 18"/>',()=>setPanel(name,false));close.classList.add('panel-min');head.append(label,close);
  const body=node('div','panel-body');p.append(head,body);panes[name]=p;return {p,body};
 };
 const left=panel('model','Modelo IFC','panel-left'),right=panel('properties','Propriedades','panel-right'),bottom=panel('timeline','Planejamento 4D','panel-bottom'),quant=panel('quantification','Quantificação','panel-quant');
 const search=document.createElement('input');search.className='tree-search';search.placeholder='Buscar no modelo…';search.setAttribute('aria-label','Buscar no modelo');
 treeEl.textContent='Abra um IFC para explorar a estrutura.';propsEl.textContent='Selecione um elemento ou atividade.';left.body.append(search,treeEl);right.body.append(propsEl);bottom.body.append(ganttEl);dock.append(left.p,right.p,quant.p);dock.hidden=true;
 for(const [name,label,icon]of [['model','Modelo IFC',icons.model],['properties','Propriedades',icons.properties],['timeline','Planejamento 4D',icons.timeline]] as const){buttons[name]=tool(label,icon,()=>setPanel(name,panes[name].hidden));buttons[name].setAttribute('aria-pressed','false');buttons[name].setAttribute('aria-controls',panes[name].id);toolbar.append(buttons[name]);}
 buttons.quantification=tool('Quantificação','<path d="M5 3h14v18H5zM8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/>',()=>setPanel('quantification',panes.quantification.hidden));buttons.quantification.setAttribute('aria-pressed','false');toolbar.append(buttons.quantification);
 const separator=node('span','viewer-separator');toolbar.append(separator);
 const fitButton=tool('Enquadrar modelo',icons.fit,()=>{}),allButton=tool('Mostrar modelo completo',icons.all,()=>{});toolbar.append(fitButton,allButton);
 const multiSelectButton=tool('Seleção múltipla','<rect x="3" y="3" width="12" height="12" rx="2"/><path d="M9 18v3h12V9h-3M8 9h4M10 7v4"/>',()=>{});
 multiSelectButton.setAttribute('aria-pressed','false');multiSelectButton.title='Seleção múltipla: adicionar/remover objetos por clique. Atalho: Ctrl, Shift ou ⌘ + clique.';
 const clearSelectionButton=tool('Limpar seleção','<path d="m8 8 8 8M16 8l-8 8"/>',()=>{});clearSelectionButton.title='Limpar seleção (Esc)';clearSelectionButton.disabled=true;
 const selectionCountEl=node('span','viewer-selection-count');selectionCountEl.textContent='0 selecionados';selectionCountEl.setAttribute('aria-live','polite');selectionCountEl.setAttribute('role','status');
 toolbar.append(multiSelectButton,clearSelectionButton,selectionCountEl);
 const hint=node('span','viewer-toolbar-hint');hint.textContent='Ctrl: adicionar · Shift: intervalo na árvore';toolbar.append(hint);
 const views=node('div','viewer-views');views.setAttribute('role','group');views.setAttribute('aria-label','Orientação do modelo');
 const viewButtons:Record<string,HTMLButtonElement>={};for(const [key,label]of [['iso','Vista isométrica'],['top','Vista superior'],['front','Vista frontal'],['side','Vista lateral']]){const b=document.createElement('button');b.type='button';b.className='view-direction';b.textContent=key==='iso'?'3D':key==='top'?'Topo':key==='front'?'Frente':'Lado';b.setAttribute('aria-label',label);b.title=label;viewButtons[key]=b;views.append(b);}
 const overlay=node('div','simulation-overlay');overlay.hidden=true;overlay.setAttribute('aria-label','Estado da simulação');viewportEl.append(views,overlay);
 root.append(toolbar,fileInput);windows=mountWindows(root,viewportEl,panes,buttons,onPanelChange);

 const addPanel:ShellHandles['addPanel']=(name,title,content,place='right')=>{const item=panel(name,title,'panel-extra');item.body.append(content);buttons[name]=tool(title,icons.properties,()=>setPanel(name,panes[name].hidden));windows.register(name,item.p,buttons[name],place);};
 return {focusPanel:windows.focusPanel,addPanel,viewportEl,ganttEl,treeEl,propsEl,quantEl:quant.body,fileInput,fitButton,allButton,viewButtons,multiSelectButton,clearSelectionButton,selectionCountEl,setPanel,isPanelOpen:windows.isPanelOpen};
}
