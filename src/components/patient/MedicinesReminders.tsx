import React, { useState } from 'react';
import { 
  ArrowLeft, Plus, Check, X, Pill 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveMedicationReminder, Language } from '../../types';

interface MedicinesRemindersProps {
  reminders: ActiveMedicationReminder[];
  language: Language;
  onBack: () => void;
  onToggleStatus: (id: string, newStatus: 'taken' | 'skipped' | 'pending') => void;
  onAddReminder: (reminder: ActiveMedicationReminder) => void;
}

export const MedicinesReminders: React.FC<MedicinesRemindersProps> = ({
  reminders,
  language: _language,
  onBack,
  onToggleStatus,
  onAddReminder
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newTime, setNewTime] = useState<'08:00 AM' | '01:30 PM' | '08:30 PM' | '09:30 PM'>('08:00 AM');
  const [newSlot, setNewSlot] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Morning');

  const takenCount = reminders.filter(r => r.status === 'taken').length;
  const adherenceRate = Math.round((takenCount / (reminders.length || 1)) * 100);

  const handleTakeNow = (id: string) => {
    onToggleStatus(id, 'taken');
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0c7c61', '#149575', '#82ceb4', '#10b981']
      });
    } catch {
      // safe fallback
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName) return;

    onAddReminder({
      id: `rem_${Date.now()}`,
      medicineName: newMedName,
      dosage: newDosage || '1 tablet',
      instructions: newInstructions || 'Take with water',
      timeSlot: newTime,
      slotName: newSlot,
      status: 'pending'
    });

    setNewMedName('');
    setNewDosage('');
    setNewInstructions('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 p-4 bg-[#f8faf9] flex flex-col justify-between">
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
            <h2 className="text-sm font-extrabold text-slate-900">Medicines & Reminders</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg hover:bg-teal-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Adherence Card */}
        <div className="mt-3 p-4 bg-gradient-to-r from-teal-700 to-teal-800 rounded-3xl text-white shadow-md shadow-teal-900/10">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">Today's Schedule</span>
              <h3 className="text-xl font-black mt-0.5">{adherenceRate}% Completed</h3>
              <p className="text-xs text-teal-100/90 mt-0.5">
                {takenCount} of {reminders.length} doses logged
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-teal-400/40 flex items-center justify-center font-bold text-sm bg-teal-800/80">
              {takenCount}/{reminders.length}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-teal-900/50 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${adherenceRate}%` }}
            />
          </div>
        </div>

        {/* Medication List by Time */}
        <div className="mt-4 space-y-3">
          <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
            Active Schedule
          </div>

          {reminders.length === 0 ? (
            <div className="py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">No medications have been added.</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Scan a prescription or tap "Add Medication" below to set up dosage reminders and track your adherence.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors shadow-xs"
              >
                + Add Medication
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reminders.map(rem => {
                const isTaken = rem.status === 'taken';
                const isSkipped = rem.status === 'skipped';

                return (
                  <div
                    key={rem.id}
                    className={`p-3.5 bg-white rounded-2xl border transition-all ${
                      isTaken ? 'border-emerald-200/80 bg-emerald-50/20' :
                      isSkipped ? 'border-slate-200 opacity-60' :
                      'border-slate-200/90 shadow-2xs hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isTaken ? 'bg-emerald-100 text-emerald-800' :
                          isSkipped ? 'bg-slate-100 text-slate-500' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{rem.medicineName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {rem.dosage} · <span className="font-semibold text-teal-800">{rem.timeSlot} ({rem.slotName})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{rem.instructions}</div>
                        </div>
                      </div>

                      {/* Status / Action */}
                      <div className="flex items-center gap-1.5">
                        {isTaken ? (
                          <button
                            onClick={() => onToggleStatus(rem.id, 'pending')}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold"
                            title="Click to undo"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Taken</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTakeNow(rem.id)}
                              className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                            >
                              Take now
                            </button>
                            <button
                              onClick={() => onToggleStatus(rem.id, 'skipped')}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                              title="Skip dose"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-4 p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-[11px] text-teal-900 leading-snug">
        ⚠️ <strong>Prescription Safety:</strong> Medication schedules are populated from clinician prescriptions. Never modify your prescribed dose without medical advice.
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Add Medicine Reminder</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Medicine Name & Strength</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650 mg"
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dosage Form</label>
                <input
                  type="text"
                  placeholder="e.g. 1 tablet daily"
                  value={newDosage}
                  onChange={e => setNewDosage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={newTime}
                    onChange={(e: any) => setNewTime(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl outline-none bg-white focus:border-teal-700"
                  >
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="08:30 PM">08:30 PM</option>
                    <option value="09:30 PM">09:30 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Timing</label>
                  <select
                    value={newSlot}
                    onChange={(e: any) => setNewSlot(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl outline-none bg-white focus:border-teal-700"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Take after food"
                  value={newInstructions}
                  onChange={e => setNewInstructions(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors mt-2"
              >
                Save Reminder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
