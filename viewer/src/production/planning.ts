import {isEmptyConstraint,constraintCategories} from './constraints.ts';
import {hasConstraintEvidence,validateEvidenceImages} from './evidence-images.ts';
import type {Project,WorkPackage,Actual,Delivery} from './types.ts';
import {day,log,uid} from './project.ts';
import {resourceCoverage,quantificationNeedsReview,resourceWindowCurrent} from './resources.ts';
export function supplyBalance(demand:number|null,rows:{quantity:number;unit:string;confirmed:boolean}[],unit='m³'){
 if(demand!==null&&(!Number.isFinite(demand)||demand<0))throw new Error('Demanda inválida.');
 for(const r of rows)if(r.unit!==unit||!Number.isFinite(r.quantity)||r.quantity<0)throw new Error('Unidade ou quantidade incompatível.');
 const covered=rows.filter(x=>x.confirmed).reduce((n,r)=>n+r.quantity,0);
 return {covered,balance:demand===null?null:Math.max(0,demand-covered),excess:demand===null?0:Math.max(0,covered-demand)};
}
export function supplyWindow(need:string,lead:number,preparation:number){
 day(need);if(!Number.isInteger(lead)||lead<0||!Number.isInteger(preparation)||preparation<0)throw new Error('Prazo deve ser inteiro não negativo.');
 const subtract=(n:number)=>{const d=new Date(need+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10);};
 return {need,delivery:need,order:subtract(lead),start:subtract(lead+preparation)};
}
export function quoteTotal(quantity:number,unitPrice:number,freight:number){if([quantity,unitPrice,freight].some(x=>!Number.isFinite(x)||x<0))throw new Error('Cotação inválida.');return Math.round((quantity*unitPrice+freight)*100)/100;}
export function allocate(p:Project,packageId:string,supplyId:string,quantity:number){
 const s=p.supplies.find(x=>x.id===supplyId),pkg=p.packages.find(x=>x.id===packageId);
 if(!s||!pkg||s.quantity===null||!Number.isFinite(quantity)||quantity<=0)throw new Error('Confirme a quantidade antes de reservar.');
 if(s.unit!==pkg.unit||pkg.measureLinks?.length||p.resources.some(r=>r.packageId===packageId))throw new Error('Unidade ou fluxo de recurso incompatível. Use a reserva de recursos.');
 const used=[...p.allocations,...p.resourceAllocations].filter(a=>a.supplyId===supplyId).reduce((n,a)=>n+a.quantity,0);
 if(used+quantity>s.quantity+1e-8)throw new Error('Reserva excede a capacidade disponível do fornecimento.');
 const reserved=p.allocations.filter(a=>a.packageId===packageId).reduce((n,a)=>n+a.quantity-p.deliveries.filter(d=>d.allocationId===a.id).reduce((sum,d)=>sum+d.rejected,0),0);
 if(pkg.quantity===null||reserved+quantity>pkg.quantity+1e-8)throw new Error('Reserva excede a demanda do pacote. Libere reservas anteriores antes de substituir.');
 p.allocations.push({id:uid(),packageId,supplyId,quantity});log(p,'Reserva de fornecimento',`${quantity} ${s.unit} de ${s.name} para ${pkg.name}`);
}
export function packageBalance(p:Project,pkg:WorkPackage){const resources=p.resources.filter(r=>r.packageId===pkg.id);if(resources.length){const r=resources[0],b=resourceCoverage(p,r);return {covered:resources.length===1?b.covered:0,balance:pkg.coverageKnown?(resources.length===1?b.balance:resources.every(x=>resourceCoverage(p,x).balance<=1e-8)?0:null):null,excess:resources.length===1?b.excess:0};}return supplyBalance(pkg.coverageKnown?pkg.quantity:null,p.allocations.filter(a=>a.packageId===pkg.id).map(a=>{
 const s=p.supplies.find(s=>s.id===a.supplyId)!;
 const deliveries=p.deliveries.filter(d=>d.allocationId===a.id);
 if(deliveries.length)return {quantity:deliveries.filter(d=>d.date===pkg.needDate).reduce((n,d)=>n+d.received-d.rejected,0),unit:s.unit,confirmed:s.technical};
 return {quantity:a.quantity,unit:s.unit,confirmed:s.confirmed&&s.technical&&!!s.evidence.trim()&&s.delivery===pkg.needDate&&s.kind!=='stock'};
}),pkg.unit);}
export function assessReadiness(p:Project,pkg:WorkPackage){
 const reasons:string[]=[];const balance=packageBalance(p,pkg);
 if(!pkg.elements.length)reasons.push('Vincular elementos IFC por GlobalId.');
 if(!pkg.taskIds.length||pkg.elements.some(e=>!p.tasks.some(t=>t.modelId===e.modelId&&t.globalId===e.globalId))||pkg.taskIds.some(id=>!p.tasks.some(t=>t.id===id&&pkg.elements.some(e=>e.modelId===t.modelId&&e.globalId===t.globalId))))reasons.push('Conferir vínculos com tarefas reais do IFC.');
 if(pkg.reviewRequired)reasons.push('Conferir vínculos após revisão do modelo.');
 if(quantificationNeedsReview(p,pkg))reasons.push('Refazer conferência da quantificação após mudança de regra, taxa ou modelo.');
 if(pkg.measureLinks?.length&&!p.resources.some(r=>r.packageId===pkg.id))reasons.push('Compor o recurso do serviço e sua especificação.');
 for(const r of p.resources.filter(r=>r.packageId===pkg.id)){if(r.procurementBlockers.length||!r.specificationConfirmed)reasons.push('Conferir especificação de compra e método executivo.');if(!resourceWindowCurrent(p,r))reasons.push('Revalidar toda a janela do recurso após reprogramação, inclusive conclusão e ciclo.');}
 if(p.planning?.packages[pkg.id])for(const category of constraintCategories.slice(0,6))if(!p.planning.packages[pkg.id].notApplicable?.[category]&&!pkg.constraints.some(c=>c.category===category&&!isEmptyConstraint(c)))reasons.push('Analisar categoria: '+category);
 if(p.planning?.packages[pkg.id]?.origins.quantity?.mode==='auto')reasons.push('Conferir a quantidade automática do serviço.');
 if(!pkg.responsible.trim())reasons.push('Definir responsável.');
 if(!pkg.capacityConfirmed)reasons.push('Confirmar capacidade da equipe e equipamentos.');
 if(!pkg.criterion.trim())reasons.push('Definir critério de conclusão.');
 if(!pkg.constraints.length||pkg.constraints.some(c=>!((p.planning?.packages[pkg.id]?.notApplicable?.[c.category]&&isEmptyConstraint(c))||(c.resolved&&hasConstraintEvidence(c)&&c.reviewer.trim()))))reasons.push('Remover restrições com evidência e conferente.');
 if(pkg.quantity===null||pkg.quantity<=0)reasons.push('Quantidade precisa ser informada e positiva.');
 if(!pkg.quantitySource.trim())reasons.push('Registrar origem do quantitativo.');
 if(balance.balance===null)reasons.push('Quantidade ou cobertura existente ainda não conferida.');else if(balance.balance>1e-8)reasons.push(`Faltam ${balance.balance} ${pkg.unit} confirmados na janela.`);
 return {ready:reasons.length===0,reasons,balance};
}
export function resolveConstraint(p:Project,packageId:string,id:string,evidence:string,reviewer:string){
 const c=p.packages.find(x=>x.id===packageId)?.constraints.find(x=>x.id===id);if(!c)throw new Error('Restrição não encontrada.');
 if(c.attachments)validateEvidenceImages(c.attachments);if(!hasConstraintEvidence({...c,evidence})||!reviewer.trim())throw new Error('Informe evidência (texto ou print) e conferente.');
 Object.assign(c,{resolved:true,evidence:evidence.trim(),reviewer:reviewer.trim()});log(p,'Restrição removida',`${c.description} — ${reviewer}: ${evidence}`);
}
export function freezeWeek(p:Project,packageIds:string[],reviewer:string){
 if(p.week)throw new Error('Semana já congelada. Preserve o denominador original.');
 if(!reviewer.trim()||!packageIds.length||new Set(packageIds).size!==packageIds.length)throw new Error('Selecione pacotes e informe o conferente.');
 const packages=packageIds.map(id=>p.packages.find(x=>x.id===id));
 if(packages.some(x=>!x||!assessReadiness(p,x).ready))throw new Error('Existem pacotes sem condições para assumir compromisso.');
 p.week={frozenAt:new Date().toISOString(),reviewer,commitments:packages.map(x=>({packageId:x!.id,name:x!.name,location:x!.location,quantity:x!.quantity!,unit:x!.unit,deadline:x!.finishDate,criterion:x!.criterion,responsible:x!.responsible}))};log(p,'Semana congelada',`${packages.length} compromissos — ${reviewer}`);
}
export function recordActual(p:Project,id:string,actual:Omit<Actual,'packageId'>){
 const c=p.week?.commitments.find(x=>x.packageId===id);if(!c)throw new Error('Pacote fora da semana congelada.');day(actual.date);
 if(!actual.evidence.trim()||((!actual.complete||actual.date>c.deadline)&&!actual.reason.trim()))throw new Error('Informe evidência e causa do desvio.');
 const old=p.actuals.find(x=>x.packageId===id);log(p,'Apontamento',JSON.stringify({packageId:id,anterior:old??null,novo:actual}));
 if(old)Object.assign(old,actual);else p.actuals.push({packageId:id,...actual});
}
export function calculatePPC(p:Project){const commitments=p.week?.commitments??[];const completed=commitments.filter(c=>{const a=p.actuals.find(x=>x.packageId===c.packageId);return a?.complete&&a.date<=c.deadline&&!!a.evidence.trim();}).length;return {completed,total:commitments.length,percent:commitments.length?Math.round(completed/commitments.length*100):null};}
export function recordDelivery(p:Project,input:Omit<Delivery,'id'>){
 day(input.date);const a=[...p.allocations,...p.resourceAllocations].find(a=>a.id===input.allocationId);
 if(!a||!input.evidence.trim()||!input.reviewer.trim()||[input.received,input.rejected].some(x=>!Number.isFinite(x)||x<0)||input.rejected>input.received)throw new Error('Recebimento inválido. Confira quantidades, evidência e conferente.');
 const received=p.deliveries.filter(d=>d.allocationId===a.id).reduce((n,d)=>n+d.received,0);
 if(received+input.received>a.quantity+1e-8)throw new Error('Recebimentos excedem a quantidade reservada.');
 p.deliveries.push({id:uid(),...input});log(p,'Recebimento conferido',`${input.received-input.rejected} ${p.supplies.find(s=>s.id===a.supplyId)?.unit} liberados; ${input.rejected} rejeitados em ${input.date}. ${input.reviewer}: ${input.evidence}`);
}
