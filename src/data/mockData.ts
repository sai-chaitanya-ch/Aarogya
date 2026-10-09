import { UserProfile, MedicalRecord, ActiveMedicationReminder, Appointment, Doctor, PatientListItem } from '../types';

export const initialUserProfile: UserProfile = {
  id: 'usr_chaitanya_01',
  name: 'Chaitanya',
  dob: '1998-05-14',
  age: 26,
  gender: 'male',
  bloodGroup: 'O+',
  location: 'Vijayawada, Andhra Pradesh',
  phone: '+91 98765 43210',
  emergencyContact: '+91 94401 23456 (Spouse)',
  allergies: ['Sulfa antibiotics'],
  conditions: ['Mild asthma', 'Pre-hypertension'],
  preferredLanguage: 'en',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  abhaLinked: false,
  abhaId: '91-1234-5678-9012',
  abhaAddress: 'chaitanya@abdm'
};

export const samplePrescriptionSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23fdfaf6"/><rect x="15" y="15" width="370" height="270" rx="8" fill="none" stroke="%23d1d5db" stroke-width="1.5"/><text x="35" y="45" font-family="sans-serif" font-weight="bold" font-size="14" fill="%230c7c61">Dr. S. Kumar</text><text x="35" y="60" font-family="sans-serif" font-size="10" fill="%236b7280">MBBS, MD (General Medicine) · Reg: APMC12345</text><text x="35" y="73" font-family="sans-serif" font-size="10" fill="%236b7280">City Care Clinic, MG Road, Vijayawada</text><text x="280" y="45" font-family="sans-serif" font-size="11" fill="%234b5563">Date: 14/09/2024</text><line x1="30" y1="85" x2="370" y2="85" stroke="%23e5e7eb" stroke-width="1.5"/><text x="35" y="110" font-family="sans-serif" font-size="12" fill="%231f2937">Rx</text><text x="45" y="135" font-family="Caveat, cursive" font-size="16" fill="%231e3a8a">1. Amlodipine 5 mg — 1 tab OD</text><text x="45" y="170" font-family="Caveat, cursive" font-size="16" fill="%231e3a8a">2. Metformin 500 mg — 1 tab BD after food</text><text x="45" y="205" font-family="Caveat, cursive" font-size="16" fill="%231e3a8a">3. Atorvastatin 10 mg — 1 tab OD at bedtime</text><line x1="30" y1="230" x2="370" y2="230" stroke="%23e5e7eb" stroke-width="1.5"/><text x="35" y="255" font-family="sans-serif" font-size="10" fill="%236b7280">Adv: Salt restriction, light brisk walk 30 mins</text><text x="270" y="265" font-family="Caveat, cursive" font-size="16" fill="%230c7c61">Dr. S. Kumar</text></svg>`;

export const sampleCBCReportSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%23ffffff"/><rect x="15" y="15" width="370" height="270" rx="8" fill="none" stroke="%23e2e8f0" stroke-width="1.5"/><text x="35" y="45" font-family="sans-serif" font-weight="bold" font-size="13" fill="%230c7c61">CITY CARE DIAGNOSTICS &amp; LAB</text><text x="35" y="60" font-family="sans-serif" font-size="10" fill="%2364748b">Complete Blood Count (CBC) Report</text><text x="270" y="45" font-family="sans-serif" font-size="10" fill="%2364748b">Date: 14 Sep 2024</text><line x1="30" y1="75" x2="370" y2="75" stroke="%23cbd5e1" stroke-width="1"/><text x="35" y="95" font-family="sans-serif" font-weight="bold" font-size="10" fill="%23475569">Investigation</text><text x="170" y="95" font-family="sans-serif" font-weight="bold" font-size="10" fill="%23475569">Observed</text><text x="250" y="95" font-family="sans-serif" font-weight="bold" font-size="10" fill="%23475569">Ref. Range</text><line x1="30" y1="105" x2="370" y2="105" stroke="%23e2e8f0" stroke-width="1"/><rect x="30" y="112" width="340" height="24" fill="%23fef2f2" rx="4"/><text x="35" y="128" font-family="sans-serif" font-weight="600" font-size="11" fill="%23dc2626">Hemoglobin (Hb)</text><text x="170" y="128" font-family="sans-serif" font-weight="bold" font-size="11" fill="%23dc2626">10.8 g/dL (LOW)</text><text x="250" y="128" font-family="sans-serif" font-size="10" fill="%23475569">12.0 - 15.5 g/dL</text><text x="35" y="155" font-family="sans-serif" font-size="11" fill="%231e293b">Total WBC Count</text><text x="170" y="155" font-family="sans-serif" font-size="11" fill="%231e293b">6,800 /uL</text><text x="250" y="155" font-family="sans-serif" font-size="10" fill="%2364748b">4,000 - 11,000</text><text x="35" y="185" font-family="sans-serif" font-size="11" fill="%231e293b">Platelet Count</text><text x="170" y="185" font-family="sans-serif" font-size="11" fill="%231e293b">2.1 lakh /uL</text><text x="250" y="185" font-family="sans-serif" font-size="10" fill="%2364748b">1.5 - 4.5 lakh</text><text x="35" y="215" font-family="sans-serif" font-size="11" fill="%231e293b">RBC Count</text><text x="170" y="215" font-family="sans-serif" font-size="11" fill="%231e293b">4.20 mil /uL</text><text x="250" y="215" font-family="sans-serif" font-size="10" fill="%2364748b">3.80 - 5.20</text><line x1="30" y1="240" x2="370" y2="240" stroke="%23cbd5e1" stroke-width="1"/><text x="35" y="260" font-family="sans-serif" font-size="9" fill="%2394a3b8">Verified by: Dr. Ananya Rao, MD (Pathologist)</text></svg>`;

export const initialMedicalRecords: MedicalRecord[] = [
  {
    id: 'rec_cbc_01',
    title: 'Complete Blood Count (CBC)',
    documentType: 'Lab Report',
    patientName: 'Chaitanya',
    visitDate: '14 Sep 2024',
    doctorName: 'Dr. Ananya Rao',
    facilityName: 'City Care Lab',
    specialty: 'Pathology',
    originalFileUrl: sampleCBCReportSvg,
    originalFileName: 'CBC_Report_14Sep2024.pdf',
    isSample: true,
    status: 'verified',
    aiSummary: {
      en: 'Your blood report shows most values are within the normal range. Hemoglobin is slightly low (10.8 g/dL), which can indicate mild anemia. It is best to discuss this with your doctor, especially if you have symptoms like tiredness.',
      te: 'మీ రక్త నివేదికలో చాలా విలువలు సాధారణ పరిధిలోనే ఉన్నాయి. హిమోగ్లోబిన్ స్వల్పంగా తక్కువగా (10.8 g/dL) ఉంది, ఇది తేలికపాటి రక్తహీనతను సూచించవచ్చు. ముఖ్యంగా అలసట వంటి లక్షణాలు ఉంటే మీ వైద్యుడితో మాట్లాడటం మంచిది.',
      hi: 'आपकी रक्त रिपोर्ट दर्शाती है कि अधिकांश मान सामान्य सीमा में हैं। हीमोग्लोबिन थोड़ा कम (10.8 g/dL) है, जो हल्के एनीमिया का संकेत हो सकता है। यदि आपको थकान महसूस होती है, तो डॉक्टर से परामर्श करना उचित रहेगा।',
      ta: 'உங்கள் இரத்த பரிசோதனை பெரும்பாலான மதிப்புகள் இயல்பான வரம்பில் இருப்பதைக் காட்டுகிறது. ஹீமோகுளோபின் சற்று குறைவாக (10.8 g/dL) உள்ளது, இது லேசான இரத்த சோகையைக் குறிக்கலாம்.'
    },
    keyFindings: [
      'Hemoglobin is 10.8 g/dL (Below normal range 12.0 - 15.5 g/dL)',
      'Total WBC Count is normal at 6,800 /uL',
      'Platelet Count is normal at 2.1 lakh /uL'
    ],
    medicines: [],
    labValues: [
      { id: 'lv_hb', testName: 'Hemoglobin (Hb)', value: '10.8 g/dL', numericValue: 10.8, unit: 'g/dL', referenceRange: '12.0 - 15.5 g/dL', status: 'low', notes: 'Mild reduction noted.' },
      { id: 'lv_wbc', testName: 'WBC (Total Leucocyte Count)', value: '6,800 /uL', numericValue: 6800, unit: '/uL', referenceRange: '4,000 - 11,000 /uL', status: 'normal' },
      { id: 'lv_plt', testName: 'Platelet Count', value: '2.1 lakh /uL', numericValue: 210000, unit: '/uL', referenceRange: '1.5 - 4.5 lakh /uL', status: 'normal' },
      { id: 'lv_rbc', testName: 'RBC Count', value: '4.2 mil /uL', numericValue: 4.2, unit: 'mil /uL', referenceRange: '3.8 - 5.2 mil /uL', status: 'normal' }
    ],
    createdAt: '2024-09-14T10:30:00Z'
  },
  {
    id: 'rec_rx_01',
    title: 'Hypertension & Diabetes Prescription',
    documentType: 'Prescription',
    patientName: 'Chaitanya',
    visitDate: '14 Sep 2024',
    doctorName: 'Dr. S. Kumar',
    facilityName: 'City Care Clinic',
    specialty: 'General Medicine',
    originalFileUrl: samplePrescriptionSvg,
    originalFileName: 'Prescription_DrKumar_14Sep.jpg',
    isSample: true,
    status: 'verified',
    aiSummary: {
      en: 'Prescription by Dr. S. Kumar includes 3 medicines: Amlodipine 5mg once daily for BP control, Metformin 500mg twice daily after meals for blood sugar, and Atorvastatin 10mg once daily at bedtime for cholesterol.',
      te: 'డాక్టర్ ఎస్. కుమార్ రాసిన ప్రిస్క్రిప్షన్‌లో 3 మందులు ఉన్నాయి: బీపీ నియంత్రణ కోసం రోజూ ఒకసారి ఆమ్లోడిపైన్ 5mg, ఆహారం తర్వాత షుగర్ కోసం మెట్‌ఫార్మిన్ 500mg, కొలెస్ట్రాల్ కోసం రాత్రి నిద్రపోయే ముందు అటోర్వాస్టాటిన్ 10mg.',
      hi: 'डॉ. एस. कुमार द्वारा लिखित पर्चे में 3 दवाएं शामिल हैं: बीपी के लिए एम्लोडिपिन 5 मिलीग्राम दिन में एक बार, भोजन के बाद मेटफॉर्मिन 500 मिलीग्राम दिन में दो बार, और कोलेस्ट्रॉल के लिए रात को एटोरवास्टेटिन 10 मिलीग्राम।',
      ta: 'டாக்டர் எஸ். குமார் 3 மருந்துகளை பரிந்துரைத்துள்ளார்: பிபிக்கு ஆம்லோடிபைன் 5 மி.கி, சர்க்கரைக்கு மெட்பார்மின் 500 மி.கி, கொலஸ்ட்ராலுக்கு அட்டோர்வாஸ்டாடின் 10 மி.கி.'
    },
    medicines: [
      { id: 'med_aml', name: 'Amlodipine 5 mg', dosage: '5 mg', frequency: '1 tab daily (OD)', duration: '30 days', timing: 'morning', instructions: 'Take in the morning with water' },
      { id: 'med_met', name: 'Metformin 500 mg', dosage: '500 mg', frequency: '1 tab twice daily (BD)', duration: '30 days', timing: 'multiple', instructions: 'Take strictly after food (morning and dinner)' },
      { id: 'med_ato', name: 'Atorvastatin 10 mg', dosage: '10 mg', frequency: '1 tab daily (OD)', duration: '30 days', timing: 'night', instructions: 'Take once at night before sleep' }
    ],
    labValues: [],
    followUpDate: '2024-09-21',
    createdAt: '2024-09-14T11:45:00Z'
  },
  {
    id: 'rec_rx_02',
    title: 'Seasonal Allergy & Bronchitis Follow-up',
    documentType: 'Prescription',
    patientName: 'Chaitanya',
    visitDate: '02 Aug 2024',
    doctorName: 'Dr. S. Kumar',
    facilityName: 'City Care Clinic',
    specialty: 'General Medicine',
    status: 'verified',
    aiSummary: {
      en: 'Prescription for seasonal allergic wheezing and cough. Prescribed Montelukast + Levocetirizine for 7 days with steam inhalation.',
      te: 'సీజనల్ అలెర్జీ దగ్గు కోసం మోంటెలుకాస్ట్ మరియు లెవోసెటిరిజిన్ 7 రోజులు ఇవ్వబడింది.',
      hi: 'मौसमी एलर्जी और खांसी के लिए 7 दिनों के लिए मोंटेलुकास्ट और लेवोसेटिरिज़िन निर्धारित किया गया।',
      ta: 'பருவகால ஒவ்வாமை மற்றும் இருமலுக்கு 7 நாட்களுக்கு மாண்டிலூகாஸ்ட் பரிந்துரைக்கப்பட்டது.'
    },
    medicines: [
      { id: 'med_mont', name: 'Montelukast 10mg + Levocetirizine 5mg', dosage: '10mg/5mg', frequency: '1 tab at night (OD)', duration: '7 days', timing: 'night', instructions: 'Take at night before sleep' }
    ],
    labValues: [],
    createdAt: '2024-08-02T16:00:00Z'
  },
  {
    id: 'rec_img_01',
    title: 'Chest X-Ray (PA View)',
    documentType: 'X-Ray / Imaging',
    patientName: 'Chaitanya',
    visitDate: '10 Jul 2024',
    doctorName: 'Dr. V. Ramanathan',
    facilityName: 'Diagnostic Centre',
    specialty: 'Radiology',
    status: 'verified',
    aiSummary: {
      en: 'Normal chest radiograph. Lung fields are clear with no focal consolidation or pleural effusion. Cardiac size is within normal limits.',
      te: 'ఛాతీ ఎక్స్-రే సాధారణంగా ఉంది. ఊపిరితిత్తులు స్పష్టంగా ఉన్నాయి, ఎటువంటి ఇన్‌ఫెక్షన్ లేదు.',
      hi: 'छाती का एक्स-रे सामान्य है। फेफड़े बिल्कुल स्पष्ट हैं और हृदय का आकार सामान्य सीमा में है।',
      ta: 'மார்பு எக்ஸ்ரே இயல்பாக உள்ளது. நுரையீரலில் தொற்று இல்லை.'
    },
    medicines: [],
    labValues: [],
    createdAt: '2024-07-10T14:15:00Z'
  },
  {
    id: 'rec_dis_01',
    title: 'Discharge Summary - Viral Gastroenteritis',
    documentType: 'Discharge Summary',
    patientName: 'Chaitanya',
    visitDate: '02 Jan 2024',
    doctorName: 'Dr. Priya Sharma',
    facilityName: 'Sunrise Hospital',
    specialty: 'Gastroenterology',
    status: 'verified',
    aiSummary: {
      en: 'Admitted with acute viral gastroenteritis with moderate dehydration. Treated with IV fluids and antiemetics. Discharged stable.',
      te: 'డీహైడ్రేషన్‌తో అడ్మిట్ అయ్యారు. సెలైన్ మరియు మందులతో చికిత్స పొంది పూర్తిగా కోలుకుని డిశ్చార్జ్ అయ్యారు.',
      hi: 'निर्जलीकरण के साथ भर्ती कराया गया था। आईवी तरल पदार्थ दिए गए और स्थिति स्थिर होने पर छुट्टी दे दी गई।',
      ta: 'நீரிழப்பு காரணமாக அனுமதிக்கப்பட்டு திரவ சிகிச்சை அளிக்கப்பட்டு நலமுடன் வீடு திரும்பினார்.'
    },
    medicines: [],
    labValues: [],
    createdAt: '2024-01-02T09:00:00Z'
  }
];

export const initialReminders: ActiveMedicationReminder[] = [
  {
    id: 'rem_1',
    medicineName: 'Amlodipine 5 mg',
    dosage: '1 tablet daily (OD)',
    instructions: 'Take with morning glass of water',
    timeSlot: '08:00 AM',
    slotName: 'Morning',
    status: 'taken',
    takenAt: '08:12 AM'
  },
  {
    id: 'rem_2',
    medicineName: 'Metformin 500 mg',
    dosage: '1 tablet twice daily (BD)',
    instructions: 'Take strictly after breakfast',
    timeSlot: '08:00 AM',
    slotName: 'Morning',
    status: 'pending'
  },
  {
    id: 'rem_3',
    medicineName: 'Atorvastatin 10 mg',
    dosage: '1 tablet daily (OD)',
    instructions: 'Take once at night before bedtime',
    timeSlot: '09:30 PM',
    slotName: 'Night',
    status: 'pending'
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'apt_1',
    patientName: 'Chaitanya',
    patientId: 'usr_chaitanya_01',
    doctorName: 'Dr. S. Kumar',
    doctorSpecialty: 'General Medicine',
    hospitalClinic: 'City Care Clinic, MG Road',
    date: 'Mon, 21 Sep 2024',
    time: '10:00 AM',
    type: 'In-person',
    status: 'upcoming',
    notes: 'Follow-up for BP and Fasting Blood Sugar review.'
  },
  {
    id: 'apt_2',
    patientName: 'Chaitanya',
    patientId: 'usr_chaitanya_01',
    doctorName: 'Dr. Ananya Rao',
    doctorSpecialty: 'Pathologist',
    hospitalClinic: 'City Care Lab',
    date: 'Wed, 25 Sep 2024',
    time: '04:30 PM',
    type: 'Teleconsultation',
    status: 'upcoming',
    notes: 'Review repeat Hemoglobin & iron profile.'
  },
  {
    id: 'apt_3',
    patientName: 'Chaitanya',
    patientId: 'usr_chaitanya_01',
    doctorName: 'Dr. S. Kumar',
    doctorSpecialty: 'General Medicine',
    hospitalClinic: 'City Care Clinic',
    date: '14 Sep 2024',
    time: '11:00 AM',
    type: 'In-person',
    status: 'completed',
    notes: 'Prescription issued.'
  }
];

export const nearbyDoctors: Doctor[] = [
  {
    id: 'doc_1',
    name: 'Dr. S. Kumar',
    qualifications: 'MBBS, MD (General Medicine)',
    specialty: 'General Medicine',
    regNumber: 'APMC12345',
    clinicName: 'City Care Clinic',
    address: 'MG Road, Vijayawada, Andhra Pradesh',
    city: 'Vijayawada',
    distanceKm: 1.2,
    rating: 4.9,
    experienceYears: 14,
    consultationFee: 400,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98480 11223'
  },
  {
    id: 'doc_2',
    name: 'Dr. Priya Sharma',
    qualifications: 'MBBS, MD, DM (Cardiology)',
    specialty: 'Cardiology',
    regNumber: 'APMC67890',
    clinicName: 'Heart Care & Wellness Institute',
    address: 'Governorpet, Vijayawada',
    city: 'Vijayawada',
    distanceKm: 2.8,
    rating: 4.8,
    experienceYears: 11,
    consultationFee: 600,
    availableToday: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3974c8397a73?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98481 22334'
  },
  {
    id: 'doc_3',
    name: 'Dr. Arjun Mehta',
    qualifications: 'MBBS, DNB (Pediatrics)',
    specialty: 'Pediatrics',
    regNumber: 'APMC44556',
    clinicName: 'Little Smiles Child Clinic',
    address: 'Ring Road, Vijayawada',
    city: 'Vijayawada',
    distanceKm: 3.5,
    rating: 4.9,
    experienceYears: 9,
    consultationFee: 500,
    availableToday: false,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98482 33445'
  },
  {
    id: 'doc_4',
    name: 'Dr. Lakshmi Devi',
    qualifications: 'MBBS, MS (Obstetrics & Gynecology)',
    specialty: 'Gynecology',
    regNumber: 'APMC88991',
    clinicName: 'Matrusri Mother & Child Hospital',
    address: 'Benz Circle, Vijayawada',
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

export const doctorPortalPatients: PatientListItem[] = [
  {
    id: 'pat_ramesh',
    name: 'Ramesh Kumar',
    age: 28,
    gender: 'male',
    phone: '+91 98765 43210',
    abhaId: '91-1234-5678-9012',
    lastVisit: '14 Sep 2024',
    nextFollowUp: '21 Sep 2024',
    chronicCondition: 'Mild Asthma',
    tag: 'Follow-up',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_priya',
    name: 'Priya Sharma',
    age: 35,
    gender: 'female',
    phone: '+91 9876-5432-1098',
    abhaId: '91-9876-5432-1098',
    lastVisit: '10 Sep 2024',
    nextFollowUp: '25 Sep 2024',
    chronicCondition: 'Migraine',
    tag: 'New',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_arjun',
    name: 'Arjun Mehta',
    age: 42,
    gender: 'male',
    phone: '+91 97654 32109',
    abhaId: undefined,
    lastVisit: '01 Sep 2024',
    nextFollowUp: '15 Oct 2024',
    chronicCondition: 'Type 2 Diabetes',
    tag: 'Chronic',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_lakshmi',
    name: 'Lakshmi Devi',
    age: 58,
    gender: 'female',
    phone: '+91 96543 21098',
    abhaId: '91-4567-8901-2345',
    lastVisit: '28 Aug 2024',
    nextFollowUp: '18 Sep 2024',
    chronicCondition: 'Hypertension',
    tag: 'Follow-up',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_vikram',
    name: 'Vikram R',
    age: 31,
    gender: 'male',
    phone: '+91 95432 10987',
    abhaId: undefined,
    lastVisit: '15 Aug 2024',
    nextFollowUp: undefined,
    chronicCondition: 'Gastroenteritis',
    tag: 'Stable',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'pat_neha',
    name: 'Neha Kapoor',
    age: 27,
    gender: 'female',
    phone: '+91 98760-1234-5678',
    abhaId: '91-7856-1234-5678',
    lastVisit: '12 Sep 2024',
    nextFollowUp: '20 Sep 2024',
    chronicCondition: 'Iron Deficiency Anemia',
    tag: 'New',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
  }
];

export const labTrendsData = {
  hemoglobin: [
    { date: '12 Jan 2024', value: 10.2, unit: 'g/dL', normalMin: 12.0, normalMax: 15.5 },
    { date: '10 May 2024', value: 10.5, unit: 'g/dL', normalMin: 12.0, normalMax: 15.5 },
    { date: '14 Sep 2024', value: 10.8, unit: 'g/dL', normalMin: 12.0, normalMax: 15.5 }
  ],
  fastingSugar: [
    { date: '12 Jan 2024', value: 142, unit: 'mg/dL', normalMin: 70, normalMax: 100 },
    { date: '10 May 2024', value: 128, unit: 'mg/dL', normalMin: 70, normalMax: 100 },
    { date: '14 Sep 2024', value: 114, unit: 'mg/dL', normalMin: 70, normalMax: 100 }
  ],
  systolicBP: [
    { date: '12 Jan 2024', value: 144, unit: 'mmHg', normalMin: 90, normalMax: 120 },
    { date: '10 May 2024', value: 136, unit: 'mmHg', normalMin: 90, normalMax: 120 },
    { date: '14 Sep 2024', value: 128, unit: 'mmHg', normalMin: 90, normalMax: 120 }
  ]
};
