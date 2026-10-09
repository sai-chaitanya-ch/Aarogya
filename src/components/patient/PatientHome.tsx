import React from 'react';
import { 
  MessageSquare, Camera, FolderOpen, Pill, Calendar, 
  Stethoscope, Landmark, ChevronRight, Bell, Sparkles, CheckCircle2 
} from 'lucide-react';
import { UserProfile, MedicalRecord, ActiveMedicationReminder, Appointment, Language } from '../../types';
import { translations } from '../../data/translations';
import { AarogyaLogo } from '../common/AarogyaLogo';

interface PatientHomeProps {
  user: UserProfile;
  language: Language;
  records: MedicalRecord[];
  reminders: ActiveMedicationReminder[];
  appointments: Appointment[];
  onNavigate: (view: string) => void;
  onOpenAbhaModal: () => void;
  onOpenProfile: () => void;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  user,
  language,
  records,
  reminders,
  appointments,
  onNavigate,
  onOpenAbhaModal,
  onOpenProfile
}) => {
  const t = translations[language];

  const activeMedicinesCount = reminders.length;
  const upcomingAptsCount = appointments.filter(a => a.status === 'upcoming').length;

  return (
    <div className="flex-1 p-4 space-y-4 bg-[#f8faf9] text-slate-800">
      {/* Top Bar with Brand & User Avatar */}
      <div className="flex items-center justify-between pt-1">
        <AarogyaLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onNavigate('reminders')}
            className="relative p-2 rounded-full bg-white shadow-xs text-slate-600 hover:text-teal-800 border border-slate-100"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-teal-100 text-teal-900 font-bold text-xs flex items-center justify-center border border-teal-200 shadow-sm"
          >
            {user.name.slice(0, 2).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Greeting Card with Yoga Illustration */}
      <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-teal-50/70 via-emerald-50/40 to-teal-50/60 rounded-3xl border border-teal-100/70">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {t.goodMorning},<br />
            <span className="text-teal-800">{user.name} 👋</span>
          </h1>
          <p className="mt-1 text-xs text-slate-600 font-medium">
            {t.takeCharge}
          </p>
        </div>
        {/* Yoga Avatar Graphic */}
        <div className="w-16 h-16 rounded-full bg-teal-100/80 flex items-center justify-center border-2 border-white shadow-inner flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-12 h-12 text-teal-800" fill="currentColor">
            {/* Meditating figure */}
            <circle cx="50" cy="24" r="10" />
            <path d="M50 36 C42 36 34 44 34 56 C34 68 40 76 50 78 C60 76 66 68 66 56 C66 44 58 36 50 36 Z" opacity="0.9" />
            <path d="M28 54 C32 62 40 70 50 72 C60 70 68 62 72 54" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M22 66 C28 72 38 76 50 76 C62 76 72 72 78 66" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      {/* Health Summary Card */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
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
        <div className="grid grid-cols-3 gap-2.5">
          {/* Records */}
          <div 
            onClick={() => onNavigate('library')}
            className="p-3 bg-teal-50/50 rounded-2xl flex flex-col items-center justify-center text-center border border-teal-100/50 cursor-pointer hover:bg-teal-50 transition-colors"
          >
            <FolderOpen className="w-5 h-5 text-teal-700 mb-1" />
            <span className="text-lg font-black text-slate-900">{records.length}</span>
            <span className="text-[10px] font-semibold text-slate-500">{t.records}</span>
          </div>

          {/* Active Medicines */}
          <div 
            onClick={() => onNavigate('reminders')}
            className="p-3 bg-teal-50/50 rounded-2xl flex flex-col items-center justify-center text-center border border-teal-100/50 cursor-pointer hover:bg-teal-50 transition-colors"
          >
            <Pill className="w-5 h-5 text-teal-700 mb-1" />
            <span className="text-lg font-black text-slate-900">{activeMedicinesCount}</span>
            <span className="text-[10px] font-semibold text-slate-500">{t.activeMedicines}</span>
          </div>

          {/* Upcoming Appointments */}
          <div 
            onClick={() => onNavigate('appointments')}
            className="p-3 bg-teal-50/50 rounded-2xl flex flex-col items-center justify-center text-center border border-teal-100/50 cursor-pointer hover:bg-teal-50 transition-colors"
          >
            <Calendar className="w-5 h-5 text-teal-700 mb-1" />
            <span className="text-lg font-black text-slate-900">{upcomingAptsCount}</span>
            <span className="text-[10px] font-semibold text-slate-500 leading-tight">{t.upcomingAppointments}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (Ask Aarogya & Scan a Report) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Ask Aarogya Card - Teal */}
        <button
          onClick={() => onNavigate('chat')}
          className="group text-left p-4 bg-gradient-to-br from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white rounded-3xl shadow-md shadow-teal-900/10 transition-all flex flex-col justify-between min-h-[110px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div>
            <div className="font-extrabold text-sm">{t.askAarogya}</div>
            <div className="text-[11px] text-teal-100/80 font-medium">{t.askAarogyaSub}</div>
          </div>
        </button>

        {/* Scan a Report Card - Lavender / Soft Blue */}
        <button
          onClick={() => onNavigate('scan')}
          className="group text-left p-4 bg-gradient-to-br from-indigo-50 to-blue-100/80 hover:from-indigo-100 hover:to-blue-200/80 text-slate-900 rounded-3xl border border-indigo-200/60 shadow-sm transition-all flex flex-col justify-between min-h-[110px]"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-indigo-700" />
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900">{t.scanReport}</div>
            <div className="text-[11px] text-slate-600 font-medium">{t.scanReportSub}</div>
          </div>
        </button>
      </div>

      {/* Feature Navigation Cards List */}
      <div className="space-y-2">
        {/* Medical Library */}
        <button
          onClick={() => onNavigate('library')}
          className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{t.medicalLibrary}</div>
              <div className="text-[11px] text-slate-500">{t.medicalLibrarySub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Medicines & Reminders */}
        <button
          onClick={() => onNavigate('reminders')}
          className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{t.medicinesReminders}</div>
              <div className="text-[11px] text-slate-500">{t.medicinesRemindersSub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Appointments */}
        <button
          onClick={() => onNavigate('appointments')}
          className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{t.appointments}</div>
              <div className="text-[11px] text-slate-500">{t.appointmentsSub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Find a Doctor */}
        <button
          onClick={() => onNavigate('doctors')}
          className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:bg-slate-50/80 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">{t.findDoctor}</div>
              <div className="text-[11px] text-slate-500">{t.findDoctorSub}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* ABDM / ABHA Connection Banner */}
      <div 
        onClick={onOpenAbhaModal}
        className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50/40 to-teal-50/80 rounded-3xl border border-teal-200/80 shadow-xs cursor-pointer hover:border-teal-300 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
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
            <p className="mt-1 text-[11px] text-slate-600 leading-snug">
              {t.abdmSub}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-teal-800 flex-shrink-0 mt-1" />
        </div>
      </div>
    </div>
  );
};
