import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { supabase } from '../../services/supabaseClient';
import { AuthState, AuthUser, Profile } from '../../types';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false,
  });

  const fetchUserProfile = async (user: User): Promise<AuthUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return { id: user.id, email: user.email || '' };
      }

      return {
        id: user.id,
        email: user.email || '',
        profile: profile || undefined,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return { id: user.id, email: user.email || '' };
    }
  };

  const setUser = async (session: Session | null) => {
    if (session?.user) {
      const authUser = await fetchUserProfile(session.user);
      setState(prev => ({ ...prev, user: authUser, loading: false }));
    } else {
      setState(prev => ({ ...prev, user: null, loading: false }));
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      if (mounted) {
        setUser(session);
        setState(prev => ({ ...prev, initialized: true }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          if (event === 'SIGNED_OUT') {
            setState(prev => ({ ...prev, user: null, loading: false }));
          } else if (session) {
            await setUser(session);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const siteUrl = Constants.expoConfig?.extra?.siteUrl || 'http://localhost:3000';
      const emailRedirectUrl = `${siteUrl}/auth/confirm`;

      // Debug logging to ensure correct URL is being used
      console.log('Email confirmation URL:', emailRedirectUrl);
      console.log('Site URL from config:', Constants.expoConfig?.extra?.siteUrl);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirectUrl,
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { error: error.message };
      }

      setState(prev => ({ ...prev, loading: false }));
      return { error: null };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: 'An unexpected error occurred during sign up' };
    }
  };

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: 'An unexpected error occurred during sign in' };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const siteUrl = Constants.expoConfig?.extra?.siteUrl || 'http://localhost:3000';
      const resetPasswordUrl = `${siteUrl}/reset-password`;

      // Debug logging to ensure correct URL is being used
      console.log('Reset password URL:', resetPasswordUrl);
      console.log('Site URL from config:', Constants.expoConfig?.extra?.siteUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetPasswordUrl,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred during password reset' };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) {
      return { error: 'No user logged in' };
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user.id);

      if (error) {
        setState(prev => ({ ...prev, loading: false }));
        return { error: error.message };
      }

      // Refresh user data
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        await setUser(session.session);
      }

      return { error: null };
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return { error: 'An unexpected error occurred during profile update' };
    }
  };

  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}