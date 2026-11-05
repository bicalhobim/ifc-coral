import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {parseScheduleCsv,applyScheduleSuggestions,validateScheduleLinks} from '../src/ifc/schedule-import.ts';
import {createProject,validateProject} from '../src/production/project.ts';
import {createPlannedPackages} from '../src/production/integrated.ts';
import {stageModels} from '../src/production/runtime.ts';
import {sha256} from '../src/production/storage.ts';
import {LocalWorkspace} from '../server/workspace.mjs';
import {buildSchedule} from '../src/ifc/schedule.ts';
const header='id;atividade;inicio;fim;local;servico;globalIds\n';
test('CSV validates duplicate IDs, real dates, quotes, separators and never interprets Excel serials',()=>{
 const rows=parseScheduleCsv('\uFEFF'+header+'A1;"Forma; viga";05/11/2026;06/11/2026;P1;Fôrmas;g1|g2');assert.equal(rows[0].name,'Forma; viga');assert.equal(rows[0].start,'2026-11-05');assert.deepEqual(rows[0].globalIds,['g1','g2']);
 for(const csv of [header+'A;X;45200;45201;;;',header+'A;X;31/02/2026;01/03/2026;;;',header+'A;X;2026-11-06;2026-11-05;;;',header+'A;X;2026-11-05;2026-11-06;;;\nA;Y;2026-11-05;2026-11-06;;;'])assert.throws(()=>parseScheduleCsv(csv));
 assert.equal(parseScheduleCsv('id,name,start,finish\nA,"a,b",2026-11-05,2026-11-06')[0].name,'a,b');
});
test('AI only fills unassigned links and rejects invented elements or dates',()=>{
 const rows=parseScheduleCsv(header+'A;Concreto;2026-11-05;2026-11-06;;;g1\nB;Forma;2026-11-05;2026-11-06;;;');const inv=[{globalId:'g1'},{globalId:'g2'}];
 const result=applyScheduleSuggestions(rows,inv,{links:[{activityId:'A',globalIds:['g2'],reason:'x'},{activityId:'B',globalIds:['g2'],reason:'x'}]});assert.deepEqual(result.map(r=>r.globalIds),[['g1'],['g2']]);assert.equal(rows[1].globalIds.length,0);
 assert.throws(()=>applyScheduleSuggestions(rows,inv,{links:[{activityId:'B',globalIds:['invented'],reason:'x'}]}));assert.throws(()=>applyScheduleSuggestions(rows,inv,{links:[{activityId:'B',globalIds:['g2'],reason:'x',start:'2020-01-01'}]}));assert.throws(()=>validateScheduleLinks(rows,inv));
});
test('undated packages require explicit dates and mark human provenance without partial multi-service creation',()=>{
 const p=createProject();p.models=[{id:'m',name:'x',hash:'a'.repeat(64),projectGlobalId:'p'}];
 assert.throws(()=>createPlannedPackages(p,{elements:[{modelId:'m',globalId:'g'}],serviceIds:['concrete']}),/Sem datas/);assert.equal(p.packages.length,0);
 createPlannedPackages(p,{elements:[{modelId:'m',globalId:'g'}],serviceIds:['concrete'],needDate:'2026-11-06',finishDate:'2026-11-07'});const meta=p.planning.packages[p.packages[0].id];assert.equal(meta.origins.needDate.mode,'manual');assert.match(meta.origins.needDate.source,/usuário/);validateProject(p);
});
test('physical IFC membership survives reopening without schedule records; absent identities still require review',async()=>{
 const bytes=new Uint8Array([1,2]),p=createProject();p.models=[{id:'m',name:'x',hash:await sha256(bytes),projectGlobalId:'p'}];createPlannedPackages(p,{elements:[{modelId:'m',globalId:'g'}],serviceIds:['concrete'],needDate:'2026-11-06',finishDate:'2026-11-07'});
 const hooks={load:async()=>({}),read:async()=>({tasks:[],records:[],physicalGuids:['g']}),unload:async()=>{}};await stageModels(p,new Map([['m',bytes]]),hooks);assert.equal(p.packages[0].reviewRequired,false);await stageModels(p,new Map([['m',bytes]]),{...hooks,read:async()=>({tasks:[],records:[],physicalGuids:[]})});assert.equal(p.packages[0].reviewRequired,true);
});
test('server serializes compare-and-write: two writers with same expected hash cannot both succeed',async()=>{
 const temp=await mkdtemp(path.join(os.tmpdir(),'coral-cas-')),dir=path.join(temp,'p');await mkdir(dir);const service=new LocalWorkspace(path.join(temp,'registry.json')),root=await service.select(dir),parts=['IFC-Coral.projeto.json'];await service.entry(root.id,parts,'file',true);await service.write(root.id,parts,Buffer.from('initial'));
 const expected=createHash('sha256').update('initial').digest('hex');const results=await Promise.allSettled([service.write(root.id,parts,Buffer.from('first'),expected),service.write(root.id,parts,Buffer.from('second'),expected)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.name,'ConflictError');assert.equal((await service.read(root.id,parts)).toString(),'first');
});
test('4D reader keeps stable external activity IDs and per-service locations on the same IFC element',async()=>{
 const props=Object.entries({Task1:'Forma',Task1Id:'EXT-A',Task1Inicio:'2026-11-05',Task1Fim:'2026-11-06',Task1Local:'P1',Task1Servico:'Fôrmas',Task2:'Concreto',Task2Id:'EXT-B',Task2Inicio:'2026-11-07',Task2Fim:'2026-11-07',Task2Local:'P1',Task2Servico:'Concretagem'}).map(([key,value])=>({Name:{value:key},NominalValue:{value}}));
 const model={modelId:'m',getItemsOfCategories:async()=>({IFCBEAM:[1]}),getGuidsByLocalIds:async()=>['g'],getItemsData:async()=>[{Name:{value:'Viga'},IsDefinedBy:props}]};const tasks=await buildSchedule(model);assert.equal(tasks.length,2);assert.deepEqual(tasks.map(t=>t.sourceTaskKey),['CSV:EXT-A','CSV:EXT-B']);assert.equal(tasks[0].summary3,'P1');assert.equal(tasks[1].summary4,'Concretagem');
});
