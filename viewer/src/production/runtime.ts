import type {Project,TaskRecord} from './types.ts';
import {uid,validateProject} from './project.ts';
import {sha256} from './storage.ts';
export async function stageModels<M,T>(next:Project,bytes:Map<string,Uint8Array>,hooks:{load:(b:Uint8Array,name:string)=>Promise<M|undefined>;read:(model:M,id:string)=>Promise<{tasks:T[];records:TaskRecord[];physicalGuids?:string[]}>;unload:(model:M)=>Promise<void>}){
 const staged=new Map<string,{model:M;tasks:T[]}>(),loaded:M[]=[],records:TaskRecord[]=[],physical=new Map<string,Set<string>>();
 try{
 for(const m of next.models){const value=bytes.get(m.id);if(!value||await sha256(value)!==m.hash)throw new Error(`IFC ${m.name} indisponível ou corrompido. Reabra o projeto portátil.`);const model=await hooks.load(value,`${m.name}-${uid()}`);if(!model)throw new Error('Falha ao reabrir IFC.');loaded.push(model);const data=await hooks.read(model,m.id);staged.set(m.id,{model,tasks:data.tasks});records.push(...data.records);physical.set(m.id,new Set(data.physicalGuids??data.records.map(t=>t.globalId)));}
 next.tasks=records;
 for(const pkg of next.packages)if(pkg.elements.some(e=>!physical.get(e.modelId)?.has(e.globalId))||pkg.taskIds.some(id=>!records.some(t=>t.id===id)))pkg.reviewRequired=true;
 validateProject(next);return staged;
 }catch(error){await Promise.allSettled(loaded.map(m=>hooks.unload(m)));throw error;}
}
