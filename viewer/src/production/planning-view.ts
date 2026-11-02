import type {Project,WorkPackage,ElementRef} from './types.ts';
import type {ElementTask} from '../ifc/schedule.ts';
import {groupTasks,taskIdentity} from '../ifc/identity.ts';
import {activePackages,packageStage,stageLabels,taskService,refKey} from './integrated.ts';
import {isEmptyConstraint,constraintElements} from './constraints.ts';
export type ActivityRow={id:string;name:string;modelId:string;model:string;location:string;service:string;start:number;finish:number;tasks:ElementTask[];elements:ElementRef[];packages:WorkPackage[];owners:string[];resources:string[];states:string[];pending:number;unanalysed:number};
export type PlanningFilter={search:string;model:string;location:string;service:string;owner:string;resource:string;state:string;from:string;to:string;pending:boolean};
export const emptyPlanningFilter=():PlanningFilter=>({search:'',model:'',location:'',service:'',owner:'',resource:'',state:'',from:'',to:'',pending:false});
export const natural=(a:string,b:string)=>a.localeCompare(b,'pt-BR',{numeric:true,sensitivity:'base'});
export function activityRows(p:Project,tasks:ElementTask[]):ActivityRow[]{
 const records=new Map(p.tasks.map(t=>[t.id,t])),packages=activePackages(p),models=new Map(p.models.map(m=>[m.id,m.name]));
 return [...groupTasks(tasks)].map(([id,group])=>{
  const first=group[0],elements=[...new Map(group.filter(t=>t.modelKey&&t.globalId).map(t=>{const e={modelId:t.modelKey!,globalId:t.globalId!};return [refKey(e),e] as const;})).values()],refs=new Set(elements.map(refKey));
  const ids=new Set(group.filter(t=>t.modelKey&&t.globalId&&t.sourceTaskKey).map(taskIdentity)),record=[...ids].map(id=>records.get(id)).find(Boolean),code=taskService((record?.service??'')+' '+first.name);
  // An element can carry several services: spatial overlap alone is not a task link.
  const linked=packages.filter(q=>q.elements.some(e=>refs.has(refKey(e)))&&(q.taskIds.some(id=>ids.has(id))||!q.taskIds.length&&code&&(p.planning?.packages[q.id]?.serviceSnapshot.method??q.serviceCode??taskService(q.service))===code));
  const conditions=linked.flatMap(q=>q.constraints.filter(c=>constraintElements(q,c).some(e=>refs.has(refKey(e)))));
  const resources=[...new Set(linked.flatMap(q=>{const meta=p.planning?.packages[q.id];return [...p.resources.filter(r=>r.packageId===q.id).map(r=>r.specification||r.resourceCode),...(meta?.serviceSnapshot.composition??[]).map(c=>(meta?.inputSnapshot??p.planning?.inputs)?.find(i=>i.id===c.inputId)?.name??c.inputId)];}))];
  return {id,name:first.name,modelId:first.modelKey??'',model:models.get(first.modelKey??'')??'Modelo não identificado',location:record?.location||first.storey||'Local não identificado',service:p.planning?.services.find(s=>s.method===code)?.name||record?.service||'Serviço não classificado',start:Math.min(...group.map(t=>+t.start)),finish:Math.max(...group.map(t=>+t.finish)),tasks:group,elements,packages:linked,owners:[...new Set(linked.map(q=>q.responsible).filter(Boolean))],resources,states:linked.length?[...new Set(linked.map(q=>stageLabels[packageStage(p,q)]))]:['Sem pacote'],pending:conditions.filter(c=>!isEmptyConstraint(c)&&!c.resolved).length,unanalysed:conditions.filter(isEmptyConstraint).length};
 }).sort((a,b)=>a.start-b.start||natural(a.name,b.name));
}
export function filterActivities(rows:ActivityRow[],f:PlanningFilter){const query=f.search.trim().toLocaleLowerCase('pt-BR'),from=f.from?+new Date(f.from+'T00:00:00'):-Infinity,to=f.to?+new Date(f.to+'T23:59:59'):Infinity;return rows.filter(r=>(!query||[r.name,r.location,r.service,r.model,...r.owners,...r.resources].join(' ').toLocaleLowerCase('pt-BR').includes(query))&&(!f.model||r.modelId===f.model)&&(!f.location||r.location===f.location)&&(!f.service||r.service===f.service)&&(!f.owner||r.owners.includes(f.owner))&&(!f.resource||r.resources.includes(f.resource))&&(!f.state||r.states.includes(f.state))&&(!f.pending||r.pending>0||r.unanalysed>0)&&r.finish>=from&&r.start<=to);}
/** Semantic floor rank; IFC/WBS prefixes are not physical elevations. Unknown labels retain natural order. */
export function locationRank(label:string):number|null {
 const t=label.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/funda|estaca/.test(t))return -10000;
 const basement=t.match(/(?:subsolo|sub\s*[-.]?|ss)\s*0*(\d+)/);if(basement)return -Number(basement[1]);
 if(/terreo|ground/.test(t))return 0;
 const floor=t.match(/(?:pavimento|pav\.?|andar|floor)\s*0*(\d+)/)||t.match(/(\d+)\s*(?:[º°o]\s*)?(?:andar|pavimento|floor)/);if(floor)return Number(floor[1]);
 if(/cobertura|roof/.test(t))return 10000;
 return null;
}
export function locationOrder(rows:ActivityRow[],preferred:string[]=[]){const present=[...new Set(rows.map(r=>r.location))].sort((a,b)=>{const ar=locationRank(a),br=locationRank(b);return ar!==null&&br!==null?ar-br||natural(a,b):ar!==null?-1:br!==null?1:natural(a,b);});return [...preferred.filter(x=>present.includes(x)),...present.filter(x=>!preferred.includes(x))];}
export function balanceRows(rows:ActivityRow[]):ActivityRow[]{
 const groups=new Map<string,ActivityRow[]>();for(const r of rows){const key=JSON.stringify([r.modelId,r.location,r.service]);const list=groups.get(key)??[];list.push(r);groups.set(key,list);}
 return [...groups].map(([id,list])=>{
  const elements=[...new Map(list.flatMap(r=>r.elements).map(e=>[refKey(e),e])).values()],refs=new Set(elements.map(refKey));
  const packages=[...new Map(list.flatMap(r=>r.packages).map(q=>[q.id,q])).values()];
  const conditions=packages.flatMap(q=>q.constraints.filter(c=>constraintElements(q,c).some(e=>refs.has(refKey(e)))));
  return {...list[0],id:'balance:'+id,name:`${list[0].service} · ${list[0].location} (${list.length} ${list.length===1?'atividade':'atividades'})`,start:Math.min(...list.map(r=>r.start)),finish:Math.max(...list.map(r=>r.finish)),tasks:list.flatMap(r=>r.tasks),elements,packages,owners:[...new Set(list.flatMap(r=>r.owners))],resources:[...new Set(list.flatMap(r=>r.resources))],states:[...new Set(list.flatMap(r=>r.states))],pending:conditions.filter(c=>!isEmptyConstraint(c)&&!c.resolved).length,unanalysed:conditions.filter(isEmptyConstraint).length};
 });
}
/** Lines join consecutive, explicitly ordered locations only when each has one service activity.
 * They are visual flow guides, never dependencies, productivity or critical path. */
export function balanceLinks(rows:ActivityRow[],order:string[]){const links:{from:ActivityRow;to:ActivityRow}[]=[];for(const service of new Set(rows.map(r=>r.service)))for(const modelId of new Set(rows.map(r=>r.modelId)))for(let i=1;i<order.length;i++){const a=rows.filter(r=>r.modelId===modelId&&r.service===service&&r.location===order[i-1]),b=rows.filter(r=>r.modelId===modelId&&r.service===service&&r.location===order[i]);if(a.length===1&&b.length===1)links.push({from:a[0],to:b[0]});}return links;}
