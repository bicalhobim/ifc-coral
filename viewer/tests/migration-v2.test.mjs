import {test} from 'node:test';import assert from 'node:assert/strict';
import {createProject,parseProject,serializeProject} from '../src/production/project.ts';
import {addConcreteCase} from '../src/production/case.ts';
import {packProject,unpackProject,sha256} from '../src/production/storage.ts';
test('schema one migration preserves frozen 12m3, denominator, receipt history and IFC bytes',async()=>{
 const p=createProject();addConcreteCase(p,[]);const pkg=p.packages[0];p.week={frozenAt:'2026-10-17T12:00:00Z',reviewer:'Lucas',commitments:[{packageId:pkg.id,name:pkg.name,location:pkg.location,quantity:12,unit:'m³',deadline:pkg.finishDate,criterion:'Integral aceito',responsible:'Equipe'}]};
 const bytes=new TextEncoder().encode('ISO-10303-21;fixture');p.models.push({id:'m',name:'x.ifc',hash:await sha256(bytes),projectGlobalId:'g'});
 const legacy=JSON.parse(JSON.stringify(p));legacy.schema=1;delete legacy.measures;delete legacy.resources;delete legacy.resourceAllocations;
 legacy.allocations=[{id:'a',packageId:pkg.id,supplyId:p.supplies[0].id,quantity:12}];legacy.deliveries=[{id:'d',allocationId:'a',date:pkg.needDate,received:4,rejected:1,evidence:'Romaneio',reviewer:'Lucas'}];
 const original=JSON.stringify(legacy);const wire={format:'ifc-coral',version:1,project:legacy,models:[{id:'m',base64:btoa(String.fromCharCode(...bytes))}]};
 const restored=await unpackProject(JSON.stringify(wire));assert.equal(restored.project.schema,2);assert.deepEqual(restored.project.week,legacy.week);assert.deepEqual(restored.project.allocations,legacy.allocations);assert.deepEqual(restored.project.deliveries,legacy.deliveries);assert.deepEqual(restored.bytes.get('m'),bytes);assert.equal(JSON.stringify(legacy),original);
 assert.deepEqual((await unpackProject(await packProject(restored.project,restored.bytes))).project,restored.project);
 const bad=structuredClone(legacy);bad.packages[0].quantity=-1;assert.throws(()=>parseProject(JSON.stringify(bad)));assert.equal(JSON.stringify(legacy),original);
 assert.deepEqual(parseProject(serializeProject(restored.project)),restored.project);
});
