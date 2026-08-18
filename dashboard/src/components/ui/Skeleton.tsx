import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/cn"

const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-shimmer rounded-[12px]", className)}
      {...props}
    />
  )
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
