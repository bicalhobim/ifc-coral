"""Generate disposable two-model QA inputs; no production files are read or modified."""
import json,sys,hashlib,uuid
from pathlib import Path
from test_schedule_ifc import fixture

out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
models=[]
for key,label in [('estrutura','Estrutura'),('instalacoes','Instalacoes')]:
    raw=fixture().replace(b'Viga QA',label.encode()+b' QA')
    path=out/(label+'.ifc');path.write_bytes(raw)
    digest=hashlib.sha256(raw).hexdigest()
    (out/'Modelos').mkdir(exist_ok=True);(out/'Modelos'/(digest+'.ifc')).write_bytes(raw)
    models.append(dict(id=key,name=path.name,hash=digest,projectGlobalId=key))
project=dict(schema=2,id=str(uuid.uuid4()),name='QA ETL Federado',models=models,tasks=[],packages=[],supplies=[],allocations=[],deliveries=[],week=None,actuals=[],audit=[],measures=[],resources=[],resourceAllocations=[])
(out/'IFC-Coral.projeto.json').write_text(json.dumps(dict(format='ifc-coral-folder',version=2,project=project,models=[dict(id=m['id'],hash=m['hash']) for m in models])),encoding='utf-8')
(out/'cronograma.csv').write_text('Código;Nome;Início;Término;Pavimento;Serviço\nA01;Concretagem compartilhada;06/11/2026;07/11/2026;Pavimento 1;Concretagem\nA02;Mobilização administrativa;05/11/2026;05/11/2026;;Gestão',encoding='utf-8')
print(out)
