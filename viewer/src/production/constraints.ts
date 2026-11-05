import type {Project,WorkPackage,Constraint,ElementRef} from './types.ts';
import {uid,log,day} from './project.ts';
import {validateEvidenceImages,type EvidenceImage} from './evidence-images.ts';
export const constraintCategories=['Projeto e informação','Frente e predecessoras','Mão de obra','Equipamentos','Materiais e suprimentos','Ambiente e segurança','Outros'];
const defaultDescriptions=['Projeto e informações liberados','Frente e predecessoras liberadas','Mão de obra disponível','Equipamentos disponíveis','Materiais e entrega confirmados'];
export function isEmptyConstraint(c:Constraint){return defaultDescriptions[constraintCategories.indexOf(c.category)]===c.description&&!c.resolved&&!c.owner&&!c.dueDate&&!c.action&&!c.evidence&&!c.reviewer&&!c.attachments?.length&&!c.aiOrigin&&(!c.scope||c.scope==='package')&&!c.elements?.length;}
export function defaultConstraints():Constraint[]{
 return ['Projeto e informações liberados','Frente e predecessoras liberadas','Mão de obra disponível','Equipamentos disponíveis','Materiais e entrega confirmados'].map((description,i)=>({id:uid(),category:constraintCategories[i],description,resolved:false,evidence:'',reviewer:'',scope:'package'}));
}
export const sameRef=(a:ElementRef,b:ElementRef)=>a.modelId===b.modelId&&a.globalId===b.globalId;
export function constraintElements(pkg:WorkPackage,c:Constraint):ElementRef[]{return c.scope==='elements'?(c.elements??[]).filter(e=>pkg.elements.some(p=>sameRef(e,p))):pkg.elements;}
type Patch={category?:string;description?:string;owner?:string;dueDate?:string;action?:string;scope?:'package'|'elements';elements?:ElementRef[];evidence?:string;reviewer?:string;attachments?:EvidenceImage[]};
export function saveConstraint(p:Project,packageId:string,id:string,patch:Patch){
 const pkg=p.packages.find(x=>x.id===packageId),c=pkg?.constraints.find(x=>x.id===id);if(!pkg||!c)throw new Error('Restrição não encontrada.');
 if(p.planning?.packages[packageId]?.supersededBy)throw new Error('Revisão anterior preservada. Edite o pacote vigente.');
 const next={...c,...patch};if(!constraintCategories.includes(next.category))throw new Error('Escolha uma categoria válida.');if(!next.description.trim())throw new Error('Descreva a condição a liberar.');if(next.dueDate)day(next.dueDate);if(next.attachments)validateEvidenceImages(next.attachments);
 if(next.scope==='elements'){
  if(!next.elements?.length)throw new Error('Selecione pelo menos um elemento do pacote.');
  if(next.elements.some(e=>!pkg.elements.some(x=>sameRef(e,x))))throw new Error('O alcance só pode conter elementos deste pacote.');
  next.elements=[...new Map(next.elements.map(e=>[JSON.stringify([e.modelId,e.globalId]),e])).values()];
 }else delete next.elements;
 if(!next.dueDate)delete next.dueDate;
 const before=JSON.stringify([c.scope??'package',c.elements??[]]),after=JSON.stringify([next.scope??'package',next.elements??[]]);
 if(before!==after||c.resolved&&(next.category!==c.category||next.description!==c.description||next.evidence!==c.evidence||next.reviewer!==c.reviewer||JSON.stringify(next.attachments??[])!==JSON.stringify(c.attachments??[])))next.resolved=false;
 if(p.planning?.packages[packageId]?.notApplicable)delete p.planning.packages[packageId].notApplicable![next.category];
 Object.assign(c,next);if(!next.elements)delete c.elements;if(!next.dueDate)delete c.dueDate;
 log(p,'Restrição atualizada',`${c.description} · ${next.scope==='elements'?`${next.elements!.length} elementos`:'todo o pacote'}${before!==after?' · alcance alterado, conferir novamente':''}`);
}
export function addConstraint(p:Project,packageId:string,input:{description:string;category:string}){
 const pkg=p.packages.find(x=>x.id===packageId);if(!pkg)throw new Error('Pacote não encontrado.');
 if(p.planning?.packages[packageId]?.supersededBy)throw new Error('Revisão anterior preservada. Edite o pacote vigente.');
 if(!input.description.trim())throw new Error('Descreva a condição que impede o trabalho.');
 if(!constraintCategories.includes(input.category))throw new Error('Escolha uma categoria da lista.');
 const c:Constraint={id:uid(),description:input.description.trim(),category:input.category,scope:'package',resolved:false,evidence:'',reviewer:''};pkg.constraints.push(c);if(p.planning?.packages[packageId]?.notApplicable)delete p.planning.packages[packageId].notApplicable![c.category];log(p,'Restrição criada',c.description);return c;
}

export function constraintDeletionBlocker(p:Project,packageId:string,id:string):string|undefined{
 const pkg=p.packages.find(q=>q.id===packageId),c=pkg?.constraints.find(q=>q.id===id);
 if(!c)return 'Restrição não encontrada.';
 if(p.planning?.packages[packageId]?.supersededBy)return 'Revisão anterior preservada. Edite o pacote vigente.';
 if(p.week?.commitments.some(q=>q.packageId===packageId)||p.actuals.some(q=>q.packageId===packageId))return 'Pacote comprometido ou com execução registrada. Crie uma revisão para preservar o histórico.';
 if(c.resolved||c.evidence.trim()||c.reviewer.trim()||c.attachments?.length)return 'Esta condição tem liberação ou evidências. Preserve o registro; reabra o acompanhamento ou crie uma revisão do pacote.';
}
export function removeConstraint(p:Project,packageId:string,id:string,reason:string){
 const blocked=constraintDeletionBlocker(p,packageId,id);if(blocked)throw new Error(blocked);
 if(!reason.trim())throw new Error('Informe o motivo da exclusão.');
 const pkg=p.packages.find(q=>q.id===packageId)!,c=pkg.constraints.find(q=>q.id===id)!;
 log(p,'Restrição excluída',JSON.stringify({packageId,reason:reason.trim(),constraint:c}));pkg.constraints=pkg.constraints.filter(q=>q.id!==id);
}
