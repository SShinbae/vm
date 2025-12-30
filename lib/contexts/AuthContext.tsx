import { Session, User } from "@supabase/supabase-js";
import Constants from "expo-constants";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { supabase } from "../../services/supabaseClient";
import { AuthState, AuthUser, Profile } from "../../types";
import { initializeOneSignalLazy } from "../services/oneSignalLazy";
import { oneSignalService } from "../services/oneSignalService";

interface AuthContextType extends AuthState {
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (
    updates: Partial<Profile>,
  ) => Promise<{ error: string | null }>;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const isPasswordRecoveryRef = useRef(false);

  const clearPasswordRecovery = () => {
    isPasswordRecoveryRef.current = false;
    setIsPasswordRecovery(false);
  };

  const fetchUserProfile = useCallback(
    async (user: User): Promise<AuthUser | null> => {
      try {
        // Add timeout to prevent hanging on slow database queries
        const timeoutPromise = new Promise<{
          data: Profile | null;
          error: any;
        }>((resolve) => {
          setTimeout(
            () =>
              resolve({
                data: null,
                error: { message: "Profile fetch timeout" },
              }),
            3000,
          );
        });

        const profilePromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const { data: profile, error } = await Promise.race([
          profilePromise,
          timeoutPromise,
        ]);

        if (error && error.code !== "PGRST116") {
          if (__DEV__) {
            console.error("Error fetching user profile:", error);
          }
          return { id: user.id, email: user.email || "", username: null };
        }

        return {
          id: user.id,
          email: user.email || "",
          profile: profile || undefined,
          username: profile?.username || null,
        };
      } catch (error) {
        if (__DEV__) {
          console.error("Error in fetchUserProfile:", error);
        }
        return { id: user.id, email: user.email || "", username: null };
      }
    },
    [],
  );

  const setUser = useCallback(
    async (session: Session | null) => {
      try {
        if (session?.user) {
          // Check if email is confirmed - don't authenticate unconfirmed users
          const isEmailConfirmed = session.user.email_confirmed_at != null;

          if (!isEmailConfirmed) {
            if (__DEV__) {
              console.log(
                "User email not confirmed, not setting authenticated state",
              );
            }
            setState((prev) => ({ ...prev, user: null, loading: false }));
            return;
          }

          const authUser = await fetchUserProfile(session.user);
          setState((prev) => ({ ...prev, user: authUser, loading: false }));
        } else {
          setState((prev) => ({ ...prev, user: null, loading: false }));
        }
      } catch (error) {
        if (__DEV__) {
          console.error("Error setting user:", error);
        }
        // Fallback to basic user info if profile fetch fails
        if (session?.user) {
          // Also check email confirmation in fallback
          const isEmailConfirmed = session.user.email_confirmed_at != null;
          if (!isEmailConfirmed) {
            setState((prev) => ({ ...prev, user: null, loading: false }));
            return;
          }

          setState((prev) => ({
            ...prev,
            user: {
              id: session.user.id,
              email: session.user.email || "",
              username: null,
            },
            loading: false,
          }));
        } else {
          setState((prev) => ({ ...prev, user: null, loading: false }));
        }
      }
    },
    [fetchUserProfile],
  );

  useEffect(() => {
    let mounted = true;

    // Initialize immediately - optimized for web performance
    (async () => {
      try {
        // Mark as initialized early to prevent loading screen flash
        // We'll update with real data as it comes in
        setState((prev) => ({ ...prev, initialized: true }));

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error && __DEV__) {
          console.error("Error getting session:", error);
        }

        if (__DEV__ && session) {
          console.log("Session restored successfully:", {
            userId: session.user.id,
            email: session.user.email,
            expiresAt: session.expires_at,
          });
        }

        // If we have a session, set basic user info immediately
        // Then fetch full profile in background
        if (session?.user) {
          const isEmailConfirmed = session.user.email_confirmed_at != null;

          if (isEmailConfirmed) {
            // Set basic user info immediately to prevent redirect
            setState((prev) => ({
              ...prev,
              user: {
                id: session.user.id,
                email: session.user.email || "",
                username: null,
              },
              loading: false,
            }));

            // Fetch full profile in background and update when ready
            // This doesn't block the UI
            fetchUserProfile(session.user)
              .then((authUser) => {
                if (mounted && authUser) {
                  setState((prev) => ({
                    ...prev,
                    user: authUser,
                  }));
                }
              })
              .catch((err) => {
                if (__DEV__) {
                  console.error("Error fetching profile in background:", err);
                }
              });
          } else {
            // Email not confirmed, no user
            setState((prev) => ({
              ...prev,
              user: null,
              loading: false,
            }));
          }
        } else {
          // No session
          setState((prev) => ({
            ...prev,
            user: null,
            loading: false,
          }));
        }
      } catch (err) {
        if (__DEV__) {
          console.error("Failed to get session:", err);
        }
        if (mounted) {
          setState((prev) => ({
            ...prev,
            user: null,
            loading: false,
          }));
        }
      }
    })();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (__DEV__) {
          console.log(
            "Auth state change:",
            event,
            "isPasswordRecovery:",
            isPasswordRecoveryRef.current,
          );
        }

        if (event === "PASSWORD_RECOVERY") {
          // User clicked password reset link - set recovery mode
          if (__DEV__) {
            console.log("Password recovery mode detected");
          }
          isPasswordRecoveryRef.current = true;
          setIsPasswordRecovery(true);
          // Set minimal user state for password update, but don't fetch profile
          // This prevents dashboard from loading data
          if (session?.user) {
            setState((prev) => ({
              ...prev,
              user: {
                id: session.user.id,
                email: session.user.email || "",
                username: null,
              },
              loading: false,
            }));
          }
        } else if (event === "SIGNED_OUT") {
          setState((prev) => ({ ...prev, user: null, loading: false }));
          isPasswordRecoveryRef.current = false;
          setIsPasswordRecovery(false);
        } else if (event === "USER_UPDATED") {
          // User updated (e.g., password changed) - don't refetch profile during recovery
          // The updatePassword function will handle clearing recovery state
          if (__DEV__) {
            console.log("User updated event, skipping profile refetch");
          }
        } else if (session && !isPasswordRecoveryRef.current) {
          // Only set full user if not in password recovery mode
          await setUser(session);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - setUser and fetchUserProfile are stable via useCallback

  const signUp = async (email: string, password: string, fullName?: string) => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const siteUrl = Constants.expoConfig?.extra?.siteUrl;
      const emailRedirectUrl = `${siteUrl}/auth/confirm`;

      // Enhanced debug logging (only in development)
      if (__DEV__) {
        console.log("=== SIGNUP DEBUG INFO ===");
        console.log("Email confirmation URL:", emailRedirectUrl);
        console.log(
          "Site URL from config:",
          Constants.expoConfig?.extra?.siteUrl,
        );
        console.log("Full signup data:", { email, fullName });
        console.log("========================");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirectUrl,
          data: {
            full_name: fullName || "",
          },
        },
      });

      if (__DEV__) {
        console.log("Signup result:", { data, error });
        console.log("User email_confirmed_at:", data?.user?.email_confirmed_at);
        console.log("Session exists:", !!data?.session);
      }

      if (error) {
        if (__DEV__) {
          console.error("Signup error:", error);
        }
        setState((prev) => ({ ...prev, loading: false }));
        return { error: error.message };
      }

      // Check if email confirmation is required
      // If user has no email_confirmed_at and no session, confirmation is needed
      // If user is auto-confirmed, they'll have email_confirmed_at set immediately
      const needsEmailConfirmation = !data?.user?.email_confirmed_at;

      if (__DEV__) {
        console.log("Needs email confirmation:", needsEmailConfirmation);
      }

      // Sign out immediately to prevent auto-login for unconfirmed users
      // This ensures the onAuthStateChange listener doesn't pick up the session
      if (needsEmailConfirmation && data?.session) {
        if (__DEV__) {
          console.log("Signing out to prevent auto-login for unconfirmed user");
        }
        await supabase.auth.signOut();
      }

      if (__DEV__) {
        console.log(
          "Signup successful, user should receive email confirmation",
        );
      }
      setState((prev) => ({ ...prev, loading: false }));
      return { error: null };
    } catch (error) {
      if (__DEV__) {
        console.error("Unexpected signup error:", error);
      }
      setState((prev) => ({ ...prev, loading: false }));
      return { error: "An unexpected error occurred during sign up" };
    }
  };

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (__DEV__) {
          console.error("Sign in error:", error);
        }
        setState((prev) => ({ ...prev, loading: false }));
        // Make error message more user-friendly
        let errorMessage = error.message;
        if (error.message === "Invalid login credentials") {
          errorMessage =
            "Invalid email or password. Please check your credentials and try again.";
        }
        return { error: errorMessage };
      }

      // Initialize and sync user with OneSignal for push notifications (mobile only)
      // Deferred initialization to prevent blocking initial app load
      if (Platform.OS !== "web") {
        initializeOneSignalLazy().then(() => {
          oneSignalService.syncUser();
        });
      }

      // Success - state will be updated by onAuthStateChange
      return { error: null };
    } catch (error) {
      if (__DEV__) {
        console.error("Unexpected sign in error:", error);
      }
      setState((prev) => ({ ...prev, loading: false }));
      return { error: "An unexpected error occurred during sign in" };
    }
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      // Clear OneSignal user on logout (mobile only)
      if (Platform.OS !== "web") {
        await oneSignalService.onLogout();
      }

      await supabase.auth.signOut();
    } catch (error) {
      if (__DEV__) {
        console.error("Error signing out:", error);
      }
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const siteUrl = Constants.expoConfig?.extra?.siteUrl;
      const resetPasswordUrl = `${siteUrl}/reset-password`;

      // Debug logging to ensure correct URL is being used
      if (__DEV__) {
        console.log("Reset password URL:", resetPasswordUrl);
        console.log(
          "Site URL from config:",
          Constants.expoConfig?.extra?.siteUrl,
        );
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetPasswordUrl,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch {
      return { error: "An unexpected error occurred during password reset" };
    }
  };

  const updatePassword = async (password: string) => {
    if (__DEV__) {
      console.log("updatePassword called");
    }

    const result = await supabase.auth.updateUser({ password });

    if (__DEV__) {
      console.log("updatePassword result:", result);
    }

    if (result.error) {
      return { error: result.error.message };
    }

    return { error: null };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) {
      return { error: "No user logged in" };
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase.from("profiles") as any)
        .update(updateData)
        .eq("id", state.user.id);

      if (error) {
        setState((prev) => ({ ...prev, loading: false }));
        return { error: error.message };
      }

      // Refresh user data
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        await setUser(session.session);
      }

      return { error: null };
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
      return { error: "An unexpected error occurred during profile update" };
    }
  };

  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isPasswordRecovery,
    clearPasswordRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
