import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject} from '../src/production/project.ts';

test('new ordinary concrete packages expose resource composition and first proposal instead of an empty example comparison',async()=>{
 const {usesResourceSupply}=await import('../src/production/supply-mode.ts');
 const p=createProject(),pkg={id:'pkg',unit:'m³'};
 assert.equal(usesResourceSupply(p,pkg),true);
 p.resources.push({packageId:'pkg'});assert.equal(usesResourceSupply(p,pkg),true);
});
test('existing legacy coverage remains available while typed and measured services use resources',async()=>{
 const {usesResourceSupply}=await import('../src/production/supply-mode.ts');
 const p=createProject(),pkg={id:'pkg',unit:'m³'};p.supplies.push({unit:'m³'});
 assert.equal(usesResourceSupply(p,pkg),false);
 p.resources.push({packageId:'pkg'});assert.equal(usesResourceSupply(p,pkg),true);
 const lesson=createProject();lesson.templateId='torre02';assert.equal(usesResourceSupply(lesson,pkg),false);
 assert.equal(usesResourceSupply(lesson,{id:'steel',unit:'kg'}),true);
});
