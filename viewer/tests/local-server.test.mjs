import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('local workspace persists real files and reopens the selected folder after a service restart',async()=>{
 const {LocalWorkspace}=await import('../server/workspace.mjs');
 const temp=await mkdtemp(path.join(os.tmpdir(),'ifc-coral-test-'));
 const selected=path.join(temp,'Projects');await mkdir(selected);
 const registry=path.join(temp,'settings','folders.json');
 const service=new LocalWorkspace(registry),root=await service.select(selected);
 await service.entry(root.id,['Minha obra'],'directory',true);
 await service.entry(root.id,['Minha obra','IFC-Coral.projeto.json'],'file',true);
 await service.write(root.id,['Minha obra','IFC-Coral.projeto.json'],Buffer.from('primeira versão'));
 assert.equal(await readFile(path.join(selected,'Minha obra','IFC-Coral.projeto.json'),'utf8'),'primeira versão');
 const reopened=new LocalWorkspace(registry);
 assert.equal((await reopened.read(root.id,['Minha obra','IFC-Coral.projeto.json'])).toString(),'primeira versão');
 assert.deepEqual(await reopened.list(root.id,['Minha obra']),[{kind:'file',name:'IFC-Coral.projeto.json'}]);
});

test('service refuses path traversal, unknown capabilities and directory links',async()=>{
 const {LocalWorkspace}=await import('../server/workspace.mjs');
 const temp=await mkdtemp(path.join(os.tmpdir(),'ifc-coral-test-'));
 const selected=path.join(temp,'Projects');await mkdir(selected);
 const service=new LocalWorkspace(path.join(temp,'folders.json')),root=await service.select(selected);
 await assert.rejects(()=>service.entry(root.id,['..','escape'],'file',true));
 await assert.rejects(()=>service.entry(root.id,['x/y'],'file',true));
 await assert.rejects(()=>service.list('unknown',[]));
 const outside=path.join(temp,'outside');await mkdir(outside);
 await symlink(outside,path.join(selected,'linked'),process.platform==='win32'?'junction':'dir');
 assert.deepEqual(await service.list(root.id,[]),[]);
 await assert.rejects(()=>service.entry(root.id,['linked','escape'],'file',true));
});

test('local API rejects cross-origin and missing-session requests before invoking the picker',async()=>{
 const {isTrustedRequest}=await import('../server/workspace.mjs');
 const req=(origin,token)=>({headers:{host:'127.0.0.1:5178',origin,'x-ifc-coral-session':token},socket:{remoteAddress:'127.0.0.1'}});
 assert.equal(isTrustedRequest(req('http://127.0.0.1:5178','secret'),'secret'),true);
 assert.equal(isTrustedRequest(req('https://foreign.example','secret'),'secret'),false);
 assert.equal(isTrustedRequest(req('http://127.0.0.1:5178','wrong'),'secret'),false);
 assert.equal(isTrustedRequest(req(undefined,'secret'),'secret'),false);
});

