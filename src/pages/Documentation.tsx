import AppLayout from "@/components/layout/AppLayout.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useTranslation } from 'react-i18next';

/**
 * `DocumentationPage` component displays general documentation or information about the application.
 * Currently, it serves as a placeholder for more detailed documentation.
 * This is a simple informational page using the `AppLayout`.
 */
export default function DocumentationPage() {
  const { t } = useTranslation();

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">{t('documentationPage.mainTitle')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('documentationPage.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {t('documentationPage.paragraph1')}
          </p>
          <p className="mt-4">
            {t('documentationPage.paragraph2')}
          </p>
          <p className="mt-2">
            {t('documentationPage.paragraph3')}
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  );
} 