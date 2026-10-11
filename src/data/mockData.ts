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
    name: 'Dr. Sunita Sharma (Synthetic Demo)',
    qualifications: 'MBBS, MD (General Medicine) · Demo Profile',
    specialty: 'General Medicine',
    regNumber: 'DEMO-MCI-12345',
    clinicName: 'City Care Polyclinic (Demo)',
    address: 'MG Road, Main Market',
    city: 'Vijayawada (Demo)',
    distanceKm: 0.8,
    rating: 4.8,
    experienceYears: 14,
    consultationFee: 400,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813637-bf78546194b3?w=150&auto=format&fit=crop&q=80',
    phone: '+91 90000 12345 (Fictional)'
  },
  {
    id: 'doc_2',
    name: 'Dr. Rajesh Verma (Synthetic Demo)',
    qualifications: 'MBBS, DNB (Cardiology) · Demo Profile',
    specialty: 'Cardiology',
    regNumber: 'DEMO-APMC-54321',
    clinicName: 'Heart Care Center (Demo)',
    address: 'Ring Road, Sector 4',
    city: 'Vijayawada (Demo)',
    distanceKm: 2.3,
    rating: 4.9,
    experienceYears: 20,
    consultationFee: 700,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 90000 98765 (Fictional)'
  },
  {
    id: 'doc_3',
    name: 'Dr. K. S. Rao (Synthetic Demo)',
    qualifications: 'MBBS, MD (Pediatrics) · Demo Profile',
    specialty: 'Pediatrics',
    regNumber: 'DEMO-APMC-67890',
    clinicName: 'Child Care Clinic (Demo)',
    address: 'Governorpet, Near Post Office',
    city: 'Vijayawada (Demo)',
    distanceKm: 1.5,
    rating: 4.6,
    experienceYears: 11,
    consultationFee: 350,
    availableToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    phone: '+91 90000 23456 (Fictional)'
  },
  {
    id: 'doc_4',
    name: 'Dr. Padmavati Rao (Synthetic Demo)',
    qualifications: 'MBBS, MS (Obstetrics & Gynecology) · Demo Profile',
    specialty: 'Gynecology',
    regNumber: 'DEMO-APMC-88991',
    clinicName: 'Mother & Child Hospital (Demo)',
    address: 'Benz Circle, Center City',
    city: 'Vijayawada (Demo)',
    distanceKm: 4.1,
    rating: 4.7,
    experienceYears: 16,
    consultationFee: 550,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    phone: '+91 90000 44556 (Fictional)'
  }
];

export const labTrendsData = {
  hemoglobin: [],
  fastingSugar: [],
  systolicBP: []
};
