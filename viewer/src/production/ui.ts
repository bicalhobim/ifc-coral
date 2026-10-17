import type {Project,WorkPackage} from './types.ts';
import {uid,log} from './project.ts';
import {assessReadiness,packageBalance,resolveConstraint,allocate,freezeWeek,recordActual,calculatePPC,supplyWindow,quoteTotal,recordDelivery} from './planning.ts';
import {addConcreteCase} from './case.ts';
import {mountAI} from './ai-ui.ts';
import {helpButton,simplifyExplanations} from '../ui/help.ts';
type Hooks={getProject:()=>Project;change:(fn:(p:Project)=>void)=>void;selection:()=>string[];select:(pkg:WorkPackage)=>void;review:(pkg:WorkPackage)=>boolean;loadDemo:()=>void};
export function el<K extends keyof HTMLElementTagNameMap>(tag:K,text='',cls=''){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;}
function btn(text:string,action:()=>void,cls=''){const b=el('button',text,cls);b.type='button';b.onclick=action;return b;}
function field(label:string,value:string,type='text'){
 const l=el('div','','field'),heading=el('div','','field-heading'),caption=el('label',label);
 const multiline=/^(Evidência|Origem|Critério|Causa|Romaneio)/.test(label);
 const i=multiline?el('textarea'):el('input');
 i.id=`field-${uid()}`;caption.htmlFor=i.id;
 if(i instanceof HTMLInputElement){i.type=type;if(type==='number'){i.min='0';i.step='any';}}else i.rows=2;
 i.value=value;heading.append(caption);
 const tips:Record<string,string>={
 'Quantidade de concreto (m³)':'No caso didático, use 12 m³. Essa quantidade é uma premissa, não um cálculo extraído do IFC.',
 'Origem / premissa da quantidade':'Registre a fonte do quantitativo e o que a equipe conferiu. Quantidade proposta pela IA exige conferência técnica.',
 'Necessidade / concretagem':'Data em que o concreto precisa estar na frente de trabalho. A janela de entrega deve ser confirmada pelo fornecedor.',
 'Prazo de conclusão':'Data limite para cumprir integralmente o critério que será congelado no compromisso semanal.',
 'Critério verificável de conclusão':'Descreva o que será conferido no fim. Exemplo: concretagem integral, verificada e aceita até o prazo.',
 'Conferente das evidências':'Pessoa que verificou as condições. Remover uma restrição requer evidência e conferente.',
 'Local / frente':'Confira os limites na geometria e na árvore. A divisão do cronograma pode ser diferente da estrutura espacial do IFC.'};
 if(tips[label])heading.append(helpButton(label,tips[label]));
 l.append(heading,i);return {label:l,input:i};
}
function check(label:string,checked:boolean){const l=el('label','','check');const i=el('input');i.type='checkbox';i.checked=checked;l.append(i,document.createTextNode(label));return {label:l,input:i};}
const money=(v:number)=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export class ProductionPanel{
 readonly element=el('section','','workshop');private tab='Produção';private selected='';private reviewer='';
 private hooks:Hooks;private error='';private lastTab='';private expandedSupplies=new Set<string>();private projectId='';
 constructor(hooks:Hooks){this.hooks=hooks;this.render();}
 private action(fn:(p:Project)=>void){
 try{this.hooks.change(fn);this.error='';this.render();}
 catch(e){this.error=e instanceof Error?e.message:String(e);const body=this.element.querySelector('.work-body');body?.querySelector('[role=alert]')?.remove();const error=el('p',this.error,'notice error');error.setAttribute('role','alert');body?.prepend(error);error.scrollIntoView({block:'nearest'});}
 }
 render(){
 const p=this.hooks.getProject();if(p.id!==this.projectId){this.projectId=p.id;this.tab='Produção';this.selected='';this.reviewer='';this.lastTab='';this.error='';this.expandedSupplies.clear();}const previousScroll=this.lastTab===this.tab?(this.element.querySelector('.work-body')?.scrollTop??0):0;this.lastTab=this.tab;this.element.replaceChildren();
 const nav=el('nav','','work-nav');nav.setAttribute('aria-label','Ciclo da oficina');
 for(const [index,tab] of ['Produção','Suprimentos','Semana / PPC','IA'].entries()){const item=btn(tab,()=>{this.tab=tab;this.render();},tab===this.tab?'active':'');item.setAttribute('aria-current',tab===this.tab?'step':'false');item.setAttribute('aria-label',tab);item.dataset.step=String(index+1).padStart(2,'0');nav.append(item);}
 this.element.append(nav);const body=el('div','','work-body');this.element.append(body);
 if(this.error){const error=el('p',this.error,'notice error');error.setAttribute('role','alert');body.append(error);}
 if(!p.packages.length){
 body.classList.add('welcome');
 body.append(el('p','OFICINA DE PLANEJAMENTO','eyebrow'),el('h1','Sua próxima concretagem, sob controle.'),el('p','Prepare a frente, confirme o fornecimento e assuma compromissos com evidências.','welcome-copy'));
 const journey=el('ol','','journey');for(const title of ['Escolher o local e o serviço','Conferir as restrições','Preparar o fornecimento','Comparar promessa e resultado'])journey.append(el('li',title));body.append(journey);
 if(!p.tasks.length)body.append(btn('Abrir modelo de exemplo',()=>this.hooks.loadDemo(),'primary'));
 else body.append(btn('Criar caso de concretagem',()=>this.action(x=>addConcreteCase(x,x.tasks)),'primary'),btn('Criar pacote da seleção 4D',()=>this.createFromSelection()));
 body.append(el('p','Exercício didático com TORRE02. Quantidades e propostas do caso são fictícias.','simulation-note'));return;}
 const select=el('select');select.setAttribute('aria-label','Pacote de trabalho');
 for(const pkg of p.packages){const op=el('option',pkg.name);op.value=pkg.id;select.append(op);}
 if(!p.packages.some(x=>x.id===this.selected))this.selected=p.packages[0].id;
 select.value=this.selected;select.onchange=()=>{this.selected=select.value;this.render();};
 const top=el('div','','package-picker');top.append(select,btn('+ Pacote da seleção',()=>this.createFromSelection()));body.append(top);
 const pkg=p.packages.find(x=>x.id===this.selected)!;const readiness=assessReadiness(p,pkg);
 body.append(el('p',`${pkg.location} · ${pkg.service}`,'eyebrow'),el('h2',pkg.name),el('p',p.week?.commitments.some(c=>c.packageId===pkg.id)?(readiness.ready?'COMPROMISSO REGISTRADO · CONDIÇÕES ATUAIS ATENDIDAS':'COMPROMISSO REGISTRADO · REVISAR CONDIÇÕES ATUAIS'):(readiness.ready?'PRONTO PARA COMPROMISSO':'PREPARAR ANTES DE PROMETER'),readiness.ready?'badge good':'badge warn'));
 if(this.tab==='Produção')this.production(body,pkg,p);
 if(this.tab==='Suprimentos')this.supply(body,pkg,p);
 if(this.tab==='Semana / PPC')this.week(body,pkg,p);
 if(this.tab==='IA')mountAI(body,()=>this.hooks.getProject());
 simplifyExplanations(body);body.scrollTop=previousScroll;
 }
 private createFromSelection(){this.action(p=>{
 const ids=this.hooks.selection();const tasks=p.tasks.filter(t=>ids.includes(t.id));if(!tasks.length)throw new Error('Selecione uma tarefa ou grupo no Gantt antes de criar o pacote.');
 const first=tasks[0];const elements=Array.from(new Map(tasks.map(t=>[JSON.stringify([t.modelId,t.globalId]),{modelId:t.modelId,globalId:t.globalId}])).values());
 const pkg:WorkPackage={id:uid(),name:first.name,location:first.location,service:first.service,elements,taskIds:ids,quantity:null,unit:'m³',coverageKnown:false,quantitySource:'Quantidade ainda não conferida. Recorte desta versão: concreto em m³.',needDate:first.start,finishDate:first.finish,criterion:'',responsible:'',capacityConfirmed:false,reviewRequired:false,constraints:['Projeto','Frente e predecessoras','Equipe e equipamento','Suprimento'].map(description=>({id:uid(),category:description,description,resolved:false,evidence:'',reviewer:''}))};p.packages.push(pkg);this.selected=pkg.id;log(p,'Pacote criado',pkg.name);
 });}
 private production(body:HTMLElement,pkg:WorkPackage,p:Project){
 body.append(el('p','Planeje por local e serviço. O pavimento do IFC ajuda a localizar; o pacote é uma decisão da equipe, não uma EAP gerada automaticamente.','lead'));
 const origin=p.tasks.find(t=>pkg.taskIds.includes(t.id));if(origin)body.append(el('p',`Origem IFC: ${origin.start} → ${origin.finish}. As datas abaixo pertencem ao cenário de trabalho.`,'notice'));
 const fields=[field('Nome do pacote',pkg.name),field('Local / frente',pkg.location),field('Serviço',pkg.service),field('Responsável',pkg.responsible),field('Quantidade de concreto (m³)',pkg.quantity===null?'':String(pkg.quantity),'number'),field('Origem / premissa da quantidade',pkg.quantitySource),field('Necessidade / concretagem',pkg.needDate,'date'),field('Prazo de conclusão',pkg.finishDate,'date'),field('Critério verificável de conclusão',pkg.criterion)];
 const grid=el('div','','form-grid');grid.append(...fields.map(f=>f.label));const capacity=check('Capacidade de equipe e equipamento conferida',pkg.capacityConfirmed);grid.append(capacity.label);body.append(grid);
 body.append(btn('Salvar definição do pacote',()=>this.action(x=>{const t=x.packages.find(q=>q.id===pkg.id)!;Object.assign(t,{name:fields[0].input.value,location:fields[1].input.value,service:fields[2].input.value,responsible:fields[3].input.value,quantity:fields[4].input.value===''?null:Number(fields[4].input.value),quantitySource:fields[5].input.value,needDate:fields[6].input.value,finishDate:fields[7].input.value,criterion:fields[8].input.value,capacityConfirmed:capacity.input.checked});log(x,'Pacote atualizado',t.name);}), 'primary'));
 body.append(btn(`Realçar ${pkg.elements.length} elementos no modelo`,()=>this.hooks.select(pkg)),el('p','Local inicial do pacote: hierarquia de planejamento Summary3, quando disponível. Confira-o contra a geometria e a árvore espacial; classificações do IFC podem divergir da divisão de produção.','fine'));
 if(pkg.reviewRequired)body.append(btn('Conferir vínculos da revisão',()=>this.action(x=>{if(!this.hooks.review(pkg))throw new Error('Há elementos ou tarefas ausentes na revisão; reveja o pacote.');x.packages.find(q=>q.id===pkg.id)!.reviewRequired=false;log(x,'Vínculos conferidos',pkg.name);}),'warning'));
 body.append(el('h3','Restrições da frente'),el('p','Remover uma restrição exige uma evidência e quem a conferiu. Ex.: liberação de armação assinada; reserva da bomba; confirmação da janela de concreto.'));
 const reviewer=field('Conferente das evidências',this.reviewer);reviewer.input.oninput=()=>this.reviewer=reviewer.input.value;body.append(reviewer.label);
 for(const c of pkg.constraints){const card=el('article','','constraint');card.append(el('strong',c.description),el('span',c.resolved?'Removida com evidência':'Pendente',c.resolved?'badge good':'badge warn'));
 if(c.resolved)card.append(el('p',`${c.evidence} · Conferido por ${c.reviewer}`),btn('Reabrir restrição',()=>this.action(x=>{const q=x.packages.find(q=>q.id===pkg.id)!.constraints.find(q=>q.id===c.id)!;q.resolved=false;log(x,'Restrição reaberta',q.description);})));else{const evidence=field(`Evidência — ${c.description}`,c.evidence);card.append(evidence.label,btn('Conferir e remover',()=>this.action(x=>resolveConstraint(x,pkg.id,c.id,evidence.input.value,this.reviewer))));}body.append(card);}
 }
 private supply(body:HTMLElement,pkg:WorkPackage,p:Project){
 const balance=packageBalance(p,pkg),dates=supplyWindow(pkg.needDate,2,1);
 const known=check('Conferi estoque e pedidos existentes (concreto fresco não tem estoque antecipado)',pkg.coverageKnown);
 known.input.onchange=()=>this.action(x=>{x.packages.find(q=>q.id===pkg.id)!.coverageKnown=known.input.checked;log(x,'Cobertura conferida',pkg.name);});body.append(known.label);
 body.append(el('p','Pacote de fornecimento · concreto usinado','eyebrow'),el('p','A necessidade vem da produção. A compra precisa chegar à frente certa, na janela certa, com a especificação conferida.','lead'),el('p',pkg.quantitySource,'simulation-note'));
 const metrics=el('div','','metrics');for(const [label,value]of [['Demanda',pkg.quantity===null?'Desconhecida':`${pkg.quantity} m³`],['Cobertura elegível',`${balance.covered} m³`],['Saldo a cobrir',balance.balance===null?'A conferir':`${balance.balance} m³`]])metrics.append(this.metric(label,value));body.append(metrics);
 const timeline=el('div','','timeline');for(const [label,value]of [['Iniciar compra',dates.start],['Emitir pedido',dates.order],['Entrega prevista',dates.delivery],['Necessidade na frente',dates.need]])timeline.append(this.metric(label,value));body.append(timeline,el('p','Cenário: 2 dias corridos de fornecimento + 1 dia de preparação. Sem calendário de feriados. Concreto fresco exige janela de entrega; não conta como estoque antecipado.','fine'));
 if(balance.excess>0)body.append(el('p',`Atenção: ${balance.excess} m³ de excesso de cobertura. Reveja reservas.`,'notice warn'));
 for(const s of p.supplies){const card=el('details','','supply-card');card.dataset.supplier=s.name;card.open=this.expandedSupplies.has(s.id);card.ontoggle=()=>{if(card.open)this.expandedSupplies.add(s.id);else this.expandedSupplies.delete(s.id);};const summary=el('summary');summary.append(el('strong',s.name),el('span',s.quantity===null?'Valor a conferir':money(quoteTotal(s.quantity,s.unitPrice,s.freight)),'quote-total'),el('small',(s.synthetic?'Simulação · ':'')+(s.delivery!==pkg.needDate?'Fora da janela':s.confirmed?'Janela confirmada':'A confirmar')));card.append(summary);card.append(el('span',s.synthetic?'COTAÇÃO FICTÍCIA':'INFORMADO PELO USUÁRIO','badge'),el('p',`${s.quantity??'?'} m³ × ${money(s.unitPrice)} + ${money(s.freight)} = ${s.quantity===null?'A conferir':money(quoteTotal(s.quantity,s.unitPrice,s.freight))}`,'price'));
 const qty=field(`Quantidade — ${s.name}`,s.quantity===null?'':String(s.quantity),'number'),date=field(`Entrega prometida — ${s.name}`,s.delivery,'date'),evidence=field(`Evidência — ${s.name}`,s.evidence),technical=check('Especificação técnica conferida',s.technical),confirmed=check('Fornecedor confirmou esta janela e quantidade',s.confirmed);
 card.append(qty.label,date.label,technical.label,confirmed.label,evidence.label,btn('Salvar proposta / confirmação',()=>this.action(x=>{Object.assign(x.supplies.find(q=>q.id===s.id)!,{quantity:qty.input.value===''?null:Number(qty.input.value),delivery:date.input.value,evidence:evidence.input.value,technical:technical.input.checked,confirmed:confirmed.input.checked});log(x,'Proposta atualizada',s.name);})));const reserved=p.allocations.filter(a=>a.supplyId===s.id).reduce((n,a)=>n+a.quantity,0);
 const reserve=field(`Reservar m³ — ${s.name}`,String(Math.max(0,(pkg.quantity??0)-balance.covered)),'number');card.append(el('p',`Já reservado neste projeto: ${reserved} m³. ${s.delivery!==pkg.needDate?'Entrega fora da data de necessidade.':''}`),reserve.label,btn('Reservar para este pacote',()=>this.action(x=>allocate(x,pkg.id,s.id,Number(reserve.input.value)))));body.append(card);}
 for(const a of p.allocations.filter(a=>a.packageId===pkg.id)){
 body.append(el('p',`Reserva: ${a.quantity} m³ · ${p.supplies.find(s=>s.id===a.supplyId)?.name}`),btn('Liberar esta reserva',()=>this.action(x=>{if(x.deliveries.some(d=>d.allocationId===a.id))throw new Error('Reserva com recebimento não pode ser apagada. Preserve o histórico.');x.allocations=x.allocations.filter(q=>q.id!==a.id);log(x,'Reserva liberada',a.id);})));
 this.delivery(body,pkg,p,a.id);
 }body.append(el('p','Comparar propostas prepara a decisão. Nenhum pedido, contato ou pagamento é enviado pelo aplicativo. Diferença de cotação não é economia realizada.','notice'));
 }
 private delivery(body:HTMLElement,pkg:WorkPackage,p:Project,allocationId:string){
 const card=el('article','','constraint');card.append(el('h3','Recebimento e liberação desta reserva'));
 for(const d of p.deliveries.filter(d=>d.allocationId===allocationId))card.append(el('p',`${d.date}: ${d.received} m³ recebidos; ${d.rejected} rejeitados; ${d.received-d.rejected} liberados. ${d.date!==pkg.needDate?'FORA DA JANELA.':''} ${d.evidence} · ${d.reviewer}`));
 const date=field('Data efetiva de recebimento',pkg.needDate,'date'),received=field('Quantidade recebida (m³)','','number'),rejected=field('Quantidade rejeitada (m³)','0','number'),evidence=field('Romaneio / evidência de liberação',''),reviewer=field('Conferente do recebimento',this.reviewer);
 card.append(date.label,received.label,rejected.label,evidence.label,reviewer.label,btn('Registrar recebimento e liberação',()=>this.action(x=>recordDelivery(x,{allocationId,date:date.input.value,received:Number(received.input.value),rejected:Number(rejected.input.value),evidence:evidence.input.value,reviewer:reviewer.input.value}))));body.append(card);
 }
 private metric(label:string,value:string){const card=el('div','','metric');card.append(el('small',label),el('strong',value));return card;}
 private week(body:HTMLElement,pkg:WorkPackage,p:Project){
 const result=calculatePPC(p),ready=assessReadiness(p,pkg);body.append(el('h3','Compromissos e resultado'));
 const metrics=el('div','','metrics');metrics.append(this.metric('PPC',result.percent===null?'Não aplicável':`${result.percent}%`),this.metric('Concluídos no prazo',String(result.completed)),this.metric('Compromissos congelados',String(result.total)));body.append(metrics);
 if(!p.week){body.append(el('p','Selecione os pacotes prontos. Congelar preserva o prazo, o responsável e o critério originais; reprogramações posteriores não diminuem o denominador.','notice'));const checks=p.packages.map(q=>({q,c:check(`${q.name} — ${assessReadiness(p,q).ready?'Pronto':'Bloqueado'}`,q.id===pkg.id)}));body.append(...checks.map(x=>x.c.label));const reviewer=field('Responsável pelo plano semanal',this.reviewer);body.append(reviewer.label,btn('Assumir compromissos e congelar semana',()=>this.action(x=>freezeWeek(x,checks.filter(x=>x.c.input.checked).map(x=>x.q.id),reviewer.input.value)),'primary'));if(!ready.ready){const list=el('ul');ready.reasons.forEach(r=>list.append(el('li',r)));body.append(list);}return;}
 body.append(el('p',`Semana congelada por ${p.week.reviewer} em ${new Date(p.week.frozenAt).toLocaleString('pt-BR')}. PPC = compromissos integralmente concluídos no prazo ÷ compromissos assumidos × 100. Execução não é inferida pela data de hoje.`,'notice'));
 for(const c of p.week.commitments){const q=p.packages.find(q=>q.id===c.packageId)!;const actual=p.actuals.find(a=>a.packageId===q.id);const card=el('article','','constraint');card.append(el('h3',c.name),el('p',`${c.location} · ${c.quantity} ${c.unit} · ${c.responsible} · Prazo: ${c.deadline}`),el('p',`Critério congelado: ${c.criterion}`));const completed=check('Critério integralmente cumprido e conferido',actual?.complete??false),date=field(`Data realizada — ${q.name}`,actual?.date??c.deadline,'date'),evidence=field(`Evidência do realizado — ${q.name}`,actual?.evidence??''),reason=field(`Causa de desvio / correção — ${q.name}`,actual?.reason??'');card.append(completed.label,date.label,evidence.label,reason.label,btn('Registrar realizado',()=>this.action(x=>recordActual(x,q.id,{complete:completed.input.checked,date:date.input.value,evidence:evidence.input.value,reason:reason.input.value})),'primary'));body.append(card);}
 const audit=el('details');audit.append(el('summary',`Histórico de decisões (${p.audit.length})`));for(const a of p.audit.slice(-40).reverse())audit.append(el('p',`${new Date(a.at).toLocaleTimeString('pt-BR')} · ${a.action}: ${a.detail}`,'fine'));body.append(audit);
 }
}
