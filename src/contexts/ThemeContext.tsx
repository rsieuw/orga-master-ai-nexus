import { useEffect, useState } from "react";
import { type Theme, ThemeContext } from "./theme.definition.ts";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from local storage or default to dark
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Default to custom-dark theme
    return "custom-dark";
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem("theme", theme);
    
    // Update document class for tailwind dark mode
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("dark", "light", "custom-dark");
    
    // Add the correct theme class
    root.classList.add(theme);
    
    // For custom-dark, we also want to keep Tailwind's dark mode
    if (theme === "custom-dark") {
      root.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme: Theme) => {
      // Toggle between the three available themes
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "custom-dark";
      return "light";
    });
  };

  // Function to explicitly set a theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
