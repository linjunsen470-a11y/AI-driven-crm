# MVP Slices

这份文档把当前 AI CRM 的开发工作，重新整理成适合持续 vibe coding 的纵向切片。

核心原则不是“一次把所有能力补齐”，而是：

`每次只推进一个能验证价值的闭环。`

---

## Slice 0：仓库骨架收口

### 目标

- 对齐目录、文档、schema、env、基础页面壳子

### 应包含

- 基础 dashboard layout
- 占位页面
- Prisma client 接入
- `.env.example` 与真实路线收口
- 文档与 schema 命名收口

### 不应包含

- 真正的 AI 调用
- n8n
- 文件上传复杂链路

### 完成标准

- 项目能启动
- Prisma client 能正常导入
- 文档不再出现明显冲突的技术路线

---

## Slice 1：文本交互闭环

### 目标

跑通：

`手动文本输入 -> interaction 创建 -> AI 结构化提取占位 -> 待确认列表 -> 确认建档`

### 为什么先做这个

- 最贴近产品核心
- 依赖最少
- 不需要先解决对象存储、转录、回调、重试
- 最适合让 AI 快速补出可用页面和接口

### 应包含

- `POST /api/interactions` 的文本场景
- 待确认交互列表页
- 交互详情/确认页
- 确认后创建或更新 customer

### 不应包含

- 音频上传
- OCR
- n8n
- 批量导入

### 完成标准

- 能手工创建文本 interaction
- 能看到待确认列表
- 能确认并写入 customers
- timeline 或详情页能看到这次 interaction

---

## Slice 2：确认表单强化

### 目标

把“AI 提取结果”变成真正可编辑、可确认、可回写的业务表单。

### 应包含

- Zod 表单 schema
- 分组字段布局
- 高亮 AI 推断字段
- 确认、部分确认、拒绝

### 不应包含

- 高级画像 merge 算法
- 自动去重匹配黑盒

### 完成标准

- 销售能以较低成本修改 AI 结果
- interaction 的 `confirmationStatus` 状态完整
- customer 主数据与 AI 推断数据边界清晰

---

## Slice 3：文件上传与 interaction 关联

### 目标

支持图片和音频文件上传，并落 `files` / `interactions` 关联。

### 应包含

- 文件上传接口
- `File` 元数据写入
- `Interaction` 与 `File` 关联
- 基础 MIME/type/size 校验
- 上传后状态展示

### 不应包含

- 真正的异步转录编排
- 批量录音导入

### 完成标准

- 能上传单个文件
- 数据库能追踪文件来源和所属 interaction
- UI 能看见上传后的处理状态

---

## Slice 4：转录任务异步化

### 目标

在不破坏 CRM 主数据边界的前提下，跑通：

`CRM -> AiJob -> worker -> CRM callback`

### 应包含

- `AiJob(jobType=transcription)` 创建
- 本地 mock worker 或轻量 worker
- callback 鉴权
- 幂等回写
- interaction 转录文本更新

### 不应包含

- 复杂的 OCR / 提取 / 提醒链式编排
- 客户画像自动 merge 黑盒

### 完成标准

- 能看到 job 从 queued 走到 completed/failed
- transcript 能被写回 interaction
- 失败能被记录并可重试

---

## Slice 5：n8n 接管耗时工作

### 目标

把已经在 CRM 端跑通的异步契约交给 n8n 承接。

### 应包含

- transcription-start webhook
- 存储读取
- provider 调用
- CRM callback
- 重试策略

### 不应包含

- 把 confirmed customer 写入逻辑搬到 n8n
- 在 n8n 内维护主数据状态

### 完成标准

- n8n 只负责异步处理，不负责 CRM 业务真相
- CRM 仍然是最终状态写入点

---

## Slice 6：OCR、摘要、结构化提取统一化

### 目标

把图片 OCR、摘要生成、结构化提取接入与 transcription 一致的任务模式。

### 应包含

- 统一 job 触发入口
- 统一 callback 写回模式
- prompt 版本号与模型名记录

### 完成标准

- 音频、图片、文本三类 interaction 有统一处理框架

---

## Slice 7：Phase 2 能力

### 包含内容

- 忽略号码表
- 批量通话录音导入
- 企业知识库导入
- 销售 AI Chat
- 规则型提醒

### 说明

这些能力都值得做，但不应该压进最初可运行闭环。

---

## 适合 vibe coding 的任务类型

- 页面脚手架
- 列表页
- 表单骨架
- Zod schema
- route handler 壳子
- Prisma 查询与 mutation 壳子
- 状态 badge 和流程卡片

---

## 不适合直接放手让 AI 决定的任务

- schema 再次大改
- customer merge 规则
- 去重和匹配策略
- 权限边界
- 复杂 job 重试语义
- reminder 排序逻辑

---

## 推荐的 AI 使用方式

每一轮只给 AI 一个明确切片，并加上边界条件。

推荐 prompt 风格：

- 基于现有 `prisma/schema.prisma`
- 不新增表
- 只实现文本 interaction 场景
- 只修改 `app/api`、`features/interactions`、`features/customers`
- 需要同时补最小 UI 与最小校验
- 完成后给出验证步骤

---

## 一句话结论

先做“文本交互闭环”，再做“文件上传”，最后做“转录异步化”，这是当前仓库最稳、也最适合 vibe coding 的推进顺序。
