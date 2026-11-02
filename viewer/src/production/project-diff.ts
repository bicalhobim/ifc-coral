import type {Project} from './types.ts';
/** Human-readable review before restoring a version. Never includes API credentials. */
export function projectDifferences(current:Project,next:Project):string[]{
 const rows:string[]=[];
 if(current.name!==next.name)rows.push(`Projeto: ${current.name} → ${next.name}`);
 for(const model of next.models){const old=current.models.find(m=>m.id===model.id);if(!old)rows.push(`Adicionar modelo: ${model.name}`);else if(old.hash!==model.hash)rows.push(`Revisão de modelo: ${model.name}`);}
 for(const m of current.models)if(!next.models.some(x=>x.id===m.id))rows.push(`Remover da revisão atual: ${m.name}`);
 for(const pkg of next.packages){const old=current.packages.find(p=>p.id===pkg.id);if(!old){rows.push(`Adicionar pacote: ${pkg.name}`);continue;}
  for(const [key,label]of [['quantity','Quantidade'],['needDate','Necessidade'],['finishDate','Término'],['responsible','Responsável'],['criterion','Critério']] as const)if(old[key]!==pkg[key])rows.push(`${pkg.name} · ${label}: ${old[key]??'Desconhecido'} → ${pkg[key]??'Desconhecido'}`);
  if(JSON.stringify(old.constraints)!==JSON.stringify(pkg.constraints))rows.push(`${pkg.name} · checklist/evidências alterados`);
 }
 for(const pkg of current.packages)if(!next.packages.some(p=>p.id===pkg.id))rows.push(`Retirar pacote da revisão atual: ${pkg.name}`);
 for(const [key,label]of [['resources','Composições'],['resourceAllocations','Reservas de recursos'],['allocations','Reservas'],['deliveries','Recebimentos'],['actuals','Execução'],['week','Compromissos'],['planning','Catálogos e premissas']] as const)if(JSON.stringify(current[key])!==JSON.stringify(next[key]))rows.push(`${label}: registros diferentes; a versão anterior permanece no histórico.`);
 return rows.length?rows:['Sem diferenças operacionais.'];
}
