import { UserProfile, MedicalRecord, ActiveMedicationReminder, Appointment, PatientListItem } from '../types';

export const DEMO_PATIENT_PROFILE: UserProfile = {
  id: 'demo-patient-sim-user',
  name: 'Demo Patient A',
  dob: '1992-06-15',
  age: 34,
  gender: 'female',
  bloodGroup: 'B+',
  location: 'Hyderabad, Telangana (Demo)',
  phone: '+91 90000 00000 (Fictional)',
  emergencyContact: '+91 91111 11111 (Fictional)',
  allergies: ['Penicillin (Synthetic Demo)'],
  conditions: ['Mild Hypertension (Synthetic Demo)', 'Seasonal Rhinitis'],
  preferredLanguage: 'en',
  email: 'demo.patient@aarogya.demo.local',
  abhaLinked: true,
  abhaId: '91-0000-0000-0001',
  abhaAddress: 'demopatient.a@abdm'
};

export const DEMO_DOCTOR_PROFILE: UserProfile = {
  id: 'demo-doctor-sim-user',
  name: 'Demo Clinician (Unverified)',
  dob: '1985-04-10',
  age: 41,
  gender: 'male',
  bloodGroup: 'O+',
  location: 'Bengaluru, Karnataka (Demo)',
  phone: '+91 92222 22222 (Fictional)',
  emergencyContact: '+91 93333 33333 (Fictional)',
  allergies: [],
  conditions: [],
  preferredLanguage: 'en',
  email: 'demo.doctor@aarogya.demo.local',
  abhaLinked: false
};

export const DEMO_RECORDS: MedicalRecord[] = [
  {
    id: 'demo-rec-cbc-01',
    title: 'Complete Blood Count (CBC) — Demo Diagnostic Lab',
    documentType: 'Lab Report',
    patientName: 'Demo Patient A',
    visitDate: '2026-09-18',
    doctorName: 'Dr. Synthetic Reviewer (Unverified)',
    facilityName: 'Demo Diagnostic Centre',
    specialty: 'Pathology',
    status: 'verified',
    aiSummary: {
      en: 'Synthetic CBC report showing mild microcytic anemia with hemoglobin at 10.8 g/dL and normal platelet count. Dietary iron intake recommended.',
      te: 'హిమోగ్లోబిన్ 10.8 g/dL తో తేలికపాటి రక్తహీనతను చూపే నమూనా CBC నివేదిక.',
      hi: 'माइल्ड एनीमिया दर्शाने वाली डेमो सीबीसी रिपोर्ट (हीमोग्लोबिन 10.8 g/dL)।',
      ta: 'ஹீமோகுளோபின் 10.8 g/dL உடன் மிதமான இரத்த சோகையைக் காட்டும் மாதிரி சிபிசி அறிக்கை.'
    },
    keyFindings: [
      'Hemoglobin slightly below standard female threshold (10.8 g/dL vs reference 12.0 - 15.5 g/dL)',
      'Total Leucocyte Count (WBC) within reference limits (6,800 /uL)',
      'Platelet count adequate (240,000 /uL)'
    ],
    medicines: [],
    labValues: [
      {
        id: 'demo-lab-hb',
        testName: 'Hemoglobin',
        value: '10.8',
        numericValue: 10.8,
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5',
        status: 'low',
        notes: 'Mild nutritional anemia indicator in synthetic demo'
      },
      {
        id: 'demo-lab-wbc',
        testName: 'Total WBC Count',
        value: '6800',
        numericValue: 6800,
        unit: '/uL',
        referenceRange: '4000 - 11000',
        status: 'normal'
      },
      {
        id: 'demo-lab-plt',
        testName: 'Platelets',
        value: '240000',
        numericValue: 240000,
        unit: '/uL',
        referenceRange: '150000 - 450000',
        status: 'normal'
      },
      {
        id: 'demo-lab-mcv',
        testName: 'MCV (Mean Corpuscular Volume)',
        value: '76',
        numericValue: 76,
        unit: 'fL',
        referenceRange: '80 - 100',
        status: 'low',
        notes: 'Microcytic red blood cell profile'
      }
    ],
    createdAt: '2026-09-18T10:30:00Z'
  },
  {
    id: 'demo-rec-rx-02',
    title: 'General Consultation Prescription — Demo Community Clinic',
    documentType: 'Prescription',
    patientName: 'Demo Patient A',
    visitDate: '2026-09-20',
    doctorName: 'Dr. Synthetic Reviewer (Unverified)',
    facilityName: 'Demo Community Health Clinic',
    specialty: 'General Medicine',
    status: 'verified',
    aiSummary: {
      en: 'Prescription for oral iron supplement and vitamin C to improve iron absorption following the CBC evaluation.',
      te: 'CBC నివేదిక ఆధారంగా ఐరన్ మరియు విటమిన్ C సప్లిమెంట్లను సూచించే ప్రిస్క్రిప్షన్.',
      hi: 'सीबीसी समीक्षा के बाद आयरन व विटामिन सी अनुपूरक का डेमो पर्चा।',
      ta: 'சிபிசி ஆய்வுக்குப் பிறகு இரும்புச்சத்து மற்றும் வைட்டமின் சி மாத்திரைகளுக்கான மருந்துச்சீட்டு.'
    },
    keyFindings: [
      'Prescribed Ferrous Ascorbate once daily after meals',
      'Hydration and dietary iron reinforcement advised'
    ],
    medicines: [
      {
        id: 'demo-med-fe',
        name: 'Ferrous Ascorbate 100mg',
        dosage: '100mg',
        frequency: '1 tab OD after dinner',
        duration: '30 days',
        timing: 'night',
        instructions: 'Take with warm water after evening meal'
      },
      {
        id: 'demo-med-vitc',
        name: 'Vitamin C 500mg (Ascorbic Acid)',
        dosage: '500mg',
        frequency: '1 tab OD morning',
        duration: '15 days',
        timing: 'morning',
        instructions: 'Chewable tablet after breakfast'
      }
    ],
    labValues: [],
    followUpDate: '2026-10-25',
    createdAt: '2026-09-20T14:15:00Z'
  }
];

export const DEMO_REMINDERS: ActiveMedicationReminder[] = [
  {
    id: 'demo-rem-01',
    medicineName: 'Vitamin C 500mg',
    dosage: '1 tab (500mg)',
    instructions: 'After breakfast with water',
    timeSlot: '08:00 AM',
    slotName: 'Morning',
    status: 'taken',
    takenAt: '08:15 AM',
    prescriptionId: 'demo-rec-rx-02'
  },
  {
    id: 'demo-rem-02',
    medicineName: 'Ferrous Ascorbate 100mg',
    dosage: '1 tab (100mg)',
    instructions: 'After dinner before bedtime',
    timeSlot: '09:30 PM',
    slotName: 'Night',
    status: 'pending',
    prescriptionId: 'demo-rec-rx-02'
  }
];

export const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'demo-apt-01',
    patientName: 'Demo Patient A',
    patientId: 'demo-patient-sim-user',
    doctorName: 'Dr. Synthetic Reviewer (Unverified)',
    doctorSpecialty: 'General Medicine',
    hospitalClinic: 'Demo Community Health Clinic',
    date: '2026-10-25',
    time: '10:30 AM',
    type: 'In-person',
    status: 'upcoming',
    notes: 'Routine 4-week synthetic CBC follow-up review (Demo Mode)'
  }
];

export const DEMO_DOCTOR_PATIENTS: PatientListItem[] = [
  {
    id: 'demo-pat-01',
    name: 'Demo Patient A (Synthetic)',
    age: 34,
    gender: 'female',
    phone: '+91 90000 00000',
    abhaId: '91-0000-0000-0001',
    lastVisit: '18 Sep 2026',
    nextFollowUp: '25 Oct 2026',
    chronicCondition: 'Mild Iron Deficiency Anemia (Synthetic)',
    tag: 'Follow-up'
  },
  {
    id: 'demo-pat-02',
    name: 'Demo Patient B (Synthetic)',
    age: 58,
    gender: 'male',
    phone: '+91 90000 00002',
    abhaId: '91-0000-0000-0002',
    lastVisit: '02 Oct 2026',
    nextFollowUp: '16 Oct 2026',
    chronicCondition: 'Essential Hypertension (Synthetic)',
    tag: 'Chronic'
  },
  {
    id: 'demo-pat-03',
    name: 'Demo Patient C (Synthetic)',
    age: 26,
    gender: 'other',
    phone: '+91 90000 00003',
    abhaId: '91-0000-0000-0003',
    lastVisit: '08 Oct 2026',
    chronicCondition: 'Allergic Dermatitis (Synthetic)',
    tag: 'New'
  }
];

export const DEMO_CHAT_SERVER_CONTEXT = `[SYNTHETIC DEMO HEALTH HISTORY CONTEXT — FICTIONAL PATIENT RECORD]
Patient: Demo Patient A (Age: 34, Female, Blood Group: B+)
Allergies: Penicillin (Synthetic Demo)
Conditions: Mild Microcytic Anemia (Synthetic Demo), Mild Hypertension

Record Excerpt 1: Lab Report — Complete Blood Count (CBC) dated 2026-09-18
- Hemoglobin: 10.8 g/dL (Reference Range: 12.0 - 15.5 g/dL, Status: Low)
- WBC Count: 6,800 /uL (Reference Range: 4,000 - 11,000 /uL, Status: Normal)
- Platelets: 240,000 /uL (Reference Range: 150,000 - 450,000 /uL, Status: Normal)
- MCV: 76 fL (Reference Range: 80 - 100 fL, Status: Low)

Record Excerpt 2: Prescription dated 2026-09-20 from Demo Community Health Clinic
- Ferrous Ascorbate 100mg tablet, once daily at night after dinner (30 days)
- Vitamin C 500mg chewable tablet, once daily in the morning (15 days)
- Scheduled follow-up: 2026-10-25 for routine review

[END OF DEMO SYNTHETIC CONTEXT]`;
