import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Download, 
  Send, 
  Calendar,
  TrendingUp,
  DollarSign,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  PieChart,
  BarChart3,
  FileSpreadsheet,
  Scale,
  Wallet,
  TrendingDown,
  Brain,
  Lightbulb
} from 'lucide-react';
import { Progress } from './ui/progress';

export function StrategyReporting() {
  const reports = [
    {
      id: 'RPT-001',
      title: 'Profit & Loss Statement',
      description: 'Comprehensive income statement showing revenue, expenses, and net profit',
      icon: TrendingUp,
      date: 'January 2026',
      status: 'ready',
      size: '1.8 MB',
      pages: 12,
      formats: ['PDF', 'Excel'],
      insights: 'Net profit margin improved by 8% compared to last month',
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'RPT-002',
      title: 'Balance Sheet',
      description: 'Overview of assets, liabilities, and equity at a specific point in time',
      icon: Scale,
      date: 'January 31, 2026',
      status: 'ready',
      size: '1.2 MB',
      pages: 8,
      formats: ['PDF', 'Excel'],
      insights: 'Total assets increased by 15% with healthy liquidity ratios',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'RPT-003',
      title: 'Cash Flow Statement',
      description: 'Analysis of cash inflows and outflows from operating, investing, and financing activities',
      icon: Wallet,
      date: 'January 2026',
      status: 'ready',
      size: '1.5 MB',
      pages: 10,
      formats: ['PDF', 'Excel'],
      insights: 'Operating cash flow is strong at $95K for the month',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'RPT-004',
      title: '13-Week Cash Flow Forecast',
      description: 'Detailed weekly cash flow projections for the next 13 weeks',
      icon: Calendar,
      date: 'Feb 2026 - May 2026',
      status: 'ready',
      size: '2.2 MB',
      pages: 15,
      formats: ['PDF', 'Excel'],
      insights: 'Cash position expected to grow steadily, peaking in Week 10',
      color: 'bg-indigo-100 text-indigo-600'
    },
    {
      id: 'RPT-005',
      title: 'Sales Analysis',
      description: 'Detailed breakdown of sales by product, customer, region, and time period',
      icon: BarChart3,
      date: 'January 2026',
      status: 'ready',
      size: '3.1 MB',
      pages: 18,
      formats: ['PDF', 'Excel'],
      insights: 'Top 3 customers account for 45% of total sales',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      id: 'RPT-006',
      title: 'Tax Summary Report',
      description: 'Comprehensive tax report including VAT, income tax, and other obligations',
      icon: FileSpreadsheet,
      date: 'Q1 2026',
      status: 'generating',
      size: '—',
      pages: 0,
      formats: ['PDF'],
      insights: null,
      color: 'bg-red-100 text-red-600'
    },
    {
      id: 'RPT-007',
      title: 'Investor Presentation',
      description: 'Professional investor-ready presentation with key metrics and growth story',
      icon: Briefcase,
      date: 'January 2026',
      status: 'ready',
      size: '4.5 MB',
      pages: 24,
      formats: ['PDF', 'PowerPoint'],
      insights: 'Strong fundamentals: 28% YoY growth, 33% profit margin',
      color: 'bg-teal-100 text-teal-600'
    }
  ];

  const financingReadiness = {
    score: 87,
    level: 'Excellent',
    strengths: [
      'Strong revenue growth trajectory',
      'Healthy profit margins',
      'Low debt levels',
      'Positive cash flow',
      'Clean financial records'
    ],
    improvements: [
      'Increase accounts receivable turnover',
      'Document customer acquisition processes'
    ]
  };

  const keyProjections = [
    {
      metric: 'Revenue (Next 12 Months)',
      current: '₸58,470,000',
      projected: '₸77,400,000',
      change: '+32%',
      confidence: 89
    },
    {
      metric: 'Net Profit (Next 12 Months)',
      current: '₸19,568,400',
      projected: '₸27,000,000',
      change: '+38%',
      confidence: 85
    },
    {
      metric: 'Cash Position',
      current: '₸11,450,400',
      projected: '₸22,200,000',
      change: '+94%',
      confidence: 82
    },
    {
      metric: 'Customer Base',
      current: '156',
      projected: '245',
      change: '+57%',
      confidence: 78
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ready</Badge>;
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Generating</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Financing Readiness Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">Financing Readiness Score</h3>
            <p className="text-blue-100">Your business is well-positioned to secure funding</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold mb-1">{financingReadiness.score}</div>
            <Badge className="bg-white text-blue-600 hover:bg-white">{financingReadiness.level}</Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 size={20} />
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {financingReadiness.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-50">
                  <span className="text-blue-200 mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target size={20} />
              Areas for Improvement
            </h4>
            <ul className="space-y-2">
              {financingReadiness.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-blue-50">
                  <span className="text-blue-200 mt-0.5">•</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-blue-400">
          <Button variant="secondary" size="lg" className="w-full md:w-auto">
            <Download size={16} className="mr-2" />
            Download Financing Package
          </Button>
        </div>
      </Card>

      {/* Future Projections */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Strategic Projections</h3>
            <p className="text-sm text-slate-600">AI-powered forecasts for the next 12 months</p>
          </div>
          <Button variant="outline" size="sm">
            <Calendar size={16} className="mr-2" />
            Adjust Timeline
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyProjections.map((projection, index) => (
            <Card key={index} className="p-4 border-2 border-slate-200">
              <h4 className="text-sm text-slate-600 mb-3">{projection.metric}</h4>
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-slate-500">Current</p>
                  <p className="text-lg font-bold text-slate-900">{projection.current}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Projected</p>
                  <p className="text-lg font-bold text-blue-600">{projection.projected}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-sm font-medium text-green-600">{projection.change}</span>
                <Badge variant="outline" className="text-xs">
                  {projection.confidence}% confidence
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Financial Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Financial Reports</h3>
            <p className="text-sm text-slate-600">Automatically generated professional reports</p>
          </div>
          <Button className="gap-2">
            <FileText size={16} />
            Generate New Report
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 ${report.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900 truncate">{report.title}</h4>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {report.date}
                      </span>
                      {report.status === 'ready' && (
                        <>
                          <span>•</span>
                          <span>{report.pages} pages</span>
                          <span>•</span>
                          <span>{report.size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {report.insights && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <Brain size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-blue-900 mb-1">AI Insight</p>
                      <p className="text-xs text-blue-700">{report.insights}</p>
                    </div>
                  </div>
                )}

                {report.status === 'ready' ? (
                  <div className="flex items-center gap-2">
                    {report.formats.map((format) => (
                      <Button key={format} variant="outline" size="sm" className="flex-1">
                        <Download size={14} className="mr-2" />
                        {format}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm">
                      <Send size={14} />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-blue-600" />
                      <span className="text-sm text-slate-600">Generating report...</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Report Templates Info */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Understanding Your Reports</h3>
            <p className="text-sm text-slate-700 mb-4">
              All reports are generated automatically based on your real financial data. Our AI provides simple explanations in non-technical language, making it easy to understand your business performance and share with stakeholders.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-slate-900 text-sm mb-1">For Internal Use</h4>
                <p className="text-xs text-slate-600">P&L, Cash Flow, Sales Analysis</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-slate-900 text-sm mb-1">For External Stakeholders</h4>
                <p className="text-xs text-slate-600">Investor Presentation, Balance Sheet</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-slate-900 text-sm mb-1">For Planning</h4>
                <p className="text-xs text-slate-600">13-Week Forecast, Projections</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-slate-900 text-sm mb-1">For Compliance</h4>
                <p className="text-xs text-slate-600">Tax Summary, Balance Sheet</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Custom Report Request */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle size={24} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Need a Custom Report?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Our AI can generate custom reports tailored to your specific needs - whether it's for lenders, investors, board meetings, or regulatory compliance.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">
                Request Custom Report
              </Button>
              <Button variant="ghost">
                Schedule Recurring Reports
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
