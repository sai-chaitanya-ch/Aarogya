import { Language, MedicalRecord } from '../types';
import { supabase } from './supabase';

const BACKEND_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

export interface BackendProcessResponse {
  success: boolean;
  raw_ocr_text: string;
  provider: string;
  model: string;
  fallback_used: boolean;
  file_stored: false;
  requires_review: true;
  data: {
    document_type?: string;
    patient_name?: string;
    visit_date?: string;
    doctor_name?: string;
    facility_name?: string;
    medicines?: Array<Record<string, any>>;
    lab_values?: Array<Record<string, any>>;
    ai_summary?: Record<string, string>;
    review_alerts?: string[];
  };
}

async function authenticatedHeaders(json = false): Promise<Record<string, string>> {
  if (!supabase) {
    throw new Error('Aarogya authentication is not configured. Please contact the administrator.');
  }
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }
  return {
    Authorization: `Bearer ${data.session.access_token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function responseError(response: Response): Promise<Error> {
  let message = `Aarogya backend request failed (${response.status}).`;
  try {
    const body = await response.json();
    if (typeof body?.detail === 'string') {
      message = body.detail;
    } else if (Array.isArray(body?.detail)) {
      message = body.detail.map((e: any) => e.msg || e.message || String(e)).join('; ');
    }
  } catch {
    // Keep generic error; never expose raw server response contents.
  }
  return new Error(message);
}

export async function checkBackendHealth(): Promise<{ isOnline: boolean; details?: any }> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) return { isOnline: true, details: await response.json() };
  } catch {
    // Health status is informational; don't expose provider credentials or errors.
  }
  return { isOnline: false };
}

function validIsoDate(value?: string): string {
  if (!value) return '';
  const text = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export async function processDocumentWithBackend(
  file: File | null,
  presetType: 'prescription' | 'cbc' | 'discharge' | 'custom',
  patientName?: string
): Promise<{ record: MedicalRecord; rawExtractedText: string; provider: string; model: string; fallbackUsed: boolean }> {
  if (!file) throw new Error('Choose a PDF or image before processing. Sample placeholders are not medical records.');
  const headers = await authenticatedHeaders();
  const form = new FormData();
  form.append('file', file);
  form.append('preset_type', presetType);
  if (patientName && patientName.trim()) form.append('patient_name', patientName.trim());

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/documents/process`, {
      method: 'POST',
      headers,
      body: form,
      signal: AbortSignal.timeout(60000),
    });
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.message?.includes('timeout') || err?.message?.includes('aborted')) {
      throw new Error('Document processing timed out after 60 seconds. The backend may be warming up or processing a large file. Please retry.');
    }
    throw new Error('Aarogya document processing is unreachable. Check the backend deployment and try again.');
  }

  if (!response.ok) {
    if (response.status === 503) {
      let detailMsg = '';
      try {
        const body = await response.json();
        detailMsg = typeof body?.detail === 'string' ? body.detail : '';
      } catch {}
      throw new Error(detailMsg || 'AI extraction service is temporarily unavailable or overloaded. You can retry extraction or enter details manually.');
    }
    if (response.status === 429) {
      throw new Error('AI request quota reached. Please wait a moment and retry.');
    }
    throw await responseError(response);
  }

  const result = (await response.json()) as BackendProcessResponse;
  if (!result.success || !result.data) throw new Error('The document was not processed. Please retry.');
  const data = result.data;
  const medicines = (data.medicines || []).filter(m => String(m.name || '').trim()).map((medicine, index) => ({
    id: `candidate-med-${index + 1}`,
    name: String(medicine.name || ''),
    dosage: String(medicine.dosage || ''),
    frequency: String(medicine.frequency || ''),
    duration: String(medicine.duration || ''),
    timing: (['morning', 'afternoon', 'evening', 'night', 'multiple'].includes(medicine.timing) ? medicine.timing : 'multiple') as MedicalRecord['medicines'][number]['timing'],
    instructions: String(medicine.instructions || ''),
  }));
  const labValues = (data.lab_values || []).filter(lab => String(lab.test_name || '').trim()).map((lab, index) => ({
    id: `candidate-lab-${index + 1}`,
    testName: String(lab.test_name || ''),
    value: String(lab.value || ''),
    numericValue: Number.parseFloat(String(lab.value || '').replace(/,/g, '')) || 0,
    unit: String(lab.unit || ''),
    referenceRange: String(lab.reference_range || ''),
    status: (['normal', 'low', 'high', 'unknown'].includes(lab.status) ? lab.status : 'unknown') as MedicalRecord['labValues'][number]['status'],
    notes: String(lab.notes || ''),
  }));

  const summary = data.ai_summary || {};
  const type = data.document_type;
  const documentType: MedicalRecord['documentType'] =
    type === 'Lab Report' || type === 'Discharge Summary' || type === 'X-Ray / Imaging' || type === 'Clinical Notes'
      ? type
      : 'Prescription';

  const record: MedicalRecord = {
    id: `candidate-${crypto.randomUUID()}`,
    title: `${type || 'Medical Document'}${data.facility_name ? ` — ${data.facility_name}` : ''}`,
    documentType,
    patientName: String(data.patient_name || ''),
    visitDate: validIsoDate(data.visit_date),
    doctorName: String(data.doctor_name || ''),
    facilityName: String(data.facility_name || ''),
    status: 'pending_review',
    aiSummary: {
      en: String(summary.en || ''),
      te: String(summary.te || ''),
      hi: String(summary.hi || ''),
      ta: String(summary.ta || ''),
    },
    keyFindings: Array.isArray(data.review_alerts) ? data.review_alerts.map(String) : [],
    medicines,
    labValues,
    originalFileName: file.name,
    rawExtractedText: String(result.raw_ocr_text || ''),
    createdAt: new Date().toISOString(),
  };
  return {
    record,
    rawExtractedText: String(result.raw_ocr_text || ''),
    provider: result.provider,
    model: result.model,
    fallbackUsed: result.fallback_used,
  };
}

export async function indexDocumentForRag(documentId: string): Promise<{ chunks_indexed: number; embedding_model: string }> {
  const headers = await authenticatedHeaders(true);
  const response = await fetch(`${BACKEND_URL}/api/rag/index`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ document_id: documentId }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw await responseError(response);
  return response.json();
}

export async function reindexMyRecordsForRag(): Promise<{ total_documents: number; indexed_documents: number; failed_documents: Array<{ document_id: string; reason: string }> }> {
  const headers = await authenticatedHeaders();
  const response = await fetch(`${BACKEND_URL}/api/rag/reindex`, {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok) throw await responseError(response);
  return response.json();
}

export interface ChatBackendResult {
  text: string;
  citations: { documentTitle: string; documentDate: string; recordId: string; similarity?: number; source?: string }[];
  isEmergency: boolean;
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
  retrievalMode?: string;
}

export async function sendChatToBackend(
  query: string,
  language: Language,
  _records: MedicalRecord[]
): Promise<ChatBackendResult> {
  const headers = await authenticatedHeaders(true);
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers,
      // No patient context is accepted from the browser. Backend RAG loads authorized rows itself.
      body: JSON.stringify({ query, language }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      throw new Error('Aarogya AI response timed out. The server may be waking up — please try again in a moment.');
    }
    if (err?.message && !err.message.includes('fetch')) {
      throw err;
    }
    throw new Error('Aarogya AI backend is temporarily unreachable. Please ensure the backend is running and reachable.');
  }
  if (!response.ok) throw await responseError(response);
  const data = await response.json();
  return {
    text: String(data.reply || data.response || ''),
    citations: (data.citations || []).map((citation: any) => ({
      documentTitle: String(citation.documentTitle || citation.document_title || 'Medical record'),
      documentDate: String(citation.documentDate || citation.document_date || ''),
      recordId: String(citation.recordId || citation.record_id || ''),
      similarity: typeof citation.similarity === 'number' ? citation.similarity : undefined,
      source: citation.source,
    })),
    isEmergency: Boolean(data.is_emergency),
    provider: data.provider,
    model: data.model,
    fallbackUsed: Boolean(data.fallback_used),
    retrievalMode: data.retrieval_mode,
  };
}
