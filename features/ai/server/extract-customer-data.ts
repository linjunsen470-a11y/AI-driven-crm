export interface ExtractedCustomerData {
  name?: string
  phone?: string
  city?: string
  district?: string
  age?: number
  gender?: string
  interestLevel?: string
  budgetRange?: string
  decisionStage?: string
  triggerReason?: string
  healthCondition?: string
  selfCareLevel?: string
  careNeedLevel?: string
  profileNotes?: string
}

export interface ExtractionResult {
  extractedData: ExtractedCustomerData
  confidence: Record<string, number>
  summary: string
  salesSuggestion: string
}

export async function extractCustomerDataFromText(text: string): Promise<ExtractionResult> {
  const extractedData: ExtractedCustomerData = {}
  const confidence: Record<string, number> = {}

  const nameMatch = text.match(/(?:姓名[：:]\s*|我叫|先生|女士)([^，。,\s]{2,4})/)
  if (nameMatch) {
    extractedData.name = nameMatch[1].trim()
    confidence.name = 0.7
  }

  const phoneMatch = text.match(/1[3-9]\d{9}/)
  if (phoneMatch) {
    extractedData.phone = phoneMatch[0]
    confidence.phone = 0.9
  }

  const ageMatch = text.match(/(\d{2,3})\s*[岁歲]/)
  if (ageMatch) {
    extractedData.age = Number.parseInt(ageMatch[1], 10)
    confidence.age = 0.8
  }

  const cityPatterns = [
    /(北京|上海|广州|深圳|杭州|南京|苏州|成都|武汉|西安|重庆|天津|青岛|大连|厦门|宁波|无锡|佛山|东莞|长沙|郑州|济南|沈阳|昆明|合肥|福州|石家庄|哈尔滨|南昌|贵阳|南宁|乌鲁木齐|兰州|银川|西宁|拉萨|海口|呼和浩特|太原)/,
    /住在([^，。,]{2,10}?)[市区县]/,
    /([^，。,]{2,10}?)市/,
  ]
  for (const pattern of cityPatterns) {
    const cityMatch = text.match(pattern)
    if (cityMatch) {
      extractedData.city = cityMatch[1].trim()
      confidence.city = 0.6
      break
    }
  }

  if (text.includes("很感兴趣") || text.includes("非常想") || text.includes("确定要")) {
    extractedData.interestLevel = "high"
    confidence.interestLevel = 0.75
  } else if (text.includes("考虑") || text.includes("看看") || text.includes("了解一下")) {
    extractedData.interestLevel = "medium"
    confidence.interestLevel = 0.6
  } else if (text.includes("不需要") || text.includes("没兴趣") || text.includes("太贵")) {
    extractedData.interestLevel = "low"
    confidence.interestLevel = 0.7
  }

  if (text.includes("5万") || text.includes("五万") || text.includes("50000")) {
    extractedData.budgetRange = "below_5w"
    confidence.budgetRange = 0.7
  } else if (text.includes("10万") || text.includes("十万")) {
    extractedData.budgetRange = "between_5_10w"
    confidence.budgetRange = 0.7
  } else if (text.includes("16万") || text.includes("十六万")) {
    extractedData.budgetRange = "between_10_16w"
    confidence.budgetRange = 0.7
  } else if (text.includes("不差钱") || text.includes("没问题") || text.includes("可以承担")) {
    extractedData.budgetRange = "above_16w"
    confidence.budgetRange = 0.5
  }

  if (text.includes("参观") || text.includes("看看环境")) {
    extractedData.decisionStage = "visit_ready"
    confidence.decisionStage = 0.8
  } else if (text.includes("试住") || text.includes("体验")) {
    extractedData.decisionStage = "trial_ready"
    confidence.decisionStage = 0.8
  } else if (text.includes("入住") || text.includes("决定")) {
    extractedData.decisionStage = "move_ready"
    confidence.decisionStage = 0.85
  } else if (text.includes("对比") || text.includes("比较")) {
    extractedData.decisionStage = "comparing"
    confidence.decisionStage = 0.75
  } else {
    extractedData.decisionStage = "aware"
    confidence.decisionStage = 0.5
  }

  if (text.includes("自理") || text.includes("健康")) {
    extractedData.selfCareLevel = "independent"
    confidence.selfCareLevel = 0.7
  } else if (text.includes("协助") || text.includes("帮忙")) {
    extractedData.selfCareLevel = "partial_help"
    confidence.selfCareLevel = 0.65
  } else if (text.includes("不能自理") || text.includes("卧床")) {
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
    return "需进一步了解顾虑，再进行针对性沟通。"
  }

  return "持续跟进，逐步补齐客户画像和需求信息。"
}
