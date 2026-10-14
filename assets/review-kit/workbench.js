/* Presentation adapters: fictional APP/H5端 reuse the same example contract. */
(()=>{
 'use strict';
 const M=window.PRODUCT_REVIEW,$=id=>document.getElementById(id),ui=window.reviewUI;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let endpoint='app',dimension='changes';
 const adminEmpty=document.createElement('div');adminEmpty.id='adminEmpty';adminEmpty.className='admin-empty';adminEmpty.innerHTML='<strong>暂无申请记录</strong><p>用户提交申请后，可在此查看受理和执行结果。</p>';document.querySelector('.admin').append(adminEmpty);
 const tone=s=>s==='success'?'teal':s==='failure'?'red':['unknown','denied','empty','help'].includes(s)?'amber':'blue';
 const pill=(text,color)=>'<span class="pill '+color+'">'+esc(text)+'</span>';
 const stateName=id=>M.states.find(s=>s.id===id)?.title||id;
 function endpointUI(){
  document.body.dataset.endpoint=endpoint;
  document.querySelectorAll('button[data-endpoint]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.endpoint===endpoint)));
  const selected=M.pages.find(p=>p.states.includes(window.reviewSnapshot().state));
  $('pageLabel').textContent=(endpoint==='desktop'?'业务工作区':selected.id+' · '+selected.title)+' / '+{app:'APP',h5:'H5端',desktop:'PC 后台'}[endpoint];
  document.querySelector('.app-bar').textContent=endpoint==='h5'?'在线服务':'服务中心';
  $('previewBadge').textContent=ui.isScenario()?'场景预览 · 示例数据':endpoint==='h5'?'H5端示例':'交互原型';
  $('scenarioExit').hidden=!ui.isScenario();
  document.querySelector('#baseline .panel-label span').textContent='当前端 / 当前状态待核实';
  document.dispatchEvent(new CustomEvent('review:endpoint',{detail:endpoint}));
 }
 function setEndpoint(next){if(!['app','h5','desktop'].includes(next))return;endpoint=next;ui.render();ui.setView(next==='desktop'?'desktop':'proposal');endpointUI();}
 document.querySelectorAll('button[data-endpoint]').forEach(b=>b.onclick=()=>setEndpoint(b.dataset.endpoint));
 document.addEventListener('review:view',e=>{if(e.detail==='desktop')endpoint='desktop';else if(endpoint==='desktop')endpoint='app';endpointUI();});
 function notes(){
  const S=window.reviewSnapshot(),p=M.pages.find(p=>p.states.includes(S.state));
  document.querySelector('.admin tbody').hidden=!S.submissions;adminEmpty.hidden=Boolean(S.submissions);if(!S.submissions){$('adminInfo').hidden=true;$('adminDetail').setAttribute('aria-expanded','false');}
  let content='';
  if(dimension==='changes')content='<h3>'+esc(p.title)+'</h3><ul>'+p.changes.map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul>';
  if(dimension==='changes'&&endpoint==='desktop')content='<h3>办理记录查询</h3><ul><li>提交后生成记录，分别展示受理与执行结果。</li><li>返回修改不更新已提交内容，重新提交后更新记录。</li><li>仅查询，不提供审批、代办或修改结果。</li></ul>';
  if(dimension==='rules')content=M.requirements.filter(r=>p.requirements.includes(r.id)).map(r=>'<div class="note-item">'+pill(r.id,'blue')+'<h3>'+esc(r.title)+'</h3><p>'+esc(r.rule)+'</p></div>').join('');
  if(dimension==='cases')content=M.cases.filter(c=>p.requirements.includes(c.requirement)).map(c=>'<div class="note-item">'+pill(c.id,'violet')+' '+pill(c.result==='pass'?'已通过':'待执行',c.result==='pass'?'teal':'amber')+'<p>'+esc(c.assertion)+'</p></div>').join('');
  $('pageNotes').innerHTML='<div class="note-tabs">'+[['changes','改动'],['rules','规则'],['cases','验收']].map(([v,t])=>'<button data-dimension="'+v+'" aria-pressed="'+(dimension===v)+'">'+t+'</button>').join('')+'</div><div class="note-state">'+pill(stateName(S.state),tone(S.state))+'</div>'+content+'<p class="note-links">'+esc(p.id)+' · '+p.requirements.map(esc).join(' / ')+'</p>';
  $('pageNotes').querySelectorAll('[data-dimension]').forEach(b=>b.onclick=()=>{dimension=b.dataset.dimension;notes();});
  const icon=$('canvas').querySelector('.status-icon');if(icon)icon.className='status-icon '+tone(S.state);
  $('adminState').className='status-cell '+tone(S.result||S.state);
  document.dispatchEvent(new CustomEvent('review:dimension',{detail:dimension}));
 }
 function sync(){endpointUI();notes();}
 document.addEventListener('review:render',sync);
 $('scenarioExit').onclick=()=>ui.exitScenario();
 const stages=[['form','填写信息'],['confirm','核对申请'],['pending','处理中'],['success','已完成'],['unknown','结果未知'],['failure','明确失败']];
 function jump(state,end){ui.openScenario(state);setEndpoint(end);location.hash='pages';}
 $('matrixView').innerHTML='<p class="dimension-caption">各端按任务阶段展示对应页面。点击可预览场景，不提交申请。</p><div class="table-wrap"><table class="matrix"><thead><tr><th>任务阶段</th><th>'+pill('APP','blue')+' 用户端</th><th>'+pill('H5端','violet')+' 网页端</th><th>'+pill('PC','teal')+' 业务端</th></tr></thead><tbody>'+stages.map(([s,t],i)=>'<tr><th><span class="stage-number">'+String(i+1).padStart(2,'0')+'</span>'+esc(t)+'</th>'+['app','h5','desktop'].map(e=>'<td>'+(e==='desktop'&&['form','confirm'].includes(s)?'<span class="not-applicable">未提交，无待办</span>':'<button class="matrix-link" data-jump="'+s+'" data-target-end="'+e+'">'+pill(e==='desktop'?'查看记录':t,tone(s))+'<span aria-hidden="true">↗</span></button>')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p class="dimension-footnote">APP 与 H5端 使用同一申请流程；PC 仅查询记录，审批和代办不在本期范围。</p>';
 $('coverageView').innerHTML='<p class="dimension-caption">本期需求、页面与验收用例的对应关系；覆盖端为方案范围，尚未上线。</p><div class="table-wrap"><table class="coverage-table"><thead><tr><th>需求</th><th>页面</th><th>端范围</th><th>验收用例</th><th>确认状态</th></tr></thead><tbody>'+M.requirements.map(r=>'<tr><td><strong>'+esc(r.id+' '+r.title)+'</strong><p>'+esc(r.rule)+'</p></td><td>'+M.pages.filter(p=>p.requirements.includes(r.id)).map(p=>'<button class="text-button" data-jump="'+p.states[0]+'" data-target-end="app">'+esc(p.id+' '+p.title)+'</button>').join('<br>')+'</td><td>'+pill('APP','blue')+' '+pill('H5端','violet')+(r.id==='R-02'?' '+pill('PC 查询','teal'):'')+'</td><td>'+M.cases.filter(c=>c.requirement===r.id).map(c=>esc(c.id)).join('、')+'</td><td>'+pill('建议 / 待验收','amber')+'</td></tr>').join('')+'</tbody></table></div>';
 document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>jump(b.dataset.jump,b.dataset.targetEnd));
 window.reviewWorkbench={getEndpoint:()=>endpoint,setEndpoint,sync,getDimension:()=>dimension,setDimension(value){if(!['changes','rules','cases'].includes(value))return;dimension=value;notes();}};
 sync();
})();
