import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, Clock, Video, MapPin, 
  Plus, CheckCircle2, XCircle, AlertCircle, ChevronRight 
} from 'lucide-react';
import { Appointment, Doctor, Language } from '../../types';
import { nearbyDoctors } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

interface AppointmentsListProps {
  appointments: Appointment[];
  language: Language;
  onBack: () => void;
  onBookNew: (newApt: Appointment) => void;
  onFindDoctor: () => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
  language,
  onBack,
  onBookNew,
  onFindDoctor
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showBookModal, setShowBookModal] = useState(false);

  // New appointment form state
  const [selectedDoctorId, setSelectedDoctorId] = useState(nearbyDoctors[0].id);
  const [aptDate, setAptDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [aptTime, setAptTime] = useState('11:00 AM');
  const [aptType, setAptType] = useState<'In-person' | 'Teleconsultation'>('In-person');
  const [aptNotes, setAptNotes] = useState('General health checkup');

  const upcomingList = appointments.filter(a => a.status === 'upcoming');
  const pastList = appointments.filter(a => a.status !== 'upcoming');

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = nearbyDoctors.find(d => d.id === selectedDoctorId) || nearbyDoctors[0];

    const newApt: Appointment = {
      id: `apt_${Date.now()}`,
      patientName: user.name || 'Patient',
      patientId: user.id,
      doctorName: doc.name,
      doctorSpecialty: doc.specialty,
      hospitalClinic: doc.clinicName,
      date: aptDate,
      time: aptTime,
      type: aptType,
      status: 'upcoming',
      notes: aptNotes
    };

    onBookNew(newApt);
    setShowBookModal(false);
  };

  return (
    <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 bg-[#f8faf9] flex flex-col justify-between max-w-4xl w-full mx-auto">
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
            <h2 className="text-sm font-extrabold text-slate-900">Appointments</h2>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg hover:bg-teal-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex items-center justify-between bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'upcoming' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Upcoming ({upcomingList.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'past' ? 'bg-white text-teal-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Past Visits ({pastList.length})
          </button>
        </div>

        {/* List */}
        <div className="mt-3 space-y-2.5">
          {activeTab === 'upcoming' ? (
            upcomingList.map(apt => (
              <div key={apt.id} className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{apt.doctorName}</h3>
                    <p className="text-[11px] text-teal-800 font-semibold">{apt.doctorSpecialty}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{apt.hospitalClinic}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    apt.type === 'Teleconsultation' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {apt.type === 'Teleconsultation' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    <span>{apt.type}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.date} · {apt.time}</span>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs transition-colors">
                    {apt.type === 'Teleconsultation' ? 'Join Call' : 'View Clinic'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            pastList.map(apt => (
              <div key={apt.id} className="p-3.5 bg-white rounded-2xl border border-slate-100 opacity-80 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">{apt.doctorName}</h3>
                    <p className="text-[11px] text-slate-500">{apt.doctorSpecialty} · {apt.date}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Completed
                  </span>
                </div>
              </div>
            ))
          )}

          {activeTab === 'upcoming' && upcomingList.length === 0 && (
            <div className="py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center">
              <Calendar className="w-8 h-8 text-teal-700/60 mb-2" />
              <h3 className="font-bold text-sm text-slate-800">You have no upcoming appointments.</h3>
              <p className="text-xs text-slate-500 mt-0.5">Find a doctor nearby or schedule a follow-up visit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Find Doctor banner at bottom */}
      <div className="pt-4">
        <button
          onClick={onFindDoctor}
          className="w-full py-3 px-4 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <span>Find & Consult Nearby Doctors →</span>
        </button>
      </div>

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Schedule Appointment</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none bg-white focus:border-teal-700"
                >
                  {nearbyDoctors.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialty} - ₹{doc.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={aptDate}
                    onChange={e => setAptDate(e.target.value)}
                    placeholder="e.g. 28 Sep 2024"
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={aptTime}
                    onChange={e => setAptTime(e.target.value)}
                    placeholder="e.g. 11:00 AM"
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAptType('In-person')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      aptType === 'In-person' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    In-person Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAptType('Teleconsultation')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      aptType === 'Teleconsultation' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Online Video
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Symptoms</label>
                <input
                  type="text"
                  value={aptNotes}
                  onChange={e => setAptNotes(e.target.value)}
                  placeholder="e.g. Blood pressure review"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-teal-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors mt-2"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
