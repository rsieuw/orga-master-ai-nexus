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