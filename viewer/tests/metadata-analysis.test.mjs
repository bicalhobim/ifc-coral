import {test} from 'node:test';
import assert from 'node:assert/strict';
import {metadataBatches,analyzeMetadataBatches} from '../src/ifc/metadata-analysis.ts';
const elements=n=>Array.from({length:n},(_,i)=>({modelId:'a',modelHash:'a'.repeat(64),globalId:'g'+i,name:'Viga '+i,location:'P1',ifcClass:'IfcBeam',service:'',eligible:true}));
test('40 rich records are partitioned by UTF-8 size without loss or truncation',()=>{
 const rows=elements(40).map(e=>({...e,properties:Array.from({length:40},(_,i)=>({path:'Pset.'+i,value:'ç漢'.repeat(250)}))}));
 const batches=metadataBatches(rows);assert.ok(batches.length>2);
 for(const batch of batches){assert.ok(batch.length<=20);assert.ok(Buffer.byteLength(JSON.stringify(batch))<=110000);}
 assert.deepEqual(batches.flat(),rows);assert.equal(metadataBatches(elements(1000)).length,50);
 assert.throws(()=>metadataBatches([{...rows[0],name:'x'.repeat(120000)}]),/excedem/);
});
test('40 records finish across two requests even when both return no corrections',async()=>{
 const calls=[],updates=[];const result=await analyzeMetadataBatches(elements(40),async batch=>{calls.push(batch.length);return {corrections:[]};},{check:()=>{},progress:p=>updates.push(p)});
 assert.deepEqual(calls,[20,20]);assert.deepEqual(result,[]);assert.equal(updates.at(-1).processed,40);assert.equal(updates.at(-1).total,40);
});
test('failure preserves completed proposals and never accepts a late cancelled reply',async()=>{
 const rows=elements(40),updates=[];let count=0;
 await assert.rejects(analyzeMetadataBatches(rows,async batch=>{if(++count===2)throw Error('rede indisponível');return {corrections:[{modelId:batch[0].modelId,globalId:batch[0].globalId,field:'name',original:batch[0].name,value:'Viga conferida'}]};},{check:()=>{},progress:p=>updates.push(p)}),/rede/);
 assert.equal(updates.at(-1).processed,20);assert.equal(updates.at(-1).corrections.length,1);
 let cancelled=false;const cancelledUpdates=[];
 await assert.rejects(analyzeMetadataBatches(rows,async()=>{cancelled=true;return {corrections:[]};},{check:()=>{if(cancelled)throw Error('cancelada');},progress:p=>cancelledUpdates.push(p)}),/cancelada/);
 assert.equal(cancelledUpdates.at(-1).processed,0);
});
