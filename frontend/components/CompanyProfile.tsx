import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Building2,
  CreditCard,
  FileSpreadsheet,
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  Edit,
  Globe,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Separator } from './ui/separator';

export function CompanyProfile() {
  const companyInfo = {
    name: 'TechCo Ltd',
    industry: 'Technology & Software',
    country: 'Kazakhstan',
    currency: 'KZT (₸)',
    employees: '25',
    revenue: '$2M',
    registrationDate: 'January 15, 2026'
  };

  const contactInfo = {
    email: 'sarah.miller@techco.com',
    phone: '+7 (777) 123-4567',
    address: 'Almaty, Kazakhstan'
  };

  const subscription = {
    plan: 'Premium',
    price: '90,000 KZT',
    billingCycle: 'Monthly',
    nextBillingDate: 'February 15, 2026',
    status: 'Active'
  };

  const connectedSources = [
    {
      name: 'Halyk Bank',
      type: 'Bank Account',
      status: 'Connected',
      lastSync: '2 hours ago',
      icon: CreditCard
    },
    {
      name: '1C Accounting',
      type: 'Accounting System',
      status: 'Connected',
      lastSync: '1 day ago',
      icon: FileSpreadsheet
    },
    {
      name: 'Kaspi Bank',
      type: 'Bank Account',
      status: 'Pending',
      lastSync: 'Not synced',
      icon: CreditCard
    }
  ];

  const billingHistory = [
    { date: 'Jan 15, 2026', amount: '90,000 KZT', status: 'Paid', invoice: 'INV-001' },
    { date: 'Dec 15, 2025', amount: '90,000 KZT', status: 'Paid', invoice: 'INV-002' },
    { date: 'Nov 15, 2025', amount: '30,000 KZT', status: 'Paid', invoice: 'INV-003' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Company Profile</h3>
          <p className="text-slate-600 mt-1">Manage your company information and subscription</p>
        </div>
        <Button className="gap-2">
          <Edit size={16} />
          Edit Profile
        </Button>
      </div>

      {/* Company Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Company Information</h3>
            <p className="text-sm text-slate-600">Your business details</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-slate-600 mb-2 block">Company Name</Label>
            <p className="font-medium text-slate-900">{companyInfo.name}</p>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Industry</Label>
            <p className="font-medium text-slate-900">{companyInfo.industry}</p>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Country</Label>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-slate-500" />
              <p className="font-medium text-slate-900">{companyInfo.country}</p>
            </div>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Currency</Label>
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-slate-500" />
              <p className="font-medium text-slate-900">{companyInfo.currency}</p>
            </div>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Number of Employees</Label>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <p className="font-medium text-slate-900">{companyInfo.employees}</p>
            </div>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Annual Revenue</Label>
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-slate-500" />
              <p className="font-medium text-slate-900">{companyInfo.revenue}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Mail size={24} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
            <p className="text-sm text-slate-600">Your contact details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-slate-400" />
            <div>
              <Label className="text-slate-600 text-sm">Email</Label>
              <p className="font-medium text-slate-900">{contactInfo.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-slate-400" />
            <div>
              <Label className="text-slate-600 text-sm">Phone</Label>
              <p className="font-medium text-slate-900">{contactInfo.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-slate-400" />
            <div>
              <Label className="text-slate-600 text-sm">Address</Label>
              <p className="font-medium text-slate-900">{contactInfo.address}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Subscription Plan */}
      <Card className="p-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Current Subscription</h3>
              <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle2 size={12} className="mr-1" />
                {subscription.status}
              </Badge>
            </div>
          </div>
          <Button variant="outline" className="bg-white">
            Upgrade Plan
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-slate-600 mb-2 block">Plan</Label>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900">{subscription.plan}</p>
              <Badge variant="outline" className="bg-white">Most Popular</Badge>
            </div>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Price</Label>
            <p className="text-2xl font-bold text-slate-900">{subscription.price} / month</p>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Billing Cycle</Label>
            <p className="font-medium text-slate-900">{subscription.billingCycle}</p>
          </div>
          <div>
            <Label className="text-slate-600 mb-2 block">Next Billing Date</Label>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              <p className="font-medium text-slate-900">{subscription.nextBillingDate}</p>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-blue-200" />

        <div className="bg-white rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Premium Plan Includes:</h4>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span>All FinSight features</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span>AI financial consultant</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span>FinSight setup customized for your business by our specialist</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <span>Regular data input from bank statements or 1C by FinSight specialist</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Connected Data Sources */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Connected Data Sources</h3>
            <p className="text-sm text-slate-600">Manage your bank and accounting integrations</p>
          </div>
          <Button variant="outline">
            Add New Source
          </Button>
        </div>

        <div className="space-y-4">
          {connectedSources.map((source, index) => {
            const Icon = source.icon;
            const statusColor = source.status === 'Connected' ? 'text-green-600' : 'text-orange-600';
            const statusBg = source.status === 'Connected' ? 'bg-green-100' : 'bg-orange-100';

            return (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Icon size={24} className="text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{source.name}</h4>
                      <p className="text-sm text-slate-600">{source.type}</p>
                      <p className="text-xs text-slate-500 mt-1">Last sync: {source.lastSync}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${statusBg} ${statusColor} hover:${statusBg}`}>
                      {source.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      {source.status === 'Connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Billing History</h3>
            <p className="text-sm text-slate-600">Your payment history and invoices</p>
          </div>
        </div>

        <div className="space-y-3">
          {billingHistory.map((bill, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{bill.amount}</p>
                <p className="text-sm text-slate-600">{bill.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  {bill.status}
                </Badge>
                <Button variant="ghost" size="sm">
                  Download Invoice
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-2 border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Cancel Subscription</p>
            <p className="text-sm text-slate-600">You will lose access to all premium features</p>
          </div>
          <Button variant="destructive" size="sm">
            Cancel Subscription
          </Button>
        </div>
      </Card>
    </div>
  );
}
