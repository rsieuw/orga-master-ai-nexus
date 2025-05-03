import { createContext, useContext, useState, useEffect } from "react";
import { User as SupabaseUser, Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client.ts"; // Corrected path
// import { supabase } from "../integrations/supabase/client"; // Use relative path
import { useToast } from "@/hooks/use-toast.ts"; // Corrected path
import { GradientLoader } from "@/components/ui/loader.tsx"; // Corrected path
import { Database } from "@/integrations/supabase/types.ts"; // Corrected path

// This is a placeholder until Supabase integration
// This is a placeholder until Supabase integration
export type UserRole = "admin" | "free" | "paid";

// Update Profile type to include language_preference
type Profile = Database['public']['Tables']['profiles']['Row'] & {
  language_preference?: string | null; // Add explicitly if not in generated types yet
};

// Update UserProfile to include language_preference
export interface UserProfile extends Profile {
  id: string;
  email: string;
  name: string | null; // Allow null for name
  role: UserRole;
  avatar_url: string | null; // Add avatar_url back
  language_preference: string; // Make non-null in context, default to 'nl'
}

interface AuthContextProps {
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

  // Effect voor het luisteren naar auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
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
  }, [supabase, initialAuthCheckComplete]);

  // Effect voor het ophalen van het profiel ZODRA de sessie bekend is NA de initiële check
  useEffect(() => {
    const fetchProfile = async () => {
      if (initialAuthCheckComplete && session?.user) {
        setIsLoading(true); 
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*') // Select all columns, including the new one
            .eq('id', session.user.id)
            .single<Profile>(); // Use updated Profile type
          
          if (error) {
            console.error('Profile Effect: Error fetching profile:', error);
            setUser(null);
          } else if (profile) {
            setUser({
              ...profile,
              email: session.user?.email || '',
              role: profile.role as UserRole || 'free',
              // Set language_preference, default to 'nl' if null/undefined
              language_preference: profile.language_preference || 'nl',
            });
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
  }, [session, initialAuthCheckComplete, supabase]);

  // Keep Supabase login function from HEAD
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // User state is updated via onAuthStateChange listener
      // No need to manually set user/isAuthenticated here
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

  // Keep Supabase logout function from HEAD
  const logout = async () => {
    // Mock implementation until Supabase integration
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // State updates handled by listener
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
      
  // Keep Supabase register function from HEAD
  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            // Add name to user_metadata during signup if needed
            // Note: This usually doesn't automatically create a profile row
            name: name, 
          },
        },
      });
      
      if (error) throw error;
      
      // Suggest user checks email for confirmation
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

  // Update updateUser function
  const updateUser = async (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference'>>) => {
    if (!session?.user) {
      throw new Error("Gebruiker niet ingelogd");
    }

    try {
      const authUpdatePayload: { data?: { name?: string }; email?: string } = {};
      // Update payload type for profiles table
      const profileUpdatePayload: Partial<Pick<Profile, 'name' | 'language_preference'>> = {}; 

      if (data.name !== undefined) {
         // Only include name in auth update if it's not null
         if (data.name !== null) {
           authUpdatePayload.data = { name: data.name };
         }
         // Profile update can handle null
         profileUpdatePayload.name = data.name;
      }

      // Add language_preference to profile update payload if provided
      if (data.language_preference !== undefined) {
          profileUpdatePayload.language_preference = data.language_preference;
      }

      // Update Auth user metadata (only name for now)
      if (authUpdatePayload.data) {
        const { error: updateAuthError } = await supabase.auth.updateUser(authUpdatePayload);
        if (updateAuthError) throw updateAuthError;
      }

      // Update profiles table if there are changes
      if (Object.keys(profileUpdatePayload).length > 0) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update(profileUpdatePayload)
          .eq('id', session.user.id);
        if (updateProfileError) throw updateProfileError;
      }

      // Manually update local user state for immediate feedback
      // Use a functional update to safely access previous state
      setUser(currentUser => {
          if (!currentUser) return null;
          return {
              ...currentUser,
              ...(data.name !== undefined && { name: data.name }), // Update name if present
              ...(data.language_preference !== undefined && { language_preference: data.language_preference }) // Update language if present
          };
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
