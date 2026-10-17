import {test} from 'node:test';
import assert from 'node:assert/strict';
import {catalog} from '../src/quantification/catalog.ts';
import {classifyElement} from '../src/quantification/classify.ts';
import {calculateMeasures,summarizeMeasures} from '../src/quantification/calculate.ts';
const meta=(extra={})=>({modelId:'m',modelHash:'a'.repeat(64),globalId:'g',ifcClass:'IfcSlab',predefinedType:'FLOOR',typeName:'Laje maciça',properties:{},...extra});
test('specific construction function separates pile blocks, piles and BASESLAB',()=>{
 assert.equal(classifyElement(meta({ifcClass:'IfcFooting',typeName:'Bloco de fundação 4 Estacas'}),catalog).rule.id,'block');
 assert.equal(classifyElement(meta({ifcClass:'IfcFooting',typeName:'Estaca de concreto 40cm'}),catalog).rule.id,'pile');
 assert.equal(classifyElement(meta({predefinedType:'BASESLAB'}),catalog).rule.id,'base-slab');
 assert.equal(classifyElement(meta({ifcClass:'IfcSlabType'}),catalog).status,'pending');
});
test('ambiguous rule tie stays pending; override needs reason and author',()=>{
 assert.equal(classifyElement(meta(),[...catalog,{...catalog.find(r=>r.id==='slab'),id:'other'}]).status,'pending');
 assert.throws(()=>classifyElement(meta(),catalog,{ruleId:'beam',author:'',reason:''}));
 assert.equal(classifyElement(meta(),catalog,{ruleId:'beam',author:'Lucas',reason:'Função conferida'}).rule.id,'beam');
});
test('steel scenario is explicit estimate; absent volume or rate remains pending',()=>{
 const rule=catalog.find(r=>r.id==='slab');const rows=calculateMeasures({element:meta(),volume:{amount:34.707,unit:'m³',source:'QTO.NetVolume'}},rule);
 assert.ok(Math.abs(rows.find(r=>r.serviceCode==='reinforcement').amount-2082.42)<1e-9);
 assert.equal(rows.find(r=>r.serviceCode==='reinforcement').status,'draft');
 assert.equal(calculateMeasures({element:meta()},rule)[1].amount,null);
 assert.equal(calculateMeasures({element:meta(),volume:{amount:1,unit:'m³',source:'QTO'}},{...rule,steelRate:null})[1].amount,null);
 for(const value of [-1,NaN,Infinity])assert.throws(()=>calculateMeasures({element:meta()}, {...rule,steelRate:value}));
 assert.throws(()=>calculateMeasures({element:meta(),volume:{amount:1,unit:'kg',source:'bad'}},rule));
});
test('partial coverage is subtotal and repeated phases deduplicate by model and GUID',()=>{
 const rule=catalog.find(r=>r.id==='slab');const a=calculateMeasures({element:meta(),volume:{amount:1,unit:'m³',source:'QTO'}},rule)[0];
 const b=calculateMeasures({element:meta({globalId:'missing'})},rule)[0];const r=summarizeMeasures([a,a,a,b],'concrete');
 assert.equal(r.count,2);assert.equal(r.subtotal,1);assert.equal(r.total,null);assert.equal(r.missing,1);
});
test('geometric formwork candidate cannot become approved service area without contact evidence',()=>{
 const r=calculateMeasures({element:meta(),geometry:{candidateArea:21.8,deductedArea:0,contactsResolved:false,source:'mesh',method:'suspended'}},catalog.find(r=>r.id==='slab'))[2];
 assert.equal(r.amount,null);assert.equal(r.inputs.candidateArea,21.8);assert.equal(r.status,'pending');
});
