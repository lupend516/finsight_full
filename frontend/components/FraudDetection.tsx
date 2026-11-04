import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Eye,
  XCircle,
  Clock,
  DollarSign,
  Activity,
  Brain,
  Info
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function FraudDetection() {
  const riskMetrics = [
    {
      title: 'Risk Level',
      value: 'Low',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Overall risk assessment'
    },
    {
      title: 'Flagged Transactions',
      value: '3',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Requiring review'
    },
    {
      title: 'Cleared This Week',
      value: '12',
      icon: CheckCircle2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Verified as legitimate'
    },
    {
      title: 'Detection Rate',
      value: '99.2%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'AI accuracy score'
    }
  ];

  const suspiciousTransactions = [
    {
      id: 'TXN-1289',
      date: '2026-01-26',
      description: 'Wire Transfer - International',
      amount: 25000.00,
      riskLevel: 'high',
      riskScore: 87,
      flags: ['Unusual amount', 'New recipient', 'International'],
      status: 'pending',
      time: '2 hours ago'
    },
    {
      id: 'TXN-1276',
      date: '2026-01-25',
      description: 'Multiple small transactions',
      amount: 850.00,
      riskLevel: 'medium',
      riskScore: 64,
      flags: ['Rapid succession', 'Round amounts'],
      status: 'pending',
      time: '1 day ago'
    },
    {
      id: 'TXN-1265',
      date: '2026-01-24',
      description: 'Payment to unknown vendor',
      amount: 3200.00,
      riskLevel: 'medium',
      riskScore: 58,
      flags: ['First-time vendor', 'Large amount'],
      status: 'reviewing',
      time: '2 days ago'
    },
    {
      id: 'TXN-1252',
      date: '2026-01-23',
      description: 'After-hours transaction',
      amount: 1500.00,
      riskLevel: 'low',
      riskScore: 42,
      flags: ['Unusual timing'],
      status: 'cleared',
      time: '3 days ago'
    },
    {
      id: 'TXN-1240',
      date: '2026-01-22',
      description: 'Duplicate invoice payment',
      amount: 4500.00,
      riskLevel: 'high',
      riskScore: 92,
      flags: ['Duplicate', 'Same vendor'],
      status: 'cleared',
      time: '4 days ago'
    }
  ];

  const anomalyData = [
    { day: 'Mon', anomalies: 2 },
    { day: 'Tue', anomalies: 1 },
    { day: 'Wed', anomalies: 4 },
    { day: 'Thu', anomalies: 3 },
    { day: 'Fri', anomalies: 2 },
    { day: 'Sat', anomalies: 0 },
    { day: 'Sun', anomalies: 1 }
  ];

  const riskTrendData = [
    { month: 'Jan', score: 25 },
    { month: 'Feb', score: 22 },
    { month: 'Mar', score: 28 },
    { month: 'Apr', score: 18 },
    { month: 'May', score: 15 },
    { month: 'Jun', score: 12 }
  ];

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High Risk</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Medium Risk</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Low Risk</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Pending Review</Badge>;
      case 'reviewing':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Review</Badge>;
      case 'cleared':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Cleared</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon size={24} className={metric.color} />
                </div>
              </div>
              <h4 className="text-sm text-slate-600 mb-1">{metric.title}</h4>
              <p className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</p>
              <p className="text-xs text-slate-500">{metric.description}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Anomaly Detection Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Anomaly Detection Activity</h3>
              <p className="text-sm text-slate-600">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={anomalyData}>
              <defs>
                <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="anomalies" stroke="#ef4444" fillOpacity={1} fill="url(#colorAnomalies)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Risk Score Trend</h3>
              <p className="text-sm text-slate-600">Monthly average risk score</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* AI Explanation Panel */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">How Fraud Detection Works</h3>
            <p className="text-sm text-slate-700 mb-4">
              Our AI analyzes every transaction in real-time, comparing patterns against your normal business activity and industry benchmarks. It considers factors like transaction size, timing, frequency, vendor relationships, and geographic location to identify potentially fraudulent activity.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <Activity size={20} className="text-blue-600 mb-2" />
                <h4 className="font-medium text-slate-900 text-sm mb-1">Pattern Analysis</h4>
                <p className="text-xs text-slate-600">Detects unusual spending patterns and behaviors</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <DollarSign size={20} className="text-blue-600 mb-2" />
                <h4 className="font-medium text-slate-900 text-sm mb-1">Amount Verification</h4>
                <p className="text-xs text-slate-600">Flags transactions outside normal ranges</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <Clock size={20} className="text-blue-600 mb-2" />
                <h4 className="font-medium text-slate-900 text-sm mb-1">Timing Analysis</h4>
                <p className="text-xs text-slate-600">Identifies suspicious transaction timing</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Suspicious Transactions Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Flagged Transactions</h3>
            <p className="text-sm text-slate-600">Transactions requiring your attention</p>
          </div>
          <Button variant="outline" size="sm">
            View All Activity
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspiciousTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                  <TableCell className="text-slate-600">{transaction.date}</TableCell>
                  <TableCell className="max-w-xs">
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <p className="text-xs text-slate-500">{transaction.time}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    ${transaction.amount.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell>{getRiskLevelBadge(transaction.riskLevel)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            transaction.riskScore >= 80 ? 'bg-red-500' : 
                            transaction.riskScore >= 60 ? 'bg-orange-500' : 
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${transaction.riskScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{transaction.riskScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {transaction.flags.map((flag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" title="Review Details">
                        <Eye size={14} />
                      </Button>
                      {transaction.status !== 'cleared' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600" title="Mark as Safe">
                            <CheckCircle2 size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600" title="Report Fraud">
                            <XCircle size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Risk Indicators Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Understanding Risk Indicators</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info size={16} className="text-red-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">High Risk (80-100)</h4>
              <p className="text-sm text-slate-600">
                Immediate review recommended. Multiple fraud indicators detected.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info size={16} className="text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">Medium Risk (60-79)</h4>
              <p className="text-sm text-slate-600">
                Worthy of attention. Some unusual patterns detected.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Info size={16} className="text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-1">Low Risk (40-59)</h4>
              <p className="text-sm text-slate-600">
                Minor anomalies. Can be reviewed during regular audits.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
