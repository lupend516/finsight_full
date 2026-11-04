import React, { useState } from 'react';
import { Screen } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import {
  Brain,
  CreditCard,
  Shield,
  CheckCircle2,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { Separator } from './ui/separator';

interface PaymentProps {
  onNavigate: (screen: Screen) => void;
  selectedPlan?: 'standard' | 'premium';
}

export function Payment({ onNavigate, selectedPlan = 'premium' }: PaymentProps) {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const plans = {
    standard: {
      name: 'Standard Plan',
      price: '30,000',
      features: [
        'All FinSight features',
        'AI financial consultant',
        'Customized setup by specialist'
      ]
    },
    premium: {
      name: 'Premium Plan',
      price: '90,000',
      features: [
        'All FinSight features',
        'AI financial consultant',
        'Customized setup by specialist',
        'Regular data input by specialist'
      ]
    }
  };

  const selectedPlanData = plans[selectedPlan];

  const handlePayment = () => {
    // Navigate to registration after payment
    onNavigate('login');
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
          <Button variant="ghost" onClick={() => onNavigate('landing')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <div className="flex items-center justify-center p-8 min-h-[calc(100vh-72px)]">
        <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <Card className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Complete Your Purchase
              </h2>
              <p className="text-slate-600">
                Secure payment powered by Stripe
              </p>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (777) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Payment Details</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      />
                      <CreditCard size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cardName">Cardholder Name *</Label>
                    <Input
                      id="cardName"
                      placeholder="Name on card"
                      value={formData.cardName}
                      onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={formData.cvv}
                        onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 mb-1">
                      Secure Payment
                    </p>
                    <p className="text-xs text-green-700">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                onClick={handlePayment}
              >
                <Lock size={16} className="mr-2" />
                Pay & Activate {selectedPlanData.price} KZT
              </Button>

              <p className="text-xs text-slate-500 text-center">
                By confirming your payment, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </Card>

          {/* Order Summary */}
          <div>
            <Card className="p-8 sticky top-8">
              <h3 className="font-semibold text-slate-900 mb-6">Order Summary</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{selectedPlanData.name}</p>
                    <p className="text-sm text-slate-600">Monthly subscription</p>
                  </div>
                  {selectedPlan === 'premium' && (
                    <Badge className="bg-blue-100 text-blue-700">Most Popular</Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  {selectedPlanData.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">{selectedPlanData.price} KZT</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">14-day free trial</span>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">FREE</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-600">Due today</span>
                    <span className="font-medium text-slate-900">0 KZT</span>
                  </div>

                  <Separator className="mb-4" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">First payment (Feb 15)</span>
                    <span className="text-2xl font-bold text-slate-900">{selectedPlanData.price} KZT</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-slate-900 mb-2">What happens next?</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">1.</span>
                    <span>Complete your account registration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">2.</span>
                    <span>Set up your business profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">3.</span>
                    <span>Start your 14-day free trial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">4.</span>
                    <span>Get personalized setup assistance</span>
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">Need help?</p>
                <Button variant="link" className="text-sm">
                  Contact Support
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
