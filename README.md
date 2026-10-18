<div align="center">
  <img src="assets/knowledge-motion-logoword.png" alt="Knowledge Motion — Turn knowledge into motion" width="760" />

  <p>
    <a href="skills/knowledge-motion/SKILL.md"><img alt="Skill: knowledge-motion" src="https://img.shields.io/badge/Skill-knowledge--motion-0891B2" /></a>
    <img alt="Output: silent MP4" src="https://img.shields.io/badge/Output-Silent_MP4-059669" />
    <img alt="Remotion and SVG" src="https://img.shields.io/badge/Built_with-Remotion_%2B_SVG-2563EB" />
    <img alt="Codex and Claude Code" src="https://img.shields.io/badge/Agents-Codex_%7C_Claude_Code-7C3AED" />
    <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-475569" /></a>
  </p>

  <p><strong>把知识变成看得懂的动态过程。</strong><br />
  将任意领域的分类、流程与状态变化制作成深色动态信息图和静音 MP4，<br />
  同时保留可修改的 Remotion＋SVG 源项目与简要分镜。</p>

  <p>
    <a href="#使用">使用</a> · <a href="#安装">安装</a> · <a href="#最佳实践网购订单流程">最佳实践</a> ·
    <a href="https://resinya.github.io/RepoPilot/">文档网站</a> ·
    <a href="https://resinya.github.io/RepoPilot/examples">效果案例</a> ·
    <a href="https://resinya.github.io/RepoPilot/changelog">版本更新</a>
  </p>
</div>

固定分区保留全貌，逐步聚焦引导视线，对象沿路径传递，完成结果留在原处。适合知识短视频、分类速查、流程说明和状态变化演示。

## 最佳实践：网购订单流程

一个模拟订单，六个固定分区：**下单付款 → 商家接单 → 仓库拣货 → 打包出库 → 物流运输 → 签收完成**。当前步骤亮起，光点沿路径移动，已完成的步骤保留结果。

<p align="center">
  <a href="assets/examples/shopping-flow.png"><img src="assets/examples/shopping-flow.png" alt="网购订单流程动态信息图的实际渲染帧：物流运输正在聚焦，已完成步骤保留结果" width="420" /></a>
</p>

这是实际渲染的动作中段画面。对应成片为 **20 秒、1080×1920、30 fps、无音轨**；[查看完整分镜](skills/knowledge-motion/examples/shopping.json)，或按下方命令生成同款示例。

## 使用

在 Codex 或 Claude Code 中加载完整的 `skills/knowledge-motion/` 后说：

```text
用 $knowledge-motion 制作“网购订单从付款到签收的过程”，20 秒，输出静音 MP4。
把这份资料做成分类速查动画，保持整图可见，逐项聚焦。
用模拟账本演示家庭收入与支出怎样改变余额。
```

默认 9:16、1080×1920、30 fps、20 秒，通常在 15–25 秒内完成。只制作本地视频，发布按用户要求另行处理。

## 安装

从当前本地 checkout 安装：

```bash
npx skills add . --skill knowledge-motion --agent codex --global --copy
```

Claude Code 将 `codex` 改成 `claude-code`；项目安装去掉 `--global`。也可复制完整 `skills/knowledge-motion/` 到宿主的 skills 目录。新会话使用 `$knowledge-motion`；迁移旧安装时移除旧 `repo-pilot`，不要仅覆盖其 SKILL.md。

发布本次改造后，远程安装为：

```bash
npx skills add resinya/RepoPilot --skill knowledge-motion --agent codex --global --copy
```

Claude 插件发布后的标识为 `knowledge-motion@knowledge-motion`，调用 `/knowledge-motion:knowledge-motion`。当前本地改动不会自动改变远程仓库或已经安装的旧副本。

本仓库已将原 `repo-pilot` 整体替换为 `knowledge-motion`；GitHub 仓库地址仍为 `resinya/RepoPilot`。

## 从分镜直接渲染

Agent 负责把主题整理成分镜，脚本负责验证和制作。可先使用内置例子：

```bash
node skills/knowledge-motion/scripts/create-project.mjs --story skills/knowledge-motion/examples/shopping.json --project-root . --out out/knowledge-motion/shopping
cd out/knowledge-motion/shopping
npm ci
npm run check
npm run preview
npm run render
```

要求 Node.js 20.19+、FFprobe，以及 Remotion 可使用的 Chromium 浏览器。首次依赖安装需要网络；浏览器可由 Remotion 自动准备。可用 `FFPROBE_PATH`、`REMOTION_BROWSER_EXECUTABLE` 指定本机程序；`REMOTION_CONCURRENCY` 调整 1–8 个渲染并发。

`preview` 生成关键帧，先检查画面再渲染。`render` 生成 H.264 / yuv420p MP4 并核验尺寸、时长、帧率、帧数与零音轨。源项目、story.json、storyboard.md、previews 和 verification.json 保留在调用项目中，不写回 Skill。

## 三种布局

| 布局 | 适合内容 | 完整示例 |
| --- | --- | --- |
| list | 分类、术语与速查 | [网络端口](skills/knowledge-motion/examples/ports.json) |
| grid | 连续的关键步骤 | [网购订单](skills/knowledge-motion/examples/shopping.json) |
| state | 操作引起的数值变化 | [模拟家庭收支](skills/knowledge-motion/examples/budget.json) |

[Skill 入口](skills/knowledge-motion/SKILL.md) · [视觉与动作规则](skills/knowledge-motion/references/style-and-motion.md) · [分镜字段](skills/knowledge-motion/references/story-contract.md)

模板图标和布局可以在生成项目中修改。用户材料与示例数据须区分；编码核验不能替代内容正确性与实际观看。

## 维护验证

```bash
node scripts/validate-skill-metadata.mjs
node --test tests/knowledge-motion.test.mjs
```

跨平台测试覆盖时间轴、状态连续性、输入错误、路径方向、完整 Skill 复制和媒体核验失败场景。三个完整案例的真实渲染可通过手动 CI 工作流执行；本地验收产物在 `out/knowledge-motion/`。官网展示的三条精选视频保存在 `assets/examples/`，其余生成文件与依赖不提交。

Skill 自有代码遵循 [MIT](LICENSE)。Remotion 依赖使用其自身许可证；详见 [Remotion](https://www.remotion.dev/docs/license)。
