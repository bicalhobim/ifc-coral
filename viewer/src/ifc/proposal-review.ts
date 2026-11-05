import {elementKey,setCorrection,type Correction,type ExtractedElement} from './schedule-pipeline.ts';
export const correctionKey=(c:Correction)=>JSON.stringify([c.modelId,c.globalId,c.field]);
export function adoptCorrections(existing:Correction[],proposals:Correction[],selected:Set<string>,elements:ExtractedElement[]):Correction[]{
 let next=structuredClone(existing);
 for(const c of proposals.filter(c=>selected.has(correctionKey(c)))){
  const e=elements.find(e=>elementKey(e)===elementKey(c));
  if(!e||(e[c.field]??'')!==c.original)throw new Error('A origem mudou. Refaça a análise antes de adotar.');
  if(existing.some(x=>correctionKey(x)===correctionKey(c)))throw new Error('Há um ajuste adotado neste campo. Revise-o antes de substituir.');
  next=setCorrection(next,e,c.field,c.value);
 }
 return next;
}
export type ReviewRow={key:string;name:string;context:string;field:string;original?:string;value:string};
export type ReviewState={selected:Set<string>;query:string;page:number};
export const reviewState=():ReviewState=>({selected:new Set(),query:'',page:0});
export function reviewRows(rows:ReviewRow[],query:string){const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return rows.filter(r=>norm([r.name,r.context,r.field,r.original,r.value].join(' ')).includes(norm(query)));}
export function renderProposalReview(target:HTMLElement,rows:ReviewRow[],state:ReviewState,options:{busy:boolean;adopt:(keys:Set<string>)=>void;discard:(keys:Set<string>)=>void;edit?:(key:string,value:string)=>void}){
 const n=<K extends keyof HTMLElementTagNameMap>(tag:K,text='')=>{const e=document.createElement(tag);e.textContent=text;return e;};
 const root=n('section');root.className='etl-proposal-review';root.setAttribute('aria-label','Revisão de sugestões');target.append(root);
 const btn=(text:string,action:()=>void,selection=false)=>{const b=n('button',text);b.type='button';b.onclick=action;if(selection)b.dataset.reviewSelect='true';else b.disabled=options.busy;return b;};
 const draw=()=>{
  root.replaceChildren();const known=new Set(rows.map(r=>r.key));for(const k of state.selected)if(!known.has(k))state.selected.delete(k);
  const visible=reviewRows(rows,state.query);state.page=Math.min(state.page,Math.max(0,Math.ceil(visible.length/40)-1));const page=visible.slice(state.page*40,state.page*40+40);
  const search=n('input');search.value=state.query;search.placeholder='Buscar modelo, elemento, campo ou valor';search.setAttribute('aria-label','Filtrar sugestões');search.dataset.reviewSelect='true';search.onchange=()=>{state.query=search.value;state.page=0;draw();};
  const summary=n('p');const adopt=btn('Adotar selecionadas',()=>options.adopt(new Set(state.selected))),discard=btn('Descartar selecionadas',()=>options.discard(new Set(state.selected)));
  const counts=()=>{const hidden=[...state.selected].filter(k=>!visible.some(r=>r.key===k)).length;summary.textContent=`${rows.length} sugestões pendentes · ${visible.length} no filtro · ${state.selected.size} selecionadas${hidden?` (${hidden} fora do filtro)`:''}. Nenhuma é aplicada automaticamente.`;adopt.textContent=`Adotar selecionadas (${state.selected.size})`;discard.textContent=`Descartar selecionadas (${state.selected.size})`;adopt.disabled=discard.disabled=options.busy||!state.selected.size;};
  const actions=n('div');actions.className='etl-actions';actions.append(btn('Marcar sugestões da página',()=>{for(const r of page)state.selected.add(r.key);draw();},true),btn('Marcar sugestões do filtro',()=>{for(const r of visible)state.selected.add(r.key);draw();},true),btn('Desmarcar sugestões do filtro',()=>{for(const r of visible)state.selected.delete(r.key);draw();},true),btn('Limpar seleção de sugestões',()=>{state.selected.clear();draw();},true),adopt,discard);
  root.append(search,summary,actions);
  if(options.busy)root.append(n('p','Recebendo propostas. Você pode marcar sugestões agora; adote ou descarte após concluir ou cancelar a análise.'));
  const wrap=n('div');wrap.className='etl-table-scroll';const table=n('table'),head=n('thead'),hr=n('tr'),body=n('tbody');for(const h of ['Selecionar','Elemento / modelo','Campo','Original','Proposta'])hr.append(n('th',h));head.append(hr);table.append(head,body);wrap.append(table);
  for(const row of page){const tr=n('tr'),td=n('td'),check=n('input');check.type='checkbox';check.checked=state.selected.has(row.key);check.dataset.reviewSelect='true';check.setAttribute('aria-label',`Selecionar sugestão ${row.name} · ${row.field} · ${row.key}`);check.onchange=()=>{check.checked?state.selected.add(row.key):state.selected.delete(row.key);counts();};td.append(check);const origin=n('td',row.name);origin.append(n('small',row.context));tr.append(td,origin,n('td',row.field),n('td',row.original??'—'));const value=n('td');if(options.edit){const input=n('input');input.value=row.value;input.maxLength=500;input.disabled=options.busy;input.setAttribute('aria-label',`Editar proposta ${row.name} · ${row.field}`);input.oninput=()=>{row.value=input.value;options.edit!(row.key,input.value);};value.append(input);}else value.textContent=row.value;tr.append(value);body.append(tr);}
  root.append(wrap);const pages=n('div');pages.className='etl-actions';const prev=btn('Sugestões anteriores',()=>{state.page--;draw();},true),next=btn('Próximas sugestões',()=>{state.page++;draw();},true);prev.disabled=state.page===0;next.disabled=(state.page+1)*40>=visible.length;pages.append(prev,n('span',`Página ${state.page+1} de ${Math.max(1,Math.ceil(visible.length/40))}`),next);root.append(pages);counts();
 };draw();
}
