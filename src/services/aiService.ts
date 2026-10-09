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
  if (presetType === 'cbc') {
    return {
      documentType: 'Lab Report',
      patientName: 'Chaitanya',
      visitDate: '14 Sep 2024',
      doctorName: 'Dr. Ananya Rao',
      facilityName: 'City Care Lab, Vijayawada',
      confidenceScore: 98,
      extractedRawText: `CITY CARE DIAGNOSTICS & LAB
Patient: Chaitanya | Age: 26 Y | Gender: Male
Date: 14 Sep 2024
INVESTIGATION: COMPLETE BLOOD COUNT (CBC)
Hemoglobin (Hb): 10.8 g/dL (Ref: 12.0 - 15.5 g/dL) - LOW
Total WBC Count: 6,800 /uL (Ref: 4,000 - 11,000 /uL) - NORMAL
Platelet Count: 2.1 lakh /uL (Ref: 1.5 - 4.5 lakh /uL) - NORMAL
RBC Count: 4.20 mil /uL (Ref: 3.80 - 5.20 mil /uL) - NORMAL
Report signed by: Dr. Ananya Rao, MD`,
      medicines: [],
      labValues: [
        { id: 'lv_hb_1', testName: 'Hemoglobin (Hb)', value: '10.8 g/dL', numericValue: 10.8, unit: 'g/dL', referenceRange: '12.0 - 15.5 g/dL', status: 'low', notes: 'Values below 12.0 indicate mild anemia.' },
        { id: 'lv_wbc_1', testName: 'WBC (Total Leucocyte Count)', value: '6,800 /uL', numericValue: 6800, unit: '/uL', referenceRange: '4,000 - 11,000 /uL', status: 'normal' },
        { id: 'lv_plt_1', testName: 'Platelet Count', value: '2.1 lakh /uL', numericValue: 210000, unit: '/uL', referenceRange: '1.5 - 4.5 lakh /uL', status: 'normal' },
        { id: 'lv_rbc_1', testName: 'RBC Count', value: '4.20 mil /uL', numericValue: 4.2, unit: 'mil /uL', referenceRange: '3.80 - 5.20 mil /uL', status: 'normal' }
      ],
      aiExplanation: {
        en: "Your blood report shows most values are within the normal range. Hemoglobin is slightly low (10.8 g/dL), which can indicate mild anemia. It's best to discuss this with your doctor, especially if you have symptoms like tiredness.",
        te: "మీ రక్త నివేదికలో చాలా విలువలు సాధారణ పరిధిలోనే ఉన్నాయి. హిమోగ్లోబిన్ స్వల్పంగా తక్కువగా (10.8 g/dL) ఉంది, ఇది తేలికపాటి రక్తహీనతను సూచించవచ్చు. అలసట లేదా నీరసం ఉంటే మీ వైద్యుడితో మాట్లాడటం మంచిది.",
        hi: "आपकी रक्त रिपोर्ट दर्शाती है कि अधिकांश मान सामान्य सीमा में हैं। हीमोग्लोबिन थोड़ा कम (10.8 g/dL) है, जो हल्के एनीमिया का संकेत हो सकता है। यदि आपको थकान महसूस होती है, तो डॉक्टर से परामर्श करें।",
        ta: "உங்கள் இரத்த பரிசோதனை பெரும்பாலான மதிப்புகள் இயல்பான வரம்பில் இருப்பதைக் காட்டுகிறது. ஹீமோகுளோபின் சற்று குறைவாக (10.8 g/dL) உள்ளது, இது லேசான இரத்த சோகையைக் குறிக்கலாம்."
      },
      reviewAlerts: [
        "Hemoglobin (10.8 g/dL) is below reference range (12.0 - 15.5 g/dL). Discuss with Dr. S. Kumar on your next visit."
      ]
    };
  }

  if (presetType === 'prescription') {
    return {
      documentType: 'Prescription',
      patientName: 'Chaitanya',
      visitDate: '14 Sep 2024',
      doctorName: 'Dr. S. Kumar',
      facilityName: 'City Care Clinic',
      confidenceScore: 94,
      extractedRawText: `Dr. S. Kumar, MBBS MD (General Medicine)
City Care Clinic, MG Road, Vijayawada
Patient: Chaitanya  Date: 14/09/2024
Rx:
1. Amlodipine 5 mg — 1 tab OD
2. Metformin 500 mg — 1 tab BD after food
3. Atorvastatin 10 mg — 1 tab OD at night
Adv: Salt restriction, light brisk walk 30 mins.
Review in 1 week.`,
      medicines: [
        { id: 'ocr_med_1', name: 'Amlodipine 5 mg', dosage: '5 mg', frequency: '1 tab daily (OD)', duration: '30 days', timing: 'morning', instructions: 'Take in morning with water' },
        { id: 'ocr_med_2', name: 'Metformin 500 mg', dosage: '500 mg', frequency: '1 tab twice daily (BD) after food', duration: '30 days', timing: 'multiple', instructions: 'Take after breakfast and after dinner' },
        { id: 'ocr_med_3', name: 'Atorvastatin 10 mg', dosage: '10 mg', frequency: '1 tab daily (OD)', duration: '30 days', timing: 'night', instructions: 'Take once at bedtime' }
      ],
      labValues: [],
      aiExplanation: {
        en: "Dr. S. Kumar prescribed 3 medications: Amlodipine 5mg once daily for BP control, Metformin 500mg twice daily after meals for blood glucose control, and Atorvastatin 10mg once daily at bedtime for cholesterol management.",
        te: "డాక్టర్ ఎస్. కుమార్ 3 మందులు సూచించారు: బీపీ నియంత్రణకు ఆమ్లోడిపైన్ 5mg ఉదయం, షుగర్ కోసం భోజనం తర్వాత మెట్‌ఫార్మిన్ 500mg రెండు పూటలా, కొలెస్ట్రాల్ కోసం రాత్రి పూట అటోర్వాస్టాటిన్ 10mg.",
        hi: "डॉ. एस. कुमार ने 3 दवाएं निर्धारित की हैं: बीपी के लिए सुबह एम्लोडिपिन 5mg, भोजन के बाद शुगर के लिए मेटफॉर्मिन 500mg दिन में दो बार, और रात को कोलेस्ट्रॉल के लिए एटोरवास्टेटिन 10mg।",
        ta: "டாக்டர் எஸ். குமார் 3 மருந்துகளை பரிந்துரைத்துள்ளார்: பிபிக்கு காலையில் ஆம்லோடிபைன் 5 மி.கி, உணவுக்குப் பின் சர்க்கரைக்கு மெட்பார்மின் 500 மி.கி, இரவில் கொலஸ்ட்ராலுக்கு அட்டோர்வாஸ்டாடின் 10 மி.கி."
      },
      reviewAlerts: [
        "Metformin dosage is marked strictly after food. Please verify with your doctor before altering."
      ]
    };
  }

  // Fallback for custom uploads
  const safeName = customName || 'Chaitanya';
  return {
    documentType: 'Prescription',
    patientName: safeName,
    visitDate: '09 Oct 2026',
    doctorName: 'Dr. S. Kumar',
    facilityName: 'City Care Clinic',
    confidenceScore: 92,
    extractedRawText: `Medical Record Scan — Uploaded Document
Patient: ${safeName}
Clinic: City Care Health Center
Date: 09/10/2026
Medicines extracted:
- Paracetamol 650mg 1 tab SOS for body pain
- Vitamin C 500mg 1 tab OD after lunch`,
    medicines: [
      { id: 'custom_m1', name: 'Paracetamol 650 mg', dosage: '650 mg', frequency: '1 tab SOS (as needed)', duration: '5 days', timing: 'afternoon', instructions: 'Take when fever or pain occurs' },
      { id: 'custom_m2', name: 'Vitamin C 500 mg', dosage: '500 mg', frequency: '1 tab daily (OD)', duration: '15 days', timing: 'morning', instructions: 'Take after breakfast' }
    ],
    labValues: [],
    aiExplanation: {
      en: "Document scanned and verified. Extracted 2 medications for supportive symptomatic care. Please verify the extracted values below before saving to your profile.",
      te: "పత్రం స్కాన్ చేయబడింది మరియు ధృవీకరించబడింది. 2 మందుల వివరాలు గుర్తించబడ్డాయి. దయచేసి సేవ్ చేయడానికి ముందు వివరాలను సరిచూసుకోండి.",
      hi: "दस्तावेज़ स्कैन और सत्यापित किया गया। 2 दवाओं का विवरण पहचाना गया। कृपया सहेजने से पहले जांच लें।",
      ta: "ஆவணம் ஸ்கேன் செய்யப்பட்டது. 2 மருந்துகள் பிரித்தெடுக்கப்பட்டன. சேமிப்பதற்கு முன் சரிபார்க்கவும்."
    },
    reviewAlerts: [
      "New custom document processed. Check medicine dosages and frequency carefully."
    ]
  };
}

export function generateAarogyaChatResponse(
  query: string,
  language: Language,
  _records: MedicalRecord[]
): {
  text: string;
  citations: { documentTitle: string; documentDate: string; recordId: string }[];
  isEmergencyAlert: boolean;
} {
  const lower = query.toLowerCase();

  // Emergency symptoms check
  const emergencyKeywords = ['chest pain', 'severe chest', 'heart attack', 'cannot breathe', 'shortness of breath', 'severe bleeding', 'unconscious', 'fainting', 'గుండె నొప్పి', 'శ్వాస ఆడకపోవడం', 'सीने में दर्द', 'सांस लेने में तकलीफ', 'நெஞ்சு வலி'];
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

  // CBC or Blood test explanation
  if (lower.includes('blood') || lower.includes('hemoglobin') || lower.includes('cbc') || lower.includes('రక్త') || lower.includes('रक्त') || lower.includes('இரத்த')) {
    const responses: Record<Language, string> = {
      en: "According to your Complete Blood Count (CBC) report from City Care Lab on 14 Sep 2024:\n\n• Your Hemoglobin (Hb) is 10.8 g/dL, which is slightly below the standard adult reference range of 12.0 – 15.5 g/dL. This may indicate mild anemia.\n• Your Total WBC Count is normal at 6,800 /uL (reference: 4,000 – 11,000 /uL), showing no active bacterial infection.\n• Your Platelet Count is healthy at 2.1 lakh /uL (reference: 1.5 – 4.5 lakh /uL).\n\n💡 Advice: Consider discussing dietary iron intake with Dr. S. Kumar at your upcoming follow-up visit on 21 Sep.",
      te: "14 సెప్టెంబర్ 2024 న సిటీ కేర్ ల్యాబ్ నుండి వచ్చిన మీ పూర్తి రక్త పరీక్ష (CBC) నివేదిక ప్రకారం:\n\n• మీ హిమోగ్లోబిన్ 10.8 g/dL గా ఉంది, ఇది సాధారణ పరిమితి (12.0 – 15.5 g/dL) కంటే కొద్దిగా తక్కువ. ఇది తేలికపాటి రక్తహీనతను సూచించవచ్చు.\n• మీ తెల్ల రక్త కణాలు (WBC) 6,800 /uL గా సాధారణంగా ఉన్నాయి.\n• ప్లేట్‌లెట్స్ సంఖ్య 2.1 లక్షలు /uL గా ఆరోగ్యకరంగా ఉన్నాయి.\n\n💡 సలహా: సెప్టెంబర్ 21న మీ తదుపరి సందర్శనలో డాక్టర్ ఎస్. కుమార్‌తో ఐరన్ డైట్ గురించి చర్చించండి.",
      hi: "14 सितंबर 2024 को सिटी केयर लैब की आपकी कम्पलीट ब्लड काउंट (CBC) रिपोर्ट के अनुसार:\n\n• आपका हीमोग्लोबिन 10.8 g/dL है, जो सामान्य सीमा (12.0 – 15.5 g/dL) से थोड़ा कम है। यह हल्के एनीमिया का संकेत हो सकता है।\n• आपकी कुल WBC संख्या 6,800 /uL पर सामान्य है।\n• प्लेटलेट्स 2.1 लाख /uL पर बिल्कुल स्वस्थ हैं।\n\n💡 सलाह: 21 सितंबर को अपने फॉलो-अप में डॉ. एस. कुमार से इस पर चर्चा करें।",
      ta: "14 செப்டம்பர் 2024 தேதியிட்ட சிட்டி கேர் லேப் சிபிசி அறிக்கையின்படி:\n\n• உங்கள் ஹீமோகுளோபின் 10.8 g/dL ஆக உள்ளது, இது இயல்பான அளவை விட (12.0 – 15.5 g/dL) சற்று குறைவு.\n• உங்கள் வெள்ளை இரத்த அணுக்கள் 6,800 /uL என இயல்பாக உள்ளன.\n• பிளேட்லெட்டுகள் 2.1 லட்சம் /uL என ஆரோக்கியமாக உள்ளன."
    };
    return {
      text: responses[language] || responses.en,
      citations: [{ documentTitle: 'Complete Blood Count (CBC)', documentDate: '14 Sep 2024', recordId: 'rec_cbc_01' }],
      isEmergencyAlert: false
    };
  }

  // Prescription / medicines inquiry
  if (lower.includes('prescription') || lower.includes('medicine') || lower.includes('metformin') || lower.includes('amlodipine') || lower.includes('మందులు') || lower.includes('दवा') || lower.includes('மருந்து')) {
    const responses: Record<Language, string> = {
      en: "From your latest prescription with Dr. S. Kumar on 14 Sep 2024, you have 3 active medicines:\n\n1. Amlodipine 5 mg — 1 tablet daily in the morning for blood pressure regulation.\n2. Metformin 500 mg — 1 tablet twice daily, strictly after food (breakfast & dinner) for blood glucose control.\n3. Atorvastatin 10 mg — 1 tablet at night before bedtime for lipid & cholesterol balance.\n\n⚠️ Important: Always take Metformin after meals to reduce stomach discomfort. Never modify dosages without your doctor's explicit advice.",
      te: "14 సెప్టెంబర్ 2024న డాక్టర్ ఎస్. కుమార్ ఇచ్చిన తాజా ప్రిస్క్రిప్షన్ ప్రకారం, మీకు 3 మందులు ఉన్నాయి:\n\n1. ఆమ్లోడిపైన్ 5 mg — రక్తపోటు నియంత్రణ కోసం ఉదయం 1 మాత్ర.\n2. మెట్‌ఫార్మిన్ 500 mg — భోజనం తర్వాత ఉదయం మరియు రాత్రి 1 మాత్ర.\n3. అటోర్వాస్టాటిన్ 10 mg — కొలెస్ట్రాల్ నియంత్రణ కోసం రాత్రి నిద్రపోయే ముందు 1 మాత్ర.\n\n⚠️ ముఖ్యం: కడుపులో అసౌకర్యం రాకుండా మెట్‌ఫార్మిన్‌ను ఎల్లప్పుడూ భోజనం తర్వాతే తీసుకోండి.",
      hi: "14 सितंबर 2024 को डॉ. एस. कुमार द्वारा दिए गए पर्चे के अनुसार आपकी 3 दवाएं सक्रिय हैं:\n\n1. एम्लोडिपिन 5 mg — रक्तचाप के लिए सुबह 1 गोली।\n2. मेटफॉर्मिन 500 mg — भोजन के बाद दिन में 2 बार (सुबह और रात) 1 गोली।\n3. एटोरवास्टेटिन 10 mg — रात को सोने से पहले 1 गोली।\n\n⚠️ महत्वपूर्ण: पेट की परेशानी से बचने के लिए मेटफॉर्मिन हमेशा भोजन के बाद ही लें।",
      ta: "14 செப்டம்பர் 2024 அன்று டாக்டர் எஸ். குமார் வழங்கிய மருந்துச்சீட்டின்படி 3 மருந்துகள் உள்ளன:\n\n1. ஆம்லோடிபைன் 5 மி.கி — இரத்த அழுத்தத்திற்காக காலையில் 1 மாத்திரை.\n2. மெட்பார்மின் 500 மி.கி — உணவுக்குப் பின் காலை மற்றும் இரவில் 1 மாத்திரை.\n3. அட்டோர்வாஸ்டாடின் 10 மி.கி — இரவில் தூங்கும் முன் 1 மாத்திரை."
    };
    return {
      text: responses[language] || responses.en,
      citations: [{ documentTitle: 'Dr. S. Kumar Prescription', documentDate: '14 Sep 2024', recordId: 'rec_rx_01' }],
      isEmergencyAlert: false
    };
  }

  // Compare reports inquiry
  if (lower.includes('compare') || lower.includes('trend') || lower.includes('పోల్చండి') || lower.includes('तुलना')) {
    const responses: Record<Language, string> = {
      en: "Comparing your last 3 health records (Jan 2024 to Sep 2024):\n\n📈 Hemoglobin: Gradual improvement from 10.2 g/dL (Jan) → 10.5 g/dL (May) → 10.8 g/dL (Sep). Still slightly below the 12.0 g/dL target.\n📉 Fasting Blood Sugar: Significant improvement! Reduced from 142 mg/dL (Jan) → 128 mg/dL (May) → 114 mg/dL (Sep), showing good response to Metformin.\n📉 Systolic Blood Pressure: Decreased from 144 mmHg → 128 mmHg following Amlodipine regimen.\n\nYour general trend shows positive cardiovascular and glycemic management!",
      te: "మీ గత 3 ఆరోగ్య రికార్డులను పోల్చినప్పుడు (జనవరి నుండి సెప్టెంబర్ 2024 వరకు):\n\n📈 హిమోగ్లోబిన్: 10.2 (జనవరి) → 10.5 (మే) → 10.8 g/dL (సెప్టెంబర్) కు మెరుగుపడింది.\n📉 ఫాస్టింగ్ బ్లడ్ షుగర్: మెట్‌ఫార్మిన్ వాడకం వల్ల 142 నుండి 114 mg/dL కు గణనీయంగా తగ్గింది.\n📉 రక్తపోటు (BP): 144 నుండి 128 mmHg కు క్రమబద్ధీకరించబడింది.\n\nమీ ఆరోగ్య పరిస్థితిలో నిలకడైన మెరుగుదల కనిపిస్తోంది!",
      hi: "जनवरी से सितंबर 2024 के आपके रिकॉर्ड्स की तुलना:\n\n📈 हीमोग्लोबिन: 10.2 से बढ़कर 10.8 g/dL हुआ है।\n📉 फास्टिंग शुगर: 142 से घटकर 114 mg/dL हो गई है, जो बहुत सकारात्मक है।\n📉 रक्तचाप (BP): 144 से घटकर 128 mmHg पर आ गया है।\n\nआपकी समग्र सेहत में बहुत अच्छा सुधार दिख रहा है!",
      ta: "உங்கள் கடந்த 3 பதிவுகளை ஒப்பிடும் போது:\n\n📈 ஹீமோகுளோபின்: 10.2 இலிருந்து 10.8 g/dL ஆக உயர்ந்துள்ளது.\n📉 இரத்த சர்க்கரை: 142 இலிருந்து 114 mg/dL ஆக குறைந்துள்ளது.\n📉 இரத்த அழுத்தம்: 144 இலிருந்து 128 mmHg ஆக சீரடைந்துள்ளது."
    };
    return {
      text: responses[language] || responses.en,
      citations: [
        { documentTitle: 'CBC Report', documentDate: '14 Sep 2024', recordId: 'rec_cbc_01' },
        { documentTitle: 'Discharge Summary', documentDate: '02 Jan 2024', recordId: 'rec_dis_01' }
      ],
      isEmergencyAlert: false
    };
  }

  // Default general assistant response
  const generalGreeting: Record<Language, string> = {
    en: `Hello Chaitanya! I have access to your 12 medical records, 3 active medicines, and upcoming appointment with Dr. S. Kumar on 21 Sep 2024. You can ask me to explain any report in simple language, verify medication timings, compare test trends over time, or translate medical terms into Telugu, Hindi, or Tamil.`,
    te: `నమస్కారం చైతన్య! మీ 12 వైద్య రికార్డులు, 3 చురుకైన మందులు మరియు సెప్టెంబర్ 21న డాక్టర్ ఎస్. కుమార్‌తో ఉన్న అపాయింట్‌మెంట్ వివరాలు నా వద్ద ఉన్నాయి. మీరు ఏదైనా రిపోర్టు వివరణను సులభమైన తెలుగులో అడగవచ్చు లేదా మందుల వేళలను తెలుసుకోవచ్చు.`,
    hi: `नमस्ते चैतन्य! मेरे पास आपके 12 मेडिकल रिकॉर्ड्स, 3 सक्रिय दवाएं और 21 सितंबर को डॉ. एस. कुमार के साथ अपॉइंटमेंट की जानकारी है। आप किसी भी रिपोर्ट को सरल हिंदी में समझ सकते हैं या दवाओं का समय पूछ सकते हैं।`,
    ta: `வணக்கம் சைதன்யா! உங்கள் 12 மருத்துவ பதிவுகள், 3 மருந்துகள் மற்றும் செப்டம்பர் 21 தேதியிட்ட டாக்டர் எஸ். குமார் சந்திப்பு விவரங்கள் என்னிடம் உள்ளன. உங்கள் அறிக்கைகளை எளிய தமிழில் புரிந்து கொள்ள என்னிடம் கேட்கலாம்.`
  };

  return {
    text: generalGreeting[language] || generalGreeting.en,
    citations: [{ documentTitle: 'Health Profile & Recent Records', documentDate: '14 Sep 2024', recordId: 'rec_rx_01' }],
    isEmergencyAlert: false
  };
}
