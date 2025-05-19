import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx"
import { User, Palette, Languages, Settings, Brain } from "lucide-react"
import { cn } from "@/lib/utils.ts"
import { useTranslation } from "react-i18next"

/**
 * @page SettingsPage
 * @description This page provides users with various settings options, organized into tabs.
 * Users can manage their account, appearance preferences, language settings, notification settings, and AI-related configurations.
 */
const SettingsPage = () => {
  const { t } = useTranslation() // Hook for internationalization

  return (
    <Tabs defaultValue="account" className="space-y-6">
      {/* Container for the tab list, centered and with a maximum width */}
      <div className="max-w-3xl mx-auto">
        {/* Tab list with 5 equally sized columns, and a custom class for potential specific styling */}
        <TabsList className="grid w-full grid-cols-5 mb-4 settings-tabs-list">
          {/* Account Tab Trigger */}
          <TabsTrigger
            value="account"
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs md:text-sm", // Base styling for flex layout, text size
              "px-2 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2 md:justify-start" // Padding, and responsive adjustments for medium screens
            )}
          >
            <User className="h-5 w-5" /> {/* Icon for the account tab */}
            <span className="hidden md:inline">{t('settings.tabs.account')}</span> {/* Label, hidden on small screens */}
          </TabsTrigger>
          {/* Appearance Tab Trigger */}
          <TabsTrigger
            value="appearance"
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs md:text-sm",
              "px-2 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2 md:justify-start"
            )}
          >
            <Palette className="h-5 w-5" /> {/* Icon for the appearance tab */}
            <span className="hidden md:inline">{t('settings.tabs.appearance')}</span>
          </TabsTrigger>
          {/* Language Tab Trigger */}
          <TabsTrigger
            value="language"
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs md:text-sm",
              "px-2 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2 md:justify-start"
            )}
          >
            <Languages className="h-5 w-5" /> {/* Icon for the language tab */}
            <span className="hidden md:inline">{t('settings.tabs.language')}</span>
          </TabsTrigger>
          {/* Notifications Tab Trigger */}
          <TabsTrigger
            value="notifications"
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs md:text-sm",
              "px-2 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2 md:justify-start"
            )}
          >
            <Settings className="h-5 w-5" /> {/* Icon for the notifications tab */}
            <span className="hidden md:inline">{t('settings.tabs.notifications')}</span>
          </TabsTrigger>
          {/* AI Tab Trigger */}
          <TabsTrigger
            value="ai"
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs md:text-sm",
              "px-2 py-1.5 md:flex-row md:gap-2 md:px-3 md:py-2 md:justify-start"
            )}
          >
            <Brain className="h-5 w-5" /> {/* Icon for the AI settings tab */}
            <span className="hidden md:inline">{t('settings.tabs.ai')}</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Content for the Appearance Tab */}
      {/* TODO: Implement content for other tabs (account, language, notifications, ai) */}
      <TabsContent value="appearance" className="space-y-4 max-w-3xl mx-auto">
        {/* Placeholder for appearance settings content */}
        {/* Example: <AppearanceSettingsForm /> */}
        <p>Appearance settings will go here.</p>
      </TabsContent>
      <TabsContent value="account" className="space-y-4 max-w-3xl mx-auto">
        <p>Account settings will go here.</p>
      </TabsContent>
      <TabsContent value="language" className="space-y-4 max-w-3xl mx-auto">
        <p>Language settings will go here.</p>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4 max-w-3xl mx-auto">
        <p>Notification settings will go here.</p>
      </TabsContent>
      <TabsContent value="ai" className="space-y-4 max-w-3xl mx-auto">
        <p>AI settings will go here.</p>
      </TabsContent>
    </Tabs>
  )
}

export default SettingsPage 