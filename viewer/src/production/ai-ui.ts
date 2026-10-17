import type {Project} from './types.ts';
import {listModels,requestAdvice,adviceSnapshot,type Provider} from './ai.ts';
// Segredo vive apenas neste módulo em memória. Nunca vai para o projeto, logs ou storage.
let provider:Provider='gemini',key='',model='',answer='',busy=false;
function e(tag:string,text=''){const n=document.createElement(tag);n.textContent=text;return n;}
export function mountAI(root:HTMLElement,getProject:()=>Project){
 root.append(e('h3','IA como apoio à decisão'),e('p','Analise restrições, compras e decisões. A IA propõe; a equipe confere. O ciclo de planejamento funciona sem chave.'));
 const form=e('div');form.className='form-grid';root.append(form);
 const label=(text:string,input:HTMLElement)=>{const l=e('label',text);l.className='field';l.append(input);form.append(l);};
 const providerInput=document.createElement('select');for(const v of ['gemini','openai']){const o=document.createElement('option');o.value=v;o.textContent=v==='gemini'?'Gemini':'OpenAI';providerInput.append(o);}providerInput.value=provider;providerInput.onchange=()=>{provider=providerInput.value as Provider;key='';model='';secret.value='';modelInput.value='';};label('Provedor',providerInput);
 const secret=document.createElement('input');secret.type='password';secret.autocomplete='off';secret.value=key;secret.oninput=()=>key=secret.value;label('Chave individual (somente nesta sessão)',secret);
 const modelInput=document.createElement('input');modelInput.value=model;modelInput.setAttribute('list','ai-models');modelInput.oninput=()=>model=modelInput.value;label('Modelo disponível na sua conta',modelInput);const list=document.createElement('datalist');list.id='ai-models';form.append(list);
 const context=document.createElement('select');for(const [v,text]of [['restricoes','Analisar restrições'],['compras','Comparar fornecimentos'],['auditoria','Auditar coerência das decisões']]){const o=document.createElement('option');o.value=v;o.textContent=text;context.append(o);}label('Apoio solicitado',context);
 const status=e('p','');status.setAttribute('role','status');const result=e('pre',answer);result.className='ai-answer';
 const models=e('button','Consultar modelos');const run=e('button',busy?'Consultando…':'Solicitar análise com minha chave');run.className='primary';run.setAttribute('type','button');(run as HTMLButtonElement).disabled=busy;
 models.onclick=async()=>{try{status.textContent='Consultando modelos…';const items=await listModels(provider,key);list.replaceChildren(...items.map(id=>{const o=document.createElement('option');o.value=id;return o;}));status.textContent=`${items.length} modelos disponíveis. Escolha um modelo de texto. Nenhuma análise foi gerada.`;}catch(e){status.textContent=e instanceof Error?e.message:String(e);}};
 run.onclick=async()=>{busy=true;(run as HTMLButtonElement).disabled=true;status.textContent='Consultando o provedor escolhido…';try{answer=await requestAdvice(provider,key,model,context.value,getProject());result.textContent=answer;status.textContent='Proposta gerada. Revise antes de usar; nenhuma decisão do projeto foi alterada.';}catch(e){status.textContent=e instanceof Error?e.message:String(e);}finally{busy=false;(run as HTMLButtonElement).disabled=false;}};
 const clear=e('button','Esquecer chave');clear.onclick=()=>{key='';secret.value='';status.textContent='Chave removida da sessão.';};
 const preview=e('details');preview.append(e('summary','Ver os dados que serão enviados'),e('pre',JSON.stringify(adviceSnapshot(getProject()),null,2)));preview.className='ai-preview';
 root.append(e('p','Ao solicitar a análise, os dados do pacote e das propostas exibidos abaixo serão enviados ao provedor escolhido e poderão consumir créditos da sua API. Não envie informações confidenciais neste laboratório.'),preview,models,run,clear,status,result);
}
