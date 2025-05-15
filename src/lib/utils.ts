import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes intelligently.
 * Uses clsx to conditionally join class names and twMerge to resolve Tailwind CSS conflicts.
 *
 * @param {...ClassValue} inputs - A list of class values to combine. 
 *   Can include strings, arrays, or objects with boolean keys.
 * @returns {string} A string of combined and merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
