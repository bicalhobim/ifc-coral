import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {AnalysisOperation} from '../server/analysis-operation.mjs';
import {ScheduleLinkAnalyzer} from '../server/schedule-preparation.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
test('cancel immediately releases its slot; late completion cannot unlock a newer request',async()=>{
 const gate=new AnalysisOperation(),old=deferred(),newer=deferred();
 const first=gate.run('first',undefined,()=>old.promise);const rejected=assert.rejects(first,/abort/i);
 gate.cancel('first');assert.equal(gate.busy,false);
 const second=gate.run('second',undefined,()=>newer.promise);assert.equal(gate.busy,true);
 gate.cancel('unrelated');assert.equal(gate.busy,true);old.resolve('late');await rejected;assert.equal(gate.busy,true);
 await assert.rejects(gate.run('third',undefined,()=>{}),/andamento/);
 newer.resolve('ok');assert.equal(await second,'ok');assert.equal(gate.busy,false);
});
test('cancel before request arrival and HTTP disconnect prevent stale analysis',async()=>{
 const gate=new AnalysisOperation();gate.cancel('before');let called=false;
 await assert.rejects(gate.run('before',undefined,()=>{called=true;}),/cancelada/);assert.equal(called,false);
 const controller=new AbortController(),wait=deferred();const p=gate.run('disconnected',controller.signal,()=>wait.promise);const check=assert.rejects(p,/abort/i);controller.abort();assert.equal(gate.busy,false);wait.resolve();await check;
 assert.equal(await gate.run('after',undefined,async()=>42),42);
});
const body=id=>({requestId:id,kind:'metadata',model:'qa-model',elements:[{modelId:'m',modelHash:'a'.repeat(64),globalId:'g',name:'Viga',ifcClass:'IfcBeam',location:'P1',service:''}]});
test('schedule analyzer survives cancellation and locked temporary directory cleanup',async()=>{
 let count=0;const entered=deferred();
 const analyzer=new ScheduleLinkAnalyzer({find:()=>({command:'fake',prefix:[]}),execute:async(_cmd,args,_input,{signal})=>{
  if(++count===1){entered.resolve();await new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('cancelada')),{once:true}));}
  await writeFile(args[args.indexOf('--output-last-message')+1],JSON.stringify({corrections:[]}));
 },remove:async()=>{throw Error('EPERM locked file');}});
 const first=analyzer.analyze(body('old'));const rejection=assert.rejects(first,/cancelada/);await entered.promise;analyzer.cancel('old');await rejection;assert.equal(analyzer.busy,false);
 assert.deepEqual((await analyzer.analyze(body('new'))).proposal,{corrections:[]});assert.equal(analyzer.busy,false);
});
