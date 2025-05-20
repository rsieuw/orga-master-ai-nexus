import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pad naar het Nederlandse vertaalbestand
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');

// Hardcoded vertalingen voor de 53 ontbrekende sleutels
const translations = {
  'settings.toast.errorSavingResearchModel.title': 'Fout bij opslaan onderzoeksmodel',
  'settings.toast.errorSavingResearchModel.description': 'Er is een fout opgetreden bij het opslaan van het onderzoeksmodel. Probeer het later opnieuw.',
  'adminUsersPage.permissions': 'Rechten',
  'adminUsersPage.themes': 'Thema\'s',
  'adminUsersPage.feedback': 'Feedback',
  'adminUsersPage.internalApiUsage': 'Intern API-gebruik',
  'adminUsersPage.externalApiUsage': 'Extern API-gebruik',
  'dashboard.defaultUser': 'Standaard gebruiker',
  'dashboard.emptyState.noTasksAfterFilter': 'Geen taken gevonden met de huidige filters',
  'taskDetail.subtask.options': 'Subtaak opties',
  'taskDetail.subtask.edit': 'Subtaak bewerken',
  'taskDetail.subtask.delete': 'Subtaak verwijderen',
  'taskDetail.notFound.title': 'Taak niet gevonden',
  'taskDetail.toast.taskDeleted': 'Taak verwijderd',
  'taskDetail.toast.taskDeletedDescription': 'De taak is succesvol verwijderd',
  'taskDetail.toast.subtaskStatusUpdateFailedDescription': 'Kon de status van de subtaak niet bijwerken. Probeer het opnieuw.',
  'taskDetail.noDeadline': 'Geen deadline',
  'taskDetail.invalidDate': 'Ongeldige datum',
  'taskDetail.editTaskSR': 'Taak bewerken',
  'taskDetail.taskOptionsSR': 'Taak opties',
  'taskDetail.editTask': 'Taak bewerken',
  'taskDetail.generateSubtasks.limitReachedTooltip': 'Je hebt de limiet voor AI-generaties bereikt',
  'taskDetail.collapseDescription': 'Beschrijving inklappen',
  'taskDetail.newSubtaskTitleLabel': 'Titel nieuwe subtaak',
  'taskDetail.generatingText': 'Genereren...',
  'taskDetail.buttons.showDescription': 'Beschrijving tonen',
  'taskDetail.buttons.hideDescription': 'Beschrijving verbergen',
  'chatPanel.errors.research.instructionPrefixForSubtask': 'Instructievoorvoegsel voor subtaak',
  'chatPanel.errors.research.userRequestPrefix': 'Voorvoegsel gebruikersverzoek',
  'chatPanel.errors.research.forSubtaskContinuation': 'Voor subtaak voortzetting',
  'chatPanel.errors.research.errorMessage': 'Foutmelding',
  'chatPanel.errors.research.upgradeNeeded.title': 'Upgrade nodig',
  'chatPanel.errors.research.upgradeNeeded.description': 'Om deze functie te gebruiken is een upgrade naar een hoger abonnement nodig',
  'editTaskDialog.toast.taskUpdatedTitle': 'Taak bijgewerkt',
  'editTaskDialog.toast.taskUpdatedDescription': 'De taak is succesvol bijgewerkt',
  'editTaskDialog.toast.updateErrorTitle': 'Fout bij bijwerken',
  'editTaskDialog.toast.updateErrorDescription': 'Er is een fout opgetreden bij het bijwerken van de taak',
  'editTaskDialog.selectStatusPlaceholder': 'Selecteer status',
  'taskContext.toast.updateTaskFailed': 'Bijwerken taak mislukt',
  'taskContext.toast.alreadyGenerating.title': 'Al aan het genereren',
  'taskContext.toast.alreadyGenerating.description': 'Er wordt al een verzoek verwerkt. Wacht tot het huidige verzoek is voltooid.',
  'taskContext.toast.aiLimitReached.title': 'AI-limiet bereikt',
  'taskContext.toast.aiLimitReached.description': 'Je hebt de limiet voor AI-generaties bereikt',
  'taskContext.taskNotFound': 'Taak niet gevonden',
  'adminFeedbackPage.actions.markImportant': 'Als belangrijk markeren',
  'adminFeedbackPage.actions.unmarkImportant': 'Belangrijk markering verwijderen',
  'adminExternalApiUsagePage.status.success': 'Succesvol',
  'adminExternalApiUsagePage.status.failed': 'Mislukt',
  'adminExternalApiUsagePage.status.unknown': 'Onbekend',
  'charts.costDistributionCustomLabelNoData': 'Geen gegevens beschikbaar',
  'charts.topUsersInternalTitle': 'Top gebruikers - intern API-gebruik',
  'charts.topUsersYAxisLabel': 'Aantal verzoeken',
  'charts.topUsersXAxisLabel': 'Gebruiker'
};

// Functie om een sleutelpad in een object toe te passen
function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  const lastKey = keys.pop();
  let current = obj;
  
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
  return obj;
}

// Functie om een waarde te halen uit een genest object via een sleutelpad
function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null || !current.hasOwnProperty(key)) {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

try {
  console.log('Vertalingen toepassen op ontbrekende sleutels...');
  
  // Lees het Nederlandse vertaalbestand
  const nlTranslationData = fs.readFileSync(nlTranslationPath, 'utf8');
  let nlTranslation = JSON.parse(nlTranslationData);
  
  // Bijhouden hoeveel vertalingen we hebben toegepast
  let translatedCount = 0;
  
  // Pas alle vertalingen toe
  for (const [keyPath, translation] of Object.entries(translations)) {
    const currentValue = getNestedValue(nlTranslation, keyPath);
    
    // Controleer of de waarde de markering bevat
    if (typeof currentValue === 'string' && currentValue.startsWith('[VERTALING NODIG]')) {
      nlTranslation = setNestedValue(nlTranslation, keyPath, translation);
      translatedCount++;
      console.log(`Vertaald: ${keyPath}`);
    }
  }
  
  if (translatedCount > 0) {
    // Schrijf het bijgewerkte Nederlandse bestand
    fs.writeFileSync(
      nlTranslationPath,
      JSON.stringify(nlTranslation, null, 2),
      'utf8'
    );
    
    console.log(`\n${translatedCount} sleutels zijn succesvol vertaald.`);
  } else {
    console.log('Geen sleutels gevonden om te vertalen.');
  }
  
} catch (error) {
  console.error('Er is een fout opgetreden:', error);
} 