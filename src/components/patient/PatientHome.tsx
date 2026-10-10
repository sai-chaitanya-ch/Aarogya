import React from 'react';
import { 
  MessageSquare, Camera, FolderOpen, Pill, Calendar, 
  Stethoscope, Landmark, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { UserProfile, MedicalRecord, ActiveMedicationReminder, Appointment, Language } from '../../types';
import { translations } from '../../data/translations';

interface PatientHomeProps {
  user: UserProfile;
  language: Language;
  records: MedicalRecord[];
  reminders: ActiveMedicationReminder[];
  appointments: Appointment[];
  onNavigate: (view: string) => void;
  onOpenAbhaModal: () => void;
  onOpenProfile?: () => void;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  user,
  language,
  records,
  reminders,
  appointments,
  onNavigate,
  onOpenAbhaModal,
}) => {
  const t = translations[language];

  const activeMedicinesCount = reminders.length;
  const upcomingAptsCount = appointments.filter(a => a.status === 'upcoming').length;

  return (
    <div className="flex-1 p-3 sm:p-5 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-6 bg-[#f8faf9] text-slate-800 max-w-6xl w-full mx-auto pb-6 sm:pb-8">
      {/* Greeting Card with Yoga Illustration */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-teal-50/70 rounded-2xl sm:rounded-3xl border border-teal-100/80">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {t.goodMorning}, <span className="text-teal-800">{user.name || 'Friend'} 👋</span>
          </h1>
          <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-slate-600 font-medium">
            {t.takeCharge}
          </p>
        </div>
        {/* Yoga Avatar Graphic */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-100/80 flex items-center justify-center border-2 border-white shadow-inner flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-10 sm:h-10 text-teal-800" fill="currentColor">
            {/* Meditating figure */}
            <circle cx="50" cy="24" r="10" />
            <path d="M50 36 C42 36 34 44 34 56 C34 68 40 76 50 78 C60 76 66 68 66 56 C66 44 58 36 50 36 Z" opacity="0.9" />
            <path d="M28 54 C32 62 40 70 50 72 C60 70 68 62 72 54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M22 66 C28 72 38 76 50 76 C62 76 72 72 78 66" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* Health Summary Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <span className="text-xs font-bold text-slate-700 tracking-wide">
            {t.yourHealthSummary}
          </span>
          <button
            onClick={() => onNavigate('trends')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-0.5"
          >
            <span>{t.viewDetails}</span>
          </button>
        </div>

        {/* 3 Metric Badges matching design */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Records */}
          <div 
            onClick={() => onNavigate('library')}
            className="p-2 sm:p-3 bg-teal-50/50 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center border border-teal-100/50 cursor-pointer hover:bg-teal-50 transition-colors"
          >
            <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700 mb-0.5 sm:mb-1" />
            <span className="text-base sm:text-lg font-black text-slate-900">{records.length}</span>
            <span className="text-[10px] font-semibold text-slate-500">{t.records}</span>
          </div>

          {/* Active Medicines */}
          <div 
            onClick={() => onNavigate('reminders')}
            className="p-2 sm:p-3 bg-teal-50/50 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center border border-teal-100/50 cursor-pointer hover:bg-teal-50 transition-colors"
          >
            <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700 mb-0.5 sm:mb-1" />
            <span className="text-base sm:text-lg font-black text-slate-900">{activeMedicinesCount}</span>
            <span className="text-[10px] font-semibold text-slate-500 truncate max-w-full">{t.activeMedicines}</span>
          </div>

          {/* Upcoming Appointments */}
          <div 
            onClick={() => onNavigate('appointments')}
            className="p-2 sm:p-3 bg-teal-50/50 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-center border border-teal-100/50 cursor-pointer hover:bg-teal-50 transition-colors"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-teal-700 mb-0.5 sm:mb-1" />
            <span className="text-base sm:text-lg font-black text-slate-900">{upcomingAptsCount}</span>
            <span className="text-[10px] font-semibold text-slate-500 truncate max-w-full leading-tight">{t.upcomingAppointments}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (Ask Aarogya & Scan a Report) - 2 columns on mobile */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:gap-4">
        {/* Ask Aarogya Card - Teal */}
        <button
          onClick={() => onNavigate('chat')}
          className="group text-left p-3 sm:p-4 md:p-5 bg-gradient-to-br from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-2xl sm:rounded-3xl shadow-xs shadow-teal-900/10 transition-all flex flex-col justify-between min-h-[96px] sm:min-h-[115px] md:min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-2">
            <div className="font-extrabold text-xs sm:text-sm md:text-base leading-tight">{t.askAarogya}</div>
            <div className="text-[10px] sm:text-[11px] md:text-xs text-teal-100/80 font-medium truncate">{t.askAarogyaSub}</div>
          </div>
        </button>

        {/* Scan a Report Card - Lavender / Soft Blue */}
        <button
          onClick={() => onNavigate('scan')}
          className="group text-left p-3 sm:p-4 md:p-5 bg-gradient-to-br from-indigo-50 to-blue-100/80 hover:from-indigo-100 hover:to-blue-200/80 text-slate-900 rounded-2xl sm:rounded-3xl border border-indigo-200/60 shadow-xs transition-all flex flex-col justify-between min-h-[96px] sm:min-h-[115px] md:min-h-[130px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-600/10 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-700" />
            </div>
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-2">
            <div className="font-extrabold text-xs sm:text-sm md:text-base text-slate-900 leading-tight">{t.scanReport}</div>
            <div className="text-[10px] sm:text-[11px] md:text-xs text-slate-600 font-medium truncate">{t.scanReportSub}</div>
          </div>
        </button>
      </div>

      {/* Feature Navigation Cards List - Responsive 2-col on md+ screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5 md:gap-3.5">
        {/* Medical Library */}
        <button
          onClick={() => onNavigate('library')}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">{t.medicalLibrary}</div>
              <div className="text-[11px] text-slate-500">{t.medicalLibrarySub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        {/* Medicines & Reminders */}
        <button
          onClick={() => onNavigate('reminders')}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">{t.medicinesReminders}</div>
              <div className="text-[11px] text-slate-500">{t.medicinesRemindersSub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        {/* Appointments */}
        <button
          onClick={() => onNavigate('appointments')}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">{t.appointments}</div>
              <div className="text-[11px] text-slate-500">{t.appointmentsSub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        {/* Find a Doctor */}
        <button
          onClick={() => onNavigate('doctors')}
          className="w-full flex items-center justify-between p-3 sm:p-3.5 md:p-4 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">{t.findDoctor}</div>
              <div className="text-[11px] text-slate-500">{t.findDoctorSub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>
      </div>

      {/* ABDM / ABHA Connection Banner */}
      <div 
        onClick={onOpenAbhaModal}
        className="p-3.5 sm:p-4 bg-gradient-to-r from-teal-50 via-emerald-50/40 to-teal-50/80 rounded-2xl sm:rounded-3xl border border-teal-200/80 shadow-xs cursor-pointer hover:border-teal-300 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-xs font-black text-slate-900">{t.abdmTitle}</div>
              {user.abhaLinked && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Linked
                </span>
              )}
            </div>
            <p className="mt-0.5 sm:mt-1 text-[11px] text-slate-600 leading-snug">
              {t.abdmSub}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-teal-800 flex-shrink-0 mt-1" />
        </div>
      </div>
    </div>
  );
};
