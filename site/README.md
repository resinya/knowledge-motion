# Knowledge Motion 文档站

官网：https://resinya.github.io/knowledge-motion/

```bash
pnpm install
pnpm dev
pnpm build
```

需要 Node.js 22.4+。本地开发使用根路径；Pages 构建设置 `PAGES=1`，本地默认发布路径为 `/knowledge-motion`。

CI 通过 `actions/configure-pages` 获取实际的 `PAGES_BASE_PATH` 和 `NEXT_PUBLIC_SITE_URL`。Next.js、图片、视频及搜索索引共享 `site.config.mjs` 的路径配置。更换仓库名或域名时，以 Pages 返回的地址为准。

构建后运行 `pnpm check:export --base-path /knowledge-motion`，检查导出页面的资源前缀与文件是否存在；CI 使用 Pages 返回的路径检查，通过后才上传部署。

正文在 `content/docs/`，导航在 `src/lib/layout.shared.tsx`。正式 Skill 位于根目录 `skills/knowledge-motion/`。

品牌图片、封面和三条精选视频来自根目录 `assets/`；dev/build 自动同步到 `public/`，这些生成副本不提交。实验产物放在忽略的 `out/`。

效果案例入口是 `/examples`，内容在 `src/lib/examples.ts`；版本更新入口是 `/changelog`，内容在 `src/lib/updates.ts`。
