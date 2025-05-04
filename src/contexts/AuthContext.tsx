import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

export type UserRole = "admin" | "paid" | "free";

// Define the possible AI modes as a literal type
export type AiMode = 'gpt4o' | 'creative' | 'precise';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  language_preference: string;
  email_notifications_enabled: boolean;
  ai_mode_preference: AiMode; // Added field using the literal type
  created_at: string;
  updated_at: string;
  status?: string;
  enabled_features: string[];
}

export interface AuthContextProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState<boolean>(false);
  const { toast } = useToast();

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      console.error("Logout failed:", error);
      const message = error instanceof Error ? error.message : "Er is iets misgegaan bij het uitloggen.";
      toast({
        variant: "destructive",
        title: "Uitloggen mislukt",
        description: message,
      });
      throw error;
    }
  }, [toast]);

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
                title: "Account gedeactiveerd", 
                description: "Dit account is momenteel niet actief."
              });
              logout(); 
              setUser(null);
            } else {
              setUser({
                ...fullProfile,
                role: (fullProfile.role === 'admin' || fullProfile.role === 'paid') ? fullProfile.role : 'free'
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
  }, [session, initialAuthCheckComplete, logout, toast]);

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
      const message = error instanceof Error ? error.message : "Controleer je e-mail en wachtwoord.";
      toast({
        variant: "destructive",
        title: "Inloggen mislukt",
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
      
      toast({ title: "Registratie succesvol", description: "Controleer je e-mail om je account te bevestigen." });
      return;

    } catch (error: unknown) {
      console.error("Registration failed:", error);
      const message = error instanceof Error ? error.message : "Er is iets misgegaan bij het registreren.";
      toast({
        variant: "destructive",
        title: "Registratie mislukt",
        description: message,
      });
      throw error;
    }
  };

  const updateUser = async (data: Partial<Pick<UserProfile, 'name' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference'>>) => {
    if (!session?.user) {
      throw new Error("Gebruiker niet ingelogd");
    }

    try {
      if (data.name !== undefined && data.name !== user?.name) {
          if (data.name !== null) { 
              const { error: updateAuthError } = await supabase.auth.updateUser({ data: { name: data.name } });
              if (updateAuthError) throw updateAuthError; 
          }
      }
      
      const profileUpdatePayload: Partial<Pick<UserProfile, 'name' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference'>> = {};
      if (data.name !== undefined) profileUpdatePayload.name = data.name;
      if (data.language_preference !== undefined) profileUpdatePayload.language_preference = data.language_preference;
      if (data.email_notifications_enabled !== undefined) profileUpdatePayload.email_notifications_enabled = data.email_notifications_enabled;
      if (data.ai_mode_preference !== undefined) profileUpdatePayload.ai_mode_preference = data.ai_mode_preference;

      if (Object.keys(profileUpdatePayload).length > 0) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update(profileUpdatePayload)
          .eq('id', session.user.id);
        if (updateProfileError) throw updateProfileError;
      }

      setUser(currentUser => {
          if (!currentUser) return null;
          const updatedUser = { ...currentUser };
          if (data.name !== undefined) updatedUser.name = data.name;
          if (data.language_preference !== undefined) updatedUser.language_preference = data.language_preference;
          if (data.email_notifications_enabled !== undefined) updatedUser.email_notifications_enabled = data.email_notifications_enabled;
          if (data.ai_mode_preference !== undefined) updatedUser.ai_mode_preference = data.ai_mode_preference as AiMode;
          return updatedUser;
      });
      
    } catch (error: unknown) {
      console.error("Update user failed:", error);
      const message = error instanceof Error ? error.message : "Er is iets misgegaan bij het bijwerken.";
      toast({ variant: "destructive", title: "Account bijwerken mislukt", description: message });
      throw error;
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
