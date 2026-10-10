import React from 'react';
import { 
  LayoutDashboard, Camera, FolderOpen, MessageSquare, 
  Pill, Calendar, TrendingUp, User, Stethoscope, ChevronRight
} from 'lucide-react';
import { translations } from '../../data/translations';
import { Language } from '../../types';

export interface AppSidebarProps {
  currentRole: 'patient' | 'doctor';
  activeView: string;
  onNavigate: (view: string) => void;
  language: Language;
  recordCount?: number;
  reminderCount?: number;
  upcomingCount?: number;
}

interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  count?: number;
  highlight?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentRole,
  activeView,
  onNavigate,
  language,
  recordCount = 0,
  reminderCount = 0,
  upcomingCount = 0
}) => {
  const t = translations[language];

  const patientNavItems: SidebarNavItem[] = [
    { id: 'home', label: t.navHome || 'Overview', icon: LayoutDashboard },
    { id: 'scan', label: t.scanReport || 'Scan report', icon: Camera, badge: 'AI' },
    { id: 'library', label: t.medicalLibrary || 'Medical library', icon: FolderOpen, count: recordCount },
    { id: 'chat', label: t.askAarogya || 'Ask Aarogya', icon: MessageSquare, highlight: true },
    { id: 'reminders', label: t.medicinesReminders || 'Medicines', icon: Pill, count: reminderCount },
    { id: 'appointments', label: t.appointments || 'Appointments', icon: Calendar, count: upcomingCount },
    { id: 'trends', label: t.navTimeline || 'Health trends', icon: TrendingUp },
    { id: 'profile', label: t.navProfile || 'Profile', icon: User },
  ];

  const doctorNavItems: SidebarNavItem[] = [
    { id: 'home', label: 'Clinical Workspace', icon: Stethoscope },
    { id: 'patients', label: 'My Patients', icon: User },
    { id: 'appointments', label: 'Schedule', icon: Calendar },
    { id: 'messages', label: 'Consultations', icon: MessageSquare },
  ];

  const navItems = currentRole === 'doctor' ? doctorNavItems : patientNavItems;

  return (
    <aside 
      className="w-64 bg-white/95 backdrop-blur-md border-r border-slate-100 flex flex-col justify-between p-4 flex-shrink-0 select-none"
      aria-label="Application Sidebar Navigation"
    >
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1.5" role="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-teal-50/90 text-teal-900 border border-teal-200/60 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-teal-700 bg-teal-100/60' 
                      : 'text-slate-400 group-hover:text-teal-700'
                  }`}>
                    <Icon className="w-4 h-4" strokeWidth={isActive ? 2.4 : 1.8} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-teal-600 text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-teal-200/70 text-teal-950' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.count}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-700" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Decorative reassurance card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-teal-50/70 border border-teal-100/70 text-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-[11px]">
            ✓
          </div>
          <span className="font-extrabold text-teal-950 text-[11px]">Private & Encrypted</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-snug">
          Your personal medical records stay strictly confidential and user-scoped.
        </p>
      </div>
    </aside>
  );
};
