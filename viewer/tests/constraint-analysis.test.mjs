import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,serializeProject,parseProject} from '../src/production/project.ts';
import {createManualPackage} from '../src/production/package-management.ts';
import {adoptPackage} from '../src/production/integrated.ts';
import {analysisContext,parseConstraintAnalysis,applyConstraintAnalysis,constraintAnalysisInstructions} from '../src/production/constraint-analysis.ts';
function fixture(){const p=createProject(),pkg=createManualPackage(p,{name:'Laje P1',location:'P1',service:'Concretagem'});p.models.push({id:'m',hash:'a'.repeat(64),name:'Estrutura',projectGlobalId:'root'});pkg.elements=[{modelId:'m',globalId:'a'}];pkg.quantity=12;pkg.quantitySource='Cenário didático';return {p,pkg};}
const response=()=>({summary:'Preparar a concretagem.',facts:['12 m³ informados no cenário.'],gaps:['Entrega sem confirmação.'],suggestions:[{category:'Materiais e suprimentos',description:'Confirmar janela de entrega do concreto',action:'Consultar disponibilidade na janela necessária.',verification:'Conferir confirmação documentada.',reason:'Não há confirmação de entrega.',basis:['package'],scope:'package',elements:[]}]});
test('non-applicable category is respected and changing it invalidates in-flight analysis',()=>{const {p,pkg}=fixture();const context=analysisContext(p,pkg.id);adoptPackage(p,pkg.id).notApplicable={'Materiais e suprimentos':'QA: escopo sem materiais'};const next=analysisContext(p,pkg.id);assert.ok(!next.requiredCategories.includes('Materiais e suprimentos'));assert.throws(()=>applyConstraintAnalysis(p,context,response(),[0],{provider:'codex',model:'qa',reviewer:'QA'}),/mudou/);assert.throws(()=>applyConstraintAnalysis(p,next,response(),[0],{provider:'codex',model:'qa',reviewer:'QA'}),/não aplicável/);});

test('AI fills the intact category placeholder instead of adding a duplicate empty condition',()=>{
 const {p,pkg}=fixture(),id=pkg.constraints[4].id;applyConstraintAnalysis(p,analysisContext(p,pkg.id),response(),[0],{provider:'codex',model:'qa',reviewer:'QA'});assert.equal(pkg.constraints.length,5);assert.equal(pkg.constraints[4].id,id);assert.match(pkg.constraints[4].description,/janela/);assert.equal(pkg.constraints[4].resolved,false);
});
test('context isolates selected package, excludes image bytes and preserves unknown quantity',()=>{
 const {p,pkg}=fixture();pkg.quantity=null;const other=createManualPackage(p,{name:'SEGREDO OUTRO PACOTE',location:'P2',service:'Serviço'});other.constraints[0].evidence='NAO ENVIAR';
 const context=analysisContext(p,pkg.id),text=JSON.stringify(context);assert.equal(context.package.quantity,null);assert.ok(!text.includes(other.name));assert.ok(!text.includes('NAO ENVIAR'));assert.ok(!text.includes('dataUrl'));assert.equal(context.package.elements[0].globalId,'a');
});
test('response is strict, scoped and cannot release, invent references or smuggle extra fields',()=>{
 const {p,pkg}=fixture(),context=analysisContext(p,pkg.id);assert.equal(parseConstraintAnalysis(JSON.stringify(response()),context).suggestions.length,1);
 for(const edit of [r=>r.suggestions[0].resolved=true,r=>r.suggestions[0].elements=[{modelId:'m',globalId:'OUTSIDE'}],r=>r.suggestions[0].basis=['invented'],r=>r.suggestions[0].category='invented',r=>r.suggestions[0].description='']){const r=response();edit(r);assert.throws(()=>parseConstraintAnalysis(JSON.stringify(r),context));}
 assert.throws(()=>parseConstraintAnalysis('```json\n{}\n```',context));
});
test('review applies selected suggestions only, pending and attributable, survives reopen without overwriting evidence',()=>{
 const {p,pkg}=fixture();pkg.constraints[4].action='Apontamento humano existente';const context=analysisContext(p,pkg.id),before=structuredClone(pkg.constraints);const result=parseConstraintAnalysis(JSON.stringify(response()),context);
 assert.throws(()=>applyConstraintAnalysis(p,context,result,[0],{provider:'codex',model:'test-model',reviewer:''}));
 const count=applyConstraintAnalysis(p,context,result,[0],{provider:'codex',model:'test-model',reviewer:'Lucas'});assert.equal(count,1);assert.deepEqual(pkg.constraints.slice(0,before.length),before);
 const saved=parseProject(serializeProject(p)),c=saved.packages[0].constraints.at(-1);assert.equal(c.resolved,false);assert.equal(c.evidence,'');assert.equal(c.reviewer,'');assert.equal(c.aiOrigin.reviewer,'Lucas');assert.equal(c.aiOrigin.model,'test-model');assert.equal(c.scope,'package');
 assert.throws(()=>applyConstraintAnalysis(p,context,result,[0],{provider:'codex',model:'test-model',reviewer:'Lucas'}),/mudou|nova análise/i);
});
test('stale inputs and frozen commitments refuse all mutations',()=>{
 for(const mutate of [(p,pkg)=>pkg.quantity=13,(p,pkg)=>p.models[0].hash='b'.repeat(64),(p,pkg)=>pkg.constraints[0].resolved=true,(p,pkg)=>p.week={frozenAt:'now',reviewer:'QA',commitments:[{packageId:pkg.id}]}]){
 const {p,pkg}=fixture(),context=analysisContext(p,pkg.id),result=parseConstraintAnalysis(JSON.stringify(response()),context);mutate(p,pkg);const before=JSON.stringify(p);assert.throws(()=>applyConstraintAnalysis(p,context,result,[0],{provider:'codex',model:'test',reviewer:'QA'}));assert.equal(JSON.stringify(p),before);}
});
test('invalid or duplicate proposals cannot partially apply',()=>{
 const {p,pkg}=fixture(),context=analysisContext(p,pkg.id),r=response();r.suggestions.push({...r.suggestions[0]});assert.throws(()=>parseConstraintAnalysis(JSON.stringify(r),context),/repetida|duplicada/i);
 const result=parseConstraintAnalysis(JSON.stringify(response()),context),before=serializeProject(p);assert.throws(()=>applyConstraintAnalysis(p,context,result,[0,7],{provider:'codex',model:'test',reviewer:'QA'}));assert.equal(serializeProject(p),before);
});
test('snapshot includes the entire element set; a change after element 500 invalidates suggestions',()=>{
 const {p,pkg}=fixture();pkg.elements=Array.from({length:501},(_,i)=>({modelId:'m',globalId:String(i)}));const context=analysisContext(p,pkg.id);assert.equal(context.package.elements.length,501);const a=parseConstraintAnalysis(JSON.stringify(response()),context);pkg.elements[500].globalId='changed';assert.throws(()=>applyConstraintAnalysis(p,context,a,[0],{provider:'codex',model:'m',reviewer:'QA'}),/mudou/);
});
test('candidate offers are distinguished from reservations; instructions clarify material coverage',()=>{
 const {p,pkg}=fixture();p.supplies.push({id:'offer',name:'Oferta didática',quantity:12,unit:'m³',confirmed:false,delivery:pkg.needDate,unitPrice:1,freight:0,technical:false,evidence:'',kind:'order',synthetic:true});
 const c=analysisContext(p,pkg.id);assert.equal(c.supplies.length,0);assert.equal(c.candidateSupplies.length,1);assert.ok(c.sourceIds.includes('supply:offer'));assert.match(constraintAnalysisInstructions,/NÃO significa cobertura geométrica/);
});
