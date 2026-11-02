import type {Project,ModelRevision} from './types.ts';
import {migrateV1} from './migrations.ts';
import {isReviewCurrent} from '../quantification/review.ts';
import {checkResourceGraph,packageMeasureBindingValid} from './resources.ts';
import {validateEvidenceImages,hasConstraintEvidence,MAX_PROJECT_IMAGE_BYTES} from './evidence-images.ts';
export const uid=()=>crypto.randomUUID();
export function log(p:Project,action:string,detail:string){p.audit.push({at:new Date().toISOString(),action,detail});}
export function createProject():Project{return {schema:2,id:uid(),name:'Novo projeto',models:[],tasks:[],packages:[],supplies:[],allocations:[],deliveries:[],week:null,actuals:[],audit:[],measures:[],resources:[],resourceAllocations:[]};}
export function registerModel(p:Project,m:ModelRevision):'new'|'same'|'revision'{
 const old=p.models.find(x=>x.id===m.id);
 if(old?.hash===m.hash)return 'same';
 if(old){for(const pkg of p.packages)if(pkg.elements.some(x=>x.modelId===m.id))pkg.reviewRequired=true;Object.assign(old,m);log(p,'Revisão IFC',`${m.name}: vínculos exigem conferência humana`);return 'revision';}
 p.models.push(m);log(p,'Modelo importado',m.name);return 'new';
}
export function day(value:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Data inválida; use AAAA-MM-DD.');
 const d=new Date(value+'T12:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==value)throw new Error('Data inexistente.');return value;
}
// Schema explícito: importações não podem injetar estado de runtime, chaves ou novos campos.
type Rule=(v:unknown)=>void;
const fail=():never=>{throw new Error('Projeto inválido: confira estrutura, datas, vínculos e valores.');};
const txt:Rule=v=>{if(typeof v!=='string'||v.length>20000)fail();};
const bool:Rule=v=>{if(typeof v!=='boolean')fail();};
const pos:Rule=v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0)fail();};
const date:Rule=v=>{txt(v);day(v as string);};
const literal=(...values:unknown[]):Rule=>v=>{if(!values.includes(v))fail();};
const nullable=(r:Rule):Rule=>v=>{if(v!==null)r(v);};
const list=(r:Rule):Rule=>v=>{if(!Array.isArray(v)||v.length>100000)fail();(v as unknown[]).forEach(r);};
const obj=(rules:Record<string,Rule>,optional:Record<string,Rule>={}):Rule=>v=>{if(!v||typeof v!=='object'||Array.isArray(v))fail();const o=v as Record<string,unknown>,all={...rules,...optional};if(Object.keys(o).some(k=>!Object.hasOwn(all,k))||Object.keys(rules).some(k=>!Object.hasOwn(o,k)))fail();for(const [key,rule]of Object.entries(all))if(Object.hasOwn(o,key))rule(o[key]);};
const ref=obj({modelId:txt,globalId:txt});
const constraint=obj({id:txt,category:txt,description:txt,resolved:bool,evidence:txt,reviewer:txt},{scope:literal('package','elements'),elements:list(ref),owner:txt,dueDate:date,action:txt,attachments:validateEvidenceImages,aiOrigin:obj({provider:literal('codex','openai','gemini'),model:txt,generatedAt:txt,reviewedAt:txt,reviewer:txt,reason:txt,basis:list(txt)})});
const unit=literal('m³','kg','m²'),service=literal('concrete','reinforcement','formwork');
const jsonData:Rule=v=>{if(JSON.stringify(v).length>50000)fail();};
const quantRule=obj({id:txt,version:txt,label:txt,ifcClass:txt,priority:pos,steelRate:nullable(pos),formMethod:nullable(txt),source:txt,status:literal('draft')},{predefinedType:txt,typePattern:txt});
const measureRule=obj({id:txt,elementRef:obj({modelId:txt,modelHash:txt,globalId:txt,ifcClass:txt,predefinedType:txt,typeName:txt,properties:jsonData}),serviceCode:service,ruleId:txt,ruleVersion:txt,ruleSnapshot:quantRule,inputs:jsonData,amount:nullable(pos),unit,origin:literal('declared','geometric','estimated'),status:literal('draft','pending'),pendingReasons:list(txt),evidence:list(txt)},{classificationOverride:obj({author:txt,reason:txt})});
const snapshotRule=obj({measure:measureRule,fingerprint:txt,amount:pos,reviewOrigin:literal('calculated','manual'),reviewer:txt,at:txt,method:txt,evidence:txt});
const packageFields={id:txt,name:txt,location:txt,service:txt,elements:list(ref),taskIds:list(txt),quantity:nullable(pos),quantitySource:txt,coverageKnown:bool,needDate:date,finishDate:date,criterion:txt,responsible:txt,capacityConfirmed:bool,constraints:list(constraint),reviewRequired:bool};
const supplyFields={id:txt,name:txt,quantity:nullable(pos),confirmed:bool,delivery:date,unitPrice:pos,freight:pos,technical:bool,evidence:txt,kind:literal('order','stock'),synthetic:bool};
const commitmentRule=obj({packageId:txt,name:txt,location:txt,quantity:pos,unit,deadline:date,criterion:txt,responsible:txt});
const mapEntryRule=obj({id:txt,resourceCode:txt,specification:txt,unit,location:txt,resourceIds:list(txt),packageIds:list(txt),quantity:pos,balance:nullable(pos),reusable:bool,needDate:date,receiptDate:date,orderDate:date,startDate:date,occupiedUntil:date,blockers:list(txt),promisedDates:list(date),frozenCommitments:list(commitmentRule)});
const longText:Rule=v=>{if(typeof v!=='string'||v.length>5_000_000)fail();};
const supplyPlanRule=obj({id:txt,at:txt,reviewer:txt,evidence:txt,fingerprint:longText,entries:list(mapEntryRule)});
const schemaFor=(version:1|2)=>obj({schema:literal(version),id:txt,name:txt,models:list(obj({id:txt,hash:txt,name:txt,projectGlobalId:txt})),tasks:list(obj({id:txt,modelId:txt,globalId:txt,slot:txt,name:txt,location:txt,service:txt,start:date,finish:date})),
 packages:list(obj({...packageFields,unit:version===1?literal('m³'):unit},version===1?{}:{serviceCode:service,measureLinks:list(obj({id:txt,fingerprint:txt}))})),
 supplies:list(obj({...supplyFields,unit:version===1?literal('m³'):unit},version===1?{}:{resourceCode:txt,specification:txt,reusable:bool,availableUntil:date})),
 allocations:list(obj({id:txt,packageId:txt,supplyId:txt,quantity:pos})),deliveries:list(obj({id:txt,allocationId:txt,date:date,received:pos,rejected:pos,evidence:txt,reviewer:txt})),
 week:nullable(obj({frozenAt:txt,reviewer:txt,commitments:list(obj({packageId:txt,name:txt,location:txt,quantity:pos,unit:version===1?literal('m³'):unit,deadline:date,criterion:txt,responsible:txt}))})),actuals:list(obj({packageId:txt,date:date,complete:bool,evidence:txt,reason:txt})),audit:list(obj({at:txt,action:txt,detail:txt})),
 ...(version===2?{measures:list(snapshotRule),resources:list(obj({id:txt,packageId:txt,resourceCode:txt,specification:txt,specificationConfirmed:bool,quantity:pos,unit,needDate:date,from:date,to:date,factor:pos,lossPercent:pos,leadDays:pos,preparationDays:pos,reusable:bool,cycleDays:pos,evidence:txt,procurementBlockers:list(txt)})),resourceAllocations:list(obj({id:txt,requirementId:txt,supplyId:txt,quantity:pos}))}:{})
},version===2?{templateId:literal('torre02'),quantificationCatalog:list(quantRule),supplyPlans:list(supplyPlanRule),measureHistory:list(snapshotRule)}:{});
const schema=schemaFor(2),legacySchema=schemaFor(1);
export function validateProject(p:Project):void{
 schema(p);
 if(p.packages.flatMap(pkg=>pkg.constraints).flatMap(c=>c.attachments??[]).reduce((n,a)=>n+a.size,0)>MAX_PROJECT_IMAGE_BYTES)throw new Error('O projeto atingiu o limite de 12 MB de prints. Use imagens menores.');
 if(new Set(p.measures.map(s=>s.measure.id)).size!==p.measures.length)fail();
 for(const plan of p.supplyPlans??[])if(!plan.reviewer.trim()||!plan.evidence.trim()||plan.fingerprint!==JSON.stringify(plan.entries))fail();
 for(const s of [...p.measures,...p.measureHistory??[]]){if(!s.reviewer.trim()||!s.evidence.trim()||!s.method.trim()||!isReviewCurrent(s,s.measure)||s.reviewOrigin==='calculated'&&(s.measure.status==='pending'||s.amount!==s.measure.amount))fail();const expected={concrete:'m³',reinforcement:'kg',formwork:'m²'}[s.measure.serviceCode];if(s.measure.unit!==expected)fail();if(s.measure.classificationOverride&&(!s.measure.classificationOverride.author.trim()||!s.measure.classificationOverride.reason.trim()))fail();}
 const unique=(rows:{id:string}[])=>{if(rows.some(x=>!x.id.trim())||new Set(rows.map(x=>x.id)).size!==rows.length)fail();};
 [p.models,p.tasks,p.packages,p.supplies,p.allocations,p.deliveries,p.resources,p.resourceAllocations].forEach(unique);
 if(new Set([...p.allocations,...p.resourceAllocations].map(a=>a.id)).size!==p.allocations.length+p.resourceAllocations.length)fail();
 const packages=new Set(p.packages.map(x=>x.id)),models=new Set(p.models.map(x=>x.id)),tasks=new Set(p.tasks.map(x=>x.id));
 if(p.models.some(m=>!(/^[a-f0-9]{64}$/.test(m.hash))))fail();
 if(p.tasks.some(t=>!models.has(t.modelId)||!t.globalId||t.finish<t.start))fail();
 for(const pkg of p.packages){unique(pkg.constraints);if(pkg.finishDate<pkg.needDate||pkg.elements.some(e=>!models.has(e.modelId)||!e.globalId)||(!pkg.reviewRequired&&pkg.taskIds.some(id=>!tasks.has(id))))fail();if(pkg.constraints.some(c=>c.resolved&&(!hasConstraintEvidence(c)||!c.reviewer.trim())))fail();}
 for(const pkg of p.packages)for(const c of pkg.constraints){if(c.scope==='elements'&&(!c.elements?.length||c.elements.some(e=>!pkg.elements.some(x=>x.modelId===e.modelId&&x.globalId===e.globalId))||new Set(c.elements.map(e=>JSON.stringify([e.modelId,e.globalId]))).size!==c.elements.length))fail();if(c.scope!=='elements'&&c.elements?.length)fail();}
 for(const pkg of p.packages)if(!packageMeasureBindingValid(p,pkg))fail();
 for(const pkg of p.packages)if(pkg.measureLinks?.length&&!pkg.reviewRequired&&pkg.measureLinks.some(l=>!p.measures.some(s=>s.measure.id===l.id&&s.fingerprint===l.fingerprint)))fail();
 for(const a of p.allocations){if(!packages.has(a.packageId)||!p.supplies.some(s=>s.id===a.supplyId&&s.unit===p.packages.find(q=>q.id===a.packageId)!.unit)||a.quantity<=0)fail();}
 for(const s of p.supplies){if(p.allocations.filter(a=>a.supplyId===s.id).reduce((n,a)=>n+a.quantity,0)>(s.quantity??0)+1e-8)fail();}
 for(const d of p.deliveries)if(![...p.allocations,...p.resourceAllocations].some(a=>a.id===d.allocationId)||d.rejected>d.received||!d.evidence.trim()||!d.reviewer.trim())fail();
 for(const a of [...p.allocations,...p.resourceAllocations])if(p.deliveries.filter(d=>d.allocationId===a.id).reduce((n,d)=>n+d.received,0)>a.quantity+1e-8)fail();
 checkResourceGraph(p);
 if(p.week){if(!p.week.reviewer.trim()||!p.week.commitments.length||new Set(p.week.commitments.map(c=>c.packageId)).size!==p.week.commitments.length)fail();for(const c of p.week.commitments)if(!packages.has(c.packageId)||!c.criterion.trim()||!c.responsible.trim())fail();}
 if(new Set(p.actuals.map(a=>a.packageId)).size!==p.actuals.length)fail();
 for(const a of p.actuals)if(!p.week?.commitments.some(c=>c.packageId===a.packageId)||!a.evidence.trim())fail();
}
export function serializeProject(p:Project):string{validateProject(p);const text=JSON.stringify(p,null,2);if(text.length>30_000_000)throw new Error('Projeto excede 30 MB.');return text;}
export function parseProject(text:string):Project{if(text.length>30_000_000)throw new Error('Projeto excede 30 MB.');let raw=JSON.parse(text);if(raw?.schema===1){legacySchema(raw);raw=migrateV1(raw);}const p=raw as Project;validateProject(p);return p;}
