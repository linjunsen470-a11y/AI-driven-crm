"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const contactMethods = [
  { value: "phone", label: "电话" },
  { value: "wechat", label: "微信" },
  { value: "in_person", label: "面谈" },
  { value: "other", label: "其他" },
]

export default function NewInteractionPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contactMethod, setContactMethod] = useState("phone")
  const [sourceText, setSourceText] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!sourceText.trim()) {
      setError("请输入交互内容。")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactMethod,
          contentType: "text",
          sourceText: sourceText.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "创建失败")
      }

      const { data } = await response.json()

      router.push(`/interactions/${data.id}`)
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "创建失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/interactions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">创建交互记录</h1>
          <p className="text-muted-foreground">手动录入文本交互内容</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>交互信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="contactMethod">联系方式</Label>
              <Select value={contactMethod} onValueChange={setContactMethod}>
                <SelectTrigger id="contactMethod" className="w-full">
                  <SelectValue placeholder="请选择联系方式" />
                </SelectTrigger>
                <SelectContent>
                  {contactMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceText">交互内容</Label>
              <Textarea
                id="sourceText"
                value={sourceText}
                onChange={(event) => setSourceText(event.target.value)}
                placeholder="请输入与客户的交互内容，系统会先做占位提取，后续可替换成真实 AI 提取。"
                rows={12}
                required
              />
              <p className="text-sm text-muted-foreground">
                当前阶段只支持文本交互闭环。音频、图片与转录流程将在后续切片补齐。
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/interactions">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  取消
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || !sourceText.trim()}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                创建交互
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
