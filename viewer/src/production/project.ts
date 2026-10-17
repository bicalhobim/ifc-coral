import type {Project,ModelRevision} from './types.ts';
export const uid=()=>crypto.randomUUID();
export function log(p:Project,action:string,detail:string){p.audit.push({at:new Date().toISOString(),action,detail});}
export function createProject():Project{return {schema:1,id:uid(),name:'Oficina de concretagem',models:[],tasks:[],packages:[],supplies:[],allocations:[],deliveries:[],week:null,actuals:[],audit:[]};}
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
const obj=(rules:Record<string,Rule>):Rule=>v=>{if(!v||typeof v!=='object'||Array.isArray(v))fail();const o=v as Record<string,unknown>;if(Object.keys(o).some(k=>!Object.hasOwn(rules,k))||Object.keys(rules).some(k=>!Object.hasOwn(o,k)))fail();for(const [key,rule]of Object.entries(rules))rule(o[key]);};
const ref=obj({modelId:txt,globalId:txt});
const constraint=obj({id:txt,category:txt,description:txt,resolved:bool,evidence:txt,reviewer:txt});
const schema=obj({schema:literal(1),id:txt,name:txt,models:list(obj({id:txt,hash:txt,name:txt,projectGlobalId:txt})),tasks:list(obj({id:txt,modelId:txt,globalId:txt,slot:txt,name:txt,location:txt,service:txt,start:date,finish:date})),packages:list(obj({id:txt,name:txt,location:txt,service:txt,elements:list(ref),taskIds:list(txt),quantity:nullable(pos),unit:literal('m³'),quantitySource:txt,coverageKnown:bool,needDate:date,finishDate:date,criterion:txt,responsible:txt,capacityConfirmed:bool,constraints:list(constraint),reviewRequired:bool})),supplies:list(obj({id:txt,name:txt,quantity:nullable(pos),unit:literal('m³'),confirmed:bool,delivery:date,unitPrice:pos,freight:pos,technical:bool,evidence:txt,kind:literal('order','stock'),synthetic:bool})),allocations:list(obj({id:txt,packageId:txt,supplyId:txt,quantity:pos})),deliveries:list(obj({id:txt,allocationId:txt,date:date,received:pos,rejected:pos,evidence:txt,reviewer:txt})),week:nullable(obj({frozenAt:txt,reviewer:txt,commitments:list(obj({packageId:txt,name:txt,location:txt,quantity:pos,unit:literal('m³'),deadline:date,criterion:txt,responsible:txt}))})),actuals:list(obj({packageId:txt,date:date,complete:bool,evidence:txt,reason:txt})),audit:list(obj({at:txt,action:txt,detail:txt}))});
export function validateProject(p:Project):void{
 schema(p);
 const unique=(rows:{id:string}[])=>{if(rows.some(x=>!x.id.trim())||new Set(rows.map(x=>x.id)).size!==rows.length)fail();};
 [p.models,p.tasks,p.packages,p.supplies,p.allocations,p.deliveries].forEach(unique);
 const packages=new Set(p.packages.map(x=>x.id)),models=new Set(p.models.map(x=>x.id)),tasks=new Set(p.tasks.map(x=>x.id));
 if(p.models.some(m=>!(/^[a-f0-9]{64}$/.test(m.hash))))fail();
 if(p.tasks.some(t=>!models.has(t.modelId)||!t.globalId||t.finish<t.start))fail();
 for(const pkg of p.packages){unique(pkg.constraints);if(pkg.finishDate<pkg.needDate||pkg.elements.some(e=>!models.has(e.modelId)||!e.globalId)||(!pkg.reviewRequired&&pkg.taskIds.some(id=>!tasks.has(id))))fail();if(pkg.constraints.some(c=>c.resolved&&(!c.evidence.trim()||!c.reviewer.trim())))fail();}
 for(const a of p.allocations){if(!packages.has(a.packageId)||!p.supplies.some(s=>s.id===a.supplyId)||a.quantity<=0)fail();}
 for(const s of p.supplies){if(p.allocations.filter(a=>a.supplyId===s.id).reduce((n,a)=>n+a.quantity,0)>(s.quantity??0)+1e-8)fail();}
 for(const d of p.deliveries)if(!p.allocations.some(a=>a.id===d.allocationId)||d.rejected>d.received||!d.evidence.trim()||!d.reviewer.trim())fail();
 for(const a of p.allocations)if(p.deliveries.filter(d=>d.allocationId===a.id).reduce((n,d)=>n+d.received,0)>a.quantity+1e-8)fail();
 if(p.week){if(!p.week.reviewer.trim()||!p.week.commitments.length||new Set(p.week.commitments.map(c=>c.packageId)).size!==p.week.commitments.length)fail();for(const c of p.week.commitments)if(!packages.has(c.packageId)||!c.criterion.trim()||!c.responsible.trim())fail();}
 if(new Set(p.actuals.map(a=>a.packageId)).size!==p.actuals.length)fail();
 for(const a of p.actuals)if(!p.week?.commitments.some(c=>c.packageId===a.packageId)||!a.evidence.trim())fail();
}
export function serializeProject(p:Project):string{validateProject(p);return JSON.stringify(p,null,2);}
export function parseProject(text:string):Project{if(text.length>30_000_000)throw new Error('Projeto excede 30 MB.');const p=JSON.parse(text) as Project;validateProject(p);return p;}
