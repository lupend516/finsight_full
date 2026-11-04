import { useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Error Boundary — показывает реальную ошибку вместо белого экрана ──
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff1f0', minHeight: '100vh' }}>
          <h2 style={{ color: '#cf1322' }}>Runtime Error</h2>
          <pre style={{ color: '#cf1322', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{err.message}</pre>
          <pre style={{ color: '#666', fontSize: 12, marginTop: 16, whiteSpace: 'pre-wrap' }}>{err.stack}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '8px 16px' }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
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
import { SalesModule } from './components/SalesModule';
import { CompanyProfile } from './components/CompanyProfile';
import { EmployeesModule } from './components/EmployeesModule';
import { Notifications } from './components/Notifications';
import { Settings } from './components/Settings';

export type Screen =
  | 'landing' | 'login' | 'payment' | 'audit-setup'
  | 'dashboard' | 'audit' | 'sales' | 'fraud' | 'analytics'
  | 'reporting' | 'employees' | 'profile' | 'notifications' | 'settings';

const PROTECTED: Screen[] = [
  'dashboard','audit','sales','fraud','analytics',
  'reporting','employees','profile','notifications','settings',
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
      case 'sales':     return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><SalesModule /></DashboardLayout>;
      case 'fraud':     return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><FraudDetection /></DashboardLayout>;
      case 'analytics': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><BusinessIntelligence /></DashboardLayout>;
      case 'reporting': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><StrategyReporting /></DashboardLayout>;
      case 'employees': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><EmployeesModule /></DashboardLayout>;
      case 'profile':   return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><CompanyProfile /></DashboardLayout>;
      case 'notifications': return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><Notifications /></DashboardLayout>;
      case 'settings':  return <DashboardLayout currentScreen={currentScreen} onNavigate={navigate}><Settings /></DashboardLayout>;
      default:          return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen">
      <ErrorBoundary key={currentScreen}>
        {renderScreen()}
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
