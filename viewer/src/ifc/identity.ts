type SourceTask = {modelKey?:string; globalId?:string; sourceTaskKey?:string; name:string; building?:string; storey?:string; eap?:string; summary1?:string;summary2?:string;summary3?:string;summary4?:string;start:Date;finish:Date};
export function taskIdentity(t: Pick<SourceTask,'modelKey'|'globalId'|'sourceTaskKey'>):string {
 if(!t.modelKey || !t.globalId || !t.sourceTaskKey) throw new Error('Tarefa sem identidade IFC persistente.');
 return JSON.stringify([t.modelKey,t.globalId,t.sourceTaskKey]);
}
export function taskGroupKey(t:SourceTask):string {
 return JSON.stringify([t.modelKey,t.sourceTaskKey,t.building,t.storey,t.eap,t.summary1,t.summary2,t.summary3,t.summary4,t.name,t.start.getTime(),t.finish.getTime()]);
}
export function groupTasks<T extends SourceTask>(tasks:T[]):Map<string,T[]> {
 const groups=new Map<string,T[]>();
 for(const task of tasks){const key=taskGroupKey(task);const group=groups.get(key)??[];group.push(task);groups.set(key,group);}
 return groups;
}
