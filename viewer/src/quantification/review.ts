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
export function reviewSelection(rows:MeasureResult[],review:{reviewer:string;evidence:string;method:string},manualTotal?:number):MeasureSnapshot[]{
 if(!review.evidence.trim())throw new Error('Informe uma evidência escrita pelo conferente.');
 if(!rows.length||rows.some(r=>r.serviceCode!==rows[0].serviceCode))throw new Error('Confira um serviço por vez.');
 if(manualTotal===undefined)return rows.map(r=>approveMeasure(r,review));
 if(rows.length===1)return [approveMeasure(rows[0],{...review,manualAmount:manualTotal})];
 const weight=(r:MeasureResult)=>Number(r.serviceCode==='formwork'?r.inputs.candidateArea:r.inputs.volume);
 if(rows.some(r=>!Number.isFinite(weight(r))||weight(r)<=0))throw new Error('Selecione um elemento por vez para medição manual sem pesos disponíveis.');
 const sum=rows.reduce((n,r)=>n+weight(r),0);
 return rows.map(r=>approveMeasure(r,{...review,evidence:review.evidence.trim()+` · rateio explícito proporcional da medida total ${manualTotal} ${r.unit}`,manualAmount:manualTotal*weight(r)/sum}));
}
