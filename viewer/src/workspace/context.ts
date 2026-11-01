import type {Project} from '../production/types.ts';

/** Explicit provenance only: importing a similarly named IFC never enables a lesson. */
export function isTeachingProject(project:Project):boolean{return project.templateId==='torre02';}
