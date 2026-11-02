let handler:((name:string,blob:Blob)=>Promise<void>)|undefined;
let failure:(error:unknown)=>void=()=>{};
export function configureDownloads(write:(name:string,blob:Blob)=>Promise<void>,onError:(error:unknown)=>void){handler=write;failure=onError;}
export function downloadBlob(name:string,blob:Blob):void{
 if(handler){void handler(name,blob).catch(failure);return;}
 downloadCopy(name,blob);
}
/** Independent output: browser download remains available without project-folder permission. */
export function downloadCopy(name:string,blob:Blob):void{
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
