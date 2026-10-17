import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,registerModel,serializeProject,parseProject} from '../src/production/project.ts';
import {supplyBalance,supplyWindow,assessReadiness,resolveConstraint,freezeWeek,recordActual,calculatePPC,quoteTotal,allocate,packageBalance,recordDelivery} from '../src/production/planning.ts';
import {addConcreteCase} from '../src/production/case.ts';
function fixture(){const p=createProject();p.models.push({id:'fixture',name:'Teste.ifc',hash:'a'.repeat(64),projectGlobalId:'g'});addConcreteCase(p,[]);p.packages[0].elements=[{modelId:'fixture',globalId:'e'}];p.packages[0].coverageKnown=true;p.tasks.push({id:'t',modelId:'fixture',globalId:'e',slot:'Task1',name:'Concretagem',location:'P1',service:'Laje',start:'2026-11-06',finish:'2026-11-06'});p.packages[0].taskIds=['t'];return p;}
test('demand unknown is not zero; coverage subtracts only confirmed compatible allocations',()=>{
 assert.deepEqual(supplyBalance(null,[]),{covered:0,balance:null,excess:0});
 assert.equal(supplyBalance(12,[{quantity:4,unit:'m³',confirmed:true},{quantity:6,unit:'m³',confirmed:true}]).balance,2);
 assert.equal(supplyBalance(12,[{quantity:14,unit:'m³',confirmed:true}]).excess,2);
 assert.throws(()=>supplyBalance(12,[{quantity:-1,unit:'m³',confirmed:true}]));
 assert.throws(()=>supplyBalance(12,[{quantity:4,unit:'kg',confirmed:true}]));
});
test('same supply capacity cannot be reserved twice',()=>{
 const p=fixture();const pkg=p.packages[0];const s=p.supplies[0];s.quantity=12;
 allocate(p,pkg.id,s.id,10);assert.throws(()=>allocate(p,pkg.id,s.id,3),/capacidade/i);
});
test('four supply dates and total quotations remain distinct',()=>{
 assert.deepEqual(supplyWindow('2026-11-06',2,1),{need:'2026-11-06',delivery:'2026-11-06',order:'2026-11-04',start:'2026-11-03'});
 assert.deepEqual([quoteTotal(12,570,300),quoteTotal(12,630,0),quoteTotal(12,550,0)],[7140,7560,6600]);
});
test('constraint resolution requires evidence; readiness requires supply, reviewer and capacity',()=>{
 const p=fixture(), pkg=p.packages[0];assert.equal(assessReadiness(p,pkg).ready,false);
 assert.throws(()=>resolveConstraint(p,pkg.id,pkg.constraints[0].id,'','Professor'));
 for(const c of pkg.constraints)resolveConstraint(p,pkg.id,c.id,'Evidência do exercício','Professor');
 pkg.responsible='Equipe A';pkg.capacityConfirmed=true;
 const s=p.supplies[0];s.confirmed=true;s.quantity=12;s.delivery=pkg.needDate;s.evidence='Confirmação simulada';
 allocate(p,pkg.id,s.id,12);
 assert.equal(assessReadiness(p,pkg).ready,true);
 pkg.reviewRequired=true;assert.equal(assessReadiness(p,pkg).ready,false);
});
test('PPC denominator frozen; cancellation and late evidence do not improve PPC; no commitments is N/A',()=>{
 const p=fixture(),pkg=p.packages[0];assert.equal(calculatePPC(p).percent,null);
 assert.throws(()=>freezeWeek(p,[pkg.id],'Professor'));
 for(const c of pkg.constraints)resolveConstraint(p,pkg.id,c.id,'Evidência','Professor');
 Object.assign(pkg,{responsible:'Equipe',capacityConfirmed:true});
 Object.assign(p.supplies[0],{quantity:12,confirmed:true,delivery:pkg.needDate,evidence:'Agenda confirmada'});
 allocate(p,pkg.id,p.supplies[0].id,12);freezeWeek(p,[pkg.id],'Professor');
 assert.equal(calculatePPC(p).percent,0);
 assert.throws(()=>freezeWeek(p,[pkg.id],'Professor'),/congelada/i);
 assert.throws(()=>recordActual(p,pkg.id,{date:pkg.needDate,complete:true,evidence:'',reason:''}));
 recordActual(p,pkg.id,{date:'2026-11-07',complete:true,evidence:'Entrega tardia',reason:'Concreto atrasou'});
 assert.equal(calculatePPC(p).percent,0);assert.equal(calculatePPC(p).total,1);
 recordActual(p,pkg.id,{date:pkg.needDate,complete:true,evidence:'Correção conferida',reason:'Correção de apontamento'});
 assert.equal(calculatePPC(p).percent,100);
 assert.ok(p.audit.length>=3);
});
test('identical reimport does not duplicate; changed revision marks packages for review',()=>{
 const p=fixture();registerModel(p,{id:'m',hash:'a'.repeat(64),name:'Torre.ifc',projectGlobalId:'g'});
 p.packages[0].elements=[{modelId:'m',globalId:'e'}];
 assert.equal(registerModel(p,{id:'m',hash:'a'.repeat(64),name:'Outro.ifc',projectGlobalId:'g'}),'same');
 assert.equal(p.models.filter(m=>m.id==='m').length,1);
 assert.equal(registerModel(p,{id:'m',hash:'b'.repeat(64),name:'Torre.ifc',projectGlobalId:'g'}),'revision');
 assert.equal(p.packages[0].reviewRequired,true);
});
test('project roundtrip preserves IDs; malformed schema and credentials are rejected',()=>{
 const p=fixture();assert.deepEqual(parseProject(serializeProject(p)),p);
 for(const value of [{}, {...p,schema:99},{...p,apiKey:'secret'},{...p,constructor:'injected'},{...p,packages:[{...p.packages[0],quantity:-1}]},{...p,packages:[{...p.packages[0],needDate:'2026-02-31'}]}]) assert.throws(()=>parseProject(JSON.stringify(value)));
});
test('unknown existing stock/orders keeps acquisition balance indeterminate',()=>{
 const p=fixture(),pkg=p.packages[0];pkg.coverageKnown=false;assert.equal(packageBalance(p,pkg).balance,null);
});
test('new reservation never exceeds demand; reduction highlights excess without auto-cancel',()=>{
 const p=fixture(),pkg=p.packages[0];allocate(p,pkg.id,p.supplies[0].id,10);assert.throws(()=>allocate(p,pkg.id,p.supplies[1].id,3),/demanda/i);
 Object.assign(p.supplies[0],{confirmed:true,delivery:pkg.needDate,evidence:'Agenda'});pkg.quantity=8;
 const b=packageBalance(p,pkg);assert.equal(b.balance,0);assert.equal(b.excess,2);assert.equal(p.allocations[0].quantity,10);
});
test('partial receipt and rejection cover only released quantity; lateness is explicit',()=>{
 const p=fixture(),pkg=p.packages[0],s=p.supplies[1];Object.assign(s,{confirmed:true,evidence:'Agenda'});allocate(p,pkg.id,s.id,12);
 const a=p.allocations[0];recordDelivery(p,{allocationId:a.id,date:pkg.needDate,received:8,rejected:2,evidence:'Romaneio fictício',reviewer:'Aluno'});
 assert.equal(packageBalance(p,pkg).balance,6);assert.throws(()=>recordDelivery(p,{allocationId:a.id,date:pkg.needDate,received:8,rejected:0,evidence:'Duplicada',reviewer:'Aluno'}));
 const late=fixture();allocate(late,late.packages[0].id,late.supplies[1].id,12);recordDelivery(late,{allocationId:late.allocations[0].id,date:'2026-11-07',received:12,rejected:0,evidence:'Atraso',reviewer:'Aluno'});assert.equal(packageBalance(late,late.packages[0]).balance,12);
});
test('unresolved or invented element references cannot become commitments',()=>{
 const p=fixture(),pkg=p.packages[0];pkg.elements[0].globalId='NOT_IN_IFC';pkg.taskIds=[];
 assert.ok(assessReadiness(p,pkg).reasons.some(r=>/vínculo|tarefa|IFC/i.test(r)));
});
test('rejected received quantity can be replaced without deleting receipt history',()=>{
 const p=fixture(),pkg=p.packages[0];allocate(p,pkg.id,p.supplies[0].id,12);recordDelivery(p,{allocationId:p.allocations[0].id,date:pkg.needDate,received:12,rejected:2,evidence:'Romaneio',reviewer:'Conferente'});allocate(p,pkg.id,p.supplies[1].id,2);assert.equal(p.allocations.length,2);assert.equal(p.deliveries.length,1);
});
test('CA-10 two frozen commitments produce 50 percent; adding work later does not change denominator',()=>{
 const p=fixture(),first=p.packages[0],second=structuredClone(first);second.id='second';second.name='Outra frente';p.packages.push(second);
 for(const pkg of p.packages){pkg.responsible='Equipe';pkg.capacityConfirmed=true;for(const c of pkg.constraints)resolveConstraint(p,pkg.id,c.id,'Conferido','Professor');}
 Object.assign(p.supplies[0],{quantity:24,confirmed:true,delivery:first.needDate,evidence:'Janela'});allocate(p,first.id,p.supplies[0].id,12);allocate(p,second.id,p.supplies[0].id,12);freezeWeek(p,[first.id,second.id],'Professor');
 recordActual(p,first.id,{date:first.needDate,complete:true,evidence:'Concluído',reason:''});recordActual(p,second.id,{date:'2026-11-07',complete:true,evidence:'Atrasado',reason:'Material'});
 const third=structuredClone(first);third.id='third';p.packages.push(third);assert.deepEqual(calculatePPC(p),{completed:1,total:2,percent:50});
});

test('CA-01 homologous task names preserve separate package links after roundtrip',()=>{
 const p=fixture(),otherTask={...p.tasks[0],id:'t2',globalId:'e2',location:'P2'};p.tasks.push(otherTask);const other=structuredClone(p.packages[0]);Object.assign(other,{id:'p2',taskIds:['t2'],elements:[{modelId:'fixture',globalId:'e2'}]});p.packages.push(other);const restored=parseProject(serializeProject(p));assert.equal(restored.tasks.length,2);assert.notEqual(restored.packages[0].elements[0].globalId,restored.packages[1].elements[0].globalId);
});
