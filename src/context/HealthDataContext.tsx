import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { MedicalRecord, ActiveMedicationReminder, Appointment } from '../types';
import { 
  initialMedicalRecords, 
  initialReminders, 
  initialAppointments 
} from '../data/mockData';

interface HealthDataContextType {
  records: MedicalRecord[];
  reminders: ActiveMedicationReminder[];
  appointments: Appointment[];
  isLoading: boolean;
  addRecord: (record: MedicalRecord) => Promise<void>;
  updateRecord: (id: string, updated: Partial<MedicalRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  toggleReminderStatus: (id: string, newStatus: 'taken' | 'skipped' | 'pending') => Promise<void>;
  addReminder: (reminder: ActiveMedicationReminder) => Promise<void>;
  bookAppointment: (appointment: Appointment) => Promise<void>;
  notificationToast: string | null;
  clearNotificationToast: () => void;
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

const STORAGE_RECORDS_KEY = 'aarogya_records_v2';
const STORAGE_REMINDERS_KEY = 'aarogya_reminders_v2';
const STORAGE_APPOINTMENTS_KEY = 'aarogya_appointments_v2';

export const HealthDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGuestDemo } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Records state
  const [records, setRecords] = useState<MedicalRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_RECORDS_KEY);
    return saved ? JSON.parse(saved) : initialMedicalRecords;
  });

  // Reminders state
  const [reminders, setReminders] = useState<ActiveMedicationReminder[]>(() => {
    const saved = localStorage.getItem(STORAGE_REMINDERS_KEY);
    return saved ? JSON.parse(saved) : initialReminders;
  });

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_APPOINTMENTS_KEY);
    return saved ? JSON.parse(saved) : initialAppointments;
  });

  // Local storage persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_REMINDERS_KEY, JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_APPOINTMENTS_KEY, JSON.stringify(appointments));
  }, [appointments]);

  // Load from Supabase PostgreSQL if logged in with Supabase
  useEffect(() => {
    const client = supabase;
    if (!client || isGuestDemo) return;

    const loadSupabaseData = async () => {
      setIsLoading(true);
      try {
        // Fetch medical documents
        const { data: docData } = await client
          .from('medical_documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (docData && docData.length > 0) {
          const mappedDocs: MedicalRecord[] = docData.map(d => ({
            id: d.id,
            title: d.title,
            documentType: d.document_type,
            patientName: user.name,
            visitDate: d.visit_date,
            doctorName: d.doctor_name || 'Consulting Clinician',
            facilityName: d.facility_name || 'Healthcare Facility',
            status: d.status,
            aiSummary: d.ai_summary || { en: 'Record verified.' },
            keyFindings: d.review_alerts || [],
            medicines: d.extracted_fields?.medicines || [],
            labValues: d.extracted_fields?.lab_values || [],
            createdAt: d.created_at
          }));
          setRecords(mappedDocs);
        }

        // Fetch medication reminders
        const { data: remData } = await client
          .from('medication_reminders')
          .select('*')
          .order('created_at', { ascending: false });

        if (remData && remData.length > 0) {
          const mappedRems: ActiveMedicationReminder[] = remData.map(r => ({
            id: r.id,
            medicineName: r.medicine_name,
            dosage: r.dosage,
            instructions: r.instructions || '',
            timeSlot: r.time_slot,
            slotName: r.slot_name,
            status: r.status,
            takenAt: r.taken_at
          }));
          setReminders(mappedRems);
        }

        // Fetch appointments
        const { data: aptData } = await client
          .from('appointments')
          .select('*')
          .order('appointment_date', { ascending: true });

        if (aptData && aptData.length > 0) {
          const mappedApts: Appointment[] = aptData.map(a => ({
            id: a.id,
            patientName: user.name,
            patientId: user.id,
            doctorName: a.doctor_name || 'Consulting Clinician',
            doctorSpecialty: a.doctor_specialty || 'General Medicine',
            hospitalClinic: a.hospital_clinic || 'Healthcare Clinic',
            date: a.appointment_date,
            time: a.appointment_time,
            type: a.consultation_type,
            status: a.status,
            notes: a.clinical_notes
          }));
          setAppointments(mappedApts);
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSupabaseData();

    // Set up Realtime Subscription for live updates (e.g. Doctor publishes prescription)
    const channel = client
      .channel('patient-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'medical_documents' },
        (payload) => {
          setNotificationToast(`📋 New medical record added: ${payload.new.title}`);
          loadSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'medication_reminders' },
        (payload) => {
          setNotificationToast(`💊 New medicine reminder scheduled: ${payload.new.medicine_name}`);
          loadSupabaseData();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user.id, user.name, isGuestDemo]);

  const addRecord = async (newRecord: MedicalRecord) => {
    setRecords(prev => [newRecord, ...prev]);

    // If new record contains medicines, automatically create active reminders
    if (newRecord.medicines && newRecord.medicines.length > 0) {
      const newMeds: ActiveMedicationReminder[] = newRecord.medicines.map((m, idx) => ({
        id: `rem_auto_${Date.now()}_${idx}`,
        medicineName: m.name,
        dosage: m.dosage,
        instructions: m.instructions || m.frequency,
        timeSlot: m.timing === 'night' ? '09:30 PM' : m.timing === 'afternoon' ? '01:30 PM' : '08:00 AM',
        slotName: m.timing === 'night' ? 'Night' : m.timing === 'afternoon' ? 'Afternoon' : 'Morning',
        status: 'pending',
        prescriptionId: newRecord.id
      }));
      setReminders(prev => [...newMeds, ...prev]);
    }

    // Persist to Supabase if logged in
    if (supabase && !isGuestDemo) {
      try {
        await supabase.from('medical_documents').insert({
          id: newRecord.id.startsWith('rec_') ? undefined : newRecord.id,
          patient_id: user.id,
          title: newRecord.title,
          document_type: newRecord.documentType,
          visit_date: new Date().toISOString().split('T')[0],
          facility_name: newRecord.facilityName,
          storage_path: `${user.id}/${newRecord.title.replace(/\s+/g, '_')}.pdf`,
          file_name: newRecord.originalFileName || 'document.pdf',
          status: newRecord.status,
          ai_summary: newRecord.aiSummary,
          extracted_fields: { medicines: newRecord.medicines, lab_values: newRecord.labValues },
          review_alerts: newRecord.keyFindings
        });
      } catch (err) {
        console.warn('Error saving to Supabase:', err);
      }
    }
  };

  const updateRecord = async (id: string, updated: Partial<MedicalRecord>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  };

  const deleteRecord = async (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    if (supabase && !isGuestDemo) {
      try {
        await supabase.from('medical_documents').delete().eq('id', id);
      } catch (err) {
        console.warn('Error deleting from Supabase:', err);
      }
    }
  };

  const toggleReminderStatus = async (id: string, newStatus: 'taken' | 'skipped' | 'pending') => {
    setReminders(prev => prev.map(r => r.id === id ? { 
      ...r, 
      status: newStatus,
      takenAt: newStatus === 'taken' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined 
    } : r));

    if (supabase && !isGuestDemo) {
      try {
        await supabase.from('medication_reminders').update({
          status: newStatus,
          taken_at: newStatus === 'taken' ? new Date().toISOString() : null
        }).eq('id', id);
      } catch (err) {
        console.warn('Error updating reminder in Supabase:', err);
      }
    }
  };

  const addReminder = async (newRem: ActiveMedicationReminder) => {
    setReminders(prev => [newRem, ...prev]);
    if (supabase && !isGuestDemo) {
      try {
        await supabase.from('medication_reminders').insert({
          patient_id: user.id,
          medicine_name: newRem.medicineName,
          dosage: newRem.dosage,
          instructions: newRem.instructions,
          time_slot: newRem.timeSlot,
          slot_name: newRem.slotName,
          status: 'pending'
        });
      } catch (err) {
        console.warn('Error saving reminder in Supabase:', err);
      }
    }
  };

  const bookAppointment = async (newApt: Appointment) => {
    setAppointments(prev => [newApt, ...prev]);
    if (supabase && !isGuestDemo) {
      try {
        await supabase.from('appointments').insert({
          patient_id: user.id,
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: newApt.time,
          consultation_type: newApt.type,
          status: 'upcoming',
          clinical_notes: newApt.notes
        });
      } catch (err) {
        console.warn('Error saving appointment in Supabase:', err);
      }
    }
  };

  const clearNotificationToast = () => setNotificationToast(null);

  return (
    <HealthDataContext.Provider
      value={{
        records,
        reminders,
        appointments,
        isLoading,
        addRecord,
        updateRecord,
        deleteRecord,
        toggleReminderStatus,
        addReminder,
        bookAppointment,
        notificationToast,
        clearNotificationToast
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
};

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};
