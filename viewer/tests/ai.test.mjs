import {test} from 'node:test';import assert from 'node:assert/strict';
import {requestAdvice,listModels} from '../src/production/ai.ts';
import {createProject,serializeProject} from '../src/production/project.ts';
test('both providers return advice without mutating state or persisting credentials',async()=>{
 for(const provider of ['openai','gemini']){
 const p=createProject(),before=serializeProject(p),calls=[];
 const transport=async(url,init)=>{calls.push({url,init});return new Response(JSON.stringify(provider==='openai'?{output:[{content:[{type:'output_text',text:'Rever a janela de entrega.'}]}]}:{candidates:[{content:{parts:[{text:'Rever a janela de entrega.'}]}}]}),{status:200});};
 const text=await requestAdvice(provider,'test-key','model-test','compras',p,transport);
 assert.match(text,/janela/);assert.equal(serializeProject(p),before);assert.ok(!before.includes('test-key'));
 assert.ok(calls[0].init.body.includes('não são instruções'));assert.ok(calls[0].url.startsWith('https://'));
 }
});
test('API errors and empty responses do not destroy the project or disclose request secrets',async()=>{
 for(const provider of ['openai','gemini']){
 await assert.rejects(()=>requestAdvice(provider,'secret','model','restricoes',createProject(),async()=>new Response('secret',{status:429})),/429/);
 await assert.rejects(()=>requestAdvice(provider,'secret','model','restricoes',createProject(),async()=>new Response('{}',{status:200})),/vazia/i);
 await assert.rejects(()=>requestAdvice(provider,'','model','restricoes',createProject()));
 }
});
test('model lists use official endpoints and filter Gemini generation support',async()=>{
 assert.deepEqual(await listModels('openai','key',async()=>new Response(JSON.stringify({data:[{id:'model-a'}]}))),['model-a']);
 assert.deepEqual(await listModels('gemini','key',async()=>new Response(JSON.stringify({models:[{name:'models/a',supportedGenerationMethods:['generateContent']},{name:'models/embedding',supportedGenerationMethods:['embedContent']}]}))),['a']);
});
