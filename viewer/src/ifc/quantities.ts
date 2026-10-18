export type ElementVolume={m3:number|null;source:string;reason?:string};
export type VolumeElement={modelKey?:string;globalId?:string;volume?:ElementVolume};
export type VolumeSummary={totalM3:number|null;knownM3:number;count:number;measured:number;missing:number;source:string};
type Entity={type:string;args:string[]};
export function readIfcMetadata(text:string,modelId:string,modelHash:string):Map<string,import('../quantification/types.ts').ElementMetadata>{
 const all=entities(text),out=new Map<string,import('../quantification/types.ts').ElementMetadata>(),types=new Map<number,Entity>();
 for(const e of all.values())if(e.type==='IFCRELDEFINESBYTYPE'){const typ=all.get(Number(ref(e.args[5])));if(typ)for(const id of refs(e.args[4]))types.set(id,typ);}
 for(const [id,e]of all){if(!/^(IFCBEAM|IFCCOLUMN|IFCSLAB|IFCWALL|IFCFOOTING|IFCPILE)(STANDARDCASE|ELEMENTEDCASE)?$/.test(e.type))continue;const globalId=label(e.args[0]);
 out.set(globalId,{modelId,modelHash,globalId,ifcClass:e.type,predefinedType:e.args[8]?.replaceAll('.','')??'',typeName:e.args[4]==='$'?label(types.get(id)?.args[2]):label(e.args[4]),properties:{}});}
 return out;
}
function splitArgs(text:string):string[]{
 const out:string[]=[];let quoted=false,depth=0,start=0;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==="'"){if(quoted&&text[i+1]==="'"){i++;continue;}quoted=!quoted;}if(quoted)continue;if(c==='(')depth++;if(c===')')depth--;if(c===','&&depth===0){out.push(text.slice(start,i).trim());start=i+1;}}
 out.push(text.slice(start).trim());return out;
}
function entities(text:string):Map<number,Entity>{
 const out=new Map<number,Entity>();let start=0,quoted=false,comment=false;let chunks:string[]=[];
 for(let i=0;i<text.length;i++){
  if(comment){if(text[i]==='*'&&text[i+1]==='/'){comment=false;i++;start=i+1;}continue;}
  const c=text[i];if(!quoted&&c==='/'&&text[i+1]==='*'){chunks.push(text.slice(start,i),' ');comment=true;i++;continue;}
  if(c==="'"){if(quoted&&text[i+1]==="'"){i++;continue;}quoted=!quoted;}
  if(c===';'&&!quoted){const s=(chunks.join('')+text.slice(start,i)).trim(),m=s.match(/^#(\d+)\s*=\s*(\w+)\s*\(([\s\S]*)\)$/);if(m)out.set(+m[1],{type:m[2].toUpperCase(),args:splitArgs(m[3])});start=i+1;chunks=[];}
 }
 return out;
}
const ref=(v:string|undefined)=>v?.match(/^#(\d+)$/)?.[1];
const refs=(v:string|undefined)=>Array.from(v?.matchAll(/#(\d+)/g)??[],m=>+m[1]);
const label=(v:string|undefined)=>v?.startsWith("'")?v.slice(1,-1).replaceAll("''","'"):v??'';
function numeric(v:string|undefined):number|null{if(!v)return null;const raw=v.replace(/^IFC\w+\((.*)\)$/,'$1').replace(/[dD]/,'E');if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw))return null;const n=Number(raw);return Number.isFinite(n)&&n>=0?n:null;}
/** Lê QTOs declarados, sem calcular volume pela geometria ou presumir unidade. */
export function readIfcVolumes(text:string):Map<string,ElementVolume>{
 const all=entities(text),prefix:Record<string,number>={EXA:1e18,PETA:1e15,TERA:1e12,GIGA:1e9,MEGA:1e6,KILO:1e3,HECTO:1e2,DECA:1e1,DECI:1e-1,CENTI:1e-2,MILLI:1e-3,MICRO:1e-6,NANO:1e-9,PICO:1e-12,FEMTO:1e-15,ATTO:1e-18};
 const factor=(id:number,seen=new Set<number>()):number|null=>{
  if(seen.has(id))return null;seen.add(id);const u=all.get(id);if(!u||u.args[1]!=='.VOLUMEUNIT.')return null;
  if(u.type==='IFCSIUNIT'&&u.args[3]==='.CUBIC_METRE.'){const p=u.args[2]==='$'?1:prefix[u.args[2]?.replaceAll('.','')];return p===undefined?null:p**3;}
  if(u.type==='IFCCONVERSIONBASEDUNIT'){const m=all.get(Number(ref(u.args[3])));if(m?.type!=='IFCMEASUREWITHUNIT')return null;const n=numeric(m.args[0]),f=factor(Number(ref(m.args[1])),seen);return n!==null&&n>0&&f!==null?n*f:null;}
  return null;
 };
 const globals=Array.from(all.values()).filter(e=>e.type==='IFCPROJECT').flatMap(p=>refs(all.get(Number(ref(p.args[8])))?.args[0])).filter(id=>all.get(id)?.args[1]==='.VOLUMEUNIT.');
 const globalFactor=globals.length===1?factor(globals[0]):null;
 const candidates=new Map<string,{rank:number;value:ElementVolume}[]>();
 for(const rel of all.values()){
  if(rel.type!=='IFCRELDEFINESBYPROPERTIES')continue;const qto=all.get(Number(ref(rel.args[5])));if(qto?.type!=='IFCELEMENTQUANTITY')continue;
  const quantities=refs(qto.args[5]).map(id=>({id,e:all.get(id)})).filter(q=>q.e?.type==='IFCQUANTITYVOLUME'&&/^(netvolume|grossvolume)$/i.test(label(q.e.args[0])));
  for(const id of refs(rel.args[4])){
   const globalId=label(all.get(id)?.args[0]);if(!globalId)continue;
   for(const {id:quantityId,e}of quantities){if(!e)continue;const name=label(e.args[0]),n=numeric(e.args[3]),f=e.args[2]==='$'?globalFactor:factor(Number(ref(e.args[2])));const m3=n!==null&&f!==null&&Number.isFinite(n*f)?n*f:null;
    const value:ElementVolume={m3,source:`${label(qto.args[2])}.${name} (#${quantityId}; m³)`,...(m3===null?{reason:n===null?'Valor volumétrico inválido.':'Unidade volumétrica não reconhecida ou não declarada.'}:{})};
    const rows=candidates.get(globalId)??[];rows.push({rank:/^netvolume$/i.test(name)?0:1,value});candidates.set(globalId,rows);
   }
  }
 }
 const out=new Map<string,ElementVolume>();
 for(const [id,rows]of candidates){const rank=Math.min(...rows.map(r=>r.rank)),chosen=rows.filter(r=>r.rank===rank).map(r=>r.value),first=chosen[0];const conflict=chosen.some(v=>v.m3===null||first.m3===null||Math.abs(v.m3-first.m3)>1e-8*Math.max(1,first.m3));out.set(id,conflict?{m3:null,source:first.source,reason:chosen.find(v=>v.reason)?.reason??'Quantitativos conflitantes para o mesmo elemento.'}:first);}
 return out;
}
export function summarizeVolumes(items:VolumeElement[]):VolumeSummary{
 const unique=new Map<string,ElementVolume|undefined>();
 items.forEach((t,i)=>{const key=JSON.stringify([t.modelKey,t.globalId??`ausente-${i}`]),old=unique.get(key);if(!unique.has(key)||(!old&&t.volume))unique.set(key,t.volume);else if(old&&t.volume&&(old.m3!==t.volume.m3))unique.set(key,{m3:null,source:old.source,reason:'Quantitativos conflitantes.'});});
 const volumes=Array.from(unique.values()),valid=volumes.filter((v):v is ElementVolume&{m3:number}=>v?.m3!==null&&v?.m3!==undefined&&Number.isFinite(v.m3)&&v.m3>=0);
 const knownM3=valid.reduce((n,v)=>n+v.m3,0),count=volumes.length,measured=valid.length,missing=count-measured;
 const sources=Array.from(new Set(valid.map(v=>v.source.replace(/ \(#.*$/,'')))).slice(0,4).join('; ');
 return {totalM3:count>0&&missing===0?knownM3:null,knownM3,count,measured,missing,source:`IFC: ${measured}/${count} elementos únicos com volume em m³. ${sources}${missing?' Quantitativo incompleto; conferir pendências.':''} Sem perdas de compra incluídas.`};
}
