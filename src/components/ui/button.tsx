import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils.ts"
import { buttonVariants } from "./button.variants.ts"

/**
 * Props for the Button component.
 * Extends standard HTMLButtonElement attributes and variant props for styling.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Whether the button should be rendered as a child component (Slot) or a standard button.
   * Useful for integrating with other libraries or custom components while maintaining button styling and functionality.
   * @default false
   */
  asChild?: boolean
}

/**
 * Renders a button or a slot with button styling and behavior.
 *
 * This component uses `React.forwardRef` to allow parent components to pass a ref to the underlying `button` or `Slot` element.
 * The `asChild` prop allows for polymorfic rendering, meaning the component can render as its child component while retaining its own props and styling.
 *
 * @param {ButtonProps} props - The props for the Button component.
 * @param {React.Ref<HTMLButtonElement>} ref - The ref to forward to the underlying button element.
 * @returns {JSX.Element} The Button component.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
