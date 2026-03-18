---

# docs/to-update.md

这份文件现在承担两个职责：

1. 记录当前仓库已经收口到什么程度
2. 指向接下来真正该推进的文档和切片

它不再承担“未来文档全文草稿”的角色。

---

## 1. 当前 source of truth

在继续补文档或让 AI 生成代码之前，先以这几份文件为准：

- 数据模型：`prisma/schema.prisma`
- Prisma 配置：`prisma.config.ts`
- 本地配置契约：`.env.example`
- 仓库规则与优先级：`AGENTS.md`
- 当前切片状态：`docs/implementation/mvp-slices.md`
- 现有异步集成边界：`docs/integrations/transcription-flow.md`

需要特别注意的现实状态：

- 当前 schema 里已经有 `files`、`interactions`、`ai_jobs`
- 当前没有单独的 `transcription_jobs` 模型
- 当前 `AiJob` 是异步任务的统一抽象
- 当前 `start` 路径统一为 `/api/internal/ai-jobs/start`
- 当前 callback 路径统一为 `/api/internal/ai-jobs/callback`
- 当前仓库已经有运行时 prompt 文件，不应再把运行时 prompt 只留在 `docs/`

---

## 2. 当前代码基线

截至当前批次，仓库已经收口到下面这个状态：

- Slice 0 已完成
- Slice 1 已完成
- Slice 2 已完成
- Slice 3 已完成
- Slice 4 CRM 侧契约已完成
- Slice 5 Batch 1 已完成，但真实 provider 集成尚未完成

当前已经落地的能力：

- 文本 interaction 创建
- 待确认队列
- interaction 详情确认与 customer 写回
- 单文件上传
- `files` / `interactions` 关联
- `AiJob` 创建、claim / callback、mock worker
- CRM -> `n8n` dispatch
- `n8n` -> CRM `start` / `callback` 契约
- `infra/n8n` workflow 模板
- 文本提取与异步处理 prompt 资产

当前静态验证状态：

- `npm run typecheck` 通过
- `npm run lint` 通过
- `npm run build` 通过

---

## 3. 必须继续统一的技术决策

### 3.1 异步任务抽象

后续文档和代码都应统一使用：

- `AiJob`
- `jobType = transcription | ocr | extraction`

不要再在新文档里引入平行概念 `TranscriptionJob`。

### 3.2 CRM 与 n8n 的边界

当前推荐路线是：

- CRM 负责主数据与最终状态写入
- `n8n` 负责耗时任务编排
- `n8n` 在 provider 调用前先回调 CRM `start`
- callback 回到 CRM 后再更新 interaction / file / job 状态

不要把 confirmed customer 写入逻辑迁到 `n8n`。

### 3.3 Prompt 的位置

如果某段 Prompt 会被代码真正调用，它必须进入 `prompts/`，而不是只留在 `docs/`。

当前已存在的运行时 prompt：

- `prompts/text-interaction-extraction.md`
- `prompts/async-processing-contract.md`

---

## 4. 现在应该维护哪些正式文档

### 当前实现状态与切片

- `docs/implementation/mvp-slices.md`
- `docs/implementation/kimi-agent-handoff.md`
- `docs/implementation/kimi-agent-kickoff-prompt.md`

### 现有异步集成边界

- `docs/integrations/transcription-flow.md`
- `infra/n8n/README.md`

### 产品与业务背景

- `docs/Product Requirements Document.md`
- `docs/background.md`
- `docs/AI-CRM knowledge base.md`

### 数据与提取设计

- `docs/advice.md`
- `docs/design.md`
- `docs/AI-信息提取Prompt模板.md`

---

## 5. 接下来最适合推进的切片

### 第一优先级：Slice 5

目标：

- 把现有 `n8n` Batch 1 从 mock workflow 推进到真实 provider
- 保持 `start`、callback、幂等、CRM writeback 边界不变

### 第二优先级：不依赖 n8n 的 Phase 2 CRM 侧模块

目标：

- 知识库 CRUD 壳子
- AI Chat session/message 壳子
- reminders / ignored phones / call import 的 CRM 侧状态流

### 暂不建议做的事情

- 重做已落地的文本闭环
- 重新设计 `AiJob` 模型
- 把所有 Phase 2 能力和 `n8n` 编排打成一包一起做

---

## 6. 已过时或仅保留为历史参考的文档

- `docs/implementation/kimi-agent-slice2-3-prompt.md`

这份文档对应的实现轮次已经完成，可以保留，但不应再作为默认下一步委托说明。

---

## 7. 一句话结论

当前仓库已经具备稳定的 CRM 主链路和 CRM 侧异步契约；现在最应该补的是 `n8n` 承接，或者并行推进那些不依赖 `n8n` 的 Phase 2 CRM 模块。
