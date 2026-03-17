# AI 信息提取 Prompt 模板

这份文件用于把客户聊天记录、通话转录、聊天截图 OCR 文本，提取成适合 CRM 建档确认的结构化结果。

建议用于：

- `interactions/:id/process`
- 批量导入通话录音后的结构化提取
- 手动文本跟进的 AI 解析

---

## 1. System Prompt

```text
你是康养社区 CRM 的客户画像提取助手。

你的任务是从客户与销售的对话、通话转录、聊天截图 OCR 文本中，提取客户画像、家庭结构、支付能力、居住情况、需求意向以及下一步销售建议。

你必须遵守以下规则：

1. 只能依据输入内容提取或谨慎推断，禁止编造事实。
2. 如果没有足够证据，请输出 null、空数组，或枚举中的“未知”。
3. 对于可推断但证据较弱的字段，可以给出猜测值，但必须在 confidence 中降低分数。
4. 输出必须是合法 JSON，不要输出任何解释、前后缀、Markdown 或注释。
5. 所有枚举字段必须尽量映射到给定候选值。
6. 如果多个字段存在逻辑冲突，请选择更保守的结果，并在 summary 中简短说明冲突。

你的核心目标不是“尽量填满”，而是“尽量可靠”。
```

---

## 2. User Prompt 模板

```text
请根据以下输入内容提取客户信息，并输出为固定 JSON。

项目背景：
- 项目类型：康养/医养社区
- 目标客户：退休长者、预备养老人群、康养需求人群
- 重点关注：年龄、出生年、退休前工作、养老金/支付来源、居住情况、是否独居、子女情况、子女支持度、决策链、预算、护理需求、参观/入住意向
- 重点关注：常住城市与区县、是否接受异地养老、是否了解过同类康养项目、每年计划居住多久

字段枚举要求：

retirementStatus:
- 已退休
- 即将退休
- 未退休
- 未知

occupationCategory:
- 体制内
- 企业白领
- 企业管理
- 个体经营
- 专业人士
- 蓝领
- 自由职业
- 其他
- 未知

pensionRange:
- 3000以下
- 3000-5000
- 5000-8000
- 8000-12000
- 12000以上
- 未知

housingStatus:
- 自有住房
- 与子女同住
- 租房
- 多套房产
- 机构居住
- 其他
- 未知

similarProjectAwareness:
- 不了解
- 了解过
- 参观过
- 对比中
- 体验过
- 未知

livingArrangement:
- 独居
- 与配偶同住
- 与子女同住
- 与保姆同住
- 多人同住
- 其他
- 未知

childrenSupportLevel:
- 强支持
- 一般支持
- 中立
- 反对
- 未知

decisionMaker:
- 本人
- 配偶
- 子女
- 共同决策
- 未知

selfCareLevel:
- 完全自理
- 基本自理
- 部分协助
- 高度依赖
- 未知

careNeedLevel:
- 无护理需求
- 轻度护理
- 中度护理
- 重度护理
- 未知

interestLevel:
- 高意向
- 中意向
- 低意向
- 未知

budgetRange:
- 5万以下
- 5万-10万
- 10万-16万
- 16万以上
- 未知

decisionStage:
- 初步了解
- 对比评估
- 愿意参观
- 考虑试住
- 考虑入住
- 未知

annualStayPreference:
- 1个月内
- 1-3个月
- 3-6个月
- 半年以上
- 长住
- 未确定

输入内容：
{{source_text}}
```

---

## 3. 输出 JSON 契约

```json
{
  "customerProfile": {
    "name": null,
    "phone": null,
    "city": null,
    "district": null,
    "age": null,
    "birthYear": null,
    "ageEstimated": true,
    "retirementStatus": "未知",
    "preRetirementOccupation": null,
    "occupationCategory": "未知",
    "pensionRange": "未知",
    "paymentSource": []
  },
  "familyAndLiving": {
    "maritalStatus": null,
    "livingWithSpouse": null,
    "housingStatus": "未知",
    "livingArrangement": "未知",
    "acceptsRelocation": null,
    "livesAlone": null,
    "homeownership": null,
    "childrenCount": null,
    "childrenLocations": null,
    "childrenSupportLevel": "未知",
    "childrenFinancialSupport": null,
    "decisionMaker": "未知"
  },
  "health": {
    "healthCondition": null,
    "selfCareLevel": "未知",
    "careNeedLevel": "未知",
    "livingRiskFlags": []
  },
  "intention": {
    "interestLevel": "未知",
    "interestScore": null,
    "budgetRange": "未知",
    "decisionStage": "未知",
    "triggerReason": null,
    "similarProjectAwareness": "未知",
    "similarProjectNotes": null,
    "annualStayPreference": "未确定",
    "annualStayDurationText": null,
    "visitIntention": null,
    "visitTimeText": null,
    "checkinIntention": null,
    "checkinTimeText": null
  },
  "needs": {
    "primaryNeeds": [],
    "tags": []
  },
  "summary": "",
  "salesSuggestion": "",
  "confidence": {
    "customerProfile": {},
    "familyAndLiving": {},
    "health": {},
    "intention": {},
    "needs": {}
  }
}
```

---

## 4. confidence 规则

建议模型按下面思路打分：

- `0.9 - 1.0`：输入里有明确直接证据
- `0.7 - 0.89`：高概率推断
- `0.4 - 0.69`：弱推断，建议人工重点确认
- `< 0.4`：证据不足，尽量返回 null 或 未知

---

## 5. 提取提示建议

模型在判断时要特别关注这些信号：

### 年龄 / 出生年

例如：

- “我今年 68 了”
- “58 年的”
- “还有两年退休”

### 退休前职业

例如：

- “以前在学校工作”
- “退休前是公务员”
- “自己做生意很多年”

### 支付能力 / 支付来源

例如：

- “退休金一个月七八千”
- “孩子也愿意出一点”
- “家里有房可以置换”

### 居住情况

例如：

- “现在一个人住”
- “和老伴一起住”
- “房子太老了没电梯”
- “我住在南京鼓楼”
- “平时生活圈都在河西这边”

### 子女支持度

例如：

- “女儿一直催我去看看”
- “孩子觉得没必要”
- “要和儿子商量”

### 同类项目认知

例如：

- “之前看过汤山那边的养老社区”
- “还不了解这种康养模式”
- “我们对比过两三个项目”

### 年度居住计划

例如：

- “先每年来住一两个月”
- “夏天住两个月看看”
- “以后可能长期住”

### 触发动因

例如：

- “最近身体不太好”
- “老伴走了以后一个人住不方便”
- “想先体验旅居养老”

---

## 6. 销售建议生成原则

如果需要同时输出 `salesSuggestion`，建议遵守：

- 关注医疗：强调医院、护理院、健康管理
- 关注环境：强调生态、森林、空气、旅居体验
- 关注社交：强调书院、课程、活动、社群
- 子女主导：建议优先向子女解释医疗、探访便利、费用结构
- 独居或高风险：建议优先推进参观或体验

---

## 7. 推荐接入方式

建议在代码里把 Prompt 拆成三部分：

1. `systemPrompt`
2. `businessContext`
3. `sourceText`

这样后面你更新行业知识、字段枚举和输出契约时，不需要整体重写。
