import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  TrendingUp, TrendingDown, Brain, Lightbulb, Target,
  DollarSign, Loader2, Upload, BarChart3
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Line, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFinancialData } from '../hooks/useFinancialData';

const fmt = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
  : n >= 1_000 ? (n / 1_000).toFixed(0) + 'K'
  : n.toLocaleString('ru', { maximumFractionDigits: 0 });

export function BusinessIntelligence() {
  const { company } = useAuth();
  const d = useFinancialData(company?.id || '');

  if (d.loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-blue-600" /></div>;
  }

  const hasData = d.totalTransactions > 0;

  // Simple forecast: extend monthly data by 3 months using avg growth
  const forecastData = (() => {
    if (d.monthlyData.length < 2) return d.monthlyData;
    const last = d.monthlyData[d.monthlyData.length - 1];
    const prev = d.monthlyData[d.monthlyData.length - 2];
    const revenueGrowth = prev.revenue > 0 ? (last.revenue - prev.revenue) / prev.revenue : 0.05;
    const expenseGrowth = prev.expenses > 0 ? (last.expenses - prev.expenses) / prev.expenses : 0.03;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const result = d.monthlyData.map(m => ({ ...m, forecast: null as number | null }));

    let lastRevenue = last.revenue;
    let lastExpense = last.expenses;
    const lastMonthLabel = last.month; // e.g. "Apr 26"
    const [mName, yStr] = lastMonthLabel.split(' ');
    let mIdx = months.indexOf(mName);
    let year = parseInt('20' + yStr);

    for (let i = 0; i < 3; i++) {
      mIdx = (mIdx + 1) % 12;
      if (mIdx === 0) year++;
      lastRevenue = lastRevenue * (1 + revenueGrowth);
      lastExpense = lastExpense * (1 + expenseGrowth);
      result.push({
        month: `${months[mIdx]} ${String(year).slice(2)}`,
        revenue: 0,
        expenses: 0,
        profit: 0,
        forecast: Math.round(lastRevenue),
      });
    }
    return result;
  })();

  // Profitability margin
  const margin = d.totalIncome > 0 ? ((d.netProfit / d.totalIncome) * 100).toFixed(1) : '0';

  // Top expense categories
  const topExpenses = d.expenseByCategory.slice(0, 5);

  // AI recommendations based on real data
  const recs = [];
  if (hasData) {
    // Highest expense category
    if (topExpenses.length > 0) {
      const top = topExpenses[0];
      const pct = d.totalExpenses > 0 ? (top.value / d.totalExpenses * 100).toFixed(0) : 0;
      recs.push({
        priority: 'high',
        title: `Оптимизация: ${top.name}`,
        insight: `«${top.name}» составляет ${pct}% расходов (${fmt(top.value)}). Это самая крупная статья — стоит проверить, нет ли возможности сократить.`,
        impact: `−${fmt(top.value * 0.1)} при сокращении на 10%`,
        confidence: 85,
      });
    }
    // Margin insight
    const marginNum = parseFloat(margin);
    if (marginNum < 20) {
      recs.push({
        priority: 'high',
        title: 'Низкая маржа прибыли',
        insight: `Текущая маржа ${margin}% — ниже здорового уровня (20%+). Следует либо увеличить доходы, либо сократить расходы.`,
        impact: `+${fmt(d.totalIncome * 0.05)} при росте дохода на 5%`,
        confidence: 90,
      });
    } else {
      recs.push({
        priority: 'medium',
        title: 'Хорошая маржа прибыли',
        insight: `Маржа ${margin}% — хороший показатель. Для дальнейшего роста рассмотри реинвестирование прибыли в маркетинг или найм.`,
        impact: `Маржа ${margin}%`,
        confidence: 80,
      });
    }
    // Flagged transactions
    if (d.flagged.length > 0) {
      recs.push({
        priority: 'medium',
        title: `${d.flagged.length} транзакций без категории`,
        insight: `Некатегоризованные транзакции искажают аналитику. Назначь категории в Bookkeeping для точных отчётов.`,
        impact: 'Точность данных +' + (d.totalTransactions > 0 ? Math.round(d.flagged.length / d.totalTransactions * 100) : 0) + '%',
        confidence: 95,
      });
    }
    // Monthly trend
    if (d.monthlyData.length >= 3) {
      const last3 = d.monthlyData.slice(-3);
      const avgRevenue = last3.reduce((s, m) => s + m.revenue, 0) / 3;
      const latestRevenue = last3[last3.length - 1].revenue;
      if (latestRevenue > avgRevenue * 1.1) {
        recs.push({
          priority: 'medium',
          title: 'Ускорение доходов',
          insight: `Последний месяц (${fmt(latestRevenue)}) выше среднего за 3 мес. (${fmt(avgRevenue)}) на ${((latestRevenue / avgRevenue - 1) * 100).toFixed(0)}%. Положительный тренд.`,
          impact: 'Рост выше среднего',
          confidence: 78,
        });
      }
    }
  }

  const priorityColors: Record<string, string> = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-orange-200 bg-orange-50',
  };
  const priorityBadge: Record<string, React.ReactElement> = {
    high: <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Высокий</Badge>,
    medium: <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">Средний</Badge>,
  };

  return (
    <div className="space-y-6">

      {!hasData ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Нет данных для аналитики</h3>
          <p className="text-slate-500">Загрузи выписку в <strong>Audit & Bookkeeping</strong> — аналитика появится автоматически</p>
        </Card>
      ) : (
        <>
          {/* KPI summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Доходы', value: fmt(d.totalIncome), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'Расходы', value: fmt(d.totalExpenses), icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-100' },
              { label: 'Прибыль', value: fmt(d.netProfit), icon: DollarSign, color: d.netProfit >= 0 ? 'text-blue-600' : 'text-red-600', bg: d.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100' },
              { label: 'Маржа', value: margin + '%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <Card key={i} className="p-5">
                  <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon size={20} className={k.color} />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                  <p className="text-xl font-bold text-slate-900">{k.value}</p>
                </Card>
              );
            })}
          </div>

          {/* Revenue chart with forecast */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Динамика доходов и расходов</h3>
            <p className="text-sm text-slate-500 mb-4">Фактические данные + прогноз на 3 месяца</p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="biRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="biExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => fmt(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Доходы" stroke="#3b82f6" fill="url(#biRev)" />
                <Area type="monotone" dataKey="expenses" name="Расходы" stroke="#f97316" fill="url(#biExp)" />
                <Line type="monotone" dataKey="forecast" name="Прогноз доходов" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Category breakdown + profit bar */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Расходы по категориям</h3>
              {topExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topExpenses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={v => fmt(v)} />
                    <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={110} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="value" name="Сумма" radius={[0,4,4,0]}>
                      {topExpenses.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm">Нет расходов</p>}
            </Card>

            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Прибыль по месяцам</h3>
              {d.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={d.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="profit" name="Прибыль" radius={[4,4,0,0]}>
                      {d.monthlyData.map((m, i) => <Cell key={i} fill={m.profit >= 0 ? '#22c55e' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm">Нет данных</p>}
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">AI-рекомендации</h3>
                <p className="text-sm text-slate-500">На основе твоих реальных данных</p>
              </div>
            </div>
            <div className="space-y-4">
              {recs.map((rec, i) => (
                <Card key={i} className={`p-4 border-2 ${priorityColors[rec.priority]}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={18} className="text-yellow-600 shrink-0" />
                      <h4 className="font-semibold text-slate-900 text-sm">{rec.title}</h4>
                      {priorityBadge[rec.priority]}
                    </div>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Target size={10} />{rec.confidence}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-700 ml-6 mb-2">{rec.insight}</p>
                  <p className="text-xs font-medium text-green-700 ml-6">{rec.impact}</p>
                </Card>
              ))}
            </div>
          </Card>

          {/* Income vs Expense pie */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Структура расходов</h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={d.expenseByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {d.expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {d.expenseByCategory.map((item, i) => {
                  const pct = d.totalExpenses > 0 ? (item.value / d.totalExpenses * 100).toFixed(1) : 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-sm text-slate-700 flex-1 truncate">{item.name}</span>
                      <span className="text-sm font-medium text-slate-900">{pct}%</span>
                      <span className="text-xs text-slate-500">{fmt(item.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
