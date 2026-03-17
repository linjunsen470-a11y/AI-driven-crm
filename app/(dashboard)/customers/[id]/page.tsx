import {
  BudgetRange,
  CareNeedLevel,
  ConfirmationStatus,
  ContactMethod,
  ContentType,
  CustomerStatus,
  DecisionStage,
  InterestLevel,
  ProcessingStatus,
  SelfCareLevel,
} from "@/generated/prisma/client"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  User,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getCustomerInteractions } from "@/features/customers/server/get-customer-interactions"
import { getCustomerById } from "@/features/customers/server/get-customers"

const statusLabels: Record<CustomerStatus, string> = {
  lead: "潜在客户",
  active: "活跃客户",
  converted: "已转化",
  lost: "已流失",
}

const interestLevelLabels: Record<InterestLevel, string> = {
  high: "高意向",
  medium: "中意向",
  low: "低意向",
  unknown: "未知",
}

const budgetRangeLabels: Record<BudgetRange, string> = {
  below_5w: "5万以下",
  between_5_10w: "5万-10万",
  between_10_16w: "10万-16万",
  above_16w: "16万以上",
  unknown: "未知",
}

const decisionStageLabels: Record<DecisionStage, string> = {
  aware: "初步了解",
  comparing: "对比评估",
  visit_ready: "愿意参观",
  trial_ready: "考虑试住",
  move_ready: "考虑入住",
  unknown: "未知",
}

const selfCareLevelLabels: Record<SelfCareLevel, string> = {
  independent: "完全自理",
  mostly_self: "基本自理",
  partial_help: "部分协助",
  dependent: "高度依赖",
  unknown: "未知",
}

const careNeedLevelLabels: Record<CareNeedLevel, string> = {
  none: "无护理需求",
  light: "轻度护理",
  medium: "中度护理",
  heavy: "重度护理",
  unknown: "未知",
}

const contactMethodLabels: Record<ContactMethod, string> = {
  phone: "电话",
  wechat: "微信",
  in_person: "面谈",
  other: "其他",
}

const contentTypeLabels: Record<ContentType, string> = {
  audio: "音频",
  image: "图片",
  text: "文本",
}

const confirmationStatusLabels: Record<ConfirmationStatus, string> = {
  pending: "待确认",
  confirmed: "已确认",
  rejected: "已拒绝",
  partially_confirmed: "部分确认",
}

const processingStatusLabels: Record<ProcessingStatus, string> = {
  pending: "待处理",
  processing: "处理中",
  completed: "已完成",
  failed: "失败",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const [customer, { interactions }] = await Promise.all([
    getCustomerById(id),
    getCustomerInteractions(id, 20),
  ])

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">客户不存在</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{customer.name || "未命名客户"}</h1>
            <p className="text-sm text-muted-foreground">
              {customer.phone || "无电话"} · 创建于{" "}
              {format(new Date(customer.createdAt), "yyyy-MM-dd", { locale: zhCN })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{statusLabels[customer.customerStatus]}</Badge>
          {customer.interestLevel ? (
            <Badge
              variant={
                customer.interestLevel === "high"
                  ? "default"
                  : customer.interestLevel === "medium"
                    ? "secondary"
                    : "outline"
              }
            >
              {interestLevelLabels[customer.interestLevel]}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">年龄</span>
                  <p>{customer.age ? `${customer.age}岁` : "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">性别</span>
                  <p>{customer.gender || "-"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{[customer.city, customer.district].filter(Boolean).join(" ") || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone || "-"}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">意向等级</span>
                  <span>
                    {customer.interestLevel ? interestLevelLabels[customer.interestLevel] : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">预算范围</span>
                  <span>{customer.budgetRange ? budgetRangeLabels[customer.budgetRange] : "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">决策阶段</span>
                  <span>
                    {customer.decisionStage ? decisionStageLabels[customer.decisionStage] : "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" />
                健康与护理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">自理能力</span>
                <span>
                  {customer.selfCareLevel ? selfCareLevelLabels[customer.selfCareLevel] : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">护理需求</span>
                <span>
                  {customer.careNeedLevel ? careNeedLevelLabels[customer.careNeedLevel] : "-"}
                </span>
              </div>
              {customer.healthCondition ? (
                <div className="pt-2 text-sm">
                  <span className="text-muted-foreground">健康状况</span>
                  <p className="mt-1">{customer.healthCondition}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {customer.profileNotes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{customer.profileNotes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                交互历史
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <MessageSquare className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-4">暂无交互记录</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="relative border-l pb-6 pl-6 last:pb-0"
                    >
                      <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-primary" />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium">
                              {contactMethodLabels[interaction.contactMethod]}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                              {contentTypeLabels[interaction.contentType]}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(interaction.createdAt), "yyyy-MM-dd HH:mm", {
                                locale: zhCN,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {processingStatusLabels[interaction.processingStatus]}
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
                              className="text-xs"
                            >
                              {confirmationStatusLabels[interaction.confirmationStatus]}
                            </Badge>
                          </div>
                        </div>

                        {interaction.aiSummary ? (
                          <div className="rounded-md bg-muted p-3 text-sm">
                            <span className="text-muted-foreground">AI 摘要：</span>
                            {interaction.aiSummary}
                          </div>
                        ) : null}

                        {interaction.aiSalesSuggestion ? (
                          <div className="text-sm text-muted-foreground">
                            销售建议：{interaction.aiSalesSuggestion}
                          </div>
                        ) : null}

                        {interaction.sourceText ? (
                          <div className="line-clamp-3 text-sm text-muted-foreground">
                            {interaction.sourceText}
                          </div>
                        ) : null}

                        {interaction.files.length > 0 ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{interaction.files.length} 个附件</span>
                          </div>
                        ) : null}

                        <div className="flex justify-end">
                          <Link href={`/interactions/${interaction.id}`}>
                            <Button variant="ghost" size="sm">
                              查看详情
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
