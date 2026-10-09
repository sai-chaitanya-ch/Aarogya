export type Language = 'en' | 'te' | 'hi' | 'ta';

export interface UserProfile {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  location: string;
  phone: string;
  emergencyContact: string;
  allergies: string[];
  conditions: string[];
  preferredLanguage: Language;
  avatarUrl?: string;
  abhaLinked: boolean;
  abhaId?: string;
  abhaAddress?: string;
}

export interface ExtractedMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., "1 tab OD", "1 tab BD after food"
  duration: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'night' | 'multiple';
  instructions?: string;
}

export interface ExtractedLabValue {
  id: string;
  testName: string;
  value: string;
  numericValue: number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high';
  notes?: string;
}

export type DocumentType = 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'X-Ray / Imaging' | 'Clinical Notes';

export interface MedicalRecord {
  id: string;
  title: string;
  documentType: DocumentType;
  patientName: string;
  visitDate: string;
  doctorName: string;
  facilityName: string;
  specialty?: string;
  originalFileUrl?: string;
  originalFileName?: string;
  isSample?: boolean;
  status: 'verified' | 'pending_review' | 'corrected';
  aiSummary: {
    en: string;
    te?: string;
    hi?: string;
    ta?: string;
  };
  keyFindings?: string[];
  medicines: ExtractedMedicine[];
  labValues: ExtractedLabValue[];
  followUpDate?: string;
  createdAt: string;
}

export interface ActiveMedicationReminder {
  id: string;
  medicineName: string;
  dosage: string;
  instructions: string;
  timeSlot: '08:00 AM' | '01:30 PM' | '08:30 PM' | '09:30 PM';
  slotName: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  status: 'pending' | 'taken' | 'skipped';
  takenAt?: string;
  prescriptionId?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospitalClinic: string;
  date: string;
  time: string;
  type: 'In-person' | 'Teleconsultation';
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Doctor {
  id: string;
  name: string;
  qualifications: string;
  specialty: string;
  regNumber: string;
  clinicName: string;
  address: string;
  city: string;
  distanceKm: number;
  rating: number;
  experienceYears: number;
  consultationFee: number;
  availableToday: boolean;
  avatarUrl: string;
  phone: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aarogya';
  text: string;
  timestamp: string;
  citations?: {
    documentTitle: string;
    documentDate: string;
    recordId: string;
  }[];
  audioAvailable?: boolean;
  isEmergencyAlert?: boolean;
}

export interface PatientListItem {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  abhaId?: string;
  lastVisit: string;
  nextFollowUp?: string;
  chronicCondition?: string;
  avatarUrl?: string;
  tag?: 'Follow-up' | 'New' | 'Chronic' | 'Stable';
}
