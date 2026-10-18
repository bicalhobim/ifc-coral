import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProject,serializeProject,parseProject} from '../src/production/project.ts';
import {addConcreteCase} from '../src/production/case.ts';
import {composeResource} from '../src/production/resources.ts';
import {buildSupplyMap,confirmSupplyMap} from '../src/production/supply-map.ts';
function fixture(){const p=createProject();addConcreteCase(p,[]);const pkg=p.packages[0];pkg.unit='kg';pkg.serviceCode='reinforcement';pkg.quantity=60;pkg.name='Armação';pkg.coverageKnown=true;p.supplies=[];const c={resourceCode:'steel',specification:'CA50 Ø10 BBS1',specificationConfirmed:true,factor:1,lossPercent:0,leadDays:2,preparationDays:1,reusable:false,cycleDays:0,evidence:'Projeto conferido'};composeResource(p,pkg.id,c);return {p,pkg,c};}
test('compatible specifications consolidate within the window, never across incompatible steel or dates',()=>{
 const {p,pkg,c}=fixture();const other={...structuredClone(pkg),id:'p2'};p.packages.push(other);composeResource(p,'p2',c);let rows=buildSupplyMap(p);assert.equal(rows.length,1);assert.equal(rows[0].quantity,120);assert.equal(rows[0].orderDate,'2026-11-04');assert.equal(rows[0].startDate,'2026-11-03');
 p.resources[1].specification='CA60 Ø5 BBS2';assert.equal(buildSupplyMap(p).length,2);p.resources[1].specification=c.specification;p.resources[1].needDate='2026-11-07';assert.equal(buildSupplyMap(p).length,2);
});
test('missing BBS remains blocked; partial eligible supply reduces only the compatible remainder',()=>{
 const {p,c}=fixture();p.resources[0].specificationConfirmed=false;p.resources[0].procurementBlockers=['Bitolas e BBS pendentes'];assert.ok(buildSupplyMap(p)[0].blockers.length);assert.throws(()=>confirmSupplyMap(p,buildSupplyMap(p),'Lucas','Conferido'),/pend|bloq/i);
 p.resources[0].specificationConfirmed=true;p.resources[0].procurementBlockers=[];p.supplies.push({id:'s',name:'Aço',unit:'kg',quantity:20,confirmed:true,delivery:'2026-11-06',unitPrice:1,freight:0,technical:true,evidence:'Confirmação',kind:'order',synthetic:true,resourceCode:'steel',specification:c.specification});p.resourceAllocations.push({id:'a',requirementId:p.resources[0].id,supplyId:'s',quantity:20});assert.equal(buildSupplyMap(p)[0].balance,40);
});
test('lead-time edits do not rewrite an approved map or frozen commitments',()=>{
 const {p}=fixture();const rows=buildSupplyMap(p);confirmSupplyMap(p,rows,'Lucas','Mapa do ensaio');p.resources[0].leadDays=5;assert.equal(buildSupplyMap(p)[0].orderDate,'2026-11-01');assert.equal(p.supplyPlans[0].entries[0].orderDate,'2026-11-04');assert.throws(()=>confirmSupplyMap(p,rows,'Lucas','Obsoleto'),/alter|atual/i);assert.deepEqual(parseProject(serializeProject(p)).supplyPlans,p.supplyPlans);
});
test('reusable forms forecast peak capacity instead of sum of service areas',()=>{
 const {p,pkg}=fixture();p.resources=[];pkg.unit='m²';pkg.serviceCode='formwork';pkg.quantity=20;const other={...structuredClone(pkg),id:'p2',needDate:'2026-11-08',finishDate:'2026-11-08'};p.packages.push(other);
 const c={resourceCode:'panels',specification:'Sistema A',specificationConfirmed:true,factor:1,lossPercent:0,leadDays:2,preparationDays:1,reusable:true,cycleDays:1,evidence:'Ciclo conferido'};composeResource(p,pkg.id,c);composeResource(p,other.id,c);assert.equal(buildSupplyMap(p)[0].quantity,20);other.needDate=pkg.needDate;other.finishDate=pkg.finishDate;composeResource(p,other.id,c);assert.equal(buildSupplyMap(p)[0].quantity,40);
});
