import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { UserProfile, Language } from '../types';
import { initialUserProfile } from '../data/mockData';

export type UserRole = 'patient' | 'doctor';

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  isGuestDemo: boolean;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  updateUserProfile: (updated: Partial<UserProfile>) => Promise<void>;
  signInWithEmail: (email: string, password: string, selectedRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string, selectedRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: (selectedRole?: UserRole) => void;
}

const LOCAL_STORAGE_USER_KEY = 'aarogya_user_profile';
const LOCAL_STORAGE_ROLE_KEY = 'aarogya_user_role';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_ROLE_KEY) as UserRole) || 'patient';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialUserProfile;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isGuestDemo, setIsGuestDemo] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ROLE_KEY, role);
  }, [role]);

  // Listen to live Supabase Auth state changes if Supabase is connected
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setIsGuestDemo(false);
        fetchSupabaseProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setIsGuestDemo(false);
        fetchSupabaseProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const fetchSupabaseProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUser(prev => ({
          ...prev,
          id: data.id,
          name: data.full_name || prev.name,
          bloodGroup: data.blood_group || prev.bloodGroup,
          location: data.location || prev.location,
          phone: data.phone || prev.phone,
          allergies: data.allergies || prev.allergies,
          conditions: data.conditions || prev.conditions,
          preferredLanguage: (data.preferred_language as Language) || prev.preferredLanguage
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch profile from Supabase:', e);
    }
  };

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser(prev => {
      const next = { ...prev, ...updated };
      return next;
    });

    // Sync to Supabase if connected
    if (supabase && !isGuestDemo) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await supabase.from('profiles').upsert({
            id: authUser.id,
            full_name: updated.name || user.name,
            blood_group: updated.bloodGroup || user.bloodGroup,
            phone: updated.phone || user.phone,
            location: updated.location || user.location,
            preferred_language: updated.preferredLanguage || user.preferredLanguage,
            allergies: updated.allergies || user.allergies,
            conditions: updated.conditions || user.conditions,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Error saving profile to Supabase:', err);
      }
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const signInWithEmail = async (email: string, password: string, selectedRole: UserRole) => {
    setIsLoading(true);
    if (!supabase) {
      // Local simulated login
      setIsAuthenticated(true);
      setIsGuestDemo(false);
      setRoleState(selectedRole);
      setIsLoading(false);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setIsLoading(false);
      if (error) return { success: false, error: error.message };
      if (data.user) {
        setIsAuthenticated(true);
        setIsGuestDemo(false);
        setRoleState(selectedRole);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
    return { success: false, error: 'Unknown login error' };
  };

  const signUpWithEmail = async (email: string, password: string, name: string, selectedRole: UserRole) => {
    setIsLoading(true);
    if (!supabase) {
      // Local simulated signup
      setIsAuthenticated(true);
      setIsGuestDemo(false);
      setUser(prev => ({ ...prev, name }));
      setRoleState(selectedRole);
      setIsLoading(false);
      return { success: true };
    }

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
        setIsGuestDemo(false);
        setUser(prev => ({ ...prev, name }));
        setRoleState(selectedRole);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
    return { success: false, error: 'Unknown registration error' };
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      setIsAuthenticated(true);
      setIsGuestDemo(false);
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setIsGuestDemo(true);
  };

  const continueAsGuest = (selectedRole: UserRole = 'patient') => {
    setIsAuthenticated(true);
    setIsGuestDemo(true);
    setRoleState(selectedRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isGuestDemo,
        isLoading,
        setRole,
        updateUserProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        continueAsGuest
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
