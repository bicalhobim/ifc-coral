import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulationDates,simulationFrame} from '../src/ifc/simulation.ts';
const d=n=>new Date(2026,9,n);
const t=(g,s,f)=>({modelKey:'m',globalId:g,localId:g.charCodeAt(0),start:d(s),finish:d(f)});
test('4D begins before the first task and visits each milestone including simultaneous work',()=>{
 const tasks=[t('a',1,3),t('b',1,2),t('c',4,5)];const dates=simulationDates(tasks);assert.equal(dates[0],+d(0));assert.deepEqual(dates.slice(1),[1,2,3,4,5].map(n=>+d(n)));
});
test('4D retains started geometry, hides future geometry and does not duplicate an element by phase',()=>{
 const tasks=[t('a',1,2),t('a',3,4),t('b',5,6)];const f=simulationFrame(tasks,+d(3));assert.equal(f.visible.length,1);assert.equal(f.active.length,1);assert.equal(f.hidden.length,1);assert.equal(f.visible[0].globalId,'a');assert.equal(simulationFrame(tasks,+d(0)).visible.length,0);
});
test('same GUID in another model has independent 4D state',()=>{
 const tasks=[t('a',1,2),{...t('a',4,5),modelKey:'other'}];const f=simulationFrame(tasks,+d(3));assert.equal(f.visible.length,1);assert.equal(f.hidden.length,1);
});
