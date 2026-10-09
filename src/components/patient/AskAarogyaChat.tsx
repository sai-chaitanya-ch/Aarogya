import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Mic, MicOff, Send, Sparkles, Volume2, 
  FileText, AlertCircle, RefreshCw, Globe, ChevronRight 
} from 'lucide-react';
import { MedicalRecord, Language, ChatMessage } from '../../types';
import { generateAarogyaChatResponse } from '../../services/aiService';

interface AskAarogyaChatProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  records: MedicalRecord[];
  initialPrompt?: string;
  onBack: () => void;
  onViewRecord?: (recordId: string) => void;
}

export const AskAarogyaChat: React.FC<AskAarogyaChatProps> = ({
  language,
  onLanguageChange,
  records,
  initialPrompt,
  onBack,
  onViewRecord
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm_welcome',
      sender: 'aarogya',
      text: language === 'te' 
        ? "నమస్కారం చైతన్య! నేను మీ ఆరోగ్య అసిస్టెంట్‌ని. మీ 12 రికార్డులు, మందులు మరియు రక్త పరీక్షల వివరాలు నా వద్ద ఉన్నాయి. మీరు ఏదైనా రిపోర్టు గురించి అడగవచ్చు."
        : language === 'hi'
        ? "नमस्ते चैतन्य! मैं आपका आरोग्य सहायक हूँ। आपके 12 मेडिकल रिकॉर्ड्स और दवाओं की जानकारी मेरे पास है। आप अपनी रिपोर्ट या दवाओं के बारे में पूछ सकते हैं।"
        : language === 'ta'
        ? "வணக்கம் சைதன்யா! உங்கள் மருத்துவ பதிவுகள் மற்றும் அறிக்கைகள் பற்றி நீங்கள் என்னிடம் கேட்கலாம்."
        : "Hello Chaitanya! I am your Aarogya health copilot. I have context on your 12 medical records, 3 active medicines, and lab reports. How can I help you understand your health today?",
      timestamp: 'Just now',
      citations: [
        { documentTitle: 'CBC Report (14 Sep 2024)', documentDate: '14 Sep 2024', recordId: 'rec_cbc_01' },
        { documentTitle: 'Dr. Kumar Prescription', documentDate: '14 Sep 2024', recordId: 'rec_rx_01' }
      ]
    }
  ]);

  const [inputText, setInputText] = useState(initialPrompt || '');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
    }
  }, []);

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const result = generateAarogyaChatResponse(query, language, records);
      const botMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'aarogya',
        text: result.text,
        timestamp: 'Just now',
        citations: result.citations,
        isEmergencyAlert: result.isEmergencyAlert
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  // Web Speech API Voice Recognition
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Fallback simulation
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setInputText(language === 'te' ? 'నా చివరి రక్త పరీక్ష గురించి వివరించండి' : 'Explain my latest blood test in simple language');
      }, 1500);
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

  const suggestionChips = [
    { label: "Explain latest blood test", query: "Explain my latest blood test in simple language." },
    { label: "What medicines did Dr. Kumar give?", query: "What medicines were mentioned in my previous prescription?" },
    { label: "Compare my last two reports", query: "Compare my last two reports and show test trends." },
    { label: "Can I take Metformin with food?", query: "Can I take Metformin with food and what is the schedule?" }
  ];

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#f8faf9] h-full min-h-[680px]">
      {/* Header */}
      <div className="p-3.5 bg-white border-b border-slate-100 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
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

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-xs transition-all ${
                msg.sender === 'user'
                  ? 'bg-teal-700 text-white rounded-br-none'
                  : msg.isEmergencyAlert
                  ? 'bg-red-50 text-red-950 border border-red-300 rounded-bl-none font-medium'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
              }`}
            >
              {msg.isEmergencyAlert && (
                <div className="flex items-center gap-1.5 text-red-700 font-black mb-1.5 text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" /> Emergency Alert
                </div>
              )}

              <div className="whitespace-pre-line text-xs">{msg.text}</div>

              {/* Citations Footer */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {msg.citations.map((cite, idx) => (
                    <button
                      key={idx}
                      onClick={() => onViewRecord && onViewRecord(cite.recordId)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-200/60 transition-colors"
                    >
                      <FileText className="w-3 h-3 text-teal-700" />
                      <span>Based on: {cite.documentTitle}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Audio button for AI responses */}
              {msg.sender === 'aarogya' && (
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
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

      {/* Suggested Quick Questions */}
      <div className="px-4 py-1.5 overflow-x-auto flex gap-1.5 scrollbar-none bg-white/60">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.query)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200 text-[11px] font-medium text-slate-700 hover:text-teal-900 transition-colors shadow-2xs"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Voice Recording Waveform Modal / Bar */}
      {isListening && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between animate-pulse">
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

      {/* Input Form Bar */}
      <div className="p-3 bg-white border-t border-slate-100 shadow-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-xl transition-all ${
              isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
            }`}
            title="Speak question"
          >
            <Mic className="w-4 h-4" />
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
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-teal-700 focus:bg-white focus:ring-1 focus:ring-teal-700 outline-none transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 disabled:hover:bg-teal-700 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-1.5 text-center text-[10px] text-slate-400">
          Aarogya provides health information, not medical prescriptions. Always verify with your clinician.
        </div>
      </div>
    </div>
  );
};
