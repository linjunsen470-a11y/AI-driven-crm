import { CustomerStatus, InterestLevel } from "@/generated/prisma/client"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Eye, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getCustomers } from "@/features/customers/server/get-customers"

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

const statusOptions: Array<{ label: string; value?: CustomerStatus }> = [
  { label: "全部状态" },
  { label: "潜在客户", value: CustomerStatus.lead },
  { label: "活跃客户", value: CustomerStatus.active },
  { label: "已转化", value: CustomerStatus.converted },
  { label: "已流失", value: CustomerStatus.lost },
]

interface PageProps {
  searchParams: Promise<{
    status?: string
    search?: string
  }>
}

function buildCustomersHref(search: string | undefined, status: CustomerStatus | undefined) {
  const params = new URLSearchParams()
  if (search) {
    params.set("search", search)
  }
  if (status) {
    params.set("status", status)
  }
  const query = params.toString()
  return query ? `/customers?${query}` : "/customers"
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const search = params.search?.trim() || undefined
  const status =
    params.status &&
    Object.values(CustomerStatus).includes(params.status as CustomerStatus)
      ? (params.status as CustomerStatus)
      : undefined

  const { customers, total } = await getCustomers({
    status,
    search,
    limit: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">客户管理</h1>
        <p className="text-muted-foreground">查看和管理客户档案 · 共 {total} 位客户</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">筛选</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap gap-4" action="/customers">
            <Input
              name="search"
              placeholder="搜索姓名、电话、城市..."
              defaultValue={search}
              className="min-w-64 flex-1"
            />
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <Button type="submit" variant="secondary">
              搜索
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const href = buildCustomersHref(search, option.value)
              const active = option.value === status || (!option.value && !status)
              return (
                <Link key={option.label} href={href}>
                  <Button variant={active ? "default" : "outline"} size="sm">
                    {option.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">暂无客户记录</p>
              <p className="text-sm text-muted-foreground">
                可先在交互确认页创建客户档案。
              </p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      {customer.name || "未命名客户"}
                      {customer.phone ? (
                        <span className="font-normal text-muted-foreground">
                          ({customer.phone})
                        </span>
                      ) : null}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {customer.city ? <span>{customer.city}</span> : null}
                      {customer.district ? <span>{customer.district}</span> : null}
                      {customer.age ? <span>{customer.age}岁</span> : null}
                      {customer.gender ? <span>{customer.gender}</span> : null}
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
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">交互次数：</span>
                    {customer._count.interactions}
                  </div>
                  {customer.lastInteractionAt ? (
                    <div>
                      <span className="text-muted-foreground">最近交互：</span>
                      {format(new Date(customer.lastInteractionAt), "yyyy-MM-dd", {
                        locale: zhCN,
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <Link href={`/customers/${customer.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      查看详情
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
