"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function KPICard({
  title,
  value,
  icon: Icon,
  color = "primary",
}: {
  title: string
  value: string | number
  icon: LucideIcon
  color?: "primary" | "accent" | "destructive" | "warning"
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning-foreground",
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl", colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{title}</span>
        </div>
      </CardContent>
    </Card>
  )
}
