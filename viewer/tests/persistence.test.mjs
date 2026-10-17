import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProject} from '../src/production/project.ts';
import {packProject,unpackProject,sha256} from '../src/production/storage.ts';
test('portable project verifies bytes and model references before replacement',async()=>{
 const p=createProject(),bytes=new TextEncoder().encode('ISO-10303-21; sample IFC bytes');
 p.models.push({id:'m',name:'Torre.ifc',hash:await sha256(bytes),projectGlobalId:'g'});
 const packed=await packProject(p,new Map([['m',bytes]]));
 const restored=await unpackProject(packed);assert.deepEqual(restored.project,p);assert.deepEqual(restored.bytes.get('m'),bytes);
 const tampered=JSON.parse(packed);tampered.models[0].base64='YWJj';await assert.rejects(()=>unpackProject(JSON.stringify(tampered)),/integridade/i);
 await assert.rejects(()=>packProject(p,new Map()),/IFC/i);
 const missing=JSON.parse(packed);missing.models=[];await assert.rejects(()=>unpackProject(JSON.stringify(missing)));
});
