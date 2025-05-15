import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils.ts"

/**
 * A progress bar component that visually indicates the completion status of a task or process.
 *
 * This component is built on top of the `@radix-ui/react-progress` primitive.
 * It dynamically changes color from red (0%) to green (100%) based on its value.
 * Supports `React.forwardRef` to forward refs to the underlying Radix Progress primitive.
 *
 * @param {React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>} props - Props for the Progress component,
 *   extending props from the Radix Progress Root primitive. The `value` prop (0-100) is crucial for its appearance.
 * @param {React.Ref<React.ElementRef<typeof ProgressPrimitive.Root>>} ref - The ref to forward to the underlying Radix Progress Root element.
 * @returns {JSX.Element} The Progress component.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Calculate hue: 0 (red) at value 0, 120 (green) at value 100
  const hue = ((value || 0) / 100) * 120;
  const indicatorStyle = {
    backgroundColor: `hsl(${hue}, 90%, 45%)`, // Use HSL for smooth transition
    transform: `translateX(-${100 - (value || 0)}%)`
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary", // Keep the background
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-transform duration-300 ease-in-out"
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  )
});
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
