import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createProject,validateProject,serializeProject,parseProject} from '../src/production/project.ts';
import {sha256} from '../src/production/storage.ts';

test('TORRE02 template creates independent projects with bundled IFC and no pre-assumed commitments',async()=>{
 const {torreTemplate}=await import('../src/workspace/templates.ts');
 const bytes=new Uint8Array(await readFile(new URL('../public/models/TORRE02_ESTRUTURA_4D.ifc',import.meta.url)));
 const first=await torreTemplate(bytes),second=await torreTemplate(bytes);
 validateProject(first.project);validateProject(second.project);
 assert.equal(first.project.templateId,'torre02');
 assert.notEqual(first.project.id,second.project.id);
 assert.equal(first.project.models.length,1);
 const model=first.project.models[0];
 assert.equal(model.name,'TORRE02_ESTRUTURA_4D.ifc');assert.equal(model.hash,await sha256(bytes));
 assert.ok(model.projectGlobalId);assert.deepEqual(first.bytes.get(model.id),bytes);
 assert.equal(first.project.packages.length,0);assert.equal(first.project.week,null);
 assert.equal(first.project.supplies.length,0);
 first.bytes.get(model.id)[0]=0;assert.notEqual(second.bytes.get(model.id)[0],0);
});

test('blank projects are neutral and never inherit a template based on model or project names',async()=>{
 const {isTeachingProject}=await import('../src/workspace/context.ts');
 const p=createProject();assert.equal(p.name,'Novo projeto');
 assert.equal(isTeachingProject(p),false);assert.equal(p.models.length,0);assert.equal(p.packages.length,0);
 p.name='Primeiro exercício — TORRE02';
 p.models.push({id:'model',name:'TORRE02_ESTRUTURA_4D.ifc',hash:'885c3b3ace554f9e3091d611645cccac875a583241d5971c57703bb4a36030dc',projectGlobalId:'project'});
 assert.equal(isTeachingProject(p),false);
 assert.equal(isTeachingProject(parseProject(serializeProject(p))),false);
});

test('template context survives save and copy; invalid template identifiers are rejected',async()=>{
 const {isTeachingProject}=await import('../src/workspace/context.ts');
 const p=createProject();p.templateId='torre02';
 assert.equal(isTeachingProject(parseProject(serializeProject(p))),true);
 const copy=structuredClone(p);copy.id=crypto.randomUUID();assert.equal(isTeachingProject(copy),true);
 p.templateId='unsupported';assert.throws(()=>validateProject(p));
});

test('template refuses invalid model content',async()=>{
 const {torreTemplate}=await import('../src/workspace/templates.ts');
 await assert.rejects(()=>torreTemplate(new TextEncoder().encode('<html>missing</html>')),/IFC/i);
});

test('Explore and Pratique open independent copies with distinct teaching intent',async()=>{
 const {torreTemplate}=await import('../src/workspace/templates.ts');
 const bytes=new Uint8Array(await readFile(new URL('../public/models/TORRE02_ESTRUTURA_4D.ifc',import.meta.url)));
 const explore=await torreTemplate(bytes,'explore'),practice=await torreTemplate(bytes,'e02');
 assert.notEqual(explore.project.id,practice.project.id);
 assert.equal(explore.project.templateId,'explore');assert.equal(practice.project.templateId,'e02');
 assert.equal(practice.project.packages.length,0);assert.equal(practice.project.supplies.length,0);
 assert.equal(practice.project.models[0].hash,explore.project.models[0].hash);
 explore.bytes.values().next().value[0]=0;assert.notEqual(practice.bytes.values().next().value[0],0);
 validateProject(explore.project);validateProject(practice.project);
});

test('blank project settings survive copy without teaching data',()=>{
 const p=createProject();p.settings={client:'Obra fictícia',manager:'Grupo 2',description:'Estudo do curso'};
 const saved=parseProject(serializeProject(p));assert.deepEqual(saved.settings,p.settings);
 assert.equal(saved.models.length,0);assert.equal(saved.packages.length,0);assert.equal(saved.templateId,undefined);
});
