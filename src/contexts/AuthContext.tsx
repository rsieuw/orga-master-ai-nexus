import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

export type UserRole = "admin" | "paid" | "free";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  language_preference: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

interface FetchedProfileData {
    id: string;
    name: string | null;
    role: string | null;
    avatar_url: string | null;
    language_preference: string | null;
    created_at: string;
    updated_at: string;
    status?: string;
}

export interface AuthContextProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference'>>) => Promise<void>;
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
            .from('profiles')
            .select('id, name, role, avatar_url, language_preference, created_at, updated_at, status')
            .eq('id', session.user.id)
            .single<FetchedProfileData>();
          
          if (error) {
            console.error('Profile Effect: Error fetching profile:', error);
            setUser(null);
          } else if (profileData) {
            if (profileData.status === 'inactive') {
              console.warn('User is inactive, logging out.');
              logout(); 
              setUser(null);
            } else {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profileData.name,
                role: (profileData.role === 'admin' || profileData.role === 'paid') ? profileData.role : 'free',
                avatar_url: profileData.avatar_url,
                language_preference: profileData.language_preference || 'nl',
                created_at: profileData.created_at,
                updated_at: profileData.updated_at,
                status: profileData.status || 'active'
              });
            }
          } else {
            console.warn('Profile Effect: Profile not found for user:', session.user?.id);
            setUser(null);
          }
        } catch (catchError: unknown) {
          console.error('Profile Effect: CATCH block error fetching profile:', catchError);
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

  const updateUser = async (data: Partial<Pick<UserProfile, 'name' | 'language_preference'>>) => {
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
      
      const profileUpdatePayload: Partial<Pick<FetchedProfileData, 'name' | 'language_preference'>> = {};
      if (data.name !== undefined) profileUpdatePayload.name = data.name;
      if (data.language_preference !== undefined) profileUpdatePayload.language_preference = data.language_preference;

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
