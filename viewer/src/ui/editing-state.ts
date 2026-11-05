/** Keep unfinished user input across unrelated renders without persisting invalid data. */
type Control=HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;
const controls=(root:HTMLElement)=>Array.from(root.querySelectorAll<Control>('input,textarea,select'));
const key=(e:Control,i:number)=>e.getAttribute('aria-label')||e.labels?.[0]?.textContent?.trim()||`${e.tagName}:${i}`;
export function watchEditing(root:HTMLElement){
 for(const e of controls(root)){
  if(e.dataset.editTracked)continue;e.dataset.editTracked='true';
  const baseline=e instanceof HTMLInputElement&&(e.type==='checkbox'||e.type==='radio')?String(e.checked):e.value;
  e.addEventListener('input',()=>{const value=e instanceof HTMLInputElement&&(e.type==='checkbox'||e.type==='radio')?String(e.checked):e.value;e.dataset.userDraft=String(value!==baseline);});
 }
}
export function preserveEditing(root:HTMLElement){
 const items=controls(root),active=document.activeElement;
 const saved=items.map((e,i)=>({key:key(e,i),index:i,value:e.value,checked:e instanceof HTMLInputElement?e.checked:undefined,dirty:e.dataset.userDraft==='true'&&e.dataset.preserveDraft!=='false',focus:e===active,start:e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?e.selectionStart:null,end:e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?e.selectionEnd:null}));
 const opened=Array.from(root.querySelectorAll('details')).map((e,i)=>({i,open:e.open}));
 return ()=>{
  const next=controls(root);
  for(const s of saved){const e=next[s.index];if(!e||key(e,s.index)!==s.key)continue;
   if(s.dirty){e.value=s.value;if(e instanceof HTMLInputElement&&s.checked!==undefined)e.checked=s.checked;e.dataset.userDraft='true';}
   if(s.focus){e.focus({preventScroll:true});if(s.start!==null&&s.end!==null&&(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement))try{e.setSelectionRange(s.start,s.end);}catch{/* numeric/date fields have no text selection */}}
  }
  const details=root.querySelectorAll('details');for(const s of opened)if(details[s.i])details[s.i].open=s.open;
  watchEditing(root);
 };
}
