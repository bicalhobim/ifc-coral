// One active analysis per service. A cancelled run cannot release a newer run.
export class AnalysisOperation {
 active;
 cancelled = new Map();
 get busy(){return !!this.active;}
 validate(id){if(id!==undefined&&(typeof id!=='string'||! /^[a-zA-Z0-9-]{1,100}$/.test(id)))throw new Error('Identificador de análise inválido.');}
 cancel(id){
  this.validate(id);if(!id)throw new Error('Informe a análise a cancelar.');
  this.prune();this.cancelled.set(id,Date.now());
  if(this.active?.id===id)this.active.controller.abort();
  return {cancelled:true,requestId:id};
 }
 prune(){for(const [id,time]of this.cancelled)if(Date.now()-time>300000)this.cancelled.delete(id);while(this.cancelled.size>500)this.cancelled.delete(this.cancelled.keys().next().value);}
 async run(id,external,work){
  this.validate(id);this.prune();
  if(external?.aborted||this.cancelled.has(id))throw new Error('Análise cancelada.');
  if(this.active)throw new Error('Há uma análise em andamento. Cancele ou aguarde a operação ativa.');
  const controller=new AbortController(),slot={id,controller};this.active=slot;
  const release=()=>{if(this.active===slot)this.active=undefined;};
  const cancel=()=>controller.abort();
  controller.signal.addEventListener('abort',release,{once:true});external?.addEventListener('abort',cancel,{once:true});
  try{const result=await work(controller.signal);controller.signal.throwIfAborted();return result;}
  finally{external?.removeEventListener('abort',cancel);controller.signal.removeEventListener('abort',release);release();}
 }
}
