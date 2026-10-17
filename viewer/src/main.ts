import type {FragmentsModel,SpatialTreeItem} from '@thatopen/fragments';
import {Viewer} from './ifc/app';
import {buildSchedule,type ElementTask} from './ifc/schedule';
import {taskIdentity} from './ifc/identity.ts';
import {Gantt} from './ui/gantt';
import {buildShell} from './ui/shell';
import {renderProperties,renderPropertiesMulti} from './ui/properties';
import {renderTree,selectNodeById,materializeSpatial} from './ui/tree';
import {ProductionPanel,el} from './production/ui.ts';
import {createProject,registerModel,validateProject} from './production/project.ts';
import {sha256,saveLocal,restoreLocal,storeBytes,restoreBytes,packProject,unpackProject} from './production/storage.ts';
import type {Project,TaskRecord,WorkPackage} from './production/types.ts';
import {stageModels} from './production/runtime.ts';
import './ui/coral.css';
const root=document.getElementById('app')!;
const header=el('header','','coral-header'),wordmark=el('div','','wordmark'),actions=el('div','','header-actions');
wordmark.append(el('strong','IFC Coral'),el('span','PLANEJAMENTO · PRODUÇÃO · SUPRIMENTOS'));header.append(wordmark,actions);
const layout=el('main','','coral-layout'),modelHost=el('section','','model-host'),status=el('div','Preparando ambiente BIM…','app-status');status.setAttribute('role','status');root.append(header,layout,status);
const h=buildShell(modelHost);layout.append(modelHost);const viewer=new Viewer(),gantt=new Gantt();
let project=createProject(),selected:ElementTask[]=[],busy=false,initialized=false;
let runtime=new Map<string,{model:FragmentsModel;tasks:ElementTask[]}>(),modelBytes=new Map<string,Uint8Array>();
function message(value:string,error=false){status.textContent=value;status.classList.toggle('error',error);}
function persist(){try{saveLocal(project);message('Salvo neste navegador · Exporte para levar a outro computador.');}catch{message('Não foi possível salvar no navegador. Exporte seu projeto agora.',true);}}
const panel=new ProductionPanel({getProject:()=>project,change:fn=>{const next=structuredClone(project);fn(next);validateProject(next);project=next;persist();},selection:()=>selected.filter(t=>t.globalId).map(taskIdentity),select:pkg=>void showPackage(pkg),review:pkg=>pkg.elements.every(e=>runtime.get(e.modelId)?.tasks.some(t=>t.globalId===e.globalId))&&pkg.taskIds.every(id=>Array.from(runtime.values()).some(r=>r.tasks.some(t=>t.globalId&&taskIdentity(t)===id)))});layout.append(panel.element);
function button(text:string,action:()=>void){const b=el('button',text);b.onclick=action;actions.append(b);return b;}
function setBusy(value:boolean){busy=value;for(const b of actions.querySelectorAll('button'))b.disabled=value;h.fileInput.disabled=value;panel.element.inert=value;modelHost.inert=value;}
async function guarded(fn:()=>Promise<void>){if(busy)return;setBusy(true);try{if(!initialized)throw new Error('Ambiente 3D ainda não está disponível.');await fn();}catch(e){message(e instanceof Error?e.message:String(e),true);}finally{setBusy(false);}}
function localDay(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function toRecord(t:ElementTask):TaskRecord{return {id:taskIdentity(t),modelId:t.modelKey!,globalId:t.globalId!,slot:t.sourceTaskKey!,name:t.name,location:t.summary3??(t.storey!=='(sem pavimento)'?t.storey:'Local não identificado'),service:t.summary4??t.eap,start:localDay(t.start),finish:localDay(t.finish)};}
async function selectAndShow(id:number,model?:FragmentsModel){await viewer.select(id,model);selected=Array.from(runtime.values()).flatMap(r=>r.tasks).filter(t=>t.model===viewer.model&&t.localId===id);renderProperties(h.propsEl,await viewer.getItemData(id));}
async function showPackage(pkg:WorkPackage){const tasks=pkg.elements.flatMap(e=>runtime.get(e.modelId)?.tasks.filter(t=>t.globalId===e.globalId)??[]);await viewer.highlightElements(tasks);message(`${pkg.elements.length} referências IFC do pacote · ${tasks.length} registros 4D localizados.`);}
function spatialIds(item:SpatialTreeItem):number[]{return [...(item.category?.toUpperCase()==='IFCBUILDINGSTOREY'&&item.localId!=null?[item.localId]:[]),...(item.children??[]).flatMap(spatialIds)];}
async function drawModelViews(){
 h.treeEl.replaceChildren();const allTasks=Array.from(runtime.values()).flatMap(x=>x.tasks);
 for(const [id,{model}]of runtime){const raw=await viewer.getSpatial(model);if(!raw)continue;const spatial:SpatialTreeItem={localId:null,category:null,children:materializeSpatial(raw)};const ids=spatialIds(spatial),labels=new Map<number,string>();if(ids.length){const data=await model.getItemsData(ids,{attributesDefault:false,attributes:['Name']});data.forEach((item,i)=>{const name=(item as Record<string,unknown>).Name as {value?:string}|string|undefined;if(name)labels.set(ids[i],typeof name==='string'?name:name.value??'Pavimento');});}const wrapper=el('div','','tree-model');wrapper.dataset.modelKey=id;h.treeEl.append(wrapper);renderTree(wrapper,project.models.find(m=>m.id===id)?.name??id,spatial,{onSelect:id=>void selectAndShow(id,model),labelMap:labels});}
 gantt.render(h.ganttEl,allTasks,{onScrub:(_d,visible,hidden)=>void applyVisibility(visible,hidden),onSelect:tasks=>{selected=tasks;void viewer.highlightElements(tasks);void Promise.all(Array.from(new Set(tasks.map(t=>t.model))).map(m=>m.getItemsData(Array.from(new Set(tasks.filter(t=>t.model===m).map(t=>t.localId))),{attributesDefault:true,relations:{IsDefinedBy:{attributes:true,relations:true}}}))).then(items=>renderPropertiesMulti(h.propsEl,items.flat()));message(`${tasks.length} registros selecionados no 4D. Use “Pacote da seleção” para criar uma frente de trabalho.`);}});
 message(`${project.models.length} modelo(s) · ${new Set(allTasks.map(t=>`${t.modelKey}:${t.globalId}`)).size} elementos com cronograma · ${allTasks.length} registros 4D. Datas IFC são planejamento, não execução.`);
}
let visibilityRun=0;
async function applyVisibility(visible:ElementTask[],hidden:ElementTask[]){const run=++visibilityRun;for(const {model}of runtime.values()){const shown=new Set(visible.filter(t=>t.model===model).map(t=>t.localId));const hide=Array.from(new Set(hidden.filter(t=>t.model===model&&!shown.has(t.localId)).map(t=>t.localId)));if(run!==visibilityRun)return;await viewer.setElementsVisible(model,hide,false);await viewer.setElementsVisible(model,Array.from(shown),true);}}
async function importIfc(bytes:Uint8Array,name:string){
 const text=new TextDecoder().decode(bytes);if(!text.includes('ISO-10303-21;'))throw new Error('Este arquivo não parece ser um IFC STEP.');
 const hash=await sha256(bytes);if(project.models.some(m=>m.hash===hash)){message('Esta revisão já está carregada. Nenhum elemento ou tarefa foi duplicado.');return;}
 const projectGlobalId=text.match(/IFCPROJECT\s*\(\s*'([^']+)'/i)?.[1]??'';let id=JSON.stringify([projectGlobalId||'sem-GlobalId',name.toLowerCase()]);
 const sameProject=projectGlobalId?project.models.filter(m=>m.projectGlobalId===projectGlobalId):[];
 if(!project.models.some(m=>m.id===id)&&sameProject.length){id=await chooseRevision(id,sameProject.map(m=>({id:m.id,name:m.name})));}
 message(`Carregando ${name}…`);let model:FragmentsModel|undefined;
 try{model=await viewer.loadIfc(bytes,`${name}-${crypto.randomUUID()}`);if(!model)throw new Error('Modelo IFC não foi carregado.');const tasks=await buildSchedule(model,id);const next=structuredClone(project);registerModel(next,{id,hash,name,projectGlobalId});next.tasks=next.tasks.filter(t=>t.modelId!==id).concat(tasks.filter(t=>t.globalId).map(toRecord));validateProject(next);const old=runtime.get(id);if(old)await viewer.unload(old.model);runtime.set(id,{model,tasks});project=next;modelBytes.set(id,bytes);selected=[];persist();try{await storeBytes(hash,bytes);}catch{message('Cache IFC indisponível. Exporte para guardar uma cópia.',true);}await drawModelViews();panel.render();}
 catch(e){if(model&&!Array.from(runtime.values()).some(r=>r.model===model))await viewer.unload(model);throw e;}
}
async function activate(next:Project,bytes:Map<string,Uint8Array>){
 const staged=await stageModels(next,bytes,{load:(b,name)=>viewer.loadIfc(b,name),read:async(model,id)=>{const tasks=await buildSchedule(model,id);return {tasks,records:tasks.filter(t=>t.globalId).map(toRecord)};},unload:m=>viewer.unload(m)});
 for(const r of runtime.values())await viewer.unload(r.model);runtime=staged;project=next;modelBytes=bytes;selected=[];persist();for(const m of next.models){try{await storeBytes(m.hash,bytes.get(m.id)!);}catch{message('Cache do IFC indisponível. Mantenha o arquivo portátil.',true);}}await drawModelViews();panel.render();
}
function chooseRevision(newId:string,candidates:{id:string;name:string}[]):Promise<string>{return new Promise((resolve,reject)=>{
 const modal=el('dialog');modal.append(el('h2','Revisão ou outro modelo?'),el('p','O GlobalId do projeto é o mesmo de um modelo aberto. Confirme se o arquivo revisa esse modelo ou representa outra disciplina.'));
 for(const c of candidates){const b=el('button',`Substituir revisão de ${c.name}`);b.onclick=()=>{modal.close();modal.remove();resolve(c.id);};modal.append(b);}
 const separate=el('button','Adicionar como outro modelo'),cancel=el('button','Cancelar importação');separate.onclick=()=>{modal.close();modal.remove();resolve(newId);};const abort=()=>{modal.close();modal.remove();reject(new Error('Importação cancelada. Projeto preservado.'));};cancel.onclick=abort;modal.oncancel=e=>{e.preventDefault();abort();};modal.append(separate,cancel);root.append(modal);modal.showModal();
 });}
const sample=button('Abrir TORRE02',()=>void guarded(async()=>{const response=await fetch(`${import.meta.env.BASE_URL}models/TORRE02_ESTRUTURA_4D.ifc`);if(!response.ok)throw new Error('Modelo didático não encontrado.');await importIfc(new Uint8Array(await response.arrayBuffer()),'TORRE02_ESTRUTURA_4D.ifc');}));sample.className='primary';
button('Importar IFC',()=>h.fileInput.click());h.fileInput.onchange=()=>void guarded(async()=>{for(const file of Array.from(h.fileInput.files??[]))await importIfc(new Uint8Array(await file.arrayBuffer()),file.name);h.fileInput.value='';});
button('Exportar projeto',()=>void guarded(async()=>{const data=await packProject(project,modelBytes),link=el('a'),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));link.href=url;link.download='IFC-Coral-projeto.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('Projeto exportado com IFC e decisões. Nenhuma chave de IA incluída.');}));
const importProject=el('input');importProject.type='file';importProject.accept='.json';importProject.hidden=true;importProject.id='import-project';header.append(importProject);button('Reabrir projeto',()=>importProject.click());importProject.onchange=()=>void guarded(async()=>{const file=importProject.files?.[0];if(!file)return;message('Reabrindo projeto e verificando integridade…');const restored=await unpackProject(await file.text());await activate(restored.project,restored.bytes);message('Projeto reaberto com IFC, vínculos e decisões preservados.');importProject.value='';});
button('Novo projeto',()=>{if(busy)return;const modal=el('dialog');modal.append(el('h2','Começar outro projeto?'),el('p','Exporte o projeto atual antes de continuar. O novo projeto substituirá a cópia automática deste navegador.'));const cancel=el('button','Continuar no atual');cancel.onclick=()=>{modal.close();modal.remove();};const next=el('button','Exportei; começar novo');next.onclick=()=>{modal.close();modal.remove();void guarded(()=>activate(createProject(),new Map()));};modal.append(cancel,next);root.append(modal);modal.showModal();});
const toggle=button('Ampliar modelo',()=>{const expanded=layout.classList.toggle('model-expanded');toggle.textContent=expanded?'Voltar à oficina':'Ampliar modelo';window.dispatchEvent(new Event('resize'));});
setBusy(true);
try{await viewer.init(h.viewportEl);initialized=true;viewer.canvas.addEventListener('click',async e=>{const id=await viewer.pickAt(e.clientX,e.clientY);if(id===null)return;const logical=Array.from(runtime.entries()).find(([,r])=>r.model===viewer.model)?.[0];const wrapper=Array.from(h.treeEl.children).find(n=>(n as HTMLElement).dataset.modelKey===logical) as HTMLElement|undefined;selectNodeById(wrapper??h.treeEl,id);selected=Array.from(runtime.values()).flatMap(r=>r.tasks).filter(t=>t.model===viewer.model&&t.localId===id);await selectAndShow(id);});const saved=restoreLocal();if(saved){const bytes=new Map<string,Uint8Array>();for(const m of saved.models){const value=await restoreBytes(m.hash);if(value)bytes.set(m.id,value);}await activate(saved,bytes);}else message('Ambiente pronto. Abra a TORRE02 para começar.');}
catch(e){message(`Não foi possível preparar ou restaurar o ambiente: ${e instanceof Error?e.message:String(e)}. Você pode reabrir um projeto portátil.`,true);}
finally{setBusy(false);}
const search=modelHost.querySelector<HTMLInputElement>('.tree-search');search?.addEventListener('input',()=>{for(const n of h.treeEl.querySelectorAll<HTMLElement>('.tree-node'))n.style.opacity=n.textContent?.toLowerCase().includes(search.value.toLowerCase())?'1':'.3';});
