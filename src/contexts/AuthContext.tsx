import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTranslation } from 'react-i18next';

export type UserRole = "admin" | "paid" | "free";

// Define the possible AI modes as a literal type
export type AiMode = 'gpt4o' | 'creative' | 'precise';

// Define possible research models - copying from Settings.tsx for now
// Ideally, this would be defined in a shared types file
type ResearchModel = 'perplexity-sonar' | 'gpt-4o-mini';

export type LayoutPreference = '50-50' | '33-67';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  language_preference: string;
  email_notifications_enabled: boolean;
  ai_mode_preference: AiMode; // Added field using the literal type
  research_model_preference?: ResearchModel; // Add optional research model preference
  layout_preference?: LayoutPreference;
  created_at: string;
  updated_at: string;
  status?: string;
  enabled_features: string[];
  can_use_creative_mode?: boolean;
  can_use_precise_mode?: boolean;
}

export interface AuthContextProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'layout_preference'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState<boolean>(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      console.error("Logout failed:", error);
      const message = error instanceof Error ? error.message : t('auth.toast.logoutFailed.descriptionDefault');
      toast({
        variant: "destructive",
        title: t('auth.toast.logoutFailed.title'),
        description: message,
      });
      throw error;
    }
  }, [toast, t]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);
        setIsAuthenticated(!!currentSession);
        
        if (!initialAuthCheckComplete) {
            setInitialAuthCheckComplete(true);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialAuthCheckComplete]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (initialAuthCheckComplete && session?.user) {
        setIsLoading(true); 
        try {
          const { data: profileData, error } = await supabase
            .rpc('get_user_profile_with_permissions', { user_id: session.user.id })
            .single();
          
          if (error) {
            console.error('Profile Effect: Error calling get_user_profile_with_permissions:', error);
            setUser(null);
          } else if (profileData) {
            const fullProfile = profileData as unknown as UserProfile;

            if (fullProfile.status === 'inactive') {
              console.warn('User is inactive, logging out.');
              toast({ 
                variant: "destructive", 
                title: t('auth.toast.accountDeactivated.title'), 
                description: t('auth.toast.accountDeactivated.description')
              });
              logout(); 
              setUser(null);
            } else {
              setUser({
                ...fullProfile,
                role: (fullProfile.role === 'admin' || fullProfile.role === 'paid') ? fullProfile.role : 'free',
                layout_preference: fullProfile.layout_preference || '50-50',
              }); 
            }
          } else {
            console.warn('Profile Effect: Profile not found via function for user:', session.user?.id);
            setUser(null);
          }
        } catch (catchError: unknown) {
          console.error('Profile Effect: CATCH block error calling function:', catchError);
          setUser(null);
        } finally {
          setIsLoading(false); 
        }
      } else if (initialAuthCheckComplete && !session) {
        setUser(null);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session, initialAuthCheckComplete, logout, toast, t]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return;
    } catch (error: unknown) {
      console.error("Login failed:", error);
      // Prefer specific error from Supabase if available, otherwise generic translated one.
      const specificMessage = (error instanceof Error && typeof error === 'object' && error !== null && 'status' in error && (error as { status: number }).status === 400)
                              ? error.message
                              : null;
      const message = specificMessage || t('auth.toast.loginFailed.descriptionDefault'); 
      toast({
        variant: "destructive",
        title: t('auth.toast.loginFailed.title'),
        description: message,
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });
      
      if (error) throw error;
      
      toast({ 
        title: t('auth.toast.registrationSuccess.title'), 
        description: t('auth.toast.registrationSuccess.description') 
      });
      return;

    } catch (error: unknown) {
      console.error("Registration failed:", error);
      const message = error instanceof Error ? error.message : t('auth.toast.registrationFailed.descriptionDefault');
      toast({
        variant: "destructive",
        title: t('auth.toast.registrationFailed.title'),
        description: message,
      });
      throw error;
    }
  };

  const updateUser = async (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'layout_preference'>>) => {
    if (!session || !user) {
      console.error("Update user failed: No session or user");
      throw new Error("Gebruiker niet ingelogd");
    }

    // --- START VALIDATION FOR AI MODE --- 
    if (data.ai_mode_preference && user?.role === 'free' && data.ai_mode_preference !== 'gpt4o') {
      toast({
        variant: "destructive",
        title: t('auth.toast.updateForbidden.title'),
        description: t('auth.toast.updateForbidden.descriptionFreeUserAIMode'),
      });
      // Gooi een error om de rest van de functie te stoppen
      throw new Error("Invalid AI mode preference for free user."); 
    }
    // --- END VALIDATION FOR AI MODE ---

    try {
      // Update auth.users if name changed (optional, consider if email should be updatable too)
      if (data.name !== undefined && data.name !== user?.name) {
          if (data.name !== null) { 
              const { error: updateAuthError } = await supabase.auth.updateUser({ data: { name: data.name } });
              if (updateAuthError) throw updateAuthError; 
          }
      }
      
      // Prepare payload for profiles table update
      const profileUpdatePayload: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'layout_preference'>> = {};
      if (data.name !== undefined) profileUpdatePayload.name = data.name;
      if (data.language_preference !== undefined) profileUpdatePayload.language_preference = data.language_preference;
      if (data.email_notifications_enabled !== undefined) profileUpdatePayload.email_notifications_enabled = data.email_notifications_enabled;
      if (data.ai_mode_preference !== undefined) profileUpdatePayload.ai_mode_preference = data.ai_mode_preference;
      if (data.research_model_preference !== undefined) profileUpdatePayload.research_model_preference = data.research_model_preference;
      if (data.layout_preference !== undefined) profileUpdatePayload.layout_preference = data.layout_preference;

      // Update profiles table if there's anything to update
      if (Object.keys(profileUpdatePayload).length > 0) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update(profileUpdatePayload) // Update using the prepared payload
          .eq('id', session.user.id);
        if (updateProfileError) throw updateProfileError;
      }

      // Update local user state optimistically
      setUser(currentUser => {
          if (!currentUser) return null;
          const updatedUser = { ...currentUser };
          if (data.name !== undefined) updatedUser.name = data.name;
          if (data.language_preference !== undefined) updatedUser.language_preference = data.language_preference;
          if (data.email_notifications_enabled !== undefined) updatedUser.email_notifications_enabled = data.email_notifications_enabled;
          if (data.ai_mode_preference !== undefined) updatedUser.ai_mode_preference = data.ai_mode_preference as AiMode;
          if (data.research_model_preference !== undefined) updatedUser.research_model_preference = data.research_model_preference as ResearchModel;
          if (data.layout_preference !== undefined) updatedUser.layout_preference = data.layout_preference as LayoutPreference;
          return updatedUser;
      });
      
    } catch (error: unknown) {
      // Handle errors (including the validation error thrown above)
      console.error("Update user failed:", error);
      // Don't show generic toast if it was our specific validation error (already shown)
      if (!(error instanceof Error && error.message === "Invalid AI mode preference for free user.")) {
          const message = error instanceof Error ? error.message : t('auth.toast.updateFailed.descriptionDefault');
          toast({ 
            variant: "destructive", 
            title: t('auth.toast.updateFailed.title'), 
            description: message 
          });
      }
      throw error; // Re-throw error for potential higher-level handling
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, session, isLoading, login, logout, register, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
