import {MAX_SCHEDULE_ACTIVITIES,MAX_SCHEDULE_CSV_SIZE} from './schedule-limits.ts';
/** CSV is input data, never code. Dates and IDs remain authoritative, even when AI proposes links. */
export type ScheduleRow={id:string;name:string;start:string;finish:string;location:string;service:string;globalIds:string[];associationCode?:string;sourceRow?:number;modelScope?:string;rowKind?:string;parentId?:string;hierarchy?:string;predecessors?:string};
export type InventoryItem={globalId:string;name:string;ifcClass:string;location:string;service?:string;eligible?:boolean;properties?:{path:string;value:string;pset?:string;property?:string;source?:'occurrence'|'type'}[]};
export const scheduleCsvTemplate='id_atividade;atividade;inicio;fim;codigo_vinculo;servico;modelo;tipo_linha;id_pai\nA01;Concretagem;2026-11-06;2026-11-07;001.4.1;Concretagem;;atividade;\n';
export function csvDate(raw:string):string{
 // Project/Navisworks exports may include a localized weekday and a short year.
 // The numeric date is authoritative; short years always mean 2000–2099.
 const s=raw.trim().replace(/^(?:seg|ter|qua|qui|sex|s[áa]b|dom)\.?\s+/iu,''),br=/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})$/.exec(s);
 const iso=br?`${br[3].length===2?'20'+br[3]:br[3]}-${br[2].padStart(2,'0')}-${br[1].padStart(2,'0')}`:s;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(Date.parse(iso+'T12:00:00Z'))||new Date(iso+'T12:00:00Z').toISOString().slice(0,10)!==iso)throw new Error(`Data inválida: ${raw}. Use AAAA-MM-DD, DD/MM/AAAA ou Ter 01/10/24 (ano curto = 2000–2099); números seriais do Excel não são aceitos.`);
 return iso;
}
export function cells(text:string):string[][]{
 const first=text.split(/\r?\n/,1)[0],sep=first.includes(';')?';':',',rows:string[][]=[];let row:string[]=[],cell='',quoted=false,ended=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;ended=true;}}else cell+=c;continue;}
  if(c==='"'){if(cell||ended)throw new Error('Aspas inválidas no CSV.');quoted=true;continue;}
  if(c===sep){row.push(cell);cell='';ended=false;}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';ended=false;}else{if(ended&&!/\s/.test(c))throw new Error('Texto após aspas no CSV.');cell+=c;}
 }
 if(quoted)throw new Error('Aspas não fechadas no CSV.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
const normal=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[ _-]/g,'');
export function parseScheduleCsv(text:string):ScheduleRow[]{
 if(text.length>MAX_SCHEDULE_CSV_SIZE)throw new Error('CSV excede 10 milhões de caracteres. Recorte o cronograma.');
 const rows=cells(text.replace(/^\uFEFF/,'')),headers=rows.shift()?.map(normal)??[];
 const aliases:Record<string,string[]>={id:['id','codigo','idatividade'],name:['atividade','nome','name','task'],start:['inicio','start'],finish:['fim','termino','finish'],location:['local','pavimento','location'],service:['servico','service'],globalIds:['globalids','globalid'],associationCode:['codigovinculo','navisworksuser1','origemnavisworksuser1'],modelScope:['modelo'],rowKind:['tipolinha'],parentId:['idpai'],hierarchy:['eap'],predecessors:['predecessoras'],sourceRow:['origemlinha']};
 const indexes=Object.fromEntries(Object.entries(aliases).map(([key,names])=>{const found=headers.map((h,i)=>names.includes(h)?i:-1).filter(i=>i>=0);if(found.length>1)throw new Error(`Coluna duplicada: ${key}.`);return [key,found[0]??-1];}));
 for(const key of ['id','name','start','finish'])if(indexes[key]<0)throw new Error(`Coluna obrigatória ausente: ${key}. Baixe o modelo CSV.`);
 if(!rows.length||rows.length>MAX_SCHEDULE_ACTIVITIES)throw new Error('Importe entre 1 e 1.000 atividades por preparação.');
 const seen=new Set<string>();return rows.map((row,n)=>{if(row.length!==headers.length)throw new Error(`Linha ${n+2}: número de colunas divergente.`);const get=(key:string)=>(row[indexes[key]]??'').trim();const id=get('id'),name=get('name');
  if(!id||id.length>100||/[\x00-\x1f]/.test(id)||seen.has(id)||!name||name.length>500)throw new Error(`Linha ${n+2}: ID repetido/inválido ou nome ausente.`);seen.add(id);
  const start=csvDate(get('start')),finish=csvDate(get('finish'));if(finish<start)throw new Error(`Linha ${n+2}: término anterior ao início.`);
  const location=get('location'),service=get('service');if(location.length>500||service.length>500)throw new Error('Local/serviço excede o limite.');
  const extra:Partial<ScheduleRow>={};for(const key of ['associationCode','modelScope','rowKind','parentId','hierarchy','predecessors'] as const)if(indexes[key]>=0)extra[key]=get(key);if(indexes.sourceRow>=0)extra.sourceRow=Number(get('sourceRow'));
  return {id,name,start,finish,location,service,...extra,globalIds:[...new Set(get('globalIds').split('|').map(x=>x.trim()).filter(Boolean))]};
 });
}
export function validateScheduleLinks(rows:ScheduleRow[],inventory:InventoryItem[],requireComplete=true):void{
 if(!rows.length||rows.length>MAX_SCHEDULE_ACTIVITIES||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('Atividades vazias, repetidas ou acima do limite.');
 const guids=new Set(inventory.map(e=>e.globalId)),count=new Map<string,number>();
 for(const r of rows){csvDate(r.start);csvDate(r.finish);if(r.finish<r.start||!r.id.trim()||!r.name.trim())throw new Error('Confira identificação e datas.');
  if(!Array.isArray(r.globalIds)||new Set(r.globalIds).size!==r.globalIds.length||requireComplete&&!r.globalIds.length)throw new Error(`Associe elementos à atividade ${r.id} ou remova-a deste recorte CSV.`);
  for(const g of r.globalIds){if(!guids.has(g))throw new Error(`Elemento não encontrado neste modelo: ${g}.`);count.set(g,(count.get(g)??0)+1);if(count.get(g)!>50)throw new Error('Máximo de 50 atividades por elemento neste piloto.');}
 }
}
export function applyScheduleSuggestions(rows:ScheduleRow[],inventory:InventoryItem[],value:unknown):ScheduleRow[]{
 const x=value as {links?:{activityId:string;globalIds:string[];reason:string}[]};if(!x||Object.keys(x).join(',')!=='links'||!Array.isArray(x.links)||x.links.length>rows.length)throw new Error('Proposta de vínculos inválida.');
 const ids=new Set<string>(),copy=structuredClone(rows);
 for(const link of x.links){if(!link||Object.keys(link).sort().join(',')!=='activityId,globalIds,reason'||!Array.isArray(link.globalIds)||link.globalIds.some(g=>typeof g!=='string')||typeof link.reason!=='string'||link.reason.length>1000||ids.has(link.activityId))throw new Error('Proposta repetida ou malformada.');ids.add(link.activityId);const row=copy.find(r=>r.id===link.activityId);if(!row)throw new Error('IA citou atividade inexistente.');if(!row.globalIds.length)row.globalIds=[...new Set(link.globalIds)];}
 validateScheduleLinks(copy,inventory,false);return copy;
}
export const scheduleLinkSchema={type:'object',additionalProperties:false,required:['links'],properties:{links:{type:'array',items:{type:'object',additionalProperties:false,required:['activityId','globalIds','reason'],properties:{activityId:{type:'string'},globalIds:{type:'array',items:{type:'string'}},reason:{type:'string'}}}}}};
