import type {MeasureResult,ElementMetadata} from './types.ts';
import {measureExplanation,numberText} from './presentation.ts';
import {summarizeMeasures} from './calculate.ts';
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;};
const button=(text:string,fn:()=>void)=>{const b=node('button',text);b.type='button';b.onclick=fn;return b;};
export function openMeasureMemory(values:MeasureResult[],title:string,hooks:{catalog:()=>void;show?:(ref:ElementMetadata)=>void;name?:(ref:ElementMetadata)=>string}){
 const dialog=node('dialog','','calculation-dialog'),head=node('header','','calculation-head'),body=node('div','','calculation-body'),footer=node('footer','','calculation-footer');dialog.setAttribute('aria-label',`Memória de cálculo — ${title}`);
 const close=()=>{dialog.close();dialog.remove();};head.append(node('div',`Memória de cálculo · ${title}`),button('Fechar',close));dialog.append(head,body,footer);dialog.oncancel=()=>dialog.remove();
 const summary=summarizeMeasures(values,values[0].serviceCode);let page=0,onlyPending=false;const size=10;
 const render=()=>{
  body.replaceChildren();footer.replaceChildren();
  const hero=node('div','','calculation-summary');hero.append(node('strong',summary.total===null?'Resultado a conferir':`${numberText(summary.total)} ${values[0].unit}`),node('p',`${summary.count} elemento${summary.count===1?'':'s'} na seleção ao abrir · ${summary.count-summary.missing} com cálculo completo${summary.missing?` · ${summary.missing} com pendências`:''}`));
  if(summary.missing)hero.append(node('p',summary.count===summary.missing?'Nenhum elemento desta seleção possui quantitativo completo para este serviço.':`Subtotal calculável: ${numberText(summary.subtotal)} ${values[0].unit}. Não representa o total da seleção.`));body.append(hero);
  const reasons=new Map<string,number>();for(const r of values)for(const reason of measureExplanation(r).pending)reasons.set(reason,(reasons.get(reason)??0)+1);
  if(reasons.size){const box=node('section','','calculation-pending');box.append(node('h3','O que falta para usar este quantitativo?'));const list=node('ul');for(const [reason,count]of reasons)list.append(node('li',`${reason} (${count} elemento${count===1?'':'s'})`));box.append(list,button('Abrir Catálogo',()=>{close();hooks.catalog();}));body.append(box);}
  const filter=node('label','','calculation-filter'),check=node('input');check.type='checkbox';check.checked=onlyPending;filter.append(check,document.createTextNode('Mostrar somente elementos com pendências'));check.onchange=()=>{onlyPending=check.checked;page=0;render();};body.append(filter);
  const rows=values.filter(r=>!onlyPending||r.pendingReasons.length),pages=Math.max(1,Math.ceil(rows.length/size));page=Math.min(page,pages-1);
  for(const [index,r]of rows.slice(page*size,(page+1)*size).entries()){
   const view=measureExplanation(r),card=node('article','','calculation-element'),heading=node('div','','calculation-element-head');heading.append(node('h3',`${page*size+index+1}. ${hooks.name?.(r.elementRef)||view.title}`),node('strong',view.result));card.append(heading,node('p',`${view.rule} · ${view.source}`,'calculation-source'));
   const inputs=node('dl','','calculation-inputs');for(const e of view.entries)inputs.append(node('dt',e.label),node('dd',e.value));card.append(inputs,node('p',view.formula,'calculation-formula'));
   if(view.pending.length){const pending=node('ul','','calculation-actions');for(const message of view.pending)pending.append(node('li',message));card.append(pending);}else card.append(node('p','Entradas disponíveis. A conferência para planejamento é registrada na aba Conferir.','calculation-next'));
   if(hooks.show)card.append(button('Localizar este elemento no 3D',()=>{close();hooks.show!(r.elementRef);}));
   const technical=node('details','','calculation-technical');technical.append(node('summary','Rastreabilidade técnica (IFC e regra)'),node('p',`GlobalId: ${r.elementRef.globalId}\nClasse IFC: ${r.elementRef.ifcClass}\nRegra: ${r.ruleId} · versão ${r.ruleVersion}\nModelo: ${r.elementRef.modelId}\nRevisão: ${r.elementRef.modelHash}`));
   technical.append(node('p',`Fontes registradas: ${r.evidence.join('; ')}`));if(r.pendingReasons.length)technical.append(node('p',`Pendências originais: ${r.pendingReasons.join('; ')}`));card.append(technical);body.append(card);
  }
  if(!rows.length)body.append(node('p','Nenhum elemento corresponde a este filtro.'));
  const previous=button('← Anterior',()=>{page--;render();body.scrollTop=0;}),next=button('Próxima →',()=>{page++;render();body.scrollTop=0;});previous.disabled=page===0;next.disabled=page===pages-1;footer.append(previous,node('span',`Página ${page+1} de ${pages}`),next);
 };render();document.body.append(dialog);dialog.showModal();
}
