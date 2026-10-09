import React, { useState } from 'react';
import { 
  UserProfile, Language, MedicalRecord, ActiveMedicationReminder, 
  Appointment, Doctor 
} from './types';
import { Header } from './components/common/Header';
import { PhoneFrame } from './components/common/PhoneFrame';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HealthDataProvider, useHealthData } from './context/HealthDataContext';
import { AuthModal } from './components/auth/AuthModal';
import { EmergencyCardModal } from './components/patient/EmergencyCardModal';
import { exportClinicalSummary } from './services/exportService';

import { OnboardingSteps } from './components/patient/OnboardingSteps';
import { PatientHome } from './components/patient/PatientHome';
import { ScanReviewStep } from './components/patient/ScanReviewStep';
import { ReportSummaryStep } from './components/patient/ReportSummaryStep';
import { AskAarogyaChat } from './components/patient/AskAarogyaChat';
import { MedicalLibrary } from './components/patient/MedicalLibrary';
import { MedicinesReminders } from './components/patient/MedicinesReminders';
import { AppointmentsList } from './components/patient/AppointmentsList';
import { FindDoctor } from './components/patient/FindDoctor';
import { ABDMConnectionModal } from './components/patient/ABDMConnectionModal';
import { HealthTrendsView } from './components/patient/HealthTrendsView';
import { PatientProfileView } from './components/patient/PatientProfileView';
import { DoctorPortal } from './components/doctor/DoctorPortal';

function AarogyaAppContent() {
  const { user, role, setRole, updateUserProfile } = useAuth();
  const { 
    records, reminders, appointments, 
    addRecord, deleteRecord, toggleReminderStatus, 
    addReminder, bookAppointment, 
    notificationToast, clearNotificationToast 
  } = useHealthData();

  const [language, setLanguage] = useState<Language>(user.preferredLanguage || 'en');

  // Patient Navigation State
  // onboarding | home | scan | summary | chat | library | reminders | appointments | doctors | trends | profile
  const [patientView, setPatientView] = useState<string>('home');
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | null>(null);

  // Selected Record for Summary Inspection
  const [activeRecordForSummary, setActiveRecordForSummary] = useState<MedicalRecord>(records[0]);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');

  // Modals state
  const [isAbhaModalOpen, setIsAbhaModalOpen] = useState(false);
  const [isEmergencyCardOpen, setIsEmergencyCardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Handle saving new scanned record
  const handleSaveScannedRecord = async (newRec: MedicalRecord) => {
    await addRecord(newRec);
  };

  // Switch language
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    updateUserProfile({ preferredLanguage: lang });
  };

  // Determine current active screen title for PhoneFrame top bar
  const getScreenTitle = () => {
    if (role === 'doctor') return 'Doctor Portal (Dr. S. Kumar)';
    if (onboardingStep === 1) return 'Step 01: Language Selection';
    if (onboardingStep === 2) return 'Step 02: Health Profile Setup';
    if (patientView === 'home') return 'Screen 03: Patient Home Dashboard';
    if (patientView === 'scan') return 'Screen 04: Scan & Review (OCR)';
    if (patientView === 'summary') return 'Screen 05: Report Summary & Trends';
    if (patientView === 'chat') return 'Ask Aarogya: AI Copilot & Voice';
    if (patientView === 'library') return 'Medical Library (Records)';
    if (patientView === 'reminders') return 'Medicines & Adherence Reminders';
    if (patientView === 'appointments') return 'Appointments & Visits';
    if (patientView === 'doctors') return 'Find Nearby Doctors';
    if (patientView === 'trends') return 'Health Summary & Lab Trends';
    if (patientView === 'profile') return 'Health Profile & Identity';
    return 'Aarogya Copilot';
  };

  // Quick navigation helpers for BottomNav
  const handleBottomNavChange = (tab: 'home' | 'library' | 'timeline' | 'profile') => {
    if (tab === 'home') setPatientView('home');
    else if (tab === 'library') setPatientView('library');
    else if (tab === 'timeline') setPatientView('trends');
    else if (tab === 'profile') setPatientView('profile');
    setOnboardingStep(null);
  };

  const getActiveBottomTab = (): 'home' | 'library' | 'timeline' | 'profile' => {
    if (patientView === 'library') return 'library';
    if (patientView === 'trends') return 'timeline';
    if (patientView === 'profile') return 'profile';
    return 'home';
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans">
      {/* Real-time Notification Toast */}
      <Toast message={notificationToast} onClose={clearNotificationToast} />

      {/* Top Universal App Header */}
      <Header
        currentRole={role}
        onRoleChange={r => setRole(r)}
        language={language}
        onLanguageChange={handleLanguageChange}
        user={user}
        reminders={reminders}
        appointments={appointments}
        onOpenProfile={() => {
          setRole('patient');
          setPatientView('profile');
          setOnboardingStep(null);
        }}
        onOpenEmergencyCard={() => setIsEmergencyCardOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onExportSummary={() => exportClinicalSummary(user, records, reminders)}
      />

      {/* Quick Demo Navigation Strip */}
      <div className="bg-emerald-900 text-teal-100 text-[11px] px-3 py-1 flex items-center justify-between overflow-x-auto shadow-inner border-b border-teal-800">
        <div className="flex items-center gap-1.5 font-semibold flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white">Quick Flow Jumper:</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { setRole('patient'); setOnboardingStep(1); }}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${onboardingStep === 1 ? 'bg-white text-teal-900' : 'hover:bg-emerald-800'}`}
          >
            01 Language
          </button>
          <button 
            onClick={() => { setRole('patient'); setOnboardingStep(2); }}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${onboardingStep === 2 ? 'bg-white text-teal-900' : 'hover:bg-emerald-800'}`}
          >
            02 Profile
          </button>
          <button 
            onClick={() => { setRole('patient'); setOnboardingStep(null); setPatientView('home'); }}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${patientView === 'home' && !onboardingStep && role === 'patient' ? 'bg-white text-teal-900' : 'hover:bg-emerald-800'}`}
          >
            03 Home
          </button>
          <button 
            onClick={() => { setRole('patient'); setOnboardingStep(null); setPatientView('scan'); }}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${patientView === 'scan' ? 'bg-white text-teal-900' : 'hover:bg-emerald-800'}`}
          >
            04 Scan & Review
          </button>
          <button 
            onClick={() => { 
              setRole('patient'); 
              setOnboardingStep(null); 
              if (records.length > 0) setActiveRecordForSummary(records[0]); 
              setPatientView('summary'); 
            }}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${patientView === 'summary' ? 'bg-white text-teal-900' : 'hover:bg-emerald-800'}`}
          >
            05 Understand
          </button>
          <button 
            onClick={() => { setRole('patient'); setOnboardingStep(null); setPatientView('chat'); }}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${patientView === 'chat' ? 'bg-white text-teal-900' : 'hover:bg-emerald-800'}`}
          >
            AI Chat
          </button>
          <button 
            onClick={() => { setRole('doctor'); setOnboardingStep(null); }}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${role === 'doctor' ? 'bg-amber-400 text-slate-900' : 'hover:bg-emerald-800 text-amber-200'}`}
          >
            Doctor Portal (12 Screens)
          </button>
        </div>
      </div>

      {/* Main View Container */}
      <main className="flex-1 flex flex-col items-center">
        <PhoneFrame activeScreenTitle={getScreenTitle()}>
          {role === 'doctor' ? (
            /* DOCTOR PORTAL WORKFLOW (All 12 Screens) */
            <DoctorPortal
              onSwitchToPatient={() => {
                setRole('patient');
                setPatientView('home');
              }}
              onPublishPrescriptionToPatient={(publishedRecord) => {
                handleSaveScannedRecord(publishedRecord);
              }}
            />
          ) : (
            /* PATIENT WORKFLOW */
            <div className="flex-1 flex flex-col justify-between min-h-full">
              {/* Step 01 or Step 02 Onboarding */}
              {onboardingStep !== null ? (
                <OnboardingSteps
                  step={onboardingStep}
                  language={language}
                  onLanguageSelect={handleLanguageChange}
                  user={user}
                  onSaveProfile={updateUserProfile}
                  onNext={() => {
                    if (onboardingStep === 1) setOnboardingStep(2);
                    else {
                      setOnboardingStep(null);
                      setPatientView('home');
                    }
                  }}
                  onBack={() => {
                    if (onboardingStep === 2) setOnboardingStep(1);
                    else setOnboardingStep(null);
                  }}
                />
              ) : patientView === 'home' ? (
                /* Step 03: Patient Home Dashboard */
                <PatientHome
                  user={user}
                  language={language}
                  records={records}
                  reminders={reminders}
                  appointments={appointments}
                  onNavigate={(v) => {
                    setChatInitialPrompt('');
                    setPatientView(v);
                  }}
                  onOpenAbhaModal={() => setIsAbhaModalOpen(true)}
                  onOpenProfile={() => setPatientView('profile')}
                />
              ) : patientView === 'scan' ? (
                /* Step 04: Scan & Review OCR Pipeline */
                <ScanReviewStep
                  language={language}
                  onSaveRecord={handleSaveScannedRecord}
                  onCancel={() => setPatientView('home')}
                  onViewSummary={(rec) => {
                    setActiveRecordForSummary(rec);
                    setPatientView('summary');
                  }}
                />
              ) : patientView === 'summary' ? (
                /* Step 05: Understand / Report Summary */
                <ReportSummaryStep
                  record={activeRecordForSummary || records[0]}
                  language={language}
                  onBack={() => setPatientView('home')}
                  onAskFollowUp={(question) => {
                    setChatInitialPrompt(question);
                    setPatientView('chat');
                  }}
                />
              ) : patientView === 'chat' ? (
                /* Ask Aarogya AI Copilot Chat & Voice */
                <AskAarogyaChat
                  language={language}
                  onLanguageChange={handleLanguageChange}
                  records={records}
                  initialPrompt={chatInitialPrompt}
                  onBack={() => setPatientView('home')}
                  onViewRecord={(recId) => {
                    const found = records.find(r => r.id === recId);
                    if (found) {
                      setActiveRecordForSummary(found);
                      setPatientView('summary');
                    }
                  }}
                />
              ) : patientView === 'library' ? (
                /* Medical Library */
                <MedicalLibrary
                  records={records}
                  language={language}
                  onBack={() => setPatientView('home')}
                  onOpenRecord={(rec) => {
                    setActiveRecordForSummary(rec);
                    setPatientView('summary');
                  }}
                  onScanNew={() => setPatientView('scan')}
                  onDeleteRecord={(id) => deleteRecord(id)}
                />
              ) : patientView === 'reminders' ? (
                /* Medicines & Reminders */
                <MedicinesReminders
                  reminders={reminders}
                  language={language}
                  onBack={() => setPatientView('home')}
                  onToggleStatus={toggleReminderStatus}
                  onAddReminder={addReminder}
                />
              ) : patientView === 'appointments' ? (
                /* Appointments */
                <AppointmentsList
                  appointments={appointments}
                  language={language}
                  onBack={() => setPatientView('home')}
                  onBookNew={bookAppointment}
                  onFindDoctor={() => setPatientView('doctors')}
                />
              ) : patientView === 'doctors' ? (
                /* Find a Doctor */
                <FindDoctor
                  language={language}
                  onBack={() => setPatientView('home')}
                  onBookDoctor={(doc: Doctor) => {
                    const newApt: Appointment = {
                      id: `apt_${Date.now()}`,
                      patientName: user.name,
                      patientId: user.id,
                      doctorName: doc.name,
                      doctorSpecialty: doc.specialty,
                      hospitalClinic: doc.clinicName,
                      date: 'Tomorrow, 10 Oct 2026',
                      time: '11:00 AM',
                      type: 'In-person',
                      status: 'upcoming'
                    };
                    bookAppointment(newApt);
                  }}
                />
              ) : patientView === 'trends' ? (
                /* Health Trends & Timeline */
                <HealthTrendsView
                  records={records}
                  language={language}
                  onBack={() => setPatientView('home')}
                  onOpenRecord={(rec) => {
                    setActiveRecordForSummary(rec);
                    setPatientView('summary');
                  }}
                />
              ) : patientView === 'profile' ? (
                /* Patient Profile & Settings */
                <PatientProfileView
                  user={user}
                  language={language}
                  onLanguageChange={handleLanguageChange}
                  onBack={() => setPatientView('home')}
                  onOpenAbhaModal={() => setIsAbhaModalOpen(true)}
                  onSaveProfile={updateUserProfile}
                  onOpenEmergencyCard={() => setIsEmergencyCardOpen(true)}
                  onExportSummary={() => exportClinicalSummary(user, records, reminders)}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              ) : null}

              {/* Bottom Navigation for Patient */}
              {onboardingStep === null && patientView !== 'scan' && patientView !== 'chat' && (
                <BottomNav
                  activeTab={getActiveBottomTab()}
                  onChangeTab={handleBottomNavChange}
                  language={language}
                />
              )}
            </div>
          )}
        </PhoneFrame>
      </main>

      {/* ABDM Consent & Connection Modal */}
      <ABDMConnectionModal
        user={user}
        isOpen={isAbhaModalOpen}
        onClose={() => setIsAbhaModalOpen(false)}
        onUpdateUser={updateUserProfile}
      />

      {/* Emergency Card Modal */}
      <EmergencyCardModal
        user={user}
        reminders={reminders}
        isOpen={isEmergencyCardOpen}
        onClose={() => setIsEmergencyCardOpen(false)}
      />

      {/* Auth Modal (Login / Sign Up / Demo) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <HealthDataProvider>
        <AarogyaAppContent />
      </HealthDataProvider>
    </AuthProvider>
  );
}

export default App;
