import {test} from 'node:test';import assert from 'node:assert/strict';
import {stageModels} from '../src/production/runtime.ts';
import {createProject} from '../src/production/project.ts';
import {sha256} from '../src/production/storage.ts';
test('reopening identical filenames uses unique ephemeral IDs; failed staging cleans every loaded model',async()=>{
 const p=createProject(),bytes=new Uint8Array([1,2,3]),hash=await sha256(bytes);p.models=[{id:'m1',name:'Torre.ifc',hash,projectGlobalId:'g'},{id:'m2',name:'Torre.ifc',hash,projectGlobalId:'h'}];
 const names=[],disposed=[];const hooks={load:async(_b,name)=>{names.push(name);return name;},read:async()=>({tasks:[],records:[]}),unload:async m=>disposed.push(m)};
 await stageModels(p,new Map([['m1',bytes],['m2',bytes]]),hooks);await stageModels(p,new Map([['m1',bytes],['m2',bytes]]),hooks);assert.equal(new Set(names).size,4);
 names.length=0;await assert.rejects(()=>stageModels(p,new Map([['m1',bytes],['m2',bytes]]),{...hooks,read:async()=>{throw new Error('broken parse');}}));assert.deepEqual(disposed,names);
});
