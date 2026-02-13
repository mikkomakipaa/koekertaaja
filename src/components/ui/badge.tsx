import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Badge variants using class-variance-authority
 *
 * Provides consistent badge/chip styling for labels, status indicators, counts
 */
const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-0.5",
    "rounded-full",
    "font-semibold",
    "transition-colors duration-150",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gray-100 dark:bg-gray-800",
          "text-gray-700 dark:text-gray-300",
        ].join(" "),
        outline: [
          "border",
          "border-gray-200 dark:border-gray-700",
          "text-gray-600 dark:text-gray-400",
        ].join(" "),
        solid: "text-white",
        gradient: ["bg-gradient-to-r", "text-white", "shadow-sm"].join(" "),
        count: [
          "min-w-[28px]",
          "bg-slate-100 dark:bg-slate-800",
          "text-slate-600 dark:text-slate-200",
        ].join(" "),
      },
      semantic: {
        none: "",
        success: [
          "bg-green-50 dark:bg-green-900/30",
          "text-green-700 dark:text-green-200",
        ].join(" "),
        warning: [
          "bg-amber-100 dark:bg-amber-900/40",
          "text-amber-700 dark:text-amber-200",
        ].join(" "),
        error: [
          "bg-red-50 dark:bg-red-900/30",
          "text-red-700 dark:text-red-200",
        ].join(" "),
        info: [
          "bg-indigo-50 dark:bg-indigo-900/30",
          "text-indigo-700 dark:text-indigo-200",
        ].join(" "),
        new: [
          "border border-rose-200 dark:border-rose-700/70",
          "bg-rose-50 dark:bg-rose-900/25",
          "text-rose-700 dark:text-rose-300",
        ].join(" "),
        grade: "ring-1 ring-inset ring-current/20",
      },
      size: {
        xs: "px-2 py-0.5 text-[10px]",
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        semantic: "success",
        class: "bg-green-600",
      },
      {
        variant: "solid",
        semantic: "warning",
        class: "bg-amber-600",
      },
      {
        variant: "solid",
        semantic: "error",
        class: "bg-red-600",
      },
      {
        variant: "solid",
        semantic: "info",
        class: "bg-indigo-600",
      },
    ],
    defaultVariants: {
      variant: "default",
      semantic: "none",
      size: "sm",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge component with variant support
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, semantic, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, semantic, size }), className)}
      {...props}
    />
  )
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
