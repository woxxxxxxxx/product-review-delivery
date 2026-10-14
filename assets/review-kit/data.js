window.PRODUCT_REVIEW = {
  "meta": {"title": "服务申请", "version": "6.1", "stage": "draft", "environment": "example", "date": "2026-10-12", "goal": "本期增加提交前信息核对与办理进度查询，支持失败重试和结果未知时继续查询。", "initial": "form", "storage_key": "pm-review-kit-6-1-demo"},
  "summary": [
    {"label": "目标", "title": "提交后可查询结果", "text": "信息完整后提交，返回修改保留输入，结果未确认时可继续查询。"},
    {"label": "范围", "title": "填写、核对、结果查询", "text": "覆盖办理主流程及异常恢复；外部服务响应在原型中模拟。"},
    {"label": "待确认", "title": "业务规则与页面现状", "text": "业务字段、办理条件与时限待确认；现网页面待核实。"}
  ],
  "requirements": [
    {"id": "R-01", "title": "提交前核对", "rule": "办理事项必填；提交前核对，返回修改保留已填内容。", "status": "proposal"},
    {"id": "R-02", "title": "明确真实结果", "rule": "受理与完成分开表达；超时进入结果确认中，查明结果后才能显示完成。", "status": "proposal"},
    {"id": "R-03", "title": "失败可恢复", "rule": "明确失败可返回重试，查询未决时提供帮助入口；空数据及无权限给出下一步。", "status": "proposal"}
  ],
  "pages": [
    {"id": "P-01", "title": "填写办理事项", "requirements": ["R-01", "R-03"], "baseline": "unknown", "evidence": [], "states": ["form", "empty", "denied"], "changes": ["保留当前填写内容，返回时可继续编辑。", "字段错误在对应位置提示修正方法。"]},
    {"id": "P-02", "title": "核对申请", "requirements": ["R-01"], "baseline": "unknown", "evidence": [], "states": ["confirm"], "changes": ["集中展示待提交信息。", "勾选核对后提交，返回修改不丢失输入。"]},
    {"id": "P-03", "title": "办理结果", "requirements": ["R-02", "R-03"], "baseline": "unknown", "evidence": [], "states": ["pending", "unknown", "failure", "success", "help"], "changes": ["区分处理中、结果确认中、失败与完成。", "重复点击不新增申请；明确失败后允许重新尝试。"]}
  ],
  "states": [
    {"id": "form", "title": "填写", "terminal": false}, {"id": "confirm", "title": "核对", "terminal": false},
    {"id": "pending", "title": "处理中", "terminal": false}, {"id": "unknown", "title": "结果确认中", "terminal": false},
    {"id": "failure", "title": "未能完成", "terminal": false}, {"id": "success", "title": "已完成", "terminal": true},
    {"id": "empty", "title": "暂无事项", "terminal": false}, {"id": "denied", "title": "无办理权限", "terminal": false},
    {"id": "help", "title": "查询帮助", "terminal": false}
  ],
  "transitions": [
    {"id": "T-01", "from": "form", "to": "form", "event": "invalid", "guard": "事项为空", "effect": "提示填写，不提交"},
    {"id": "T-02", "from": "form", "to": "confirm", "event": "next", "guard": "事项非空", "effect": "展示核对信息"},
    {"id": "T-03", "from": "confirm", "to": "form", "event": "back", "guard": "主动修改", "effect": "保留填写内容"},
    {"id": "T-04", "from": "confirm", "to": "pending", "event": "submit", "guard": "已核对，尚未提交", "effect": "受理申请，提交次数加一"},
    {"id": "T-05", "from": "pending", "to": "success", "event": "success", "guard": "查询确认已执行", "effect": "显示完成"},
    {"id": "T-06", "from": "pending", "to": "unknown", "event": "unknown", "guard": "响应超时", "effect": "保持申请，允许查询"},
    {"id": "T-07", "from": "pending", "to": "failure", "event": "failure", "guard": "确认未执行", "effect": "保留内容，允许重试"},
    {"id": "T-08", "from": "unknown", "to": "success", "event": "success", "guard": "查询确认已执行", "effect": "显示完成，不重复提交"},
    {"id": "T-09", "from": "unknown", "to": "failure", "event": "failure", "guard": "查询确认未执行", "effect": "允许重试"},
    {"id": "T-10", "from": "unknown", "to": "unknown", "event": "unknown", "guard": "仍无确定结果", "effect": "保持查询入口和帮助入口"},
    {"id": "T-11", "from": "failure", "to": "confirm", "event": "retry", "guard": "已明确未执行", "effect": "重新核对，不直接提交"},
    {"id": "T-12", "from": "success", "to": "form", "event": "finish", "guard": "查看完成", "effect": "返回填写，清除已完成草稿"},
    {"id": "T-13", "from": "form", "to": "empty", "event": "empty", "guard": "无可办事项", "effect": "提示暂无内容"},
    {"id": "T-14", "from": "empty", "to": "form", "event": "back", "guard": "返回", "effect": "回到入口"},
    {"id": "T-15", "from": "form", "to": "denied", "event": "denied", "guard": "无办理权限", "effect": "说明不可办理"},
    {"id": "T-16", "from": "denied", "to": "form", "event": "back", "guard": "返回", "effect": "回到入口"},
    {"id": "T-17", "from": "unknown", "to": "help", "event": "help", "guard": "需要协助", "effect": "说明查询方式"},
    {"id": "T-18", "from": "help", "to": "unknown", "event": "back", "guard": "返回查询", "effect": "保留申请"},
    {"id": "T-19", "from": "pending", "to": "pending", "event": "submit", "guard": "已有处理中申请", "effect": "忽略重复提交"},
    {"id": "T-20", "from": "form", "to": "form", "event": "refresh", "guard": "刷新页面", "effect": "恢复本地示例草稿"}
  ],
  "coverage": [
    {"category": "happy", "mode": "required"}, {"category": "validation", "mode": "required"},
    {"category": "failure", "mode": "required"}, {"category": "unknown", "mode": "required"},
    {"category": "return", "mode": "required"}, {"category": "retry", "mode": "required"},
    {"category": "duplicate", "mode": "required"}, {"category": "permission", "mode": "required"},
    {"category": "empty", "mode": "required"}, {"category": "refresh", "mode": "required"},
    {"category": "boundary", "mode": "na", "reason": "示例仅定义必填，生产字段长度与业务边界需项目确认。"},
    {"category": "partial", "mode": "na", "reason": "示例只有一个办理结果，无组合子任务。"},
    {"category": "concurrency", "mode": "na", "reason": "本地示例无共享资源，真实接口并发需联调。"}
  ],
  "cases": [
    {"id": "C-01", "requirement": "R-01", "category": "happy", "given": "填写事项并核对", "path": ["T-02", "T-04", "T-05"], "expected": "success", "assertion": "申请执行确认后显示已完成", "result": "not-run"},
    {"id": "C-02", "requirement": "R-01", "category": "validation", "given": "事项留空", "path": ["T-01"], "expected": "form", "assertion": "提示请填写办理事项，不跳转", "result": "not-run"},
    {"id": "C-03", "requirement": "R-01", "category": "return", "given": "已填事项进入核对", "path": ["T-02", "T-03"], "expected": "form", "assertion": "返回保留已填写文本", "result": "not-run"},
    {"id": "C-04", "requirement": "R-02", "category": "unknown", "given": "提交后响应超时", "path": ["T-02", "T-04", "T-06", "T-10", "T-08"], "expected": "success", "assertion": "未知时不重新提交，查询确认后完成", "result": "not-run"},
    {"id": "C-05", "requirement": "R-03", "category": "failure", "given": "确认未执行", "path": ["T-02", "T-04", "T-07"], "expected": "failure", "assertion": "显示失败及重新核对入口", "result": "not-run"},
    {"id": "C-06", "requirement": "R-03", "category": "retry", "given": "明确失败后重试", "path": ["T-02", "T-04", "T-07", "T-11", "T-04", "T-05"], "expected": "success", "assertion": "保留输入，重新核对后完成", "result": "not-run"},
    {"id": "C-07", "requirement": "R-02", "category": "duplicate", "given": "已提交仍在处理中", "path": ["T-02", "T-04", "T-19"], "expected": "pending", "assertion": "请求计数不增加", "result": "not-run"},
    {"id": "C-08", "requirement": "R-03", "category": "permission", "given": "无办理权限", "path": ["T-15", "T-16"], "expected": "form", "assertion": "显示权限原因，可返回", "result": "not-run"},
    {"id": "C-09", "requirement": "R-03", "category": "empty", "given": "暂无可办事项", "path": ["T-13", "T-14"], "expected": "form", "assertion": "空状态有返回路径", "result": "not-run"},
    {"id": "C-10", "requirement": "R-01", "category": "refresh", "given": "填写后刷新", "path": ["T-20"], "expected": "form", "assertion": "恢复本地示例草稿", "result": "not-run"}
  ],
  "evidence": [],
  "decisions": [{"id": "D-01", "question": "现网入口、字段、资格和办理时限分别是什么？", "owner": "产品 / 业务", "status": "open", "blocking": true, "impact": "P-01 至 P-03 的现状及生产规则尚不能确定"}],
  "reviews": [
    {"role": "user", "status": "pending", "scope": "任务理解、失败后下一步"},
    {"role": "business", "status": "pending", "scope": "规则与范围"},
    {"role": "design", "status": "pending", "scope": "现网一致、可读与焦点"},
    {"role": "engineering", "status": "pending", "scope": "操作结果与完成标准"},
    {"role": "qa", "status": "pending", "scope": "边界和可执行预期"},
    {"role": "operations", "status": "pending", "scope": "异常承接与处理记录"}
  ],
  "artifacts": [{"path": "index.html", "version": "6.1", "kind": "prototype"}]
};
