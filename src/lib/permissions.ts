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
 * Represents the result of a permission check.
 * @interface PermissionResult
 * @property {boolean} hasAccess - Whether the user has access to the feature.
 * @property {'NEEDS_PAID' | 'NOT_IN_ENABLED_FEATURES' | 'NO_USER' | 'ADMIN_OVERRIDE' | undefined} [reason] - The reason for access denial or grant.
 */
export interface PermissionResult {
  hasAccess: boolean;
  reason?: 'NEEDS_PAID' | 'NOT_IN_ENABLED_FEATURES' | 'NO_USER' | 'ADMIN_OVERRIDE';
}

/**
 * Checks if a user has permission for a specific feature based on their role and enabled_features.
 * 
 * @param user The user profile object (can be null).
 * @param feature The feature key to check permission for.
 * @returns {PermissionResult} An object indicating if the user has permission and the reason.
 */
export function hasPermission(user: UserProfile | null, feature: Feature): PermissionResult {
  if (!user) {
    return { hasAccess: false, reason: 'NO_USER' };
  }

  // Admins always have access to everything
  if (user.role === 'admin') {
    return { hasAccess: true, reason: 'ADMIN_OVERRIDE' };
  }

  // Specific check for 'deepResearch' for non-admin users
  if (feature === 'deepResearch') {
    if (user.role === 'free') {
      return { hasAccess: false, reason: 'NEEDS_PAID' };
  }
    // For paid users, check if it's in their enabled_features (though typically it should be)
    // If not explicitly in enabled_features for a paid user, deny access.
    if (!user.enabled_features || !user.enabled_features.includes(feature)) {
      return { hasAccess: false, reason: 'NOT_IN_ENABLED_FEATURES' };
    }
    return { hasAccess: true }; // Paid users have access if enabled
  }
  
  // General feature check for other features
  if (!user.enabled_features || !user.enabled_features.includes(feature)) {
    return { hasAccess: false, reason: 'NOT_IN_ENABLED_FEATURES' };
  }
  
  return { hasAccess: true };
} 