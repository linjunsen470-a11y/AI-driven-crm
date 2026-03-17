# AI CRM MVP API 与工作流设计

这份文档基于你当前确认的数据库结构继续往前推进，目标不是做“大而全”的接口清单，而是先把最关键的主链路跑通：

`上传 -> 生成 interaction -> AI 解析 -> 销售确认 -> 建档/更新客户`

在这条主链路稳定后，第二个非常有价值的入口是：

`批量上传通话录音 -> 按忽略号码自动过滤 -> 剩余录音交给 AI 处理`

---

## 0. 先按切片推进，不要一次做完整包

虽然完整目标是“上传录音后自动转录、提取、确认建档”，但从当前仓库状态看，最稳的推进顺序是：

### Slice A：先跑文本闭环

先完成：

- 手动文本 interaction
- AI 提取结果展示
- 销售确认建档

这样可以优先验证最核心的产品闭环，而不用一开始就同时处理对象存储、回调鉴权、n8n 和转录重试。

### Slice B：再补文件上传

等文本闭环稳定后，再接：

- 图片上传
- 音频上传
- `files` 与 `interactions` 关联

### Slice C：最后接异步转录

在 CRM 侧接口和状态流稳定后，再接：

- `AiJob(jobType=transcription)`
- worker 或 n8n
- 转录回写 CRM

这个顺序更适合当前项目阶段，也更适合持续用 vibe coding 推进。

---

## 1. MVP 的主链路

### Step 1. 上传物料

销售上传：

- 电话录音
- 微信截图
- 手动文本备注

系统做两件事：

1. 文件上传到本地文件系统或 MinIO / S3-compatible 对象存储
2. 在 `interactions` 中插入一条待处理记录

### Step 2. 触发 AI 处理

服务端读取 `interactions`：

- 如果是 `audio`，先转录
- 如果是 `image`，先 OCR
- 如果是 `text`，直接进入摘要与抽取

然后生成：

- `transcription`
- `ai_summary`
- `ai_sales_suggestion`
- `ai_extracted_data`
- `ai_confidence`

### Step 3. 销售确认

前端展示“待确认卡片”：

- 左侧：原文/转录
- 右侧：AI 提取字段表单

销售可以：

- 直接确认
- 修改后确认
- 拒绝 AI 结果

### Step 4. 建档或更新客户

如果是新客户：

- 创建 `customers`

如果是老客户：

- 更新 `customers`
- 回写 `last_interaction_at`

最后更新当前 `interaction`：

- `customer_id`
- `confirmation_status`
- `confirmed_at`
- `confirmed_by`

---

## 1.1 批量通话录音导入能力评估

结论：`可行，而且很有价值，但建议放在 Phase 2，不要压进最初 MVP 主链路。`

它有明显价值：

- 更贴近销售真实工作流
- 减少手动挑选录音上传
- 让系统先过滤噪音电话，再把有价值的录音交给 AI

但它也会引入额外复杂度：

- 不同手机品牌和录音 App 的文件名格式不一致
- 文件名中的号码需要标准化
- 同一通电话可能被重复导入
- 私人电话、家人、同事、银行、快递等通话会大量混入
- 忽略号码表必须按销售个人隔离

所以推荐的收敛版本是：

- 销售手动批量上传通话录音
- 系统优先解析文件名中的号码、通话方向、时间
- 先匹配销售自己的忽略号码表
- 命中的直接跳过，不送 AI
- 其余录音再进入 AI 队列

这个版本很实用，而且范围可控。

---

## 1.2 你最新总体技术方案是否值得实现

你最新的目标包含：

- Next.js 前端
- n8n 作为后端编排
- 本地数据库
- 海量音频和截图文件存储
- 企业知识库
- 销售跟进时的 AI Chat
- AI 预测跟进时机提醒

我的判断是：`值得实现，但需要分层和分阶段。`

### 值得的原因

- 这些能力都围绕同一个核心价值：减少录入、提升跟进质量、提升成交效率
- 你的知识库内容和销售场景高度垂直，AI 很容易形成差异化
- 对内部团队来说，本地部署和本地存储比一开始就做成标准 SaaS 更现实

### 最需要避免的问题

- 不能把 n8n 当成全部后端
- 不能把海量音频和截图直接存进数据库
- 不能一开始就把“AI 预测跟进时机”做成黑盒模型

所以更稳的实现方式是：

- `Next.js`：前端 + 核心 API
- `n8n`：异步流程和定时任务
- `PostgreSQL`：主数据和状态
- `对象存储 / 本地文件系统 / MinIO`：海量源文件
- `知识库检索层`：服务 AI Chat 和知识问答

---

## 1.3 新能力的优先级建议

### Phase 1：必须先做

- 客户和交互主链路
- 文本 interaction 创建与确认
- AI 摘要、结构化提取
- 销售确认建档

说明：

这里的 `Phase 1` 最好先以文本场景落地，不要把音频转录链路一起塞进第一刀。

### Phase 2：强烈建议做

- 单文件音频/图片上传
- 音频转录异步链路
- 忽略号码表
- 批量通话录音导入
- 企业知识库导入
- 销售 AI Chat
- 基于规则的跟进提醒

### Phase 3：建议后置

- AI 预测最佳跟进时机
- 高级推荐排序
- 更复杂的自动化营销编排

原因很简单：

预测能力需要历史数据，而你前期最需要的是先把高质量数据收上来。

---

## 2. 推荐接口

下面这组接口已经够你做第一版。

### 2.1 文件上传

`POST /api/files/upload`

用途：

- 上传音频、图片
- 返回 `storageBucket` 和 `storagePath`

说明：

如果当前还没接对象存储，可以先用本地文件系统适配器模拟同样的返回结构，等 MinIO 接入后保持接口不变。

请求示例：

```json
{
  "filename": "call-2026-03-17.m4a",
  "mimeType": "audio/mp4"
}
```

响应示例：

```json
{
  "storageBucket": "crm-files",
  "storagePath": "owner_123/2026/03/call-2026-03-17.m4a"
}
```

### 2.2 创建交互记录

`POST /api/interactions`

用途：

- 创建一条待处理交互
- 支持录音、截图、文本

请求示例：

```json
{
  "contactMethod": "phone",
  "contentType": "audio",
  "storageBucket": "crm-files",
  "storagePath": "owner_123/2026/03/call-2026-03-17.m4a",
  "mimeType": "audio/mp4"
}
```

文本场景示例：

```json
{
  "contactMethod": "wechat",
  "contentType": "text",
  "sourceText": "客户计划两年后入住，预算大概10万到16万之间。"
}
```

响应示例：

```json
{
  "id": "interaction_uuid",
  "processingStatus": "pending",
  "confirmationStatus": "pending"
}
```

### 2.2.1 批量导入通话录音

`POST /api/interactions/bulk-import-calls`

用途：

- 一次性上传多个通话录音文件
- 从文件名中提取号码、通话方向、通话时间
- 命中忽略号码表的文件直接跳过
- 其余文件生成 `interactions`

建议支持一个可选参数：

- `dryRun`

`dryRun = true` 时：

- 只解析文件名和忽略规则
- 不真正创建 `interactions`
- 先返回给销售一个预检查结果

响应示例：

```json
{
  "totalFiles": 52,
  "ignoredFiles": 31,
  "importableFiles": 21,
  "createdInteractions": 21,
  "ignoredByRule": [
    {
      "phone": "13800001234",
      "reason": "ignore_list_match"
    }
  ]
}
```

### 2.2.2 获取忽略号码表

`GET /api/settings/ignored-phones`

用途：

- 获取当前销售自己的忽略号码规则

### 2.2.3 新增忽略号码

`POST /api/settings/ignored-phones`

请求示例：

```json
{
  "phone": "13800001234",
  "label": "家人",
  "matchMode": "exact"
}
```

### 2.2.4 删除忽略号码

`DELETE /api/settings/ignored-phones/:id`

### 2.2.5 批量导入忽略号码

`POST /api/settings/ignored-phones/import`

用途：

- 一次性导入销售自己的忽略号码
- 适合从通讯录导出文件、CSV 或手工粘贴初始化

### 2.3 启动 AI 处理

`POST /api/interactions/:id/process`

用途：

- 触发单条交互进入 AI 处理
- 可以由前端调用，也可以改成后台任务自动触发

响应示例：

```json
{
  "id": "interaction_uuid",
  "processingStatus": "processing"
}
```

对于批量导入场景，建议不要由前端逐条调用这个接口，而是：

- 批量插入 `interactions`
- 由后台 worker 自动拉取 `pending` 状态处理

### 2.4 查询交互详情

`GET /api/interactions/:id`

用途：

- 获取当前处理状态
- 前端轮询或进入详情页

响应重点字段：

```json
{
  "id": "interaction_uuid",
  "processingStatus": "completed",
  "transcription": "客户计划两年后养老，预算在10万到16万之间。",
  "aiSummary": "客户处于明确规划阶段，关注养老时间和预算。",
  "aiSalesSuggestion": "建议跟进参观体验活动，并介绍服务包方案。",
  "aiExtractedData": {
    "budgetRange": "10万-16万",
    "interestLevel": "中意向",
    "visitIntention": true,
    "primaryNeeds": ["养老需求", "参观意向"]
  },
  "aiConfidence": {
    "budgetRange": 0.88,
    "interestLevel": 0.71,
    "visitIntention": 0.64
  },
  "confirmationStatus": "pending"
}
```

### 2.5 获取待确认交互列表

`GET /api/interactions?processingStatus=completed&confirmationStatus=pending`

用途：

- 给销售一个“待确认队列”

建议支持筛选：

- `processingStatus`
- `confirmationStatus`
- `ownerId`
- `customerId`

### 2.6 确认并建档/更新客户

`POST /api/interactions/:id/confirm`

这是 MVP 最关键的接口。

请求体建议包含：

- 最终确认后的客户字段
- 是新建客户还是更新已有客户
- 如果是更新，传入 `customerId`

新建客户示例：

```json
{
  "mode": "create_customer",
  "customerData": {
    "name": "张阿姨",
    "phone": "13800000000",
    "city": "南京",
    "retirementStatus": "已退休",
    "budgetRange": "10万-16万",
    "interestLevel": "中意向",
    "visitIntention": true,
    "primaryNeeds": ["养老需求", "医疗资源关注"]
  }
}
```

更新已有客户示例：

```json
{
  "mode": "update_customer",
  "customerId": "existing_customer_uuid",
  "customerData": {
    "budgetRange": "16万以上",
    "checkinIntention": true,
    "checkinTimeText": "今年下半年"
  }
}
```

接口内部需要完成：

1. 校验当前 `interaction` 是否已完成 AI 处理
2. 新建或更新 `customers`
3. 回写 `customers.last_interaction_at`
4. 更新 `interactions.customer_id`
5. 更新 `interactions.confirmation_status = confirmed`
6. 记录 `confirmed_at`

### 2.7 拒绝 AI 结果

`POST /api/interactions/:id/reject`

用途：

- 销售认为这条解析结果不可用
- 将 `confirmation_status` 改为 `rejected`

请求示例：

```json
{
  "reason": "录音噪音太大，提取字段不准确"
}
```

### 2.8 客户列表

`GET /api/customers`

MVP 建议支持：

- 按姓名搜索
- 按电话搜索
- 按城市筛选
- 按意向等级筛选
- 按最后跟进时间排序

### 2.9 客户详情

`GET /api/customers/:id`

返回内容建议包括：

- 客户主档案
- 最近交互列表
- 最近一条 AI 建议

### 2.10 手动新增文本跟进

`POST /api/customers/:id/interactions`

用途：

- 老客户场景下，销售直接录入一段文字备注
- 不经过上传文件也能走 AI 流程

### 2.11 知识库文档导入

`POST /api/knowledge/documents`

用途：

- 上传企业资料、FAQ、项目介绍、销售话术、价格说明等知识文档
- 创建知识文档记录并触发切片与入库流程

建议支持：

- pdf
- docx
- markdown
- txt

### 2.12 知识库文档列表

`GET /api/knowledge/documents`

用途：

- 查看哪些文档已导入
- 查看处理状态

### 2.13 客户上下文 AI Chat

`POST /api/chat/sessions`

用途：

- 创建一个 AI Chat 会话
- 可绑定某个客户

请求示例：

```json
{
  "customerId": "customer_uuid",
  "title": "张阿姨跟进建议"
}
```

### 2.14 发送聊天消息

`POST /api/chat/sessions/:id/messages`

用途：

- 销售向 AI 提问
- 系统自动带入客户资料、最近跟进、企业知识库片段

请求示例：

```json
{
  "message": "这个客户现在最适合怎么推进？如果她担心医疗资源，我应该怎么回答？"
}
```

响应建议包含：

- AI 回答
- 引用的客户信息
- 引用的知识库片段

### 2.15 跟进提醒列表

`GET /api/reminders`

用途：

- 查看系统生成的待跟进提醒

建议支持筛选：

- ownerId
- dueToday
- overdue
- customerId

### 2.16 刷新提醒建议

`POST /api/reminders/generate`

用途：

- 手动触发提醒生成
- 更适合管理员或每日定时任务调用

---

## 3. 服务端处理建议

## 3.1 不要把 AI 长耗时处理放在同步请求里

即便是 MVP，也建议这条链路异步化：

1. 创建 `interaction`
2. 立刻返回成功
3. 后台再处理 AI

如果你前期想省事，可以先用下面两种方式之一：

- Next.js Route Handler + 异步任务触发
- Supabase Edge Function / Cron / 后台 worker

批量导入场景下更应该坚持异步化，因为一次可能会产生几十条待处理录音。

## 3.2 AI 处理函数建议拆成 3 段

推荐拆法：

1. `extractSourceText`
   - 音频：Whisper
   - 图片：OCR
   - 文本：直接返回

2. `generateSummaryAndSuggestion`
   - 生成摘要
   - 生成销售建议

3. `extractStructuredData`
   - 输出标准 JSON
   - 输出字段置信度

这样以后你替换模型时，不会把整条链路绑死。

AI 提取字段的可直接使用模板，建议参考：

- [AI-信息提取Prompt模板.md](/mnt/d/Maoshan/docs/AI-信息提取Prompt模板.md)

## 3.3 n8n 在这套系统里最适合承担什么

推荐让 n8n 负责这些异步任务：

- 新上传录音后的转录流程
- 图片 OCR
- 摘要、结构化提取、标签生成
- 知识库文档切片和入库
- 每日扫描待跟进客户
- 生成提醒建议
- AI Chat 的异步增强流程

不建议把这些完全放进 n8n：

- 复杂权限校验
- 客户主数据的最终一致性写入
- 高耦合的业务查询 API
- 聊天会话和客户详情的主读取接口

换句话说：

- `n8n` 适合做工作流引擎
- `Next.js API` 更适合做核心业务后端

## 3.4 文件存储建议

如果你预计会有海量：

- 原始音频
- 微信截图
- OCR 原图
- 聊天附件

那么推荐存储方式是：

- 文件本体：本地文件系统 / NAS / MinIO
- 数据库：只存路径、大小、哈希、归属关系、处理状态

不建议把大量文件二进制直接存进数据库。

这会让：

- 备份更重
- 查询更慢
- 运维更痛苦

## 3.5 企业知识库和 AI Chat 的推荐实现

推荐链路：

1. 上传知识文档
2. 文档转文本
3. 切片
4. 存储 chunk 和 metadata
5. 建立检索索引
6. AI Chat 时按客户上下文 + 知识片段联合检索

销售 AI Chat 建议默认带入 3 类上下文：

- 客户主档案
- 最近交互与摘要
- 企业知识库检索结果

这样 AI 才不会回答得太空泛。

## 3.6 跟进提醒功能怎么做最稳

这个功能值得做，但路线要保守：

### 第一阶段：规则提醒

例如：

- 7 天未联系且高意向
- 客户提到“参观”但 3 天未跟进
- 客户提到“价格/入住/套餐”但未安排下一步动作

### 第二阶段：AI 生成提醒理由

例如：

- 推荐今天跟进
- 原因：客户两次提到医疗资源，且最近一次沟通已过 5 天

### 第三阶段：数据驱动预测

在你积累足够历史数据后，再考虑：

- 哪类客户在什么时机跟进转化率更高
- 不同意向层级的最佳跟进间隔

这会比一开始就做“AI 预测”靠谱很多。

## 3.3 批量通话录音导入的处理建议

建议把这条链路拆成 5 段：

1. `parseCallFilename`
   - 解析文件名中的号码、方向、时间
   - 第一版尽量不用 AI

2. `normalizePhoneNumber`
   - 去掉空格、横杠、国家码差异
   - 统一成系统内部匹配格式

3. `matchIgnoredPhones`
   - 与当前销售自己的忽略号码表比对
   - 命中即跳过

4. `deduplicateImportedCalls`
   - 避免同一录音重复导入
   - 可基于 `ownerId + normalizedPhone + callTime + fileSize`

5. `enqueueRemainingCalls`
   - 只把剩余录音推进 AI 队列

这条设计有一个很大的好处：

忽略过滤主要靠规则，不靠 AI，所以成本更低，也更可控。

## 3.4 这个功能的主要风险

### 风险 1：文件名格式不稳定

不同机型、不同录音 App 的文件名差异可能很大。

建议第一版只支持你团队最常用的 1-2 种命名格式。

### 风险 2：号码不一定完整

有些文件名里可能没有完整号码，或者号码被掩码。

这类文件不应直接忽略，应该走普通 AI 处理或人工确认。

### 风险 3：隐私和权限边界

通话录音属于敏感数据，私人电话和工作电话又混在一起。

建议：

- 忽略号码表按销售个人隔离
- 被忽略号码默认不送 AI
- 文件访问必须做权限控制

### 风险 4：误过滤

如果客户号码被误加入忽略表，这条录音就会被跳过。

建议：

- 保留导入日志
- 支持查看“被忽略的录音”
- 支持恢复重新处理

---

## 4. 前端页面建议

MVP 只需要 4 个页面，但在 Phase 2 以后建议扩展到 7 个：

### 4.1 待确认队列页

这是你的 AI CRM 首页，优先级比客户列表还高。

展示：

- 处理完成但未确认的交互
- 状态、来源、摘要、时间

### 4.2 上传页

支持：

- 拖拽上传录音
- 上传截图
- 手动粘贴文本
- 批量上传通话录音文件

如果加入“批量通话录音”能力，上传页建议增加两个区域：

- `普通上传`
- `批量导入通话录音`

批量导入模式下，前端最好先展示：

- 本次文件总数
- 解析出号码的文件数
- 命中忽略表的文件数
- 准备进入 AI 的文件数

### 4.3 交互确认页

页面结构建议：

- 左侧：原始内容 / 转录文本
- 右侧：可编辑表单
- 底部：确认建档 / 合并已有客户 / 驳回

### 4.4 客户详情页

展示：

- 客户画像
- 跟进时间线
- 最近 AI 建议

### 4.5 忽略号码设置页

这个页面很值得加，而且实现不算重。

建议支持：

- 手动新增号码
- 批量导入号码
- 设置标签，例如“家人”“同事”“银行”“中介”
- 查看最近命中的忽略记录

### 4.6 企业知识库页

建议支持：

- 上传知识文档
- 查看处理状态
- 查看分类
- 手动失效或重建索引

### 4.7 AI Chat 工作台

建议支持：

- 绑定当前客户上下文
- 展示 AI 回答引用来源
- 快速插入“生成跟进建议”“总结客户风险”“生成邀约话术”快捷按钮

---

## 4.8 为什么这些新功能值得做

如果主链路已经跑通，这个功能会明显提高系统吸引力，因为它解决的是销售最真实的问题：

- 录音很多
- 私人电话和业务电话混在一起
- 没人愿意手动一条条筛

同时，企业知识库和 AI Chat 解决的是另一个关键问题：

- 销售不知道如何高质量回复客户
- 销售说法不统一
- 项目资料、医疗卖点、生态卖点分散在不同文档里

而提醒系统解决的是：

- 明知道客户要跟进，但销售容易忘
- 高意向客户被遗漏
- 跟进节奏靠感觉，不稳定

所以它不是锦上添花，而是一个很强的自动化入口。

只是从开发节奏上，仍然建议放在主 MVP 之后。

---

## 5. AI 输出格式建议

为了让前后端和 Prisma 都更稳，建议把结构化提取统一成这个格式：

```json
{
  "customerProfile": {
    "name": null,
    "phone": null,
    "city": null,
    "district": null,
    "age": 68,
    "birthYear": 1958,
    "retirementStatus": "已退休",
    "preRetirementOccupation": "中学教师",
    "occupationCategory": "体制内",
    "pensionRange": "5000-8000"
  },
  "familyAndLiving": {
    "maritalStatus": "已婚",
    "livingWithSpouse": true,
    "housingStatus": "自有住房",
    "livingArrangement": "与配偶同住",
    "acceptsRelocation": true,
    "livesAlone": false,
    "childrenCount": 2,
    "childrenLocations": "南京、上海",
    "childrenSupportLevel": "强支持",
    "childrenFinancialSupport": false
  },
  "intention": {
    "interestLevel": "中意向",
    "interestScore": 72,
    "decisionStage": "愿意参观",
    "decisionMaker": "共同决策",
    "similarProjectAwareness": "了解过",
    "similarProjectNotes": "了解过南京周边两个同类康养项目，但尚未确定",
    "annualStayPreference": "1-3个月",
    "annualStayDurationText": "每年春秋各住一个月左右",
    "visitIntention": true,
    "visitTimeText": "下个月",
    "checkinIntention": false,
    "checkinTimeText": null,
    "budgetRange": "10万-16万",
    "paymentSource": ["养老金", "存款"],
    "triggerReason": "子女希望父母提前看养老社区"
  },
  "health": {
    "healthCondition": "暂无严重基础病",
    "selfCareLevel": "完全自理",
    "careNeedLevel": "无护理需求",
    "livingRiskFlags": ["电梯缺失", "独居风险低"]
  },
  "needs": {
    "primaryNeeds": ["养老需求", "医疗资源关注"],
    "tags": ["中意向", "关注医疗"]
  }
}
```

`ai_confidence` 建议保持同样的结构，只是把值改成 `0-1` 数字。

这些新增字段非常重要，因为它们比“单纯预算”和“是否参观”更能决定客户真实转化能力：

- 年龄 / 出生年：判断养老规划阶段
- 退休前职业 / 养老金区间：判断消费能力和生活习惯
- 常住城市 / 区县：判断生活圈与心理距离
- 居住形态 / 是否独居 / 是否自有住房：判断入住动机和资产基础
- 子女支持度 / 子女资助可能性：判断真实决策链
- 自理能力 / 居住风险：判断产品匹配度
- 对同类项目的认知：判断沟通是教育型还是比较型
- 每年计划居住多久：判断是旅居、季节性入住还是长住

---

## 5.1 客户确认建档表单设计

前端的“确认建档”页面建议不要做成一大坨字段，而是分成 6 个分组卡片。  
这样销售更容易快速扫一遍，AI 低置信度字段也更容易高亮。

### A. 基础身份

字段建议：

- 姓名
- 电话
- 城市
- 区县
- 年龄
- 出生年
- 年龄是否为估算值

交互建议：

- 如果 `age` 和 `birthYear` 同时存在且冲突，给出黄色提示
- `phone` 如果为空但文件名或转录里出现号码，优先高亮

### B. 退休与职业能力

字段建议：

- 退休状态
- 退休前职业
- 职业类别
- 养老金区间
- 支付来源

交互建议：

- `preRetirementOccupation` 用文本输入
- `occupationCategory` 用下拉单选
- `paymentSource` 用多选标签

### C. 家庭与居住情况

字段建议：

- 婚姻情况
- 是否与配偶同住
- 住房情况
- 居住形态
- 是否接受异地养老
- 是否独居
- 是否自有住房
- 子女人数
- 子女所在城市
- 子女支持度
- 子女是否可能资助
- 决策人

交互建议：

- `livesAlone = true` 时，自动提示销售关注独居风险
- `childrenSupportLevel = 反对` 时，提示后续沟通应优先面向子女
- `acceptsRelocation = false` 时，提示销售优先强调交通便利和探访便利

### D. 健康与照护

字段建议：

- 健康状况
- 自理能力
- 护理需求等级
- 居住风险标记

交互建议：

- `livingRiskFlags` 用多选标签
- `selfCareLevel` 或 `careNeedLevel` 为高风险时，自动提示销售强调护理与医疗体系

### E. 需求与意向

字段建议：

- 核心需求
- 标签
- 意向等级
- 意向分数
- 预算区间
- 决策阶段
- 触发动因
- 对同类项目认知
- 同类项目说明
- 每年计划住多久
- 年度居住时长说明

交互建议：

- `interestScore` 可以显示，但默认只允许管理员或高级用户手改
- `decisionStage` 适合做成下拉单选
- `triggerReason` 用多行文本
- `similarProjectNotes` 用多行文本
- `annualStayPreference` 用单选，`annualStayDurationText` 用自然语言补充

### F. 行为与转化

字段建议：

- 是否愿意参观
- 参观时间
- 是否考虑入住
- 入住时间
- AI 摘要
- AI 销售建议
- 下一步动作

交互建议：

- `visitTimeText` 和 `checkinTimeText` 支持自然语言
- 提供一键生成待办按钮，例如“3 天内联系”“安排参观”“发送资料”

---

## 5.2 表单高亮策略

建议用 `ai_confidence` 驱动表单交互：

- `>= 0.85`：正常展示
- `0.60 - 0.84`：黄色提示，建议销售复核
- `< 0.60`：红色提示，默认聚焦该字段

以下字段建议默认高优先级确认：

- 电话
- 年龄 / 出生年
- 城市 / 区县
- 退休前职业
- 养老金区间
- 住房情况
- 是否独居
- 是否接受异地养老
- 子女支持度
- 子女资助可能性
- 预算区间
- 决策人
- 决策阶段
- 对同类项目认知
- 每年计划住多久

---

## 6. 现在最值得优先开发的顺序

如果你要真正开工，我建议按这个顺序写：

1. `prisma/schema.prisma`
2. `POST /api/interactions`
3. `POST /api/interactions/:id/process`
4. `GET /api/interactions/:id`
5. `POST /api/interactions/:id/confirm`
6. `GET /api/customers`
7. `GET /api/customers/:id`

当这条链路稳定后，再进入下一阶段：

8. `ignored_phones` 数据结构
9. `POST /api/interactions/bulk-import-calls`
10. 批量导入 `dryRun` 预检查
11. 去重和忽略规则
12. 忽略号码设置页
13. `knowledge_documents` 和 `knowledge_chunks`
14. `POST /api/knowledge/documents`
15. `POST /api/chat/sessions/:id/messages`
16. 规则驱动提醒生成
17. `GET /api/reminders`

最后再做：

18. AI 辅助提醒理由
19. 历史数据驱动的跟进时机预测

这个顺序能最快跑通演示闭环。

---

## 7. 一句话建议

你现在最应该优先做的不是“客户列表有多完整”，而是：

`先把客户数据捕获和确认链路跑稳，再让知识库、AI Chat、提醒系统建立在可靠数据之上。`

这才是你这个 AI CRM 的核心体验。

如果你准备进入真正开发阶段，建议同时参考：

- [实施步骤、依赖与模板建议.md](/mnt/d/Maoshan/docs/实施步骤、依赖与模板建议.md)
