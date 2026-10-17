from pathlib import Path
import hashlib
import ifcopenshell
import ifcopenshell.api.pset as api

def write_derivative(source,results,target):
    source=Path(source);target=Path(target)
    if source.resolve()==target.resolve():raise ValueError('Derivative must not replace source')
    digest=hashlib.sha256(source.read_bytes()).hexdigest();f=ifcopenshell.open(source)
    kg=f.create_entity('IfcSIUnit',UnitType='MASSUNIT',Prefix='KILO',Name='GRAM')
    m2=f.create_entity('IfcSIUnit',UnitType='AREAUNIT',Name='SQUARE_METRE');m3=f.create_entity('IfcSIUnit',UnitType='VOLUMEUNIT',Name='CUBIC_METRE')
    rate=f.create_entity('IfcDerivedUnit',Elements=[f.create_entity('IfcDerivedUnitElement',Unit=kg,Exponent=1),f.create_entity('IfcDerivedUnitElement',Unit=m3,Exponent=-1)],UnitType='USERDEFINED',UserDefinedType='kg/m3 concrete')
    for row in results:
        e=f.by_guid(row['globalId']);pset=api.add_pset(f,product=e,name='Coral_Quantification')
        props={'SourceHash':digest,'RuleId':row['ruleId'],'RuleVersion':row['ruleVersion'],'HumanApproved':False,'Status':'DRAFT - review required; not structural design or purchase approval'}
        unitmap={}
        for key,name,typ,unit in [('steelRate','SteelRate','IfcReal',rate),('steelMass','SteelMass','IfcMassMeasure',kg),('candidateArea','CandidateArea','IfcAreaMeasure',m2),('effectiveCandidateArea','EffectiveCandidateArea','IfcAreaMeasure',m2)]:
            if row.get(key) is not None:
                props[name]=f.create_entity(typ,float(row[key]));unitmap[name]=unit
        api.edit_pset(f,pset=pset,properties=props)
        for p in pset.HasProperties:
            if p.Name in unitmap:p.Unit=unitmap[p.Name]
    target.parent.mkdir(parents=True,exist_ok=True);f.write(target)
    if hashlib.sha256(source.read_bytes()).hexdigest()!=digest:raise RuntimeError('Source changed')
    return {'sourceHash':digest,'targetHash':hashlib.sha256(target.read_bytes()).hexdigest(),'elements':len(results),'humanApproved':False}
