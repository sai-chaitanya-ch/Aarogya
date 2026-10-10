import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Mic, Send, Sparkles, Volume2, 
  FileText, AlertCircle, Paperclip, X, CheckCircle2, Loader2, ChevronRight, RotateCw 
} from 'lucide-react';
import { MedicalRecord, Language, ChatMessage } from '../../types';
import { sendChatToBackend, processDocumentWithBackend, indexDocumentForRag } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';

interface AskAarogyaChatProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  records: MedicalRecord[];
  initialPrompt?: string;
  onBack: () => void;
  onViewRecord?: (recordId: string) => void;
  onOpenAuthModal?: () => void;
}

export type AttachmentStatus =
  | 'processing'
  | 'saving_and_indexing'
  | 'indexed'
  | 'saved_unindexed'
  | 'error';

interface AttachedDocState {
  file: File;
  name: string;
  sizeFormatted: string;
  status: AttachmentStatus;
  errorMessage?: string;
  recordId?: string;
  chunksIndexed?: number;
  isRetryingIndex?: boolean;
}

export const AskAarogyaChat: React.FC<AskAarogyaChatProps> = ({
  language,
  onLanguageChange,
  records,
  initialPrompt,
  onBack,
  onViewRecord,
  onOpenAuthModal
}) => {
  const { user, isAuthenticated } = useAuth();
  const { addRecord } = useHealthData();
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const greetingText = records.length > 0
      ? (language === 'te' ? `నమస్కారం! నేను మీ ఆరోగ్య అసిస్టెంట్‌ని. మీ వద్ద ${records.length} రికార్డులు ఉన్నాయి. మీరు వాటి గురించి నన్ను అడగవచ్చు.` :
         language === 'hi' ? `नमस्ते! मैं आपका आरोग्य सहायक हूँ। आपके पास ${records.length} मेडिकल रिकॉर्ड हैं। आप अपनी रिपोर्ट या दवाओं के बारे में पूछ सकते हैं।` :
         language === 'ta' ? `வணக்கம்! உங்கள் கணக்கில் ${records.length} மருத்துவ பதிவுகள் உள்ளன. உங்கள் அறிக்கைகள் பற்றி என்னிடம் கேட்கலாம்.` :
         `Hello! I am your Aarogya health copilot. You have ${records.length} authorized health record(s). How can I help you understand your health today?`)
      : (language === 'te' ? "నమస్కారం! నేను మీ ఆరోగ్య అసిస్టెంట్‌ని. మీ వద్ద ఇంకా ఎటువంటి రికార్డులు లేవు. పత్రాన్ని స్కాన్ చేసి వివరాలు తెలుసుకోవచ్చు." :
         language === 'hi' ? "नमस्ते! मैं आपका आरोग्य सहायक हूँ। आपके पास अभी कोई रिपोर्ट नहीं है। आप पर्चा अपलोड कर सकते हैं या कोई प्रश्न पूछ सकते हैं।" :
         language === 'ta' ? "வணக்கம்! உங்கள் கணக்கில் இன்னும் மருத்துவ பதிவுகள் இல்லை. ஒரு அறிக்கையை பதிవేற்றவும்." :
         "Hello! I am your Aarogya health copilot. You have no uploaded medical records yet. Scan a prescription or lab report to get personalized explanations.");

    return [
      {
        id: 'm_welcome',
        sender: 'aarogya',
        text: greetingText,
        timestamp: 'Just now',
        citations: []
      }
    ];
  });

  const [inputText, setInputText] = useState(initialPrompt || '');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<AttachedDocState | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Consider scrolled up if more than 140px away from bottom
    const isUp = scrollHeight - scrollTop - clientHeight > 140;
    setUserScrolledUp(isUp);
  };

  const scrollToBottom = (smooth = true) => {
    if (!userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      alert('Supported formats: PDF, JPEG, PNG, and WebP (up to 20 MB).');
      return;
    }

    if (!isAuthenticated) {
      if (onOpenAuthModal) onOpenAuthModal();
      alert('Please sign in or use a demo account to attach and index medical records in your health vault.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('File exceeds the 20 MB upload limit. Please select a smaller document.');
      return;
    }

    const sizeFormatted = file.size < 1024 * 1024
      ? `${Math.round(file.size / 1024)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // 1. Initial Processing state
    setAttachment({
      file,
      name: file.name,
      sizeFormatted,
      status: 'processing'
    });

    try {
      // 1. Send to existing authenticated backend processing endpoint
      const { record: candidateRecord } = await processDocumentWithBackend(file, 'custom', user.name || 'Patient');

      // 2. Transition to saving and indexing state
      setAttachment(prev => prev ? {
        ...prev,
        status: 'saving_and_indexing'
      } : null);

      // 3. Persist to storage, save to database, and attempt pgvector indexing
      const saveResult = await addRecord(candidateRecord, file);
      const realRecord = saveResult.record;
      const realId = realRecord.id;

      if (saveResult.indexingStatus === 'indexed') {
        const chunks = saveResult.chunksIndexed ?? 1;
        setAttachment(prev => prev ? {
          ...prev,
          status: 'indexed',
          recordId: realId,
          chunksIndexed: chunks,
          errorMessage: undefined
        } : null);

        const confirmText = language === 'te' 
          ? `మీ పత్రం "${file.name}" విజయవంతంగా ప్రాసెస్ చేయబడింది మరియు AI శోధన కోసం ఇండెక్స్ చేయబడింది (${chunks} భాగాలు). మీరు ఇప్పుడు దీని గురించి ప్రశ్నలు అడగవచ్చు!`
          : language === 'hi'
          ? `आपका दस्तावेज़ "${file.name}" सफलतापूर्वक प्रोसेस और इंडेक्स हो गया है (${chunks} खंड)। अब आप इसके बारे में पूछ सकते हैं!`
          : language === 'ta'
          ? `உங்கள் ஆவணம் "${file.name}" வெற்றிகரமாக செயலாக்கப்பட்டு குறியிடப்பட்டது (${chunks} பகுதிகள்). நீங்கள் இப்போது அதைப் பற்றி கேட்கலாம்!`
          : `I've analyzed and indexed "${file.name}" (${chunks} chunks) into your health records. You can now ask questions about it!`;

        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          sender: 'aarogya',
          text: confirmText,
          timestamp: 'Just now',
          citations: [{
            documentTitle: realRecord.title || file.name,
            documentDate: realRecord.visitDate || 'Recent',
            recordId: realId
          }]
        }]);
      } else {
        // Saved successfully, but indexing failed
        setAttachment(prev => prev ? {
          ...prev,
          status: 'saved_unindexed',
          recordId: realId,
          errorMessage: saveResult.indexingError || 'Document was saved, but AI search indexing failed.'
        } : null);

        const warnText = language === 'te'
          ? `మీ పత్రం "${file.name}" సురక్షితంగా సేవ్ చేయబడింది, కానీ AI శోధన ఇండెక్సింగ్ ఇంకా పూర్తి కాలేదు. శోధనను ప్రారంభించడానికి దయచేసి 'Retry Indexing' పై క్లిక్ చేయండి.`
          : language === 'hi'
          ? `आपका दस्तावेज़ "${file.name}" सुरक्षित रूप से सहेज लिया गया है, लेकिन AI सर्च इंडेक्सिंग पूरी नहीं हो सकी। इंडेक्स करने के लिए कृपया 'Retry Indexing' पर क्लिक करें।`
          : language === 'ta'
          ? `உங்கள் ஆவணம் "${file.name}" பாதுகாப்பாக சேமிக்கப்பட்டது, ஆனால் AI தேடல் குறியீட்டு முறை தோல்வியடைந்தது. மீண்டும் முயற்சிக்க 'Retry Indexing' கிளிக் செய்யவும்.`
          : `Your document "${file.name}" was safely saved to your medical records, but AI search indexing failed. Click "Retry Indexing" to enable AI search on this document.`;

        setMessages(prev => [...prev, {
          id: `ai_${Date.now()}`,
          sender: 'aarogya',
          text: warnText,
          timestamp: 'Just now',
          citations: [{
            documentTitle: realRecord.title || file.name,
            documentDate: realRecord.visitDate || 'Recent',
            recordId: realId
          }]
        }]);
      }
    } catch (err: any) {
      setAttachment(prev => prev ? {
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Document processing or upload failed. Please retry.'
      } : null);
    }
  };

  const handleRetryIndexing = async () => {
    if (!attachment || !attachment.recordId || attachment.isRetryingIndex) return;

    setAttachment(prev => prev ? {
      ...prev,
      isRetryingIndex: true,
      errorMessage: undefined
    } : null);

    try {
      // Calls existing authenticated indexing endpoint using the real saved database document ID.
      // Does not upload duplicate files or create duplicate medical-document records!
      const res = await indexDocumentForRag(attachment.recordId);
      const chunks = res.chunks_indexed ?? 1;

      setAttachment(prev => prev ? {
        ...prev,
        status: 'indexed',
        chunksIndexed: chunks,
        isRetryingIndex: false,
        errorMessage: undefined
      } : null);

      const confirmText = language === 'te'
        ? `"${attachment.name}" పత్రం కోసం AI శోధన ఇండెక్సింగ్ విజయవంతంగా పూర్తయింది (${chunks} భాగాలు). మీరు ఇప్పుడు దీని గురించి ప్రశ్నలు అడగవచ్చు!`
        : language === 'hi'
        ? `"${attachment.name}" के लिए AI सर्च इंडेक्सिंग सफलतापूर्वक पूरी हो गई (${chunks} खंड)। अब आप इसके बारे में पूछ सकते हैं!`
        : language === 'ta'
        ? `"${attachment.name}" க்கான AI தேடல் குறியீட்டு முறை வெற்றிகரமாக நிறைவடைந்தது (${chunks} பகுதிகள்). நீங்கள் இப்போது அதைப் பற்றி கேட்கலாம்!`
        : `AI search indexing completed for "${attachment.name}" (${chunks} chunks). You can now ask questions about it!`;

      setMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        sender: 'aarogya',
        text: confirmText,
        timestamp: 'Just now',
        citations: [{
          documentTitle: attachment.name,
          documentDate: 'Recent',
          recordId: attachment.recordId
        }]
      }]);
    } catch (err: any) {
      setAttachment(prev => prev ? {
        ...prev,
        status: 'saved_unindexed',
        isRetryingIndex: false,
        errorMessage: err?.message || 'Indexing retry failed. Please try again later.'
      } : null);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (!isAuthenticated) {
      const userMsg: ChatMessage = {
        id: `usr_${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: 'Just now'
      };
      const guestNotice: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'aarogya',
        text: 'Aarogya AI requires an active account to provide personalized medical guidance and protect your health data privacy. Please sign in or use one of the test accounts above to start chatting.',
        timestamp: 'Just now',
        citations: []
      };
      setMessages(prev => [...prev, userMsg, guestNotice]);
      setInputText('');
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    if (attachment?.status === 'processing' || attachment?.status === 'saving_and_indexing') {
      alert('Your document is currently being analyzed and indexed. Please wait a moment before sending.');
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setUserScrolledUp(false);

    sendChatToBackend(query, language, records)
      .then(result => {
        const botMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'aarogya',
          text: result.text,
          timestamp: 'Just now',
          citations: result.citations,
          isEmergencyAlert: result.isEmergency,
          retrievalMode: result.retrievalMode,
          provider: result.provider,
          model: result.model
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      })
      .catch((err: any) => {
        const errMsg = err?.message || 'Aarogya AI is temporarily unavailable. Please try again in a moment.';
        const botMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'aarogya',
          text: errMsg,
          timestamp: 'Just now',
          citations: [],
          isEmergencyAlert: false
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      });
  };

  // Web Speech API Voice Recognition
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechError('Voice input is not supported in this browser. Please type your message or use Google Chrome / Microsoft Edge.');
      setTimeout(() => setSpeechError(null), 6000);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    if (language === 'te') recognition.lang = 'te-IN';
    else if (language === 'hi') recognition.lang = 'hi-IN';
    else if (language === 'ta') recognition.lang = 'ta-IN';
    else recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === 'te') utterance.lang = 'te-IN';
      else if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'ta') utterance.lang = 'ta-IN';
      else utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const suggestionChips = records.length > 0
    ? [
        { label: "Summarize records", query: "Can you summarize my uploaded medical records in simple language?" },
        { label: "Check medication schedule", query: "What are the timings and instructions for my active medications?" },
        { label: "Explain latest report", query: "What are the key findings in my latest uploaded report?" }
      ]
    : [
        { label: "How to upload a report?", query: "How do I upload or scan a prescription in Aarogya?" },
        { label: "Emergency guidance", query: "What should I do in a medical emergency?" },
        { label: "What can Aarogya do?", query: "How can Aarogya help me manage my health records?" }
      ];

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col h-full w-full bg-[#f8faf9] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3.5 sm:p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>Ask Aarogya</span>
            </div>
            <div className="text-[10px] text-teal-800 font-semibold">
              Medical-history aware AI copilot
            </div>
          </div>
        </div>

        {/* Language selector toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
          {(['en', 'te', 'hi', 'ta'] as Language[]).map(langCode => (
            <button
              key={langCode}
              onClick={() => onLanguageChange(langCode)}
              className={`px-2 py-0.5 rounded-md uppercase transition-all ${
                language === langCode ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {langCode}
            </button>
          ))}
        </div>
      </div>

      {/* Guest Notice Banner */}
      {!isAuthenticated && (
        <div className="flex-shrink-0 mx-3.5 sm:mx-4 mt-3 mb-1 p-3 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-teal-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="text-[11px] leading-snug">
              Sign in with email or one of the demo accounts to chat with Aarogya AI and query your private medical documents.
            </span>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="shrink-0 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {/* Speech Support Warning Banner */}
      {speechError && (
        <div className="flex-shrink-0 mx-3.5 sm:mx-4 mt-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px]">{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-amber-700 hover:text-amber-900 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area - ONLY this region scrolls vertically */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-4 text-xs"
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 sm:gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Sender Avatar */}
            {msg.sender === 'aarogya' ? (
              <div className="w-8 h-8 rounded-full bg-teal-100/90 text-teal-800 flex items-center justify-center flex-shrink-0 shadow-2xs border border-teal-200/50 mt-1">
                <Sparkles className="w-4 h-4 text-teal-700" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center flex-shrink-0 shadow-2xs text-[11px] font-bold mt-1">
                ME
              </div>
            )}

            {/* Bubble Container */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] md:max-w-[70%] rounded-2xl p-3.5 sm:p-4 leading-relaxed shadow-xs transition-all ${
                msg.sender === 'user'
                  ? 'bg-teal-700 text-white rounded-tr-none'
                  : msg.isEmergencyAlert
                  ? 'bg-red-50 text-red-950 border border-red-300 rounded-tl-none font-medium'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}
            >
              {msg.isEmergencyAlert && (
                <div className="flex items-center gap-1.5 text-red-700 font-black mb-1.5 text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" /> Emergency Alert
                </div>
              )}

              <div className="whitespace-pre-line text-xs sm:text-[13px] leading-relaxed">{msg.text}</div>

              {/* Citations Card (matching reference image Based on your records card) */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                  {msg.citations.map((cite, idx) => (
                    <button
                      key={idx}
                      onClick={() => onViewRecord && cite.recordId && onViewRecord(cite.recordId)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-teal-50/80 hover:bg-teal-100/80 text-teal-900 border border-teal-200/70 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider">
                            Based on your records
                          </div>
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {cite.documentTitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-teal-700 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Audio button & timestamp for AI responses */}
              {msg.sender === 'aarogya' && (
                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  <button
                    onClick={() => handleSpeakText(msg.text)}
                    className="p-1 hover:text-teal-700 text-slate-400 rounded transition-colors"
                    title="Read aloud"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 p-3 max-w-[120px] bg-white rounded-2xl rounded-bl-none border border-slate-100 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Stationary Bottom Area (Quick chips, Attachment banner, Composer) */}
      <div className="flex-shrink-0 bg-white border-t border-slate-100 shadow-md z-10">
        {/* Suggested Quick Questions */}
        <div className="px-3.5 sm:px-5 py-2 overflow-x-auto flex gap-2 scrollbar-none bg-slate-50/70 border-b border-slate-100">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.query)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-teal-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-teal-900 transition-colors shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Voice Recording Waveform Modal / Bar */}
        {isListening && (
          <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
              <Mic className="w-4 h-4 text-rose-600 animate-bounce" />
              <span>Listening in {language.toUpperCase()}... Speak your question</span>
            </div>
            <button
              onClick={toggleSpeechRecognition}
              className="text-xs font-bold text-rose-700 underline"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Attached Document Card/Chip */}
        {attachment && (
          <div className="px-3.5 sm:px-5 pt-2.5 pb-1 bg-teal-50/40 border-b border-teal-100">
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-teal-200 shadow-2xs max-w-4xl mx-auto">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-800 truncate" title={attachment.name}>
                    {attachment.name}
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span>{attachment.sizeFormatted}</span>
                    <span>·</span>
                    {attachment.status === 'processing' && (
                      <span className="flex items-center gap-1 text-teal-700 font-semibold animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Analyzing candidate document...
                      </span>
                    )}
                    {attachment.status === 'saving_and_indexing' && (
                      <span className="flex items-center gap-1 text-teal-700 font-semibold animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving & indexing for AI search...
                      </span>
                    )}
                    {attachment.status === 'indexed' && (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Indexed for AI search ({attachment.chunksIndexed ?? 1} chunk{attachment.chunksIndexed === 1 ? '' : 's'})
                      </span>
                    )}
                    {attachment.status === 'saved_unindexed' && (
                      <span className="flex items-center gap-1 text-amber-700 font-semibold truncate" title={attachment.errorMessage}>
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        Saved, but search indexing failed
                      </span>
                    )}
                    {attachment.status === 'error' && (
                      <span className="flex items-center gap-1 text-rose-600 font-semibold truncate" title={attachment.errorMessage}>
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {attachment.errorMessage || 'Upload or processing failed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {attachment.status === 'saved_unindexed' && attachment.recordId && (
                  <button
                    type="button"
                    onClick={handleRetryIndexing}
                    disabled={attachment.isRetryingIndex}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Retry search indexing for this saved document"
                  >
                    {attachment.isRetryingIndex ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Retrying...</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3 h-3" />
                        <span>Retry Indexing</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Dismiss attachment"
                  aria-label="Dismiss attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Form Bar */}
        <div className="p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5 sm:gap-2 max-w-4xl mx-auto"
          >
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />

            {/* Document Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-all flex-shrink-0"
              title="Attach medical document"
              aria-label="Attach medical document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                language === 'te' ? "మీ రికార్డుల గురించి అడగండి..." :
                language === 'hi' ? "अपने रिकॉर्ड्स के बारे में पूछें..." :
                language === 'ta' ? "மருத்துவ பதிவுகள் பற்றி கேளுங்கள்..." :
                "Ask about your reports, medicines, or tests..."
              }
              className="flex-1 min-w-0 text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-teal-700 focus:bg-white focus:ring-1 focus:ring-teal-700 outline-none transition-all shadow-2xs"
            />

            {/* Microphone button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all flex-shrink-0 ${
                isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
              }`}
              title="Speak question"
              aria-label="Speak question"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={
                !inputText.trim() || 
                attachment?.status === 'processing' || 
                attachment?.status === 'saving_and_indexing' || 
                attachment?.isRetryingIndex
              }
              className="p-2.5 sm:p-3 rounded-2xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 disabled:hover:bg-teal-700 transition-colors shadow-xs flex-shrink-0"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-1.5 text-center text-[10px] sm:text-[11px] text-slate-400">
            Health information is educational and does not replace your clinician. Always verify with your doctor.
          </div>
        </div>
      </div>
    </div>
  );
};
