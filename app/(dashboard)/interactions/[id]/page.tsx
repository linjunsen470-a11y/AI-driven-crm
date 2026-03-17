"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle,
  FileUp,
  Heart,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Upload,
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
  files: Array<{
    id: string
    category: string
    status: string
    originalName: string | null
    mimeType: string | null
    fileSizeBytes: number | null
    createdAt: string
  }>
  aiJobs: Array<{
    id: string
    jobType: string
    status: string
    errorMessage: string | null
    retryCount: number
    createdAt: string
    startedAt: string | null
    finishedAt: string | null
  }>
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

const processingStatusLabels: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  completed: "已完成",
  failed: "处理失败",
}

const aiJobTypeLabels: Record<string, string> = {
  transcription: "转录",
  ocr: "OCR",
  extraction: "提取",
  summary: "摘要",
  knowledge_ingestion: "知识入库",
  reminder_generation: "提醒生成",
  chat_response: "Chat 响应",
  call_import: "通话导入",
  other: "其他",
}

const aiJobStatusLabels: Record<string, string> = {
  queued: "已排队",
  running: "运行中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
}

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
  const [isUploading, setIsUploading] = useState(false)
  const [isRequestingProcessing, setIsRequestingProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<InteractionDetail["files"]>([])
  const id = params.id

  async function refreshInteraction() {
    if (!id) {
      return
    }

    const response = await fetch(`/api/interactions/${id}`)

    if (!response.ok) {
      throw new Error("获取交互详情失败")
    }

    const { data } = await response.json()
    setInteraction(data)
    setUploadedFiles(data.files ?? [])

    const extracted = data.aiExtractedData || {}

    setCustomerData({
      name: (extracted.name as string) || data.customer?.name || "",
      phone: (extracted.phone as string) || data.customer?.phone || "",
      city: (extracted.city as string) || data.customer?.city || "",
      district: (extracted.district as string) || data.customer?.district || "",
      age: extracted.age ? String(extracted.age) : "",
      gender: (extracted.gender as string) || "",
      interestLevel: (extracted.interestLevel as string) || data.customer?.interestLevel || "",
      budgetRange: (extracted.budgetRange as string) || data.customer?.budgetRange || "",
      decisionStage: (extracted.decisionStage as string) || data.customer?.decisionStage || "",
      triggerReason: (extracted.triggerReason as string) || "",
      healthCondition: (extracted.healthCondition as string) || "",
      selfCareLevel: (extracted.selfCareLevel as string) || "",
      careNeedLevel: (extracted.careNeedLevel as string) || "",
      profileNotes: (extracted.profileNotes as string) || "",
    })
  }

  useEffect(() => {
    if (!id) {
      return
    }

    refreshInteraction()
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : "加载失败")
      })
      .finally(() => {
        setIsLoading(false)
      })
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

  async function handleConfirm(
    confirmationStatus: "confirmed" | "partially_confirmed" | "rejected" = "confirmed",
  ) {
    if (!id) {
      return
    }

    const rejectionReason =
      confirmationStatus === "rejected"
        ? window.prompt("请输入拒绝原因", "当前交互不适合建档")?.trim()
        : undefined

    if (confirmationStatus === "rejected" && !rejectionReason) {
      setError("拒绝交互时必须填写原因。")
      return
    }

    setIsConfirming(true)
    setError(null)

    try {
      const sanitizedCustomerData =
        confirmationStatus === "rejected"
          ? undefined
          : {
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
          confirmationStatus,
          rejectionReason,
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

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !id) {
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("interactionId", id)
      if (interaction?.customerId) {
        formData.append("customerId", interaction.customerId)
      }

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.error || "上传失败")
      }

      const { data } = await response.json()
      setUploadedFiles((previous) => [data, ...previous])
      await refreshInteraction()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  async function handleRequestProcessing(
    mode: "enqueue" | "mock",
    fileId?: string,
  ) {
    if (!id) {
      return
    }

    setIsRequestingProcessing(true)
    setError(null)

    try {
      const response = await fetch(`/api/interactions/${id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          fileId,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "创建处理任务失败")
      }

      await refreshInteraction()
    } catch (processingError) {
      setError(
        processingError instanceof Error ? processingError.message : "创建处理任务失败",
      )
    } finally {
      setIsRequestingProcessing(false)
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

  const isResolved = interaction.confirmationStatus !== "pending"
  const canConfirm = interaction.processingStatus === "completed" && !isResolved

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
        <div className="flex items-center gap-2">
          <Badge
            variant={
              interaction.processingStatus === "completed"
                ? "default"
                : interaction.processingStatus === "failed"
                  ? "destructive"
                  : interaction.processingStatus === "processing"
                    ? "secondary"
                    : "warning"
            }
          >
            {processingStatusLabels[interaction.processingStatus] || interaction.processingStatus}
          </Badge>
          <Badge
            variant={
              interaction.confirmationStatus === "confirmed"
                ? "default"
                : interaction.confirmationStatus === "rejected"
                  ? "destructive"
                  : interaction.confirmationStatus === "partially_confirmed"
                    ? "outline"
                    : "secondary"
            }
          >
            {interaction.confirmationStatus === "confirmed"
              ? "已确认"
              : interaction.confirmationStatus === "rejected"
                ? "已拒绝"
                : interaction.confirmationStatus === "partially_confirmed"
                  ? "部分确认"
                  : "待确认"}
          </Badge>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!canConfirm && !isResolved ? (
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
                {isResolved ? (
                  <Badge variant="outline" className="ml-auto">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    已处理
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
                    disabled={isResolved}
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
                    disabled={isResolved}
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
                    disabled={isResolved}
                    placeholder="年龄"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">性别</Label>
                  <Input
                    id="gender"
                    value={customerData.gender}
                    onChange={(event) => handleInputChange("gender", event.target.value)}
                    disabled={isResolved}
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
                    disabled={isResolved}
                    placeholder="所在城市"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">区县</Label>
                  <Input
                    id="district"
                    value={customerData.district}
                    onChange={(event) => handleInputChange("district", event.target.value)}
                    disabled={isResolved}
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
                  disabled={isResolved}
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
                  disabled={isResolved}
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
                  disabled={isResolved}
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
                  disabled={isResolved}
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
                  disabled={isResolved}
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
                  disabled={isResolved}
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
                  disabled={isResolved}
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
                  disabled={isResolved}
                  placeholder="其他备注信息"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI 任务
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refreshInteraction().catch(() => {
                        setError("刷新 AI 任务失败。")
                      })
                    }}
                    disabled={isRequestingProcessing}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {interaction.aiJobs.length > 0 ? (
                  interaction.aiJobs.map((job) => (
                    <div key={job.id} className="rounded-md border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {aiJobTypeLabels[job.jobType] || job.jobType}
                        </span>
                        <Badge
                          variant={
                            job.status === "completed"
                              ? "default"
                              : job.status === "failed"
                                ? "destructive"
                                : job.status === "running"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {aiJobStatusLabels[job.status] || job.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        创建于{" "}
                        {format(new Date(job.createdAt), "yyyy-MM-dd HH:mm", {
                          locale: zhCN,
                        })}
                        {" · "}重试 {job.retryCount} 次
                      </p>
                      {job.errorMessage ? (
                        <p className="mt-2 text-xs text-destructive">{job.errorMessage}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">当前还没有 AI 任务。</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileUp className="h-4 w-4" />
                  附件
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-md bg-muted p-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {file.originalName || "未命名附件"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.mimeType || "未知类型"} · {file.category} · {file.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(file.category === "audio" || file.category === "image") && !isResolved ? (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequestProcessing("enqueue", file.id)}
                                disabled={isRequestingProcessing}
                              >
                                创建任务
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRequestProcessing("mock", file.id)}
                                disabled={isRequestingProcessing}
                              >
                                模拟处理
                              </Button>
                            </>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {file.fileSizeBytes
                              ? `${(file.fileSizeBytes / 1024).toFixed(1)} KB`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无附件</p>
                )}

                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="audio/*,image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading || isRequestingProcessing || isResolved}
                    className="flex-1"
                  />
                  <div className="flex items-center text-sm text-muted-foreground">
                    {isUploading || isRequestingProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading ? "上传中" : "处理中"}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {isResolved ? "已处理" : "选择后自动上传"}
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  支持音频和图片文件，最大 50MB。
                </p>
              </CardContent>
            </Card>

            {!isResolved ? (
              <div className="flex flex-wrap justify-end gap-4">
                <Link href="/interactions">
                  <Button variant="outline" disabled={isConfirming}>
                    取消
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() => handleConfirm("rejected")}
                  disabled={!canConfirm || isConfirming}
                >
                  拒绝
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleConfirm("partially_confirmed")}
                  disabled={!canConfirm || isConfirming}
                >
                  部分确认
                </Button>
                <Button
                  onClick={() => handleConfirm("confirmed")}
                  disabled={!canConfirm || isConfirming}
                >
                  {isConfirming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {canConfirm ? "确认并建档" : "等待处理完成"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
