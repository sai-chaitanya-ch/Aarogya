import React from 'react';
import { 
  FileText, ShieldCheck, Plus, Sparkles, 
  Camera, Pill, Calendar, TrendingUp, ChevronRight 
} from 'lucide-react';
import { MedicalRecord, ActiveMedicationReminder, Language } from '../../types';

export interface ChatContextPanelProps {
  records: MedicalRecord[];
  reminders: ActiveMedicationReminder[];
  language: Language;
  onNavigate: (view: string) => void;
  onOpenRecord: (record: MedicalRecord) => void;
}

export const ChatContextPanel: React.FC<ChatContextPanelProps> = ({
  records,
  reminders,
  language: _language,
  onNavigate,
  onOpenRecord
}) => {
  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const latestRecord = records.length > 0 ? records[0] : null;

  return (
    <aside 
      className="w-80 bg-white/95 backdrop-blur-md border-l border-slate-100 p-4 space-y-4 overflow-y-auto flex-shrink-0 select-none hidden xl:flex xl:flex-col"
      aria-label="Patient Health Context"
    >
      {/* Records section */}
      <div className="bg-slate-50/70 rounded-3xl p-4 border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-800">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Your health records</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {records.length} record{records.length === 1 ? '' : 's'}
          </span>
        </div>

        {latestRecord ? (
          <div 
            onClick={() => onOpenRecord(latestRecord)}
            className="p-3 bg-white rounded-2xl border border-teal-100 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-800 transition-colors">
                  {latestRecord.title}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {latestRecord.visitDate} · {latestRecord.documentType}
                </div>
              </div>
            </div>
            {latestRecord.aiSummary?.en && (
              <div className="mt-2 pt-1.5 border-t border-slate-50 text-[10px] text-slate-600 line-clamp-2">
                {latestRecord.aiSummary.en}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
            <span className="text-[11px] text-slate-400 font-medium">No records uploaded yet</span>
          </div>
        )}

        <button
          onClick={() => onNavigate('scan')}
          className="mt-3 w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload record</span>
        </button>
      </div>

      {/* Health status & Urgent Alerts */}
      <div className="bg-slate-50/70 rounded-3xl p-4 border border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="font-extrabold text-xs text-slate-900">
              {pendingReminders.length > 0 ? `${pendingReminders.length} Pending Reminder(s)` : 'No urgent alerts'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {pendingReminders.length > 0 
                ? 'You have scheduled medications waiting for your confirmation.'
                : "You're all set! We'll notify you here if something needs your attention."}
            </p>
          </div>
        </div>
      </div>

      {/* Quick navigation actions grid */}
      <div>
        <div className="text-xs font-bold text-slate-700 mb-2 px-1">Quick actions</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('scan')}
            className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-teal-200 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center mb-1.5 group-hover:bg-teal-100">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-800">Scan report</div>
          </button>

          <button
            onClick={() => onNavigate('reminders')}
            className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-teal-200 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-1.5 group-hover:bg-rose-100">
              <Pill className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-800">Medicines</div>
          </button>

          <button
            onClick={() => onNavigate('appointments')}
            className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-teal-200 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-1.5 group-hover:bg-blue-100">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-800">Appointments</div>
          </button>

          <button
            onClick={() => onNavigate('trends')}
            className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-teal-200 text-left transition-all group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:bg-emerald-100">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-800">Health trends</div>
          </button>
        </div>
      </div>

      {/* Library link pill */}
      {records.length > 0 && (
        <button
          onClick={() => onNavigate('library')}
          className="w-full p-2.5 rounded-2xl bg-white border border-slate-100 hover:border-teal-200 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all"
        >
          <span className="flex items-center gap-1.5 text-teal-900">
            <Sparkles className="w-3.5 h-3.5 text-teal-700" />
            Browse all records
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </aside>
  );
};
