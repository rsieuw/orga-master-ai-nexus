import { type UserProfile } from '@/types/auth.ts';

/**
 * Defines all possible features in the application.
 * This type is used to check user permissions for specific functionalities.
 * Add more features here as they are implemented in the application.
 * @example
 * // | 'someOtherFeature'
 */
export type Feature = 
  | 'deepResearch' 
  | 'exportChat' 
  | 'adminPanel'
  | 'choose_research_model'
  | 'chatModes'
  // TODO: Add more features here as you implement them
  // | 'someOtherFeature'
  ;

/**
 * Checks if a user has permission for a specific feature based on their enabled_features.
 * 
 * @param user The user profile object (can be null).
 * @param feature The feature key to check permission for.
 * @returns True if the user has permission, false otherwise.
 */
export function hasPermission(user: UserProfile | null, feature: Feature): boolean {
  // TEMPORARY DEBUG VERSION: Always returns true for testing
  if (feature === 'deepResearch') {
    return true;
  }
  
  if (!user || !user.enabled_features) {
    return false; // No user or no features array means no permission
  }
  return user.enabled_features.includes(feature);
} 