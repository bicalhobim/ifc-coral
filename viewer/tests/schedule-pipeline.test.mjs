import {normalizeScheduleCsv} from '../src/ifc/schedule-normalization.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {guessMapping,mapCsv,initialActivities,validatePlan,rowsForModel,validateModelSlice,canonicalCsv,setCorrection,correctionProposals} from '../src/ifc/schedule-pipeline.ts';
import {preparationTransaction} from '../src/ifc/preparation-transaction.ts';
import {csvDate} from '../src/ifc/schedule-import.ts';
const models=[{id:'a',name:'A.ifc',hash:'a'.repeat(64)},{id:'b',name:'B.ifc',hash:'b'.repeat(64)}];
const elements=models.map(m=>({modelId:m.id,modelHash:m.hash,globalId:'same-guid',name:'Viga',location:'P1',ifcClass:'IfcBeam',eligible:true}));
const row={id:'1',name:'Concretagem',start:'2026-11-06',finish:'2026-11-07',location:'P1',service:'Concretagem',globalIds:['same-guid']};
test('1000 activities survive de-para, plan validation and per-model slicing',()=>{
 const csv='id;atividade;inicio;fim\n'+Array.from({length:1000},(_,i)=>`${i};Atividade ${i};Ter 01/10/24;Qua 16/10/24`).join('\n');
 const rows=mapCsv(csv,{id:0,name:1,start:2,finish:3,location:-1,service:-1,globalIds:-1});assert.equal(rows.length,1000);
 const p={models,activities:rows.map((row,i)=>({row,disposition:'link',reason:'',links:[{modelId:'a',globalId:'g'+Math.floor(i/50)}]})),corrections:[]};
 validatePlan(p);const slice=rowsForModel(p,'a');assert.equal(slice.length,1000);validateModelSlice(p,'a',models[0].hash,slice,canonicalCsv(rows));
 assert.throws(()=>mapCsv(csv+'\n1001;Extra;Ter 01/10/24;Qua 16/10/24',{id:0,name:1,start:2,finish:3,location:-1,service:-1,globalIds:-1}),/1.000/);
});
test('Project and Navisworks localized dates normalize deterministically',()=>{
 for(const [input,expected] of [['Ter 01/10/24','2024-10-01'],['Qui 02/11/28','2028-11-02'],['Sáb 26/10/24','2024-10-26'],['sab.\u00a026/10/2024','2024-10-26'],[' SEG 1/1/24 ','2024-01-01'],['29/02/24','2024-02-29'],['01/01/00','2000-01-01'],['31/12/99','2099-12-31'],['2026-11-05','2026-11-05']])assert.equal(csvDate(input),expected);
 for(const input of ['Ter 31/02/24','29/02/25','Qui 00/10/24','01/13/24','Ter 45200','45200','abc 01/10/24','Ter 01/10/024','Ter 01/10/24 lixo'])assert.throws(()=>csvDate(input),/Data inválida/);
 const csv='Navisworks_User1,Nome,Início,Término\nTerreno,Limpeza,Ter 01/10/24,Qua 16/10/24\nTapume,Tapume,Sáb 26/10/24,Ter 05/11/24';
 const parsed=normalizeScheduleCsv(csv,guessMapping(csv.split('\n')[0].split(','))).rows;
 assert.deepEqual(parsed.map(r=>[r.start,r.finish]),[['2024-10-01','2024-10-16'],['2024-10-26','2024-11-05']]);
 assert.throws(()=>normalizeScheduleCsv(csv.replace('Qua 16/10/24','Seg 30/09/24'),guessMapping(csv.split('\n')[0].split(','))),/término anterior/);
});
function plan(){return {models,activities:[{row,disposition:'link',reason:'',links:elements.map(({modelId,globalId})=>({modelId,globalId}))}],corrections:[]};}
test('ambiguous bare GUID is never auto-linked; federated identities remain distinct',()=>{
 assert.equal(initialActivities([row],elements)[0].links.length,0);const p=plan();validatePlan(p,elements);
 for(const m of models){const slice=rowsForModel(p,m.id);assert.deepEqual(slice[0].globalIds,['same-guid']);validateModelSlice(p,m.id,m.hash,slice,canonicalCsv([row]));}
 p.activities[0].links.push(p.activities[0].links[0]);assert.throws(()=>validatePlan(p,elements),/duplicado/);
});
test('unrepresented activities require justification; dates and model revisions cannot drift',()=>{
 const p=plan();p.activities.push({row:{...row,id:'2',globalIds:[]},disposition:'no3d',reason:'',links:[]});assert.throws(()=>validatePlan(p),/Justifique/);p.activities[1].reason='Mobilização administrativa';validatePlan(p);
 assert.throws(()=>validateModelSlice(p,'a','c'.repeat(64),rowsForModel(p,'a'),canonicalCsv(p.activities.map(a=>a.row))),/revisão/);
 assert.throws(()=>validateModelSlice(p,'a',models[0].hash,rowsForModel(p,'a'),canonicalCsv([{...row,start:'2026-11-05'},p.activities[1].row])),/CSV/);
});
test('Excel de-para accepts accents and preserves original dates',()=>{
 const csv='Código;Nome;Início;Término;Pavimento\n1;Fôrmas;06/11/2026;07/11/2026;Subsolo';const rows=mapCsv(csv,guessMapping(csv.split('\n')[0].split(';')));
 assert.equal(rows[0].start,'2026-11-06');assert.equal(rows[0].name,'Fôrmas');assert.deepEqual(rows[0].globalIds,[]);
 assert.throws(()=>mapCsv(csv.replace('06/11/2026','31/02/2026'),guessMapping(csv.split('\n')[0].split(';'))));
});
test('corrections retain original values, reset explicitly and reject AI scope changes',()=>{
 let edits=setCorrection([],elements[0],'name','Viga 1');edits=setCorrection(edits,elements[0],'name','Viga 2');assert.equal(edits.length,1);assert.equal(edits[0].original,'Viga');assert.deepEqual(correctionProposals({corrections:edits},elements),edits);
 assert.deepEqual(setCorrection(edits,elements[0],'name','Viga'),[]);
 assert.throws(()=>correctionProposals({corrections:[{...edits[0],field:'ifcClass'}]},elements),/escopo/);assert.throws(()=>correctionProposals({corrections:[{...edits[0],original:'changed'}]},elements),/origem/);
});
test('a second model failure rolls back staging and never commits any model',async()=>{
 const events=[];await assert.rejects(preparationTransaction([1,2],{stage:async n=>{events.push(n);if(n===2)throw Error('invalid');},commit:async()=>events.push('commit'),isCommitted:async()=>false,adopt:async()=>events.push('adopt'),rollback:async()=>events.push('rollback')}),/invalid/);assert.deepEqual(events,[1,2,'rollback']);
});
test('save failure preserves current state; post-commit history failure still adopts saved revision',async()=>{
 for(const committed of [false,true]){const events=[],promise=preparationTransaction([1,2],{stage:async n=>{events.push(n);},commit:async()=>{throw Error('disk');},isCommitted:async()=>committed,adopt:async()=>{events.push('adopt');},rollback:async()=>{events.push('rollback');}});if(committed)assert.match(await promise,/histórico/);else await assert.rejects(promise,/disk/);assert.equal(events.at(-1),committed?'adopt':'rollback');}
});
