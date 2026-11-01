import {defaultConstraints} from './constraints.ts';
import type {Project,WorkPackage,ResourceRequirement} from './types.ts';
import {uid,log,validateProject} from './project.ts';
export function createManualPackage(p:Project,input:{name:string;location:string;service:string;unit?:WorkPackage['unit']}):WorkPackage {
 if(!input.name.trim()||!input.location.trim()||!input.service.trim())throw new Error('Informe nome, local e serviço do pacote.');
 const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const pkg:WorkPackage={id:uid(),name:input.name.trim(),location:input.location.trim(),service:input.service.trim(),elements:[],taskIds:[],quantity:null,unit:input.unit??'m³',quantitySource:'Quantidade a conferir',coverageKnown:false,needDate:today,finishDate:today,criterion:'',responsible:'',capacityConfirmed:false,constraints:defaultConstraints(),reviewRequired:false};
 p.packages.push(pkg);log(p,'Pacote criado',pkg.name);return pkg;
}
export type RemovedPackage={package:WorkPackage;resources:ResourceRequirement[];index:number};
export function packageDeletionBlock(p:Project,id:string):string {
 if(p.week?.commitments.some(c=>c.packageId===id))return 'Este pacote possui compromisso congelado. Preserve o histórico e o PPC.';
 if(p.actuals.some(a=>a.packageId===id))return 'Este pacote possui realizado registrado.';
 const resources=p.resources.filter(r=>r.packageId===id);
 if(p.allocations.some(a=>a.packageId===id)||p.resourceAllocations.some(a=>resources.some(r=>r.id===a.requirementId)))return 'Este pacote possui reserva de fornecimento. Libere as reservas antes de excluir.';
 if(p.supplyPlans?.some(s=>s.entries.some(e=>e.packageIds.includes(id))))return 'Este pacote integra um mapa de suprimentos confirmado. Preserve o histórico.';
 return '';
}
export function deletePackage(p:Project,id:string):RemovedPackage {
 const index=p.packages.findIndex(pkg=>pkg.id===id);if(index<0)throw new Error('Pacote não encontrado.');
 const reason=packageDeletionBlock(p,id);if(reason)throw new Error(reason);
 const removed=structuredClone({package:p.packages[index],resources:p.resources.filter(r=>r.packageId===id),index});
 p.packages.splice(index,1);p.resources=p.resources.filter(r=>r.packageId!==id);log(p,'Pacote excluído',removed.package.name);return removed;
}
export function restorePackage(p:Project,removed:RemovedPackage){
 if(p.packages.some(pkg=>pkg.id===removed.package.id)||removed.resources.some(r=>p.resources.some(q=>q.id===r.id)))throw new Error('O pacote ou recurso já existe.');
 if(removed.package.elements.some(e=>!p.models.some(m=>m.id===e.modelId)))throw new Error('O modelo do pacote foi removido. Reabra a revisão original antes de desfazer.');
 const candidate=structuredClone(p);candidate.packages.splice(Math.min(removed.index,candidate.packages.length),0,structuredClone(removed.package));candidate.resources.push(...structuredClone(removed.resources));validateProject(candidate);
 p.packages=candidate.packages;p.resources=candidate.resources;log(p,'Exclusão desfeita',removed.package.name);
}
