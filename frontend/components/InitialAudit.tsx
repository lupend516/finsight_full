import React, { useState } from 'react';
import { Screen } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import {  Brain, Building2, Globe, Users, DollarSign, FileSpreadsheet, CreditCard, Target, CheckCircle2, ArrowRight, ArrowLeft
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';

interface InitialAuditProps {
  onNavigate: (screen: Screen) => void;
}

export function InitialAudit({ onNavigate }: InitialAuditProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    country: '',
    currency: '',
    employees: '',
    revenue: '',
    accountingSystem: '',
    taxSystem: '',
    financialGoals: [] as string[]
  });

  const financialGoalOptions = [
    'Revenue growth',
    'Cost optimization',
    'Fundraising preparation',
    'Improve cash flow',
    'Tax optimization',
    'Operational efficiency'
  ];

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.includes(goal)
        ? prev.financialGoals.filter(g => g !== goal)
        : [...prev.financialGoals, goal]
    }));
  };

  const handleComplete = () => {
    onNavigate('dashboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Company Information
              </h2>
              <p className="text-slate-600">
                Tell us about your business to personalize your experience
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="TechCo Ltd"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology & Software</SelectItem>
                    <SelectItem value="retail">Retail & E-commerce</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="services">Professional Services</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kz">Kazakhstan</SelectItem>
                      <SelectItem value="ru">Russia</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency *</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kzt">KZT (₸)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="rub">RUB (₽)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Business Scale
              </h2>
              <p className="text-slate-600">
                Help us understand your business size
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <Label htmlFor="employees">Number of Employees *</Label>
                <Select value={formData.employees} onValueChange={(value) => setFormData({ ...formData, employees: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="revenue">Annual Revenue Range *</Label>
                <Select value={formData.revenue} onValueChange={(value) => setFormData({ ...formData, revenue: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-100k">Less than 100K</SelectItem>
                    <SelectItem value="100k-500k">100K - 500K</SelectItem>
                    <SelectItem value="500k-1m">500K - 1M</SelectItem>
                    <SelectItem value="1m-5m">1M - 5M</SelectItem>
                    <SelectItem value="5m-10m">5M - 10M</SelectItem>
                    <SelectItem value="10m+">10M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Accounting & Tax Systems
              </h2>
              <p className="text-slate-600">
                What systems do you currently use?
              </p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <Label htmlFor="accountingSystem">Accounting System *</Label>
                <Select value={formData.accountingSystem} onValueChange={(value) => setFormData({ ...formData, accountingSystem: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accounting system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1c">1C Accounting</SelectItem>
                    <SelectItem value="quickbooks">QuickBooks</SelectItem>
                    <SelectItem value="xero">Xero</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheets</SelectItem>
                    <SelectItem value="none">No system (manual)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taxSystem">Tax System *</Label>
                <Select value={formData.taxSystem} onValueChange={(value) => setFormData({ ...formData, taxSystem: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Tax System</SelectItem>
                    <SelectItem value="simplified">Simplified Tax System</SelectItem>
                    <SelectItem value="patent">Patent Tax System</SelectItem>
                    <SelectItem value="vat">VAT Registered</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Label className="mb-3 block">Bank Account Connection (Optional)</Label>
                <Card className="p-4 border-2 border-dashed border-slate-300">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard size={24} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Connect Your Bank</p>
                      <p className="text-sm text-slate-600">Automatically sync transactions</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Connect Bank Account
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Financial Goals
              </h2>
              <p className="text-slate-600">
                What are your main financial objectives? (Select all that apply)
              </p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              {financialGoalOptions.map((goal) => (
                <Card
                  key={goal}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.financialGoals.includes(goal)
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border-2 border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleGoalToggle(goal)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.financialGoals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                    />
                    <span className="font-medium text-slate-900">{goal}</span>
                    {formData.financialGoals.includes(goal) && (
                      <CheckCircle2 size={20} className="text-blue-600 ml-auto" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-6 max-w-lg mx-auto mt-6">
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Brain size={20} className="text-blue-600" />
                AI Personalization
              </h3>
              <p className="text-sm text-slate-700">
                Based on your goals, FinSight will prioritize insights and recommendations to help you achieve these objectives faster.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">FinSight</h1>
          </div>
          <div className="text-sm text-slate-600">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center p-8 min-h-[calc(100vh-72px)]">
        <Card className="max-w-3xl w-full p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Initial Business Audit
              </span>
              <span className="text-sm text-slate-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} />
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <Button
              onClick={() => {
                if (currentStep === totalSteps) {
                  handleComplete();
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          {/* Skip Option */}
          {currentStep < totalSteps && (
            <div className="text-center mt-4">
              <Button variant="link" onClick={handleComplete} className="text-sm text-slate-500">
                Skip for now
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
