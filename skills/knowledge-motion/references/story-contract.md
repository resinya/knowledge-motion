# 分镜数据契约

`story.json` 是动画源项目的输入。Agent 从用户主题整理内容并写出此文件；渲染器不调用大模型，也不替用户编造事实。完整例子见 [端口分类](../examples/ports.json)、[网购流程](../examples/shopping.json)、[家庭收支](../examples/budget.json)。

## 顶层

| 字段 | 含义 |
| --- | --- |
| `title` | 必填，约 28 个汉字宽度内；自动换行 |
| `layout` | `list`、`grid`、`state` |
| `kicker` / `subtitle` / `summary` | 小标题、补充说明、整图结论；保持短句 |
| `duration` / `fps` | 默认 20 秒、30 fps；显式时长支持 8–120 秒，每步至少 1 秒 |
| `width` / `height` | 默认 1080×1920；支持偶数尺寸的 9:16，宽 360–2160 |
| `steps` | `list` 2–10 条、`grid` 2–6 步、`state` 2–8 步 |
| `sources` | 可选，`[{"title":"资料名","url":"https://..."}]`；写入分镜，不挤入视频 |
| `metrics` | 仅 `state` 必填，1–3 个可变化的数值指标 |

文案长度按近似汉字宽度计算，英文约半宽。校验器拒绝明显过长文案；关键帧仍需检查实际字体与排版。默认 15–25 秒是创作建议，不会覆盖用户明确指定的时长。

## 每个步骤

```json
{
  "id": "pay",
  "label": "支付订单",
  "caption": "付款后通知商家",
  "result": "商家收到已付款订单",
  "input": "支付 ¥128",
  "color": "cyan",
  "diagram": {
    "nodes": [
      {"id":"buyer","label":"买家","icon":"person"},
      {"id":"store","label":"商家","icon":"store"}
    ],
    "edges": [{"from":"buyer","to":"store","label":"付款通知"}]
  }
}
```

- `id`：唯一的小写连字符标识。
- `label`：卡片/目录标题。list 最多约 10 个汉字宽度，grid 12，state 9。
- `caption`：动作说明。list 13、grid 28、state 22 个汉字宽度以内。
- `result`：动作完成后的事实或模拟结果；state 22、其他 28 个汉字宽度以内。
- `input`：可选，逐字出现的输入；grid 18、state 22 个汉字宽度以内。list 不显示输入。
- `badge`：list 可用，端口号、缩写等，约 6 个汉字宽度内；缺省显示序号。
- `color`：`cyan`、`green`、`purple`、`orange`、`red`，或 `#RRGGBB`。

## 对象与连线

diagram 至少 2 个节点；list 最多 3 个，其他最多 4 个。每条边连接两个不同的已有节点；1–4 条边，数组顺序就是传递顺序。边必须代表实际关系。

节点必填 `id`、短 `label`、`icon`。默认自动布局；同时提供 `x`、`y` 可指定 0–1 归一化坐标。可选 `color` 用于对象语义配色。不要让节点重叠或把回路画成相同起点。

图标：`screen`、`server`、`database`、`globe`、`lock`、`document`、`cart`、`card`、`package`、`truck`、`home`、`wallet`、`bank`、`coin`、`person`、`store`、`leaf`、`sun`、`cloud`、`check`、`chart`。

不合适时在生成项目的 `src/Glyph.jsx` 添加真实需要的 SVG 图标，并在 `src/story.mjs` 的 ICONS 中注册。

## 状态变化

```json
{
  "metrics": [{"id":"balance","label":"可用余额","initial":3000,"prefix":"¥"}],
  "steps": [{"changes":{"balance":11000}}]
}
```

这只是字段片段，完整步骤还需上述必填字段。指标支持可选 `suffix`。`changes` 的值是**完成后的绝对值**；未提到的指标保持原值。每步至少修改一个已定义的指标，数值绝对值不超过 99999999。模板在当前步从上一步结果插值到新值，最后保留终值。

## 运行与产物

创建项目后先 `npm ci`，再 `npm run check`、`npm run preview`、`npm run render`。渲染依赖固定版本，锁文件随模板一起复制。

- `story.json`：可修改内容及参数。
- `src/`：可修改的 SVG 布局与帧动画。
- `storyboard.md`：每步起止时间、对象路径与结果。
- `previews/`：关键帧 PNG 与帧号清单。
- `video.mp4`：通过核验后才从临时文件提升为成片。
- `verification.json`：编码、尺寸、帧率、时长、帧数与零音轨的实际检查结果。

输入错误在生成/渲染前报告；安装失败、字体不可用或渲染失败时保留源项目修复，不宣称生成成功。只读检查规格与正式视频的视觉验收要区分。
