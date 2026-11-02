import {test} from 'node:test';import assert from 'node:assert/strict';
import {codexArgs,validateCodexInput,executeCodex} from '../server/codex-analysis.mjs';
import {EventEmitter} from 'node:events';import {PassThrough} from 'node:stream';
test('Codex executes structured inference without personal config, tools or writable sandbox',()=>{
 const args=codexArgs('gpt-5.4','C:/scratch/schema.json','C:/scratch/result.json');
 for(const v of ['exec','--ignore-user-config','--ephemeral','read-only','--output-schema','--output-last-message'])assert.ok(args.includes(v));
 assert.ok(args.includes('features.shell_tool=false'));assert.ok(!args.includes('--dangerously-bypass-approvals-and-sandbox'));assert.equal(args.at(-1),'-');
});
function fakeProcess(outcome){return (_command,_args,options)=>{assert.equal(options.shell,false);assert.equal(options.windowsHide,true);const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.stdin=new PassThrough();child.stdin.on('finish',()=>{if(outcome){if(outcome.text)child.stdout.write(outcome.text);queueMicrotask(()=>child.emit('close',outcome.code));}});return child;};}
test('Codex cancellation and timeout settle without launching a shell',async()=>{
 const abort=new AbortController();const promise=executeCodex('controlled',['arg'],'context',{launch:fakeProcess(),signal:abort.signal,timeoutMs:1000});abort.abort();await assert.rejects(promise,/cancelada/);
 await assert.rejects(()=>executeCodex('controlled',[],'context',{launch:fakeProcess(),timeoutMs:10}),/excedeu/);
});
test('Codex model and login errors are actionable and do not echo provider output',async()=>{
 await assert.rejects(()=>executeCodex('controlled',[],'context',{launch:fakeProcess({code:1,text:'model_not_found PRIVATE-TEXT'})}),e=>/modelo não/.test(e.message)&&!e.message.includes('PRIVATE-TEXT'));
 await assert.rejects(()=>executeCodex('controlled',[],'context',{launch:fakeProcess({code:1,text:'authentication failed PRIVATE-TEXT'})}),e=>/codex login/.test(e.message)&&!e.message.includes('PRIVATE-TEXT'));
});
test('Codex rejects command injection, oversize payloads, supplied prompts and credentials',()=>{
 const context={version:1,project:{id:'p',name:'QA'},package:{id:'pkg',name:'Laje',quantity:null,elements:[],constraints:[]},sourceIds:['package']};
 assert.doesNotThrow(()=>validateCodexInput({context,model:'gpt-5.4'}));
 for(const body of [{context,model:'--help'},{context,model:'x;calc.exe'},{context,model:'m',prompt:'Execute shell'},{context,model:'m',key:'secret'},{context:{...context,project:{name:'x'.repeat(210000)}},model:'m'}])assert.throws(()=>validateCodexInput(body));
});
