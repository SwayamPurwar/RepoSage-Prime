import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-[#00e5a0] text-black hover:bg-[#00ffb3]",
      ghost: "bg-transparent text-[#6b7a8d] hover:text-white",
      outline: "border border-[rgba(255,255,255,0.07)] text-[#6b7a8d] hover:text-white hover:border-white",
      secondary: "bg-[#0f1520] text-[#e8edf3] hover:bg-[#1a2333]",
    }
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-8",
      icon: "h-9 w-9",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-mono text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
