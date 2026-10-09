import React, { useState } from 'react';
import { Camera, Mic, Calendar, MapPin, ShieldCheck, Check } from 'lucide-react';
import { AarogyaLogo } from '../common/AarogyaLogo';
import { Language, UserProfile } from '../../types';
import { translations } from '../../data/translations';

interface OnboardingStepsProps {
  step: 1 | 2;
  language: Language;
  onLanguageSelect: (lang: Language) => void;
  user: UserProfile;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const OnboardingSteps: React.FC<OnboardingStepsProps> = ({
  step,
  language,
  onLanguageSelect,
  user,
  onSaveProfile,
  onNext,
  onBack
}) => {
  const t = translations[language];

  // Profile form state
  const [name, setName] = useState(user.name);
  const [dob, setDob] = useState(user.dob);
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup);
  const [location, setLocation] = useState(user.location);
  const [isRecording, setIsRecording] = useState(false);

  const languagesList: { code: Language; title: string; native: string }[] = [
    { code: 'en', title: 'English', native: 'English' },
    { code: 'te', title: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', title: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', title: 'Tamil', native: 'தமிழ்' }
  ];

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name || 'Chaitanya',
      dob,
      bloodGroup,
      location
    });
    onNext();
  };

  const simulateVoiceFill = (field: string) => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      if (field === 'name') setName('Chaitanya V.');
      if (field === 'location') setLocation('Vijayawada, Andhra Pradesh');
    }, 1200);
  };

  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-teal-50/40 via-white to-white min-h-[640px]">
        {/* Brand Header */}
        <div className="pt-8 flex flex-col items-center text-center">
          <AarogyaLogo size="lg" showSubtitle={false} className="mb-2" />
          <span className="text-xs font-semibold tracking-wide text-teal-800">
            {t.tagline}
          </span>

          <h1 className="mt-8 text-2xl font-extrabold text-slate-800 tracking-tight leading-snug">
            Your health,<br />
            <span className="text-teal-700">all in one place.</span>
          </h1>
          <p className="mt-2 text-xs text-slate-500 max-w-[280px] leading-relaxed">
            Understand your records, manage your care, and stay healthier with AI.
          </p>
        </div>

        {/* Language Selection List */}
        <div className="my-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            {t.chooseLanguage}
          </label>
          <div className="space-y-2.5">
            {languagesList.map(item => {
              const isSelected = language === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onLanguageSelect(item.code)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/70 shadow-sm ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                      {item.native.charAt(0)}
                    </span>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.native}</div>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button & Step Indicators */}
        <div className="pb-4 flex flex-col items-center gap-4">
          <button
            onClick={onNext}
            className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>{t.continueBtn}</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Health Profile Setup
  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-teal-50/30 via-white to-white min-h-[640px]">
      <div>
        {/* Top bar with back button & progress dots */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100"
          >
            ←
          </button>
          <AarogyaLogo size="sm" showSubtitle={false} />
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-extrabold text-slate-800 leading-snug">
            {t.setupProfile}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {t.profileHelp}
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.fullName}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full text-xs font-medium px-3.5 py-2.5 pr-16 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  title="Scan from ID"
                  className="p-1 hover:text-teal-700 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => simulateVoiceFill('name')}
                  title="Voice input"
                  className={`p-1 hover:text-teal-700 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.dob}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={dob}
                onChange={e => setDob(e.target.value)}
                placeholder="DD / MM / YYYY"
                className="w-full text-xs font-medium px-3.5 py-2.5 pr-16 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                <span className="p-1"><Calendar className="w-4 h-4" /></span>
                <span className="p-1"><Mic className="w-4 h-4" /></span>
              </div>
            </div>
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.bloodGroup}
            </label>
            <div className="relative flex items-center">
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none bg-white transition-all appearance-none"
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+ (Universal Donor)</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              <div className="absolute right-3 text-slate-400 pointer-events-none text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.location}
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Enter your city / location"
                className="w-full text-xs font-medium px-3.5 py-2.5 pr-16 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                <button
                  type="button"
                  onClick={() => setLocation('Vijayawada, Andhra Pradesh')}
                  title="Detect GPS"
                  className="p-1 hover:text-teal-700 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => simulateVoiceFill('location')}
                  className="p-1 hover:text-teal-700 transition-colors"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Note Badge */}
          <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200/60 flex items-start gap-2.5 text-[11px] text-teal-900 leading-relaxed mt-4">
            <ShieldCheck className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Your information is private and secure.</span> You can update or delete it anytime.
            </div>
          </div>
        </form>
      </div>

      {/* Submit Button */}
      <div className="pt-4 pb-2">
        <button
          onClick={handleProfileSubmit}
          className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all"
        >
          <span>{t.continueBtn}</span>
        </button>
      </div>
    </div>
  );
};
