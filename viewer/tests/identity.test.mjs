import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDate,buildSchedule} from '../src/ifc/schedule.ts';
import {taskGroupKey, taskIdentity} from '../src/ifc/identity.ts';
test('dates reject impossible calendar values and keep ISO date local',()=>{
  assert.equal(parseDate('31/02/2026'),null);
  assert.equal(parseDate('2026-02-30'),null);
  assert.equal(parseDate('2026-11-06').getDate(),6);
  assert.equal(parseDate('29/02/2024').getDate(),29);
  assert.equal(parseDate('2026-02-31T00:00:00Z'),null);
  assert.equal(parseDate('2026-11-06T00:00:00Z').getDate(),6);
});
const base={modelKey:'m1',globalId:'guid1',sourceTaskKey:'Task3',name:'Concretagem',storey:'P1',building:'T2',eap:'Laje',start:new Date(2026,10,6),finish:new Date(2026,10,7)};
test('homonyms differ across location, model, dates or service; identical rows can aggregate',()=>{
 for (const diff of [{storey:'P2'},{modelKey:'m2'},{sourceTaskKey:'Task4'},{start:new Date(2026,10,8)},{eap:'Pilar'}]) assert.notEqual(taskGroupKey(base),taskGroupKey({...base,...diff}));
 assert.equal(taskGroupKey(base),taskGroupKey({...base,globalId:'guid2'}));
});
test('persistent element-task key never uses runtime localId or display name',()=>{
 assert.equal(taskIdentity(base),taskIdentity({...base,localId:999,name:'Renomeada'}));
 assert.notEqual(taskIdentity(base),taskIdentity({...base,globalId:'guid2'}));
});
test('Fragments GUID mapping is used even when GlobalId attribute is not returned',async()=>{
 const model={modelId:'m',getItemsOfCategories:async()=>({IFCSLAB:[22]}),getGuidsByLocalIds:async()=>['real-guid'],getItemsData:async()=>[{_guid:{value:'real-guid'},Name:{value:'Laje'},pset:[{Name:{value:'Task1'},NominalValue:{value:'Concretagem'}},{Name:{value:'Task1Inicio'},NominalValue:{value:'2026-11-06'}},{Name:{value:'Task1Fim'},NominalValue:{value:'2026-11-06'}}]}]};
 const [task]=await buildSchedule(model,'logical-model');assert.equal(task.globalId,'real-guid');assert.equal(taskIdentity(task),JSON.stringify(['logical-model','real-guid','Task1']));
});
