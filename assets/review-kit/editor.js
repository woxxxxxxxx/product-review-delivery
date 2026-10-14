/* Explicit-save local presentation editor. Imported files cannot contain HTML or rules. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),M=window.PRODUCT_REVIEW,ui=window.reviewUI;
 const clone=x=>JSON.parse(JSON.stringify(x)),registry=new Map();
 const embedded=JSON.parse($('embeddedEdits').textContent||'null');
 const project=M.meta.storage_key+':'+M.meta.version,storageKey=project+':edits:'+(embedded?.instance||'local');
 let edits={},saved='{}',enabled=false,selected=null,undo=[],redo=[],mounted=false;
 const allowedStyles=window.reviewPresentation.styles;
 function validate(doc){return window.reviewPresentation.validate(doc,M,window.REVIEW_BUNDLE?.fingerprint);}
 function envelope(){return {format:'pm-review-edits',version:1,project,baseDigest:window.REVIEW_BUNDLE?.fingerprint,reviewStatus:'presentation-changes-require-review',edits:clone(edits)};}
 let initialMessage='未修改';
 try{if(embedded)edits=validate(embedded);const local=localStorage.getItem(storageKey);if(local)edits=validate(JSON.parse(local));saved=JSON.stringify(edits);if(Object.keys(edits).length)initialMessage='已载入草稿';}catch(e){initialMessage='草稿未载入：'+e.message;}
 function status(s){$('saveStatus').textContent=s;}
 const dirty=()=>JSON.stringify(edits)!==saved;
 function updateStatus(){status(dirty()?'有未保存修改':Object.keys(edits).length?'已保存到当前浏览器':'未修改');}
 function refreshUI(){
  $('undoEdit').disabled=!undo.length;$('redoEdit').disabled=!redo.length;$('draftBadge').hidden=!Object.keys(edits).length;
  $('changeList').replaceChildren();if(!Object.keys(edits).length){$('changeList').textContent='暂无修改';return;}
  for(const key of Object.keys(edits)){const line=document.createElement('div');line.className='change-item';const title=document.createElement('strong');title.textContent=key.split('/').join(' · ');const body=document.createElement('p');body.textContent=edits[key].order?'组件顺序：'+edits[key].order.map(x=>window.reviewPresentation.labels[x]).join(' → '):edits[key].text??'样式调整';line.append(title,body);$('changeList').append(line);}
 }
 function commit(next){if(JSON.stringify(next)===JSON.stringify(edits))return;undo.push(clone(edits));if(undo.length>80)undo.shift();redo=[];edits=next;updateStatus();refreshUI();}
 function write(key,field,value){const next=clone(edits);next[key]||={};if(field==='text')next[key].text=value;else{next[key].style||={};if(value)next[key].style[field]=value;else delete next[key].style[field];}commit(next);}
 function paint(el,key){const base=registry.get(key);el.textContent=edits[key]?.text??base.text;for(const p of Object.keys(allowedStyles))el.style[p]=edits[key]?.style?.[p]||base.style[p]||'';el.classList.toggle('edited-item',Boolean(edits[key]));}
 function target(el,key){if(!el)return;if(!registry.has(key))registry.set(key,{text:el.textContent,style:Object.fromEntries(Object.keys(allowedStyles).map(p=>[p,el.style[p]]))});el.dataset.editKey=key;paint(el,key);el.contentEditable=enabled?'plaintext-only':'false';if(enabled){el.setAttribute('tabindex','0');el.setAttribute('spellcheck','false');}else el.removeAttribute('tabindex');}
 function mount(){
  const ep=window.reviewWorkbench.getEndpoint(),state=window.reviewSnapshot().state,prefix=ep+'/'+state+'/';
  document.querySelectorAll('[data-edit-key]').forEach(el=>{delete el.dataset.editKey;el.contentEditable='false';el.removeAttribute('tabindex');el.classList.remove('edit-selected');});
  if(ep!=='desktop'){
   target(document.querySelector('.app-bar'),ep+'/chrome/title');
   for(const [selector,id] of [['h3','title'],['p','description'],['.step','step'],['label[for="topic"]','fieldLabel'],['.row > span','rowLabel']])target($('canvas').querySelector(selector),prefix+id);
   $('canvas').querySelectorAll('button').forEach(el=>target(el,prefix+'button-'+(el.dataset.event||el.id)));
  }
  if(ep==='desktop'){target(document.querySelector('.admin h2'),'desktop/chrome/title');document.querySelectorAll('.admin th').forEach((el,i)=>target(el,'desktop/chrome/column-'+i));target($('adminDetail'),'desktop/chrome/button-adminDetail');}
  document.querySelectorAll('#canvas input').forEach(el=>el.disabled=enabled);
  document.querySelectorAll('#canvas button').forEach(el=>{if(enabled){if(el.disabled)el.dataset.wasDisabled='true';el.disabled=false;}else if(el.dataset.wasDisabled){el.disabled=true;delete el.dataset.wasDisabled;}});
  if(selected&&!document.querySelector('[data-edit-key="'+selected+'"]'))selected=null;
  document.body.classList.toggle('editing',enabled);$('editToggle').textContent=enabled?'结束编辑':'编辑画布';$('editToggle').setAttribute('aria-pressed',String(enabled));$('editorBar').hidden=!enabled;$('editorPanel').hidden=!enabled;
  refreshUI();syncInspector();mountLayout();mounted=true;document.dispatchEvent(new CustomEvent('review:presentation'));
 }
 function findSelected(){return [...document.querySelectorAll('[data-edit-key]')].find(e=>e.dataset.editKey===selected);}
 function syncInspector(){
  document.querySelectorAll('.edit-selected').forEach(el=>el.classList.remove('edit-selected'));const el=findSelected();
  for(const id of ['editText','editColor','editBackground','editSize','editAlign','restoreElement'])$(id).disabled=!el;
  $('selectionName').textContent=el?selected.split('/').join(' · '):'尚未选择';if(!el){$('editText').value='';return;}
  el.classList.add('edit-selected');$('editText').value=el.textContent;
  $('editColor').value=edits[selected]?.style?.color||'#26282c';$('editBackground').value=edits[selected]?.style?.backgroundColor||'#ffffff';$('editSize').value=edits[selected]?.style?.fontSize||'';$('editAlign').value=edits[selected]?.style?.textAlign||'';
 }
 function select(el){selected=el.dataset.editKey;syncInspector();}
 $('editToggle').onclick=()=>{enabled=!enabled;selected=null;ui.render();mount();document.dispatchEvent(new CustomEvent('review:edit'));if(enabled)status(dirty()?'有未保存修改':'点击画布文字开始编辑；完成后保存草稿。');};
 document.addEventListener('review:render',mount);document.addEventListener('review:endpoint',()=>{if(mounted){selected=null;mount();}});
 document.addEventListener('click',e=>{if(!enabled||!e.target.closest('.device,.admin')||e.target.closest('.layout-handle,.annotation-layer'))return;e.preventDefault();e.stopImmediatePropagation();const el=e.target.closest('[data-edit-key]');if(el){select(el);el.focus();}},true);
 document.addEventListener('keydown',e=>{if(!enabled||!e.target.closest('.device,.admin')||e.target.closest('.layout-handle,.annotation-layer'))return;if(e.key==='Enter'){e.preventDefault();e.target.blur();}if(e.key==='Escape'){e.preventDefault();e.target.blur();$('editToggle').focus();}},true);
 document.addEventListener('paste',e=>{const el=e.target.closest('[data-edit-key]');if(!enabled||!el)return;e.preventDefault();const txt=(e.clipboardData?.getData('text/plain')||'').slice(0,1000);el.textContent=txt;write(el.dataset.editKey,'text',txt);syncInspector();});
 document.addEventListener('input',e=>{const el=e.target.closest('[data-edit-key]');if(!enabled||!el)return;write(el.dataset.editKey,'text',el.textContent);$('editText').value=el.textContent;});
 $('editText').oninput=()=>{const el=findSelected();if(!el)return;write(selected,'text',$('editText').value);paint(el,selected);};
 for(const [id,prop] of [['editColor','color'],['editBackground','backgroundColor'],['editSize','fontSize'],['editAlign','textAlign']])$(id).onchange=()=>{const el=findSelected();if(!el)return;write(selected,prop,$(id).value);paint(el,selected);};
 $('restoreElement').onclick=()=>{if(!selected)return;const next=clone(edits);delete next[selected];commit(next);mount();};
 $('undoEdit').onclick=()=>{if(!undo.length)return;redo.push(clone(edits));edits=undo.pop();mount();updateStatus();};
 $('redoEdit').onclick=()=>{if(!redo.length)return;undo.push(clone(edits));edits=redo.pop();mount();updateStatus();};
 $('saveDraft').onclick=()=>{try{validate(envelope());localStorage.setItem(storageKey,JSON.stringify(envelope()));saved=JSON.stringify(edits);status('已保存到当前浏览器');}catch(e){status('未保存：'+e.message);}};
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 $('exportDraft').onclick=()=>{try{validate(envelope());download('原型修改-'+M.meta.version+'.json',JSON.stringify(envelope(),null,2),'application/json');status('已导出修改文件；本地保存状态未改变。');}catch(e){status('未导出：'+e.message);}};
 $('importDraft').onclick=()=>$('draftFile').click();
 $('draftFile').onchange=async()=>{const f=$('draftFile').files[0];if(!f)return;try{if(f.size>500000)throw Error('文件大于 500 KB。');const next=validate(JSON.parse(await f.text()));if(Object.keys(edits).length&&!confirm('导入将替换当前文案、样式和组件顺序。继续吗？替换后可以撤销。'))return;commit(next);mount();status('已导入，尚未保存；可撤销。');}catch(e){status('导入失败：'+e.message);}finally{$('draftFile').value='';}};
 $('exportHTML').onclick=()=>{try{
  validate(envelope());const bundle=window.REVIEW_BUNDLE;if(!bundle)throw Error('缺少导出资源，请保留完整模板文件。');
  const doc=new DOMParser().parseFromString(bundle.html,'text/html');
  doc.querySelectorAll('link[rel="stylesheet"]').forEach(link=>{const style=doc.createElement('style');style.textContent=bundle.css[link.getAttribute('href')];link.replaceWith(style);});
  const data={...envelope(),instance:crypto.randomUUID()};doc.getElementById('embeddedEdits').textContent=JSON.stringify(data).replace(/</g,'\\u003c');
  for(const tag of doc.querySelectorAll('script[src]')){const name=tag.getAttribute('src');const js=name==='bundle.js'?'window.REVIEW_BUNDLE='+JSON.stringify(bundle).replace(/</g,'\\u003c')+';':bundle.js[name];if(typeof js!=='string')throw Error('导出资源不完整：'+name);tag.removeAttribute('src');tag.textContent=js.replace(/<\/script/gi,'<\\/script');}
  download('服务申请-可编辑原型-'+M.meta.version+'.html','<!doctype html>\n'+doc.documentElement.outerHTML,'text/html');status('已导出独立 HTML；包含文案、样式与组件顺序，不包含演示输入。');
 }catch(e){status('未导出：'+e.message);}};

 // Ordered groups, never free coordinates: DOM reading order follows visual order.
 const layoutKey=()=>window.reviewWorkbench.getEndpoint()+'/'+window.reviewSnapshot().state+'/layout';
 function currentOrder(){return [...$('canvas').querySelectorAll(':scope > [data-layout-group]')].map(n=>n.dataset.layoutGroup);}
 function changeOrder(order){if(!enabled||window.reviewWorkbench.getEndpoint()==='desktop')return;const next=clone(edits),key=layoutKey();if(JSON.stringify(order)===JSON.stringify(window.reviewPresentation.groups(window.reviewSnapshot().state)))delete next[key];else next[key]={order};validate({...envelope(),edits:next});commit(next);mount();status('组件顺序已调整，尚未保存；请复核阅读和操作顺序。');}
 function shiftGroup(id,delta){const order=currentOrder(),i=order.indexOf(id),j=i+delta;if(i<0||j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];changeOrder(order);}
 function mountLayout(){
  const desktop=window.reviewWorkbench.getEndpoint()==='desktop',groups=window.reviewPresentation.groups(window.reviewSnapshot().state);
  const order=edits[layoutKey()]?.order||groups;
  order.forEach(id=>{const el=$('canvas').querySelector('[data-layout-group="'+id+'"]');if(el)$('canvas').append(el);});
  $('canvas').querySelectorAll('.layout-handle').forEach(n=>n.remove());
  $('layoutList').replaceChildren();$('restoreLayout').disabled=desktop||!edits[layoutKey()];
  $('layoutHint').textContent=desktop?'PC 表格不支持拖动列或拆分单元格，避免破坏字段含义与对应关系。':'拖动组件右上角手柄，或使用上移/下移。只在当前端、当前状态内排序；输入区保持完整。';
  if(desktop)return;
  currentOrder().forEach((id,i)=>{
   const el=$('canvas').querySelector('[data-layout-group="'+id+'"]');
   if(enabled){
    const handle=document.createElement('span');handle.className='layout-handle';handle.dataset.groupHandle=id;handle.role='button';handle.tabIndex=0;handle.textContent='⠿ '+window.reviewPresentation.labels[id];handle.setAttribute('aria-label','拖动'+window.reviewPresentation.labels[id]+'，方向键上下移动');handle.onkeydown=e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();shiftGroup(id,e.key==='ArrowUp'?-1:1);$('canvas').querySelector('[data-group-handle="'+id+'"]')?.focus();}};el.append(handle);
   }
   const row=document.createElement('div');row.className='layout-row';const label=document.createElement('span');label.textContent=window.reviewPresentation.labels[id];row.append(label);
   for(const [labelText,delta] of [['上移',-1],['下移',1]]){const b=document.createElement('button');b.textContent=labelText;b.className='secondary';b.disabled=delta===-1?i===0:i===order.length-1;b.setAttribute('aria-label',window.reviewPresentation.labels[id]+labelText);b.onclick=()=>shiftGroup(id,delta);row.append(b);}
   $('layoutList').append(row);
  });
 }
 $('restoreLayout').onclick=()=>changeOrder(window.reviewPresentation.groups(window.reviewSnapshot().state));
 let drag=null;
 function clearDrag(){document.querySelectorAll('.drag-source,.drop-before,.drop-after').forEach(n=>n.classList.remove('drag-source','drop-before','drop-after'));drag=null;}
 document.addEventListener('pointerdown',e=>{const h=e.target.closest('[data-group-handle]');if(!enabled||!h||e.button!==0)return;e.preventDefault();drag={id:h.dataset.groupHandle,startX:e.clientX,startY:e.clientY,target:null,after:false};h.closest('[data-layout-group]').classList.add('drag-source');});
 document.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5)return;document.querySelectorAll('.drop-before,.drop-after').forEach(n=>n.classList.remove('drop-before','drop-after'));const box=$('canvas').getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom){drag.target=null;return;}const target=[...$('canvas').querySelectorAll(':scope > [data-layout-group]')].find(n=>{const r=n.getBoundingClientRect();return e.clientY>=r.top&&e.clientY<=r.bottom;});if(!target||target.dataset.layoutGroup===drag.id){drag.target=null;return;}drag.target=target.dataset.layoutGroup;drag.after=e.clientY>target.getBoundingClientRect().top+target.getBoundingClientRect().height/2;target.classList.add(drag.after?'drop-after':'drop-before');});
 document.addEventListener('pointerup',()=>{if(!drag)return;const d={...drag};clearDrag();if(!d.target)return;const order=currentOrder().filter(x=>x!==d.id),i=order.indexOf(d.target)+(d.after?1:0);order.splice(i,0,d.id);changeOrder(order);});
 document.addEventListener('pointercancel',clearDrag);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')clearDrag();});
 $('exportHandoff').onclick=()=>{try{
  validate(envelope());const changes=Object.entries(edits).map(([key,value])=>({target:key,kind:value.order?'layout':value.text!==undefined?'copy':'style',before:registry.get(key)||null,after:clone(value)}));
  const doc={...envelope(),handoff:{schema:1,baseVersion:M.meta.version,createdAt:new Date().toISOString(),note:$('handoffNote').value.slice(0,2000),changes,scope:'Presentation only; business rules unchanged; review required.'}};
  download('原型交接包-'+M.meta.version+'.json',JSON.stringify(doc,null,2),'application/json');status('已导出交接包，待评审后合并；正式文件尚未更新。');
 }catch(e){status('未导出交接包：'+e.message);}};

 window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
 let printEditing=false;
 window.addEventListener('beforeprint',()=>{printEditing=enabled;if(enabled){enabled=false;mount();}});
 window.addEventListener('afterprint',()=>{if(printEditing){enabled=true;mount();printEditing=false;}});
 mount();status(initialMessage);
})();
