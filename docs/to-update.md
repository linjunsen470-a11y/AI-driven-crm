---

# docs/to-update.md

这份文件不再承担“未来文档全文草稿”的角色。

从现在开始，它的作用是：

1. 记录当前需要对齐的关键决策
2. 指向已经拆出的正式文档
3. 说明接下来最适合推进的开发切片
4. 标记已经过时或需要淘汰的假设

---

## 1. 当前 source of truth

在继续补文档或让 AI 生成代码之前，先以这几份文件为准：

- 数据模型：`prisma/schema.prisma`
- Prisma 配置：`prisma.config.ts`
- 本地配置契约：`.env.example`
- 仓库规则与优先级：`AGENTS.md`
- MVP 主链路与 API 范围：`docs/MVP-API-与工作流设计.md`

需要特别注意的现实状态：

- 当前 schema 里已经有 `files`、`interactions`、`ai_jobs`
- 当前没有单独的 `transcription_jobs` 模型
- 当前 `AiJob` 应作为异步任务的统一抽象，`transcription` 只是其中一种 `jobType`
- 当前仓库仍处于早期，很多规划文档描述的是目标状态，不代表已经落地

---

## 2. 已拆出的正式文档

原先写在本文件里的大块草稿，已经建议拆到下面这些正式文档：

- `docs/integrations/transcription-flow.md`
- `docs/implementation/mvp-slices.md`

后续如果需要更细的契约文件，可以再补：

- `docs/integrations/transcription-contract.json`

但在真正需要机器可读契约之前，不要急着再扩张文档数量。

---

## 3. 当前必须对齐的决策

### 3.1 异步任务抽象

后续文档和代码都应统一使用：

- `AiJob`
- `jobType = transcription | ocr | summary | extraction ...`

不要再在新文档里引入平行概念 `TranscriptionJob`，除非未来明确决定把转录任务从统一任务表中拆出去。

### 3.2 存储路线

当前推荐路线是：

- 开发期允许本地文件系统
- 面向正式链路优先对齐 MinIO / S3-compatible
- 文档中不再默认写 `Supabase Storage`

### 3.3 第一闭环的范围

最小闭环优先级调整为：

`文本交互 -> AI 提取 -> 销售确认 -> 客户更新`

原因：

- 更适合当前仓库的实现深度
- 依赖更少
- 更适合 vibe coding 快速稳定推进

音频转录闭环仍然重要，但应该放在文本闭环之后落地。

### 3.4 Prompt 的位置

如果某段 Prompt 会被代码真正调用，它必须进入 `prompts/`，而不是只留在 `docs/`。

---

## 4. 接下来建议维护的文档分工

为了避免继续重复和漂移，建议按下面的职责维护：

### 产品与业务

- `docs/Product Requirements Document.md`
- `docs/background.md`
- `docs/AI-CRM knowledge base.md`

这类文档回答“为什么做”和“业务背景是什么”。

### 数据与抽取设计

- `docs/advice.md`
- `docs/design.md`
- `docs/AI-信息提取Prompt模板.md`

这类文档回答“字段怎么设计”和“AI 应该提什么”。

### 工程实施

- `docs/MVP-API-与工作流设计.md`
- `docs/实施步骤、依赖与模板建议.md`
- `docs/integrations/transcription-flow.md`
- `docs/implementation/mvp-slices.md`
- `docs/implementation/kimi-agent-handoff.md`
- `docs/implementation/kimi-agent-kickoff-prompt.md`

这类文档回答“先做什么、接口怎么收敛、如何分切片推进”。

---

## 5. 推荐的开发切片

### Slice 0：项目骨架收口

目标：

- 对齐目录、schema、env、基础页面壳子

产出：

- 基础 layout
- 占位页面
- Prisma client 接入
- 文档与真实配置收口

### Slice 1：文本交互闭环

目标：

- 跑通 `手动文本记录 -> interaction -> AI 提取占位结果 -> 待确认列表 -> 确认建档`

这是当前最值得让 AI 先写的一刀。

### Slice 2：确认表单与客户详情

目标：

- 补齐客户画像确认表单
- 把 interaction 和 customer timeline 连起来

### Slice 3：文件上传闭环

目标：

- 支持图片/音频文件上传
- 落 `files` 与 `interactions` 的关联
- 先把处理状态跑起来，不急着立即接真实转录

### Slice 4：转录异步化

目标：

- 使用 `AiJob(jobType=transcription)` 跑通 CRM -> worker -> CRM callback
- 先可本地 mock，再接 n8n

### Slice 5：OCR / 摘要 / 结构化提取扩展

目标：

- 在转录链路稳定后，再把图片 OCR、摘要和结构化提取合并进统一任务模式

---

## 6. 现在最适合让 AI 直接做什么

最推荐的顺序不是“先把音频转录全做完”，而是：

1. `interactions` 的文本创建接口
2. 待确认列表页
3. 客户确认表单 schema
4. 确认建档 / 更新客户接口
5. 运行时 extraction prompt 文件
6. 文件上传与 `files` 关联
7. `AiJob` 驱动的转录回写链路

这条路线更符合当前仓库规则，也更适合稳定使用 vibe coding。

---

## 7. 已过时或不建议继续沿用的假设

- 不再把 `to-update.md` 当成未来文档全文容器
- 不再默认把上传目标写成 `Supabase Storage`
- 不再默认新增 `transcription_jobs` 作为独立表
- 不再把第一批工作直接扩张到“音频上传 + MinIO + n8n + 转录 + 回调 + OCR + 提取”整包实现

---

## 8. 一句话结论

`to-update.md` 现在应该是“文档拆写与开发切片索引”，而不是“继续堆草稿的大文件”。先跑通文本闭环，再接文件和转录，最适合这个仓库当前阶段。
