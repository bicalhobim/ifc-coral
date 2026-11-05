import {test} from 'node:test';
import assert from 'node:assert/strict';
import {adoptCorrections,correctionKey,reviewRows} from '../src/ifc/proposal-review.ts';
const element={modelId:'m',modelHash:'a'.repeat(64),globalId:'g',name:'Viga',location:'P1',service:'',ifcClass:'IfcBeam'};
const proposals=[{modelId:'m',globalId:'g',field:'name',original:'Viga',value:'Viga 1'},{modelId:'m',globalId:'g',field:'service',original:'',value:'Armação'}];
test('batch adoption applies only selected fields and preserves unrelated human decisions',()=>{
 const existing=[{modelId:'m',globalId:'g',field:'location',original:'P1',value:'P2'}];
 const result=adoptCorrections(existing,proposals,new Set([correctionKey(proposals[1])]),[element]);assert.equal(result.length,2);assert.deepEqual(result[0],existing[0]);assert.equal(result[1].field,'service');assert.equal(existing.length,1);
 assert.deepEqual(adoptCorrections(existing,proposals,new Set(),[element]),existing);
});
test('batch validation is atomic and cannot overwrite adopted fields or stale origins',()=>{
 const selected=new Set(proposals.map(correctionKey));assert.throws(()=>adoptCorrections([], [...proposals,{...proposals[0],modelId:'other'}],new Set([...selected,correctionKey({...proposals[0],modelId:'other'})]),[element]),/origem/);
 assert.throws(()=>adoptCorrections([proposals[0]],proposals,selected,[element]),/ajuste adotado/);
 assert.throws(()=>adoptCorrections([],proposals,selected,[{...element,name:'Changed'}]),/origem/);
});
test('proposal filtering covers element, model, field and proposed values with accents',()=>{
 const rows=[{key:'one',name:'Viga',context:'Torre A',field:'Serviço',value:'Armação'},{key:'two',name:'Pilar',context:'Torre B',field:'Nome',value:'Pilar 1'}];assert.equal(reviewRows(rows,'armacao')[0].key,'one');assert.equal(reviewRows(rows,'torre b')[0].key,'two');assert.equal(reviewRows(rows,'inexistente').length,0);
});
