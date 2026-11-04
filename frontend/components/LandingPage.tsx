import React from 'react';
import { Screen } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Brain, 
  Shield, 
  TrendingUp, 
  FileCheck, 
  Zap, 
  BarChart3,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (screen: Screen) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Get instant, intelligent analysis of your financial data in simple language'
    },
    {
      icon: Shield,
      title: 'Fraud Detection',
      description: 'Automatically identify suspicious transactions and potential risks'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Forecasting',
      description: 'Make informed decisions with accurate revenue and expense predictions'
    },
    {
      icon: FileCheck,
      title: 'Automated Bookkeeping',
      description: 'Save hours with intelligent transaction categorization and document processing'
    },
    {
      icon: BarChart3,
      title: 'Strategic Reporting',
      description: 'Generate professional financial reports ready for investors and lenders'
    },
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Track your business health 24/7 with instant alerts and recommendations'
    }
  ];

  const benefits = [
    'Save 20+ hours per month on bookkeeping',
    'Reduce accounting errors by 95%',
    'Get financing-ready reports instantly',
    'Detect fraud before it impacts your business',
    'Make data-driven decisions with confidence'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">FinSight</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('login')}>
              Log In
            </Button>
            <Button onClick={() => onNavigate('login')}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Zap size={16} />
            <span className="text-sm font-medium">AI-Powered Financial Intelligence</span>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            From Basic Bookkeeping to Strategic Financial Insights
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            The intelligent financial assistant built for SMEs. Automate your accounting, detect fraud, and get AI-driven insights to grow your business.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8"
              onClick={() => onNavigate('login')}
            >
              Get Started Free
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700">{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-8 py-20 bg-white/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Everything You Need to Manage Your Finances
          </h2>
          <p className="text-lg text-slate-600">
            Powerful tools designed for business owners, not accountants
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-lg text-slate-600">
            Simple onboarding, powerful results
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Connect Your Data
            </h3>
            <p className="text-slate-600">
              Link your bank accounts, accounting software, or upload documents
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              AI Does the Work
            </h3>
            <p className="text-slate-600">
              Our AI categorizes transactions, detects anomalies, and generates insights
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Make Better Decisions
            </h3>
            <p className="text-slate-600">
              Get clear insights and strategic recommendations in plain language
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-8 py-20 bg-slate-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600">
            Choose the plan that fits your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Standard Plan */}
          <Card className="p-8 border-2 border-slate-200 hover:shadow-xl transition-shadow">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Standard Plan</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-slate-900">30,000</span>
                <span className="text-xl text-slate-600">KZT / month</span>
              </div>
              <p className="text-slate-600">Perfect for small businesses getting started</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">All FinSight features</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">AI financial consultant</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">FinSight setup customized for your business by our specialist</span>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              variant="outline"
              onClick={() => onNavigate('login')}
            >
              Choose Plan
            </Button>
          </Card>

          {/* Premium Plan */}
          <Card className="p-8 border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-shadow relative">
            <span className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium">Most Popular</span>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Premium Plan</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-slate-900">90,000</span>
                <span className="text-xl text-slate-600">KZT / month</span>
              </div>
              <p className="text-slate-600">For growing businesses that need full support</p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">All FinSight features</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">AI financial consultant</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">FinSight setup customized for your business by our specialist</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700 font-medium">Regular data input from bank statements or 1C by FinSight specialist</span>
              </div>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              size="lg"
              onClick={() => onNavigate('login')}
            >
              Choose Plan
            </Button>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Financial Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of SMEs using FinSight to automate bookkeeping, prevent fraud, and make smarter business decisions.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => onNavigate('login')}
            >
              Start Your Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 bg-white/10 border-white text-white hover:bg-white/20"
            >
              Contact Sales
            </Button>
          </div>
          <p className="text-sm text-blue-100 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Brain size={14} className="text-white" />
              </div>
              <span className="font-semibold text-slate-900">FinSight</span>
            </div>
            <p className="text-sm text-slate-500">
              © 2026 FinSight. Intelligent financial assistant for SMEs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}