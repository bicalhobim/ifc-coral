import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import {prepareSchedule,pythonCommand} from '../server/schedule-preparation.mjs';
import {MAX_SCHEDULE_BASE64_CHARS} from '../src/ifc/schedule-limits.ts';
import {rowsForModel,canonicalCsv} from '../src/ifc/schedule-pipeline.ts';
test('real Node/Python preparation writes and rereads 1000 activities', {skip: !existsSync(pythonCommand())}, async()=>{
 const cwd=fileURLToPath(new URL('../../tools/schedule/',import.meta.url));
 const body=JSON.parse(execFileSync(pythonCommand(),['-c','from test_schedule_ifc import volume_payload; import json; print(json.dumps(volume_payload()))'],{cwd,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024}));
 const result=await prepareSchedule(body);assert.equal(result.manifest.bindingCount,1000);assert.deepEqual(result.manifest.rows,body.rows);
 const inspected=await prepareSchedule({operation:'inspect',data:result.data});assert.equal(inspected.diagnostics.previousScheduleBindings,1000);assert.equal(inspected.inventory.length,40);
});

test('two IFCs sharing GUIDs receive only their own approved slice and corrections', {skip: !existsSync(pythonCommand())}, async()=>{
 const cwd=fileURLToPath(new URL('../../tools/schedule/',import.meta.url));
 const original=JSON.parse(execFileSync(pythonCommand(),['-c','from test_schedule_ifc import fixture,payload; import json; print(json.dumps(payload(fixture())))'],{cwd,encoding:'utf8',windowsHide:true}));
 const b={...original,data:Buffer.from(Buffer.from(original.data,'base64').toString('utf8').replace('Viga QA','Viga B')).toString('base64')};b.sourceHash=createHash('sha256').update(Buffer.from(b.data,'base64')).digest('hex');
 const models=[{id:'a',name:'a.ifc',hash:original.sourceHash},{id:'b',name:'b.ifc',hash:b.sourceHash}],g=original.rows[0].globalIds[0];
 const plan={models,activities:[{row:{...original.rows[0],globalIds:[]},links:models.map(m=>({modelId:m.id,globalId:g})),disposition:'link',reason:''},{row:{...original.rows[1],globalIds:[]},links:[],disposition:'no3d',reason:'Apenas escopo de gestão'}],corrections:[{modelId:'a',globalId:g,field:'name',original:'Viga QA',value:'Viga revisada'}]};
 const csv=canonicalCsv(plan.activities.map(a=>a.row));
 for(const [i,body]of [original,b].entries()){
  const id=models[i].id,rows=rowsForModel(plan,id),corrections=plan.corrections.filter(c=>c.modelId===id).map(({modelId,...c})=>c),request={...body,rows,csv,corrections,plan,modelId:id};
  const out=await prepareSchedule(request);assert.equal(out.manifest.bindingCount,1);const inv=await prepareSchedule({operation:'inspect',data:out.data});assert.equal(inv.inventory.find(e=>e.globalId===g).name,i===0?'Viga revisada':'Viga B');
  assert.throws(()=>prepareSchedule({...request,rows:original.rows}),/Recorte/);
 }
});

test('schedule rejects IFC above 100 MB before starting Python',()=>{
 assert.throws(()=>prepareSchedule({operation:'inspect',data:'A'.repeat(MAX_SCHEDULE_BASE64_CHARS+4)}),/100 MB/);
});

test('real IFC above the former 25 MB limit can be inspected and enriched', {skip: !existsSync(pythonCommand())}, async()=>{
 const cwd=fileURLToPath(new URL('../../tools/schedule/',import.meta.url));
 const body=JSON.parse(execFileSync(pythonCommand(),['-c','from test_schedule_ifc import fixture,payload; import json; print(json.dumps(payload(fixture()),ensure_ascii=True))'],{cwd,encoding:'utf8',windowsHide:true}));
 const raw=Buffer.from(Buffer.from(body.data,'base64').toString('utf8').replace('DATA;','DATA;\n/*'+'x'.repeat(26_000_000)+'*/'));
 assert.ok(raw.length>25_000_000);
 body.data=raw.toString('base64');body.sourceHash=createHash('sha256').update(raw).digest('hex');
 const inspected=await prepareSchedule({operation:'inspect',data:body.data});
 assert.equal(inspected.sourceHash,body.sourceHash);assert.equal(inspected.inventory.length,2);
 const result=await prepareSchedule(body);
 assert.equal(result.manifest.sourceHash,body.sourceHash);assert.equal(result.manifest.bindingCount,4);
 assert.deepEqual(result.manifest.rows,body.rows);
});

test('real Node/Python UTF-8 pipeline preserves approved CSV, IFC identity and rejects date tampering', {skip: !existsSync(pythonCommand())}, async()=>{
 const cwd=fileURLToPath(new URL('../../tools/schedule/',import.meta.url));
 const body=JSON.parse(execFileSync(pythonCommand(),['-c','from test_schedule_ifc import fixture,payload; import json; print(json.dumps(payload(fixture()),ensure_ascii=True))'],{cwd,encoding:'utf8',windowsHide:true}));
 const inspected=await prepareSchedule({operation:'inspect',data:body.data});assert.equal(inspected.inventory.length,2);
 const out=await prepareSchedule(body);assert.deepEqual(out.manifest.rows,body.rows);assert.equal(out.manifest.rows[0].name,'Fôrmas');assert.equal(out.manifest.csvHash,createHash('sha256').update(body.csv).digest('hex'));assert.equal(out.manifest.sourceHash,body.sourceHash);
 const tampered=structuredClone(body);tampered.rows[0].start='2026-11-05';assert.throws(()=>prepareSchedule(tampered),/CSV conferido/);
 const again=await prepareSchedule({...body,data:out.data,sourceHash:out.manifest.resultHash});assert.deepEqual(again.manifest.rows,body.rows);assert.equal(again.manifest.bindingCount,4);
 const cancel=new AbortController();cancel.abort();await assert.rejects(prepareSchedule(body,{signal:cancel.signal}),/cancelada/);
});
test('reprocess can explicitly clear a previous Coral schedule from an otherwise empty model', {skip:!existsSync(pythonCommand())},async()=>{
 const cwd=fileURLToPath(new URL('../../tools/schedule/',import.meta.url));const body=JSON.parse(execFileSync(pythonCommand(),['-c','from test_schedule_ifc import fixture,payload; import json; print(json.dumps(payload(fixture())))'],{cwd,encoding:'utf8',windowsHide:true}));const first=await prepareSchedule(body);
 const plan={models:[{id:'a',name:'A',hash:first.manifest.resultHash},{id:'b',name:'B',hash:body.sourceHash}],activities:[{row:{...body.rows[0],globalIds:[]},links:[{modelId:'b',globalId:body.rows[0].globalIds[0]}],disposition:'link',reason:''}],corrections:[],clearScheduleModels:['a']};
 const out=await prepareSchedule({...body,data:first.data,sourceHash:first.manifest.resultHash,modelId:'a',plan,csv:canonicalCsv(plan.activities.map(a=>a.row)),rows:[],clearSchedule:true});const inspected=await prepareSchedule({operation:'inspect',data:out.data});assert.equal(inspected.diagnostics.previousScheduleBindings,0);assert.equal(inspected.inventory.length,2);
});
