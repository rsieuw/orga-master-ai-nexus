import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils.ts"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

/**
 * A component for rendering accessible labels for form elements.
 *
 * This component is built on top of the `@radix-ui/react-label` primitive,
 * providing accessible and customizable label functionality.
 * It supports `React.forwardRef` to forward refs to the underlying Radix Label primitive.
 * It uses `cva` for base styling, though no specific variants are currently defined beyond the default.
 *
 * @param {React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>} props
 *   Props for the Label component, extending props from the Radix Label Root primitive and cva variants.
 * @param {React.Ref<React.ElementRef<typeof LabelPrimitive.Root>>} ref
 *   The ref to forward to the underlying Radix Label Root element.
 * @returns {JSX.Element} The Label component.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
