import { useEffect, useState, useCallback } from "react";
import { type Theme, ThemeContext } from "./theme.definition.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { supabase } from "@/integrations/supabase/client.ts";

// Interface voor thema instellingen zoals ze uit de DB komen
interface ThemeSetting {
  role: string;
  available_themes: Theme[];
  default_theme: Theme;
}

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
        // Haal sessie op van de gebruiker
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        
        // API URL van de Supabase edge function
        const url = 'https://wzoeijpdtpysbkmxbcld.supabase.co/functions/v1/get-theme-settings';
        
        // Gebruik de anonieme key uit de client.ts file
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b2VpanBkdHB5c2JrbXhiY2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNTg0NzcsImV4cCI6MjA2MTYzNDQ3N30.BuqUr8eTib3tC42OEkH4K7gYhWIATvuLwdGak5MZEC4";
        
        // Maak de request met de juiste authorization header
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
        
        // Valideer de data voor we het gebruiken
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
        
        // Als de settings leeg zijn, gebruik standaard waarden
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

  // Lijst met beschikbare thema's per rol
  const getAvailableThemesForUser = (): Theme[] => {
    if (!user) return ['custom-dark']; // Default thema voor niet-ingelogde gebruikers
    
    // Als we thema-instellingen hebben voor deze rol, gebruik die
    if (user.role && themeSettings[user.role]) {
      return themeSettings[user.role].available_themes;
    }
    
    // Fallback naar standaard thema's per rol (als DB fetch mislukt is)
    const defaultThemes: Record<string, Theme[]> = {
      admin: ["light", "dark", "custom-dark"], // Admins hebben toegang tot alle thema's
      paid: ["light", "dark", "custom-dark"],  // Betaalde gebruikers hebben toegang tot alle thema's
      free: ["custom-dark"]                   // Gratis gebruikers hebben alleen toegang tot custom-dark
    };
    
    return defaultThemes[user.role] || ["custom-dark"];
  };

  // Krijg het standaard thema voor een rol
  const getDefaultThemeForRole = useCallback((role: string): Theme => {
    if (themeSettings[role]) {
      return themeSettings[role].default_theme;
    }
    return "custom-dark"; // Standaard fallback
  }, [themeSettings]);

  useEffect(() => {
    // Wanneer de gebruiker aanmeldt/verandert, controleer of hun huidige thema beschikbaar is
    // en update indien nodig naar een beschikbaar thema
    if (user) {
      const userThemes = getAvailableThemesForUser();
      if (!userThemes.includes(theme)) {
        // Als het huidige thema niet beschikbaar is, stel het standaard thema in
        setThemeState(getDefaultThemeForRole(user.role));
      }
    }
  }, [user, themeSettings, theme, getDefaultThemeForRole]); // Reageert op veranderingen in user, themeSettings of thema

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
      // Zoek de beschikbare thema's voor de gebruiker
      const userThemes = getAvailableThemesForUser();
      
      // Als de gebruiker maar één thema heeft, blijft dat actief
      if (userThemes.length <= 1) return userThemes[0] || "custom-dark";
      
      // Anders, vind het huidige thema en ga naar het volgende
      const currentIndex = userThemes.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % userThemes.length;
      return userThemes[nextIndex];
    });
  };

  // Function to explicitly set a theme
  const setTheme = (newTheme: Theme) => {
    // Controleer of het nieuwe thema beschikbaar is voor de gebruiker
    const userThemes = getAvailableThemesForUser();
    
    if (userThemes.includes(newTheme) || 
        // Admin kan elk thema instellen
        (user && user.role === 'admin')) {
      setThemeState(newTheme);
    } else {
      // Als het thema niet beschikbaar is, stel dan het standaard thema in
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
