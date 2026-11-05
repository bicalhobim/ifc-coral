import type {Project,Constraint,WorkPackage} from './types.ts';
import {activePackages} from './integrated.ts';
import {isEmptyConstraint} from './constraints.ts';
import {csvCell} from '../ui/csv.ts';

export type RestrictionStatus='pending'|'overdue'|'released'|'unanalyzed';
export const restrictionStatusLabels:Record<RestrictionStatus,string>={pending:'Pendente',overdue:'Atrasada',released:'Liberada',unanalyzed:'A analisar'};
export type RestrictionRow={pkg:WorkPackage;constraint:Constraint;area:string;owner:string;status:RestrictionStatus};
export type RestrictionFilters={query:string;area:string;owner:string;category:string;status:string;packageId:string};
export const emptyRestrictionFilters=():RestrictionFilters=>({query:'',area:'',owner:'',category:'',status:'',packageId:''});
export function localToday(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function restrictionRows(p:Project,today=localToday()):RestrictionRow[]{
 return activePackages(p).flatMap(pkg=>pkg.constraints.filter(c=>!(isEmptyConstraint(c)&&p.planning?.packages[pkg.id]?.notApplicable?.[c.category])).map(constraint=>({pkg,constraint,area:pkg.location.trim()||'Área não definida',owner:constraint.owner?.trim()||'Sem responsável',status:constraint.resolved?'released':isEmptyConstraint(constraint)?'unanalyzed':constraint.dueDate&&constraint.dueDate<today?'overdue':'pending'})));
}
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
export function filterRestrictions(rows:RestrictionRow[],f:RestrictionFilters){return rows.filter(r=>(!f.area||r.area===f.area)&&(!f.owner||r.owner===f.owner)&&(!f.category||r.constraint.category===f.category)&&(!f.packageId||r.pkg.id===f.packageId)&&(!f.status||(f.status==='identified'?r.status!=='unanalyzed':f.status==='open'?['pending','overdue'].includes(r.status):r.status===f.status))&&(!f.query||normal([r.constraint.description,r.constraint.action,r.pkg.name,r.pkg.service,r.area,r.owner].join(' ')).includes(normal(f.query)))).sort((a,b)=>{
 const rank={overdue:0,pending:1,unanalyzed:2,released:3};return rank[a.status]-rank[b.status]||(a.constraint.dueDate||'9999').localeCompare(b.constraint.dueDate||'9999')||a.area.localeCompare(b.area);
});}
export function restrictionStats(rows:RestrictionRow[]){return {identified:rows.filter(r=>r.status!=='unanalyzed').length,open:rows.filter(r=>r.status==='pending'||r.status==='overdue').length,overdue:rows.filter(r=>r.status==='overdue').length,released:rows.filter(r=>r.status==='released').length,unanalyzed:rows.filter(r=>r.status==='unanalyzed').length};}
export function restrictionGroups(rows:RestrictionRow[],dimension:'area'|'owner'){
 const values=new Map<string,{name:string;open:number;overdue:number}>();for(const r of rows){if(r.status!=='pending'&&r.status!=='overdue')continue;const name=r[dimension],item=values.get(name)??{name,open:0,overdue:0};item.open++;if(r.status==='overdue')item.overdue++;values.set(name,item);}return [...values.values()].sort((a,b)=>b.open-a.open||a.name.localeCompare(b.name));
}
export function restrictionsCsv(rows:RestrictionRow[]){return [['pacote_id','restricao_id','area_frente','pacote','servico','categoria','condicao','situacao','responsavel_remocao','prazo_remocao','acao','alcance','elementos','evidencia','conferente','prints'],...rows.map(r=>[r.pkg.id,r.constraint.id,r.area,r.pkg.name,r.pkg.service,r.constraint.category,r.constraint.description,restrictionStatusLabels[r.status],r.owner,r.constraint.dueDate??'',r.constraint.action??'',r.constraint.scope==='elements'?'Elementos específicos':'Pacote inteiro',JSON.stringify(r.constraint.scope==='elements'?r.constraint.elements:r.pkg.elements),r.constraint.evidence,r.constraint.reviewer,String(r.constraint.attachments?.length??0)])].map(row=>row.map(csvCell).join(';')).join('\r\n');}
