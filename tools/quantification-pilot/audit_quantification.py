from pathlib import Path
from collections import Counter, defaultdict
import json, hashlib
import ifcopenshell
import ifcopenshell.util.element as ue
import ifcopenshell.util.unit as uu

root=Path(__file__).resolve().parents[2]
source=root/'ifc_model/TORRE02_ESTRUTURA_4D.ifc'
out=root/'artifacts/quantification-discovery'
out.mkdir(parents=True,exist_ok=True)
f=ifcopenshell.open(source)
rows=[]; classes=Counter(); types=defaultdict(Counter); fields=Counter(); material_names=Counter()
for e in f.by_type('IfcElement'):
    p=ue.get_psets(e); q=ue.get_psets(e,qtos_only=True)
    cls=e.is_a();classes[cls]+=1;types[cls][e.ObjectType or str(getattr(e,'PredefinedType',None))]+=1
    material=ue.get_material(e,should_skip_usage=True)
    material_name=material.Name if material and material.is_a('IfcMaterial') else str(material.is_a()) if material else None
    material_names[material_name]+=1
    interesting={name:{k:v for k,v in vals.items() if k!='id' and any(x in k.casefold() for x in ['volume','area','aço','aco','armad','reinf','steel','weight','peso'])} for name,vals in p.items()}
    interesting={k:v for k,v in interesting.items() if v}
    for name,vals in interesting.items():
        for key in vals:fields[name+'.'+key]+=1
    schedule=p.get('BIM4D_Cronograma',{})
    rows.append({'globalId':e.GlobalId,'class':cls,'name':e.Name,'objectType':e.ObjectType,'predefinedType':getattr(e,'PredefinedType',None),'material':material_name,'storey':getattr(ue.get_container(e),'Name',None),'quantities':q,'metrics':interesting,'schedule':{k:v for k,v in schedule.items() if k.startswith('Task') or k.startswith('Summary')}})
summary={'ifcopenshell':ifcopenshell.version,'schema':f.schema,'source':str(source),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'lengthScaleToM':uu.calculate_unit_scale(f),'elements':len(rows),'classes':dict(classes),'types':{k:dict(v) for k,v in types.items()},'materials':dict(material_names),'fields':dict(fields),'storeys':[{'name':s.Name,'elevation':s.Elevation} for s in f.by_type('IfcBuildingStorey')],'reinforcingBars':len(f.by_type('IfcReinforcingBar')),'reinforcingMeshes':len(f.by_type('IfcReinforcingMesh'))}
(out/'audit-modelo.json').write_text(json.dumps({'summary':summary,'elements':rows},ensure_ascii=False,indent=2,default=str),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2,default=str))
