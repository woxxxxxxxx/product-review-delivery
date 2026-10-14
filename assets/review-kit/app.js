'use strict';
const M = window.PRODUCT_REVIEW;
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const table = (heads, rows) => '<table><thead><tr>'+heads.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
const fresh = () => ({state:'form',topic:'',acceptedTopic:'',ack:false,submissions:0,queries:0,response:'',result:'',trace:[]});
let S = fresh();
try { const saved=JSON.parse(localStorage.getItem(M.meta.storage_key)||'null'); if(saved && M.states.some(x=>x.id===saved.state)) S={...fresh(),...saved}; } catch {}
let error='';
let scenarioBase=null;
function save(){if(scenarioBase)return;try{localStorage.setItem(M.meta.storage_key,JSON.stringify(S));}catch{}}
function move(event){const t=M.transitions.find(x=>x.from===S.state&&x.event===event);if(!t)return false;const from=S.state;S.state=t.to;error='';if(event==='submit'&&from==='confirm')S.result='pending';if(['success','failure','unknown'].includes(event))S.result=event;S.trace=[...(S.trace||[]),{id:t.id,event,from,to:t.to}].slice(-40);save();render();return true;}
function query(result){if(document.body.classList.contains('editing')||!['pending','unknown'].includes(S.state)||!['success','unknown','failure'].includes(result))return;S.queries++;S.response=result;move(result);}
function action(event){
  if(event==='next'&&!S.topic.trim()){move('invalid');error='请填写办理事项';render();$('topic').focus();return;}
  if(event==='submit'){
    if(S.state==='pending'){move('submit');return;}
    if(S.state!=='confirm'||!S.ack||!S.topic.trim())return;
    S.submissions++;S.acceptedTopic=S.topic;S.queries=0;S.response='';
  }
  if(event==='back'&&S.state==='confirm')S.ack=false;
  if(event==='retry')S.ack=false;
  if(event==='finish'){S={...fresh()};save();render();return;}
  move(event);
}
function button(label,event,secondary=false,disabled=false){return '<button data-event="'+esc(event)+'" class="'+(secondary?'secondary':'')+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';}
function render(){
 const state=M.states.find(x=>x.id===S.state),p=M.pages.find(x=>x.states.includes(S.state));
 $('pageLabel').textContent=p.id+' · '+p.title;
 $('baseline').querySelector('.panel-label span').textContent=p.baseline==='verified'?'已实测':p.baseline==='new'?'新增页':'待核实 / 历史参考';
 const ev=M.evidence.find(e=>p.evidence.includes(e.id));
 $('baselineContent').innerHTML=ev?.screenshot?'<img src="'+esc(ev.screenshot)+'" alt="现状记录"><p>'+esc(ev.environment)+' · '+esc(ev.version)+' · '+esc(ev.captured_at)+'</p>':'<div class="empty-icon">▧</div><h3>现状页面待核实</h3><p>当前缺少本页、同一状态的现状记录，改动范围待现状核验后确认。</p>';
 $('pageNotes').innerHTML='<h2>页面说明</h2><h3>'+esc(p.title)+'</h3><ul>'+p.changes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p>页面 '+esc(p.id)+'<br>关联需求 '+p.requirements.map(esc).join(' / ')+'</p><p class="note-status">现状'+(p.baseline==='verified'?'已核实':p.baseline==='new'?'：新增页面':'待核实')+' · 方案待评审</p>';
 let html='';
 if(S.state==='form')html='<div class="step">1 / 2　填写信息</div><h3>办理申请</h3><p>填写本次需要办理的事项。</p><label for="topic">办理事项</label><input id="topic" type="text" value="'+esc(S.topic)+'" aria-invalid="'+Boolean(error)+'" aria-describedby="field-error"><div id="field-error" class="error" role="alert">'+esc(error)+'</div><div class="actions">'+button('下一步','next')+'</div>';
 else if(S.state==='confirm')html=button('‹ 返回修改','back',true)+'<div class="step">2 / 2　核对信息</div><h3>确认申请</h3><div class="row"><span>办理事项</span><strong>'+esc(S.topic)+'</strong></div><label><input id="ack" type="checkbox" '+(S.ack?'checked':'')+'> 我已核对办理事项</label><div class="actions">'+button('确认提交','submit',false,!S.ack)+'</div>';
 else {
  const views={pending:['…','申请已受理','正在办理，可查询最新结果。'],unknown:['?','结果确认中','暂未取得确定结果，请稍后查询，避免重复申请。'],failure:['!','未能完成','本次申请未生效，可核对信息后重新提交。'],success:['✓','办理已完成','本次申请已生效。'],empty:['—','暂无可办事项','可返回入口查看其他服务。'],denied:['—','暂时无法办理','当前账号没有此事项的办理权限，请返回其他服务。'],help:['?','查询帮助','申请已提交，无需重复申请。返回结果页后可再次查询办理进度。']};
  const v=views[S.state];html='<div class="status-icon">'+v[0]+'</div><h3>'+v[1]+'</h3><p>'+v[2]+'</p>';
  if(['pending','unknown','failure','success','help'].includes(S.state))html+='<div class="row"><span>申请编号</span><strong>DEMO-001</strong></div>';
  html+='<div class="actions">';
  if(['pending','unknown'].includes(S.state))html+='<button id="query">查询结果</button>'+(S.state==='unknown'?button('查询帮助','help',true):'');
  else if(S.state==='failure')html+=button('重新核对','retry');
  else if(S.state==='success')html+=button('完成','finish');
  else html+=button('返回','back',true);
  html+='</div>';
 }
 $('canvas').innerHTML=html;
 // Layout groups preserve labels, inputs and errors as one indivisible component.
 const groupMap=S.state==='form'?{intro:'.step,h3,p',field:'label,input,.error',actions:'.actions'}:S.state==='confirm'?{back:':scope > button',intro:'.step,h3',details:'.row',ack:'label',actions:'.actions'}:{intro:'.status-icon,h3,p',details:'.row',actions:'.actions'};
 for(const [id,selector] of Object.entries(groupMap)){const elements=[...$('canvas').querySelectorAll(selector)];if(!elements.length)continue;const box=document.createElement('div');box.dataset.layoutGroup=id;box.className='layout-group';elements[0].before(box);elements.forEach(el=>box.append(el));}
 $('canvas').querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>action(b.dataset.event));
 if($('topic'))$('topic').oninput=e=>{S.topic=e.target.value;save();document.dispatchEvent(new CustomEvent('review:input'));};
 if($('ack'))$('ack').onchange=e=>{S.ack=e.target.checked;save();render();$('ack').focus();};
 if($('query'))$('query').onclick=()=>query('unknown');
 const serviceState=S.submissions?(M.states.find(x=>x.id===S.result)?.title||'待确认'):'尚未提交';
 $('adminState').textContent=serviceState;
 $('adminTopic').textContent=S.acceptedTopic||'—';
 $('adminAccepted').textContent=S.submissions?'已受理':'—';
 $('adminResult').textContent=S.result==='success'?'执行成功':S.result==='failure'?'未生效':S.submissions?'待确认':'—';
 $('adminInfo').textContent='DEMO-001 · 办理事项：'+(S.acceptedTopic||'未填写')+' · 当前状态：'+serviceState+'。受理和执行结果分别记录。';
 document.dispatchEvent(new CustomEvent('review:render'));
}
$('title').textContent=M.meta.title;
$('meta').textContent='V'+M.meta.version+' · '+M.meta.date;
$('printMeta').textContent='V'+M.meta.version+' · 建议稿 · '+M.meta.date;
$('goal').textContent=M.meta.goal;
$('summary').innerHTML=M.summary.map(x=>'<article><small>'+esc(x.label)+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p></article>').join('');
const stateName=id=>M.states.find(x=>x.id===id)?.title||id;
$('transitionTable').innerHTML=table(['编号','当前状态','触发条件','下一状态','处理结果'],M.transitions.map(t=>[t.id,stateName(t.from),t.guard,stateName(t.to),t.effect]));
$('requirements').innerHTML=M.requirements.map(r=>'<article class="rule"><b>'+esc(r.id)+'</b><div><strong>'+esc(r.title)+'</strong><p>'+esc(r.rule)+'</p></div></article>').join('');
$('caseTable').innerHTML=table(['用例','前置条件','操作路径','预期','执行状态'],M.cases.map(c=>[c.id,c.given,c.path.join(' → '),c.assertion,c.result==='pass'?'已通过':c.result==='fail'?'未通过':'待执行']));
$('decisionList').innerHTML=M.decisions.map(d=>'<article class="decision"><small>'+esc(d.id)+' · '+(d.status==='open'?'待确认':'已确认')+' · '+esc(d.owner)+'</small><h3>'+esc(d.question)+'</h3><p>'+esc(d.impact)+'</p></article>').join('');
const roleNames={user:'用户',business:'业务 · 规则与范围',design:'UI / 设计',engineering:'研发',qa:'测试',operations:'业务 · 办理与异常'};
$('reviewList').innerHTML=M.reviews.filter(r=>r.role!=='operations').map(r=>'<p>'+esc(roleNames[r.role])+'：'+esc(r.role==='business'?r.scope+'、'+(M.reviews.find(x=>x.role==='operations')?.scope||'办理与异常'):r.scope)+' · '+(r.status==='pass'?'已检查':'待项目走查')+'</p>').join('');
$('evidenceSummary').textContent=M.evidence.length?'已登记 '+M.evidence.length+' 条证据，请核对对应环境与版本。':'现状尚未核实，线上一致性待验证。';
let currentView='proposal';
function setView(v){currentView=v;$('compare').hidden=v==='desktop';$('desktop').hidden=v!=='desktop';$('compare').classList.toggle('proposal',v==='proposal');document.querySelector('.review-area').classList.toggle('desktop-mode',v==='desktop');document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));$('notesToggle').disabled=false;$('previewBadge').textContent=v==='desktop'?'业务工作区':'交互原型';document.dispatchEvent(new CustomEvent('review:view',{detail:v}));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function toggle(button,target){const hidden=!$(target).hidden;$(target).hidden=hidden;$(button).setAttribute('aria-expanded',String(!hidden));}
$('toolsToggle').onclick=()=>toggle('toolsToggle','demoTools');
$('notesToggle').onclick=()=>{toggle('notesToggle','pageNotes');document.dispatchEvent(new CustomEvent('review:dimension'));};
$('adminDetail').onclick=()=>toggle('adminDetail','adminInfo');
$('reset').onclick=()=>{scenarioBase=null;S=fresh();error='';save();$('initial').value='form';$('outcome').value='';$('adminInfo').hidden=true;$('adminDetail').setAttribute('aria-expanded','false');render();};
$('initial').onchange=()=>{scenarioBase=null;S=fresh();error='';$('outcome').value='';const initial=$('initial').value;if(initial!=='form')move(initial);else {save();render();}};
$('outcome').onchange=()=>query($('outcome').value);
$('print').onclick=()=>window.print();
$('decisionCount').textContent=M.decisions.filter(d=>d.status==='open').length;
const sections=['pages','map','overview','flow','rules','decisions'];
const sectionNames={pages:'页面原型',map:'多端全景',overview:'需求说明',flow:'状态流程',rules:'验收清单',decisions:'待确认事项'};
function navigate(){const requested=location.hash.slice(1),id=sections.includes(requested)?requested:'pages';document.querySelectorAll('.view-section').forEach(s=>s.hidden=s.id!==id);$('sectionTitle').textContent=sectionNames[id];document.querySelectorAll('.sidebar nav a').forEach(a=>{const active=a.hash==='#'+id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});window.scrollTo(0,0);document.dispatchEvent(new CustomEvent('review:navigate'));}
window.addEventListener('hashchange',navigate);
let printDetails=[];
let printState=null;
window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('details')].filter(d=>!d.open);printDetails.forEach(d=>d.open=true);printState={view:currentView,notesHidden:$('pageNotes').hidden};setView('compare');$('pageNotes').hidden=false;});
window.addEventListener('afterprint',()=>{printDetails.forEach(d=>d.open=false);printDetails=[];if(printState){setView(printState.view);$('pageNotes').hidden=printState.notesHidden;printState=null;}});
render();
navigate();
// Read-only diagnostics for local prototype verification; not a business API.
window.reviewSnapshot=()=>({...S});
window.reviewUI={render,setView,query,getView:()=>currentView,isScenario:()=>Boolean(scenarioBase),openScenario(id){if(!M.states.some(s=>s.id===id))return;if(!scenarioBase)scenarioBase={...S};S={...fresh(),state:id,topic:id==='form'?'':'更新示例资料',acceptedTopic:['pending','unknown','failure','success','help'].includes(id)?'更新示例资料':'',ack:!['form','confirm'].includes(id),submissions:['pending','unknown','failure','success','help'].includes(id)?1:0,result:['pending','unknown','failure','success','help'].includes(id)?(id==='help'?'unknown':id):''};error='';render();},exitScenario(){if(!scenarioBase)return;S={...scenarioBase};scenarioBase=null;error='';render();}};
