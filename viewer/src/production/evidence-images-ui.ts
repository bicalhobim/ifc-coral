import {makeEvidenceImage,validateEvidenceImages,MAX_IMAGE_BYTES,MAX_IMAGES_PER_CONSTRAINT,type EvidenceImage} from './evidence-images.ts';
const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;};
const button=(label:string,fn:()=>void)=>{const b=node('button',label);b.type='button';b.onclick=fn;return b;};
function previewImage(image:EvidenceImage){
 validateEvidenceImages([image]);const modal=node('dialog','','evidence-preview'),head=node('header'),body=node('div','','evidence-preview-body'),img=node('img');modal.setAttribute('aria-label',`Print: ${image.name}`);img.src=image.dataUrl;img.alt=image.name;
 const close=()=>{modal.close();modal.remove();},original=button('Tamanho original',()=>{modal.classList.toggle('original');original.setAttribute('aria-pressed',String(modal.classList.contains('original')));});original.setAttribute('aria-pressed','false');
 head.append(node('strong',image.name),original,button('Fechar print',close));body.append(img);modal.append(head,body);modal.oncancel=()=>modal.remove();document.body.append(modal);modal.showModal();
}
/** Images remain draft until the enclosing constraint is explicitly saved. */
export function evidenceImages(container:HTMLElement,initial:EvidenceImage[],description:string){
 let images=structuredClone(initial),busy=false;const original=new Set(initial.map(i=>i.id));validateEvidenceImages(images);
 const area=node('section','','evidence-upload'),tiles=node('div','','evidence-tiles'),status=node('p','','evidence-upload-status');area.tabIndex=0;area.setAttribute('aria-label',`Prints da evidência — ${description}`);
 const input=node('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.multiple=true;input.hidden=true;input.setAttribute('aria-label',`Selecionar prints — ${description}`);
 const add=button('Anexar print',()=>input.click());
 const render=()=>{tiles.replaceChildren();for(const image of images){const tile=node('div','','evidence-tile'),view=button(`Ver print: ${image.name}`,()=>previewImage(image)),img=node('img');img.src=image.dataUrl;img.alt=`Miniatura: ${image.name}`;img.loading='lazy';view.prepend(img);tile.append(view,node('small',`${Math.ceil(image.size/1024)} KB${original.has(image.id)?' · registrado':' · pronto para salvar'}`));if(!original.has(image.id))tile.append(button(`Descartar anexo: ${image.name}`,()=>{images=images.filter(i=>i.id!==image.id);render();status.textContent='Anexo ainda não salvo descartado.';}));tiles.append(tile);}add.disabled=busy||images.length>=MAX_IMAGES_PER_CONSTRAINT;};
 const load=async(files:File[])=>{
  if(busy||!files.length)return;
  busy=true;render();status.setAttribute('role','status');status.textContent='Lendo print…';
  try{
   if(images.length+files.length>MAX_IMAGES_PER_CONSTRAINT)throw new Error('Use no máximo 5 prints por restrição.');
   const added:EvidenceImage[]=[];
   for(const file of files){if(file.size>MAX_IMAGE_BYTES)throw new Error('O print excede 2 MB. Salve uma imagem menor e tente novamente.');const mime=file.type||(/\.png$/i.test(file.name)?'image/png':/\.jpe?g$/i.test(file.name)?'image/jpeg':/\.webp$/i.test(file.name)?'image/webp':'');added.push(makeEvidenceImage(file.name||'print.png',mime,new Uint8Array(await file.arrayBuffer())));}
   if(!area.isConnected)return;images.push(...added);status.textContent='Print pronto. Salve o apontamento ou confirme a liberação; depois salve o projeto.';
  }catch(e){status.setAttribute('role','alert');status.textContent=e instanceof Error?e.message:String(e);}
  finally{busy=false;input.value='';render();}
 };
 const paste=(event:ClipboardEvent)=>{const files=[...(event.clipboardData?.files??[])].filter(f=>f.type.startsWith('image/'));if(files.length){event.preventDefault();void load(files);}};
 input.onchange=()=>void load([...(input.files??[])]);area.addEventListener('paste',paste);
 area.ondragover=e=>{if(e.dataTransfer?.types.includes('Files'))e.preventDefault();};area.ondrop=e=>{e.preventDefault();void load([...(e.dataTransfer?.files??[])]);};
 area.append(node('strong','Prints da evidência'),node('p','PNG, JPEG ou WebP · até 2 MB cada · até 5 prints. Anexe, arraste ou cole uma imagem com Ctrl+V nesta área.','fine'),add,input,tiles,status);container.append(area);render();
 return {images:()=>structuredClone(images),isBusy:()=>busy,paste};
}
