import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { LoginOnboarding } from './components/LoginOnboarding';
import { InitialAudit } from './components/InitialAudit';
import { Payment } from './components/Payment';
import { DashboardLayout } from './components/DashboardLayout';
import { MainDashboard } from './components/MainDashboard';
import { AuditBookkeeping } from './components/AuditBookkeeping';
import { FraudDetection } from './components/FraudDetection';
import { BusinessIntelligence } from './components/BusinessIntelligence';
import { StrategyReporting } from './components/StrategyReporting';
import { CompanyProfile } from './components/CompanyProfile';
import { Notifications } from './components/Notifications';
import { Settings } from './components/Settings';

export type Screen =
  | 'landing' | 'login' | 'payment' | 'audit-setup'
  | 'dashboard' | 'audit' | 'fraud' | 'analytics'
  | 'reporting' | 'profile' | 'notifications' | 'settings';

const PROTECTED: Screen[] = [
  'dashboard','audit','fraud','analytics',
  'reporting','profile','notifications','settings',
];

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');

  const navigate = (screen: Screen) => {
    if (PROTECTED.includes(screen) && !isAuthenticated) {
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(screen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':   return <LandingPage onNavigate={navigate} />;
      case 'login':     return <LoginOnboarding onNavigate={navigate} />;
      case 'payment':   return <Payment onNavigate={navigate} />;
      case 'audit-setup': return <InitialAudit onNavigate={navigate} />;
      case 'dashboard': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><MainDashboard /></DashboardLayout>;
      case 'audit':     return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><AuditBookkeeping /></DashboardLayout>;
      case 'fraud':     return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><FraudDetection /></DashboardLayout>;
      case 'analytics': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><BusinessIntelligence /></DashboardLayout>;
      case 'reporting': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><StrategyReporting /></DashboardLayout>;
      case 'profile':   return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><CompanyProfile /></DashboardLayout>;
      case 'notifications': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><Notifications /></DashboardLayout>;
      case 'settings':  return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><Settings /></DashboardLayout>;
      default:          return <LandingPage onNavigate={navigate} />;
    }
  };

  return <div className="min-h-screen">{renderScreen()}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
