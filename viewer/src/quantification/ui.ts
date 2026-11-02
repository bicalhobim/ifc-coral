import {openMeasureMemory} from './memory-ui.ts';
import {formMethods,methodInfo,updateCatalogRule,numberText} from './presentation.ts';
import {el} from '../production/ui.ts';
import {downloadBlob} from '../workspace/downloads.ts';
import {catalog} from './catalog.ts';
import {classifyElement} from './classify.ts';
import {calculateMeasures,summarizeMeasures} from './calculate.ts';
import {reviewSelection,isReviewCurrent,type MeasureSnapshot} from './review.ts';
import type {ElementMetadata,MeasureInput,MeasureResult,ServiceCode,QuantRule} from './types.ts';

export type QuantSelection={element:ElementMetadata;volume?:MeasureInput['volume']};
type Hooks={reportChanged?:()=>void;showElement?:(ref:ElementMetadata)=>void;elementName?:(ref:ElementMetadata)=>string;selection:()=>QuantSelection[];reviews:()=>MeasureSnapshot[];saveReviews:(rows:MeasureSnapshot[])=>void;saveRules?:(rules:QuantRule[])=>void;generate?:(rows:MeasureSnapshot[])=>void;useInPackage?:(service:ServiceCode)=>void};
type GeometryRow={globalId:string;geometry?:{candidateArea:number|null;lowerArea:number;sideArea:number;method?:string|null};contacts?:{deductedArea:number;contactsResolved:boolean;method:string|null;pendingReasons:string[]};volumeDivergence?:boolean};
export type QuantReport={schema:'quantification-1';sourceHash:string;elements:GeometryRow[]};
export function parseReport(text:string):QuantReport{
 if(text.length>15_000_000)throw new Error('Relatório excede 15 MB.');const data=JSON.parse(text) as QuantReport;
 if(data.schema!=='quantification-1'||!/^[a-f0-9]{64}$/.test(data.sourceHash)||!Array.isArray(data.elements)||data.elements.length>100000||new Set(data.elements.map(e=>e.globalId)).size!==data.elements.length)throw new Error('Relatório de quantificação inválido.');
 for(const e of data.elements){if(typeof e.globalId!=='string')throw new Error('Elemento sem GlobalId.');for(const n of [e.geometry?.candidateArea,e.geometry?.lowerArea,e.geometry?.sideArea,e.contacts?.deductedArea])if(n!==null&&n!==undefined&&(typeof n!=='number'||!Number.isFinite(n)||n<0))throw new Error('Área inválida no relatório.');if(e.geometry?.method!=null&&typeof e.geometry.method!=='string')throw new Error('Método geométrico inválido.');if(e.contacts?.method!=null&&typeof e.contacts.method!=='string')throw new Error('Método de contatos inválido.');if(e.contacts&&typeof e.contacts.contactsResolved!=='boolean')throw new Error('Conferência de contatos inválida.');}
 return data;
}
export function downloadJSON(name:string,data:unknown){downloadBlob(name,new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));}
const names:Record<ServiceCode,string>={concrete:'Concretagem',reinforcement:'Armação estimada',formwork:'Fôrmas'};
const fmt=(n:number|null)=>n===null?'Pendente':n.toLocaleString('pt-BR',{maximumFractionDigits:3});
function button(label:string,fn:()=>void){const b=el('button',label);b.type='button';b.onclick=fn;return b;}
function input(label:string,value='',type='text'){const l=el('label',label,'quant-field'),i=el('input');i.type=type;i.value=value;if(type==='number'){i.min='0';i.step='any';}l.append(i);return {l,i};}
export class QuantificationPanel{
 readonly element=el('div','','quant-tool');private tab='Medir';private hooks:Hooks;private rules=structuredClone(catalog);private reports=new Map<string,QuantReport>();private overrides=new Map<string,{ruleId:string;author:string;reason:string}>();private error='';private notice='';private catalogAll=false;
 constructor(hooks:Hooks){this.hooks=hooks;this.render();}
 getReports(){return [...this.reports.values()].map(r=>structuredClone(r));}
 clearReports(){this.reports.clear();}
 resetForProject(rules?:QuantRule[]){this.notice='';this.catalogAll=false;this.rules=structuredClone(rules??catalog);this.overrides.clear();for(const s of this.hooks.reviews()){const original=s.measure.classificationOverride;if(original)this.overrides.set(JSON.stringify([s.measure.elementRef.modelId,s.measure.elementRef.globalId]),{ruleId:s.measure.ruleId,...original});}this.render();}
 addReport(text:string){const report=parseReport(text);this.reports.set(report.sourceHash,report);this.render();}
 measures():MeasureResult[]{return this.measuresFor(this.hooks.selection());}
 measuresFor(selection:QuantSelection[],rules=this.rules):MeasureResult[]{return selection.flatMap(({element,volume})=>{
  const classification=classifyElement(element,rules,this.overrides.get(JSON.stringify([element.modelId,element.globalId])));const r=this.reports.get(element.modelHash)?.elements.find(r=>r.globalId===element.globalId);
  const rule=classification.rule??{...this.rules[0],id:'pending',label:'Classificação pendente',steelRate:null,formMethod:null};
  const measures=calculateMeasures({element,volume,classificationOverride:classification.override,volumeDivergence:r?.volumeDivergence===true,geometry:r?.geometry?{candidateArea:r.geometry.candidateArea,lowerArea:r.geometry.lowerArea,deductedArea:r.contacts?.deductedArea??null,contactsResolved:r.contacts?.contactsResolved===true&&!r.volumeDivergence,source:`IfcOpenShell · revisão ${element.modelHash.slice(0,8)}`,method:r.contacts?.method??r.geometry.method??''}:undefined},rule);
  if(classification.status==='pending')for(const m of measures){m.pendingReasons.push(classification.reason);m.status='pending';m.amount=null;}
  return measures;
 });}
 private run(fn:()=>void,render=true){try{fn();this.error='';if(render)this.render();}catch(e){this.error=e instanceof Error?e.message:String(e);this.render();}}
 render(){
  const rows=this.measures(),selected=this.hooks.selection();this.element.replaceChildren();const nav=el('nav','','quant-nav');for(const name of ['Medir','Catálogo','Conferir']){const b=button(name,()=>{this.tab=name;this.render();});b.setAttribute('aria-current',this.tab===name?'page':'false');nav.append(b);}this.element.append(nav);
  if(this.error){const p=el('p',this.error,'notice error');p.setAttribute('role','alert');this.element.append(p);}
  if(this.notice){const note=el('p',this.notice,'quant-success');note.setAttribute('role','status');this.element.append(note);}
  this.element.append(el('p',`${selected.length} elementos únicos selecionados`,'eyebrow'));
  if(this.tab==='Catálogo'){this.renderCatalog();return;}
  if(!rows.length){this.element.append(el('p','Selecione uma atividade no 4D ou um elemento do modelo. As fases do cronograma não multiplicam o consumo.'));return;}
  if(this.tab==='Conferir'){this.renderReview(rows);return;}
  for(const service of ['concrete','reinforcement','formwork'] as const){const values=rows.filter(r=>r.serviceCode===service),sum=summarizeMeasures(values,service);const card=el('article','','quant-result');card.append(el('h3',names[service]),el('strong',`${fmt(sum.total)} ${values[0].unit}`),el('p',`${sum.count-sum.missing}/${sum.count} com cálculo completo · ${service==='reinforcement'?'estimativa, sem bitolas':'rascunho'}`));
   if(sum.missing)card.append(el('p',sum.missing===sum.count?'Nenhum quantitativo completo neste serviço.':`Subtotal conhecido: ${fmt(sum.subtotal)} ${values[0].unit}`));
   if(service==='formwork'){const available=values.filter(r=>r.inputs.candidateArea!==null),gross=available.reduce((n,r)=>n+Number(r.inputs.candidateArea),0),lower=values.filter(r=>r.inputs.lowerArea!==null);card.append(el('p',available.length?`Área candidata antes de descontos: ${fmt(gross)} m² (${available.length}/${values.length}). Exige método e contatos conferidos.`:'Área geométrica pendente: importe o relatório.'));if(lower.length)card.append(el('p',`Área inferior geométrica: ${fmt(lower.reduce((n,r)=>n+Number(r.inputs.lowerArea),0))} m² (${lower.length}/${values.length}).`));}
   const origin=el('p',service==='concrete'?'Volume declarado no modelo IFC':service==='reinforcement'?'Volume de concreto × taxa de aço do cenário':'Faces previstas no método − descontos de encontros','quant-origin');card.append(origin,button('Ver memória de cálculo',()=>openMeasureMemory(values,names[service],{catalog:()=>{this.tab='Catálogo';this.render();},show:this.hooks.showElement,name:this.hooks.elementName})));if(this.hooks.useInPackage)card.append(button(`Usar ${names[service].toLowerCase()} no pacote`,()=>this.hooks.useInPackage!(service)));this.element.append(card);
  }
  const file=el('input');file.type='file';file.accept='.json';file.hidden=true;file.setAttribute('aria-label','Relatório geométrico IfcOpenShell');file.onchange=async()=>{const f=file.files?.[0];if(f)this.run(()=>{});try{if(f){this.addReport(await f.text());this.hooks.reportChanged?.();}}catch(e){this.error=String(e);this.render();}};
  this.element.append(button('Importar relatório geométrico',()=>file.click()),file,button('Exportar medições',()=>downloadJSON('IFC-Coral-medicoes.json',{measures:rows,reviews:this.hooks.reviews()})),el('p','Rascunhos não autorizam compra, execução ou dimensionamento.','notice'));
 }
 private renderCatalog(){
  const selected=this.hooks.selection(),counts=new Map<string,number>();
  for(const {element} of selected){const c=classifyElement(element,this.rules,this.overrides.get(JSON.stringify([element.modelId,element.globalId])));if(c.rule)counts.set(c.rule.id,(counts.get(c.rule.id)??0)+1);}
  this.element.append(el('h3','Regras do quantitativo'),el('p','A taxa estima aço a partir do volume de concreto. O método de fôrma define quais faces da geometria entram na medição.','quant-intro'));
  if(selected.length)this.element.append(button(this.catalogAll?'Mostrar só tipos da seleção':'Mostrar todas as regras',()=>{this.catalogAll=!this.catalogAll;this.render();}));
  const visible=this.rules.filter(r=>!selected.length||this.catalogAll||counts.has(r.id));
  if(!visible.length)this.element.append(el('p','A seleção não encontrou uma regra. Mostre todas as regras e confira a classificação abaixo.','notice'));
  for(const rule of visible){
   const card=el('details','','catalog-card');card.open=counts.has(rule.id);const title=el('summary',rule.label);title.append(el('small',counts.has(rule.id)?`${counts.get(rule.id)} na seleção`:'Regra do projeto'));card.append(title);
   const content=el('div','','catalog-content'),rate=input(`Taxa de aço (kg/m³) — ${rule.label}`,rule.steelRate===null?'':String(rule.steelRate),'number');rate.i.placeholder='Deixe em branco se ainda não souber';
   content.append(rate.l,el('p','Exemplo: 10 m³ × 60 kg/m³ = 600 kg de aço estimado. A taxa precisa de fonte e calibração; não é uma taxa normativa nem dimensionamento.','fine'));
   const method=el('select');method.setAttribute('aria-label',`Faces da fôrma — ${rule.label}`);const empty=el('option','Escolher faces / ainda não definido');empty.value='';method.append(empty);
   for(const m of formMethods){const o=el('option',m.label);o.value=m.id;method.append(o);}if(rule.formMethod&&!formMethods.some(m=>m.id===rule.formMethod)){const o=el('option','Método legado — revisar');o.value=rule.formMethod;method.append(o);}method.value=rule.formMethod??'';
   const label=el('label','Superfícies a considerar na fôrma','quant-field');label.append(method);const info=el('div','','catalog-method');const describe=()=>{const m=methodInfo(method.value);info.replaceChildren(el('strong',m.label),el('p',m.description),el('p',`Exemplo de aplicação: ${m.example}`));const faces=el('div','','catalog-faces');for(const face of m.faces)faces.append(el('span',face));info.append(faces);};method.onchange=describe;describe();
   content.append(label,info,el('p','Salvar a taxa recalcula a estimativa de aço. Trocar o método não gera nova geometria: exporte o catálogo para processar outro relatório IfcOpenShell, importe-o em Medir e confira, ou registre uma medição manual justificada.','catalog-impact'));
   const premiseLabel=el('label',`Fonte ou premissa — ${rule.label}`,'quant-field'),premise=el('textarea');premise.value=rule.source;premise.rows=3;premiseLabel.append(premise);content.append(premiseLabel);
   const source=el('details','','catalog-source');source.append(el('summary','Fonte e identificação da regra'),el('p',rule.source),el('p',`${rule.id} · versão ${rule.version} · ${rule.ifcClass}`,'fine'));content.append(source);
   content.append(button(`Revisar e salvar regra — ${rule.label}`,()=>this.run(()=>{
    const rateValue=rate.i.value===''?null:Number(rate.i.value),methodValue=method.value||null;
    if(rateValue===rule.steelRate&&methodValue===rule.formMethod&&premise.value.trim()===rule.source){this.notice='Nenhuma alteração na regra.';this.render();return;}
    const next=updateCatalogRule(this.rules,rule.id,rateValue,methodValue,premise.value),dialog=el('dialog','','catalog-confirm');dialog.setAttribute('aria-label','Confirmar regra de quantificação');
    const close=()=>{dialog.close();dialog.remove();};dialog.oncancel=()=>dialog.remove();dialog.append(el('h2',`Salvar regra: ${rule.label}?`),el('p',`Taxa de aço: ${numberText(rule.steelRate)} → ${numberText(rateValue)} kg/m³.`),el('p',`Faces de fôrma: ${methodInfo(rule.formMethod).label} → ${methodInfo(methodValue).label}.`),el('p',`${counts.get(rule.id)??0} elemento(s) desta seleção usam a regra. A alteração se aplica a todos os elementos compatíveis do projeto, inclusive fora da seleção. As conferências e os pacotes afetados precisam de nova verificação.`),el('p',`Fonte / premissa: ${premise.value.trim()}`),el('p','A geometria não será recalculada neste passo. Compromissos congelados conservam os quantitativos assumidos.'),button('Continuar editando',close),button('Salvar regra do projeto',()=>{try{this.hooks.saveRules?.(next);this.rules=next;this.notice='Regra salva no projeto. Confira as medições afetadas e salve o projeto na sua pasta.';this.error='';close();this.render();}catch(e){let message=dialog.querySelector<HTMLElement>('[role=alert]');if(!message){message=el('p','','notice error');message.setAttribute('role','alert');message.tabIndex=-1;dialog.append(message);}message.textContent=e instanceof Error?e.message:String(e);message.focus();}}));document.body.append(dialog);dialog.showModal();
   },false)));card.append(content);this.element.append(card);
  }
  const advanced=el('details','','catalog-classification');advanced.append(el('summary','Corrigir classificação de um elemento'));
  const ruleSelect=el('select');ruleSelect.setAttribute('aria-label','Substituir classificação da seleção');for(const r of this.rules){const o=el('option',r.label);o.value=r.id;ruleSelect.append(o);}const author=input('Autor da classificação'),reason=input('Motivo da classificação');advanced.append(el('p','Use apenas quando a função construtiva do elemento tiver sido conferida. Reclassificar não cria geometria nova.'),ruleSelect,author.l,reason.l,button('Aplicar classificação à seleção',()=>this.run(()=>{const updates=this.hooks.selection().map(({element})=>{const override={ruleId:ruleSelect.value,author:author.i.value,reason:reason.i.value};classifyElement(element,this.rules,override);return {element,override};});for(const {element,override} of updates)this.overrides.set(JSON.stringify([element.modelId,element.globalId]),override);})));this.element.append(advanced,button('Exportar catálogo para IfcOpenShell',()=>downloadJSON('catalogo-quantificacao.json',this.rules)));
 }
 private renderReview(rows:MeasureResult[]){
  this.element.append(el('p','Conferência para planejamento. Defina evidências e método. Medida manual substitui explicitamente o cálculo, sem apagar a origem.'));
  const reviewer=input('Conferente da quantificação'),evidence=input('Evidência da quantificação'),method=input('Como o quantitativo foi conferido');this.element.append(reviewer.l,evidence.l,method.l);
  for(const service of ['concrete','reinforcement','formwork'] as const){const values=rows.filter(r=>r.serviceCode===service),unit=values[0].unit;const manual=input(`Medida manual total — ${names[service]} (${unit})`,'','number');const card=el('article','','quant-result');card.append(el('h3',names[service]),manual.l,button(`Conferir ${names[service].toLowerCase()}`,()=>this.run(()=>{
   const snaps=reviewSelection(values,{reviewer:reviewer.i.value,evidence:evidence.i.value,method:method.i.value},manual.i.value===''?undefined:Number(manual.i.value));
   this.hooks.saveReviews([...this.hooks.reviews().filter(x=>!snaps.some(s=>s.measure.id===x.measure.id)),...snaps]);
  })));const current=this.hooks.reviews().filter(s=>values.some(r=>r.id===s.measure.id&&isReviewCurrent(s,r)));card.append(el('p',`${current.length}/${values.length} conferências vigentes`));this.element.append(card);}
  this.element.append(button('Pré-visualizar pacotes de produção',()=>this.run(()=>{const valid=this.hooks.reviews().filter(s=>rows.some(r=>r.id===s.measure.id&&isReviewCurrent(s,r)));if(!valid.length)throw new Error('Confira pelo menos um serviço.');this.hooks.generate?.(valid);})),button('Exportar conferências',()=>downloadJSON('IFC-Coral-conferencias.json',this.hooks.reviews())));
 }
}
