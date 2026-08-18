import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/cn"

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "brand" | "success" | "warning" | "danger" | "info"
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        variant === "default" && "bg-card text-text-secondary border border-border",
        variant === "brand" && "bg-brand/10 text-brand border border-brand/20",
        variant === "success" && "bg-success/10 text-success border border-success/20",
        variant === "warning" && "bg-warning/10 text-warning border border-warning/20",
        variant === "danger" && "bg-danger/10 text-danger border border-danger/20",
        variant === "info" && "bg-info/10 text-info border border-info/20",
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge, type BadgeProps }
