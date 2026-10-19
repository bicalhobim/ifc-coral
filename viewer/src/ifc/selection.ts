/** Runtime selection only: model instances and local IDs must not be persisted. */
export interface SelectionItem<Model> {model:Model;localId:number}

export function uniqueSelection<Model>(items:readonly SelectionItem<Model>[]):SelectionItem<Model>[] {
 const seen=new Map<Model,Set<number>>();
 return items.flatMap(({model,localId})=>{
  const ids=seen.get(model)??new Set<number>();seen.set(model,ids);
  if(ids.has(localId))return [];
  ids.add(localId);return [{model,localId}];
 });
}

export function updateSelection<Model>(current:readonly SelectionItem<Model>[],hit:SelectionItem<Model>|null,additive:boolean):SelectionItem<Model>[] {
 if(!additive)return hit?[hit]:[];
 const items=uniqueSelection(current);
 if(!hit)return items;
 const includes=items.some(item=>item.model===hit.model&&item.localId===hit.localId);
 return includes?items.filter(item=>item.model!==hit.model||item.localId!==hit.localId):[...items,hit];
}

export function selectionTasks<Model,Task extends SelectionItem<Model>>(items:readonly SelectionItem<Model>[],tasks:readonly Task[]):Task[] {
 return tasks.filter(task=>items.some(item=>item.model===task.model&&item.localId===task.localId));
}

export function isAdditiveSelection(event:{ctrlKey:boolean;shiftKey:boolean;metaKey:boolean},enabled=false):boolean {
 return enabled||event.ctrlKey||event.shiftKey||event.metaKey;
}
