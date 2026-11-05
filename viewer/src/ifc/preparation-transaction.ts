/** Stage everything, commit once, then adopt. A committed revision is never reported as rolled back. */
export async function preparationTransaction<T>(items:T[],hooks:{stage:(item:T)=>Promise<void>;commit:()=>Promise<void>;isCommitted:()=>Promise<boolean>;adopt:()=>Promise<void>;rollback:()=>Promise<void>}):Promise<string|undefined>{
 let committed=false,warning:string|undefined;
 try{
  for(const item of items)await hooks.stage(item);
  try{await hooks.commit();committed=true;}catch(error){committed=await hooks.isCommitted().catch(()=>false);if(!committed)throw error;warning='Revisão salva; houve falha ao finalizar o histórico. Use Salvar para tentar novamente.';}
  try{await hooks.adopt();}catch{warning='Revisão salva na pasta. Reabra o projeto para atualizar o visualizador.';}
  return warning;
 }catch(error){if(!committed)await hooks.rollback();throw error;}
}
