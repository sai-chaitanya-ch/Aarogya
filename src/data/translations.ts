import { Language } from '../types';

export const translations: Record<Language, {
  appName: string;
  tagline: string;
  subTagline: string;
  chooseLanguage: string;
  continueBtn: string;
  setupProfile: string;
  profileHelp: string;
  fullName: string;
  dob: string;
  bloodGroup: string;
  location: string;
  allergies: string;
  conditions: string;
  privacyNote: string;
  goodMorning: string;
  takeCharge: string;
  yourHealthSummary: string;
  records: string;
  activeMedicines: string;
  upcomingAppointments: string;
  viewDetails: string;
  askAarogya: string;
  askAarogyaSub: string;
  scanReport: string;
  scanReportSub: string;
  medicalLibrary: string;
  medicalLibrarySub: string;
  medicinesReminders: string;
  medicinesRemindersSub: string;
  appointments: string;
  appointmentsSub: string;
  findDoctor: string;
  findDoctorSub: string;
  abdmTitle: string;
  abdmSub: string;
  scanAndReview: string;
  retake: string;
  cropAdjust: string;
  extractedInfo: string;
  edit: string;
  patientNameLabel: string;
  visitDateLabel: string;
  medicinesList: string;
  reviewBeforeSaving: string;
  reviewNotice: string;
  saveRecord: string;
  reportSummary: string;
  inSimpleLanguage: string;
  valuesOutsideNormal: string;
  notADiagnosis: string;
  otherKeyValues: string;
  askFollowUp: string;
  tabSummary: string;
  tabValues: string;
  tabTrends: string;
  navHome: string;
  navLibrary: string;
  navTimeline: string;
  navProfile: string;
}> = {
  en: {
    appName: "Aarogya",
    tagline: "Your Personal Health Copilot",
    subTagline: "Understand. Organize. Manage. A Healthier You.",
    chooseLanguage: "Choose your language",
    continueBtn: "Continue →",
    setupProfile: "Let's set up your health profile",
    profileHelp: "This helps us personalize your experience and organize your records.",
    fullName: "Full name",
    dob: "Date of birth (DD/MM/YYYY)",
    bloodGroup: "Blood group (optional)",
    location: "Enter your city / location",
    allergies: "Known allergies",
    conditions: "Existing conditions",
    privacyNote: "Your information is private, encrypted, and secure. You can update it anytime.",
    goodMorning: "Good morning",
    takeCharge: "Take charge of your health today.",
    yourHealthSummary: "Your health summary",
    records: "Records",
    activeMedicines: "Active medicines",
    upcomingAppointments: "Upcoming appointments",
    viewDetails: "View details →",
    askAarogya: "Ask Aarogya",
    askAarogyaSub: "Chat or speak with AI",
    scanReport: "Scan a report",
    scanReportSub: "Upload or take a photo",
    medicalLibrary: "Medical Library",
    medicalLibrarySub: "Your reports & prescriptions",
    medicinesReminders: "Medicines & Reminders",
    medicinesRemindersSub: "Never miss a dose",
    appointments: "Appointments",
    appointmentsSub: "Upcoming & past visits",
    findDoctor: "Find a Doctor",
    findDoctorSub: "Nearby healthcare providers",
    abdmTitle: "Join Ayushman Bharat Digital Mission (ABDM)",
    abdmSub: "An initiative by the Government of India to create a seamless, integrated digital healthcare ecosystem.",
    scanAndReview: "Scan & Review",
    retake: "Retake",
    cropAdjust: "Crop & adjust",
    extractedInfo: "Extracted information",
    edit: "Edit",
    patientNameLabel: "Patient name",
    visitDateLabel: "Visit date",
    medicinesList: "Medicines",
    reviewBeforeSaving: "Review before saving",
    reviewNotice: "Please check the extracted information and correct if needed.",
    saveRecord: "Save Record →",
    reportSummary: "Report Summary",
    inSimpleLanguage: "In simple language",
    valuesOutsideNormal: "Values outside normal range",
    notADiagnosis: "This value is outside the reference range. Discuss with your doctor for proper clinical evaluation. This is not a diagnosis.",
    otherKeyValues: "Other key values",
    askFollowUp: "Ask a follow-up question...",
    tabSummary: "Summary",
    tabValues: "Values",
    tabTrends: "Trends",
    navHome: "Home",
    navLibrary: "Library",
    navTimeline: "Timeline",
    navProfile: "Profile"
  },
  te: {
    appName: "ఆరోగ్య",
    tagline: "మీ వ్యక్తిగత ఆరోగ్య సహాయకుడు",
    subTagline: "అర్థం చేసుకోండి. నిర్వహించండి. ఆరోగ్యంగా ఉండండి.",
    chooseLanguage: "మీ భాషను ఎంచుకోండి",
    continueBtn: "ముందుకు సాగండి →",
    setupProfile: "మీ ఆరోగ్య ప్రొఫైల్‌ను సెటప్ చేద్దాం",
    profileHelp: "ఇది మీ రికార్డులను నిర్వహించడానికి మరియు వ్యక్తిగతీకరించడానికి సహాయపడుతుంది.",
    fullName: "పూర్తి పేరు",
    dob: "పుట్టిన తేదీ (తేదీ/నెల/సంవత్సరం)",
    bloodGroup: "రక్త వర్గం (ఐచ్ఛికం)",
    location: "మీ నగరం / చిరునామా నమోదు చేయండి",
    allergies: "తెలిసిన అలెర్జీలు",
    conditions: "మునుపటి వ్యాధులు",
    privacyNote: "మీ సమాచారం ప్రైవేట్ మరియు సురక్షితం. మీరు ఎప్పుడైనా దీన్ని మార్చుకోవచ్చు.",
    goodMorning: "శుభోదయం",
    takeCharge: "ఈ రోజు మీ ఆరోగ్యం పట్ల శ్రద్ధ వహించండి.",
    yourHealthSummary: "మీ ఆరోగ్య సారాంశం",
    records: "రికార్డులు",
    activeMedicines: "మందులు",
    upcomingAppointments: "అపాయింట్‌మెంట్‌లు",
    viewDetails: "వివరాలు చూడండి →",
    askAarogya: "ఆరోగ్యను అడగండి",
    askAarogyaSub: "AIతో మాట్లాడండి లేదా చాట్ చేయండి",
    scanReport: "రిపోర్టును స్కాన్ చేయండి",
    scanReportSub: "ఫోటో తీయండి లేదా అప్‌లోడ్ చేయండి",
    medicalLibrary: "వైద్య లైబ్రరీ",
    medicalLibrarySub: "మీ నివేదికలు & ప్రిస్క్రిప్షన్‌లు",
    medicinesReminders: "మందులు & రిమైండర్‌లు",
    medicinesRemindersSub: "మోతాదును ఎప్పుడూ మరచిపోకండి",
    appointments: "అపాయింట్‌మెంట్‌లు",
    appointmentsSub: "రాబోయే & మునుపటి సందర్శనలు",
    findDoctor: "వైద్యుడిని కనుగొనండి",
    findDoctorSub: "సమీప ఆరోగ్య కేంద్రాలు",
    abdmTitle: "ఆయుష్మాన్ భారత్ డిజిటల్ మిషన్ (ABDM)",
    abdmSub: "భారత ప్రభుత్వం ద్వారా సమీకృత డిజిటల్ ఆరోగ్య వ్యవస్థ.",
    scanAndReview: "స్కాన్ & సమీక్షించండి",
    retake: "మళ్లీ తీయండి",
    cropAdjust: "క్రాప్ & అడ్జస్ట్",
    extractedInfo: "సేకరించిన సమాచారం",
    edit: "సవరించు",
    patientNameLabel: "రోగి పేరు",
    visitDateLabel: "సందర్శన తేదీ",
    medicinesList: "మందులు",
    reviewBeforeSaving: "సేవ్ చేసే ముందు పరిశీలించండి",
    reviewNotice: "దయచేసి సేకరించిన సమాచారాన్ని సరిచూసుకొని అవసరమైతే సవరించండి.",
    saveRecord: "రికార్డును సేవ్ చేయండి →",
    reportSummary: "నివేదిక సారాంశం",
    inSimpleLanguage: "సులభమైన భాషలో",
    valuesOutsideNormal: "సాధారణ పరిమితికి వెలుపల ఉన్న విలువలు",
    notADiagnosis: "ఈ విలువ సాధారణ పరిధికి భిన్నంగా ఉంది. వైద్యునితో సంప్రదించండి. ఇది తుది నిర్ధారణ కాదు.",
    otherKeyValues: "ఇతర ముఖ్యమైన ఫలితాలు",
    askFollowUp: "సందేహాలు అడగండి...",
    tabSummary: "సారాంశం",
    tabValues: "విలువలు",
    tabTrends: "ట్రెండ్స్",
    navHome: "హోమ్",
    navLibrary: "లైబ్రరీ",
    navTimeline: "టైమ్‌లైన్",
    navProfile: "ప్రొఫైల్"
  },
  hi: {
    appName: "आरोग्य",
    tagline: "आपका व्यक्तिगत स्वास्थ्य साथी",
    subTagline: "समझें। व्यवस्थित करें। स्वस्थ रहें।",
    chooseLanguage: "अपनी भाषा चुनें",
    continueBtn: "आगे बढ़ें →",
    setupProfile: "आइए अपना स्वास्थ्य प्रोफ़ाइल बनाएं",
    profileHelp: "यह आपके रिकॉर्ड्स को व्यवस्थित और समझने में मदद करेगा।",
    fullName: "पूरा नाम",
    dob: "जन्म तिथि (दिन/माह/वर्ष)",
    bloodGroup: "रक्त समूह (वैकल्पिक)",
    location: "अपना शहर दर्ज करें",
    allergies: "ज्ञात एलर्जी",
    conditions: "मौजूदा स्वास्थ्य स्थितियां",
    privacyNote: "आपकी जानकारी पूरी तरह सुरक्षित और निजी है। आप इसे कभी भी बदल सकते हैं।",
    goodMorning: "शुभ प्रभात",
    takeCharge: "आज ही अपने स्वास्थ्य की बागडोर संभालें।",
    yourHealthSummary: "आपका स्वास्थ्य सारांश",
    records: "रिकॉर्ड्स",
    activeMedicines: "दवाएं",
    upcomingAppointments: "अपॉइंटमेंट",
    viewDetails: "विवरण देखें →",
    askAarogya: "आरोग्य से पूछें",
    askAarogyaSub: "AI से बात या चैट करें",
    scanReport: "रिपोर्ट स्कैन करें",
    scanReportSub: "फ़ोटो लें या अपलोड करें",
    medicalLibrary: "मेडिकल लाइब्रेरी",
    medicalLibrarySub: "आपकी रिपोर्ट्स और पर्चे",
    medicinesReminders: "दवाएं और रिमाइंडर",
    medicinesRemindersSub: "दवा की खुराक कभी न भूलें",
    appointments: "अपॉइंटमेंट",
    appointmentsSub: "आगामी और पिछले दौरे",
    findDoctor: "डॉक्टर खोजें",
    findDoctorSub: "आस-पास के स्वास्थ्य सेवा प्रदाता",
    abdmTitle: "आयुष्मान भारत डिजिटल मिशन (ABDM)",
    abdmSub: "भारत सरकार द्वारा डिजिटल स्वास्थ्य पारिस्थितिकी तंत्र।",
    scanAndReview: "स्कैन और समीक्षा",
    retake: "पुनः लें",
    cropAdjust: "क्रॉप और समायोजित करें",
    extractedInfo: "प्राप्त जानकारी",
    edit: "संपादित करें",
    patientNameLabel: "मरीज का नाम",
    visitDateLabel: "तारीख",
    medicinesList: "दवाइयां",
    reviewBeforeSaving: "सहेजने से पहले जांचें",
    reviewNotice: "कृपया निकाली गई जानकारी की समीक्षा करें और आवश्यकतानुसार सुधारें।",
    saveRecord: "रिकॉर्ड सहेजें →",
    reportSummary: "रिपोर्ट सारांश",
    inSimpleLanguage: "सरल भाषा में",
    valuesOutsideNormal: "सामान्य सीमा से बाहर के मान",
    notADiagnosis: "यह मान सामान्य सीमा से बाहर है। उचित मूल्यांकन के लिए डॉक्टर से परामर्श करें।",
    otherKeyValues: "अन्य मुख्य परिणाम",
    askFollowUp: "कोई प्रश्न पूछें...",
    tabSummary: "सारांश",
    tabValues: "परिणाम",
    tabTrends: "रुझान",
    navHome: "होम",
    navLibrary: "लाइब्रेरी",
    navTimeline: "समयरेखा",
    navProfile: "प्रोफ़ाइल"
  },
  ta: {
    appName: "ஆரோக்யா",
    tagline: "உங்கள் தனிப்பட்ட சுகாதார வழிகாட்டி",
    subTagline: "புரிந்து கொள்ளுங்கள். சீரமைக்கவும். நலமுடன் வாழ்க.",
    chooseLanguage: "உங்கள் மொழியைத் தேர்வு செய்யவும்",
    continueBtn: "தொடரவும் →",
    setupProfile: "உங்கள் சுகாதார சுயவிவரத்தை உருவாக்குங்கள்",
    profileHelp: "இது உங்கள் மருத்துவ பதிவுகளை ஒழுங்கமைக்க உதவும்.",
    fullName: "முழு பெயர்",
    dob: "பிறந்த தேதி (நாள்/மாதம்/ஆண்டு)",
    bloodGroup: "இரத்த பிரிவு (விருப்பத்திற்குரியது)",
    location: "உங்கள் நகரம் / இடம்",
    allergies: "ஒவ்வாமைகள்",
    conditions: "முந்தைய மருத்துவ நிலைமைகள்",
    privacyNote: "உங்கள் தகவல் பாதுகாப்பானது மற்றும் தனிப்பட்டது.",
    goodMorning: "காலை வணக்கம்",
    takeCharge: "உங்கள் உடல்நலத்தில் இன்று கவனம் செலுத்துங்கள்.",
    yourHealthSummary: "உங்கள் சுகாதார சுருக்கம்",
    records: "பதிவுகள்",
    activeMedicines: "மருந்துகள்",
    upcomingAppointments: "சந்திப்புகள்",
    viewDetails: "விவரங்களை பார்க்க →",
    askAarogya: "ஆரோக்யாவிடம் கேளுங்கள்",
    askAarogyaSub: "AI உடன் பேசவும் அல்லது எழுதவும்",
    scanReport: "அறிக்கையை ஸ்கேன் செய்க",
    scanReportSub: "படம் எடுக்கவும் அல்லது பதிவேற்றவும்",
    medicalLibrary: "மருத்துவ நூலகம்",
    medicalLibrarySub: "உங்கள் அறிக்கைகள் மற்றும் மருந்துச்சீட்டுகள்",
    medicinesReminders: "மருந்துகள் & நினைவூட்டல்",
    medicinesRemindersSub: "மருந்துகளை தவறவிடாதீர்கள்",
    appointments: "சந்திப்புகள்",
    appointmentsSub: "வரவிருக்கும் & முந்தைய சந்திப்புகள்",
    findDoctor: "மருத்துவரைத் தேடுங்கள்",
    findDoctorSub: "அருகிலுள்ள மருத்துவர்கள்",
    abdmTitle: "ஆயுஷ்மான் பாரத் டிஜிட்டல் மிஷன் (ABDM)",
    abdmSub: "இந்திய அரசின் ஒருங்கிணைந்த டிஜிட்டல் சுகாதார தளம்.",
    scanAndReview: "ஸ்கேன் மற்றும் மதிப்பாய்வு",
    retake: "மீண்டும் எடுக்கவும்",
    cropAdjust: "செதுக்கு & சீரமைக்கவும்",
    extractedInfo: "பிரித்தெடுக்கப்பட்ட தகவல்",
    edit: "திருத்தவும்",
    patientNameLabel: "நோயாளி பெயர்",
    visitDateLabel: "வருகை தேதி",
    medicinesList: "மருந்துகள்",
    reviewBeforeSaving: "சேமிக்கும் முன் சரிபார்க்கவும்",
    reviewNotice: "பிரித்தெடுக்கப்பட்ட தகவலை சரிபார்த்து தேவைப்பட்டால் மாற்றவும்.",
    saveRecord: "பதிவை சேமிக்கவும் →",
    reportSummary: "அறிக்கை சுருக்கம்",
    inSimpleLanguage: "எளிய மொழியில்",
    valuesOutsideNormal: "சாதாரண வரம்பிற்கு வெளியே",
    notADiagnosis: "இது மருத்துவக் கணிப்பு அல்ல. உங்கள் மருத்துவரிடம் ஆலோசிக்கவும்.",
    otherKeyValues: "பிற முடிவுகள்",
    askFollowUp: "கேள்வி கேட்கவும்...",
    tabSummary: "சுருக்கம்",
    tabValues: "மதிப்புகள்",
    tabTrends: "போக்குகள்",
    navHome: "முகப்பு",
    navLibrary: "நூலகம்",
    navTimeline: "காலவரிசை",
    navProfile: "சுயவிவரம்"
  }
};
