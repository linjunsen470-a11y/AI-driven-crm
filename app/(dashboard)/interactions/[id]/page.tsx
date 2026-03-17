"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Heart,
  Loader2,
  MapPin,
  Phone,
  User,
  Wallet,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface InteractionDetail {
  id: string
  customerId: string | null
  contactMethod: string
  contentType: string
  sourceText: string | null
  transcription: string | null
  processingStatus: string
  confirmationStatus: string
  aiSummary: string | null
  aiSalesSuggestion: string | null
  aiExtractedData: Record<string, unknown>
  aiConfidence: Record<string, number>
  createdAt: string
  customer: {
    id: string
    name: string | null
    phone: string | null
    city: string | null
    district: string | null
    customerStatus: string
    interestLevel: string | null
    budgetRange: string | null
    decisionStage: string | null
  } | null
}

interface EditableCustomerData {
  name: string
  phone: string
  city: string
  district: string
  age: string
  gender: string
  interestLevel: string
  budgetRange: string
  decisionStage: string
  triggerReason: string
  healthCondition: string
  selfCareLevel: string
  careNeedLevel: string
  profileNotes: string
}

const contactMethodLabels: Record<string, string> = {
  phone: "电话",
  wechat: "微信",
  in_person: "面谈",
  other: "其他",
}

const interestLevelOptions = [
  { value: "unset", label: "未设置" },
  { value: "high", label: "高意向" },
  { value: "medium", label: "中意向" },
  { value: "low", label: "低意向" },
  { value: "unknown", label: "未知" },
]

const budgetRangeOptions = [
  { value: "unset", label: "未设置" },
  { value: "below_5w", label: "5万以下" },
  { value: "between_5_10w", label: "5万-10万" },
  { value: "between_10_16w", label: "10万-16万" },
  { value: "above_16w", label: "16万以上" },
  { value: "unknown", label: "未知" },
]

const decisionStageOptions = [
  { value: "unset", label: "未设置" },
  { value: "aware", label: "初步了解" },
  { value: "comparing", label: "对比评估" },
  { value: "visit_ready", label: "愿意参观" },
  { value: "trial_ready", label: "考虑试住" },
  { value: "move_ready", label: "考虑入住" },
  { value: "unknown", label: "未知" },
]

const selfCareLevelOptions = [
  { value: "unset", label: "未设置" },
  { value: "independent", label: "完全自理" },
  { value: "mostly_self", label: "基本自理" },
  { value: "partial_help", label: "部分协助" },
  { value: "dependent", label: "高度依赖" },
  { value: "unknown", label: "未知" },
]

const careNeedLevelOptions = [
  { value: "unset", label: "未设置" },
  { value: "none", label: "无护理需求" },
  { value: "light", label: "轻度护理" },
  { value: "medium", label: "中度护理" },
  { value: "heavy", label: "重度护理" },
  { value: "unknown", label: "未知" },
]

const emptyCustomerData: EditableCustomerData = {
  name: "",
  phone: "",
  city: "",
  district: "",
  age: "",
  gender: "",
  interestLevel: "",
  budgetRange: "",
  decisionStage: "",
  triggerReason: "",
  healthCondition: "",
  selfCareLevel: "",
  careNeedLevel: "",
  profileNotes: "",
}

function toOptionalString(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function toOptionalEnumValue(value: string) {
  return value && value !== "unset" ? value : undefined
}

export default function InteractionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [interaction, setInteraction] = useState<InteractionDetail | null>(null)
  const [customerData, setCustomerData] = useState<EditableCustomerData>(emptyCustomerData)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = params.id

  useEffect(() => {
    if (!id) {
      return
    }

    async function fetchInteraction() {
      try {
        const response = await fetch(`/api/interactions/${id}`)

        if (!response.ok) {
          throw new Error("获取交互详情失败")
        }

        const { data } = await response.json()
        setInteraction(data)

        const extracted = data.aiExtractedData || {}

        setCustomerData({
          name: (extracted.name as string) || data.customer?.name || "",
          phone: (extracted.phone as string) || data.customer?.phone || "",
          city: (extracted.city as string) || data.customer?.city || "",
          district: (extracted.district as string) || data.customer?.district || "",
          age: extracted.age ? String(extracted.age) : "",
          gender: (extracted.gender as string) || "",
          interestLevel:
            (extracted.interestLevel as string) || data.customer?.interestLevel || "",
          budgetRange:
            (extracted.budgetRange as string) || data.customer?.budgetRange || "",
          decisionStage:
            (extracted.decisionStage as string) || data.customer?.decisionStage || "",
          triggerReason: (extracted.triggerReason as string) || "",
          healthCondition: (extracted.healthCondition as string) || "",
          selfCareLevel: (extracted.selfCareLevel as string) || "",
          careNeedLevel: (extracted.careNeedLevel as string) || "",
          profileNotes: (extracted.profileNotes as string) || "",
        })
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "加载失败")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInteraction()
  }, [id])

  function handleInputChange<K extends keyof EditableCustomerData>(
    field: K,
    value: EditableCustomerData[K],
  ) {
    setCustomerData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  async function handleConfirm() {
    if (!id) {
      return
    }

    setIsConfirming(true)
    setError(null)

    try {
      const sanitizedCustomerData = {
        name: toOptionalString(customerData.name),
        phone: toOptionalString(customerData.phone),
        city: toOptionalString(customerData.city),
        district: toOptionalString(customerData.district),
        age:
          customerData.age && Number.isFinite(Number(customerData.age))
            ? Number.parseInt(customerData.age, 10)
            : undefined,
        gender: toOptionalString(customerData.gender),
        interestLevel: toOptionalEnumValue(customerData.interestLevel),
        budgetRange: toOptionalEnumValue(customerData.budgetRange),
        decisionStage: toOptionalEnumValue(customerData.decisionStage),
        triggerReason: toOptionalString(customerData.triggerReason),
        healthCondition: toOptionalString(customerData.healthCondition),
        selfCareLevel: toOptionalEnumValue(customerData.selfCareLevel),
        careNeedLevel: toOptionalEnumValue(customerData.careNeedLevel),
        profileNotes: toOptionalString(customerData.profileNotes),
      }

      const response = await fetch(`/api/interactions/${id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerData: sanitizedCustomerData,
          createNewCustomer: !interaction?.customerId,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || "确认失败")
      }

      router.push("/interactions")
      router.refresh()
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "确认失败")
    } finally {
      setIsConfirming(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!interaction) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>交互记录不存在或已删除</AlertDescription>
        </Alert>
        <Link href="/interactions">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>
      </div>
    )
  }

  const isConfirmed = interaction.confirmationStatus === "confirmed"
  const canConfirm = interaction.processingStatus === "completed" && !isConfirmed

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/interactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">交互详情</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(interaction.createdAt), "yyyy-MM-dd HH:mm", {
                locale: zhCN,
              })}
              {" · "}
              {contactMethodLabels[interaction.contactMethod] || interaction.contactMethod}
            </p>
          </div>
        </div>
        <Badge
          variant={
            interaction.confirmationStatus === "confirmed"
              ? "default"
              : interaction.confirmationStatus === "rejected"
                ? "destructive"
                : "secondary"
          }
        >
          {interaction.confirmationStatus === "confirmed"
            ? "已确认"
            : interaction.confirmationStatus === "rejected"
              ? "已拒绝"
              : "待确认"}
        </Badge>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!canConfirm && !isConfirmed ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            当前交互尚未完成提取，只有处理状态为 completed 时才允许确认建档。
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">原始内容</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                {interaction.sourceText || interaction.transcription || "无文本内容"}
              </div>
            </CardContent>
          </Card>

          {interaction.aiSummary ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI 摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{interaction.aiSummary}</p>
              </CardContent>
            </Card>
          ) : null}

          {interaction.aiSalesSuggestion ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">销售建议</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{interaction.aiSalesSuggestion}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                客户信息
                {isConfirmed ? (
                  <Badge variant="outline" className="ml-auto">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    已确认
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={customerData.name}
                    onChange={(event) => handleInputChange("name", event.target.value)}
                    disabled={isConfirmed}
                    placeholder="客户姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="mr-1 inline h-3 w-3" />
                    电话
                  </Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(event) => handleInputChange("phone", event.target.value)}
                    disabled={isConfirmed}
                    placeholder="联系电话"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="age">
                    <Calendar className="mr-1 inline h-3 w-3" />
                    年龄
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={customerData.age}
                    onChange={(event) => handleInputChange("age", event.target.value)}
                    disabled={isConfirmed}
                    placeholder="年龄"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">性别</Label>
                  <Input
                    id="gender"
                    value={customerData.gender}
                    onChange={(event) => handleInputChange("gender", event.target.value)}
                    disabled={isConfirmed}
                    placeholder="男 / 女"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    <MapPin className="mr-1 inline h-3 w-3" />
                    城市
                  </Label>
                  <Input
                    id="city"
                    value={customerData.city}
                    onChange={(event) => handleInputChange("city", event.target.value)}
                    disabled={isConfirmed}
                    placeholder="所在城市"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">区县</Label>
                  <Input
                    id="district"
                    value={customerData.district}
                    onChange={(event) => handleInputChange("district", event.target.value)}
                    disabled={isConfirmed}
                    placeholder="所在区县"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="interestLevel">
                  <Heart className="mr-1 inline h-3 w-3" />
                  意向等级
                </Label>
                <Select
                  value={customerData.interestLevel || "unset"}
                  onValueChange={(value) =>
                    handleInputChange("interestLevel", value === "unset" ? "" : value)
                  }
                  disabled={isConfirmed}
                >
                  <SelectTrigger id="interestLevel" className="w-full">
                    <SelectValue placeholder="请选择意向等级" />
                  </SelectTrigger>
                  <SelectContent>
                    {interestLevelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetRange">
                  <Wallet className="mr-1 inline h-3 w-3" />
                  预算范围
                </Label>
                <Select
                  value={customerData.budgetRange || "unset"}
                  onValueChange={(value) =>
                    handleInputChange("budgetRange", value === "unset" ? "" : value)
                  }
                  disabled={isConfirmed}
                >
                  <SelectTrigger id="budgetRange" className="w-full">
                    <SelectValue placeholder="请选择预算范围" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decisionStage">决策阶段</Label>
                <Select
                  value={customerData.decisionStage || "unset"}
                  onValueChange={(value) =>
                    handleInputChange("decisionStage", value === "unset" ? "" : value)
                  }
                  disabled={isConfirmed}
                >
                  <SelectTrigger id="decisionStage" className="w-full">
                    <SelectValue placeholder="请选择决策阶段" />
                  </SelectTrigger>
                  <SelectContent>
                    {decisionStageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="healthCondition">健康情况</Label>
                <Input
                  id="healthCondition"
                  value={customerData.healthCondition}
                  onChange={(event) => handleInputChange("healthCondition", event.target.value)}
                  disabled={isConfirmed}
                  placeholder="健康情况补充说明"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selfCareLevel">自理能力</Label>
                <Select
                  value={customerData.selfCareLevel || "unset"}
                  onValueChange={(value) =>
                    handleInputChange("selfCareLevel", value === "unset" ? "" : value)
                  }
                  disabled={isConfirmed}
                >
                  <SelectTrigger id="selfCareLevel" className="w-full">
                    <SelectValue placeholder="请选择自理能力" />
                  </SelectTrigger>
                  <SelectContent>
                    {selfCareLevelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="careNeedLevel">护理需求</Label>
                <Select
                  value={customerData.careNeedLevel || "unset"}
                  onValueChange={(value) =>
                    handleInputChange("careNeedLevel", value === "unset" ? "" : value)
                  }
                  disabled={isConfirmed}
                >
                  <SelectTrigger id="careNeedLevel" className="w-full">
                    <SelectValue placeholder="请选择护理需求" />
                  </SelectTrigger>
                  <SelectContent>
                    {careNeedLevelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="triggerReason">触发原因</Label>
                <Textarea
                  id="triggerReason"
                  value={customerData.triggerReason}
                  onChange={(event) => handleInputChange("triggerReason", event.target.value)}
                  disabled={isConfirmed}
                  placeholder="咨询原因 / 触发因素"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileNotes">备注</Label>
                <Textarea
                  id="profileNotes"
                  value={customerData.profileNotes}
                  onChange={(event) => handleInputChange("profileNotes", event.target.value)}
                  disabled={isConfirmed}
                  placeholder="其他备注信息"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {!isConfirmed ? (
            <div className="flex justify-end gap-4">
              <Link href="/interactions">
                <Button variant="outline" disabled={isConfirming}>
                  取消
                </Button>
              </Link>
              <Button onClick={handleConfirm} disabled={!canConfirm || isConfirming}>
                {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {canConfirm ? "确认并建档" : "等待处理完成"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
