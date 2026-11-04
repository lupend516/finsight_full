import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Play,
  Brain,
  Lightbulb,
  Target,
  DollarSign,
  Users,
  ShoppingCart
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ComposedChart
} from 'recharts';

export function BusinessIntelligence() {
  const [forecastPeriod, setForecastPeriod] = useState('6months');

  const revenueData = [
    { month: 'Jul 25', actual: 52000, forecast: null, trend: null },
    { month: 'Aug 25', actual: 58000, forecast: null, trend: null },
    { month: 'Sep 25', actual: 61000, forecast: null, trend: null },
    { month: 'Oct 25', actual: 55000, forecast: null, trend: null },
    { month: 'Nov 25', actual: 68000, forecast: null, trend: null },
    { month: 'Dec 25', actual: 72000, forecast: null, trend: null },
    { month: 'Jan 26', actual: 48725, forecast: null, trend: null },
    { month: 'Feb 26', actual: null, forecast: 75000, trend: 78000 },
    { month: 'Mar 26', actual: null, forecast: 78000, trend: 82000 },
    { month: 'Apr 26', actual: null, forecast: 82000, trend: 85000 },
    { month: 'May 26', actual: null, forecast: 85000, trend: 89000 },
    { month: 'Jun 26', actual: null, forecast: 88000, trend: 92000 }
  ];

  const expenseForecast = [
    { month: 'Jul 25', actual: 35000, forecast: null },
    { month: 'Aug 25', actual: 38000, forecast: null },
    { month: 'Sep 25', actual: 42000, forecast: null },
    { month: 'Oct 25', actual: 39000, forecast: null },
    { month: 'Nov 25', actual: 45000, forecast: null },
    { month: 'Dec 25', actual: 48000, forecast: null },
    { month: 'Jan 26', actual: 32418, forecast: null },
    { month: 'Feb 26', actual: null, forecast: 49000 },
    { month: 'Mar 26', actual: null, forecast: 51000 },
    { month: 'Apr 26', actual: null, forecast: 52000 },
    { month: 'May 26', actual: null, forecast: 53000 },
    { month: 'Jun 26', actual: null, forecast: 54000 }
  ];

  const customerMetrics = [
    { month: 'Jul', newCustomers: 12, churn: 2, revenue: 52000 },
    { month: 'Aug', newCustomers: 15, churn: 1, revenue: 58000 },
    { month: 'Sep', newCustomers: 18, churn: 3, revenue: 61000 },
    { month: 'Oct', newCustomers: 14, churn: 2, revenue: 55000 },
    { month: 'Nov', newCustomers: 22, churn: 1, revenue: 68000 },
    { month: 'Dec', newCustomers: 25, churn: 2, revenue: 72000 }
  ];

  const scenarioData = [
    { metric: 'Revenue', conservative: 420000, expected: 480000, optimistic: 540000 },
    { metric: 'Expenses', conservative: 320000, expected: 310000, optimistic: 300000 },
    { metric: 'Net Profit', conservative: 100000, expected: 170000, optimistic: 240000 },
    { metric: 'Cash Flow', conservative: 80000, expected: 130000, optimistic: 180000 }
  ];

  const aiRecommendations = [
    {
      priority: 'high',
      category: 'Revenue Growth',
      title: 'Expand High-Margin Services',
      insight: 'Analysis shows your consulting services have 45% higher margins than product sales. Consider allocating more resources to this segment.',
      impact: '+$15K monthly revenue',
      confidence: 92
    },
    {
      priority: 'high',
      category: 'Cost Optimization',
      title: 'Renegotiate Software Subscriptions',
      insight: 'You\'re paying for 3 tools with overlapping features. Consolidating could save significant costs without losing functionality.',
      impact: '-$480/month expenses',
      confidence: 88
    },
    {
      priority: 'medium',
      category: 'Customer Retention',
      title: 'Implement Loyalty Program',
      insight: 'Customers who stay beyond 6 months generate 3x more revenue. A retention program could reduce churn by 40%.',
      impact: '+$8K monthly revenue',
      confidence: 75
    },
    {
      priority: 'medium',
      category: 'Operational Efficiency',
      title: 'Automate Invoice Follow-ups',
      insight: 'Average payment collection time is 45 days. Automated reminders could reduce this to 30 days, improving cash flow.',
      impact: '+$12K cash flow',
      confidence: 82
    }
  ];

  const keyInsights = [
    {
      icon: TrendingUp,
      title: 'Revenue Growth Acceleration',
      description: 'Current trajectory shows 28% YoY growth. Maintaining this pace, you\'ll reach $1M ARR by Q3 2026.',
      trend: 'positive'
    },
    {
      icon: Users,
      title: 'Customer Acquisition Cost Improving',
      description: 'CAC decreased from $850 to $620 over the past quarter. Marketing efficiency is increasing.',
      trend: 'positive'
    },
    {
      icon: DollarSign,
      title: 'Seasonal Revenue Pattern',
      description: 'Q4 historically shows 22% revenue increase. Plan inventory and staffing accordingly.',
      trend: 'neutral'
    },
    {
      icon: ShoppingCart,
      title: 'Product Mix Optimization Opportunity',
      description: 'Top 3 products account for 65% of revenue but only 30% of marketing spend. Consider reallocation.',
      trend: 'neutral'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Insights Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {keyInsights.map((insight, index) => {
          const Icon = insight.icon;
          const borderColor = insight.trend === 'positive' ? 'border-green-200' : 'border-blue-200';
          const bgColor = insight.trend === 'positive' ? 'bg-green-50' : 'bg-blue-50';
          
          return (
            <Card key={index} className={`p-6 border-2 ${borderColor} ${bgColor}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${insight.trend === 'positive' ? 'bg-green-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon size={24} className={insight.trend === 'positive' ? 'text-green-600' : 'text-blue-600'} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-2">{insight.title}</h3>
                  <p className="text-sm text-slate-700">{insight.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revenue & Expense Forecasting */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Revenue & Expense Forecast</h3>
            <p className="text-sm text-slate-600">AI-powered predictions based on historical data and trends</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar size={16} className="mr-2" />
              6 Months
            </Button>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
            <TabsTrigger value="expenses">Expense Forecast</TabsTrigger>
            <TabsTrigger value="combined">Combined View</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Forecasted Revenue (6mo)</p>
                <p className="text-2xl font-bold text-blue-600">$498,000</p>
                <p className="text-xs text-green-600 mt-1">+24% vs last period</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Confidence Level</p>
                <p className="text-2xl font-bold text-purple-600">87%</p>
                <p className="text-xs text-slate-600 mt-1">High accuracy</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">Growth Trend</p>
                <p className="text-2xl font-bold text-green-600">+28%</p>
                <p className="text-xs text-slate-600 mt-1">Year over year</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={revenueData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="url(#colorActual)" name="Actual Revenue" />
                <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AI Forecast" dot={false} />
                <Line type="monotone" dataKey="trend" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" name="Optimistic Trend" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="expenses">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={expenseForecast}>
                <defs>
                  <linearGradient id="colorExpenseActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="actual" stroke="#f97316" fill="url(#colorExpenseActual)" name="Actual Expenses" />
                <Line type="monotone" dataKey="forecast" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" name="Forecast" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="combined">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Revenue (Actual)" />
                <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="Revenue (Forecast)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Scenario Simulations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Scenario Analysis</h3>
            <p className="text-sm text-slate-600">Compare different business scenarios for next 6 months</p>
          </div>
          <Button variant="outline" size="sm">
            <Play size={16} className="mr-2" />
            Run Custom Scenario
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-2 border-orange-200 bg-orange-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900">Conservative</h4>
              <Badge variant="outline">-15% growth</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-3">Market slowdown, reduced customer acquisition</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Net Profit:</span>
                <span className="font-medium text-slate-900">$100,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Margin:</span>
                <span className="font-medium text-slate-900">23.8%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2 border-blue-400 bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900">Expected</h4>
              <Badge className="bg-blue-600">Current trajectory</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-3">Current trends continue, stable growth</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Net Profit:</span>
                <span className="font-medium text-slate-900">$170,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Margin:</span>
                <span className="font-medium text-slate-900">35.4%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2 border-green-200 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900">Optimistic</h4>
              <Badge variant="outline" className="border-green-600 text-green-700">+35% growth</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-3">Strong market, successful expansion</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Net Profit:</span>
                <span className="font-medium text-slate-900">$240,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Margin:</span>
                <span className="font-medium text-slate-900">44.4%</span>
              </div>
            </div>
          </Card>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scenarioData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="metric" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Bar dataKey="conservative" fill="#f97316" name="Conservative" />
            <Bar dataKey="expected" fill="#3b82f6" name="Expected" />
            <Bar dataKey="optimistic" fill="#10b981" name="Optimistic" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* AI-Driven Recommendations */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI-Driven Recommendations</h3>
            <p className="text-sm text-slate-600">Strategic actions to improve your business performance</p>
          </div>
        </div>

        <div className="space-y-4">
          {aiRecommendations.map((rec, index) => {
            const priorityColors = {
              high: 'border-red-200 bg-red-50',
              medium: 'border-orange-200 bg-orange-50',
              low: 'border-blue-200 bg-blue-50'
            };

            const priorityBadge = {
              high: <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High Priority</Badge>,
              medium: <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Medium Priority</Badge>,
              low: <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Low Priority</Badge>
            };

            return (
              <Card key={index} className={`p-5 border-2 ${priorityColors[rec.priority as keyof typeof priorityColors]}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Lightbulb size={24} className="text-yellow-600" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                        {priorityBadge[rec.priority as keyof typeof priorityBadge]}
                      </div>
                      <p className="text-xs text-slate-600">{rec.category}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Target size={12} />
                    {rec.confidence}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mb-3 ml-9">{rec.insight}</p>
                <div className="flex items-center justify-between ml-9">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-700">Potential Impact:</span>
                    <span className="text-sm font-bold text-green-700">{rec.impact}</span>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Customer Growth Trends */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Customer Growth Analysis</h3>
            <p className="text-sm text-slate-600">New customer acquisition vs churn rate</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={customerMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Bar dataKey="newCustomers" fill="#3b82f6" name="New Customers" />
            <Bar dataKey="churn" fill="#ef4444" name="Churned Customers" />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" yAxisId="right" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
