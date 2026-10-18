import type {MeasureResult} from './types.ts';
export type MeasureSnapshot={measure:MeasureResult;fingerprint:string;amount:number;reviewOrigin:'calculated'|'manual';reviewer:string;at:string;method:string;evidence:string};
const canonical=(v:unknown):unknown=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,canonical(x)])):v;
export const fingerprint=(row:MeasureResult)=>JSON.stringify(canonical(row));
export function approveMeasure(row:MeasureResult,review:{reviewer:string;evidence:string;method:string;manualAmount?:number}):MeasureSnapshot{
 if(!review.reviewer.trim()||!review.evidence.trim()||!review.method.trim())throw new Error('Informe conferente, método e evidência.');
 const amount=review.manualAmount??row.amount;
 if(amount===null||!Number.isFinite(amount)||amount<0||(!('manualAmount'in review)&&row.status==='pending'))throw new Error('Medição incompleta: confira as entradas ou registre medição manual justificada.');
 return {measure:structuredClone(row),fingerprint:fingerprint(row),amount,reviewOrigin:review.manualAmount===undefined?'calculated':'manual',reviewer:review.reviewer.trim(),at:new Date().toISOString(),method:review.method.trim(),evidence:review.evidence.trim()};
}
export function isReviewCurrent(snapshot:MeasureSnapshot,row:MeasureResult):boolean{return snapshot.fingerprint===fingerprint(row);}
