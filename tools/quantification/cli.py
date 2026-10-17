"""python -m tools.quantification.cli source.ifc --catalog catalog.json --output out"""
import argparse,json,time
from pathlib import Path
import ifcopenshell
from .model_audit import audit_model
from .geometry import measure_surfaces
from .contacts import deduct_contacts
from .export_ifc import write_derivative

def run(source,catalog_path,output):
    started=time.time();rules=json.loads(Path(catalog_path).read_text(encoding='utf-8-sig'));audit=audit_model(source,rules);f=ifcopenshell.open(source);surfaces={}
    for row in audit['elements']:
        try:surfaces[row['globalId']]=measure_surfaces(f.by_guid(row['globalId']),row['formMethod'])
        except Exception as exc:row['geometryError']=str(exc)
    for row in audit['elements']:
        surface=surfaces.get(row['globalId']);row['steelMass']=None if row['volume'] is None or row['steelRate'] is None else row['volume']*row['steelRate']
        if surface:
            contact=deduct_contacts(surface,[s for key,s in surfaces.items() if key!=row['globalId']],row['formMethod'])
            row['geometry']={k:v for k,v in surface.items() if not k.startswith('_')};row['contacts']=contact
            row['candidateArea']=surface['candidateArea'];row['effectiveCandidateArea']=contact['effectiveCandidateArea']
            row['volumeDivergence']=surface['volume'] is None or row['volume'] is None or abs(surface['volume']-row['volume'])>max(1e-6,.001*row['volume'])
        else:row.update(candidateArea=None,effectiveCandidateArea=None,volumeDivergence=True)
        row['humanApproved']=False
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    report=write_derivative(source,audit['elements'],output/'quantification-draft.ifc')
    audit['schema']='quantification-1';audit['catalog']=rules;audit['elapsedSeconds']=time.time()-started;audit['derivative']=report
    (output/'quantification.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'elements':len(audit['elements']),'seconds':audit['elapsedSeconds'],'sourceHash':audit['sourceHash'],'geometryErrors':sum('geometryError' in r for r in audit['elements']),'contactsPending':sum(not r.get('contacts',{}).get('contactsResolved',False) for r in audit['elements'])}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--catalog',required=True);p.add_argument('--output',required=True);a=p.parse_args();run(a.source,a.catalog,a.output)
