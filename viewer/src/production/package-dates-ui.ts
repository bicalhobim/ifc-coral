import type {Project,ElementRef} from './types.ts';
import type {ServiceDefinition} from './integrated.ts';
import {packageDatePreview,type ServiceDateInput} from './package-dates.ts';
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='')=>{const e=document.createElement(tag);e.textContent=text;return e;};
/** Each service owns its inputs. Toggling services never resets a human edit. */
export function serviceDateFields(host:HTMLElement,p:Project,refs:ElementRef[],service:ServiceDefinition,sourceTaskIds?:string[]){
 const section=node('section'),title=node('h4',service.name+' — previsão do cronograma'),info=node('p'),origin=node('details'),summary=node('summary','Atividades de origem'),list=node('div');origin.append(summary,list);section.className='package-service-date-preview';section.append(title,info);
 const start=node('input'),finish=node('input');start.type=finish.type='date';start.setAttribute('aria-label',`Início de ${service.name}`);finish.setAttribute('aria-label',`Término de ${service.name}`);
 const l1=node('label','Início previsto — editável'),l2=node('label','Término previsto — editável');l1.append(start);l2.append(finish);
 let selectedIds=sourceTaskIds,manualStart=false,manualFinish=false,choiceMade=false;
 const original=packageDatePreview(p,refs,service,sourceTaskIds),chooser=node('select');chooser.setAttribute('aria-label',`Atividade ou janela de ${service.name}`);
 if(original.status==='ambiguous'){chooser.append(new Option('Escolha uma atividade ou janela existente',''));for(const c of original.candidates)chooser.append(new Option(c.label,c.id));chooser.append(new Option('Janela composta de todas as atividades deste serviço (menor início / maior término)','all'));section.append(chooser);}
 const cover=node('input');cover.type='checkbox';cover.setAttribute('aria-label',`Confirmar janela para elementos sem datas de ${service.name}`);const coverLabel=node('label','Confirmar esta janela para os elementos sem datas deste serviço');coverLabel.className='check';coverLabel.prepend(cover);
 const refresh=()=>{const preview=packageDatePreview(p,refs,service,selectedIds,choiceMade);if(!manualStart)start.value=preview.start;if(!manualFinish)finish.value=preview.finish;info.textContent=`${preview.source}. ${preview.criterion}${preview.missing.length?` ${preview.missing.length} de ${refs.length} elementos sem período completo deste serviço; informe só o que falta ou confirme a janela proposta.`:''}`;list.replaceChildren();for(const c of preview.candidates)list.append(node('p',c.label));coverLabel.hidden=preview.status==='missing'||!preview.missing.length;coverLabel.style.display=coverLabel.hidden?'none':'';};
 chooser.onchange=()=>{choiceMade=!!chooser.value;selectedIds=chooser.value==='all'?original.tasks.map(t=>t.id):original.candidates.find(c=>c.id===chooser.value)?.taskIds;cover.checked=false;refresh();};
 start.oninput=()=>manualStart=true;finish.oninput=()=>manualFinish=true;
 const fields=node('div');fields.className='package-service-date-fields';fields.append(l1,l2);section.append(fields,coverLabel,origin);host.append(section);refresh();
 return {read:():ServiceDateInput=>{if(original.status==='ambiguous'&&!choiceMade)throw Error(`Escolha a atividade ou janela de ${service.name}; não é necessário redigitar datas existentes.`);return {needDate:start.value,finishDate:finish.value,manualStart,manualFinish,coverMissing:cover.checked,...(selectedIds?{sourceTaskIds:selectedIds}:{})};}};
}
