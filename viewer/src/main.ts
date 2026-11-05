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
import * as THREE from 'three';
import {alignThreePoints,type Point3} from './ifc/alignment';
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
import {openScheduleImport,type PreparedModel,type PipelineReceipt} from './ifc/schedule-pipeline-ui.ts';
import {rowsForModel,validateModelSlice,validatePlan} from './ifc/schedule-pipeline.ts';
import {preparationTransaction} from './ifc/preparation-transaction.ts';
import type {ScheduleRow} from './ifc/schedule-import.ts';
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
import {addConcreteCase} from './production/case.ts';
import {openPackageMeasurements,type PackageMeasureRequest} from './production/package-quantities-ui.ts';
const root=document.getElementById('app')!;
const header=el('header','','coral-header'),wordmark=el('div','','wordmark'),actions=el('div','','header-actions');
wordmark.append(el('strong','IFC Coral'),el('span','Planejamento de produção'));header.append(wordmark,actions);
const layout=el('main','','coral-layout'),modelHost=el('section','','model-host'),status=el('div','Preparando ambiente BIM…','app-status');status.setAttribute('role','status');root.append(header,layout,status);
const viewer=new Viewer(),gantt=new Gantt();const h=buildShell(modelHost,(name,open)=>{if(name==='timeline'&&!open)gantt.pause();if(name==='quantification'&&open)quantTool.render();});layout.append(modelHost);
const coordinateReadout=el('output','Coordenadas locais: passe o cursor sobre o modelo.','model-coordinate-readout');coordinateReadout.setAttribute('aria-label','Coordenadas locais no visualizador');h.viewportEl.append(coordinateReadout);
const gridButton=el('button','Grade · cota 0,000 m','viewer-grid-button') as HTMLButtonElement;gridButton.type='button';gridButton.setAttribute('aria-label','Configurar elevação da grade');modelHost.querySelector('.viewer-toolbar')?.append(gridButton);
const alignButton=el('button','Mover / alinhar','viewer-grid-button') as HTMLButtonElement;alignButton.type='button';alignButton.setAttribute('aria-label','Mover modelo ou projeto por três pontos');modelHost.querySelector('.viewer-toolbar')?.append(alignButton);
function displayGridElevation(value:number){viewer.setGridElevation(value);gridButton.textContent=`Grade · cota ${value.toLocaleString('pt-BR',{minimumFractionDigits:3,maximumFractionDigits:3})} m`;}
gridButton.onclick=()=>{if(!opened)return;const dialog=el('dialog','','integrated-dialog'),title=el('h2','Elevação da grade'),copy=el('p','Ajuste a cota visual da grade no referencial do modelo (Y para cima). O IFC original e as quantidades não são alterados.'),field=el('label','Cota da grade (m)'),input=el('input') as HTMLInputElement;input.type='number';input.step='any';input.value=String(project.display?.gridElevation??0);field.append(input);const info=el('p','','fine');const base=el('button','Usar base do modelo'),save=el('button','Aplicar cota'),cancel=el('button','Cancelar');base.type=save.type=cancel.type='button';base.onclick=()=>void viewer.modelBaseElevation().then(value=>{if(value===null){info.textContent='Abra um modelo antes de alinhar à base.';return;}input.value=String(value);info.textContent='Base calculada no referencial do visualizador. Confira antes de aplicar.';}).catch(e=>info.textContent=String(e));save.onclick=()=>{const value=Number(input.value);if(!input.value.trim()||!Number.isFinite(value)||Math.abs(value)>1_000_000){info.textContent='Informe uma elevação válida.';return;}operate('Ajustar elevação da grade',p=>{p.display={...p.display,gridElevation:value};});displayGridElevation(value);dialog.close();dialog.remove();};cancel.onclick=()=>{dialog.close();dialog.remove();};dialog.oncancel=()=>dialog.remove();dialog.append(title,copy,field,info,base,save,cancel);root.append(dialog);dialog.showModal();};
let activeDirectory:DirectoryHandle|null=null,dirty=false,opened=false;
let resolveEngine!:()=>void,rejectEngine!:(error:unknown)=>void;const engineReady=new Promise<void>((resolve,reject)=>{resolveEngine=resolve;rejectEngine=reject;});void engineReady.catch(()=>{});
let project=createProject(),selected:ElementTask[]=[],busy=false,initialized=false;
let history=new ProjectHistory(project),autoTimer:ReturnType<typeof setTimeout>|undefined,saving=false;
let selectedObjects:SelectionItem<FragmentsModel>[]=[],multiSelect=false;
let runtime=new Map<string,{model:FragmentsModel;tasks:ElementTask[]}>(),modelBytes=new Map<string,Uint8Array>();
const selectionNames=new Map<FragmentsModel,Map<number,string>>();
const selectionLocations=new Map<FragmentsModel,Map<number,string>>();
const physicalInventory=new Map<string,Set<string>>();
const byteArchive=new Map<string,Uint8Array>();
const metadataCache=new Map<string,Map<string,ElementMetadata>>();
async function displayAlignments(){for(const [id,entry]of runtime)await viewer.setModelAlignment(entry.model,project.display?.alignments?.[id]?.matrix);}
async function displayElementAlignments(){for(const [id,entry]of runtime)await viewer.setElementAlignments(entry.model,project.display?.elementAlignments?.[id]);}
alignButton.onclick=async()=>{
 if(!opened||!runtime.size){message('Abra um modelo antes de alinhar.');return;}
 const selectionRefs=new Map<string,string[]>();
 for(const [id,entry] of runtime){const localIds=selectedObjects.filter(s=>s.model===entry.model).map(s=>s.localId);if(!localIds.length)continue;const guids=(await entry.model.getGuidsByLocalIds(localIds)).filter((value):value is string=>!!value);if(guids.length)selectionRefs.set(id,[...new Set(guids)]);}
 const active=[...runtime].find(([,entry])=>entry.model===viewer.model)??[...runtime][0];
 const [activeId,activeEntry]=active;
 const box=new THREE.Box3();
 if(selectionRefs.size){for(const [id]of selectionRefs){const entry=runtime.get(id)!;for(const item of selectedObjects.filter(s=>s.model===entry.model)){const [guid]=await entry.model.getGuidsByLocalIds([item.localId]);const itemBox=await entry.model.getMergedBox([item.localId]);const matrix=guid?project.display?.elementAlignments?.[id]?.[guid]:undefined;if(matrix)itemBox.applyMatrix4(new THREE.Matrix4().fromArray(matrix));box.union(itemBox);}}}else box.copy(activeEntry.model.box);
 const min=box.min,max=box.max;
 const source:[Point3,Point3,Point3]=[[min.x,min.y,min.z],[max.x>min.x+0.001?max.x:min.x+1,min.y,min.z],[min.x,min.y,max.z>min.z+0.001?max.z:min.z+1]];
 const dialog=el('dialog','','integrated-dialog integrated-side alignment-dialog'),title=el('h2','Mover ou alinhar por três pontos'),copy=el('p','Informe três pares Origem → Destino em metros, ou aplique um deslocamento X/Y/Z. Escolha elementos selecionados, modelo ativo ou projeto inteiro. O IFC original não é modificado.'),scope=el('select') as HTMLSelectElement;
 scope.append(new Option('Modelo ativo','model'),new Option('Projeto inteiro','project'));if(selectionRefs.size){scope.prepend(new Option(`Elementos selecionados (${[...selectionRefs.values()].reduce((n,rows)=>n+rows.length,0)})`,'selection'));scope.value='selection';}const info=el('p','','fine'),table=el('div','','alignment-points');
 const rows:{source:HTMLInputElement[];target:HTMLInputElement[]}[]=[];
 for(let i=0;i<3;i++){const row=el('div','','alignment-row');row.append(el('strong',`Ponto ${i+1}`));const fields:{source:HTMLInputElement[];target:HTMLInputElement[]}={source:[],target:[]};for(const kind of ['source','target'] as const){const group=el('div','','alignment-coordinates');group.append(el('span',kind==='source'?'Origem':'Destino'));for(let axis=0;axis<3;axis++){const label=el('label',('XYZ')[axis]),input=el('input') as HTMLInputElement;input.type='number';input.step='any';input.setAttribute('aria-label',`${kind==='source'?'Origem':'Destino'} ponto ${i+1} ${'XYZ'[axis]}`);input.value=String(source[i][axis]);label.append(input);group.append(label);fields[kind].push(input);}row.append(group);}rows.push(fields);table.append(row);}
 const offset=el('div','','alignment-offset');offset.append(el('span','Deslocar destino (m)'));const offsets:HTMLInputElement[]=[];for(const axis of 'XYZ'){const label=el('label',axis),input=el('input') as HTMLInputElement;input.type='number';input.step='any';input.value='0';label.append(input);offset.append(label);offsets.push(input);}
 const shift=el('button','Aplicar deslocamento aos três pontos'),preview=el('button','Prévia'),save=el('button','Confirmar alinhamento'),reset=el('button','Restaurar posição'),cancel=el('button','Cancelar');for(const b of [shift,preview,save,reset,cancel])b.type='button';
 const selectedIds=()=>scope.value==='project'?[...runtime.keys()]:scope.value==='model'?[activeId]:[];
 const read=()=>{const points=(kind:'source'|'target')=>rows.map(row=>row[kind].map(input=>input.value.trim()===''?NaN:Number(input.value)) as Point3) as [Point3,Point3,Point3];return alignThreePoints(points('source'),points('target'));};
 const originals=new Map([...runtime].map(([id])=>[id,project.display?.alignments?.[id]?.matrix]));
 const elementOriginals=structuredClone(project.display?.elementAlignments??{});
 const restore=async()=>{await Promise.all([...runtime].map(([id,entry])=>viewer.setModelAlignment(entry.model,originals.get(id))));await Promise.all([...runtime].map(([id,entry])=>viewer.setElementAlignments(entry.model,elementOriginals[id])));};
 const candidate=()=>{const alignment=read(),matrix=new THREE.Matrix4().fromArray(alignment.matrix);return new Map(selectedIds().map(id=>{const previous=originals.get(id),combined=previous?matrix.clone().multiply(new THREE.Matrix4().fromArray(previous)).toArray():alignment.matrix;return [id,{...alignment,matrix:combined}] as const;}));};
 const candidateElements=()=>{const alignment=read(),delta=new THREE.Matrix4().fromArray(alignment.matrix),next=structuredClone(elementOriginals);for(const [id,guids] of selectionRefs){next[id]??={};for(const guid of guids){const old=elementOriginals[id]?.[guid];next[id][guid]=old?delta.clone().multiply(new THREE.Matrix4().fromArray(old)).toArray():alignment.matrix;}}return next;};
 shift.onclick=()=>{const values=offsets.map(input=>input.value.trim()===''?NaN:Number(input.value));if(values.some(v=>!Number.isFinite(v))){info.textContent='Informe deslocamentos válidos em metros.';return;}for(const row of rows)row.target.forEach((input,i)=>{input.value=String(Number(row.source[i].value)+values[i]);});info.textContent='Destino atualizado. Confira e use Prévia.';};
 let previewing=false;
 preview.onclick=async()=>{if(previewing)return;try{previewing=true;preview.disabled=true;if(scope.value==='selection'){const next=candidateElements();await Promise.all([...runtime].map(([id,entry])=>viewer.setElementAlignments(entry.model,next[id])));}else{const next=candidate();await Promise.all([...runtime].map(([id,entry])=>viewer.setModelAlignment(entry.model,next.get(id)?.matrix??originals.get(id))));await displayElementAlignments();}info.textContent='Prévia aplicada. Confira o modelo antes de confirmar.';}catch(e){info.textContent=e instanceof Error?e.message:String(e);}finally{previewing=false;preview.disabled=false;}};
 save.onclick=async()=>{if(previewing){info.textContent='Aguarde a prévia terminar.';return;}previewing=true;save.disabled=true;try{if(scope.value==='selection'){const next=candidateElements();await Promise.all([...runtime].map(([id,entry])=>viewer.setElementAlignments(entry.model,next[id])));operate('Alinhar elementos por três pontos',p=>{p.display??={gridElevation:0};p.display.elementAlignments=next;});}else{const next=candidate();await Promise.all([...runtime].map(([id,entry])=>viewer.setModelAlignment(entry.model,next.get(id)?.matrix??originals.get(id))));await displayElementAlignments();operate('Alinhar modelo por três pontos',p=>{p.display??={gridElevation:0};p.display.alignments??={};for(const [id,value]of next)p.display.alignments[id]=value;});}dialog.close();dialog.remove();message('Alinhamento registrado no projeto. Salve para preservar na pasta.');}catch(e){await restore();info.textContent=e instanceof Error?e.message:String(e);}finally{previewing=false;save.disabled=false;}};
 reset.onclick=async()=>{if(previewing){info.textContent='Aguarde a prévia terminar.';return;}previewing=true;reset.disabled=true;try{if(scope.value==='selection'){const next=structuredClone(project.display?.elementAlignments??{});for(const [id,guids]of selectionRefs)for(const guid of guids)delete next[id]?.[guid];await Promise.all([...runtime].map(([id,entry])=>viewer.setElementAlignments(entry.model,next[id])));operate('Restaurar posição dos elementos',p=>{p.display??={gridElevation:0};p.display.elementAlignments=next;});}else{await Promise.all([...runtime].map(([id,entry])=>viewer.setModelAlignment(entry.model,selectedIds().includes(id)?undefined:originals.get(id))));await displayElementAlignments();operate('Restaurar posição do modelo',p=>{if(p.display?.alignments)for(const id of selectedIds())delete p.display.alignments[id];});}dialog.close();dialog.remove();}catch(e){await restore();info.textContent=e instanceof Error?e.message:String(e);}finally{previewing=false;reset.disabled=false;}};
 cancel.onclick=()=>{if(previewing){info.textContent='Aguarde a prévia terminar.';return;}void restore();dialog.close();dialog.remove();};dialog.oncancel=event=>{if(previewing){event.preventDefault();return;}void restore();dialog.remove();};scope.onchange=()=>{if(!previewing)void restore();};
 const footer=el('div','','alignment-actions');footer.append(preview,save,reset,cancel);
 dialog.append(title,copy,scope,table,offset,shift,info,footer);root.append(dialog);dialog.show();
};
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
function refreshEstimates(p:Project,sourceBytes=modelBytes,sourceRuntime:Map<string,{tasks:ElementTask[]}>=runtime){if(!p.planning)return;const rows=[...new Map(p.tasks.map(t=>[JSON.stringify([t.modelId,t.globalId]),t])).values()].flatMap(t=>{const model=p.models.find(m=>m.id===t.modelId),bytes=sourceBytes.get(t.modelId);if(!model||!bytes)return [];let data=metadataCache.get(model.id+model.hash);if(!data){data=readIfcMetadata(new TextDecoder().decode(bytes),model.id,model.hash);metadataCache.set(model.id+model.hash,data);}const element=data.get(t.globalId);const task=sourceRuntime.get(t.modelId)?.tasks.find(x=>x.globalId===t.globalId);return element?[{element,volume:{amount:task?.volume?.m3??null,unit:'m³',source:task?.volume?.source??''}}]:[];});p.planning.estimates=quantTool.measuresFor(rows,p.quantificationCatalog).map(m=>({modelId:m.elementRef.modelId,modelHash:m.elementRef.modelHash,globalId:m.elementRef.globalId,serviceCode:m.serviceCode,quantity:m.amount,unit:m.unit,source:m.pendingReasons.join('; ')||m.evidence.join('; ')}));}
function acceptProject(next:Project,label='Atualizar projeto'){project=history.apply(project,label,p=>{Object.assign(p,next);refreshEstimates(p);synchronizePlanning(p);});persist();refreshPlanningViews();void refreshManagement();}
function operate(label:string,fn:(p:Project)=>void){project=history.apply(project,label,p=>{fn(p);synchronizePlanning(p);});persist();panel.render();refreshPlanningViews();void refreshManagement();}
async function autoSave(){if(!activeDirectory||!dirty||!opened)return;if(busy||saving){autoTimer=setTimeout(()=>void autoSave(),2000);return;}try{await saveCurrent(false);}catch(e){message('Falha ao salvar: '+(e instanceof Error?e.message:String(e))+' Use Salvar para tentar novamente ou Salvar como para uma cópia.',true);}}
function updateDocumentTitle(){document.title=`${dirty?'● ':''}${project.name} · IFC Coral`;documentLabel.textContent=`${project.name}${dirty?' •':''} · ${activeDirectory?.name??'Escolha uma pasta para salvar'}`;}

function volumeOf(e:ElementRef){const model=project.models.find(m=>m.id===e.modelId),bytes=modelBytes.get(e.modelId);if(!model||!bytes)return undefined;let volumes=volumeCache.get(model.hash);if(!volumes){volumes=readIfcVolumes(new TextDecoder().decode(bytes));volumeCache.set(model.hash,volumes);}return volumes.get(e.globalId);}
const quantityFor=(refs:WorkPackage['elements'])=>summarizeVolumes(refs.map(e=>({modelKey:e.modelId,globalId:e.globalId,volume:volumeOf(e)})));
const panel=new ProductionPanel({openRestrictions:id=>openPackageWorkspace(id,'Restrições'),openSupplies:id=>{openPackageWorkspace(id,'Suprimentos');},createPackages:()=>integrated.createDialog(),quantification:request=>openQuantifiedPackage(request),getProject:()=>project,showElements:showElementRefs,elementName:elementLabel,change:fn=>{const next=structuredClone(project);fn(next);acceptProject(next);},selectionContext:()=>({locations:[...new Set(selectedObjects.flatMap(item=>{const name=selectionLocations.get(item.model)?.get(item.localId);return name?[name]:[];}))]}),selection:()=>selected.filter(t=>t.globalId).map(taskIdentity),select:pkg=>void showPackage(pkg),importModel:openIfcInput,quantity:quantityFor,review:pkg=>pkg.elements.every(e=>physicalInventory.get(e.modelId)?.has(e.globalId))&&pkg.taskIds.every(id=>Array.from(runtime.values()).some(r=>r.tasks.some(t=>t.globalId&&taskIdentity(t)===id)))});h.addPanel('production','Produção e restrições',panel.element,'right');h.setPanel('production',true);
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
 void Promise.all([...groups].map(async([model,ids])=>({data:await model.getItemsData(ids,{attributesDefault:true,relations:{IsDefinedBy:{attributes:true,relations:true},ContainedInStructure:{attributes:true,relations:false}}}),refs:(await model.getGuidsByLocalIds(ids)).filter((g):g is string=>!!g).map(globalId=>({modelId:[...runtime].find(([,r])=>r.model===model)![0],globalId}))})))
 .then(rows=>{
  if(revision!==selectionRevision)return;
  const refs=rows.flatMap(row=>row.refs);renderPropertiesMulti(h.propsEl,rows.flatMap(row=>row.data));appendQuantity(refs,snapshot.length);appendRelated(refs);
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
function appendRelated(elements:ElementRef[]){
 const refs=new Set(elements.map(e=>JSON.stringify([e.modelId,e.globalId]))),box=el('details');box.append(el('summary','Pacotes, medições e demandas vinculados'));
 const packages=project.packages.filter(pkg=>pkg.elements.some(e=>refs.has(JSON.stringify([e.modelId,e.globalId]))));
 if(!packages.length)box.append(el('p','Ainda sem pacote vinculado.'));
 for(const pkg of packages){const row=el('div');row.append(el('p',`${pkg.name} · ${pkg.quantity??'A quantificar'} ${pkg.unit}`));const open=el('button','Abrir pacote');open.onclick=()=>{h.setPanel('production',true);panel.focusPackage(pkg.id);};const supplies=el('button','Ver insumos');supplies.onclick=()=>{openPackageWorkspace(pkg.id,'Suprimentos');};row.append(open,supplies);box.append(row);}
 const measures=project.measures.filter(m=>refs.has(JSON.stringify([m.measure.elementRef.modelId,m.measure.elementRef.globalId])));box.append(el('p',`${measures.length} medições com conferência registrada; consulte a memória em Quantificação.`));h.propsEl.prepend(box);
}
function appendQuantity(elements:ElementRef[],count=selectedObjects.length){const q=quantityFor(elements),box=el('div','','quantity-callout');box.append(el('p',`Volume da seleção · ${count} elemento(s)`),el('strong',q.totalM3===null||q.count!==count?`Volume a conferir (${q.measured}/${count})`:`${q.totalM3.toLocaleString('pt-BR',{maximumFractionDigits:3})} m³`),helpButton('Origem do volume IFC',q.source||'Nenhum quantitativo vinculado à seleção.'));h.propsEl.prepend(box);}
function elementLabel(ref:ElementRef){const model=project.models.find(m=>m.id===ref.modelId);if(!model)return 'Elemento de modelo não carregado';let metadata=metadataCache.get(model.id+model.hash);if(!metadata){metadata=readIfcMetadata(new TextDecoder().decode(modelBytes.get(model.id)),model.id,model.hash);metadataCache.set(model.id+model.hash,metadata);}const item=metadata.get(ref.globalId),runtimeModel=runtime.get(model.id),task=runtimeModel?.tasks.find(t=>t.globalId===ref.globalId),place=task&&runtimeModel?selectionLocations.get(runtimeModel.model)?.get(task.localId):'';const name=task&&runtimeModel?selectionNames.get(runtimeModel.model)?.get(task.localId):undefined;const friendly:Record<string,string>={IFCSLAB:'Laje',IFCBEAM:'Viga',IFCCOLUMN:'Pilar',IFCFOOTING:'Fundação',IFCPILE:'Estaca',IFCWALL:'Parede'};return `${name||friendly[item?.ifcClass??'']||'Elemento do pacote'}${place?' · '+place:''}`;}
async function physicalSelection(refs:ElementRef[]){const items:SelectionItem<FragmentsModel>[]=[];for(const [id,r]of runtime){const ids=await r.model.getLocalIdsByGuids(refs.filter(e=>e.modelId===id).map(e=>e.globalId));items.push(...ids.filter((x):x is number=>x!==null).map(localId=>({model:r.model,localId})));}return items;}
function showElementRefs(refs:ElementRef[]){const epoch=++selectionEpoch;void physicalSelection(refs).then(items=>{if(epoch===selectionEpoch)applySelection(items,{fit:true,resetVisibility:true,showProperties:false});}).catch(e=>message(String(e),true));}
async function showPackage(pkg:WorkPackage){const epoch=++selectionEpoch;const items=await physicalSelection(pkg.elements);if(epoch!==selectionEpoch)return;const tasks=pkg.elements.flatMap(e=>runtime.get(e.modelId)?.tasks.filter(t=>t.globalId===e.globalId)??[]);applySelection(items,{tasks,fit:true,resetVisibility:true});await visualQueue;message(`${pkg.elements.length} referências IFC do pacote · ${tasks.length} registros 4D localizados.`);}
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
async function importIfc(bytes:Uint8Array,name:string,replaceId?:string,expected?:ScheduleRow[]){
 const text=new TextDecoder().decode(bytes);if(!text.includes('ISO-10303-21;'))throw new Error('Este arquivo não parece ser um IFC STEP.');
 const hash=await sha256(bytes);if(project.models.some(m=>m.hash===hash)){message('Esta revisão já está carregada. Nenhum elemento ou tarefa foi duplicado.');return;}
 const projectGlobalId=text.match(/IFCPROJECT\s*\(\s*'([^']+)'/i)?.[1]??'';let id=replaceId??JSON.stringify([projectGlobalId||'sem-GlobalId',name.toLowerCase()]);
 const sameProject=projectGlobalId?project.models.filter(m=>m.projectGlobalId===projectGlobalId):[];
 if(!replaceId&&!project.models.some(m=>m.id===id)&&sameProject.length){id=await chooseRevision(id,sameProject.map(m=>({id:m.id,name:m.name})));}
 message(`Carregando ${name}…`);let model:FragmentsModel|undefined;
 try{model=await viewer.loadIfc(bytes,`${name}-${crypto.randomUUID()}`);if(!model)throw new Error('Modelo IFC não foi carregado.');await viewer.setModelAlignment(model,project.display?.alignments?.[id]?.matrix);await viewer.setElementAlignments(model,project.display?.elementAlignments?.[id]);const tasks=await buildSchedule(model,id,readIfcVolumes(text));if(expected){const wanted=new Map(expected.flatMap(r=>r.globalIds.map(g=>[JSON.stringify([g,'CSV:'+r.id]),r] as const)));if(tasks.length!==wanted.size||tasks.some(t=>{const r=wanted.get(JSON.stringify([t.globalId,t.sourceTaskKey]));return !r||localDay(t.start)!==r.start||localDay(t.finish)!==r.finish||t.name!==r.name;}))throw new Error('Leitor 4D divergiu da prévia aprovada. Modelo atual preservado.');}const physical=await model.getGuidsByLocalIds(await model.getItemsIdsWithGeometry());const next=structuredClone(project);registerModel(next,{id,hash,name,projectGlobalId});next.tasks=next.tasks.filter(t=>t.modelId!==id).concat(tasks.filter(t=>t.globalId).map(toRecord));validateProject(next);const old=runtime.get(id);if(old)await viewer.unload(old.model);runtime.set(id,{model,tasks});physicalInventory.set(id,new Set(physical.filter((x):x is string=>!!x)));if(old){const oldMeta=project.models.find(m=>m.id===id);if(oldMeta&&modelBytes.has(id))byteArchive.set(oldMeta.hash,modelBytes.get(id)!);}modelBytes.set(id,bytes);byteArchive.set(hash,bytes);acceptProject(next);selected=[];try{await storeBytes(hash,bytes);}catch{message('Cache IFC indisponível. Exporte para guardar uma cópia.',true);}await drawModelViews();panel.render();}
 catch(e){if(model&&!Array.from(runtime.values()).some(r=>r.model===model))await viewer.unload(model);throw e;}
}
async function activate(next:Project,bytes:Map<string,Uint8Array>){
 tourCard?.remove();tourCard=undefined;
 const staged=await stageModels(next,bytes,{load:(b,name)=>viewer.loadIfc(b,name),read:async(model,id)=>{const tasks=await buildSchedule(model,id,readIfcVolumes(new TextDecoder().decode(bytes.get(id)!)));const physicalGuids=(await model.getGuidsByLocalIds(await model.getItemsIdsWithGeometry())).filter((x):x is string=>!!x);return {tasks,records:tasks.filter(t=>t.globalId).map(toRecord),physicalGuids};},unload:m=>viewer.unload(m)});
 clearTimeout(autoTimer);for(const d of document.querySelectorAll<HTMLDialogElement>('dialog.integrated-dialog')){d.close();d.remove();}for(const m of project.models){const data=modelBytes.get(m.id);if(data)byteArchive.set(m.hash,data);}activeDirectory=null;for(const r of runtime.values())await viewer.unload(r.model);runtime=staged;physicalInventory.clear();for(const [id,r]of runtime)physicalInventory.set(id,new Set((await r.model.getGuidsByLocalIds(await r.model.getItemsIdsWithGeometry())).filter((x):x is string=>!!x)));ensurePlanning(next);project=next;history=new ProjectHistory(project);modelBytes=bytes;displayGridElevation(project.display?.gridElevation??0);await displayAlignments();await displayElementAlignments();selected=[];quantSelection=[];quantTool.clearReports();quantTool.resetForProject(project.quantificationCatalog);persist();for(const m of next.models){try{await storeBytes(m.hash,bytes.get(m.id)!);}catch{message('Cache do IFC indisponível. Mantenha o arquivo portátil.',true);}}await drawModelViews();refreshEstimates(project);synchronizePlanning(project);panel.render();
}
function chooseRevision(newId:string,candidates:{id:string;name:string}[]):Promise<string>{return new Promise((resolve,reject)=>{
 const modal=el('dialog');modal.append(el('h2','Revisão ou outro modelo?'),el('p','O GlobalId do projeto é o mesmo de um modelo aberto. Confirme se o arquivo revisa esse modelo ou representa outra disciplina.'));
 for(const c of candidates){const b=el('button',`Substituir revisão de ${c.name}`);b.onclick=()=>{modal.close();modal.remove();resolve(c.id);};modal.append(b);}
 const separate=el('button','Adicionar como outro modelo'),cancel=el('button','Cancelar importação');separate.onclick=()=>{modal.close();modal.remove();resolve(newId);};const abort=()=>{modal.close();modal.remove();reject(new Error('Importação cancelada. Projeto preservado.'));};cancel.onclick=abort;modal.oncancel=e=>{e.preventDefault();abort();};modal.append(separate,cancel);root.append(modal);modal.showModal();
 });}
let replacementModel:string|undefined;
function openIfcInput(){replacementModel=undefined;h.fileInput.multiple=true;h.fileInput.click();}
button('Preparar IFC + cronograma',()=>openScheduleImport({models:()=>project.models.map(m=>({...m,blockedReason:project.packages.some(p=>p.elements.some(e=>e.modelId===m.id))?'Modelo com pacotes: prepare em uma cópia sem pacotes neste piloto.':undefined})),bytes:id=>modelBytes.get(id)!,context:()=>JSON.stringify([project.id,project.models]),selection:async id=>{const model=runtime.get(id)?.model;if(!model)return [];return (await model.getGuidsByLocalIds(selectedObjects.filter(s=>s.model===model).map(s=>s.localId))).filter((x):x is string=>!!x);},locate:async refs=>{const items=await physicalSelection(refs);applySelection(items,{fit:true,resetVisibility:true});await visualQueue;},initialPlan:project.schedulePreparation,applyBatch:applyPreparedSchedules}));
const importIfcButton=button('Importar IFC',openIfcInput);importIfcButton.className='primary';
h.fileInput.onchange=()=>void guarded(async()=>{try{for(const file of Array.from(h.fileInput.files??[]))await importIfc(new Uint8Array(await file.arrayBuffer()),file.name,replacementModel);}finally{h.fileInput.value='';replacementModel=undefined;h.fileInput.multiple=true;}});
h.fileInput.addEventListener('cancel',()=>{replacementModel=undefined;h.fileInput.multiple=true;});
button('Exportar projeto',()=>void exportPortable().catch(reportError));
const importProject=el('input');importProject.type='file';importProject.accept='.json';importProject.hidden=true;importProject.id='import-project';header.append(importProject);
button('Importar projeto portátil',()=>{if(!dirty)importProject.click();else message('Salve as alterações antes de importar outro projeto.',true);});
importProject.onchange=()=>void guarded(async()=>{const file=importProject.files?.[0];if(!file)return;const restored=await unpackProject(await file.text());await activate(restored.project,restored.bytes);activeDirectory=null;persist();importProject.value='';message('Projeto portátil importado. Use Salvar como para escolher sua pasta.');});
button('Projetos',()=>void goHome());
const tourButton=button('Tour do exemplo',()=>showTour(true));tourButton.hidden=true;
button('Dados do projeto',()=>showProjectSettings());
function showProjectSettings(){if(!opened)return;const d=el('dialog','','integrated-dialog'),title=el('h2','Dados gerais do projeto'),info=el('p','Esses dados pertencem à cópia local do projeto e podem ser alterados depois.'),fields:{key:'client'|'manager'|'description';input:HTMLInputElement}[]=[];d.append(title,info);for(const [key,label]of [['client','Cliente / obra'],['manager','Responsável'],['description','Descrição breve']] as const){const row=el('label',label),input=el('input') as HTMLInputElement;input.value=project.settings?.[key]??'';input.maxLength=500;row.append(input);fields.push({key,input});d.append(row);}const save=el('button','Salvar dados'),cancel=el('button','Cancelar');save.onclick=()=>{operate('Editar dados gerais',p=>{p.settings={client:'',manager:'',description:''};for(const {key,input}of fields)p.settings[key]=input.value.trim();});d.close();d.remove();};cancel.onclick=()=>{d.close();d.remove();};d.append(save,cancel);root.append(d);d.showModal();}
button('Salvar',()=>void saveCurrent().catch(reportError));
button('Salvar como',()=>void saveAs().catch(reportError));
button('Recarregar da pasta',()=>{if(!activeDirectory||saving||busy){message('Escolha uma pasta ou aguarde a gravação em curso.',true);return;}const dir=activeDirectory,d=el('dialog','','project-destination');d.setAttribute('aria-label','Recarregar projeto');d.append(el('h2','Recarregar projeto da pasta?'),el('p','As alterações ainda não salvas nesta sessão serão descartadas. Você pode salvar uma cópia primeiro.'));for(const [label,fn]of [['Cancelar',()=>{}],['Salvar uma cópia',()=>void saveAs().catch(reportError)],['Recarregar',()=>void loadFolder(dir).catch(reportError)]] as const){const b=el('button',label);b.onclick=()=>{d.close();d.remove();fn();};d.append(b);}root.append(d);d.showModal();});
const documentLabel=el('span','','document-label');header.append(documentLabel);
const compactHeader=el('button','','header-collapse');compactHeader.type='button';header.append(compactHeader);
let headerCompact=false;try{headerCompact=localStorage.getItem('coral.header-compact')==='true';}catch{}
function renderHeaderCompact(){header.classList.toggle('header-compact',headerCompact);compactHeader.textContent=headerCompact?'⌄ Expandir cabeçalho':'⌃ Recolher cabeçalho';compactHeader.setAttribute('aria-expanded',String(!headerCompact));}
compactHeader.onclick=()=>{headerCompact=!headerCompact;renderHeaderCompact();try{localStorage.setItem('coral.header-compact',String(headerCompact));}catch{}};renderHeaderCompact();

const workspaces=new Map<string,IntegratedWorkspace>();
const areaIds:Record<string,ViewerPanel>={'Pacotes':'packages','Restrições':'restrictions','Planejamento macro':'macro','Suprimentos':'supplies','Catálogos':'catalogues'};
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
async function historyStep(redo:boolean){if(busy||saving)return;const before=project,next=redo?history.redo(project):history.undo(project);if(next===before){message(redo?'Nada para refazer.':'Nada para desfazer.');return;}if(JSON.stringify(before.models)!==JSON.stringify(next.models)){const savedHistory=history,dir=activeDirectory;await activate(next,new Map(next.models.map(m=>{const data=byteArchive.get(m.hash)??(before.models.some(old=>old.id===m.id&&old.hash===m.hash)?modelBytes.get(m.id):undefined);if(!data)throw new Error('Revisão IFC indisponível na sessão; use Histórico.');return [m.id,data];})));history=savedHistory;activeDirectory=dir;}else project=next;displayGridElevation(project.display?.gridElevation??0);await displayAlignments();await displayElementAlignments();persist();quantTool.resetForProject(project.quantificationCatalog);panel.render(false);refreshPlanningViews();await refreshManagement();}
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
for(const b of Array.from(actions.querySelectorAll('button'))){if(['Exportar projeto','Importar projeto portátil','Salvar como','Histórico','Desfazer','Refazer','Recarregar da pasta','Dados do projeto'].includes(b.textContent??'')){fileItems.append(b);b.addEventListener('click',()=>{fileMenu.open=false;});}}
actions.insertBefore(fileMenu,toggle);actions.append(helpButton('Arquivos e salvamento','Salvar grava o projeto e os modelos na pasta escolhida. Salvar como cria uma cópia em outra pasta. Exportações ficam na subpasta Exportacoes. Ctrl+S salva; Ctrl+Shift+S abre Salvar como.'));

const recentsById=new Map<string,DirectoryHandle>();
let legacy:Project|null=null;try{legacy=restoreLocal();}catch{message('A sessão anterior não pôde ser lida. Use uma pasta ou arquivo portátil.',true);}
const portal=new ProjectPortal({onLogin:showHome,onNew:createLocalProject,onOpen:openLocalFolder,onRecent:openRecent,onRecover:recoverLegacy,onExplore:()=>openTemplate('explore'),onPractice:()=>openTemplate('e02')});root.append(portal.element);
header.inert=true;layout.inert=true;portal.showLogin();
function reportError(error:unknown){if(error instanceof Error&&error.name==='AbortError')return;const text=error instanceof Error?error.message:String(error);message(text,true);if(!opened)portal.showError(text);}
async function showHome(){
 tourCard?.remove();tourCard=undefined;for(const area of workspaces.values())area.hide();layout.hidden=false;clearTimeout(autoTimer);opened=false;header.inert=true;layout.inert=true;gantt.pause();
 let recents:Awaited<ReturnType<typeof recentFolders>>=[];try{recents=await recentFolders();}catch{/* A folder can still be opened explicitly if the recent index is unavailable. */}
 recentsById.clear();for(const row of recents)recentsById.set(row.id,row.handle);
 portal.showHome(recents,!!legacy);document.title='Projetos · IFC Coral';
}
function enterEditor(){opened=true;header.inert=false;layout.inert=false;portal.hide();tourButton.hidden=project.templateId!=='explore';updateDocumentTitle();window.dispatchEvent(new Event('resize'));}
let tourCard:HTMLElement|undefined;
function showTour(force=false){
 if(project.templateId!=='explore')return;
 const key=`ifc-coral-tour:${project.id}`;
 if(!force){try{if(localStorage.getItem(key)==='done')return;}catch{}}
 tourCard?.remove();const steps:[string,string,()=>void][]=[
  ['Modelo e elemento','A TORRE02 é um caso didático. Clique em um elemento para ler o GlobalId, as propriedades e a origem de cada quantidade.',()=>h.setPanel('properties',true)],
  ['Planejamento 4D','O cronograma mostra datas previstas no IFC; uma barra concluída no tempo não comprova obra executada.',()=>h.setPanel('timeline',true)],
  ['Pacote de produção','Há um pacote de concretagem fictício para examinar. A quantidade inicial de 12 m³ é premissa do cenário; confira o IFC antes de decidir.',()=>openWorkspace('Pacotes')],
  ['Restrições','Duas condições de exemplo já têm responsável e ação. Todas continuam pendentes até a equipe registrar evidências de liberação.',()=>openWorkspace('Restrições')],
  ['Suprimentos','Três propostas são fictícias e servem para comparação. Nenhum fornecedor foi contatado e nenhuma compra foi autorizada.',()=>openWorkspace('Suprimentos')],
  ['Sua cópia','Use Salvar como para escolher uma pasta. Você pode pular este tour agora e reiniciá-lo pelo botão Tour do exemplo.',()=>{}]
 ];
 let index=0;const card=el('aside','','example-tour');card.setAttribute('role','region');card.setAttribute('aria-label','Tour do projeto modelo');
 const heading=el('h2'),body=el('p'),progress=el('span','','example-tour-progress'),back=el('button','Voltar'),next=el('button','Próximo'),skip=el('button','Pular tour');for(const b of [back,next,skip])b.type='button';
 const finish=()=>{try{localStorage.setItem(key,'done');}catch{}card.remove();if(tourCard===card)tourCard=undefined;};
 const render=()=>{heading.textContent=steps[index][0];body.textContent=steps[index][1];progress.textContent=`${index+1} de ${steps.length}`;back.disabled=index===0;next.textContent=index===steps.length-1?'Concluir':'Próximo';steps[index][2]();};
 back.onclick=()=>{if(index>0){index--;render();}};next.onclick=()=>{if(index===steps.length-1)finish();else{index++;render();}};skip.onclick=finish;
 const controls=el('div','','example-tour-actions');controls.append(back,next,skip);card.append(progress,heading,body,controls);root.append(card);tourCard=card;render();
}
async function remember(){if(activeDirectory)try{await rememberFolder(activeDirectory,project);}catch{message('Projeto salvo; não foi possível atualizar a lista de recentes.',true);}}
async function createLocalProject(){
 await projectDestination({title:'Crie — Meu Novo Projeto',name:'Meu Novo Projeto',confirm:'Criar projeto',generalSettings:true,save:async(name,parent,settings)=>{
 await engineReady;
 const dir=await createProjectFolder(parent,name),next=createProject();next.name=name;next.settings=settings??{client:'',manager:'',description:''};
 await saveProjectFolder(dir,next,new Map());
 setBusy(true);try{await visualQueue;await activate(next,new Map());activeDirectory=dir;dirty=false;enterEditor();await remember();message(`Projeto criado na pasta ${dir.name}.`);}finally{setBusy(false);}
 }});
}
async function openTemplate(variant:'explore'|'e02'){
 portal.showStatus('Preparando uma cópia independente da TORRE02 e do cronograma 4D…');
 await engineReady;setBusy(true);
 try{
  const response=await fetch(`${import.meta.env.BASE_URL}models/TORRE02_ESTRUTURA_4D.ifc`);
  if(!response.ok)throw new Error('Modelo didático não encontrado. Tente recarregar a página.');
  const next=await torreTemplate(new Uint8Array(await response.arrayBuffer()),variant);
  await visualQueue;await activate(next.project,next.bytes);activeDirectory=null;dirty=true;enterEditor();
  if(variant==='explore'){
   operate('Preparar exemplo fictício',p=>{addConcreteCase(p,p.tasks);const pkg=p.packages[0];pkg.responsible='Equipe de produção (exemplo)';pkg.constraints[0].description='Conferir revisão de projeto antes da concretagem';pkg.constraints[0].owner='Equipe de projeto';pkg.constraints[0].action='Validar a prancha vigente';pkg.constraints[4].description='Confirmar entrega de concreto na frente prevista';pkg.constraints[4].owner='Equipe de suprimentos';pkg.constraints[4].action='Conferir prazo e especificação';});
   showTour();message('Exemplo fictício aberto. Explore os dados, use o tour e escolha Salvar como para criar sua cópia.');
  }else message('Exercício 02 aberto. O IFC e o 4D estão prontos; o grupo construirá os pacotes e restrições. Use Salvar como para sua cópia.');
 }finally{setBusy(false);}
}
async function loadFolder(dir:DirectoryHandle){
 await engineReady;setBusy(true);try{const restored=await readProjectFolder(dir),before=JSON.stringify(restored.project);await visualQueue;await activate(restored.project,restored.bytes);await loadReports(dir);refreshEstimates(project);synchronizePlanning(project);activeDirectory=dir;dirty=before!==JSON.stringify(project);enterEditor();showTour();await remember();message(`Projeto aberto da pasta ${dir.name}.`);if(dirty)persist();}finally{setBusy(false);}
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
let coordinateEpoch=0,coordinateTimer:ReturnType<typeof setTimeout>|undefined;
viewer.canvas.addEventListener('pointermove',event=>{const x=event.clientX,y=event.clientY,epoch=++coordinateEpoch;clearTimeout(coordinateTimer);coordinateTimer=setTimeout(()=>{if(!opened)return;void viewer.pointAt(x,y).then(point=>{if(epoch!==coordinateEpoch)return;coordinateReadout.textContent=point?`X ${point.x.toLocaleString('pt-BR',{maximumFractionDigits:3})} · Y ${point.y.toLocaleString('pt-BR',{maximumFractionDigits:3})} · Z ${point.z.toLocaleString('pt-BR',{maximumFractionDigits:3})} m · ${point.source}`:'Sem interseção com modelo ou grade';}).catch(()=>{if(epoch===coordinateEpoch)coordinateReadout.textContent='Coordenadas indisponíveis';});},100);});
viewer.canvas.addEventListener('pointerleave',()=>{coordinateEpoch++;clearTimeout(coordinateTimer);coordinateReadout.textContent='Coordenadas locais: passe o cursor sobre o modelo.';});
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

async function applyPreparedSchedules(items:PreparedModel[],receipt:PipelineReceipt){
 if(busy||saving)throw new Error('Aguarde o salvamento ou a operação atual.');
 if(!activeDirectory)throw new Error('Use Salvar como para escolher a pasta do projeto antes de aplicar.');
 validatePlan(receipt.plan);
 const needed=receipt.plan.models.filter(m=>rowsForModel(receipt.plan,m.id).length||receipt.plan.corrections.some(c=>c.modelId===m.id)||receipt.plan.clearScheduleModels?.includes(m.id));
 if(items.length!==needed.length||new Set(items.map(i=>i.model.id)).size!==items.length||needed.some(m=>!items.some(i=>i.model.id===m.id)))throw new Error('Conjunto de cópias incompleto.');
 for(const m of receipt.plan.models)if(project.models.find(p=>p.id===m.id)?.hash!==m.hash)throw new Error('A revisão mudou. Refaça a preparação.');
 const dir=activeDirectory,next=structuredClone(project),nextBytes=new Map(modelBytes),staged=new Map<string,{model:FragmentsModel;tasks:ElementTask[];physical:Set<string>}>(),loaded:FragmentsModel[]=[],prefix='preparacao-4D-'+crypto.randomUUID();
 setBusy(true);clearTimeout(autoTimer);gantt.pause();
 try{
  await visualQueue;
  const warning=await preparationTransaction(items,{
   stage:async({model,result})=>{
    validateModelSlice(receipt.plan,model.id,model.hash,result.manifest.rows,receipt.csv);
    if(result.manifest.sourceHash!==model.hash||project.packages.some(p=>p.elements.some(e=>e.modelId===model.id)))throw new Error('Revisão inválida ou modelo com pacotes.');
    const edits=receipt.plan.corrections.filter(c=>c.modelId===model.id).map(({modelId,...c})=>c);
    if(JSON.stringify(result.manifest.corrections??[])!==JSON.stringify(edits))throw new Error('Correções divergiram da conferência.');
    const bytes=Uint8Array.from(atob(result.data),c=>c.charCodeAt(0));if(await sha256(bytes)!==result.manifest.resultHash)throw new Error('Integridade do IFC gerado divergente.');
    const name=model.name.replace(/(?:-4D)*\.ifc$/i,'')+'-4D.ifc',fresh=await viewer.loadIfc(bytes,name+'-'+crypto.randomUUID());if(!fresh)throw new Error('Falha ao carregar cópia IFC.');loaded.push(fresh);
    await viewer.setModelAlignment(fresh,project.display?.alignments?.[model.id]?.matrix);await viewer.setElementAlignments(fresh,project.display?.elementAlignments?.[model.id]);
    const tasks=await buildSchedule(fresh,model.id,readIfcVolumes(new TextDecoder().decode(bytes))),wanted=new Map(result.manifest.rows.flatMap(r=>r.globalIds.map(g=>[JSON.stringify([g,'CSV:'+r.id]),r] as const)));
    if(tasks.length!==wanted.size||tasks.some(t=>{const r=wanted.get(JSON.stringify([t.globalId,t.sourceTaskKey]));return !r||localDay(t.start)!==r.start||localDay(t.finish)!==r.finish||t.name!==r.name;}))throw new Error('Leitor 4D divergiu da prévia. Os modelos atuais foram preservados.');
    const physical=new Set((await fresh.getGuidsByLocalIds(await fresh.getItemsIdsWithGeometry())).filter((x):x is string=>!!x));
    staged.set(model.id,{model:fresh,tasks,physical});registerModel(next,{...next.models.find(m=>m.id===model.id)!,hash:result.manifest.resultHash,name});next.tasks=next.tasks.filter(t=>t.modelId!==model.id).concat(tasks.filter(t=>t.globalId).map(toRecord));nextBytes.set(model.id,bytes);
   },
   commit:async()=>{
    next.schedulePreparation=structuredClone(receipt.plan);ensurePlanning(next);refreshEstimates(next,nextBytes,new Map([...runtime,...staged]));synchronizePlanning(next);log(next,'Preparação 4D federada aprovada',JSON.stringify({operation:prefix,reviewer:receipt.reviewer,models:items.map(i=>({modelId:i.model.id,source:i.model.hash,result:i.result.manifest.resultHash}))}));validateProject(next);
    await saveArtifact(dir,prefix+'-origem.csv',new Blob([receipt.sourceBytesBase64?Uint8Array.from(atob(receipt.sourceBytesBase64),c=>c.charCodeAt(0)):receipt.sourceCsv],{type:'text/csv'}));await saveArtifact(dir,prefix+'-normalizado.csv',new Blob([receipt.csv],{type:'text/csv;charset=utf-8'}));
    await saveArtifact(dir,prefix+'-manifesto.json',new Blob([JSON.stringify({...receipt,models:items.map(i=>({model:i.model,manifest:i.result.manifest}))},null,2)],{type:'application/json'}));
    for(const [index,i]of items.entries())await saveArtifact(dir,prefix+'-'+index+'-original.ifc',new Blob([Uint8Array.from(modelBytes.get(i.model.id)!)]));
    await saveProjectFolder(dir,next,nextBytes);
   },
   isCommitted:async()=>JSON.stringify((await readProjectFolder(dir)).project)===JSON.stringify(next),
   adopt:async()=>{
    const oldModels:FragmentsModel[]=[];for(const i of items){const previous=runtime.get(i.model.id);if(previous)oldModels.push(previous.model);byteArchive.set(i.model.hash,modelBytes.get(i.model.id)!);byteArchive.set(i.result.manifest.resultHash,nextBytes.get(i.model.id)!);runtime.set(i.model.id,staged.get(i.model.id)!);physicalInventory.set(i.model.id,staged.get(i.model.id)!.physical);}
    project=history.apply(project,'Aplicar preparação 4D federada',p=>Object.assign(p,next));modelBytes=nextBytes;dirty=false;selected=[];selectedObjects=[];quantSelection=[];quantTool.clearReports();quantTool.resetForProject(project.quantificationCatalog);
    await Promise.allSettled(oldModels.map(m=>viewer.unload(m)));for(const i of items)try{await storeBytes(i.result.manifest.resultHash,nextBytes.get(i.model.id)!);}catch{/* Folder remains authoritative. */}
    await drawModelViews();panel.render();refreshPlanningViews();await remember();message('Preparação 4D aplicada e salva na pasta.');
   },
   rollback:async()=>{await Promise.allSettled(loaded.map(m=>viewer.unload(m)));}
  });
  return warning;
 }finally{setBusy(false);}
}
