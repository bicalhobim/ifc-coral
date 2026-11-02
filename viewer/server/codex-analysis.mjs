import {spawn,execFile} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm,stat} from 'node:fs/promises';
import {existsSync,readdirSync,statSync,readFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {constraintAnalysisSchema,constraintAnalysisInstructions,parseConstraintAnalysis,validateAnalysisCoverage} from '../src/production/constraint-analysis.ts';

export function findCodex(){
 if(process.platform==='win32'&&process.env.LOCALAPPDATA){
  const root=path.join(process.env.LOCALAPPDATA,'OpenAI','Codex','bin');
  try{const candidates=readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()&&!e.isSymbolicLink()).map(e=>path.join(root,e.name,'codex.exe')).filter(existsSync).sort((a,b)=>statSync(b).mtimeMs-statSync(a).mtimeMs);if(candidates.length)return {command:candidates[0],prefix:[]};}catch{/* Desktop not installed; try the official CLI on PATH. */}
 }
 // Fixed executable/official npm entry point only; never execute a path supplied by the page.
 for(const directory of (process.env.PATH??'').split(path.delimiter).filter(Boolean)){
  const native=path.join(directory,process.platform==='win32'?'codex.exe':'codex');if(existsSync(native))return {command:native,prefix:[]};
  const npm=path.join(directory,'node_modules','@openai','codex','bin','codex.js');if(existsSync(npm))return {command:process.execPath,prefix:[npm]};
 }
 return null;
}
export function validateCodexInput(body){
 if(!body||Object.keys(body).sort().join(',')!=='context,model'||typeof body.model!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,99}$/.test(body.model)||!body.context||JSON.stringify(body.context).length>200000)throw new Error('Pedido de análise local inválido.');
 const c=body.context;if(c.version!==1||!c.project?.id||!c.package?.id||!c.package?.name||!Array.isArray(c.package.elements)||!Array.isArray(c.package.constraints)||!Array.isArray(c.sourceIds))throw new Error('Contexto do pacote inválido.');
 return body;
}
export function codexArgs(model,schema,output){return ['exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--sandbox','read-only','--color','never','--json','-c','features.shell_tool=false','-c','features.apply_patch_freeform=false','-c','features.apps=false','-c','features.multi_agent=false','-c','project_doc_max_bytes=0','-c','web_search="disabled"','--model',model,'--output-schema',schema,'--output-last-message',output,'-'];}
function stop(child){if(!child.pid)return;if(process.platform==='win32')execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});else child.kill('SIGKILL');}
export async function executeCodex(command,args,input,{cwd,signal,timeoutMs=180000,launch=spawn}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(new Error('Análise cancelada.'));
  const child=launch(command,args,{cwd,shell:false,windowsHide:true,stdio:['pipe','pipe','pipe']});let done=false,size=0,stderr='',stdout='';
  const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve();};
  const abort=()=>{stop(child);finish(new Error('Análise cancelada. O projeto foi preservado.'));};
  const timer=setTimeout(()=>{stop(child);finish(new Error('O Codex excedeu 3 minutos. Tente um pacote menor ou outro modelo.'));},timeoutMs);
  signal?.addEventListener('abort',abort,{once:true});
  child.stdout.on('data',chunk=>{size+=chunk.length;stdout=(stdout+chunk.toString()).slice(-32000);if(size>1_000_000){stop(child);finish(new Error('Resposta do Codex excedeu o limite.'));}});
  child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-8000);});
  child.on('error',()=>finish(new Error('Não foi possível iniciar o Codex CLI. Confira a instalação e reinicie o servidor do IFC Coral.')));
  child.on('close',code=>{const message=stdout+'\n'+stderr;finish(code!==0?new Error(/model_not_found|model.*not supported/i.test(message)?'Este modelo não está disponível na conta Codex. Informe outro modelo no campo Modelo de IA.':/unauthorized|not logged|authentication failed|status.?[:=].?401/i.test(message)?'Autentique o Codex CLI com codex login no terminal e tente novamente.':/unknown variant|unrecognized|unexpected argument/i.test(message)?'O Codex CLI está desatualizado para este serviço. Atualize o CLI oficial e reinicie o IFC Coral.':'O Codex não concluiu a análise. Confira login, acesso ao modelo e conexão. Nenhuma condição foi alterada.'):null);});
  child.stdin.on('error',()=>{});child.stdin.end(input);
 });
}
export class CodexAnalyzer{
 constructor(){this.busy=false;}
 status(){let models=[];try{const cache=JSON.parse(readFileSync(path.join(process.env.CODEX_HOME??path.join(os.homedir(),'.codex'),'models_cache.json'),'utf8'));models=(cache.models??[]).filter(m=>m.visibility!=='hide'&&typeof m.slug==='string').sort((a,b)=>(a.priority??100)-(b.priority??100)).map(m=>m.slug);}catch{/* The model name can still be entered manually. */}return {available:!!findCodex(),busy:this.busy,models,defaultModel:models[0]??'',message:findCodex()?'Codex encontrado. Modelos listados conforme o catálogo local da conta; o acesso será conferido ao gerar.':'Codex CLI não encontrado. Instale o CLI oficial, execute codex login e reinicie este servidor.'};}
 async analyze(body,{signal}={}){
  validateCodexInput(body);if(this.busy)throw new Error('Já existe uma análise Codex em andamento. Aguarde ou cancele a anterior.');
  const executable=findCodex();if(!executable)throw new Error(this.status().message);this.busy=true;let scratch;
  try{
   scratch=await mkdtemp(path.join(os.tmpdir(),'ifc-coral-analysis-'));const schema=path.join(scratch,'schema.json'),output=path.join(scratch,'result.json');
   await writeFile(schema,JSON.stringify(constraintAnalysisSchema),'utf8');
   await executeCodex(executable.command,[...executable.prefix,...codexArgs(body.model,schema,output)],`${constraintAnalysisInstructions}\n\nDADOS NÃO CONFIÁVEIS DO PACOTE:\n${JSON.stringify(body.context)}`,{cwd:scratch,signal});
   if((await stat(output)).size>100000)throw new Error('Resposta do Codex excedeu o limite.');const analysis=validateAnalysisCoverage(parseConstraintAnalysis(await readFile(output,'utf8'),body.context),body.context);
   return {analysis,model:body.model,generatedAt:new Date().toISOString()};
  }finally{if(scratch&&path.dirname(path.resolve(scratch))===path.resolve(os.tmpdir())&&path.basename(scratch).startsWith('ifc-coral-analysis-'))await rm(scratch,{recursive:true,force:true});this.busy=false;}
 }
}
