/* Review-only annotations. No business action, data mutation or editor content. */
(()=>{
 'use strict';
 let dispose=()=>{};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.reviewAnnotations={clear(){dispose();dispose=()=>{};},mount({host,doc=document,frame=null,items,list,suppressed=false,fallback='#canvas'}){
  this.clear();if(!host||!list)return;
  const cleanups=[],entries=[],layer=document.createElement('div');let pop=null,active=-1,pinned=false,leaveTimer,dismissUntil=0;
  layer.className='annotation-layer';layer.setAttribute('aria-label','规则评审标注');if(!suppressed)host.append(layer);
  function on(el,event,fn){el.addEventListener(event,fn);cleanups.push(()=>el.removeEventListener(event,fn));}
  function close(){clearTimeout(leaveTimer);pop?.remove();pop=null;active=-1;pinned=false;entries.forEach(e=>{e.target?.classList.remove('rule-target');e.pin?.setAttribute('aria-expanded','false');e.pin?.removeAttribute('aria-describedby');e.card.setAttribute('aria-pressed','false');});}
  function rect(el){const r=el.getBoundingClientRect(),f=frame?.getBoundingClientRect();const sx=f?f.width/frame.clientWidth:1,sy=f?f.height/frame.clientHeight:1;return{left:(f?.left||0)+r.left*sx,right:(f?.left||0)+r.right*sx,top:(f?.top||0)+r.top*sy,bottom:(f?.top||0)+r.bottom*sy,width:r.width*sx,height:r.height*sy};}
  function visible(el){const r=rect(el),h=host.getBoundingClientRect();let l=Math.max(h.left,0),t=Math.max(h.top,0),rr=Math.min(h.right,innerWidth),b=Math.min(h.bottom,innerHeight);for(let p=el.parentElement;p&&p!==doc.body;p=p.parentElement){const s=doc.defaultView.getComputedStyle(p);if(/auto|scroll|hidden|clip/.test(s.overflow+s.overflowY+s.overflowX)){const a=rect(p);l=Math.max(l,a.left);t=Math.max(t,a.top);rr=Math.min(rr,a.right);b=Math.min(b,a.bottom);}}return r.width>0&&r.height>0&&r.bottom>t&&r.top<b&&r.right>l&&r.left<rr;}
  function open(i,lock=false){
   if(suppressed||Date.now()<dismissUntil)return;clearTimeout(leaveTimer);const e=entries[i];if(!e||!e.target||!visible(e.target))return;
   if(active===i&&pop){pinned=pinned||lock;return;}close();active=i;pinned=lock;
   e.target.classList.add('rule-target');e.card.setAttribute('aria-pressed','true');e.pin?.setAttribute('aria-expanded','true');
   pop=document.createElement('div');pop.className='rule-popover rule-floating';pop.id='review-rule-tooltip';pop.setAttribute('role','tooltip');
   pop.innerHTML='<small>评审标注 · '+esc(e.rule.id)+(e.fallback?' · 页面级规则':'')+'</small><strong>'+esc(e.rule.title)+'</strong><p>'+esc(e.rule.text)+'</p><button type="button" class="text-button" aria-label="关闭规则说明">收起说明</button>';
   document.body.append(pop);e.pin?.setAttribute('aria-describedby',pop.id);
   const a=(e.pin||e.target).getBoundingClientRect(),anchor=e.pin?a:rect(e.target),p=pop.getBoundingClientRect();
   pop.style.left=Math.max(8,Math.min(innerWidth-p.width-8,anchor.left-p.width+24))+'px';
   pop.style.top=Math.max(8,Math.min(innerHeight-p.height-8,anchor.bottom+p.height+8<innerHeight?anchor.bottom+8:anchor.top-p.height-8))+'px';
   pop.onpointerenter=()=>clearTimeout(leaveTimer);pop.onpointerleave=()=>{if(!pinned)leaveTimer=setTimeout(close,180);};
   pop.querySelector('button').onclick=()=>{dismissUntil=Date.now()+400;e.pin?.focus({preventScroll:true});close();};
  }
  const counts=new Map();list.replaceChildren();
  items.forEach((r,i)=>{
   let target=[...doc.querySelectorAll(r.target)].find(el=>{const box=el.getBoundingClientRect();return box.width>0&&box.height>0;}),isFallback=false;
   if(!target||!target.getBoundingClientRect().width||!target.getBoundingClientRect().height){target=doc.querySelector(fallback);isFallback=true;}
   const card=document.createElement('button');card.type='button';card.className='rule-card';card.dataset.ruleIndex=i;card.setAttribute('aria-pressed','false');
   card.innerHTML='<b>'+String(i+1).padStart(2,'0')+' · '+esc(r.title)+'</b><span>'+esc(r.text)+'</span><small>'+esc(r.id)+' · '+(isFallback?'页面级规则':'定位页面')+'</small>';list.append(card);
   const e={rule:r,target,card,fallback:isFallback,pin:null};entries.push(e);
   card.onclick=()=>{target?.scrollIntoView({block:'center',inline:'nearest'});open(i,true);};
   if(!target||suppressed)return;
   if(visible(target)){
    const h=host.getBoundingClientRect(),rct=rect(target),offset=counts.get(target)||0;counts.set(target,offset+1);
    const pin=document.createElement('button');e.pin=pin;pin.type='button';pin.className='rule-pin';pin.textContent=String(i+1).padStart(2,'0');
    pin.style.left=Math.max(4,Math.min(h.width-30,rct.right-h.left-28-offset*29))+'px';pin.style.top=Math.max(4,Math.min(h.height-30,rct.top-h.top+2))+'px';
    pin.setAttribute('aria-label',r.title+'，查看规则');pin.setAttribute('aria-expanded','false');layer.append(pin);
    pin.onpointerenter=()=>open(i);pin.onpointerleave=()=>{if(!pinned)leaveTimer=setTimeout(close,180);};pin.onfocus=()=>open(i);pin.onblur=()=>{if(!pinned)leaveTimer=setTimeout(close,180);};pin.onclick=()=>open(i,true);
   }
   on(target,'pointerenter',()=>open(i));on(target,'pointerleave',()=>{if(!pinned)leaveTimer=setTimeout(close,180);});on(target,'focusin',()=>open(i));
  });
  function escape(e){if(e.key==='Escape'){dismissUntil=Date.now()+400;close();e.stopPropagation();}}
  on(document,'keydown',escape);if(doc!==document)on(doc,'keydown',escape);
  dispose=()=>{close();cleanups.forEach(fn=>fn());layer.remove();};
 }};
})();
