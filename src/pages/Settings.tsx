import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Palette, Languages, HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const [language, setLanguage] = useState("nl"); // Default to Dutch
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  // State for account form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Initialize form state when user data is available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast({
      title: "Taal gewijzigd",
      description: value === "nl" ? "Taal is gewijzigd naar Nederlands" : "Language has been changed to English",
    });
  };

  const handleSaveAPIKey = () => {
    if (apiKey) {
      toast({
        title: "API sleutel opgeslagen",
        description: "Je API sleutel is succesvol opgeslagen",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Fout bij opslaan",
        description: "Voer alsjeblieft een geldige API sleutel in",
      });
    }
  };

  const handleToggleNotifications = (checked: boolean) => {
    setEmailNotifications(checked);
    toast({
      title: `E-mail notificaties ${checked ? 'ingeschakeld' : 'uitgeschakeld'}`,
      description: `Je zult ${checked ? 'nu' : 'geen'} e-mail notificaties ontvangen voor naderende deadlines`,
    });
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

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Instellingen</h1>
      </div>

      <Tabs defaultValue="appearance" className="space-y-6">
        <TabsList className="grid grid-cols-4 mb-4">
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

        <TabsContent value="appearance" className="space-y-4">
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

        <TabsContent value="account" className="space-y-4">
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
              <Button className="mt-4" onClick={handleSaveAccount}>Opslaan</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
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
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
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
              
              <div className="space-y-2 pt-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="api-key">OpenAI API Sleutel</Label>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="text-sm">
                        Je API sleutel wordt veilig opgeslagen en wordt gebruikt om AI functionaliteiten te ontsluiten.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="api-key" 
                    type="password" 
                    placeholder="sk-..." 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-gray-700"
                  />
                  <Button onClick={handleSaveAPIKey}>Opslaan</Button>
                </div>
              </div>
              
              <div className="pt-4">
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
                        <Label htmlFor="model">AI Model</Label>
                        <Select defaultValue="gpt-3.5-turbo">
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                            <SelectItem value="claude-3">Claude 3</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <Button>Opslaan</Button>
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
