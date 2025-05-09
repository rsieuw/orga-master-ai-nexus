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
        outline: "text-foreground bg-background/30 backdrop-blur-sm border-border",
        warning:
          "border-transparent bg-yellow-400 text-yellow-900 shadow hover:bg-yellow-400/80 dark:bg-yellow-500/80 dark:text-yellow-50 dark:hover:bg-yellow-500/70",
        success:
          "border-transparent bg-green-500 text-green-50 shadow hover:bg-green-500/80 dark:bg-green-600/80 dark:text-green-50 dark:hover:bg-green-600/70",
        info:
          "border-transparent bg-sky-400 text-sky-50 shadow hover:bg-sky-400/80 dark:bg-sky-500/80 dark:text-sky-50 dark:hover:bg-sky-500/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
) 