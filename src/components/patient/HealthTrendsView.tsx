import React, { useState } from 'react';
import { 
  ArrowLeft, TrendingUp, TrendingDown, ChevronRight 
} from 'lucide-react';
import { MedicalRecord, Language } from '../../types';
import { labTrendsData } from '../../data/mockData';

interface HealthTrendsViewProps {
  records: MedicalRecord[];
  language: Language;
  onBack: () => void;
  onOpenRecord: (record: MedicalRecord) => void;
}

export const HealthTrendsView: React.FC<HealthTrendsViewProps> = ({
  records,
  language: _language,
  onBack,
  onOpenRecord
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'trends'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'hemoglobin' | 'fastingSugar' | 'systolicBP'>('hemoglobin');

  // Extract all lab tests from the user's records
  const allLabTests = records.flatMap(r => (r.labValues || []).map(lv => ({ ...lv, date: r.visitDate })));
  const latestHb = allLabTests.find(l => /hemoglobin|hb/i.test(l.testName));
  const latestSugar = allLabTests.find(l => /sugar|glucose|fasting/i.test(l.testName));
  const latestBP = allLabTests.find(l => /bp|blood pressure|systolic/i.test(l.testName));

  return (
    <div className="flex-1 p-4 bg-[#f8faf9] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-extrabold text-slate-900">Health Summary & Trends</h2>
          </div>
        </div>

        {/* 3 Main Tabs */}
        <div className="mt-3 flex items-center justify-between bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'overview' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'timeline' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'trends' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Trends
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="mt-4 space-y-3">
            {records.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                <span className="font-bold text-sm text-slate-800 block">No Health Data Yet</span>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Scan or upload your medical prescriptions and lab reports to track your biomarker trends and review clinical activities.
                </p>
              </div>
            ) : (
              <>
                {/* Metric Snapshot Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div 
                    onClick={() => { setActiveTab('trends'); setSelectedMetric('hemoglobin'); }}
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs cursor-pointer hover:border-teal-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Hemoglobin</span>
                      <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-black text-slate-900">{latestHb ? latestHb.value : '--'}</span>
                      <span className="text-[10px] text-slate-400">{latestHb?.unit || 'g/dL'}</span>
                    </div>
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-bold mt-1 inline-block">
                      {latestHb ? (latestHb.status === 'normal' ? 'Normal Range' : `${latestHb.status.toUpperCase()} (${latestHb.referenceRange || 'Ref: 12-15.5'})`) : 'Upload report to track'}
                    </span>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('trends'); setSelectedMetric('fastingSugar'); }}
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs cursor-pointer hover:border-teal-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Blood Sugar</span>
                      <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-black text-slate-900">{latestSugar ? latestSugar.value : '--'}</span>
                      <span className="text-[10px] text-slate-400">{latestSugar?.unit || 'mg/dL'}</span>
                    </div>
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-bold mt-1 inline-block">
                      {latestSugar ? (latestSugar.status === 'normal' ? 'Normal Range' : `${latestSugar.status.toUpperCase()} (${latestSugar.referenceRange || 'Ref: 70-100'})`) : 'Upload report to track'}
                    </span>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('trends'); setSelectedMetric('systolicBP'); }}
                    className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs cursor-pointer hover:border-teal-300 transition-all col-span-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Blood Pressure</span>
                      <TrendingDown className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-black text-slate-900">{latestBP ? latestBP.value : '--'}</span>
                      <span className="text-[10px] text-slate-400">{latestBP?.unit || 'mmHg'}</span>
                    </div>
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-bold mt-1 inline-block">
                      {latestBP ? `${latestBP.status.toUpperCase()} (Target < 120)` : 'Record from doctor consultation'}
                    </span>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
                  <div className="text-xs font-bold text-slate-800 mb-2">Recent Clinical Activity</div>
                  <div className="space-y-2">
                    {records.slice(0, 3).map(rec => (
                      <div
                        key={rec.id}
                        onClick={() => onOpenRecord(rec)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-teal-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-800">{rec.title}</div>
                          <div className="text-[10px] text-slate-400">{rec.visitDate} · {rec.facilityName}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Timeline */}
        {activeTab === 'timeline' && (
          <div className="mt-4">
            {records.length === 0 ? (
              <div className="py-12 px-4 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                <span className="font-bold text-sm text-slate-800 block">No Timeline Events Yet</span>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Your timeline will display all doctor visits, consultations, and lab investigations chronologically once records are added.
                </p>
              </div>
            ) : (
              <div className="relative pl-4 border-l-2 border-teal-200/60 space-y-4 text-xs ml-2">
                {records.map((rec) => (
                  <div key={rec.id} className="relative group cursor-pointer" onClick={() => onOpenRecord(rec)}>
                    {/* Node dot */}
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                    
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-teal-300 transition-all">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">{rec.visitDate}</span>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">{rec.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{rec.doctorName} · {rec.facilityName}</p>
                      
                      {rec.medicines.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {rec.medicines.map(m => (
                            <span key={m.id} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Trends */}
        {activeTab === 'trends' && (
          <div className="mt-4 space-y-3">
            {/* Metric Selector Buttons */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
              <button
                onClick={() => setSelectedMetric('hemoglobin')}
                className={`py-1.5 rounded-lg transition-all ${
                  selectedMetric === 'hemoglobin' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Hemoglobin
              </button>
              <button
                onClick={() => setSelectedMetric('fastingSugar')}
                className={`py-1.5 rounded-lg transition-all ${
                  selectedMetric === 'fastingSugar' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Blood Sugar
              </button>
              <button
                onClick={() => setSelectedMetric('systolicBP')}
                className={`py-1.5 rounded-lg transition-all ${
                  selectedMetric === 'systolicBP' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Blood Pressure
              </button>
            </div>

            {/* Active Metric Chart Box */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>
                  {selectedMetric === 'hemoglobin' && 'Hemoglobin (g/dL)'}
                  {selectedMetric === 'fastingSugar' && 'Fasting Blood Sugar (mg/dL)'}
                  {selectedMetric === 'systolicBP' && 'Systolic BP (mmHg)'}
                </span>
                <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-full">
                  Target: {selectedMetric === 'hemoglobin' ? '12.0 - 15.5' : selectedMetric === 'fastingSugar' ? '70 - 100' : '< 120'}
                </span>
              </div>

              {/* Chart Visualizer */}
              {(() => {
                const metricFilter = selectedMetric === 'hemoglobin' 
                  ? /hemoglobin|hb/i 
                  : selectedMetric === 'fastingSugar'
                  ? /sugar|glucose|fasting/i 
                  : /bp|blood pressure|systolic/i;
                const points = allLabTests.filter(t => metricFilter.test(t.testName));

                if (points.length === 0) {
                  return (
                    <div className="py-10 text-center space-y-2 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block">No Historical Trends Available</span>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Upload lab reports containing this test over multiple visits to visualize biomarker trends and progress.
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="h-44 bg-slate-50 rounded-xl p-3 flex items-end justify-around border border-slate-100">
                      {points.map((pt, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                          <span className="text-[11px] font-bold text-teal-900">{pt.value}</span>
                          <div
                            className="w-12 bg-gradient-to-t from-teal-700 to-teal-500 rounded-t-lg shadow-xs transition-all duration-500"
                            style={{
                              height: `${Math.min(120, (pt.numericValue / (selectedMetric === 'fastingSugar' ? 160 : selectedMetric === 'systolicBP' ? 160 : 16)) * 110)}px`
                            }}
                          />
                          <span className="text-[10px] text-slate-500 font-medium">{pt.date}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-relaxed bg-teal-50/50 p-2.5 rounded-xl border border-teal-100">
                      💡 <strong>Tracked Tests:</strong> Displaying {points.length} recorded reading{points.length > 1 ? 's' : ''} from your clinical documents.
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
