import React from 'react';
import { Home, FolderClosed, Clock, User } from 'lucide-react';
import { translations } from '../../data/translations';
import { Language } from '../../types';

interface BottomNavProps {
  activeTab: 'home' | 'library' | 'timeline' | 'profile';
  onChangeTab: (tab: 'home' | 'library' | 'timeline' | 'profile') => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  language
}) => {
  const t = translations[language];

  const navItems = [
    { id: 'home' as const, label: t.navHome, icon: Home },
    { id: 'library' as const, label: t.navLibrary, icon: FolderClosed },
    { id: 'timeline' as const, label: t.navTimeline, icon: Clock },
    { id: 'profile' as const, label: t.navProfile, icon: User },
  ];

  return (
    <nav 
      className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 sm:px-3 pt-1.5 shadow-sm"
      style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 sm:px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-teal-700 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-105 text-teal-800' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className={`text-[10px] sm:text-[11px] leading-tight ${isActive ? 'font-bold text-teal-900' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-teal-700 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
