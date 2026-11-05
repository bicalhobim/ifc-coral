import type {Project} from '../production/types.ts';

/** Explicit provenance only: importing a similarly named IFC never enables a lesson. */
export function isTeachingProject(project:Project):boolean{return ['torre02','explore','e02'].includes(project.templateId??'');}
