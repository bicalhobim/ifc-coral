import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,validateProject,serializeProject,parseProject} from '../src/production/project.ts';
import {createManualPackage} from '../src/production/package-management.ts';
import {addConstraint,saveConstraint,removeConstraint,constraintDeletionBlocker} from '../src/production/constraints.ts';
import {restrictionRows,restrictionStats,restrictionGroups,filterRestrictions,emptyRestrictionFilters,restrictionsCsv} from '../src/production/constraint-dashboard.ts';
import {resolveConstraint} from '../src/production/planning.ts';
import {adoptPackage,revisePackage} from '../src/production/integrated.ts';
const fixture=()=>{const p=createProject(),pkg=createManualPackage(p,{name:'Pacote A',location:'Subsolo',service:'Concretagem'});return {p,pkg};};
test('dashboard separates default placeholders, overdue, due today, unassigned and released conditions',()=>{
 const {p,pkg}=fixture();assert.equal(restrictionStats(restrictionRows(p,'2026-11-05')).identified,0);
 const a=addConstraint(p,pkg.id,{description:'Projeto pendente',category:'Projeto e informação'}),b=addConstraint(p,pkg.id,{description:'Bomba',category:'Equipamentos'});
 saveConstraint(p,pkg.id,a.id,{dueDate:'2026-11-04',owner:'Ana'});saveConstraint(p,pkg.id,b.id,{dueDate:'2026-11-05'});
 let rows=restrictionRows(p,'2026-11-05');assert.deepEqual(restrictionStats(rows),{identified:2,open:2,overdue:1,released:0,unanalyzed:5});assert.equal(rows.find(r=>r.constraint.id===b.id).owner,'Sem responsável');assert.equal(filterRestrictions(rows,{...emptyRestrictionFilters(),status:'identified'}).length,2);
 resolveConstraint(p,pkg.id,a.id,'Desenho conferido','QA');rows=restrictionRows(p,'2026-11-05');assert.equal(restrictionStats(rows).overdue,0);assert.equal(restrictionStats(rows).released,1);
});
test('filters and grouping count each condition once and CSV is scoped and formula-safe',()=>{
 const {p,pkg}=fixture();const c=addConstraint(p,pkg.id,{description:'=HYPERLINK("x")',category:'Mão de obra'});saveConstraint(p,pkg.id,c.id,{owner:'João',dueDate:'2026-11-04'});
 const filters={...emptyRestrictionFilters(),query:'joao',status:'open',area:'Subsolo'};const rows=filterRestrictions(restrictionRows(p,'2026-11-05'),filters);assert.equal(rows.length,1);assert.deepEqual(restrictionGroups(rows,'owner'),[{name:'João',open:1,overdue:1}]);assert.match(restrictionsCsv(rows),/"'=HYPERLINK/);assert.equal(restrictionsCsv(rows).split('\r\n').length,2);
});
test('non-applicable defaults and proposed/superseded packages do not inflate dashboard',()=>{
 const {p,pkg}=fixture(),m=adoptPackage(p,pkg.id);m.notApplicable={'Mão de obra':'QA: fora do escopo'};assert.equal(restrictionRows(p).length,4);
 const c=addConstraint(p,pkg.id,{description:'Equipe não confirmada',category:'Mão de obra'});assert.equal(m.notApplicable['Mão de obra'],undefined);assert.equal(restrictionStats(restrictionRows(p)).identified,1);
 revisePackage(p,pkg.id,'Teste');assert.equal(restrictionStats(restrictionRows(p)).identified,1);
});
test('editing category invalidates release and persists responsibility, action and evidence',()=>{
 const {p,pkg}=fixture(),c=addConstraint(p,pkg.id,{description:'Conferir acesso',category:'Frente e predecessoras'});resolveConstraint(p,pkg.id,c.id,'Foto conferida','QA');saveConstraint(p,pkg.id,c.id,{category:'Ambiente e segurança',owner:'Ana',action:'Isolar frente'});assert.equal(c.resolved,false);assert.equal(c.evidence,'Foto conferida');validateProject(p);const saved=parseProject(serializeProject(p));assert.equal(saved.packages[0].constraints.find(x=>x.id===c.id).owner,'Ana');assert.throws(()=>saveConstraint(p,pkg.id,c.id,{category:'inexistente'}));
});
test('delete requires reason, logs snapshot, protects evidence and commitments, never silently releases category',()=>{
 const {p,pkg}=fixture(),c=addConstraint(p,pkg.id,{description:'Duplicada',category:'Equipamentos'});assert.throws(()=>removeConstraint(p,pkg.id,c.id,''),/motivo/);removeConstraint(p,pkg.id,c.id,'Duplicada');assert.equal(pkg.constraints.some(x=>x.id===c.id),false);assert.match(p.audit.at(-1).detail,/Duplicada/);assert.match(p.audit.at(-1).detail,new RegExp(c.id));
 const proof=pkg.constraints[0];resolveConstraint(p,pkg.id,proof.id,'Evidência','QA');assert.match(constraintDeletionBlocker(p,pkg.id,proof.id),/evidências/);assert.throws(()=>removeConstraint(p,pkg.id,proof.id,'Teste'));
 p.week={commitments:[{packageId:pkg.id}],reviewer:'QA',frozenAt:new Date().toISOString()};assert.match(constraintDeletionBlocker(p,pkg.id,pkg.constraints[1].id),/comprometido/);
});
