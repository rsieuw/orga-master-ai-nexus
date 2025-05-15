import AppLayout from "@/components/layout/AppLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useTranslation } from 'react-i18next';

/**
 * `SupportPage` component displays information on how users can get support.
 * It provides a contact email address and general information about seeking assistance.
 * This is a simple informational page using the `AppLayout`.
 */
export default function SupportPage() {
  const { t } = useTranslation();

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">{t('supportPage.mainTitle')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('supportPage.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {t('supportPage.paragraph1')}
          </p>
          <p>
            {t('supportPage.paragraph2a')}{" "}
            <a href="mailto:info@artifexai.nl" className="text-primary hover:underline">
              info@artifexai.nl
            </a>
          </p>
          <p>
            {t('supportPage.paragraph3')}
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
} 