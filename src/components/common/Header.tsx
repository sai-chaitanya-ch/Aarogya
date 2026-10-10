import React, { useState } from 'react';
import { Bell, Globe, Stethoscope, User, X, Check, Clock, LogOut } from 'lucide-react';
import { AarogyaLogo } from './AarogyaLogo';
import { Language, UserProfile, ActiveMedicationReminder, Appointment } from '../../types';

interface HeaderProps {
  currentRole: 'patient' | 'doctor';
  onRoleChange: (role: 'patient' | 'doctor') => void;
  isDoctorAccount?: boolean;
  isDoctorVerified?: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  user: UserProfile;
  reminders: ActiveMedicationReminder[];
  appointments: Appointment[];
  isAuthenticated?: boolean;
  onOpenProfile?: () => void;
  onOpenEmergencyCard?: () => void;
  onOpenAuthModal?: () => void;
  onExportSummary?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  isDoctorAccount = false,
  isDoctorVerified = false,
  language,
  onLanguageChange,
  user,
  reminders,
  appointments,
  isAuthenticated = false,
  onOpenProfile,
  onOpenEmergencyCard,
  onOpenAuthModal,
  onExportSummary,
  onSignOut
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const upcomingApts = appointments.filter(a => a.status === 'upcoming');
  const totalNotifications = pendingReminders.length + upcomingApts.length;

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' }
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3">
          <AarogyaLogo size="sm" showSubtitle={false} />
          <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
            Altrix Labs Prototype
          </span>
        </div>

        {/* Center: Current Workspace Indicator / Doctor Switcher */}
        {isDoctorAccount ? (
          <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs font-medium border border-slate-200/80">
            <button
              onClick={() => onRoleChange('patient')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                currentRole === 'patient'
                  ? 'bg-teal-700 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient View</span>
            </button>
            <button
              onClick={() => onRoleChange('doctor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                currentRole === 'doctor'
                  ? 'bg-teal-700 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Portal</span>
              {!isDoctorVerified && (
                <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                  Pending
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50/90 text-teal-900 border border-teal-200/60 text-xs font-semibold select-none shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Patient Workspace</span>
          </div>
        )}

        {/* Right Actions: Language Selector, Notification Bell, User Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Language Selector Pill Bar (matching reference mockup) */}
          <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold border border-slate-200/80">
            {languages.map(item => (
              <button
                key={item.code}
                onClick={() => onLanguageChange(item.code)}
                className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                  language === item.code
                    ? 'bg-teal-700 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`${item.native} (${item.label})`}
              >
                {item.code}
              </button>
            ))}
          </div>

          {/* Mobile / Tablet Dropdown Language Selector */}
          <div className="relative md:hidden">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span className="uppercase">{language}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Language
                </div>
                {languages.map(item => (
                  <button
                    key={item.code}
                    onClick={() => {
                      onLanguageChange(item.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-teal-50 transition-colors ${
                      language === item.code ? 'font-bold text-teal-800 bg-teal-50/60' : 'text-slate-700'
                    }`}
                  >
                    <span>{item.native} ({item.label})</span>
                    {language === item.code && <Check className="w-3.5 h-3.5 text-teal-700" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowLangMenu(false);
              }}
              className="relative p-2 rounded-full text-slate-600 hover:text-teal-800 hover:bg-slate-100 transition-colors"
              title="Notifications & Reminders"
            >
              <Bell className="w-4 h-4" />
              {totalNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="font-bold text-sm text-slate-800">Alerts & Reminders</div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  {pendingReminders.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-teal-800 flex items-center gap-1 uppercase tracking-wider">
                        <Clock className="w-3 h-3 text-teal-700" /> Pending Medication
                      </div>
                      {pendingReminders.map(rem => (
                        <div key={rem.id} className="p-2 rounded-lg bg-teal-50/70 border border-teal-100 text-xs flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-slate-800">{rem.medicineName}</div>
                            <div className="text-[11px] text-slate-500">{rem.dosage} · {rem.timeSlot}</div>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Due
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {upcomingApts.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Upcoming Visits
                      </div>
                      {upcomingApts.map(apt => (
                        <div key={apt.id} className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-xs">
                          <div className="font-semibold text-slate-800">{apt.doctorName} ({apt.doctorSpecialty})</div>
                          <div className="text-[11px] text-slate-500">{apt.date} · {apt.time}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalNotifications === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No pending medication alerts or appointments.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Emergency Card 1-Tap Trigger */}
          {onOpenEmergencyCard && (
            <button
              onClick={onOpenEmergencyCard}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/60 font-black text-[11px] transition-colors"
              title="Open Emergency Health Card"
            >
              <span>SOS 🏥</span>
            </button>
          )}

          {/* Authenticated user actions or Sign In button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center hover:ring-2 hover:ring-teal-600 transition-all shadow-inner"
                title="Profile details & settings"
              >
                {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
              </button>

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Sign In
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
