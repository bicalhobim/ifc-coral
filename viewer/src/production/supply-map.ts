import type {Project,ResourceRequirement,Commitment} from './types.ts';
import type {MeasureUnit} from '../quantification/types.ts';
import {resourceCoverage,quantificationNeedsReview} from './resources.ts';
import {supplyWindow} from './planning.ts';
import {log,uid} from './project.ts';
export type SupplyMapEntry={id:string;resourceCode:string;specification:string;unit:MeasureUnit;location:string;resourceIds:string[];packageIds:string[];quantity:number;balance:number|null;reusable:boolean;needDate:string;receiptDate:string;orderDate:string;startDate:string;occupiedUntil:string;blockers:string[];promisedDates:string[];frozenCommitments:Commitment[]};
export type SupplyPlanSnapshot={id:string;at:string;reviewer:string;evidence:string;fingerprint:string;entries:SupplyMapEntry[]};
export function buildSupplyMap(p:Project):SupplyMapEntry[]{
 const groups=new Map<string,ResourceRequirement[]>();
 for(const r of p.resources){const pkg=p.packages.find(x=>x.id===r.packageId)!;const key=JSON.stringify([r.resourceCode,r.specification,r.unit,pkg.location,r.reusable?'reusable':r.needDate]);const rows=groups.get(key)??[];rows.push(r);groups.set(key,rows);}
 return [...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,rows])=>{
  const first=rows[0],packages=rows.map(r=>p.packages.find(pkg=>pkg.id===r.packageId)!);const points=rows.flatMap(r=>[r.from,r.to]);
  const peak=(value:(r:ResourceRequirement)=>number)=>Math.max(0,...points.map(date=>rows.filter(r=>r.from<=date&&r.to>=date).reduce((n,r)=>n+value(r),0)));
  const quantity=first.reusable?peak(r=>r.quantity):rows.reduce((n,r)=>n+r.quantity,0);const known=packages.every(pkg=>pkg.coverageKnown);
  const balance=known?(first.reusable?peak(r=>resourceCoverage(p,r).balance):rows.reduce((n,r)=>n+resourceCoverage(p,r).balance,0)):null;
  const windows=rows.map(r=>supplyWindow(r.needDate,r.leadDays,r.preparationDays));const earliest=(dates:string[])=>dates.sort()[0];
  const blockers=rows.flatMap(r=>[...r.procurementBlockers,...(!r.specificationConfirmed?['Confirmar especificação de compra.']:[])]);
  if(!known)blockers.push('Conferir estoque, pedidos e cobertura existente.');
  for(const pkg of packages){if(pkg.reviewRequired||quantificationNeedsReview(p,pkg))blockers.push('Revalidar quantificação e vínculos IFC.');if(rows.some(r=>r.packageId===pkg.id&&r.needDate!==pkg.needDate))blockers.push('Recompor janela após reprogramação da produção.');}
  const ids=rows.map(r=>r.id).sort(),packageIds=[...new Set(rows.map(r=>r.packageId))].sort();
  const promisedDates=p.resourceAllocations.filter(a=>ids.includes(a.requirementId)).map(a=>p.supplies.find(s=>s.id===a.supplyId)?.delivery).filter((d):d is string=>!!d);
  return {id:key,resourceCode:first.resourceCode,specification:first.specification,unit:first.unit,location:packages[0].location,resourceIds:ids,packageIds,quantity,balance,reusable:first.reusable,needDate:earliest(rows.map(r=>r.needDate)),receiptDate:earliest(windows.map(w=>w.delivery)),orderDate:earliest(windows.map(w=>w.order)),startDate:earliest(windows.map(w=>w.start)),occupiedUntil:rows.map(r=>r.to).sort().at(-1)!,blockers:[...new Set(blockers)].sort(),promisedDates:[...new Set(promisedDates)].sort(),frozenCommitments:structuredClone(p.week?.commitments.filter(c=>packageIds.includes(c.packageId))??[])};
 });
}
export function confirmSupplyMap(p:Project,rows:SupplyMapEntry[],reviewer:string,evidence:string){
 const current=buildSupplyMap(p);if(JSON.stringify(current)!==JSON.stringify(rows))throw new Error('Mapa alterado; atualize a prévia.');
 if(!rows.length||rows.some(r=>r.blockers.length)||p.packages.some(pkg=>pkg.measureLinks?.length&&!p.resources.some(r=>r.packageId===pkg.id)))throw new Error('Mapa com pendências ou bloqueios.');
 if(!reviewer.trim()||!evidence.trim())throw new Error('Informe conferente e evidência do mapa.');
 const snapshot:SupplyPlanSnapshot={id:uid(),at:new Date().toISOString(),reviewer:reviewer.trim(),evidence:evidence.trim(),fingerprint:JSON.stringify(rows),entries:structuredClone(rows)};
 (p.supplyPlans??=[]).push(snapshot);log(p,'Mapa de suprimentos conferido',`${rows.length} pacotes de fornecimento; não é pedido emitido.`);return snapshot;
}
