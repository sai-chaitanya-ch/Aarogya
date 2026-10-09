import { Language, MedicalRecord } from '../types';
import { analyzeDocument, generateAarogyaChatResponse } from './aiService';
import { supabase } from './supabase';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface BackendProcessResponse {
  success: boolean;
  record_id: string;
  storage_path: string;
  signed_url: string;
  is_private_bucket: boolean;
  data: any;
}

/**
 * Checks if the FastAPI backend on Render is reachable.
 */
export async function checkBackendHealth(): Promise<{ isOnline: boolean; details?: any }> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return { isOnline: true, details: data };
    }
  } catch (e) {
    // Backend offline / not yet deployed
  }
  return { isOnline: false };
}

/**
 * Sends uploaded medical document to the FastAPI backend.
 * Uses lightweight OCR & Gemini Vision on the backend, saves to private Supabase bucket, and returns signed URL.
 */
export async function processDocumentWithBackend(
  file: File | null,
  presetType: 'prescription' | 'cbc' | 'discharge' | 'custom',
  patientName: string
): Promise<{ record: MedicalRecord; signedUrl?: string }> {
  try {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('preset_type', presetType);
    formData.append('patient_name', patientName);

    // Retrieve active Supabase access token if available
    let authHeaders: Record<string, string> = {};
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    const res = await fetch(`${BACKEND_URL}/api/documents/process`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
      signal: AbortSignal.timeout(25000)
    });

    if (res.ok) {
      const result: BackendProcessResponse = await res.json();
      const d = result.data;

      const record: MedicalRecord = {
        id: result.record_id,
        title: `${d.document_type || 'Medical Document'} - ${d.doctor_name || d.facility_name || 'Care Center'}`,
        documentType: d.document_type || 'Prescription',
        patientName: d.patient_name || patientName,
        visitDate: d.visit_date || 'Today',
        doctorName: d.doctor_name || '',
        facilityName: d.facility_name || '',
        status: 'verified',
        originalFileUrl: result.signed_url,
        aiSummary: d.ai_summary || { en: 'Processed with medical OCR & AI.' },
        keyFindings: d.review_alerts || [],
        medicines: (d.medicines || []).map((m: any, idx: number) => ({
          id: `m_${idx}`,
          name: m.name,
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          duration: m.duration || '7 days',
          timing: m.timing || 'morning',
          instructions: m.instructions || ''
        })),
        labValues: (d.lab_values || []).map((l: any, idx: number) => ({
          id: `l_${idx}`,
          testName: l.test_name,
          value: l.value,
          numericValue: parseFloat(l.value) || 0,
          unit: l.unit || '',
          referenceRange: l.reference_range || '',
          status: l.status || 'normal',
          notes: l.notes || ''
        })),
        createdAt: new Date().toISOString()
      };

      return { record, signedUrl: result.signed_url };
    }
  } catch (err) {
    console.info('Backend not active or unauthenticated. Using local review pipeline:', err);
  }

  // Graceful fallback to client-side pipeline
  const fallback = analyzeDocument(presetType, patientName);
  const fallbackRecord: MedicalRecord = {
    id: `rec_${Date.now()}`,
    title: presetType === 'cbc' ? 'Lab Report' : 'Prescription',
    documentType: presetType === 'cbc' ? 'Lab Report' : 'Prescription',
    patientName,
    visitDate: fallback.visitDate,
    doctorName: fallback.doctorName,
    facilityName: fallback.facilityName,
    status: 'verified',
    aiSummary: fallback.aiExplanation,
    keyFindings: fallback.reviewAlerts,
    medicines: fallback.medicines,
    labValues: fallback.labValues,
    createdAt: new Date().toISOString()
  };

  return { record: fallbackRecord };
}

/**
 * Sends chat message to backend (Gemini API) with fallback to local engine.
 */
export async function sendChatToBackend(
  query: string,
  language: Language,
  records: MedicalRecord[]
): Promise<{ text: string; citations: any[]; isEmergency: boolean }> {
  try {
    const contextSummary = records.map(r => `${r.title} (${r.visitDate}): ${r.aiSummary.en}`).join('\n');
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, message: query, language, context: contextSummary }),
      signal: AbortSignal.timeout(25000)
    });

    if (res.ok) {
      const data = await res.json();
      return {
        text: data.reply || data.response || '',
        citations: data.citations || [],
        isEmergency: data.is_emergency || false
      };
    }
  } catch (e) {
    // fallback
  }

  const localRes = generateAarogyaChatResponse(query, language, records);
  return {
    text: localRes.text,
    citations: localRes.citations,
    isEmergency: localRes.isEmergencyAlert
  };
}
