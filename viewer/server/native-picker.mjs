import {readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';

export function decodeFolderResult(stdout){
 try{
  const value=JSON.parse(stdout.replace(/^\uFEFF/,'').trim());
  if(value.cancelled===true)return null;
  if(value.cancelled===false&&typeof value.path==='string'&&value.path)return value.path;
 }catch{/* Return a stable message, without dumping helper output or paths. */}
 throw new Error('Resposta inválida da janela de pastas do Windows.');
}
async function runNativeDialog(){
 if(process.platform!=='win32')throw new Error('O seletor de pastas nativo exige Windows.');
 const source=await readFile(new URL('./select-folder.ps1',import.meta.url),'utf8');
 return new Promise((resolve,reject)=>{
  // STA is required by the Common Item Dialog. Hide the PowerShell console only;
  // STARTF_USESHOWWINDOW/SW_HIDE on the process can also hide its first GUI window.
  execFile('powershell.exe',['-NoProfile','-NonInteractive','-STA','-WindowStyle','Hidden','-EncodedCommand',Buffer.from(source,'utf16le').toString('base64')],{windowsHide:false,timeout:300000,maxBuffer:65536},(error,stdout)=>{
   if(error)return reject(new Error(error.killed?'A seleção de pasta expirou. Clique em Escolher pasta para abrir novamente.':'Não foi possível abrir a janela de pastas do Windows.',{cause:error}));
   resolve(stdout);
  });
 });
}
export function createFolderPicker(run=runNativeDialog){
 let pending=false;
 return async()=>{
  if(pending)throw new Error('A janela de pastas já está aberta. Conclua ou cancele a seleção.');
  pending=true;
  try{return decodeFolderResult(await run());}finally{pending=false;}
 };
}
