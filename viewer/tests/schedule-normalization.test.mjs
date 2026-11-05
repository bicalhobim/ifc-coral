import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeScheduleCsv,normalizedScheduleCsv,decodeScheduleCsv} from '../src/ifc/schedule-normalization.ts';
import {guessMapping,mapCsv} from '../src/ifc/schedule-pipeline.ts';
const source='Navisworks_User1,Predecessoras,Nome,Duração,Início,Término,Navisworks_Task_Type\n,,Resumo,100 dias,Ter 01/10/24,Ter 05/11/24,\nTerreno,2,Limpeza,15 dias,Ter 01/10/24,Qua 16/10/24,Temporary\nTerreno,3,Outra frente,10 dias,Sáb 26/10/24,Ter 05/11/24,Construct';
const mapping=guessMapping(source.split('\n')[0].split(','));
test('Navisworks association codes are preserved and never guessed as unique IDs',()=>{
 assert.equal(mapping.id,-1);const n=normalizeScheduleCsv(source,mapping);
 assert.equal(n.rows.length,3);assert.equal(n.ids.length,3);assert.deepEqual(n.rows.map(r=>r.id),['CSV-000001','CSV-000002','CSV-000003']);
 assert.equal(n.originalRows[1][0],'Terreno');assert.equal(n.originalRows[1][1],'2');assert.equal(n.rows[0].name,'Resumo');
 const forced=normalizeScheduleCsv(source,{...mapping,id:0});assert.deepEqual(forced.rows,n.rows);
 const text=normalizedScheduleCsv(n),headers=text.split('\r\n')[0].replace(/^\uFEFF/,'').split(';').map(h=>h.replaceAll('"',''));
 assert.deepEqual(mapCsv(text,guessMapping(headers)),n.rows);assert.ok(text.includes('origem_Predecessoras'));
});
test('IDs are generated without collision; all validation problems are reported together',()=>{
 const csv='id;atividade;inicio;fim\nCSV-000002;A;01/10/24;02/10/24\n;B;01/10/24;02/10/24\nX;C;01/10/24;02/10/24\nX;D;01/10/24;02/10/24';
 const m=guessMapping(csv.split('\n')[0].split(';')),n=normalizeScheduleCsv(csv,m);
 assert.equal(n.rows[0].id,'CSV-000002');assert.equal(n.rows[1].id,'CSV-000002-2');assert.equal(new Set(n.rows.map(r=>r.id)).size,4);
 assert.deepEqual(normalizeScheduleCsv(csv,m),n);
 assert.throws(()=>normalizeScheduleCsv(csv.replace(';B;01/10/24',';;31/02/24'),m),e=>/nome ausente/.test(e.message)&&/Data inválida/.test(e.message)&&/Nenhuma linha foi descartada/.test(e.message));
});
test('Windows-1252 is detected automatically; UTF-8 keeps accents',()=>{
 assert.equal(decodeScheduleCsv(new Uint8Array([73,110,237,99,105,111])).text,'Início');assert.equal(decodeScheduleCsv(new Uint8Array([73,110,237,99,105,111])).encoding,'windows-1252');
 assert.deepEqual(decodeScheduleCsv(new TextEncoder().encode('Início')),{text:'Início',encoding:'utf-8'});
});
