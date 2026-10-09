import React, { useState } from 'react';
import { X, Lock, Mail, User, Stethoscope, ArrowRight } from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { AarogyaLogo } from '../common/AarogyaLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, continueAsGuest, isLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'signin') {
      const res = await signInWithEmail(email, password, selectedRole);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to sign in. Check email and password.');
      }
    } else {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      const res = await signUpWithEmail(email, password, fullName, selectedRole);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to register account.');
      }
    }
  };

  const handleGuestLogin = () => {
    continueAsGuest(selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <AarogyaLogo size="sm" showSubtitle={false} />
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-base font-extrabold text-slate-900">
            {mode === 'signin' ? 'Welcome Back to Aarogya' : 'Create Your Aarogya Account'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Personal Health Copilot · Safe, Encrypted, Private
          </p>
        </div>

        {/* Role Selector Pill */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedRole('patient')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'patient'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('doctor')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'doctor'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 pb-2 border-b-2 transition-all ${
              mode === 'signin' ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 pb-2 border-b-2 transition-all ${
              mode === 'signup' ? 'border-teal-700 text-teal-800' : 'border-transparent text-slate-400'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-[11px] font-bold border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Chaitanya V"
                  className="w-full pl-9 pr-3 py-2 border rounded-xl outline-none focus:border-teal-700 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 border rounded-xl outline-none focus:border-teal-700 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border rounded-xl outline-none focus:border-teal-700 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span>{isLoading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* 1-Click Guest Demo Mode */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="text-xs font-bold text-teal-800 hover:text-teal-900 underline"
          >
            ⚡ Continue in Instant Demo Mode
          </button>
        </div>
      </div>
    </div>
  );
};
