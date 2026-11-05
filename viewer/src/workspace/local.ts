import type {Project} from '../production/types.ts';
import {validateProject,serializeProject,parseProject} from '../production/project.ts';
import {unpackProject,sha256} from '../production/storage.ts';
import {chooseLocalDirectory,serializeDirectory,restoreDirectory} from './bridge.ts';

type Permission = 'granted'|'denied'|'prompt';
type Writable = {
 write(data:string|Blob|Uint8Array):Promise<void>;
 close():Promise<void>;
 abort():Promise<void>;
};
type FileHandle = {
 readonly kind:'file';
 readonly name:string;
 getFile():Promise<File>;
 createWritable(options?:{expectedHash?:string}):Promise<Writable>;
};
/** Structural subset of the native File System Access API, also usable by test doubles. */
export type DirectoryHandle = {
 readonly kind:'directory';
 readonly name:string;
 readonly displayPath?:string;
 getDirectoryHandle(name:string,options?:{create?:boolean}):Promise<DirectoryHandle>;
 getFileHandle(name:string,options?:{create?:boolean}):Promise<FileHandle>;
 values():AsyncIterableIterator<DirectoryHandle|FileHandle>;
 queryPermission(options:{mode:'readwrite'}):Promise<Permission>;
 requestPermission(options:{mode:'readwrite'}):Promise<Permission>;
};
export const PROJECT_FILE='IFC-Coral.projeto.json';
type FolderRecord={id:string;name:string;folderName:string;handle:DirectoryHandle};
const observedVersions=new WeakMap<DirectoryHandle,string>();
const textHash=(value:string)=>sha256(new TextEncoder().encode(value));
const stale=()=>new Error('O projeto foi alterado em outra sessão. Reabra a pasta antes de salvar para evitar perda de alterações.');

/** Folder v2 keeps immutable IFC blobs outside the JSON. Portable v1 stays readable. */
async function packFolder(project:Project,bytes:Map<string,Uint8Array>){
 for(const m of project.models){const value=bytes.get(m.id);if(!value||await sha256(value)!==m.hash)throw new Error('Falha de integridade do IFC antes de salvar.');}
 return JSON.stringify({format:'ifc-coral-folder',version:2,project,models:project.models.map(m=>({id:m.id,hash:m.hash}))});
}
async function unpackFolder(dir:DirectoryHandle,text:string):Promise<{project:Project;bytes:Map<string,Uint8Array>}>{
 const data=JSON.parse(text);if(data.format==='ifc-coral')return unpackProject(text);
 if(data.format!=='ifc-coral-folder'||data.version!==2||Object.keys(data).some(k=>!['format','version','project','models'].includes(k)))throw new Error('Formato de pasta não reconhecido.');
 const project=parseProject(JSON.stringify(data.project)),bytes=new Map<string,Uint8Array>();
 if(!Array.isArray(data.models)||data.models.length!==project.models.length)throw new Error('Referências IFC ausentes.');
 for(const row of data.models){const m=project.models.find(m=>m.id===row?.id);if(!m||bytes.has(m.id)||row.hash!==m.hash||! /^[a-f0-9]{64}$/.test(row.hash)||Object.keys(row).some(k=>!['id','hash'].includes(k)))throw new Error('Referência IFC com integridade divergente.');const folder=await dir.getDirectoryHandle('Modelos'),file=await folder.getFileHandle(`${m.hash}.ifc`),value=new Uint8Array(await (await file.getFile()).arrayBuffer());if(await sha256(value)!==m.hash)throw new Error('Arquivo IFC ausente ou com integridade divergente.');bytes.set(m.id,value);}
 return {project,bytes};
}

/** Call from the click handler itself: the picker requires transient user activation. */
export async function chooseDirectory():Promise<DirectoryHandle>{
 const local=await chooseLocalDirectory();
 if(local===null)throw new DOMException('Seleção de pasta cancelada.','AbortError');
 if(local)return local;
 const picker=(globalThis as unknown as {showDirectoryPicker?:(options:{mode:'readwrite'})=>Promise<DirectoryHandle>}).showDirectoryPicker;
 if(!picker)throw new Error('Pastas locais exigem Chrome ou Edge com acesso ao sistema de arquivos.');
 try{return await picker.call(globalThis,{mode:'readwrite'});}
 catch(error){
  if(error instanceof Error&&error.name==='AbortError')throw new Error('Nenhuma pasta foi selecionada ou o navegador interrompeu a seleção. Tente novamente. Se a janela de pastas não aparecer no navegador integrado, abra este endereço diretamente no Chrome ou Edge.',{cause:error});
  throw error;
 }
}

/** Requests are opt-in and must be called by an explicit permission button. */
export async function ensurePermission(dir:DirectoryHandle,request=false):Promise<boolean>{
 // Start requestPermission synchronously when explicitly requested, retaining the user gesture.
 return (request?await dir.requestPermission({mode:'readwrite'}):await dir.queryPermission({mode:'readwrite'}))==='granted';
}

function safeName(name:string):string{
 if(!name||name!==name.trim()||name.length>180||/[<>:"/\\|?*\u0000-\u001f\u007f]/.test(name)||/[. ]$/.test(name)||name==='.'||name==='..'||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)){
  throw new Error('Nome inválido: informe um único nome seguro de pasta ou arquivo.');
 }
 return name;
}
function missing(error:unknown):boolean{return error instanceof Error&&error.name==='NotFoundError';}
async function maybeFile(dir:DirectoryHandle,name:string):Promise<FileHandle|undefined>{
 try{return await dir.getFileHandle(name);}catch(error){if(missing(error))return undefined;throw error;}
}

// One queue across handles (including separate handles pointing at the same folder).
// Web Locks extends the same ordering to other tabs of this application origin.
let pending:Promise<unknown>=Promise.resolve();
function exclusive<T>(operation:()=>Promise<T>):Promise<T>{
 const run=async()=>{
  if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request('ifc-coral-local-folder-write',operation);
  return operation();
 };
 const next=pending.then(run,run);pending=next.then(()=>undefined,()=>undefined);return next;
}

async function writeAtomically(handle:FileHandle,data:string|Blob|Uint8Array,expectedHash?:string):Promise<void>{
 // Native createWritable stages changes in a temporary file; only successful close commits.
 const stream=await handle.createWritable(expectedHash?{expectedHash}:undefined);
 try{await stream.write(data);await stream.close();}
 catch(error){
  try{await stream.abort();}catch(abortError){throw new AggregateError([error,abortError],'Falha na gravação e no encerramento do arquivo.');}
  throw error;
 }
}

export async function createProjectFolder(parent:DirectoryHandle,name:string):Promise<DirectoryHandle>{
 safeName(name);
 return exclusive(async()=>{
  // values sees both files and folders, and does not follow any directory entries.
  for await(const entry of parent.values())if(entry.name.toLocaleLowerCase()===name.toLocaleLowerCase())throw new Error('Já existe um arquivo ou pasta com esse nome. Escolha outro nome.');
  return parent.getDirectoryHandle(name,{create:true});
 });
}

export async function saveProjectFolder(dir:DirectoryHandle,project:Project,bytes:Map<string,Uint8Array>):Promise<void>{
 // Capture and validate before awaiting the write queue: later UI edits cannot alter this save.
 const snapshot={project:parseProject(serializeProject(project)),bytes:new Map([...bytes].map(([id,value])=>[id,Uint8Array.from(value)]))};
 return exclusive(async()=>{
  const packed=await packFolder(snapshot.project,snapshot.bytes);
  const existing=await maybeFile(dir,PROJECT_FILE);
  const currentText=existing?await (await existing.getFile()).text():'';
  const observed=observedVersions.get(dir);
  if(observed&&(!currentText||await textHash(currentText)!==observed))throw stale();
  let recovering=false;
  if(currentText){
   const current=await unpackFolder(dir,currentText);
   if(current.project.id!==snapshot.project.id)throw new Error('Esta pasta pertence a outro projeto. Escolha uma pasta nova.');
  }else{
   // The zero-length marker is created before staging any data. Its filename binds it
   // to this project without an additional writable.close transaction that could fail.
   // Only absent/empty initial packages may recover; nonempty corrupt JSON never does.
   const markerName=`IFC-Coral.inicial-${await textHash(snapshot.project.id)}.marcador`;
   const marker=await maybeFile(dir,markerName);
   if(marker){
    if((await marker.getFile()).size!==0)throw new Error('Marcador inicial inválido. A pasta foi preservada.');
    for await(const entry of dir.values())if(entry.name!==markerName&&entry.name!==PROJECT_FILE&&!(entry.name==='Modelos'&&entry.kind==='directory'))throw new Error('A pasta contém arquivos desconhecidos. A recuperação inicial foi recusada.');
    try{
     const models=await dir.getDirectoryHandle('Modelos');
     for await(const entry of models.values())if(entry.kind!=='file'||!(/^[a-f0-9]{64}\.ifc$/.test(entry.name)))throw new Error('A pasta Modelos contém arquivos desconhecidos. A recuperação inicial foi recusada.');
    }catch(error){if(!missing(error))throw error;}
    recovering=true;
   }else{
    for await(const _entry of dir.values())throw new Error('A pasta contém arquivos e não é um projeto IFC Coral reconhecido. Escolha uma pasta vazia.');
    await dir.getFileHandle(markerName,{create:true});
   }
  }
  if(snapshot.project.models.length){
   const models=await dir.getDirectoryHandle('Modelos',{create:true});
   for(const model of snapshot.project.models){
    const name=`${model.hash}.ifc`,value=snapshot.bytes.get(model.id)!;
    const copy=await maybeFile(models,name);
    if(copy){
     const file=await copy.getFile();
     if(recovering&&file.size===0)await writeAtomically(copy,value);
     else if(await sha256(new Uint8Array(await file.arrayBuffer()))!==model.hash)throw new Error('Cópia IFC existente com integridade divergente.');
    }else await writeAtomically(await models.getFileHandle(name,{create:true}),value);
   }
  }
  if(currentText&&currentText!==packed)await storeVersion(dir,currentText);
  await writeAtomically(existing??await dir.getFileHandle(PROJECT_FILE,{create:true}),packed,await textHash(currentText));
  observedVersions.set(dir,await textHash(packed));
  await storeVersion(dir,packed);
 });
}

async function storeVersion(dir:DirectoryHandle,text:string){const folder=await dir.getDirectoryHandle('Historico',{create:true}),hash=await textHash(text),description=String(JSON.parse(text).project?.audit?.at(-1)?.action??'Projeto salvo').replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,60);for await(const entry of folder.values())if(entry.kind==='file'&&entry.name.endsWith(`-${hash}.json`)){const existing=await (await entry.getFile()).text();if(await textHash(existing)===hash)return;}await writeAtomically(await folder.getFileHandle(`${new Date().toISOString().replace(/[:.]/g,'-')}-${description}-${crypto.randomUUID().slice(0,8)}-${hash}.json`,{create:true}),text);}
export async function listProjectVersions(dir:DirectoryHandle){let folder:DirectoryHandle;try{folder=await dir.getDirectoryHandle('Historico');}catch(e){if(missing(e))return [];throw e;}const result:{name:string;title:string}[]=[];for await(const e of folder.values())if(e.kind==='file'&&/^\d{4}-.*-[a-f0-9]{64}\.json$/.test(e.name))result.push({name:e.name,title:e.name.slice(0,24)+(e.name.match(/^.{24}-(.*)-[a-f0-9]{8}-[a-f0-9]{64}\.json$/)?.[1]?' · '+e.name.match(/^.{24}-(.*)-[a-f0-9]{8}-[a-f0-9]{64}\.json$/)![1]:'')});return result.sort((a,b)=>b.name.localeCompare(a.name));}
export async function readProjectVersion(dir:DirectoryHandle,name:string){safeName(name);if(!/^\d{4}-.*-[a-f0-9]{64}\.json$/.test(name))throw new Error('Versão inválida.');const folder=await dir.getDirectoryHandle('Historico'),file=await folder.getFileHandle(name),text=await (await file.getFile()).text();if(!name.endsWith(`-${await textHash(text)}.json`))throw new Error('Integridade da versão divergente.');return unpackFolder(dir,text);}

export async function readProjectFolder(dir:DirectoryHandle):Promise<{project:Project;bytes:Map<string,Uint8Array>}>{
 // v2 references are authoritative only after the hashes of immutable model files are checked.
 const file=await dir.getFileHandle(PROJECT_FILE);
 const text=await (await file.getFile()).text(),restored=await unpackFolder(dir,text);
 observedVersions.set(dir,await textHash(text));return restored;
}

export async function saveArtifact(dir:DirectoryHandle,name:string,blob:Blob):Promise<void>{
 safeName(name);
 return exclusive(async()=>{
  const exports=await dir.getDirectoryHandle('Exportacoes',{create:true});
  const names=new Set<string>();for await(const entry of exports.values())names.add(entry.name.toLocaleLowerCase());
  const dot=name.lastIndexOf('.'),stem=dot>0?name.slice(0,dot):name,extension=dot>0?name.slice(dot):'';
  let target=name,index=1;while(names.has(target.toLocaleLowerCase()))target=`${stem} (${index++})${extension}`;
  await writeAtomically(await exports.getFileHandle(target,{create:true}),blob);
 });
}

function openRecentDB():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open('ifc-coral-workspace-folders',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('folders',{keyPath:'id'});
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  req.onblocked=()=>reject(new Error('Índice de pastas bloqueado por outra aba.'));
 });
}
export async function rememberFolder(dir:DirectoryHandle,project:Project):Promise<void>{
 validateProject(project);
 const db=await openRecentDB();
 try{
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction('folders','readwrite');
   // Only an identifier, display names and native handle; no project, IFC or credentials.
   tx.objectStore('folders').put({id:project.id,name:project.name,folderName:dir.name,handle:serializeDirectory(dir)});
   tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
 }finally{db.close();}
}
export async function recentFolders():Promise<FolderRecord[]>{
 const db=await openRecentDB();
 try{
  return await new Promise<FolderRecord[]>((resolve,reject)=>{
   const tx=db.transaction('folders','readonly'),req=tx.objectStore('folders').getAll();
   tx.oncomplete=()=>resolve((req.result as FolderRecord[]).map(row=>({...row,handle:restoreDirectory(row.handle)})));tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
 }finally{db.close();}
}
