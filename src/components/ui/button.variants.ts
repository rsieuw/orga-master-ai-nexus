import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary/90 backdrop-blur-sm text-primary-foreground shadow hover:bg-primary",
        destructive:
          "bg-destructive/90 backdrop-blur-sm text-destructive-foreground shadow-sm hover:bg-destructive",
        outline:
          "border border-white/10 bg-background/60 backdrop-blur-sm shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary/80 backdrop-blur-sm text-secondary-foreground shadow-sm hover:bg-secondary",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        shine: "text-primary-foreground animate-shine border border-transparent bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:400%_100%] transition-colors",
        gradient: "bg-gradient-to-r from-blue-700 to-purple-800 backdrop-blur-sm text-primary-foreground shadow hover:from-blue-800 hover:to-purple-900",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
) 