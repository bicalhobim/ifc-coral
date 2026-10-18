import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProject} from '../src/production/project.ts';
import {allocate} from '../src/production/planning.ts';
import {addConcreteCase} from '../src/production/case.ts';
import {previewPackages,createPackages,composeResource,reserveResource,resourceCoverage,quantificationNeedsReview,refreshPackageMeasures} from '../src/production/resources.ts';
import {catalog} from '../src/quantification/catalog.ts';import {calculateMeasures} from '../src/quantification/calculate.ts';import {approveMeasure} from '../src/quantification/review.ts';
const setup=()=>{const p=createProject();p.models=[{id:'m',hash:'a'.repeat(64),name:'x',projectGlobalId:'p'}];p.tasks=['concrete','reinforcement','formwork'].map((s,i)=>({id:'t'+i,modelId:'m',globalId:'g',slot:'Task'+i,name:s,location:'P1',service:s,start:'2026-11-06',finish:'2026-11-06'}));return p;};
const snapshots=()=>calculateMeasures({element:{modelId:'m',modelHash:'a'.repeat(64),globalId:'g',ifcClass:'IfcSlab',predefinedType:'FLOOR',typeName:'Laje',properties:{}},volume:{amount:1,unit:'m³',source:'QTO'},geometry:{candidateArea:20,deductedArea:0,contactsResolved:true,source:'Fixture',method:'suspended'}},catalog[1]).map(r=>approveMeasure(r,{reviewer:'Lucas',evidence:'Fixture conferida',method:'Didático'}));
test('preview creates separate services, duplicate production elements blocked without mutating',()=>{
 const p=setup(),rows=snapshots();const preview=previewPackages(p,rows);assert.deepEqual(preview.map(r=>r.unit),['m³','kg','m²']);assert.equal(p.packages.length,0);createPackages(p,preview);assert.equal(p.packages.length,3);assert.equal(p.resources.length,0);assert.throws(()=>previewPackages(p,rows),/sobrepos|duplic/i);
});
test('incompatible units/specifications cannot cover a resource and capacity is not double reserved',()=>{
 const p=setup();createPackages(p,previewPackages(p,snapshots()));const pkg=p.packages[1];const r=composeResource(p,pkg.id,{resourceCode:'steel',specification:'CA50 Ø10 BBS-1',specificationConfirmed:true,factor:1,lossPercent:0,leadDays:2,preparationDays:1,reusable:false,cycleDays:0,evidence:'BBS conferido'});
 p.supplies.push({id:'s',name:'Aço',quantity:60,unit:'kg',confirmed:true,delivery:'2026-11-06',unitPrice:1,freight:0,technical:true,evidence:'Confirmação',kind:'order',synthetic:true,resourceCode:'steel',specification:r.specification});
 reserveResource(p,r.id,'s',50);assert.equal(resourceCoverage(p,r).balance,10);assert.throws(()=>reserveResource(p,r.id,'s',11),/capacidade|demanda/i);
 p.supplies[0].unit='m³';assert.throws(()=>reserveResource(p,r.id,'s',1),/compat/i);
});
test('legacy allocator also refuses kg against concrete m3',()=>{const p=createProject();addConcreteCase(p,[]);p.supplies[0].unit='kg';assert.throws(()=>allocate(p,p.packages[0].id,p.supplies[0].id,1),/compat/i);});
test('reusable capacity follows overlapping time windows, not accumulated service area',()=>{
 const p=setup();createPackages(p,previewPackages(p,snapshots()));const first=p.packages[2],second=structuredClone(first);second.id='p2';second.needDate='2026-11-08';second.finishDate='2026-11-08';p.packages.push(second);
 const c={resourceCode:'panels',specification:'Painéis sistema A',specificationConfirmed:true,factor:1,lossPercent:0,leadDays:1,preparationDays:1,reusable:true,cycleDays:1,evidence:'Ciclo de montagem/desforma conferido'};
 const a=composeResource(p,first.id,c),b=composeResource(p,second.id,c);p.supplies.push({id:'s',name:'Painéis',quantity:20,unit:'m²',confirmed:true,delivery:'2026-11-06',unitPrice:1,freight:0,technical:true,evidence:'Disponível',kind:'stock',synthetic:true,resourceCode:'panels',specification:c.specification,reusable:true,availableUntil:'2026-11-20'});
 reserveResource(p,a.id,'s',20);reserveResource(p,b.id,'s',20);assert.equal(p.supplies[0].quantity,20);
 b.from=a.from;b.to=a.to;assert.throws(()=>reserveResource(p,b.id,'s',1),/capacidade|demanda/i);
});
test('catalog revision invalidates package review; explicit refresh is blocked for a frozen commitment',()=>{
 const p=setup();createPackages(p,previewPackages(p,snapshots()));const pkg=p.packages[1];assert.equal(quantificationNeedsReview(p,pkg),false);
 p.quantificationCatalog=structuredClone(catalog);p.quantificationCatalog[1].version='new';assert.equal(quantificationNeedsReview(p,pkg),true);
 assert.throws(()=>refreshPackageMeasures(p,pkg.id),/confer/i);delete p.quantificationCatalog;
 p.week={frozenAt:'now',reviewer:'Lucas',commitments:[{packageId:pkg.id}]};assert.throws(()=>refreshPackageMeasures(p,pkg.id),/congel/i);
});
