"""Restricted local IFC preparation. JSON stdin/stdout; no caller-supplied paths or code."""
import base64, hashlib, json, sys, re
from datetime import date
import ifcopenshell
import ifcopenshell.api.pset.add_pset
import ifcopenshell.api.pset.edit_pset
import ifcopenshell.api.pset.remove_pset
import ifcopenshell.util.element
import ifcopenshell.util.unit

PSET = 'Coral_CronogramaCSV'
CORRECTIONS = 'Coral_Preparacao'
def digest(data): return hashlib.sha256(data).hexdigest()
def elements(model): return [e for e in model.by_type('IfcProduct') if e.is_a('IfcElement') or e.Representation]
def inventory(model):
    result=[]
    for e in elements(model):
        container=ifcopenshell.util.element.get_container(e)
        psets=ifcopenshell.util.element.get_psets(e)
        overlay=psets.get(CORRECTIONS,{})
        location=overlay.get('Local',container.Name or '' if container else '')
        properties=[]
        # Complete scalar property catalog, separated by provenance.
        sources=[('occurrence',ifcopenshell.util.element.get_psets(e,should_inherit=False))]
        type_element=ifcopenshell.util.element.get_type(e)
        if type_element: sources.append(('type',ifcopenshell.util.element.get_psets(type_element,should_inherit=False)))
        for source,sets in sources:
            for ps,props in sets.items():
                if ps==PSET: continue
                for k,v in props.items():
                    if k!='id' and isinstance(v,(str,float,int,bool)):
                        properties.append(dict(path=f'{ps}.{k}',pset=ps,property=k,source=source,value=str(v)))
        result.append(dict(globalId=e.GlobalId, name=e.Name or '', ifcClass=e.is_a(), location=location, service=overlay.get('Servico',''), eligible=bool(e.Representation), properties=properties))
    if len({e['globalId'] for e in result}) != len(result): raise ValueError('GlobalIds duplicados: corrija o IFC antes de associar atividades.')
    return sorted(result,key=lambda e:e['globalId'])
def run(body):
    raw=base64.b64decode(body['data'],validate=True)
    if len(raw)>100_000_000: raise ValueError('IFC excede o limite de 100 MB para preparação do cronograma.')
    model=ifcopenshell.file.from_string(raw.decode('utf-8-sig'))
    if model.schema not in ('IFC2X3','IFC4'): raise ValueError('Piloto de preparação aceita IFC2X3 e IFC4. Outras versões exigem ensaio específico.')
    inv=inventory(model)
    previous_bindings=sum(sum(bool(re.fullmatch(r'Task\d+Id',str(k))) for k in ifcopenshell.util.element.get_psets(e).get(PSET,{})) for e in elements(model))
    external_schedule=any(any(re.fullmatch(r'task\d+(inicio|fim)',str(k).lower()) or str(k).lower() in ('startdate','finishdate','datainicio','datafim','inicio','fim','start','finish') for k in props) for e in elements(model) for name,props in ifcopenshell.util.element.get_psets(e).items() if name!=PSET)
    if body['operation']=='inspect':
        classes={};locations={}
        for e in inv:
            classes[e['ifcClass']]=classes.get(e['ifcClass'],0)+1
            locations[e['location'] or '(sem local)']=locations.get(e['location'] or '(sem local)',0)+1
        return dict(inventory=inv,sourceHash=digest(raw),schema=model.schema,diagnostics=dict(classes=classes,locations=locations,lengthUnitToMetres=ifcopenshell.util.unit.calculate_unit_scale(model),withoutName=sum(not e['name'] for e in inv),withoutLocation=sum(not e['location'] for e in inv),withoutGeometry=sum(not e['eligible'] for e in inv),productCount=len(model.by_type('IfcProduct')),previousScheduleBindings=previous_bindings,externalSchedule=external_schedule))
    if body['operation']!='enrich': raise ValueError('Operação desconhecida.')
    if body.get('sourceHash')!=digest(raw): raise ValueError('A revisão IFC mudou. Refaça a prévia.')
    rows=body['rows'];reviewer=body.get('reviewer','').strip();csv=body.get('csv','')
    if not reviewer or len(reviewer)>200 or not isinstance(csv,str) or len(csv)>10_000_000: raise ValueError('Informe conferente e CSV de origem.')
    if not isinstance(rows,list) or len(rows)>1000 or (not rows and not body.get('corrections') and not body.get('clearSchedule')): raise ValueError('Use até 1.000 atividades ou correções explícitas.')
    if previous_bindings and not rows and not body.get('clearSchedule'): raise ValueError('Este modelo já possui cronograma do assistente. Inclua suas atividades na revisão; correções isoladas não podem apagar o cronograma.')
    known={e['globalId'] for e in inv};eligible={e['globalId'] for e in inv if e['eligible']};seen=set();by_element={}
    for r in rows:
        if not set(('id','name','start','finish','location','service','globalIds')).issubset(r) or set(r)-set(('id','name','start','finish','location','service','globalIds','associationCode','sourceRow','modelScope','rowKind','parentId','hierarchy','predecessors')): raise ValueError('Estrutura da atividade inválida.')
        for k in ('id','name','start','finish','location','service'):
            if not isinstance(r[k],str) or len(r[k])>500: raise ValueError('Texto de atividade inválido.')
        if not r['id'].strip() or len(r['id'])>100 or r['id'] in seen or not r['name'].strip(): raise ValueError('ID/nome inválido ou repetido.')
        seen.add(r['id'])
        for k in ('start','finish'):
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',r[k]): raise ValueError('Data precisa ser ISO.')
            date.fromisoformat(r[k])
        if r['finish']<r['start']: raise ValueError('Término anterior ao início.')
        gs=r['globalIds']
        if not isinstance(gs,list) or not gs or not all(isinstance(g,str) for g in gs) or len(set(gs))!=len(gs): raise ValueError('Vínculos vazios/repetidos.')
        for g in gs:
            if g not in eligible: raise ValueError('GlobalId não pertence ao inventário com representação 3D.')
            by_element.setdefault(g,[]).append(r)
            if len(by_element[g])>50: raise ValueError('Máximo 50 atividades por elemento.')
    # Reject collision with any existing external schedule, including inherited type properties.
    for e in elements(model):
        for name,props in ifcopenshell.util.element.get_psets(e).items():
            if name==PSET: continue
            if any(re.fullmatch(r'task\d+(inicio|fim)',str(k).lower()) or str(k).lower() in ('startdate','finishdate','datainicio','datafim','inicio','fim','start','finish') for k in props):
                raise ValueError('Modelo já contém parâmetros de cronograma externo ao assistente. Preserve-o; use um IFC sem datas para este piloto.')
    # Keep every original entity intact except this tool's own PSet on reprocessing.
    before={e.id():str(e) for e in model}
    edits=body.get('corrections',[]);edited_names={}
    if not isinstance(edits,list) or len(edits)>50000: raise ValueError('Correções inválidas.')
    seen_edits=set()
    for edit in edits:
        if set(edit)!=set(('globalId','field','original','value')) or edit['field'] not in ('name','location','service') or not isinstance(edit['value'],str) or len(edit['value'])>500: raise ValueError('Correção fora do escopo permitido.')
        guid=edit['globalId'];field=edit['field'];original=next((i for i in inv if i['globalId']==guid),None)
        if original is None or original[field]!=edit['original'] or (guid,field) in seen_edits: raise ValueError('Origem da correção mudou ou está duplicada.')
        seen_edits.add((guid,field));e=model.by_guid(guid)
        if field=='name':
            e.Name=edit['value'];edited_names[e.id()]=str(e)
        else:
            ps=next((r.RelatingPropertyDefinition for r in e.IsDefinedBy or [] if r.is_a('IfcRelDefinesByProperties') and r.RelatingPropertyDefinition.is_a('IfcPropertySet') and r.RelatingPropertyDefinition.Name==CORRECTIONS),None)
            if ps is None: ps=ifcopenshell.api.pset.add_pset(model,product=e,name=CORRECTIONS)
            ifcopenshell.api.pset.edit_pset(model,pset=ps,properties={('Local' if field=='location' else 'Servico'):edit['value']})
    for e in elements(model):
        for rel in list(e.IsDefinedBy or []):
            if rel.is_a('IfcRelDefinesByProperties') and rel.RelatingPropertyDefinition.is_a('IfcPropertySet') and rel.RelatingPropertyDefinition.Name==PSET:
                ifcopenshell.api.pset.remove_pset(model,product=e,pset=rel.RelatingPropertyDefinition)
    for guid,tasks in sorted(by_element.items()):
        e=model.by_guid(guid);props={'CoralOrigem':'CSV aprovado pelo usuário','CoralSourceHash':digest(raw),'CoralCsvHash':digest(csv.encode()),'CoralConferente':reviewer}
        for i,r in enumerate(sorted(tasks,key=lambda r:r['id']),1):
            prefix=f'Task{i}'
            props.update({prefix:r['name'],prefix+'Id':r['id'],prefix+'Inicio':r['start'],prefix+'Fim':r['finish'],prefix+'Local':r['location'],prefix+'Servico':r['service'],prefix+'DuracaoDias':(date.fromisoformat(r['finish'])-date.fromisoformat(r['start'])).days})
        ps=ifcopenshell.api.pset.add_pset(model,product=e,name=PSET)
        ifcopenshell.api.pset.edit_pset(model,pset=ps,properties=props)
    output=model.to_string().encode('utf-8');reopened=ifcopenshell.file.from_string(output.decode())
    # Check original physical identity/placement/representation and all unrelated entities on first import.
    for e in elements(reopened):
        if e.GlobalId not in known: raise ValueError('Identidade física divergente após transformação.')
        if str(e)!=edited_names.get(e.id(),before[e.id()]): raise ValueError('Elemento/representação original foi alterado fora das correções aprovadas.')
    after_inventory=inventory(reopened)
    if {e['globalId'] for e in after_inventory} != known: raise ValueError('Conjunto de elementos mudou após transformação.')
    for edit in edits:
        actual=next(e for e in after_inventory if e['globalId']==edit['globalId'])
        if actual[edit['field']] != edit['value']: raise ValueError('Falha ao reler a correção aprovada.')
    for guid,tasks in by_element.items():
        ps=ifcopenshell.util.element.get_psets(reopened.by_guid(guid))[PSET]
        for i,r in enumerate(sorted(tasks,key=lambda r:r['id']),1):
            if any(ps.get(f'Task{i}'+suffix)!=r[field] for suffix,field in [('', 'name'),('Id','id'),('Inicio','start'),('Fim','finish'),('Local','location'),('Servico','service')]): raise ValueError('Falha ao reler as atividades.')
    manifest=dict(format='coral-schedule-import-1',schema=model.schema,sourceHash=digest(raw),resultHash=digest(output),csvHash=digest(csv.encode()),reviewer=reviewer,rows=rows,corrections=edits,elementCount=len(by_element),bindingCount=sum(len(v) for v in by_element.values()),converter='schedule-ifc-2',preservedPhysicalIdentity=True)
    return dict(data=base64.b64encode(output).decode(),manifest=manifest)
if __name__=='__main__':
    # Node sends UTF-8; Windows pipe locale must never reinterpret Portuguese text.
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    try: print(json.dumps(run(json.load(sys.stdin)),ensure_ascii=True))
    except Exception as exc:
        print(json.dumps({'error':str(exc)},ensure_ascii=True));sys.exit(1)
