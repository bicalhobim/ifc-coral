import type {DirectoryHandle} from './local.ts';

type Descriptor={type:'coral-local';id:string;parts:string[];name:string;displayPath:string};
type Session={available:boolean;token:string};
let session:Promise<Session|null>|undefined;
function getSession(refresh=false):Promise<Session|null>{
 if(!session||refresh)session=typeof window==='undefined'?Promise.resolve(null):fetch('/__coral_local/session').then(async r=>r.ok?await r.json() as Session:null).catch(()=>null);
 return session;
}
// Resolve support in the background, before the user needs a folder picker.
void getSession();
export async function requestLocal<T>(action:string,body:unknown,signal?:AbortSignal):Promise<T>{
 let auth=await getSession();if(!auth?.available)throw new Error('Serviço de pastas locais indisponível. Inicie o aplicativo pelo servidor local.');
 const send=()=>fetch(`/__coral_local/${action}`,{method:'POST',headers:{'Content-Type':'application/json','X-IFC-Coral-Session':auth!.token},body:JSON.stringify(body),signal});
 let response=await send();
 if(response.status===403){auth=await getSession(true);if(auth?.available)response=await send();}
 const value=await response.json();
 if(!response.ok){const error=new Error(value.error??'Falha no acesso à pasta.');error.name=value.name??'Error';throw error;}
 return value as T;
}
const request=requestLocal;
function encode(bytes:Uint8Array):string{let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(raw);}
function decode(value:string):Uint8Array{return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}

class LocalFile{
 readonly kind='file' as const;
 readonly id:string;readonly parts:string[];readonly name:string;
 constructor(id:string,parts:string[],name:string){this.id=id;this.parts=parts;this.name=name;}
 async getFile(){const result=await request<{data:string}>('read',{id:this.id,parts:this.parts});return new File([Uint8Array.from(decode(result.data))],this.name);}
 async createWritable(){
  let data:Uint8Array|undefined,closed=false;
  return {
   write:async(value:string|Blob|Uint8Array)=>{if(closed)throw new Error('Gravação encerrada.');data=typeof value==='string'?new TextEncoder().encode(value):value instanceof Blob?new Uint8Array(await value.arrayBuffer()):Uint8Array.from(value);},
   close:async()=>{if(closed)throw new Error('Gravação encerrada.');if(!data)throw new Error('Nenhum conteúdo para gravar.');await request('write',{id:this.id,parts:this.parts,data:encode(data)});closed=true;},
   abort:async()=>{data=undefined;closed=true;}
  };
 }
}
class LocalDirectory implements DirectoryHandle{
 readonly kind='directory' as const;
 readonly descriptor:Descriptor;
 constructor(descriptor:Descriptor){this.descriptor=descriptor;}
 get name(){return this.descriptor.name;}
 get displayPath(){return this.descriptor.displayPath;}
 private child(name:string){return [...this.descriptor.parts,name];}
 async getDirectoryHandle(name:string,options?:{create?:boolean}){
  const parts=this.child(name);await request('entry',{id:this.descriptor.id,parts,kind:'directory',create:options?.create});
  return new LocalDirectory({...this.descriptor,parts,name,displayPath:`${this.displayPath}\\${name}`});
 }
 async getFileHandle(name:string,options?:{create?:boolean}){
  const parts=this.child(name);await request('entry',{id:this.descriptor.id,parts,kind:'file',create:options?.create});return new LocalFile(this.descriptor.id,parts,name);
 }
 async *values(){
  const rows=await request<{kind:'directory'|'file';name:string}[]>('list',{id:this.descriptor.id,parts:this.descriptor.parts});
  for(const row of rows)yield row.kind==='directory'?new LocalDirectory({...this.descriptor,parts:this.child(row.name),name:row.name,displayPath:`${this.displayPath}\\${row.name}`}):new LocalFile(this.descriptor.id,this.child(row.name),row.name);
 }
 async queryPermission(){try{await request('entry',{id:this.descriptor.id,parts:this.descriptor.parts,kind:'directory'});return 'granted' as const;}catch{return 'denied' as const;}}
 async requestPermission(){return this.queryPermission();}
}

export async function chooseLocalDirectory():Promise<DirectoryHandle|null|undefined>{
 const auth=await getSession();if(!auth?.available)return undefined;
 const selected=await request<{id:string;name:string;displayPath:string}|null>('choose',{});
 return selected?new LocalDirectory({type:'coral-local',...selected,parts:[]}):null;
}
export function serializeDirectory(handle:DirectoryHandle):DirectoryHandle|Descriptor{return handle instanceof LocalDirectory?handle.descriptor:handle;}
export function restoreDirectory(stored:DirectoryHandle|Descriptor):DirectoryHandle{return 'type' in stored&&stored.type==='coral-local'?new LocalDirectory(stored):stored as DirectoryHandle;}
