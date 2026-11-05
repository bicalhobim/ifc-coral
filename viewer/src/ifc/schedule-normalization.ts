import {csvDate,parseScheduleCsv,type ScheduleRow} from './schedule-import.ts';
import {readCsvGrid,canonicalCsv,normalize,fieldLabels,type CsvMapping} from './schedule-pipeline.ts';
import {MAX_SCHEDULE_ACTIVITIES} from './schedule-limits.ts';
import {csvCell} from '../ui/csv.ts';

export type IdAdjustment={record:number;original:string;id:string;reason:string};
export type NormalizedSchedule={rows:ScheduleRow[];headers:string[];originalRows:string[][];ids:IdAdjustment[]};
export function decodeScheduleCsv(bytes:Uint8Array):{text:string;encoding:'utf-8'|'windows-1252'}{
 try{return {text:new TextDecoder('utf-8',{fatal:true}).decode(bytes),encoding:'utf-8'};}
 catch{return {text:new TextDecoder('windows-1252',{fatal:true}).decode(bytes),encoding:'windows-1252'};}
}
export function normalizeScheduleCsv(text:string,map:CsvMapping):NormalizedSchedule{
 const [headers,...data]=readCsvGrid(text);if(!headers||!data.length)throw new Error('CSV vazio.');
 if(data.length>MAX_SCHEDULE_ACTIVITIES)throw new Error('Importe até 1.000 atividades.');
 for(const k of ['name','start','finish'] as const)if(!Number.isInteger(map[k])||map[k]<0||map[k]>=headers.length)throw new Error(`Escolha a coluna ${fieldLabels[k]}.`);
 for(const k of Object.keys(fieldLabels) as (keyof CsvMapping)[])if(map[k]!==undefined&&(!Number.isInteger(map[k])||map[k]!<-1||map[k]!>=headers.length))throw new Error(`Coluna inválida: ${fieldLabels[k]}.`);
 const used=Object.entries(map).filter(([k,i])=>i>=0&&!(k==='id'&&map.id===map.associationCode&&normalize(headers[map.id]??'')==='navisworks_user1')).map(([,i])=>i);if(new Set(used).size!==used.length)throw new Error('Uma coluna foi atribuída a dois campos.');
 const navIndex=headers.findIndex(h=>normalize(h)==='navisworks_user1'),sourceIdIndex=map.id>=0?map.id:navIndex;
 const sourceIds=data.map(v=>(v[sourceIdIndex]??'').trim()),frequencies=new Map<string,number>();
 for(const id of sourceIds)frequencies.set(id,(frequencies.get(id)??0)+1);
 const validId=(id:string)=>!!id&&id.length<=100&&!/[\x00-\x1f]/.test(id);
 const reserved=new Set(sourceIds.filter(validId)),ids:IdAdjustment[]=[],issues:string[]=[],rows:ScheduleRow[]=[];
 for(const [i,v]of data.entries()){
  if(v.length!==headers.length){issues.push(`Registro ${i+1}: ${v.length} colunas; esperado ${headers.length}.`);continue;}
  const get=(k:keyof CsvMapping)=>(v[map[k]??-1]??'').trim(),original=sourceIds[i];let id=original;
  const associationCode=map.id===navIndex&&navIndex>=0;
  if(map.id<0||associationCode||!validId(id)||frequencies.get(id)!>1){
   const base=`CSV-${String(i+1).padStart(6,'0')}`;id=base;let suffix=1;while(reserved.has(id))id=base+'-'+(++suffix);reserved.add(id);
   ids.push({record:i+1,original,id,reason:associationCode||map.id<0&&navIndex>=0?'Código de associação preservado':map.id<0?'ID não fornecido':!original?'ID vazio':!validId(original)?'ID inválido':'ID repetido'});
  }
  let start='',finish='';const name=get('name');
  if(!name||name.length>500)issues.push(`Registro ${i+1}: nome ausente ou acima de 500 caracteres.`);
  for(const field of ['start','finish'] as const)try{const date=csvDate(get(field));if(field==='start')start=date;else finish=date;}catch(e){issues.push(`Registro ${i+1}, ${fieldLabels[field]}: ${e instanceof Error?e.message:String(e)}`);}
  if(start&&finish&&finish<start)issues.push(`Registro ${i+1}: término anterior ao início.`);
  if(get('location').length>500||get('service').length>500)issues.push(`Registro ${i+1}: local ou serviço acima de 500 caracteres.`);
  const extra:Partial<ScheduleRow>={};for(const key of ['associationCode','modelScope','rowKind','parentId','hierarchy','predecessors'] as const)if((map[key]??-1)>=0)extra[key]=get(key);const sourceLine=headers.findIndex(h=>normalize(h)==='origem_linha');extra.sourceRow=sourceLine>=0?Number(v[sourceLine]):i+2;
  rows.push({id,name,start,finish,...extra,location:get('location'),service:get('service'),globalIds:get('globalIds').split('|').map(x=>x.trim()).filter(Boolean)});
 }
 if(issues.length)throw new Error(`${issues.length} pendência(s) encontrada(s). Nenhuma linha foi descartada.\n`+issues.slice(0,30).join('\n')+(issues.length>30?'\nConfira também os demais registros.':''));
 return {rows:parseScheduleCsv(canonicalCsv(rows)),headers,originalRows:data,ids};
}
export function normalizedScheduleCsv(result:NormalizedSchedule):string{
 const canonical=readCsvGrid(canonicalCsv(result.rows));
 const headers=[...canonical[0],'origem_registro',...result.headers.map(h=>'origem_'+h)];
 return '\uFEFF'+[headers,...canonical.slice(1).map((r,i)=>[...r,String(i+1),...result.originalRows[i]])].map(row=>row.map(csvCell).join(';')).join('\r\n');
}
