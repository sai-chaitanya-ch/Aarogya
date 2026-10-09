import { UserProfile, MedicalRecord, ActiveMedicationReminder, Appointment, Doctor, PatientListItem } from '../types';

export const initialUserProfile: UserProfile = {
  id: '',
  name: '',
  dob: '',
  age: 0,
  gender: 'other',
  bloodGroup: '',
  location: '',
  phone: '',
  emergencyContact: '',
  allergies: [],
  conditions: [],
  preferredLanguage: 'en',
  avatarUrl: '',
  abhaLinked: false,
  abhaId: '',
  abhaAddress: ''
};

export const samplePrescriptionSvg = '';
export const sampleCBCReportSvg = '';

export const initialMedicalRecords: MedicalRecord[] = [];
export const initialReminders: ActiveMedicationReminder[] = [];
export const initialAppointments: Appointment[] = [];
export const doctorPortalPatients: PatientListItem[] = [];

export const nearbyDoctors: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. Sunita Sharma',
    qualifications: 'MBBS, MD (General Medicine)',
    specialty: 'General Medicine',
    regNumber: 'MCI12345',
    clinicName: 'City Care Polyclinic',
    address: 'MG Road, Main Market',
    city: 'Vijayawada',
    distanceKm: 0.8,
    rating: 4.8,
    experienceYears: 14,
    consultationFee: 400,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813637-bf78546194b3?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98480 12345'
  },
  {
    id: 'doc_2',
    name: 'Dr. Rajesh Verma',
    qualifications: 'MBBS, DNB (Cardiology)',
    specialty: 'Cardiology',
    regNumber: 'APMC54321',
    clinicName: 'Heart Care Center',
    address: 'Ring Road, Sector 4',
    city: 'Vijayawada',
    distanceKm: 2.3,
    rating: 4.9,
    experienceYears: 20,
    consultationFee: 700,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 94400 98765'
  },
  {
    id: 'doc_3',
    name: 'Dr. K. S. Rao',
    qualifications: 'MBBS, MD (Pediatrics)',
    specialty: 'Pediatrics',
    regNumber: 'APMC67890',
    clinicName: 'Child Care Clinic',
    address: 'Governorpet, Near Post Office',
    city: 'Vijayawada',
    distanceKm: 1.5,
    rating: 4.6,
    experienceYears: 11,
    consultationFee: 350,
    availableToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    phone: '+91 99890 23456'
  },
  {
    id: 'doc_4',
    name: 'Dr. Padmavati Rao',
    qualifications: 'MBBS, MS (Obstetrics & Gynecology)',
    specialty: 'Gynecology',
    regNumber: 'APMC88991',
    clinicName: 'Mother & Child Hospital',
    address: 'Benz Circle, Center City',
    city: 'Vijayawada',
    distanceKm: 4.1,
    rating: 4.7,
    experienceYears: 16,
    consultationFee: 550,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98483 44556'
  }
];

export const labTrendsData = {
  hemoglobin: [],
  fastingSugar: [],
  systolicBP: []
};
