import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils.ts"
import { badgeVariants } from "./badge.variants.ts"

/**
 * Props for the Badge component.
 * Extends standard HTMLDivElement attributes and variant props for styling.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Renders a badge component with various visual styles.
 *
 * @param {BadgeProps} props - The props for the Badge component.
 * @param {string} [props.className] - Additional CSS classes to apply to the badge.
 * @param {string} [props.variant] - The visual style variant of the badge.
 * @returns {JSX.Element} The Badge component.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
