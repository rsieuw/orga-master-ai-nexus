// Een nieuwe constante met de i18n-keys voor categorieën
export const TASK_CATEGORY_KEYS = [
  "categories.workStudy",    // Werk/Studie  
  "categories.personal",     // Persoonlijk
  "categories.household",    // Huishouden
  "categories.family",       // Familie
  "categories.social",       // Sociaal
  "categories.health",       // Gezondheid 
  "categories.finances",     // Financiën
  "categories.projects"      // Projecten
] as const;

// Voor backward compatibility behouden we de TASK_CATEGORIES array met Nederlandse labels
export const TASK_CATEGORIES = [
  "Werk/Studie",      // Professionele verplichtingen of studiegerelateerde taken
  "Persoonlijk",      // Zelfzorg, hobby's en persoonlijke doelen
  "Huishouden",       // Schoonmaken, boodschappen, onderhoud
  "Familie",          // Verplichtingen gerelateerd aan familie of partner
  "Sociaal",          // Afspraken, bijeenkomsten en sociale activiteiten
  "Gezondheid",       // Sport, doktersafspraken, meditatie
  "Financiën",        // Betalingen, budgettering, administratie
  "Projecten"         // Specifieke langetermijndoelen met meerdere stappen
] as const; 

export type TaskCategory = typeof TASK_CATEGORIES[number];
export type TaskCategoryKey = typeof TASK_CATEGORY_KEYS[number]; 