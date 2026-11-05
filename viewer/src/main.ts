import {quantificationSelection} from './quantification/selection.ts';
import {activityInspector} from './ui/planning-board.ts';
import type {ActivityRow} from './production/planning-view.ts';
import type {ViewerPanel} from './ui/shell.ts';
import './ui/planning-board.css';
import {projectDifferences} from './production/project-diff.ts';
import {IntegratedWorkspace} from './production/integrated-ui.ts';
import {ensurePlanning,synchronizePlanning,elementVisuals,type VisualMode} from './production/integrated.ts';
import {ProjectHistory} from './production/history.ts';
import {listProjectVersions,readProjectVersion} from './workspace/local.ts';
import './ui/integrated.css';
import type {FragmentsModel,SpatialTreeItem} from '@thatopen/fragments';
import {Viewer} from './ifc/app';
import {buildSchedule,type ElementTask} from './ifc/schedule';
import {taskIdentity} from './ifc/identity.ts';
import {Gantt} from './ui/gantt';
import {buildShell} from './ui/shell';
import {renderPropertiesMulti} from './ui/properties';
import {storeyLocations} from './ui/tree-selection.ts';
import {renderTree,selectNodesByIds,materializeSpatial} from './ui/tree';
import {updateGroupSelection,updateSelection,uniqueSelection,selectionTasks,isAdditiveSelection,type SelectionItem} from './ifc/selection.ts';
import {ProductionPanel,el} from './production/ui.ts';
import {createProject,registerModel,validateProject,log} from './production/project.ts';
import {sha256,restoreLocal,storeBytes,restoreBytes,packProject,unpackProject} from './production/storage.ts';
import type {Project,TaskRecord,WorkPackage,ElementRef} from './production/types.ts';
import {stageModels} from './production/runtime.ts';
import './ui/coral.css';
import './ui/windows.css';
import './ui/production-ux.css';
import './ui/workflow.css';
import {ProjectPortal} from './workspace/portal.ts';
import {chooseDirectory,createProjectFolder,saveProjectFolder,readProjectFolder,saveArtifact,rememberFolder,recentFolders,ensurePermission,type DirectoryHandle} from './workspace/local.ts';
import {downloadBlob,configureDownloads} from './workspace/downloads.ts';
import {removeUnlinkedModel} from './workspace/models.ts';
import {torreTemplate} from './workspace/templates.ts';
import {projectDestination} from './workspace/destination.ts';
import {isTeachingProject} from './workspace/context.ts';
import {helpButton} from './ui/help.ts';
import {readIfcVolumes,summarizeVolumes,readIfcMetadata} from './ifc/quantities.ts';
import {QuantificationPanel,type QuantSelection} from './quantification/ui.ts';
import type {ElementMetadata} from './quantification/types.ts';
import {previewPackages,createPackages} from './production/resources.ts';
import {openPackageMeasurements,type PackageMeasureRequest} from './production/package-quantities-ui.ts';
const root=document.getElementById('app')!;
const header=el('header','','coral-header'),wordmark=el('div','','wordmark'),actions=el('div','','header-actions');
wordmark.append(el('strong','IFC Coral'),el('span','Planejamento de produção'));header.append(wordmark,actions);
const layout=el('main','','coral-layout'),modelHost=el('section','','model-host'),status=el('div','Preparando ambiente BIM…','app-status');status.setAttribute('role','status');root.append(header,layout,status);
const viewer=new Viewer(),gantt=new Gantt();const h=buildShell(modelHost,(name,open)=>{if(name==='timeline'&&!open)gantt.pause();if(name==='quantification'&&open)quantTool.render();});layout.append(modelHost);
let activeDirectory:DirectoryHandle|null=null,dirty=false,opened=false;
let resolveEngine!:()=>void,rejectEngine!:(error:unknown)=>void;const engineReady=new Promise<void>((resolve,reject)=>{resolveEngine=resolve;rejectEngine=reject;});void engineReady.catch(()=>{});
let project=createProject(),selected:ElementTask[]=[],busy=false,initialized=false;
let history=new ProjectHistory(project),autoTimer:ReturnType<typeof setTimeout>|undefined,saving=false;
let selectedObjects:SelectionItem<FragmentsModel>[]=[],multiSelect=false;
let runtime=new Map<string,{model:FragmentsModel;tasks:ElementTask[]}>(),modelBytes=new Map<string,Uint8Array>();
const selectionNames=new Map<FragmentsModel,Map<number,string>>();
const selectionLocations=new Map<FragmentsModel,Map<number,string>>();
const byteArchive=new Map<string,Uint8Array>();
const metadataCache=new Map<string,Map<string,ElementMetadata>>();
let quantSelection:QuantSelection[]=[];
const volumeCache=new Map<string,ReturnType<typeof readIfcVolumes>>();
const quantTool=new QuantificationPanel({useInPackage:service=>openQuantifiedPackage({service}),showElement:ref=>showElementRefs([ref]),elementName:elementLabel,reportChanged:()=>persist(),selection:()=>quantSelection,reviews:()=>project.measures,saveReviews:rows=>{const next=structuredClone(project);const replaced=next.measures.filter(old=>rows.some(s=>s.measure.id===old.measure.id&&s.fingerprint!==old.fingerprint));next.measureHistory=[...next.measureHistory??[],...replaced.filter(old=>!next.measureHistory?.some(h=>h.measure.id===old.measure.id&&h.fingerprint===old.fingerprint))];next.measures=structuredClone(rows);for(const pkg of next.packages)if(pkg.measureLinks?.some(l=>!rows.some(s=>s.measure.id===l.id&&s.fingerprint===l.fingerprint)))pkg.reviewRequired=true;acceptProject(next);panel.render();},saveRules:rules=>{const next=structuredClone(project);next.quantificationCatalog=structuredClone(rules);for(const pkg of next.packages)if(pkg.measureLinks?.some(l=>{const s=next.measures.find(s=>s.measure.id===l.id);return s&&rules.find(r=>r.id===s.measure.ruleId)?.version!==s.measure.ruleVersion;}))pkg.reviewRequired=true;acceptProject(next);panel.render();},generate:rows=>{
 const preview=previewPackages(project,rows),modal=el('dialog');modal.append(el('h2','Conferir os pacotes antes de criar'),el('p','Cada serviço terá unidade própria. Recursos e especificações de compra serão definidos depois.'));
 for(const item of preview)modal.append(el('p',`${item.name}: ${item.quantity?.toLocaleString('pt-BR',{maximumFractionDigits:3})} ${item.unit} · ${item.elements.length} elementos · ${item.needDate} → ${item.finishDate}`));
 const confirm=el('button','Confirmar criação dos pacotes'),cancel=el('button','Cancelar');cancel.onclick=()=>{modal.close();modal.remove();};confirm.onclick=()=>{try{const next=structuredClone(project);createPackages(next,preview);acceptProject(next);panel.render();modal.close();modal.remove();}catch(e){message(String(e),true);}};modal.append(cancel,confirm);root.append(modal);modal.showModal();
}});h.quantEl.append(quantTool.element);
async function loadQuantReport(){if(isTeachingProject(project)&&project.models.some(m=>m.hash==='885c3b3ace554f9e3091d611645cccac875a583241d5971c57703bb4a36030dc'))try{const r=await fetch(`${import.meta.env.BASE_URL}models/TORRE02_quantification.json`);if(r.ok)quantTool.addReport(await r.text());}catch{/* Optional geometry report: missing report stays pending. */}}
function message(value:string,error=false){status.textContent=value;status.classList.toggle('error',error);}
function persist(){dirty=true;updateDocumentTitle();message(activeDirectory?'Alterações pendentes; salvamento automático em 2s.':'Alterações pendentes. Escolha uma pasta com Salvar como.');clearTimeout(autoTimer);if(activeDirectory)autoTimer=setTimeout(()=>void autoSave(),2000);}
function refreshEstimates(p:Project){if(!p.planning)return;const rows=[...new Map(p.tasks.map(t=>[JSON.stringify([t.modelId,t.globalId]),t])).values()].flatMap(t=>{const model=p.models.find(m=>m.id===t.modelId),bytes=modelBytes.get(t.modelId);if(!model||!bytes)return [];let data=metadataCache.get(model.id+model.hash);if(!data){data=readIfcMetadata(new TextDecoder().decode(bytes),model.id,model.hash);metadataCache.set(model.id+model.hash,data);}const element=data.get(t.globalId);const task=runtime.get(t.modelId)?.tasks.find(x=>x.globalId===t.globalId);return element?[{element,volume:{amount:task?.volume?.m3??null,unit:'m³',source:task?.volume?.source??''}}]:[];});p.planning.estimates=quantTool.measuresFor(rows,p.quantificationCatalog).map(m=>({modelId:m.elementRef.modelId,modelHash:m.elementRef.modelHash,globalId:m.elementRef.globalId,serviceCode:m.serviceCode,quantity:m.amount,unit:m.unit,source:m.pendingReasons.join('; ')||m.evidence.join('; ')}));}
function acceptProject(next:Project,label='Atualizar projeto'){project=history.apply(project,label,p=>{Object.assign(p,next);refreshEstimates(p);synchronizePlanning(p);});persist();refreshPlanningViews();void refreshManagement();}
function operate(label:string,fn:(p:Project)=>void){project=history.apply(project,label,p=>{fn(p);synchronizePlanning(p);});persist();panel.render();refreshPlanningViews();void refreshManagement();}
async function autoSave(){if(!activeDirectory||!dirty||!opened)return;if(busy||saving){autoTimer=setTimeout(()=>void autoSave(),2000);return;}try{await saveCurrent(false);}catch(e){message('Falha ao salvar: '+(e instanceof Error?e.message:String(e))+' Use Salvar para tentar novamente ou Salvar como para uma cópia.',true);}}
function updateDocumentTitle(){document.title=`${dirty?'● ':''}${project.name} · IFC Coral`;documentLabel.textContent=`${project.name}${dirty?' •':''} · ${activeDirectory?.name??'Escolha uma pasta para salvar'}`;}

const quantityFor=(refs:WorkPackage['elements'])=>summarizeVolumes(refs.map(e=>({modelKey:e.modelId,globalId:e.globalId,volume:runtime.get(e.modelId)?.tasks.find(t=>t.globalId===e.globalId)?.volume})));
const panel=new ProductionPanel({openRestrictions:id=>openPackageWorkspace(id,'Restrições'),openSupplies:id=>{openPackageWorkspace(id,'Suprimentos');},createPackages:()=>integrated.createDialog(),quantification:request=>openQuantifiedPackage(request),getProject:()=>project,showElements:showElementRefs,elementName:elementLabel,change:fn=>{const next=structuredClone(project);fn(next);acceptProject(next);},selectionContext:()=>({locations:[...new Set(selectedObjects.flatMap(item=>{const name=selectionLocations.get(item.model)?.get(item.localId);return name?[name]:[];}))]}),selection:()=>selected.filter(t=>t.globalId).map(taskIdentity),select:pkg=>void showPackage(pkg),importModel:openIfcInput,quantity:quantityFor,review:pkg=>pkg.elements.every(e=>runtime.get(e.modelId)?.tasks.some(t=>t.globalId===e.globalId))&&pkg.taskIds.every(id=>Array.from(runtime.values()).some(r=>r.tasks.some(t=>t.globalId&&taskIdentity(t)===id)))});h.addPanel('production','Produção e restrições',panel.element,'right');h.setPanel('production',true);
function openQuantifiedPackage(request:PackageMeasureRequest={}){
 openPackageMeasurements({getProject:()=>project,measures:()=>quantTool.measures(),change:fn=>{const next=structuredClone(project);fn(next);acceptProject(next);},complete:id=>{quantTool.render();panel.focusPackage(id);}},request);
}
let visualQueue:Promise<void>=Promise.resolve();
let selectionRevision=0;
let selectionEpoch=0,pickQueue:Promise<void>=Promise.resolve();
function visual(fn:()=>Promise<void>){const next=visualQueue.then(fn);visualQueue=next.catch(e=>message(e instanceof Error?e.message:String(e),true));return next;}
function button(text:string,action:()=>void){const b=el('button',text);b.onclick=action;actions.append(b);return b;}
function setBusy(value:boolean){busy=value;if(value){gantt.pause();selectionRevision++;selectionEpoch++;}for(const b of actions.querySelectorAll('button'))b.disabled=value;h.fileInput.disabled=value;panel.element.inert=value;modelHost.inert=value;}
async function guarded(fn:()=>Promise<void>){if(busy||saving){message('Aguarde a operação em curso.');return;}setBusy(true);try{if(!initialized)throw new Error('Ambiente 3D ainda não está disponível.');await visualQueue;await fn();}catch(e){message(e instanceof Error?e.message:String(e),true);}finally{setBusy(false);}}
function localDay(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function toRecord(t:ElementTask):TaskRecord{return {id:taskIdentity(t),modelId:t.modelKey!,globalId:t.globalId!,slot:t.sourceTaskKey!,name:t.name,location:t.summary3??(t.storey!=='(sem pavimento)'?t.storey:'Local não identificado'),service:t.summary4??t.eap,start:localDay(t.start),finish:localDay(t.finish)};}
function syncSelectionUI(focus?:SelectionItem<FragmentsModel>){
 h.selectionCountEl.textContent=`${selectedObjects.length} selecionado${selectedObjects.length===1?'':'s'}`;
 h.clearSelectionButton.disabled=!selectedObjects.length;
 for(const [key,{model}]of runtime){
  const wrapper=Array.from(h.treeEl.children).find(n=>(n as HTMLElement).dataset.modelKey===key) as HTMLElement|undefined;
  if(wrapper)selectNodesByIds(wrapper,selectedObjects.filter(item=>item.model===model).map(item=>item.localId),focus?.model===model?focus.localId:undefined);
 }
}
function applySelection(items:SelectionItem<FragmentsModel>[],options:{tasks?:ElementTask[];syncGantt?:boolean;showProperties?:boolean;fit?:boolean;resetVisibility?:boolean;focus?:SelectionItem<FragmentsModel>}={}){
 const revision=++selectionRevision;gantt.pause();
 selectedObjects=uniqueSelection(items);
 selected=options.tasks??selectionTasks(selectedObjects,Array.from(runtime.values()).flatMap(r=>r.tasks));
 const snapshot=selectedObjects,tasks=selected;
 syncSelectionUI(options.focus);quantSelection=[];quantTool.render();panel.updateSelectionState();
 if(options.syncGantt!==false)gantt.setSelection(tasks);
 modelHost.querySelector<HTMLElement>('.simulation-overlay')!.hidden=true;
 void visual(async()=>{
  if(revision!==selectionRevision)return;
  if(options.resetVisibility)await viewer.showAll();
  await viewer.highlightElements(snapshot);
  if(options.fit&&snapshot.length)await viewer.fitToElements(snapshot);
 }).catch(()=>{});
 if(!snapshot.length){h.propsEl.replaceChildren(el('p','Selecione um elemento ou atividade.','empty'));message('Seleção desfeita.');return;}
 const groups=new Map<FragmentsModel,number[]>();
 for(const item of snapshot){const ids=groups.get(item.model)??[];ids.push(item.localId);groups.set(item.model,ids);}
 // Quantification follows physical selection, including elements without 4D tasks.
 void Promise.all([...groups].map(async([fragment,ids])=>{
  const id=[...runtime].find(([,r])=>r.model===fragment)?.[0],model=project.models.find(m=>m.id===id);
  if(!model)return [];
  const bytes=modelBytes.get(model.id);if(!bytes)throw new Error('Arquivo IFC indisponível para quantificar a seleção.');
  const guids=await fragment.getGuidsByLocalIds(ids),key=model.id+model.hash;
  let metadata=metadataCache.get(key);if(!metadata){metadata=readIfcMetadata(new TextDecoder().decode(bytes),model.id,model.hash);metadataCache.set(key,metadata);}
  let volumes=volumeCache.get(model.hash);if(!volumes){volumes=readIfcVolumes(new TextDecoder().decode(bytes));volumeCache.set(model.hash,volumes);}
  return quantificationSelection(guids,model,metadata,volumes);
 })).then(rows=>{if(revision!==selectionRevision)return;quantSelection=rows.flat();quantTool.render();}).catch(e=>{if(revision===selectionRevision)message('Não foi possível quantificar a seleção: '+String(e),true);});
 void Promise.all([...groups].map(([model,ids])=>model.getItemsData(ids,{attributesDefault:true,relations:{IsDefinedBy:{attributes:true,relations:true},ContainedInStructure:{attributes:true,relations:false}}})))
 .then(rows=>{
  if(revision!==selectionRevision)return;
  renderPropertiesMulti(h.propsEl,rows.flat());appendQuantity(tasks,snapshot.length);appendRelated(tasks);
  const show=options.showProperties??(!h.isPanelOpen('model')&&!h.isPanelOpen('quantification'));
  if(show)h.setPanel('properties',true);
 }).catch(e=>{if(revision===selectionRevision)message(e instanceof Error?e.message:String(e),true);});
 const q=summarizeVolumes(tasks),volume=q.count===snapshot.length&&q.totalM3!==null?`${q.totalM3.toLocaleString('pt-BR',{maximumFractionDigits:3})} m³ no IFC`:'Volume a conferir';
 message(`${snapshot.length} elemento(s) selecionado(s) · ${volume}. Ctrl adiciona/remove; Shift seleciona intervalo na árvore; Esc limpa.`);
}
function selectObject(hit:SelectionItem<FragmentsModel>|null,additive:boolean,fromTree=false){
 if(hit)viewer.model=hit.model;
 applySelection(updateSelection(selectedObjects,hit,additive),{focus:hit??undefined,showProperties:fromTree?false:undefined});
}
function appendRelated(tasks:ElementTask[]){
 const refs=new Set(tasks.map(t=>JSON.stringify([t.modelKey,t.globalId]))),box=el('details');box.append(el('summary','Pacotes, medições e demandas vinculados'));
 const packages=project.packages.filter(pkg=>pkg.elements.some(e=>refs.has(JSON.stringify([e.modelId,e.globalId]))));
 if(!packages.length)box.append(el('p','Ainda sem pacote vinculado.'));
 for(const pkg of packages){const row=el('div');row.append(el('p',`${pkg.name} · ${pkg.quantity??'A quantificar'} ${pkg.unit}`));const open=el('button','Abrir pacote');open.onclick=()=>{h.setPanel('production',true);panel.focusPackage(pkg.id);};const supplies=el('button','Ver insumos');supplies.onclick=()=>{openPackageWorkspace(pkg.id,'Suprimentos');};row.append(open,supplies);box.append(row);}
 const measures=project.measures.filter(m=>refs.has(JSON.stringify([m.measure.elementRef.modelId,m.measure.elementRef.globalId])));box.append(el('p',`${measures.length} medições com conferência registrada; consulte a memória em Quantificação.`));h.propsEl.prepend(box);
}
function appendQuantity(tasks:ElementTask[],count=selectedObjects.length){const q=summarizeVolumes(tasks),box=el('div','','quantity-callout');box.append(el('p',`Volume da seleção · ${count} elemento(s)`),el('strong',q.totalM3===null||q.count!==count?`Volume a conferir (${q.measured}/${count})`:`${q.totalM3.toLocaleString('pt-BR',{maximumFractionDigits:3})} m³`),helpButton('Origem do volume IFC',q.source||'Nenhum quantitativo vinculado à seleção.'));h.propsEl.prepend(box);}
function elementLabel(ref:ElementRef){const model=project.models.find(m=>m.id===ref.modelId);if(!model)return 'Elemento de modelo não carregado';let metadata=metadataCache.get(model.id+model.hash);if(!metadata){metadata=readIfcMetadata(new TextDecoder().decode(modelBytes.get(model.id)),model.id,model.hash);metadataCache.set(model.id+model.hash,metadata);}const item=metadata.get(ref.globalId),runtimeModel=runtime.get(model.id),task=runtimeModel?.tasks.find(t=>t.globalId===ref.globalId),place=task&&runtimeModel?selectionLocations.get(runtimeModel.model)?.get(task.localId):'';const name=task&&runtimeModel?selectionNames.get(runtimeModel.model)?.get(task.localId):undefined;const friendly:Record<string,string>={IFCSLAB:'Laje',IFCBEAM:'Viga',IFCCOLUMN:'Pilar',IFCFOOTING:'Fundação',IFCPILE:'Estaca',IFCWALL:'Parede'};return `${name||friendly[item?.ifcClass??'']||'Elemento do pacote'}${place?' · '+place:''}`;}
function showElementRefs(refs:ElementRef[]){selectionEpoch++;const tasks=refs.flatMap(e=>runtime.get(e.modelId)?.tasks.filter(t=>t.globalId===e.globalId)??[]);applySelection(uniqueSelection(tasks),{tasks,fit:true,resetVisibility:true,showProperties:false});}
async function showPackage(pkg:WorkPackage){selectionEpoch++;const tasks=pkg.elements.flatMap(e=>runtime.get(e.modelId)?.tasks.filter(t=>t.globalId===e.globalId)??[]);applySelection(uniqueSelection(tasks),{tasks,fit:true,resetVisibility:true});await visualQueue;message(`${pkg.elements.length} referências IFC do pacote · ${tasks.length} registros 4D localizados.`);}
function spatialIds(item:SpatialTreeItem):number[]{return [...(item.localId!=null?[item.localId]:[]),...(item.children??[]).flatMap(spatialIds)];}
async function drawModelViews(){
 await loadQuantReport();
 selectionRevision++;selected=[];selectedObjects=[];modelHost.querySelector<HTMLElement>('.simulation-overlay')!.hidden=true;h.propsEl.replaceChildren(el('p','Selecione um elemento ou atividade.','empty'));
 selectionNames.clear();selectionLocations.clear();h.treeEl.replaceChildren();const allTasks=Array.from(runtime.values()).flatMap(x=>x.tasks);
 for(const [id,{model}]of runtime){const raw=await viewer.getSpatial(model);if(!raw)continue;const spatial:SpatialTreeItem={localId:null,category:null,children:materializeSpatial(raw)};const ids=spatialIds(spatial),labels=new Map<number,string>();if(ids.length){const data=await model.getItemsData(ids,{attributesDefault:false,attributes:['Name']});data.forEach((item,i)=>{const name=(item as Record<string,unknown>).Name as {value?:string}|string|undefined;if(name)labels.set(ids[i],typeof name==='string'?name:name.value??'Pavimento');});}selectionNames.set(model,labels);selectionLocations.set(model,storeyLocations(spatial,labels));const wrapper=el('div','','tree-model');wrapper.dataset.modelKey=id;h.treeEl.append(wrapper);renderTree(wrapper,project.models.find(m=>m.id===id)?.name??id,spatial,{onContextMenu:event=>modelMenu(id,event),onSelectGroup:(ids,event,range)=>{if(busy)return;selectionEpoch++;const mode=range?(event.ctrlKey||event.metaKey?'union':'replace'):(event.ctrlKey||event.metaKey||multiSelect?'toggle':'replace');applySelection(updateGroupSelection(selectedObjects,ids.map(localId=>({model,localId})),mode),{showProperties:false});},onSelect:(localId,event)=>{if(busy)return;selectionEpoch++;selectObject({model,localId},isAdditiveSelection(event,multiSelect),true);},labelMap:labels});}
 gantt.render(h.ganttEl,allTasks,{project:()=>project,inspect:inspectActivity,onScrub:(date,visible,hidden,active)=>applyVisibility(date,visible,hidden,active),onSelect:selectActivities});
 syncSelectionUI();quantTool.render();
 message(`${project.models.length} modelo(s) · ${new Set(allTasks.map(t=>`${t.modelKey}:${t.globalId}`)).size} elementos com cronograma · ${allTasks.length} registros 4D. Datas IFC são planejamento, não execução.`);
}
function selectActivities(tasks:ElementTask[]){
 selectionEpoch++;applySelection(uniqueSelection(tasks),{tasks,syncGantt:false,showProperties:false,fit:true,resetVisibility:true});
}
async function applyVisibility(date:Date,visible:ElementTask[],hidden:ElementTask[],active:ElementTask[]){visualMode.value='none';await viewer.setManagementColors([]);await visual(()=>viewer.applySimulation(visible,hidden,active));const overlay=modelHost.querySelector<HTMLElement>('.simulation-overlay')!;overlay.hidden=false;overlay.textContent=`Planejamento · ${date.toLocaleDateString('pt-BR')} · ${visible.length} visíveis · ${active.length} em atividade`;}
async function importIfc(bytes:Uint8Array,name:string,replaceId?:string){
 const text=new TextDecoder().decode(bytes);if(!text.includes('ISO-10303-21;'))throw new Error('Este arquivo não parece ser um IFC STEP.');
 const hash=await sha256(bytes);if(project.models.some(m=>m.hash===hash)){message('Esta revisão já está carregada. Nenhum elemento ou tarefa foi duplicado.');return;}
 const projectGlobalId=text.match(/IFCPROJECT\s*\(\s*'([^']+)'/i)?.[1]??'';let id=replaceId??JSON.stringify([projectGlobalId||'sem-GlobalId',name.toLowerCase()]);
 const sameProject=projectGlobalId?project.models.filter(m=>m.projectGlobalId===projectGlobalId):[];
 if(!replaceId&&!project.models.some(m=>m.id===id)&&sameProject.length){id=await chooseRevision(id,sameProject.map(m=>({id:m.id,name:m.name})));}
 message(`Carregando ${name}…`);let model:FragmentsModel|undefined;
 try{model=await viewer.loadIfc(bytes,`${name}-${crypto.randomUUID()}`);if(!model)throw new Error('Modelo IFC não foi carregado.');const tasks=await buildSchedule(model,id,readIfcVolumes(text));const next=structuredClone(project);registerModel(next,{id,hash,name,projectGlobalId});next.tasks=next.tasks.filter(t=>t.modelId!==id).concat(tasks.filter(t=>t.globalId).map(toRecord));validateProject(next);const old=runtime.get(id);if(old)await viewer.unload(old.model);runtime.set(id,{model,tasks});if(old){const oldMeta=project.models.find(m=>m.id===id);if(oldMeta&&modelBytes.has(id))byteArchive.set(oldMeta.hash,modelBytes.get(id)!);}modelBytes.set(id,bytes);byteArchive.set(hash,bytes);acceptProject(next);selected=[];try{await storeBytes(hash,bytes);}catch{message('Cache IFC indisponível. Exporte para guardar uma cópia.',true);}await drawModelViews();panel.render();}
 catch(e){if(model&&!Array.from(runtime.values()).some(r=>r.model===model))await viewer.unload(model);throw e;}
}
async function activate(next:Project,bytes:Map<string,Uint8Array>){
 const staged=await stageModels(next,bytes,{load:(b,name)=>viewer.loadIfc(b,name),read:async(model,id)=>{const tasks=await buildSchedule(model,id,readIfcVolumes(new TextDecoder().decode(bytes.get(id)!)));return {tasks,records:tasks.filter(t=>t.globalId).map(toRecord)};},unload:m=>viewer.unload(m)});
 clearTimeout(autoTimer);for(const d of document.querySelectorAll<HTMLDialogElement>('dialog.integrated-dialog')){d.close();d.remove();}for(const m of project.models){const data=modelBytes.get(m.id);if(data)byteArchive.set(m.hash,data);}activeDirectory=null;for(const r of runtime.values())await viewer.unload(r.model);runtime=staged;ensurePlanning(next);project=next;history=new ProjectHistory(project);modelBytes=bytes;selected=[];quantSelection=[];quantTool.clearReports();quantTool.resetForProject(project.quantificationCatalog);persist();for(const m of next.models){try{await storeBytes(m.hash,bytes.get(m.id)!);}catch{message('Cache do IFC indisponível. Mantenha o arquivo portátil.',true);}}await drawModelViews();refreshEstimates(project);synchronizePlanning(project);panel.render();
}
function chooseRevision(newId:string,candidates:{id:string;name:string}[]):Promise<string>{return new Promise((resolve,reject)=>{
 const modal=el('dialog');modal.append(el('h2','Revisão ou outro modelo?'),el('p','O GlobalId do projeto é o mesmo de um modelo aberto. Confirme se o arquivo revisa esse modelo ou representa outra disciplina.'));
 for(const c of candidates){const b=el('button',`Substituir revisão de ${c.name}`);b.onclick=()=>{modal.close();modal.remove();resolve(c.id);};modal.append(b);}
 const separate=el('button','Adicionar como outro modelo'),cancel=el('button','Cancelar importação');separate.onclick=()=>{modal.close();modal.remove();resolve(newId);};const abort=()=>{modal.close();modal.remove();reject(new Error('Importação cancelada. Projeto preservado.'));};cancel.onclick=abort;modal.oncancel=e=>{e.preventDefault();abort();};modal.append(separate,cancel);root.append(modal);modal.showModal();
 });}
let replacementModel:string|undefined;
function openIfcInput(){replacementModel=undefined;h.fileInput.multiple=true;h.fileInput.click();}
const importIfcButton=button('Importar IFC',openIfcInput);importIfcButton.className='primary';
h.fileInput.onchange=()=>void guarded(async()=>{try{for(const file of Array.from(h.fileInput.files??[]))await importIfc(new Uint8Array(await file.arrayBuffer()),file.name,replacementModel);}finally{h.fileInput.value='';replacementModel=undefined;h.fileInput.multiple=true;}});
h.fileInput.addEventListener('cancel',()=>{replacementModel=undefined;h.fileInput.multiple=true;});
button('Exportar projeto',()=>void exportPortable().catch(reportError));
const importProject=el('input');importProject.type='file';importProject.accept='.json';importProject.hidden=true;importProject.id='import-project';header.append(importProject);
button('Importar projeto portátil',()=>{if(!dirty)importProject.click();else message('Salve as alterações antes de importar outro projeto.',true);});
importProject.onchange=()=>void guarded(async()=>{const file=importProject.files?.[0];if(!file)return;const restored=await unpackProject(await file.text());await activate(restored.project,restored.bytes);activeDirectory=null;persist();importProject.value='';message('Projeto portátil importado. Use Salvar como para escolher sua pasta.');});
button('Projetos',()=>void goHome());
button('Salvar',()=>void saveCurrent().catch(reportError));
button('Salvar como',()=>void saveAs().catch(reportError));
button('Recarregar da pasta',()=>{if(!activeDirectory||saving||busy){message('Escolha uma pasta ou aguarde a gravação em curso.',true);return;}const dir=activeDirectory,d=el('dialog','','project-destination');d.setAttribute('aria-label','Recarregar projeto');d.append(el('h2','Recarregar projeto da pasta?'),el('p','As alterações ainda não salvas nesta sessão serão descartadas. Você pode salvar uma cópia primeiro.'));for(const [label,fn]of [['Cancelar',()=>{}],['Salvar uma cópia',()=>void saveAs().catch(reportError)],['Recarregar',()=>void loadFolder(dir).catch(reportError)]] as const){const b=el('button',label);b.onclick=()=>{d.close();d.remove();fn();};d.append(b);}root.append(d);d.showModal();});
const documentLabel=el('span','','document-label');header.append(documentLabel);
const compactHeader=el('button','','header-collapse');compactHeader.type='button';header.append(compactHeader);
let headerCompact=false;try{headerCompact=localStorage.getItem('coral.header-compact')==='true';}catch{}
function renderHeaderCompact(){header.classList.toggle('header-compact',headerCompact);compactHeader.textContent=headerCompact?'⌄ Expandir cabeçalho':'⌃ Recolher cabeçalho';compactHeader.setAttribute('aria-expanded',String(!headerCompact));}
compactHeader.onclick=()=>{headerCompact=!headerCompact;renderHeaderCompact();try{localStorage.setItem('coral.header-compact',String(headerCompact));}catch{}};renderHeaderCompact();

const workspaces=new Map<string,IntegratedWorkspace>();
const areaIds:Record<string,ViewerPanel>={'Pacotes':'packages','Planejamento macro':'macro','Suprimentos':'supplies','Catálogos':'catalogues'};
function openWorkspace(view:string){const area=workspaces.get(view)!;area.show(view);h.focusPanel(areaIds[view]);return area;}
function openPackageWorkspace(id:string,tab='Resumo'){const area=workspaces.get('Pacotes')!;area.openPackage(id,tab);h.focusPanel('packages');}
for(const [view,id]of Object.entries(areaIds)){
 const area=new IntegratedWorkspace({metadata:refs=>refs.flatMap(ref=>{const model=project.models.find(m=>m.id===ref.modelId),bytes=modelBytes.get(ref.modelId);if(!model||!bytes)return [];let metadata=metadataCache.get(model.id+model.hash);if(!metadata){metadata=readIfcMetadata(new TextDecoder().decode(bytes),model.id,model.hash);metadataCache.set(model.id+model.hash,metadata);}const found=metadata.get(ref.globalId);return found?[found]:[];}),get:()=>project,change:operate,selection:()=>[...new Map(selected.filter(t=>t.globalId&&t.modelKey).map(t=>[JSON.stringify([t.modelKey,t.globalId]),{modelId:t.modelKey!,globalId:t.globalId!}])).values()],show:showElementRefs,open:(id,tab)=>{h.focusPanel('production');panel.focusPackage(id,tab);},close:()=>{}});
 workspaces.set(view,area);h.addPanel(id,view,area.element,'bottom');area.bind(view,()=>h.setPanel(id,true),()=>h.setPanel(id,false),openWorkspace);
 button(view,()=>{gantt.pause();openWorkspace(view);});
}
const integrated=workspaces.get('Pacotes')!;
const activityDetails=el('div','','activity-inspector');h.addPanel('activity','Informações da atividade',activityDetails,'left');
function inspectActivity(row:ActivityRow,activate=true){if(activate)h.setPanel('activity',true);activityInspector(activityDetails,row,project,{show:()=>showElementRefs(row.elements),create:()=>integrated.createDialog(row.elements,[],row.location,row.tasks.filter(t=>t.modelKey&&t.globalId&&t.sourceTaskKey).map(taskIdentity)),open:(id,tab)=>{openPackageWorkspace(id,tab??'Resumo');}});}
function refreshPlanningViews(){gantt.refresh();for(const area of workspaces.values())area.render();}
button('Desfazer',()=>void historyStep(false).catch(reportError));button('Refazer',()=>void historyStep(true).catch(reportError));button('Histórico',()=>void showHistory().catch(reportError));
async function historyStep(redo:boolean){if(busy||saving)return;const before=project,next=redo?history.redo(project):history.undo(project);if(next===before){message(redo?'Nada para refazer.':'Nada para desfazer.');return;}if(JSON.stringify(before.models)!==JSON.stringify(next.models)){const savedHistory=history,dir=activeDirectory;await activate(next,new Map(next.models.map(m=>{const data=byteArchive.get(m.hash)??(before.models.some(old=>old.id===m.id&&old.hash===m.hash)?modelBytes.get(m.id):undefined);if(!data)throw new Error('Revisão IFC indisponível na sessão; use Histórico.');return [m.id,data];})));history=savedHistory;activeDirectory=dir;}else project=next;persist();quantTool.resetForProject(project.quantificationCatalog);panel.render(false);refreshPlanningViews();await refreshManagement();}
async function showHistory(){if(!activeDirectory){message('Escolha uma pasta para consultar versões salvas.',true);return;}if(busy||saving){message('Aguarde o salvamento em curso.');return;}const dir=activeDirectory,versions=await listProjectVersions(dir),modal=el('dialog','','integrated-dialog');modal.append(el('h2','Histórico de versões'),el('p','Restaurar cria uma nova revisão atual; as versões anteriores permanecem na pasta.'));const close=el('button','Fechar');close.onclick=()=>{modal.close();modal.remove();};modal.append(close);for(const version of versions){const item=el('button',version.title);item.onclick=()=>void(async()=>{const restored=await readProjectVersion(dir,version.name);const preview=el('dialog','','integrated-dialog');preview.append(el('h2','Comparar versão'),el('p',`Atual: ${project.packages.length} pacotes, ${project.resources.length} recursos. Versão: ${restored.project.packages.length} pacotes, ${restored.project.resources.length} recursos.`));const diff=el('ul');for(const text of projectDifferences(project,restored.project))diff.append(el('li',text));preview.append(diff);const apply=el('button','Restaurar como nova revisão'),cancel=el('button','Cancelar');cancel.onclick=()=>{preview.close();preview.remove();};apply.onclick=()=>void(async()=>{if(restored.project.id!==project.id)throw new Error('Versão pertence a outro projeto.');if(saving)throw new Error('Aguarde o salvamento em curso.');if(dirty&&!await saveCurrent())return;const previousAudit=structuredClone(project.audit);await activate(restored.project,restored.bytes);project.audit=previousAudit;log(project,'Restaurar versão',version.name);panel.render();activeDirectory=dir;persist();preview.close();preview.remove();modal.close();modal.remove();refreshPlanningViews();})().catch(reportError);preview.append(cancel,apply);root.append(preview);preview.showModal();})().catch(reportError);modal.append(item);}root.append(modal);modal.showModal();}
window.addEventListener('keydown',e=>{const target=e.target;if(!opened||!(e.ctrlKey||e.metaKey)||target instanceof HTMLElement&&(target.isContentEditable||target.closest('input,textarea,select')))return;if(e.key.toLowerCase()==='z'||e.key.toLowerCase()==='y'){e.preventDefault();void historyStep(e.shiftKey||e.key.toLowerCase()==='y').catch(reportError);}});
const toggle=button('Ampliar modelo',()=>{const expanded=layout.classList.toggle('model-expanded');h.setPanel('production',!expanded);toggle.textContent=expanded?'Voltar ao projeto':'Ampliar modelo';window.dispatchEvent(new Event('resize'));});
const visualBar=el('div','','visual-management'),visualMode=el('select'),visualService=el('select'),visualLocation=el('input'),visualFrom=el('input'),visualTo=el('input'),visualOnly=el('input'),visualLegend=el('div','','visual-legend');
visualMode.setAttribute('aria-label','Gestão visual');for(const [value,label]of [['none','Cores originais'],['coverage','Cobertura de pacotes'],['quantification','Quantificação'],['execution','Execução']]){const o=el('option',label);o.value=value;visualMode.append(o);}visualService.setAttribute('aria-label','Serviço da gestão visual');for(const [value,label]of [['concrete','Concretagem'],['reinforcement','Armação'],['formwork','Fôrmas']]){const o=el('option',label);o.value=value;visualService.append(o);}visualLocation.placeholder='Local (opcional)';visualLocation.setAttribute('aria-label','Local da gestão visual');visualFrom.type=visualTo.type='date';visualFrom.setAttribute('aria-label','Visualizar desde');visualTo.setAttribute('aria-label','Visualizar até');visualOnly.type='checkbox';const onlyLabel=el('label','Somente correspondentes');onlyLabel.prepend(visualOnly);visualBar.append(el('strong','Gestão visual'),visualMode,visualService,visualLocation,visualFrom,visualTo,onlyLabel);modelHost.insertBefore(visualBar,h.fileInput);modelHost.insertBefore(visualLegend,h.fileInput);
const visualColors:Record<string,string>={none:'#aeb2bc',macro:'#b79ad9',package:'#803ed1',draft:'#e3b452',reviewed:'#31a9ac',executing:'#3289d6',partial:'#edac3b',complete:'#36a56d',stale:'#d65363'};
const visualLabels:Record<string,string>={none:'Sem registro',macro:'Previsão macro',package:'Em pacote',draft:'Rascunho',reviewed:'Conferido',executing:'Em execução',partial:'Parcial',complete:'Concluído',stale:'Revisar vínculo'};
async function refreshManagement(){if(!initialized||!opened)return;gantt.pause();const current=visualService.value;for(const s of project.planning?.services??[])if(!Array.from(visualService.options).some(o=>o.value===s.id)){const o=el('option',s.name);o.value=s.id;visualService.append(o);}visualService.value=current;await visual(async()=>{if(visualMode.value==='none'){await viewer.setManagementColors([]);visualLegend.replaceChildren();if(visualOnly.checked)await viewer.showAll();return;}const rows=elementVisuals(project,visualMode.value as VisualMode,visualService.value,visualLocation.value,visualFrom.value,visualTo.value),groups=new Map<string,{model:FragmentsModel;ids:number[];color:string}>();for(const r of rows){const live=runtime.get(r.modelId);if(!live)continue;const id=live.tasks.find(t=>t.globalId===r.globalId)?.localId;if(id===undefined)continue;const key=r.modelId+r.status,group=groups.get(key)??{model:live.model,ids:[],color:visualColors[r.status]};group.ids.push(id);groups.set(key,group);}await viewer.showAll();await viewer.setManagementColors([...groups.values()]);if(visualOnly.checked){const matched=new Set(rows.filter(r=>r.status!=='none').map(r=>JSON.stringify([r.modelId,r.globalId])));for(const [modelId,live]of runtime){const hidden=live.tasks.filter(t=>!matched.has(JSON.stringify([modelId,t.globalId]))).map(t=>t.localId);await live.model.setVisible(hidden,false);}}visualLegend.replaceChildren();for(const status of [...new Set(rows.map(r=>r.status))]){const item=el('span',`● ${visualLabels[status]}  `);item.style.color=visualColors[status];visualLegend.append(item);}modelHost.querySelector<HTMLElement>('.simulation-overlay')!.hidden=true;});}
for(const control of [visualMode,visualService,visualLocation,visualFrom,visualTo,visualOnly])control.onchange=()=>void refreshManagement().catch(reportError);
h.fitButton.setAttribute('aria-label','Enquadrar seleção ou modelo');h.fitButton.title='Enquadrar seleção ou modelo';h.fitButton.onclick=()=>void visual(()=>selectedObjects.length?viewer.fitToElements(selectedObjects):viewer.fitToModel());
h.allButton.onclick=()=>{gantt.pause();void visual(async()=>{await viewer.showAll();await viewer.highlightElements(selectedObjects);await viewer.fitToModel();});modelHost.querySelector<HTMLElement>('.simulation-overlay')!.hidden=true;};
for(const [direction,b]of Object.entries(h.viewButtons))b.onclick=()=>void visual(()=>viewer.orient(direction,selectedObjects));
h.multiSelectButton.onclick=()=>{multiSelect=!multiSelect;h.multiSelectButton.setAttribute('aria-pressed',String(multiSelect));message(multiSelect?'Seleção múltipla ativa: clique para adicionar ou remover objetos. Esc limpa.':'Seleção simples ativa. Ctrl adiciona/remove; Shift seleciona intervalo na árvore.');};
h.clearSelectionButton.onclick=()=>{if(busy)return;selectionEpoch++;applySelection([]);};
window.addEventListener('keydown',event=>{if(event.key!=='Escape'||busy||root.querySelector('dialog[open]'))return;const target=event.target;if(target instanceof HTMLElement&&(target.isContentEditable||target.closest('input,textarea,select')))return;selectionEpoch++;applySelection([]);});
const fileMenu=el('details','','file-menu'),fileSummary=el('summary','Arquivos'),fileItems=el('div','','file-menu-items');fileMenu.append(fileSummary,fileItems);
for(const b of Array.from(actions.querySelectorAll('button'))){if(['Exportar projeto','Importar projeto portátil','Salvar como','Histórico','Desfazer','Refazer','Recarregar da pasta'].includes(b.textContent??'')){fileItems.append(b);b.addEventListener('click',()=>{fileMenu.open=false;});}}
actions.insertBefore(fileMenu,toggle);actions.append(helpButton('Arquivos e salvamento','Salvar grava o projeto e os modelos na pasta escolhida. Salvar como cria uma cópia em outra pasta. Exportações ficam na subpasta Exportacoes. Ctrl+S salva; Ctrl+Shift+S abre Salvar como.'));

const recentsById=new Map<string,DirectoryHandle>();
let legacy:Project|null=null;try{legacy=restoreLocal();}catch{message('A sessão anterior não pôde ser lida. Use uma pasta ou arquivo portátil.',true);}
const portal=new ProjectPortal({onLogin:showHome,onNew:createLocalProject,onOpen:openLocalFolder,onRecent:openRecent,onRecover:recoverLegacy,onTemplate:openTemplate});root.append(portal.element);
header.inert=true;layout.inert=true;portal.showLogin();
function reportError(error:unknown){if(error instanceof Error&&error.name==='AbortError')return;const text=error instanceof Error?error.message:String(error);message(text,true);if(!opened)portal.showError(text);}
async function showHome(){
 for(const area of workspaces.values())area.hide();layout.hidden=false;clearTimeout(autoTimer);opened=false;header.inert=true;layout.inert=true;gantt.pause();
 let recents:Awaited<ReturnType<typeof recentFolders>>=[];try{recents=await recentFolders();}catch{/* A folder can still be opened explicitly if the recent index is unavailable. */}
 recentsById.clear();for(const row of recents)recentsById.set(row.id,row.handle);
 portal.showHome(recents,!!legacy);document.title='Projetos · IFC Coral';
}
function enterEditor(){opened=true;header.inert=false;layout.inert=false;portal.hide();updateDocumentTitle();window.dispatchEvent(new Event('resize'));}
async function remember(){if(activeDirectory)try{await rememberFolder(activeDirectory,project);}catch{message('Projeto salvo; não foi possível atualizar a lista de recentes.',true);}}
async function createLocalProject(){
 await projectDestination({title:'Novo projeto',name:'Meu projeto',confirm:'Criar projeto',save:async(name,parent)=>{
 await engineReady;
 const dir=await createProjectFolder(parent,name),next=createProject();next.name=name;
 await saveProjectFolder(dir,next,new Map());
 setBusy(true);try{await visualQueue;await activate(next,new Map());activeDirectory=dir;dirty=false;enterEditor();await remember();message(`Projeto criado na pasta ${dir.name}.`);}finally{setBusy(false);}
 }});
}
async function openTemplate(){
 portal.showStatus('Preparando o exercício TORRE02: carregando o IFC e o cronograma 4D…');
 await engineReady;setBusy(true);
 try{
  const response=await fetch(`${import.meta.env.BASE_URL}models/TORRE02_ESTRUTURA_4D.ifc`);
  if(!response.ok)throw new Error('Modelo didático não encontrado. Tente recarregar a página.');
  const next=await torreTemplate(new Uint8Array(await response.arrayBuffer()));
  await visualQueue;await activate(next.project,next.bytes);activeDirectory=null;dirty=true;enterEditor();
  message('Exercício TORRE02 aberto. 1. Explore o modelo; 2. selecione elementos; 3. crie um pacote. Use Salvar como para escolher sua pasta.');
 }finally{setBusy(false);}
}
async function loadFolder(dir:DirectoryHandle){
 await engineReady;setBusy(true);try{const restored=await readProjectFolder(dir),before=JSON.stringify(restored.project);await visualQueue;await activate(restored.project,restored.bytes);await loadReports(dir);refreshEstimates(project);synchronizePlanning(project);activeDirectory=dir;dirty=before!==JSON.stringify(project);enterEditor();await remember();message(`Projeto aberto da pasta ${dir.name}.`);if(dirty)persist();}finally{setBusy(false);}
}
async function openLocalFolder(){const dir=await chooseDirectory();await loadFolder(dir);}
async function openRecent(id:string){const dir=recentsById.get(id);if(!dir)throw new Error('Pasta não encontrada. Use Abrir pasta de projeto.');if(!await ensurePermission(dir,true))throw new Error('Acesso à pasta negado. Abra a pasta novamente para conceder acesso.');await loadFolder(dir);}
async function recoverLegacy(){
 if(!legacy)return;await engineReady;const bytes=new Map<string,Uint8Array>();for(const m of legacy.models){const value=await restoreBytes(m.hash);if(!value)throw new Error(`IFC ${m.name} ausente do cache. Reabra um arquivo portátil.`);bytes.set(m.id,value);}
 setBusy(true);try{await activate(structuredClone(legacy),bytes);activeDirectory=null;dirty=true;enterEditor();message('Sessão anterior recuperada. Use Salvar como para criar uma pasta.');}finally{setBusy(false);}
}
async function saveCurrent(requestPermission=true):Promise<boolean>{
 if(busy||saving){message('Aguarde o salvamento em curso.');return false;}if(!activeDirectory)return requestPermission?saveAs():false;
 const dir=activeDirectory;saving=true;message('Salvando...');try{if(!await ensurePermission(dir,requestPermission))throw new Error('Sem permissão para salvar nesta pasta.');const snapshot=structuredClone(project),signature=JSON.stringify(snapshot);await saveProjectFolder(dir,snapshot,modelBytes);await saveReports(dir);dirty=JSON.stringify(project)!==signature;updateDocumentTitle();await remember();message(dirty?'Alterações pendentes; novo salvamento agendado.':`Salvo na pasta ${dir.name}.`);if(dirty){clearTimeout(autoTimer);autoTimer=setTimeout(()=>void autoSave(),2000);}return true;}finally{saving=false;}
}
function saveAs():Promise<boolean>{
 if(busy||saving)return Promise.resolve(false);
 return projectDestination({title:'Salvar como',name:project.name,confirm:'Salvar projeto',save:async(name,parent)=>{
  setBusy(true);try{
   const dir=await createProjectFolder(parent,name),copy=structuredClone(project);copy.name=name;copy.id=crypto.randomUUID();
   await saveProjectFolder(dir,copy,modelBytes);await saveReports(dir);project=copy;history=new ProjectHistory(project);activeDirectory=dir;dirty=false;updateDocumentTitle();await remember();message(`Salvo na pasta ${dir.name}.`);
  }finally{setBusy(false);}
 }});
}
async function saveReports(dir:DirectoryHandle){
 const reports=quantTool.getReports().filter(r=>project.models.some(m=>m.hash===r.sourceHash));if(!reports.length)return;
 const folder=await dir.getDirectoryHandle('Relatorios',{create:true});
 for(const report of reports){const file=await folder.getFileHandle(`${report.sourceHash}.json`,{create:true}),writer=await file.createWritable();try{await writer.write(JSON.stringify(report));await writer.close();}catch(e){await writer.abort();throw e;}}
}
async function loadReports(dir:DirectoryHandle){
 let folder:DirectoryHandle;try{folder=await dir.getDirectoryHandle('Relatorios');}catch(e){if(e instanceof Error&&e.name==='NotFoundError')return;throw e;}
 for await(const entry of folder.values())if(entry.kind==='file'&&entry.name.endsWith('.json'))try{quantTool.addReport(await (await entry.getFile()).text());}catch{message(`Relatório ${entry.name} não pôde ser reaberto. Reimporte-o.`,true);}
}
async function exportPortable(){
 if(busy)return;if(!activeDirectory){if(!await saveAs())return;}else if(dirty){if(!await saveCurrent())return;}
 if(!activeDirectory)return;const dir=activeDirectory,snapshot=structuredClone(project),files=new Map(modelBytes);setBusy(true);try{const packed=await packProject(snapshot,files);await saveArtifact(dir,'IFC-Coral-portatil.json',new Blob([packed],{type:'application/json'}));message('Arquivo portátil salvo em Exportacoes.');}finally{setBusy(false);}
}
function hasUnappliedFields(){return !!root.querySelector('[data-user-draft="true"]');}
async function allowLeave():Promise<boolean>{
 if(hasUnappliedFields()&&!window.confirm('Há campos em edição ainda não aplicados. Volte e use o botão de aplicar/salvar do formulário para mantê-los. Deseja descartar apenas esses rascunhos e continuar?'))return false;
 if(!dirty)return true;
 return new Promise(resolve=>{const modal=el('dialog');modal.append(el('h2','Salvar alterações antes de sair?'),el('p',project.name));
 const finish=(value:boolean)=>{modal.close();modal.remove();resolve(value);};const save=el('button','Salvar e continuar'),discard=el('button','Continuar sem salvar'),cancel=el('button','Cancelar');
 save.onclick=()=>{modal.close();modal.remove();void saveCurrent().then(resolve).catch(e=>{reportError(e);resolve(false);});};discard.onclick=()=>{dirty=false;finish(true);};cancel.onclick=()=>finish(false);modal.oncancel=e=>{e.preventDefault();finish(false);};modal.append(cancel,discard,save);root.append(modal);modal.showModal();});
}
async function goHome(){if(busy||saving)return;if(await allowLeave())await showHome();}
window.addEventListener('beforeunload',e=>{if(dirty||hasUnappliedFields()){e.preventDefault();e.returnValue='';}});
window.addEventListener('keydown',e=>{if(opened&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(!busy)void (e.shiftKey?saveAs():saveCurrent()).catch(reportError);}});
configureDownloads(async(name,blob)=>{
 if(busy)throw new Error('Aguarde a operação em andamento antes de exportar.');
 // Start save-as from the original export click when there is no folder yet.
 if(!activeDirectory){if(!await saveAs())return;}else if(dirty){if(!await saveCurrent())return;}
 if(!activeDirectory)throw new Error('Escolha uma pasta de projeto antes de exportar.');
 const dir=activeDirectory;setBusy(true);try{await saveArtifact(dir,name,blob);message(`Exportado para ${dir.name}/Exportacoes (${name}; nomes repetidos recebem sufixo).`);}finally{setBusy(false);}
},reportError);
function modelMenu(id:string,event:MouseEvent){
 if(busy)return;root.querySelector('.model-context-menu')?.remove();const model=project.models.find(m=>m.id===id);if(!model)return;
 const menu=el('div','','model-context-menu');menu.setAttribute('role','menu');menu.tabIndex=-1;
 const close=()=>menu.remove();const item=(name:string,fn:()=>void)=>{const b=el('button',name);b.setAttribute('role','menuitem');b.onclick=()=>{close();fn();};menu.append(b);};
 item('Informações do modelo',()=>{const modal=el('dialog');modal.append(el('h2',model.name));for(const [key,value]of Object.entries({Projeto:project.name,'Pasta do projeto':activeDirectory?.name??'Ainda não salva','GlobalId do projeto IFC':model.projectGlobalId,'SHA-256':model.hash,'Registros 4D':runtime.get(id)?.tasks.length??0,'Pacotes vinculados':project.packages.filter(p=>p.elements.some(e=>e.modelId===id)).length}))modal.append(el('p',`${key}: ${value}`));const done=el('button','Fechar');done.onclick=()=>{modal.close();modal.remove();};modal.append(done);root.append(modal);modal.showModal();});
 item('Substituir arquivo IFC',()=>{replacementModel=id;h.fileInput.multiple=false;h.fileInput.click();});
 item('Exportar arquivo IFC',()=>{const data=modelBytes.get(id);if(data)downloadBlob(model.name,new Blob([new Uint8Array(data).buffer],{type:'application/octet-stream'}));});
 item('Remover modelo do projeto',()=>{const modal=el('dialog');modal.append(el('h2','Remover modelo?'),el('p',`${model.name}. O arquivo original na pasta será preservado. Modelos vinculados a pacotes não podem ser removidos.`));const yes=el('button','Remover modelo'),no=el('button','Cancelar');no.onclick=()=>{modal.close();modal.remove();};yes.onclick=()=>{modal.close();modal.remove();void guarded(async()=>{const next=removeUnlinkedModel(project,id),r=runtime.get(id);if(r)await viewer.unload(r.model);runtime.delete(id);acceptProject(next);await drawModelViews();panel.render();});};modal.append(no,yes);root.append(modal);modal.showModal();});
 root.append(menu);menu.style.left=`${Math.max(8,Math.min(event.clientX,window.innerWidth-260))}px`;menu.style.top=`${Math.max(8,Math.min(event.clientY,window.innerHeight-220))}px`;menu.focus();menu.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();close();}};
 const dismiss=(e:PointerEvent)=>{if(!menu.contains(e.target as Node)){close();document.removeEventListener('pointerdown',dismiss,true);}};document.addEventListener('pointerdown',dismiss,true);
}
setBusy(true);
try{await viewer.init(h.viewportEl);initialized=true;resolveEngine();
let pointerStart:{x:number;y:number}|undefined;
viewer.canvas.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
viewer.canvas.addEventListener('click',event=>{
 if(busy||event.button!==0||pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>5)return;
 const x=event.clientX,y=event.clientY,additive=isAdditiveSelection(event,multiSelect),epoch=selectionEpoch;
 pickQueue=pickQueue.then(async()=>{
  if(busy||epoch!==selectionEpoch)return;
  const id=await viewer.pickAt(x,y),model=viewer.model;
  if(busy||epoch!==selectionEpoch)return;
  selectObject(id!==null&&model?{model,localId:id}:null,additive);
 }).catch(e=>message(e instanceof Error?e.message:String(e),true));
});
message('Entre para abrir um projeto.');}
catch(e){rejectEngine(e);message(`Não foi possível preparar ou restaurar o ambiente: ${e instanceof Error?e.message:String(e)}. Você pode reabrir um projeto portátil.`,true);}
finally{setBusy(false);}
const search=modelHost.querySelector<HTMLInputElement>('.tree-search');search?.addEventListener('input',()=>{for(const n of h.treeEl.querySelectorAll<HTMLElement>('.tree-node'))n.style.opacity=n.textContent?.toLowerCase().includes(search.value.toLowerCase())?'1':'.3';});
