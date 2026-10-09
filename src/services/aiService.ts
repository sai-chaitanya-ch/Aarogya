import { MedicalRecord, ExtractedMedicine, ExtractedLabValue, Language, ChatMessage } from '../types';

export interface DocumentAnalysisResult {
  documentType: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'X-Ray / Imaging';
  patientName: string;
  visitDate: string;
  doctorName: string;
  facilityName: string;
  medicines: ExtractedMedicine[];
  labValues: ExtractedLabValue[];
  confidenceScore: number;
  extractedRawText: string;
  aiExplanation: {
    en: string;
    te: string;
    hi: string;
    ta: string;
  };
  reviewAlerts: string[];
}

/**
 * Fallback parser for client-side processing when the AI backend is unreachable.
 * Never fabricates patient details, medications, or lab values.
 */
export function analyzeDocument(presetType: 'prescription' | 'cbc' | 'discharge' | 'custom', customName?: string): DocumentAnalysisResult {
  const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const safeName = customName || '';

  return {
    documentType: presetType === 'cbc' ? 'Lab Report' : 'Prescription',
    patientName: safeName,
    visitDate: todayFormatted,
    doctorName: '',
    facilityName: '',
    confidenceScore: 0,
    extractedRawText: '',
    medicines: [],
    labValues: [],
    aiExplanation: {
      en: "Document captured. Please review and verify the extracted details below before saving to your profile.",
      te: "పత్రం సేకరించబడింది. దయచేసి వివరాలను సరిచూసి నిర్ధారించండి.",
      hi: "दस्तावेज़ प्राप्त हुआ। कृपया सहेजने से पहले नीचे दिए गए विवरण की जांच करें।",
      ta: "ஆவணம் பெறப்பட்டது. சேமிப்பதற்கு முன் கீழே உள்ள விவரங்களைச் சரிபார்க்கவும்."
    },
    reviewAlerts: [
      "Please enter or confirm medication names and dosages directly from your original document."
    ]
  };
}

/**
 * Generates an educational response grounded strictly in the user's authorized records.
 * Never invents nonexistent medical history or diagnoses.
 */
export function generateAarogyaChatResponse(
  query: string,
  language: Language,
  records: MedicalRecord[]
): {
  text: string;
  citations: { documentTitle: string; documentDate: string; recordId: string }[];
  isEmergencyAlert: boolean;
  isError?: boolean;
} {
  const lower = query.toLowerCase();

  // 1. Emergency symptoms check (clinical safety barrier)
  const emergencyKeywords = [
    'chest pain', 'severe chest', 'heart attack', 'cannot breathe', 
    'shortness of breath', 'severe bleeding', 'unconscious', 'fainting', 
    'గుండె నొప్పి', 'శ్వాస ఆడకపోవడం', 'सीने में दर्द', 'सांस लेने में तकलीफ', 'நெஞ்சு வலி'
  ];
  const isEmergency = emergencyKeywords.some(kw => lower.includes(kw));

  if (isEmergency) {
    const alerts: Record<Language, string> = {
      en: "⚠️ URGENT CLINICAL NOTICE: Based on symptoms like chest pain or severe difficulty breathing, please seek emergency medical care immediately or call emergency services (108 / 112). Aarogya is an educational health copilot and does not replace emergency clinical attention.",
      te: "⚠️ అత్యవసర వైద్య హెచ్చరిక: తీవ్రమైన ఛాతీ నొప్పి లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది వంటి లక్షణాలు ఉన్నప్పుడు, వెంటనే సమీపంలోని ఆసుపత్రికి వెళ్లండి లేదా అత్యవసర సేవలకు (108 / 112) కాల్ చేయండి. ఆరోగ్య అత్యవసర వైద్య సేవలకు ప్రత్యామ్నాయం కాదు.",
      hi: "⚠️ आपातकालीन चिकित्सा सूचना: सीने में तेज दर्द या सांस लेने में गंभीर कठिनाई जैसे लक्षणों के लिए, कृपया तुरंत आपातकालीन चिकित्सा सहायता लें या 108/112 पर कॉल करें। आरोग्य आपातकालीन देखभाल का विकल्प नहीं है।",
      ta: "⚠️ அவசர மருத்துவ அறிவிப்பு: நெஞ்சு வலி அல்லது கடுமையான மூச்சுத் திணறல் போன்ற அறிகுறிகளுக்கு, உடனடியாக அவசர மருத்துவ உதவியை நாடுங்கள் (108 / 112). ஆரோக்யா அவசர சிகிச்சைக்கு மாற்றாகாது."
    };
    return {
      text: alerts[language] || alerts.en,
      citations: [],
      isEmergencyAlert: true
    };
  }

  // 2. Search actual authorized records for medications or tests mentioned in the query
  const matchingRecords: { record: MedicalRecord; matchSnippet: string }[] = [];

  for (const rec of records) {
    // Check medicines
    const matchingMed = rec.medicines?.find(m => lower.includes(m.name.toLowerCase()));
    if (matchingMed) {
      matchingRecords.push({
        record: rec,
        matchSnippet: `Medication "${matchingMed.name}": Dosage ${matchingMed.dosage}, Frequency ${matchingMed.frequency}${matchingMed.instructions ? ` (${matchingMed.instructions})` : ''}`
      });
      continue;
    }

    // Check lab values
    const matchingLab = rec.labValues?.find(l => lower.includes(l.testName.toLowerCase()));
    if (matchingLab) {
      matchingRecords.push({
        record: rec,
        matchSnippet: `Test "${matchingLab.testName}": Observed ${matchingLab.value} (Ref: ${matchingLab.referenceRange || 'N/A'}, Status: ${matchingLab.status})`
      });
      continue;
    }

    // Check general document title
    if (lower.includes(rec.title.toLowerCase()) || lower.includes(rec.documentType.toLowerCase())) {
      matchingRecords.push({
        record: rec,
        matchSnippet: `${rec.title} (${rec.visitDate}): ${rec.aiSummary[language] || rec.aiSummary.en}`
      });
    }
  }

  // 3. If matching records exist in user's authorized history, ground response in them
  if (matchingRecords.length > 0) {
    const primary = matchingRecords[0];
    const citations = matchingRecords.map(m => ({
      documentTitle: m.record.title,
      documentDate: m.record.visitDate,
      recordId: m.record.id
    }));

    return {
      text: `Based on your authorized health record (${primary.record.title}, dated ${primary.record.visitDate}):\n\n${primary.matchSnippet}\n\n💡 Always discuss any questions about your prescriptions or test results with your consulting physician.`,
      citations,
      isEmergencyAlert: false
    };
  }

  // 4. If no records exist or query doesn't match any record
  if (records.length === 0) {
    const emptyNotice: Record<Language, string> = {
      en: "You have not uploaded any medical records yet. To get personalized explanations about your prescriptions or lab tests, please scan or upload a document using 'Scan a Report'.",
      te: "మీ ఖాతాలో ఇంకా ఎటువంటి వైద్య రికార్డులు లేవు. మీ ప్రిస్క్రిప్షన్లు లేదా ల్యాబ్ నివేదికల వివరాలు తెలుసుకోవడానికి దయచేసి 'స్కాన్ రిపోర్ట్' ద్వారా పత్రాన్ని అప్‌లోడ్ చేయండి.",
      hi: "आपके खाते में अभी कोई मेडिकल रिकॉर्ड नहीं है। अपनी दवाओं या जांच रिपोर्ट की जानकारी के लिए कृपया 'रिपोर्ट स्कैन करें' विकल्प से दस्तावेज़ जोड़ें।",
      ta: "உங்கள் கணக்கில் இன்னும் மருத்துவ பதிவுகள் சேர்க்கப்படவில்லை. தனிப்பயனாக்கப்பட்ட விவரங்களுக்கு தயவுசெய்து உங்கள் அறிக்கையை பதிவேற்றவும்."
    };
    return {
      text: emptyNotice[language] || emptyNotice.en,
      citations: [],
      isEmergencyAlert: false
    };
  }

  // 5. Query did not match user's records
  const noMatchNotice: Record<Language, string> = {
    en: `I searched your ${records.length} authorized record(s), but found no documented information matching "${query}". For specific medical guidance, please consult your healthcare provider directly.`,
    te: `మీ ${records.length} రికార్డులలో "${query}" కు సంబంధించిన వివరాలు కనుగొనబడలేదు. దయచేసి మీ వైద్యుడిని సంప్రదించండి.`,
    hi: `आपके ${records.length} रिकॉर्ड्स में "${query}" से संबंधित विवरण नहीं मिला। कृपया अपने चिकित्सक से संपर्क करें।`,
    ta: `உங்கள் ${records.length} பதிவுகளில் "${query}" தொடர்பான தகவல் இல்லை.`
  };

  return {
    text: noMatchNotice[language] || noMatchNotice.en,
    citations: [],
    isEmergencyAlert: false
  };
}
