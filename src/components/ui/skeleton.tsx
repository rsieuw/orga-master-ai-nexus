import * as React from "react"

import { cn } from "@/lib/utils.ts"

/**
 * A placeholder component used to indicate a loading state.
 *
 * It renders a simple div with a pulse animation and muted background,
 * commonly used to show where content will appear once loaded.
 *
 * @param {React.HTMLAttributes<HTMLDivElement>} props - Props for the Skeleton component,
 *   extending standard HTMLDivElement attributes. `className` can be used to customize its dimensions and shape.
 * @returns {JSX.Element} The Skeleton component.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
