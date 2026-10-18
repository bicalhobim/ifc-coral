import type {Project,WorkPackage,ResourceRequirement,Supply} from './types.ts';
import type {MeasureSnapshot} from '../quantification/review.ts';
import {isReviewCurrent} from '../quantification/review.ts';
import type {ServiceCode} from '../quantification/types.ts';
import {day,uid,log} from './project.ts';
export type PackagePreview=WorkPackage&{snapshots:MeasureSnapshot[]};
const titles:Record<ServiceCode,string>={concrete:'Concretagem',reinforcement:'Armação',formwork:'Montagem de fôrmas'};
const phases:Record<ServiceCode,RegExp>={concrete:/concret|concrete/i,reinforcement:/arma|reinforce/i,formwork:/f[oôó]rma|formwork/i};
const serviceOf=(pkg:WorkPackage)=>pkg.serviceCode??(pkg.unit==='m³'?'concrete':pkg.unit==='kg'?'reinforcement':'formwork');
function overlapPackages(p:Project,pkg:WorkPackage,extra:WorkPackage[]=[]){if([...p.packages,...extra].some(old=>serviceOf(old)===serviceOf(pkg)&&old.elements.some(a=>pkg.elements.some(b=>a.modelId===b.modelId&&a.globalId===b.globalId))))throw new Error('Sobreposição de elementos no mesmo serviço. Revise o pacote existente.');}
export function previewPackages(p:Project,rows:MeasureSnapshot[]):PackagePreview[]{
 if(!rows.length||new Set(rows.map(r=>r.measure.id)).size!==rows.length)throw new Error('Seleção de conferências vazia ou duplicada.');const groups=new Map<string,MeasureSnapshot[]>();
 for(const s of rows){const m=s.measure,model=p.models.find(x=>x.id===m.elementRef.modelId);if(!isReviewCurrent(s,m)||!s.evidence.trim()||!s.reviewer.trim()||s.amount<=0||model?.hash!==m.elementRef.modelHash||p.measures.some(x=>x.measure.id===m.id&&x.fingerprint!==s.fingerprint))throw new Error('Conferência ausente, alterada ou de outra revisão.');const t=p.tasks.find(t=>t.modelId===model.id&&t.globalId===m.elementRef.globalId);if(!t)throw new Error('Elemento sem tarefa IFC.');const key=JSON.stringify([model.id,t.location,m.serviceCode]);const group=groups.get(key)??[];group.push(s);groups.set(key,group);}
 const preview:PackagePreview[]=[];
 for(const snapshots of groups.values()){const s=snapshots[0],service=s.measure.serviceCode,elements=snapshots.map(x=>({modelId:x.measure.elementRef.modelId,globalId:x.measure.elementRef.globalId}));const all=p.tasks.filter(t=>elements.some(e=>e.modelId===t.modelId&&e.globalId===t.globalId));const phased=all.filter(t=>phases[service].test(t.name));const tasks=phased.length?phased:all;const need=tasks.map(t=>t.start).sort()[0],finish=tasks.map(t=>t.finish).sort().at(-1)!;
  const pkg:PackagePreview={id:uid(),name:`${titles[service]} — ${tasks[0].location}`,location:tasks[0].location,service:titles[service],serviceCode:service,elements,taskIds:tasks.map(t=>t.id),quantity:snapshots.reduce((n,x)=>n+x.amount,0),unit:s.measure.unit,quantitySource:`Conferência humana: ${snapshots.map(s=>s.reviewer+': '+s.evidence).join('; ')}`,coverageKnown:false,needDate:need,finishDate:finish,criterion:'',responsible:'',capacityConfirmed:false,reviewRequired:false,measureLinks:snapshots.map(x=>({id:x.measure.id,fingerprint:x.fingerprint})),constraints:['Projeto e método','Frente e predecessoras','Equipe e equipamento','Recurso e janela'].map(description=>({id:uid(),category:description,description,resolved:false,evidence:'',reviewer:''})),snapshots:structuredClone(snapshots)};
  overlapPackages(p,pkg,preview);preview.push(pkg);
 }return preview;
}
export function createPackages(p:Project,preview:PackagePreview[]){
 const checked=previewPackages(p,preview.flatMap(x=>x.snapshots));
 if(checked.length!==preview.length||checked.some(c=>!preview.some(x=>x.serviceCode===c.serviceCode&&x.location===c.location&&x.quantity===c.quantity&&x.unit===c.unit&&JSON.stringify(x.measureLinks)===JSON.stringify(c.measureLinks))))throw new Error('Prévia alterada; gere novamente.');
 for(const item of checked){const {snapshots,...pkg}=item;overlapPackages(p,pkg);p.packages.push(structuredClone(pkg));for(const s of snapshots){p.measures=p.measures.filter(x=>x.measure.id!==s.measure.id);p.measures.push(structuredClone(s));}}
 log(p,'Pacotes de produção criados',`${preview.length} serviços conferidos; recursos ainda exigem composição e especificação.`);
}
export type Composition={resourceCode:string;specification:string;specificationConfirmed?:boolean;factor:number;lossPercent:number;leadDays:number;preparationDays:number;reusable:boolean;cycleDays:number;evidence:string};
export function composeResource(p:Project,id:string,c:Composition):ResourceRequirement{
 const pkg=p.packages.find(x=>x.id===id);if(!pkg||pkg.quantity===null||pkg.quantity<=0)throw new Error('Pacote sem quantidade conferida.');
 if(!c.specification.trim()||!c.evidence.trim()||!Number.isFinite(c.factor)||c.factor<=0||!Number.isFinite(c.lossPercent)||c.lossPercent<0||c.lossPercent>100||[c.leadDays,c.preparationDays,c.cycleDays].some(n=>!Number.isInteger(n)||n<0)||c.reusable&&c.cycleDays<1)throw new Error('Confira especificação, composição, perdas, ciclo e prazos.');
 const expected={concrete:'concrete',reinforcement:'steel',formwork:'panels'}[serviceOf(pkg)];if(c.resourceCode!==expected||expected==='panels'&&!c.reusable)throw new Error('Recurso incompatível com o serviço. Painéis exigem ciclo de reutilização.');
 const old=p.resources.find(r=>r.packageId===id);if(old&&p.resourceAllocations.some(a=>a.requirementId===old.id))throw new Error('Recurso reservado: preserve a composição e libere reservas antes de alterar.');
 const until=new Date(pkg.needDate+'T12:00:00Z');until.setUTCDate(until.getUTCDate()+Math.max(0,c.cycleDays-1));
 const blockers=c.specificationConfirmed?[]:[expected==='steel'?'Conferir projeto/BBS: bitolas, comprimentos e dobras.':'Confirmar especificação e método executivo.'];
 const r:ResourceRequirement={id:old?.id??uid(),packageId:id,resourceCode:c.resourceCode,specification:c.specification.trim(),specificationConfirmed:c.specificationConfirmed===true,quantity:pkg.quantity*c.factor*(1+c.lossPercent/100),unit:pkg.unit,needDate:pkg.needDate,from:pkg.needDate,to:c.reusable?[until.toISOString().slice(0,10),pkg.finishDate].sort().at(-1)!:pkg.needDate,factor:c.factor,lossPercent:c.lossPercent,leadDays:c.leadDays,preparationDays:c.preparationDays,reusable:c.reusable,cycleDays:c.cycleDays,evidence:c.evidence.trim(),procurementBlockers:blockers};
 p.resources=p.resources.filter(x=>x.id!==r.id);p.resources.push(r);log(p,'Composição de recurso registrada',`${pkg.name}: ${r.quantity} ${r.unit} · ${r.specification}`);return r;
}
export const compatible=(r:ResourceRequirement,s:Supply)=>r.unit===s.unit&&r.resourceCode===s.resourceCode&&r.specification===s.specification&&r.reusable===(s.reusable===true);
export function currentResourceWindow(p:Project,r:ResourceRequirement){const pkg=p.packages.find(pkg=>pkg.id===r.packageId);if(!pkg)throw new Error('Recurso sem pacote.');const until=new Date(pkg.needDate+'T12:00:00Z');until.setUTCDate(until.getUTCDate()+Math.max(0,r.cycleDays-1));return {from:pkg.needDate,to:r.reusable?[until.toISOString().slice(0,10),pkg.finishDate].sort().at(-1)!:pkg.needDate};}
export function resourceWindowCurrent(p:Project,r:ResourceRequirement){const window=currentResourceWindow(p,r);return r.needDate===window.from&&r.from===window.from&&r.to===window.to;}
export function packageMeasureBindingValid(p:Project,pkg:WorkPackage){
 if(!pkg.measureLinks?.length)return true;
 if(!pkg.serviceCode||new Set(pkg.measureLinks.map(l=>l.id)).size!==pkg.measureLinks.length)return false;
 const rows=pkg.measureLinks.map(l=>[...p.measures,...p.measureHistory??[]].find(s=>s.measure.id===l.id&&s.fingerprint===l.fingerprint));
 if(rows.some(s=>!s||s.measure.unit!==pkg.unit||s.measure.serviceCode!==pkg.serviceCode)||rows.length!==pkg.elements.length)return false;
 const identity=(e:{modelId:string;globalId:string})=>JSON.stringify([e.modelId,e.globalId]);const wanted=new Set(pkg.elements.map(identity));
 return wanted.size===rows.length&&rows.every(s=>wanted.has(identity(s!.measure.elementRef)))&&Math.abs(rows.reduce((n,s)=>n+s!.amount,0)-(pkg.quantity??0))<=1e-8;
}
export function quantificationNeedsReview(p:Project,pkg:WorkPackage){
 if(!packageMeasureBindingValid(p,pkg))return true;
 if(!pkg.measureLinks?.length)return false;
 const snapshots=pkg.measureLinks.map(l=>p.measures.find(s=>s.measure.id===l.id&&s.fingerprint===l.fingerprint));
 return snapshots.some(s=>!s||p.models.find(m=>m.id===s.measure.elementRef.modelId)?.hash!==s.measure.elementRef.modelHash||p.quantificationCatalog&&JSON.stringify(p.quantificationCatalog.find(r=>r.id===s.measure.ruleId))!==JSON.stringify(s.measure.ruleSnapshot))||Math.abs(snapshots.reduce((n,s)=>n+(s?.amount??0),0)-(pkg.quantity??0))>1e-8;
}
export function refreshPackageMeasures(p:Project,id:string){
 const pkg=p.packages.find(x=>x.id===id);if(!pkg?.measureLinks?.length)throw new Error('Pacote sem conferências de origem.');
 if(p.week?.commitments.some(c=>c.packageId===id))throw new Error('Compromisso congelado: preserve seu quantitativo.');
 const rows=pkg.measureLinks.map(l=>p.measures.find(s=>s.measure.id===l.id));if(rows.some(s=>!s))throw new Error('Conferências incompletas.');const proposed={...pkg,measureLinks:rows.map(s=>({id:s!.measure.id,fingerprint:s!.fingerprint})),quantity:rows.reduce((n,s)=>n+s!.amount,0)};
 if(quantificationNeedsReview(p,proposed))throw new Error('Refaça a conferência da quantificação, método e revisão IFC.');
 const requirements=p.resources.filter(r=>r.packageId===id);if(p.resourceAllocations.some(a=>requirements.some(r=>r.id===a.requirementId)))throw new Error('Libere reservas antes de atualizar a medida.');
 p.resources=p.resources.filter(r=>r.packageId!==id);Object.assign(pkg,proposed,{reviewRequired:false,quantitySource:'Conferência humana atualizada: '+rows.map(s=>s!.evidence).join('; ')});log(p,'Quantificação atualizada por conferência',pkg.name);
}
const coversWindow=(r:ResourceRequirement,s:Supply)=>r.resourceCode==='concrete'?s.delivery===r.needDate&&s.kind!=='stock':s.delivery<=r.from&&(!r.reusable||!!s.availableUntil&&s.availableUntil>=r.to);
export function resourceCoverage(p:Project,r:ResourceRequirement){
 if(!resourceWindowCurrent(p,r))return {covered:0,balance:r.quantity,excess:0};
 let covered=0;for(const a of p.resourceAllocations.filter(x=>x.requirementId===r.id)){const s=p.supplies.find(x=>x.id===a.supplyId);if(!s||!compatible(r,s)||!s.confirmed||!s.technical||!s.evidence.trim()||!coversWindow(r,s))continue;const ds=p.deliveries.filter(d=>d.allocationId===a.id);covered+=ds.length?ds.filter(d=>r.resourceCode==='concrete'?d.date===r.needDate:d.date<=r.from).reduce((n,d)=>n+d.received-d.rejected,0):a.quantity;}
 return {covered,balance:Math.max(0,r.quantity-covered),excess:Math.max(0,covered-r.quantity)};
}
function checkCapacity(p:Project,s:Supply,addition?:{requirementId:string;quantity:number}){
 const rows=p.resourceAllocations.filter(a=>a.supplyId===s.id).map(a=>({r:p.resources.find(r=>r.id===a.requirementId)!,quantity:a.quantity}));if(addition)rows.push({r:p.resources.find(r=>r.id===addition.requirementId)!,quantity:addition.quantity});const legacy=p.allocations.filter(a=>a.supplyId===s.id).reduce((n,a)=>n+a.quantity,0);
 const intervals=rows.map(x=>({...x,window:currentResourceWindow(p,x.r)}));const points=intervals.flatMap(x=>[x.window.from,x.window.to]);const peak=s.reusable?Math.max(0,...points.map(date=>intervals.filter(x=>x.window.from<=date&&x.window.to>=date).reduce((n,x)=>n+x.quantity,legacy))):rows.reduce((n,x)=>n+x.quantity,legacy);
 if(peak>(s.quantity??0)+1e-8)throw new Error('Reserva excede a capacidade disponível do recurso.');
}
export function reserveResource(p:Project,id:string,supplyId:string,quantity:number){
 const r=p.resources.find(x=>x.id===id),s=p.supplies.find(x=>x.id===supplyId);if(!r||!s||!compatible(r,s))throw new Error('Recurso, especificação ou unidade incompatível.');
 if(r.procurementBlockers.length||!r.specificationConfirmed)throw new Error('Especificação de compra pendente.');
 if(!resourceWindowCurrent(p,r))throw new Error('Recompor a janela de utilização antes de reservar.');
 if(!Number.isFinite(quantity)||quantity<=0)throw new Error('Quantidade inválida.');
 checkCapacity(p,s,{requirementId:id,quantity});const reserved=p.resourceAllocations.filter(a=>a.requirementId===id).reduce((n,a)=>n+a.quantity-p.deliveries.filter(d=>d.allocationId===a.id).reduce((n,d)=>n+d.rejected,0),0);if(reserved+quantity>r.quantity+1e-8)throw new Error('Reserva excede a demanda do recurso.');
 p.resourceAllocations.push({id:uid(),requirementId:id,supplyId,quantity});log(p,'Recurso reservado',`${quantity} ${r.unit}: ${r.specification}`);
}
export function checkResourceGraph(p:Project){
 for(const r of p.resources){day(r.from);day(r.to);const pkg=p.packages.find(x=>x.id===r.packageId);if(!pkg||r.to<r.from||r.unit!==pkg.unit||!r.specification.trim()||r.quantity<0||r.factor<=0||r.lossPercent>100||[r.leadDays,r.preparationDays,r.cycleDays].some(n=>!Number.isInteger(n))||r.reusable&&r.cycleDays<1||r.resourceCode!=={concrete:'concrete',reinforcement:'steel',formwork:'panels'}[serviceOf(pkg)]||Math.abs(r.quantity-(pkg.quantity??0)*r.factor*(1+r.lossPercent/100))>1e-7)throw new Error('Composição de recurso inválida.');
  const reserved=p.resourceAllocations.filter(a=>a.requirementId===r.id).reduce((n,a)=>n+a.quantity-p.deliveries.filter(d=>d.allocationId===a.id).reduce((n,d)=>n+d.rejected,0),0);if(reserved>r.quantity+1e-8)throw new Error('Reservas excedem demanda do recurso.');}
 for(const a of p.resourceAllocations){const r=p.resources.find(x=>x.id===a.requirementId),s=p.supplies.find(x=>x.id===a.supplyId);if(!r||!s||!compatible(r,s)||a.quantity<=0)throw new Error('Reserva de recurso incompatível.');}
 for(const s of p.supplies)checkCapacity(p,s);
}
