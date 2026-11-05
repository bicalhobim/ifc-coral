import {createProject,registerModel,validateProject} from '../production/project.ts';
import {sha256} from '../production/storage.ts';

/** An independent exercise copy; runtime builds 4D tasks from the IFC when activated. */
export async function torreTemplate(source:Uint8Array,variant:'torre02'|'explore'|'e02'='torre02'){
 const bytes=Uint8Array.from(source),text=new TextDecoder().decode(bytes);
 const projectGlobalId=text.match(/IFCPROJECT\s*\(\s*'([^']+)'/i)?.[1];
 if(!text.includes('ISO-10303-21;')||!projectGlobalId)throw new Error('Modelo IFC didático inválido.');
 const project=createProject();project.name=variant==='explore'?'Explore — Projeto Modelo':variant==='e02'?'Pratique — Exercício 02':'Primeiro exercício — TORRE02';project.templateId=variant;
 const name='TORRE02_ESTRUTURA_4D.ifc',id=JSON.stringify([projectGlobalId,name.toLowerCase()]);
 registerModel(project,{id,name,projectGlobalId,hash:await sha256(bytes)});
 validateProject(project);return {project,bytes:new Map([[id,bytes]])};
}
