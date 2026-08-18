import { Slot } from "@radix-ui/react-slot"
import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/cn"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" &&
            "bg-brand text-white hover:bg-brand-hover hover:shadow-[0_15px_40px_rgba(94,162,255,.18)]",
          variant === "secondary" &&
            "border border-border bg-transparent text-text-primary hover:bg-brand/8 hover:border-brand/30",
          variant === "ghost" &&
            "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5",
          variant === "danger" &&
            "bg-danger/10 text-danger hover:bg-danger/20",
          size === "sm" && "h-8 rounded-[10px] px-3 text-xs",
          size === "md" && "h-10 rounded-[12px] px-5 text-sm",
          size === "lg" && "h-12 rounded-[16px] px-7 text-base",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, type ButtonProps }
