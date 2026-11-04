import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function MainDashboard() {
  const kpis = [
    {
      title: 'Total Revenue',
      value: '$487,250',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Expenses',
      value: '$324,180',
      change: '+5.2%',
      trend: 'up' as const,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Net Profit',
      value: '$163,070',
      change: '+28.3%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Cash Flow',
      value: '$95,420',
      change: '-3.1%',
      trend: 'down' as const,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 35000 },
    { month: 'Mar', revenue: 48000, expenses: 31000 },
    { month: 'Apr', revenue: 61000, expenses: 38000 },
    { month: 'May', revenue: 55000, expenses: 36000 },
    { month: 'Jun', revenue: 68000, expenses: 42000 }
  ];

  const cashFlowData = [
    { month: 'Jan', amount: 12000 },
    { month: 'Feb', amount: 15000 },
    { month: 'Mar', amount: 13000 },
    { month: 'Apr', amount: 18000 },
    { month: 'May', amount: 16000 },
    { month: 'Jun', amount: 21000 }
  ];

  const expenseBreakdown = [
    { name: 'Payroll', value: 45, color: '#3b82f6' },
    { name: 'Operations', value: 25, color: '#8b5cf6' },
    { name: 'Marketing', value: 15, color: '#ec4899' },
    { name: 'Other', value: 15, color: '#06b6d4' }
  ];

  const aiInsights = [
    {
      type: 'positive',
      icon: CheckCircle2,
      title: 'Strong Revenue Growth',
      message: 'Your revenue increased by 24% compared to last month. This trend is expected to continue based on current pipeline.'
    },
    {
      type: 'info',
      icon: Info,
      title: 'Cash Flow Optimization Opportunity',
      message: 'By adjusting payment terms with your top 3 clients, you could improve cash flow by approximately $15,000.'
    },
    {
      type: 'warning',
      icon: AlertCircle,
      title: 'Seasonal Expense Pattern Detected',
      message: 'Operating expenses typically increase by 8% in Q3. Consider planning ahead to maintain healthy margins.'
    }
  ];

  const alerts = [
    {
      type: 'warning',
      title: 'Invoice Overdue',
      description: 'Invoice #1248 ($12,500) is 15 days past due',
      time: '2 hours ago'
    },
    {
      type: 'success',
      title: 'Unusual Activity Cleared',
      description: 'Transaction flagged yesterday was verified as legitimate',
      time: '5 hours ago'
    },
    {
      type: 'info',
      title: 'Monthly Report Ready',
      description: 'Your May financial report is ready to download',
      time: '1 day ago'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Financial Health Summary */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Financial Health Summary</h3>
            <p className="text-sm text-slate-600">Last updated: Today at 2:34 PM</p>
          </div>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 size={14} className="mr-1" />
            Healthy
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon size={24} className={kpi.color} />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {kpi.trend === 'up' ? (
                      <>
                        <ArrowUpRight size={16} className="text-green-600" />
                        <span className="text-green-600 font-medium">{kpi.change}</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight size={16} className="text-red-600" />
                        <span className="text-red-600 font-medium">{kpi.change}</span>
                      </>
                    )}
                  </div>
                </div>
                <h4 className="text-sm text-slate-600 mb-1">{kpi.title}</h4>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue & Expenses Chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Revenue vs Expenses</h3>
              <p className="text-sm text-slate-600">Last 6 months</p>
            </div>
            <Button variant="outline" size="sm">View Details</Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expenses" stroke="#f97316" fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown */}
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Expense Breakdown</h3>
            <p className="text-sm text-slate-600">Current month</p>
          </div>
          <div className="flex items-center justify-center mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {expenseBreakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights & Alerts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI-Generated Insights */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                AI Insights
                <Sparkles size={16} className="text-yellow-500" />
              </h3>
              <p className="text-sm text-slate-600">Personalized recommendations for your business</p>
            </div>
          </div>

          <div className="space-y-4">
            {aiInsights.map((insight, index) => {
              const Icon = insight.icon;
              const colors = {
                positive: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
                info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
                warning: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' }
              };
              const color = colors[insight.type as keyof typeof colors];

              return (
                <div key={index} className={`${color.bg} border ${color.border} rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    <Icon size={20} className={`${color.icon} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-slate-700">{insight.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="outline" className="w-full mt-4">
            View All Insights
          </Button>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Recent Alerts</h3>
            <Badge variant="secondary">3</Badge>
          </div>

          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const colors = {
                warning: 'bg-orange-100',
                success: 'bg-green-100',
                info: 'bg-blue-100'
              };

              return (
                <div key={index} className="pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${colors[alert.type as keyof typeof colors]}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-900 mb-1">{alert.title}</h4>
                      <p className="text-sm text-slate-600 mb-2">{alert.description}</p>
                      <span className="text-xs text-slate-500">{alert.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button variant="ghost" className="w-full mt-4">
            View All Alerts
          </Button>
        </Card>
      </div>

      {/* Cash Flow Trend */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Cash Flow Trend</h3>
            <p className="text-sm text-slate-600">Monthly cash flow over time</p>
          </div>
          <Button variant="outline" size="sm">Export Report</Button>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
