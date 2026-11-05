import test from 'node:test';
import assert from 'node:assert/strict';
import {Matrix4,Vector3} from 'three';
import {alignThreePoints} from '../src/ifc/alignment.ts';
import {createProject,parseProject,serializeProject} from '../src/production/project.ts';

test('três pares aplicam deslocamento sem alterar dimensões',()=>{
 const a=alignThreePoints([[0,0,0],[2,0,0],[0,0,3]],[[10,-4,2],[12,-4,2],[10,-4,5]]);
 const m=new Matrix4().fromArray(a.matrix);
 assert.deepEqual(new Vector3(1,0,1).applyMatrix4(m).toArray(),[11,-4,3]);
 const p=createProject();p.display={gridElevation:-4,alignments:{modelo:a}};
 assert.deepEqual(parseProject(serializeProject(p)).display,p.display);
});

test('rejeita três pontos incompatíveis, sem deformar o IFC',()=>{
 assert.throws(()=>alignThreePoints([[0,0,0],[1,0,0],[0,0,1]],[[0,0,0],[2,0,0],[0,0,1]]),/deslocamento rígido/);
 assert.throws(()=>alignThreePoints([[0,0,0],[1,0,0],[2,0,0]],[[0,0,0],[1,0,0],[2,0,0]]),/alinhados/);
});

test('deslocamento de elemento é salvo por modelo e GlobalId',()=>{
 const p=createProject(),matrix=alignThreePoints([[0,0,0],[1,0,0],[0,0,1]],[[3,2,1],[4,2,1],[3,2,2]]).matrix;
 p.models.push({id:'modelo',hash:'a'.repeat(64),name:'Modelo IFC',projectGlobalId:'projeto'});
 p.display={gridElevation:0,elementAlignments:{modelo:{ElementoA:matrix}}};
 assert.deepEqual(parseProject(serializeProject(p)).display?.elementAlignments,p.display.elementAlignments);
 const orphan=structuredClone(p);orphan.display.elementAlignments.outro={ElementoB:matrix};
 assert.throws(()=>serializeProject(orphan),/Projeto inválido/);
 const scaled=structuredClone(p);scaled.display.elementAlignments.modelo.ElementoA[0]=2;
 assert.throws(()=>serializeProject(scaled),/Projeto inválido/);
});
