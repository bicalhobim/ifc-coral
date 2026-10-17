import type {Project} from './types.ts';
import {parseProject,serializeProject} from './project.ts';
export async function sha256(bytes:Uint8Array):Promise<string>{const hash=await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes).buffer);return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');}
function encode(bytes:Uint8Array){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str);}
export async function packProject(project:Project,bytes:Map<string,Uint8Array>){
 serializeProject(project);const models=[];
 for(const m of project.models){const data=bytes.get(m.id);if(!data)throw new Error(`IFC ${m.name} indisponível. Reimporte antes de exportar.`);if(await sha256(data)!==m.hash)throw new Error('Integridade do IFC divergente.');models.push({id:m.id,base64:encode(data)});}
 return JSON.stringify({format:'ifc-coral',version:1,project,models});
}
export async function unpackProject(text:string){
 if(text.length>50_000_000)throw new Error('Arquivo excede 50 MB.');
 const data=JSON.parse(text);if(data.format!=='ifc-coral'||data.version!==1||Object.keys(data).some(k=>!['format','version','project','models'].includes(k)))throw new Error('Formato de projeto não reconhecido.');
 const project=parseProject(JSON.stringify(data.project));if(!Array.isArray(data.models)||data.models.length!==project.models.length)throw new Error('Arquivos IFC ausentes.');
 const bytes=new Map<string,Uint8Array>();
 for(const row of data.models){if(!row||typeof row.id!=='string'||typeof row.base64!=='string'||Object.keys(row).some(k=>!['id','base64'].includes(k))||bytes.has(row.id))throw new Error('IFC duplicado ou inválido.');
 const m=project.models.find(m=>m.id===row.id);if(!m)throw new Error('IFC sem referência.');
 const value=Uint8Array.from(atob(row.base64),c=>c.charCodeAt(0));if(await sha256(value)!==m.hash)throw new Error('Falha de integridade do IFC no projeto.');bytes.set(row.id,value);}
 return {project,bytes};
}
const KEY='ifc-coral-project-v1';
export function saveLocal(p:Project){localStorage.setItem(KEY,serializeProject(p));}
export function restoreLocal():Project|null{const value=localStorage.getItem(KEY);if(!value)return null;const data=JSON.parse(value);if(data.schema===1){data.deliveries??=[];for(const pkg of data.packages??[])pkg.coverageKnown??=false;}return parseProject(JSON.stringify(data));}
function openDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open('ifc-coral-models',1);req.onupgradeneeded=()=>req.result.createObjectStore('bytes');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function storeBytes(hash:string,value:Uint8Array){const db=await openDB();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('bytes','readwrite');tx.objectStore('bytes').put(value,hash);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
export async function restoreBytes(hash:string):Promise<Uint8Array|undefined>{const db=await openDB();try{return await new Promise((resolve,reject)=>{const req=db.transaction('bytes').objectStore('bytes').get(hash);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}finally{db.close();}}
