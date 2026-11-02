import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProject,serializeProject,parseProject} from '../src/production/project.ts';import {createManualPackage} from '../src/production/package-management.ts';
import {catalog} from '../src/quantification/catalog.ts';import {calculateMeasures} from '../src/quantification/calculate.ts';import {approveMeasure} from '../src/quantification/review.ts';
import {applyPackageMeasurements} from '../src/production/package-quantities.ts';
function setup(service='concrete'){
 const p=createProject();p.models=[{id:'m',hash:'a'.repeat(64),name:'Fundação.ifc',projectGlobalId:'root'}];
 const rule={...structuredClone(catalog[1]),steelRate:100};
 const rows=['a','b'].map((globalId,i)=>{p.tasks.push(...['Concretagem','Armação','Fôrmas'].map((name,j)=>({id:`${globalId}-${j}`,modelId:'m',globalId,slot:String(j),name,service:name,location:'Fundação',start:'2026-11-03',finish:'2026-11-04'})));return calculateMeasures({element:{modelId:'m',modelHash:'a'.repeat(64),globalId,ifcClass:'IfcFooting',predefinedType:'PAD_FOOTING',typeName:'Bloco',properties:{}},volume:{amount:5+i,unit:'m³',source:'QTO da seleção'},geometry:{candidateArea:10+i,deductedArea:0,contactsResolved:true,source:'QA',method:rule.formMethod}},rule).find(r=>r.serviceCode===service);});
 const reviews=rows.map(r=>approveMeasure(r,{reviewer:'QA',method:'Taxa manual do cenário',evidence:'Conferência didática'}));return {p,rows,reviews};
}
test('a manual package inherits reviewed quantity, references and provenance instead of retyping IFC volume',()=>{
 const {p,reviews}=setup(),pkg=createManualPackage(p,{name:'Estacas 1 e 2',location:'Fundação',service:'Concretagem'});pkg.quantity=38.585;
 const id=applyPackageMeasurements(p,reviews,{packageId:pkg.id});const saved=parseProject(serializeProject(p)).packages.find(x=>x.id===id);
 assert.equal(saved.name,'Estacas 1 e 2');assert.equal(saved.quantity,11);assert.equal(saved.elements.length,2);assert.equal(saved.measureLinks.length,2);assert.equal(saved.unit,'m³');assert.match(saved.quantitySource,/Conferência/);assert.equal(saved.taskIds.length,2);
});
test('steel rates and manual totals are inherited in kg, not replaced by concrete volume',()=>{
 const {p,reviews}=setup('reinforcement');reviews.forEach(s=>assert.equal(s.measure.inputs.steelRate,100));
 const id=applyPackageMeasurements(p,reviews,{name:'Aço dos blocos',location:'Fundação'}),pkg=p.packages.find(x=>x.id===id);assert.equal(pkg.quantity,1100);assert.equal(pkg.unit,'kg');assert.equal(pkg.serviceCode,'reinforcement');assert.ok(p.measures.every(s=>s.measure.inputs.steelRate===100));parseProject(serializeProject(p));
});
test('form areas are separate from steel and concrete and survive project reopening',()=>{
 const {p,reviews}=setup('formwork');const id=applyPackageMeasurements(p,reviews,{name:'Fôrmas dos blocos',location:'Fundação'});const reopened=parseProject(serializeProject(p)).packages.find(x=>x.id===id);assert.equal(reopened.quantity,21);assert.equal(reopened.unit,'m²');assert.equal(reopened.measureLinks.length,2);
});

test('an explicitly reviewed manual measurement is inherited even when IFC quantity is absent',()=>{
 const {p,rows}=setup();rows.forEach(r=>{r.amount=null;r.status='pending';r.inputs.volume=null;});
 const reviews=rows.map((row,i)=>approveMeasure(row,{reviewer:'QA',method:'Levantamento manual por elemento',evidence:'Memória externa conferida',manualAmount:7+i}));
 const id=applyPackageMeasurements(p,reviews,{name:'Blocos medidos manualmente',location:'Fundação'}),pkg=parseProject(serializeProject(p)).packages.find(x=>x.id===id);
 assert.equal(pkg.quantity,15);assert.equal(pkg.elements.length,2);assert.equal(pkg.measureLinks.length,2);assert.ok(p.measures.every(s=>s.reviewOrigin==='manual'&&s.measure.amount===null));
});
test('incompatible units, frozen commitments, reservations and scope substitution cannot partially mutate a package',()=>{
 for(const mutate of [(p,pkg)=>{pkg.unit='kg';},(p,pkg)=>{p.week={frozenAt:'now',reviewer:'QA',commitments:[{packageId:pkg.id}]};},(p,pkg)=>{p.allocations=[{packageId:pkg.id}];},(p,pkg)=>{pkg.elements=[{modelId:'m',globalId:'different'}];}]){
 const {p,reviews}=setup(),pkg=createManualPackage(p,{name:'Bloco',location:'Fundação',service:'Concreto'});mutate(p,pkg);const before=JSON.stringify(p);assert.throws(()=>applyPackageMeasurements(p,reviews,{packageId:pkg.id}));assert.equal(JSON.stringify(p),before);}
});
test('stale rules, missing revisions, mixed services and duplicates are refused before adoption',()=>{
 for(const mutate of [(p,rows)=>{p.models[0].hash='b'.repeat(64);},(p,rows)=>{p.quantificationCatalog=structuredClone(catalog);p.quantificationCatalog[1].steelRate=999;},(p,rows)=>rows.push(rows[0]),(p,rows)=>{rows[1].measure.serviceCode='reinforcement';}]){
 const {p,reviews}=setup();mutate(p,reviews);const before=JSON.stringify(p);assert.throws(()=>applyPackageMeasurements(p,reviews,{name:'Blocos',location:'Fundação'}));assert.equal(JSON.stringify(p),before);}
});
test('changing a measured quantity preserves earlier evidence but reopens preparation conditions',()=>{
 const {p,reviews}=setup(),pkg=createManualPackage(p,{name:'Blocos',location:'Fundação',service:'Concreto'});pkg.quantity=10;Object.assign(pkg.constraints[0],{resolved:true,evidence:'Evidência antiga',reviewer:'QA'});pkg.capacityConfirmed=true;
 applyPackageMeasurements(p,reviews,{packageId:pkg.id});const target=p.packages.find(x=>x.id===pkg.id);assert.equal(target.constraints[0].resolved,false);assert.equal(target.constraints[0].evidence,'Evidência antiga');assert.equal(target.capacityConfirmed,false);
});
