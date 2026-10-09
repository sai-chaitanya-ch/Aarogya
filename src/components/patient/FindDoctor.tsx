import React, { useState } from 'react';
import { 
  ArrowLeft, Search, MapPin, Star, ShieldCheck, 
  Clock, Video, Phone, Calendar, ChevronRight 
} from 'lucide-react';
import { Doctor, Language, Appointment } from '../../types';
import { nearbyDoctors } from '../../data/mockData';

interface FindDoctorProps {
  language: Language;
  onBack: () => void;
  onBookDoctor: (doctor: Doctor) => void;
}

export const FindDoctor: React.FC<FindDoctorProps> = ({
  language,
  onBack,
  onBookDoctor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const specialties = ['All', 'General Medicine', 'Cardiology', 'Pediatrics', 'Gynecology'];

  const filteredDoctors = nearbyDoctors.filter(doc => {
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    const matchesQuery = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpec && matchesQuery;
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
                  onClick={() => onBookDoctor(doc)}
                  className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Visit</span>
                </button>
                <button
                  onClick={() => onBookDoctor(doc)}
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
    </div>
  );
};
