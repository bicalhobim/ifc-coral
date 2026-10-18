import {el} from '../production/ui.ts';
import {catalog} from './catalog.ts';
import {classifyElement} from './classify.ts';
import {calculateMeasures,summarizeMeasures} from './calculate.ts';
import {approveMeasure,isReviewCurrent,type MeasureSnapshot} from './review.ts';
import type {ElementMetadata,MeasureInput,MeasureResult,ServiceCode} from './types.ts';

export type QuantSelection={element:ElementMetadata;volume?:MeasureInput['volume']};
type Hooks={selection:()=>QuantSelection[];reviews:()=>MeasureSnapshot[];saveReviews:(rows:MeasureSnapshot[])=>void;generate?:(rows:MeasureSnapshot[])=>void};
type GeometryRow={globalId:string;geometry?:{candidateArea:number|null;lowerArea:number;sideArea:number};contacts?:{deductedArea:number;contactsResolved:boolean;method:string;pendingReasons:string[]};volumeDivergence?:boolean};
export type QuantReport={schema:'quantification-1';sourceHash:string;elements:GeometryRow[]};
export function parseReport(text:string):QuantReport{
 if(text.length>15_000_000)throw new Error('Relatório excede 15 MB.');const data=JSON.parse(text) as QuantReport;
 if(data.schema!=='quantification-1'||!/^[a-f0-9]{64}$/.test(data.sourceHash)||!Array.isArray(data.elements)||data.elements.length>100000||new Set(data.elements.map(e=>e.globalId)).size!==data.elements.length)throw new Error('Relatório de quantificação inválido.');
 for(const e of data.elements){if(typeof e.globalId!=='string')throw new Error('Elemento sem GlobalId.');for(const n of [e.geometry?.candidateArea,e.geometry?.lowerArea,e.geometry?.sideArea,e.contacts?.deductedArea])if(n!==null&&n!==undefined&&(typeof n!=='number'||!Number.isFinite(n)||n<0))throw new Error('Área inválida no relatório.');if(e.contacts&&typeof e.contacts.contactsResolved!=='boolean')throw new Error('Conferência de contatos inválida.');}
 return data;
}
export function downloadJSON(name:string,data:unknown){const a=el('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const names:Record<ServiceCode,string>={concrete:'Concretagem',reinforcement:'Armação estimada',formwork:'Fôrmas'};
const fmt=(n:number|null)=>n===null?'Pendente':n.toLocaleString('pt-BR',{maximumFractionDigits:3});
function button(label:string,fn:()=>void){const b=el('button',label);b.type='button';b.onclick=fn;return b;}
function input(label:string,value='',type='text'){const l=el('label',label,'quant-field'),i=el('input');i.type=type;i.value=value;if(type==='number'){i.min='0';i.step='any';}l.append(i);return {l,i};}
export class QuantificationPanel{
 readonly element=el('div','','quant-tool');private tab='Medir';private hooks:Hooks;private rules=structuredClone(catalog);private reports=new Map<string,QuantReport>();private overrides=new Map<string,{ruleId:string;author:string;reason:string}>();private error='';
 constructor(hooks:Hooks){this.hooks=hooks;this.render();}
 addReport(text:string){const report=parseReport(text);this.reports.set(report.sourceHash,report);this.render();}
 measures():MeasureResult[]{return this.hooks.selection().flatMap(({element,volume})=>{
  const classification=classifyElement(element,this.rules,this.overrides.get(JSON.stringify([element.modelId,element.globalId])));const r=this.reports.get(element.modelHash)?.elements.find(r=>r.globalId===element.globalId);
  const rule=classification.rule??{...this.rules[0],id:'pending',label:'Classificação pendente',steelRate:null,formMethod:null};
  const measures=calculateMeasures({element,volume,geometry:r?.geometry?{candidateArea:r.geometry.candidateArea,deductedArea:r.contacts?.deductedArea??null,contactsResolved:r.contacts?.contactsResolved===true&&!r.volumeDivergence,source:`IfcOpenShell · revisão ${element.modelHash.slice(0,8)}`,method:r.contacts?.method??rule.formMethod??''}:undefined},rule);
  if(classification.status==='pending')for(const m of measures){m.pendingReasons.push(classification.reason);m.status='pending';m.amount=null;}
  return measures;
 });}
 private run(fn:()=>void){try{fn();this.error='';}catch(e){this.error=e instanceof Error?e.message:String(e);}this.render();}
 render(){
  const rows=this.measures(),selected=this.hooks.selection();this.element.replaceChildren();const nav=el('nav','','quant-nav');for(const name of ['Medir','Catálogo','Conferir'])nav.append(button(name,()=>{this.tab=name;this.render();}));this.element.append(nav);
  if(this.error){const p=el('p',this.error,'notice error');p.setAttribute('role','alert');this.element.append(p);}
  this.element.append(el('p',`${selected.length} elementos únicos selecionados`,'eyebrow'));
  if(this.tab==='Catálogo'){this.renderCatalog();return;}
  if(!rows.length){this.element.append(el('p','Selecione uma atividade no 4D ou um elemento do modelo. As fases do cronograma não multiplicam o consumo.'));return;}
  if(this.tab==='Conferir'){this.renderReview(rows);return;}
  for(const service of ['concrete','reinforcement','formwork'] as const){const values=rows.filter(r=>r.serviceCode===service),sum=summarizeMeasures(values,service);const card=el('article','','quant-result');card.append(el('h3',names[service]),el('strong',`${fmt(sum.total)} ${values[0].unit}`),el('p',`${sum.count-sum.missing}/${sum.count} com cálculo completo · ${service==='reinforcement'?'estimativa, sem bitolas':'rascunho'}`));
   if(sum.missing)card.append(el('p',`Subtotal conhecido: ${fmt(sum.subtotal)} ${values[0].unit}`));
   if(service==='formwork'){const gross=values.reduce((n,r)=>n+Number(r.inputs.candidateArea??0),0);card.append(el('p',`Área candidata antes de descontos: ${fmt(gross)} m². Exige método e contatos conferidos.`));}
   const d=el('details');d.append(el('summary','Origem, fórmula e pendências'));for(const r of values)d.append(el('p',`${r.elementRef.globalId} · ${r.ruleSnapshot.label} · ${fmt(r.amount)} ${r.unit}\n${JSON.stringify(r.inputs)}\n${r.evidence.join('; ')}\n${r.pendingReasons.join('; ')}`,'fine'));card.append(d);this.element.append(card);
  }
  const file=el('input');file.type='file';file.accept='.json';file.hidden=true;file.setAttribute('aria-label','Relatório geométrico IfcOpenShell');file.onchange=async()=>{const f=file.files?.[0];if(f)this.run(()=>{});try{if(f)this.addReport(await f.text());}catch(e){this.error=String(e);this.render();}};
  this.element.append(button('Importar relatório geométrico',()=>file.click()),file,button('Exportar medições',()=>downloadJSON('IFC-Coral-medicoes.json',{measures:rows,reviews:this.hooks.reviews()})),el('p','Rascunhos não autorizam compra, execução ou dimensionamento.','notice'));
 }
 private renderCatalog(){
  this.element.append(el('p','Taxas de aço propostas em kg/m³. Ajustar invalida a conferência anterior. Não são taxas normativas.'));
  for(const rule of this.rules){const card=el('details');card.append(el('summary',rule.label));const rate=input(`Taxa — ${rule.label}`,rule.steelRate===null?'':String(rule.steelRate),'number');const method=input(`Método — ${rule.label}`,rule.formMethod??'');card.append(rate.l,method.l,el('p',`Regra ${rule.id} · ${rule.version}\n${rule.source}`,'fine'),button('Aplicar parâmetros ao cenário',()=>this.run(()=>{const value=rate.i.value===''?null:Number(rate.i.value);if(value!==null&&(!Number.isFinite(value)||value<0))throw new Error('Taxa inválida.');rule.steelRate=value;rule.formMethod=method.i.value.trim()||null;rule.version=`1.0.${Date.now()}`;})));this.element.append(card);}
  const ruleSelect=el('select');ruleSelect.setAttribute('aria-label','Substituir classificação da seleção');for(const r of this.rules){const o=el('option',r.label);o.value=r.id;ruleSelect.append(o);}const author=input('Autor da classificação'),reason=input('Motivo da classificação');this.element.append(el('h3','Classificação por conferência'),ruleSelect,author.l,reason.l,button('Aplicar classificação à seleção',()=>this.run(()=>{for(const {element} of this.hooks.selection()){const override={ruleId:ruleSelect.value,author:author.i.value,reason:reason.i.value};classifyElement(element,this.rules,override);this.overrides.set(JSON.stringify([element.modelId,element.globalId]),override);}})),button('Exportar catálogo para IfcOpenShell',()=>downloadJSON('catalogo-quantificacao.json',this.rules)));
 }
 private renderReview(rows:MeasureResult[]){
  this.element.append(el('p','Conferência para planejamento. Defina evidências e método. Medida manual substitui explicitamente o cálculo, sem apagar a origem.'));
  const reviewer=input('Conferente da quantificação'),evidence=input('Evidência da quantificação'),method=input('Método conferido');this.element.append(reviewer.l,evidence.l,method.l);
  for(const service of ['concrete','reinforcement','formwork'] as const){const values=rows.filter(r=>r.serviceCode===service),unit=values[0].unit;const manual=input(`Medida manual total — ${names[service]} (${unit})`,'','number');const card=el('article','','quant-result');card.append(el('h3',names[service]),manual.l,button(`Conferir ${names[service].toLowerCase()}`,()=>this.run(()=>{
   let snaps:MeasureSnapshot[];if(manual.i.value!==''){const total=Number(manual.i.value);if(values.length>1&&values.some(r=>!r.inputs.candidateArea)&&service==='formwork')throw new Error('Selecione um elemento por vez para medição manual sem pesos geométricos.');const weight=(r:MeasureResult)=>Number(service==='formwork'?r.inputs.candidateArea??1:r.inputs.volume??1),sum=values.reduce((n,r)=>n+weight(r),0);if(sum<=0)throw new Error('Pesos indisponíveis. Selecione um elemento.');snaps=values.map(r=>approveMeasure(r,{reviewer:reviewer.i.value,evidence:evidence.i.value+' · rateio explícito proporcional da medida total '+total+' '+unit,method:method.i.value,manualAmount:total*weight(r)/sum}));}
   else snaps=values.map(r=>approveMeasure(r,{reviewer:reviewer.i.value,evidence:evidence.i.value,method:method.i.value}));
   this.hooks.saveReviews([...this.hooks.reviews().filter(x=>!snaps.some(s=>s.measure.id===x.measure.id)),...snaps]);
  })));const current=this.hooks.reviews().filter(s=>values.some(r=>r.id===s.measure.id&&isReviewCurrent(s,r)));card.append(el('p',`${current.length}/${values.length} conferências vigentes`));this.element.append(card);}
  this.element.append(button('Pré-visualizar pacotes de produção',()=>this.run(()=>{const valid=this.hooks.reviews().filter(s=>rows.some(r=>r.id===s.measure.id&&isReviewCurrent(s,r)));if(!valid.length)throw new Error('Confira pelo menos um serviço.');this.hooks.generate?.(valid);})),button('Exportar conferências',()=>downloadJSON('IFC-Coral-conferencias.json',this.hooks.reviews())));
 }
}
