import type {Project,WorkPackage,Constraint,ElementRef} from './types.ts';
import {uid,log,day} from './project.ts';
import {validateEvidenceImages,type EvidenceImage} from './evidence-images.ts';
export const constraintCategories=['Projeto e informação','Frente e predecessoras','Mão de obra','Equipamentos','Materiais e suprimentos','Ambiente e segurança','Outros'];
export function defaultConstraints():Constraint[]{
 return ['Projeto e informações liberados','Frente e predecessoras liberadas','Mão de obra disponível','Equipamentos disponíveis','Materiais e entrega confirmados'].map((description,i)=>({id:uid(),category:constraintCategories[i],description,resolved:false,evidence:'',reviewer:'',scope:'package'}));
}
export const sameRef=(a:ElementRef,b:ElementRef)=>a.modelId===b.modelId&&a.globalId===b.globalId;
export function constraintElements(pkg:WorkPackage,c:Constraint):ElementRef[]{return c.scope==='elements'?(c.elements??[]).filter(e=>pkg.elements.some(p=>sameRef(e,p))):pkg.elements;}
type Patch={owner?:string;dueDate?:string;action?:string;scope?:'package'|'elements';elements?:ElementRef[];evidence?:string;reviewer?:string;attachments?:EvidenceImage[]};
export function saveConstraint(p:Project,packageId:string,id:string,patch:Patch){
 const pkg=p.packages.find(x=>x.id===packageId),c=pkg?.constraints.find(x=>x.id===id);if(!pkg||!c)throw new Error('Restrição não encontrada.');
 const next={...c,...patch};if(next.dueDate)day(next.dueDate);if(next.attachments)validateEvidenceImages(next.attachments);
 if(next.scope==='elements'){
  if(!next.elements?.length)throw new Error('Selecione pelo menos um elemento do pacote.');
  if(next.elements.some(e=>!pkg.elements.some(x=>sameRef(e,x))))throw new Error('O alcance só pode conter elementos deste pacote.');
  next.elements=[...new Map(next.elements.map(e=>[JSON.stringify([e.modelId,e.globalId]),e])).values()];
 }else delete next.elements;
 if(!next.dueDate)delete next.dueDate;
 const before=JSON.stringify([c.scope??'package',c.elements??[]]),after=JSON.stringify([next.scope??'package',next.elements??[]]);
 if(before!==after||c.resolved&&(next.evidence!==c.evidence||next.reviewer!==c.reviewer||JSON.stringify(next.attachments??[])!==JSON.stringify(c.attachments??[])))next.resolved=false;
 Object.assign(c,next);if(!next.elements)delete c.elements;if(!next.dueDate)delete c.dueDate;
 log(p,'Restrição atualizada',`${c.description} · ${next.scope==='elements'?`${next.elements!.length} elementos`:'todo o pacote'}${before!==after?' · alcance alterado, conferir novamente':''}`);
}
export function addConstraint(p:Project,packageId:string,input:{description:string;category:string}){
 const pkg=p.packages.find(x=>x.id===packageId);if(!pkg)throw new Error('Pacote não encontrado.');
 if(!input.description.trim())throw new Error('Descreva a condição que impede o trabalho.');
 if(!constraintCategories.includes(input.category))throw new Error('Escolha uma categoria da lista.');
 const c:Constraint={id:uid(),description:input.description.trim(),category:input.category,scope:'package',resolved:false,evidence:'',reviewer:''};pkg.constraints.push(c);log(p,'Restrição criada',c.description);return c;
}
