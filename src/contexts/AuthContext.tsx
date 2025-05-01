import { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GradientLoader } from "@/components/ui/loader";

export type UserRole = "admin" | "free" | "paid";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (data: { name?: string; email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setIsAuthenticated(!!currentSession);
        
        if (currentSession?.user) {
          // Defer Supabase calls with setTimeout to prevent recursion
          setTimeout(async () => {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
              
            if (error) {
              console.error('Error fetching user profile:', error);
              return;
            }
            
            if (profile) {
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: profile.name,
                role: profile.role as UserRole || 'free',
                avatar_url: profile.avatar_url
              });
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsAuthenticated(!!currentSession);
      
      if (currentSession?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error('Error fetching user profile:', error);
              return;
            }
            
            if (profile) {
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                name: profile.name,
                role: profile.role as UserRole || 'free',
                avatar_url: profile.avatar_url
              });
            }
          });
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
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

  const logout = async () => {
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
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });
      
      if (error) throw error;
      
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

  const updateUser = async (data: { name?: string; email?: string }) => {
    if (!session?.user) {
      throw new Error("Gebruiker niet ingelogd");
    }

    try {
      // Update user_metadata in Supabase Auth
      const { data: updatedUserData, error: updateAuthError } = await supabase.auth.updateUser({
        data: { name: data.name }, // Only update metadata we want to change
        // Note: Updating email requires verification, handle separately if needed
      });

      if (updateAuthError) throw updateAuthError;

      // Update the corresponding profile in the 'profiles' table
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ name: data.name })
        .eq('id', session.user.id);

      if (updateProfileError) throw updateProfileError;

      // Refresh local user state with updated data
      if (updatedUserData?.user && user) {
        setUser({
          ...user,
          name: updatedUserData.user.user_metadata.name || user.name,
          // Assuming email update is handled elsewhere or requires verification
        });
      }
      
    } catch (error: unknown) {
      console.error("Update user failed:", error);
      const message = error instanceof Error ? error.message : "Er is iets misgegaan bij het bijwerken van je gegevens.";
      toast({
        variant: "destructive",
        title: "Account bijwerken mislukt",
        description: message,
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <GradientLoader size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, session, login, logout, register, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
