import {test} from 'node:test';
import assert from 'node:assert/strict';
import {descendantIds,rangeIds,storeyLocations} from '../src/ui/tree-selection.ts';
import {updateGroupSelection} from '../src/ifc/selection.ts';
test('storey selects physical descendants, excludes spatial containers and deduplicates',()=>{
 const root={localId:1,category:'IFCBUILDINGSTOREY',children:[{localId:2,category:'IFCSPACE',children:[{localId:3,category:'IFCSLAB'}]},{localId:4,category:'IFCBEAM'},{localId:3,category:'IFCSLAB'}]};
 assert.deepEqual(descendantIds(root),[3,4]);
});
test('shift interval is inclusive, reversible and resolves groups once; hidden anchor falls back to hit',()=>{
 const rows=[{key:1,ids:[10,11]},{key:2,ids:[10]},{key:3,ids:[12]},{key:4,ids:[13]}];
 assert.deepEqual(rangeIds(rows,4,2),[10,12,13]);assert.deepEqual(rangeIds(rows,9,3),[12]);
});
test('group toggling is atomic and model scoped; range union never toggles away',()=>{
 const a={},b={},hit=[{model:a,localId:1},{model:a,localId:2}],other={model:b,localId:1};
 assert.deepEqual(updateGroupSelection([hit[0],other],hit,'toggle'),[hit[0],other,hit[1]]);
 assert.deepEqual(updateGroupSelection([...hit,other],hit,'toggle'),[other]);
 assert.deepEqual(updateGroupSelection(hit,hit,'union'),hit);assert.deepEqual(updateGroupSelection([other],hit,'replace'),hit);
});
test('package location follows the spatial storey rather than the task grouping',()=>{
 const root={localId:1,category:'IFCBUILDINGSTOREY',children:[{localId:4,category:'IFCSLAB'}]};
 assert.deepEqual([...storeyLocations(root,new Map([[1,'Pavimento 03']]))],[[4,'Pavimento 03']]);
});
