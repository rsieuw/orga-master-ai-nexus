import { createContext } from "react";

/** 
 * Defines the available theme names.
 * - `dark`: Standard dark theme.
 * - `light`: Standard light theme.
 * - `custom-dark`: Custom dark theme specific to the application.
 */
export type Theme = "dark" | "light" | "custom-dark";

/**
 * Defines the shape of the Theme context.
 *
 * @interface ThemeContextProps
 */
export interface ThemeContextProps {
  /** The currently active theme. */
  theme: Theme;
  /** Function to toggle to the next available theme. */
  toggleTheme: () => void;
  /** 
   * Function to set a specific theme.
   * @param {Theme} theme - The theme to set.
   */
  setTheme: (theme: Theme) => void;
  /** Array of themes available to the current user. */
  availableThemes: Theme[];
}

/**
 * React context for managing theme state and actions.
 * Provides the current theme, functions to change the theme, and a list of available themes.
 */
export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined); 