import {test} from 'node:test';import assert from 'node:assert/strict';
import {materializeSpatial} from '../src/ui/tree.ts';
test('Fragments category containers preserve real storey and element localIds',()=>{
 const raw={category:'IFCPROJECT',localId:null,children:[{category:null,localId:27,children:[{category:'IFCBUILDINGSTOREY',localId:null,children:[{category:null,localId:39,children:[{category:'IFCSLAB',localId:null,children:[{category:null,localId:123}]}]}]}]}]};
 const [project]=materializeSpatial(raw);assert.equal(project.localId,27);assert.equal(project.category,'IFCPROJECT');const storey=project.children[0];assert.equal(storey.localId,39);assert.equal(storey.category,'IFCBUILDINGSTOREY');assert.equal(storey.children[0].localId,123);assert.equal(storey.children[0].category,'IFCSLAB');
});
