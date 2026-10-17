"""Declared quantities in SI; classify via the exact catalog exported by the viewer."""
from pathlib import Path
import hashlib
import ifcopenshell
import ifcopenshell.util.element as ue
import ifcopenshell.util.unit as uu
import re
import math

def volume_factor(unit):
    if unit is None or getattr(unit,'UnitType',None)!='VOLUMEUNIT':return None
    if unit.is_a('IfcSIUnit') and unit.Name=='CUBIC_METRE':return uu.get_prefix_multiplier(unit.Prefix)**3
    if unit.is_a('IfcConversionBasedUnit'):
        factor=volume_factor(unit.ConversionFactor.UnitComponent)
        return factor*unit.ConversionFactor.ValueComponent.wrappedValue if factor is not None else None
    return None

def declared_volume(element,project_unit):
    values=[]
    for rel in element.IsDefinedBy:
        if not rel.is_a('IfcRelDefinesByProperties'):continue
        q=rel.RelatingPropertyDefinition
        if not q.is_a('IfcElementQuantity'):continue
        for item in q.Quantities:
            if not item.is_a('IfcQuantityVolume') or item.Name.lower()!='netvolume':continue
            factor=volume_factor(item.Unit or project_unit);n=item.VolumeValue
            if factor is None or not math.isfinite(n) or n<0:return None
            values.append(n*factor)
    return values[0] if values and all(abs(n-values[0])<max(1e-7,values[0]*1e-8) for n in values) else None

def audit_model(path,catalog=None):
    path=Path(path);f=ifcopenshell.open(path);digest=hashlib.sha256(path.read_bytes()).hexdigest();rows=[]
    projects=f.by_type('IfcProject');units=[u for p in projects for u in (p.UnitsInContext.Units if p.UnitsInContext else []) if getattr(u,'UnitType',None)=='VOLUMEUNIT'];unit=units[0] if len(units)==1 else None
    for e in f.by_type('IfcElement'):
        volume=declared_volume(e,unit)
        typ=ue.get_type(e);type_name=e.ObjectType or (getattr(typ,'Name','') if typ else '') or ''
        predefined=ue.get_predefined_type(e) or '';matches=[]
        for r in catalog or []:
            if r['ifcClass'].upper()!=e.is_a().upper():continue
            if r.get('predefinedType') and r['predefinedType'].upper()!=predefined.upper():continue
            if r.get('typePattern') and not re.search(r['typePattern'],type_name,re.I):continue
            matches.append(r)
        matches.sort(key=lambda r:-r['priority']);rule=matches[0] if matches and (len(matches)==1 or matches[0]['priority']!=matches[1]['priority']) else None
        rows.append({'globalId':e.GlobalId,'ifcClass':e.is_a(),'predefinedType':predefined,'typeName':type_name,'name':e.Name or '', 'properties':{},'volume':volume,'volumeSource':'QTO.NetVolume (SI)' if volume is not None else 'Pendente: QTO ausente/conflitante','ruleId':rule['id'] if rule else 'pending','ruleVersion':rule['version'] if rule else '', 'steelRate':rule['steelRate'] if rule else None,'formMethod':rule['formMethod'] if rule else None})
    return {'sourceHash':digest,'modelId':f.by_type('IfcProject')[0].GlobalId,'elements':rows}
