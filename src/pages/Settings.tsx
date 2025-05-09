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
import { Settings, User, Palette, Languages } from "lucide-react";
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
  const [researchModelPreference, setResearchModelPreference] = useState<ResearchModel>('perplexity-sonar'); // Add state for research model
  const [isSavingResearchModel, setIsSavingResearchModel] = useState(false); // Add loading state for research model
  const { toast } = useToast();

  // State for account form
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

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
    }
  }, [user]);

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

  const handleUiLanguageChange = (newLang: string) => {
    i18n.changeLanguage(newLang);
    const languageName = newLang === 'nl' ? t('settings.language.dutch') : t('settings.language.english');
    toast({
        title: t('settings.toast.uiLanguageChanged.title'),
        description: t('settings.toast.uiLanguageChanged.description', { language: languageName }),
      });
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

  // Handler for research model change
  const handleResearchModelChange = async (value: string) => {
    const newMode = value as ResearchModel;
    setIsSavingResearchModel(true);
    const originalMode = researchModelPreference;
    setResearchModelPreference(newMode);

    try {
      await updateUser({ research_model_preference: newMode }); 
      // Use i18n keys for the modeLabel
      const modeLabelKey = newMode === 'perplexity-sonar' 
        ? 'settings.researchModel.perplexitySonar' 
        : 'settings.researchModel.gpt4oMini';
      
      toast({
        title: t('settings.toast.researchModelSaved.title'),
        description: t('settings.toast.researchModelSaved.description', { modeLabel: t(modeLabelKey) })
      });
    } catch (error) {
      setResearchModelPreference(originalMode);
      console.error("Failed to update research model preference:", error);
      toast({
        variant: "destructive",
        title: t('settings.toast.errorSavingResearchModel.title'),
        description: t('settings.toast.errorSavingResearchModel.description'),
      });
    } finally {
      setIsSavingResearchModel(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.account')}</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.language')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.tabs.ai')}</span>
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
                  className="w-full"
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
                  <Select 
                    value={researchModelPreference} 
                    onValueChange={handleResearchModelChange}
                    disabled={isSavingResearchModel || user?.role === 'free'}
                  >
                    <SelectTrigger id="research-model-select" className="w-full md:w-48">
                      <SelectValue placeholder={t('settings.researchModel.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perplexity-sonar">{t('settings.researchModel.perplexitySonar')}</SelectItem>
                      <SelectItem value="gpt-4o-mini">{t('settings.researchModel.gpt4oMini')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSavingResearchModel && <Loader size="sm" />} 
                </div>
              </div>

              <div className="pt-4 border-t border-border/10">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full">{t('settings.aiModelConfig.button')}</Button>
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
                      <Button className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white">
                        {t('settings.aiModelConfig.saveButton')}
                      </Button>
                      <DrawerClose asChild>
                        <Button variant="outline">{t('settings.aiModelConfig.cancelButton')}</Button>
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
