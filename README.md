# 产品评审交付 Skill

面向产品经理的方案、PRD、业务流程和交互原型交付规范，包含可离线使用的 HTML 评审外壳。

分享包日期：2026-10-14。按当日 skill 源目录打包，含最新 App 组件规范与悬停规则标注；示例模板内部版本仍为 6.1，二者不是同一版本编号。

## 下载与安装

1. 下载本仓库的 ZIP，或下载 Releases 中的安装包并解压。
2. 将完整的 `product-review-delivery` 文件夹放入当前工具的 skills 目录。Codex 本地安装可使用 `$CODEX_HOME/skills/product-review-delivery/`，未配置 CODEX_HOME 时通常是用户目录下的 `.codex/skills/product-review-delivery/`。
3. 检查 `SKILL.md` 位于上述文件夹的第一层，同时保留 `assets/`、`references/`、`scripts/` 和 `agents/`。不要只复制 SKILL.md。
4. 若已安装旧版，先保留旧版副本，再替换完整目录；不要覆盖项目原型或未导出的编辑稿。
5. 新开会话并明确输入 `使用 $product-review-delivery`，确认工具能读取该 skill 和模板资源。其他支持 Skill 的工具使用各自的安装位置。

本包允许隐式调用，但实际自动选择取决于使用工具和环境，不能保证每次自动命中。显式指定最可靠。本仓库不会修改全局 AGENTS.md 或自动授予账号、生产系统权限。

## 新需求

可复制这段给助手：

> 使用 $product-review-delivery，直接复制 assets/review-kit 作为评审外壳，不自行重写外壳。按项目需求裁剪无关模块，只替换项目内容、业务画布和交互。业务画布沿用已核实的现状或已批准设计，不套用模板的“服务申请”示例。先读取项目当前入口，交付前验证主流程、异常、返回及编辑导出，最后更新项目当前入口。

## 旧需求迁移

> 使用 $product-review-delivery，将项目最新原型迁移到最新评审外壳，保留已确认业务方案、现网样式、字段、流程和异常处理。先梳理原页面与模板区域的映射，保留旧版，不擅自改业务规则。说明和演示开关放画布外；用户界面放画布内。迁移后检查功能是否完整，实际验证主流程、异常、返回及编辑导出，并更新项目当前入口。

原则：新需求基于模板创建；旧需求保留业务、迁移外壳。模板的完整流程是能力示例，不是每个项目必须新增的功能。

## 模板预览

- 多文件入口：下载后打开 `assets/review-kit/index.html`。
- 单文件入口：下载后打开 `examples/review-template.html`。
- HTML 可离线打开，无需联网、后端或安装依赖；GitHub 的文件页主要展示源码，需下载后用浏览器打开。

模板包含：业务（含运营职责）、UI/设计、前端、后端、测试、产品/全部视角；APP、H5端与 PC 后台；页面对照、流程、数据流转、规则标注、文案编辑、组件组排序和交接导出。

保存草稿只保存在当前浏览器。分享修改需导出 HTML 或交接包；不会自动回写正式源文件。移动组件可能影响阅读与操作顺序，仍需评审。

## 验证与维护

以下命令在本仓库根目录执行；检查脚本使用 Python 3，重建与交接读取使用 Node.js，无第三方运行时依赖：

```text
python scripts/check_contract.py assets/review-kit/data.js
python scripts/test_contract.py
node scripts/build_review_bundle.cjs examples/review-template.html
node scripts/inspect_review_edits.cjs <修改.json或导出的HTML>
```

修改模板 HTML/CSS/JS 后必须重建导出资源和单文件，否则导出内容仍可能是旧版。检查通过只证明结构或原型行为，不证明真实业务、线上一致性或生产验收。

可选配套 skill：chinese-product-ux-copy、deliverable-content-qa，以及文档渲染工具；本包不捆绑它们。未安装时仍可按 references 中的检查规范审阅，不宣称已运行不存在的工具。

## 包含与不包含

包含 skill 指令、示例模板、组件与证据规范、校验/构建/交接脚本、示例评估题及离线预览。

不包含真实项目文档、现网截图、客户数据、账号凭据、个人聊天记录、浏览器草稿或工作区全局配置。文档中的业务案例均为规范说明与示例，不作为真实项目事实。

参考资料链接保留在对应规范末尾；引用不表示相关品牌背书。对外发布具体项目材料前，仍需遵守所在组织的数据与审批要求。
