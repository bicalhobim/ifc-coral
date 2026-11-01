import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,serializeProject,parseProject} from '../src/production/project.ts';
import {createManualPackage} from '../src/production/package-management.ts';
import {saveConstraint} from '../src/production/constraints.ts';
import {resolveConstraint} from '../src/production/planning.ts';
import {packProject,unpackProject} from '../src/production/storage.ts';
import {adviceSnapshot} from '../src/production/ai.ts';
import {makeEvidenceImage,validateEvidenceImages,MAX_IMAGE_BYTES} from '../src/production/evidence-images.ts';
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jNZkAAAAASUVORK5CYII=','base64'));
test('image evidence survives JSON and portable project reopening and supports image-only release',async()=>{
 const p=createProject(),pkg=createManualPackage(p,{name:'QA',location:'Laje',service:'Concretagem'}),c=pkg.constraints[0];
 const image=makeEvidenceImage('print.png','image/png',png);
 saveConstraint(p,pkg.id,c.id,{attachments:[image]});resolveConstraint(p,pkg.id,c.id,'','QA');
 assert.equal(c.resolved,true);assert.equal(parseProject(serializeProject(p)).packages[0].constraints[0].attachments[0].dataUrl,image.dataUrl);
 const reopened=await unpackProject(await packProject(p,new Map()));assert.deepEqual(reopened.project.packages[0].constraints[0].attachments,[image]);
 const snapshot=JSON.stringify(adviceSnapshot(p));assert.ok(snapshot.includes('print.png'));assert.ok(!snapshot.includes(image.dataUrl));assert.equal(c.attachments[0].dataUrl,image.dataUrl);
});
test('unsafe, corrupted, oversized, duplicate and spoofed evidence is refused',()=>{
 assert.throws(()=>makeEvidenceImage('x.svg','image/svg+xml',new TextEncoder().encode('<svg/>')));
 assert.throws(()=>makeEvidenceImage('x.png','image/png',new Uint8Array([1,2,3])));
 assert.throws(()=>makeEvidenceImage('x.png','image/png',new Uint8Array(MAX_IMAGE_BYTES+1)));
 const image=makeEvidenceImage('x.png','image/png',png);
 for(const attachments of [[{...image,dataUrl:'javascript:alert(1)'}],[{...image,size:1}],[image,image],[{...image,unknown:'field'}]])assert.throws(()=>validateEvidenceImages(attachments));
});
test('changing attached evidence reopens a released condition, and legacy textual evidence remains valid',()=>{
 const p=createProject(),pkg=createManualPackage(p,{name:'QA',location:'L',service:'S'}),c=pkg.constraints[0];
 resolveConstraint(p,pkg.id,c.id,'Desenho conferido','QA');assert.equal(c.resolved,true);
 saveConstraint(p,pkg.id,c.id,{attachments:[makeEvidenceImage('x.png','image/png',png)]});assert.equal(c.resolved,false);
 resolveConstraint(p,pkg.id,c.id,c.evidence,'QA');assert.equal(c.resolved,true);
});
