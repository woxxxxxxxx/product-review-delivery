/* Review-only visualizations. Business names, not confirmed API contracts. */
(()=>{
 'use strict';
 const M=window.PRODUCT_REVIEW,ui=window.reviewUI,$=id=>document.getElementById(id);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const name=s=>M.states.find(x=>x.id===s)?.title||s;
 const tone=s=>s==='success'?'teal':s==='failure'?'red':['unknown','help','empty','denied'].includes(s)?'amber':'blue';
 const pill=s=>'<span class="pill '+tone(s)+'">'+escape(name(s))+'</span>';
 function controls(){
  const S=window.reviewSnapshot(),editing=document.body.classList.contains('editing'),ready=['pending','unknown'].includes(S.state);
  $('initial').value=['empty','denied'].includes(S.state)?S.state:'form';
  $('initial').disabled=editing;$('reset').disabled=editing;
  $('outcome').disabled=editing||!ready;$('outcome').value='';
  $('stepHint').textContent=editing?'正在编辑画布':({form:'填写事项 → 下一步',confirm:'勾选核对 → 确认提交',pending:'已受理，等待查询结果',unknown:'结果仍未知，可再次查询',failure:'明确失败 → 重新核对',success:'办理完成 → 完成',empty:'当前入口无可办事项',denied:'当前入口无办理权限',help:'查看帮助 → 返回查询'})[S.state];
  $('stepDetail').textContent=ui.isScenario()?'场景预览：退出后恢复原演示，不覆盖草稿。':S.submissions?'本轮已提交 '+S.submissions+' 次 · 已查询 '+S.queries+' 次':'尚未提交，服务和后台没有申请记录。';
  $('queryHelp').textContent=editing?'编辑模式暂停演示；结束编辑后继续。':ready?'选择即查询，可重复选；点击画布“查询结果”默认返回未知。':S.state==='help'?'先返回结果页，再模拟查询。':S.state==='failure'?'重新核对并提交后，才能查询新的结果。':S.state==='success'?'本次已结束；点击“完成”或“重新开始”。':['empty','denied'].includes(S.state)?'入口不可办理，不会提交，也不能查询。':'请先在用户端填写、核对并提交。';
  $('demoFeedback').textContent=editing?'演示已暂停':S.queries?'第 '+S.queries+' 次查询返回：'+({success:'已完成',unknown:'结果未知，未重复提交',failure:'明确失败，允许重新核对'}[S.response]||'待确认'):'当前：'+name(S.state)+' · '+(ready?'请选择第 3 步查询返回':'按第 2 步继续');
  $('continueDemo').hidden=editing||window.reviewWorkbench.getEndpoint()!=='desktop';
 }
 $('continueDemo').onclick=()=>window.reviewWorkbench.setEndpoint('app');
 $('seeExchange').onclick=()=>selectMap('exchange');
 function selectMap(id){
  document.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.map===id)));
  ['matrix','journey','exchange','coverage'].forEach(x=>$(x+'View').hidden=x!==id);
 }
 document.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>selectMap(b.dataset.map));
 function jump(state,end='app'){ui.openScenario(state);window.reviewWorkbench.setEndpoint(end);location.hash='pages';}
 function graph(prefix){
  const marker=prefix+'-arrow';
  const nodes=[
   ['form',40,50,'填写事项','非空校验'],['confirm',310,50,'核对申请','核对后才能提交'],
   ['pending',580,50,'申请已受理','受理 ≠ 执行成功'],['query',580,215,'查询办理结果','沿用已受理的申请'],
   ['success',850,215,'办理完成','确认已执行'],['unknown',310,390,'结果未知','继续查询，不重复提交'],
   ['failure',580,390,'明确失败','保留内容，重新核对'],['help',40,390,'查询帮助','返回继续查询']
  ];
  const edge=(d,label,x,y,cls='')=>'<path class="flow-edge '+cls+'" d="'+d+'" marker-end="url(#'+marker+')"/><text class="edge-label" x="'+x+'" y="'+y+'">'+label+'</text>';
  return '<div class="diagram-meta"><span>主路径与异常恢复</span><span class="live-state"></span></div><p class="diagram-help">点击节点可预览对应页面；实线表示动作方向，当前状态用粗边框标出。完整约束见下方状态转移表。</p><div class="diagram-scroll"><svg class="state-diagram" viewBox="0 0 1090 550" aria-label="申请流程：填写、核对、受理、查询及成功、失败、未知恢复" role="group"><defs><marker id="'+marker+'" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#8697ae"/></marker></defs>'+
  '<rect class="flow-band" x="20" y="24" width="1050" height="126" rx="12"/><text class="band-title" x="850" y="64">01 发起申请</text><text class="band-note" x="850" y="89">提交前可返回修改</text><text class="band-title" x="40" y="232">02 查询与恢复</text><text class="band-note" x="40" y="256">未知不能直接重试</text>'+
  edge('M230 84 H310','下一步',270,72)+edge('M500 84 H5端80','确认提交',540,72)+
  edge('M400 118 V166 H135 V118','返回修改 · 保留输入',265,183)+
  edge('M675 118 V215','查询',699,174)+edge('M770 249 H850','已执行',810,236)+
  edge('M675 283 V390','未执行',713,342)+
  edge('M580 249 H405 V390','超时 / 未知',473,237)+
  edge('M500 424 H5端35 V307 H620 V283','继续查询',544,327)+
  edge('M770 424 H805 V10 H405 V50','重新核对',730,24)+
  edge('M310 410 H230','求助',270,398)+edge('M230 445 H310','返回',270,466)+
  '<text class="band-note" x="853" y="320">点击“完成”回到填写</text><text class="band-note" x="853" y="342">清除本轮演示</text>'+
  nodes.map(([id,x,y,title,sub])=>'<g class="flow-node '+tone(id)+'" data-state-node="'+id+'" role="button" tabindex="0" aria-label="预览'+title+'"><rect x="'+x+'" y="'+y+'" width="190" height="68" rx="9"/><text class="node-title" x="'+(x+18)+'" y="'+(y+28)+'">'+title+'</text><text class="node-sub" x="'+(x+18)+'" y="'+(y+49)+'">'+sub+'</text></g>').join('')+
  '<text class="band-note" x="310" y="501">仍未知：留在原状态，增加一次查询记录</text></svg></div><div class="entry-branches"><span>入口分支</span><button data-flow-preview="empty">暂无事项 → 返回入口</button><button data-flow-preview="denied">无办理权限 → 返回入口</button><span>均不创建申请</span></div>';
 }
 const strip=document.querySelector('#flow .flow-strip');strip.className='flow-board';strip.innerHTML=graph('state');
 $('journeyView').innerHTML='<p class="dimension-caption">APP / H5端 发起申请与查询，服务负责受理和执行，PC 查看办理记录。流程按时间从上到下排列。</p><div class="diagram-meta"><span>交互顺序 · 业务示意</span><span class="pill amber">未接入真实服务</span></div><div class="diagram-scroll">'+sequence()+'</div><div class="sequence-key"><span>→ 实线：发起请求</span><span>⇠ 虚线：返回结果</span><span>三列分别表示用户、服务、业务人员</span></div><div class="responsibility-grid"><article><b>用户 · APP / H5端</b><p>填写与核对；提交后查结果。未知时继续查询，明确失败才重试。</p></article><article><b>业务服务</b><p>受理与执行分别记录。由服务给出最终结果，不以通知或查询动作代替完成。</p></article><article><b>业务人员 · PC</b><p>查询受理和执行事实。审批、代办与结果修改不在本期范围。</p></article></div>';
 function sequence(){
  const arrow=(y,x1,x2,label,reply=false)=>'<text class="seq-label" x="'+((x1+x2)/2)+'" y="'+(y-10)+'" text-anchor="middle">'+label+'</text><path class="flow-edge '+(reply?'response':'')+'" d="M'+x1+' '+y+' H'+x2+'" marker-end="url(#seq-arrow)"/>';
  return '<svg class="sequence-diagram" viewBox="0 0 920 645" role="img" aria-label="用户端提交事项，服务返回受理编号；用户查询结果；业务后台读取同一申请"><defs><marker id="seq-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#8697ae"/></marker></defs>'+
  [[150,'APP / H5端','用户发起'],[465,'业务服务','受理与执行 · 模拟'],[780,'PC 后台','记录查询']].map(([x,t,s])=>'<rect class="lane-head" x="'+(x-105)+'" y="16" width="210" height="65" rx="9"/><text class="node-title" x="'+x+'" y="43" text-anchor="middle">'+t+'</text><text class="node-sub" x="'+x+'" y="64" text-anchor="middle">'+s+'</text><path class="lifeline" d="M'+x+' 90 V620"/>').join('')+
  '<rect class="seq-note" x="56" y="102" width="188" height="42" rx="6"/><text class="node-sub" x="150" y="129" text-anchor="middle">① 填写、校验、核对（本地）</text>'+
  arrow(188,150,465,'② 提交：办理事项')+arrow(253,465,150,'③ 返回：申请编号 + 已受理',true)+
  '<rect class="seq-note" x="372" y="277" width="186" height="43" rx="6"/><text class="node-sub" x="465" y="304" text-anchor="middle">④ 执行并记录结果</text>'+
  arrow(366,150,465,'⑤ 查询：申请编号')+arrow(431,465,150,'⑥ 返回：完成 / 明确失败 / 未知',true)+
  '<text class="band-note" x="56" y="465">未知：重复 ⑤⑥；失败：重新核对再提交</text>'+
  arrow(521,780,465,'⑦ 按申请编号查询记录')+arrow(588,465,780,'⑧ 返回：事项 + 受理 + 执行结果',true)+
  '<text class="band-note" x="575" y="632">⑦⑧ 为读取关系示意，不表示发生了网络请求</text></svg>';
 }
 function bindGraph(){
  document.querySelectorAll('[data-state-node]').forEach(n=>{
   const go=()=>jump(n.dataset.stateNode==='query'?'pending':n.dataset.stateNode);
   n.onclick=go;n.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
  });
  document.querySelectorAll('[data-flow-preview]').forEach(b=>b.onclick=()=>jump(b.dataset.flowPreview));
 }
 bindGraph();
 function exchange(){
  const S=window.reviewSnapshot(),accepted=Boolean(S.submissions),result={success:'执行成功',failure:'确认未执行',unknown:'结果未知',pending:'待确认'}[S.result]||'—';
  const values=[['办理事项','用户填写','提交时 → 服务 → PC',S.topic||'未填写',accepted?S.acceptedTopic:'尚未提交'],['申请编号','服务受理','服务 → 用户端 / PC',accepted?'DEMO-001':'尚未生成',accepted?'DEMO-001':'尚未生成'],['受理结果','服务受理','服务 → 用户端 / PC',accepted?'已受理':'尚未受理',accepted?'已受理':'无记录'],['执行结果','服务执行 / 查询','服务 → 用户端 / PC',result,accepted?result:'无记录']];
  $('exchangeView').innerHTML='<div class="diagram-meta"><span>本次演示 · 数据去向</span>'+pill(S.state)+'</div><p class="dimension-caption">'+(ui.isScenario()?'当前为独立场景预览，字段是构造的示例，不是完整操作历史。':'字段随页面操作更新；提交前仅保留在用户端，提交后后台可见。')+'</p><div class="data-route"><article><span class="pill blue">APP / H5端</span><h3>'+escape(accepted?'展示办理进度':'填写与核对')+'</h3><p>'+escape(S.topic||'尚未填写事项')+'</p></article><div class="route-arrow"><b>→</b><small>提交事项<br>← 编号 / 结果</small></div><article><span class="pill blue">业务服务 · 模拟</span><h3>'+escape(accepted?'已受理':'尚无申请')+'</h3><p>执行结果：'+escape(result)+'</p></article><div class="route-arrow"><b>→</b><small>返回记录<br>← 查询编号</small></div><article><span class="pill teal">PC 业务后台</span><h3>'+escape(accepted?'可查询记录':'暂无记录')+'</h3><p>仅查看，不修改执行结果</p></article></div><div class="data-actions"><a href="#pages" class="text-button" data-live-end="app">查看用户端 →</a><a href="#pages" class="text-button" data-live-end="desktop">查看后台记录 →</a></div><h2>字段从哪里来，流向哪里</h2><p class="dimension-caption">以下为业务字段口径，接口参数待联调确认。APP / H5端 草稿跨端同步不在本期范围。</p><div class="table-wrap"><table class="field-flow"><thead><tr><th>字段</th><th>产生方</th><th>流转时机与方向</th><th>用户端当前值</th><th>服务 / PC 当前值</th></tr></thead><tbody>'+values.map(r=>'<tr>'+r.map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><h2>本次操作轨迹 <small>最近 40 次状态动作 · 本地模拟</small></h2><ol class="trace-log">'+(S.trace?.length?S.trace.map((t,i)=>{const rule=M.transitions.find(x=>x.id===t.id);return '<li><span>'+String(i+1).padStart(2,'0')+'</span><div><strong>'+escape(name(t.from)+' → '+name(t.to))+'</strong><p>'+escape(rule?.guard+'；'+rule?.effect)+' <small>'+escape(t.id)+'</small></p></div></li>';}).join(''):'<li><div><strong>尚无操作记录</strong><p>填写并提交后生成操作记录；场景预览不包含前序操作。</p></div></li>')+'</ol>';
  $('exchangeView').querySelectorAll('[data-live-end]').forEach(b=>b.onclick=()=>window.reviewWorkbench.setEndpoint(b.dataset.liveEnd));
  document.querySelectorAll('[data-state-node]').forEach(n=>{const active=n.dataset.stateNode===S.state;n.classList.toggle('current',active);n.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('.live-state').forEach(n=>n.innerHTML='当前 '+pill(S.state)+(ui.isScenario()?' · 场景预览':''));
 }
 function sync(){controls();exchange();}
 ['review:render','review:input','review:endpoint','review:edit'].forEach(type=>document.addEventListener(type,sync));
 sync();
})();
