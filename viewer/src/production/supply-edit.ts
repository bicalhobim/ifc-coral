import type {Project} from './types.ts';
import {editablePackage,adoptPackage,type CompositionLine} from './integrated.ts';
export type SupplyLineEdit=Pick<CompositionLine,'factor'|'loss'|'preparation'|'manufacturing'|'transport'|'inspection'|'buffer'|'source'>;
/** Called through the project operation layer; never alters the IFC or releases work. */
export function editSupplyLine(p:Project,packageId:string,lineId:string,edit:SupplyLineEdit){
 if(!Number.isFinite(edit.factor)||edit.factor<=0)throw new Error('O coeficiente deve ser positivo.');
 if(!Number.isFinite(edit.loss)||edit.loss<0||edit.loss>100)throw new Error('As perdas devem estar entre 0 e 100%.');
 if([edit.preparation,edit.manufacturing,edit.transport,edit.inspection,edit.buffer].some(v=>!Number.isInteger(v)||v<0))throw new Error('Informe prazos em dias inteiros, maiores ou iguais a zero.');
 if(!edit.source.trim())throw new Error('Informe a fonte ou justificativa do ajuste.');
 editablePackage(p,packageId);
 const meta=adoptPackage(p,packageId),line=meta.serviceSnapshot.composition.find(c=>c.id===lineId);
 if(!line)throw new Error('A demanda mudou. Reabra o mapa.');
 Object.assign(line,edit,{source:edit.source.trim()});meta.origins.composition={mode:'manual',source:edit.source.trim()};
 p.resources=p.resources.filter(r=>r.packageId!==packageId);
 const pkg=p.packages.find(q=>q.id===packageId)!;pkg.coverageKnown=false;
}
