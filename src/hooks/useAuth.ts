import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContextDef.tsx";

/**
 * Hook for accessing the authentication context in the application.
 *
 * This hook provides access to:
 * - The current user (user)
 * - Authentication status
 * - Login/logout functions
 * - User data update functionality
 * - Password reset functionality
 *
 * @throws {Error} When this hook is used outside an AuthProvider component
 * @returns {Object} The authentication context with user, status, and authentication functions
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 