import { useContext } from "react";
import { ThemeContext, type ThemeContextProps } from "./theme.definition.ts";

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}; 