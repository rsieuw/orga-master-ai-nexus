import { cn } from "@/lib/utils.ts";

/**
 * Defines the possible sizes for the loader.
 */
export type LoaderSize = "sm" | "md" | "lg";

/**
 * Props for the Loader and GradientLoader components.
 */
export interface LoaderProps {
  /** The size of the loader. Defaults to "md". */
  size?: LoaderSize;
  /** Optional additional CSS classes to apply to the loader container. */
  className?: string;
}

/**
 * A simple spinning loader component.
 *
 * @param {LoaderProps} props - The props for the Loader component.
 * @returns {JSX.Element} The Loader component.
 */
export function Loader({ size = "md", className }: LoaderProps) {
  const sizeClasses: Record<LoaderSize, string> = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("animate-spin", sizeClasses[size])}>
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  );
}

/**
 * A spinning loader component with a gradient effect.
 *
 * @param {LoaderProps} props - The props for the GradientLoader component.
 * @returns {JSX.Element} The GradientLoader component.
 */
export function GradientLoader({ size = "md", className }: LoaderProps) {
  const sizeClasses: Record<LoaderSize, string> = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("animate-spin relative", sizeClasses[size])}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-700 to-purple-800 blur opacity-75"></div>
        <div className="relative rounded-full h-full w-full border-2 border-transparent border-t-white"></div>
      </div>
    </div>
  );
}
