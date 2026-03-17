# AI CRM 字段建议改写版

这版方案保留你的核心思路：

- `interactions` 是第一公民
- AI 先提取，销售后确认
- `customers` 只保存确认后的主数据

同时修正了几个后期容易踩坑的点：

- 不再用 `ON DELETE CASCADE` 删除历史交互
- 不再只存 `file_url`，改为存储路径
- 不再用 `is_confirmed` 这种过于简单的布尔值
- 拆分 `interaction_type`，避免把“渠道”和“内容类型”混在一起
- 为 AI 提取结果补充置信度和版本字段
- 为模糊时间保留文本字段，也预留标准日期字段

---

## 为什么这些画像字段非常重要

对于康养/养老项目来说，下面这些因素不只是“客户描述”，而是直接决定：

- 客户是否有支付能力
- 客户是否有真实入住可能
- 谁才是真正决策人
- 应该强调医疗、生态、社交还是护理
- 应该现在推进，还是先长期培育

你特别提到的几个因素，我认为都属于核心字段：

### 1. 年龄 / 出生年

这是最重要的指标之一，因为它会直接影响：

- 是否已退休或临近退休
- 养老规划是否进入执行期
- 护理需求出现的概率
- 对价格、医疗、社交活动的关注重点

建议同时保留：

- `age`
- `birth_year`

因为销售有时只能问到“大概年龄”，有时只能推断“几几年出生”。

### 2. 退休前工作 / 职业背景

这在你的项目里非常有价值，因为它通常间接反映：

- 生活方式和消费习惯
- 社交圈层
- 对环境、服务、品牌的预期
- 养老金水平和支付能力

建议至少拆成两个层次：

- `pre_retirement_occupation`：原始描述
- `occupation_category`：便于统计的分类

### 3. 居住情况

你提到的“是否自有房屋、是否独居”非常关键，因为它直接影响：

- 是否有立即入住的必要性
- 是否存在居住安全问题
- 是否有资产基础
- 是否更适合旅居体验还是长期入住

建议至少覆盖：

- 是否自有住房
- 当前居住形态
- 是否独居
- 常住城市
- 常住区县

你这次补充的“必须精确到城市及区”非常重要，因为它不只是定位信息，还会影响：

- 客户对熟悉生活圈的依赖程度
- 子女和朋友的探访便利性
- 是否能接受跨城养老
- 销售应该强调交通便利还是生活适配

### 4. 子女情况

这在养老销售中是核心中的核心，因为很多订单并不是老人单独决策。

它会影响：

- 付款支持
- 决策速度
- 参观安排
- 后续异议处理

建议至少采集：

- 子女人数
- 子女所在城市
- 子女支持度
- 子女是否可能资助

### 5. 是否了解过同类康养项目

这个因素也非常关键，因为它会直接影响：

- 客户对康养产品的心理准备程度
- 是否已经有基本比较框架
- 是否容易接受服务包、试住、参观等概念
- 销售是要做“教育型沟通”还是“比较型沟通”

建议至少保留：

- `similar_project_awareness`
- `similar_project_notes`

### 6. 计划每年住多久

这个因素对于康养项目特别重要，因为它直接决定客户更偏向：

- 短期体验
- 季节性旅居
- 半长期居住
- 长住入住

建议至少保留：

- `annual_stay_preference`
- `annual_stay_duration_text`

---

## 你还没明确提到，但也非常值得纳入的关键因素

### 1. 支付来源

比单纯预算更重要的是“钱从哪里来”。

建议关注：

- 养老金
- 存款
- 房产变现
- 子女资助
- 多来源组合

### 2. 自理能力 / 行动能力

仅有“健康状况”还不够，康养场景里还要判断：

- 是否能独立生活
- 是否需要照护
- 是否能参与社群活动

这会直接影响产品匹配。

### 3. 当前触发点 / 入住动因

很多客户不是突然想养老，而是被某件事推动：

- 最近身体变差
- 独居风险增加
- 老伴去世
- 子女不在身边
- 居住环境不方便
- 想先体验旅居养老

这个因素很重要，因为它决定销售话术。

### 4. 决策阶段

不仅要知道“有兴趣”，还要知道客户现在处在哪个阶段：

- 仅了解
- 对比方案
- 愿意参观
- 考虑试住
- 考虑入住

### 5. 地域联系

对于茅山项目，这个因素也很重要：

- 客户常住城市
- 客户常住区县
- 是否来自南京都市圈
- 子女是否方便探访
- 是否能接受异地养老

### 6. 社交和生活方式偏好

有些客户更看重：

- 社群活动
- 文化课程
- 清静环境
- 医疗资源
- 夫妻同住体验

这些偏好会直接影响推荐内容。

### 7. 同类项目体验史

除了“是否了解过”，还值得判断：

- 是否参观过其他康养社区
- 是否短住体验过
- 是否对比过多个项目

这会决定销售要不要从“概念教育”切换成“差异化比较”。

### 8. 年度居住节奏

有些客户并不是想立刻长住，而是：

- 每年固定住 1-2 个月
- 夏天来住
- 冬天来住
- 先试住，再逐渐延长

这个节奏信息对你判断转化路径非常重要。

---

## 建议的客户画像分层

建议把客户画像分成 6 组，这样前端表单、AI 提取和数据库结构都会更清晰：

### A. 基础身份

- 姓名
- 电话
- 城市
- 区县
- 年龄
- 出生年
- 性别

### B. 退休与职业能力

- 是否退休
- 退休前职业
- 职业类别
- 收入/养老金区间
- 支付来源

### C. 家庭与居住结构

- 婚姻情况
- 是否与配偶同住
- 居住形态
- 是否自有住房
- 是否接受异地养老
- 是否独居
- 子女人数
- 子女城市
- 子女支持度
- 子女资助可能性

### D. 健康与护理

- 健康状况
- 自理能力
- 护理需求等级
- 是否存在独居风险

### E. 需求与决策

- 核心需求
- 意向等级
- 预算区间
- 支付来源
- 决策人
- 决策阶段
- 触发动因
- 是否了解过同类项目
- 同类项目体验说明
- 每年计划居住多久

### F. 行为与转化

- 是否愿意参观
- 参观时间
- 是否考虑入住
- 入住时间
- 最后跟进时间
- 下一步动作

---

## 设计原则

### 1. 主数据和 AI 推断结果分层

- `customers`：销售确认后的客户主档案
- `interactions`：每次录音、截图、文本跟进的原始记录和 AI 结果

### 2. 允许“先有交互，后有客户”

销售先上传录音或截图，系统先生成 `interactions`，AI 解析完之后，再决定新建客户还是合并到已有客户。

### 3. 第一版重视可用性，不追求过度规范化

MVP 阶段允许使用宽表和 `JSONB`，但要保留后续演进空间。

---

## 推荐 SQL

你可以直接放到 Supabase 的 `SQL Editor` 执行。

```sql
create extension if not exists pgcrypto;

-- 自动更新时间
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 客户主表：只存“确认后的有效信息”
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),

  -- 负责人；如果后面接 Supabase Auth，可以再改成 references auth.users(id)
  owner_id uuid,

  -- 基础资料
  name varchar(100),
  phone varchar(30),
  phone_normalized varchar(30),
  city varchar(50),
  district varchar(50),
  gender varchar(20),
  age integer,
  birth_year smallint,
  age_estimated boolean default true,

  -- 客户状态
  customer_status varchar(20) not null default 'active'
    check (customer_status in ('lead', 'active', 'converted', 'lost')),

  -- 退休与职业画像
  retirement_status varchar(20)
    check (retirement_status in ('已退休', '即将退休', '未退休', '未知')),
  pre_retirement_occupation varchar(100),
  occupation_category varchar(30)
    check (occupation_category in ('体制内', '企业白领', '企业管理', '个体经营', '专业人士', '蓝领', '自由职业', '其他', '未知')),
  pension_range varchar(30)
    check (pension_range in ('3000以下', '3000-5000', '5000-8000', '8000-12000', '12000以上', '未知')),
  payment_source jsonb not null default '[]'::jsonb,

  -- 家庭与居住画像
  marital_status varchar(20),
  living_with_spouse boolean,
  housing_status varchar(30)
    check (housing_status in ('自有住房', '与子女同住', '租房', '多套房产', '机构居住', '其他', '未知')),
  living_arrangement varchar(30)
    check (living_arrangement in ('独居', '与配偶同住', '与子女同住', '与保姆同住', '多人同住', '其他', '未知')),
  accepts_relocation boolean,
  lives_alone boolean,
  homeownership boolean,
  children_count integer,
  children_locations text,
  children_support_level varchar(20)
    check (children_support_level in ('强支持', '一般支持', '中立', '反对', '未知')),
  children_financial_support boolean,
  decision_maker varchar(20)
    check (decision_maker in ('本人', '配偶', '子女', '共同决策', '未知')),

  -- 意向、预算与决策阶段
  interest_score integer
    check (interest_score is null or (interest_score >= 0 and interest_score <= 100)),
  interest_level varchar(20)
    check (interest_level in ('高意向', '中意向', '低意向', '未知')),
  budget_range varchar(20)
    check (budget_range in ('5万以下', '5万-10万', '10万-16万', '16万以上', '未知')),
  decision_stage varchar(20)
    check (decision_stage in ('初步了解', '对比评估', '愿意参观', '考虑试住', '考虑入住', '未知')),
  trigger_reason text,
  similar_project_awareness varchar(20)
    check (similar_project_awareness in ('不了解', '了解过', '参观过', '对比中', '体验过', '未知')),
  similar_project_notes text,
  annual_stay_preference varchar(20)
    check (annual_stay_preference in ('1个月内', '1-3个月', '3-6个月', '半年以上', '长住', '未确定')),
  annual_stay_duration_text varchar(100),

  -- 参观与入住：同时保留模糊文本和标准日期
  visit_intention boolean,
  visit_time_text varchar(100),
  visit_date date,
  checkin_intention boolean,
  checkin_time_text varchar(100),
  checkin_date date,

  -- 健康与护理
  health_condition text,
  self_care_level varchar(20)
    check (self_care_level in ('完全自理', '基本自理', '部分协助', '高度依赖', '未知')),
  care_need_level varchar(20)
    check (care_need_level in ('无护理需求', '轻度护理', '中度护理', '重度护理', '未知')),
  living_risk_flags jsonb not null default '[]'::jsonb,

  -- AI 和业务扩展字段
  primary_needs jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  profile_notes text,

  -- 跟进信息
  last_interaction_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.customers is '客户主档案：仅保存销售确认后的有效客户信息';

create index if not exists idx_customers_owner_id on public.customers(owner_id);
create index if not exists idx_customers_phone_normalized on public.customers(phone_normalized);
create index if not exists idx_customers_last_interaction_at on public.customers(last_interaction_at desc);
create index if not exists idx_customers_tags_gin on public.customers using gin(tags);
create index if not exists idx_customers_primary_needs_gin on public.customers using gin(primary_needs);

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

-- 交互表：系统的事实层 + AI 中间层
create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),

  -- 允许为空：交互可以先于客户存在
  customer_id uuid references public.customers(id) on delete set null,
  owner_id uuid,

  -- 区分“沟通渠道”和“内容类型”
  contact_method varchar(20) not null
    check (contact_method in ('phone', 'wechat', 'in_person', 'other')),
  content_type varchar(20) not null
    check (content_type in ('audio', 'image', 'text')),

  -- 文件信息：建议存 bucket/path，而不是直接存签名 URL
  storage_bucket varchar(100),
  storage_path text,
  mime_type varchar(100),
  file_size_bytes integer
    check (file_size_bytes is null or file_size_bytes >= 0),
  duration_seconds integer
    check (duration_seconds is null or duration_seconds >= 0),

  -- 原始文本层
  source_text text,
  transcription text,

  -- AI 处理状态
  processing_status varchar(20) not null default 'pending'
    check (processing_status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  processed_at timestamptz,

  -- AI 输出
  ai_summary text,
  ai_sales_suggestion text,
  ai_extracted_data jsonb not null default '{}'::jsonb,
  ai_confidence jsonb not null default '{}'::jsonb,
  extraction_version varchar(50),
  model_name varchar(100),

  -- 销售确认状态
  confirmation_status varchar(30) not null default 'pending'
    check (confirmation_status in ('pending', 'confirmed', 'rejected', 'partially_confirmed')),
  confirmed_at timestamptz,
  confirmed_by uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.interactions is '交互事实表：保存录音/截图/文本及 AI 解析结果';
comment on column public.interactions.ai_extracted_data is '模型提取出的结构化结果，供销售确认后写入 customers';
comment on column public.interactions.ai_confidence is '模型对各字段的置信度结果';

create index if not exists idx_interactions_customer_id on public.interactions(customer_id);
create index if not exists idx_interactions_owner_id on public.interactions(owner_id);
create index if not exists idx_interactions_processing_status on public.interactions(processing_status);
create index if not exists idx_interactions_confirmation_status on public.interactions(confirmation_status);
create index if not exists idx_interactions_created_at on public.interactions(created_at desc);
create index if not exists idx_interactions_ai_extracted_data_gin on public.interactions using gin(ai_extracted_data);

drop trigger if exists trg_interactions_updated_at on public.interactions;
create trigger trg_interactions_updated_at
before update on public.interactions
for each row
execute function public.set_updated_at();
```

---

## 字段改写说明

### 1. `customer_id` 改成 `ON DELETE SET NULL`

原因：

- `interactions` 是事实记录
- 删除客户档案时，不应该把历史录音、截图、AI 结果一起删掉

这对审计、纠错、后续重新建档都更安全。

### 2. `interaction_type` 拆成两个字段

原先的问题是语义混杂：

- `audio / screenshot / text` 是内容类型
- 电话、微信、面谈是沟通渠道

所以改成：

- `contact_method`：`phone / wechat / in_person / other`
- `content_type`：`audio / image / text`

这样前端筛选和后续分析都会更清楚。

### 3. `file_url` 改成 `storage_bucket + storage_path`

原因：

- Supabase 的签名 URL 不适合直接作为长期存储字段
- 后期切换权限、重新签名、迁移存储时更灵活

### 4. `is_confirmed` 改成 `confirmation_status`

布尔值无法覆盖真实业务状态。你后面很可能会遇到：

- AI 提取部分可用，部分要改
- 销售明确驳回 AI 建议
- 已确认但又重新修改

用状态字段更稳。

### 5. 增加 `ai_confidence` 和 `extraction_version`

这两个字段对 AI 产品非常重要：

- `ai_confidence`：让前端知道哪些字段应该重点提醒人工确认
- `extraction_version`：方便你升级 Prompt 或模型之后比较效果

### 6. 时间字段双轨设计

AI 经常提取出模糊表达，例如：

- 下个月
- 近期
- 两年后

所以建议同时保留：

- `visit_time_text` / `checkin_time_text`
- `visit_date` / `checkin_date`

这样第一版既能存真实表达，又不影响以后做提醒和日历。

---

## 这版结构适合怎么开发

推荐工作流：

1. 销售上传录音、截图或文本
2. 前端先插入一条 `interactions`
3. AI 完成转录、摘要、提取，回写 `interactions`
4. 前端展示“AI 提取结果确认卡片”
5. 销售确认后，新建或更新 `customers`
6. 将该条 `interactions.confirmation_status` 更新为 `confirmed`

---

## MVP 可以先不做的东西

为了保持节奏，第一版可以暂时不做：

- 独立 `tags` 表
- 多租户
- 完整审计日志
- 自动任务提醒表
- 复杂权限系统

等你先把“上传 -> AI 解析 -> 确认建档”这条主链路跑通，再补都来得及。

---

## 一句话结论

如果你现在就要开始做，我建议直接用这版结构开工。它已经兼顾了：

- `vibe coding` 的开发速度
- AI 场景下的数据安全性
- 后续继续演进的空间
