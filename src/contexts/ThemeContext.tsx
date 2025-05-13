import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "custom-dark";

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from local storage or default to dark
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Default to dark theme instead of checking system preference
    return "dark";
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem("theme", theme);
    
    // Update document class for tailwind dark mode
    const root = document.documentElement;
    
    // Verwijder alle thema-klassen
    root.classList.remove("dark", "light", "custom-dark");
    
    // Voeg de juiste thema-klasse toe
    root.classList.add(theme);
    
    // Voor custom-dark willen we ook de dark mode van Tailwind behouden
    if (theme === "custom-dark") {
      root.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      // Wissel tussen de drie beschikbare thema's
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "custom-dark";
      return "light";
    });
  };

  // Functie om expliciet een thema in te stellen
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
