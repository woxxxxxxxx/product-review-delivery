/* Shared, deterministic presentation-only contract; also used by the handoff reader. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.reviewPresentation=factory();})(typeof window==='object'?window:globalThis,()=>{
 const styles={color:/^#[0-9a-f]{6}$/i,backgroundColor:/^#[0-9a-f]{6}$/i,fontSize:/^(12|14|16|20|24|28|32)px$/,textAlign:/^(left|center|right)$/};
 const groups=state=>state==='form'?['intro','field','actions']:state==='confirm'?['back','intro','details','ack','actions']:['empty','denied'].includes(state)?['intro','actions']:['intro','details','actions'];
 const labels={intro:'标题与说明',field:'输入区',actions:'操作按钮组',back:'返回入口',details:'信息摘要',ack:'核对选项'};
 function validate(doc,M,digest){
  const project=M.meta.storage_key+':'+M.meta.version;
  if(!doc||doc.format!=='pm-review-edits'||doc.version!==1||doc.project!==project||!doc.edits||typeof doc.edits!=='object'||Array.isArray(doc.edits))throw Error('文件格式或模板版本不匹配，未导入。');
  if(doc.baseDigest&&digest&&doc.baseDigest!==digest)throw Error('基础模板已变化，请先核对版本差异，不直接覆盖。');
  const clean={};if(Object.keys(doc.edits).length>300)throw Error('修改数量超出支持范围。');
  for(const [key,value] of Object.entries(doc.edits)){
   const [end,state,id,...rest]=key.split('/');
   if(rest.length||!['app','h5','desktop'].includes(end)||!(state==='chrome'||M.states.some(s=>s.id===state))||!value||typeof value!=='object'||Array.isArray(value))throw Error('存在无法识别的修改目标。');
   if(id==='layout'){
    if(end==='desktop'||state==='chrome'||Object.keys(value).some(k=>k!=='order'))throw Error('仅支持移动画布同页组件排序。');
    const expected=groups(state),order=value.order;
    if(!Array.isArray(order)||order.length!==expected.length||new Set(order).size!==order.length||!order.every(x=>expected.includes(x)))throw Error('组件顺序缺失、重复或包含未知组件。');
    clean[key]={order:[...order]};continue;
   }
   if(!/^(title|description|step|fieldLabel|rowLabel|button-(next|back|submit|retry|finish|help|query|adminDetail)|column-[0-6])$/.test(id)||Object.keys(value).some(k=>!['text','style'].includes(k)))throw Error('修改文件含不支持的字段或目标。');
   const v={};
   if(Object.hasOwn(value,'text')){if(typeof value.text!=='string'||!value.text.trim()||value.text.length>1000)throw Error('文字不能为空，且需在 1000 字以内。');v.text=value.text;}
   if(value.style){if(typeof value.style!=='object'||Array.isArray(value.style))throw Error('样式格式不正确。');v.style={};for(const [k,s] of Object.entries(value.style)){if(!Object.hasOwn(styles,k)||typeof s!=='string'||!styles[k].test(s))throw Error('样式仅支持颜色、字号和对齐。');v.style[k]=s;}}
   clean[key]=v;
  }return clean;
 }
 return {styles,groups,labels,validate};
});
