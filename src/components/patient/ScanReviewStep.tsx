import React, { useState, useEffect } from 'react';
import { 
  Crop, RotateCw, Sparkles, Edit2, AlertTriangle, 
  ArrowLeft, Upload, Plus, Trash2, SlidersHorizontal, Camera, AlertCircle, FileText
} from 'lucide-react';
import { MedicalRecord, Language, ExtractedMedicine, ExtractedLabValue, DocumentType } from '../../types';
import { translations } from '../../data/translations';
import { processDocumentWithBackend, checkBackendHealth } from '../../services/api';
import { LiveCameraScanner } from './LiveCameraScanner';
import { useAuth } from '../../context/AuthContext';

interface ScanReviewStepProps {
  language: Language;
  onSaveRecord: (record: MedicalRecord, fileBlob?: File | Blob) => Promise<any> | any;
  onCancel: () => void;
  onViewSummary: (record: MedicalRecord) => void;
  onOpenAuthModal?: () => void;
}

const DOCUMENT_CATEGORIES: DocumentType[] = [
  'Prescription',
  'Lab Report',
  'Discharge Summary',
  'X-Ray / Imaging',
  'Clinical Notes'
];

const TODAY_ISO = new Date().toISOString().split('T')[0];

export const ScanReviewStep: React.FC<ScanReviewStepProps> = ({
  language,
  onSaveRecord,
  onCancel,
  onViewSummary,
  onOpenAuthModal
}) => {
  const t = translations[language];
  const { isAuthenticated, isDemoSession } = useAuth();

  // Candidate extraction state & errors
  const [processedRecord, setProcessedRecord] = useState<MedicalRecord | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dateValidationError, setDateValidationError] = useState<string | null>(null);
  const [appliedTemplateNotice, setAppliedTemplateNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-warm backend API on mount to reduce cold-start timeout risk
  useEffect(() => {
    checkBackendHealth().catch(() => {});
  }, []);

  // Document category
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('Prescription');

  // UI state
  const [isEditing, setIsEditing] = useState(true);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [customCapturedImage, setCustomCapturedImage] = useState<string | null>(null);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [contrastEnhanced, setContrastEnhanced] = useState(false);

  // Extracted fields editable state
  const [patientName, setPatientName] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [docTitle, setDocTitle] = useState('Prescription');
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([]);
  const [labValues, setLabValues] = useState<ExtractedLabValue[]>([]);

  const handleProcessFile = async (file: File) => {
    setCustomFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCustomCapturedImage(previewUrl);
    setIsProcessing(true);
    setProcessingError(null);
    setSaveError(null);
    setDateValidationError(null);
    setAppliedTemplateNotice(null);

    // Capture currently entered manual values so we don't wipe them if extraction fails
    const currentDocTitle = docTitle;
    const currentPatientName = patientName;
    const currentVisitDate = visitDate;
    const currentDoctorName = doctorName;
    const currentFacilityName = facilityName;
    const currentMedicines = medicines;
    const currentLabValues = labValues;

    try {
      const preset = selectedDocType === 'Lab Report' ? 'cbc' : selectedDocType === 'Discharge Summary' ? 'discharge' : 'prescription';
      const { record, rawExtractedText } = await processDocumentWithBackend(file, preset);
      
      const candidate: MedicalRecord = {
        ...record,
        rawExtractedText
      };
      setProcessedRecord(candidate);

      // Populate candidate field values
      setDocTitle(candidate.title || currentDocTitle || `${candidate.documentType}${candidate.facilityName ? ` — ${candidate.facilityName}` : ''}`);
      setSelectedDocType(candidate.documentType || selectedDocType);
      setPatientName(candidate.patientName || currentPatientName || '');
      setVisitDate(candidate.visitDate || currentVisitDate || '');
      setDoctorName(candidate.doctorName || currentDoctorName || '');
      setFacilityName(candidate.facilityName || currentFacilityName || '');
      setMedicines(candidate.medicines?.length ? candidate.medicines : currentMedicines);
      setLabValues(candidate.labValues?.length ? candidate.labValues : currentLabValues);
    } catch (err: any) {
      setProcessingError(err?.message || 'Failed to extract document information. Please verify your file or enter details manually.');
      // Keep review fields fully editable and preserve user-entered values
      setIsEditing(true);
      if (!docTitle) {
        setDocTitle(selectedDocType);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyDemoTemplate = () => {
    if (!isDemoSession) {
      console.warn('Blocked attempt to apply synthetic demo template to a non-demo session.');
      return;
    }

    const isLab = selectedDocType === 'Lab Report';
    const isDischarge = selectedDocType === 'Discharge Summary';

    if (isLab) {
      setDocTitle('Complete Blood Count (CBC) (Demo Template)');
      setPatientName('Demo Patient A');
      setVisitDate(TODAY_ISO);
      setDoctorName('Dr. S. K. Gupta (Demo)');
      setFacilityName('Demo Diagnostic Centre');
      setLabValues([
        {
          id: `demo-lab-${Date.now()}-1`,
          testName: 'Hemoglobin',
          value: '11.0 g/dL',
          numericValue: 11.0,
          unit: 'g/dL',
          referenceRange: '12.0 - 15.5',
          status: 'low',
          notes: 'Synthetic demo value'
        },
        {
          id: `demo-lab-${Date.now()}-2`,
          testName: 'Platelet Count',
          value: '220,000 /uL',
          numericValue: 220000,
          unit: '/uL',
          referenceRange: '150,000 - 450,000',
          status: 'normal',
          notes: ''
        }
      ]);
      setMedicines([]);
    } else if (isDischarge) {
      setDocTitle('Inpatient Discharge Summary (Demo Template)');
      setPatientName('Demo Patient A');
      setVisitDate(TODAY_ISO);
      setDoctorName('Dr. V. Prasad (Demo)');
      setFacilityName('Demo City General Hospital');
      setMedicines([
        {
          id: `demo-med-${Date.now()}-1`,
          name: 'Pantoprazole 40mg',
          dosage: '40mg',
          frequency: 'Once daily before breakfast',
          duration: '14 days',
          timing: 'morning',
          instructions: 'Take 30 mins before morning meal'
        }
      ]);
      setLabValues([]);
    } else {
      setDocTitle('General Consultation Prescription (Demo Template)');
      setPatientName('Demo Patient A');
      setVisitDate(TODAY_ISO);
      setDoctorName('Dr. A. Sharma (Demo)');
      setFacilityName('Demo Community Health Clinic');
      setMedicines([
        {
          id: `demo-med-${Date.now()}-1`,
          name: 'Amoxicillin 500mg',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '5 days',
          timing: 'morning',
          instructions: 'Take after meals'
        },
        {
          id: `demo-med-${Date.now()}-2`,
          name: 'Paracetamol 650mg',
          dosage: '650mg',
          frequency: 'As needed for fever/body ache',
          duration: '3 days',
          timing: 'night',
          instructions: 'Do not exceed 3 tablets daily'
        }
      ]);
      setLabValues([]);
    }

    setAppliedTemplateNotice('Applied synthetic demo template for testing. Note: Values are simulated samples and were NOT extracted from your uploaded file.');
    setDateValidationError(null);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!customFile) {
      setSaveError('Please select or capture a real medical document before saving.');
      return;
    }

    if (!isAuthenticated) {
      setSaveError('Sign in to save medical records to your secure health vault. Your reviewed document will be preserved.');
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!visitDate || !/^\d{4}-\d{2}-\d{2}$/.test(visitDate.trim())) {
      const err = 'Please enter a valid visit / report date before saving.';
      setDateValidationError(err);
      setSaveError(err);
      setIsEditing(true);
      return;
    }
    const parsedDate = new Date(visitDate.trim());
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDate > today) {
      const err = 'Visit date cannot be in the future. Please correct the report date.';
      setDateValidationError(err);
      setSaveError(err);
      setIsEditing(true);
      return;
    }

    setDateValidationError(null);
    setSaveError(null);
    setIsSaving(true);

    try {
      const recordToSave: MedicalRecord = {
        id: processedRecord?.id || `rec_${Date.now()}`,
        title: docTitle.trim() || `${selectedDocType}${facilityName ? ` — ${facilityName}` : ''}`,
        documentType: selectedDocType,
        patientName: patientName.trim(),
        visitDate: visitDate.trim(),
        doctorName: doctorName.trim(),
        facilityName: facilityName.trim(),
        specialty: processedRecord?.specialty || (selectedDocType === 'Lab Report' ? 'Pathology' : 'General Medicine'),
        status: isEditing ? 'corrected' : 'verified',
        aiSummary: processedRecord?.aiSummary || { en: '' },
        keyFindings: processedRecord?.keyFindings || [],
        medicines: medicines,
        labValues: labValues,
        rawExtractedText: processedRecord?.rawExtractedText || '',
        originalFileName: customFile.name,
        createdAt: new Date().toISOString()
      };

      const saveResult = await onSaveRecord(recordToSave, customFile);
      const savedRecord = (saveResult && typeof saveResult === 'object' && 'record' in saveResult) ? (saveResult as any).record : recordToSave;
      onViewSummary(savedRecord);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save document. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#f8faf9] flex flex-col justify-between max-w-4xl w-full mx-auto">
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
          {customFile && (
            <button
              onClick={() => {
                setCustomFile(null);
                setCustomCapturedImage(null);
                setProcessedRecord(null);
                setProcessingError(null);
                setSaveError(null);
              }}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200/50"
            >
              {t.retake}
            </button>
          )}
        </div>

        {/* Demo Mode Notice */}
        {isDemoSession && (
          <div className="mt-2.5 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-amber-900">Demo Privacy Notice:</span> Uploaded files are transmitted ephemerally to the Aarogya backend and processed by the configured AI provider solely for OCR and text extraction. Files and records are <span className="font-semibold underline">never</span> saved to persistent database tables or Supabase Storage. Demo records exist only in your current browser session. Please test using synthetic or de-identified test documents only.
            </div>
          </div>
        )}

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
                  handleProcessFile(file);
                }
              }}
            />
          </label>
        </div>

        {/* Document Category Selection */}
        <div className="mt-2.5">
          <div className="text-[11px] font-bold text-slate-600 mb-1.5">Document Category</div>
          <div className="flex flex-wrap gap-1.5">
            {DOCUMENT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedDocType(cat);
                  if (!docTitle || DOCUMENT_CATEGORIES.includes(docTitle as DocumentType)) {
                    setDocTitle(cat);
                  }
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDocType === cat
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Processing Error / Fallback Banner */}
        {processingError && (
          <div className="mt-3 p-3.5 bg-amber-50/95 border border-amber-300 text-amber-950 rounded-2xl text-xs space-y-2.5 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900">Extraction Notice: Automatic OCR Unavailable</div>
                  <div className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">{processingError}</div>
                  <div className="text-[10px] text-amber-700 font-medium mt-1">
                    {isDemoSession
                      ? 'Your local file preview is preserved. You can enter details manually below or apply a demo template to test saving.'
                      : 'Your local file preview is preserved. You can enter details manually below or retry extraction.'}
                  </div>
                </div>
              </div>
              {customFile && (
                <button
                  type="button"
                  onClick={() => handleProcessFile(customFile)}
                  disabled={isProcessing}
                  className="shrink-0 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? 'Retrying...' : 'Retry Extraction'}
                </button>
              )}
            </div>

            {/* Quick action buttons for graceful fallback */}
            <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
              {isDemoSession && (
                <button
                  type="button"
                  onClick={handleApplyDemoTemplate}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Fill with Demo Template (Synthetic)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditing(true);
                  if (!visitDate) setVisitDate(TODAY_ISO);
                  setProcessingError(null);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Continue with Manual Entry</span>
              </button>
            </div>
          </div>
        )}

        {/* Notice when synthetic demo template was applied */}
        {appliedTemplateNotice && (
          <div className="mt-3 p-3 bg-teal-50 border border-teal-200 text-teal-950 rounded-xl text-xs flex items-start justify-between gap-2 shadow-2xs">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-teal-900">Synthetic Demo Template Applied</div>
                <div className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">{appliedTemplateNotice}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAppliedTemplateNotice(null)}
              className="text-teal-700 hover:text-teal-900 text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Save Error Banner */}
        {saveError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-start justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Save failed</div>
                <div className="text-[11px] text-red-800 mt-0.5">{saveError}</div>
              </div>
            </div>
            {onOpenAuthModal && (saveError.toLowerCase().includes('sign in') || saveError.toLowerCase().includes('authenticated')) && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="shrink-0 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                Sign In Now
              </button>
            )}
          </div>
        )}

        {/* Guest Review Notice */}
        {!isAuthenticated && customFile && !saveError && (
          <div className="mt-3 p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="text-[11px]">
                You are reviewing this scan in guest mode. Sign in to save this document to your private medical records vault.
              </span>
            </div>
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="shrink-0 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] rounded-lg transition-colors shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        )}

        {/* Document Preview Container */}
        <div className="relative mt-3 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group">
          <div 
            className="w-full h-52 flex items-center justify-center p-2 bg-slate-50 transition-transform duration-300"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: contrastEnhanced ? 'contrast(135%) brightness(95%)' : 'none'
            }}
          >
            {customCapturedImage ? (
              customFile?.type === 'application/pdf' ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <FileText className="w-12 h-12 text-teal-700 mb-2" />
                  <span className="font-bold text-xs text-slate-800">{customFile.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{(customFile.size / 1024).toFixed(1)} KB PDF</span>
                </div>
              ) : (
                <img
                  src={customCapturedImage}
                  alt="Captured Medical Document"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <Upload className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-semibold text-slate-600">No document selected yet</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Open camera or upload photo/PDF to run OCR & field extraction</span>
              </div>
            )}
          </div>

          {customCapturedImage && customFile?.type !== 'application/pdf' && (
            <button
              onClick={() => setShowCropModal(true)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full text-xs font-semibold backdrop-blur-md shadow-md transition-all active:scale-95"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{t.cropAdjust}</span>
            </button>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-teal-600 animate-spin" />
              <span className="text-xs font-bold text-teal-900">Running Medical OCR & Field Extraction...</span>
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
              <span className="text-slate-500 font-medium">Document Title</span>
              {isEditing ? (
                <input
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="e.g. Prescription — Dr. Rao"
                  className="font-bold text-slate-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 outline-none w-52 text-right"
                />
              ) : (
                <span className="font-bold text-slate-800">{docTitle}</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">{t.patientNameLabel}</span>
              {isEditing ? (
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="Patient name on report"
                  className="font-bold text-slate-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 outline-none w-44 text-right placeholder:text-slate-400 placeholder:font-normal"
                />
              ) : (
                <span className="font-bold text-slate-800">{patientName || 'Not specified'}</span>
              )}
            </div>

            <div className="py-1.5 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">{t.visitDateLabel}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={visitDate}
                      onChange={e => {
                        setVisitDate(e.target.value);
                        if (e.target.value) {
                          setDateValidationError(null);
                          if (saveError?.toLowerCase().includes('date')) setSaveError(null);
                        }
                      }}
                      max={TODAY_ISO}
                      className={`font-bold text-slate-800 px-2 py-0.5 rounded border outline-none text-xs ${
                        dateValidationError ? 'border-red-400 bg-red-50 text-red-900 ring-1 ring-red-400' : 'bg-teal-50 border-teal-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setVisitDate(TODAY_ISO);
                        setDateValidationError(null);
                        if (saveError?.toLowerCase().includes('date')) setSaveError(null);
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 hover:bg-teal-200 text-teal-800 rounded transition-colors shadow-2xs"
                      title="Set to today's date"
                    >
                      Today
                    </button>
                  </div>
                ) : (
                  <span className="font-bold text-slate-800">{visitDate || 'Not specified'}</span>
                )}
              </div>
              {dateValidationError && (
                <div className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1 justify-end">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{dateValidationError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Doctor Name</span>
              {isEditing ? (
                <input
                  type="text"
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  placeholder="Attending clinician"
                  className="font-bold text-slate-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 outline-none w-44 text-right"
                />
              ) : (
                <span className="font-bold text-slate-800">{doctorName || 'Not specified'}</span>
              )}
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Facility / Hospital</span>
              {isEditing ? (
                <input
                  type="text"
                  value={facilityName}
                  onChange={e => setFacilityName(e.target.value)}
                  placeholder="Hospital or clinic name"
                  className="font-bold text-slate-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 outline-none w-44 text-right"
                />
              ) : (
                <span className="font-bold text-slate-800">{facilityName || 'Not specified'}</span>
              )}
            </div>
          </div>

          {/* Extracted Medicines Table */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {t.medicinesList} ({medicines.length})
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const newMed: ExtractedMedicine = {
                      id: `med_${Date.now()}`,
                      name: '',
                      dosage: '',
                      frequency: '',
                      duration: '',
                      timing: 'morning'
                    };
                    setMedicines([...medicines, newMed]);
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>

            {medicines.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No medications extracted from this document.</p>
            ) : (
              <div className="space-y-2">
                {medicines.map((med, index) => (
                  <div key={med.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-1.5 flex-1 pr-2">
                          <input
                            type="text"
                            value={med.name}
                            onChange={e => {
                              const updated = [...medicines];
                              updated[index].name = e.target.value;
                              setMedicines(updated);
                            }}
                            placeholder="Medicine name"
                            className="text-xs font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                          />
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={e => {
                              const updated = [...medicines];
                              updated[index].dosage = e.target.value;
                              setMedicines(updated);
                            }}
                            placeholder="Dosage"
                            className="text-xs text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{med.name}</div>
                          <div className="text-[11px] text-slate-500">{med.dosage} {med.frequency}</div>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setMedicines(medicines.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extracted Lab Values */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Extracted Lab Values ({labValues.length})
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    const newLab: ExtractedLabValue = {
                      id: `lab_${Date.now()}`,
                      testName: '',
                      value: '',
                      numericValue: 0,
                      unit: '',
                      referenceRange: '',
                      status: 'unknown'
                    };
                    setLabValues([...labValues, newLab]);
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>

            {labValues.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No numeric lab biomarkers extracted from this document.</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {labValues.map((lab, index) => (
                  <div key={lab.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-1 flex-1 pr-2">
                        <input
                          type="text"
                          value={lab.testName}
                          onChange={e => {
                            const updated = [...labValues];
                            updated[index].testName = e.target.value;
                            setLabValues(updated);
                          }}
                          placeholder="Test name"
                          className="text-xs font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                        />
                        <input
                          type="text"
                          value={lab.value}
                          onChange={e => {
                            const updated = [...labValues];
                            updated[index].value = e.target.value;
                            setLabValues(updated);
                          }}
                          placeholder="Value"
                          className="text-xs text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200"
                        />
                        <select
                          value={lab.status}
                          onChange={e => {
                            const updated = [...labValues];
                            updated[index].status = e.target.value as ExtractedLabValue['status'];
                            setLabValues(updated);
                          }}
                          className="text-xs bg-white px-1 py-0.5 rounded border border-slate-200"
                        >
                          <option value="normal">Normal</option>
                          <option value="low">Low</option>
                          <option value="high">High</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-800">{lab.testName}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">{lab.value}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            lab.status === 'low' ? 'bg-red-100 text-red-700' :
                            lab.status === 'high' ? 'bg-amber-100 text-amber-700' :
                            lab.status === 'unknown' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {lab.status.toUpperCase()}
                          </span>
                        </div>
                      </>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setLabValues(labValues.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
          disabled={isSaving || !customFile}
          className={`w-full py-3.5 px-4 font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all ${
            !customFile
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : isSaving
              ? 'bg-teal-800 text-white cursor-wait opacity-80'
              : 'bg-teal-700 hover:bg-teal-800 active:scale-[0.99] text-white shadow-teal-700/20'
          }`}
        >
          {isSaving ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Saving and encrypting document...</span>
            </>
          ) : (
            <span>{t.saveRecord}</span>
          )}
        </button>
      </div>

      {/* Crop & Adjust Interactive Modal */}
      {showCropModal && customCapturedImage && (
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
                  src={customCapturedImage}
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
          onCapture={(blob, _previewUrl) => {
            setShowLiveCamera(false);
            const file = new File([blob], `camera_scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleProcessFile(file);
          }}
          onCancel={() => setShowLiveCamera(false)}
          onSelectFile={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setShowLiveCamera(false);
              handleProcessFile(file);
            }
          }}
        />
      )}
    </div>
  );
};
