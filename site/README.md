# Knowledge Motion 文档站

沿用当前 GitHub 仓库与 Pages 路径 `https://resinya.github.io/RepoPilot/`，产品内容已改为知识动态信息图与静音视频 Skill。

```bash
pnpm install
pnpm dev
pnpm build
```

Node.js 22.4+。本地开发不设置 `PAGES`；GitHub Pages 构建使用 `PAGES=1`，保留 `/RepoPilot` 子路径。需要自定义域名时设置 `NEXT_PUBLIC_SITE_URL`。

正文位于 `content/docs/`，导航和元数据位于 `src/lib/shared.ts`。不要在站点里创建 SKILL.md；正式入口位于仓库 `skills/knowledge-motion/`。

品牌图片、案例封面和三条精选视频统一放在根目录 `assets/`；dev/build 会运行 `scripts/sync-assets.mjs`，复制到 public 下供网站使用。这些生成副本不提交。只有精选案例作为官网素材保留，实验过程仍放在忽略的 `out/`。

效果案例入口是 `/examples`，内容在 `src/lib/examples.ts`，视频支持在线播放、进度拖动与下载。

版本更新入口是 `/changelog`，数据在 `src/lib/updates.ts`。同一天的功能合并，按日期倒序记录；年份与日期构成左侧时间线，正文自然撑开间距。使用中文功能标题与说明。
