import type {Project,ElementRef,TaskRecord} from './types.ts';
import {taskService,refKey,type ServiceDefinition} from './integrated.ts';
import {day} from './project.ts';
export type ServiceDateInput={needDate:string;finishDate:string;sourceTaskIds?:string[];manualStart?:boolean;manualFinish?:boolean;coverMissing?:boolean};
export type PackageDatePreview={status:'complete'|'partial'|'missing'|'ambiguous';start:string;finish:string;tasks:TaskRecord[];missing:ElementRef[];source:string;criterion:string;candidates:{id:string;label:string;taskIds:string[]}[]};
const valid=(s:string)=>{try{day(s);return true;}catch{return false;}};
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
export function packageDatePreview(p:Project,elements:ElementRef[],service:ServiceDefinition,sourceTaskIds?:string[],acceptComposite=false):PackageDatePreview{
 const refs=[...new Map(elements.map(e=>[refKey(e),e])).values()],keys=new Set(refs.map(refKey));
 const tasks=p.tasks.filter(t=>keys.has(refKey(t))&&(!sourceTaskIds||sourceTaskIds.includes(t.id))&&(service.method==='manual'?(normal(t.service)===normal(service.name)||normal(t.name)===normal(service.name)||!!sourceTaskIds&&!taskService(t.service+' '+t.name)):taskService(t.service+' '+t.name)===service.method));
 const groups=new Map<string,TaskRecord[]>();for(const t of tasks){const key=JSON.stringify([t.modelId,t.slot,t.name,t.start,t.finish]);groups.set(key,[...(groups.get(key)??[]),t]);}
 const candidates=[...groups.entries()].map(([id,ts])=>({id,label:`${p.models.find(m=>m.id===ts[0].modelId)?.name??ts[0].modelId} · ${ts[0].name} · ${ts[0].slot} · ${ts[0].start||'início ausente'} → ${ts[0].finish||'término ausente'} · ${ts.length} elementos`,taskIds:ts.map(t=>t.id)}));
 const missing=refs.filter(e=>!tasks.some(t=>refKey(t)===refKey(e)&&valid(t.start)&&valid(t.finish)));
 const ambiguous=!acceptComposite&&refs.some(e=>new Set(tasks.filter(t=>refKey(t)===refKey(e)&&valid(t.start)&&valid(t.finish)).map(t=>JSON.stringify([t.start,t.finish]))).size>1);
 const start=ambiguous?'':tasks.map(t=>t.start).filter(valid).sort()[0]??'',finish=ambiguous?'':tasks.map(t=>t.finish).filter(valid).sort().at(-1)??'';
 const csv=tasks.some(t=>t.slot.startsWith('CSV:')),ifc=tasks.some(t=>!t.slot.startsWith('CSV:'));
 return {status:ambiguous?'ambiguous':!tasks.length?'missing':missing.length?'partial':'complete',start,finish,tasks,missing,source:tasks.length?csv&&ifc?'Cronogramas CSV incorporado e IFC 4D':csv?'Cronograma CSV aprovado e incorporado ao IFC':'Cronograma IFC 4D':'Datas ausentes no serviço/escopo',criterion:ambiguous?'Escolha uma atividade ou confirme explicitamente a janela composta.':groups.size>1?'Janela composta: menor início e maior término das atividades deste serviço nos elementos selecionados.':'Período da atividade vinculada a este serviço e aos elementos selecionados.',candidates};
}
