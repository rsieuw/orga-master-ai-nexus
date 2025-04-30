
import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState("nl"); // Default to Dutch
  const { toast } = useToast();

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast({
      title: "Taal gewijzigd",
      description: value === "nl" ? "Taal is gewijzigd naar Nederlands" : "Language has been changed to English",
    });
  };

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Instellingen</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Uiterlijk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Thema</Label>
              <Select value={theme} onValueChange={toggleTheme}>
                <SelectTrigger id="theme">
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

        <Card>
          <CardHeader>
            <CardTitle>Taal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Taal</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Selecteer taal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Let op: Taalwijziging wordt in een toekomstige versie volledig ondersteund
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Instellingen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Voor AI functionaliteiten is een Supabase integratie nodig. Configureer 
              API sleutels in de Supabase omgeving.
            </p>
            <Button variant="outline">
              Configureer API's
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
