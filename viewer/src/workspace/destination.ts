import {chooseDirectory,type DirectoryHandle} from './local.ts';
import type {Project} from '../production/types.ts';
let destinationOpen=false;
type GeneralSettings=NonNullable<Project['settings']>;

/** One consistent dialog for New and Save As. No project is created until confirmed. */
export function projectDestination(options:{title:string;name:string;confirm:string;generalSettings?:boolean;save:(name:string,parent:DirectoryHandle,settings?:GeneralSettings)=>Promise<void>}):Promise<boolean>{
 if(destinationOpen)return Promise.resolve(false);destinationOpen=true;
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='project-destination';dialog.setAttribute('aria-label',options.title);
  const form=document.createElement('form'),heading=document.createElement('h2');heading.textContent=options.title;
  const copy=document.createElement('p');copy.textContent='Dê um nome ao projeto e escolha onde deseja salvá-lo. Uma pasta com esse nome será criada no local escolhido.';
  const label=document.createElement('label');label.textContent='Nome do projeto';
  const name=document.createElement('input');name.value=options.name;name.required=true;name.maxLength=180;name.setAttribute('aria-label','Nome do projeto');label.append(name);
  const settings:GeneralSettings={client:'',manager:'',description:''},fields:HTMLLabelElement[]=[];
  if(options.generalSettings)for(const [key,title] of [['client','Cliente / obra'],['manager','Responsável pelo projeto'],['description','Descrição breve']] as const){const field=document.createElement('label');field.textContent=title;const input=document.createElement('input');input.maxLength=500;input.setAttribute('aria-label',title);input.oninput=()=>{settings[key]=input.value.trim();};field.append(input);fields.push(field);}
  const placeLabel=document.createElement('label');placeLabel.textContent='Onde deseja salvar?';
  const location=document.createElement('input');location.readOnly=true;location.placeholder='Escolha uma pasta no computador';location.setAttribute('aria-label','Local de salvamento');placeLabel.append(location);
  const browse=document.createElement('button');browse.type='button';browse.textContent='Escolher pasta…';
  const preview=document.createElement('p');preview.className='destination-preview';
  const status=document.createElement('p');status.setAttribute('role','status');
  const error=document.createElement('p');error.className='error';error.setAttribute('role','alert');
  const actions=document.createElement('div');actions.className='destination-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';
  const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent=options.confirm;save.disabled=true;
  let parent:DirectoryHandle|undefined,working=false;
  const update=()=>{save.disabled=working||!parent||!name.value.trim();preview.textContent=parent?`Pasta do projeto: ${parent.displayPath??parent.name}\\${name.value.trim()}`:'';};
  const setWorking=(value:boolean)=>{working=value;name.disabled=value;browse.disabled=value;cancel.disabled=value;update();};
  const close=(result:boolean)=>{dialog.close();dialog.remove();destinationOpen=false;resolve(result);};
  cancel.onclick=()=>{if(!working)close(false);};dialog.oncancel=e=>{e.preventDefault();if(!working)close(false);};name.oninput=update;
  browse.onclick=()=>{
   const picked=chooseDirectory();setWorking(true);error.textContent='';status.textContent='Escolha a pasta na janela do Windows e clique em Usar esta pasta.';
   void picked.then(value=>{parent=value;location.value=value.displayPath??value.name;}).catch(e=>{
    if(e instanceof Error&&e.name==='AbortError')status.textContent='Seleção cancelada. Escolha outra pasta ou cancele o projeto.';
    else error.textContent=e instanceof Error?e.message:String(e);
   }).finally(()=>{setWorking(false);if(parent)status.textContent='Local selecionado. Confira o nome e confirme para salvar.';});
  };
  form.onsubmit=e=>{
   e.preventDefault();if(working||!parent)return;
   const chosen=parent,projectName=name.value.trim();setWorking(true);error.textContent='';status.textContent='Salvando o projeto…';
   void options.save(projectName,chosen,options.generalSettings?settings:undefined).then(()=>close(true)).catch(e=>{error.textContent=e instanceof Error?e.message:String(e);status.textContent='';}).finally(()=>setWorking(false));
  };
  actions.append(cancel,save);form.append(heading,copy,label,...fields,placeLabel,browse,preview,status,error,actions);dialog.append(form);document.body.append(dialog);dialog.showModal();name.focus();name.select();
 });
}
