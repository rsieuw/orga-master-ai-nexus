import React, { useState, useEffect, useCallback } from "react";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTranslation } from 'react-i18next';
import { 
  UserProfile,
  AiChatMode
} from "@/types/auth.ts";
import { AuthContext } from "./AuthContextDef.tsx";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState<boolean>(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // State for the selected AI chat mode
  const [aiMode, setAiModeState] = useState<AiChatMode>('default');

  const updateUser_internal = useCallback(async (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'research_model_provider' | 'chat_model_provider' | 'layout_preference'>>) => {
    if (!session || !user) {
      throw new Error("User not logged in");
    }

    const currentAiModePreference = data.ai_mode_preference || user.ai_mode_preference;
    if (user?.role === 'free' &&
        (currentAiModePreference === 'creative' ||
         currentAiModePreference === 'precise')) {
      toast({
        title: t('settings.toast.errorSavingAiMode.title'),
        description: t('settings.freeUserPremiumFeature'),
        variant: "destructive",
      });
      // Restore aiMode state to the previous value if the update is not allowed
      // This prevents the UI from optimistically updating to a disallowed mode.
      setAiModeState(user.ai_mode_preference || 'default');
      return;
    }

    try {
      if (data.name !== undefined && data.name !== user?.name) {
          if (data.name !== null) {
              const { error: updateAuthError } = await supabase.auth.updateUser({ data: { name: data.name } });
              if (updateAuthError) throw updateAuthError;
          }
      }

      const profileUpdatePayload: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'research_model_provider' | 'chat_model_provider' | 'layout_preference'>> = {};
      if (data.name !== undefined) profileUpdatePayload.name = data.name;
      if (data.language_preference !== undefined) profileUpdatePayload.language_preference = data.language_preference;
      if (data.email_notifications_enabled !== undefined) profileUpdatePayload.email_notifications_enabled = data.email_notifications_enabled;
      // Ensure ai_mode_preference is updated with AiChatMode type
      if (data.ai_mode_preference !== undefined) profileUpdatePayload.ai_mode_preference = data.ai_mode_preference as AiChatMode;
      if (data.research_model_preference !== undefined) profileUpdatePayload.research_model_preference = data.research_model_preference;
      if (data.research_model_provider !== undefined) profileUpdatePayload.research_model_provider = data.research_model_provider;
      // Safer casting for chat_model_provider
      if (data.chat_model_provider !== undefined) {
        // Check if the value is valid for ChatModelProvider type
        if (data.chat_model_provider === 'perplexity-sonar' || data.chat_model_provider === 'gpt4o-mini') {
          profileUpdatePayload.chat_model_provider = data.chat_model_provider;
        }
      }
      if (data.layout_preference !== undefined) profileUpdatePayload.layout_preference = data.layout_preference;

      if (Object.keys(profileUpdatePayload).length > 0) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update(profileUpdatePayload)
          .eq('id', user.id);
          
        if (updateProfileError) {
          throw updateProfileError;
        }
      }

      setUser(prevUser => {
        const updatedUser = prevUser ? { ...prevUser, ...profileUpdatePayload } as UserProfile : null;
        return updatedUser;
      });
      
      if (data.ai_mode_preference) {
        setAiModeState(data.ai_mode_preference as AiChatMode);
      }

    } catch (error: unknown) {
      toast({
        title: t('auth.toast.updateFailed.title'),
        description: t('auth.toast.updateFailed.descriptionDefault'),
        variant: "destructive",
      });
      // Rollback optimistic update if necessary, or refetch user
      // For now, restore aiModeState if updateUser fails for ai_mode_preference
      if (data.ai_mode_preference && user?.ai_mode_preference) {
        setAiModeState(user.ai_mode_preference);
      }
      throw error;
    }
  }, [session, user, t, toast, setUser, setAiModeState]);

  // Wrapper for setAiMode to also call updateUser for persistence
  const setAiMode = useCallback(async (mode: AiChatMode) => {
    setAiModeState(mode);
    if (user) { // Only update if there is a user
      try {
        await updateUser_internal({ ai_mode_preference: mode });
      } catch (error) {
        // Optional: toast message for the user if saving fails
      }
    }
  }, [user, updateUser_internal]);

  const logout_internal = useCallback(async () => { // Renamed to avoid conflict with exported logout
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
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
            setUser(null);
          } else if (profileData) {
            const fullProfile = profileData as unknown as UserProfile;

            if (fullProfile.status === 'inactive') {
              toast({ 
                variant: "destructive", 
                title: t('auth.toast.accountDeactivated.title'), 
                description: t('auth.toast.accountDeactivated.description')
              });
              await logout_internal(); // use internal version
              setUser(null);
            } else {
              const resolvedProfile = {
                ...fullProfile,
                role: (fullProfile.role === 'admin' || fullProfile.role === 'paid') ? fullProfile.role : 'free',
                layout_preference: fullProfile.layout_preference || '50-50',
                ai_mode_preference: fullProfile.ai_mode_preference || 'default',
              } as UserProfile;
              setUser(resolvedProfile);
              setAiModeState(resolvedProfile.ai_mode_preference); // Set aiMode state based on profile
            }
          } else {
            setUser(null);
          }
        } catch (catchError: unknown) {
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
  }, [session, initialAuthCheckComplete, logout_internal, toast, t]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return;
    } catch (error: unknown) {
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

  const exportedLogout = useCallback(async () => { // Renamed for export
    await logout_internal();
  }, [logout_internal]);

  const register = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });
      
      if (error) throw error;
      
      toast({
        title: t('register.toast.success.title'),
        description: t('register.toast.success.description'),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('auth.toast.registrationFailed.descriptionDefault');
      toast({
        variant: "destructive",
        title: t('auth.toast.registrationFailed.title'),
        description: message,
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location?.origin || 'https://uw-app-url.com'}/reset-password-confirm`,
      });
      
      if (error) throw error;
      
      toast({
        title: t('resetPassword.toast.success.title'),
        description: t('resetPassword.toast.success.description'),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('auth.toast.resetPasswordFailed.descriptionDefault');
      toast({
        variant: "destructive",
        title: t('auth.toast.resetPasswordFailed.title'),
        description: message,
      });
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: t('updatePassword.toast.success.title'),
        description: t('updatePassword.toast.success.description'),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('auth.toast.updatePasswordFailed.descriptionDefault');
      toast({
        variant: "destructive",
        title: t('auth.toast.updatePasswordFailed.title'),
        description: message,
      });
      throw error;
    }
  };

  const updateUser = async (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'research_model_provider' | 'chat_model_provider' | 'layout_preference'>>) => {
    await updateUser_internal(data);
    toast({
      title: t('profile.toast.profileUpdated'),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoading,
        login,
        logout: exportedLogout,
        register,
        resetPassword,
        updatePassword,
        updateUser,
        aiMode,
        setAiMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
