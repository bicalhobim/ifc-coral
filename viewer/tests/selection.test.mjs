import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updateSelection,uniqueSelection,selectionTasks,isAdditiveSelection} from '../src/ifc/selection.ts';
import {summarizeVolumes} from '../src/ifc/quantities.ts';

const model={},otherModel={},a={model,localId:1},b={model,localId:2};
test('plain click replaces selection and empty click clears it',()=>{
 assert.deepEqual(updateSelection([a,b],b,false),[b]);
 assert.deepEqual(updateSelection([a],null,false),[]);
});
test('additive clicks keep earlier objects and toggle a selected object off',()=>{
 const initial=Object.freeze([a]);
 const next=updateSelection(initial,b,true);
 assert.deepEqual(next,[a,b]);
 assert.deepEqual(updateSelection(next,a,true),[b]);
 assert.deepEqual(initial,[a]);
});
test('additive empty clicks preserve selection, including multi-select mode',()=>{
 assert.deepEqual(updateSelection([a,b],null,true),[a,b]);
});
test('same local ID in another model is a different object',()=>{
 const other={model:otherModel,localId:1};
 const next=updateSelection([a],other,true);
 assert.deepEqual(next,[a,other]);
 assert.deepEqual(updateSelection(next,a,true),[other]);
});
test('multi-select mode, Ctrl, Shift and Command all enable additive selection',()=>{
 const plain={ctrlKey:false,shiftKey:false,metaKey:false};
 assert.equal(isAdditiveSelection(plain),false);
 assert.equal(isAdditiveSelection(plain,true),true);
 for(const key of Object.keys(plain))assert.equal(isAdditiveSelection({...plain,[key]:true}),true);
});
test('activity selection deduplicates its phases but retains all tasks for packages',()=>{
 const tasks=[...['forms','steel','concrete'].map(phase=>({...a,phase,modelKey:'m',globalId:'a',volume:{m3:2,source:'IFC'}})),{...b,phase:'concrete',modelKey:'m',globalId:'b',volume:{m3:3,source:'IFC'}},{model:otherModel,localId:1,phase:'concrete',modelKey:'other',globalId:'a',volume:{m3:9,source:'IFC'}}];
 const items=uniqueSelection(tasks.slice(0,4));
 assert.deepEqual(items.map(({model,localId})=>({model,localId})),[a,b]);
 const selected=selectionTasks(items,tasks);
 assert.equal(selected.length,4);
 assert.equal(summarizeVolumes(selected).count,2);
 assert.equal(summarizeVolumes(selected).totalM3,5);
});
test('a sequence of additions and removals never loses another selected object',()=>{
 let selected=[];
 for(const item of [a,b,a,a,b])selected=updateSelection(selected,item,true);
 assert.deepEqual(selected,[a]);
});
