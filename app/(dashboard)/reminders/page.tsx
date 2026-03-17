import { Clock3 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">跟进提醒</h1>
        <p className="text-muted-foreground">规则提醒与 AI 推荐提醒将在后续切片补齐。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            提醒列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-12 text-center text-muted-foreground">当前版本暂未接入提醒数据。</p>
        </CardContent>
      </Card>
    </div>
  )
}
