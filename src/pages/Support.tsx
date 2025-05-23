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

      <Card className="mb-6">
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

      <Card>
        <CardHeader>
          <CardTitle>{t('supportPage.manualTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>{t('supportPage.manualPlaceholder')}</p>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">{t('supportPage.manual.accountManagement.title')}</h2>
            <p className="mb-2">{t('supportPage.manual.accountManagement.intro')}</p>
            
            <h3 className="text-lg font-semibold mb-2">{t('supportPage.manual.accountManagement.login.title')}</h3>
            <p className="mb-1">{t('supportPage.manual.accountManagement.login.emailPassword')}</p>

            <h4 className="text-md font-semibold mt-2 mb-1">{t('supportPage.manual.accountManagement.login.googleLogin.title')}</h4>
            <p>{t('supportPage.manual.accountManagement.login.googleLogin.intro')}</p>
            <ol className="list-decimal list-inside space-y-1 pl-4 mt-1">
              <li>{t('supportPage.manual.accountManagement.login.googleLogin.step1')}</li>
              <li>{t('supportPage.manual.accountManagement.login.googleLogin.step2')}</li>
              <li>{t('supportPage.manual.accountManagement.login.googleLogin.step3')}</li>
              <li>{t('supportPage.manual.accountManagement.login.googleLogin.step4')}</li>
              <li>{t('supportPage.manual.accountManagement.login.googleLogin.step5')}</li>
              <li>{t('supportPage.manual.accountManagement.login.googleLogin.step6')}</li>
            </ol>
            <p className="mt-1">{t('supportPage.manual.accountManagement.login.googleLogin.outro')}</p>
            {/* Hier kunnen secties over registreren, wachtwoord resetten, etc. komen */}
          </section>
          
          {/* Hier komen meer secties van de handleiding */}
        </CardContent>
      </Card>
    </AppLayout>
  );
} 