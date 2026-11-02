import type {Project} from './types.ts';
import {validateProject,log} from './project.ts';
export class ProjectHistory{
 private back:{label:string;project:Project}[]=[];private forward:{label:string;project:Project}[]=[];
 constructor(_project:Project){}
 get canUndo(){return this.back.length>0;}get canRedo(){return this.forward.length>0;}
 apply(current:Project,label:string,change:(p:Project)=>void){const next=structuredClone(current);change(next);validateProject(next);if(JSON.stringify(next)===JSON.stringify(current))return current;this.back.push({label,project:structuredClone(current)});if(this.back.length>50)this.back.shift();this.forward=[];if(next.audit.length===current.audit.length)log(next,label,'Operação aplicada pelo usuário.');return next;}
 undo(current:Project){const entry=this.back.pop();if(!entry)return current;this.forward.push({label:entry.label,project:structuredClone(current)});const next=structuredClone(entry.project);next.audit=structuredClone(current.audit);log(next,'Desfazer',entry.label);return next;}
 redo(current:Project){const entry=this.forward.pop();if(!entry)return current;this.back.push({label:entry.label,project:structuredClone(current)});const next=structuredClone(entry.project);next.audit=structuredClone(current.audit);log(next,'Refazer',entry.label);return next;}
}
