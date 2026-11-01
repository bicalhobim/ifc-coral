export type EvidenceImage={id:string;name:string;mime:'image/png'|'image/jpeg'|'image/webp';size:number;dataUrl:string;createdAt:string};
export const MAX_IMAGE_BYTES=2*1024*1024;
export const MAX_PROJECT_IMAGE_BYTES=12*1024*1024;
export const MAX_IMAGES_PER_CONSTRAINT=5;
const mimes=['image/png','image/jpeg','image/webp'];
const fail=():never=>{throw new Error('Print inválido. Use PNG, JPEG ou WebP de até 2 MB; no máximo 5 por restrição.');};
function signature(bytes:Uint8Array,mime:string){
 if(mime==='image/png')return bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 if(mime==='image/jpeg')return bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime==='image/webp')return bytes.length>=16&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 return false;
}
export function validateEvidenceImages(value:unknown):asserts value is EvidenceImage[]{
 if(!Array.isArray(value)||value.length>MAX_IMAGES_PER_CONSTRAINT)return fail();const ids=new Set<string>();
 for(const item of value){
  if(!item||typeof item!=='object'||Object.keys(item).length!==6||Object.keys(item).some(k=>!['id','name','mime','size','dataUrl','createdAt'].includes(k)))fail();
  if(typeof item.id!=='string'||!item.id||item.id.length>100||ids.has(item.id))fail();ids.add(item.id);
  if(typeof item.name!=='string'||!item.name.trim()||item.name.length>255||/[\\/\u0000-\u001f]/.test(item.name)||!mimes.includes(item.mime)||!Number.isInteger(item.size)||item.size<1||item.size>MAX_IMAGE_BYTES)fail();
  if(typeof item.createdAt!=='string'||item.createdAt.length>40||!Number.isFinite(Date.parse(item.createdAt)))fail();
  const prefix=`data:${item.mime};base64,`;if(typeof item.dataUrl!=='string'||!item.dataUrl.startsWith(prefix)||item.dataUrl.length>Math.ceil(MAX_IMAGE_BYTES/3)*4+40)fail();
  const encoded=item.dataUrl.slice(prefix.length);if(!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))fail();
  let binary:string;try{binary=atob(encoded);}catch{fail();}
  if(binary!.length!==item.size||btoa(binary!)!==encoded||!signature(Uint8Array.from(binary!,c=>c.charCodeAt(0)),item.mime))fail();
 }
}
export function makeEvidenceImage(name:string,mime:string,bytes:Uint8Array):EvidenceImage{
 if(!mimes.includes(mime)||bytes.length>MAX_IMAGE_BYTES||!signature(bytes,mime))fail();let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 const image:EvidenceImage={id:crypto.randomUUID(),name,mime:mime as EvidenceImage['mime'],size:bytes.length,dataUrl:`data:${mime};base64,${btoa(binary)}`,createdAt:new Date().toISOString()};validateEvidenceImages([image]);return image;
}
export function hasConstraintEvidence(c:{evidence:string;attachments?:EvidenceImage[]}){return !!c.evidence.trim()||!!c.attachments?.length;}
