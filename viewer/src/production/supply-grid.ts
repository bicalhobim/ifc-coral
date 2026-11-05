import {exportProcurement,type ProcurementFilters} from './procurement-export.ts';
import type {ElementMetadata} from '../quantification/types.ts';
declare const __CORAL_BUILD__:{version:string;commit:string|null;working_tree_dirty:boolean|null};
import type {Project} from './types.ts';
import {planningDemands,consolidateDemands,type PlanningDemand} from './integrated.ts';
import {csvCell} from '../ui/csv.ts';
import {downloadBlob,downloadCopy} from '../workspace/downloads.ts';
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;};
const button=(text:string,fn:()=>void)=>{const e=node('button',text);e.type='button';e.onclick=fn;return e;};
const date=(s:string)=>s?s.split('-').reverse().join('/'):'A definir';
const quantity=(q:number|null)=>q===null?'A quantificar':q.toLocaleString('pt-BR',{maximumFractionDigits:3});
export function demandCsv(rows:PlanningDemand[]){return [['origem','pacote_id','local','insumo','quantidade','unidade','iniciar_compra_ate','emitir_pedido_ate','receber_em_obra','necessidade_em_obra','pendencias'],...rows.map(r=>[r.packageId?'Pacote':'Previsão 4D',r.packageId??r.macroId,r.location,r.name,r.quantity===null?'':Number(r.quantity.toFixed(6)).toString().replace('.',','),r.unit,r.start,r.order,r.receive,r.need,r.pending.join('; ')])].map(row=>row.map(x=>csvCell(String(x??''))).join(';')).join('\r\n');}
export function supplyGrid(body:HTMLElement,p:Project,options:{state:{query:string;kind:string;status:string};packageId?:string;metadata?:(refs:{modelId:string;globalId:string}[])=>ElementMetadata[];edit:(r:PlanningDemand)=>void;composition:(id:string)=>void;coverage:(id:string)=>void;detail:(r:PlanningDemand)=>void}){
 const rows=planningDemands(p).filter(r=>!options.packageId||r.packageId===options.packageId);
 const toolbar=node('div','','supply-toolbar'),search=node('input'),kind=node('select'),status=node('select'),summary=node('p','','supply-count'),wrap=node('div','','supply-grid-scroll'),table=node('table','','supply-grid');
 search.type='search';search.placeholder='Buscar insumo, local ou pacote';search.setAttribute('aria-label','Buscar no mapa de suprimentos');
 for(const [value,label]of [['all','Todas as origens'],['package','Somente pacotes'],['macro','Somente previsão 4D']]){const o=node('option',label);o.value=value;kind.append(o);}kind.setAttribute('aria-label','Origem das demandas');
 for(const [value,label]of [['all','Todas as situações'],['pending','Com pendências'],['reviewed','Composição conferida']]){const o=node('option',label);o.value=value;status.append(o);}status.setAttribute('aria-label','Situação das demandas');
 search.value=options.state.query;kind.value=options.state.kind;status.value=options.state.status;
 const visible=()=>rows.filter(r=>(kind.value==='all'||(kind.value==='package'?!!r.packageId:!r.packageId))&&(status.value==='all'||(status.value==='pending'?r.pending.length>0:r.pending.length===0))&&[r.location,r.name,p.packages.find(q=>q.id===r.packageId)?.name??''].join(' ').toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()));
 toolbar.append(search,kind,status,button('Baixar CSV (Excel)',()=>downloadCopy('Mapa-suprimentos.csv',new Blob(['\ufeff'+demandCsv(visible())],{type:'text/csv;charset=utf-8'}))),button('Baixar JSON',()=>downloadCopy('Mapa-suprimentos.json',new Blob([JSON.stringify(visible(),null,2)],{type:'application/json'}))));
 const exportLink=node('a','Baixar pacote para Compras IA','supply-export-download');exportLink.hidden=true;let exportUrl:string|undefined;
 const feedback=node('p','','supply-export-status');feedback.setAttribute('role','status');
 const exportButton=button('Preparar pacote para Compras IA',()=>void(async()=>{
  exportButton.disabled=true;exportLink.hidden=true;feedback.textContent='Preparando pacote para Compras IA…';feedback.setAttribute('role','status');
  try{
   const filters:ProcurementFilters={query:search.value,kind:kind.value as ProcurementFilters['kind'],status:status.value as ProcurementFilters['status'],package_id:options.packageId??null};
   const bundle=await exportProcurement(p,{filters,demandIds:visible().map(r=>r.id),metadata:options.metadata,application:typeof __CORAL_BUILD__==='undefined'?{version:'unknown',commit:null,working_tree_dirty:null}:__CORAL_BUILD__});
   if(!body.isConnected)return;
   if(filters.query!==search.value||filters.kind!==kind.value||filters.status!==status.value){feedback.textContent='Os filtros mudaram. Prepare novamente o pacote para o novo recorte.';return;}
   if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=URL.createObjectURL(new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'}));exportLink.href=exportUrl;exportLink.download=`IFC-Coral-Compras-IA-${bundle.export.id}.json`;exportLink.hidden=false;
   feedback.textContent=`Pacote preparado: ${bundle.scope.exported_count} demandas deste recorte. Use “Baixar pacote para Compras IA”. Inclui prévias e pendências; confira no destino antes de decidir.`;
  }catch(e){feedback.setAttribute('role','alert');feedback.textContent=e instanceof Error?e.message:String(e);}finally{exportButton.disabled=false;}
 })());toolbar.append(exportButton,exportLink);body.append(feedback);
 toolbar.append(button('Salvar CSV na pasta do projeto',()=>downloadBlob('Mapa-suprimentos.csv',new Blob(['\ufeff'+demandCsv(visible())],{type:'text/csv;charset=utf-8'}))));
 if(options.packageId)toolbar.append(button('Editar composição completa',()=>options.composition(options.packageId!)));
 body.append(node('p','Planeje a compra de trás para frente, a partir da necessidade em obra. Edite quantidades pelos coeficientes e datas pelos prazos; o mapa recalcula. Dias corridos. Premissas exigem conferência.','supply-intro'),toolbar,summary,wrap);wrap.append(table);
 const render=()=>{table.replaceChildren();const head=node('thead'),tr=node('tr');for(const title of ['Insumo / especificação','Local / origem','Quantidade','Unidade','Iniciar compra até','Emitir pedido até','Receber em obra','Necessidade em obra','Situação','Ações'])tr.append(node('th',title));head.append(tr);table.append(head);const tbody=node('tbody');table.append(tbody);const filtered=visible();summary.textContent=`${filtered.length} de ${rows.length} demandas · Exportações respeitam os filtros · Composição conferida não significa material disponível.`;
 for(const r of filtered){const tr=node('tr'),item=node('td'),origin=node('td'),actions=node('td','','supply-row-actions');item.append(node('strong',r.name));origin.append(node('strong',r.location),node('small',r.packageId?p.packages.find(q=>q.id===r.packageId)?.name??'Pacote':'Previsão 4D · ainda sem pacote'));tr.append(item,origin);for(const value of [quantity(r.quantity),r.unit,date(r.start),date(r.order),date(r.receive),date(r.need)])tr.append(node('td',value));const state=node('td',r.pending.length?r.pending.join(' · '):'Composição conferida',r.pending.length?'supply-pending':'supply-reviewed');tr.append(state);
 if(r.packageId){actions.append(button('Editar linha',()=>options.edit(r)));const resource=p.resources.find(x=>x.packageId===r.packageId&&JSON.stringify([r.packageId,x.compositionId])===r.id);if(resource)actions.append(button('Reservas / recebimentos',()=>options.coverage(resource.id)));else actions.append(button('Conferir composição',()=>options.composition(r.packageId!)));}else actions.append(button('Detalhar em pacote',()=>options.detail(r)));
 const info=node('details');info.append(node('summary','Origem e cálculo'),node('p',r.source),node('p',r.reusable?'Reutilizável: consolidação considera ocupação simultânea.':'Consumo: consolidação soma demandas compatíveis.'));actions.append(info);tr.append(actions);tbody.append(tr);}
 if(!filtered.length){const tr=node('tr'),cell=node('td','Nenhuma demanda neste recorte. Ajuste os filtros ou adicione insumos à composição.');cell.colSpan=10;tr.append(cell);tbody.append(tr);}
 totals.replaceChildren(node('summary','Totais por insumo e unidade — recorte filtrado'));for(const r of consolidateDemands(filtered))totals.append(node('p',`${r.name}: ${quantity(r.quantity)} ${r.unit} · ${r.reusable?'pico simultâneo':'consumo'} · ${r.unknown} origens sem quantidade`));};
 const totals=node('details','','supply-totals');body.append(totals);const update=()=>{exportLink.hidden=true;if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=undefined;}feedback.textContent='';Object.assign(options.state,{query:search.value,kind:kind.value,status:status.value});render();};search.oninput=update;kind.onchange=status.onchange=update;render();
}
