import type {Project,TaskRecord} from './types.ts';
import {uid,log} from './project.ts';
export function addConcreteCase(p:Project,tasks:TaskRecord[]){
 if(p.packages.length)throw new Error('O projeto já contém pacotes. Use a criação a partir da seleção.');
 const seed=tasks.find(t=>/concretagem.*laje.*pav 01/i.test(t.name))??tasks.find(t=>/concretagem.*laje/i.test(t.name))??tasks.find(t=>/concretagem/i.test(t.name));
 const selected=seed?tasks.filter(t=>t.name===seed.name&&t.location===seed.location&&t.start===seed.start&&t.modelId===seed.modelId):[];
 p.packages.push({id:uid(),name:'Concretagem da laje — cenário didático',location:seed?.location??'Local a vincular no IFC',service:'Concretagem',elements:selected.map(t=>({modelId:t.modelId,globalId:t.globalId})),taskIds:selected.map(t=>t.id),quantity:12,unit:'m³',coverageKnown:false,quantitySource:'Premissa didática: 12 m³; não extraída do IFC.',needDate:'2026-11-06',finishDate:'2026-11-06',criterion:'Concretagem integral, verificada e aceita até o prazo.',responsible:'',capacityConfirmed:false,reviewRequired:false,constraints:['Projeto e liberação técnica','Formas, armaduras e frente','Equipe e equipamento','Concreto e janela de entrega'].map(description=>({id:uid(),category:description,description,resolved:false,evidence:'',reviewer:''}))});
 p.supplies.push(...[
 {name:'Fornecedor A',unitPrice:570,freight:300,delivery:'2026-11-07',technical:true},
 {name:'Fornecedor B',unitPrice:630,freight:0,delivery:'2026-11-06',technical:true},
 {name:'Fornecedor C',unitPrice:550,freight:0,delivery:'2026-11-06',technical:false}
 ].map(s=>({...s,id:uid(),quantity:12,unit:'m³' as const,confirmed:false,evidence:'',kind:'order' as const,synthetic:true})));
 log(p,'Caso didático criado','Quantidades, datas do cenário e cotações sintéticas; datas IFC preservadas.');
}
