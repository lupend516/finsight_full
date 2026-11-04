import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Clock,
  Search,
  Download,
  Eye,
  Edit,
  Scan,
  Brain,
  ChevronRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

export function AuditBookkeeping() {
  const [searchQuery, setSearchQuery] = useState('');

  const auditProgress = [
    { task: 'Transaction Categorization', progress: 100, status: 'complete' },
    { task: 'Receipt Matching', progress: 87, status: 'in-progress' },
    { task: 'Bank Reconciliation', progress: 95, status: 'in-progress' },
    { task: 'Duplicate Detection', progress: 100, status: 'complete' },
    { task: 'Missing Data Review', progress: 45, status: 'in-progress' }
  ];

  const transactions = [
    {
      id: 'TXN-1248',
      date: '2026-01-24',
      description: 'Office Supplies - Staples',
      amount: -234.50,
      category: 'Office Expenses',
      status: 'categorized',
      confidence: 98,
      receipt: true
    },
    {
      id: 'TXN-1247',
      date: '2026-01-24',
      description: 'Payment from Client ABC Corp',
      amount: 15000.00,
      category: 'Revenue',
      status: 'categorized',
      confidence: 100,
      receipt: true
    },
    {
      id: 'TXN-1246',
      date: '2026-01-23',
      description: 'Software Subscription - Adobe',
      amount: -79.99,
      category: 'Software & Tools',
      status: 'categorized',
      confidence: 95,
      receipt: false
    },
    {
      id: 'TXN-1245',
      date: '2026-01-23',
      description: 'Lunch Meeting',
      amount: -125.00,
      category: 'Meals & Entertainment',
      status: 'needs-review',
      confidence: 72,
      receipt: false
    },
    {
      id: 'TXN-1244',
      date: '2026-01-22',
      description: 'Transfer to Savings',
      amount: -5000.00,
      category: 'Uncategorized',
      status: 'needs-review',
      confidence: 0,
      receipt: false
    },
    {
      id: 'TXN-1243',
      date: '2026-01-22',
      description: 'Payroll - January',
      amount: -45820.00,
      category: 'Payroll',
      status: 'categorized',
      confidence: 100,
      receipt: true
    },
    {
      id: 'TXN-1242',
      date: '2026-01-21',
      description: 'Marketing - Google Ads',
      amount: -850.00,
      category: 'Marketing',
      status: 'categorized',
      confidence: 98,
      receipt: true
    },
    {
      id: 'TXN-1241',
      date: '2026-01-21',
      description: 'Amazon Business Purchase',
      amount: -342.18,
      category: 'Office Expenses',
      status: 'categorized',
      confidence: 89,
      receipt: false
    }
  ];

  const documentsStatus = {
    uploaded: 124,
    processed: 118,
    pending: 6,
    errors: 2
  };

  const errors = [
    {
      type: 'Missing Receipt',
      transaction: 'TXN-1245',
      description: 'Lunch Meeting - $125.00',
      severity: 'medium'
    },
    {
      type: 'Duplicate Entry',
      transaction: 'TXN-1238',
      description: 'Office rent payment appears twice',
      severity: 'high'
    },
    {
      type: 'Uncategorized',
      transaction: 'TXN-1244',
      description: 'Transfer to Savings - needs classification',
      severity: 'low'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'categorized':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Categorized</Badge>;
      case 'needs-review':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Needs Review</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Audit Progress Overview */}
      <div className="grid lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Total Transactions</span>
            <FileText size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">1,248</p>
          <p className="text-sm text-slate-600 mt-1">This month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Auto-Categorized</span>
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">1,205</p>
          <p className="text-sm text-green-600 mt-1">96.6% automated</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Needs Review</span>
            <AlertCircle size={20} className="text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">43</p>
          <p className="text-sm text-orange-600 mt-1">Manual attention required</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Processing Time</span>
            <Clock size={20} className="text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-slate-900">2.4h</p>
          <p className="text-sm text-slate-600 mt-1">Saved this month</p>
        </Card>
      </div>

      {/* Audit Completion Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Audit Completion Status</h3>
            <p className="text-sm text-slate-600">Automated tasks progress</p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Overall: 85%
          </Badge>
        </div>

        <div className="space-y-4">
          {auditProgress.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{item.task}</span>
                  {item.status === 'complete' && (
                    <CheckCircle2 size={16} className="text-green-600" />
                  )}
                </div>
                <span className="text-sm text-slate-600">{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Document Upload & OCR */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Document Processing</h3>
              <p className="text-sm text-slate-600">OCR and automatic data extraction</p>
            </div>
            <Button className="gap-2">
              <Upload size={16} />
              Upload Documents
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{documentsStatus.uploaded}</p>
              <p className="text-sm text-slate-600 mt-1">Uploaded</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{documentsStatus.processed}</p>
              <p className="text-sm text-slate-600 mt-1">Processed</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{documentsStatus.pending}</p>
              <p className="text-sm text-slate-600 mt-1">Pending</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{documentsStatus.errors}</p>
              <p className="text-sm text-slate-600 mt-1">Errors</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scan size={32} className="text-blue-600" />
            </div>
            <h4 className="font-medium text-slate-900 mb-2">Drop receipts and invoices here</h4>
            <p className="text-sm text-slate-600 mb-4">or click to browse files</p>
            <p className="text-xs text-slate-500">Supports PDF, JPG, PNG (max 10MB each)</p>
          </div>
        </Card>

        {/* Errors & Warnings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Errors & Warnings</h3>
            <Badge variant="destructive">{errors.length}</Badge>
          </div>

          <div className="space-y-4">
            {errors.map((error, index) => {
              const severityColors = {
                high: 'bg-red-50 border-red-200',
                medium: 'bg-orange-50 border-orange-200',
                low: 'bg-yellow-50 border-yellow-200'
              };

              return (
                <div key={index} className={`border rounded-lg p-3 ${severityColors[error.severity as keyof typeof severityColors]}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{error.type}</span>
                    <Badge variant="outline" className="text-xs">{error.transaction}</Badge>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{error.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Resolve
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button variant="ghost" className="w-full mt-4">
            View All Issues
          </Button>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Automated Transaction Categorization</h3>
            <p className="text-sm text-slate-600">AI-powered classification with confidence scores</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search transactions..." 
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-slate-600">{transaction.date}</TableCell>
                  <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.description}
                      {transaction.receipt && (
                        <FileText size={14} className="text-blue-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-slate-900'}`}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Brain size={14} className={getConfidenceColor(transaction.confidence)} />
                      <span className={`text-sm font-medium ${getConfidenceColor(transaction.confidence)}`}>
                        {transaction.confidence}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-600">Showing 8 of 1,248 transactions</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
