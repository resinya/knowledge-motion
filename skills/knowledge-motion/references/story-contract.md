# 知识与分镜契约（2.0）

两个 JSON 均使用 schemaVersion: 2。创建项目必须同时提供 --knowledge 和 --story。旧 steps/layout 分镜被拒绝；先重新组织知识，再重建镜头，不能只改版本号。完整可执行案例见 examples/{browser,ports,shopping,budget}/。

## knowledge.json

必填字段：

- title、audience、questions（非空文字数组）、conditions（本片适用条件数组）。
- sources：{id,title,kind,url?,summary?}。kind 为 official、user 或 simulation；official 必须有 http(s) URL。示例设定、数字与真实事实分开说明。
- objects：{id,label,color?,kind?}。跨镜头复用同一个 id、名称与颜色；不受固定图标清单限制。
- modules：所有核心根节点 id，表示总览中的大模块。
- nodes：{id,title,goal,objects,inputs,outputs,parentId?,detail?,sourceRefs}。objects 引用对象 id；inputs/outputs 为简短文字数组，outputs 至少一项；detail 默认为 core，扩展节点用 extension。sourceRefs 至少一项，每项为 {sourceId,claim,locator?}，明确这份资料支持哪个机制结论。可选 displayGoal 为总览短解释，完整 goal 保存在知识稿。
- relations：{type,from,to,label?}。type 为 contains、precedes、depends-on、parallel、conditional。所有关系引用知识节点；条件关系必须写 label。**depends-on 的方向是前置条件 → 依赖它的节点**。parentId 表示包含，缺少的 contains 边会自动补齐；显式 contains 必须一致。包含与先后/依赖图不能成环；并行不被强制排序。
- workflow：{host,mode,reason}，mode 为 native 或 sequential。如实说明实际整理方式与降级原因，不用宿主名称推断工具可用性。

id 使用小写字母开头的小写字母、数字、连字符。所有引用、来源与层级在创建目录前检查。

## story.json

必填 schemaVersion、title、chapters、scenes；可选 subtitle、canvas、initialState。fps 默认且固定 30。

canvas 可指定 {width,height,reason?}，尺寸为 640–7680 内的偶数；也可写 {orientation:"auto"|"landscape"|"portrait",reason?}。未指定时，含 sequence/tree/linked 的内容优先 1920×1080；其余优先 1080×1920。此规则是初选，制作 Agent 仍须按关键关系和观看平台审核，不靠缩字满足密度。整片共用一个画幅。

chapters 每项为 {id,title,knowledgeNodeId}，与核心模块一一对应。initialState 为已命名状态初值，值为有限数字、文字或布尔值。

scenes 每项：

- id、chapterId（总览可不指定）、type、title、explanation、result、knowledgeNodeIds（至少一项）。
- timing: {read,act,hold}，单位秒，各至少 0.5 秒；每段独立取整到帧，相加得到镜头长度。全片没有固定时长与 120 秒上限。
- actors：时序图参与对象 id；sequence 至少两个。
- items：{id,label,objectId?,parentId?,x?,y?,column?,detail?,color?,badge?}。树通过 parentId 生长；x/y 同时指定且在 0–1 内；linked 的 column 为 0/1/2。label 为画面短标签，不把研究全文塞进节点。
- links：{from,to,label?}，引用本镜头 items。
- actions：见下文。
- metrics：state 场景必填，每项 {key,label,prefix?,suffix?,color?}，key 引用数值状态。
- data：场景扩展参数；linked 支持 headings（三列标题）与 code（代码行数组）。
- overview: all 或 return；回归总览时提供 chapterId，保留完成状态。
- custom：自定义场景的注册 id，仅 type: custom 必填。

基础 type 为 overview、sequence、tree、parallel、branch、state、linked、list、custom。**tree/parallel/branch/linked/list 都需要 items**。每个核心知识节点必须有镜头引用；每章须有机制镜头。全片以总览开始并回到总览结束。

## 动作、时间与状态

每个动作 {id,kind,at,duration,...}，at/duration 单位秒，**相对本镜头 act 段起点**。at 非负、duration 至少一帧，所有动作必须在 act 段结束前完成。动作可以重叠表达并行，同一状态的写入不能重叠。

- reveal：target 为 item 或 actor，逐渐出现。
- transfer：from/to 为不同 item/actor，方向明确；label 表示传递内容。
- highlight：target 局部聚焦。
- type：target 与 text，逐步输入短文本。
- state：通过 set 在动作完成时更新离散状态。
- count：通过 set 对数值状态插值，完成后保留。

任何动作可附 set: {stateKey:value} 与 expect: {stateKey:previousValue}。set 引用 initialState 声明的键；expect 在动作开始校验，set 在动作完成提交。同一帧先提交上一动作，再检查下一动作。跨镜头保留状态；数值动画不重置。时序图对象状态显示使用 "<objectId>-state" 键。

状态变化必须匹配真实时点。例如客户端发 SYN 时进入 SYN-SENT；服务端收到 SYN 后进入 SYN-RECEIVED；客户端收到 SYN+ACK、回复 ACK 时进入 ESTABLISHED；服务端收到最终 ACK 后才进入 ESTABLISHED。可用独立 state 动作区分发送与到达，不能把两端都在第一条箭头完成时画成连接成功。

## 自定义场景与完整复制

在 story.json 同目录创建 scenes/manifest.json（数组）及 React/SVG 源文件。例如：

    [{"id":"browser-paint","file":"BrowserPaint.jsx"}]

组件用 default export。文件名只允许目录顶层的英文、数字、连字符、下划线及 .jsx；源目录不包含符号链接、依赖和缓存。创建项目自动复制整个 scenes/ 到 src/custom/ 并生成 src/custom-scenes.jsx 注册表。check 与渲染会按清单重建注册表，不手动修改自动生成的注册文件。缺失或未注册的 custom 引用会拒绝创建，修改后 check 再校验。已有独立项目不会被回写。

组件收到 {scene,localFrame,fps,width,height,knowledge,state,actionProgress}；width/height 为留出导航与解释区后的局部 SVG 逻辑画布（按输出尺寸等比缩放），actionProgress(action) 返回 0–1。使用局部帧与统一时间轴，返回 SVG 元素；可以相对导入 ../visual.jsx 的 Text/Panel/Arrow。所有素材放入源目录内，通过相对 import 引用。不得依赖 Skill 原目录、本机绝对路径、真实时钟、CSS animation 或网络随机数据。

## 创建、检查与交付

    node <skill>/scripts/create-project.mjs --knowledge <project>/knowledge.json --story <project>/story.json --project-root <project> --out out/topic
    cd <生成目录>
    npm ci
    npm run check
    npm run preview
    npm run render

创建前校验知识关系、来源引用、镜头覆盖、动作窗口与状态前置条件；拒绝已有输出、项目外路径与通过链接写回 Skill。依赖锁文件随项目复制。

产物：knowledge.json、knowledge.md、story.json、storyboard.md、chapters.json、previews/（章节入口、动作中段、机制结果、镜头前后）、video.mp4、verification.json 与独立源码。chapters.json 保存章节时间码，画面中保留当前位置；不额外生成多画幅。

preview 静态检查后还须实际播放完整成片，检查动作方向、等待、结果保留与衔接；FFprobe 检查尺寸、30 fps、逐帧累加时长、总帧数、H.264/yuv420p 和零音轨。媒体规格通过不代表知识或画面已经通过。
