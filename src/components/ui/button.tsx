import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { colors, spacing } from "@/lib/design-tokens"

/**
 * Button variants using class-variance-authority
 *
 * Combines mode-specific colors (quiz/study/review) with style variants
 * (primary/secondary/ghost/destructive)
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap",
    "rounded-lg",
    "text-sm font-semibold",
    "transition-all duration-150",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-offset-2",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
    "active:scale-95",
  ].join(" "),
  {
    variants: {
      mode: {
        quiz: "",
        study: "",
        review: "",
        neutral: "",
      },
      variant: {
        primary: ["text-white", "shadow-md hover:shadow-lg active:shadow-sm"].join(
          " "
        ),
        secondary: [
          "border bg-white dark:bg-gray-800",
          "border-gray-300 dark:border-gray-700",
          "text-gray-700 dark:text-gray-300",
          "hover:bg-gray-50 dark:hover:bg-gray-700",
          "hover:border-gray-400 dark:hover:border-gray-600",
        ].join(" "),
        ghost: [
          "text-gray-600 dark:text-gray-400",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "hover:text-gray-900 dark:hover:text-gray-100",
        ].join(" "),
        destructive: ["bg-red-600 hover:bg-red-700", "text-white"].join(" "),
        outline: [
          "border border-gray-300 dark:border-gray-700",
          "bg-white dark:bg-gray-800",
          "hover:bg-gray-50 dark:hover:bg-gray-700",
        ].join(" "),
        default: ["text-white", "shadow-md hover:shadow-lg active:shadow-sm"].join(
          " "
        ),
        link: "text-indigo-600 dark:text-indigo-400 hover:underline",
      },
      size: {
        default: `${spacing.touchTarget} px-4 py-3`,
        sm: "min-h-9 px-3 py-2 text-xs",
        lg: `${spacing.touchTargetLarge} px-6 py-4 text-base`,
        icon: "h-10 w-10 p-0",
      },
    },
    compoundVariants: [
      {
        mode: "quiz",
        variant: "primary",
        class: [
          colors.quiz.primary,
          colors.quiz.hover,
          colors.quiz.ring,
        ].join(" "),
      },
      {
        mode: "study",
        variant: "primary",
        class: [
          colors.study.primary,
          colors.study.hover,
          colors.study.ring,
        ].join(" "),
      },
      {
        mode: "review",
        variant: "primary",
        class: [
          colors.review.primary,
          colors.review.hover,
          colors.review.ring,
        ].join(" "),
      },
      {
        mode: "neutral",
        variant: "primary",
        class: [
          "bg-gradient-to-r from-indigo-600 to-indigo-500",
          "hover:from-indigo-700 hover:to-indigo-600",
          "focus-visible:ring-indigo-500",
        ].join(" "),
      },
      {
        mode: "quiz",
        variant: "default",
        class: [
          colors.quiz.primary,
          colors.quiz.hover,
          colors.quiz.ring,
        ].join(" "),
      },
      {
        mode: "study",
        variant: "default",
        class: [
          colors.study.primary,
          colors.study.hover,
          colors.study.ring,
        ].join(" "),
      },
      {
        mode: "review",
        variant: "default",
        class: [
          colors.review.primary,
          colors.review.hover,
          colors.review.ring,
        ].join(" "),
      },
      {
        mode: "neutral",
        variant: "default",
        class: [
          "bg-gradient-to-r from-indigo-600 to-indigo-500",
          "hover:from-indigo-700 hover:to-indigo-600",
          "focus-visible:ring-indigo-500",
        ].join(" "),
      },
    ],
    defaultVariants: {
      mode: "quiz",
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Button component with mode-aware styling
 *
 * @example
 * // Quiz mode primary button
 * <Button mode="quiz">Submit Answer</Button>
 *
 * @example
 * // Study mode secondary button
 * <Button mode="study" variant="secondary">Cancel</Button>
 *
 * @example
 * // Large review button
 * <Button mode="review" size="lg">Review Mistakes</Button>
 *
 * @example
 * // Destructive action
 * <Button variant="destructive">Delete</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, mode, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ mode, variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
