import {correctionProposals,type Correction,type ExtractedElement} from './schedule-pipeline.ts';

// Bound each request by both record count and serialized size, not selection size.
export function metadataBatches(elements:ExtractedElement[],maxItems=20,maxBytes=110_000):ExtractedElement[][]{
 const batches:ExtractedElement[][]=[];let batch:ExtractedElement[]=[],size=2;
 for(const e of elements){
  const length=new TextEncoder().encode(JSON.stringify(e)).byteLength+1;
  if(length+2>maxBytes)throw new Error(`Metadados do elemento ${e.globalId} excedem o tamanho de um lote. Recorte suas propriedades antes de analisar.`);
  if(batch.length&&(batch.length>=maxItems||size+length>maxBytes)){batches.push(batch);batch=[];size=2;}
  batch.push(e);size+=length;
 }
 if(batch.length)batches.push(batch);return batches;
}
export type MetadataProgress={processed:number;total:number;batch:number;batches:number;corrections:Correction[]};
export async function analyzeMetadataBatches(elements:ExtractedElement[],request:(elements:ExtractedElement[])=>Promise<unknown>,options:{check:()=>void;progress:(value:MetadataProgress)=>void}):Promise<Correction[]>{
 const batches=metadataBatches(elements),corrections:Correction[]=[];let processed=0;
 for(let i=0;i<batches.length;i++){
  options.check();options.progress({processed,total:elements.length,batch:i+1,batches:batches.length,corrections:structuredClone(corrections)});
  const result=await request(batches[i]);options.check();
  corrections.push(...correctionProposals(result,batches[i]));processed+=batches[i].length;
  options.progress({processed,total:elements.length,batch:i+1,batches:batches.length,corrections:structuredClone(corrections)});
 }
 return corrections;
}
