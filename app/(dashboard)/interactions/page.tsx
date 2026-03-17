import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { AlertCircle, CheckCircle, Clock, Eye, User } from "lucide-react"
import {
  ConfirmationStatus,
  ContactMethod,
  ContentType,
  ProcessingStatus,
} from "@/generated/prisma/client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPendingInteractions } from "@/features/interactions/server/get-interactions"

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

const confirmationStatusConfig: Record<
  ConfirmationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }
> = {
  pending: { label: "待确认", variant: "secondary", icon: Clock },
  confirmed: { label: "已确认", variant: "default", icon: CheckCircle },
  rejected: { label: "已拒绝", variant: "destructive", icon: AlertCircle },
  partially_confirmed: { label: "部分确认", variant: "outline", icon: CheckCircle },
}

const processingStatusConfig: Record<
  ProcessingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "warning" }
> = {
  pending: { label: "待处理", variant: "warning" },
  processing: { label: "处理中", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
}

export default async function InteractionsPage() {
  const { interactions, total } = await getPendingInteractions(50, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">待确认交互</h1>
          <p className="text-sm text-muted-foreground">
            查看 AI 提取结果并确认客户信息 · 共 {total} 条
          </p>
        </div>
        <Link href="/interactions/new">
          <Button>创建交互</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {interactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">暂无待确认的交互记录</p>
              <Link href="/interactions/new" className="mt-4 inline-block">
                <Button variant="outline">创建第一条交互</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          interactions.map((interaction) => {
            const statusConfig = confirmationStatusConfig[interaction.confirmationStatus]
            const processingConfig = processingStatusConfig[interaction.processingStatus]
            const StatusIcon = statusConfig.icon

            return (
              <Card key={interaction.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4" />
                        {interaction.customer?.name || "新客户"}
                        {interaction.customer?.phone ? (
                          <span className="font-normal text-muted-foreground">
                            ({interaction.customer.phone})
                          </span>
                        ) : null}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{contactMethodLabels[interaction.contactMethod]}</span>
                        <span>·</span>
                        <span>{contentTypeLabels[interaction.contentType]}</span>
                        <span>·</span>
                        <span>
                          {format(new Date(interaction.createdAt), "yyyy-MM-dd HH:mm", {
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={processingConfig.variant}>{processingConfig.label}</Badge>
                      <Badge variant={statusConfig.variant}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interaction.aiSummary ? (
                    <div className="text-sm">
                      <span className="text-muted-foreground">AI 摘要：</span>
                      {interaction.aiSummary}
                    </div>
                  ) : null}
                  {interaction.sourceText ? (
                    <div className="line-clamp-2 text-sm text-muted-foreground">
                      {interaction.sourceText}
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <Link href={`/interactions/${interaction.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        查看详情
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
