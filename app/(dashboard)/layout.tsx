import Link from "next/link"
import { Clock, MessageSquare, Settings, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { getMockCurrentUser } from "@/lib/auth/mock-user"

const navItems = [
  { href: "/interactions", label: "待确认交互", icon: MessageSquare },
  { href: "/customers", label: "客户", icon: Users },
  { href: "/reminders", label: "提醒", icon: Clock },
  { href: "/settings", label: "设置", icon: Settings },
]

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const currentUser = getMockCurrentUser()

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="hidden w-64 border-r bg-muted/20 md:flex md:flex-col">
        <div className="border-b px-5 py-4">
          <p className="text-sm font-semibold">Maoshan AI CRM</p>
          <p className="text-xs text-muted-foreground">销售跟进工作台</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
          <div>
            <p className="text-sm font-medium">内部工作台</p>
          </div>
          <div className="text-sm text-muted-foreground">{currentUser.name}</div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </div>
  )
}
