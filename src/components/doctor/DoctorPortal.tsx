import React, { useState } from 'react';
import { 
  Users, Calendar, FileText, MessageSquare, Plus, Search, 
  Video, Phone, ShieldCheck, MapPin, Clock, ArrowLeft, 
  Send, Upload, CheckCircle2, AlertCircle, Trash2, Edit3, 
  Camera, Landmark, User, Bell, ChevronRight, Stethoscope 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Doctor, PatientListItem, MedicalRecord, ExtractedMedicine } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DoctorPortalProps {
  onSwitchToPatient: () => void;
  onPublishPrescriptionToPatient?: (record: MedicalRecord) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  onSwitchToPatient,
  onPublishPrescriptionToPatient
}) => {
  const { user } = useAuth();
  const doctorDisplayName = user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Dr. Practitioner';
  const doctorInitials = user?.name 
    ? user.name.replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'
    : 'DR';

  // Navigation tabs for doctor: home | patients | appointments | messages | profile
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'appointments' | 'messages' | 'profile'>('home');
  
  // Sub-views
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [patientDetailTab, setPatientDetailTab] = useState<'overview' | 'timeline' | 'records' | 'prescriptions'>('overview');
  const [showCreatePrescription, setShowCreatePrescription] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [prescriptionTab, setPrescriptionTab] = useState<'write' | 'upload'>('write');

  // Patients state - initialized empty for real database/authenticated doctor
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientFilter, setPatientFilter] = useState<'all' | 'followup' | 'recent' | 'chronic'>('all');

  // Prescription builder state
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('1 tab OD');
  const [newMedDuration, setNewMedDuration] = useState('7 days');
  const [prescriptionMedicines, setPrescriptionMedicines] = useState<ExtractedMedicine[]>([]);
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxFollowUpDate, setRxFollowUpDate] = useState('');
  const [rxFollowUpTime, setRxFollowUpTime] = useState('');
  const [sendNotification, setSendNotification] = useState(true);

  // New patient modal state
  const [newPatName, setNewPatName] = useState('');
  const [newPatDob, setNewPatDob] = useState('');
  const [newPatGender, setNewPatGender] = useState<'male' | 'female' | 'other'>('male');
  const [newPatPhone, setNewPatPhone] = useState('');
  const [newPatAbha, setNewPatAbha] = useState('');

  // Messages state
  const [activeChatPatient, setActiveChatPatient] = useState<PatientListItem | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: 'doc' | 'patient'; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  const handleAddMedicineToRx = () => {
    if (!newMedName.trim()) return;
    const med: ExtractedMedicine = {
      id: String(Date.now()),
      name: newMedName.trim(),
      dosage: '500 mg',
      frequency: `${newMedDose} - ${newMedDuration}`,
      duration: newMedDuration,
      timing: 'morning'
    };
    setPrescriptionMedicines([...prescriptionMedicines, med]);
    setNewMedName('');
  };

  const handlePublishPrescription = () => {
    if (!selectedPatient) return;
    
    // Create new medical record to sync to patient
    const publishedRecord: MedicalRecord = {
      id: `rx_doc_${Date.now()}`,
      title: `Prescription by Dr. S. Kumar`,
      documentType: 'Prescription',
      patientName: selectedPatient.name,
      visitDate: 'Today, 09 Oct 2026',
      doctorName: 'Dr. S. Kumar',
      facilityName: 'City Care Clinic',
      specialty: 'General Medicine',
      status: 'verified',
      aiSummary: {
        en: `Prescription published by Dr. S. Kumar containing ${prescriptionMedicines.length} medications. Instructions: ${rxInstructions}`,
        te: `డాక్టర్ ఎస్. కుమార్ ${prescriptionMedicines.length} మందులతో ప్రిస్క్రిప్షన్ విడుదల చేశారు. సూచనలు: ${rxInstructions}`,
        hi: `डॉ. एस. कुमार द्वारा ${prescriptionMedicines.length} दवाओं के साथ पर्चा जारी किया गया। निर्देश: ${rxInstructions}`,
        ta: `டாக்டர் எஸ். குமார் ${prescriptionMedicines.length} மருந்துகளுடன் மருந்துச்சீட்டை வெளியிட்டுள்ளார்.`
      },
      medicines: prescriptionMedicines,
      labValues: [],
      followUpDate: rxFollowUpDate,
      createdAt: new Date().toISOString()
    };

    if (onPublishPrescriptionToPatient) {
      onPublishPrescriptionToPatient(publishedRecord);
    }

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0c7c61', '#149575', '#3b82f6']
      });
    } catch (e) {}

    alert(`Prescription published successfully and synchronized with ${selectedPatient.name}'s Aarogya app!`);
    setShowCreatePrescription(false);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatName.trim()) return;

    const newPat: PatientListItem = {
      id: `pat_${Date.now()}`,
      name: newPatName.trim(),
      age: 29,
      gender: newPatGender,
      phone: newPatPhone || '+91 98765 00000',
      abhaId: newPatAbha || undefined,
      lastVisit: 'Today',
      tag: 'New',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    };

    setPatients([newPat, ...patients]);
    setNewPatName('');
    setNewPatPhone('');
    setNewPatAbha('');
    setShowAddPatientModal(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { sender: 'doc', text: chatInput.trim(), time: 'Just now' }]);
    setChatInput('');
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#f8faf9] min-h-[780px] text-slate-800">
      {/* Doctor Header Banner */}
      <div className="p-3.5 bg-white border-b border-slate-100 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            SK
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
              <span>Dr. S. Kumar</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-[10px] text-teal-800 font-semibold">
              General Medicine · City Care Clinic
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToPatient}
            className="text-[11px] font-bold text-teal-800 hover:text-teal-900 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg transition-colors"
          >
            ← Patient View
          </button>
        </div>
      </div>

      {/* Screen Content based on activeTab */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* VIEW 1: DOCTOR DASHBOARD */}
        {activeTab === 'home' && !selectedPatient && !showCreatePrescription && (
          <div className="space-y-4">
            {/* Greeting */}
            <div className="p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50/40 to-teal-50 rounded-3xl border border-teal-100">
              <h2 className="text-lg font-black text-slate-900">
                Good morning, Dr. S. Kumar 👨‍⚕️
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                City Care Clinic · 12 consultations scheduled today
              </p>
            </div>

            {/* 4 Stats Cards matching mockup */}
            <div className="grid grid-cols-4 gap-2">
              <div 
                onClick={() => setActiveTab('patients')}
                className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center cursor-pointer hover:border-teal-300"
              >
                <span className="text-lg font-black text-slate-900 block">{patients.length}</span>
                <span className="text-[10px] font-bold text-slate-500">Patients</span>
              </div>
              <div 
                onClick={() => setActiveTab('appointments')}
                className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center cursor-pointer hover:border-teal-300"
              >
                <span className="text-lg font-black text-teal-800 block">12</span>
                <span className="text-[10px] font-bold text-slate-500">Today</span>
              </div>
              <div className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
                <span className="text-lg font-black text-amber-600 block">5</span>
                <span className="text-[10px] font-bold text-slate-500">Pending</span>
              </div>
              <div className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-2xs text-center">
                <span className="text-lg font-black text-blue-600 block">3</span>
                <span className="text-[10px] font-bold text-slate-500">Follow-ups</span>
              </div>
            </div>

            {/* Quick Actions Grid matching Mockup 4 */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveTab('patients')}
                className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-2.5 hover:border-teal-300 text-left transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">My Patients</div>
                  <div className="text-[10px] text-slate-500">View and manage</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('appointments')}
                className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-2.5 hover:border-teal-300 text-left transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Appointments</div>
                  <div className="text-[10px] text-slate-500">Today's schedule</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedPatient(patients[0]);
                  setShowCreatePrescription(true);
                }}
                className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-2.5 hover:border-teal-300 text-left transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Create Rx</div>
                  <div className="text-[10px] text-slate-500">Add prescription</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center gap-2.5 hover:border-teal-300 text-left transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">Messages</div>
                  <div className="text-[10px] text-slate-500">Patient queries</div>
                </div>
              </button>
            </div>

            {/* Today's Appointments Agenda */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Recent Appointments</span>
                <button onClick={() => setActiveTab('appointments')} className="text-teal-700 text-[11px]">View all</button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-600">09:00 AM</span>
                    <div>
                      <div className="font-bold text-slate-900">Ramesh K</div>
                      <div className="text-[10px] text-slate-500">In-person · Follow-up</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedPatient(patients[0]); setPatientDetailTab('overview'); }}
                    className="px-2.5 py-1 bg-teal-700 text-white rounded-lg font-bold text-[11px] hover:bg-teal-800"
                  >
                    Start
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-600">10:00 AM</span>
                    <div>
                      <div className="font-bold text-slate-900">Priya S</div>
                      <div className="text-[10px] text-slate-500">In-person · New Consultation</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedPatient(patients[1]); setPatientDetailTab('overview'); }}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-[11px] hover:bg-slate-100"
                  >
                    View
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] font-bold text-slate-600">11:30 AM</span>
                    <div>
                      <div className="font-bold text-slate-900">Arjun M</div>
                      <div className="text-[10px] text-slate-500">Online · Report Review</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedPatient(patients[2]); setPatientDetailTab('overview'); }}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PATIENT LIST */}
        {activeTab === 'patients' && !selectedPatient && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">My Patients</h2>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Patient</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                placeholder="Search by name, phone or ABHA ID..."
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-700"
              />
            </div>

            {/* Patient Cards List */}
            <div className="space-y-2">
              {patients.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        {p.tag && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            p.tag === 'Follow-up' ? 'bg-amber-100 text-amber-800' :
                            p.tag === 'New' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {p.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {p.gender === 'male' ? 'Male' : 'Female'} · {p.age} yrs · {p.phone}
                      </div>
                      <div className="text-[10px] font-mono text-teal-800 mt-0.5">
                        {p.abhaId ? `ABHA: ${p.abhaId}` : 'No ABHA linked'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: PATIENT PROFILE & TIMELINE */}
        {selectedPatient && !showCreatePrescription && (
          <div className="space-y-3.5">
            {/* Back button */}
            <button
              onClick={() => setSelectedPatient(null)}
              className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient List
            </button>

            {/* Patient Header Card matching Mockup 7 */}
            <div className="p-3.5 bg-white rounded-3xl border border-slate-100 shadow-xs flex items-center gap-3">
              <img
                src={selectedPatient.avatarUrl}
                alt={selectedPatient.name}
                className="w-12 h-12 rounded-full object-cover border"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedPatient.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
                    Active Patient
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {selectedPatient.gender === 'male' ? 'Male' : 'Female'} · {selectedPatient.age} yrs
                </div>
                <div className="text-[10px] font-mono text-teal-800 font-semibold">
                  {selectedPatient.abhaId || 'No ABHA linked'}
                </div>
              </div>
            </div>

            {/* Quick Actions Pills */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowCreatePrescription(true)}
                className="py-2 px-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 shadow-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Prescription
              </button>
              <button
                onClick={() => setPatientDetailTab('records')}
                className="py-2 px-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Upload Record
              </button>
              <button
                onClick={() => {
                  setActiveTab('messages');
                  setActiveChatPatient(selectedPatient);
                  setSelectedPatient(null);
                }}
                className="py-2 px-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Chat
              </button>
            </div>

            {/* Tabs: Overview | Timeline | Records | Prescriptions */}
            <div className="flex items-center justify-between bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPatientDetailTab('overview')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  patientDetailTab === 'overview' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setPatientDetailTab('timeline')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  patientDetailTab === 'timeline' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setPatientDetailTab('records')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  patientDetailTab === 'records' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Records
              </button>
            </div>

            {/* Patient Detail Sub-Content */}
            {patientDetailTab === 'overview' && (
              <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2 text-xs">
                <div className="font-bold text-slate-800">Basic Clinical Information</div>
                <div className="divide-y divide-slate-50">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Date of Birth</span>
                    <span className="font-medium text-slate-800">12 Mar 1997</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Blood Group</span>
                    <span className="font-bold text-rose-600">B+</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Known Allergies</span>
                    <span className="font-bold text-red-600">None known</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-slate-500">Existing Conditions</span>
                    <span className="font-bold text-slate-800">{selectedPatient.chronicCondition || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            {patientDetailTab === 'timeline' && (
              <div className="pl-4 border-l-2 border-teal-200 space-y-3.5 text-xs ml-2">
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-teal-700 border-2 border-white" />
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-teal-800">14 Sep 2024 · Follow-up Visit</span>
                    <h4 className="font-bold text-slate-900 mt-0.5">General Medicine Consultation</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Notes: Improved symptoms, continue medication.</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white" />
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-blue-700">02 Aug 2024 · Lab Report</span>
                    <h4 className="font-bold text-slate-900 mt-0.5">Complete Blood Count (CBC)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">City Care Lab · Hemoglobin: 10.8 g/dL</p>
                  </div>
                </div>
              </div>
            )}

            {patientDetailTab === 'records' && (
              <div className="space-y-2">
                <div className="p-4 border-2 border-dashed border-teal-300 rounded-2xl bg-teal-50/40 text-center">
                  <Upload className="w-6 h-6 text-teal-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-teal-900 block">Upload Document or Prescriptions</span>
                  <span className="text-[10px] text-slate-500">PDF, JPG, PNG (Max 10MB)</span>
                </div>
                {initialMedicalRecords.slice(0, 2).map(r => (
                  <div key={r.id} className="p-2.5 bg-white rounded-xl border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{r.title}</div>
                      <div className="text-[10px] text-slate-400">{r.visitDate} · {r.facilityName}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {r.documentType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CREATE PRESCRIPTION BUILDER (Matching Mockup 9) */}
        {showCreatePrescription && (
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreatePrescription(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Create Prescription</h3>
                  <p className="text-[10px] text-slate-500">{selectedPatient?.name} · {selectedPatient?.age} yrs</p>
                </div>
              </div>
            </div>

            {/* Write vs Upload Tabs */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPrescriptionTab('write')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  prescriptionTab === 'write' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Write Prescription
              </button>
              <button
                onClick={() => setPrescriptionTab('upload')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  prescriptionTab === 'upload' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Upload Handwritten
              </button>
            </div>

            {/* Add Medicines Form */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-3">
              <label className="font-bold text-slate-800 block">Add Medicines</label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  placeholder="Search medicine (e.g. Paracetamol 650mg)"
                  className="flex-1 px-3 py-2 border rounded-xl outline-none focus:border-teal-700 text-xs"
                />
                <button
                  onClick={handleAddMedicineToRx}
                  className="px-3 py-2 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Medicines List */}
              <div className="space-y-2 pt-1">
                {prescriptionMedicines.map((med, index) => (
                  <div key={med.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{index + 1}. {med.name}</div>
                      <div className="text-[11px] text-slate-500">{med.frequency}</div>
                    </div>
                    <button
                      onClick={() => setPrescriptionMedicines(prescriptionMedicines.filter(m => m.id !== med.id))}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Instructions */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2">
              <label className="font-bold text-slate-800 block">Clinical Instructions</label>
              <textarea
                value={rxInstructions}
                onChange={e => setRxInstructions(e.target.value)}
                rows={2}
                className="w-full p-2.5 border rounded-xl outline-none focus:border-teal-700 text-xs"
              />
            </div>

            {/* Follow-up Appointment Picker */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-2">
              <label className="font-bold text-slate-800 block">Set Follow-up Appointment</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={rxFollowUpDate}
                  onChange={e => setRxFollowUpDate(e.target.value)}
                  className="p-2 border rounded-xl outline-none text-xs"
                />
                <input
                  type="text"
                  value={rxFollowUpTime}
                  onChange={e => setRxFollowUpTime(e.target.value)}
                  className="p-2 border rounded-xl outline-none text-xs"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendNotification}
                  onChange={e => setSendNotification(e.target.checked)}
                  className="rounded text-teal-700"
                />
                <span className="text-[11px] text-slate-600 font-semibold">Send to patient (App notification)</span>
              </label>
            </div>

            {/* Actions: Save Draft vs Publish */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowCreatePrescription(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={handlePublishPrescription}
                className="flex-1 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-2xl transition-colors shadow-md shadow-teal-700/20"
              >
                Publish Prescription
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: MESSAGES / PATIENT CHAT */}
        {activeTab === 'messages' && (
          <div className="flex flex-col h-[520px] bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {/* Chat header */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeChatPatient?.avatarUrl || patients[0].avatarUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover border"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900">{activeChatPatient?.name || 'Ramesh Kumar'}</div>
                  <div className="text-[10px] text-slate-400">Patient · Online</div>
                </div>
              </div>
              <button className="p-1 text-slate-500 hover:text-teal-700">
                <Phone className="w-4 h-4" />
              </button>
            </div>

            {/* Chat list */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.sender === 'doc' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-2.5 rounded-xl max-w-[85%] ${
                    m.sender === 'doc' ? 'bg-teal-700 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendChat} className="p-2 border-t border-slate-100 flex items-center gap-1.5">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type clinical advice or response..."
                className="flex-1 px-3 py-2 text-xs border rounded-xl outline-none focus:border-teal-700"
              />
              <button
                type="submit"
                className="p-2 bg-teal-700 text-white rounded-xl hover:bg-teal-800"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 6: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900">Appointments Schedule</h2>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Ramesh Kumar (28 Y)</div>
                  <div className="text-[11px] text-slate-500">09:00 AM · In-person Consultation</div>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                  Next in Queue
                </span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Priya Sharma (35 Y)</div>
                  <div className="text-[11px] text-slate-500">10:00 AM · New Consultation</div>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                  Confirmed
                </span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Arjun Mehta (42 Y)</div>
                  <div className="text-[11px] text-slate-500">11:30 AM · Online Teleconsult</div>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
                  Teleconsult
                </span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 7: DOCTOR PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-teal-800 text-white font-bold text-xl flex items-center justify-center">
                SK
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Dr. S. Kumar</h3>
                <p className="text-teal-800 font-semibold">MBBS, MD (General Medicine)</p>
                <p className="text-slate-400 text-[10px]">Reg: APMC12345 · 14 yrs experience</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-slate-600">
              <div><strong>Clinic:</strong> City Care Clinic, MG Road, Vijayawada</div>
              <div><strong>Consultation Hours:</strong> Mon - Sat: 9:00 AM - 6:00 PM</div>
              <div><strong>Consultation Fee:</strong> ₹400 (In-person) / ₹500 (Online)</div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Bottom Navigation matching Mockup 4 */}
      <nav className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-2 py-1.5 flex items-center justify-around z-20 shadow-xs">
        {[
          { id: 'home' as const, label: 'Home', icon: Stethoscope },
          { id: 'patients' as const, label: 'Patients', icon: Users },
          { id: 'appointments' as const, label: 'Appointments', icon: Calendar },
          { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
          { id: 'profile' as const, label: 'Profile', icon: User },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !selectedPatient && !showCreatePrescription;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedPatient(null);
                setShowCreatePrescription(false);
              }}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-teal-800 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Add Patient Modal matching Mockup 6 */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Add New Patient</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter patient name"
                  value={newPatName}
                  onChange={e => setNewPatName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={newPatDob}
                    onChange={e => setNewPatDob(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newPatGender}
                    onChange={(e: any) => setNewPatGender(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl outline-none bg-white focus:border-teal-700"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newPatPhone}
                  onChange={e => setNewPatPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Connect ABHA (Optional)</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl mb-2 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setNewPatAbha('91-1234-5678-9012')}
                    className="py-1 rounded-lg bg-white text-teal-800 shadow-xs"
                  >
                    ABHA No.
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPatAbha('5432 8765 9012')}
                    className="py-1 rounded-lg text-slate-600 hover:text-slate-900"
                  >
                    Aadhaar
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPatAbha(newPatPhone || '98765 43210')}
                    className="py-1 rounded-lg text-slate-600 hover:text-slate-900"
                  >
                    Phone No.
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter ABHA, Aadhaar, or Phone number"
                  value={newPatAbha}
                  onChange={e => setNewPatAbha(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700 font-mono text-xs"
                />
                <div className="mt-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/60 text-[10px] text-teal-900 flex items-start gap-2">
                  <Landmark className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Link ABHA via ABDM</span>
                    <span className="text-slate-500">If patient doesn't have an ABHA ID, you can guide them to create one.</span>
                    <a
                      href="https://abha.abdm.gov.in/abha/v3/register"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block font-bold text-teal-700 hover:underline"
                    >
                      Open ABHA Registration ↗
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors mt-2"
              >
                Save Patient Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
