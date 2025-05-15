import { useEffect, useState, useCallback } from "react";
import { type Theme, ThemeContext } from "./theme.definition.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { supabase } from "@/integrations/supabase/client.ts";

/**
 * Interface for theme settings as they come from the database.
 *
 * @interface ThemeSetting
 */
interface ThemeSetting {
  /** The role to which these theme settings apply. */
  role: string;
  /** List of available themes for this role. */
  available_themes: Theme[];
  /** The default theme for this role. */
  default_theme: Theme;
}

/**
 * Provides theme management functionality to its children components.
 *
 * Fetches theme settings based on user roles, allows users to toggle themes,
 * and persists the selected theme in local storage and applies it to the document root.
 *
 * @param {{ children: React.ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The ThemeProvider component.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [themeSettings, setThemeSettings] = useState<Record<string, ThemeSetting>>({});
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from local storage or default to custom-dark
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    return savedTheme || "custom-dark";
  });

  // Fetch theme settings
  useEffect(() => {
    const fetchThemeSettings = async () => {
      try {
        // Get user session
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        
        // API URL of the Supabase edge function
        const url = 'https://wzoeijpdtpysbkmxbcld.supabase.co/functions/v1/get-theme-settings';
        
        // Use the anonymous key from the client.ts file
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b2VpanBkdHB5c2JrbXhiY2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNTg0NzcsImV4cCI6MjA2MTYzNDQ3N30.BuqUr8eTib3tC42OEkH4K7gYhWIATvuLwdGak5MZEC4";
        
        // Create the request with the correct authorization header
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`
        };
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          throw new Error("Failed to fetch theme settings from API");
        }
        
        const data = await response.json();
        
        // Create a lookup object for quick access by role
        const settings: Record<string, ThemeSetting> = {};
        
        // Validate the data before using it
        if (Array.isArray(data)) {
          data.forEach((item: {
            role?: string;
            available_themes?: string[];
            default_theme?: string;
          }) => {
            if (item && typeof item.role === 'string') {
              settings[item.role] = {
                role: item.role,
                available_themes: (item.available_themes || ['custom-dark']) as Theme[],
                default_theme: (item.default_theme || 'custom-dark') as Theme
              };
            }
          });
        }
        
        // If settings are empty, use default values
        if (Object.keys(settings).length === 0) {
          throw new Error("No valid theme settings found");
        }
        
        setThemeSettings(settings);
      } catch (err) {
        console.error("Error fetching theme settings:", err);
        // Fallback to default settings if fetch fails
        setThemeSettings({
          admin: { role: 'admin', available_themes: ['light', 'dark', 'custom-dark'] as Theme[], default_theme: 'custom-dark' as Theme },
          paid: { role: 'paid', available_themes: ['light', 'dark', 'custom-dark'] as Theme[], default_theme: 'custom-dark' as Theme },
          free: { role: 'free', available_themes: ['custom-dark'] as Theme[], default_theme: 'custom-dark' as Theme }
        });
      }
    };

    fetchThemeSettings();
  }, []);

  /**
   * Gets the list of available themes for the current user based on their role.
   * Falls back to default themes if settings are not fetched or user is not logged in.
   * @returns {Theme[]} An array of available themes.
   */
  const getAvailableThemesForUser = useCallback((): Theme[] => {
    if (!user) return ['custom-dark']; // Default theme for non-logged-in users
    
    // If we have theme settings for this role, use them
    if (user.role && themeSettings[user.role]) {
      return themeSettings[user.role].available_themes;
    }
    
    // Fallback to default themes per role (if DB fetch failed)
    const defaultThemes: Record<string, Theme[]> = {
      admin: ["light", "dark", "custom-dark"], // Admins have access to all themes
      paid: ["light", "dark", "custom-dark"],  // Paid users have access to all themes
      free: ["custom-dark"]                   // Free users only have access to custom-dark
    };
    
    return defaultThemes[user.role] || ["custom-dark"];
  }, [user, themeSettings]);

  /**
   * Gets the default theme for a given user role.
   * Uses fetched theme settings or falls back to a default.
   * @param {string} role - The user role.
   * @returns {Theme} The default theme for the role.
   */
  const getDefaultThemeForRole = useCallback((role: string): Theme => {
    if (themeSettings[role]) {
      return themeSettings[role].default_theme;
    }
    return "custom-dark"; // Default fallback
  }, [themeSettings]);

  useEffect(() => {
    // When the user logs in/changes, check if their current theme is available
    // and update to an available theme if necessary
    if (user) {
      const userThemes = getAvailableThemesForUser();
      if (!userThemes.includes(theme)) {
        // If the current theme is not available, set the default theme
        setThemeState(getDefaultThemeForRole(user.role));
      }
    }
  }, [user, themeSettings, theme, getDefaultThemeForRole, getAvailableThemesForUser]); // Reacts to changes in user, themeSettings, or theme

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

  /**
   * Toggles to the next available theme for the current user.
   * If the user has only one theme, it remains active.
   */
  const toggleTheme = () => {
    setThemeState((prevTheme: Theme) => {
      // Get available themes for the user
      const userThemes = getAvailableThemesForUser();
      
      // If the user has only one theme, it remains active
      if (userThemes.length <= 1) return userThemes[0] || "custom-dark";
      
      // Otherwise, find the current theme and go to the next one
      const currentIndex = userThemes.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % userThemes.length;
      return userThemes[nextIndex];
    });
  };

  /**
   * Sets a new theme if it is available for the current user or if the user is an admin.
   * If the theme is not available, it sets the default theme for the user's role.
   * @param {Theme} newTheme - The theme to set.
   */
  const setTheme = (newTheme: Theme) => {
    // Check if the new theme is available for the user
    const userThemes = getAvailableThemesForUser();
    
    if (userThemes.includes(newTheme) || 
        // Admin can set any theme
        (user && user.role === 'admin')) {
      setThemeState(newTheme);
    } else {
      // If the theme is not available, set the default theme
      if (user && themeSettings[user.role]) {
        setThemeState(themeSettings[user.role].default_theme);
      } else {
        setThemeState("custom-dark");
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      setTheme,
      availableThemes: getAvailableThemesForUser() 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
