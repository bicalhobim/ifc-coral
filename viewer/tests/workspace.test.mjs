import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../src/production/project.ts';
import {sha256,unpackProject} from '../src/production/storage.ts';
import {PROJECT_FILE,chooseDirectory,ensurePermission,createProjectFolder,saveProjectFolder,readProjectFolder,saveArtifact,rememberFolder,recentFolders,listProjectVersions,readProjectVersion} from '../src/workspace/local.ts';

const notFound=()=>new DOMException('Missing','NotFoundError');

test('successful saves retain recoverable previous and current versions',async()=>{
 const dir=new FakeDirectory('History'),{project,bytes}=await fixture();await saveProjectFolder(dir,project,bytes);project.name='Changed';await saveProjectFolder(dir,project,bytes);
 const versions=await dir.getDirectoryHandle('Historico');const texts=[];for await(const entry of versions.values())if(entry.kind==='file')texts.push(await (await entry.getFile()).text());assert.ok(texts.some(t=>JSON.parse(t).project.name==='Changed'));assert.ok(texts.some(t=>JSON.parse(t).project.name==='Novo projeto'));
});
test('retry repairs history after partial failure without discarding damaged evidence',async()=>{
 const dir=new FakeDirectory('History failure'),{project,bytes}=await fixture();
 const history=new FakeDirectory('Historico');const get=history.getFileHandle.bind(history);let first=true;
 history.getFileHandle=async(...args)=>{const file=await get(...args);if(first){first=false;file.failWrite=true;}return file;};
 const original=dir.getDirectoryHandle.bind(dir);dir.getDirectoryHandle=async(name,options)=>{if(name==='Historico'){dir.entries.set(name,history);return history;}return original(name,options);};
 await assert.rejects(()=>saveProjectFolder(dir,project,bytes),/disk full/);await saveProjectFolder(dir,project,bytes);
 const versions=await listProjectVersions(dir);assert.equal(versions.length,2);
 assert.equal((await readProjectVersion(dir,versions[0].name)).project.id,project.id);
});
class FakeFile {
 kind='file';data=new Uint8Array();failWrite=false;failClose=false;aborts=0;
 constructor(name){this.name=name;}
 async getFile(){return new Blob([this.data]);}
 async createWritable(){
  let staged=this.data;
  return {
   write:async value=>{if(this.failWrite)throw new Error('disk full');staged=new Uint8Array(await new Blob([value]).arrayBuffer());},
   close:async()=>{if(this.failClose)throw new Error('close failed');this.data=staged;},
   abort:async()=>{this.aborts++;}
  };
 }
}
class FakeDirectory {
 kind='directory';entries=new Map();queries=0;requests=0;permission='prompt';
 constructor(name){this.name=name;}
 async getFileHandle(name,options){return this.get(name,'file',options);}
 async getDirectoryHandle(name,options){return this.get(name,'directory',options);}
 get(name,kind,options){
  let entry=this.entries.get(name);
  if(!entry){if(!options?.create)throw notFound();entry=kind==='file'?new FakeFile(name):new FakeDirectory(name);this.entries.set(name,entry);}
  if(entry.kind!==kind)throw new DOMException('Wrong type','TypeMismatchError');return entry;
 }
 async *values(){yield* this.entries.values();}
 async queryPermission(){this.queries++;return this.permission;}
 async requestPermission(){this.requests++;this.permission='granted';return this.permission;}
}
async function fixture(){
 const project=createProject(),bytes=new TextEncoder().encode('ISO-10303-21; model');
 project.models.push({id:'model',name:'../Não usar este nome.ifc',hash:await sha256(bytes),projectGlobalId:'ifc-project'});
 return {project,bytes:new Map([['model',bytes]])};
}

test('project folder roundtrip is portable, authoritative and uses content hashes for model copies',async()=>{
 const dir=new FakeDirectory('Projeto'),{project,bytes}=await fixture();
 await saveProjectFolder(dir,project,bytes);
 assert.deepEqual(await readProjectFolder(dir),{project,bytes});
 const models=await dir.getDirectoryHandle('Modelos');
 assert.deepEqual([...models.entries.keys()],[`${project.models[0].hash}.ifc`]);
 const packed=await (await (await dir.getFileHandle(PROJECT_FILE)).getFile()).text();
 assert.deepEqual(await unpackProject(packed),{project,bytes});
 // Copies are convenient exports; missing/damaged copies do not corrupt portable package reads.
 models.entries.clear();assert.deepEqual(await readProjectFolder(dir),{project,bytes});
});

test('writes and close failures leave previous authoritative project intact and propagate errors',async()=>{
 const dir=new FakeDirectory('Projeto'),{project,bytes}=await fixture();await saveProjectFolder(dir,project,bytes);
 const original=structuredClone(project),file=await dir.getFileHandle(PROJECT_FILE);
 project.name='Alterado';
 for(const mode of ['failWrite','failClose']){
  file[mode]=true;await assert.rejects(()=>saveProjectFolder(dir,project,bytes),/disk full|close failed/);
  assert.deepEqual((await readProjectFolder(dir)).project,original);file[mode]=false;
 }
 assert.equal(file.aborts,2);await saveProjectFolder(dir,project,bytes);assert.equal((await readProjectFolder(dir)).project.name,'Alterado');
});

test('initial package close failure can retry with a fresh handle and only the same project',async()=>{
 const dir=new FakeDirectory('Projeto'),{project,bytes}=await fixture();
 const nativeGetFile=dir.getFileHandle.bind(dir);let fail=true;
 dir.getFileHandle=async(name,options)=>{const file=await nativeGetFile(name,options);if(name===PROJECT_FILE)file.failClose=fail;return file;};
 await assert.rejects(()=>saveProjectFolder(dir,project,bytes),/close failed/);
 assert.equal((await (await dir.getFileHandle(PROJECT_FILE)).getFile()).size,0);
 const reopened=new FakeDirectory('Projeto');reopened.entries=dir.entries;
 await assert.rejects(()=>saveProjectFolder(reopened,createProject(),new Map()),/pasta contém/i);
 fail=false;(await nativeGetFile(PROJECT_FILE)).failClose=false;
 await saveProjectFolder(reopened,project,bytes);assert.deepEqual(await readProjectFolder(reopened),{project,bytes});
});

test('initial model write failure can retry and repair only empty staged copies',async()=>{
 const dir=new FakeDirectory('Projeto'),{project,bytes}=await fixture();
 const nativeGetDirectory=dir.getDirectoryHandle.bind(dir);let fail=true;
 dir.getDirectoryHandle=async(name,options)=>{
  const folder=await nativeGetDirectory(name,options);
  if(name==='Modelos'){
   const nativeGet=FakeDirectory.prototype.getFileHandle.bind(folder);
   folder.getFileHandle=async(fileName,fileOptions)=>{const file=await nativeGet(fileName,fileOptions);file.failWrite=fail;return file;};
  }return folder;
 };
 await assert.rejects(()=>saveProjectFolder(dir,project,bytes),/disk full/);
 assert.equal(dir.entries.has(PROJECT_FILE),false);
 const models=await nativeGetDirectory('Modelos');assert.equal((await (await models.getFileHandle(`${project.models[0].hash}.ifc`)).getFile()).size,0);
 fail=false;await saveProjectFolder(dir,project,bytes);assert.deepEqual(await readProjectFolder(dir),{project,bytes});
});

test('empty legacy package without ownership marker and nonempty corruption are never recovered',async()=>{
 const unknown=new FakeDirectory('Legado'),{project,bytes}=await fixture();await unknown.getFileHandle(PROJECT_FILE,{create:true});
 await assert.rejects(()=>saveProjectFolder(unknown,project,bytes),/pasta contém/i);assert.equal(unknown.entries.size,1);
 const own=new FakeDirectory('Projeto');await saveProjectFolder(own,project,bytes);
 (await own.getFileHandle(PROJECT_FILE)).data=new TextEncoder().encode('{corrupt');
 const reopened=new FakeDirectory('Projeto');reopened.entries=own.entries;
 await assert.rejects(()=>saveProjectFolder(reopened,project,bytes));
 assert.equal(await (await (await reopened.getFileHandle(PROJECT_FILE)).getFile()).text(),'{corrupt');
});

test('two handles with previously read versions reject a stale overwrite until reopened',async()=>{
 const first=new FakeDirectory('Projeto'),second=new FakeDirectory('Projeto'),{project,bytes}=await fixture();second.entries=first.entries;
 await saveProjectFolder(first,project,bytes);
 const a=await readProjectFolder(first),b=await readProjectFolder(second);
 a.project.name='Salvo na primeira sessão';await saveProjectFolder(first,a.project,a.bytes);
 b.project.name='Alteração obsoleta';await assert.rejects(()=>saveProjectFolder(second,b.project,b.bytes),/alterado em outra sessão/i);
 assert.equal((await readProjectFolder(first)).project.name,'Salvo na primeira sessão');
 const refreshed=await readProjectFolder(second);refreshed.project.name='Reaberto e conferido';
 await saveProjectFolder(second,refreshed.project,refreshed.bytes);assert.equal((await readProjectFolder(second)).project.name,'Reaberto e conferido');
});

test('rejects foreign, corrupt and unfamiliar folders without replacing user data',async()=>{
 const dir=new FakeDirectory('A'),{project,bytes}=await fixture();await saveProjectFolder(dir,project,bytes);
 const foreign=createProject();await assert.rejects(()=>saveProjectFolder(dir,foreign,new Map()),/outro projeto/);
 assert.equal((await readProjectFolder(dir)).project.id,project.id);
 const file=await dir.getFileHandle(PROJECT_FILE);file.data=new TextEncoder().encode('{corrupt');
 await assert.rejects(()=>saveProjectFolder(dir,project,bytes));assert.equal(await (await file.getFile()).text(),'{corrupt');
 const unknown=new FakeDirectory('Documentos');await unknown.getFileHandle('documento.txt',{create:true});
 await assert.rejects(()=>saveProjectFolder(unknown,project,bytes),/pasta contém/i);assert.equal(unknown.entries.size,1);
});

test('invalid IFC bytes never create an authoritative file and tampering fails before use',async()=>{
 const dir=new FakeDirectory('A'),{project,bytes}=await fixture();
 await assert.rejects(()=>saveProjectFolder(dir,project,new Map([['model',new Uint8Array([1])]])),/integridade/i);assert.equal(dir.entries.size,0);
 await saveProjectFolder(dir,project,bytes);
 const file=await dir.getFileHandle(PROJECT_FILE),packed=JSON.parse(await (await file.getFile()).text());packed.models[0].base64='AQ==';
 file.data=new TextEncoder().encode(JSON.stringify(packed));await assert.rejects(()=>readProjectFolder(dir),/integridade/i);
});

test('corrupt existing hashed model is preserved and blocks a save',async()=>{
 const dir=new FakeDirectory('A'),{project,bytes}=await fixture();await saveProjectFolder(dir,project,bytes);
 const model=await (await dir.getDirectoryHandle('Modelos')).getFileHandle(`${project.models[0].hash}.ifc`);
 model.data=new Uint8Array([1]);project.name='Changed';
 await assert.rejects(()=>saveProjectFolder(dir,project,bytes),/integridade/i);
 assert.notEqual((await readProjectFolder(dir)).project.name,'Changed');assert.deepEqual(model.data,new Uint8Array([1]));
});

test('creation refuses existing file/directory, case collisions and unsafe names',async()=>{
 const parent=new FakeDirectory('Parent');await createProjectFolder(parent,'Projeto');
 await assert.rejects(()=>createProjectFolder(parent,'Projeto'),/Já existe/);await assert.rejects(()=>createProjectFolder(parent,'projeto'),/Já existe/);
 await parent.getFileHandle('Arquivo',{create:true});await assert.rejects(()=>createProjectFolder(parent,'Arquivo'),/Já existe/);
 for(const name of ['','../x','a/b','a\\b','..','.','CON','com1.txt','LPT9','nul',' x','x.','a:b','a\u0000b']){
  await assert.rejects(()=>createProjectFolder(parent,name),/Nome inválido/);
  await assert.rejects(()=>saveArtifact(parent,name,new Blob(['x'])),/Nome inválido/);
 }
 const results=await Promise.allSettled([createProjectFolder(parent,'Novo'),createProjectFolder(parent,'Novo')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
});

test('concurrent saves capture snapshots and commit in request order',async()=>{
 const dir=new FakeDirectory('A'),{project,bytes}=await fixture();
 project.name='Primeiro';const first=saveProjectFolder(dir,project,bytes);project.name='Segundo';const second=saveProjectFolder(dir,project,bytes);
 project.name='Edição posterior';bytes.get('model')[0]=0;await Promise.all([first,second]);
 assert.equal((await readProjectFolder(dir)).project.name,'Segundo');
});

test('artifact collisions get suffixes and concurrent exports never overwrite',async()=>{
 const dir=new FakeDirectory('A');
 await Promise.all(['first','second','third'].map(content=>saveArtifact(dir,'mapa.csv',new Blob([content]))));
 const exports=await dir.getDirectoryHandle('Exportacoes');
 assert.deepEqual([...exports.entries.keys()],['mapa.csv','mapa (1).csv','mapa (2).csv']);
 assert.deepEqual(await Promise.all([...exports.entries.values()].map(async f=>await (await f.getFile()).text())),['first','second','third']);
});

test('picker requests readwrite; background permission check never requests access',async()=>{
 const dir=new FakeDirectory('A');let options;
 globalThis.showDirectoryPicker=async value=>{options=value;return dir;};
 try{assert.equal(await chooseDirectory(),dir);assert.deepEqual(options,{mode:'readwrite'});}finally{delete globalThis.showDirectoryPicker;}
 assert.equal(await ensurePermission(dir),false);assert.equal(dir.requests,0);assert.equal(dir.queries,1);
 assert.equal(await ensurePermission(dir,true),true);assert.equal(dir.requests,1);
 assert.equal(await ensurePermission(dir),true);assert.equal(dir.requests,1);
});

test('cancelled or blocked folder picker produces an actionable visible error instead of a swallowed AbortError',async()=>{
 const cause=new DOMException('The user aborted a request.','AbortError');
 globalThis.showDirectoryPicker=()=>Promise.reject(cause);
 try{
  await assert.rejects(()=>chooseDirectory(),error=>{
   assert.notEqual(error.name,'AbortError');
   assert.match(error.message,/pasta.*selecionada/i);
   assert.match(error.message,/Chrome|Edge/);
   assert.equal(error.cause,cause);return true;
  });
 }finally{delete globalThis.showDirectoryPicker;}
});

test('recent-folder index stores only handle and display metadata; reads never ask permission',async()=>{
 const rows=new Map();let closed=0;
 // Minimal transactional IDB fake: exercise what is actually put, not storage internals.
 globalThis.indexedDB={open:()=>{
  const request={result:{close(){closed++;},transaction(){
   const tx={objectStore:()=>({put(row){rows.set(row.id,row);},getAll(){const req={result:[...rows.values()]};return req;}})};
   setTimeout(()=>tx.oncomplete?.(),0);return tx;
  }}};
  queueMicrotask(()=>request.onsuccess());return request;
 }};
 try{
  const dir=new FakeDirectory('Pasta'),project=createProject();
  await rememberFolder(dir,project);const list=await recentFolders();
  assert.deepEqual(list,[{id:project.id,name:project.name,folderName:'Pasta',handle:dir}]);
  assert.deepEqual(Object.keys(list[0]).sort(),['folderName','handle','id','name']);
  assert.equal(dir.requests,0);assert.equal(closed,2);
 }finally{delete globalThis.indexedDB;}
});
