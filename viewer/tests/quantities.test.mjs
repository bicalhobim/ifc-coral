import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readIfcVolumes,summarizeVolumes} from '../src/ifc/quantities.ts';
import {readFileSync} from 'node:fs';
const base=(unit='#10=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);',q="IFCQUANTITYVOLUME('NetVolume',$,$,5.5,$)")=>`ISO-10303-21;DATA;#1=IFCPROJECT('p',$,$,$,$,$,$,$,#11);#11=IFCUNITASSIGNMENT((#10));${unit}#20=IFCSLAB('g',$,'Laje',$,$,$,$,$,$);#30=${q};#31=IFCQUANTITYVOLUME('GrossVolume',$,$,9.,$);#40=IFCELEMENTQUANTITY('q',$,'Qto_SlabBaseQuantities',$,$,(#30,#31));#50=IFCRELDEFINESBYPROPERTIES('r',$,$,$,(#20),#40);ENDSEC;END-ISO-10303-21;`;
test('quantity prefers net volume and follows project volume unit',()=>{
 const v=readIfcVolumes(base()).get('g');assert.equal(v.m3,5.5);assert.match(v.source,/NetVolume/);
});
test('STEP comments inside an entity preserve its arguments and quoted text',()=>{
 const text=base().replace('#30=IFCQUANTITYVOLUME(',"#30= /* comment with ; and ' */ IFCQUANTITYVOLUME(").replace("'Laje'","'Laje /* text */'");
 assert.equal(readIfcVolumes(text).get('g').m3,5.5);
});
test('cubic SI prefix and conversion based volume units produce m3',()=>{
 assert.equal(readIfcVolumes(base('#10=IFCSIUNIT(*,.VOLUMEUNIT.,.MILLI.,.CUBIC_METRE.);',"IFCQUANTITYVOLUME('NetVolume',$,$,1000000000.,$)")).get('g').m3,1);
 const v=readIfcVolumes(base("#12=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);#13=IFCMEASUREWITHUNIT(IFCVOLUMEMEASURE(0.028316846592),#12);#10=IFCCONVERSIONBASEDUNIT(#99,.VOLUMEUNIT.,'cubic foot',#13);","IFCQUANTITYVOLUME('NetVolume',$,$,1.,$)")).get('g');assert.equal(v.m3,0.028316846592);
});
test('quantity explicit unit overrides project; unknown unit is not zero',()=>{
 const s=base('#10=IFCSIUNIT(*,.VOLUMEUNIT.,.MILLI.,.CUBIC_METRE.);#12=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);',"IFCQUANTITYVOLUME('NetVolume',$,#12,2.,$)");assert.equal(readIfcVolumes(s).get('g').m3,2);
 assert.equal(readIfcVolumes(base('#10=IFCCONTEXTDEPENDENTUNIT(#99,.VOLUMEUNIT.,\'unknown\');')).get('g').m3,null);
});
test('conflicting net quantities stay pending and escaped strings do not corrupt STEP parsing',()=>{
 const s=base().replace("'Laje'","'Laje, sala); d''água'").replace('(#30,#31)','(#30,#31,#32)').replace('ENDSEC;',"#32=IFCQUANTITYVOLUME('NetVolume',$,$,8.,$);ENDSEC;");
 assert.equal(readIfcVolumes(s).get('g').m3,null);
});
test('TORRE02 slab volume comes from six actual QTOs, independently of its three schedule phases',()=>{
 const text=readFileSync(new URL('../../ifc_model/TORRE02_ESTRUTURA_4D.ifc',import.meta.url),'utf8'),q=readIfcVolumes(text);
 const ids=['1eObHp0tv7zx4YO4NSLFlD','1eObHp0tv7zx4YO4NSLFlr','1eObHp0tv7zx4YO4NSLFlz','1eObHp0tv7zx4YO4NSLFlb','1eObHp0tv7zx4YO4NSLFlj','1eObHp0tv7zx4YO4NSLFtz'];
 const rows=ids.map(globalId=>({modelKey:'TORRE02',globalId,volume:q.get(globalId)}));const r=summarizeVolumes([...rows,...rows,...rows]);
 assert.equal(q.size,764);assert.equal(r.count,6);assert.equal(r.measured,6);assert.ok(Math.abs(r.totalM3-34.707)<1e-6);
});
test('missing unit and negative net quantity cannot silently use gross volume',()=>{
 assert.equal(readIfcVolumes(base().replace('IFCUNITASSIGNMENT((#10))','IFCUNITASSIGNMENT(())')).get('g').m3,null);
 assert.equal(readIfcVolumes(base(undefined,"IFCQUANTITYVOLUME('NetVolume',$,$,-1.,$)")).get('g').m3,null);
});
test('volume totals deduplicate element across tasks and distinguish models',()=>{
 const a={modelKey:'m',globalId:'g',volume:{m3:5.5,source:'Qto.NetVolume'}};
 const result=summarizeVolumes([a,a,a,{...a,modelKey:'other'}]);assert.equal(result.count,2);assert.equal(result.totalM3,11);
});
test('partial coverage exposes subtotal without claiming total demand',()=>{
 const r=summarizeVolumes([{modelKey:'m',globalId:'g',volume:{m3:5.5,source:'Qto.NetVolume'}},{modelKey:'m',globalId:'missing'}]);
 assert.equal(r.totalM3,null);assert.equal(r.knownM3,5.5);assert.equal(r.missing,1);assert.match(r.source,/1\/2/);
});
