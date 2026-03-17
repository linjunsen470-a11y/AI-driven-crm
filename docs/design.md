
---

# 一、CRM数据结构（AI系统）

建议的客户数据结构：

```json
{
  "customer_id": "",
  "name": "",
  "age": "",
  "birth_year": "",
  "age_estimated": true,
  "city": "",
  "district": "",
  "phone": "",
  "pre_retirement_occupation": "",
  "occupation_category": "",
  "pension_range": "",
  "payment_source": [],
  "retirement_status": "",
  "marital_status": "",
  "living_with_spouse": "",
  "housing_status": "",
  "living_arrangement": "",
  "accepts_relocation": "",
  "lives_alone": "",
  "homeownership": "",
  "children_count": "",
  "children_locations": "",
  "children_support_level": "",
  "children_financial_support": "",
  "decision_maker": "",
  "decision_stage": "",
  "interest_level": "",
  "interest_score": "",
  "budget_range": "",
  "trigger_reason": "",
  "similar_project_awareness": "",
  "similar_project_notes": "",
  "annual_stay_preference": "",
  "annual_stay_duration_text": "",
  "visit_intention": "",
  "visit_time": "",
  "checkin_intention": "",
  "checkin_time": "",
  "health_condition": "",
  "self_care_level": "",
  "care_need_level": "",
  "living_risk_flags": [],
  "primary_needs": [],
  "tags": [],
  "last_conversation_summary": "",
  "next_action": ""
}
```

---

# 二、AI客户需求标签体系

AI需要自动给客户打标签。

```json
[
"养老需求",
"旅居养老",
"健康疗养",
"医疗资源关注",
"环境关注",
"社交活动需求",
"文化兴趣需求",
"护理需求",
"夫妻入住",
"单人入住",
"子女决策",
"投资养老",
"提前养老规划",
"短期体验",
"参观意向",
"明确入住意向"
]
```

---

# 三、客户需求字段解释

### retirement_status

```
已退休
即将退休
未退休
未知
```

---

### care_need_level

```
无护理需求
轻度护理
中度护理
重度护理
未知
```

---

### budget_range

```
5万以下
5万-10万
10万-16万
16万以上
未知
```

---

### occupation_category

```
体制内
企业白领
企业管理
个体经营
专业人士
蓝领
自由职业
其他
未知
```

---

### pension_range

```
3000以下
3000-5000
5000-8000
8000-12000
12000以上
未知
```

---

### housing_status

```
自有住房
与子女同住
租房
多套房产
机构居住
其他
未知
```

---

### living_arrangement

```
独居
与配偶同住
与子女同住
与保姆同住
多人同住
其他
未知
```

---

### children_support_level

```
强支持
一般支持
中立
反对
未知
```

---

### decision_stage

```
初步了解
对比评估
愿意参观
考虑试住
考虑入住
未知
```

---

### self_care_level

```
完全自理
基本自理
部分协助
高度依赖
未知
```

---

### similar_project_awareness

```
不了解
了解过
参观过
对比中
体验过
未知
```

---

### annual_stay_preference

```
1个月内
1-3个月
3-6个月
半年以上
长住
未确定
```

---

# 四、AI对话信息抽取 Prompt

AI agent 读取客户聊天记录时使用。

```text
你是康养社区 CRM 信息提取助手。

你的任务是从客户与销售的聊天记录、通话转录、语音摘要或聊天截图 OCR 文本中，
提取客户画像、家庭结构、支付能力、居住情况、需求意向与下一步销售建议。

请遵守以下规则：

1. 只能基于提供的内容提取或谨慎推断，不要编造事实。
2. 如果字段没有证据，请输出 null 或 "未知"。
3. 对于可推断但不确定的信息，请保留低置信度。
4. 输出必须是合法 JSON，不要输出解释文字。
5. 金额、时间、关系、职业等要尽量标准化到给定枚举。

请重点提取以下信息：

一、基础身份
- 姓名
- 电话
- 所在城市
- 所在区县
- 年龄
- 出生年
- 年龄是否为估算
- 是否退休

二、退休与职业能力
- 退休前职业原始描述
- 职业类别
- 养老金区间
- 支付来源

三、家庭与居住情况
- 婚姻情况
- 是否与配偶同住
- 当前住房情况
- 当前居住形态
- 是否接受异地养老
- 是否独居
- 是否自有住房
- 子女人数
- 子女所在城市
- 子女支持度
- 子女是否可能提供经济支持
- 决策人

四、健康与照护
- 健康状况
- 自理能力
- 护理需求等级
- 居住风险标记

五、需求与意向
- 核心需求
- 标签
- 意向等级
- 意向分数
- 预算区间
- 决策阶段
- 当前触发动因
- 是否了解过同类项目
- 同类项目说明
- 每年计划住多久
- 每年计划居住时长说明
- 是否愿意参观
- 参观时间
- 是否考虑入住
- 入住时间

六、销售输出
- 对话摘要
- 下一步销售建议

输出格式要求：
- 使用固定 JSON 结构
- 置信度字段使用 0 到 1 的数字
- 多选字段使用数组
- 不确定但有弱证据的字段，允许给出值，但必须在 confidence 中降低分数
```

---

# 五、AI输出格式

AI统一输出：

```json
{
  "customer_profile": {
    "name": null,
    "phone": null,
    "city": null,
    "district": null,
    "age": null,
    "birth_year": null,
    "age_estimated": true,
    "retirement_status": "未知",
    "pre_retirement_occupation": null,
    "occupation_category": "未知",
    "pension_range": "未知",
    "payment_source": []
  },
  "family_and_living": {
    "marital_status": null,
    "living_with_spouse": null,
    "housing_status": "未知",
    "living_arrangement": "未知",
    "accepts_relocation": null,
    "lives_alone": null,
    "homeownership": null,
    "children_count": null,
    "children_locations": null,
    "children_support_level": "未知",
    "children_financial_support": null,
    "decision_maker": "未知"
  },
  "health": {
    "health_condition": null,
    "self_care_level": "未知",
    "care_need_level": "未知",
    "living_risk_flags": []
  },
  "intention": {
    "interest_level": "未知",
    "interest_score": null,
    "budget_range": "未知",
    "decision_stage": "未知",
    "trigger_reason": null,
    "similar_project_awareness": "未知",
    "similar_project_notes": null,
    "annual_stay_preference": "未确定",
    "annual_stay_duration_text": null,
    "visit_intention": null,
    "visit_time": null,
    "checkin_intention": null,
    "checkin_time": null
  },
  "needs": {
    "primary_needs": [],
    "tags": []
  },
  "summary": "",
  "sales_suggestion": "",
  "confidence": {
    "customer_profile": {},
    "family_and_living": {},
    "health": {},
    "intention": {},
    "needs": {}
  }
}
```

---

# 六、客户意向评分系统

AI根据聊天内容给客户评分。

评分范围：

```
0-100
```

---

## 高意向（80-100）

客户特征：

* 询问价格
* 询问套餐
* 询问入住流程
* 预约参观

---

## 中意向（50-80）

客户特征：

* 询问环境
* 询问医疗
* 讨论养老规划

---

## 低意向（0-50）

客户特征：

* 随便了解
* 无明确需求

---

# 七、AI销售建议规则

AI自动生成销售建议。

---

## 生态型客户

客户关注：

空气
自然环境

AI建议：

重点介绍：

茅山森林环境
负氧离子
生态康养。

---

## 医疗型客户

客户关注：

医院
医疗保障

AI建议：

强调：

江南医院
三级医院标准
医保定点。

---

## 社交型客户

客户关注：

活动
社群

AI建议：

强调：

卿舸书院
兴趣课程
社群活动。

---

## 护理型客户

客户关注：

护理
健康问题

AI建议：

介绍：

桑榆堂护理院
专业护理。

---

# 八、AI销售转化流程

标准流程：

```
客户咨询
↓
AI分析需求
↓
客户画像生成
↓
意向评分
↓
推荐销售策略
↓
邀请参观
↓
参观转化
↓
购买康养包
```

---

# 九、销售触发事件

AI系统自动提醒销售。

---

### 高意向触发

客户提到：

```
参观
体验
价格
入住
套餐
```

动作：

```
销售立即跟进
```

---

### 医疗关注触发

客户提到：

```
医院
护理
健康
```

动作：

```
发送医疗介绍
```

---

### 环境关注触发

客户提到：

```
空气
环境
山
森林
```

动作：

```
发送生态介绍
```

---

# 十、最关键的一件事（AI系统核心）

你的 CRM 未来最重要的一件事：

**Conversation Driven CRM**

系统逻辑：

```
聊天记录
↓
AI解析
↓
客户画像
↓
自动更新CRM
```

销售不需要手填CRM。

---

