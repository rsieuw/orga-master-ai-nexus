import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils.ts"

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
