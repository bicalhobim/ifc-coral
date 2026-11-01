import type {ViewerPanel} from './shell.ts';
import {fitWindow,dockWidths,type WindowRect} from './window-layout.ts';
type Place='left'|'right'|'bottom'|'float';
type State={open:boolean;pinned:boolean;place:Place;rect:WindowRect;weight:number};
const names:ViewerPanel[]=['model','properties','quantification','timeline'];
/** Layout only. Project content and credentials are never stored here. */
export function mountWindows(root:HTMLElement,viewport:HTMLElement,panes:Record<ViewerPanel,HTMLElement>,buttons:Record<ViewerPanel,HTMLButtonElement>,notify?:(name:ViewerPanel,open:boolean)=>void){
 const workspace=document.createElement('div');workspace.className='viewer-workspace';
 const left=document.createElement('div'),right=document.createElement('div'),bottom=document.createElement('div'),float=document.createElement('div'),rail=document.createElement('div');
 left.className='window-dock window-dock-left';right.className='window-dock window-dock-right';bottom.className='window-dock window-dock-bottom';float.className='window-floats';rail.className='window-rail';rail.setAttribute('aria-label','Janelas recolhidas');
 workspace.append(left,viewport,right,bottom,float,rail);root.append(workspace);root.classList.add('window-shell');
 let widths={left:240,right:300},bottomHeight=260,z=20,peek:ViewerPanel|undefined;
 const state={} as Record<ViewerPanel,State>,pinButtons={} as Record<ViewerPanel,HTMLButtonElement>,places={} as Record<ViewerPanel,HTMLSelectElement>;
 const defaults=()=>{for(const [i,name]of names.entries())state[name]={open:false,pinned:true,weight:1,place:name==='model'?'left':name==='timeline'?'bottom':'right',rect:{x:30+i*22,y:25+i*18,width:name==='timeline'?620:340,height:360}};};defaults();
 try{const saved=JSON.parse(localStorage.getItem('coral.window-layout.v1')??'null');if(saved&&typeof saved==='object')for(const name of names){const s=saved[name];if(s&&['left','right','bottom','float'].includes(s.place)&&typeof s.pinned==='boolean'&&s.rect&&['x','y','width','height'].every(k=>Number.isFinite(s.rect[k])))state[name]={...state[name],place:s.place,pinned:s.pinned,rect:s.rect,weight:Number.isFinite(s.weight)&&s.weight>0&&s.weight<100?s.weight:1};}}catch{/* Ignore damaged layout preferences. */}
 const persist=()=>{try{localStorage.setItem('coral.window-layout.v1',JSON.stringify(state));}catch{/* Layout still works with storage disabled. */}};
 const button=(label:string,text:string,action:()=>void)=>{const b=document.createElement('button');b.type='button';b.className='window-control';b.title=label;b.setAttribute('aria-label',label);b.textContent=text;b.onclick=action;return b;};
 const styleRect=(p:HTMLElement,r:WindowRect)=>Object.assign(p.style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.width}px`,height:`${r.height}px`});
 function render(){
  rail.replaceChildren();
  for(const name of names){
   const s=state[name],p=panes[name],floating=s.place==='float'||!s.pinned;
   const host=floating?float:s.place==='left'?left:s.place==='right'?right:bottom;
   if(p.parentElement!==host)host.append(p);
   p.classList.toggle('window-floating',floating);p.classList.toggle('window-docked',!floating);p.dataset.place=s.place;
   p.hidden=!s.open||(!s.pinned&&peek!==name);buttons[name].setAttribute('aria-pressed',String(s.open));
   places[name].value=s.place;pinButtons[name].setAttribute('aria-pressed',String(s.pinned));pinButtons[name].textContent=s.pinned?'◆':'◇';pinButtons[name].title=s.pinned?'Recolher automaticamente':'Fixar janela';
   if(floating){if(workspace.clientWidth>0&&workspace.clientHeight>0){s.rect=fitWindow(s.rect,workspace.clientWidth,workspace.clientHeight);styleRect(p,s.rect);}}else{p.removeAttribute('style');p.style.flex=`${s.weight} 1 0px`;}
   if(s.open&&!s.pinned){const tab=button(`Mostrar ${p.getAttribute('aria-label')}`,p.getAttribute('aria-label')??name,()=>{peek=peek===name?undefined:name;render();});tab.classList.add('window-tab');tab.onpointerenter=()=>{if(peek!==name){peek=name;render();}};rail.append(tab);}
  }
  const active=(host:HTMLElement)=>[...host.children].some(n=>!(n as HTMLElement).hidden&&n.classList.contains('panel'));
  const cols=dockWidths(workspace.clientWidth,active(left)?widths.left:0,active(right)?widths.right:0);
  workspace.style.setProperty('--dock-left',`${cols.left}px`);workspace.style.setProperty('--dock-right',`${cols.right}px`);workspace.style.setProperty('--dock-bottom',active(bottom)?`${Math.min(Math.max(160,bottomHeight),workspace.clientHeight*.6)}px`:'0px');
  left.hidden=!active(left);right.hidden=!active(right);bottom.hidden=!active(bottom);rail.hidden=!rail.children.length;
  for(const host of [left,right,bottom]){const items=[...host.children].filter(n=>n.classList.contains('panel')&&!(n as HTMLElement).hidden);items.forEach((p,i)=>{const grip=p.querySelector<HTMLElement>('.window-stack-size');if(grip)grip.hidden=i===items.length-1;});}
 }
 function setPanel(name:ViewerPanel,open:boolean){state[name].open=open;if(!open&&peek===name)peek=undefined;else if(open&&!state[name].pinned)peek=name;render();notify?.(name,open);}
 function interact(handle:HTMLElement,move:(e:PointerEvent,start:{x:number;y:number})=>void,finish?:()=>void){
  handle.onpointerdown=e=>{if(e.button!==0||(e.target as HTMLElement).closest('button,select'))return;e.preventDefault();handle.setPointerCapture(e.pointerId);const start={x:e.clientX,y:e.clientY};
   const onMove=(m:PointerEvent)=>move(m,start),up=()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);finish?.();persist();};
   window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
  };
 }
 for(const name of names){
  const p=panes[name],head=p.querySelector<HTMLElement>('.panel-head')!,title=p.getAttribute('aria-label')??name;
  const controls=document.createElement('div');controls.className='window-controls';
  const place=document.createElement('select');place.className='window-place';place.setAttribute('aria-label',`Posição de ${title}`);
  for(const [value,label]of [['left','Esquerda'],['right','Direita'],['bottom','Abaixo'],['float','Flutuante']]){const o=document.createElement('option');o.value=value;o.textContent=label;place.append(o);}
  place.onchange=()=>{state[name].place=place.value as Place;state[name].pinned=true;peek=undefined;render();persist();};places[name]=place;
  const pin=button(`Fixar ${title}`,'◆',()=>{state[name].pinned=!state[name].pinned;peek=undefined;render();persist();});pinButtons[name]=pin;
  controls.append(place,pin);head.insertBefore(controls,head.lastElementChild);head.title='Arraste o título para soltar a janela; use a posição para encaixar.';
  let initial:WindowRect|undefined;
  interact(head,(e,start)=>{
   if(!initial){const r=p.getBoundingClientRect(),w=workspace.getBoundingClientRect();initial={x:r.left-w.left,y:r.top-w.top,width:r.width,height:r.height};state[name].place='float';state[name].pinned=true;p.style.zIndex=String(++z);}
   state[name].rect=fitWindow({...initial,x:initial.x+e.clientX-start.x,y:initial.y+e.clientY-start.y},workspace.clientWidth,workspace.clientHeight);render();
  },()=>{initial=undefined;});
  p.addEventListener('pointerdown',()=>{if(p.classList.contains('window-floating'))p.style.zIndex=String(++z);});
  p.addEventListener('pointerleave',()=>{if(!state[name].pinned&&peek===name){peek=undefined;render();}});
  const grip=document.createElement('div');grip.className='window-size';grip.tabIndex=0;grip.setAttribute('role','separator');grip.setAttribute('aria-label',`Redimensionar ${title}`);
  let size:WindowRect|undefined;
  interact(grip,(e,start)=>{if(!size)size={...state[name].rect};state[name].rect=fitWindow({...size,width:size.width+e.clientX-start.x,height:size.height+e.clientY-start.y},workspace.clientWidth,workspace.clientHeight);render();},()=>{size=undefined;});
  grip.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const r=state[name].rect;state[name].rect=fitWindow({...r,width:r.width+(e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0),height:r.height+(e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0)},workspace.clientWidth,workspace.clientHeight);render();persist();};p.append(grip);
  const stack=document.createElement('div');stack.className='window-stack-size';stack.tabIndex=0;stack.setAttribute('role','separator');stack.setAttribute('aria-label',`Divisão de ${title}`);p.append(stack);
  let pair:{next:ViewerPanel;initial:number;total:number;weight:number;horizontal:boolean}|undefined;
  const pairState=()=>{const siblings=names.filter(n=>state[n].open&&state[n].pinned&&state[n].place===state[name].place&&panes[n].parentElement===p.parentElement).sort((a,b)=>[...p.parentElement!.children].indexOf(panes[a])-[...p.parentElement!.children].indexOf(panes[b]));const next=siblings[siblings.indexOf(name)+1];if(!next)return undefined;const horizontal=state[name].place==='bottom',a=p.getBoundingClientRect(),b=panes[next].getBoundingClientRect();return {next,horizontal,initial:horizontal?a.width:a.height,total:horizontal?a.width+b.width:a.height+b.height,weight:state[name].weight+state[next].weight};};
  const split=(q:NonNullable<typeof pair>,delta:number)=>{const amount=Math.max(Math.min(80,q.total/2),Math.min(q.total-Math.min(80,q.total/2),q.initial+delta));state[name].weight=q.weight*amount/q.total;state[q.next].weight=q.weight-state[name].weight;render();};
  interact(stack,(e,start)=>{pair??=pairState();if(pair)split(pair,pair.horizontal?e.clientX-start.x:e.clientY-start.y);},()=>{pair=undefined;});
  stack.onkeydown=e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;const q=pairState();if(!q)return;e.preventDefault();split(q,['ArrowUp','ArrowLeft'].includes(e.key)?-20:20);persist();};
 }
 for(const [side,host]of [['left',left],['right',right],['bottom',bottom]] as const){
  const divider=document.createElement('div');divider.className=`dock-divider dock-divider-${side}`;divider.tabIndex=0;divider.setAttribute('role','separator');divider.setAttribute('aria-label',side==='bottom'?'Altura das janelas inferiores':`Largura das janelas à ${side==='left'?'esquerda':'direita'}`);divider.setAttribute('aria-orientation',side==='bottom'?'horizontal':'vertical');
  let initial=0;divider.addEventListener('pointerdown',()=>{initial=side==='bottom'?bottomHeight:widths[side];});
  const change=(n:number)=>{if(side==='bottom')bottomHeight=Math.max(160,n);else widths[side]=Math.max(150,Math.min(workspace.clientWidth*.65,n));render();};
  interact(divider,(e,start)=>change(initial+(side==='bottom'?start.y-e.clientY:side==='right'?start.x-e.clientX:e.clientX-start.x)));
  divider.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();change((side==='bottom'?bottomHeight:widths[side])+(['ArrowLeft','ArrowUp'].includes(e.key)?-20:20));};host.append(divider);
 }
 const presets=document.createElement('select');presets.className='window-presets';presets.setAttribute('aria-label','Organizar janelas');
 for(const [value,label]of [['','Janelas'],['quant','Árvore + Quantificação'],['props','Árvore + Propriedades'],['reset','Restaurar disposição']]){const o=document.createElement('option');o.value=value;o.textContent=label;presets.append(o);}
 presets.onchange=()=>{const value=presets.value;if(!value)return;if(value==='reset'){const opened=names.filter(n=>state[n].open);defaults();widths={left:240,right:300};bottomHeight=260;opened.forEach(n=>state[n].open=true);}else{for(const n of ['model',value==='quant'?'quantification':'properties'] as ViewerPanel[]){state[n].pinned=true;state[n].place=n==='model'?'left':'right';setPanel(n,true);}}peek=undefined;render();persist();presets.value='';};root.querySelector('.viewer-toolbar')!.append(presets);
 workspace.addEventListener('pointerdown',e=>{if(peek&&!panes[peek].contains(e.target as Node)&&!rail.contains(e.target as Node)){peek=undefined;render();}});
 new ResizeObserver(()=>render()).observe(workspace);render();
 return {setPanel,isPanelOpen:(name:ViewerPanel)=>state[name].open};
}
