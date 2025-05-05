import { type UserProfile } from '@/contexts/AuthContext.tsx';

// Define all possible features in your application
export type Feature = 
  | 'deepResearch' 
  | 'exportChat' 
  | 'adminPanel'
  | 'choose_research_model'
  // Voeg hier meer features toe naarmate je ze implementeert
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
  if (!user || !user.enabled_features) {
    return false; // No user or no features array means no permission
  }
  return user.enabled_features.includes(feature);
} 