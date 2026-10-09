import React, { useState } from 'react';
import { 
  ArrowLeft, TrendingUp, Activity, 
  Calendar, FileText, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { MedicalRecord, Language } from '../../types';

interface HealthTrendsViewProps {
  records: MedicalRecord[];
  language: Language;
  onBack: () => void;
  onOpenRecord: (record: MedicalRecord) => void;
}

export const HealthTrendsView: React.FC<HealthTrendsViewProps> = ({
  records,
  language,
  onBack,
  onOpenRecord
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'trends'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'hemoglobin' | 'fastingSugar' | 'systolicBP'>('hemoglobin');

  // Extract real lab values from authorized records
  const allLabValues = records.flatMap(r => 
    (r.labValues || []).map(l => ({ ...l, recordDate: r.visitDate, recordTitle: r.title }))
  );

  const getMetricData = (metric: 'hemoglobin' | 'fastingSugar' | 'systolicBP') => {
    return allLabValues.filter(l => {
      const name = l.testName.toLowerCase();
      if (metric === 'hemoglobin') return name.includes('hemoglobin') || name.includes('hb');
      if (metric === 'fastingSugar') return name.includes('sugar') || name.includes('glucose');
      if (metric === 'systolicBP') return name.includes('bp') || name.includes('pressure');
      return false;
    });
  };

  const currentMetricData = getMetricData(selectedMetric);

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
              <div className="py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <Activity className="w-8 h-8 text-teal-700/60 mb-2" />
                <h3 className="font-bold text-sm text-slate-800">No health data recorded yet.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Upload reports or prescriptions to generate your personalized health overview.
                </p>
              </div>
            ) : (
              <>
                {/* Metric Snapshot Cards from real records if present */}
                <div className="grid grid-cols-2 gap-2.5">
                  {allLabValues.slice(0, 4).map((lab, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 truncate">{lab.testName}</span>
                        <TrendingUp className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900">{lab.value}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                        lab.status === 'low' || lab.status === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {lab.status ? lab.status.toUpperCase() : 'NORMAL'}
                      </span>
                    </div>
                  ))}
                </div>

                {allLabValues.length === 0 && (
                  <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs text-slate-600">
                    <p className="font-bold text-teal-900">No discrete lab values found</p>
                    <p className="text-[11px] mt-0.5">Your uploaded documents do not currently contain extracted lab biomarkers.</p>
                  </div>
                )}

                {/* Recent Activities */}
                <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs">
                  <div className="text-xs font-bold text-slate-800 mb-2">Recent Clinical Activity</div>
                  <div className="space-y-2">
                    {records.slice(0, 4).map(rec => (
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
              <div className="py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                <Calendar className="w-8 h-8 text-teal-700/60 mb-2" />
                <h3 className="font-bold text-sm text-slate-800">Your health timeline is empty.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Each medical record you scan or upload will appear along your chronological timeline.
                </p>
              </div>
            ) : (
              <div className="relative pl-4 border-l-2 border-teal-200/60 space-y-4 text-xs ml-2">
                {records.map((rec) => (
                  <div key={rec.id} className="relative group cursor-pointer" onClick={() => onOpenRecord(rec)}>
                    <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                    
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-2xs hover:border-teal-300 transition-all">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">{rec.visitDate}</span>
                      <h4 className="font-bold text-xs text-slate-900 mt-0.5">{rec.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{rec.doctorName} · {rec.facilityName}</p>
                      
                      {rec.medicines && rec.medicines.length > 0 && (
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
                <span className="capitalize">{selectedMetric.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-[11px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-full">
                  Target: {selectedMetric === 'hemoglobin' ? '12.0 - 15.5 g/dL' : selectedMetric === 'fastingSugar' ? '70 - 100 mg/dL' : '< 120 mmHg'}
                </span>
              </div>

              {currentMetricData.length === 0 ? (
                <div className="py-12 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
                  <Activity className="w-6 h-6 text-slate-400 mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">No verified measurements found.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                    Upload clinical lab reports to track your biomarker trend lines over time.
                  </p>
                </div>
              ) : (
                <div className="h-44 bg-slate-50 rounded-xl p-3 flex items-end justify-around border border-slate-100">
                  {currentMetricData.map((pt, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-bold text-teal-900">{pt.value}</span>
                      <div
                        className="w-12 bg-gradient-to-t from-teal-700 to-teal-500 rounded-t-lg shadow-xs transition-all duration-500"
                        style={{ height: '70px' }}
                      />
                      <span className="text-[10px] text-slate-500 font-medium">{pt.recordDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
