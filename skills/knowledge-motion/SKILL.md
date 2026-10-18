---
name: knowledge-motion
description: 将任意领域的知识、分类、流程或状态变化制作成深色动态信息图与静音 MP4。适用于知识短视频、过程演示、动态科普，以及参考固定分区、逐步聚焦、路径传递效果制作视频的请求。保留可修改的 Remotion 与 SVG 源项目。
---

# Knowledge Motion

把知识全貌留在画面里，用局部动作解释每一步如何发生。交付真实可播放的静音 MP4、可修改的源项目和简要分镜。

## 从内容到画面

1. 读取用户的主题或资料，确定要让观众理解的一件事。资料优先；仅有主题时整理必要知识，涉及动态事实时核实来源。示例数字明确标为模拟，不把推测画成事实。
2. 将内容压缩为短标题、对象、关系及变化结果。默认中文、9:16、1080×1920、30 fps、20 秒；通常在 15–25 秒内完成。尊重用户指定的参数。
3. 阅读 [风格与动作规则](references/style-and-motion.md)，按内容选一种布局：
   - `list`：分类、术语、速查；类别配色稳定，每行展示一个关系。
   - `grid`：4–6 个连续步骤；当前卡片聚焦，完成结果保留。
   - `state`：操作导致数值或状态变化；左侧操作目录，右侧状态和变化记录。
4. 按 [分镜数据契约](references/story-contract.md) 编写 `story.json`，定义每一步的对象、路径、结果。可参考 `examples/` 中三个完整案例，但要按主题替换对象和内容。
5. 在**调用项目**中创建独立源项目，检查关键帧，修正后渲染并核验视频。

同一种布局可以绘制不同领域的内容。卡片、节点、图标都是表达工具；用户主题需要其他画面时，直接修改生成项目里的 SVG 组件。

## 创建与渲染

下列 `<skill>` 是本 SKILL.md 所在目录，`<project>` 是用户当前工作项目。不要把业务分镜、node_modules 或成片写回 Skill 包。

```bash
node <skill>/scripts/create-project.mjs --story <project>/story.json --project-root <project> --out out/knowledge-motion/my-topic
```

脚本会验证分镜、复制完整模板并生成 `storyboard.md`。默认输出 `out/knowledge-motion/<主题>`，拒绝覆盖已有目录或将输出放入 Skill 中。

在返回的项目目录运行：

```bash
npm ci
npm run check
npm run preview
npm run render
```

- 依赖安装使用项目自己的锁文件；不改变调用项目原有 package.json。
- `preview` 输出总览、每步动作中段、每步完成及最终画面的 PNG；打开图片检查，再开始成片渲染。
- `render` 输出 `video.mp4`，并用 FFprobe 核对视频规格及零音轨，写入 `verification.json`。失败时不得报告成片通过。
- Node.js 20.19+；首次安装需要网络。FFprobe 需可执行，或设置 `FFPROBE_PATH`。Remotion 可自动准备浏览器，也可通过 `REMOTION_BROWSER_EXECUTABLE` 指定本机 Chromium 系浏览器。
- 修改 `story.json` 后重新运行 `npm run check`，会同步更新分镜。动画按帧计算；不要加入 CSS animation、真实时钟或 setTimeout 驱动的运动。

需要改变生成方式时，读取源模板 `assets/template/`。模板自带渲染器、SVG 图标、三种布局、输入校验与媒体核验；可在生成项目里扩展，不依赖本机固定路径或远程素材。

## 交付标准

- 起始约 1 秒全貌，中段逐步演示，结尾约 2 秒完整结果；信息过密时精简内容，不靠缩小文字塞满画面。
- 主焦点明确；路径方向、移动对象、变化结果一致；已完成内容保留。分类型保持类别色，流程型区分待处理、进行中、已完成。
- 中文标题和标签完整，无缺字、遮挡或截断；按手机观看尺寸检查可读性。
- 逐帧检查边界与关键动作，并检查导出视频的运动连续性。只看静态图不能证明整段动画正确。
- 最终返回可点击的 MP4、分镜和源项目入口；说明实际验证结果，未通过的检查如实列出。

只完成本地制作与导出；发布到平台按用户具体要求处理。
