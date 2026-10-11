import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserProfile, Language } from '../types';
import { calculateAgeFromDob } from '../utils/dateUtils';
import { DEMO_PATIENT_PROFILE, DEMO_DOCTOR_PROFILE } from '../demo/demoFixtures';

export type UserRole = 'patient' | 'doctor';

export const OAUTH_INTENT_KEY = 'aarogya_oauth_signup_intent';
export const DEMO_PERSONA_KEY = 'aarogya_demo_persona';

export interface OAuthSignupIntent {
  role: UserRole;
  mode: 'signin' | 'signup';
  timestamp: number;
}

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
  try {
    sessionStorage.removeItem(DEMO_PERSONA_KEY);
  } catch {}
}

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isDoctorAccount: boolean;
  isDoctorVerified: boolean;
  isAuthenticated: boolean;
  isDemoSession: boolean;
  isConfigured: boolean;
  configError: string | null;
  authNotice: string | null;
  authError: string | null;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  clearAuthNotice: () => void;
  clearAuthError: () => void;
  startDemoSession: (role: UserRole, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updated: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, password: string, selectedRole?: UserRole, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string, selectedRole: UserRole, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordForEmail: (email: string, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (selectedRole?: UserRole, authMode?: 'signin' | 'signup') => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('patient');
  const [isDoctorAccount, setIsDoctorAccount] = useState<boolean>(false);
  const [isDoctorVerified, setIsDoctorVerified] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile>(emptyUserProfile);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoSession, setIsDemoSession] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [configError, _setConfigError] = useState<string | null>(
    isSupabaseConfigured ? null : 'Supabase configuration missing. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );

  const clearAuthNotice = () => setAuthNotice(null);
  const clearAuthError = () => setAuthError(null);

  const resolveAccountRoleAndProfile = async (
    userId: string, 
    authUser?: any,
    requestedRole?: UserRole
  ) => {
    if (!supabase) return;

    // Check if the authenticated user is genuinely an anonymous demo session
    // Strict requirement: Trust authenticated user's is_anonymous property, not client metadata alone!
    const isAnonymous = Boolean(authUser?.is_anonymous);

    if (isAnonymous) {
      setIsDemoSession(true);

      // Determine persona: requested role or stored session persona, default 'patient'
      let storedPersona: UserRole | null = null;
      try {
        storedPersona = sessionStorage.getItem(DEMO_PERSONA_KEY) as UserRole | null;
      } catch {}

      const effectiveDemoRole: UserRole = requestedRole || (storedPersona === 'doctor' ? 'doctor' : 'patient');
      try {
        sessionStorage.setItem(DEMO_PERSONA_KEY, effectiveDemoRole);
      } catch {}

      if (effectiveDemoRole === 'doctor') {
        setIsDoctorAccount(true);
        setIsDoctorVerified(false); // Doctor demo users may enter Doctor Portal, but must always remain unverified!
        setRoleState('doctor');
        localStorage.setItem('aarogya_user_role', 'doctor');
        setUser({
          ...DEMO_DOCTOR_PROFILE,
          id: userId
        });
      } else {
        setIsDoctorAccount(false);
        setIsDoctorVerified(false);
        setRoleState('patient');
        localStorage.setItem('aarogya_user_role', 'patient');
        setUser({
          ...DEMO_PATIENT_PROFILE,
          id: userId
        });
      }

      setIsAuthenticated(true);
      return;
    }

    // Normal non-anonymous user: clear demo session state
    setIsDemoSession(false);
    try {
      sessionStorage.removeItem(DEMO_PERSONA_KEY);
    } catch {}

    try {
      // 1. Consume pending OAuth intent if present (< 10 minutes old)
      let oauthIntent: OAuthSignupIntent | null = null;
      try {
        const storedIntent = sessionStorage.getItem(OAUTH_INTENT_KEY);
        if (storedIntent) {
          sessionStorage.removeItem(OAUTH_INTENT_KEY);
          const parsed = JSON.parse(storedIntent) as OAuthSignupIntent;
          const TEN_MINUTES_MS = 10 * 60 * 1000;
          if (parsed && parsed.role && parsed.timestamp && (Date.now() - parsed.timestamp) < TEN_MINUTES_MS) {
            oauthIntent = parsed;
          }
        }
      } catch (intentErr) {
        console.warn('Could not parse OAuth intent from sessionStorage:', intentErr);
        try {
          sessionStorage.removeItem(OAUTH_INTENT_KEY);
        } catch {}
      }

      // Check existing accounts in database
      const { data: existingDocProfile } = await supabase
        .from('doctor_profiles')
        .select('id, is_verified')
        .eq('id', userId)
        .maybeSingle();

      const { data: existingPatientProfile, error: _patientProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const createdAtTimestamp = authUser?.created_at ? new Date(authUser.created_at).getTime() : 0;
      const isNewAccount = createdAtTimestamp > 0 && 
        (Date.now() - createdAtTimestamp) < 5 * 60 * 1000 && 
        !existingDocProfile && 
        !existingPatientProfile;

      // Handle OAuth intent for newly registered accounts
      // Note: Existing accounts never receive automatic role assignment; their existing database role is retained.
      if (oauthIntent && oauthIntent.mode === 'signup') {
        if (isNewAccount) {
          if (oauthIntent.role === 'doctor') {
            try {
              const docName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Doctor';
              const { error: insertDocError } = await supabase.from('doctor_profiles').insert({
                id: userId,
                full_name: docName.startsWith('Dr.') ? docName : `Dr. ${docName}`,
                qualifications: 'Pending Verification (No Credentials Verified)',
                specialty: 'General Practice (Unverified)',
                registration_number: `UNVERIFIED-${userId.slice(0, 8).toUpperCase()}`,
                clinic_name: 'Unverified Practice (Pending Review)',
                clinic_address: 'Verification in progress',
                is_verified: false
              });

              if (insertDocError) {
                console.error('Failed to create doctor profile for new OAuth signup:', insertDocError);
                setAuthError(`Doctor profile creation failed: ${insertDocError.message}. Defaulted to patient.`);
              }
            } catch (err: any) {
              console.error('Exception during doctor profile creation:', err);
              setAuthError(`Doctor profile initialization error: ${err.message || 'Unknown error'}`);
            }
          }
        } else {
          // Returning account with conflicting role selection
          const existingAccountRole: UserRole = existingDocProfile ? 'doctor' : 'patient';
          if (oauthIntent.role !== existingAccountRole) {
            setAuthNotice(`This account is already registered as a ${existingAccountRole}. Your existing role was retained.`);
          }
        }
      }

      // Re-fetch doctor status following any potential creation/linking above
      let isDoc = false;
      let isVerified = false;

      try {
        const { data: docData } = await supabase
          .from('doctor_profiles')
          .select('id, is_verified')
          .eq('id', userId)
          .maybeSingle();

        if (docData) {
          isDoc = true;
          isVerified = Boolean(docData.is_verified);
        }
      } catch (err) {
        console.warn('Could not query doctor_profiles:', err);
      }

      const metaRole = authUser?.user_metadata?.role;
      if (!isDoc && metaRole === 'doctor') {
        isDoc = true;
        isVerified = false;
      }

      // Fetch or initialize patient profile (all users have a profile row)
      const { data: refreshedProfile, error: refreshedProfileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (refreshedProfile && !refreshedProfileErr) {
        const calculatedAge = calculateAgeFromDob(refreshedProfile.dob);
        setUser({
          id: refreshedProfile.id,
          name: refreshedProfile.full_name || authUser?.user_metadata?.full_name || (isDoc ? 'Doctor' : 'Patient'),
          dob: refreshedProfile.dob || '',
          age: calculatedAge ?? 0,
          gender: (refreshedProfile.gender as 'male' | 'female' | 'other') || 'other',
          bloodGroup: refreshedProfile.blood_group || '',
          location: refreshedProfile.location || '',
          phone: refreshedProfile.phone || '',
          emergencyContact: refreshedProfile.emergency_contact || '',
          allergies: Array.isArray(refreshedProfile.allergies) ? refreshedProfile.allergies : [],
          conditions: Array.isArray(refreshedProfile.conditions) ? refreshedProfile.conditions : [],
          preferredLanguage: (refreshedProfile.preferred_language as Language) || 'en',
          abhaLinked: false
        });
      } else {
        const fallbackName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || (isDoc ? 'Doctor' : 'Patient');
        const newProfile: UserProfile = {
          ...emptyUserProfile,
          id: userId,
          name: fallbackName
        };
        setUser(newProfile);
        try {
          await supabase.from('profiles').insert({
            id: userId,
            full_name: newProfile.name,
            preferred_language: 'en'
          }).select().single();
        } catch (insertErr) {
          console.warn('Could not insert fallback profiles row:', insertErr);
        }
      }

      setIsDoctorAccount(isDoc);
      setIsDoctorVerified(isVerified);

      // Determine active workspace:
      // Priority 1: Explicit requested role from the current login/OAuth attempt
      // Priority 2: Stored browser preference ONLY IF authorized as doctor
      // Priority 3: Default role: 'doctor' if isDoc, otherwise 'patient'
      const explicitRole = requestedRole || (oauthIntent ? oauthIntent.role : undefined);

      let targetRole: UserRole = 'patient';

      if (isDoc) {
        if (explicitRole === 'doctor') {
          targetRole = 'doctor';
        } else if (explicitRole === 'patient') {
          targetRole = 'patient';
          setAuthNotice('Signed in with Patient view. You can switch to Doctor Workspace anytime.');
        } else {
          // No explicit request during this login, check cached preference
          const cachedRole = localStorage.getItem('aarogya_user_role');
          targetRole = cachedRole === 'patient' ? 'patient' : 'doctor';
        }
      } else {
        // Patient account: strictly patient workspace only, regardless of requestedRole or cached values
        targetRole = 'patient';
        if (explicitRole === 'doctor') {
          setAuthNotice(prev => prev || 'This account is registered as a patient. Patient workspace has been loaded.');
        }
      }

      setRoleState(targetRole);
      localStorage.setItem('aarogya_user_role', targetRole);
    } catch (e: any) {
      console.warn('Failed to resolve profile from Supabase:', e);
      setAuthError(`Profile resolution error: ${e?.message || 'Unknown error'}`);
    }
  };

  // Listen to live Supabase Auth state changes and restore session
  useEffect(() => {
    // Check URL parameters and hash for OAuth callbacks or errors
    if (typeof window !== 'undefined') {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const searchParams = new URLSearchParams(window.location.search);
        
        const oauthErrorDesc = hashParams.get('error_description') || searchParams.get('error_description');
        const oauthErrorCode = hashParams.get('error_code') || searchParams.get('error_code') || hashParams.get('error') || searchParams.get('error');

        if (oauthErrorCode || oauthErrorDesc) {
          const userFriendlyError = oauthErrorDesc || `Authentication failed: ${oauthErrorCode}`;
          setAuthError(userFriendlyError.replace(/\+/g, ' '));
          
          // Clear any stale OAuth intent on callback error or cancellation
          try {
            sessionStorage.removeItem(OAUTH_INTENT_KEY);
          } catch {}

          // Clean URL without triggering page refresh
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (urlErr) {
        console.warn('Error reading OAuth callback parameters:', urlErr);
      }
    }

    if (!supabase) {
      setIsLoading(false);
      setIsAuthenticated(false);
      setIsDemoSession(false);
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
        resolveAccountRoleAndProfile(
          session.user.id,
          session.user
        ).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsAuthenticated(false);
        setIsDemoSession(false);
        setUser(emptyUserProfile);
        setIsLoading(false);
      }
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setIsAuthenticated(true);
        await resolveAccountRoleAndProfile(
          session.user.id,
          session.user
        );
      } else {
        setIsAuthenticated(false);
        setIsDemoSession(false);
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

  const startDemoSession = async (demoRole: UserRole, captchaToken?: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return {
        success: false,
        error: 'Database service is unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      };
    }

    setIsLoading(true);
    setAuthNotice(null);
    setAuthError(null);

    try {
      // 1. If an active session exists, sign it out cleanly first
      const { data: existingSessionData } = await supabase.auth.getSession();
      if (existingSessionData?.session) {
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.warn('Sign-out before demo session warning:', signOutErr);
        }
      }

      // Record intended demo persona in sessionStorage
      try {
        sessionStorage.setItem(DEMO_PERSONA_KEY, demoRole);
      } catch {}

      // 2. Call Supabase Auth signInAnonymously()
      if (typeof supabase.auth.signInAnonymously !== 'function') {
        setIsLoading(false);
        return {
          success: false,
          error: 'Anonymous Sign-Ins are not supported by the client library or have been disabled in your Supabase project. Enable Anonymous sign-in in Supabase Dashboard (Authentication > Providers > Anonymous).'
        };
      }

      const anonOptions: { captchaToken?: string } = {};
      if (captchaToken) {
        anonOptions.captchaToken = captchaToken;
      }

      const { data, error } = await supabase.auth.signInAnonymously(
        Object.keys(anonOptions).length > 0 ? { options: anonOptions } : undefined
      );

      if (error) {
        setIsLoading(false);
        const lowerMsg = error.message.toLowerCase();
        if (lowerMsg.includes('anonymous sign-ins are disabled') || lowerMsg.includes('provider is disabled') || lowerMsg.includes('signup disabled')) {
          return {
            success: false,
            error: 'Anonymous Sign-Ins are currently disabled in your Supabase project. Please enable "Anonymous sign-ins" in the Supabase Dashboard under Authentication > Providers > Anonymous.'
          };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        await resolveAccountRoleAndProfile(data.user.id, data.user, demoRole);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Could not initialize anonymous demo session.' };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Failed to start demo session.' };
    }
  };

  const updateUserProfile = async (
    updated: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    // If demo session, update in-memory state only. Never write to Supabase medical tables!
    if (isDemoSession) {
      setUser(prev => {
        const nextDob = updated.dob !== undefined ? updated.dob : prev.dob;
        const nextAge = calculateAgeFromDob(nextDob) ?? 0;
        return {
          ...prev,
          ...updated,
          age: nextAge
        };
      });
      return { success: true };
    }

    // Sync to Supabase if connected and authenticated
    if (supabase && isAuthenticated && user.id) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString()
        };

        if (updated.name !== undefined) updatePayload.full_name = updated.name.trim();
        if (updated.dob !== undefined) updatePayload.dob = updated.dob.trim() ? updated.dob.trim() : null;
        if (updated.gender !== undefined) updatePayload.gender = updated.gender;
        if (updated.bloodGroup !== undefined) updatePayload.blood_group = updated.bloodGroup.trim() ? updated.bloodGroup.trim() : null;
        if (updated.phone !== undefined) updatePayload.phone = updated.phone.trim() ? updated.phone.trim() : null;
        if (updated.location !== undefined) updatePayload.location = updated.location.trim() ? updated.location.trim() : null;
        if (updated.emergencyContact !== undefined) updatePayload.emergency_contact = updated.emergencyContact.trim() ? updated.emergencyContact.trim() : null;
        if (updated.allergies !== undefined) updatePayload.allergies = updated.allergies;
        if (updated.conditions !== undefined) updatePayload.conditions = updated.conditions;
        if (updated.preferredLanguage !== undefined) updatePayload.preferred_language = updated.preferredLanguage;

        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.id)
          .select('id');

        if (updateError) {
          console.error('Supabase profile update failed:', updateError);
          return { success: false, error: updateError.message };
        }

        // If no row was updated (row didn't exist), fallback to upserting full profile
        if (!updateData || updateData.length === 0) {
          const fullPayload = {
            id: user.id,
            full_name: updated.name !== undefined ? updated.name.trim() : (user.name || 'Patient'),
            dob: updated.dob !== undefined ? (updated.dob.trim() || null) : (user.dob || null),
            gender: updated.gender !== undefined ? updated.gender : user.gender,
            blood_group: updated.bloodGroup !== undefined ? (updated.bloodGroup.trim() || null) : (user.bloodGroup || null),
            phone: updated.phone !== undefined ? (updated.phone.trim() || null) : (user.phone || null),
            location: updated.location !== undefined ? (updated.location.trim() || null) : (user.location || null),
            emergency_contact: updated.emergencyContact !== undefined ? (updated.emergencyContact.trim() || null) : (user.emergencyContact || null),
            allergies: updated.allergies !== undefined ? updated.allergies : user.allergies,
            conditions: updated.conditions !== undefined ? updated.conditions : user.conditions,
            preferred_language: updated.preferredLanguage !== undefined ? updated.preferredLanguage : user.preferredLanguage,
            updated_at: new Date().toISOString()
          };
          const { error: upsertError } = await supabase.from('profiles').upsert(fullPayload);
          if (upsertError) {
            console.error('Supabase profile upsert fallback failed:', upsertError);
            return { success: false, error: upsertError.message };
          }
        }

        // Successfully saved to Supabase; now update local in-memory state with recalculation of age
        setUser(prev => {
          const nextDob = updated.dob !== undefined ? updated.dob : prev.dob;
          const nextAge = calculateAgeFromDob(nextDob) ?? 0;
          return {
            ...prev,
            ...updated,
            age: nextAge
          };
        });

        return { success: true };
      } catch (err: any) {
        console.error('Error saving profile to Supabase:', err);
        return { success: false, error: err?.message || 'Failed to update profile.' };
      }
    } else {
      // Local/offline update
      setUser(prev => {
        const nextDob = updated.dob !== undefined ? updated.dob : prev.dob;
        const nextAge = calculateAgeFromDob(nextDob) ?? 0;
        return {
          ...prev,
          ...updated,
          age: nextAge
        };
      });
      return { success: true };
    }
  };

  const setRole = (newRole: UserRole) => {
    if (newRole === 'doctor' && !isDoctorAccount) {
      console.warn('Unauthorized workspace switch attempted: user is not a registered doctor account.');
      return;
    }
    setRoleState(newRole);
    localStorage.setItem('aarogya_user_role', newRole);
  };

  const signInWithEmail = async (
    email: string, 
    password: string, 
    selectedRole?: UserRole,
    captchaToken?: string
  ) => {
    if (!supabase) {
      return {
        success: false,
        error: 'Database service is unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      };
    }

    setIsLoading(true);
    setAuthNotice(null);
    setAuthError(null);
    try {
      const signInOptions: { captchaToken?: string } = {};
      if (captchaToken) {
        signInOptions.captchaToken = captchaToken;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        ...(Object.keys(signInOptions).length > 0 ? { options: signInOptions } : {})
      });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
        // Resolve profile and active workspace deterministically BEFORE marking authenticated / ending loading
        await resolveAccountRoleAndProfile(data.user.id, data.user, selectedRole);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
    setIsLoading(false);
    return { success: false, error: 'Unknown login error' };
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    name: string, 
    selectedRole: UserRole,
    captchaToken?: string
  ) => {
    if (!supabase) {
      return {
        success: false,
        error: 'Database service is unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      };
    }

    setIsLoading(true);
    setAuthNotice(null);
    setAuthError(null);
    try {
      const signUpOptions: { data: { full_name: string; role: UserRole }; captchaToken?: string } = {
        data: { full_name: name, role: selectedRole }
      };
      if (captchaToken) {
        signUpOptions.captchaToken = captchaToken;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions
      });
      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }
      if (data.user) {
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

        // If selectedRole is doctor, create initial pending doctor profile row
        if (selectedRole === 'doctor') {
          try {
            await supabase.from('doctor_profiles').upsert({
              id: data.user.id,
              full_name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
              qualifications: 'Pending Verification (No Credentials Verified)',
              specialty: 'General Practice (Unverified)',
              registration_number: `UNVERIFIED-${data.user.id.slice(0, 8).toUpperCase()}`,
              clinic_name: 'Unverified Practice (Pending Review)',
              clinic_address: 'Verification in progress',
              is_verified: false
            });
          } catch (e) {
            console.warn('Could not insert initial doctor profile row:', e);
          }
        }

        await resolveAccountRoleAndProfile(data.user.id, data.user, selectedRole);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Registration failed' };
    }
    setIsLoading(false);
    return { success: false, error: 'Unknown registration error' };
  };

  const signInWithGoogle = async (
    selectedRole: UserRole = 'patient',
    authMode: 'signin' | 'signup' = 'signin'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client is not configured.' };
    }
    try {
      setAuthNotice(null);
      setAuthError(null);

      // Persist signup intent before OAuth redirection
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const intent: OAuthSignupIntent = {
          role: selectedRole,
          mode: authMode,
          timestamp: Date.now()
        };
        sessionStorage.setItem(OAUTH_INTENT_KEY, JSON.stringify(intent));
      }

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

  const resetPasswordForEmail = async (
    email: string,
    captchaToken?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return {
        success: false,
        error: 'Database service is unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
      };
    }

    setIsLoading(true);
    setAuthNotice(null);
    setAuthError(null);
    try {
      const resetOptions: { redirectTo?: string; captchaToken?: string } = {
        redirectTo: window.location.origin
      };
      if (captchaToken) {
        resetOptions.captchaToken = captchaToken;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, resetOptions);
      setIsLoading(false);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Password reset failed' };
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
    setIsDemoSession(false);
    setUser(emptyUserProfile);
    setRoleState('patient');
    setIsDoctorAccount(false);
    setIsDoctorVerified(false);
    setAuthNotice(null);
    setAuthError(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isDoctorAccount,
        isDoctorVerified,
        isAuthenticated,
        isDemoSession,
        isConfigured: isSupabaseConfigured,
        configError,
        authNotice,
        authError,
        isLoading,
        setRole,
        clearAuthNotice,
        clearAuthError,
        startDemoSession,
        updateUserProfile,
        signInWithEmail,
        signUpWithEmail,
        resetPasswordForEmail,
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
