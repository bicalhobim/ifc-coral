"""Ensaio autorizado de enriquecimento. Nao altera o IFC de origem nem o modelo do app."""
from pathlib import Path
from collections import Counter
from datetime import datetime
import json,csv,hashlib,math
import ifcopenshell
import ifcopenshell.api.pset as api
import ifcopenshell.util.element as ue

root=Path(__file__).resolve().parents[2];out=root/'artifacts/quantification-discovery';source=root/'ifc_model/TORRE02_ESTRUTURA_4D.ifc'
geometry=json.loads((out/'geometria-auditada.json').read_text(encoding='utf-8'));rows=geometry['elements']
digest=hashlib.sha256(source.read_bytes()).hexdigest();assert digest==geometry['summary']['sourceSha256']
f=ifcopenshell.open(source);original_ids={e.GlobalId for e in f.by_type('IfcElement')}
benchmark='https://repositorio.unipampa.edu.br/bitstream/riu/1660/1/%C3%8Dndices%20e%20taxas%20de%20consumo%20de%20materiais%20em%20fun%C3%A7%C3%A3o%20da%20tipologia%20estrutural.pdf'
rates={'laje_suspensa':60.,'viga':85.,'pilar':120.}
kg=f.create_entity('IfcSIUnit',UnitType='MASSUNIT',Prefix='KILO',Name='GRAM')
m2=f.create_entity('IfcSIUnit',UnitType='AREAUNIT',Name='SQUARE_METRE')
m3=f.create_entity('IfcSIUnit',UnitType='VOLUMEUNIT',Name='CUBIC_METRE')
rate_unit=f.create_entity('IfcDerivedUnit',Elements=[f.create_entity('IfcDerivedUnitElement',Unit=kg,Exponent=1),f.create_entity('IfcDerivedUnitElement',Unit=m3,Exponent=-1)],UnitType='USERDEFINED',UserDefinedType='kg de aco por m3 de concreto')
def property_set(product,props,units):
    pset=api.add_pset(f,product=product,name='Coral_Quantificacao_Ensaio')
    api.edit_pset(f,pset=pset,properties=props)
    for prop in pset.HasProperties:
        if prop.Name in units:prop.Unit=units[prop.Name]

for r in rows:
    e=f.by_guid(r['globalId']);rate=rates.get(r['roleCandidate']);mass=None if rate is None or r['netVolumeM3'] is None else rate*r['netVolumeM3']
    r.update({'steelRateKgM3':rate,'estimatedSteelMassKg':mass,'steelStatus':'Estimativa didatica proposta; nao validada' if rate is not None else 'Pendente de taxa e metodo executivo','steelRateSource':benchmark+'#page=36' if rate is not None else None,'humanApproved':False,'catalogVersion':'0.1-ensaio'})
    props={'VersaoCatalogo':'0.1-ensaio','CategoriaCandidata':r['roleCandidate'],'ClassificacaoConfirmada':False,'AprovadoParaCompraOuExecucao':False,'StatusArmadura':r['steelStatus'],'StatusForma':r['formworkStatus'],'FonteVolume':r['volumeSource'],'HashIfcOrigem':digest,'OrigemGeometria':'IfcOpenShell '+ifcopenshell.version+'; areas em coordenadas globais; volume com origem recentrada','AreaSuperficieGeometrica':f.create_entity('IfcAreaMeasure',r['geometricSurfaceAreaM2']),'AreaInferiorHorizontalGeometrica':f.create_entity('IfcAreaMeasure',r['bottomHorizontalAreaM2']),'AreaLateralVerticalGeometrica':f.create_entity('IfcAreaMeasure',r['verticalSideAreaM2']),'VolumeLiquidoDeclarado':f.create_entity('IfcVolumeMeasure',r['netVolumeM3']),'Observacao':'Areas geometricas nao equivalem a forma executada. Taxa de aco e estimativa parametrica, nao exigencia NBR nem dimensionamento. Contatos, metodo executivo, perdas e bitolas exigem conferencia.'}
    units={'AreaSuperficieGeometrica':m2,'AreaInferiorHorizontalGeometrica':m2,'AreaLateralVerticalGeometrica':m2,'VolumeLiquidoDeclarado':m3}
    if rate is not None:
        props.update({'TaxaArmaduraEstimada':f.create_entity('IfcReal',rate),'MassaArmaduraEstimada':f.create_entity('IfcMassMeasure',mass),'FonteTaxa':benchmark+'#page=36','PremissaTaxa':'Arredondamento didatico de comparaveis de 12 e 17 pavimentos da tabela 2, p.36, estudo de 2013; nao validado para esta torre.'})
        units.update({'TaxaArmaduraEstimada':rate_unit,'MassaArmaduraEstimada':kg})
    property_set(e,props,units)

target=out/'TORRE02_QUANTIFICACAO_ENSAIO_R01.ifc'
f.header.file_name.name=target.name;f.header.file_name.time_stamp=datetime.now().astimezone().isoformat(timespec='seconds')
f.write(target);reopened=ifcopenshell.open(target)
assert {e.GlobalId for e in reopened.by_type('IfcElement')}==original_ids
assert len(reopened.by_type('IfcReinforcingBar'))==0
for r in rows:
    current=ue.get_psets(reopened.by_guid(r['globalId']));p=current['Coral_Quantificacao_Ensaio']
    assert p['AprovadoParaCompraOuExecucao'] is False
    if r['steelRateKgM3'] is None:assert 'TaxaArmaduraEstimada' not in p and 'MassaArmaduraEstimada' not in p
    else:assert math.isclose(p['MassaArmaduraEstimada'],r['estimatedSteelMassKg'])
    q=ue.get_psets(reopened.by_guid(r['globalId']),qtos_only=True);assert math.isclose(q[r['volumeSource'].split('.')[0]]['NetVolume'],r['netVolumeM3'])
assert hashlib.sha256(source.read_bytes()).hexdigest()==digest
summary={'purpose':'Ensaio didatico de estimativa; nao e projeto estrutural ou ordem de compra','sourceSha256':digest,'derivedSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'ifcopenshell':ifcopenshell.version,'elements':len(rows),'estimatedSteelElements':sum(r['steelRateKgM3'] is not None for r in rows),'pendingSteelElements':sum(r['steelRateKgM3'] is None for r in rows),'formworkApprovedElements':0,'ratesKgM3':rates,'benchmark':benchmark,'guidAndOriginalQtoPreserved':True,'ratesAreNormative':False,'sourceUnchanged':True,'outputs':[target.name,'catalogo-e-estimativas.csv','enriquecimento-ensaio.json']}
(out/'enriquecimento-ensaio.json').write_text(json.dumps({'summary':summary,'elements':rows},ensure_ascii=False,indent=2),encoding='utf-8')
def csv_safe(value):return "'"+value if isinstance(value,str) and value.startswith(('=','+','-','@','\t','\r')) else value
with(out/'catalogo-e-estimativas.csv').open('w',encoding='utf-8-sig',newline='') as file:
    writer=csv.DictWriter(file,fieldnames=list(rows[0]),delimiter=';');writer.writeheader();writer.writerows({k:csv_safe(v) for k,v in r.items()} for r in rows)
print(json.dumps(summary,ensure_ascii=False,indent=2))

