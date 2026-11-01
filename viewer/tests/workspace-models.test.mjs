import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../src/production/project.ts';
import {removeUnlinkedModel} from '../src/workspace/models.ts';
test('removing an unlinked model preserves the source and removes its runtime references',()=>{
 const p=createProject();p.models=[{id:'m',hash:'a'.repeat(64),name:'model.ifc',projectGlobalId:'g'}];
 const next=removeUnlinkedModel(p,'m');assert.equal(next.models.length,0);assert.equal(p.models.length,1);
});
test('a linked package blocks model deletion without mutating its history',()=>{
 const p=createProject();p.models=[{id:'m',hash:'a'.repeat(64),name:'model.ifc',projectGlobalId:'g'}];p.packages=[{elements:[{modelId:'m',globalId:'g'}]}];
 const before=JSON.stringify(p);assert.throws(()=>removeUnlinkedModel(p,'m'),/vinculado/);assert.equal(JSON.stringify(p),before);
});
