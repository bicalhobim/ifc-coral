import type {Project} from '../production/types.ts';
import {validateProject,log} from '../production/project.ts';
/** Linked production history must be retained. Never silently cascade-delete commitments. */
export function removeUnlinkedModel(source:Project,modelId:string):Project{
 const p=structuredClone(source),model=p.models.find(m=>m.id===modelId);
 if(!model)throw new Error('Modelo não encontrado.');
 if(p.packages.some(pkg=>pkg.elements.some(e=>e.modelId===modelId)))throw new Error('Este modelo está vinculado a pacotes de produção. Substitua a revisão para preservar os vínculos e compromissos.');
 p.models=p.models.filter(m=>m.id!==modelId);p.tasks=p.tasks.filter(t=>t.modelId!==modelId);
 p.measures=p.measures.filter(s=>s.measure.elementRef.modelId!==modelId);
 if(p.display?.alignments)delete p.display.alignments[modelId];
 if(p.display?.elementAlignments)delete p.display.elementAlignments[modelId];
 log(p,'Modelo removido',model.name);validateProject(p);return p;
}
