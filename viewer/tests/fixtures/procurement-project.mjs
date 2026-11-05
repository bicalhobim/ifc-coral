import {createProject} from '../../src/production/project.ts';
import {ensurePlanning,createPlannedPackages,confirmComposition,editPackageField,planningDemands} from '../../src/production/integrated.ts';
import {calculateMeasures} from '../../src/quantification/calculate.ts';
import {catalog} from '../../src/quantification/catalog.ts';
import {approveMeasure} from '../../src/quantification/review.ts';
import {reserveResource} from '../../src/production/resources.ts';
export const allFilters={query:'',kind:'all',status:'all',package_id:null};
export const fixtureApplication={version:'0.2.0',commit:'b46d0c8',working_tree_dirty:true};
export function procurementProject(){
 const p=createProject();p.id='synthetic-procurement-v1';p.name='Ensaio sintético — Concretagem, aço e fôrmas 🏗️';
 p.models=[{id:'model-synthetic',name:'EXEMPLO_SINTETICO.ifc',hash:'a'.repeat(64),projectGlobalId:'root-synthetic'}];ensurePlanning(p);p.quantificationCatalog=structuredClone(catalog);
 const d=p.planning;d.services.find(s=>s.id==='formwork').composition.find(c=>c.inputId==='release-agent').factor=1e-7;
 const refs=['known','unknown','macro','panels-a','panels-b'].map(globalId=>({modelId:'model-synthetic',globalId}));
 p.tasks=refs.map((r,i)=>({id:'task-'+r.globalId,...r,slot:'0',name:i<3?i===1?'Armação':'Concretagem':'Montagem de fôrmas',service:i<3?i===1?'Armação':'Concretagem':'Montagem de fôrmas',location:'Pavimento '+(i+1),start:'2026-11-20',finish:'2026-11-22'}));
 const element={...refs[0],modelHash:'a'.repeat(64),ifcClass:'IFCSLAB',predefinedType:'FLOOR',typeName:'Laje sintética',properties:{observacao:'Parâmetro de teste — não é projeto estrutural',fracao:0.123456789,pequeno:1e-7,'温度':23.5}};
 const measure=calculateMeasures({element,volume:{amount:12.375,unit:'m³',source:'QTO sintético para o ensaio; não extraído de IFC real'}},catalog.find(r=>r.id==='slab'))[0];
 const snapshot=approveMeasure(measure,{reviewer:'Conferente fictício',evidence:'Memória sintética conferida só para teste',method:'Quantidade sintética conhecida'});snapshot.at='2026-11-02T12:00:00.000Z';p.measures=[snapshot];
 function make(ref,service,id,quantity){const [randomId]=createPlannedPackages(p,{elements:[ref],serviceIds:[service]});const pkg=p.packages.find(q=>q.id===randomId);pkg.id=id;d.packages[id]=d.packages[randomId];delete d.packages[randomId];pkg.constraints.forEach((c,i)=>c.id=id+'-constraint-'+i);if(quantity!==undefined)editPackageField(p,id,'quantity',quantity);return pkg;}
 const known=make(refs[0],'concrete','package-known');known.measureLinks=[{id:measure.id,fingerprint:snapshot.fingerprint}];known.quantitySource='QTO sintético conferido';known.responsible='Equipe de teste';
 make(refs[1],'reinforcement','package-unknown');
 make(refs[3],'formwork','package-panels-a',100);make(refs[4],'formwork','package-panels-b',80);
 p.planning.estimates=[{...refs[2],modelHash:'a'.repeat(64),serviceCode:'concrete',quantity:7.125,unit:'m³',source:'Estimativa sintética; não conferida'}];
 confirmComposition(p,known.id,'Conferente fictício','Especificação sintética de concreto');p.resources.filter(r=>r.packageId===known.id).forEach(r=>r.id='resource-known-'+r.compositionId);
 known.coverageKnown=true;
 p.supplies=[{id:'supply-synthetic',name:'Pedido fictício',quantity:10,unit:'m³',confirmed:true,delivery:known.needDate,unitPrice:0,freight:0,technical:true,evidence:'Confirmação sintética para ensaio',kind:'order',synthetic:true,resourceCode:'concrete',specification:'Concreto usinado — especificar',reusable:false}];
 reserveResource(p,p.resources[0].id,p.supplies[0].id,5);p.resourceAllocations[0].id='reservation-synthetic';
 p.audit.forEach(e=>e.at='2026-11-02T12:00:00.000Z');return p;
}
export function fixtureOptions(p,filters=allFilters){return {filters:{...filters},demandIds:planningDemands(p).filter(r=>!filters.package_id||r.packageId===filters.package_id).filter(r=>filters.kind==='all'||(filters.kind==='package'?!!r.packageId:!r.packageId)).filter(r=>filters.status==='all'||(filters.status==='pending'?r.pending.length>0:r.pending.length===0)).filter(r=>[r.location,r.name,p.packages.find(q=>q.id===r.packageId)?.name??''].join(' ').toLocaleLowerCase().includes(filters.query.trim().toLocaleLowerCase())).map(r=>r.id),application:{...fixtureApplication},id:'synthetic-export-v1',createdAt:'2026-11-02T12:00:00.000Z'};}
