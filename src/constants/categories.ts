/**
 * @fileoverview Defines constants and types related to task categories.
 * Includes arrays for i18n translation keys and their corresponding Dutch labels,
 * as well as type definitions for individual categories and category keys.
 */

/**
 * Array of i18n translation keys for task categories.
 * These keys are used to look up localized category names.
 * @constant
 * @type {readonly string[]}
 */
export const TASK_CATEGORY_KEYS = [
  "categories.workStudy",    // Work/Study  
  "categories.personal",     // Personal
  "categories.household",    // Household
  "categories.family",       // Family
  "categories.social",       // Social
  "categories.health",       // Health 
  "categories.finances",     // Finances
  "categories.projects"      // Projects
] as const;

/**
 * Array of task category labels in Dutch.
 * Maintained for backward compatibility or specific use cases where Dutch labels are directly needed.
 * Each label corresponds to a key in `TASK_CATEGORY_KEYS`.
 * - Werk/Studie: Professional obligations or study-related tasks.
 * - Persoonlijk: Self-care, hobbies, and personal goals.
 * - Huishouden: Cleaning, groceries, maintenance.
 * - Familie: Obligations related to family or partner.
 * - Sociaal: Appointments, meetings, and social activities.
 * - Gezondheid: Sports, doctor's appointments, meditation.
 * - Financiën: Payments, budgeting, administration.
 * - Projecten: Specific long-term goals with multiple steps.
 * @constant
 * @type {readonly string[]}
 */
export const TASK_CATEGORIES = [
  "Werk/Studie",      
  "Persoonlijk",      
  "Huishouden",       
  "Familie",          
  "Sociaal",          
  "Gezondheid",       
  "Financiën",        
  "Projecten"         
] as const; 

/**
 * Type representing a task category label.
 * It is derived from the values in the `TASK_CATEGORIES` array.
 * @typedef {typeof TASK_CATEGORIES[number]} TaskCategory
 */
export type TaskCategory = typeof TASK_CATEGORIES[number];

/**
 * Type representing an i18n translation key for a task category.
 * It is derived from the values in the `TASK_CATEGORY_KEYS` array.
 * @typedef {typeof TASK_CATEGORY_KEYS[number]} TaskCategoryKey
 */
export type TaskCategoryKey = typeof TASK_CATEGORY_KEYS[number]; 