import React from 'react';
import { X, Heart, Phone, AlertTriangle, ShieldCheck, QrCode } from 'lucide-react';
import { UserProfile, ActiveMedicationReminder } from '../../types';

interface EmergencyCardModalProps {
  user: UserProfile;
  reminders: ActiveMedicationReminder[];
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyCardModal: React.FC<EmergencyCardModalProps> = ({
  user,
  reminders,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl space-y-0 border border-red-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Emergency Header Bar */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white text-red-600 flex items-center justify-center font-black shadow-md">
              <Heart className="w-5 h-5 fill-red-600" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">Emergency Medical Card</h3>
              <p className="text-[10px] text-red-100">For First Responders & Clinicians</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Patient Header & Blood Group */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/80 border border-rose-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">{user.name || 'Patient'}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {user.age ? `${user.age} yrs · ` : ''}{user.gender || 'Patient'}{user.location ? ` · ${user.location}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Blood Group</span>
              <span className="text-xl font-black text-red-600 tracking-tight">{user.bloodGroup || 'Not specified'}</span>
            </div>
          </div>

          {/* Emergency Contact Direct Dial */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Primary Emergency Contact</span>
                <span className="font-bold text-slate-800 text-xs">{user.emergencyContact || 'Not provided'}</span>
              </div>
            </div>
            {user.emergencyContact ? (
              <a
                href={`tel:${user.emergencyContact.split(' ')[0]}`}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] rounded-xl shadow-xs transition-colors"
              >
                Call 📞
              </a>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">None</span>
            )}
          </div>

          {/* Known Allergies Callout */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Critical Known Allergies</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.allergies && user.allergies.length > 0 ? (
                user.allergies.map((allergy, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-red-100 text-red-800 font-extrabold text-[10px] border border-red-200">
                    ⚠️ {allergy}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500">No known drug allergies reported.</span>
              )}
            </div>
          </div>

          {/* Active Medications List */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Active Daily Prescriptions
            </span>
            <div className="space-y-1">
              {reminders.length > 0 ? (
                reminders.map(rem => (
                  <div key={rem.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800">{rem.medicineName}</span>
                    <span className="text-slate-500">{rem.dosage}</span>
                  </div>
                ))
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-400 text-[11px]">
                  No active medication reminders logged.
                </div>
              )}
            </div>
          </div>

          {/* ABHA QR Code Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-8 h-8 text-slate-700" />
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">ABHA ID: {user.abhaId || '91-1234-5678-9012'}</span>
                <span className="text-[9px] text-emerald-700 font-bold">ABDM Fast-Track Record Access</span>
              </div>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> Offline Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
