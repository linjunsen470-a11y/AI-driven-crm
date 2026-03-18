import type { ExtractedCustomerData } from "@/features/ai/server/ai-job-contracts"

export interface ExtractionResult {
  extractedData: ExtractedCustomerData
  confidence: Record<string, number>
  summary: string
  salesSuggestion: string
}

export const TEXT_EXTRACTION_VERSION = "text-extraction-rules-v1"
export const TEXT_EXTRACTION_MODEL_NAME = "rule-based-extractor"

const CITY_NAMES = [
  "北京",
  "上海",
  "广州",
  "深圳",
  "杭州",
  "南京",
  "苏州",
  "成都",
  "武汉",
  "西安",
  "重庆",
  "天津",
  "青岛",
  "大连",
  "厦门",
  "宁波",
  "无锡",
  "佛山",
  "东莞",
  "长沙",
  "郑州",
  "济南",
  "沈阳",
  "昆明",
  "合肥",
  "福州",
  "石家庄",
  "哈尔滨",
  "南昌",
  "贵阳",
  "南宁",
  "乌鲁木齐",
  "兰州",
  "银川",
  "西宁",
  "拉萨",
  "海口",
  "呼和浩特",
  "太原",
]

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern))
}

function parseCity(text: string) {
  for (const city of CITY_NAMES) {
    if (text.includes(city)) {
      return city
    }
  }

  const livingCityMatch = text.match(/住在([\u4e00-\u9fa5]{2,10})/)
  if (livingCityMatch) {
    return livingCityMatch[1]
  }

  const cityMatch = text.match(/([\u4e00-\u9fa5]{2,10})市/)
  if (cityMatch) {
    return cityMatch[1]
  }

  return undefined
}

export async function extractCustomerDataFromText(text: string): Promise<ExtractionResult> {
  const extractedData: ExtractedCustomerData = {}
  const confidence: Record<string, number> = {}

  const nameMatch = text.match(/(?:姓名[:：]?\s*|我叫|先生|女士)([\u4e00-\u9fa5]{2,4})/)
  if (nameMatch) {
    extractedData.name = nameMatch[1].trim()
    confidence.name = 0.7
  }

  const phoneMatch = text.match(/1[3-9]\d{9}/)
  if (phoneMatch) {
    extractedData.phone = phoneMatch[0]
    confidence.phone = 0.9
  }

  const ageMatch = text.match(/(\d{2,3})\s*(?:岁|周岁)/)
  if (ageMatch) {
    extractedData.age = Number.parseInt(ageMatch[1], 10)
    confidence.age = 0.8
  }

  const city = parseCity(text)
  if (city) {
    extractedData.city = city
    confidence.city = 0.6
  }

  if (includesAny(text, ["非常感兴趣", "很感兴趣", "确定要", "强烈意向"])) {
    extractedData.interestLevel = "high"
    confidence.interestLevel = 0.75
  } else if (includesAny(text, ["考虑", "看看", "了解一下", "先咨询"])) {
    extractedData.interestLevel = "medium"
    confidence.interestLevel = 0.6
  } else if (includesAny(text, ["不需要", "没兴趣", "太贵", "先不考虑"])) {
    extractedData.interestLevel = "low"
    confidence.interestLevel = 0.7
  }

  if (includesAny(text, ["5万以下", "五万以下", "50000以下"])) {
    extractedData.budgetRange = "below_5w"
    confidence.budgetRange = 0.7
  } else if (includesAny(text, ["5万-10万", "十万以内", "10万以内"])) {
    extractedData.budgetRange = "between_5_10w"
    confidence.budgetRange = 0.7
  } else if (includesAny(text, ["10万-16万", "十六万以内", "16万以内"])) {
    extractedData.budgetRange = "between_10_16w"
    confidence.budgetRange = 0.7
  } else if (includesAny(text, ["预算充足", "可以承担", "不差钱"])) {
    extractedData.budgetRange = "above_16w"
    confidence.budgetRange = 0.5
  }

  if (includesAny(text, ["参观", "看环境", "到访"])) {
    extractedData.decisionStage = "visit_ready"
    confidence.decisionStage = 0.8
  } else if (includesAny(text, ["试住", "体验入住", "短住体验"])) {
    extractedData.decisionStage = "trial_ready"
    confidence.decisionStage = 0.8
  } else if (includesAny(text, ["入住", "决定入住", "尽快入住"])) {
    extractedData.decisionStage = "move_ready"
    confidence.decisionStage = 0.85
  } else if (includesAny(text, ["对比", "比较几家", "评估中"])) {
    extractedData.decisionStage = "comparing"
    confidence.decisionStage = 0.75
  } else {
    extractedData.decisionStage = "aware"
    confidence.decisionStage = 0.5
  }

  if (includesAny(text, ["完全自理", "生活自理", "身体还可以"])) {
    extractedData.selfCareLevel = "independent"
    confidence.selfCareLevel = 0.7
  } else if (includesAny(text, ["需要协助", "行动不便", "偶尔帮忙"])) {
    extractedData.selfCareLevel = "partial_help"
    confidence.selfCareLevel = 0.65
  } else if (includesAny(text, ["卧床", "不能自理", "高度依赖"])) {
    extractedData.selfCareLevel = "dependent"
    confidence.selfCareLevel = 0.8
  }

  const summary = generateSummary(extractedData)
  const salesSuggestion = generateSalesSuggestion(extractedData)

  return {
    extractedData,
    confidence,
    summary,
    salesSuggestion,
  }
}

function generateSummary(data: ExtractedCustomerData) {
  const parts: string[] = []

  if (data.name) {
    parts.push(`客户${data.name}`)
  }

  if (data.age) {
    parts.push(`${data.age}岁`)
  }

  if (data.city) {
    parts.push(`居住在${data.city}`)
  }

  if (parts.length > 0) {
    return `${parts.join("，")}。`
  }

  return "文本交互记录，待进一步确认客户信息。"
}

function generateSalesSuggestion(data: ExtractedCustomerData) {
  if (data.decisionStage === "visit_ready") {
    return "建议尽快安排参观，优先展示环境和设施。"
  }

  if (data.decisionStage === "trial_ready") {
    return "可以引导试住体验，降低决策门槛。"
  }

  if (data.decisionStage === "comparing") {
    return "建议了解对比对象，突出项目差异化优势。"
  }

  if (data.interestLevel === "high") {
    return "高意向客户，建议加速跟进并明确下一步动作。"
  }

  if (data.interestLevel === "low") {
    return "需要进一步了解顾虑，再做针对性沟通。"
  }

  return "持续跟进，逐步补齐客户画像和需求信息。"
}
