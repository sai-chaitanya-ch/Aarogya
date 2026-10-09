import React, { useState } from 'react';
import { 
  ArrowLeft, Search, FileText, 
  Trash2, ChevronRight, Plus, Sparkles 
} from 'lucide-react';
import { MedicalRecord, Language, DocumentType } from '../../types';

interface MedicalLibraryProps {
  records: MedicalRecord[];
  language: Language;
  onBack: () => void;
  onOpenRecord: (record: MedicalRecord) => void;
  onScanNew: () => void;
  onDeleteRecord?: (id: string) => void;
}

export const MedicalLibrary: React.FC<MedicalLibraryProps> = ({
  records,
  language,
  onBack,
  onOpenRecord,
  onScanNew,
  onDeleteRecord
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | DocumentType>('All');

  const filterTabs: ('All' | DocumentType)[] = [
    'All',
    'Lab Report',
    'Prescription',
    'Discharge Summary',
    'X-Ray / Imaging'
  ];

  const filteredRecords = records.filter(r => {
    const matchesFilter = selectedFilter === 'All' || r.documentType === selectedFilter;
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.facilityName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            <h2 className="text-sm font-extrabold text-slate-900">Medical Library</h2>
          </div>
          <button
            onClick={onScanNew}
            className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search records by doctor, hospital or test..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-teal-700 outline-none shadow-2xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {filterTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedFilter(tab)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedFilter === tab
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab === 'All' ? `All (${records.length})` : tab}
            </button>
          ))}
        </div>

        {/* Records List */}
        <div className="space-y-2.5 mt-1">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              onClick={() => onOpenRecord(record)}
              className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 hover:shadow-sm cursor-pointer transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    record.documentType === 'Lab Report' ? 'bg-red-50 text-red-700' :
                    record.documentType === 'Prescription' ? 'bg-teal-50 text-teal-800' :
                    record.documentType === 'Discharge Summary' ? 'bg-blue-50 text-blue-700' :
                    'bg-purple-50 text-purple-700'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-teal-800 transition-colors">
                      {record.title}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>{record.visitDate}</span>
                      <span>·</span>
                      <span>{record.facilityName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {onDeleteRecord && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${record.title}?`)) {
                          onDeleteRecord(record.id);
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* AI Summary snippet */}
              <div className="mt-2.5 pt-2 border-t border-slate-50 flex items-center gap-1.5 text-[11px] text-slate-600 line-clamp-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                <span>{record.aiSummary[language] || record.aiSummary.en}</span>
              </div>
            </div>
          ))}

          {records.length === 0 ? (
            <div className="py-14 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">No medical records yet.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Upload or scan a prescription, diagnostic lab report, or discharge summary to get started.
              </p>
              <button
                onClick={onScanNew}
                className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                + Scan or Upload Document
              </button>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              No matching records found for "{searchQuery}".
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
