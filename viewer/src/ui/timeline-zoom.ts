/** Visual scale only: never changes activity dates. */
export const zoomAtDrag=(initial:number,dx:number)=>Math.max(1,Math.min(12,initial*Math.pow(2,dx/180)));
export const anchoredScroll=(fraction:number,width:number,labelWidth:number,pointerX:number)=>Math.max(0,labelWidth+fraction*width-pointerX);
export function bindTimelineZoom(axis:Element,get:()=>number,apply:(zoom:number,clientX:number)=>void){
 axis.setAttribute('role','slider');axis.setAttribute('tabindex','0');axis.setAttribute('aria-label','Zoom da escala de datas');axis.setAttribute('aria-valuemin','100');axis.setAttribute('aria-valuemax','1200');axis.setAttribute('aria-valuenow',String(Math.round(get()*100)));axis.setAttribute('aria-valuetext',`${Math.round(get()*100)}%. Arraste para a direita para ampliar; esquerda para reduzir. Setas ajustam; Home restaura.`);axis.classList.add('timeline-zoom-axis');
 axis.addEventListener('pointerdown',event=>{const e=event as PointerEvent;if(e.button!==0)return;e.preventDefault();e.stopPropagation();const initial=get(),x=e.clientX;
  const move=(m:PointerEvent)=>{if(m.pointerId===e.pointerId)apply(zoomAtDrag(initial,m.clientX-x),x);};
  const stop=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',stop);window.removeEventListener('pointercancel',cancel);window.removeEventListener('blur',cancel);};
  const cancel=()=>{apply(initial,x);stop();};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',stop);window.addEventListener('pointercancel',cancel);window.addEventListener('blur',cancel);
 });
 axis.addEventListener('keydown',event=>{const e=event as KeyboardEvent;if(!['ArrowLeft','ArrowRight','Home'].includes(e.key))return;e.preventDefault();const owner=axis.closest('.planning-content'),box=axis.getBoundingClientRect();apply(e.key==='Home'?1:zoomAtDrag(get(),e.key==='ArrowRight'?45:-45),box.left+box.width/2);owner?.querySelector<SVGElement>('.timeline-zoom-axis')?.focus({preventScroll:true});});
}
