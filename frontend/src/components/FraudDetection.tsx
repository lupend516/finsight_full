import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Shield, AlertTriangle, CheckCircle2, TrendingUp,
  Loader2, Upload, RefreshCw
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFinancialData } from '../hooks/useFinancialData';
import { bookkeeping } from '../lib/api';

const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
  : n >= 1_000 ? (n / 1_000).toFixed(0) + 'K'
  : Math.abs(n).toLocaleString('ru', { maximumFractionDigits: 0 });

export function FraudDetection() {
  const { company } = useAuth();
  const d = useFinancialData(company?.id || '');
  const companyId = company?.id || '';
  const [clearing, setClearing] = useState<string | null>(null);
  const [localFlagged, setLocalFlagged] = useState<string[]>([]);

  if (d.loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-blue-600" /></div>;
  }

  const hasData = d.totalTransactions > 0;
  const flagged = d.flagged.filter(t => !localFlagged.includes(t.id));
  const categorizedCount = d.categorized;
  const accuracy = d.totalTransactions > 0 ? Math.round(categorizedCount / d.totalTransactions * 100) : 0;

  const riskLevel = flagged.length === 0 ? 'Низкий' : flagged.length <= 5 ? 'Средний' : 'Высокий';
  const riskColor = flagged.length === 0 ? 'text-green-600' : flagged.length <= 5 ? 'text-orange-600' : 'text-red-600';
  const riskBg = flagged.length === 0 ? 'bg-green-100' : flagged.length <= 5 ? 'bg-orange-100' : 'bg-red-100';

  const kpis = [
    { title: 'Уровень риска', value: riskLevel, icon: Shield, color: riskColor, bg: riskBg, desc: 'Общая оценка' },
    { title: 'Требуют проверки', value: String(d.needsReview), icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100', desc: 'AI уверенность < 70%' },
    { title: 'Всего транзакций', value: String(d.totalTransactions), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Загружено в систему' },
    { title: 'Категоризовано', value: accuracy + '%', icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'AI точность' },
  ];

  // Помесячные флагованные — из агрегации (без загрузки всех транзакций)
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = (d.flaggedMonthly ?? [])
    .slice(-6)
    .map(m => ({ month: MONTH_NAMES[m.month - 1], flagged: m.count }));

  const clearTx = async (txId: string) => {
    setClearing(txId);
    try {
      await bookkeeping.updateTransaction(companyId, txId, { status: 'categorized' });
      setLocalFlagged(prev => [...prev, txId]);
    } finally {
      setClearing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} className="p-5">
              <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={20} className={k.color} />
              </div>
              <p className="text-xs text-slate-500 mb-1">{k.title}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-slate-400 mt-1">{k.desc}</p>
            </Card>
          );
        })}
      </div>

      {!hasData ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Нет данных для проверки</h3>
          <p className="text-slate-500">Загрузи выписку в <strong>Audit & Bookkeeping</strong></p>
        </Card>
      ) : (
        <>
          {/* Flagged transactions table */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Транзакции, требующие проверки</h3>
                <p className="text-sm text-slate-500">AI присвоил низкую уверенность категоризации (&lt;70%)</p>
              </div>
              {flagged.length > 0 && (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                  <AlertTriangle size={12} className="mr-1" /> {flagged.length}
                </Badge>
              )}
            </div>

            {flagged.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                <p className="font-medium text-slate-900">Всё в порядке!</p>
                <p className="text-sm text-slate-500">Нет транзакций, требующих проверки</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>AI %</TableHead>
                    <TableHead className="text-right">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flagged.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('ru')}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                        {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-orange-500">{tx.confidence}%</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm" variant="ghost"
                            className="text-green-600 hover:text-green-700 text-xs"
                            onClick={() => clearTx(tx.id)}
                            disabled={clearing === tx.id}
                          >
                            {clearing === tx.id ? <RefreshCw size={12} className="animate-spin" /> : <><CheckCircle2 size={12} className="mr-1" />ОК</>}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Chart: flagged per month */}
          {chartData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Транзакции под вопросом по месяцам</h3>
              <p className="text-sm text-slate-500 mb-4">Количество транзакций с низкой уверенностью AI</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="flagged" name="Требуют проверки" radius={[4,4,0,0]}>
                    {chartData.map((e, i) => <Cell key={i} fill={e.flagged > 0 ? '#f97316' : '#22c55e'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Status summary */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Сводка по статусам</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Категоризовано', count: d.categorized, color: 'bg-green-500' },
                { label: 'Требует проверки', count: d.needsReview, color: 'bg-orange-500' },
                { label: 'Без категории', count: Math.max(0, d.totalTransactions - d.categorized - d.needsReview), color: 'bg-slate-400' },
              ].map((s, i) => (
                <div key={i} className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${s.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-slate-900">{s.count}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
