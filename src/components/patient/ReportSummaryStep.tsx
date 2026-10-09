import React, { useState } from 'react';
import { 
  ArrowLeft, MoreVertical, Sparkles, AlertTriangle, 
  CheckCircle2, Volume2, Send, Calendar 
} from 'lucide-react';
import { MedicalRecord, Language } from '../../types';
import { translations } from '../../data/translations';

interface ReportSummaryStepProps {
  record?: MedicalRecord | null;
  language: Language;
  onBack: () => void;
  onAskFollowUp: (question: string) => void;
}

export const ReportSummaryStep: React.FC<ReportSummaryStepProps> = ({
  record,
  language,
  onBack,
  onAskFollowUp
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'summary' | 'values' | 'trends'>('summary');
  const [followUpText, setFollowUpText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!record) {
    return (
      <div className="flex-1 p-6 bg-[#f8faf9] flex flex-col items-center justify-center text-center min-h-[640px]">
        <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-4 shadow-sm">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">No Document Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Upload or scan a prescription or medical lab report to generate an AI clinical summary and extracted insights.
        </p>
        <button
          onClick={onBack}
          className="mt-6 px-5 py-2.5 bg-teal-700 text-white rounded-2xl text-xs font-bold hover:bg-teal-800 shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const localizedSummary = record.aiSummary?.[language] || record.aiSummary?.en || 'Record processed.';


  const handleSpeakSummary = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(localizedSummary);
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'te') utterance.lang = 'te-IN';
      else if (language === 'ta') utterance.lang = 'ta-IN';
      else utterance.lang = 'en-US';

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim()) return;
    onAskFollowUp(followUpText.trim());
  };

  return (
    <div className="flex-1 p-4 bg-[#f8faf9] flex flex-col justify-between min-h-[680px]">
      <div>
        {/* Header matching mockup */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <button
            onClick={onBack}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-extrabold text-slate-800">{t.reportSummary}</h2>
          <button className="p-1 text-slate-400 hover:text-slate-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Report Title & Metadata Card */}
        <div className="mt-3 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
              {record.title}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {record.visitDate} · {record.facilityName}
            </p>
          </div>
        </div>

        {/* 3 Tabs: Summary | Values | Trends */}
        <div className="mt-3 flex items-center justify-between bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'summary' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {t.tabSummary}
          </button>
          <button
            onClick={() => setActiveTab('values')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'values' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {t.tabValues}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'trends' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            {t.tabTrends}
          </button>
        </div>

        {/* Tab 1: Summary */}
        {activeTab === 'summary' && (
          <div className="mt-3 space-y-3">
            {/* In Simple Language Box */}
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 shadow-xs relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-900">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>{t.inSimpleLanguage}</span>
                </div>
                <button
                  onClick={handleSpeakSummary}
                  className={`p-1.5 rounded-full text-teal-800 hover:bg-teal-100 transition-colors ${
                    isSpeaking ? 'bg-teal-200 animate-pulse' : 'bg-white shadow-xs'
                  }`}
                  title="Listen to voice explanation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {localizedSummary}
              </p>
            </div>

            {/* Values outside normal range alert */}
            {record.labValues.filter(l => l.status !== 'normal').length > 0 && (
              <div className="p-3.5 bg-white rounded-2xl border border-red-100 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>{t.valuesOutsideNormal}</span>
                </div>

                {record.labValues.filter(l => l.status !== 'normal').map(item => (
                  <div key={item.id} className="pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{item.testName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 uppercase">
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-sm font-extrabold text-red-600">{item.value}</span>
                      <span className="text-[11px] text-slate-500">Normal range: {item.referenceRange}</span>
                    </div>

                    {/* Disclaimer callout box */}
                    <div className="mt-2 p-2 bg-amber-50/80 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-snug">
                      › {t.notADiagnosis}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Other Key Values */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t.otherKeyValues}</span>
              </div>
              <div className="space-y-2 text-xs">
                {record.labValues.filter(l => l.status === 'normal').map(val => (
                  <div key={val.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-none">
                    <span className="text-slate-600">{val.testName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{val.value}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Normal
                      </span>
                    </div>
                  </div>
                ))}

                {record.labValues.length === 0 && record.medicines.length > 0 && (
                  <div className="space-y-1.5">
                    {record.medicines.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-none">
                        <span className="text-slate-700 font-medium">{idx + 1}. {m.name}</span>
                        <span className="text-slate-500 text-[11px]">{m.frequency}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full Values Table */}
        {activeTab === 'values' && (
          <div className="mt-3 bg-white rounded-2xl p-3 border border-slate-100 shadow-xs overflow-hidden">
            <div className="text-xs font-bold text-slate-800 mb-2">Detailed Laboratory Parameters</div>
            <div className="divide-y divide-slate-100 text-xs">
              {record.labValues.map(item => (
                <div key={item.id} className="py-2.5 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{item.testName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Ref: {item.referenceRange}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-black ${item.status === 'low' || item.status === 'high' ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.value}
                    </div>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                      item.status === 'normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
              {record.labValues.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  No discrete numeric lab values in this prescription. Refer to Medicines in Summary tab.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Trends Graph */}
        {activeTab === 'trends' && (
          <div className="mt-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-4">
            {record.labValues && record.labValues.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Biomarker Values</span>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
                    {record.labValues.length} Test{record.labValues.length > 1 ? 's' : ''} Logged
                  </span>
                </div>

                <div className="space-y-2">
                  {record.labValues.map((lv, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{lv.testName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Ref: {lv.referenceRange || 'Standard Range'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-xs text-teal-900">{lv.value}</div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          lv.status === 'low' ? 'bg-red-100 text-red-700' :
                          lv.status === 'high' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {lv.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/60">
                  💡 <strong>Clinical Insight:</strong> Test results from {record.visitDate}. Upload follow-up reports to track progress over time.
                </p>
              </>
            ) : (
              <div className="py-8 text-center space-y-2">
                <span className="text-xs font-bold text-slate-700 block">No Lab Values in Document</span>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  This document contains prescription or clinical notes. Upload a pathology or blood test report to visualize biomarker trends.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Ask Follow-up Bar */}
      <div className="pt-3">
        <form onSubmit={handleSendQuestion} className="relative flex items-center">
          <input
            type="text"
            value={followUpText}
            onChange={e => setFollowUpText(e.target.value)}
            placeholder={t.askFollowUp}
            className="w-full text-xs px-4 py-3 pr-12 rounded-2xl bg-white border border-slate-200 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 outline-none shadow-sm transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 p-2 rounded-xl bg-teal-700 text-white hover:bg-teal-800 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
