import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client.ts";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { UserRole } from '@/types/auth.ts';
import { Theme } from '@/contexts/theme.definition.ts';
import { useToast } from "@/hooks/use-toast.ts";
import { GradientLoader } from '@/components/ui/loader.tsx';
import { useTranslation } from 'react-i18next';

/**
 * Interface for theme settings as they come from the database and are managed in the UI.
 * Defines which themes are available and which is the default for a specific user role.
 * @interface ThemeSetting
 */
interface ThemeSetting {
  /** The user role (e.g., 'admin', 'paid', 'free') to which these settings apply. */
  role: UserRole;
  /** An array of `Theme` keys that are available for this role. */
  available_themes: Theme[];
  /** The default `Theme` key for this role. Must be one of the `available_themes`. */
  default_theme: Theme;
}

/**
 * Default theme settings used as a fallback if settings cannot be loaded from the database
 * or for initial setup.
 */
const DEFAULT_THEME_SETTINGS: ThemeSetting[] = [
  { role: 'admin', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
  { role: 'paid', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
  { role: 'free', available_themes: ['custom-dark'], default_theme: 'custom-dark' }
];

/**
 * `ThemeSettingsTable` component allows administrators to configure theme availability
 * and default themes for different user roles.
 * It fetches current settings from a Supabase Edge Function ('get-theme-settings')
 * and saves changes using another Edge Function ('update-theme-settings').
 * Provides UI with switches for theme availability and a dropdown for default theme selection per role.
 * Handles loading and error states, and displays toast notifications.
 * Responsive design with separate table layouts for desktop and mobile.
 */
export const ThemeSettingsTable: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [themeSettings, setThemeSettings] = useState<ThemeSetting[]>(DEFAULT_THEME_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Array of all possible theme keys available in the application.
   * Used for rendering UI elements for each theme.
   */
  const ALL_THEMES: Theme[] = ['light', 'dark', 'custom-dark'];

  /**
   * useEffect hook to fetch theme settings from the 'get-theme-settings' Supabase Edge Function
   * when the component mounts. It requires a valid user session (access token) for authorization.
   * If fetching fails or no settings are received, it falls back to `DEFAULT_THEME_SETTINGS`.
   * Updates loading states and displays toast notifications for errors.
   */
  useEffect(() => {
    const fetchThemeSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // First, get the session and access token
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        
        if (!accessToken) {
          throw new Error("Unauthorized: No valid session found.");
        }
        
        // Try to use the Edge Function to retrieve theme settings
        const response = await fetch('https://wzoeijpdtpysbkmxbcld.supabase.co/functions/v1/get-theme-settings', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch theme settings from API");
        }
        
        const themeData = await response.json();
        
        if (!Array.isArray(themeData) || themeData.length === 0) {
          throw new Error("No theme settings received from API");
        }
        
        // Sort results by role for consistent order
        const sortedSettings = themeData.sort((a, b) => {
          const order: Record<UserRole, number> = { admin: 1, paid: 2, free: 3 };
          return (order[a.role as UserRole] || 99) - (order[b.role as UserRole] || 99);
        });
        
        setThemeSettings(sortedSettings as ThemeSetting[]);
      } catch (err: unknown) {
        console.error("Error fetching theme settings:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(t("adminThemeSettings.errors.loadError", { message }));
        toast({ 
          variant: "destructive", 
          title: t("adminThemeSettings.toastTitles.loadFailed"), 
          description: message 
        });
        
        // Use default settings as fallback
        setThemeSettings(DEFAULT_THEME_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchThemeSettings();
  }, [toast, t]);

  /**
   * Handles changes to the availability of a specific theme for a user role.
   * Updates the local `themeSettings` state optimistically.
   * Ensures that at least one theme remains available for a role and updates the default theme
   * if the current default is made unavailable.
   * @param {UserRole} role - The user role for which to change theme availability.
   * @param {Theme} theme - The theme whose availability is being toggled.
   * @param {boolean} isAvailable - True if the theme should be made available, false otherwise.
   */
  const handleThemeAvailabilityChange = (role: UserRole, theme: Theme, isAvailable: boolean) => {
    setThemeSettings(currentSettings =>
      currentSettings.map(setting => {
        if (setting.role === role) {
          let updatedThemes = [...setting.available_themes];
          
          if (isAvailable && !updatedThemes.includes(theme)) {
            // Add theme if it should be available
            updatedThemes.push(theme);
          } else if (!isAvailable && updatedThemes.includes(theme)) {
            // Remove theme if it should not be available
            updatedThemes = updatedThemes.filter(t => t !== theme);
            
            // If the default theme is removed, set another theme as default
            if (setting.default_theme === theme && updatedThemes.length > 0) {
              setting.default_theme = updatedThemes[0];
            }
          }
          
          // Ensure at least one theme is always available
          if (updatedThemes.length === 0) {
            updatedThemes = ['custom-dark'];
            toast({
              title: t("adminThemeSettings.toastTitles.themeRequired"),
              description: t("adminThemeSettings.toastMessages.themeRequired")
            });
          }
          
          return { ...setting, available_themes: updatedThemes };
        }
        return setting;
      })
    );
  };

  /**
   * Handles changes to the default theme for a user role.
   * Updates the local `themeSettings` state optimistically.
   * Ensures that the selected default theme is actually available for the role; otherwise, shows an error toast.
   * @param {UserRole} role - The user role for which to change the default theme.
   * @param {Theme} theme - The new default theme to set.
   */
  const handleDefaultThemeChange = (role: UserRole, theme: Theme) => {
    setThemeSettings(currentSettings =>
      currentSettings.map(setting => {
        if (setting.role === role) {
          // Check if the new default theme is available
          if (!setting.available_themes.includes(theme)) {
            toast({
              variant: "destructive",
              title: t("adminThemeSettings.toastTitles.defaultThemeError"),
              description: t("adminThemeSettings.toastMessages.defaultThemeNotAvailable")
            });
            return setting;
          }
          return { ...setting, default_theme: theme };
        }
        return setting;
      })
    );
  };

  /**
   * Saves all current theme settings changes to the database via the 'update-theme-settings' Supabase Edge Function.
   * It validates that each role has at least one available theme and that the default theme is one of the available ones.
   * Requires a valid user session (access token) for authorization.
   * Sets loading state and displays success or error toast notifications.
   */
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Validate each setting
      for (const setting of themeSettings) {
        if (setting.available_themes.length === 0) {
          throw new Error(t("adminThemeSettings.errors.emptyThemeList", { role: setting.role }));
        }
        if (!setting.available_themes.includes(setting.default_theme)) {
          throw new Error(t("adminThemeSettings.errors.defaultNotAvailable", { role: setting.role }));
        }
      }

      // First, get the session and access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Unauthorized: No valid session found.");
      }

      // Send all settings to the Edge Function
      const response = await fetch('https://wzoeijpdtpysbkmxbcld.supabase.co/functions/v1/update-theme-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ settings: themeSettings })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save theme settings');
      }
      
      toast({ 
        title: t("adminThemeSettings.toastTitles.saveSuccess"), 
        description: t("adminThemeSettings.toastMessages.saveSuccess") 
      });
    } catch (err: unknown) {
      console.error("Error saving theme settings:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(t("adminThemeSettings.errors.saveError", { message }));
      toast({ 
        variant: "destructive", 
        title: t("adminThemeSettings.toastTitles.saveFailed"), 
        description: message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render loaders, errors of de tabel
  if (isLoading) {
    return <div className="flex justify-center items-center py-10">
      <GradientLoader />
      <span className="ml-2">{t("adminThemeSettings.loading")}</span>
    </div>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (themeSettings.length === 0) {
    return <p>{t("adminThemeSettings.noSettings")}</p>;
  }

  return (
    <div>
      {/* Desktop Tabel */}
      <Table className="hidden md:table w-full">
        <TableHeader>
          <TableRow>
            <TableHead>{t("adminThemeSettings.tableHeaders.role")}</TableHead>
            {ALL_THEMES.map(theme => (
              <TableHead key={theme} className="text-center">
                {t(`adminThemeSettings.themeNames.${theme.replace('-', '')}`)}
              </TableHead>
            ))}
            <TableHead>{t("adminThemeSettings.tableHeaders.defaultTheme")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {themeSettings.map(setting => (
            <TableRow key={setting.role}>
              <TableCell className="font-medium capitalize">
                {t(`adminPermissionsPage.roles.${setting.role}`)}
              </TableCell>
              {ALL_THEMES.map(theme => (
                <TableCell key={`${setting.role}-${theme}`} className="text-center">
                  <Switch
                    checked={setting.available_themes.includes(theme)}
                    onCheckedChange={(checked: boolean) => 
                      handleThemeAvailabilityChange(setting.role, theme, checked)
                    }
                    id={`${setting.role}-${theme}-switch`}
                    aria-label={t("adminThemeSettings.ariaLabels.themeSwitch", { 
                      themeName: t(`adminThemeSettings.themeNames.${theme.replace('-', '')}`), 
                      roleName: t(`adminPermissionsPage.roles.${setting.role}`) 
                    })}
                  />
                </TableCell>
              ))}
              <TableCell>
                <Select
                  value={setting.default_theme}
                  onValueChange={(value) => handleDefaultThemeChange(setting.role, value as Theme)}
                  disabled={setting.available_themes.length <= 1}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={t("adminThemeSettings.placeholders.selectDefault")} />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.available_themes.map(theme => (
                      <SelectItem key={`${setting.role}-${theme}-option`} value={theme}>
                        {t(`adminThemeSettings.themeNames.${theme.replace('-', '')}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Mobiele Tabel */}
      <Table className="md:hidden w-full">
        <TableHeader>
          <TableRow>
            <TableHead>{t("adminThemeSettings.tableHeaders.theme")}</TableHead>
            {themeSettings.map(setting => (
              <TableHead key={`${setting.role}-header-mobile`} className="text-center capitalize">
                {t(`adminPermissionsPage.roles.${setting.role}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ALL_THEMES.map(theme => (
            <TableRow key={`${theme}-row-mobile`}>
              <TableCell className="font-medium">
                {t(`adminThemeSettings.themeNames.${theme.replace('-', '')}`)}
              </TableCell>
              {themeSettings.map(setting => (
                <TableCell key={`${setting.role}-${theme}-cell-mobile`} className="text-center">
                  <Switch
                    checked={setting.available_themes.includes(theme)}
                    onCheckedChange={(checked: boolean) => 
                      handleThemeAvailabilityChange(setting.role, theme, checked)
                    }
                    id={`${setting.role}-${theme}-switch-mobile`}
                    aria-label={t("adminThemeSettings.ariaLabels.themeSwitch", { 
                      themeName: t(`adminThemeSettings.themeNames.${theme.replace('-', '')}`), 
                      roleName: t(`adminPermissionsPage.roles.${setting.role}`) 
                    })}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-medium">
              {t("adminThemeSettings.tableHeaders.defaultTheme")}
            </TableCell>
            {themeSettings.map(setting => (
              <TableCell key={`${setting.role}-default-cell-mobile`} className="text-center">
                <Select
                  value={setting.default_theme}
                  onValueChange={(value) => handleDefaultThemeChange(setting.role, value as Theme)}
                  disabled={setting.available_themes.length <= 1}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={t("adminThemeSettings.placeholders.selectDefault")} />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.available_themes.map(theme => (
                      <SelectItem key={`${setting.role}-${theme}-option-mobile`} value={theme}>
                        {t(`adminThemeSettings.themeNames.${theme.replace('-', '')}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>

      {/* Opslaan knop onderaan */}
      <div className="flex justify-center mt-6">
        <Button 
          variant="outline"
          onClick={handleSaveChanges} 
          disabled={isLoading} 
          className="w-full h-12"
        >
          {t("adminThemeSettings.buttons.saveChanges")}
        </Button>
      </div>
    </div>
  );
};

/**
 * `AdminThemeSettingsPage` is a simple wrapper component that renders the `ThemeSettingsTable`.
 * This component is typically used as the content for a tab within the main admin dashboard.
 */
const AdminThemeSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{t("adminThemeSettings.pageTitle", "Theme Settings")}</h1>
        <p className="text-muted-foreground mb-4">
          {t("adminThemeSettings.pageDescription", "Manage which themes are available for each user role.")}
        </p>
      </div>
      
      <div className="bg-card rounded-lg shadow p-4 md:p-6">
        <ThemeSettingsTable />
      </div>
    </div>
  );
};

export default AdminThemeSettingsPage; 