import AppLayout from "@/components/layout/AppLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";

export default function SupportPage() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Support</h1>

      <Card>
        <CardHeader>
          <CardTitle>Hulp Nodig?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Heeft u vragen of ondervindt u problemen met OrgaMaster AI? 
            Neem contact op met ons support team.
          </p>
          <p>
            U kunt ons bereiken via e-mail op:{" "}
            <a href="mailto:support@orgamaster.ai" className="text-primary hover:underline">
              support@orgamaster.ai
            </a>
          </p>
          <p>
            We streven ernaar om uw vragen zo snel mogelijk te beantwoorden.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
} 