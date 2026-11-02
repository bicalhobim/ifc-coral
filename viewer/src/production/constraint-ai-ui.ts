import type {Project} from './types.ts';
import {analysisContext,applyConstraintAnalysis,parseConstraintAnalysis,analysisCoverage,productionConstraintCategories,type AnalysisContext,type ConstraintAnalysis} from './constraint-analysis.ts';
import {requestConstraintAnalysis,listModels,type Provider} from './ai.ts';
import {requestLocal} from '../workspace/bridge.ts';
import {constraintCategories} from './constraints.ts';

type Engine='codex'|Provider;
// Credentials and unaccepted output are session-only, never project/storage/exports.
let preferred:Engine='codex';
const profiles:Record<Engine,{key:string;model:string}>={codex:{key:'',model:''},openai:{key:'',model:''},gemini:{key:'',model:''}};
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;e.className=cls;return e;};
const button=(text:string,action:()=>void,cls='')=>{const b=node('button',text,cls);b.type='button';b.onclick=action;return b;};
 function field(title:string,value='',multiline=false){const label=node('label',title),input=multiline?node('textarea'):node('input');input.value=value;if(input instanceof HTMLTextAreaElement)input.rows=2;label.append(input);return {label,input};}
type Hooks={getProject:()=>Project;packageId:string;change:(fn:(p:Project)=>void)=>void;updated:()=>void};
export function openConstraintAssistant(hooks:Hooks){
 const dialog=node('dialog','','project-destination constraint-assistant');dialog.setAttribute('aria-label','Preparar restrições com IA');
 const heading=node('div','','constraint-ai-heading'),title=node('h2','Preparar restrições com IA');let controller:AbortController|undefined,busy=false,closed=false;
 const close=()=>{closed=true;controller?.abort();dialog.close();dialog.remove();};heading.append(title,button('Fechar',close));
 const content=node('div','','constraint-ai-content'),status=node('p','','constraint-ai-status');status.setAttribute('role','status');status.tabIndex=-1;
 const showStatus=(message:string,error=false)=>{status.textContent=message;status.classList.toggle('error',error);status.setAttribute('role',error?'alert':'status');};
 const top=node('div','','constraint-ai-top');top.append(heading,status);
 let context:AnalysisContext;try{context=analysisContext(hooks.getProject(),hooks.packageId);}catch(e){showStatus(e instanceof Error?e.message:'Não foi possível ler o pacote.',true);dialog.append(top);document.body.append(dialog);dialog.showModal();return;}
 const pkg=context.package;
 content.append(node('p',`${pkg.name} · ${pkg.location} · ${pkg.service}`,'eyebrow'),node('p',`${pkg.quantity===null?'Quantidade a conferir':`${pkg.quantity.toLocaleString('pt-BR')} ${pkg.unit}`} · ${context.elementCount} elementos · ${context.taskCount} atividades`,'constraint-ai-metrics'),node('p',`Origem da quantidade: ${pkg.quantitySource}`),node('p','Projeto, frente, mão de obra, equipamentos, materiais e ambiente: a IA propõe o que conferir em cada área. Revise antes de adicionar ao checklist.','notice'));
 const preview=node('details'),source=node('pre',JSON.stringify(context,null,2));preview.append(node('summary','Conferir os dados que serão enviados'),source);content.append(preview);
 const form=node('div','','constraint-ai-settings'),provider=node('select');provider.setAttribute('aria-label','Motor de IA para restrições');for(const [value,text]of [['codex','Codex deste computador'],['openai','OpenAI — minha chave'],['gemini','Gemini — minha chave']]){const option=node('option',text);option.value=value;provider.append(option);}provider.value=preferred;
 const providerLabel=node('label','Motor de IA');providerLabel.append(provider);form.append(providerLabel);
 const secret=field('Chave de API — somente nesta sessão');if(secret.input instanceof HTMLInputElement)secret.input.type='password';secret.input.autocomplete='off';
 const model=field('Modelo de IA');model.input.autocomplete='off';const modelList=node('datalist');modelList.id=`constraint-ai-models-${crypto.randomUUID()}`;model.input.setAttribute('list',modelList.id);
 const engineHelp=node('p','','fine'),forget=button('Esquecer chave',()=>{profiles[preferred].key='';secret.input.value='';showStatus('Chave removida desta sessão.');});
 const models=button('Consultar modelos da API',()=>{void(async()=>{const engine=provider.value as Engine;if(engine==='codex')return;models.disabled=true;showStatus('Consultando modelos disponíveis…');try{const ids=await listModels(engine,secret.input.value);if(closed)return;modelList.replaceChildren(...ids.map(id=>{const o=node('option');o.value=id;return o;}));showStatus(`${ids.length} modelos retornados. Escolha um modelo de texto com saída estruturada.`);}catch(e){if(!closed)showStatus(e instanceof Error?e.message:'Falha ao consultar modelos.',true);}finally{models.disabled=false;}})();});
 const updateEngine=()=>{preferred=provider.value as Engine;secret.input.value=profiles[preferred].key;model.input.value=profiles[preferred].model;secret.label.hidden=preferred==='codex';models.hidden=preferred==='codex';forget.hidden=preferred==='codex';modelList.replaceChildren();engineHelp.textContent=preferred==='codex'?'Usa o Codex CLI instalado e autenticado neste computador, pelo servidor local. Não lê a conversa aberta nem requer chave de API aqui. A consulta usa a cota da conta Codex.':'Envia somente os dados exibidos acima diretamente ao provedor escolhido. A consulta pode consumir créditos da sua API. Chave mantida apenas em memória.';};provider.onchange=updateEngine;secret.input.oninput=()=>profiles[preferred].key=secret.input.value;model.input.oninput=()=>profiles[preferred].model=model.input.value;updateEngine();
 const refreshCodex=async()=>{check.disabled=true;try{const value=await requestLocal<{available:boolean;message:string;models:string[];defaultModel:string}>('ai-status',{});if(closed)return;if(provider.value==='codex'){modelList.replaceChildren(...value.models.map(id=>{const option=node('option');option.value=id;return option;}));if(!model.input.value&&!busy){model.input.value=value.defaultModel;profiles.codex.model=value.defaultModel;}}showStatus(value.message,!value.available);}catch{if(!closed)showStatus('Serviço local indisponível. Inicie o IFC Coral com npm run dev; a opção Codex precisa do servidor deste computador.',true);}finally{check.disabled=false;}};
 const check=button('Verificar Codex local',()=>{void refreshCodex();});
 form.append(secret.label,model.label,modelList,engineHelp,models,forget,check);content.append(form);
 const result=node('section','','constraint-ai-results'),actions=node('div','','constraint-ai-actions'),reviewer=field('Revisado por'),apply=button('Adicionar selecionadas ao checklist',()=>{} ,'primary');apply.disabled=true;reviewer.label.hidden=true;
 let generated:ConstraintAnalysis|undefined,origin:AnalysisContext|undefined,engine:Engine='codex',usedModel='',generatedAt='';let rows:{selected:HTMLInputElement;category:HTMLSelectElement;description:HTMLInputElement|HTMLTextAreaElement;action:HTMLInputElement|HTMLTextAreaElement;verification:HTMLInputElement|HTMLTextAreaElement}[]=[];
 const run=button('Gerar propostas de restrições',()=>{void generate();},'primary'),cancel=button('Cancelar análise',()=>controller?.abort());cancel.hidden=true;
 const setBusy=(value:boolean)=>{busy=value;run.disabled=value;provider.disabled=value;model.input.disabled=value;secret.input.disabled=value;models.disabled=value;check.disabled=value;cancel.hidden=!value;};
 const renderResult=()=>{
  result.replaceChildren();rows=[];if(!generated||!origin)return;
  result.append(node('h3','Condições para preparar a frente'),node('p',generated.summary),node('p',`${engine} · ${usedModel} · propostas a confirmar, ainda fora do checklist`,'fine'));
  const coverage=node('div','','constraint-ai-coverage');
  for(const area of analysisCoverage(origin,generated)){const badge=node('span',`${area.category} · ${area.count?`${area.count} proposta${area.count===1?'':'s'}`:area.attended?'já atendida no pacote':'a conferir'}`);badge.dataset.attended=String(area.attended&&!area.count);coverage.append(badge);}result.append(coverage);
  const contextNotes=node('details');contextNotes.append(node('summary','Ver fatos e lacunas da análise'));
  for(const [label,items]of [['Fatos registrados',generated.facts],['Lacunas de informação',generated.gaps]] as const){const list=node('ul');items.forEach(text=>list.append(node('li',text)));contextNotes.append(node('h4',label),list);}result.append(contextNotes);
  result.append(node('p','Marque as condições úteis. Ajuste o texto, se necessário. A proposta orienta a conferência; não comprova impedimento ou liberação.','fine'),button('Selecionar todas as propostas',()=>{rows.forEach(r=>r.selected.checked=true);}));
  const categories=[...productionConstraintCategories,...(generated.suggestions.some(s=>s.category==='Outros')?['Outros']:[])];
  for(const family of categories){
   const proposals=generated.suggestions.map((suggestion,index)=>({suggestion,index})).filter(row=>row.suggestion.category===family);if(!proposals.length)continue;
   result.append(node('h4',family,'constraint-ai-family'));
   for(const {suggestion,index} of proposals){
    const card=node('article','','constraint-ai-proposal'),selected=node('input');selected.type='checkbox';selected.setAttribute('aria-label',`Adicionar proposta ${index+1}`);
    const shortTitle=node('strong',suggestion.description),selectLabel=node('label','','check');selectLabel.append(selected,shortTitle);
    const actionLine=node('p'),evidenceLine=node('p'),actionText=node('span',suggestion.action),evidenceText=node('span',suggestion.verification);actionLine.append(node('strong','Como preparar: '),actionText);evidenceLine.append(node('strong','Evidência: '),evidenceText);card.append(selectLabel,actionLine,evidenceLine);
    const edit=node('details');edit.append(node('summary','Ajustar proposta'));const category=node('select');category.setAttribute('aria-label',`Categoria da proposta ${index+1}`);for(const name of constraintCategories){const o=node('option',name);category.append(o);}category.value=suggestion.category;
    const description=field(`Condição proposta ${index+1}`,suggestion.description,true),action=field(`Ação proposta ${index+1}`,suggestion.action,true),verification=field(`Evidência a buscar ${index+1}`,suggestion.verification,true);description.input.maxLength=150;action.input.maxLength=240;verification.input.maxLength=180;
    description.input.oninput=()=>shortTitle.textContent=description.input.value;action.input.oninput=()=>actionText.textContent=action.input.value;verification.input.oninput=()=>evidenceText.textContent=verification.input.value;
    edit.append(category,description.label,action.label,verification.label);card.append(edit);
    const refs=node('details'),list=node('ul');suggestion.basis.forEach(id=>{const name=id==='package'?'Definição e condições do pacote':id.startsWith('task:')?origin?.tasks.find(t=>`task:${t.id}`===id)?.name:id.startsWith('model:')?origin?.models.find(m=>`model:${m.id}`===id)?.name:undefined;list.append(node('li',name??id));});refs.append(node('summary','Justificativa, alcance e fontes'),node('p',suggestion.reason),node('p',`Alcance: ${suggestion.scope==='package'?'todo o pacote':`${suggestion.elements.length} elementos específicos do pacote`}`,'fine'),list);card.append(refs);result.append(card);rows[index]={selected,category,description:description.input,action:action.input,verification:verification.input};
   }
  }
  reviewer.label.hidden=!generated.suggestions.length;apply.disabled=!generated.suggestions.length||!!origin.commitment;if(origin.commitment)result.append(node('p','Este pacote possui compromisso congelado. A análise pode ser consultada, mas este fluxo não altera seu checklist.','notice'));
 };
 async function generate(){
  if(busy)return;setBusy(true);generated=undefined;origin=undefined;result.replaceChildren();apply.disabled=true;reviewer.label.hidden=true;controller=new AbortController();engine=provider.value as Engine;usedModel=model.input.value.trim();
  try{
   if(!usedModel)throw new Error('Informe o nome do modelo antes de gerar.');origin=analysisContext(hooks.getProject(),hooks.packageId);source.textContent=JSON.stringify(origin,null,2);showStatus(engine==='codex'?'Codex analisando o pacote… A consulta pode levar até 3 minutos.':'Consultando o modelo escolhido…');
   if(engine==='codex'){const response=await requestLocal<{analysis:ConstraintAnalysis;model:string;generatedAt:string}>('ai-restrictions',{context:origin,model:usedModel},controller.signal);generated=parseConstraintAnalysis(JSON.stringify(response.analysis),origin);usedModel=response.model;generatedAt=response.generatedAt;}
   else {generated=await requestConstraintAnalysis(engine,secret.input.value,usedModel,origin,controller.signal);generatedAt=new Date().toISOString();}
   if(closed)return;renderResult();showStatus(`${generated.suggestions.length} propostas geradas. Revise, selecione e informe o conferente antes de adicionar.`);result.scrollIntoView({block:'start'});
  }catch(e){if(!closed)showStatus(controller.signal.aborted?'Análise cancelada. Nenhuma condição foi alterada.':e instanceof Error?e.message:'Não foi possível gerar a análise. Confira a conexão.',true);}finally{if(!closed)setBusy(false);}
 }
 apply.onclick=()=>{
  try{
   if(!generated||!origin||busy)return;const edited=structuredClone(generated);rows.forEach((row,i)=>row.selected.checked&&Object.assign(edited.suggestions[i],{category:row.category.value,description:row.description.value,action:row.action.value,verification:row.verification.value}));const chosen=rows.flatMap((row,i)=>row.selected.checked?[i]:[]);
   hooks.change(p=>applyConstraintAnalysis(p,origin!,edited,chosen,{provider:engine,model:usedModel,reviewer:reviewer.input.value,generatedAt}));close();hooks.updated();
  }catch(e){showStatus(e instanceof Error?e.message:'Não foi possível aplicar as propostas.',true);status.focus();}
 };
 actions.append(run,cancel,reviewer.label,apply);dialog.append(top,content,result,actions);dialog.oncancel=e=>{e.preventDefault();close();};document.body.append(dialog);dialog.showModal();if(preferred==='codex')void refreshCodex();
}
