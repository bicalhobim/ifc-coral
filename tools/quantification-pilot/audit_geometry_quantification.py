from pathlib import Path
from collections import defaultdict, Counter
import json, csv, math, hashlib, time
import numpy as np
import ifcopenshell, ifcopenshell.geom
import ifcopenshell.util.shape as us
import ifcopenshell.util.element as ue

root=Path(__file__).resolve().parents[2];source=root/'ifc_model/TORRE02_ESTRUTURA_4D.ifc';out=root/'artifacts/quantification-discovery'
f=ifcopenshell.open(source);settings=ifcopenshell.geom.settings();settings.set('use-world-coords',True)
elements=f.by_type('IfcElement');rows=[];started=time.time();errors=[]
for index,e in enumerate(elements):
    try:shape=ifcopenshell.geom.create_shape(settings,e)
    except Exception as exc:
        errors.append({'guid':e.GlobalId,'error':str(exc)});continue
    g=shape.geometry
    vertices=us.get_vertices(g);faces=us.get_faces(g);cross=np.cross(vertices[faces[:,1]]-vertices[faces[:,0]],vertices[faces[:,2]]-vertices[faces[:,0]])
    magnitudes=np.linalg.norm(cross,axis=1);valid=magnitudes>1e-12;areas=magnitudes[valid]/2;nz=cross[valid,2]/magnitudes[valid]
    p=ue.get_psets(e);q=ue.get_psets(e,qtos_only=True);volumes=[(name,vals['NetVolume']) for name,vals in q.items() if 'NetVolume' in vals]
    role=e.is_a();name=e.ObjectType or ''
    if e.is_a('IfcFooting'):role='bloco_fundacao' if name.startswith('Bloco') else 'estaca_metodo_pendente' if name.startswith('Estaca de concreto') else 'fundacao_nao_classificada'
    elif e.is_a('IfcSlab'):role='laje_fundacao' if e.PredefinedType=='BASESLAB' else 'laje_suspensa'
    elif e.is_a('IfcWall'):role='parede_contencao' if 'Conten' in (e.Name or '') else 'parede_nao_classificada'
    elif e.is_a('IfcBeam'):role='viga'
    elif e.is_a('IfcColumn'):role='pilar'
    schedule=p.get('BIM4D_Cronograma',{})
    row={'globalId':e.GlobalId,'ifcClass':e.is_a(),'roleCandidate':role,'name':e.Name,'typeName':name,'storey':getattr(ue.get_container(e),'Name',None),'netVolumeM3':volumes[0][1] if len(volumes)==1 else None,'volumeSource':volumes[0][0]+'.NetVolume' if len(volumes)==1 else None,'geometricSurfaceAreaM2':float(areas.sum()),'bottomHorizontalAreaM2':float(areas[nz<-math.cos(math.radians(1))].sum()),'topHorizontalAreaM2':float(areas[nz>math.cos(math.radians(1))].sum()),'verticalSideAreaM2':float(areas[np.abs(nz)<math.sin(math.radians(1))].sum()),'slopingAreaM2':float(areas[(np.abs(nz)>=math.sin(math.radians(1)))&(np.abs(nz)<=math.cos(math.radians(1)))].sum()),'formworkApprovedAreaM2':None,'formworkStatus':'Pendente: descontar contatos e confirmar metodo executivo','scheduleLocation':schedule.get('Summary3'),'scheduleService':schedule.get('Summary4')}
    centered=vertices-vertices.mean(axis=0)
    row['geometricVolumeStableM3']=float(abs(np.einsum('ij,ij->i',centered[faces[:,0]],np.cross(centered[faces[:,1]],centered[faces[:,2]])).sum())/6)
    rows.append(row)
    if(index+1)%64==0:print(f'{index+1}/{len(elements)} geometrias',flush=True)
roles=Counter(r['roleCandidate'] for r in rows);totals={}
for role in roles:
    group=[r for r in rows if r['roleCandidate']==role];totals[role]={'count':len(group),'netVolumeM3':sum(r['netVolumeM3'] or 0 for r in group),'volumeMissing':sum(r['netVolumeM3'] is None for r in group),'surfaceAreaM2':sum(r['geometricSurfaceAreaM2'] for r in group),'bottomHorizontalAreaM2':sum(r['bottomHorizontalAreaM2'] for r in group),'verticalSideAreaM2':sum(r['verticalSideAreaM2'] for r in group)}
ids={'1eObHp0tv7zx4YO4NSLFlD','1eObHp0tv7zx4YO4NSLFlr','1eObHp0tv7zx4YO4NSLFlz','1eObHp0tv7zx4YO4NSLFlb','1eObHp0tv7zx4YO4NSLFlj','1eObHp0tv7zx4YO4NSLFtz'}
summary={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'ifcopenshell':ifcopenshell.version,'geometryCount':len(rows),'expectedElements':len(elements),'missingGeometry':[e.GlobalId for e in elements if e.GlobalId not in {r['globalId'] for r in rows}],'errors':errors,'elapsedSeconds':time.time()-started,'roleTotals':totals,'sixSlabs':[r for r in rows if r['globalId'] in ids]}
(out/'geometria-auditada.json').write_text(json.dumps({'summary':summary,'elements':rows},ensure_ascii=False,indent=2),encoding='utf-8')
with(out/'geometria-auditada.csv').open('w',encoding='utf-8-sig',newline='') as file:
    writer=csv.DictWriter(file,fieldnames=list(rows[0]),delimiter=';');writer.writeheader();writer.writerows(rows)
print(json.dumps(summary,ensure_ascii=False,indent=2))

