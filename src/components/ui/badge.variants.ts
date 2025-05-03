import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/80 backdrop-blur-sm text-primary-foreground shadow hover:bg-primary/70",
        secondary:
          "border-transparent bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary/70",
        destructive:
          "border-transparent bg-destructive/80 backdrop-blur-sm text-destructive-foreground shadow hover:bg-destructive/70",
        outline: "text-foreground bg-background/30 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
) 