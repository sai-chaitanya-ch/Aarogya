import React, { useState } from 'react';
import { 
  ArrowLeft, ShieldCheck, Heart, AlertCircle, 
  MapPin, Phone, Landmark, CheckCircle2, Edit2, Globe, LogOut,
  Calendar, UserCheck, X, Plus, Save, RotateCcw
} from 'lucide-react';
import { UserProfile, Language } from '../../types';
import { calculateAgeFromDob, getTodayDateString } from '../../utils/dateUtils';

interface PatientProfileViewProps {
  user: UserProfile;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBack: () => void;
  onOpenAbhaModal: () => void;
  onSaveProfile: (updated: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }> | void;
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
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState(user.name);
  const [dob, setDob] = useState(user.dob || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user.gender || 'other');
  const [bloodGroup, setBloodGroup] = useState(user.bloodGroup || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [location, setLocation] = useState(user.location || '');
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || '');
  const [allergies, setAllergies] = useState<string[]>(user.allergies || []);
  const [conditions, setConditions] = useState<string[]>(user.conditions || []);
  const [preferredLang, setPreferredLang] = useState<Language>(user.preferredLanguage || language || 'en');

  // Input states for adding chips
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [allergyError, setAllergyError] = useState<string | null>(null);
  const [newConditionInput, setNewConditionInput] = useState('');
  const [conditionError, setConditionError] = useState<string | null>(null);

  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Derived live age in edit mode
  const liveCalculatedAge = calculateAgeFromDob(dob);
  const isDobInFuture = Boolean(dob && liveCalculatedAge === null);

  // Derived age in view mode
  const viewCalculatedAge = calculateAgeFromDob(user.dob);
  const viewAgeText = viewCalculatedAge !== null ? `${viewCalculatedAge} yrs` : 'Age not set';
  const viewGenderText = user.gender === 'male' ? 'Male' : user.gender === 'female' ? 'Female' : 'Other';

  const resetFormToCurrent = () => {
    setName(user.name);
    setDob(user.dob || '');
    setGender(user.gender || 'other');
    setBloodGroup(user.bloodGroup || '');
    setPhone(user.phone || '');
    setLocation(user.location || '');
    setEmergencyContact(user.emergencyContact || '');
    setAllergies(user.allergies || []);
    setConditions(user.conditions || []);
    setPreferredLang(user.preferredLanguage || language || 'en');
    setNewAllergyInput('');
    setAllergyError(null);
    setNewConditionInput('');
    setConditionError(null);
    setValidationError(null);
    setSaveError(null);
  };

  const handleStartEdit = () => {
    resetFormToCurrent();
    setSaveSuccess(null);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    resetFormToCurrent();
    setIsEditing(false);
  };

  // Allergy handling
  const handleAddAllergy = () => {
    const trimmed = newAllergyInput.trim();
    if (!trimmed) return;

    const exists = allergies.some(a => a.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setAllergyError(`"${trimmed}" is already in your allergies list.`);
      return;
    }

    setAllergies(prev => [...prev, trimmed]);
    setNewAllergyInput('');
    setAllergyError(null);
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllergies = () => {
    setAllergies([]);
    setAllergyError(null);
  };

  // Condition handling
  const handleAddCondition = () => {
    const trimmed = newConditionInput.trim();
    if (!trimmed) return;

    const exists = conditions.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setConditionError(`"${trimmed}" is already in your conditions list.`);
      return;
    }

    setConditions(prev => [...prev, trimmed]);
    setNewConditionInput('');
    setConditionError(null);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearConditions = () => {
    setConditions([]);
    setConditionError(null);
  };

  // Save handler with validation
  const handleSave = async () => {
    setValidationError(null);
    setSaveError(null);

    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Full Name cannot be empty.');
      return;
    }

    if (dob) {
      const calculated = calculateAgeFromDob(dob);
      if (calculated === null) {
        setValidationError('Date of Birth cannot be in the future or invalid.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updatePayload: Partial<UserProfile> = {
        name: trimmedName,
        dob: dob.trim(),
        gender,
        bloodGroup: bloodGroup.trim(),
        phone: phone.trim(),
        location: location.trim(),
        emergencyContact: emergencyContact.trim(),
        allergies,
        conditions,
        preferredLanguage: preferredLang
      };

      const result = await onSaveProfile(updatePayload);

      if (result && typeof result === 'object' && result.success === false) {
        setSaveError(result.error || 'Failed to save health profile.');
        setIsSaving(false);
        return;
      }

      // Also trigger language update if changed
      if (preferredLang !== language) {
        onLanguageChange(preferredLang);
      }

      setSaveSuccess('Health profile updated successfully.');
      setIsEditing(false);
      setIsSaving(false);

      // Auto-hide success message after 4 seconds
      setTimeout(() => {
        setSaveSuccess(null);
      }, 4000);
    } catch (err: any) {
      setSaveError(err?.message || 'An unexpected error occurred while saving.');
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#f8faf9] flex flex-col max-w-4xl w-full mx-auto pb-16 sm:pb-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <button
            onClick={isEditing ? handleCancel : onBack}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title={isEditing ? 'Cancel editing' : 'Go back'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">
              {isEditing ? 'Edit Health Profile' : 'Health Profile'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {isEditing ? 'Update medical details and emergency contact' : 'Personal health data & digital identity'}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 border border-teal-800 px-3.5 py-1.5 rounded-xl shadow-xs disabled:opacity-60 transition-colors"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-3 py-1.5 rounded-xl hover:bg-teal-100 transition-colors shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Error Banners */}
      {saveSuccess && (
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-red-600 hover:text-red-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {validationError && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">{validationError}</span>
          </div>
          <button onClick={() => setValidationError(null)} className="text-amber-600 hover:text-amber-800 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Body */}
      {isEditing ? (
        /* ================= EDIT MODE ================= */
        <div className="mt-4 space-y-4">
          {/* Section 1: Demographics & Core Info */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
              <UserCheck className="w-4 h-4 text-teal-700" />
              <span>Personal & Demographic Information</span>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter patient full name"
                className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                required
              />
            </div>

            {/* DOB & Age Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dob}
                    max={getTodayDateString()}
                    onChange={e => setDob(e.target.value)}
                    className="flex-1 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                  />
                  {dob && (
                    <button
                      type="button"
                      onClick={() => setDob('')}
                      className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Clear date of birth"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Automatically calculated age badge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Calculated Age
                </label>
                <div className="flex items-center h-[38px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold">
                  {dob ? (
                    isDobInFuture ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Future date invalid
                      </span>
                    ) : (
                      <span className="text-teal-900 font-bold">
                        {liveCalculatedAge} yrs <span className="text-[10px] text-slate-500 font-normal">(auto-calculated from DOB)</span>
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400 italic">Age not set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Gender & Blood Group Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as 'male' | 'female' | 'other')}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                >
                  <option value="">Select blood group</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="Unknown">Unknown / Not tested</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Emergency */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
              <Phone className="w-4 h-4 text-teal-700" />
              <span>Contact & Emergency Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  maxLength={20}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / City
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Hyderabad, Telangana"
                  maxLength={100}
                  className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Emergency Contact</span>
                <span className="text-[10px] text-slate-400 font-normal">For SOS medical alerts</span>
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                placeholder="e.g. Ananya (Spouse) - +91 98765 43210"
                maxLength={100}
                className="w-full text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Section 3: Allergies Management */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Allergies</span>
              </div>
              {allergies.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllergies}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Add Allergy Input */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAllergyInput}
                  onChange={e => {
                    setNewAllergyInput(e.target.value);
                    if (allergyError) setAllergyError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAllergy();
                    }
                  }}
                  placeholder="Type an allergy (e.g. Penicillin, Peanuts) and click Add"
                  className="flex-1 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
              {allergyError && (
                <p className="text-[11px] text-rose-600 font-semibold">{allergyError}</p>
              )}
            </div>

            {/* Chips List */}
            <div className="pt-1">
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs"
                    >
                      <span>{allergy}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(index)}
                        className="text-rose-400 hover:text-rose-700 p-0.5 rounded-full hover:bg-rose-100 transition-colors"
                        title={`Remove ${allergy}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No allergies recorded</p>
              )}
            </div>
          </div>

          {/* Section 4: Known Medical Conditions Management */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Heart className="w-4 h-4 text-indigo-600" />
                <span>Known Medical Conditions</span>
              </div>
              {conditions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearConditions}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Add Condition Input */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newConditionInput}
                  onChange={e => {
                    setNewConditionInput(e.target.value);
                    if (conditionError) setConditionError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCondition();
                    }
                  }}
                  placeholder="Type a condition (e.g. Hypertension, Asthma) and click Add"
                  className="flex-1 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-600 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
              {conditionError && (
                <p className="text-[11px] text-indigo-600 font-semibold">{conditionError}</p>
              )}
            </div>

            {/* Chips List */}
            <div className="pt-1">
              {conditions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {conditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs"
                    >
                      <span>{condition}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(index)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                        title={`Remove ${condition}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No known conditions recorded</p>
              )}
            </div>
          </div>

          {/* Section 5: Preferred Application Language */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Globe className="w-4 h-4 text-teal-700" />
              <span>Preferred Language</span>
            </div>
            <div className="flex items-center gap-1">
              {(['en', 'te', 'hi', 'ta'] as Language[]).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setPreferredLang(l)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                    preferredLang === l
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sticky Bottom Actions in Edit Mode */}
          <div className="sticky bottom-2 z-10 p-3 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-lg flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs disabled:opacity-60 transition-colors"
            >
              {isSaving ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= VIEW MODE ================= */
        <div className="mt-4 space-y-3.5">
          {/* User Card */}
          <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-700 text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 truncate">{user.name || 'Patient'}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
                  {viewAgeText} · {viewGenderText}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                  Blood Group: {user.bloodGroup || 'Not set'}
                </span>
                {user.dob && (
                  <span className="font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    DOB: {user.dob}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact & Personal Information Card */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
            {/* Mobile Phone */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-medium">Mobile Phone</span>
              </div>
              <span className={`font-bold ${user.phone ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                {user.phone || 'Not set'}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                <span className="font-medium">Location</span>
              </div>
              <span className={`font-bold ${user.location ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                {user.location || 'Not set'}
              </span>
            </div>

            {/* Emergency Contact */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-slate-500">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                <span className="font-medium">Emergency Contact</span>
              </div>
              <span className={`font-bold ${user.emergencyContact ? 'text-rose-700 font-bold' : 'text-slate-400 italic'}`}>
                {user.emergencyContact || 'Not set'}
              </span>
            </div>
          </div>

          {/* Allergies & Conditions Card */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Allergies & Known Medical Conditions</span>
            </div>
            
            <div className="space-y-2.5 pt-1">
              {/* Allergies */}
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Allergies:</span>
                {user.allergies && user.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.allergies.map((allergy, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-700 text-[11px] font-bold border border-red-200">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No allergies recorded</p>
                )}
              </div>

              {/* Existing Conditions */}
              <div className="pt-1.5 border-t border-slate-50">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Known Medical Conditions:</span>
                {user.conditions && user.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.conditions.map((condition, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No known conditions recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* ABHA Connection Card */}
          <div 
            onClick={onOpenAbhaModal}
            className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-200/80 cursor-pointer hover:border-teal-300 transition-all text-xs"
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
              {user.abhaLinked 
                ? `Linked ABHA: ${user.abhaId} (${user.abhaAddress})` 
                : 'Connect your 14-digit government ABHA ID to sync records securely.'}
            </p>
          </div>

          {/* Language Selection Card */}
          <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Globe className="w-4 h-4 text-teal-700" />
              <span>App Language</span>
            </div>
            <div className="flex items-center gap-1">
              {(['en', 'te', 'hi', 'ta'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => onLanguageChange(l)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                    language === l ? 'bg-teal-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Real Care Tools & Actions */}
          <div className="space-y-2 pt-1">
            {onOpenEmergencyCard && (
              <button
                onClick={onOpenEmergencyCard}
                className="w-full py-2.5 px-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-2xl font-bold text-xs flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                  <span>View Emergency Health Card (SOS)</span>
                </div>
                <span className="text-[10px] uppercase font-black bg-white px-2 py-0.5 rounded-md shadow-2xs">Open</span>
              </button>
            )}

            {onExportSummary && (
              <button
                onClick={onExportSummary}
                className="w-full py-2.5 px-3.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-2xl font-bold text-xs flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Export Clinical Health Summary (PDF)</span>
                </div>
                <span className="text-[10px] uppercase font-black bg-white px-2 py-0.5 rounded-md shadow-2xs">Export</span>
              </button>
            )}

            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="w-full py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Manage Account & Cloud Sync</span>
              </button>
            )}

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="w-full py-2.5 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Sign Out from Aarogya</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
