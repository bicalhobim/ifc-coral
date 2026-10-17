import {test} from 'node:test';import assert from 'node:assert/strict';
import {csvCell} from '../src/ui/csv.ts';
test('IFC text cannot become spreadsheet formula in CSV',()=>{
 for(const value of ['=1+1','+SUM(A1:A2)','-1+1','@SUM(A1:A2)','\t=1+1','  =1+1'])assert.ok(csvCell(value).startsWith('"\''));
 assert.equal(csvCell('Concretagem "P1"'),'"Concretagem ""P1"""');
});
