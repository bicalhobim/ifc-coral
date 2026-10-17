export type TimedElement={modelKey?:string;globalId?:string;localId:number;start:Date;finish:Date};
export function simulationDates(tasks:TimedElement[]):number[]{
 const dates=Array.from(new Set(tasks.flatMap(t=>[+t.start,+t.finish]).filter(Number.isFinite))).sort((a,b)=>a-b);if(!dates.length)return [];
 const before=new Date(dates[0]);before.setDate(before.getDate()-1);return [+before,...dates];
}
export function simulationFrame<T extends TimedElement>(tasks:T[],at:number):{visible:T[];hidden:T[];active:T[]}{
 const elements=new Map<string,T[]>();for(const t of tasks){const key=JSON.stringify([t.modelKey,t.globalId??t.localId]);const group=elements.get(key)??[];group.push(t);elements.set(key,group);}
 const visible:T[]=[],hidden:T[]=[],active:T[]=[];
 for(const group of elements.values()){const started=group.some(t=>+t.start<=at),current=group.find(t=>+t.start<=at&&at<+t.finish);(started?visible:hidden).push(group[0]);if(current)active.push(current);}
 return {visible,hidden,active};
}
