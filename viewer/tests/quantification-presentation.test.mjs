import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateMeasures} from '../src/quantification/calculate.ts';
import {catalog} from '../src/quantification/catalog.ts';
import {measureExplanation,methodInfo,updateCatalogRule} from '../src/quantification/presentation.ts';
const element={modelId:'m',modelHash:'a'.repeat(64),globalId:'opaque-guid',ifcClass:'IFCSLAB',predefinedType:'FLOOR',typeName:'Laje h=10',properties:{}};
test('steel explanation presents the real inputs and multiplication with units, not raw JSON',()=>{
 const row=calculateMeasures({element,volume:{amount:2,unit:'m³',source:'Qto_SlabBaseQuantities.NetVolume'}},catalog[1])[1],v=measureExplanation(row);
 assert.match(v.formula,/2.*m³.*60.*kg\/m³.*120.*kg/);assert.equal(v.title,'Laje h=10');assert.ok(!v.title.includes('opaque-guid'));assert.equal(v.pending.length,0);
});
test('formwork candidate stays incomplete and explains how to resolve contacts and method mismatch',()=>{
 const row=calculateMeasures({element,geometry:{candidateArea:24,deductedArea:2,contactsResolved:false,method:'sides',source:'mesh'}},catalog[1])[2],v=measureExplanation(row);
 assert.equal(v.result,'A conferir');assert.ok(v.pending.some(p=>/contato|encontro/i.test(p)));assert.ok(v.pending.some(p=>/relatório|método/i.test(p)));assert.ok(!v.formula.includes('= 22'));
});
test('catalogue only accepts supported geometry methods, updates atomically and explains surfaces',()=>{
 assert.match(methodInfo('suspended').description,/inferior|fundo/i);assert.match(methodInfo('sides').description,/vertica/i);
 const before=structuredClone(catalog);assert.throws(()=>updateCatalogRule(catalog,'slab',80,'anything'),/método/i);assert.deepEqual(catalog,before);
 const next=updateCatalogRule(catalog,'slab',80,'sides');assert.equal(next[1].steelRate,80);assert.notEqual(next[1].version,catalog[1].version);assert.equal(catalog[1].steelRate,60);
 assert.throws(()=>updateCatalogRule(catalog,'slab',80,'sides',' '),/fonte|premissa/);
 assert.equal(updateCatalogRule(catalog,'slab',80,'sides','Premissa técnica do cenário')[1].source,'Premissa técnica do cenário');
});
