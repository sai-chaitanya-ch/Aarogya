import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { indexDocumentForRag } from '../services/api';
import { useAuth } from './AuthContext';
import { MedicalRecord, ActiveMedicationReminder, Appointment } from '../types';

interface HealthDataContextType {
  records: MedicalRecord[];
  reminders: ActiveMedicationReminder[];
  appointments: Appointment[];
  isLoading: boolean;
  dbError: string | null;
  refetchData: () => Promise<void>;
  addRecord: (record: MedicalRecord, fileBlob?: File | Blob) => Promise<void>;
  updateRecord: (id: string, updated: Partial<MedicalRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  toggleReminderStatus: (id: string, newStatus: 'taken' | 'skipped' | 'pending') => Promise<void>;
  addReminder: (reminder: ActiveMedicationReminder) => Promise<void>;
  bookAppointment: (appointment: Appointment) => Promise<void>;
  notificationToast: string | null;
  clearNotificationToast: () => void;
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export const HealthDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Pure zero-state defaults for true authenticated security
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [reminders, setReminders] = useState<ActiveMedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const loadSupabaseData = useCallback(async () => {
    const client = supabase;
    if (!client || !isAuthenticated || !user.id) {
      setRecords([]);
      setReminders([]);
      setAppointments([]);
      return;
    }

    setIsLoading(true);
    setDbError(null);
    try {
      // 1. Fetch patient's medical documents (strictly authorized to user.id)
      const { data: docData, error: docError } = await client
        .from('medical_documents')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (docError) {
        throw docError;
      }

      // Explicitly set empty array if 0 records returned
      if (!docData || docData.length === 0) {
        setRecords([]);
      } else {
        // Resolve signed URLs for each private document
        const mappedDocs: MedicalRecord[] = await Promise.all(
          docData.map(async (d) => {
            let signedUrl = '';
            if (d.storage_path) {
              const { data: sData } = await client.storage
                .from('medical-records')
                .createSignedUrl(d.storage_path, 3600);
              signedUrl = sData?.signedUrl || '';
            }

            return {
              id: d.id,
              title: d.title,
              documentType: d.document_type,
              patientName: user.name || 'Patient',
              visitDate: d.visit_date,
              doctorName: d.extracted_fields?.doctor_name || 'Healthcare Professional',
              facilityName: d.facility_name || 'Clinic',
              status: d.status,
              originalFileUrl: signedUrl,
              originalFileName: d.file_name,
              aiSummary: d.ai_summary || { en: 'Record verified.' },
              keyFindings: d.review_alerts || [],
              medicines: d.extracted_fields?.medicines || [],
              labValues: d.extracted_fields?.lab_values || [],
              createdAt: d.created_at
            };
          })
        );
        setRecords(mappedDocs);
      }

      // 2. Fetch medication reminders (strictly authorized to user.id)
      const { data: remData, error: remError } = await client
        .from('medication_reminders')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (remError) {
        throw remError;
      }

      if (!remData || remData.length === 0) {
        setReminders([]);
      } else {
        const mappedRems: ActiveMedicationReminder[] = remData.map(r => ({
          id: r.id,
          medicineName: r.medicine_name,
          dosage: r.dosage,
          instructions: r.instructions || '',
          timeSlot: r.time_slot,
          slotName: r.slot_name,
          status: r.status,
          takenAt: r.taken_at ? new Date(r.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        }));
        setReminders(mappedRems);
      }

      // 3. Fetch appointments (strictly authorized to user.id)
      const { data: aptData, error: aptError } = await client
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (aptError) {
        throw aptError;
      }

      if (!aptData || aptData.length === 0) {
        setAppointments([]);
      } else {
        const mappedApts: Appointment[] = aptData.map(a => ({
          id: a.id,
          patientName: user.name,
          patientId: user.id,
          doctorName: 'Attending Clinician',
          doctorSpecialty: 'General Medicine',
          hospitalClinic: 'Care Facility',
          date: a.appointment_date,
          time: a.appointment_time,
          type: a.consultation_type,
          status: a.status,
          notes: a.clinical_notes
        }));
        setAppointments(mappedApts);
      }
    } catch (err: any) {
      console.warn('Supabase fetch error:', err);
      setDbError(err?.message || 'Failed to load records from database.');
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.name, isAuthenticated]);

  // Load data and maintain live subscription when authenticated
  useEffect(() => {
    const client = supabase;
    if (!client || !isAuthenticated || !user.id) {
      setRecords([]);
      setReminders([]);
      setAppointments([]);
      return;
    }

    loadSupabaseData();

    // Set up Realtime Subscription for live doctor updates restricted to this patient
    const channel = client
      .channel(`patient-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'medical_documents', filter: `patient_id=eq.${user.id}` },
        (payload) => {
          setNotificationToast(`📋 New medical record received: ${payload.new.title}`);
          loadSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'medication_reminders', filter: `patient_id=eq.${user.id}` },
        (payload) => {
          setNotificationToast(`💊 New medicine reminder scheduled: ${payload.new.medicine_name}`);
          loadSupabaseData();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user.id, isAuthenticated, loadSupabaseData]);

  const addRecord = async (newRecord: MedicalRecord, fileBlob?: File | Blob) => {
    const client = supabase;
    if (!client || !isAuthenticated || !user.id) {
      throw new Error('Sign in to save medical records.');
    }

    if (!fileBlob) {
      throw new Error('Medical document file is required. Placeholders or empty files cannot be stored.');
    }

    const cleanName = (fileBlob as File).name?.replace(/[^a-zA-Z0-9._-]/g, '_') || `scan_${Date.now()}.jpg`;
    const uniqueFileName = `${Date.now()}_${cleanName}`;
    const storagePath = `${user.id}/${uniqueFileName}`;
    const mimeType = fileBlob.type || 'image/jpeg';
    const fileSizeBytes = fileBlob.size;

    // 1. Upload bytes to medical-records/${user.id}/${uniqueFileName}
    const { error: uploadError } = await client.storage
      .from('medical-records')
      .upload(storagePath, fileBlob, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Document upload to secure storage failed: ${uploadError.message}`);
    }

    // 2. Upsert profile row to ensure foreign key constraint is satisfied
    const { error: profileError } = await client.from('profiles').upsert({
      id: user.id,
      full_name: user.name || 'Patient',
      preferred_language: user.preferredLanguage || 'en'
    }, { onConflict: 'id' });

    if (profileError) {
      try {
        await client.storage.from('medical-records').remove([storagePath]);
      } catch {}
      throw new Error(`Failed to verify patient profile: ${profileError.message}`);
    }

    // 3. Insert record into medical_documents
    const { data: inserted, error: insertError } = await client
      .from('medical_documents')
      .insert({
        patient_id: user.id,
        title: newRecord.title,
        document_type: newRecord.documentType,
        visit_date: newRecord.visitDate || new Date().toISOString().split('T')[0],
        facility_name: newRecord.facilityName || '',
        storage_path: storagePath,
        file_name: (fileBlob as File).name || newRecord.originalFileName || uniqueFileName,
        file_size_bytes: fileSizeBytes,
        mime_type: mimeType,
        status: newRecord.status || 'verified',
        ai_summary: newRecord.aiSummary,
        extracted_fields: {
          doctor_name: newRecord.doctorName,
          medicines: newRecord.medicines,
          lab_values: newRecord.labValues,
          raw_ocr_text: newRecord.rawExtractedText || ''
        },
        review_alerts: newRecord.keyFindings || []
      })
      .select()
      .single();

    if (insertError || !inserted) {
      try {
        await client.storage.from('medical-records').remove([storagePath]);
      } catch {}
      throw new Error(`Failed to save medical document record: ${insertError?.message || 'Database insert failed'}`);
    }

    // Generate temporary signed URL for immediate preview
    let signedUrl = '';
    try {
      const { data: signData } = await client.storage
        .from('medical-records')
        .createSignedUrl(storagePath, 3600);
      signedUrl = signData?.signedUrl || '';
    } catch {}

    const freshRecord: MedicalRecord = {
      ...newRecord,
      id: inserted.id,
      originalFileUrl: signedUrl || undefined,
      createdAt: inserted.created_at || new Date().toISOString()
    };
    setRecords(prev => [freshRecord, ...prev]);

    // Automatically create reminders for any extracted medicines
    if (newRecord.medicines && newRecord.medicines.length > 0) {
      for (const m of newRecord.medicines) {
        if (!m.name.trim()) continue;
        await addReminder({
          id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          medicineName: m.name,
          dosage: m.dosage,
          instructions: m.instructions || m.frequency,
          timeSlot: m.timing === 'night' ? '09:30 PM' : m.timing === 'afternoon' ? '01:30 PM' : '08:00 AM',
          slotName: m.timing === 'night' ? 'Night' : m.timing === 'afternoon' ? 'Afternoon' : 'Morning',
          status: 'pending'
        });
      }
    }

    // 4. Index document for RAG search
    try {
      await indexDocumentForRag(inserted.id);
    } catch (ragErr: any) {
      setNotificationToast('⚠️ Document saved, but AI search indexing needs retry. RAG is not ready yet.');
    }
  };

  const updateRecord = async (id: string, updated: Partial<MedicalRecord>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    const client = supabase;
    if (client && isAuthenticated && user.id) {
      try {
        await client
          .from('medical_documents')
          .update({
            title: updated.title,
            facility_name: updated.facilityName,
            status: updated.status
          })
          .eq('id', id)
          .eq('patient_id', user.id);
      } catch (err) {
        console.warn('Error updating document in Supabase:', err);
      }
    }
  };

  const deleteRecord = async (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    const client = supabase;
    if (client && isAuthenticated && user.id) {
      try {
        await client
          .from('medical_documents')
          .delete()
          .eq('id', id)
          .eq('patient_id', user.id);
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

    const client = supabase;
    if (client && isAuthenticated && user.id) {
      try {
        await client
          .from('medication_reminders')
          .update({
            status: newStatus,
            taken_at: newStatus === 'taken' ? new Date().toISOString() : null
          })
          .eq('id', id)
          .eq('patient_id', user.id);
      } catch (err) {
        console.warn('Error updating reminder in Supabase:', err);
      }
    }
  };

  const addReminder = async (newRem: ActiveMedicationReminder) => {
    setReminders(prev => [newRem, ...prev]);
    const client = supabase;
    if (client && isAuthenticated && user.id) {
      try {
        const { data } = await client
          .from('medication_reminders')
          .insert({
            patient_id: user.id,
            medicine_name: newRem.medicineName,
            dosage: newRem.dosage,
            instructions: newRem.instructions,
            time_slot: newRem.timeSlot,
            slot_name: newRem.slotName,
            status: 'pending'
          })
          .select()
          .single();

        if (data) {
          setReminders(prev => prev.map(r => r.id === newRem.id ? { ...r, id: data.id } : r));
        }
      } catch (err) {
        console.warn('Error saving reminder in Supabase:', err);
      }
    }
  };

  const bookAppointment = async (newApt: Appointment) => {
    setAppointments(prev => [newApt, ...prev]);
    const client = supabase;
    if (client && isAuthenticated && user.id) {
      try {
        const { data } = await client
          .from('appointments')
          .insert({
            patient_id: user.id,
            appointment_date: newApt.date || new Date().toISOString().split('T')[0],
            appointment_time: newApt.time,
            consultation_type: newApt.type,
            status: 'upcoming',
            clinical_notes: newApt.notes
          })
          .select()
          .single();

        if (data) {
          setAppointments(prev => prev.map(a => a.id === newApt.id ? { ...a, id: data.id } : a));
        }
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
        dbError,
        refetchData: loadSupabaseData,
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
