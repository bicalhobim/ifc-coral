import {validateAssociationProfile} from './code-association.ts';
import type {AssociationProfile,AssociationEvidence} from './code-association.ts';
import {MAX_SCHEDULE_ACTIVITIES,MAX_SCHEDULE_CSV_SIZE} from './schedule-limits.ts';
import {cells,csvDate,parseScheduleCsv,type InventoryItem,type ScheduleRow} from './schedule-import.ts';
export type SourceModel={id:string;name:string;hash:string};
export type ElementRef={modelId:string;globalId:string};
export type ExtractedElement=InventoryItem & {modelId:string;modelHash:string};
export type Correction={modelId:string;globalId:string;field:'name'|'location'|'service';original:string;value:string};
export type PipelineActivity={row:ScheduleRow;links:ElementRef[];disposition:'link'|'no3d'|'excluded';reason:string;pendingReview?:string;manualDecision?:boolean;association?:AssociationEvidence};
export type PipelinePlan={models:SourceModel[];activities:PipelineActivity[];corrections:Correction[];associationProfile?:AssociationProfile;csvSourceHash?:string;clearScheduleModels?:string[]};
export type ExtraCsvField='associationCode'|'modelScope'|'rowKind'|'parentId'|'hierarchy'|'predecessors';
export type CsvField='id'|'name'|'start'|'finish'|'location'|'service'|'globalIds'|ExtraCsvField;
export type CsvMapping=Record<Exclude<CsvField,ExtraCsvField>,number> & Partial<Record<ExtraCsvField,number>>;
export const fieldLabels:Record<CsvField,string>={id:'ID da atividade',name:'Nome da atividade',start:'Início',finish:'Término',location:'Local',service:'Serviço',globalIds:'GlobalIds (opcional)',associationCode:'Código de vínculo',modelScope:'Modelo (escopo)',rowKind:'Tipo de linha',parentId:'ID pai',hierarchy:'EAP / hierarquia',predecessors:'Predecessoras (origem)'};
export const elementKey=(e:ElementRef)=>JSON.stringify([e.modelId,e.globalId]);
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function guessMapping(headers:string[]):CsvMapping{
 const aliases:Record<CsvField,string[]>={id:['id','id_atividade','codigo','unique_id','uniqueid'],name:['atividade','nome','name','task'],start:['inicio','start'],finish:['fim','termino','finish'],location:['local','pavimento','location'],service:['servico','service','navisworks_task_type','origem_navisworks_task_type'],globalIds:['globalids','globalid'],associationCode:['codigo_vinculo','navisworks_user1','origem_navisworks_user1'],modelScope:['modelo'],rowKind:['tipo_linha'],parentId:['id_pai'],hierarchy:['eap'],predecessors:['predecessoras','origem_predecessoras']};
 return Object.fromEntries(Object.entries(aliases).map(([k,terms])=>[k,headers.findIndex(h=>terms.includes(normalize(h).replaceAll(' ','_')))])) as CsvMapping;
}
export function readCsvGrid(text:string){if(text.length>MAX_SCHEDULE_CSV_SIZE)throw new Error('CSV acima de 10 milhões de caracteres. Use um recorte.');return cells(text.replace(/^\uFEFF/,''));}
export function canonicalCsv(rows:ScheduleRow[]):string{
 const quote=(v:string)=>'"'+v.replaceAll('"','""')+'"';
 const extras=[['associationCode','codigo_vinculo'],['modelScope','modelo'],['rowKind','tipo_linha'],['parentId','id_pai'],['hierarchy','eap'],['predecessors','predecessoras'],['sourceRow','origem_linha']] as const;
 const present=extras.filter(([key])=>rows.some(r=>r[key]!==undefined));
 return ['id','atividade','inicio','fim','local','servico','globalIds',...present.map(([,header])=>header)].join(';')+'\n'+rows.map(r=>[r.id,r.name,r.start,r.finish,r.location,r.service,r.globalIds.join('|'),...present.map(([key])=>String(r[key]??''))].map(quote).join(';')).join('\n');
}
export function mapCsv(text:string,map:CsvMapping):ScheduleRow[]{
 const [headers,...data]=readCsvGrid(text);if(!headers)throw new Error('CSV vazio.');
 for(const k of ['id','name','start','finish'] as const)if(!Number.isInteger(map[k])||map[k]<0||map[k]>=headers.length)throw new Error(`Escolha a coluna ${fieldLabels[k]}.`);
 const used=Object.values(map).filter(i=>i>=0);if(new Set(used).size!==used.length)throw new Error('Uma coluna foi atribuída a dois campos.');
 const rows=data.map((v,n)=>{if(v.length!==headers.length)throw new Error(`Linha ${n+2}: quantidade de colunas divergente.`);const get=(k:CsvField)=>(v[map[k]??-1]??'').trim();const extra:Partial<ScheduleRow>={};for(const key of ['associationCode','modelScope','rowKind','parentId','hierarchy','predecessors'] as const)if((map[key]??-1)>=0)extra[key]=get(key);const line=headers.findIndex(h=>normalize(h)==='origem_linha');if(line>=0)extra.sourceRow=Number(v[line]);return {id:get('id'),name:get('name'),start:csvDate(get('start')),finish:csvDate(get('finish')),location:get('location'),service:get('service'),...extra,globalIds:get('globalIds').split('|').map(x=>x.trim()).filter(Boolean)};});
 return parseScheduleCsv(canonicalCsv(rows));
}
export function initialActivities(rows:ScheduleRow[],elements:ExtractedElement[]):PipelineActivity[]{
 return rows.map(row=>({row:structuredClone(row),links:(['resumo','summary'].includes(row.rowKind?.trim().toLowerCase()??'')?[]:row.globalIds).flatMap(g=>{const found=elements.filter(e=>e.globalId===g&&e.eligible!==false);return found.length===1?[{modelId:found[0].modelId,globalId:g}]:[];}),disposition:'link',reason:''}));
}
export function setCorrection(edits:Correction[],e:ExtractedElement,field:Correction['field'],value:string){
 if(value.length>500)throw new Error('Use até 500 caracteres.');const next=edits.filter(c=>elementKey(c)!==elementKey(e)||c.field!==field);
 const original=e[field]??'';if(value!==original)next.push({modelId:e.modelId,globalId:e.globalId,field,original,value});return next;
}
export function effectiveElement(e:ExtractedElement,edits:Correction[]):ExtractedElement{const copy={...e};for(const c of edits)if(elementKey(c)===elementKey(e))copy[c.field]=c.value;return copy;}
export function validatePlan(plan:PipelinePlan,elements?:ExtractedElement[]){
 if(!plan||!Array.isArray(plan.models)||!plan.models.length||plan.models.length>20||new Set(plan.models.map(m=>m.id)).size!==plan.models.length)throw new Error('Selecione de 1 a 20 modelos distintos.');
 if(plan.models.some(m=>!m.id||typeof m.name!=='string'||! /^[a-f0-9]{64}$/.test(m.hash)))throw new Error('Revisão dos modelos inválida.');
 if(elements&&elements.some(e=>!plan.models.some(m=>m.id===e.modelId&&m.hash===e.modelHash)))throw new Error('Inventário pertence a outra revisão. Reanalise os modelos.');
 if(!Array.isArray(plan.activities)||!plan.activities.length||plan.activities.length>MAX_SCHEDULE_ACTIVITIES)throw new Error('Use de 1 a 1.000 atividades por preparação.');
 if(plan.associationProfile){validateAssociationProfile(plan.associationProfile);if(plan.associationProfile.rules.some(r=>!plan.models.some(m=>m.id===r.modelId&&m.hash===r.modelHash)))throw Error('Perfil pertence a outra revisão do conjunto.');}if(plan.csvSourceHash!==undefined&&!/^[a-f0-9]{64}$/.test(plan.csvSourceHash))throw Error('Hash de origem inválido.');
 parseScheduleCsv(canonicalCsv(plan.activities.map(a=>a.row)));
 if(plan.clearScheduleModels&&(!Array.isArray(plan.clearScheduleModels)||new Set(plan.clearScheduleModels).size!==plan.clearScheduleModels.length||plan.clearScheduleModels.some(id=>!plan.models.some(m=>m.id===id)||rowsForModel(plan,id).length)))throw Error('Remoção de cronograma fora do escopo.');
 const models=new Set(plan.models.map(m=>m.id)),known=elements?new Map(elements.map(e=>[elementKey(e),e])):null,counts=new Map<string,number>();
 for(const a of plan.activities){
  if(a.pendingReview)throw Error(`Confira a mudança no CSV da atividade ${a.row.id}: ${a.pendingReview}`);
  if(['resumo','summary'].includes(a.row.rowKind?.trim().toLowerCase()??'')&&a.links.length)throw Error('Resumo não pode duplicar execução 3D.');
  if(a.association){const ev=a.association;if(typeof ev.code!=='string'||ev.code.length>500||! /^[a-f0-9]{64}$/.test(ev.sourceHash)||!Array.isArray(ev.links)||ev.links.length>50000||ev.links.some(l=>typeof l.modelId!=='string'||typeof l.globalId!=='string')||ev.sourceRow!==undefined&&(!Number.isInteger(ev.sourceRow)||ev.sourceRow<2))throw Error('Proveniência de associação inválida.');validateAssociationProfile({version:1,id:ev.profileId,revision:ev.profileRevision,csvColumn:'codigo_vinculo',rules:ev.rules});if(!a.manualDecision&&a.disposition==='link'&&plan.associationProfile&&(ev.profileId!==plan.associationProfile.id||ev.profileRevision!==plan.associationProfile.revision||ev.sourceHash!==plan.csvSourceHash||JSON.stringify(ev.rules)!==JSON.stringify(plan.associationProfile.rules)))throw Error('Vínculos de outra revisão do perfil. Recalcule e adote a nova prévia.');}

  if(!['link','no3d','excluded'].includes(a.disposition)||!Array.isArray(a.links)||a.links.length>50000||typeof a.reason!=='string'||a.reason.length>1000)throw new Error('Decisão de atividade inválida.');
  if(a.disposition==='link'&&!a.links.length)throw new Error(`Associe elementos à atividade ${a.row.id}.`);
  if(a.disposition!=='link'&&(!a.reason.trim()||a.links.length))throw new Error(`Justifique a atividade ${a.row.id} e remova seus vínculos.`);
  const seen=new Set<string>();for(const ref of a.links){const key=elementKey(ref);if(!models.has(ref.modelId)||typeof ref.globalId!=='string'||!ref.globalId||seen.has(key)||known&&(!known.has(key)||known.get(key)!.eligible===false))throw new Error(`Vínculo inválido ou duplicado na atividade ${a.row.id}.`);seen.add(key);counts.set(key,(counts.get(key)??0)+1);if(counts.get(key)!>50)throw new Error('Máximo de 50 atividades por elemento.');}
 }
 if(!counts.size)throw new Error('Nenhuma atividade vinculada a elementos.');
 if(!Array.isArray(plan.corrections)||plan.corrections.length>50000)throw new Error('Correções inválidas.');const corrected=new Set<string>();
 for(const c of plan.corrections){const key=elementKey(c),fieldKey=key+c.field;if(!models.has(c.modelId)||!['name','location','service'].includes(c.field)||typeof c.original!=='string'||typeof c.value!=='string'||c.value.length>500||corrected.has(fieldKey))throw new Error('Correção inválida ou repetida.');corrected.add(fieldKey);if(known&&(!known.has(key)||(known.get(key)![c.field]??'')!==c.original))throw new Error('A origem de uma correção mudou. Reanalise o modelo.');}
}
export function rowsForModel(plan:PipelinePlan,modelId:string):ScheduleRow[]{return plan.activities.filter(a=>a.disposition==='link').map(a=>({...a.row,globalIds:a.links.filter(e=>e.modelId===modelId).map(e=>e.globalId)})).filter(r=>r.globalIds.length);}
export function validateModelSlice(plan:PipelinePlan,modelId:string,hash:string,rows:ScheduleRow[],csv:string){
 validatePlan(plan);if(!plan.models.some(m=>m.id===modelId&&m.hash===hash))throw new Error('Modelo/revisão fora do conjunto aprovado.');
 const origin=parseScheduleCsv(csv);if(JSON.stringify(origin)!==JSON.stringify(plan.activities.map(a=>a.row)))throw new Error('Plano divergiu do CSV conferido.');
 if(JSON.stringify(rows)!==JSON.stringify(rowsForModel(plan,modelId)))throw new Error('Recorte por modelo divergiu do conjunto aprovado.');
}
export function correctionProposals(value:unknown,elements:ExtractedElement[]):Correction[]{
 const v=value as {corrections?:Correction[]};if(!v||Object.keys(v).join(',')!=='corrections'||!Array.isArray(v.corrections)||v.corrections.length>elements.length*3)throw new Error('Proposta de correções inválida.');
 const seen=new Set<string>();for(const c of v.corrections){if(!c||Object.keys(c).sort().join(',')!=='field,globalId,modelId,original,value'||!['name','location','service'].includes(c.field)||typeof c.value!=='string'||c.value.length>500||typeof c.original!=='string')throw new Error('Correção fora do escopo permitido.');const e=elements.find(e=>elementKey(e)===elementKey(c)),key=elementKey(c)+c.field;if(!e||(e[c.field]??'')!==c.original||seen.has(key))throw new Error('Correção com origem desconhecida ou repetida.');seen.add(key);}return structuredClone(v.corrections);
}
export const correctionSchema={type:'object',additionalProperties:false,required:['corrections'],properties:{corrections:{type:'array',items:{type:'object',additionalProperties:false,required:['modelId','globalId','field','original','value'],properties:{modelId:{type:'string'},globalId:{type:'string'},field:{type:'string',enum:['name','location','service']},original:{type:'string'},value:{type:'string'}}}}}};
