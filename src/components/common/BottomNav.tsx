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
    <nav className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-1.5 flex items-center justify-around z-20 shadow-sm">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-teal-700 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-110 text-teal-800' : ''}`}>
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span className={`text-[11px] leading-tight ${isActive ? 'font-bold text-teal-900' : ''}`}>
              {item.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-teal-700 mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
