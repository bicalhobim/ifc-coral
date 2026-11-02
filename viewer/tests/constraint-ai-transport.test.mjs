import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProject} from '../src/production/project.ts';import {createManualPackage} from '../src/production/package-management.ts';
import {analysisContext} from '../src/production/constraint-analysis.ts';
import {requestConstraintAnalysis} from '../src/production/ai.ts';
const result={summary:'Conferir a frente.',facts:[],gaps:['Quantidade desconhecida.'],suggestions:['Projeto e informação','Frente e predecessoras','Mão de obra','Equipamentos','Materiais e suprimentos','Ambiente e segurança'].map(category=>({category,description:`Conferir ${category.toLowerCase()}`,action:'Conferir as condições antes de executar.',verification:'Registro da conferência.',reason:'Condição ainda não verificada.',basis:['package'],scope:'package',elements:[]}))};
test('OpenAI and Gemini request structured analysis for the selected package, without mutation',async()=>{
 for(const provider of ['openai','gemini']){const p=createProject(),pkg=createManualPackage(p,{name:'Laje',location:'P1',service:'Concreto'}),context=analysisContext(p,pkg.id),before=JSON.stringify(p),calls=[];
 const transport=async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify(provider==='openai'?{output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]}:{candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]}));};
 const a=await requestConstraintAnalysis(provider,'KEY-TEST','model-test',context,undefined,transport);assert.equal(a.summary,result.summary);assert.equal(JSON.stringify(p),before);
 const body=JSON.parse(calls[0].init.body);assert.ok(provider==='openai'?body.text.format.schema:body.generationConfig.responseJsonSchema);assert.ok(!calls[0].init.body.includes('KEY-TEST'));assert.ok(calls[0].init.signal);
 }
});
test('API invalid JSON, incomplete and missing-key outcomes are explicit; secrets never appear',async()=>{
 const p=createProject(),pkg=createManualPackage(p,{name:'Pacote',location:'P1',service:'Concreto'}),context=analysisContext(p,pkg.id);
 await assert.rejects(()=>requestConstraintAnalysis('openai','','m',context));
 await assert.rejects(()=>requestConstraintAnalysis('openai','KEY-TEST','m',context,undefined,async()=>new Response(JSON.stringify({status:'incomplete',output:[]}))),/incompleta/i);
 await assert.rejects(()=>requestConstraintAnalysis('gemini','KEY-TEST','m',context,undefined,async()=>new Response(JSON.stringify({candidates:[{content:{parts:[{text:'invalid'}]}}]}))),/inválida/i);
 await assert.rejects(()=>requestConstraintAnalysis('openai','KEY-TEST','m',context,undefined,async()=>new Response('KEY-TEST',{status:401})),e=>!e.message.includes('KEY-TEST')&&e.message.includes('401'));
});
test('API cannot accept an information-only answer while production areas remain unexamined',async()=>{
 const p=createProject(),pkg=createManualPackage(p,{name:'Laje',location:'P1',service:'Concretagem'}),context=analysisContext(p,pkg.id),before=JSON.stringify(p),partial={...result,suggestions:result.suggestions.slice(0,1)};
 await assert.rejects(()=>requestConstraintAnalysis('openai','KEY-TEST','m',context,undefined,async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify(partial)}]}]}))),/Mão de obra|Materiais/);assert.equal(JSON.stringify(p),before);
});
