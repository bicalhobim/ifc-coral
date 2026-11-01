import type {Project,WorkPackage} from './types.ts';
import {isTeachingProject} from '../workspace/context.ts';

/** Keep historical coverage readable; new ordinary packages start with composition. */
export function usesResourceSupply(p:Project,pkg:WorkPackage):boolean{
 if(pkg.measureLinks?.length||pkg.unit!=='m³'||p.resources.some(r=>r.packageId===pkg.id))return true;
 const legacy=p.allocations.some(a=>a.packageId===pkg.id)||p.supplies.some(s=>!s.resourceCode&&s.unit===pkg.unit);
 return !isTeachingProject(p)&&!legacy;
}
