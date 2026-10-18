import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateMeasures} from '../src/quantification/calculate.ts';
import {catalog} from '../src/quantification/catalog.ts';
import {approveMeasure,isReviewCurrent,reviewSelection} from '../src/quantification/review.ts';
import {readIfcMetadata} from '../src/ifc/quantities.ts';
import {readFileSync} from 'node:fs';
const input={element:{modelId:'m',modelHash:'a'.repeat(64),globalId:'g',ifcClass:'IfcSlab',predefinedType:'FLOOR',typeName:'Laje',properties:{}},volume:{amount:34.707,unit:'m³',source:'QTO'}};
test('human review requires evidence, method and complete measure; any changed input invalidates it',()=>{
 const row=calculateMeasures(input,catalog[1])[1];
 assert.throws(()=>approveMeasure(row,{reviewer:'',evidence:'',method:''}));
 const approved=approveMeasure(row,{reviewer:'Lucas',evidence:'Cenário didático conferido',method:'Taxa paramétrica; sem bitolas'});
 assert.ok(isReviewCurrent(approved,row));
 assert.equal(isReviewCurrent(approved,{...row,elementRef:{...row.elementRef,modelHash:'b'.repeat(64)}}),false);
 assert.equal(isReviewCurrent(approved,{...row,inputs:{...row.inputs,steelRate:61}}),false);
 assert.throws(()=>approveMeasure(calculateMeasures({...input,volume:undefined},catalog[1])[1],{reviewer:'Lucas',evidence:'Conferido',method:'Paramétrico'}));
});
test('pending contacts need explicit manual measurement, method and justification; never automatic zero',()=>{
 const row=calculateMeasures(input,catalog[1])[2];
 assert.throws(()=>approveMeasure(row,{reviewer:'Lucas',evidence:'Conferido',method:'Fundo e bordas'}));
 const snap=approveMeasure(row,{reviewer:'Lucas',evidence:'Levantamento manual verificado: prancha X',method:'Fundo e bordas descontando apoios',manualAmount:340});
 assert.equal(snap.amount,340);assert.equal(snap.reviewOrigin,'manual');assert.equal(row.amount,null);
});
test('STEP metadata identifies occurrence class, PredefinedType and foundation type safely',()=>{
 const rows=readIfcMetadata(readFileSync(new URL('../../ifc_model/TORRE02_ESTRUTURA_4D.ifc',import.meta.url),'utf8'),'m','a'.repeat(64));
 assert.equal(rows.size,764);assert.equal(rows.get('1eObHp0tv7zx4YO4NSLFlD').predefinedType,'FLOOR');
 assert.equal([...rows.values()].filter(r=>/^Estaca de concreto/i.test(r.typeName)).length,80);
});
test('manual selection review validates user evidence before generated allocation commentary',()=>{
 const rows=[calculateMeasures(input,catalog[1])[2]];
 for(const evidence of ['', '   '])assert.throws(()=>reviewSelection(rows,{reviewer:'Lucas',method:'Manual',evidence},340),/evidência/i);
 assert.equal(reviewSelection(rows,{reviewer:'Lucas',method:'Manual',evidence:'Prancha conferida'},340)[0].amount,340);
});
test('classification override provenance survives the calculation and review snapshot',()=>{
 const row=calculateMeasures({...input,classificationOverride:{author:'Autor da classificação',reason:'Conferência da função no projeto'}},catalog[1])[0];
 const s=approveMeasure(row,{reviewer:'Outro conferente',method:'QTO',evidence:'Volume conferido'});
 assert.equal(s.measure.classificationOverride.author,'Autor da classificação');assert.match(s.measure.classificationOverride.reason,/função/);
});
