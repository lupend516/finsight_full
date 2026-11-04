import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  TrendingUp, TrendingDown, Package, Search, RefreshCw,
  Loader2, ShoppingBag, BarChart3, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { bookkeeping, products as productsApi, type Transaction, type Product } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

const fmt = (n: number) => n.toLocaleString('ru', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ─── COGS helper ─────────────────────────────
function calcCogs(tx: Transaction, productsList: Product[]): number {
  const qty = (tx.quantity && tx.quantity > 0) ? tx.quantity : 1;
  if (tx.product_id && tx.product_id !== '__none__') {
    const prod = productsList.find(p => p.id === tx.product_id);
    if (prod) return qty * prod.cost_price;
  }
  if (tx.product_name) {
    const prod = productsList.find(p => p.name.toLowerCase() === tx.product_name!.toLowerCase());
    if (prod) return qty * prod.cost_price;
  }
  return 0;
}

// ══════════════════════════════════════════════
export function SalesModule() {
  const { company } = useAuth();
  const companyId = company?.id || '';

  const [salesTab, setSalesTab] = useState<'list' | 'analytics'>('list');
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // inline product picker: txId → { productId, quantity }
  const [inlinePicker, setInlinePicker] = useState<{
    txId: string; productId: string; quantity: string;
  } | null>(null);

  const load = () => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      bookkeeping.getTransactions(companyId, { type: 'income', limit: 1000 }),
      productsApi.list(companyId),
    ])
      .then(([txRes, prods]) => {
        setTxns(Array.isArray(txRes?.transactions) ? txRes.transactions : []);
        setProductsList(Array.isArray(prods) ? prods : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProduct = async () => {
    if (!inlinePicker || !companyId) return;
    const { txId, productId, quantity } = inlinePicker;
    if (productId === '__none__') { setInlinePicker(null); return; }
    setSaving(true);
    try {
      const prod = productsList.find(p => p.id === productId);
      const updated = await bookkeeping.updateTransaction(companyId, txId, {
        product_id:   productId,
        product_name: prod?.name,
        quantity:     quantity ? parseFloat(quantity) : undefined,
      } as Partial<Transaction>);
      setTxns(prev => prev.map(t => t.id === txId ? updated : t));
      setInlinePicker(null);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  // ─── Enriched rows ────────────────────────
  const rows = txns.map(tx => {
    const cogs = calcCogs(tx, productsList);
    const gp   = tx.amount - cogs;
    const margin = tx.amount > 0 ? Math.round(gp / tx.amount * 100) : 0;
    const prodName = tx.product_name ||
      (tx.product_id && tx.product_id !== '__none__'
        ? productsList.find(p => p.id === tx.product_id)?.name
        : undefined);
    return { tx, cogs, gp, margin, prodName };
  });

  const filtered = rows.filter(r =>
    !search ||
    r.tx.description.toLowerCase().includes(search.toLowerCase()) ||
    (r.prodName || '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── Totals ───────────────────────────────
  const totalRevenue = rows.reduce((s, r) => s + r.tx.amount, 0);
  const totalCogs    = rows.reduce((s, r) => s + r.cogs, 0);
  const totalGP      = totalRevenue - totalCogs;
  const avgMargin    = totalRevenue > 0 ? Math.round(totalGP / totalRevenue * 100) : 0;

  // ─── Analytics: monthly revenue ──────────
  const monthlyMap = new Map<string, { revenue: number; cogs: number }>();
  rows.forEach(r => {
    const d    = new Date(r.tx.date);
    const key  = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const cur  = monthlyMap.get(key) ?? { revenue: 0, cogs: 0 };
    monthlyMap.set(key, { revenue: cur.revenue + r.tx.amount, cogs: cur.cogs + r.cogs });
  });
  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, v]) => {
      const [y, m] = key.split('-');
      return {
        label: `${MONTHS[parseInt(m) - 1]} ${String(y).slice(2)}`,
        revenue: v.revenue,
        cogs:    v.cogs,
        gp:      v.revenue - v.cogs,
      };
    });

  // ─── Analytics: top products ──────────────
  const prodMap = new Map<string, { name: string; revenue: number; cogs: number; qty: number; count: number }>();
  rows.forEach(r => {
    if (!r.prodName) return;
    const cur = prodMap.get(r.prodName) ?? { name: r.prodName, revenue: 0, cogs: 0, qty: 0, count: 0 };
    prodMap.set(r.prodName, {
      ...cur,
      revenue: cur.revenue + r.tx.amount,
      cogs:    cur.cogs    + r.cogs,
      qty:     cur.qty     + (r.tx.quantity || 1),
      count:   cur.count   + 1,
    });
  });
  const topProducts = Array.from(prodMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // ─── Pie colors ──────────────────────────
  const PIE_COLORS = ['#6366f1','#22c55e','#f59e0b','#ec4899','#14b8a6','#8b5cf6','#0ea5e9','#f97316'];

  return (
    <div className="space-y-6">
      {/* ── Tabs + refresh ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(['list', 'analytics'] as const).map(t => (
            <button
              key={t}
              onClick={() => setSalesTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                salesTab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'list' ? 'Продажи' : 'Аналитика'}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* ── KPI cards (always visible) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Выручка',         value: fmt(totalRevenue), color: 'text-green-600',  bg: 'bg-green-100',  Icon: TrendingUp  },
          { label: 'Себестоимость',   value: fmt(totalCogs),    color: 'text-orange-500', bg: 'bg-orange-100', Icon: Package     },
          { label: 'Валовая прибыль', value: fmt(totalGP),      color: totalGP >= 0 ? 'text-blue-600' : 'text-red-500', bg: 'bg-blue-100', Icon: DollarSign },
          { label: 'Средняя маржа',   value: `${avgMargin}%`,   color: avgMargin >= 20 ? 'text-green-600' : 'text-orange-500', bg: 'bg-purple-100', Icon: BarChart3 },
        ].map(k => {
          const Icon = k.Icon;
          return (
            <Card key={k.label} className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 ${k.bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={18} className={k.color} />
                </div>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </Card>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : (

        <>
          {/* ════════════════════════════════
               ВКЛ: СПИСОК ПРОДАЖ
          ════════════════════════════════ */}
          {salesTab === 'list' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Поиск..."
                  className="pl-8"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {filtered.length === 0 ? (
                <Card className="p-12 text-center">
                  <ShoppingBag size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 mb-1">Нет продаж</p>
                  <p className="text-xs text-slate-400">Загрузи выписку и назначь категорию «Продажи» транзакциям</p>
                </Card>
              ) : (
                <Card className="overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead>Товар / услуга</TableHead>
                        <TableHead className="text-right">Кол-во</TableHead>
                        <TableHead className="text-right">Выручка</TableHead>
                        <TableHead className="text-right">Себестоимость</TableHead>
                        <TableHead className="text-right">Вал. прибыль</TableHead>
                        <TableHead className="text-right">Маржа</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.flatMap(({ tx, cogs, gp, margin, prodName }) => {
                        const picker = inlinePicker?.txId === tx.id ? inlinePicker : null;
                        const mainRow = (
                          <TableRow key={tx.id}>
                            <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString('ru')}
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <p className="font-medium text-slate-900 text-sm truncate" title={tx.description}>
                                {tx.description}
                              </p>
                              <p className="text-xs text-slate-400">{tx.category}</p>
                            </TableCell>
                            <TableCell>
                              {prodName ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-slate-700">{prodName}</span>
                                  <button
                                    className="text-xs text-slate-400 hover:text-blue-500 ml-1"
                                    title="Изменить товар"
                                    onClick={() => setInlinePicker({ txId: tx.id, productId: tx.product_id || '__none__', quantity: tx.quantity ? String(tx.quantity) : '' })}
                                  >✎</button>
                                </div>
                              ) : (
                                <button
                                  className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                  onClick={() => setInlinePicker({ txId: tx.id, productId: '__none__', quantity: '' })}
                                >
                                  + привязать товар
                                </button>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm text-slate-600">
                              {tx.quantity || '—'}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              +{fmt(tx.amount)}
                            </TableCell>
                            <TableCell className="text-right text-orange-500">
                              {cogs > 0 ? `−${fmt(cogs)}` : <span className="text-slate-400">—</span>}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${gp >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                              {cogs > 0
                                ? (gp >= 0 ? '+' : '') + fmt(gp)
                                : <span className="text-slate-400">—</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              {cogs > 0 ? (
                                <Badge className={`text-xs ${margin >= 30 ? 'bg-green-100 text-green-700' : margin >= 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'} hover:opacity-80`}>
                                  {margin}%
                                </Badge>
                              ) : <span className="text-slate-400 text-xs">—</span>}
                            </TableCell>
                          </TableRow>
                        );

                        if (!picker) return [mainRow];

                        const selectedProd = productsList.find(p => p.id === picker.productId);
                        const previewCogs = selectedProd
                          ? (parseFloat(picker.quantity) || 1) * selectedProd.cost_price
                          : 0;

                        const pickerRow = (
                          <TableRow key={tx.id + '-picker'} className="bg-blue-50/60">
                            <TableCell colSpan={8} className="py-3 px-4">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-medium text-slate-600">🛒 Выбери товар из каталога:</span>

                                <Select
                                  value={picker.productId}
                                  onValueChange={(v: string) => setInlinePicker(p => p ? { ...p, productId: v } : p)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-48">
                                    <SelectValue placeholder="Товар" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">— Без привязки —</SelectItem>
                                    {productsList.map(p => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.name}{p.cost_price > 0 ? ` (${fmt(p.cost_price)} ₸/шт)` : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-slate-500">Кол-во:</span>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={picker.quantity}
                                    onChange={e => setInlinePicker(p => p ? { ...p, quantity: e.target.value } : p)}
                                    className="h-7 text-xs w-20"
                                  />
                                </div>

                                {previewCogs > 0 && (
                                  <span className="text-xs text-orange-600 font-medium">
                                    COGS = {fmt(previewCogs)} ₸
                                  </span>
                                )}

                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                  disabled={saving || picker.productId === '__none__'}
                                  onClick={saveProduct}
                                >
                                  {saving ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                                  Сохранить
                                </Button>
                                <Button
                                  size="sm" variant="ghost" className="h-7 text-xs"
                                  onClick={() => setInlinePicker(null)}
                                >
                                  Отмена
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );

                        return [mainRow, pickerRow];
                      })}
                    </TableBody>
                  </Table>
                  <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
                    Показано {filtered.length} из {rows.length} продаж
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ════════════════════════════════
               ВКЛ: АНАЛИТИКА
          ════════════════════════════════ */}
          {salesTab === 'analytics' && (
            <div className="space-y-6">

              {/* Динамика выручки */}
              {monthlyData.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">Динамика выручки по месяцам</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyData} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Выручка"    fill="#22c55e" radius={[3,3,0,0]} />
                      <Bar dataKey="cogs"    name="Себестоимость" fill="#f97316" radius={[3,3,0,0]} />
                      <Bar dataKey="gp"      name="Вал. прибыль"  radius={[3,3,0,0]}>
                        {monthlyData.map((e, i) => (
                          <Cell key={i} fill={e.gp >= 0 ? '#6366f1' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Топ товаров по выручке */}
                {topProducts.length > 0 ? (
                  <Card className="p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Топ товаров / услуг</h3>
                    <div className="space-y-3">
                      {topProducts.map((p, i) => {
                        const m = p.revenue > 0 ? Math.round((p.revenue - p.cogs) / p.revenue * 100) : 0;
                        const pct = topProducts[0].revenue > 0
                          ? Math.round(p.revenue / topProducts[0].revenue * 100)
                          : 0;
                        return (
                          <div key={p.name}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                                <span className="text-sm font-medium text-slate-800">{p.name}</span>
                                <Badge className={`text-xs ${m >= 30 ? 'bg-green-100 text-green-700' : m >= 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'} hover:opacity-80`}>
                                  {m}%
                                </Badge>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-green-600">{fmt(p.revenue)} ₸</span>
                                <span className="text-xs text-slate-400 ml-2">× {p.qty}</span>
                              </div>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 flex items-center justify-center text-slate-400 text-sm">
                    Привяжи товары к транзакциям для аналитики
                  </Card>
                )}

                {/* Pie — распределение выручки по товарам */}
                {topProducts.length > 0 ? (
                  <Card className="p-6">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Доля выручки по товарам</h3>
                    <ResponsiveContainer width="100%" height={230}>
                      <PieChart>
                        <Pie
                          data={topProducts.map((p, i) => ({ name: p.name, value: p.revenue, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                          labelLine={false}
                        >
                          {topProducts.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v) + ' ₸'} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                ) : (
                  <Card className="p-6 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingDown size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Нет данных для диаграммы</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Таблица: прибыльность по товарам */}
              {topProducts.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-base font-semibold text-slate-900">Прибыльность по товарам</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Товар / услуга</TableHead>
                        <TableHead className="text-right">Продаж</TableHead>
                        <TableHead className="text-right">Кол-во</TableHead>
                        <TableHead className="text-right">Выручка</TableHead>
                        <TableHead className="text-right">Себестоимость</TableHead>
                        <TableHead className="text-right">Вал. прибыль</TableHead>
                        <TableHead className="text-right">Маржа</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map(p => {
                        const gp = p.revenue - p.cogs;
                        const m  = p.revenue > 0 ? Math.round(gp / p.revenue * 100) : 0;
                        return (
                          <TableRow key={p.name}>
                            <TableCell className="font-medium text-slate-900">{p.name}</TableCell>
                            <TableCell className="text-right text-slate-600">{p.count}</TableCell>
                            <TableCell className="text-right text-slate-600">{fmt(p.qty)}</TableCell>
                            <TableCell className="text-right font-semibold text-green-600">{fmt(p.revenue)} ₸</TableCell>
                            <TableCell className="text-right text-orange-500">
                              {p.cogs > 0 ? `${fmt(p.cogs)} ₸` : '—'}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${gp >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                              {p.cogs > 0 ? `${fmt(gp)} ₸` : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={`text-xs ${m >= 30 ? 'bg-green-100 text-green-700' : m >= 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'} hover:opacity-80`}>
                                {m}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
