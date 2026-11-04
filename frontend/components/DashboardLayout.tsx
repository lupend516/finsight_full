import React from 'react';
import { Screen } from '../App';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileCheck, Shield, TrendingUp,
  FileText, Bell, Settings, LogOut, User
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AIAssistant } from './AIAssistant';

interface Props {
  children: React.ReactNode;
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function DashboardLayout({ children, currentScreen, onNavigate }: Props) {
  const { user, company, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard',           icon: LayoutDashboard, screen: 'dashboard'  as Screen },
    { name: 'Audit & Bookkeeping', icon: FileCheck,        screen: 'audit'      as Screen },
    { name: 'Fraud Detection',     icon: Shield,           screen: 'fraud'      as Screen },
    { name: 'Business Intelligence',icon: TrendingUp,      screen: 'analytics'  as Screen },
    { name: 'Strategic Reporting', icon: FileText,         screen: 'reporting'  as Screen },
    { name: 'Company Profile',     icon: User,             screen: 'profile'    as Screen },
  ];

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const displayName = user ? `${user.first_name} ${user.last_name}` : 'User';
  const subtitle    = company ? `${company.name}` : 'No company';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">FinSight</h1>
          <p className="text-xs text-slate-500 mt-1">AI Financial Assistant</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen;
            return (
              <button
                key={item.name}
                onClick={() => onNavigate(item.screen)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-600">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {navigation.find(i => i.screen === currentScreen)?.name ||
                (currentScreen === 'notifications' ? 'Notifications' :
                 currentScreen === 'settings' ? 'Settings' : 'Dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => onNavigate('notifications')}>
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onNavigate('settings')}>
              <Settings size={20} />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>

      <AIAssistant />
    </div>
  );
}
