import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,validateProject,serializeProject,parseProject} from '../src/production/project.ts';
import {createManualPackage} from '../src/production/package-management.ts';
import {resolveConstraint} from '../src/production/planning.ts';
import {constraintElements,saveConstraint,addConstraint} from '../src/production/constraints.ts';
function fixture(){const p=createProject(),pkg=createManualPackage(p,{name:'Laje',location:'P1',service:'Concretagem'});p.models.push({id:'m',hash:'a'.repeat(64),name:'IFC',projectGlobalId:'p'});pkg.elements=[{modelId:'m',globalId:'a'},{modelId:'m',globalId:'b'}];return {p,pkg};}
test('legacy restrictions apply to package; explicit subset persists by GUID',()=>{
 const {p,pkg}=fixture(),c=pkg.constraints[0];assert.deepEqual(constraintElements(pkg,c),pkg.elements);
 saveConstraint(p,pkg.id,c.id,{owner:'Equipe',dueDate:'2026-11-05',action:'Liberar desenho',scope:'elements',elements:[pkg.elements[1]]});
 validateProject(p);const saved=parseProject(serializeProject(p));assert.deepEqual(constraintElements(saved.packages[0],saved.packages[0].constraints[0]),[pkg.elements[1]]);
 assert.throws(()=>saveConstraint(p,pkg.id,c.id,{scope:'elements',elements:[{modelId:'other',globalId:'a'}]}),/pacote/);
 assert.throws(()=>saveConstraint(p,pkg.id,c.id,{scope:'elements',elements:[]}),/elemento/);
});
test('release remains evidence based; changing scope reopens a previously released constraint',()=>{
 const {p,pkg}=fixture(),c=pkg.constraints[0];assert.throws(()=>resolveConstraint(p,pkg.id,c.id,'','QA'));
 resolveConstraint(p,pkg.id,c.id,'Desenho conferido','QA');assert.equal(c.resolved,true);
 saveConstraint(p,pkg.id,c.id,{scope:'elements',elements:[pkg.elements[0]]});assert.equal(c.resolved,false);assert.equal(c.evidence,'Desenho conferido');validateProject(p);
});
test('new named restrictions do not release conditions automatically; stale references are rejected on import',()=>{
 const {p,pkg}=fixture();const c=addConstraint(p,pkg.id,{description:'Confirmar bomba',category:'Equipamentos'});assert.equal(c.resolved,false);
 assert.throws(()=>addConstraint(p,pkg.id,{description:' ',category:'Equipamentos'}));
 c.scope='elements';c.elements=[{modelId:'m',globalId:'outside'}];assert.throws(()=>validateProject(p));
});
