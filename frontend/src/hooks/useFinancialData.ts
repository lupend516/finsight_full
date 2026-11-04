import { useState, useEffect, useRef } from 'react';
import { bookkeeping, type Category, type Transaction } from '../lib/api';

// ── Глобальный кэш ────────────────────────────────────────────
const cache: Record<string, { stats: DashboardCache; ts: number }> = {};
const CACHE_TTL = 60_000; // 60 секунд

interface DashboardCache {
  totalTransactions: number;
  categorized: number;
  needsReview: number;
  totalIncome: number;
  totalExpenses: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  monthlyData: MonthlyPoint[];
  expenseByCategory: CategorySlice[];
  flaggedMonthly: { year: number; month: number; count: number }[];
  flagged: Transaction[];
  recent: Transaction[];
  categories: Category[];
}

export function invalidateFinancialCache(companyId: string) {
  delete cache[companyId];
}

export interface MonthlyPoint {
  month: string;   // e.g. "Jan 26"
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export interface FinancialData {
  loading: boolean;
  transactions: Transaction[];   // recent 10 + flagged (для совместимости)
  categories: Category[];
  // KPIs
  totalTransactions: number;
  categorized: number;
  needsReview: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  // Current month
  currentMonthIncome: number;
  currentMonthExpenses: number;
  // Monthly chart (last 6 months, oldest→newest)
  monthlyData: MonthlyPoint[];
  // Category pie (expenses)
  expenseByCategory: CategorySlice[];
  // Needs-review
  flagged: Transaction[];
  flaggedMonthly: { year: number; month: number; count: number }[];
  // Last 10 transactions
  recent: Transaction[];
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FALLBACK_COLORS = ['#6366f1','#f59e0b','#ec4899','#14b8a6','#8b5cf6','#0ea5e9','#f97316','#22c55e'];

function buildFromCache(c: DashboardCache): Omit<FinancialData, 'loading'> {
  const transactions = [
    ...c.recent,
    ...c.flagged.filter(f => !c.recent.find(r => r.id === f.id)),
  ];
  return {
    transactions,
    categories: c.categories,
    totalTransactions: c.totalTransactions,
    categorized: c.categorized,
    needsReview: c.needsReview,
    totalIncome: c.totalIncome,
    totalExpenses: c.totalExpenses,
    netProfit: c.totalIncome - c.totalExpenses,
    currentMonthIncome: c.currentMonthIncome,
    currentMonthExpenses: c.currentMonthExpenses,
    monthlyData: c.monthlyData,
    expenseByCategory: c.expenseByCategory,
    flagged: c.flagged,
    flaggedMonthly: c.flaggedMonthly,
    recent: c.recent,
  };
}

export function useFinancialData(companyId: string): FinancialData {
  const cached = companyId ? cache[companyId] : null;
  const isFresh = cached && Date.now() - cached.ts < CACHE_TTL;

  const [loading, setLoading] = useState(!isFresh);
  const [data, setData] = useState<DashboardCache | null>(isFresh ? cached!.stats : null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }
    if (isFresh && !fetchedRef.current) {
      fetchedRef.current = true;
      return;
    }
    fetchedRef.current = true;
    setLoading(true);

    Promise.all([
      bookkeeping.getDashboardStats(companyId),
      bookkeeping.getCategories(companyId),
    ]).then(([stats, cats]) => {
      const c = Array.isArray(cats) ? cats : [];
      const catColorMap = new Map(c.map(cat => [cat.name, cat.color]));

      const monthlyData: MonthlyPoint[] = (stats.monthly ?? [])
        .slice(-6)
        .map(m => ({
          month: `${MONTH_NAMES[m.month - 1]} ${String(m.year).slice(2)}`,
          revenue: m.income,
          expenses: m.expenses,
          profit: m.income - m.expenses,
        }));

      const expenseByCategory: CategorySlice[] = (stats.categories ?? []).map((cat, i) => ({
        name: cat.name,
        value: cat.total,
        color: catColorMap.get(cat.name) || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
      }));

      const built: DashboardCache = {
        totalTransactions: stats.total_transactions ?? 0,
        categorized: stats.categorized ?? 0,
        needsReview: stats.needs_review ?? 0,
        totalIncome: stats.total_income ?? 0,
        totalExpenses: stats.total_expenses ?? 0,
        currentMonthIncome: stats.current_month_income ?? 0,
        currentMonthExpenses: stats.current_month_expenses ?? 0,
        monthlyData,
        expenseByCategory,
        flaggedMonthly: stats.flagged_monthly ?? [],
        flagged: Array.isArray(stats.flagged) ? stats.flagged : [],
        recent: Array.isArray(stats.recent) ? stats.recent : [],
        categories: c,
      };

      cache[companyId] = { stats: built, ts: Date.now() };
      setData(built);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const empty: Omit<FinancialData, 'loading'> = {
    transactions: [],
    categories: [],
    totalTransactions: 0,
    categorized: 0,
    needsReview: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    currentMonthIncome: 0,
    currentMonthExpenses: 0,
    monthlyData: [],
    expenseByCategory: [],
    flagged: [],
    flaggedMonthly: [],
    recent: [],
  };

  return {
    loading,
    ...(data ? buildFromCache(data) : empty),
  };
}
