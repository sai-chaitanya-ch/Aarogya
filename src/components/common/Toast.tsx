import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, durationMs = 5000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl backdrop-blur-md border border-slate-700 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <span className="font-semibold text-slate-100">{message}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
