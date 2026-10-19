# 跨宿主调度与交接

共用知识整理职责与数据契约，调度使用当前宿主实际提供的能力。以下官方文档核对日期为 2026-10-19。工具、设置或版本可能变化，运行时先检查当前会话；不能把某个平台的工具名写成跨平台 API。

## 共用交接包

主 Agent 先完成材料收集，再发送自包含任务包。绝对路径必须能被子 Agent 访问；无法共享文件时直接附上必要内容。

```text
角色：知识整理，不负责渲染或发布。
任务：把 <主题> 的材料整理为可解释内部机制的知识结构。
受众与学习问题：<受众、看完需回答的问题>。
适用条件与范围：<协议、缓存、业务假设等>。
材料：<来源 ID、标题、定位、摘要或原文、可访问路径>。
约束：保留包含、依赖、先后、并行和条件关系；
      只展开理解核心机制需要的细节，相关扩展单列；
      每个机制节点关联来源；缺口、冲突和推断显式报告；
      不运行渲染、不修改材料、不发布。
数据契约：<skill>/references/story-contract.md。
输出：knowledge.json 内容或约定输出路径、结构说明、
      尚未解决的问题、来源关联、实际使用的材料。
```

输出路径由主 Agent 分配，避免双方同时写同一个文件。主 Agent 等待完成并读取成果，不能在整理未完成时依据猜测先写分镜。审查见 [研究与组织](research-and-structure.md)。

委派失败时可重试明确可修复的问题；工具不存在、宿主不支持或能力不可用时顺序完成相同职责。顺序模式仍要独立整理知识结构、检查依据，再编排动画，不能跳过组织环节。

在 `knowledge.json` 的 `workflow` 中记录 `host`、`mode`（`native` 或 `sequential`）和 `reason`；补充实际委派证据、审查结果或降级原因到可读稿。不要虚构子 Agent ID、工具调用、并行数或实测结论。

## Codex

依据：[子 Agent 官方文档](https://learn.chatgpt.com/docs/agent-configuration/subagents)。

- 当前 Codex 可按用户或适用 Skill 指令委派。本 Skill 已明确请求知识整理委派，但仍以当前会话暴露的原生能力为准。
- 用可用的原生委派工具创建整理任务，显式附交接包；等待返回并审核。即使可继承部分上下文，也不省略任务和材料。
- 默认继承宿主和用户的模型选择，不为了本 Skill 固定某个模型或无意义地增加 Agent。
- 不需要注册专用角色也能完成时直接委派。需要复用角色时，可选用 `assets/host-configs/codex/knowledge-organizer.toml`，人工放入调用项目 `.codex/agents/`；不修改全局配置。

## Claude Code

依据：[自定义子 Agent 官方文档](https://code.claude.com/docs/en/sub-agents)。

- 使用会话提供的原生子 Agent 能力或已注册角色，并显式传入任务材料。子 Agent 有自己的上下文，不假定收到完整主对话。
- 可选项目角色模板：`assets/host-configs/claude/knowledge-organizer.md` → 调用项目 `.claude/agents/knowledge-organizer.md`。
- 模板的 `skills: [knowledge-motion]` 请求预加载已安装且可用的 Skill；它不代替材料包，也不能证明 Skill 已在当前子 Agent 中加载。检查实际加载情况。
- 不开启额外权限模式、不改模型、不修改用户级 `~/.claude/`。当前会话无法识别新目录或角色时按官方说明重启会话，或顺序继续。

## WorkBuddy

依据：[技能官方说明](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market)。

- 使用“技能 → 添加技能 → 上传技能”导入完整包；导入后确认已启用。保留脚本、锁文件和模板，不只上传一个入口文件。
- 官方页面确认本地技能导入与调用，但没有给出可据此通用实现的子 Agent 注册文件及调度 API。本包不提供猜测的注册格式。
- 当前会话确有原生委派能力时，用共用交接包调度并等待；未暴露时使用顺序模式。如实记录，不把“多 Agent 产品能力”当成本次委派证据。
- 渲染仍需要本地执行 Node.js、浏览器和 FFprobe 的能力；缺少执行能力时保留资料与源项目并说明未渲染。

## TRAE 国内版

依据：[子智能体](https://docs.trae.cn/ide_subagents)、[技能](https://docs.trae.cn/ide_skills)。

- Skill 使用调用项目 `.trae/skills/knowledge-motion/`；若从其他兼容目录导入，按当前设置确认成功识别。
- 官方说明仅内置智能体“Agent”能调用 Subagent。自定义主智能体或未开启该功能时，不假定能委派。
- 可选项目角色模板：`assets/host-configs/trae/knowledge-organizer.md` → 调用项目 `.trae/agents/knowledge-organizer.md`。确认目录功能和角色在当前版本可用后，由内置 Agent 根据描述调度。
- Subagent 有独立上下文。主 Agent 显式传入材料、路径和输出契约；不依赖 description 自动补足任务。
- 不写用户级 `~/.trae-cn/`，不静默开启设置。当前环境不可用时按顺序模式完成。

## 可选模板的使用边界

模板放在 Skill 的 assets 中，不会自动安装或加载。确需注册时，先检查调用项目是否已有同名角色；保留既有配置，选择其他名称或在既有授权下合并。只复制到调用项目，不能借任务修改全局设置。模板省略模型和权限提升；实际工具受宿主和项目授权约束。

## 验证状态

| 宿主 | 本地验证范围 |
| --- | --- |
| Codex | 2.0 验收包含原生委派与显式顺序降级；实际结果及证据以本次项目验收记录为准 |
| Claude Code | 官方文档与交接契约核对，尚未在该宿主实测 |
| WorkBuddy | 官方文档与交接契约核对，尚未在该宿主实测 |
| TRAE 国内版 | 官方文档与交接契约核对，尚未在该宿主实测 |

不能将文档兼容、配置可解析或源码静态检查写成四宿主全流程通过。
