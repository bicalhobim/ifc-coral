import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,validateProject} from '../src/production/project.ts';

function fixture(){
 const p=createProject();p.models.push({id:'m',name:'Estrutura.ifc',hash:'a'.repeat(64),projectGlobalId:'g'});
 for(const [slot,name] of [['forms','Fôrmas da laje'],['steel','Armação da laje'],['concrete','Concretagem da laje']])for(const globalId of ['a','b'])p.tasks.push({id:`${slot}-${globalId}`,modelId:'m',globalId,slot,name,location:'Pavimento 1',service:name,start:'2026-11-06',finish:'2026-11-06'});
 return p;
}
test('selection prerequisite explains the next action and empty/unsupported selections do not create a package',async()=>{
 const {selectionPackageStatus,createSelectionPackage}=await import('../src/production/selection-package.ts');
 const p=fixture(),before=structuredClone(p);
 assert.equal(selectionPackageStatus(p,[]).ready,false);
 assert.match(selectionPackageStatus(p,[]).message,/selecione.*3D.*4D/i);
 assert.throws(()=>createSelectionPackage(p,[],()=>{throw new Error('must not quantify');}),/selecione/i);
 assert.equal(selectionPackageStatus(p,['steel-a']).ready,false);
 assert.match(selectionPackageStatus(p,['steel-a']).message,/Quantificação/);
 assert.deepEqual(p,before);
});
test('3D selection with several phases quantifies each physical element once and creates a concrete package',async()=>{
 const {selectionPackageStatus,createSelectionPackage}=await import('../src/production/selection-package.ts');
 const p=fixture(),ids=p.tasks.map(t=>t.id);
 assert.equal(selectionPackageStatus(p,ids).count,2);assert.equal(selectionPackageStatus(p,ids).ready,true);
 const pkg=createSelectionPackage(p,ids,refs=>{assert.equal(refs.length,2);return {totalM3:5.75,source:'QTO conferido'};});
 assert.equal(pkg.quantity,5.75);assert.equal(pkg.elements.length,2);assert.equal(pkg.taskIds.length,2);
 assert.equal(pkg.unit,'m³');assert.equal(pkg.coverageKnown,false);assert.equal(p.supplies.length,0);validateProject(p);
 const before=structuredClone(p);assert.throws(()=>createSelectionPackage(p,ids,()=>({totalM3:5.75,source:'QTO'})),/Já existe/);assert.deepEqual(p,before);
});
test('unknown model volume stays unknown when creating from selection',async()=>{
 const {createSelectionPackage}=await import('../src/production/selection-package.ts');
 const p=fixture();const pkg=createSelectionPackage(p,['concrete-a'],()=>({totalM3:null,source:'Volume não declarado'}));
 assert.equal(pkg.quantity,null);assert.equal(pkg.quantitySource,'Volume não declarado');validateProject(p);
});
test('spatial selection context names the package without changing task dates or identities',async()=>{
 const {createSelectionPackage}=await import('../src/production/selection-package.ts');
 const p=fixture(),pkg=createSelectionPackage(p,['concrete-a'],()=>({totalM3:2,source:'IFC'}),{locations:['Pavimento 03']});
 assert.equal(pkg.location,'Pavimento 03');assert.equal(pkg.name,'Concretagem — Pavimento 03');assert.equal(pkg.needDate,'2026-11-06');assert.deepEqual(pkg.taskIds,['concrete-a']);validateProject(p);
});
test('quick creation prefers complete reviewed concrete quantities over a fresh IFC-only value',async()=>{
 const {createSelectionPackage}=await import('../src/production/selection-package.ts');const {calculateMeasures}=await import('../src/quantification/calculate.ts');const {catalog}=await import('../src/quantification/catalog.ts');const {approveMeasure}=await import('../src/quantification/review.ts');
 const p=fixture();p.measures=['a','b'].map(globalId=>approveMeasure(calculateMeasures({element:{modelId:'m',modelHash:'a'.repeat(64),globalId,ifcClass:'IfcSlab',predefinedType:'FLOOR',typeName:'Laje',properties:{}},volume:{amount:2,unit:'m³',source:'QTO'}},catalog[1])[0],{reviewer:'QA',evidence:'Medição manual conferida',method:'Manual',manualAmount:3}));
 const pkg=createSelectionPackage(p,['concrete-a','concrete-b'],()=>({totalM3:4,source:'Só IFC'}));assert.equal(pkg.quantity,6);assert.equal(pkg.measureLinks.length,2);assert.match(pkg.quantitySource,/Conferência/);validateProject(p);
});
