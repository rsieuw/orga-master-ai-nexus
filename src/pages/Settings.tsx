import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { useTheme } from "@/contexts/useTheme.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import {
  AiChatMode,
  ResearchModelMode,
  LayoutPreference
} from "@/types/auth.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Settings, User, Palette, Languages, Brain, Search, SlidersHorizontal, Lightbulb, Target, Library, ListOrdered, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Loader } from "@/components/ui/loader.tsx";
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils.ts";

/**
 * Type definition for available research model providers.
 * These typically correspond to different backend services or models
 * that can be used for the 'deep research' functionality.
 */
type ResearchModelProvider = 'perplexity-sonar' | 'gpt4o-mini';

/**
 * Type definition for available chat model providers.
 * These correspond to different backend services or models
 * that can be used for standard chat interactions.
 * Currently, these reuse the same options as ResearchModelProvider.
 */
type ChatModelProvider = 'perplexity-sonar' | 'gpt4o-mini';

/**
 * Configuration options for AI chat interaction modes.
 * Each option defines a value, a translation key for its label and description,
 * and an icon component.
 */
const aiModeOptions: { value: AiChatMode; labelKey: string; descriptionKey: string; icon: React.ElementType }[] = [
  { value: 'default', labelKey: 'aiModes.default.name', descriptionKey: 'aiModes.default.description', icon: SlidersHorizontal },
  { value: 'creative', labelKey: 'aiModes.creative.name', descriptionKey: 'aiModes.creative.description', icon: Lightbulb },
  { value: 'precise', labelKey: 'aiModes.precise.name', descriptionKey: 'aiModes.precise.description', icon: Target },
];

/**
 * Configuration options for AI research model modes.
 * Each option defines a value, a translation key for its label and description,
 * and an icon component. These modes typically define the behavior or
 * style of the research AI (e.g., factual, creative).
 */
const researchModelOptions: { value: ResearchModelMode; labelKey: string; descriptionKey: string; icon: React.ElementType }[] = [
  { value: 'research', labelKey: 'settings.researchModel.research', descriptionKey: 'settings.researchModel.researchDescription', icon: Library },
  { value: 'instruction', labelKey: 'settings.researchModel.instruction', descriptionKey: 'settings.researchModel.instructionDescription', icon: ListOrdered },
  { value: 'creative', labelKey: 'settings.researchModel.creative', descriptionKey: 'settings.researchModel.creativeDescription', icon: Sparkles },
];

/**
 * Configuration for available research model providers.
 * Each provider option includes a value (matching `ResearchModelProvider` type),
 * translation keys for its label and description, and an icon.
 */
const researchModelProviders: { value: ResearchModelProvider; labelKey: string; descriptionKey: string; icon: React.ElementType }[] = [
  { value: 'perplexity-sonar', labelKey: 'settings.researchModel.perplexitySonar', descriptionKey: 'settings.researchModel.perplexitySonarDescription', icon: Search },
  { value: 'gpt4o-mini', labelKey: 'settings.researchModel.gpt4oMini', descriptionKey: 'settings.researchModel.gpt4oMiniDescription', icon: Brain },
];

/**
 * Configuration for available chat model providers.
 * Each provider option includes a value (matching `ChatModelProvider` type),
 * translation keys for its label and description, and an icon.
 * Reuses some labels from research model providers where applicable.
 */
const chatModelProviders: { value: ChatModelProvider; labelKey: string; descriptionKey: string; icon: React.ElementType }[] = [
  { value: 'perplexity-sonar', labelKey: 'settings.researchModel.perplexitySonar', descriptionKey: 'settings.chatModel.perplexitySonarDescription', icon: Search },
  { value: 'gpt4o-mini', labelKey: 'settings.researchModel.gpt4oMini', descriptionKey: 'settings.chatModel.gpt4oMiniDescription', icon: Brain },
];

/**
 * SettingsPage component allows users to configure various aspects of the application.
 * This includes appearance (theme), account details (name, email), language preferences
 * (UI and AI interaction), notification settings, AI model preferences (chat and research),
 * and layout preferences.
 * It uses tabs to organize different sections of settings.
 */
export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const [aiLanguage, setAiLanguage] = useState<string>(user?.language_preference || "nl");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [selectedAiMode, setSelectedAiMode] = useState<AiChatMode>('default');
  const [isSavingAiMode, setIsSavingAiMode] = useState(false);
  const [researchModelPreference, setResearchModelPreference] = useState<ResearchModelMode>('research');
  const [researchModelProvider, setResearchModelProvider] = useState<ResearchModelProvider>('perplexity-sonar');
  const [isSavingResearchModel, setIsSavingResearchModel] = useState(false);
  const [chatModelProvider, setChatModelProvider] = useState<ChatModelProvider>('gpt4o-mini');
  const [isSavingChatModel, setIsSavingChatModel] = useState(false);
  const [layoutPreference, setLayoutPreference] = useState<LayoutPreference>('50-50');

  // State for account form
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [initialLanguageSet, setInitialLanguageSet] = useState(false);
  const [toastLanguage, setToastLanguage] = useState<string | null>(null);

  /**
   * useEffect hook to initialize form state when user data becomes available
   * or when the user object changes. It sets the local state for name, email,
   * language preferences, notification settings, AI mode, research model,
   * research provider, chat provider, and layout preference based on the
   * user's saved profile information or defaults if not set.
   */
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAiLanguage(user.language_preference || "nl");
      setEmailNotifications(user.email_notifications_enabled ?? true);
      setSelectedAiMode(user.ai_mode_preference || 'precise');
      
      // Initialize research model preference - use a default if not set
      const savedModel = user.research_model_preference || 'research';
      // Ensure type compatibility for research model mode
      if (['research', 'instruction', 'creative'].includes(savedModel)) {
        setResearchModelPreference(savedModel as ResearchModelMode);
      } else {
        setResearchModelPreference('research');
      }
      
      // Initialize research model provider - use a default if not set
      const savedProvider = user.research_model_provider || 'perplexity-sonar';
      // Ensure type compatibility for research model provider
      if (['perplexity-sonar', 'gpt4o-mini'].includes(savedProvider)) {
        setResearchModelProvider(savedProvider as ResearchModelProvider);
      } else {
        setResearchModelProvider('perplexity-sonar');
      }
      
      // Initialize chat model provider - use a default if not set
      const savedChatProvider = user.chat_model_provider || 'gpt4o-mini';
      // Ensure type compatibility for chat model provider
      if (['perplexity-sonar', 'gpt4o-mini'].includes(savedChatProvider)) {
        setChatModelProvider(savedChatProvider as ChatModelProvider);
      } else {
        setChatModelProvider('gpt4o-mini');
      }
      
      setLayoutPreference(user.layout_preference || '50-50');
    }
  }, [user]);

  /**
   * useEffect hook to track the initialization state of i18next.
   * Sets `initialLanguageSet` to true once i18n is initialized.
   * This is used to prevent showing a language change toast on initial load. 
   */
  useEffect(() => {
    if (i18n.isInitialized) {
        setInitialLanguageSet(true);
    }
  }, [i18n.isInitialized]);

  /**
   * useEffect hook to display a toast notification after the UI language has been changed.
   * This hook triggers when `i18n.language` or `toastLanguage` changes, ensuring the toast
   * is shown only after the language update is complete and the component has re-rendered.
   * It uses `initialLanguageSet` to avoid showing a toast on the initial page load.
   */
  useEffect(() => {
    if (toastLanguage && toastLanguage === i18n.language && initialLanguageSet) {
      const toastTitle = t('settings.toast.uiLanguageChanged.title');
      let toastDescription: string;

      if (i18n.language === 'nl') {
        toastDescription = "Interfacetaal is ingesteld op Nederlands.";
      } else if (i18n.language === 'en') {
        toastDescription = "Interface language has been set to English.";
      } else {
        // Fallback in case of an unexpected language code, though unlikely with current setup
        toastDescription = t('settings.toast.uiLanguageChanged.description', { language: i18n.language });
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
      });
      setToastLanguage(null); // Reset trigger
    }
  }, [i18n.language, toastLanguage, t, toast, initialLanguageSet]); 

  /**
   * Handles changes to the AI interaction language preference.
   * Updates the local state and calls `updateUser` to persist the change.
   * Shows a toast notification on success or failure.
   * @param {string} value - The new language code (e.g., 'en', 'nl').
   */
  const handleAiLanguageChange = async (value: string) => {
    setAiLanguage(value);
    try {
      await updateUser({ language_preference: value });
      toast({
        title: t('settings.toast.aiLanguageChanged.title'),
        description: value === "nl" 
          ? t('settings.toast.aiLanguageChanged.toDutch') 
          : t('settings.toast.aiLanguageChanged.toEnglish'),
      });
    } catch (error) {
      console.error("Failed to update language preference:", error);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingAiLanguage.title'),
        description: t('settings.toast.errorSavingAiLanguage.description'),
      });
    }
  };

  /**
   * Handles changes to the UI language.
   * Calls `i18n.changeLanguage` to update the application's language.
   * Sets `toastLanguage` to trigger a toast notification upon successful language change.
   * @param {string} newLang - The new language code (e.g., 'en', 'nl').
   */
  const handleUiLanguageChange = async (newLang: string) => {
    if (i18n.language !== newLang) { // Only trigger if language actually changes
      await i18n.changeLanguage(newLang);
      setToastLanguage(newLang); // Set trigger for the useEffect to show the toast
    }
  };

  /**
   * Toggles the email notification preference.
   * Updates the local state optimistically, then calls `updateUser` to persist the change.
   * Reverts to the original value and shows an error toast if the update fails.
   * Shows a success toast on successful update.
   * @param {boolean} checked - The new state of email notifications (true for enabled, false for disabled).
   */
  const handleToggleNotifications = async (checked: boolean) => {
    setIsSavingNotifications(true);
    const originalValue = emailNotifications;
    setEmailNotifications(checked);

    try {
      await updateUser({ email_notifications_enabled: checked });
      toast({
        title: t('settings.toast.notificationsSaved.title'),
        description: checked 
          ? t('settings.toast.notificationsSaved.descriptionEnabled')
          : t('settings.toast.notificationsSaved.descriptionDisabled'),
      });
    } catch (error) {
      setEmailNotifications(originalValue);
      console.error("Failed to update email notification preference:", error);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingNotifications.title'),
        description: t('settings.toast.errorSavingNotifications.description'),
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  /**
   * Handles saving the user's account information (name and email).
   * Calls `updateUser` to persist the changes.
   * Shows a toast notification on success or failure.
   */
  const handleSaveAccount = async () => {
    if (!user) return;
    try {
      // Assuming updateUser takes an object with properties to update
      await updateUser({ name, email }); 
      toast({
        title: t('settings.toast.accountUpdated.title'),
        description: t('settings.toast.accountUpdated.description'),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('settings.toast.errorUpdatingAccount.title'),
        description: t('settings.toast.errorUpdatingAccount.description'),
      });
    }
  };

  /**
   * Handles changes to the AI mode preference.
   * Updates the local state optimistically, then calls `updateUser` to persist the change.
   * Reverts to the original mode and shows an error toast if the update fails.
   * Shows a success toast with the translated mode label on successful update.
   * @param {string} value - The new AI mode value (e.g., 'default', 'creative').
   */
  const handleAiModeChange = async (value: string) => {
    const newMode = value as AiChatMode;
    setIsSavingAiMode(true);
    const originalMode = selectedAiMode;
    setSelectedAiMode(newMode);

    try {
      await updateUser({ ai_mode_preference: newMode });
      const modeLabelKey = aiModeOptions.find(opt => opt.value === newMode)?.labelKey || newMode.toString(); 
      
      toast({
        title: t('settings.toast.aiModeSaved.title'),
        description: t('settings.toast.aiModeSaved.description', { modeLabel: t(modeLabelKey) }) 
      });
    } catch (error) {
      setSelectedAiMode(originalMode);
      console.error("Failed to update AI mode preference:", error);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingAiMode.title'),
        description: t('settings.toast.errorSavingAiMode.description'),
      });
    } finally {
      setIsSavingAiMode(false);
    }
  };

  /**
   * Handles changes to the research model preference.
   * Updates the local state optimistically, then calls `updateUser` to persist the change.
   * Reverts to the original model and shows an error toast if the update fails.
   * Shows a success toast with the translated model label on successful update.
   * @param {ResearchModelMode} value - The new research model mode.
   */
  const handleResearchModelChange = async (value: ResearchModelMode) => {
    // Skip if the value is already set
    if (value === researchModelPreference) return;

    setIsSavingResearchModel(true);
    const originalModel = researchModelPreference;
    setResearchModelPreference(value);

    try {
      await updateUser({ research_model_preference: value });
      let modeLabelKey = 'settings.researchModel.research';
      
      if (value === 'instruction') {
        modeLabelKey = 'settings.researchModel.instruction';
      } else if (value === 'creative') {
        modeLabelKey = 'settings.researchModel.creative';
      }
      
      const modeLabel = t(modeLabelKey);
      toast({
        title: t('settings.toast.researchModelSaved.title'),
        description: t('settings.toast.researchModelSaved.description', { modeLabel }),
      });
    } catch (error) {
      setResearchModelPreference(originalModel);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingResearchModel.title'),
        description: t('settings.toast.errorSavingResearchModel.description')
      });
    } finally {
      setIsSavingResearchModel(false);
    }
  };

  /**
   * Handles changes to the research model provider preference.
   * Updates the local state optimistically, then calls `updateUser` to persist the change.
   * Reverts to the original provider and shows an error toast if the update fails.
   * Shows a success toast with the translated provider label on successful update.
   * @param {ResearchModelProvider} value - The new research model provider.
   */
  const handleResearchModelProviderChange = async (value: ResearchModelProvider) => {
    // Skip if the value is already set
    if (value === researchModelProvider) return;

    setIsSavingResearchModel(true);
    const originalProvider = researchModelProvider;
    setResearchModelProvider(value);

    try {
      await updateUser({ research_model_provider: value });
      let providerLabelKey = 'settings.researchModel.perplexitySonar';
      
      if (value === 'gpt4o-mini') {
        providerLabelKey = 'settings.researchModel.gpt4oMini';
      }
      
      const providerLabel = t(providerLabelKey);
      toast({
        title: t('settings.toast.researchModelProviderSaved.title'),
        description: t('settings.toast.researchModelProviderSaved.description', { provider: providerLabel }),
      });
    } catch (error) {
      // Revert to original value on error
      setResearchModelProvider(originalProvider);
      console.error("Failed to update research model provider:", error);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingResearchModel.title'),
        description: t('settings.toast.errorSavingResearchModel.description'),
      });
    } finally {
      setIsSavingResearchModel(false);
    }
  };

  /**
   * Handles changes to the chat model provider preference.
   * Updates the local state optimistically, then calls `updateUser` to persist the change.
   * Reverts to the original provider and shows an error toast if the update fails.
   * Shows a success toast with the translated provider label on successful update.
   * @param {ChatModelProvider} value - The new chat model provider.
   */
  const handleChatModelProviderChange = async (value: ChatModelProvider) => {
    // Skip if the value is already set
    if (value === chatModelProvider) return;

    setIsSavingChatModel(true);
    const originalProvider = chatModelProvider;
    setChatModelProvider(value);

    try {
      await updateUser({ chat_model_provider: value });
      let providerLabelKey = 'settings.researchModel.perplexitySonar';
      
      if (value === 'gpt4o-mini') {
        providerLabelKey = 'settings.researchModel.gpt4oMini';
      }
      
      const providerLabel = t(providerLabelKey);
      toast({
        title: t('settings.toast.chatModelProviderSaved.title'),
        description: t('settings.toast.chatModelProviderSaved.description', { provider: providerLabel }),
      });
    } catch (error) {
      // Revert to original value on error
      setChatModelProvider(originalProvider);
      console.error("Failed to update chat model provider:", error);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingChatModel.title'),
        description: t('settings.toast.errorSavingChatModel.description'),
      });
    } finally {
      setIsSavingChatModel(false);
    }
  };

  /**
   * Handles changes to the layout preference.
   * Updates the local state and calls `updateUser` to persist the change.
   * Shows a toast notification on success or failure.
   * @param {LayoutPreference} value - The new layout preference (e.g., '50-50', '33-67').
   */
  const handleLayoutPreferenceChange = async (value: LayoutPreference) => {
    const originalLayout = layoutPreference;
    setLayoutPreference(value);
    try {
      await updateUser({ layout_preference: value });
      toast({
        title: t('settings.toast.layoutPreferenceSaved.title'),
        description: t('settings.toast.layoutPreferenceSaved.description')
      });
    } catch (error) {
      setLayoutPreference(originalLayout);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingLayoutPreference.title'),
        description: t('settings.toast.errorSavingLayoutPreference.description')
      });
    }
  };

  /**
   * Handles changes to the application theme.
   * Calls `setTheme` from the `useTheme` hook to update the theme.
   * @param {string} newTheme - The name of the new theme to apply.
   */
  const handleThemeChange = (newTheme: string) => {
    // Cast string value to Theme type
    setTheme(newTheme as "light" | "dark" | "custom-dark");
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="account" className="flex flex-col items-center justify-center gap-1 p-1 md:flex-row md:gap-2 md:p-2 md:justify-start">
              <User className="h-5 w-5" />
              <span className="hidden md:inline text-xs md:text-sm">{t('settings.tabs.account')}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex flex-col items-center justify-center gap-1 p-1 md:flex-row md:gap-2 md:p-2 md:justify-start">
              <Palette className="h-5 w-5" />
              <span className="hidden md:inline text-xs md:text-sm">{t('settings.tabs.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex flex-col items-center justify-center gap-1 p-1 md:flex-row md:gap-2 md:p-2 md:justify-start">
              <Languages className="h-5 w-5" />
              <span className="hidden md:inline text-xs md:text-sm">{t('settings.tabs.language')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col items-center justify-center gap-1 p-1 md:flex-row md:gap-2 md:p-2 md:justify-start">
              <Settings className="h-5 w-5" />
              <span className="hidden md:inline text-xs md:text-sm">{t('settings.tabs.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex flex-col items-center justify-center gap-1 p-1 md:flex-row md:gap-2 md:p-2 md:justify-start">
              <Brain className="h-5 w-5" />
              <span className="hidden md:inline text-xs md:text-sm">{t('settings.tabs.ai')}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="appearance" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>{t('settings.appearance.title')}</CardTitle>
              <CardDescription>{t('settings.appearance.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme" className="text-base">{t('settings.theme.label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.theme.description')}
                  </p>
                </div>
                <div className="relative z-10">
                  <Select
                    value={theme}
                    onValueChange={handleThemeChange}
                  >
                    <SelectTrigger id="theme-select" className="w-40 relative z-10">
                      <SelectValue placeholder={t('settings.theme.label')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableThemes.includes("light") && (
                        <SelectItem value="light">{t('settings.theme.options.light')}</SelectItem>
                      )}
                      {availableThemes.includes("dark") && (
                        <SelectItem value="dark">{t('settings.theme.options.dark')}</SelectItem>
                      )}
                      {availableThemes.includes("custom-dark") && (
                        <SelectItem value="custom-dark">{t('settings.theme.options.customDark')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Desktop Layout Preference Section */}
              <div className="pt-4 border-t border-border/10">
                <Label className="text-base">{t('settings.desktopLayout.label')}</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.desktopLayout.description')}
                </p>
                <div className="flex space-x-4 items-center pt-2">
                  {/* Visual Layout Option: 50-50 */}
                  <div
                    onClick={() => handleLayoutPreferenceChange('50-50')}
                    className={cn(
                      "cursor-pointer p-3 border-2 rounded-lg transition-all relative z-10",
                      layoutPreference === '50-50' ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/70"
                    )}
                  >
                    <div className="flex w-24 h-16 bg-muted rounded overflow-hidden items-center justify-center">
                      <div className="w-1/2 h-full bg-muted-foreground/30"></div>
                      <div className="w-1/2 h-full bg-muted-foreground/50"></div>
                    </div>
                    <p className="text-xs text-center mt-2">{t('settings.desktopLayout.option5050')}</p>
                  </div>

                  {/* Visual Layout Option: 33-67 */}
                  <div
                    onClick={() => handleLayoutPreferenceChange('33-67')}
                    className={cn(
                      "cursor-pointer p-3 border-2 rounded-lg transition-all relative z-10",
                      layoutPreference === '33-67' ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/70"
                    )}
                  >
                    <div className="flex w-24 h-16 bg-muted rounded overflow-hidden items-center justify-center">
                      <div className="w-1/3 h-full bg-muted-foreground/30"></div>
                      <div className="w-2/3 h-full bg-muted-foreground/50"></div>
                    </div>
                    <p className="text-xs text-center mt-2">{t('settings.desktopLayout.option3367')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>{t('settings.account.title')}</CardTitle>
              <CardDescription>{t('settings.account.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.account.nameLabel')}</Label>
                <div className="relative z-10">
                  <Input id="name" placeholder={t('settings.account.namePlaceholder')} className="bg-gray-700 relative z-10" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.account.emailLabel')}</Label>
                <div className="relative z-10">
                  <Input id="email" type="email" placeholder={t('settings.account.emailPlaceholder')} className="bg-gray-700 relative z-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-center pt-4"> 
                <div className="relative z-10 w-full">
                  <Button 
                    variant="outline"
                    className="w-full h-12 relative z-10"
                    onClick={handleSaveAccount}
                  >
                    {t('settings.account.saveButton')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>{t('settings.languageSettings.title')}</CardTitle>
              <CardDescription>{t('settings.languageSettings.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ui-language-select">{t('settings.uiLanguage.label')}</Label>
                <div className="relative z-10">
                  <Select
                    value={i18n.language.split('-')[0]}
                    onValueChange={handleUiLanguageChange}
                  >
                    <SelectTrigger id="ui-language-select" className="relative z-10">
                      <SelectValue placeholder={t('settings.uiLanguage.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">{t('settings.language.dutch')}</SelectItem>
                      <SelectItem value="en">{t('settings.language.english')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.uiLanguage.description')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ai-language-select">{t('settings.aiLanguage.label')}</Label>
                <div className="relative z-10">
                  <Select
                    value={aiLanguage}
                    onValueChange={handleAiLanguageChange}
                  >
                    <SelectTrigger id="ai-language-select" className="relative z-10">
                      <SelectValue placeholder={t('settings.aiLanguage.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">{t('settings.language.dutch')}</SelectItem>
                      <SelectItem value="en">{t('settings.language.english')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.aiLanguage.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>{t('settings.notifications.title')}</CardTitle>
              <CardDescription>{t('settings.notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="text-base">
                    {t('settings.notifications.emailNotificationsLabel')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.notifications.emailNotificationsDescription')}
                  </p>
                </div>
                <div className="relative z-10">
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={handleToggleNotifications}
                    disabled={isSavingNotifications}
                    className="z-10 relative"
                  />
                  {isSavingNotifications && <Loader size="sm" className="ml-2" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>{t('settings.aiSettings.title')}</CardTitle>
              <CardDescription>{t('settings.aiSettings.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat AI Mode Selection */}
              <div className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <h3 className="text-lg font-medium">{t('settings.aiMode.chatAiSettings')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.aiMode.chatAiSettingsDescription')}
                    {user?.role === 'free' && (
                      <span className="text-xs block text-amber-500 mt-1">{t('settings.freeUserPremiumFeature')}</span>
                    )}
                  </p>
                </div>

                {/* Chat Model Provider Selection & AI Interaction Mode */} 
                <div className="pt-4 border-t border-muted">
                    <div className="space-y-1">
                      <Label className="text-md font-semibold">{t('settings.chatModel.label')}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {chatModelProviders.map((provider) => (
                          <div
                            key={provider.value}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all cursor-pointer relative z-10",
                              chatModelProvider === provider.value 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-border/80",
                              (user?.role === 'free' && provider.value !== 'gpt4o-mini') ? "opacity-50 cursor-not-allowed" : ""
                            )}
                            onClick={() => {
                              // Premium restrictions disabled for demo
                              // if (user?.role === 'free' && provider.value !== 'gpt4o-mini') {
                              //   toast({
                              //     title: t('settings.toast.errorSavingChatModel.title'),
                              //     description: t('settings.freeUserPremiumFeature'),
                              //     variant: "destructive",
                              //   });
                              //   return;
                              // }
                              handleChatModelProviderChange(provider.value);
                            }}
                          >
                            <div className="flex items-center mb-1">
                              <provider.icon className="h-5 w-5 mr-2 text-primary" />
                              <h4 className="text-md font-medium">{t(provider.labelKey)}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t(provider.descriptionKey)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Interaction Mode Selection */}
                    <div className="pt-2">
                      <Label className="text-md font-semibold">{t('settings.aiMode.label')}</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                        {aiModeOptions.map((option) => {
                          const isSelected = selectedAiMode === option.value;
                          const disabled = user?.role === 'free' && (option.value === 'creative' || option.value === 'precise');

                          return (
                            <div
                              key={option.value}
                              className={cn(
                                "p-4 rounded-lg border-2 transition-all relative z-10",
                                isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80',
                                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              )}
                              onClick={() => !disabled && handleAiModeChange(option.value)}
                            >
                              <div className="flex items-center mb-1">
                                <option.icon className="h-5 w-5 mr-2 text-primary" />
                                <h4 className="text-md font-medium">{t(option.labelKey)}</h4>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{t(option.descriptionKey)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                </div>
                {(isSavingAiMode || isSavingChatModel) && <div className="flex justify-center"><Loader size="md" /></div>}
              </div>
              
              {/* Research Model Section */}
              <div className="space-y-3 pt-4 border-t border-border/10">
                <div className="flex flex-col space-y-1">
                    <h3 className="text-lg font-medium">{t('settings.researchModel.label')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.researchModel.description')}
                      {user?.role === 'free' && (
                        <span className="text-xs block text-amber-500 mt-1">{t('settings.researchModel.freeUserLimitation')}</span>
                      )}
                    </p>
                </div>

                {/* Research Model Provider Selection & Research Modes */} 
                <div className="pt-4 border-t border-muted">
                    <div className="space-y-1">
                        <Label className="text-md font-semibold">{t('settings.researchModel.placeholder')}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {researchModelProviders.map((provider) => (
                          <div
                            key={provider.value}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all cursor-pointer relative z-10",
                              researchModelProvider === provider.value 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-border/80",
                              (user?.role === 'free' && provider.value !== 'gpt4o-mini') ? "opacity-50 cursor-not-allowed" : ""
                            )}
                            onClick={() => {
                              // Premium restrictions disabled for demo
                              // if (user?.role === 'free' && provider.value !== 'gpt4o-mini') {
                              //   toast({
                              //     title: t('settings.toast.errorSavingResearchModel.title'),
                              //     description: t('settings.freeUserPremiumFeature'),
                              //     variant: "destructive",
                              //   });
                              //   return;
                              // }
                              handleResearchModelProviderChange(provider.value);
                            }}
                          >
                            <div className="flex items-center mb-1">
                              <provider.icon className="h-5 w-5 mr-2 text-primary" />
                              <h4 className="text-md font-medium">{t(provider.labelKey)}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t(provider.descriptionKey)}
                            </p>
                          </div>
                        ))}
                        </div>
                    </div>

                    <div className="pt-2">
                        <Label className="text-md font-semibold">{t('settings.researchModel.research')}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                        {researchModelOptions.map((option) => (
                          <div
                            key={option.value}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all cursor-pointer relative z-10",
                              researchModelPreference === option.value 
                                ? "border-primary bg-primary/10" 
                                : "border-border hover:border-border/80"
                            )}
                            onClick={() => handleResearchModelChange(option.value)}
                          >
                            <div className="flex items-center mb-1">
                              <option.icon className="h-5 w-5 mr-2 text-primary" />
                              <h4 className="text-md font-medium">{t(option.labelKey)}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t(option.descriptionKey)}
                            </p>
                          </div>
                        ))}
                        </div>
                    </div>
                </div>
                {isSavingResearchModel && <div className="flex justify-center"><Loader size="sm" className="mt-2" /></div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
