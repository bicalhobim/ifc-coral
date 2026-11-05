import type {Project,WorkPackage} from './types.ts';
import type {MeasureSnapshot} from '../quantification/review.ts';
import type {ServiceCode} from '../quantification/types.ts';
import {isReviewCurrent} from '../quantification/review.ts';
import {createManualPackage} from './package-management.ts';
import {day,validateProject,log} from './project.ts';
export const measuredServices:Record<ServiceCode,{title:string;unit:WorkPackage['unit'];phase:RegExp}>={concrete:{title:'Concretagem',unit:'m³',phase:/concret|concrete/i},reinforcement:{title:'Armação',unit:'kg',phase:/arma|reinforce/i},formwork:{title:'Montagem de fôrmas',unit:'m²',phase:/f[oôó]rma|formwork/i}};
const identity=(e:{modelId:string;globalId:string})=>JSON.stringify([e.modelId,e.globalId]);
export function applyPackageMeasurements(p:Project,rows:MeasureSnapshot[],options:{packageId?:string;name?:string;location?:string;needDate?:string;finishDate?:string}):string{
 if(!rows.length||new Set(rows.map(s=>s.measure.id)).size!==rows.length)throw new Error('Confira um serviço completo, sem medições duplicadas.');
 const service=rows[0].measure.serviceCode,definition=measuredServices[service];if(!definition)throw new Error('Serviço de quantificação inválido.');
 for(const s of rows){const model=p.models.find(m=>m.id===s.measure.elementRef.modelId);if(s.measure.serviceCode!==service||s.measure.unit!==definition.unit||!Number.isFinite(s.amount)||s.amount<0||!s.reviewer.trim()||!s.evidence.trim()||!s.method.trim()||!isReviewCurrent(s,s.measure)||model?.hash!==s.measure.elementRef.modelHash||p.quantificationCatalog&&JSON.stringify(p.quantificationCatalog.find(r=>r.id===s.measure.ruleId))!==JSON.stringify(s.measure.ruleSnapshot))throw new Error('Conferência desatualizada, incompleta ou de outra revisão. Refaça a quantificação da seleção.');}
 const refs=rows.map(s=>({modelId:s.measure.elementRef.modelId,globalId:s.measure.elementRef.globalId})),wanted=new Set(refs.map(identity));if(wanted.size!==rows.length)throw new Error('Elementos duplicados na quantificação.');
 const total=rows.reduce((n,s)=>n+s.amount,0);if(!Number.isFinite(total)||total<=0)throw new Error('O quantitativo conferido deve ser maior que zero.');
 const old=options.packageId?p.packages.find(pkg=>pkg.id===options.packageId):undefined;if(options.packageId&&!old)throw new Error('Pacote não encontrado.');
 if(old){
  if(p.week?.commitments.some(c=>c.packageId===old.id)||p.actuals.some(a=>a.packageId===old.id))throw new Error('Compromisso congelado ou realizado: preserve o quantitativo e os vínculos.');
  if(old.unit!==definition.unit||old.serviceCode&&old.serviceCode!==service)throw new Error('Serviço e unidade incompatíveis. Crie um pacote próprio para este serviço.');
  if(old.elements.length&&(old.elements.length!==wanted.size||old.elements.some(e=>!wanted.has(identity(e)))))throw new Error('O pacote contém outra seleção. Selecione seus elementos ou crie um novo pacote.');
  const requirements=p.resources.filter(r=>r.packageId===old.id);if(p.allocations.some(a=>a.packageId===old.id)||p.resourceAllocations.some(a=>requirements.some(r=>r.id===a.requirementId)))throw new Error('Libere as reservas do pacote antes de alterar a quantificação.');
 }
 if(p.packages.some(pkg=>pkg.id!==old?.id&&(pkg.serviceCode??({'m³':'concrete',kg:'reinforcement','m²':'formwork'} as Record<string,string>)[pkg.unit])===service&&pkg.elements.some(e=>wanted.has(identity(e)))))throw new Error('Já existe pacote deste serviço para elementos da seleção. Use o pacote existente.');
 for(const s of rows){const previous=p.measures.find(m=>m.measure.id===s.measure.id);if(previous?.fingerprint===s.fingerprint&&previous.amount!==s.amount&&p.packages.some(pkg=>pkg.id!==old?.id&&pkg.measureLinks?.some(l=>l.id===s.measure.id&&l.fingerprint===s.fingerprint)))throw new Error('A medição manual já está vinculada a outro pacote. Preserve a origem e revise esse pacote primeiro.');}
 const candidate=structuredClone(p);const allTasks=candidate.tasks.filter(t=>wanted.has(identity(t))),matching=allTasks.filter(t=>definition.phase.test(t.name)),tasks=matching;
 if(!old&&!tasks.length){if(!options.needDate||!options.finishDate)throw new Error('Sem datas deste serviço no IFC. Informe início e término do pacote.');day(options.needDate);day(options.finishDate);if(options.finishDate<options.needDate)throw new Error('Término anterior ao início.');}
 const pkg=old?candidate.packages.find(x=>x.id===old.id)!:createManualPackage(candidate,{name:options.name?.trim()||`${definition.title} — ${options.location?.trim()||tasks[0]?.location||'Seleção'}`,location:options.location?.trim()||tasks[0]?.location||'Frente da seleção',service:definition.title,unit:definition.unit});
 const changed=old&&(old.quantity!==total||old.elements.length!==wanted.size||old.serviceCode&&old.serviceCode!==service);
 if(changed){pkg.constraints.forEach(c=>c.resolved=false);pkg.capacityConfirmed=false;pkg.coverageKnown=false;}
 if(!old&&!tasks.length){pkg.needDate=options.needDate!;pkg.finishDate=options.finishDate!;log(candidate,'Datas manuais do pacote',pkg.name);}
 if(!old&&tasks.length){pkg.needDate=tasks.map(t=>t.start).sort()[0];pkg.finishDate=tasks.map(t=>t.finish).sort().at(-1)!;}
 const sources=[...new Set(rows.map(s=>`${s.reviewer}: ${s.method} · ${s.evidence}`))].join('; ');
 Object.assign(pkg,{service:definition.title,serviceCode:service,elements:refs,taskIds:tasks.map(t=>t.id),quantity:total,unit:definition.unit,quantitySource:`Conferência da quantificação · ${rows.length} elementos · ${sources}`,measureLinks:rows.map(s=>({id:s.measure.id,fingerprint:s.fingerprint})),reviewRequired:false});
 if(old)candidate.resources=candidate.resources.filter(r=>r.packageId!==old.id);
 for(const s of rows){const previous=candidate.measures.find(m=>m.measure.id===s.measure.id);if(previous&&(previous.fingerprint!==s.fingerprint||previous.amount!==s.amount)){
   candidate.measureHistory??=[];if(!candidate.measureHistory.some(h=>h.measure.id===previous.measure.id&&h.fingerprint===previous.fingerprint&&h.amount===previous.amount))candidate.measureHistory.push(structuredClone(previous));
   candidate.packages.filter(x=>x.id!==pkg.id&&x.measureLinks?.some(l=>l.id===previous.measure.id)).forEach(x=>x.reviewRequired=true);
  }candidate.measures=candidate.measures.filter(m=>m.measure.id!==s.measure.id);candidate.measures.push(structuredClone(s));}
 log(candidate,'Quantificação herdada pelo pacote',`${pkg.name}: ${total} ${definition.unit} · ${rows.length} elementos · ${old?'pacote atualizado':'novo pacote'}${changed?' · condições reabertas para conferência':''}`);validateProject(candidate);Object.assign(p,candidate);return pkg.id;
}
