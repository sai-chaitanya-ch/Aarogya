import React, { useState } from 'react';
import { 
  ArrowLeft, Search, MapPin, Star, ShieldCheck, 
  Video, Calendar 
} from 'lucide-react';
import { Doctor, Language } from '../../types';
import { nearbyDoctors } from '../../data/mockData';

interface FindDoctorProps {
  language: Language;
  onBack: () => void;
  onBookDoctor: (doctor: Doctor, bookingDetails?: { date: string; time: string; type: 'In-person' | 'Teleconsultation' }) => void;
}

export const FindDoctor: React.FC<FindDoctorProps> = ({
  onBack,
  onBookDoctor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `Tomorrow, ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  });
  const [bookingTime, setBookingTime] = useState('11:00 AM');
  const [bookingType, setBookingType] = useState<'In-person' | 'Teleconsultation'>('In-person');

  const specialties = ['All', 'General Medicine', 'Cardiology', 'Pediatrics', 'Gynecology'];

  const filteredDoctors = nearbyDoctors.filter(doc => {
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    const matchesQuery = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesQuery;
  });

  const handleStartBooking = (doc: Doctor, type: 'In-person' | 'Teleconsultation') => {
    setBookingDoctor(doc);
    setBookingType(type);
  };

  const handleConfirmBooking = () => {
    if (!bookingDoctor) return;
    onBookDoctor(bookingDoctor, {
      date: bookingDate,
      time: bookingTime,
      type: bookingType
    });
    setBookingDoctor(null);
  };

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
            <h2 className="text-sm font-extrabold text-slate-900">Find a Doctor</h2>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/50">
            <MapPin className="w-3 h-3 text-teal-700" />
            <span>Vijayawada</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search doctors, clinics or specialties..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-teal-700 outline-none shadow-2xs"
          />
        </div>

        {/* Specialty Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedSpecialty === spec
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Doctors List */}
        <div className="space-y-3 mt-1">
          {filteredDoctors.map(doc => (
            <div
              key={doc.id}
              className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-teal-200 transition-all space-y-3"
            >
              <div className="flex items-start gap-3">
                <img
                  src={doc.avatarUrl}
                  alt={doc.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-xs text-slate-900">{doc.name}</h3>
                      <span title="Verified Practitioner">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{doc.rating}</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-bold text-teal-800">{doc.specialty}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{doc.qualifications} · {doc.experienceYears}+ yrs exp</p>
                  
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {doc.distanceKm} km away
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">₹{doc.consultationFee} fee</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                <button
                  onClick={() => handleStartBooking(doc, 'In-person')}
                  className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Visit</span>
                </button>
                <button
                  onClick={() => handleStartBooking(doc, 'Teleconsultation')}
                  className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1 transition-colors border border-teal-200/50"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Teleconsult</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Confirm Appointment</h3>
                <p className="text-[11px] text-teal-800 font-semibold">{bookingDoctor.name} ({bookingDoctor.specialty})</p>
              </div>
              <button onClick={() => setBookingDoctor(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingType('In-person')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      bookingType === 'In-person' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    In-person Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('Teleconsultation')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      bookingType === 'Teleconsultation' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Teleconsultation
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Appointment Date</label>
                <input
                  type="text"
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Preferred Time</label>
                <select
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl outline-none"
                >
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>

              <div className="p-2.5 bg-teal-50 rounded-xl text-[11px] text-teal-900 border border-teal-200">
                <strong>Clinic:</strong> {bookingDoctor.clinicName} (₹{bookingDoctor.consultationFee} fee)
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              className="w-full py-3 bg-teal-700 text-white font-bold rounded-2xl hover:bg-teal-800 transition-colors shadow-md shadow-teal-700/20"
            >
              Confirm & Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
