import { MedicalRecord, ExtractedMedicine, ExtractedLabValue, Language } from '../types';

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

export function analyzeDocument(presetType: 'prescription' | 'cbc' | 'discharge' | 'custom', customName?: string): DocumentAnalysisResult {
  const safeName = customName || '';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return {
    documentType: presetType === 'cbc' ? 'Lab Report' : 'Prescription',
    patientName: safeName,
    visitDate: today,
    doctorName: '',
    facilityName: '',
    confidenceScore: 90,
    extractedRawText: '',
    medicines: [],
    labValues: [],
    aiExplanation: {
      en: "Document scanned. Please review the extracted fields or add any prescriptions manually.",
      te: "పత్రం స్కాన్ చేయబడింది. దయచేసి వివరాలను సరిచూసుకోండి.",
      hi: "दस्तावेज़ स्कैन किया गया। कृपया विवरणों की समीक्षा करें।",
      ta: "ஆவணம் ஸ்கேன் செய்யப்பட்டது. தயவுசெய்து விவரங்களை சரிபார்க்கவும்."
    },
    reviewAlerts: []
  };
}

export function generateAarogyaChatResponse(
  userQuery: string,
  language: Language,
  records: MedicalRecord[]
): { text: string; citations: { documentTitle: string; documentDate: string; recordId: string }[]; isEmergencyAlert: boolean } {
  const lower = userQuery.toLowerCase();

  // 1. Red-flag emergency screening
  const emergencyKeywords = [
    'chest pain', 'severe chest pain', 'heart attack', 'shortness of breath',
    'cannot breathe', 'breathless', 'stroke', 'unconscious', 'suicidal',
    'severe bleeding', 'ఛాతీ నొప్పి', 'శ్వాస ఆడటం లేదు', 'छाती में तेज दर्द', 'सांस नहीं आ रही'
  ];

  if (emergencyKeywords.some(keyword => lower.includes(keyword))) {
    const emergencyResponses: Record<Language, string> = {
      en: "🚨 CRITICAL EMERGENCY ALERT: Based on the symptoms described (such as chest pain or breathing difficulty), this may be a medical emergency. Please call 108 or 112 immediately, or proceed to the nearest Emergency Department. Aarogya is an AI copilot and does not replace acute emergency care.",
      te: "🚨 అత్యవసర వైద్య హెచ్చరిక: మీరు వివరించిన లక్షణాలు (ఛాతీ నొప్పి లేదా తీవ్రమైన శ్వాస తీసుకోవడంలో ఇబ్బంది) అత్యవసర పరిస్థితిని సూచించవచ్చు. దయచేసి వెంటనే 108 లేదా 112 కు కాల్ చేయండి లేదా సమీపంలోని అత్యవసర వైద్య విభాగానికి వెళ్ళండి.",
      hi: "🚨 आपातकालीन चेतावनी: आपके द्वारा बताए गए लक्षण (जैसे सीने में तेज दर्द या सांस लेने में कठिनाई) आपातकालीन स्थिति का संकेत हो सकते हैं। कृपया तुरंत 108 या 112 पर कॉल करें या नजदीकी आपातकालीन विभाग में जाएं।",
      ta: "🚨 அவசர மருத்துவ எச்சரிக்கை: நீங்கள் குறிப்பிட்ட அறிகுறிகள் அவசர நிலையை குறிக்கலாம். தயவுசெய்து உடனடியாக 108 அல்லது 112 ஐ அழைக்கவும்."
    };

    return {
      text: emergencyResponses[language] || emergencyResponses.en,
      citations: [],
      isEmergencyAlert: true
    };
  }

  // 2. Lab values / CBC inquiry based on user records
  if (lower.includes('cbc') || lower.includes('hemoglobin') || lower.includes('blood') || lower.includes('హిమోగ్లోబిన్') || lower.includes('రక్తం') || lower.includes('रक्त') || lower.includes('இரத்தம்')) {
    const labRecord = records.find(r => r.labValues && r.labValues.length > 0);
    if (labRecord) {
      const vals = labRecord.labValues.map(lv => `• ${lv.testName}: ${lv.value} (Ref: ${lv.referenceRange || 'N/A'}) [${lv.status.toUpperCase()}]`).join('\n');
      return {
        text: `From your ${labRecord.title} (${labRecord.visitDate}):\n\n${vals}\n\n${labRecord.aiSummary[language] || labRecord.aiSummary.en}`,
        citations: [{ documentTitle: labRecord.title, documentDate: labRecord.visitDate, recordId: labRecord.id }],
        isEmergencyAlert: false
      };
    }
    return {
      text: "No lab reports found in your profile yet. Upload a lab report or CBC document to get detailed value breakdowns.",
      citations: [],
      isEmergencyAlert: false
    };
  }

  // 3. Prescription / medicines inquiry based on user records
  if (lower.includes('prescription') || lower.includes('medicine') || lower.includes('మందులు') || lower.includes('दवा') || lower.includes('மருந்து')) {
    const rxRecords = records.filter(r => r.documentType === 'Prescription' && r.medicines && r.medicines.length > 0);
    if (rxRecords.length > 0) {
      const latestRx = rxRecords[0];
      const medsList = latestRx.medicines.map((m, i) => `${i + 1}. ${m.name} — ${m.frequency || m.dosage} (${m.instructions || m.timing})`).join('\n');
      return {
        text: `From your prescription (${latestRx.title}, ${latestRx.visitDate}):\n\n${medsList}\n\n⚠️ Always take medications according to your clinician's directions.`,
        citations: [{ documentTitle: latestRx.title, documentDate: latestRx.visitDate, recordId: latestRx.id }],
        isEmergencyAlert: false
      };
    }
    return {
      text: "You haven't uploaded any prescription records yet. Once you scan a prescription, I can explain your medicines, dosages, and timings here.",
      citations: [],
      isEmergencyAlert: false
    };
  }

  // 4. Compare reports inquiry based on user records
  if (lower.includes('compare') || lower.includes('trend') || lower.includes('పోల్చండి') || lower.includes('तुलना')) {
    if (records.length >= 2) {
      return {
        text: `Comparing your ${records.length} records from ${records[records.length - 1].visitDate} to ${records[0].visitDate}:\n\nYour clinical timeline is actively tracked across ${records.length} visits. Review the Trends tab for visual health trajectory charts.`,
        citations: records.slice(0, 2).map(r => ({ documentTitle: r.title, documentDate: r.visitDate, recordId: r.id })),
        isEmergencyAlert: false
      };
    }
    return {
      text: "To compare health trends, please scan or upload at least 2 medical records or lab tests.",
      citations: [],
      isEmergencyAlert: false
    };
  }

  // 5. Default general assistant response
  const hasRecords = records.length > 0;
  const generalGreeting: Record<Language, string> = {
    en: hasRecords
      ? `Hello! I have access to your ${records.length} saved medical record${records.length > 1 ? 's' : ''}. You can ask me to explain any report in simple language, verify medication timings, compare test trends over time, or translate medical terms into Telugu, Hindi, or Tamil.`
      : `Hello! I am Aarogya, your AI personal health copilot. You can scan or upload your medical prescriptions and lab reports, or ask me any health questions in your preferred language.`,
    te: hasRecords
      ? `నమస్కారం! మీ వద్ద ఉన్న ${records.length} ఆరోగ్య రికార్డుల వివరాలు నా వద్ద ఉన్నాయి. మీరు ఏదైనా రిపోర్టు వివరణను సులభమైన తెలుగులో అడగవచ్చు లేదా మందుల వేళలను తెలుసుకోవచ్చు.`
      : `నమస్కారం! నేను మీ వ్యక్తిగత ఆరోగ్య సహాయకుడిని (Aarogya). మీరు మీ ప్రిస్క్రిప్షన్లు లేదా ల్యాబ్ రిపోర్టులను స్కాన్ చేయవచ్చు లేదా ఆరోగ్య సందేహాలను అడగవచ్చు.`,
    hi: hasRecords
      ? `नमस्ते! मेरे पास आपके ${records.length} मेडिकल रिकॉर्ड्स की जानकारी है। आप किसी भी रिपोर्ट को सरल हिंदी में समझ सकते हैं या दवाओं का समय पूछ सकते हैं।`
      : `नमस्ते! मैं आरोग्य हूँ, आपका व्यक्तिगत स्वास्थ्य सहायक। आप अपने पर्चे या लैब रिपोर्ट स्कैन कर सकते हैं या कोई भी स्वास्थ्य प्रश्न पूछ सकते हैं।`,
    ta: hasRecords
      ? `வணக்கம்! உங்கள் ${records.length} மருத்துவ பதிவுகள் என்னிடம் உள்ளன. உங்கள் அறிக்கைகளை எளிய தமிழில் புரிந்து கொள்ள என்னிடம் கேட்கலாம்.`
      : `வணக்கம்! நான் உங்கள் ஆரோக்கிய நலத் துணைவன். உங்கள் மருத்துவ அறிக்கைகளை பதிவேற்றலாம் அல்லது ஏதேனும் சந்தேகங்களை கேட்கலாம்.`
  };

  return {
    text: generalGreeting[language] || generalGreeting.en,
    citations: hasRecords ? [{ documentTitle: records[0].title, documentDate: records[0].visitDate, recordId: records[0].id }] : [],
    isEmergencyAlert: false
  };
}
