import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { useTheme } from "@/contexts/ThemeContext.tsx";
import { useAuth, AiMode } from "@/contexts/AuthContext.tsx";
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
import { Textarea } from "@/components/ui/textarea.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Settings, User, Palette, Languages, Brain } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer.tsx";
import { Loader } from "@/components/ui/loader.tsx";
import { useTranslation } from 'react-i18next';
import type { LayoutPreference } from "@/contexts/AuthContext.tsx";
import { cn } from "@/lib/utils.ts";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";

// Define possible research models - use consistent identifiers with backend
type ResearchModel = 'perplexity-sonar' | 'gpt-4o-mini';

// Use labelKey for i18n
const aiModeOptions: { value: AiMode; labelKey: string }[] = [
  { value: 'gpt4o', labelKey: 'settings.aiMode.options.gpt4oBalanced' },
  { value: 'creative', labelKey: 'settings.aiMode.options.creativeMode' },
  { value: 'precise', labelKey: 'settings.aiMode.options.preciseMode' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [aiLanguage, setAiLanguage] = useState<string>(user?.language_preference || "nl");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [selectedAiMode, setSelectedAiMode] = useState<AiMode>('precise');
  const [isSavingAiMode, setIsSavingAiMode] = useState(false);
  const [researchModelPreference, setResearchModelPreference] = useState<ResearchModel>('perplexity-sonar');
  const [isSavingResearchModel, setIsSavingResearchModel] = useState(false);
  const { toast } = useToast();
  const [layoutPreference, setLayoutPreference] = useState<LayoutPreference>('50-50');

  // State for account form
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [initialLanguageSet, setInitialLanguageSet] = useState(false);
  const [toastLanguage, setToastLanguage] = useState<string | null>(null);

  // Initialize form state when user data is available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAiLanguage(user.language_preference || "nl");
      setEmailNotifications(user.email_notifications_enabled ?? true);
      setSelectedAiMode(user.ai_mode_preference || 'precise');
      // Initialize research model preference - use a default if not set
      setResearchModelPreference(user.research_model_preference || 'perplexity-sonar');
      setLayoutPreference(user.layout_preference || '50-50'); // Initialize layout preference
    }
  }, [user]);

  useEffect(() => {
    if (i18n.isInitialized) {
        setInitialLanguageSet(true);
    }
  }, [i18n.isInitialized]);

  // New useEffect to show toast AFTER language change is fully processed and component re-rendered
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

  const handleUiLanguageChange = async (newLang: string) => {
    if (i18n.language !== newLang) { // Only trigger if language actually changes
      await i18n.changeLanguage(newLang);
      setToastLanguage(newLang); // Set trigger for the useEffect to show the toast
    }
  };

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

  const handleAiModeChange = async (value: string) => {
    const newMode = value as AiMode;
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

  // Handle research model change
  const handleResearchModelChange = async (value: ResearchModel) => {
    if (user?.research_model_preference === value && researchModelPreference === value) return;

    setIsSavingResearchModel(true);
    const originalModel = researchModelPreference;
    setResearchModelPreference(value);

    try {
      await updateUser({ research_model_preference: value });
      const modeLabelKey = value === 'perplexity-sonar'
        ? 'settings.researchModel.perplexitySonar'
        : 'settings.researchModel.gpt4oMini';
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

  // Handle layout preference change
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

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('settings.tabs.account')}
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.tabs.appearance')}
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t('settings.tabs.language')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('settings.tabs.notifications')}
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('settings.tabs.ai')}
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
                <Switch
                  id="theme"
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  aria-label={t('settings.theme.toggleAriaLabel')}
                />
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
                      "cursor-pointer p-3 border-2 rounded-lg transition-all",
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
                      "cursor-pointer p-3 border-2 rounded-lg transition-all",
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
                <Input id="name" placeholder={t('settings.account.namePlaceholder')} className="bg-gray-700" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.account.emailLabel')}</Label>
                <Input id="email" type="email" placeholder={t('settings.account.emailPlaceholder')} className="bg-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex justify-center pt-4"> 
                <Button 
                  variant="outline"
                  className="w-full h-12"
                  onClick={handleSaveAccount}
                >
                  {t('settings.account.saveButton')}
                </Button>
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
                <Select
                  value={i18n.language.split('-')[0]}
                  onValueChange={handleUiLanguageChange}
                >
                  <SelectTrigger id="ui-language-select">
                    <SelectValue placeholder={t('settings.uiLanguage.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl">{t('settings.language.dutch')}</SelectItem>
                    <SelectItem value="en">{t('settings.language.english')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {t('settings.uiLanguage.description')}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ai-language-select">{t('settings.aiLanguage.label')}</Label>
                <Select
                  value={aiLanguage}
                  onValueChange={handleAiLanguageChange}
                >
                  <SelectTrigger id="ai-language-select">
                    <SelectValue placeholder={t('settings.aiLanguage.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl">{t('settings.language.dutch')}</SelectItem>
                    <SelectItem value="en">{t('settings.language.english')}</SelectItem>
                  </SelectContent>
                </Select>
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
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={handleToggleNotifications}
                  disabled={isSavingNotifications}
                />
                {isSavingNotifications && <Loader size="sm" className="ml-2" />}
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
            <CardContent className="space-y-6">
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between">
                <div className="flex-grow">
                  <Label htmlFor="ai-mode-select">{t('settings.aiMode.label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.aiMode.description')}
                    {user?.role === 'free' && (
                       <span className="text-xs block text-amber-500">{t('settings.aiMode.freeUserLimitation')}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1 md:mt-0">
                  <Select 
                    value={selectedAiMode} 
                    onValueChange={handleAiModeChange}
                    disabled={isSavingAiMode || user?.role === 'free'}
                  >
                    <SelectTrigger id="ai-mode-select" className="w-full md:w-48">
                      <SelectValue placeholder={t('settings.aiMode.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} >
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isSavingAiMode && <Loader size="sm" />} 
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between pt-4 border-t border-border/10 md:pt-0 md:border-t-0">
                <div className="flex-grow">
                  <Label htmlFor="research-model-select">{t('settings.researchModel.label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.researchModel.description')}
                    {user?.role === 'free' && (
                      <span className="text-xs block text-amber-500">{t('settings.researchModel.freeUserLimitation')}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1 md:mt-0">
                  <RadioGroup 
                    value={researchModelPreference} 
                    onValueChange={handleResearchModelChange}
                    disabled={isSavingResearchModel}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="perplexity-sonar" id="perplexity-sonar" />
                      <Label htmlFor="perplexity-sonar" className="font-normal">{t('settings.researchModel.perplexitySonar')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gpt-4o-mini" id="gpt-4o-mini" />
                      <Label htmlFor="gpt-4o-mini" className="font-normal">{t('settings.researchModel.gpt4oMini')}</Label>
                    </div>
                  </RadioGroup>
                  {isSavingResearchModel && <Loader size="sm" className="ml-2 mt-2" />}
                </div>
              </div>

              <div className="pt-4 border-t border-border/10">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full h-12">{t('settings.aiModelConfig.button')}</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>{t('settings.aiModelConfig.drawerTitle')}</DrawerTitle>
                      <DrawerDescription>{t('settings.aiModelConfig.drawerDescription')}</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="default-model-select">{t('settings.aiModelConfig.defaultModelLabel')}</Label>
                        <Select defaultValue="gpt-4o-mini" disabled>
                          <SelectTrigger id="default-model-select">
                            <SelectValue placeholder={t('settings.aiModelConfig.defaultModelPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">{t('settings.researchModel.gpt4oMini')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.aiModelConfig.defaultModelDescription')}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="system-prompt">{t('settings.aiModelConfig.systemPromptLabel')}</Label>
                        <Textarea 
                          id="system-prompt" 
                          placeholder={t('settings.aiModelConfig.systemPromptPlaceholder')} 
                          className="min-h-[100px] bg-gray-700"
                          defaultValue={t('settings.aiModelConfig.systemPromptDefaultValue')}
                        />
                      </div>
                    </div>
                    <DrawerFooter>
                      <Button className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white h-12">
                        {t('settings.aiModelConfig.saveButton')}
                      </Button>
                      <DrawerClose asChild>
                        <Button variant="outline" className="h-12">{t('settings.aiModelConfig.cancelButton')}</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
