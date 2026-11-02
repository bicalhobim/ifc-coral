import type {ElementMetadata,MeasureInput} from './types.ts';
import type {ElementVolume} from '../ifc/quantities.ts';
/** Resolve physical IFC identities independently of schedule coverage. */
export function quantificationSelection(guids:(string|null)[],model:{id:string;hash:string},metadata:Map<string,ElementMetadata>,volumes:Map<string,ElementVolume>):{element:ElementMetadata;volume:MeasureInput['volume']}[]{
 return [...new Set(guids.filter((id):id is string=>!!id))].map(globalId=>{
  const element=metadata.get(globalId)??{modelId:model.id,modelHash:model.hash,globalId,ifcClass:'Não classificado',predefinedType:'',typeName:'',properties:{}};
  const volume=volumes.get(globalId);
  return {element:{...element,modelId:model.id,modelHash:model.hash},volume:{amount:volume?.m3??null,unit:'m³',source:volume?.source??'Volume IFC não declarado'}};
 });
}
