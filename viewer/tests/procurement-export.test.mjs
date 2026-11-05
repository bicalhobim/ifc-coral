import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {exportProcurement,procurementFingerprint,canonicalJSON,filterProcurementDemands} from '../src/production/procurement-export.ts';
import {planningDemands} from '../src/production/integrated.ts';
import {procurementProject,fixtureOptions,allFilters} from './fixtures/procurement-project.mjs';
const output=p=>exportProcurement(p,fixtureOptions(p));
test('export drafts is read-only, explicit, complete and reproducible from real function',async()=>{
 const p=procurementProject(),before=structuredClone(p),bundle=await output(p);
 assert.deepEqual(p,before);assert.equal(bundle.demands.length,7);assert.equal(bundle.semantics.purchase_authorized,false);assert.equal(bundle.calendar.unit,'calendar_days');
 assert.deepEqual(bundle,JSON.parse(await readFile(new URL('./fixtures/coral-procurement-1.generated.json',import.meta.url),'utf8')));
 assert.ok(bundle.demands.some(r=>r.composition.status==='unreviewed'));assert.equal(bundle.export.application.commit,'b46d0c8');
});
test('base and derivative remain separate; missing quantity/coverage never become zero',async()=>{
 const b=await output(procurementProject()),known=b.demands.find(r=>r.origin.package_id==='package-known'),unknown=b.demands.find(r=>r.origin.package_id==='package-unknown');
 assert.equal(known.base_quantity.value,12.375);assert.equal(known.derived_preview.quantity,12.375);assert.equal(known.coverage.covered,5);assert.equal(known.coverage.balance,7.375);
 assert.equal(unknown.base_quantity.value,null);assert.equal(unknown.derived_preview.quantity,null);assert.equal(unknown.coverage.balance,null);assert.ok(unknown.pending.length);assert.equal(known.base_quantity.reviews[0].measurement.inputs.volume,12.375);assert.equal(known.base_quantity.reviews[0].measurement.ruleSnapshot.steelRate,60);
});
test('macro residual never repeats detailed task, service and element demand',async()=>{
 const b=await output(procurementProject()),macro=b.demands.filter(r=>r.origin.kind==='macro_4d');
 assert.equal(macro.length,1);assert.equal(macro[0].origin.elements[0].globalId,'macro');assert.equal(macro[0].base_quantity.value,7.125);
 assert.equal(b.totals.find(t=>t.input_id==='concrete').quantity,19.5);assert.equal(b.context.tasks.length,5);assert.equal(b.context.estimates[0].source,'Estimativa sintética; não conferida');
});
test('reusable totals use concurrent peak; fresh concrete receives on use date',async()=>{
 const p=procurementProject(),b=await output(p);const panel=b.totals.find(r=>r.input_id==='panels');assert.equal(panel.aggregation,'concurrent_peak');assert.equal(panel.quantity,180);
 const concrete=b.demands.find(r=>r.origin.package_id==='package-known');assert.equal(concrete.derived_preview.dates.receive_on_site,'2026-11-20');assert.equal(concrete.derived_preview.dates.start_procurement_by,'2026-11-18');
 p.packages.find(q=>q.id==='package-panels-b').needDate='2026-12-10';p.packages.find(q=>q.id==='package-panels-b').finishDate='2026-12-12';
 assert.equal((await output(p)).totals.find(r=>r.input_id==='panels').quantity,100);
});
test('export validates exact filtered scope, context minimization and empty/stale selection',async()=>{
 const p=procurementProject(),filters={...allFilters,package_id:'package-known'};const b=await exportProcurement(p,fixtureOptions(p,filters));
 assert.equal(b.scope.exported_count,1);assert.equal(b.context.packages.length,1);assert.equal(b.context.tasks.length,1);assert.equal(b.context.elements.length,1);assert.equal(b.context.supplies.length,1);
 await assert.rejects(exportProcurement(p,{...fixtureOptions(p),demandIds:[]}),/recorte/);
 await assert.rejects(exportProcurement(p,fixtureOptions(p,{...allFilters,query:'not-present'})),/Nenhuma demanda/);
 const pending={...allFilters,status:'pending'};assert.deepEqual(filterProcurementDemands(p,pending).map(r=>r.id),fixtureOptions(p,pending).demandIds);
});
test('changed IFC invalidates review and coverage but retains previous evidence',async()=>{
 const p=procurementProject(),before=await output(p);p.models[0].hash='b'.repeat(64);p.packages.find(p=>p.id==='package-known').reviewRequired=true;
 const b=await output(p),r=b.demands.find(r=>r.origin.package_id==='package-known');assert.notEqual(b.export.source_fingerprint.value,before.export.source_fingerprint.value);assert.equal(r.base_quantity.review_status,'needs_review');assert.equal(r.base_quantity.reviews[0].current,false);assert.equal(r.coverage.balance,null);assert.equal(r.composition.status,'needs_review');assert.ok(r.base_quantity.reviews[0].evidence);
 assert.equal(b.context.elements.find(e=>e.globalId==='known').metadata_status,'unavailable');
});
test('changed composition does not reuse stale coverage or approval',async()=>{
 const p=procurementProject();p.planning.packages['package-known'].serviceSnapshot.composition[0].loss=5;
 const r=(await output(p)).demands.find(r=>r.origin.package_id==='package-known');assert.equal(r.composition.status,'needs_review');assert.equal(r.coverage.status,'unknown');assert.equal(r.derived_preview.losses_applied,true);assert.equal(r.derived_preview.quantity,12.375*1.05);assert.equal(r.base_quantity.value,12.375);
});
test('hash detects tampering without depending on object insertion order',async()=>{
 const b=await output(procurementProject()),{payload_fingerprint,...info}=b.export;
 assert.equal((await procurementFingerprint({...b,export:info},'x')).value,payload_fingerprint.value);const row={...b.demands[0]};delete row.fingerprint;
 assert.equal((await procurementFingerprint(row,'x')).value,b.demands[0].fingerprint.value);row.pending.push('tampered');assert.notEqual((await procurementFingerprint(row,'x')).value,b.demands[0].fingerprint.value);
 assert.equal(canonicalJSON({a:1,b:2}),canonicalJSON({b:2,a:1}));assert.equal(canonicalJSON(-0),canonicalJSON(0));assert.throws(()=>canonicalJSON(Infinity));
});
test('Python verifies generated schema and hashes with fractions, tiny numbers and Unicode',t=>{
 const probe=spawnSync('python',['--version'],{encoding:'utf8'});if(probe.error){t.skip('Python unavailable; run independent verifier separately');return;}
 const result=spawnSync('python',['../docs/contracts/verify-coral-procurement.py','tests/fixtures/coral-procurement-1.generated.json'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);
 const data={'温度':23.5,'emoji🏗️':1e-7,fracao:0.123456789,tiny:1e-21,large:1e21,negative:-0,'\uE000':'private-use','😀':'astral'};
 const py=spawnSync('python',['-c',"import sys,json;sys.path.insert(0,'../docs/contracts');import importlib.util;spec=importlib.util.spec_from_file_location('v','../docs/contracts/verify-coral-procurement.py');v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v);print(v.canonical(json.loads(sys.stdin.buffer.read().decode('utf-8'))))"],{cwd:new URL('..',import.meta.url),encoding:'utf8',input:JSON.stringify(data)});assert.equal(py.status,0,py.stderr);assert.equal(py.stdout.trim(),canonicalJSON(data));
});
test('no IFC bytes, image payload, API keys or unrelated supplies enter the interchange',async()=>{
 const p=procurementProject();p.supplies.push({...p.supplies[0],id:'unrelated',name:'DO_NOT_EXPORT'});const b=await output(p),json=JSON.stringify(b);assert.ok(!json.includes('DO_NOT_EXPORT'));assert.ok(!json.includes('dataUrl'));assert.ok(!json.includes('apiKey'));assert.ok(!json.includes('ISO-10303-21'));assert.equal(b.context.elements.find(e=>e.globalId==='known').properties.pequeno,1e-7);assert.ok(b.demands.find(r=>r.input.id==='release-agent').derived_preview.quantity<0.0001);
});

test('async export captures request and source before yielding',async()=>{
 const p=procurementProject(),opts=fixtureOptions(p),pending=exportProcurement(p,opts);opts.filters.query='changed';opts.application.version='changed';p.name='changed';
 const b=await pending;assert.equal(b.scope.filters.query,'');assert.equal(b.export.application.version,'0.2.0');assert.notEqual(b.project.name,'changed');
});
test('legacy reservation is traceable without silently claiming input coverage',async()=>{
 const p=procurementProject();p.allocations.push({id:'legacy',packageId:'package-known',supplyId:'supply-synthetic',quantity:1});
 const b=await output(p),r=b.demands.find(r=>r.origin.package_id==='package-known');assert.equal(r.coverage.status,'unknown');assert.equal(r.coverage.balance,null);assert.deepEqual(r.coverage.legacy_reservation_ids,['legacy']);assert.equal(b.context.legacy_reservations.length,1);
});
test('unmapped service retains original dates and unknown derivation instead of zero lead times',async()=>{
 const p=procurementProject();p.tasks.push({...p.tasks[0],id:'unmapped',globalId:'unmapped-element',service:'Inspeção',name:'Inspeção',location:'Local indefinido'});
 const b=await output(p),r=b.demands.find(r=>r.input.id==='unmapped');assert.ok(r);assert.equal(r.composition.factor,null);assert.equal(r.composition.transport_days,null);assert.equal(r.derived_preview.dates.order_by,null);assert.equal(r.derived_preview.dates.need_on_site,'2026-11-20');assert.equal(r.derived_preview.losses_applied,false);assert.equal(r.base_quantity.value,null);
});

test('macro estimate cannot inherit review after rule changed or references/quantity diverged',async()=>{
 const p=procurementProject(),old=p.measures[0];p.packages=p.packages.filter(q=>q.id!=='package-known');delete p.planning.packages['package-known'];p.resources=[];p.resourceAllocations=[];
 p.quantificationCatalog.find(r=>r.id===old.measure.ruleId).version='next-unreviewed';p.planning.estimates.push({modelId:'model-synthetic',modelHash:'a'.repeat(64),globalId:'known',serviceCode:'concrete',quantity:20,unit:'m³',source:'New estimate not reviewed'});
 const b=await output(p),r=b.demands.find(r=>r.origin.kind==='macro_4d'&&r.origin.elements.some(e=>e.globalId==='known'));
 assert.equal(r.base_quantity.value,20);assert.equal(r.base_quantity.review_status,'unreviewed');assert.equal(r.base_quantity.reviews[0].amount,12.375);assert.equal(r.base_quantity.reviews[0].current,false);assert.ok(r.base_quantity.reviews[0].measurement.ruleSnapshot);
 // Same rule and unchanged reviewed source is current again.
 p.quantificationCatalog=structuredClone((await import('../src/quantification/catalog.ts')).catalog);
 const restored=(await output(p)).demands.find(r=>r.origin.elements.some(e=>e.globalId==='known'));assert.equal(restored.base_quantity.value,12.375);assert.equal(restored.base_quantity.review_status,'reviewed');
});
