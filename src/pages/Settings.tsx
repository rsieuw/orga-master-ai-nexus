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

// Define possible research models - use consistent identifiers with backend
type ResearchModel = 'perplexity-sonar' | 'gpt-4o-mini';

const aiModeOptions: { value: AiMode; label: string }[] = [
  { value: 'gpt4o', label: 'GPT-4o (Gebalanceerd)' },
  { value: 'creative', label: 'Creatieve Modus' },
  { value: 'precise', label: 'Precieze Modus' },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [language, setLanguage] = useState<string>(user?.language_preference || "nl");
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
      setLanguage(user.language_preference || "nl");
      setEmailNotifications(user.email_notifications_enabled ?? true);
      setSelectedAiMode(user.ai_mode_preference || 'precise');
      // Initialize research model preference - use a default if not set
      setResearchModelPreference(user.research_model_preference || 'perplexity-sonar'); 
    }
  }, [user]);

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    try {
      await updateUser({ language_preference: value });
      toast({
        title: "Taal gewijzigd",
        description: value === "nl" ? "Taal is gewijzigd naar Nederlands" : "Language has been changed to English",
      });
    } catch (error) {
      console.error("Failed to update language preference:", error);
      toast({
        variant: "destructive",
        title: "Fout bij opslaan taal",
        description: "Kon taalvoorkeur niet opslaan.",
      });
    }
  };

  const handleToggleNotifications = async (checked: boolean) => {
    setIsSavingNotifications(true);
    const originalValue = emailNotifications;
    setEmailNotifications(checked);

    try {
      await updateUser({ email_notifications_enabled: checked });
      toast({
        title: `E-mail notificaties ${checked ? 'opgeslagen' : 'opgeslagen'}`,
        description: `Voorkeur voor e-mail notificaties is ${checked ? 'ingeschakeld' : 'uitgeschakeld'}.`,
      });
    } catch (error) {
      setEmailNotifications(originalValue);
      console.error("Failed to update email notification preference:", error);
      toast({
        variant: "destructive",
        title: "Fout bij opslaan",
        description: "Kon voorkeur voor e-mail notificaties niet opslaan.",
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
        title: "Account bijgewerkt",
        description: "Je accountgegevens zijn succesvol opgeslagen",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout bij bijwerken",
        description: "Kon accountgegevens niet opslaan",
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
      const modeLabel = aiModeOptions.find(opt => opt.value === newMode)?.label || newMode;
      toast({
        title: "AI Modus Opgeslagen",
        description: `Standaard AI modus ingesteld op: ${modeLabel}`,
      });
    } catch (error) {
      setSelectedAiMode(originalMode);
      console.error("Failed to update AI mode preference:", error);
      toast({
        variant: "destructive",
        title: "Fout bij opslaan",
        description: "Kon voorkeur voor AI modus niet opslaan.",
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
      // Assume updateUser can handle `research_model_preference`
      await updateUser({ research_model_preference: newMode }); 
      const modeLabel = newMode === 'perplexity-sonar' ? 'Perplexity Sonar' : 'GPT-4o Mini'; // Simple label mapping
      toast({
        title: "Onderzoeksmodel Opgeslagen",
        description: `Standaard onderzoeksmodel ingesteld op: ${modeLabel}`,
      });
    } catch (error) {
      setResearchModelPreference(originalMode);
      console.error("Failed to update research model preference:", error);
      toast({
        variant: "destructive",
        title: "Fout bij opslaan",
        description: "Kon voorkeur voor onderzoeksmodel niet opslaan.",
      });
    } finally {
      setIsSavingResearchModel(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Instellingen</h1>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Uiterlijk</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Notificaties</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="appearance" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>Uiterlijk</CardTitle>
              <CardDescription>Pas het uiterlijk van de applicatie aan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme" className="text-base">Thema</Label>
                  <p className="text-sm text-muted-foreground">
                    Kies tussen licht en donker thema
                  </p>
                </div>
                <Select value={theme} onValueChange={toggleTheme}>
                  <SelectTrigger id="theme" className="w-40">
                    <SelectValue placeholder="Selecteer thema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Licht</SelectItem>
                    <SelectItem value="dark">Donker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>Account Instellingen</CardTitle>
              <CardDescription>Beheer je accountgegevens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam</Label>
                <Input id="name" placeholder="Je naam" className="bg-gray-700" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="Je e-mail" className="bg-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="flex justify-end pt-4"> 
                <Button 
                  className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white" 
                  onClick={handleSaveAccount}
                >
                  Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 max-w-3xl mx-auto">
          <Card className="firebase-card">
            <CardHeader>
              <CardTitle>Notificatie Instellingen</CardTitle>
              <CardDescription>Beheer je notificatievoorkeuren</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="text-base">E-mail Notificaties</Label>
                  <p className="text-sm text-muted-foreground">
                    Ontvang e-mails voor naderende deadlines
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
              <CardTitle>AI Instellingen</CardTitle>
              <CardDescription>Configureer AI-functionaliteit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="language" className="text-base">Taal</Label>
                  <p className="text-sm text-muted-foreground">
                    Kies de taal voor AI interacties
                  </p>
                </div>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language" className="w-40">
                    <SelectValue placeholder="Selecteer taal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nl">Nederlands</SelectItem>
                    <SelectItem value="en">Engels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-border/10">
                <div>
                  <Label htmlFor="ai-mode" className="text-base">Standaard AI Modus</Label>
                  <p className="text-sm text-muted-foreground">
                    Kies het standaard gedrag voor AI interacties.
                    {user?.role === 'free' && (
                       <span className="text-xs block text-amber-500">('Creative' en 'Precise' alleen voor betaalde gebruikers)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={selectedAiMode} 
                    onValueChange={handleAiModeChange}
                    disabled={isSavingAiMode || user?.role === 'free'} // Disable if saving OR user is free
                  >
                    <SelectTrigger id="ai-mode" className="w-48">
                      <SelectValue placeholder="Selecteer modus" />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} 
                          >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isSavingAiMode && <Loader size="sm" />} 
                </div>
              </div>
              
              {/* --- Research Model Selection --- */}
              <div className="flex items-center justify-between pt-4 border-t border-border/10">
                <div>
                  <Label htmlFor="research-model" className="text-base">Onderzoeksmodel</Label>
                  <p className="text-sm text-muted-foreground">
                    Kies het AI model voor de 'Deep Research' functie
                    {user?.role === 'free' && (
                      <span className="text-xs block text-amber-500">(Beschikbaar voor betaalde gebruikers)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={researchModelPreference} 
                    onValueChange={handleResearchModelChange}
                    disabled={isSavingResearchModel || user?.role === 'free'} // Disable if saving OR user is free
                  >
                    <SelectTrigger id="research-model" className="w-48">
                      <SelectValue placeholder="Selecteer model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perplexity-sonar">Perplexity Sonar</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSavingResearchModel && <Loader size="sm" />} 
                </div>
              </div>
              {/* --- End Research Model Selection --- */}

              <div className="pt-4 border-t border-border/10">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full">AI Model Configuratie</Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>AI Model Configuratie</DrawerTitle>
                      <DrawerDescription>Pas instellingen aan voor de AI modellen</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="model">AI Model (Standaard)</Label>
                        <Select defaultValue="gpt-4o-mini" disabled>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Selecteer het standaard AI model voor algemeen gebruik. Betaalde gebruikers kunnen geavanceerdere opties kiezen via Developer Mode.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="system-prompt">System Prompt</Label>
                        <Textarea 
                          id="system-prompt" 
                          placeholder="Je bent een AI assistent die helpt met taken..." 
                          className="min-h-[100px] bg-gray-700"
                          defaultValue="Je bent een behulpzame AI assistent die gebruikers helpt bij het beheren en begrijpen van hun taken."
                        />
                      </div>
                    </div>
                    <DrawerFooter>
                      <Button className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white">
                        Opslaan
                      </Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Annuleren</Button>
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
