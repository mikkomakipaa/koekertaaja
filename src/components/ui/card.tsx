import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Card variants using class-variance-authority
 *
 * Provides consistent card styling with padding, border, shadow options
 */
const cardVariants = cva(
  ["rounded-xl", "border", "transition-shadow duration-150"].join(" "),
  {
    variants: {
      variant: {
        standard: [
          "border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800",
        ].join(" "),
        elevated: [
          "border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800",
          "shadow-sm",
        ].join(" "),
        frosted: [
          "border-white/60 dark:border-gray-800",
          "bg-white/80 dark:bg-gray-900/70",
          "backdrop-blur-sm",
          "shadow-sm",
        ].join(" "),
        interactive: [
          "border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800",
          "hover:shadow-md",
          "cursor-pointer",
        ].join(" "),
      },
      padding: {
        none: "p-0",
        compact: "p-4",
        standard: "p-5",
        large: "p-6",
        responsive: "p-5 md:p-6",
      },
    },
    defaultVariants: {
      variant: "standard",
      padding: "standard",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

/**
 * Card component with variant support
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

/**
 * CardHeader - Top section of card (typically title/description)
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * CardTitle - Main title within CardHeader
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      "text-gray-900 dark:text-gray-100",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * CardDescription - Subtitle/description within CardHeader
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600 dark:text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * CardContent - Main content area of card
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * CardFooter - Bottom section of card (typically actions)
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}
