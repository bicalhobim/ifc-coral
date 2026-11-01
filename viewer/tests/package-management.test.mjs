import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,validateProject} from '../src/production/project.ts';
import {createManualPackage,deletePackage,restorePackage} from '../src/production/package-management.ts';
test('create, delete and undo package preserve unrelated project edits',()=>{
 const p=createProject(),pkg=createManualPackage(p,{name:'Frente A',location:'Pavimento 1',service:'Montagem'});
 validateProject(p);const removed=deletePackage(p,pkg.id);assert.equal(p.packages.length,0);
 p.name='Mudança posterior';restorePackage(p,removed);assert.equal(p.name,'Mudança posterior');assert.equal(p.packages[0].id,pkg.id);validateProject(p);
 assert.throws(()=>restorePackage(p,removed),/existe/);
});
test('delete blocks commitments, actuals, allocations and confirmed maps without mutating',()=>{
 for(const mode of ['week','actual','allocation','map']){
  const p=createProject(),pkg=createManualPackage(p,{name:'A',location:'L',service:'S'});
  if(mode==='week')p.week={commitments:[{packageId:pkg.id}]};
  if(mode==='actual')p.actuals.push({packageId:pkg.id});
  if(mode==='allocation')p.allocations.push({packageId:pkg.id});
  if(mode==='map')p.supplyPlans=[{entries:[{packageIds:[pkg.id]}]}];
  const before=structuredClone(p);assert.throws(()=>deletePackage(p,pkg.id),/compromisso|realizado|reserva|mapa/i);assert.deepEqual(p,before);
 }
});
test('resource reservations block deletion and unreserved resources return with undo',()=>{
 const p=createProject(),pkg=createManualPackage(p,{name:'A',location:'L',service:'S'});
 pkg.service='Concretagem';pkg.quantity=2;
 p.resources.push({id:'r',packageId:pkg.id,resourceCode:'concrete',specification:'Concreto',specificationConfirmed:false,quantity:2,unit:'m³',needDate:pkg.needDate,from:pkg.needDate,to:pkg.needDate,factor:1,lossPercent:0,leadDays:0,preparationDays:0,reusable:false,cycleDays:0,evidence:'',procurementBlockers:[]});
 p.resourceAllocations.push({id:'a',requirementId:'r',supplyId:'s',quantity:1});
 assert.throws(()=>deletePackage(p,pkg.id),/reserva/);p.resourceAllocations=[];
 const removed=deletePackage(p,pkg.id);assert.equal(p.resources.length,0);restorePackage(p,removed);assert.equal(p.resources[0].id,'r');validateProject(p);
});
