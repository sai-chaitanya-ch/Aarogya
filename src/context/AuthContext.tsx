import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserProfile, Language } from '../types';

export type UserRole = 'patient' | 'doctor';

export const emptyUserProfile: UserProfile = {
  id: '',
  name: '',
  dob: '',
  age: 0,
  gender: 'other',
  bloodGroup: '',
  location: '',
  phone: '',
  emergencyContact: '',
  allergies: [],
  conditions: [],
  preferredLanguage: 'en',
  abhaLinked: false,
};

export const AAROGYA_STORAGE_KEYS = [
  'aarogya_user_profile',
  'aarogya_user_role',
  'aarogya_records',
  'aarogya_reminders',
  'aarogya_appointments'
];

export function clearAarogyaStorage() {
  AAROGYA_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  isConfigured: boolean;
  configError: string | null;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  updateUserProfile: (updated: Partial<UserProfile>) => Promise<void>;
  signInWithEmail: (email: string, password: string, selectedRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string, selectedRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('patient');
  const [user, setUser] = useState<UserProfile>(emptyUserProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [configError, _setConfigError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Supabase configuration missing. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );

  const fetchSupabaseProfile = async (userId: string, fallbackName?: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUser({
          id: data.id,
          name: data.full_name || fallbackName || 'Patient',
          dob: data.dob || '',
          age: data.dob ? Math.floor((Date.now() - new Date(data.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
          gender: (data.gender as 'male' | 'female' | 'other') || 'other',
          bloodGroup: data.blood_group || '',
          location: data.location || '',
          phone: data.phone || '',
          emergencyContact: data.emergency_contact || '',
          allergies: data.allergies || [],
          conditions: data.conditions || [],
          preferredLanguage: (data.preferred_language as Language) || 'en',
          abhaLinked: false
        });
      } else {
        // If row doesn't exist yet, construct base profile from auth user
        const newProfile: UserProfile = {
          ...emptyUserProfile,
          id: userId,
          name: fallbackName || 'User'
        };
        setUser(newProfile);
        // Attempt to create the profile row
        await supabase.from('profiles').insert({
          id: userId,
          full_name: newProfile.name,
          preferred_language: 'en'
        }).select().single();
      }
    } catch (e) {
      console.warn('Failed to fetch profile from Supabase:', e);
    }
  };

  // Listen to live Supabase Auth state changes and restore session
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setUser(emptyUserProfile);
      return;
    }

    let isMounted = true;

    // Check active session on initial load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('Session check error:', error.message);
      }
      if (session?.user) {
        setIsAuthenticated(true);
        fetchSupabaseProfile(
          session.user.id,
          session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        ).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsAuthenticated(false);
        setUser(emptyUserProfile);
        setIsLoading(false);
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setIsAuthenticated(true);
        await fetchSupabaseProfile(
          session.user.id,
          session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
        );
      } else {
        setIsAuthenticated(false);
        setUser(emptyUserProfile);
        clearAarogyaStorage();
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser(prev => {
      const next = { ...prev, ...updated };
      return next;
    });

    // Sync to Supabase if connected
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: updated.name ?? user.name,
          blood_group: updated.bloodGroup ?? user.bloodGroup,
          phone: updated.phone ?? user.phone,
          location: updated.location ?? user.location,
          emergency_contact: updated.emergencyContact ?? user.emergencyContact,
          preferred_language: updated.preferredLanguage ?? user.preferredLanguage,
          allergies: updated.allergies ?? user.allergies,
          conditions: updated.conditions ?? user.conditions,
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Error saving profile to Supabase:', err);
      }
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const signInWithEmail = async (email: string, password: string, selectedRole: UserRole) => {
    if (!supabase) {
      return {
        success: false,
        error: 'Database service is unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (error) return { success: false, error: error.message };
      if (data.user) {
        setIsAuthenticated(true);
        setRoleState(selectedRole);
        await fetchSupabaseProfile(data.user.id, data.user.user_metadata?.full_name);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
    setIsLoading(false);
    return { success: false, error: 'Unknown login error' };
  };

  const signUpWithEmail = async (email: string, password: string, name: string, selectedRole: UserRole) => {
    if (!supabase) {
      return {
        success: false,
        error: 'Database service is unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      };
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role: selectedRole } }
      });
      setIsLoading(false);
      if (error) return { success: false, error: error.message };
      if (data.user) {
        setIsAuthenticated(true);
        setRoleState(selectedRole);
        // Create initial profile row
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: name,
            preferred_language: 'en'
          });
        } catch (e) {
          console.warn('Could not upsert profile on signup:', e);
        }
        await fetchSupabaseProfile(data.user.id, name);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
    setIsLoading(false);
    return { success: false, error: 'Unknown registration error' };
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured.' };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google sign-in failed' };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('SignOut error:', e);
      }
    }
    // Purge in-memory state and Aarogya-specific cached data
    clearAarogyaStorage();
    setIsAuthenticated(false);
    setUser(emptyUserProfile);
    setRoleState('patient');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isConfigured: isSupabaseConfigured,
        configError,
        isLoading,
        setRole,
        updateUserProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
