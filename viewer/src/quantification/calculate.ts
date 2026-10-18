import type {MeasureInput,QuantRule,MeasureResult,ServiceCode} from './types.ts';
const valid=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
export function calculateMeasures(input:MeasureInput,rule:QuantRule):MeasureResult[]{
 if(rule.steelRate!==null&&!valid(rule.steelRate))throw new Error('Taxa inválida.');
 if(input.volume&&(input.volume.unit!=='m³'||input.volume.amount!==null&&!valid(input.volume.amount)))throw new Error('Volume ou unidade inválida.');
 const v=input.volume?.amount??null,g=input.geometry;
 if(g&&[g.candidateArea,g.deductedArea].some(n=>n!==null&&!valid(n)))throw new Error('Área inválida.');
 const make=(serviceCode:ServiceCode,unit:MeasureResult['unit'],origin:MeasureResult['origin'],amount:number|null,inputs:Record<string,unknown>,pendingReasons:string[],evidence:string[]):MeasureResult=>({id:JSON.stringify([input.element.modelId,input.element.globalId,serviceCode]),elementRef:structuredClone(input.element),serviceCode,ruleId:rule.id,ruleVersion:rule.version,ruleSnapshot:structuredClone(rule),inputs,amount,unit,origin,status:pendingReasons.length?'pending':'draft',pendingReasons,evidence});
 const formReasons:string[]=[];
 if(!rule.formMethod||!g?.method)formReasons.push('Confirmar método executivo.');
 if(g?.method&&g.method!==rule.formMethod)formReasons.push('Relatório geométrico calculado por outro método; recalcular ou conferir manualmente.');
 if(!g||g.candidateArea===null||g.deductedArea===null||!g.contactsResolved)formReasons.push('Conferir geometria e contatos.');
 if(g&&g.candidateArea!==null&&g.deductedArea!==null&&g.deductedArea>g.candidateArea+1e-6)formReasons.push('Descontos excedem a área candidata.');
 return [
 make('concrete','m³','declared',v,{volume:v,source:input.volume?.source??''},v===null?['Volume ausente ou conflitante.']:[],[input.volume?.source??'Sem QTO']),
 make('reinforcement','kg','estimated',v!==null&&rule.steelRate!==null?v*rule.steelRate:null,{volume:v,steelRate:rule.steelRate,formula:'volume [m³] × taxa [kg/m³]'},[...(v===null?['Volume ausente ou conflitante.']:[]),...(rule.steelRate===null?['Calibrar taxa de aço.']:[])],[rule.source]),
 make('formwork','m²','geometric',formReasons.length?null:Math.max(0,g!.candidateArea!-g!.deductedArea!),{candidateArea:g?.candidateArea??null,lowerArea:g?.lowerArea??null,deductedArea:g?.deductedArea??null,method:g?.method??rule.formMethod,contactsResolved:g?.contactsResolved??false},formReasons,[g?.source??'Sem medição geométrica']),
 ];
}
export function summarizeMeasures(rows:MeasureResult[],service:ServiceCode){
 const unique=new Map<string,MeasureResult>();const conflicts=new Set<string>();
 for(const r of rows.filter(x=>x.serviceCode===service)){const key=JSON.stringify([r.elementRef.modelId,r.elementRef.globalId]);const old=unique.get(key);if(old&&JSON.stringify(old)!==JSON.stringify(r))conflicts.add(key);unique.set(key,r);}
 const known=[...unique.entries()].filter(([k,r])=>!conflicts.has(k)&&r.amount!==null&&r.status!=='pending');const subtotal=known.reduce((sum,[,r])=>sum+r.amount!,0);const missing=unique.size-known.length;
 return {count:unique.size,subtotal,total:unique.size&&!missing?subtotal:null,missing};
}
