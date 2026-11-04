import React, { useState } from 'react';
import { Screen } from '../App';
import { useAuth } from '../context/AuthContext';
import { auth, companies, type AuthResponse } from '../lib/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import {
  Brain, Building2, CreditCard, FileSpreadsheet,
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Props { onNavigate: (screen: Screen) => void; }

export function LoginOnboarding({ onNavigate }: Props) {
  const { login, setCompany } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName]   = useState('');
  const [signupEmail, setSignupEmail]         = useState('');
  const [signupPassword, setSignupPassword]   = useState('');
  const [termsAccepted, setTermsAccepted]     = useState(false);

  // Onboarding company state
  const [companyName, setCompanyName]   = useState('');
  const [industry, setIndustry]         = useState('');
  const [currency, setCurrency]         = useState('USD');

  // UI state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isSignup, setIsSignup]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  const steps = [
    { title: 'Welcome', description: 'Get started with FinSight' },
    { title: 'Business Info', description: 'Tell us about your company' },
    { title: 'Connect Data', description: 'Link your financial systems' },
    { title: 'All Set!', description: 'Your dashboard is ready' },
  ];

  // ── LOGIN ────────────────────────────────
  const handleLogin = async () => {
    setError('');
    if (!loginEmail || !loginPassword) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res: AuthResponse = await auth.login({ email: loginEmail, password: loginPassword });
      await login(res);

      // Загружаем компании юзера
      const userCompanies = await companies.list();
      if (userCompanies.length > 0) {
        setCompany(userCompanies[0]);
      }

      onNavigate('dashboard');
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ─────────────────────────────
  const handleRegister = async () => {
    setError('');
    if (!signupFirstName || !signupLastName || !signupEmail || !signupPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (!termsAccepted) { setError('Please accept the Terms of Service'); return; }
    if (signupPassword.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const res: AuthResponse = await auth.register({
        email: signupEmail,
        password: signupPassword,
        first_name: signupFirstName,
        last_name: signupLastName,
      });
      await login(res);
      setOnboardingStep(1); // Переходим к онбордингу
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── CREATE COMPANY ────────────────────────
  const handleCreateCompany = async () => {
    setError('');
    if (!companyName) { setError('Company name is required'); return; }
    setLoading(true);
    try {
      const company = await companies.create({ name: companyName, industry, currency });
      setCompany(company);
      setOnboardingStep(3);
    } catch (e: any) {
      setError(e.message || 'Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  // ── ONBOARDING STEPS ─────────────────────
  if (onboardingStep > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-8">
        <Card className="max-w-2xl w-full p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Step {onboardingStep} of {steps.length - 1}
              </span>
              <span className="text-sm text-slate-500">{steps[onboardingStep].title}</span>
            </div>
            <Progress value={(onboardingStep / (steps.length - 1)) * 100} />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Step 1 — Business Info */}
          {onboardingStep === 1 && (
            <div className="py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Tell Us About Your Business</h2>
              <p className="text-slate-600 mb-8 text-center">This helps us customize your experience</p>
              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <Label htmlFor="company">Company Name *</Label>
                  <Input id="company" placeholder="e.g., TechCo Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" placeholder="e.g., Software & Technology" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm mt-1"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KZT">KZT (₸)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="RUB">RUB (₽)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Connect Data */}
          {onboardingStep === 2 && (
            <div className="py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileSpreadsheet size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Connect Your Financial Data</h2>
              <p className="text-slate-600 mb-8 text-center">You can set this up later in Settings</p>
              <div className="space-y-4 max-w-md mx-auto">
                {[
                  { id: 'bank', label: 'Bank Account Integration', desc: 'Sync transactions from your bank', icon: CreditCard },
                  { id: 'accounting', label: 'Accounting Software', desc: 'Connect 1C, QuickBooks, Xero', icon: FileSpreadsheet },
                ].map(({ id, label, desc, icon: Icon }) => (
                  <Card key={id} className="p-4 hover:border-blue-300 cursor-pointer transition-all">
                    <div className="flex items-start gap-4">
                      <Checkbox id={id} />
                      <div className="flex-1">
                        <label htmlFor={id} className="font-medium text-slate-900 cursor-pointer">{label}</label>
                        <p className="text-sm text-slate-600 mt-1">{desc}</p>
                      </div>
                      <Icon size={24} className="text-slate-400" />
                    </div>
                  </Card>
                ))}
                <p className="text-sm text-slate-500 text-center pt-2">You can skip this and configure later</p>
              </div>
            </div>
          )}

          {/* Step 3 — All Set */}
          {onboardingStep === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">You're All Set!</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Your FinSight dashboard is ready. Our AI will start generating insights as you add data.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-slate-900 mb-3">What happens next?</h3>
                <ul className="text-left space-y-2 text-sm text-slate-700">
                  {[
                    'Upload bank statements in Settings',
                    'Invite team members with role-based access',
                    'AI categorizes your transactions automatically',
                    'Get weekly financial health reports',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => { setError(''); setOnboardingStep(s => Math.max(1, s - 1)); }}
              disabled={onboardingStep <= 1}
            >
              <ArrowLeft size={16} className="mr-2" /> Back
            </Button>

            <Button
              disabled={loading}
              onClick={() => {
                if (onboardingStep === 1) { handleCreateCompany(); }
                else if (onboardingStep === steps.length - 1) { onNavigate('dashboard'); }
                else { setError(''); setOnboardingStep(s => s + 1); }
              }}
            >
              {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              {onboardingStep === steps.length - 1 ? 'Go to Dashboard' : 'Continue'}
              {!loading && <ArrowRight size={16} className="ml-2" />}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── LOGIN / SIGNUP FORM ───────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">FinSight</h1>
          </div>
          <Button variant="ghost" onClick={() => onNavigate('landing')}>Back to Home</Button>
        </div>
      </header>

      <div className="flex items-center justify-center p-8 min-h-[calc(100vh-72px)]">
        <Card className="max-w-md w-full p-8">
          <Tabs defaultValue={isSignup ? 'signup' : 'login'} onValueChange={v => { setIsSignup(v === 'signup'); setError(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                  <p className="text-slate-600">Log in to your financial dashboard</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="you@company.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                  </div>
                </div>
                <Button className="w-full" size="lg" disabled={loading} onClick={handleLogin}>
                  {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                  Log In
                </Button>
              </div>
            </TabsContent>

            {/* SIGNUP TAB */}
            <TabsContent value="signup">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Account</h2>
                  <p className="text-slate-600">Start your 14-day free trial</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Amir" value={signupFirstName} onChange={e => setSignupFirstName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Seitkali" value={signupLastName} onChange={e => setSignupLastName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="signupEmail">Email</Label>
                    <Input id="signupEmail" type="email" placeholder="you@company.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="signupPassword">Password</Label>
                    <Input id="signupPassword" type="password" placeholder="Min 8 characters" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={v => setTermsAccepted(!!v)} className="mt-0.5" />
                    <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                </div>
                <Button className="w-full" size="lg" disabled={loading} onClick={handleRegister}>
                  {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                  Create Account
                </Button>
                <p className="text-center text-sm text-slate-600">No credit card required • Cancel anytime</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
