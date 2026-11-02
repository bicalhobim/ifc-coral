import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {createFolderPicker} from './native-picker.mjs';
import {CodexAnalyzer} from './codex-analysis.mjs';

const fail=(message,name='Error')=>Object.assign(new Error(message),{name});
function segment(value){
 if(typeof value!=='string'||!value||value!==value.trim()||value.length>200||/[<>:"/\\|?*\x00-\x1f]/.test(value)||/[. ]$/.test(value)||value==='.'||value==='..'||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value))throw fail('Nome de pasta ou arquivo inválido.');
 return value;
}
const missing=e=>e.code==='ENOENT';
const exists=async p=>{try{return await fs.lstat(p);}catch(e){if(missing(e))return null;throw e;}};

async function selectedDirectory(value){
 if(typeof value!=='string'||!path.isAbsolute(value)||/^\\\\/.test(value))throw fail('Informe o caminho completo de uma pasta local.');
 const absolute=path.resolve(value),root=path.parse(absolute).root;let current=root;
 for(const part of path.relative(root,absolute).split(path.sep).filter(Boolean)){
  current=path.join(current,part);const info=await fs.lstat(current);
  if(info.isSymbolicLink()||!info.isDirectory())throw fail('Selecione uma pasta local; links de diretório não são aceitos.');
 }
 return fs.realpath(absolute);
}

/** File access is scoped to folders explicitly selected through the local app. */
export class LocalWorkspace{
 constructor(registry){this.registry=registry;this.roots=null;this.pending=Promise.resolve();}
 async load(){
  if(!this.roots){try{this.roots=JSON.parse(await fs.readFile(this.registry,'utf8'));}catch(e){if(!missing(e))throw e;this.roots={};}}
  return this.roots;
 }
 async select(selected){
  const root=await selectedDirectory(selected);
  const roots=await this.load(),id=Object.keys(roots).find(key=>roots[key]===root)??randomUUID();roots[id]=root;
  await fs.mkdir(path.dirname(this.registry),{recursive:true});
  const temp=this.registry+'.'+randomUUID()+'.tmp';
  try{await fs.writeFile(temp,JSON.stringify(roots),{flag:'wx',mode:0o600});await fs.rename(temp,this.registry);}catch(e){await fs.unlink(temp).catch(()=>{});throw e;}
  return {id,name:path.basename(root)||root,displayPath:root};
 }
 async target(id,parts){
  const roots=await this.load(),root=Object.hasOwn(roots,id)?roots[id]:undefined;
  if(typeof root!=='string'||!Array.isArray(parts)||parts.length>30)throw fail('Pasta não autorizada. Escolha a pasta novamente.','NotAllowedError');
  let target=root;
  // Check every existing component. Never enumerate or follow directory links/junctions.
  const rootInfo=await fs.lstat(root);if(rootInfo.isSymbolicLink()||!(rootInfo.isDirectory()))throw fail('Pasta de projeto indisponível. Escolha novamente.');
  for(const part of parts){target=path.join(target,segment(part));const info=await exists(target);if(info?.isSymbolicLink())throw fail('Links de diretório ou arquivo não são aceitos no projeto.','NotAllowedError');}
  return target;
 }
 async entry(id,parts,kind,create=false){
  if(!['file','directory'].includes(kind))throw fail('Tipo inválido.');
  const target=await this.target(id,parts);let info=await exists(target);
  if(!info&&create){
   if(kind==='directory')await fs.mkdir(target);
   else{const handle=await fs.open(target,'wx');await handle.close();}
   info=await fs.lstat(target);
  }
  if(!info)throw fail('Arquivo ou pasta não encontrado.','NotFoundError');
  if(info.isSymbolicLink()||(kind==='directory'?!info.isDirectory():!info.isFile()))throw fail('O caminho pertence a outro tipo de arquivo.','TypeMismatchError');
  return {kind,name:path.basename(target)};
 }
 async list(id,parts){
  const target=await this.target(id,parts),rows=await fs.readdir(target,{withFileTypes:true});
  return rows.filter(row=>!row.isSymbolicLink()&&(row.isDirectory()||row.isFile())).map(row=>({kind:row.isDirectory()?'directory':'file',name:row.name}));
 }
 async read(id,parts){
  await this.entry(id,parts,'file');return fs.readFile(await this.target(id,parts));
 }
 async write(id,parts,data){
  const operation=async()=>{
   const target=await this.target(id,parts);await this.entry(id,parts,'file');
   const temp=path.join(path.dirname(target),`.ifc-coral-${randomUUID()}.tmp`);
   try{await fs.writeFile(temp,data,{flag:'wx'});await fs.rename(temp,target);}catch(e){await fs.unlink(temp).catch(()=>{});throw e;}
  };
  const next=this.pending.then(operation,operation);this.pending=next.catch(()=>{});return next;
 }
}

export function isTrustedRequest(req,token){
 const host=req.headers.host;
 return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&
  /^(127\.0\.0\.1|localhost):\d+$/.test(host??'')&&
  req.headers.origin===`http://${host}`&&req.headers['x-ifc-coral-session']===token;
}

export function localWorkspacePlugin(){
 const codex=new CodexAnalyzer();
 const pickFolder=createFolderPicker();
 const service=new LocalWorkspace(path.join(process.env.LOCALAPPDATA??path.join(os.homedir(),'.local'),'IFC Coral','folders.json'));
 const token=randomUUID();
 const middleware=async(req,res,next)=>{
  if(!req.url?.startsWith('/__coral_local/'))return next();
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');
  const send=(code,value)=>{res.statusCode=code;res.end(JSON.stringify(value));};
  const host=req.headers.host,origin=`http://${host}`;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!/^(127\.0\.0\.1|localhost):\d+$/.test(host??'')||req.headers.origin&&req.headers.origin!==origin)return send(403,{error:'Origem não autorizada.'});
  if(req.method==='GET'&&req.url==='/__coral_local/session')return send(200,{available:process.platform==='win32',token});
  if(req.method!=='POST'||!isTrustedRequest(req,token))return send(403,{error:'Sessão local não autorizada.'});
  try{
   let size=0;const chunks=[];
   for await(const chunk of req){size+=chunk.length;if(size>(req.url.includes('/ai-')?256*1024:128*1024*1024))throw fail('Pedido excede o limite da versão local.');chunks.push(chunk);}
   const body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');let value;
   switch(req.url){
    case '/__coral_local/ai-status':value=codex.status();break;
    case '/__coral_local/ai-restrictions':{
     const controller=new AbortController();const cancel=()=>{if(!res.writableEnded)controller.abort();};res.on('close',cancel);
     try{value=await codex.analyze(body,{signal:controller.signal});}finally{res.off('close',cancel);}break;
    }
    case '/__coral_local/choose':{const selected=await pickFolder();value=selected?await service.select(selected):null;break;}
    case '/__coral_local/entry':value=await service.entry(body.id,body.parts,body.kind,body.create===true);break;
    case '/__coral_local/list':value=await service.list(body.id,body.parts);break;
    case '/__coral_local/read':value={data:(await service.read(body.id,body.parts)).toString('base64')};break;
    case '/__coral_local/write':{
     if(typeof body.data!=='string')throw fail('Conteúdo inválido.');
     await service.write(body.id,body.parts,Buffer.from(body.data,'base64'));value={ok:true};break;
    }
    default:return send(404,{error:'Comando local não encontrado.'});
   }
   send(200,value);
  }catch(error){send(400,{error:error.message??'Falha no acesso à pasta.',name:error.name??'Error'});}
 };
 return {name:'ifc-coral-local-workspace',configureServer(server){server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);}};
}
