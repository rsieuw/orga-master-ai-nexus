import AppLayout from "@/components/layout/AppLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";

export default function DocumentationPage() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Documentatie</h1>

      <Card>
        <CardHeader>
          <CardTitle>OrgaMaster AI Documentatie</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Welkom bij de documentatie voor OrgaMaster AI.
          </p>
          <p className="mt-4">
            Momenteel wordt er hard gewerkt aan uitgebreide documentatie om u te helpen het maximale uit de applicatie te halen.
          </p>
          <p className="mt-2">
            Kom binnenkort terug voor handleidingen, tutorials en API-referenties.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
} 