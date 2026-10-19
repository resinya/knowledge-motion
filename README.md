<div align="center">
  <img src="assets/knowledge-motion-logoword.png" alt="Knowledge Motion" width="760" />

  <p>
    <a href="skills/knowledge-motion/SKILL.md"><img alt="Skill: knowledge-motion" src="https://img.shields.io/badge/Skill-knowledge--motion-3564ED" /></a>
    <img alt="静音 MP4" src="https://img.shields.io/badge/Output-Silent_MP4-059669" />
    <img alt="Remotion and SVG" src="https://img.shields.io/badge/Built_with-Remotion_%2B_SVG-2563EB" />
    <img alt="四种 Agent 宿主" src="https://img.shields.io/badge/Agents-Codex_%7C_Claude_%7C_WorkBuddy_%7C_TRAE-7C3AED" />
    <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-475569" /></a>
  </p>

  <p><strong>先组织知识，再解释机制。</strong><br />
  从可信资料出发，整理模块与内部过程，用动态信息图讲清对象、动作、原因和结果。<br />
  输出静音视频，并保留知识结构、分镜与可修改的动画源项目。</p>

  <p>
    <a href="https://resinya.github.io/knowledge-motion/">官网</a> ·
    <a href="https://resinya.github.io/knowledge-motion/examples">效果案例</a> ·
    <a href="https://resinya.github.io/knowledge-motion/docs/guide">使用指南</a>
  </p>
</div>

## 它能做什么

**资料研究 → 知识结构 → 讲解编排 → 动画制作。** 默认面向初学者，展开理解主流程所需的内部机制；来源关联到具体知识节点。

| 内容 | 画面表达 |
| --- | --- |
| 多方交互与协议 | 报文方向、传递顺序和双方状态 |
| 结构构建与合并 | 树增长、并行汇合、代码与结果联动 |
| 业务过程 | 大模块与必要子过程，条件分支及衔接结果 |
| 分类与数值变化 | 逐项聚焦、稳定配色、连续状态 |

保留深色风格与当前位置导航，按关系自动选择横屏或竖屏，内容决定时长。默认 30 fps、无音轨 MP4。支持生成项目中的自定义 SVG／React 场景。

## 安装与使用

```bash
npx skills add resinya/knowledge-motion --skill knowledge-motion --agent codex --global --copy
```

Claude Code 将 `codex` 改为 `claude-code`；去掉 `--global` 可安装到当前项目。WorkBuddy 与 TRAE 国内版的导入、委派和降级说明见 [宿主适配](skills/knowledge-motion/references/host-adapters.md)。后三者已核对官方文档与交接契约，尚未完成宿主实测。

```text
用 $knowledge-motion 讲清“输入网址后发生什么”，面向初学者，
研究可信资料，展开 TCP 握手和浏览器渲染机制，自动选择画幅与时长，输出静音 MP4。
```

也可以提供资料、受众、尺寸、时长与输出目录。主 Agent 收集资料，优先委派知识整理子 Agent，审核后自动继续制作；宿主无法委派时顺序完成并如实记录。运行需要 Node.js 20.19+、FFprobe 和 Chromium 系浏览器，首次安装渲染依赖需要网络。

## 内容与交付

- **静音 MP4**：一条带章节的完整视频。
- **知识结构**：`knowledge.json` 与 `knowledge.md`，保留模块、子过程、关系和来源。
- **分镜**：v2 `story.json` 与 `storyboard.md`，保存场景、知识引用、时长与动作。
- **独立源项目**：Remotion＋SVG 源码、预览和媒体检查结果，均保存在调用项目中。

仓库提供 [浏览器访问](skills/knowledge-motion/examples/browser)、[端口分类](skills/knowledge-motion/examples/ports)、[网购订单](skills/knowledge-motion/examples/shopping) 与 [模拟家庭收支](skills/knowledge-motion/examples/budget) 的成对内容示例。创建项目时同时传入 `--knowledge` 和 `--story`；详见 [Skill 说明](skills/knowledge-motion/SKILL.md)。

Skill 自有代码采用 [MIT](LICENSE) 许可证；渲染依赖遵循 [Remotion 许可证](https://www.remotion.dev/docs/license)。
