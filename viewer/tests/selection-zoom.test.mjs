import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quantificationSelection} from '../src/quantification/selection.ts';
import {zoomAtDrag,anchoredScroll} from '../src/ui/timeline-zoom.ts';
import {classifyElement} from '../src/quantification/classify.ts';
import {catalog} from '../src/quantification/catalog.ts';
import {readIfcMetadata} from '../src/ifc/quantities.ts';
test('physical selection includes unscheduled blocks and unknown elements without inventing quantities',()=>{
 const model={id:'model-A',hash:'a'.repeat(64)},metadata=readIfcMetadata("#1=IFCFOOTING('block',$,'Bloco',$,'Bloco de fundação',$,$,$,.PILE_CAP.);",model.id,model.hash);
 const rows=quantificationSelection(['block','unknown','block',''],model,metadata,new Map([['block',{m3:12,source:'NetVolume'}]]));
 assert.equal(rows.length,2);assert.equal(rows[0].volume.amount,12);assert.equal(classifyElement(rows[0].element,catalog).rule.id,'block');assert.equal(rows[1].volume.amount,null);assert.equal(classifyElement(rows[1].element,catalog).status,'pending');
 const other=quantificationSelection(['block'],{...model,id:'model-B'},metadata,new Map());assert.equal(other[0].element.modelId,'model-B');assert.equal(rows[0].element.modelId,'model-A');
});
test('IFC occurrence variants retain construction classification',()=>{
 const base={modelId:'m',modelHash:'h',globalId:'g',ifcClass:'IfcWallStandardCase',predefinedType:'',typeName:'',properties:{}};
 assert.equal(classifyElement(base,catalog).rule.id,'retaining-wall');assert.equal(classifyElement({...base,ifcClass:'IfcBeamElementedCase'},catalog).rule.id,'beam');
 assert.equal(classifyElement({...base,ifcClass:'IfcBeamType'},catalog).status,'pending');
});
test('timeline drag is reversible and constrained, anchored date stays at pointer',()=>{
 assert.equal(zoomAtDrag(1,180),2);assert.equal(zoomAtDrag(2,-180),1);assert.equal(zoomAtDrag(1,-999),1);assert.equal(zoomAtDrag(10,999),12);
 const fraction=.4,width=1000,label=250,pointer=500;const scroll=anchoredScroll(fraction,width*2,label,pointer);assert.equal(label+fraction*width*2-scroll,pointer);assert.equal(anchoredScroll(0,width,label,500),0);
});
