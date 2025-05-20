import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paden naar de vertaalbestanden
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');

try {
  // Lees het Nederlandse vertaalbestand
  const nlTranslationData = fs.readFileSync(nlTranslationPath, 'utf8');
  let nlTranslation;
  
  try {
    nlTranslation = JSON.parse(nlTranslationData);
  } catch (jsonError) {
    console.error('Fout bij het parsen van het JSON bestand:', jsonError);
    process.exit(1);
  }
  
  console.log('Vertaal research model secties in het Nederlandse bestand...');

  // Fix settingsPage.toast.researchModelSaved
  if (nlTranslation.settingsPage?.toast?.researchModelSaved?.description === 
      "Default research model set to: {modeLabel}.") {
    nlTranslation.settingsPage.toast.researchModelSaved.description = 
      "Standaard onderzoeksmodel ingesteld op: {modeLabel}.";
    console.log('researchModelSaved sectie vertaald.');
  }

  // Fix settingsPage.toast.errorSavingResearchModel
  if (nlTranslation.settingsPage?.toast?.errorSavingResearchModel?.description === 
      "Could not save research model preference.") {
    nlTranslation.settingsPage.toast.errorSavingResearchModel.description = 
      "Kon onderzoeksmodel voorkeur niet opslaan.";
    console.log('errorSavingResearchModel sectie vertaald.');
  }
  
  // Fix settings.toast.notificationsSaved
  if (nlTranslation.settings?.toast?.notificationsSaved?.title === "Notification Preference Saved") {
    nlTranslation.settings.toast.notificationsSaved.title = "Meldingsvoorkeur opgeslagen";
    console.log('settings.toast.notificationsSaved.title vertaald.');
  }

  // Fix settings.toast.errorSavingNotifications
  if (nlTranslation.settings?.toast?.errorSavingNotifications?.title === "Error Saving Notifications") {
    nlTranslation.settings.toast.errorSavingNotifications.title = "Fout bij opslaan meldingen";
    console.log('settings.toast.errorSavingNotifications.title vertaald.');
  }
  
  // Schrijf de bijgewerkte vertaling terug naar het bestand
  fs.writeFileSync(
    nlTranslationPath, 
    JSON.stringify(nlTranslation, null, 2),
    'utf8'
  );
  
  console.log('Research model secties succesvol vertaald!');
  
} catch (error) {
  console.error('Fout bij het verwerken van het vertaalbestand:', error);
} 