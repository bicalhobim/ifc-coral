import type {Project,ElementRef,WorkPackage} from './types.ts';
import type {ElementMetadata} from '../quantification/types.ts';
import {macroPlan,planningDemands,seedPlanning,suggestedQuantity,consolidateDemands,packageStage,refKey} from './integrated.ts';
import {quantificationNeedsReview,resourceCoverage,resourceWindowCurrent} from './resources.ts';
import {isReviewCurrent} from '../quantification/review.ts';

export type ProcurementFilters={query:string;kind:'all'|'package'|'macro';status:'all'|'pending'|'reviewed';package_id:string|null};
export type ProcurementOptions={filters:ProcurementFilters;demandIds:string[];application:{version:string;commit:string|null;working_tree_dirty:boolean|null};id?:string;createdAt?:string;metadata?:(refs:ElementRef[])=>ElementMetadata[]};
/** coral-c14n-1: typed tree, lexical UTF-16 object keys, ASCII JSON, IEEE-754 hex numbers. */
export function canonicalJSON(value:unknown):string{
 const tree=(v:unknown):unknown=>{
  if(v===null)return ['null'];if(typeof v==='string')return ['string',v];if(typeof v==='boolean')return ['boolean',v];
  if(typeof v==='number'){if(!Number.isFinite(v))throw new Error('Número não finito na origem da exportação.');const data=new DataView(new ArrayBuffer(8));data.setFloat64(0,v===0?0:v,false);return ['number',Array.from({length:8},(_,i)=>data.getUint8(i).toString(16).padStart(2,'0')).join('')];}
  if(Array.isArray(v))return ['array',v.map(tree)];if(typeof v==='object')return ['object',Object.entries(v).filter(([,x])=>x!==undefined).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,x])=>[k,tree(x)])];
  throw new Error('Valor não JSON na origem da exportação.');
 };
 return JSON.stringify(tree(value)).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
}
export async function procurementFingerprint(value:unknown,basis:string){const bytes=new TextEncoder().encode(canonicalJSON(value)),digest=await crypto.subtle.digest('SHA-256',bytes);return {algorithm:'SHA-256' as const,value:[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join(''),basis};}
const text=(value:string|undefined)=>value?.trim()||null;
const unique=<T>(values:T[])=>[...new Set(values)];
export const procurementSemantics={quantities:'base_quantity is service quantity; derived_preview.quantity already includes factor and loss once',dates:'derived_preview dates already include lead times once; preserve original task dates',revision:'changed source fingerprint or model hash requires human review; never carry approval forward',scope:'only exported demands; no project-wide coverage inference from filtered totals',purchase_authorized:false as const};
export function filterProcurementDemands(p:Project,filters:ProcurementFilters){return planningDemands(p).filter(r=>(!filters.package_id||r.packageId===filters.package_id)&&(filters.kind==='all'||(filters.kind==='package'?!!r.packageId:!r.packageId))&&(filters.status==='all'||(filters.status==='pending'?r.pending.length>0:r.pending.length===0))&&[r.location,r.name,p.packages.find(q=>q.id===r.packageId)?.name??''].join(' ').toLocaleLowerCase().includes(filters.query.trim().toLocaleLowerCase()));}

/** Read-only export. No adoption, confirmation, reservation, log or project mutation. */
export async function exportProcurement(project:Project,options:ProcurementOptions){
 options={...options,filters:structuredClone(options.filters),demandIds:[...options.demandIds],application:structuredClone(options.application)};
 const p=structuredClone(project),d=p.planning??seedPlanning(),all=planningDemands(p),macros=macroPlan(p);
 const filtered=filterProcurementDemands(p,options.filters),ids=new Set(options.demandIds);
 if(ids.size!==options.demandIds.length||filtered.length!==ids.size||filtered.some(r=>!ids.has(r.id)))throw new Error('O recorte de suprimentos mudou. Atualize o mapa antes de exportar.');
 const rows=all.filter(r=>ids.has(r.id));if(!rows.length)throw new Error('Nenhuma demanda neste recorte. Ajuste os filtros antes de exportar.');
 const origins=rows.map(r=>r.packageId?p.packages.find(q=>q.id===r.packageId):macros.find(m=>m.id===r.macroId));
 const refs=[...new Map(origins.flatMap(o=>o?.elements??[]).map(e=>[refKey(e),{modelId:e.modelId,globalId:e.globalId}])).values()];
 const metadata=new Map((options.metadata?.(refs)??[]).map(m=>[refKey(m),m]));
 for(const s of p.measures)if(!metadata.has(refKey(s.measure.elementRef)))metadata.set(refKey(s.measure.elementRef),s.measure.elementRef);
 const packageIds=new Set(rows.flatMap(r=>r.packageId?[r.packageId]:[]));
 const taskIds=new Set(origins.flatMap(o=>o?.taskIds??[]));
 const tasks=p.tasks.filter(t=>taskIds.has(t.id));
 const resources=p.resources.filter(r=>rows.some(row=>row.packageId===r.packageId&&row.id===JSON.stringify([r.packageId,r.compositionId])));
 const resourceIds=new Set(resources.map(r=>r.id)),reservations=p.resourceAllocations.filter(a=>resourceIds.has(a.requirementId)),legacy=p.allocations.filter(a=>packageIds.has(a.packageId));
 const allocationIds=new Set([...reservations,...legacy].map(a=>a.id)),supplyIds=new Set([...reservations,...legacy].map(a=>a.supplyId));
 const mapped=rows.map(r=>{
  const pkg=p.packages.find(q=>q.id===r.packageId),macro=macros.find(m=>m.id===r.macroId),origin=pkg??macro;
  const meta=pkg?d.packages[pkg.id]:undefined,service=meta?.serviceSnapshot??d.services.find(s=>s.id===r.serviceId);
  const composition=service?.composition.find(c=>r.id===JSON.stringify([origin?.id,c.id]));
  const base=pkg?.quantity??(macro&&service?suggestedQuantity(p,macro.elements,service):null);
  // Ambiguous repeated 4D contexts already yield unknown in planningDemands.
  const baseQuantity=r.quantity===null?null:base;
  const stale=!!pkg&&(pkg.reviewRequired||quantificationNeedsReview(p,pkg));
  const measures=pkg?(pkg.measureLinks??[]).flatMap(l=>{const s=[...p.measures,...p.measureHistory??[]].find(s=>s.measure.id===l.id&&s.fingerprint===l.fingerprint);return s?[s]:[];}):p.measures.filter(s=>s.measure.serviceCode===service?.method&&origin?.elements.some(e=>refKey(e)===refKey(s.measure.elementRef)));
  const reviews=measures.map(s=>({measure_id:s.measure.id,model_hash:text(s.measure.elementRef.modelHash),amount:s.amount,unit:s.measure.unit,source:s.measure.origin,method:text(s.method),reviewer:text(s.reviewer),at:text(s.at),evidence:text(s.evidence),origin:s.reviewOrigin,measurement:structuredClone(s.measure),current:!stale&&isReviewCurrent(s,s.measure)&&p.models.some(m=>m.id===s.measure.elementRef.modelId&&m.hash===s.measure.elementRef.modelHash)&&(!p.quantificationCatalog||JSON.stringify(p.quantificationCatalog.find(r=>r.id===s.measure.ruleId))===JSON.stringify(s.measure.ruleSnapshot))&&s.measure.unit===service?.unit&&s.measure.serviceCode===service?.method}));
  const coveredReviews=(origin?.elements??[]).map(e=>reviews.find(r=>r.current&&refKey(r.measurement.elementRef)===refKey(e)));
  const reviewCoversBase=baseQuantity!==null&&coveredReviews.length>0&&coveredReviews.every(r=>!!r)&&new Set(coveredReviews.map(r=>r!.measure_id)).size===coveredReviews.length&&Math.abs(coveredReviews.reduce((sum,r)=>sum+(r?.amount??0),0)-baseQuantity)<=1e-8;
  if(!reviewCoversBase)for(const review of reviews)review.current=false;
  const resource=resources.find(x=>x.packageId===pkg?.id&&x.compositionId===composition?.id);
  const sameResource=!!resource&&!!composition&&resource.quantity===r.quantity&&resource.factor===composition.factor&&resource.lossPercent===composition.loss&&resource.preparationDays===composition.preparation&&resource.leadDays===composition.manufacturing+composition.transport&&resourceWindowCurrent(p,resource);
  const compositionStatus=!composition?'unavailable':stale||resource&&!sameResource?'needs_review':sameResource?'recorded':'unreviewed';
  const ownLegacy=legacy.filter(a=>a.packageId===pkg?.id),ownReservations=reservations.filter(a=>a.requirementId===resource?.id);
  const coverageKnown=!!pkg?.coverageKnown&&sameResource&&!stale&&!ownLegacy.length;
  const coverage=coverageKnown?resourceCoverage(p,resource!):null;
  const pending=unique([...r.pending,...(stale?['Revalidar quantificação e vínculos IFC.']:[]),...(compositionStatus==='needs_review'?['Revalidar composição após alteração da origem.']:[]),...(!coverageKnown?['Cobertura e saldo de compra ainda não determinados.']:[]),...(ownLegacy.length?['Reservas legadas de pacote: conferir vínculo com cada insumo.']:[]),...(!origin?.elements.length?['Sem elementos IFC vinculados neste recorte.']:[]),...(pkg?.elements.some(e=>!p.models.some(m=>m.id===e.modelId))?['Modelo de origem não encontrado.']:[]),...(resource?.procurementBlockers??[])]);
  return {
   id:r.id,origin:{kind:pkg?'package' as const:'macro_4d' as const,id:origin?.id??r.macroId??r.id,package_id:r.packageId??null,macro_id:r.macroId??null,location:r.location,elements:(origin?.elements??[]).map(e=>({modelId:e.modelId,globalId:e.globalId})),task_ids:origin?.taskIds??[]},
   service:{id:r.serviceId,name:service?.name??'Serviço a classificar',unit:service?.unit??null,method:service?.method??null,criterion:text(service?.criterion)},
   base_quantity:{value:baseQuantity,unit:service?.unit??pkg?.unit??null,source:text(pkg?.quantitySource??(macro?'Quantificação disponível para o recorte IFC 4D':undefined)),method:service?.method??null,calculation_status:baseQuantity===null?'unknown' as const:'available' as const,review_status:stale?'needs_review' as const:reviews.length>0&&reviews.every(s=>s.current)&&baseQuantity!==null?'reviewed' as const:'unreviewed' as const,reviews},
   input:{id:r.inputId,specification:r.name,unit:r.unit,reusable:r.reusable,fresh_concrete:r.inputId==='concrete'},
   composition:{line_id:composition?.id??null,service_version:service?.version??null,factor:composition?.factor??null,loss_percent:composition?.loss??null,preparation_days:composition?.preparation??null,manufacturing_days:composition?.manufacturing??null,transport_days:composition?.transport??null,inspection_days:composition?.inspection??null,buffer_days:composition?.buffer??null,return_days:composition?.returnDays??null,source:text(composition?.source),status:compositionStatus},
   derived_preview:{quantity:r.quantity,unit:r.unit,formula:composition?'base_quantity.value * composition.factor * (1 + composition.loss_percent / 100)':null,losses_applied:!!composition,lead_times_applied:!!composition,dates:{need_on_site:text(r.need),receive_on_site:composition?text(r.receive):null,order_by:composition?text(r.order):null,start_procurement_by:composition?text(r.start):null,occupied_until:r.reusable?text(r.until):text(r.need)},status:'preview' as const},
   coverage:{status:coverageKnown?'known' as const:'unknown' as const,covered:coverage?.covered??null,balance:coverage?.balance??null,excess:coverage?.excess??null,resource_ids:resource?[resource.id]:[],reservation_ids:ownReservations.map(a=>a.id),legacy_reservation_ids:ownLegacy.map(a=>a.id)},
   human_review:{composition_evidence:text(resource?.evidence??meta?.origins.composition?.source),requires_review_for_changed_source:true as const,release_purchase:false as const},pending
  };
 });
 const demands=await Promise.all(mapped.map(async r=>({...r,fingerprint:await procurementFingerprint(r,'demand excluding fingerprint; coral-c14n-1')})));
 const usedMethods=new Set(rows.map(r=>{const pkg=p.packages.find(q=>q.id===r.packageId);return (pkg?d.packages[pkg.id]?.serviceSnapshot:undefined)?.method??d.services.find(s=>s.id===r.serviceId)?.method;}));
 const refIds=new Set(refs.map(refKey));
 const context={
  estimates:(p.planning?.estimates??[]).filter(e=>refIds.has(refKey(e))&&usedMethods.has(e.serviceCode)).map(e=>({...e,model_revision_matches:p.models.some(m=>m.id===e.modelId&&m.hash===e.modelHash)})),
  tasks:tasks.map(t=>({id:t.id,modelId:t.modelId,globalId:t.globalId,slot:t.slot,name:t.name,location:t.location,service:t.service,start:text(t.start),finish:text(t.finish)})),
  elements:refs.map(ref=>{const model=p.models.find(m=>m.id===ref.modelId),data=metadata.get(refKey(ref)),valid=!!data&&!!model&&data.modelHash===model.hash;return {...ref,model_hash:text(model?.hash),ifc_class:valid?text(data?.ifcClass):null,predefined_type:valid?text(data?.predefinedType):null,type_name:valid?text(data?.typeName):null,properties:valid?data?.properties??null:null,metadata_status:valid?'available' as const:'unavailable' as const};}),
  packages:p.packages.filter(q=>packageIds.has(q.id)).map(q=>packageContext(p,q)),
  resources:resources.map(r=>({id:r.id,packageId:r.packageId,compositionId:r.compositionId??null,resourceCode:r.resourceCode,specification:r.specification,specificationConfirmed:r.specificationConfirmed,quantity:r.quantity,unit:r.unit,needDate:text(r.needDate),from:text(r.from),to:text(r.to),factor:r.factor,lossPercent:r.lossPercent,leadDays:r.leadDays,preparationDays:r.preparationDays,reusable:r.reusable,cycleDays:r.cycleDays,evidence:text(r.evidence),procurementBlockers:r.procurementBlockers})),
  supplies:p.supplies.filter(s=>supplyIds.has(s.id)).map(s=>({id:s.id,name:s.name,resourceCode:text(s.resourceCode),specification:text(s.specification),quantity:s.quantity,unit:s.unit,confirmed:s.confirmed,technical:s.technical,delivery:text(s.delivery),availableUntil:text(s.availableUntil),kind:s.kind,synthetic:s.synthetic,reusable:s.reusable??false,evidence:text(s.evidence)})),
  reservations:structuredClone(reservations),legacy_reservations:structuredClone(legacy),deliveries:p.deliveries.filter(x=>allocationIds.has(x.allocationId)).map(x=>({...x,date:text(x.date),evidence:text(x.evidence),reviewer:text(x.reviewer)}))
 };
 const modelIds=new Set(refs.map(e=>e.modelId));
 const content={format:'ifc-coral-procurement' as const,schema_version:1 as const,
  scope:{kind:'filtered_supply_map' as const,filters:structuredClone(options.filters),demand_ids:rows.map(r=>r.id),total_available:all.length,exported_count:rows.length},
  project:{id:p.id,name:p.name,schema_version:p.schema,planning_version:p.planning?.version??null,models:p.models.filter(m=>modelIds.has(m.id)).map(m=>({id:m.id,name:m.name,projectGlobalId:text(m.projectGlobalId),hash:text(m.hash)}))},
  calendar:{unit:'calendar_days' as const,timezone:'date_only' as const,dates_are_execution_evidence:false as const},semantics:procurementSemantics,demands,
  totals:consolidateDemands(rows).map(r=>({input_id:r.inputId,specification:r.name,unit:r.unit,reusable:r.reusable,quantity:r.quantity,known_quantity:r.knownQuantity,unknown_origins:r.unknown,origins:r.origins,aggregation:r.reusable?'concurrent_peak' as const:'sum' as const})),context,
  pending:unique([...demands.flatMap(r=>r.pending),...(context.elements.some(e=>e.metadata_status==='unavailable')?['Metadados não disponíveis para todos os elementos; conferir fonte IFC.']:[]),'Intercâmbio de prévias; revisão humana e autorização de compra no processo de destino.'])
 };
 const exportInfo={id:options.id??crypto.randomUUID(),created_at:options.createdAt??new Date().toISOString(),application:{name:'IFC Coral' as const,...options.application},source_fingerprint:await procurementFingerprint(p,'full Project snapshot; coral-c14n-1')};
 const payload={...content,export:exportInfo};
 return {...payload,export:{...exportInfo,payload_fingerprint:await procurementFingerprint(payload,'entire export excluding export.payload_fingerprint; coral-c14n-1')}};
}
function packageContext(p:Project,q:WorkPackage){const meta=p.planning?.packages[q.id];return {id:q.id,name:q.name,location:q.location,service:q.service,elements:q.elements.map(e=>({modelId:e.modelId,globalId:e.globalId})),task_ids:q.taskIds,quantity:q.quantity,unit:q.unit,quantity_source:text(q.quantitySource),need_date:text(q.needDate),finish_date:text(q.finishDate),responsible:text(q.responsible),criterion:text(q.criterion),review_required:q.reviewRequired||quantificationNeedsReview(p,q),capacity_confirmed:q.capacityConfirmed,coverage_known:q.coverageKnown,revision_of:meta?.revisionOf??null,stage:packageStage(p,q),field_origins:meta?.origins??{},constraints:q.constraints.map(c=>({id:c.id,category:c.category,description:text(c.description),resolved:c.resolved,evidence:text(c.evidence),reviewer:text(c.reviewer),owner:text(c.owner),due_date:text(c.dueDate),action:text(c.action),scope:c.scope??'package',elements:c.elements?.map(e=>({modelId:e.modelId,globalId:e.globalId}))??[],attachments:c.attachments?.map(a=>({id:a.id,name:a.name,mime:a.mime}))??[]}))};}
export type ProcurementBundle=Awaited<ReturnType<typeof exportProcurement>>;
