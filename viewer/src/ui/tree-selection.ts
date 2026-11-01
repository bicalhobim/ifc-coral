import type {SpatialTreeItem} from '@thatopen/fragments';
const spatial=new Set(['IFCPROJECT','IFCSITE','IFCBUILDING','IFCBUILDINGSTOREY','IFCSPACE','IFCSPATIALZONE','IFCEXTERNALSPATIALELEMENT']);
/** Selectable geometry references, never the spatial container itself. */
export function descendantIds(item:SpatialTreeItem):number[]{
 return [...new Set([...(item.localId!=null&&!spatial.has((item.category??'').toUpperCase())?[item.localId]:[]),...(item.children??[]).flatMap(descendantIds)])];
}
export function rangeIds(rows:readonly {key:number;ids:readonly number[]}[],anchor:number|undefined,hit:number):number[]{
 const end=rows.findIndex(r=>r.key===hit);if(end<0)return [];
 const start=rows.findIndex(r=>r.key===anchor),from=start<0?end:Math.min(start,end),to=start<0?end:Math.max(start,end);
 return [...new Set(rows.slice(from,to+1).flatMap(r=>[...r.ids]))];
}
export function storeyLocations(root:SpatialTreeItem,labels:Map<number,string>):Map<number,string>{
 const result=new Map<number,string>();
 const visit=(item:SpatialTreeItem,storey='')=>{
  const location=item.category?.toUpperCase()==='IFCBUILDINGSTOREY'?(labels.get(item.localId!)??`Pavimento #${item.localId}`):storey;
  if(location&&item.localId!=null&&!spatial.has((item.category??'').toUpperCase()))result.set(item.localId,location);
  for(const child of item.children??[])visit(child,location);
 };visit(root);return result;
}
