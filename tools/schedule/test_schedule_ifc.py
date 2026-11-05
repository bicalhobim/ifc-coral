import sys, json, base64, unittest, tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from schedule_ifc import run,digest,PSET
import ifcopenshell,ifcopenshell.api,ifcopenshell.util.element

def fixture(schema='IFC4'):
    f=ifcopenshell.file(schema=schema)
    if schema=='IFC2X3':
        person=f.create_entity('IfcPerson',Id='QA')
        org=f.create_entity('IfcOrganization',Name='IFC Coral QA')
        f.create_entity('IfcPersonAndOrganization',ThePerson=person,TheOrganization=org)
        f.create_entity('IfcApplication',ApplicationDeveloper=org,Version='1',ApplicationFullName='IFC Coral QA',ApplicationIdentifier='QA')
    project=ifcopenshell.api.run('root.create_entity',f,ifc_class='IfcProject',name='QA IFC sem datas')
    ifcopenshell.api.run('unit.assign_unit',f,length={'is_metric':True,'raw':'METERS'},area={'is_metric':True,'raw':'METERS'},volume={'is_metric':True,'raw':'METERS'})
    context=ifcopenshell.api.run('context.add_context',f,context_type='Model')
    body=ifcopenshell.api.run('context.add_context',f,context_type='Model',context_identifier='Body',target_view='MODEL_VIEW',parent=context)
    site=ifcopenshell.api.run('root.create_entity',f,ifc_class='IfcSite',name='Terreno')
    building=ifcopenshell.api.run('root.create_entity',f,ifc_class='IfcBuilding',name='Edificio QA')
    storey=ifcopenshell.api.run('root.create_entity',f,ifc_class='IfcBuildingStorey',name='Pavimento 1')
    for parent,child in [(project,site),(site,building),(building,storey)]:ifcopenshell.api.run('aggregate.assign_object',f,products=[child],relating_object=parent)
    for i,cls in enumerate(['IfcBeam','IfcSlab']):
        e=ifcopenshell.api.run('root.create_entity',f,ifc_class=cls,name=['Viga QA','Laje QA'][i]);e.GlobalId=ifcopenshell.guid.compress('0000000000000000000000000000000'+str(i+1))
        rep=ifcopenshell.api.run('geometry.add_wall_representation',f,context=body,length=4.,height=.5,thickness=.25)
        ifcopenshell.api.run('geometry.assign_representation',f,product=e,representation=rep)
        ifcopenshell.api.run('geometry.edit_object_placement',f,product=e)
        ifcopenshell.api.run('spatial.assign_container',f,products=[e],relating_structure=storey)
        ps=ifcopenshell.api.run('pset.add_pset',f,product=e,name='QA_Origem');ifcopenshell.api.run('pset.edit_pset',f,pset=ps,properties={'Nota':'Preservar'});
    return f.to_string().encode()
def payload(raw):
    ids=run({'operation':'inspect','data':base64.b64encode(raw).decode()})['inventory']
    rows=[dict(id='A01',name='Fôrmas',start='2026-11-06',finish='2026-11-07',location='Pavimento 1',service='Fôrmas',globalIds=[e['globalId'] for e in ids]),dict(id='A02',name='Concretagem',start='2026-11-08',finish='2026-11-08',location='Pavimento 1',service='Concretagem',globalIds=[e['globalId'] for e in ids])]
    return dict(operation='enrich',data=base64.b64encode(raw).decode(),sourceHash=digest(raw),rows=rows,csv='id;atividade;inicio;fim;local;servico;globalIds\n'+'\n'.join(';'.join([r['id'],r['name'],r['start'],r['finish'],r['location'],r['service'],'|'.join(r['globalIds'])]) for r in rows),reviewer='QA')
def volume_payload(count=1000):
    f=ifcopenshell.file.from_string(fixture().decode());beam=f.by_type('IfcBeam')[0];storey=f.by_type('IfcBuildingStorey')[0]
    for i in range(2,40):
        e=ifcopenshell.api.run('root.create_entity',f,ifc_class='IfcBeam',name=f'Viga QA {i+1}')
        e.GlobalId=ifcopenshell.guid.compress(f'{i+1:032x}');e.Representation=beam.Representation;e.ObjectPlacement=beam.ObjectPlacement
        ifcopenshell.api.run('spatial.assign_container',f,products=[e],relating_structure=storey)
    raw=f.to_string().encode();b=payload(raw);guids=b['rows'][0]['globalIds']
    b['rows']=[dict(id=f'A{i+1:04}',name=f'Serviço {i+1}',start='2024-10-01',finish='2024-10-16',location='Pavimento 1',service='Concretagem',globalIds=[guids[i%len(guids)]]) for i in range(count)]
    b['csv']='id;atividade;inicio;fim;local;servico;globalIds\n'+'\n'.join(';'.join([r['id'],r['name'],r['start'],r['finish'],r['location'],r['service'],'|'.join(r['globalIds'])]) for r in b['rows'])
    return b

class Tests(unittest.TestCase):
    def test_one_thousand_activities_reopen_without_loss(self):
        b=volume_payload();out=run(b)
        self.assertEqual(out['manifest']['bindingCount'],1000)
        inv=run({'operation':'inspect','data':out['data']})
        self.assertEqual(inv['diagnostics']['previousScheduleBindings'],1000)
        self.assertEqual(len(inv['inventory']),40)
        b=volume_payload(1001)
        with self.assertRaisesRegex(ValueError,'1.000'):run(b)
    def test_corrections_cannot_erase_existing_schedule(self):
        original=run(payload(fixture()));raw=base64.b64decode(original['data'])
        inv=run({'operation':'inspect','data':original['data']})
        self.assertEqual(inv['diagnostics']['previousScheduleBindings'],4)
        b=payload(raw);b['rows']=[];e=inv['inventory'][0]
        b['corrections']=[dict(globalId=e['globalId'],field='name',original=e['name'],value='Nome corrigido')]
        with self.assertRaisesRegex(ValueError,'apagar o cronograma'):run(b)
    def test_metadata_corrections_reopen_and_preserve_geometry(self):
        raw=fixture();b=payload(raw);guid=b['rows'][0]['globalIds'][0]
        b['corrections']=[dict(globalId=guid,field='name',original='Viga QA',value='Viga revista'),dict(globalId=guid,field='location',original='Pavimento 1',value='Setor A'),dict(globalId=guid,field='service',original='',value='Concretagem')]
        out=run(b);inv=run({'operation':'inspect','data':out['data']});e=next(e for e in inv['inventory'] if e['globalId']==guid)
        self.assertEqual((e['name'],e['location'],e['service']),('Viga revista','Setor A','Concretagem'))
        old=ifcopenshell.file.from_string(raw.decode());new=ifcopenshell.file.from_string(base64.b64decode(out['data']).decode())
        self.assertEqual(str(old.by_guid(guid).Representation),str(new.by_guid(guid).Representation))
        self.assertEqual(ifcopenshell.util.element.get_container(new.by_guid(guid)).Name,'Pavimento 1')
        b['corrections'][0]['original']='Other'
        with self.assertRaises(ValueError):run(b)
    def test_nonstructural_geometry_is_included_and_duplicate_guid_is_rejected(self):
        f=ifcopenshell.file.from_string(fixture().decode());beam=f.by_type('IfcBeam')[0]
        proxy=ifcopenshell.api.run('root.create_entity',f,ifc_class='IfcBuildingElementProxy',name='Equipamento QA');proxy.Representation=beam.Representation;proxy.ObjectPlacement=beam.ObjectPlacement
        raw=f.to_string().encode();inv=run({'operation':'inspect','data':base64.b64encode(raw).decode()})
        self.assertEqual(len(inv['inventory']),3);self.assertTrue(next(e for e in inv['inventory'] if e['globalId']==proxy.GlobalId)['eligible'])
        run(payload(raw));proxy.GlobalId=beam.GlobalId
        with self.assertRaises(ValueError):run({'operation':'inspect','data':base64.b64encode(f.to_string().encode()).decode()})
    def test_roundtrip_preserves_geometry_guids_and_original_psets(self):
        for schema in ('IFC4','IFC2X3'):
            with self.subTest(schema=schema):
                raw=fixture(schema);body=payload(raw);out=run(body);f=ifcopenshell.file.from_string(base64.b64decode(out['data']).decode());old=ifcopenshell.file.from_string(raw.decode())
                for e in old:
                    # Adding PSets must not change any original entity.
                    self.assertEqual(str(e),str(f.by_id(e.id())))
                self.assertEqual(out['manifest']['bindingCount'],4)
                for e in f.by_type('IfcElement'):
                    ps=ifcopenshell.util.element.get_psets(e);self.assertEqual(ps['QA_Origem']['Nota'],'Preservar');self.assertEqual(ps[PSET]['Task1Id'],'A01')
                again=payload(base64.b64decode(out['data']));r=run(again);f2=ifcopenshell.file.from_string(base64.b64decode(r['data']).decode());self.assertEqual(len([s for s in f2.by_type('IfcPropertySet') if s.Name==PSET]),2)
    def test_invalid_hash_guid_dates_and_existing_schedule(self):
        raw=fixture();b=payload(raw)
        for mutation in [lambda b:b.update(sourceHash='0'*64),lambda b:b['rows'][0].update(globalIds=['invalid']),lambda b:b['rows'][0].update(start='2026-02-31')]:
            candidate=json.loads(json.dumps(b));mutation(candidate)
            with self.assertRaises(Exception):run(candidate)
        f=ifcopenshell.file.from_string(raw.decode());ps=ifcopenshell.api.run('pset.add_pset',f,product=f.by_type('IfcBeam')[0],name='Existing4D');ifcopenshell.api.run('pset.edit_pset',f,pset=ps,properties={'Task1Inicio':'2026-11-05'})
        with self.assertRaisesRegex(ValueError,'cronograma'):run(payload(f.to_string().encode()))
if __name__=='__main__':
    if '--fixture' in sys.argv:
        out=Path(sys.argv[-1]);out.mkdir(parents=True,exist_ok=True);raw=fixture();(out/'QA_sem_datas.ifc').write_bytes(raw);b=payload(raw);(out/'QA_cronograma.csv').write_text('id;atividade;inicio;fim;local;servico;globalIds\n'+'\n'.join(';'.join([r['id'],r['name'],r['start'],r['finish'],r['location'],r['service'],'|'.join(r['globalIds'])]) for r in b['rows']),encoding='utf-8');print(out)
    else:unittest.main()
