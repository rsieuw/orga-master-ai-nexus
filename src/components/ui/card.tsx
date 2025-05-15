import * as React from "react"

import { cn } from "@/lib/utils.ts"

/**
 * A container component that groups related content and actions.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props for the Card component, including standard HTMLDivElement attributes.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to forward to the underlying div element.
 * @returns {JSX.Element} The Card component.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card/80 backdrop-blur-md border-white/5 text-card-foreground shadow-sm transition-all",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * Header section for a Card component.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props for the CardHeader component, including standard HTMLDivElement attributes.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to forward to the underlying div element.
 * @returns {JSX.Element} The CardHeader component.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Title element for a CardHeader.
 *
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - Props for the CardTitle component, including standard HTMLHeadingElement attributes.
 * @param {React.Ref<HTMLParagraphElement>} ref - The ref to forward to the underlying h3 element.
 * @returns {JSX.Element} The CardTitle component.
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Description element for a CardHeader.
 *
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - Props for the CardDescription component, including standard HTMLParagraphElement attributes.
 * @param {React.Ref<HTMLParagraphElement>} ref - The ref to forward to the underlying p element.
 * @returns {JSX.Element} The CardDescription component.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Main content area for a Card component.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props for the CardContent component, including standard HTMLDivElement attributes.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to forward to the underlying div element.
 * @returns {JSX.Element} The CardContent component.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * Footer section for a Card component.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props for the CardFooter component, including standard HTMLDivElement attributes.
 * @param {React.Ref<HTMLDivElement>} ref - The ref to forward to the underlying div element.
 * @returns {JSX.Element} The CardFooter component.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
