import {test} from 'node:test';
import assert from 'node:assert/strict';

test('native dialog result preserves accented Windows paths and treats cancellation separately',async()=>{
 const {decodeFolderResult}=await import('../server/native-picker.mjs');
 assert.equal(decodeFolderResult('\uFEFF{"cancelled":false,"path":"C:\\\\Obras\\\\Edifício São José"}\r\n'),'C:\\Obras\\Edifício São José');
 assert.equal(decodeFolderResult('{"cancelled":true}'),null);
 assert.throws(()=>decodeFolderResult('{"cancelled":false,"path":""}'),/resposta/i);
 assert.throws(()=>decodeFolderResult('not json'),/resposta/i);
});

test('only one native folder dialog can be pending and errors release the next attempt',async()=>{
 const {createFolderPicker}=await import('../server/native-picker.mjs');
 let finish;const picker=createFolderPicker(()=>new Promise(resolve=>{finish=resolve;}));
 const first=picker();await assert.rejects(()=>picker(),/já.*aberta/i);finish('{"cancelled":true}');assert.equal(await first,null);
 const second=picker();finish('{"cancelled":false,"path":"C:\\\\Obras"}');assert.equal(await second,'C:\\Obras');
 let attempts=0;const failing=createFolderPicker(async()=>{if(++attempts===1)throw new Error('helper failed');return '{"cancelled":true}';});
 await assert.rejects(()=>failing(),/helper failed/);assert.equal(await failing(),null);
});
