import {defaultConstraints} from './constraints.ts';
import type {Project,WorkPackage} from './types.ts';
import {uid,log} from './project.ts';
import {applyPackageMeasurements} from './package-quantities.ts';

export function selectionPackageStatus(p:Project,ids:string[]){
 const wanted=new Set(ids),tasks=p.tasks.filter(t=>wanted.has(t.id));
 const count=new Set(tasks.map(t=>JSON.stringify([t.modelId,t.globalId]))).size;
 if(!tasks.length)return {ready:false,count:0,message:'Primeiro, selecione elementos no modelo 3D ou atividades no planejamento 4D.'};
 if(!tasks.some(t=>/concretagem|concrete/i.test(t.name)))return {ready:false,count,message:'Para armação ou fôrmas, abra Quantificação → Conferir → Pré-visualizar pacotes. Cada serviço exige seu quantitativo e sua unidade.'};
 return {ready:true,count,message:`${count} elemento(s) selecionado(s). A criação usará as atividades de concretagem correspondentes.`};
}
export function createSelectionPackage(p:Project,ids:string[],quantity:(refs:WorkPackage['elements'])=>{totalM3:number|null;source:string},context?:{locations:string[]}):WorkPackage{
 const status=selectionPackageStatus(p,ids);if(!status.ready)throw new Error(status.message);
 const wanted=new Set(ids),tasks=p.tasks.filter(t=>wanted.has(t.id)&&/concretagem|concrete/i.test(t.name)),first=tasks[0];
 const elements=Array.from(new Map(tasks.map(t=>[JSON.stringify([t.modelId,t.globalId]),{modelId:t.modelId,globalId:t.globalId}])).values());
 if(p.packages.some(old=>old.unit==='m³'&&old.elements.some(a=>elements.some(b=>a.modelId===b.modelId&&a.globalId===b.globalId))))throw new Error('Já existe pacote de concretagem para estes elementos. Selecione outros elementos ou edite o pacote existente.');
 const q=quantity(elements);
 const pkg:WorkPackage={id:uid(),name:first.name,location:first.location,service:'Concretagem',elements,taskIds:tasks.map(t=>t.id),quantity:q.totalM3===null?null:Math.round(q.totalM3*1e6)/1e6,unit:'m³',coverageKnown:false,quantitySource:q.source,needDate:first.start,finishDate:first.finish,criterion:'',responsible:'',capacityConfirmed:false,reviewRequired:false,constraints:defaultConstraints()};
 const locations=[...new Set(context?.locations.filter(Boolean)??[])];
 if(locations.length){pkg.location=locations.join(' + ');pkg.name=`Concretagem — ${locations.length<=2?pkg.location:`${locations.length} pavimentos / frentes`}`;}
 else if(new Set(tasks.map(t=>t.location)).size>1){pkg.location='Múltiplas frentes — conferir';pkg.name=`Concretagem — ${elements.length} elementos`;}
 const reviewed=p.measures.filter(s=>s.measure.serviceCode==='concrete'&&elements.some(e=>e.modelId===s.measure.elementRef.modelId&&e.globalId===s.measure.elementRef.globalId));
 if(reviewed.length===elements.length){const candidate=structuredClone(p);candidate.packages.push(pkg);applyPackageMeasurements(candidate,reviewed,{packageId:pkg.id});Object.assign(p,candidate);return p.packages.find(x=>x.id===pkg.id)!;}
 p.packages.push(pkg);log(p,'Pacote criado',pkg.name);return pkg;
}
