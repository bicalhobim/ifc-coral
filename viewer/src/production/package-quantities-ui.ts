import type {Project} from './types.ts';
import type {MeasureResult,ServiceCode} from '../quantification/types.ts';
import {reviewSelection,isReviewCurrent} from '../quantification/review.ts';
import {summarizeMeasures} from '../quantification/calculate.ts';
import {applyPackageMeasurements,measuredServices} from './package-quantities.ts';
export type PackageMeasureRequest={packageId?:string;service?:ServiceCode;name?:string;location?:string};
type Hooks={getProject:()=>Project;measures:()=>MeasureResult[];change:(fn:(p:Project)=>void)=>void;complete:(id:string)=>void};
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;};
const button=(text:string,fn:()=>void,cls='')=>{const b=node('button',text,cls);b.type='button';b.onclick=fn;return b;};
function field(title:string,value='',type='text'){const label=node('label',title),input=node('input');input.type=type;input.value=value;if(type==='number'){input.min='0';input.step='any';}label.append(input);return {label,input};}
const ref=(e:{modelId:string;globalId:string})=>JSON.stringify([e.modelId,e.globalId]);
export function openPackageMeasurements(hooks:Hooks,request:PackageMeasureRequest={}){
 const project=hooks.getProject(),projectId=project.id,initial=project.packages.find(p=>p.id===request.packageId),captured=structuredClone(hooks.measures());
 const dialog=node('dialog','','project-destination package-measure-transfer');dialog.setAttribute('aria-label','Usar quantificação no pacote');
 const close=()=>{dialog.close();dialog.remove();};const top=node('div','','measure-transfer-heading'),status=node('p','','notice error');status.hidden=true;status.setAttribute('role','alert');
 top.append(node('h2','Usar quantificação no pacote'),button('Fechar',close));dialog.append(top,status,node('p','A quantidade, os elementos e a memória de cálculo serão vinculados ao pacote. Confira um serviço por vez; aço em kg e fôrmas em m² ficam em pacotes próprios.'));
 const service=node('select');service.setAttribute('aria-label','Serviço a herdar');for(const [code,definition]of Object.entries(measuredServices)){const o=node('option',`${definition.title} (${definition.unit})`);o.value=code;service.append(o);}service.value=request.service??initial?.serviceCode??(initial?.unit==='kg'?'reinforcement':initial?.unit==='m²'?'formwork':'concrete');const serviceLabel=node('label','Qual quantitativo?');serviceLabel.append(service);dialog.append(serviceLabel);
 const body=node('section','','measure-transfer-body');dialog.append(body);
 const render=()=>{
  body.replaceChildren();status.hidden=true;const code=service.value as ServiceCode,definition=measuredServices[code],rows=captured.filter(r=>r.serviceCode===code),summary=summarizeMeasures(rows,code),refs=new Set(rows.map(r=>ref(r.elementRef)));
  if(!rows.length){body.append(node('p','Selecione no modelo os elementos que deseja quantificar antes de usar este comando.','notice'));return;}
  const reviews=rows.map(row=>project.measures.find(s=>s.measure.id===row.id&&isReviewCurrent(s,row))),allReviewed=reviews.every(s=>!!s);
  const metrics=node('p','','measure-transfer-total');metrics.textContent=`${rows.length} elementos · ${allReviewed?reviews.reduce((n,s)=>n+s!.amount,0).toLocaleString('pt-BR',{maximumFractionDigits:3}):summary.total===null?'Quantidade pendente':summary.total.toLocaleString('pt-BR',{maximumFractionDigits:3})} ${definition.unit} · ${allReviewed?'conferido':'rascunho a conferir'}`;body.append(metrics);
  if(code==='reinforcement')body.append(node('p','Estimativa com as taxas de aço adotadas na seleção; a taxa e a origem acompanham a medição. Não substitui dimensionamento ou BBS.','fine'));
  if(summary.missing)body.append(node('p',`${summary.missing} elemento(s) têm cálculo pendente. Complete os parâmetros ou informe medida manual justificada; não será usado um subtotal como total.`, 'notice'));
  const target=node('select');target.setAttribute('aria-label','Destino da quantificação');const fresh=node('option','Criar novo pacote com esta seleção');fresh.value='';target.append(fresh);
  const compatible=project.packages.filter(pkg=>pkg.unit===definition.unit&&(!pkg.serviceCode||pkg.serviceCode===code)&&(!pkg.elements.length||pkg.elements.length===refs.size&&pkg.elements.every(e=>refs.has(ref(e)))));
  for(const pkg of compatible){const o=node('option',`Atualizar: ${pkg.name}${pkg.elements.length?'':' — vincular seleção'}`);o.value=pkg.id;target.append(o);}target.value=compatible.some(p=>p.id===initial?.id)?initial!.id:'';
  const destination=node('label','Onde usar?');destination.append(target);body.append(destination);
  const defaultLocation=request.location||initial?.location||project.tasks.find(t=>refs.has(ref(t)))?.location||'Frente da seleção';
  const name=field('Nome do pacote',request.name||`${definition.title} — ${defaultLocation}`),location=field('Local / frente do pacote',defaultLocation);body.append(name.label,location.label);const start=field('Início — obrigatório sem datas deste serviço','','date'),finish=field('Término — obrigatório sem datas deste serviço','','date');body.append(start.label,finish.label);
  const impact=node('p','','fine');body.append(impact);const targetChanged=()=>{name.label.hidden=location.label.hidden=!!target.value;const pkg=project.packages.find(p=>p.id===target.value);impact.textContent=pkg?`O pacote “${pkg.name}” receberá ${definition.title.toLowerCase()} em ${definition.unit}, a seleção e sua origem. Nome, local e demais definições registradas serão preservados. Mudança de quantidade ou alcance exige rever as condições; recursos sem reserva deverão ser recompostos.`:'Será criado um pacote com os elementos e a quantificação deste serviço. Recursos e compromissos continuam em preparação.';};target.onchange=targetChanged;targetChanged();
  const reuse=node('input');reuse.type='checkbox';reuse.checked=allReviewed;reuse.disabled=!allReviewed;const reuseLabel=node('label','Usar conferências já registradas e vigentes','check');reuseLabel.prepend(reuse);if(allReviewed)body.append(reuseLabel);
  const review=node('div','','measure-transfer-review'),reviewer=field('Conferente do quantitativo'),evidence=field('Evidência / fonte da conferência'),method=field('Método da conferência'),manual=field(`Medida manual total (${definition.unit}) — opcional`,'','number');review.append(reviewer.label,evidence.label,method.label,manual.label);review.hidden=reuse.checked;reuse.onchange=()=>review.hidden=reuse.checked;body.append(review);
  body.append(button('Conferir e vincular ao pacote',()=>{
   try{
    if(hooks.getProject().id!==projectId)throw new Error('O projeto mudou. Abra a quantificação novamente.');
    const live=hooks.measures().filter(r=>r.serviceCode===code);if(JSON.stringify(live)!==JSON.stringify(rows))throw new Error('A seleção ou o cálculo mudou. Abra novamente para conferir o quantitativo atual.');
    const snapshots=reuse.checked?reviews.map(s=>structuredClone(s!)):reviewSelection(rows,{reviewer:reviewer.input.value,evidence:evidence.input.value,method:method.input.value},manual.input.value===''?undefined:Number(manual.input.value));let id='';
    hooks.change(p=>{id=applyPackageMeasurements(p,snapshots,target.value?{packageId:target.value}:{name:name.input.value,location:location.input.value,needDate:start.input.value,finishDate:finish.input.value});});close();hooks.complete(id);
   }catch(e){status.textContent=e instanceof Error?e.message:'Não foi possível herdar a quantificação.';status.hidden=false;status.scrollIntoView({block:'center'});}
  },'primary'));
 };
 service.onchange=render;render();dialog.oncancel=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
}
