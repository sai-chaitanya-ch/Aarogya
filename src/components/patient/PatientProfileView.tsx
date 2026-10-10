import React, { useState } from 'react';
import { 
  ArrowLeft, User, ShieldCheck, Heart, AlertCircle, 
  MapPin, Phone, Landmark, CheckCircle2, Edit2, Globe, LogOut 
} from 'lucide-react';
import { UserProfile, Language } from '../../types';

interface PatientProfileViewProps {
  user: UserProfile;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onOpenAbhaModal: () => void;
  onSaveProfile: (updated: Partial<UserProfile>) => void;
  onOpenEmergencyCard?: () => void;
  onExportSummary?: () => void;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  user,
  language,
  onLanguageChange,
  onBack,
  onOpenAbhaModal,
  onSaveProfile,
  onOpenEmergencyCard,
  onExportSummary,
  onOpenAuthModal,
  onSignOut
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [location, setLocation] = useState(user.location);
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup);

  const handleSave = () => {
    onSaveProfile({
      name,
      phone,
      location,
      bloodGroup
    });
    setIsEditing(false);
  };

  return (
    <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#f8faf9] flex flex-col justify-between max-w-4xl w-full mx-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-extrabold text-slate-900">Health Profile</h2>
          </div>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg hover:bg-teal-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save' : 'Edit'}</span>
          </button>
        </div>

        {/* User Card */}
        <div className="mt-3 p-4 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="font-extrabold text-sm text-slate-900 border rounded px-1.5 py-0.5 outline-none"
                />
              ) : (
                <h3 className="font-extrabold text-sm text-slate-900">{user.name}</h3>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/50">
                {user.age} yrs · {user.gender}
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                Blood Group: {user.bloodGroup}
              </span>
            </div>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="mt-3 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile Phone</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="font-bold text-slate-800 border rounded px-1 py-0.5"
              />
            ) : (
              <span className="font-bold text-slate-800">{user.phone}</span>
            )}
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="font-bold text-slate-800 border rounded px-1 py-0.5"
              />
            ) : (
              <span className="font-bold text-slate-800">{user.location}</span>
            )}
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-slate-500">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Emergency Contact</span>
            </div>
            <span className="font-bold text-slate-800">{user.emergencyContact}</span>
          </div>
        </div>

        {/* Clinical Alerts / Allergies / Conditions */}
        <div className="mt-3 bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Allergies & Known Conditions</span>
          </div>
          
          <div className="space-y-1.5 pt-1">
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Allergies:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {user.allergies.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[11px] font-bold border border-red-200">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Existing Conditions:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {user.conditions.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ABHA Connection Card */}
        <div 
          onClick={onOpenAbhaModal}
          className="mt-3 p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/80 cursor-pointer hover:border-teal-300 transition-all text-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-teal-800" />
              <span className="font-bold text-slate-900">ABDM / ABHA Digital Identity</span>
            </div>
            {user.abhaLinked ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Not Connected
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            {user.abhaLinked ? `Linked ABHA: ${user.abhaId} (${user.abhaAddress})` : 'Connect your 14-digit government ABHA ID to sync records.'}
          </p>
        </div>

        {/* Language Selection */}
        <div className="mt-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Globe className="w-4 h-4 text-teal-700" />
            <span>App Language</span>
          </div>
          <div className="flex items-center gap-1">
            {(['en', 'te', 'hi', 'ta'] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => onLanguageChange(l)}
                className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${
                  language === l ? 'bg-teal-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Real Product Care Tools */}
        <div className="mt-3 space-y-2">
          {onOpenEmergencyCard && (
            <button
              onClick={onOpenEmergencyCard}
              className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                <span>View Emergency Health Card (SOS)</span>
              </div>
              <span className="text-[10px] uppercase font-black bg-white px-2 py-0.5 rounded shadow-2xs">Open</span>
            </button>
          )}

          {onExportSummary && (
            <button
              onClick={onExportSummary}
              className="w-full py-2.5 px-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-xl font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>Export Clinical Health Summary (Print / PDF)</span>
              </div>
              <span className="text-[10px] uppercase font-black bg-white px-2 py-0.5 rounded shadow-2xs">Export</span>
            </button>
          )}

          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Manage Account & Cloud Sync</span>
            </button>
          )}

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Sign Out from Aarogya</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
