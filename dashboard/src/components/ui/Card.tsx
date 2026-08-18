import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/cn"

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[20px] border border-border bg-surface transition-all duration-200",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHover = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[20px] border border-border bg-surface transition-all duration-200 hover:border-brand/40 hover:shadow-[0_15px_40px_rgba(94,162,255,.12)]",
        className
      )}
      {...props}
    />
  )
)
CardHover.displayName = "CardHover"

export { Card, CardHover }
