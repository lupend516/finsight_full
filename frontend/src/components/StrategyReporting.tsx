import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  TrendingUp, TrendingDown, DollarSign, Download,
  Loader2, Upload, FileText, BarChart3, Wallet, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useFinancialData } from '../hooks/useFinancialData';
import { bookkeeping, type PnLMonth, type Category } from '../lib/api';

const fmt = (n: number, currency = true) => {
  const abs = Math.abs(n);
  const str = abs >= 1_000_000
    ? (abs / 1_000_000).toFixed(2) + 'M'
    : abs >= 1_000
    ? (abs / 1_000).toFixed(1) + 'K'
    : abs.toLocaleString('ru', { maximumFractionDigits: 0 });
  return (currency ? '' : '') + (n < 0 ? '−' : '') + str;
};

function exportCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = filename;
  a.click();
}

const MONTH_NAMES = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

// Collect all unique category names across months for a given section
function allCategories(data: PnLMonth[], section: 'variable_costs' | 'fixed_costs' | 'below_ebitda'): string[] {
  const set = new Set<string>();
  data.forEach(m => (m[section] || []).forEach(c => set.add(c.category)));
  return Array.from(set).sort();
}

function getCatAmount(m: PnLMonth, section: 'variable_costs' | 'fixed_costs' | 'below_ebitda', cat: string): number {
  return (m[section] || []).find(c => c.category === cat)?.amount ?? 0;
}

export function StrategyReporting() {
  const { company } = useAuth();
  const companyId = company?.id || '';
  const d = useFinancialData(companyId);

  const [reportMode, setReportMode] = useState<'dds' | 'pnl'>('dds');
  const [pnlData, setPnlData] = useState<PnLMonth[]>([]);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [movingCat, setMovingCat] = useState<string | null>(null); // category name being moved

  // name → Category (for section override)
  const catByName = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c]));

  const loadPnL = () => {
    if (!companyId) return;
    setPnlLoading(true);
    return Promise.all([
      bookkeeping.getPnL(companyId),
      bookkeeping.getCategories(companyId),
    ])
      .then(([pnl, cats]) => {
        setPnlData(Array.isArray(pnl) ? pnl : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {})
      .finally(() => setPnlLoading(false));
  };

  const moveCategoryTo = async (catName: string, newSection: 'variable' | 'fixed' | 'below') => {
    const cat = catByName[catName.toLowerCase()];
    if (!cat) return;
    setMovingCat(catName);
    try {
      await bookkeeping.updateCategory(companyId, cat.id, { pnl_section: newSection });
      await loadPnL();
    } finally {
      setMovingCat(null);
    }
  };

  useEffect(() => {
    if (reportMode === 'pnl' && companyId) {
      loadPnL();
    }
  }, [reportMode, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (d.loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-blue-600" /></div>;
  }

  const hasData = d.totalTransactions > 0;
  const margin = d.totalIncome > 0 ? (d.netProfit / d.totalIncome * 100).toFixed(1) : '0';
  const accuracy = d.totalTransactions > 0 ? Math.round(d.categorized / d.totalTransactions * 100) : 0;

  // ── ОПиУ: показываем последние 6 месяцев ──────────────────────────
  const pnlMonths = pnlData.slice(-6);

  // Totals across all displayed months
  const pnlTotals = pnlMonths.reduce((acc, m) => ({
    revenue:          acc.revenue          + (m.revenue          ?? 0),
    var_total:        acc.var_total        + (m.var_total        ?? 0),
    gross_profit:     acc.gross_profit     + (m.gross_profit     ?? 0),
    fixed_total:      acc.fixed_total      + (m.fixed_total      ?? 0),
    operating_profit: acc.operating_profit + (m.operating_profit ?? 0),
    below_total:      acc.below_total      + (m.below_ebitda_total ?? 0),
    net_profit:       acc.net_profit       + (m.net_profit       ?? 0),
  }), { revenue: 0, var_total: 0, gross_profit: 0, fixed_total: 0, operating_profit: 0, below_total: 0, net_profit: 0 });

  const variableCategories = allCategories(pnlMonths, 'variable_costs');
  const fixedCategories    = allCategories(pnlMonths, 'fixed_costs');
  const belowCategories    = allCategories(pnlMonths, 'below_ebitda');

  const catTotals = (section: 'variable_costs' | 'fixed_costs' | 'below_ebitda', cat: string) =>
    pnlMonths.reduce((s, m) => s + getCatAmount(m, section, cat), 0);

  // ── ОПиУ: график ──────────────────────────────────────────────────
  const pnlChartData = pnlMonths.map(m => ({
    month: `${MONTH_NAMES[m.month - 1]} ${String(m.year).slice(2)}`,
    revenue: m.revenue,
    gross: m.gross_profit,
    operating: m.operating_profit,
    net: m.net_profit,
  }));

  // ── ДДС: простой P&L
  const plRows = [
    { label: 'Доходы (всего)', value: d.totalIncome, bold: false, indent: false },
    ...d.expenseByCategory.map(c => ({ label: `  ${c.name}`, value: -c.value, bold: false, indent: true })),
    { label: 'Расходы (всего)', value: -d.totalExpenses, bold: false, indent: false },
    { label: 'Чистая прибыль', value: d.netProfit, bold: true, indent: false },
    { label: 'Маржа прибыли', value: parseFloat(margin), bold: true, indent: false, isPercent: true },
  ];

  const downloadPL = () => {
    const rows = [['Статья', 'Сумма']];
    rows.push(['Доходы (всего)', String(d.totalIncome)]);
    for (const c of d.expenseByCategory) rows.push([c.name, String(-c.value)]);
    rows.push(['Расходы (всего)', String(-d.totalExpenses)]);
    rows.push(['Чистая прибыль', String(d.netProfit)]);
    rows.push(['Маржа', margin + '%']);
    exportCSV(rows, 'pl_report.csv');
  };

  const downloadTx = () => {
    const rows = [['Дата', 'Описание', 'Тип', 'Категория', 'Сумма', 'Статус']];
    for (const t of d.recent) {
      rows.push([
        new Date(t.date).toLocaleDateString('ru'),
        t.description, t.type, t.category,
        String(t.amount), t.status,
      ]);
    }
    exportCSV(rows, 'transactions.csv');
  };

  const downloadPnL = () => {
    const monthLabels = pnlMonths.map(m => `${MONTH_NAMES[m.month-1]} ${m.year}`);
    const header = ['Статья', ...monthLabels, 'Итого'];
    const rows = [header];
    const addRow = (label: string, vals: number[]) => {
      rows.push([label, ...vals.map(String), String(vals.reduce((a, b) => a + b, 0))]);
    };
    addRow('Выручка', pnlMonths.map(m => m.revenue));
    rows.push(['— ПЕРЕМЕННЫЕ РАСХОДЫ —', ...pnlMonths.map(() => ''), '']);
    variableCategories.forEach(cat => addRow(cat, pnlMonths.map(m => getCatAmount(m, 'variable_costs', cat))));
    addRow('Итого переменные', pnlMonths.map(m => m.var_total));
    addRow('Валовая прибыль', pnlMonths.map(m => m.gross_profit));
    rows.push(['— ПОСТОЯННЫЕ РАСХОДЫ —', ...pnlMonths.map(() => ''), '']);
    fixedCategories.forEach(cat => addRow(cat, pnlMonths.map(m => getCatAmount(m, 'fixed_costs', cat))));
    addRow('Итого постоянные', pnlMonths.map(m => m.fixed_total));
    addRow('Операционная прибыль', pnlMonths.map(m => m.operating_profit));
    rows.push(['— НИЖЕ EBITDA —', ...pnlMonths.map(() => ''), '']);
    belowCategories.forEach(cat => addRow(cat, pnlMonths.map(m => getCatAmount(m, 'below_ebitda', cat))));
    addRow('Итого ниже EBITDA', pnlMonths.map(m => m.below_ebitda_total));
    addRow('Чистая прибыль', pnlMonths.map(m => m.net_profit));
    exportCSV(rows, 'pnl_report.csv');
  };

  return (
    <div className="space-y-6">

      {/* ── Переключатель ДДС / ОПиУ ── */}
      {hasData && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setReportMode('dds')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${reportMode === 'dds' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ДДС (кассовый)
            </button>
            <button
              onClick={() => setReportMode('pnl')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${reportMode === 'pnl' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ОПиУ (начисление)
            </button>
          </div>
          {reportMode === 'pnl' && (
            <Button variant="outline" size="sm" onClick={loadPnL} disabled={pnlLoading}>
              <RefreshCw size={14} className={pnlLoading ? 'animate-spin' : ''} />
            </Button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          РЕЖИМ ОПиУ
      ══════════════════════════════════════════════ */}
      {hasData && reportMode === 'pnl' && (
        <div className="space-y-6">
          {pnlLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* KPI карточки */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Выручка',             value: fmt(pnlTotals.revenue),          color: 'text-green-600',   bg: 'bg-green-100',   icon: TrendingUp  },
                  { label: 'Валовая прибыль',      value: fmt(pnlTotals.gross_profit),     color: pnlTotals.gross_profit     >= 0 ? 'text-blue-600'    : 'text-red-600', bg: 'bg-blue-100',   icon: DollarSign  },
                  { label: 'Операц. прибыль',      value: fmt(pnlTotals.operating_profit), color: pnlTotals.operating_profit >= 0 ? 'text-purple-600'  : 'text-red-600', bg: pnlTotals.operating_profit >= 0 ? 'bg-purple-100' : 'bg-red-100', icon: BarChart3   },
                  { label: 'Чистая прибыль',       value: fmt(pnlTotals.net_profit),       color: pnlTotals.net_profit       >= 0 ? 'text-emerald-600' : 'text-red-600', bg: pnlTotals.net_profit       >= 0 ? 'bg-emerald-100' : 'bg-red-100', icon: TrendingDown },
                ].map((k, i) => {
                  const Icon = k.icon;
                  return (
                    <Card key={i} className="p-5">
                      <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>
                        <Icon size={20} className={k.color} />
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                      <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                    </Card>
                  );
                })}
              </div>

              {/* Таблица ОПиУ — динамические категории */}
              {pnlMonths.length > 0 ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Отчёт о прибылях и убытках (ОПиУ)</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Метод начисления · расходы — в периоде начисления</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={downloadPnL}>
                      <Download size={14} className="mr-2" />CSV
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-2 pr-4 font-semibold text-slate-700 min-w-[200px]">Статья</th>
                          {pnlMonths.map(m => (
                            <th key={`${m.year}-${m.month}`} className="text-right py-2 px-3 font-semibold text-slate-600 whitespace-nowrap">
                              {MONTH_NAMES[m.month - 1]} {String(m.year).slice(2)}
                            </th>
                          ))}
                          <th className="text-right py-2 pl-3 font-semibold text-slate-800 whitespace-nowrap border-l border-slate-200">Итого</th>
                        </tr>
                      </thead>
                      <tbody>

                        {/* ── Выручка ── */}
                        <PnLRow label="Выручка" vals={pnlMonths.map(m => m.revenue)} total={pnlTotals.revenue} color="text-green-700" bold />

                        {/* ── Переменные расходы ── */}
                        <SectionRow label="Переменные расходы" cols={pnlMonths.length} />
                        {variableCategories.map(cat => (
                          <PnLRow key={cat} label={cat} indent
                            vals={pnlMonths.map(m => getCatAmount(m, 'variable_costs', cat))}
                            total={catTotals('variable_costs', cat)}
                            color="text-slate-600" expense
                            currentSection="variable"
                            onMove={moveCategoryTo}
                            moving={movingCat === cat} />
                        ))}
                        {variableCategories.length === 0 && <EmptyRow cols={pnlMonths.length} />}
                        <PnLRow label="Итого переменные" vals={pnlMonths.map(m => m.var_total)} total={pnlTotals.var_total} color="text-slate-700" bold expense />

                        {/* ── Валовая прибыль ── */}
                        <PnLRow label="Валовая прибыль" vals={pnlMonths.map(m => m.gross_profit)} total={pnlTotals.gross_profit}
                          color={pnlTotals.gross_profit >= 0 ? 'text-blue-700' : 'text-red-600'} bold border
                          margin={pnlTotals.revenue > 0 ? Math.round(pnlTotals.gross_profit / pnlTotals.revenue * 100) : 0} />

                        {/* ── Постоянные расходы ── */}
                        <SectionRow label="Постоянные расходы" cols={pnlMonths.length} />
                        {fixedCategories.map(cat => (
                          <PnLRow key={cat} label={cat} indent
                            vals={pnlMonths.map(m => getCatAmount(m, 'fixed_costs', cat))}
                            total={catTotals('fixed_costs', cat)}
                            color="text-slate-600" expense
                            currentSection="fixed"
                            onMove={moveCategoryTo}
                            moving={movingCat === cat} />
                        ))}
                        {fixedCategories.length === 0 && <EmptyRow cols={pnlMonths.length} />}
                        <PnLRow label="Итого постоянные" vals={pnlMonths.map(m => m.fixed_total)} total={pnlTotals.fixed_total} color="text-slate-700" bold expense />

                        {/* ── Операционная прибыль ── */}
                        <PnLRow label="Операционная прибыль" vals={pnlMonths.map(m => m.operating_profit)} total={pnlTotals.operating_profit}
                          color={pnlTotals.operating_profit >= 0 ? 'text-purple-700' : 'text-red-600'} bold border
                          margin={pnlTotals.revenue > 0 ? Math.round(pnlTotals.operating_profit / pnlTotals.revenue * 100) : 0} />

                        {/* ── Ниже EBITDA ── */}
                        <SectionRow label="Расходы ниже EBITDA" cols={pnlMonths.length} />
                        {belowCategories.map(cat => (
                          <PnLRow key={cat} label={cat} indent
                            vals={pnlMonths.map(m => getCatAmount(m, 'below_ebitda', cat))}
                            total={catTotals('below_ebitda', cat)}
                            color="text-slate-600" expense
                            currentSection="below"
                            onMove={moveCategoryTo}
                            moving={movingCat === cat} />
                        ))}
                        {belowCategories.length === 0 && <EmptyRow cols={pnlMonths.length} />}
                        {belowCategories.length > 1 && (
                          <PnLRow label="Итого ниже EBITDA" vals={pnlMonths.map(m => m.below_ebitda_total)} total={pnlTotals.below_total} color="text-slate-700" bold expense />
                        )}

                        {/* ── Чистая прибыль ── */}
                        <PnLRow label="Чистая прибыль" vals={pnlMonths.map(m => m.net_profit)} total={pnlTotals.net_profit}
                          color={pnlTotals.net_profit >= 0 ? 'text-emerald-700' : 'text-red-600'} bold border
                          margin={pnlTotals.revenue > 0 ? Math.round(pnlTotals.net_profit / pnlTotals.revenue * 100) : 0} />

                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-slate-500">Нет данных ОПиУ. Загрузи транзакции и категоризируй их.</p>
                </Card>
              )}

              {/* График ОПиУ */}
              {pnlChartData.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">Динамика прибыли по уровням</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={pnlChartData} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => fmt(v, false)} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="revenue"   name="Выручка"             fill="#22c55e" radius={[3,3,0,0]} />
                      <Bar dataKey="gross"     name="Валовая прибыль"     fill="#3b82f6" radius={[3,3,0,0]} />
                      <Bar dataKey="operating" name="Операц. прибыль"     radius={[3,3,0,0]}>
                        {pnlChartData.map((e, i) => <Cell key={i} fill={e.operating >= 0 ? '#8b5cf6' : '#ef4444'} />)}
                      </Bar>
                      <Bar dataKey="net"        name="Чистая прибыль"     radius={[3,3,0,0]}>
                        {pnlChartData.map((e, i) => <Cell key={i} fill={e.net >= 0 ? '#10b981' : '#dc2626'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          РЕЖИМ ДДС (кассовый) или пустой экран
      ══════════════════════════════════════════════ */}
      {(!hasData || reportMode === 'dds') && (!hasData ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={28} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Нет данных для отчётов</h3>
          <p className="text-slate-500">Загрузи выписку в <strong>Audit & Bookkeeping</strong></p>
        </Card>
      ) : (
        <>
          {/* KPI карточки ДДС */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Доходы', value: fmt(d.totalIncome), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'Расходы', value: fmt(d.totalExpenses), icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-100' },
              { label: 'Чистый поток', value: (d.netProfit >= 0 ? '+' : '−') + fmt(Math.abs(d.netProfit)), icon: DollarSign, color: d.netProfit >= 0 ? 'text-blue-600' : 'text-red-600', bg: d.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100' },
              { label: 'Маржа', value: margin + '%', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' },
            ].map((k, i) => {
              const Icon = k.icon;
              return (
                <Card key={i} className="p-5">
                  <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon size={20} className={k.color} />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                  <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                </Card>
              );
            })}
          </div>

          {/* ДДС по месяцам — таблица */}
          {d.monthlyData.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">ДДС по месяцам</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Кассовый метод · по дате транзакции</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  const header = ['Статья', ...d.monthlyData.map(m => m.month), 'Итого'];
                  const rows = [header];
                  rows.push(['Поступления', ...d.monthlyData.map(m => String(m.revenue)), String(d.monthlyData.reduce((s, m) => s + m.revenue, 0))]);
                  rows.push(['Выбытия', ...d.monthlyData.map(m => String(m.expenses)), String(d.monthlyData.reduce((s, m) => s + m.expenses, 0))]);
                  rows.push(['Чистый поток', ...d.monthlyData.map(m => String(m.profit)), String(d.monthlyData.reduce((s, m) => s + m.profit, 0))]);
                  exportCSV(rows, 'dds_report.csv');
                }}>
                  <Download size={14} className="mr-2" />CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2 pr-4 font-semibold text-slate-700 min-w-[160px]">Статья</th>
                      {d.monthlyData.map(m => (
                        <th key={m.month} className="text-right py-2 px-3 font-semibold text-slate-600 whitespace-nowrap">{m.month}</th>
                      ))}
                      <th className="text-right py-2 pl-3 font-semibold text-slate-800 whitespace-nowrap border-l border-slate-200">Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Поступления */}
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-semibold text-green-700">Поступления</td>
                      {d.monthlyData.map(m => (
                        <td key={m.month} className="text-right py-2 px-3 font-medium text-green-700">
                          {m.revenue > 0 ? fmt(m.revenue) : '—'}
                        </td>
                      ))}
                      <td className="text-right py-2 pl-3 font-bold text-green-700 border-l border-slate-200">
                        {fmt(d.monthlyData.reduce((s, m) => s + m.revenue, 0))}
                      </td>
                    </tr>
                    {/* Выбытия */}
                    <tr className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-semibold text-red-600">Выбытия</td>
                      {d.monthlyData.map(m => (
                        <td key={m.month} className="text-right py-2 px-3 font-medium text-red-600">
                          {m.expenses > 0 ? fmt(m.expenses) : '—'}
                        </td>
                      ))}
                      <td className="text-right py-2 pl-3 font-bold text-red-600 border-l border-slate-200">
                        {fmt(d.monthlyData.reduce((s, m) => s + m.expenses, 0))}
                      </td>
                    </tr>
                    {/* Чистый денежный поток */}
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="py-2.5 pr-4 font-bold text-slate-800">Чистый денежный поток</td>
                      {d.monthlyData.map(m => (
                        <td key={m.month} className={`text-right py-2.5 px-3 font-bold ${m.profit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                          {m.profit !== 0 ? (m.profit >= 0 ? '+' : '−') + fmt(Math.abs(m.profit)) : '—'}
                        </td>
                      ))}
                      <td className={`text-right py-2.5 pl-3 font-bold border-l border-slate-200 ${d.netProfit >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                        {(d.netProfit >= 0 ? '+' : '−') + fmt(Math.abs(d.netProfit))}
                      </td>
                    </tr>
                    {/* Маржинальность */}
                    <tr className="border-b border-slate-50">
                      <td className="py-2 pr-4 text-slate-500 text-xs">Маржинальность</td>
                      {d.monthlyData.map(m => {
                        const pct = m.revenue > 0 ? Math.round(m.profit / m.revenue * 100) : 0;
                        return (
                          <td key={m.month} className={`text-right py-2 px-3 text-xs font-medium ${pct >= 0 ? 'text-slate-500' : 'text-red-500'}`}>
                            {m.revenue > 0 ? pct + '%' : '—'}
                          </td>
                        );
                      })}
                      <td className={`text-right py-2 pl-3 text-xs font-semibold border-l border-slate-200 ${parseFloat(margin) >= 0 ? 'text-slate-600' : 'text-red-500'}`}>
                        {margin}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* P&L итоговый */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Итоговый отчёт</h3>
                  <p className="text-sm text-slate-500">{d.totalTransactions} транзакций · {accuracy}% категоризировано</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadPL}>
                <Download size={14} className="mr-2" />CSV
              </Button>
            </div>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Статья</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {plRows.map((row, i) => {
                    const isPercent = 'isPercent' in row && row.isPercent;
                    const displayVal = isPercent
                      ? row.value + '%'
                      : (row.value >= 0 ? '+' : '−') + fmt(Math.abs(row.value));
                    const valueColor = row.value >= 0 ? 'text-green-700' : 'text-red-600';
                    const isTotal = row.label === 'Расходы (всего)' || row.label === 'Доходы (всего)';
                    return (
                      <tr key={i} className={`border-b border-slate-100 last:border-0 ${row.bold ? 'bg-slate-50' : ''}`}>
                        <td className={`px-4 py-2.5 ${row.indent ? 'pl-8 text-slate-500' : 'text-slate-800'} ${row.bold ? 'font-semibold' : ''}`}>
                          {row.label}
                        </td>
                        <td className={`px-4 py-2.5 text-right ${row.bold ? 'font-bold' : 'font-medium'} ${isTotal ? 'text-slate-700' : valueColor}`}>
                          {displayVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Бар-чарт по месяцам */}
          {d.monthlyData.length > 0 && (
            <Card className="p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Динамика по месяцам</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={d.monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => fmt(v, false)} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="revenue"  name="Поступления" fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="expenses" name="Выбытия"     fill="#f97316" radius={[3,3,0,0]} />
                  <Bar dataKey="profit"   name="Чистый поток" radius={[3,3,0,0]}>
                    {d.monthlyData.map((m, i) => <Cell key={i} fill={m.profit >= 0 ? '#22c55e' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Расходы по категориям */}
          {d.expenseByCategory.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Wallet size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Расходы по категориям</h3>
                  <p className="text-sm text-slate-500">Детализация</p>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-semibold text-slate-700">Категория</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">Сумма</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700">% от расходов</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.expenseByCategory.map((c, i) => {
                      const pct = d.totalExpenses > 0 ? (c.value / d.totalExpenses * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2.5 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                            <span className="text-slate-800">{c.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-red-600">{fmt(c.value)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{pct}%</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">Итого расходы</td>
                      <td className="px-4 py-2.5 text-right font-bold text-red-600">{fmt(d.totalExpenses)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-700">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Экспорт */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Экспорт данных</h3>
                  <p className="text-sm text-slate-500">{d.totalTransactions} транзакций готово к экспорту</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadTx}>
                  <Download size={14} className="mr-2" />Транзакции CSV
                </Button>
                <Button onClick={downloadPL} className="bg-blue-600 hover:bg-blue-700">
                  <Download size={14} className="mr-2" />P&amp;L отчёт CSV
                </Button>
              </div>
            </div>
          </Card>
        </>
      ))}
    </div>
  );
}

// ── Вспомогательные компоненты таблицы ОПиУ ──────────────────────────────

function SectionRow({ label, cols }: { label: string; cols: number }) {
  return (
    <tr className="bg-slate-50">
      <td colSpan={cols + 2} className="py-1.5 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </td>
    </tr>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols + 2} className="py-1 pl-5 text-xs text-slate-300 italic">нет данных</td>
    </tr>
  );
}

const SECTION_LABELS: Record<string, string> = {
  variable: 'Перемен.',
  fixed:    'Постоян.',
  below:    'Ниже EBITDA',
};

function PnLRow({
  label, vals, total, color, bold, indent, expense, border, margin: marginPct,
  currentSection, onMove, moving,
}: {
  label: string;
  vals: number[];
  total: number;
  color: string;
  bold?: boolean;
  indent?: boolean;
  expense?: boolean;
  border?: boolean;
  margin?: number;
  currentSection?: 'variable' | 'fixed' | 'below';
  onMove?: (cat: string, section: 'variable' | 'fixed' | 'below') => void;
  moving?: boolean;
}) {
  const sections: Array<'variable' | 'fixed' | 'below'> = ['variable', 'fixed', 'below'];

  return (
    <tr className={`${border ? 'border-t-2 border-slate-200' : 'border-b border-slate-50'} group`}>
      <td className={`py-2 pr-2 ${indent ? 'pl-5' : ''} ${bold ? 'font-semibold' : ''} ${color}`}>
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          {/* Кнопка перемещения между секциями — только для категорий (не итоговых строк) */}
          {currentSection && onMove && (
            moving ? (
              <Loader2 size={11} className="animate-spin text-slate-400 shrink-0" />
            ) : (
              <div className="relative inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                <select
                  className="text-xs border border-slate-200 rounded px-1 py-0 bg-white text-slate-500 cursor-pointer hover:border-blue-400 focus:outline-none"
                  value={currentSection}
                  onChange={e => onMove(label, e.target.value as 'variable' | 'fixed' | 'below')}
                  onClick={e => e.stopPropagation()}
                >
                  {sections.map(s => (
                    <option key={s} value={s}>{SECTION_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>
      </td>
      {vals.map((v, i) => {
        const vColor = v === 0 ? 'text-slate-300'
          : expense ? 'text-slate-600'
          : v < 0 ? 'text-red-600'
          : color;
        return (
          <td key={i} className={`text-right py-2 px-3 text-xs ${bold ? 'font-semibold' : ''} ${vColor}`}>
            {Number.isFinite(v) && v !== 0 ? fmt(v) : '—'}
          </td>
        );
      })}
      <td className={`text-right py-2 pl-3 text-xs border-l border-slate-200 ${bold ? 'font-bold' : 'font-medium'} ${total < 0 ? 'text-red-600' : color}`}>
        <div>{total !== 0 ? fmt(total) : '—'}</div>
        {marginPct !== undefined && (
          <div className="text-slate-400 font-normal text-xs">{marginPct}%</div>
        )}
      </td>
    </tr>
  );
}
