import React, { useState, useRef } from 'react';
import { 
  Crop, RotateCw, Sparkles, Edit2, AlertTriangle, 
  ArrowLeft, Upload, Camera, Plus, Trash2, SlidersHorizontal 
} from 'lucide-react';
import { MedicalRecord, Language, ExtractedMedicine, ExtractedLabValue } from '../../types';
import { translations } from '../../data/translations';
import { analyzeDocument } from '../../services/aiService';
import { samplePrescriptionSvg, sampleCBCReportSvg } from '../../data/mockData';
import { processDocumentWithBackend } from '../../services/api';
import { LiveCameraScanner } from './LiveCameraScanner';

interface ScanReviewStepProps {
  language: Language;
  onSaveRecord: (record: MedicalRecord) => void;
  onCancel: () => void;
  onViewSummary: (record: MedicalRecord) => void;
}

export const ScanReviewStep: React.FC<ScanReviewStepProps> = ({
  language,
  onSaveRecord,
  onCancel,
  onViewSummary
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Document selection mode: 'custom' | 'prescription' | 'cbc'
  const [selectedPreset, setSelectedPreset] = useState<'custom' | 'prescription' | 'cbc'>('prescription');
  const [customFileUrl, setCustomFileUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [customCapturedImage, setCustomCapturedImage] = useState<string | null>(null);
  const [_customFile, setCustomFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [contrastEnhanced, setContrastEnhanced] = useState(false);

  // Extracted fields editable state
  const [patientName, setPatientName] = useState('Chaitanya');
  const [visitDate, setVisitDate] = useState('14 Sep 2024');
  const [doctorName, setDoctorName] = useState('Dr. S. Kumar');
  const [facilityName, setFacilityName] = useState('City Care Clinic');
  const [docType, setDocType] = useState<'Prescription' | 'Lab Report' | 'Discharge Summary'>('Prescription');

  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([
    { id: '1', name: 'Amlodipine 5 mg', dosage: '5 mg', frequency: '1 tab daily (OD)', duration: '30 days', timing: 'morning' },
    { id: '2', name: 'Metformin 500 mg', dosage: '500 mg', frequency: '1 tab twice daily (BD) after food', duration: '30 days', timing: 'multiple' },
    { id: '3', name: 'Atorvastatin 10 mg', dosage: '10 mg', frequency: '1 tab daily (OD)', duration: '30 days', timing: 'night' },
  ]);

  const [labValues, setLabValues] = useState<ExtractedLabValue[]>([]);
  const [aiSummary, setAiSummary] = useState<any>({
    en: "Prescription by Dr. S. Kumar includes 3 medicines for blood pressure, blood sugar, and cholesterol management."
  });
  const [reviewAlerts, setReviewAlerts] = useState<string[]>([
    "Metformin dosage is marked strictly after food. Please verify with your doctor before altering."
  ]);

  const handleSelectPreset = (preset: 'prescription' | 'cbc') => {
    setSelectedPreset(preset);
    setCustomFileUrl(null);
    setUploadedFile(null);
    setIsProcessing(true);

    processDocumentWithBackend(null, preset, patientName).then(({ record }) => {
      setPatientName(record.patientName);
      setVisitDate(record.visitDate);
      setDoctorName(record.doctorName);
      setFacilityName(record.facilityName);
      setDocType(record.documentType as any);
      setAiSummary(record.aiSummary);
      setReviewAlerts(record.keyFindings || []);
      if (record.medicines && record.medicines.length > 0) {
        setMedicines(record.medicines);
      }
      if (record.labValues && record.labValues.length > 0) {
        setLabValues(record.labValues);
      }
      setIsProcessing(false);
    }).catch(() => {
      const res = analyzeDocument(preset);
      setPatientName(res.patientName);
      setVisitDate(res.visitDate);
      setDoctorName(res.doctorName);
      setFacilityName(res.facilityName);
      setMedicines(res.medicines);
      setLabValues(res.labValues);
      setAiSummary(res.aiExplanation);
      setReviewAlerts(res.reviewAlerts);
      setIsProcessing(false);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCustomFileUrl(objectUrl);
    setSelectedPreset('custom');
    setIsProcessing(true);

    processDocumentWithBackend(file, 'custom', patientName).then(({ record }) => {
      setPatientName(record.patientName || patientName);
      setVisitDate(record.visitDate || 'Today');
      setDoctorName(record.doctorName || 'Consulting Physician');
      setFacilityName(record.facilityName || 'Care Center');
      setDocType(record.documentType as any);
      setAiSummary(record.aiSummary);
      setReviewAlerts(record.keyFindings || []);
      if (record.medicines && record.medicines.length > 0) {
        setMedicines(record.medicines);
      }
      if (record.labValues && record.labValues.length > 0) {
        setLabValues(record.labValues);
      }
      setIsProcessing(false);
    }).catch(() => {
      setIsProcessing(false);
    });
  };

  const handleSave = () => {
    const activeFileUrl = customFileUrl || (selectedPreset === 'prescription' ? samplePrescriptionSvg : sampleCBCReportSvg);
    const newRecord: MedicalRecord = {
      id: `rec_${Date.now()}`,
      title: `${docType} - ${doctorName}`,
      documentType: docType,
      patientName,
      visitDate,
      doctorName,
      facilityName,
      specialty: docType === 'Prescription' ? 'General Medicine' : 'Pathology',
      originalFileUrl: activeFileUrl,
      originalFileName: uploadedFile ? uploadedFile.name : (selectedPreset === 'prescription' ? 'Prescription_DrKumar.jpg' : 'CBC_LabReport.pdf'),
      status: isEditing ? 'corrected' : 'verified',
      aiSummary: aiSummary,
      keyFindings: reviewAlerts,
      medicines: docType === 'Prescription' ? medicines : [],
      labValues: docType === 'Lab Report' ? labValues : [],
      followUpDate: docType === 'Prescription' ? '2024-09-21' : undefined,
      createdAt: new Date().toISOString()
    };

    onSaveRecord(newRecord);
    onViewSummary(newRecord);
  };

  const activeImageSrc = customFileUrl || (selectedPreset === 'prescription' ? samplePrescriptionSvg : sampleCBCReportSvg);

  return (
    <div className="flex-1 p-4 bg-[#f8faf9] flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-extrabold text-slate-800">{t.scanAndReview}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-1.5 rounded-lg text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/50"
              title="Camera Scan"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/50"
            >
              <Upload className="w-3 h-3" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Camera & File Upload Quick Controls */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowLiveCamera(true)}
            className="py-2.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Open Live Camera</span>
          </button>

          <label className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition-all">
            <Upload className="w-4 h-4 text-teal-700" />
            <span>Upload Photo / PDF</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCustomFile(file);
                  setUploadedFile(file);
                  const url = URL.createObjectURL(file);
                  setCustomCapturedImage(url);
                  setCustomFileUrl(url);
                  setSelectedPreset('custom');
                  setIsProcessing(true);
                  processDocumentWithBackend(file, 'custom', patientName).then(({ record }) => {
                    setPatientName(record.patientName);
                    setVisitDate(record.visitDate);
                    setDoctorName(record.doctorName);
                    setFacilityName(record.facilityName);
                    if (record.medicines && record.medicines.length > 0) {
                      setMedicines(record.medicines);
                    }
                    if (record.labValues && record.labValues.length > 0) {
                      setLabValues(record.labValues);
                    }
                    setIsProcessing(false);
                  }).catch(() => {
                    setIsProcessing(false);
                  });
                }
              }}
            />
          </label>
        </div>

        {/* Source Selector Pills */}
        <div className="mt-2 flex items-center justify-between bg-slate-200/70 p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            type="button"
            onClick={() => {
              setCustomCapturedImage(null);
              setCustomFile(null);
              handleSelectPreset('prescription');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              selectedPreset === 'prescription' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Prescription
          </button>
          <button
            type="button"
            onClick={() => {
              setCustomCapturedImage(null);
              setCustomFile(null);
              handleSelectPreset('cbc');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              selectedPreset === 'cbc' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Lab Report
          </button>
          {(customCapturedImage || customFileUrl || uploadedFile) && (
            <button
              type="button"
              onClick={() => setSelectedPreset('custom')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center truncate px-1 ${
                selectedPreset === 'custom' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Custom File
            </button>
          )}
        </div>

        {/* Scanned Image Preview Container */}
        <div className="relative mt-3 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group">
          <div 
            className="w-full h-52 flex items-center justify-center p-2 bg-slate-50 transition-transform duration-300"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: contrastEnhanced ? 'contrast(135%) brightness(95%)' : 'none'
            }}
          >
            <img
              src={customCapturedImage || activeImageSrc}
              alt="Medical Document Preview"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>

          {/* Crop & Adjust Overlay Button */}
          <button
            onClick={() => setShowCropModal(true)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full text-xs font-semibold backdrop-blur-md shadow-md transition-all active:scale-95"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>{t.cropAdjust}</span>
          </button>

          {/* OCR Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-teal-600 animate-spin" />
              <span className="text-xs font-bold text-teal-900">Running Gemini / Groq OCR Extraction...</span>
            </div>
          )}
        </div>

        {/* Extracted Information Section */}
        <div className="mt-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              {t.extractedInfo}
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditing ? 'Done' : t.edit}</span>
            </button>
          </div>

          {/* Patient Details */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">{t.patientNameLabel}</span>
              {isEditing ? (
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  className="font-bold text-slate-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 outline-none"
                />
              ) : (
                <span className="font-bold text-slate-800">{patientName}</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">{t.visitDateLabel}</span>
              {isEditing ? (
                <input
                  type="text"
                  value={visitDate}
                  onChange={e => setVisitDate(e.target.value)}
                  className="font-bold text-slate-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 outline-none"
                />
              ) : (
                <span className="font-bold text-slate-800">{visitDate}</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Provider / Clinic</span>
              <span className="font-bold text-slate-800">{doctorName} ({facilityName})</span>
            </div>
          </div>

          {/* Extracted Medicines Table (for Prescriptions) */}
          {docType === 'Prescription' && (
            <div className="mt-3">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t.medicinesList}
              </div>
              <div className="space-y-2">
                {medicines.map((med, index) => (
                  <div key={med.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{med.name}</div>
                        <div className="text-[11px] text-slate-500">{med.frequency}</div>
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => setMedicines(medicines.filter(m => m.id !== med.id))}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <button
                    onClick={() => {
                      const newMed: ExtractedMedicine = {
                        id: String(Date.now()),
                        name: 'Paracetamol 500 mg',
                        dosage: '500 mg',
                        frequency: '1 tab SOS (as needed)',
                        duration: '3 days',
                        timing: 'afternoon'
                      };
                      setMedicines([...medicines, newMed]);
                    }}
                    className="w-full py-1.5 text-xs font-bold text-teal-700 bg-teal-50 border border-dashed border-teal-200 rounded-xl flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Extracted Lab Values (for Lab Reports) */}
          {docType === 'Lab Report' && (
            <div className="mt-3">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Key Extracted Tests
              </div>
              <div className="space-y-1.5 text-xs">
                {labValues.length > 0 ? (
                  labValues.map(lv => (
                    <div key={lv.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="font-medium text-slate-800">{lv.testName}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{lv.value}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          lv.status === 'low' ? 'bg-red-200 text-red-800' : lv.status === 'high' ? 'bg-amber-200 text-amber-800' : 'bg-emerald-200 text-emerald-800'
                        }`}>
                          {lv.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100">
                    <span className="font-bold text-red-900">Hemoglobin (Hb)</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-red-600">10.8 g/dL</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200 text-red-800">LOW</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Review Before Saving Warning Card */}
        <div className="mt-3 p-3 bg-amber-50 rounded-2xl border border-amber-200/70 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-amber-900">{t.reviewBeforeSaving}</div>
            <div className="text-[11px] text-amber-800/90 leading-tight">
              {t.reviewNotice}
            </div>
          </div>
        </div>
      </div>

      {/* Save Record Button */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition-all"
        >
          <span>{t.saveRecord}</span>
        </button>
      </div>

      {/* Crop & Adjust Interactive Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">Crop & Adjust Image</h3>
              <button onClick={() => setShowCropModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="relative border-2 border-dashed border-teal-500 rounded-xl p-3 flex items-center justify-center bg-slate-50 h-48 overflow-hidden">
              <div 
                style={{
                  transform: `rotate(${rotation}deg)`,
                  filter: contrastEnhanced ? 'contrast(140%)' : 'none'
                }}
                className="max-h-full max-w-full flex items-center justify-center"
              >
                <img
                  src={activeImageSrc}
                  alt="Crop preview"
                  className="max-h-36 object-contain"
                />
              </div>
              <div className="absolute inset-4 border border-teal-600/40 pointer-events-none rounded" />
            </div>

            <div className="flex items-center justify-around gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
              >
                <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
              </button>
              <button
                type="button"
                onClick={() => setContrastEnhanced(!contrastEnhanced)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold transition-all ${
                  contrastEnhanced ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Enhance Readability
              </button>
            </div>

            <button
              onClick={() => setShowCropModal(false)}
              className="w-full py-2.5 bg-teal-700 text-white font-bold text-xs rounded-xl hover:bg-teal-800 transition-colors"
            >
              Apply Adjustments
            </button>
          </div>
        </div>
      )}

      {/* Live Camera Scanner Overlay */}
      {showLiveCamera && (
        <LiveCameraScanner
          onCapture={(blob, previewUrl) => {
            setCustomCapturedImage(previewUrl);
            setSelectedPreset('custom');
            setShowLiveCamera(false);
            setIsProcessing(true);
            const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setCustomFile(file);
            processDocumentWithBackend(file, 'custom', patientName).then(({ record }) => {
              setPatientName(record.patientName);
              setVisitDate(record.visitDate);
              setDoctorName(record.doctorName);
              setFacilityName(record.facilityName);
              if (record.medicines && record.medicines.length > 0) {
                setMedicines(record.medicines);
              }
              setIsProcessing(false);
            }).catch(() => {
              setIsProcessing(false);
            });
          }}
          onCancel={() => setShowLiveCamera(false)}
          onSelectFile={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setCustomFile(file);
              const url = URL.createObjectURL(file);
              setCustomCapturedImage(url);
              setSelectedPreset('custom');
              setShowLiveCamera(false);
              setIsProcessing(true);
              processDocumentWithBackend(file, 'custom', patientName).then(({ record }) => {
                setPatientName(record.patientName);
                setVisitDate(record.visitDate);
                setDoctorName(record.doctorName);
                setFacilityName(record.facilityName);
                if (record.medicines && record.medicines.length > 0) {
                  setMedicines(record.medicines);
                }
                setIsProcessing(false);
              }).catch(() => {
                setIsProcessing(false);
              });
            }
          }}
        />
      )}
    </div>
  );
};
