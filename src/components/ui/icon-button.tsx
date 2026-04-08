import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  [
    "inline-grid shrink-0 place-items-center",
    "rounded-[14px]",
    "border border-black/[0.08]",
    "bg-black/[0.02]",
    "text-gray-600",
    "transition-all",
    "hover:bg-black/[0.04] hover:text-gray-900",
    "active:scale-[0.98]",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-indigo-500",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-white",
    "dark:border-gray-700 dark:bg-gray-900",
    "dark:text-gray-300 dark:hover:bg-gray-800",
    "dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      size: {
        default: "h-11 w-11",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(iconButtonVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)

IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
