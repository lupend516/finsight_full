import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard,
  AlertCircle, CheckCircle2, Info, ArrowUpRight, ArrowDownRight,
  Brain, Sparkles, Loader2, Upload, Tag
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFinancialData } from '../hooks/useFinancialData';

const fmt = (n: number) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000
    ? (n / 1_000).toFixed(0) + 'K'
    : n.toLocaleString('ru', { maximumFractionDigits: 0 });

export function MainDashboard() {
  const { company } = useAuth();
  const companyId = company?.id || '';
  const d = useFinancialData(companyId);

  if (d.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const hasData = d.totalTransactions > 0;

  // KPI cards
  const kpis = [
    {
      title: 'Доходы (всего)',
      value: fmt(d.totalIncome),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Расходы (всего)',
      value: fmt(d.totalExpenses),
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Чистая прибыль',
      value: fmt(d.netProfit),
      icon: d.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: d.netProfit >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: d.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100',
    },
    {
      title: 'Требуют проверки',
      value: String(d.flagged.length),
      icon: AlertCircle,
      color: d.flagged.length > 0 ? 'text-orange-600' : 'text-slate-500',
      bgColor: d.flagged.length > 0 ? 'bg-orange-100' : 'bg-slate-100',
    },
  ];

  // AI Insights based on real data
  const insights = [];
  if (hasData) {
    if (d.netProfit > 0) {
      insights.push({
        type: 'positive' as const,
        icon: CheckCircle2,
        title: 'Положительная прибыль',
        message: `Чистая прибыль составляет ${fmt(d.netProfit)} — доходы превышают расходы на ${((d.netProfit / d.totalIncome) * 100).toFixed(1)}%.`,
      });
    } else {
      insights.push({
        type: 'warning' as const,
        icon: AlertCircle,
        title: 'Расходы превышают доходы',
        message: `Дефицит составляет ${fmt(Math.abs(d.netProfit))}. Проверьте крупные статьи расходов во вкладке Транзакции.`,
      });
    }
    if (d.flagged.length > 0) {
      insights.push({
        type: 'warning' as const,
        icon: AlertCircle,
        title: `${d.flagged.length} транзакций требуют проверки`,
        message: 'AI не смог уверенно категоризировать эти транзакции. Перейди в Bookkeeping и назначь категории вручную.',
      });
    }
    if (d.expenseByCategory.length > 0) {
      const top = d.expenseByCategory[0];
      const pct = d.totalExpenses > 0 ? ((top.value / d.totalExpenses) * 100).toFixed(0) : 0;
      insights.push({
        type: 'info' as const,
        icon: Info,
        title: `Основная статья расходов: ${top.name}`,
        message: `«${top.name}» составляет ${pct}% от всех расходов (${fmt(top.value)}).`,
      });
    }
    if (d.monthlyData.length >= 2) {
      const last = d.monthlyData[d.monthlyData.length - 1];
      const prev = d.monthlyData[d.monthlyData.length - 2];
      if (prev.revenue > 0) {
        const change = ((last.revenue - prev.revenue) / prev.revenue * 100).toFixed(1);
        const positive = last.revenue >= prev.revenue;
        insights.push({
          type: positive ? 'positive' as const : 'info' as const,
          icon: positive ? CheckCircle2 : Info,
          title: `Доходы ${positive ? 'выросли' : 'снизились'} на ${Math.abs(parseFloat(change))}%`,
          message: `${last.month}: ${fmt(last.revenue)} vs ${prev.month}: ${fmt(prev.revenue)}.`,
        });
      }
    }
  }

  const insightColors = {
    positive: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
    info:     { bg: 'bg-blue-50',  border: 'border-blue-200',  icon: 'text-blue-600' },
    warning:  { bg: 'bg-orange-50',border: 'border-orange-200',icon: 'text-orange-600' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Финансовый обзор</h3>
          <p className="text-sm text-slate-500">
            {hasData
              ? `${d.totalTransactions} транзакций · обновлено только что`
              : 'Загрузи файл в Bookkeeping чтобы увидеть данные'}
          </p>
        </div>
        <Badge className={`${d.netProfit >= 0 && hasData ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'} hover:bg-green-100`}>
          {hasData ? (d.netProfit >= 0 ? '✓ В плюсе' : '⚠ В минусе') : 'Нет данных'}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon size={24} className={kpi.color} />
                </div>
              </div>
              <h4 className="text-sm text-slate-600 mb-1">{kpi.title}</h4>
              <p className={`text-2xl font-bold ${hasData ? 'text-slate-900' : 'text-slate-300'}`}>
                {hasData ? kpi.value : '—'}
              </p>
            </Card>
          );
        })}
      </div>

      {!hasData ? (
        /* Empty state */
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Нет данных для отображения</h3>
          <p className="text-slate-500 mb-1">Загрузи выписку банка в разделе <strong>Audit & Bookkeeping</strong></p>
          <p className="text-sm text-slate-400">Поддерживаются CSV, Excel и PDF</p>
        </Card>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue vs Expenses */}
            <Card className="lg:col-span-2 p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Доходы vs Расходы</h3>
              <p className="text-sm text-slate-500 mb-4">По месяцам</p>
              {d.monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={d.monthlyData}>
                    <defs>
                      <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="revenue" name="Доходы" stroke="#3b82f6" fillOpacity={1} fill="url(#gradRev)" />
                    <Area type="monotone" dataKey="expenses" name="Расходы" stroke="#f97316" fillOpacity={1} fill="url(#gradExp)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                  Недостаточно данных для графика
                </div>
              )}
            </Card>

            {/* Expense Breakdown */}
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Расходы по категориям</h3>
              <p className="text-sm text-slate-500 mb-4">Все периоды</p>
              {d.expenseByCategory.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={d.expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                        {d.expenseByCategory.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-3">
                    {d.expenseByCategory.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-xs text-slate-700 truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-900">{fmt(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Нет расходов</div>
              )}
            </Card>
          </div>

          {/* AI Insights + Recent */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-1">
                    AI Insights <Sparkles size={14} className="text-yellow-500" />
                  </h3>
                  <p className="text-xs text-slate-500">На основе твоих данных</p>
                </div>
              </div>
              {insights.length > 0 ? (
                <div className="space-y-3">
                  {insights.map((ins, i) => {
                    const Icon = ins.icon;
                    const c = insightColors[ins.type];
                    return (
                      <div key={i} className={`${c.bg} border ${c.border} rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                          <Icon size={18} className={`${c.icon} shrink-0 mt-0.5`} />
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm mb-0.5">{ins.title}</h4>
                            <p className="text-sm text-slate-700">{ins.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Загрузи больше данных для инсайтов</p>
              )}
            </Card>

            {/* Recent transactions */}
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Последние транзакции</h3>
              <div className="space-y-3">
                {d.recent.slice(0, 7).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{tx.description}</p>
                        <p className="text-xs text-slate-400">{tx.category}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-slate-700'}`}>
                      {tx.type === 'income' ? '+' : ''}{fmt(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Cash Flow Bar */}
          {d.monthlyData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Чистая прибыль по месяцам</h3>
              <p className="text-sm text-slate-500 mb-4">Доходы минус расходы</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="profit" name="Прибыль" radius={[6,6,0,0]}
                    fill="#8b5cf6"
                    label={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
