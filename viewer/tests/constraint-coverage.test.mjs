import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProject} from '../src/production/project.ts';import {createManualPackage} from '../src/production/package-management.ts';
import {analysisContext,requiredConstraintCategories,validateAnalysisCoverage,analysisCoverage,parseConstraintAnalysis} from '../src/production/constraint-analysis.ts';
const categories=['Projeto e informação','Frente e predecessoras','Mão de obra','Equipamentos','Materiais e suprimentos','Ambiente e segurança'];
function fixture(){const p=createProject(),pkg=createManualPackage(p,{name:'Laje P1',location:'P1',service:'Concretagem'});return {p,pkg};}
function response(cats=categories){return {summary:'Preparar a frente antes de prometer.',facts:[],gaps:[],suggestions:cats.map(category=>({category,description:`Conferir ${category.toLowerCase()} na concretagem`,action:'Confirmar as condições na frente.',verification:'Registro de conferência.',reason:'Condição ainda não verificada.',basis:['package'],scope:'package',elements:[]}))};}
test('generic open checklist entries do not suppress production-oriented proposals in all six families',()=>{
 const {p,pkg}=fixture(),context=analysisContext(p,pkg.id);assert.deepEqual(requiredConstraintCategories(context),categories);assert.deepEqual(context.requiredCategories,categories);
 assert.throws(()=>validateAnalysisCoverage(response(['Projeto e informação']),context),/Mão de obra|Materiais/);
 assert.doesNotThrow(()=>validateAnalysisCoverage(response(),context));
});
test('a fully released package category is visible as attended; partial element releases still need analysis',()=>{
 const {p,pkg}=fixture();Object.assign(pkg.constraints[3],{resolved:true,evidence:'Conferência registrada',reviewer:'QA'});
 let context=analysisContext(p,pkg.id);assert.ok(!requiredConstraintCategories(context).includes('Equipamentos'));assert.equal(analysisCoverage(context,response(categories.filter(c=>c!=='Equipamentos'))).find(x=>x.category==='Equipamentos').attended,true);
 pkg.constraints[3].scope='elements';pkg.constraints[3].elements=[{modelId:'m',globalId:'a'}];context=analysisContext(p,pkg.id);assert.ok(requiredConstraintCategories(context).includes('Equipamentos'));
});
test('environment and safety allow lighting/access proposals, with short actionable text',()=>{
 const {p,pkg}=fixture(),context=analysisContext(p,pkg.id),a=response();Object.assign(a.suggestions.at(-1),{description:'Conferir iluminação e acesso na frente',action:'Verificar visibilidade e circulação na janela de trabalho.',verification:'Checklist da frente e registro da conferência.'});
 assert.doesNotThrow(()=>parseConstraintAnalysis(JSON.stringify(a),context));a.suggestions[0].description='x'.repeat(151);assert.throws(()=>parseConstraintAnalysis(JSON.stringify(a),context));
});
test('a package category released by image evidence remains attended in source and snapshot',()=>{
 const {p,pkg}=fixture();Object.assign(pkg.constraints[3],{resolved:true,evidence:'',reviewer:'QA',attachments:[{id:'print'}]});const c=analysisContext(p,pkg.id);assert.ok(!c.requiredCategories.includes('Equipamentos'));assert.ok(!requiredConstraintCategories(c).includes('Equipamentos'));
});
