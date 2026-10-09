import React, { useState } from 'react';
import { 
  X, Landmark, CheckCircle2, 
  ExternalLink, QrCode, ArrowRight, Phone, Fingerprint, Hash 
} from 'lucide-react';
import { UserProfile } from '../../types';

interface ABDMConnectionModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export type ConnectionMethod = 'abha' | 'aadhaar' | 'phone';

export const ABDMConnectionModal: React.FC<ABDMConnectionModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser
}) => {
  const [step, setStep] = useState<'consent' | 'input' | 'otp' | 'connected'>(
    user.abhaLinked ? 'connected' : 'consent'
  );
  const [consentGiven, setConsentGiven] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>('abha');

  // Input states for the three options
  const [abhaNumber, setAbhaNumber] = useState('91-1234-5678-9012');
  const [aadhaarNumber, setAadhaarNumber] = useState('5432 8765 9012');
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '98765 43210');

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const generatedAbha = abhaNumber || '91-1234-5678-9012';
      onUpdateUser({
        abhaLinked: true,
        abhaId: generatedAbha,
        abhaAddress: `${user.name.toLowerCase().replace(/\s+/g, '')}@abdm`
      });
      setStep('connected');
    }, 1000);
  };

  const handleDisconnect = () => {
    onUpdateUser({
      abhaLinked: false,
      abhaId: undefined,
      abhaAddress: undefined
    });
    setStep('consent');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">ABDM / ABHA Connect</h3>
              <p className="text-[10px] text-slate-500">Government of India Digital Health</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Informed Consent Screen */}
        {step === 'consent' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200/60 text-slate-700 leading-relaxed text-[11px]">
              <span className="font-bold text-teal-900 block mb-1">About Ayushman Bharat Digital Mission (ABDM)</span>
              An initiative by the Government of India to create a seamless, integrated digital healthcare ecosystem across the country. Connecting allows verified diagnostic labs and hospitals to securely share authorized records.
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                What data will be accessed:
              </div>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span>Authorized prescriptions & diagnostic reports</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span>Verified Ayushman Bharat Health Account (ABHA) address</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span>Connect seamlessly using ABHA, Aadhaar, or Phone</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0 mt-0.5" />
                  <span>You retain 100% control to revoke access anytime</span>
                </li>
              </ul>
            </div>

            {/* Informed Consent Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={e => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded text-teal-700 focus:ring-teal-700"
              />
              <span className="text-[11px] text-slate-600 leading-tight">
                I have read and understood the consent information and authorize the specific data access described above. I understand that I can choose not to connect.
              </span>
            </label>

            <button
              onClick={() => setStep('input')}
              disabled={!consentGiven}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>Continue to Connection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Link to Official ABHA Registration */}
            <div className="text-center pt-1">
              <a
                href="https://abha.abdm.gov.in/abha/v3/register"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-700 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>Don't have an ABHA? Register on official portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Step 2: Choose from ABHA, Aadhaar, or Phone Number */}
        {step === 'input' && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="font-bold text-slate-800 block text-xs mb-1.5">
                Choose How to Connect Your ABHA
              </span>
              <p className="text-[11px] text-slate-500 mb-2.5">
                You can authenticate using your ABHA Number, Aadhaar, or Mobile Number.
              </p>

              {/* 3-way Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setConnectionMethod('abha')}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    connectionMethod === 'abha'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-[10px] leading-tight">ABHA No.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectionMethod('aadhaar')}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    connectionMethod === 'aadhaar'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span className="text-[10px] leading-tight">Aadhaar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConnectionMethod('phone')}
                  className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    connectionMethod === 'phone'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[10px] leading-tight">Mobile</span>
                </button>
              </div>
            </div>

            {/* Input Form based on selected method */}
            {connectionMethod === 'abha' && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Enter 14-digit ABHA Number
                </label>
                <input
                  type="text"
                  value={abhaNumber}
                  onChange={e => setAbhaNumber(e.target.value)}
                  placeholder="e.g. 91-1234-5678-9012"
                  className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-teal-700 font-mono text-center tracking-wider text-sm bg-slate-50/50"
                />
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  An OTP will be sent to the mobile linked to your ABHA.
                </span>
              </div>
            )}

            {connectionMethod === 'aadhaar' && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Enter 12-digit Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={e => setAadhaarNumber(e.target.value)}
                  placeholder="XXXX - XXXX - 9012"
                  className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-teal-700 font-mono text-center tracking-wider text-sm bg-slate-50/50"
                />
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-[10px] text-amber-900 text-center leading-snug">
                  UIDAI will send a 6-digit OTP to your Aadhaar-registered mobile number.
                </div>
              </div>
            )}

            {connectionMethod === 'phone' && (
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Enter 10-digit Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-500 font-bold text-xs">+91</span>
                  <input
                    type="tel"
                    value={phoneNumber.replace('+91', '').trim()}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    className="w-full pl-12 pr-3 py-2.5 border rounded-xl outline-none focus:border-teal-700 font-mono tracking-wider text-sm bg-slate-50/50"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block text-center">
                  An OTP will be sent to fetch ABHA accounts linked with this mobile.
                </span>
              </div>
            )}

            <button
              onClick={() => setStep('otp')}
              className="w-full py-3 bg-teal-700 text-white font-bold rounded-2xl hover:bg-teal-800 transition-colors shadow-xs"
            >
              Send Verification OTP
            </button>

            <button
              onClick={() => setStep('consent')}
              className="w-full py-1 text-slate-500 font-bold hover:text-slate-800 text-center text-xs"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Enter OTP */}
        {step === 'otp' && (
          <div className="space-y-3.5 text-xs">
            <div className="text-center">
              <span className="text-xs font-bold text-slate-800 block">Enter 6-digit OTP</span>
              <span className="text-[11px] text-slate-500">
                {connectionMethod === 'aadhaar'
                  ? 'Sent to Aadhaar-registered mobile (UIDAI Gateway)'
                  : connectionMethod === 'phone'
                  ? `Sent to mobile number (+91 ${phoneNumber.replace('+91', '').trim()})`
                  : 'Sent to mobile linked with ABHA (+91 ******3210)'}
              </span>
            </div>

            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="1 2 3 4 5 6"
              className="w-full px-3 py-2.5 border rounded-xl outline-none focus:border-teal-700 font-mono text-center tracking-widest text-lg font-bold"
            />

            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying}
              className="w-full py-3 bg-teal-700 text-white font-bold rounded-2xl hover:bg-teal-800 transition-colors shadow-xs"
            >
              {isVerifying ? 'Verifying with ABDM Gateway...' : 'Verify & Link ABHA'}
            </button>

            <button
              onClick={() => setStep('input')}
              className="w-full py-1 text-slate-500 font-bold hover:text-slate-800 text-center text-xs"
            >
              ← Change Method
            </button>
          </div>
        )}

        {/* Step 4: Connected Digital Health Card */}
        {step === 'connected' && (
          <div className="space-y-4 text-xs">
            {/* ABHA Card Graphic */}
            <div className="p-4 bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden border border-teal-700">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-200">
                    National Health Authority (NHA)
                  </span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                  ABDM Verified
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold">{user.name}</h4>
                  <div className="font-mono text-xs text-teal-200 mt-0.5 tracking-wider font-semibold">
                    {user.abhaId || abhaNumber}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1">
                    ABHA Address: <span className="text-white font-mono">{user.abhaAddress || `${user.name.toLowerCase()}@abdm`}</span>
                  </div>
                  <div className="text-[9px] text-emerald-300 mt-1 font-semibold flex items-center gap-1">
                    <span>Linked via:</span>
                    <span className="capitalize font-bold underline">
                      {connectionMethod === 'aadhaar' ? 'Aadhaar Card' : connectionMethod === 'phone' ? 'Mobile Number' : '14-digit ABHA'}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl shadow-md">
                  <QrCode className="w-10 h-10 text-slate-900" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-emerald-900 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Your Aarogya records are ready for FHIR-compliant sync across ABDM providers.</span>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-bold rounded-xl transition-colors text-xs"
            >
              Disconnect / Revoke Access
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
