import React, { useState } from 'react';
import { 
  Language, MedicalRecord, Appointment, Doctor 
} from './types';
import { Header } from './components/common/Header';
import { AppSidebar } from './components/common/AppSidebar';
import { ChatContextPanel } from './components/patient/ChatContextPanel';
import { BottomNav } from './components/common/BottomNav';
import { Toast } from './components/common/Toast';
import { AarogyaLogo } from './components/common/AarogyaLogo';
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
  const { 
    user, role, setRole, isDoctorAccount, isDoctorVerified, 
    updateUserProfile, isAuthenticated, isLoading, signOut 
  } = useAuth();
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
  const [doctorTab, setDoctorTab] = useState<'home' | 'patients' | 'appointments' | 'messages' | 'profile'>('home');
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | null>(null);

  // Selected Record for Summary Inspection
  const [activeRecordForSummary, setActiveRecordForSummary] = useState<MedicalRecord | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');

  // Modals state
  const [isAbhaModalOpen, setIsAbhaModalOpen] = useState(false);
  const [isEmergencyCardOpen, setIsEmergencyCardOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Handle saving new scanned record
  const handleSaveScannedRecord = async (newRec: MedicalRecord, fileBlob?: File | Blob) => {
    return await addRecord(newRec, fileBlob);
  };

  // Switch language
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    updateUserProfile({ preferredLanguage: lang });
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

  // 1. Loading state while verifying Supabase session
  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-[#f8faf9] flex flex-col items-center justify-center p-6 text-center">
        <AarogyaLogo size="lg" showSubtitle={true} />
        <div className="mt-6 flex items-center gap-2 text-teal-800 font-bold text-xs animate-pulse">
          <span>Verifying encrypted health session...</span>
        </div>
      </div>
    );
  }

  // 2. Strict Authentication Wall: If unauthenticated, render AuthModal exclusively
  if (!isAuthenticated) {
    return (
      <div className="h-[100dvh] bg-slate-900/30 backdrop-blur-sm flex flex-col items-center justify-center p-4">
        <AuthModal isOpen={true} canClose={false} />
      </div>
    );
  }

  // 3. Authenticated Application Experience
  return (
    <div className="h-[100dvh] bg-slate-100/90 text-slate-800 flex flex-col font-sans overflow-hidden">
      {/* Real-time Notification Toast */}
      <Toast message={notificationToast} onClose={clearNotificationToast} />

      {/* Top Universal App Header */}
      <Header
        currentRole={role}
        onRoleChange={r => setRole(r)}
        isDoctorAccount={isDoctorAccount}
        isDoctorVerified={isDoctorVerified}
        language={language}
        onLanguageChange={handleLanguageChange}
        user={user}
        reminders={reminders}
        appointments={appointments}
        isAuthenticated={isAuthenticated}
        onOpenProfile={() => {
          setRole('patient');
          setPatientView('profile');
          setOnboardingStep(null);
        }}
        onOpenEmergencyCard={() => setIsEmergencyCardOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onExportSummary={() => exportClinicalSummary(user, records, reminders)}
        onSignOut={signOut}
      />

      {/* Main Responsive Application Shell */}
      <main className="flex-1 min-h-0 min-w-0 flex w-full max-w-7xl mx-auto overflow-hidden md:p-3 lg:p-4">
        <div className="flex-1 min-h-0 min-w-0 flex w-full bg-white md:rounded-3xl md:border md:border-slate-200/80 md:shadow-xs overflow-hidden">
          {/* Desktop & Tablet Navigation Sidebar */}
          <div className="hidden lg:flex h-full flex-shrink-0">
            <AppSidebar
              currentRole={role}
              activeView={role === 'doctor' ? doctorTab : patientView}
              onNavigate={(v) => {
                if (role === 'doctor') {
                  setDoctorTab(v as any);
                } else {
                  setChatInitialPrompt('');
                  setPatientView(v);
                  setOnboardingStep(null);
                }
              }}
              language={language}
              recordCount={records.length}
              reminderCount={reminders.length}
              upcomingCount={appointments.length}
            />
          </div>

          {/* Central Main Application View */}
          <div className={`flex-1 min-w-0 min-h-0 flex flex-col h-full ${patientView === 'chat' && role === 'patient' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
            {role === 'doctor' ? (
              /* DOCTOR PORTAL WORKFLOW */
              <DoctorPortal
                activeTab={doctorTab}
                onTabChange={setDoctorTab}
                isVerified={isDoctorVerified}
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
              <div className={`flex-1 min-h-0 min-w-0 flex flex-col ${patientView === 'chat' ? 'h-full overflow-hidden' : 'justify-between min-h-full'}`}>
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
                /* Patient Home Dashboard */
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
                /* Scan & Review OCR Pipeline */
                <ScanReviewStep
                  language={language}
                  onSaveRecord={handleSaveScannedRecord}
                  onCancel={() => setPatientView('home')}
                  onViewSummary={(rec) => {
                    setActiveRecordForSummary(rec);
                    setPatientView('summary');
                  }}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              ) : patientView === 'summary' ? (
                /* Understand / Report Summary */
                (activeRecordForSummary || (records.length > 0 ? records[0] : null)) ? (
                  <ReportSummaryStep
                    record={activeRecordForSummary || records[0]}
                    language={language}
                    onBack={() => setPatientView('home')}
                    onAskFollowUp={(question) => {
                      setChatInitialPrompt(question);
                      setPatientView('chat');
                    }}
                  />
                ) : (
                  <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-slate-500 mb-3 font-medium">No record selected to summarize.</p>
                    <button 
                      onClick={() => setPatientView('library')} 
                      className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 transition-colors"
                    >
                      Open Medical Library
                    </button>
                  </div>
                )
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
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
                      patientName: user.name || 'Patient',
                      patientId: user.id,
                      doctorName: doc.name,
                      doctorSpecialty: doc.specialty,
                      hospitalClinic: doc.clinicName,
                      date: new Date().toLocaleDateString('en-GB'),
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
                /* Patient Profile & Settings with Working Sign Out */
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
                  onSignOut={signOut}
                />
              ) : null}

              {/* Bottom Navigation for Patient on Mobile */}
              {onboardingStep === null && patientView !== 'scan' && patientView !== 'chat' && (
                <div className="lg:hidden">
                  <BottomNav
                    activeTab={getActiveBottomTab()}
                    onChangeTab={handleBottomNavChange}
                    language={language}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Contextual Panel for Chat on XL screens */}
        {role === 'patient' && patientView === 'chat' && (
          <ChatContextPanel
            records={records}
            reminders={reminders}
            language={language}
            onNavigate={(v) => {
              setPatientView(v);
              setOnboardingStep(null);
            }}
            onOpenRecord={(rec) => {
              setActiveRecordForSummary(rec);
              setPatientView('summary');
            }}
          />
        )}
      </div>
    </main>

      {/* ABDM / ABHA Connection Modal */}
      <ABDMConnectionModal
        user={user}
        isOpen={isAbhaModalOpen}
        onClose={() => setIsAbhaModalOpen(false)}
        onUpdateUser={updateUserProfile}
      />

      {/* Emergency SOS Health Card Modal */}
      <EmergencyCardModal
        user={user}
        reminders={reminders}
        isOpen={isEmergencyCardOpen}
        onClose={() => setIsEmergencyCardOpen(false)}
      />

      {/* Manage Account & Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HealthDataProvider>
        <AarogyaAppContent />
      </HealthDataProvider>
    </AuthProvider>
  );
}
