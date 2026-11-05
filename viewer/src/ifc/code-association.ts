import type {ScheduleRow} from './schedule-import.ts';
import {elementKey,initialActivities,type ExtractedElement,type ElementRef,type PipelineActivity} from './schedule-pipeline.ts';
export type AssociationRule={modelId:string;modelHash:string;pset:string;property:string;inheritance:'occurrence-only'|'type-only'|'occurrence-first';ifcClass?:string;location?:string;equals?:{pset:string;property:string;value:string}};
export type AssociationProfile={version:1;id:string;revision:number;csvColumn:string;rules:AssociationRule[]};
export type AssociationEvidence={profileId:string;profileRevision:number;sourceHash:string;sourceRow?:number;code:string;links:ElementRef[];rules:AssociationRule[]};
export type CodePreview={activityId:string;code:string;status:'matched'|'missing-code'|'unmatched'|'summary'|'no3d'|'ambiguous-scope'|'ambiguous-property';reason:string;links:ElementRef[]};
export function validateAssociationProfile(profile:AssociationProfile){
 if(!profile||profile.version!==1||typeof profile.id!=='string'||!profile.id||profile.id.length>100||!Number.isInteger(profile.revision)||profile.revision<1||typeof profile.csvColumn!=='string'||!Array.isArray(profile.rules)||!profile.rules.length||profile.rules.length>20)throw Error('Declare o escopo de modelos e a revisão do perfil.');
 const text=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=500;
 const ids=new Set<string>();for(const r of profile.rules){if(!r||!text(r.modelId)||ids.has(r.modelId)||! /^[a-f0-9]{64}$/.test(r.modelHash)||!text(r.pset)||!text(r.property)||!['occurrence-only','type-only','occurrence-first'].includes(r.inheritance)||r.ifcClass!==undefined&&r.ifcClass!==''&&!text(r.ifcClass)||r.location!==undefined&&r.location!==''&&!text(r.location)||r.equals&&(!text(r.equals.pset)||!text(r.equals.property)||typeof r.equals.value!=='string'||r.equals.value.length>500))throw Error('Regra ou filtro de modelo/propriedade inválido.');ids.add(r.modelId);}

}
function values(e:ExtractedElement,r:AssociationRule,pset=r.pset,property=r.property){
 const props=(e.properties??[]).filter(p=>p.pset===pset&&p.property===property);
 const occurrence=props.filter(p=>p.source==='occurrence'),type=props.filter(p=>p.source==='type');
 const selected=r.inheritance==='occurrence-only'?occurrence:r.inheritance==='type-only'?type:occurrence.length?occurrence:type;
 return [...new Set(selected.map(p=>p.value.trim()))];
}
export function previewCodeAssociations(rows:ScheduleRow[],elements:ExtractedElement[],profile:AssociationProfile):CodePreview[]{
 validateAssociationProfile(profile);
 for(const e of elements){const rule=profile.rules.find(r=>r.modelId===e.modelId);if(rule&&rule.modelHash!==e.modelHash)throw Error('A revisão do modelo mudou. Refaça o perfil.');}
 const indexes=new Map<string,Map<string,ElementRef[]>>(),ambiguous=new Map<string,Set<string>>();
 for(const r of profile.rules){const index=new Map<string,ElementRef[]>(),conflicts=new Set<string>();indexes.set(r.modelId,index);ambiguous.set(r.modelId,conflicts);
  for(const e of elements.filter(e=>e.modelId===r.modelId&&e.eligible!==false&&(!r.ifcClass||r.ifcClass===e.ifcClass)&&(!r.location||r.location===e.location))){
   if(r.equals){const v=values(e,r,r.equals.pset,r.equals.property);if(v.length!==1||v[0]!==r.equals.value.trim())continue;}
   const codes=values(e,r);if(codes.length>1){codes.forEach(c=>conflicts.add(c));continue;}
   const code=codes[0];if(code)index.set(code,[...(index.get(code)??[]),{modelId:e.modelId,globalId:e.globalId}]);
  }
 }
 return rows.map(row=>{
  const code=(row.associationCode??'').trim(),base={activityId:row.id,code,links:[] as ElementRef[]};
  if(['resumo','summary'].includes(row.rowKind?.trim().toLowerCase()??''))return {...base,status:'summary',reason:'Resumo: descendentes não são associados implicitamente.'};
  if(['sem3d','sem_3d','marco','milestone'].includes(row.rowKind?.trim().toLowerCase()??''))return {...base,status:'no3d',reason:'Tipo de linha exige decisão humana sobre representação 3D.'};
  if(!code)return {...base,status:'missing-code',reason:'Código vazio; linha mantida pendente.'};
  const rules=profile.rules.filter(r=>!row.modelScope||r.modelId===row.modelScope);
  if(!rules.length)return {...base,status:'ambiguous-scope',reason:'Modelo da linha não resolvido no escopo (use o ID do modelo).'};
  if(rules.some(r=>ambiguous.get(r.modelId)?.has(code)))return {...base,status:'ambiguous-property',reason:'Valores conflitantes da propriedade no mesmo elemento.'};
  const links=[...new Map(rules.flatMap(r=>indexes.get(r.modelId)?.get(code)??[]).map(e=>[elementKey(e),e])).values()].sort((a,b)=>elementKey(a).localeCompare(elementKey(b)));
  return {...base,links,status:links.length?'matched':'unmatched',reason:links.length?'Igualdade textual exata; cobertura técnica sujeita à conferência.':'Sem correspondência neste escopo; linha mantida para outros modelos ou decisão humana.'};
 });
}
const sameLinks=(a:ElementRef[],b:ElementRef[])=>JSON.stringify(a.map(elementKey).sort())===JSON.stringify(b.map(elementKey).sort());
export function adoptCodeAssociations(activities:PipelineActivity[],preview:CodePreview[],selected:Set<string>,profile:AssociationProfile,sourceHash:string,replaceChanged=false):PipelineActivity[]{
 validateAssociationProfile(profile);if(!/^[a-f0-9]{64}$/.test(sourceHash))throw Error('Hash do CSV inválido.');
 return activities.map(a=>{const p=preview.find(p=>p.activityId===a.row.id);if(!p||(!['matched','unmatched','missing-code','summary','no3d'].includes(p.status))||!selected.has(a.row.id)||a.disposition!=='link'||a.manualDecision)return structuredClone(a);
  const generated=a.association&&sameLinks(a.links,a.association.links);
  if(p.status!=='matched'&&!(replaceChanged&&generated))return structuredClone(a);
  if(a.links.length&&(!generated||!sameLinks(a.links,p.links)&&!replaceChanged))return structuredClone(a);
  return {...structuredClone(a),links:structuredClone(p.links),association:{profileId:profile.id,profileRevision:profile.revision,sourceHash,sourceRow:a.row.sourceRow,code:p.code,links:structuredClone(p.links),rules:structuredClone(profile.rules)}};
 });
}

/** Preserve decisions on stable activity IDs; never silently drop removed CSV rows. */
export function reconcileCodeActivities(previous:PipelineActivity[],rows:ScheduleRow[],elements:ExtractedElement[]):PipelineActivity[]{
 const next=rows.map(row=>{const old=previous.find(a=>a.row.id===row.id);if(!old)return initialActivities([row],elements)[0];
  const changed=JSON.stringify(old.row)!==JSON.stringify(row);return {...structuredClone(old),row:structuredClone(row),...(changed?{pendingReview:'Dados da atividade mudaram no CSV; confira datas, código e decisões preservadas.'}:{})};});
 for(const old of previous)if(!rows.some(r=>r.id===old.row.id))next.push({...structuredClone(old),pendingReview:'Atividade ausente do novo CSV; exclua explicitamente deste recorte.'});
 return next;
}
