/* Role-specific review lenses and removable rule annotations, never business access control. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id),M=window.PRODUCT_REVIEW,W=window.reviewWorkbench;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const profiles={
  business:{title:'业务',hint:'新增功能、用户操作、办理记录与异常处理。',sections:['pages','map','overview','decisions'],focus:['本期增加提交前核对、办理进度查询和异常恢复；后台可查看办理记录。','审批、代办不在本期范围；办理条件、时限和异常处理责任待确认。']},
  design:{title:'UI / 设计',hint:'页面层级、组件状态、规则位置与多端适配。',sections:['pages','map','overview','decisions'],focus:['填写、核对、处理中和异常页面保持统一层级与组件样式。','布局调整后需满足阅读顺序、键盘操作、长文与窄屏展示要求。']},
  frontend:{title:'前端',hint:'操作触发、字段校验、页面状态与异常恢复。',sections:['pages','map','flow','rules','decisions'],focus:['必填校验与核对勾选限制提交；返回保留输入。','未知查询不重提，已提交内容与本地草稿分开。']},
  backend:{title:'后端',hint:'受理与执行、数据流转、重复请求与结果一致性。',sections:['pages','map','flow','rules','decisions'],focus:['受理不等于执行完成；超时未知不能直接判失败。','PC 读取已提交事项与执行事实；具体接口、权限和并发规则待联调。']},
  qa:{title:'测试',hint:'前置条件、操作路径、预期结果与异常恢复。',sections:['pages','map','flow','rules','decisions'],focus:['覆盖空值、返回、重复提交、未知查询、失败重试与刷新。','原型验证与服务验收分别记录；项目用例仍待执行。']},
  all:{title:'产品 / 全部',hint:'显示完整交付内容；各角色共用同一份业务规则。',sections:['pages','map','overview','flow','rules','decisions'],focus:['统筹范围、交互、字段、状态、验收和未决事项。','角色只是信息筛选，不改变业务规则或访问权限。']}
 };
 let role='business',showAll=false,selected=0,lastContext='',suppressed=false,raf=0;
 const savedKey=M.meta.storage_key+':audience';
 try{const saved=JSON.parse(localStorage.getItem(savedKey)||'null');if(saved?.role==='operations')saved.role='business';if(saved&&profiles[saved.role]){role=saved.role;showAll=Boolean(saved.showAll);}}catch{}
 $('audience').value=role;$('allInfo').checked=showAll;
 function applyRole(){
  const p=profiles[role],full=showAll||role==='all';document.body.dataset.audience=role;
  $('audienceHint').textContent=p.hint;$('allInfo').disabled=role==='all';
  $('printMeta').textContent='V'+M.meta.version+' · '+p.title+'视角'+(showAll?' / 全部信息':'')+' · 建议稿 · '+M.meta.date;
  for(const a of document.querySelectorAll('.sidebar nav a')){const id=a.hash.slice(1),allowed=full||p.sections.includes(id);a.hidden=!allowed;$(id)?.classList.toggle('role-excluded',!allowed);}
  const id=location.hash.slice(1)||'pages';if(!full&&!p.sections.includes(id))location.hash='pages';
  // Less relevant material is one explicit switch away, not deleted or authorized by a role.
  document.querySelector('[data-map=exchange]').hidden=!full&&['business','design'].includes(role);
  document.querySelector('[data-map=coverage]').hidden=!full&&['business','design'].includes(role);
  const active=document.querySelector('[data-map][aria-pressed=true]');if(active?.hidden)document.querySelector('[data-map=matrix]').click();
  document.querySelector('button[data-endpoint=desktop]').hidden=false;
  for(const view of ['exchange','coverage'])$(view+'View').classList.toggle('role-dimension-excluded',document.querySelector('[data-map='+view+']').hidden);
  if(!full&&role==='business')$('seeExchange').hidden=true;else $('seeExchange').hidden=false;
  try{localStorage.setItem(savedKey,JSON.stringify({role,showAll}));}catch{}
  schedule();
 }
 $('audience').onchange=()=>{role=$('audience').value;suppressed=false;applyRole();W.setDimension(role==='qa'?'cases':['frontend','backend'].includes(role)?'rules':'changes');};
 $('allInfo').onchange=()=>{showAll=$('allInfo').checked;applyRole();};
 const rule=(target,id,title,text)=>({target,id,title,text});
 function rules(){
  const s=window.reviewSnapshot(),state=s.state;
  if(W.getEndpoint()==='desktop')return s.submissions?[
   rule('#adminTopic','R-01','已提交事项','只显示上次已受理的内容；前台修改草稿不会提前更新此值。'),
   rule('#adminAccepted','R-02','受理与执行分开','已受理不代表已完成，必须结合执行结果判断。'),
   rule('#adminResult','R-02','执行事实','依据最近确认的结果展示；返回填写或帮助页不改变执行事实。')
  ]:[rule('#adminEmpty','R-02','提交前无记录','用户尚未提交时，后台不生成申请记录。')];
  const sets={
   form:[rule('#topic','R-01','办理事项必填','留空点击下一步时原位提示，不进入核对，也不提交。'),rule('[data-event=next]','R-01','下一步只核对','内容非空才进入核对页；此时还没有受理记录。')],
   confirm:[rule('[data-event=back]','R-01','返回修改保留输入','返回填写后保留内容，再进入核对时需重新勾选。'),rule('#ack','R-01','核对后才能提交','未勾选时禁用确认提交。勾选只表示核对，不代表已受理。'),rule('[data-event=submit]','R-02','提交后进入处理中','受理与完成分开；重复提交不增加申请次数。')],
   pending:[rule('#canvas h3','R-02','受理不等于完成','此时只确认申请已受理，执行结果仍待确认。'),rule('#query','R-02','查询不重复提交','沿用当前申请查询结果，不新建申请。')],
   unknown:[rule('#canvas h3','R-02','未知不是失败','保留申请，不能直接重复提交；继续查询确认结果。'),rule('#query','R-02','允许继续查询','仍未知时留在本页；查明成功或失败后转入相应状态。'),rule('[data-event=help]','R-03','帮助不结束申请','进入帮助页后可返回查询，原申请仍保留。')],
   failure:[rule('[data-event=retry]','R-03','明确失败后再重试','保留输入，先返回核对；必须再次勾选后提交，不自动重提。')],
   success:[rule('#canvas h3','R-02','完成必须有明确结果','只有查询确认已执行，才能展示办理完成。'),rule('[data-event=finish]','R-03','结束本轮演示','点击完成后返回填写；本地演示清除本轮草稿与操作记录。')],
   empty:[rule('[data-event=back]','R-03','暂无事项的返回路径','不生成申请，可返回入口；演示中回到可填写状态。')],
   denied:[rule('[data-event=back]','R-03','无权限不能办理','不提交也不能查询。返回入口不代表真实账号权限已提升。')],
   help:[rule('[data-event=back]','R-03','回到原申请继续查询','返回后继续查询原申请；帮助页不新增工单或结束办理。')]
  };return sets[state]||[];
 }
 function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);}
 function draw(){
  const dim=W.getDimension(),context=[W.getEndpoint(),window.reviewSnapshot().state,window.reviewSnapshot().page,dim].join('/');
  if(context!==lastContext){selected=0;suppressed=false;lastContext=context;}
  $('roleFocus')?.remove();
  const focus=document.createElement('div');focus.id='roleFocus';focus.className='role-focus';
  focus.innerHTML='<small>'+esc(profiles[role].title)+'关注</small><p>'+profiles[role].focus.map(esc).join('</p><p>')+'</p>';
  $('pageNotes').append(focus);
  window.reviewAnnotations.clear();
  const enabled=dim==='rules'&&!document.body.classList.contains('editing')&&!$('pages').hidden;
  $('annotationBanner').hidden=!enabled;$('hideAnnotations').textContent=suppressed?'显示标注':'隐藏标注';
  if(!enabled)return;
  const items=rules(),state=window.reviewSnapshot().state;
  const page=M.pages.find(p=>(p.states||[]).includes(state));
  for(const id of page?.requirements||[]){if(items.some(r=>r.id===id))continue;const r=M.requirements.find(r=>r.id===id);if(r)items.push(rule('#canvas',r.id,r.title,r.rule));}
  $('pageNotes').querySelectorAll('.note-item,.anchored-rules').forEach(n=>n.remove());
  const list=document.createElement('div');list.className='anchored-rules';
  $('pageNotes').querySelector('.note-state').after(list);
  window.reviewAnnotations.mount({host:document.querySelector(W.getEndpoint()==='desktop'?'.admin':'.device'),items,list,suppressed});

 }
 $('hideAnnotations').onclick=()=>{suppressed=!suppressed;schedule();};
 ['review:render','review:endpoint','review:dimension','review:edit','review:presentation','review:navigate'].forEach(e=>document.addEventListener(e,schedule));
 window.addEventListener('resize',schedule);document.addEventListener('scroll',schedule,true);
 new ResizeObserver(schedule).observe($('canvas'));
 window.addEventListener('hashchange',()=>{applyRole();schedule();});
 applyRole();W.setDimension(role==='qa'?'cases':['frontend','backend'].includes(role)?'rules':'changes');schedule();
})();
