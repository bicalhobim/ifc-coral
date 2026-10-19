import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Gantt} from '../src/ui/gantt.ts';

test('clearing viewport selection before opening a model is safe',()=>{
 const gantt=new Gantt();
 assert.doesNotThrow(()=>gantt.setSelection([]));
 assert.doesNotThrow(()=>gantt.setSelection([{model:{},localId:1,start:new Date(2026,9,24),finish:new Date(2026,9,25)}]));
 assert.doesNotThrow(()=>gantt.setSelection([]));
});
