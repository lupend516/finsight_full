import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Upload, CheckCircle2, AlertCircle, FileText, Search, Download,
  Edit, Trash2, Plus, X, Loader2, Tag, TrendingUp, TrendingDown,
  RefreshCw, SlidersHorizontal
} from 'lucide-react';
import { bookkeeping, products as productsApi, type Transaction, type Category, type BookkeepingStats, type TransactionType, type Product } from '../lib/api';
import { invalidateFinancialCache } from '../hooks/useFinancialData';
import { useAuth } from '../context/AuthContext';

// ─── Месяцы ──────────────────────────────
const MONTHS = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];

// ─── Иконки категорий ─────────────────────
const CATEGORY_COLORS = [
  '#6366f1','#f59e0b','#ec4899','#14b8a6','#8b5cf6',
  '#64748b','#0ea5e9','#f97316','#22c55e','#10b981','#ef4444','#84cc16'
];

// ═══════════════════════════════════════════
// Модальное окно редактирования транзакции
// ═══════════════════════════════════════════
const BANKS = ['Kaspi Bank', 'Halyk Bank', 'ForteBank', 'Jusan Bank', 'Freedom Bank', 'BCC', 'RBK Bank', 'Другой'];

const TX_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'income',       label: '↑ Приход' },
  { value: 'expense',      label: '↓ Расход' },
  { value: 'transfer_in',  label: '⇄ Перевод между счетами (приход)' },
  { value: 'transfer_out', label: '⇄ Перевод между счетами (расход)' },
];

// Вернуть допустимые типы по знаку суммы
function allowedTypes(amount: number): TransactionType[] {
  if (amount > 0) return ['income', 'transfer_in'];
  if (amount < 0) return ['expense', 'transfer_out'];
  return ['income', 'expense', 'transfer_in', 'transfer_out'];
}

// Является ли тип "расходным" (для знака суммы и фильтра категорий)
function isExpenseType(t: TransactionType) {
  return t === 'expense' || t === 'transfer_out';
}

function EditTransactionModal({
  tx, categories, companyId, allTransactions, productsList, onClose, onSaved, onAutoCategorized
}: {
  tx: Transaction;
  categories: Category[];
  companyId: string;
  allTransactions: Transaction[];
  productsList: Product[];
  onClose: () => void;
  onSaved: (updated: Transaction) => void;
  onAutoCategorized: (desc: string, category: string, type: string) => void;
}) {
  const [form, setForm] = useState({
    description: tx.description,
    amount: String(Math.abs(tx.amount)),
    type: tx.type as TransactionType,
    category: tx.category,
    bank: tx.bank || '__none__',
    month: tx.month || 0,           // 0 = не выбрано
    year: tx.year || new Date(tx.date).getFullYear(),
    product_id: tx.product_id || '__none__',
    product_name: tx.product_name || '',
    quantity: tx.quantity ? String(tx.quantity) : '',
  });
  const [saving, setSaving] = useState(false);
  const [salaryError, setSalaryError] = useState(false);
  const [showAutoPrompt, setShowAutoPrompt] = useState(false);
  const [autoCount, setAutoCount] = useState(0);

  const amtNum = parseFloat(form.amount) || 0;
  const allowed = allowedTypes(amtNum);

  const handleAmountChange = (val: string) => {
    const n = parseFloat(val) || 0;
    const newAllowed = allowedTypes(n);
    const newType = newAllowed.includes(form.type) ? form.type : newAllowed[0];
    setForm(p => ({ ...p, amount: val, type: newType }));
  };

  // Все категории — не фильтруем по типу, т.к. при смене категории тип меняется автоматически
  const filteredCats = categories;

  const catLower = form.category.toLowerCase();
  const isSalary = catLower.includes('зарплат') || catLower.includes('salary') || catLower.includes('payroll') || catLower.includes('оклад') || catLower.includes('зп');
  // Показываем товар для доходных транзакций ИЛИ когда категория продажная
  const isSaleCat = catLower.includes('продаж') || catLower.includes('sale') || catLower.includes('выручк') || catLower.includes('revenue') || catLower.includes('доход');
  const isIncome = form.type === 'income' || isSaleCat;

  const selectedProduct = form.product_id && form.product_id !== '__none__' ? productsList.find(p => p.id === form.product_id) : undefined;

  const similarCount = allTransactions.filter(t =>
    t.id !== tx.id &&
    t.description.toLowerCase() === form.description.toLowerCase() &&
    (t.category !== form.category || t.status !== 'categorized')
  ).length;

  const save = async () => {
    // Зарплата: обязательно выбрать период
    if (isSalary && form.month === 0) {
      setSalaryError(true);
      return;
    }
    setSalaryError(false);
    setSaving(true);
    try {
      const sign = isExpenseType(form.type) ? -1 : 1;
      const amt = sign * Math.abs(amtNum);
      const payload: Record<string, unknown> = {
        description: form.description,
        amount: amt,
        type: form.type,
        category: form.category,
        bank: form.bank === '__none__' ? undefined : form.bank || undefined,
        month: form.month > 0 ? form.month : undefined,
        year: form.year,
        product_name: form.product_name || undefined,
        quantity: form.quantity ? parseFloat(form.quantity) : undefined,
        product_id: form.product_id === '__none__' ? undefined : form.product_id || undefined,
      };
      const updated = await bookkeeping.updateTransaction(companyId, tx.id, payload as Partial<Transaction>);
      onSaved(updated);
      if (similarCount > 0) {
        setAutoCount(similarCount);
        setShowAutoPrompt(true);
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const applyToAll = async () => {
    const descLow = form.description.toLowerCase();
    const similar = allTransactions.filter(t =>
      t.id !== tx.id &&
      t.description.toLowerCase() === descLow &&
      (t.category !== form.category || t.status !== 'categorized')
    );
    await Promise.all(
      similar.map(t =>
        bookkeeping.updateTransaction(companyId, t.id, {
          category: form.category,
          status: 'categorized',
        })
      )
    );
    onAutoCategorized(form.description, form.category, form.type);
    onClose();
  };

  if (showAutoPrompt) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Tag size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Применить ко всем похожим?</h3>
              <p className="text-sm text-slate-500">Найдено ещё {autoCount} транзакций с описанием «{form.description}»</p>
            </div>
          </div>
          <p className="text-sm text-slate-700">
            Назначить категорию <strong>«{form.category}»</strong> автоматически всем транзакциям с таким же описанием?
          </p>
          <div className="flex gap-2">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={applyToAll}>
              Да, применить ко всем ({autoCount})
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Только эту</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Редактировать транзакцию</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
        </div>

        <div className="space-y-3">
          {/* Описание */}
          <div>
            <Label>Описание</Label>
            <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            {similarCount > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                ℹ️ Ещё {similarCount} транзакций с таким описанием — можно автоматизировать
              </p>
            )}
          </div>

          {/* Сумма + Тип */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Сумма (абс.)</Label>
              <Input type="number" min="0" value={form.amount} onChange={e => handleAmountChange(e.target.value)} />
            </div>
            <div>
              <Label>Тип</Label>
              <Select value={form.type} onValueChange={(v: string) => setForm(p => ({ ...p, type: v as TransactionType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TX_TYPES.filter(t => allowed.includes(t.value)).map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Категория */}
          <div>
            <Label>Категория</Label>
            <Select value={form.category} onValueChange={(v: string) => {
              const vLow = v.toLowerCase();
              // Зарплата → expense; Продажи/доход → income
              const autoType: TransactionType | null =
                (vLow.includes('зарплат') || vLow.includes('salary') || vLow.includes('зп') || vLow.includes('оклад'))
                  ? (isExpenseType(form.type) ? null : 'expense')
                : (vLow.includes('продаж') || vLow.includes('выручк') || vLow.includes('revenue') || vLow.includes('sale'))
                  ? (!isExpenseType(form.type) ? null : 'income')
                : null;
              setForm(p => ({ ...p, category: v, ...(autoType ? { type: autoType } : {}) }));
            }}>
              <SelectTrigger><SelectValue placeholder="Выбери категорию" /></SelectTrigger>
              <SelectContent>
                {filteredCats.map(c => (
                  <SelectItem key={c.id} value={c.name}>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.color }} />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Банк */}
          <div>
            <Label>Банк</Label>
            <Select value={form.bank} onValueChange={(v: string) => setForm(p => ({ ...p, bank: v }))}>
              <SelectTrigger><SelectValue placeholder="Выбери банк" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Не указан —</SelectItem>
                {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ── ЗАРПЛАТА: обязательный период начисления ── */}
          {isSalary && (
            <div className={`p-3 rounded-lg space-y-2 ${salaryError ? 'bg-red-50 border border-red-300' : 'bg-indigo-50 border border-indigo-200'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-800">За какой месяц зарплата?</span>
                <span className="text-red-500 text-sm font-bold">*</span>
                {salaryError && <span className="text-xs text-red-600 font-medium">— обязательно!</span>}
              </div>
              <p className="text-xs text-indigo-600">В ОПиУ зарплата отражается в месяц начисления, а не оплаты</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Месяц</Label>
                  <Select
                    value={form.month > 0 ? String(form.month) : ''}
                    onValueChange={(v: string) => { setForm(p => ({ ...p, month: parseInt(v) })); setSalaryError(false); }}
                  >
                    <SelectTrigger className={salaryError ? 'border-red-400' : ''}>
                      <SelectValue placeholder="Выбери месяц" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Год</Label>
                  <Select value={String(form.year)} onValueChange={(v: string) => setForm(p => ({ ...p, year: parseInt(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[2023,2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ── ДОХОД: привязка к товару ── */}
          {isIncome && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-800">Товар / услуга</span>
                <span className="text-xs text-green-600">(для расчёта себестоимости в ОПиУ)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Товар из каталога</Label>
                  <Select value={form.product_id} onValueChange={(v: string) => {
                    const prod = v !== '__none__' ? productsList.find(p => p.id === v) : undefined;
                    setForm(p => ({
                      ...p,
                      product_id: v,
                      product_name: prod?.name || (v !== '__none__' ? p.product_name : ''),
                    }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Выбери товар" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Без привязки —</SelectItem>
                      {productsList.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.cost_price > 0 ? `(себ. ${p.cost_price.toLocaleString('ru')} ₸)` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && (
                    <p className="text-xs text-green-700 mt-1">
                      Себестоимость: {selectedProduct.cost_price.toLocaleString('ru')} ₸/{selectedProduct.unit || 'шт'}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Кол-во {selectedProduct?.unit ? `(${selectedProduct.unit})` : '(шт.)'}</Label>
                  <Input type="number" placeholder="0" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                  {selectedProduct && form.quantity && parseFloat(form.quantity) > 0 && (
                    <p className="text-xs text-green-700 mt-1">
                      COGS = {(parseFloat(form.quantity) * selectedProduct.cost_price).toLocaleString('ru')} ₸
                    </p>
                  )}
                </div>
              </div>
              {(!form.product_id || form.product_id === '__none__') && (
                <div>
                  <Label>Или введи название вручную</Label>
                  <Input placeholder="Название товара/услуги" value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
            Сохранить
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════
// Модальное окно добавления категории
// ═══════════════════════════════════════════
function CategoryModal({
  companyId, existing, onClose, onSaved
}: {
  companyId: string;
  existing?: Category;
  onClose: () => void;
  onSaved: (cat: Category) => void;
}) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    type: existing?.type || 'expense' as 'income' | 'expense' | 'both',
    color: existing?.color || CATEGORY_COLORS[0],
    keywords: (existing?.keywords ?? []).join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        type: form.type,
        color: form.color,
        icon: 'tag',
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      };
      let cat: Category;
      if (existing) {
        cat = await bookkeeping.updateCategory(companyId, existing.id, body);
      } else {
        cat = await bookkeeping.createCategory(companyId, body);
      }
      onSaved(cat);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{existing ? 'Редактировать' : 'Новая'} категория</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Название *</Label>
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Например: Логистика" />
          </div>

          <div>
            <Label>Тип</Label>
            <Select value={form.type} onValueChange={(v: 'income' | 'expense' | 'both') => setForm(p => ({ ...p, type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Расход</SelectItem>
                <SelectItem value="income">Доход</SelectItem>
                <SelectItem value="both">Оба</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Цвет</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Ключевые слова для автокатегоризации</Label>
            <Input
              value={form.keywords}
              onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
              placeholder="salary, payroll, зарплата (через запятую)"
            />
            <p className="text-xs text-slate-500 mt-1">AI будет искать эти слова в описании транзакции</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={saving || !form.name} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
            {existing ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════
// Главный компонент
// ═══════════════════════════════════════════
export function AuditBookkeeping() {
  const { company } = useAuth();
  const companyId = company?.id || '';

  const [tab, setTab] = useState<'upload' | 'transactions' | 'categories' | 'products'>('upload');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');

  const [stats, setStats] = useState<BookkeepingStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterBank, setFilterBank] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 100;

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [showNewCat, setShowNewCat] = useState(false);
  const [inlineCatTxId, setInlineCatTxId] = useState<string | null>(null);
  const [inlineBankTxId, setInlineBankTxId] = useState<string | null>(null);
  const [inlineExtra, setInlineExtra] = useState<{
    txId: string; category: string; isSale: boolean; isSalary: boolean;
    productId: string; month: number; year: number;
  } | null>(null);
  const [autoPrompt, setAutoPrompt] = useState<{ description: string; category: string; type: string; count: number } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Загружаем данные при монтировании и при смене фильтров/страницы
  useEffect(() => {
    if (!companyId) return;
    loadPage(page);
  }, [companyId, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // При смене серверных фильтров сбрасываем на первую страницу
  useEffect(() => {
    if (!companyId) return;
    if (page !== 1) { setPage(1); return; } // useEffect выше сам сработает
    loadPage(1);
  }, [search, filterType, filterStatus, filterCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPage = async (p: number) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit: PAGE_SIZE };
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (search.trim()) params.search = search.trim();

      const [result, cats, dashStats, prods] = await Promise.all([
        bookkeeping.getTransactions(companyId, params as Parameters<typeof bookkeeping.getTransactions>[1]),
        categories.length === 0 ? bookkeeping.getCategories(companyId) : Promise.resolve(categories),
        p === 1 ? bookkeeping.getDashboardStats(companyId) : Promise.resolve(null),
        productsList.length === 0 ? productsApi.list(companyId) : Promise.resolve(productsList),
      ]);

      const t = Array.isArray(result?.transactions) ? result.transactions : [];
      setTransactions(t);
      setTotalCount(result?.total ?? 0);

      if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
      if (Array.isArray(prods)) setProductsList(prods);

      if (dashStats) {
        setStats({
          total_transactions: dashStats.total_transactions,
          categorized:        dashStats.categorized,
          needs_review:       dashStats.needs_review,
          total_income:       dashStats.total_income,
          total_expenses:     dashStats.total_expenses,
        });
        // Инвалидируем кэш дашбордов чтобы они подтянули свежие данные
        invalidateFinancialCache(companyId);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadAll = () => loadPage(page);

  // ─── Загрузка файла ──────────────────────
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadMsg('');
    setUploadError('');
    try {
      // Если нет категорий — создаём дефолтные
      if (categories.length === 0) {
        const cats = await bookkeeping.initCategories(companyId);
        setCategories(cats || []);
      }
      const result = await bookkeeping.upload(companyId, file);
      setUploadMsg(`Готово! Загружено ${result.saved} транзакций из «${result.filename}»`);
      invalidateFinancialCache(companyId);
      await loadAll();
      setTab('transactions');
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDrop = (e: any) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Серверные фильтры: type, status, category, search
  // Клиентские фильтры (на текущей странице): bank, date range, amount range
  const filtered = transactions.filter(tx => {
    if (filterBank !== 'all' && tx.bank !== filterBank) return false;
    if (filterDateFrom && new Date(tx.date) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(tx.date) > new Date(filterDateTo + 'T23:59:59')) return false;
    if (filterAmountMin && Math.abs(tx.amount) < parseFloat(filterAmountMin)) return false;
    if (filterAmountMax && Math.abs(tx.amount) > parseFloat(filterAmountMax)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const totalIncome  = stats?.total_income   ?? 0;
  const totalExpenses = stats?.total_expenses ?? 0;

  // ─── Инлайн смена категории ──────────────
  const changeCategory = (txId: string, catName: string) => {
    setInlineCatTxId(null);
    const catLow = catName.toLowerCase();
    const isSale = catLow.includes('продаж') || catLow.includes('sale') || catLow.includes('выручк') || catLow.includes('revenue');
    const isSalary = catLow.includes('зарплат') || catLow.includes('salary') || catLow.includes('зп') || catLow.includes('оклад');
    if (isSale || isSalary) {
      const tx = transactions.find(t => t.id === txId);
      setInlineExtra({
        txId, category: catName, isSale, isSalary,
        productId: tx?.product_id || '__none__',
        month: tx?.month || 0,
        year: tx?.year || new Date().getFullYear(),
      });
      return; // не сохраняем — ждём доп. данных
    }
    saveCategoryChange(txId, catName, {});
  };

  const saveCategoryChange = async (txId: string, catName: string, extra: Partial<Transaction>) => {
    const tx = transactions.find(t => t.id === txId);
    const updated = await bookkeeping.updateTransaction(companyId, txId, { category: catName, status: 'categorized', ...extra });
    setTransactions(prev => prev.map(t => t.id === txId ? updated : t));
    setInlineExtra(null);
    if (tx) {
      const similar = transactions.filter(t =>
        t.id !== txId &&
        t.description.toLowerCase() === tx.description.toLowerCase() &&
        (t.category !== catName || t.status !== 'categorized')
      );
      if (similar.length > 0) {
        setAutoPrompt({ description: tx.description, category: catName, type: tx.type, count: similar.length });
      }
    }
  };

  // ─── Применить авто-категоризацию ───────
  const applyAutoPrompt = async () => {
    if (!autoPrompt) return;
    const desc = autoPrompt.description.toLowerCase();
    const similar = transactions.filter(t =>
      t.description.toLowerCase() === desc &&
      (t.category !== autoPrompt.category || t.status !== 'categorized')
    );
    // Update each matching transaction by ID (same reliable endpoint as single save)
    await Promise.all(
      similar.map(t =>
        bookkeeping.updateTransaction(companyId, t.id, {
          category: autoPrompt.category,
          status: 'categorized',
        })
      )
    );
    setTransactions(prev => prev.map(t =>
      t.description.toLowerCase() === desc
        ? { ...t, category: autoPrompt.category, status: 'categorized' as const }
        : t
    ));
    setAutoPrompt(null);
  };

  // ─── Удаление транзакции ─────────────────
  const deleteTx = async (id: string) => {
    if (!confirm('Удалить транзакцию?')) return;
    await bookkeeping.deleteTransaction(companyId, id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ─── Удаление категории ──────────────────
  const deleteCat = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    await bookkeeping.deleteCategory(companyId, id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // ─── Скачать CSV ─────────────────────────
  const exportCSV = () => {
    const rows = [['Дата','Описание','Тип','Категория','Сумма','Статус']];
    filtered.forEach(t => rows.push([
      new Date(t.date).toLocaleDateString('ru'),
      t.description, t.type, t.category,
      String(t.amount), t.status
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'transactions.csv';
    a.click();
  };

  const fmt = (n: number) => n.toLocaleString('ru', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* ── Шапка с вкладками ── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {(['upload','transactions','categories','products'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t === 'upload'        ? 'Загрузка файлов'
             : t === 'transactions' ? `Транзакции (${totalCount || transactions.length})`
             : t === 'categories'   ? 'Категории'
             : `Товары (${productsList.length})`}
          </button>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={loadAll} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* ══════════════════════════════════════
           ВКЛАДКА: ЗАГРУЗКА
      ══════════════════════════════════════ */}
      {tab === 'upload' && (
        <div className="space-y-6">
          {/* Статистика */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Транзакций</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total_transactions}</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-slate-500 mb-1">Категоризовано</p>
                <p className="text-3xl font-bold text-green-600">{stats.categorized}</p>
                <p className="text-xs text-slate-500">
                  {stats.total_transactions ? Math.round(stats.categorized / stats.total_transactions * 100) : 0}% авто
                </p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-green-600" />
                  <p className="text-sm text-slate-500">Доходы</p>
                </div>
                <p className="text-2xl font-bold text-green-600">${fmt(stats.total_income)}</p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown size={16} className="text-red-500" />
                  <p className="text-sm text-slate-500">Расходы</p>
                </div>
                <p className="text-2xl font-bold text-red-500">${fmt(stats.total_expenses)}</p>
              </Card>
            </div>
          )}

          {/* Зона загрузки */}
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Загрузить файл</h3>
                <p className="text-sm text-slate-500">CSV или Excel — транзакции автоматически распарсятся и категоризируются</p>
              </div>
            </div>

            {/* Drag & Drop */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                uploading ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={40} className="text-blue-600 animate-spin" />
                  <p className="font-medium text-blue-700">Парсинг и категоризация...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload size={28} className="text-blue-600" />
                  </div>
                  <p className="font-medium text-slate-900">Перетащи файл сюда или нажми для выбора</p>
                  <p className="text-sm text-slate-500">CSV, XLSX, PDF — до 20 МБ</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">CSV</Badge>
                    <Badge variant="outline">Excel .xlsx</Badge>
                    <Badge variant="outline">.xls</Badge>
                    <Badge variant="outline">PDF</Badge>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />

            {uploadMsg && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 size={18} />
                {uploadMsg}
              </div>
            )}
            {uploadError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                {uploadError}
              </div>
            )}
          </Card>

          {/* Формат файла */}
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-3">Ожидаемый формат файла</h4>
            <div className="overflow-x-auto">
              <table className="text-sm border-collapse w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {['Дата','Описание','Сумма'].map(h => (
                      <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['2026-01-15','Зарплата сотрудников','-45000'],
                    ['2026-01-16','Оплата от ООО Клиент А','150000'],
                    ['2026-01-17','Аренда офиса','-80000'],
                  ].map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className="border border-slate-200 px-3 py-2 text-slate-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">Также поддерживаются файлы с отдельными колонками «Приход» и «Расход»</p>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
           ВКЛАДКА: ТРАНЗАКЦИИ
      ══════════════════════════════════════ */}
      {tab === 'transactions' && (
        <div className="space-y-4">
          {/* Сводка */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <TrendingUp size={24} className="text-green-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Доходы</p>
                <p className="text-xl font-bold text-green-600">${fmt(totalIncome)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <TrendingDown size={24} className="text-red-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Расходы</p>
                <p className="text-xl font-bold text-red-500">${fmt(totalExpenses)}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <FileText size={24} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Баланс</p>
                <p className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  ${fmt(totalIncome - totalExpenses)}
                </p>
              </div>
            </Card>
          </div>

          {/* Фильтры */}
          {(() => {
            const activeExtra = [filterCategory, filterBank, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax].filter(v => v && v !== 'all').length;
            const clearAll = () => {
              setSearch(''); setFilterType('all'); setFilterStatus('all');
              setFilterCategory('all'); setFilterBank('all');
              setFilterDateFrom(''); setFilterDateTo('');
              setFilterAmountMin(''); setFilterAmountMax('');
            };
            return (
              <Card className="p-4">
                {/* Строка 1: основные фильтры */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Поиск по описанию или категории..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="income">Доходы</SelectItem>
                      <SelectItem value="expense">Расходы</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="categorized">Категоризовано</SelectItem>
                      <SelectItem value="needs-review">Требует проверки</SelectItem>
                      <SelectItem value="uncategorized">Без категории</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => setShowMoreFilters(p => !p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors ${showMoreFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    <SlidersHorizontal size={13} />
                    Фильтры
                    {activeExtra > 0 && (
                      <span className="ml-1 w-4 h-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{activeExtra}</span>
                    )}
                  </button>
                  {(search || filterType !== 'all' || filterStatus !== 'all' || activeExtra > 0) && (
                    <Button variant="ghost" size="sm" onClick={clearAll} className="text-slate-400 hover:text-red-500 px-2">
                      <X size={13} className="mr-1" />Сбросить
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={exportCSV} className="ml-auto">
                    <Download size={14} className="mr-2" />Экспорт
                  </Button>
                </div>

                {/* Строка 2: расширенные фильтры */}
                {showMoreFilters && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Категория */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Категория</p>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Все" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все</SelectItem>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.name}>
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                                {c.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Банк */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Банк</p>
                      <Select value={filterBank} onValueChange={setFilterBank}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Все" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все</SelectItem>
                          {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Дата от */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Дата от</p>
                      <Input type="date" className="h-8 text-xs" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
                    </div>

                    {/* Дата до */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Дата до</p>
                      <Input type="date" className="h-8 text-xs" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
                    </div>

                    {/* Сумма от */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Сумма от</p>
                      <Input type="number" min="0" placeholder="0" className="h-8 text-xs" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} />
                    </div>

                    {/* Сумма до */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Сумма до</p>
                      <Input type="number" min="0" placeholder="∞" className="h-8 text-xs" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} />
                    </div>
                  </div>
                )}
              </Card>
            );
          })()}

          {/* Таблица */}
          <Card className="overflow-hidden overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-slate-500">Загрузка...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={40} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {transactions.length === 0 ? 'Нет транзакций. Загрузи файл на вкладке «Загрузка».' : 'Ничего не найдено по фильтрам.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Банк</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>AI %</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.flatMap(tx => {
                    const cat = categories.find(c => c.name === tx.category);
                    const mainRow = (
                      <TableRow key={tx.id}>
                        <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('ru')}
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <div>
                            <p className="font-medium text-slate-900 text-sm truncate" title={tx.description}>{tx.description}</p>
                            {tx.product_name && <p className="text-xs text-slate-500">Товар: {tx.product_name} {tx.quantity ? `× ${tx.quantity}` : ''}</p>}
                            {(tx.category.toLowerCase().includes('зарплат') || tx.category.toLowerCase().includes('salary')) && tx.month && (
                              <p className="text-xs text-indigo-600">За {MONTHS[(tx.month || 1) - 1]} {tx.year}</p>
                            )}
                            {tx.source_file && <p className="text-xs text-slate-400">{tx.source_file}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[160px]">
                          {inlineCatTxId === tx.id ? (
                            <Select
                              value={tx.category}
                              onValueChange={(v: string) => changeCategory(tx.id, v)}
                              open
                              onOpenChange={(open: boolean) => { if (!open) setInlineCatTxId(null); }}
                            >
                              <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {categories
                                  .filter(c => {
                                    if (tx.type === 'transfer_in' || tx.type === 'transfer_out') return true;
                                    if (tx.amount < 0) return c.type === 'expense' || c.type === 'both';
                                    return c.type === 'income' || c.type === 'both';
                                  })
                                  .map(c => (
                                    <SelectItem key={c.id} value={c.name}>
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: c.color }} />
                                        {c.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (() => {
                            // если для этой строки открыт inline extra — показываем pending категорию
                            const pending = inlineExtra?.txId === tx.id ? inlineExtra.category : null;
                            const displayCat = pending
                              ? categories.find(c => c.name === pending)
                              : cat;
                            const displayName = pending ?? tx.category;
                            return (
                              <Badge
                                variant="outline"
                                style={{ borderColor: displayCat?.color, color: displayCat?.color }}
                                className={`text-xs cursor-pointer hover:opacity-70 ${pending ? 'opacity-60' : ''}`}
                                onClick={() => { if (!pending) setInlineCatTxId(tx.id); }}
                                title={pending ? 'Ожидает сохранения' : 'Нажми чтобы изменить категорию'}
                              >
                                {displayName}{pending ? ' ⏳' : ' ▾'}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="text-xs text-slate-500">
                            {tx.type === 'income'       ? '↑ Приход'
                           : tx.type === 'expense'      ? '↓ Расход'
                           : tx.type === 'transfer_in'  ? '⇄ Перевод +'
                           : tx.type === 'transfer_out' ? '⇄ Перевод −'
                           : tx.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {inlineBankTxId === tx.id ? (
                            <Select
                              value={tx.bank || '__none__'}
                              onValueChange={async (v: string) => {
                                const bank = v === '__none__' ? undefined : v;
                                const updated = await bookkeeping.updateTransaction(companyId, tx.id, { bank });
                                setTransactions(prev => prev.map(t => t.id === tx.id ? updated : t));
                                setInlineBankTxId(null);
                              }}
                              open
                              onOpenChange={(open: boolean) => { if (!open) setInlineBankTxId(null); }}
                            >
                              <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— Не указан —</SelectItem>
                                {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className="cursor-pointer text-slate-500 hover:text-blue-600 hover:underline"
                              onClick={() => setInlineBankTxId(tx.id)}
                              title="Нажми чтобы изменить банк"
                            >
                              {tx.bank || <span className="text-slate-300">—</span>}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('ru')}
                        </TableCell>
                        <TableCell>
                          {tx.status === 'categorized' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">OK</Badge>}
                          {tx.status === 'needs-review' && <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">Проверь</Badge>}
                          {tx.status === 'uncategorized' && <Badge variant="secondary" className="text-xs">—</Badge>}
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${tx.confidence >= 90 ? 'text-green-600' : tx.confidence >= 70 ? 'text-orange-500' : 'text-red-500'}`}>
                            {tx.confidence}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditTx(tx)}><Edit size={13} /></Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteTx(tx.id)}><Trash2 size={13} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );

                    // Inline extra row for sale (product) or salary (month/year)
                    const extra = inlineExtra?.txId === tx.id ? inlineExtra : null;
                    if (!extra) return [mainRow];

                    const extraRow = (
                      <TableRow key={tx.id + '-extra'} className="bg-slate-50">
                        <TableCell colSpan={9} className="py-3 px-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-medium text-slate-700">
                              <span className="text-slate-400 mr-1">Категория: {extra.category} →</span>
                              {extra.isSale ? '🛒 Укажи товар:' : '💰 За какой месяц зарплата?'}
                            </span>

                            {extra.isSale && (
                              <>
                                <Select value={extra.productId} onValueChange={(v: string) =>
                                  setInlineExtra(p => p ? { ...p, productId: v } : p)
                                }>
                                  <SelectTrigger className="h-7 text-xs w-44"><SelectValue placeholder="Товар" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">— Без привязки —</SelectItem>
                                    {productsList.map(p => (
                                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-slate-400">COGS = {
                                  extra.productId !== '__none__'
                                    ? `${(productsList.find(p => p.id === extra.productId)?.cost_price ?? 0).toLocaleString('ru')} ₸/шт`
                                    : '—'
                                }</span>
                              </>
                            )}

                            {extra.isSalary && (
                              <>
                                <Select value={extra.month > 0 ? String(extra.month) : '__none__'} onValueChange={(v: string) =>
                                  setInlineExtra(p => p ? { ...p, month: v === '__none__' ? 0 : parseInt(v) } : p)
                                }>
                                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Месяц" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Месяц</SelectItem>
                                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <Select value={String(extra.year)} onValueChange={(v: string) =>
                                  setInlineExtra(p => p ? { ...p, year: parseInt(v) } : p)
                                }>
                                  <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {[2023,2024,2025,2026,2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </>
                            )}

                            <Button
                              size="sm"
                              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                              disabled={extra.isSalary && extra.month === 0}
                              onClick={() => {
                                const payload: Partial<Transaction> = {};
                                if (extra.isSale && extra.productId !== '__none__') {
                                  payload.product_id = extra.productId;
                                  const prod = productsList.find(p => p.id === extra.productId);
                                  if (prod) payload.product_name = prod.name;
                                }
                                if (extra.isSalary && extra.month > 0) {
                                  payload.month = extra.month;
                                  payload.year = extra.year;
                                }
                                saveCategoryChange(tx.id, extra.category, payload);
                              }}
                            >
                              Сохранить
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 text-xs text-slate-500"
                              onClick={() => saveCategoryChange(tx.id, extra.category, {})}
                            >
                              Только категорию
                            </Button>
                          </div>
                          {extra.isSalary && extra.month === 0 && (
                            <p className="text-xs text-red-500 mt-1">Выбери месяц — обязательно для ОПиУ</p>
                          )}
                        </TableCell>
                      </TableRow>
                    );

                    return [mainRow, extraRow];
                  })}
                </TableBody>
              </Table>
            )}
            {totalCount > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Показано {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} из {totalCount} транзакций
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                      ← Назад
                    </Button>
                    <span className="text-xs text-slate-400">стр. {page} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}>
                      Вперёд →
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
           ВКЛАДКА: ПРОДАЖИ
      ══════════════════════════════════════ */}
      {/* ══════════════════════════════════════
           ВКЛАДКА: КАТЕГОРИИ
      ══════════════════════════════════════ */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Категории</h3>
              <p className="text-sm text-slate-500">AI использует ключевые слова для автоматической категоризации</p>
            </div>
            <div className="flex gap-2">
              {categories.length === 0 && (
                <Button variant="outline" onClick={async () => { const cats = await bookkeeping.initCategories(companyId); setCategories(cats || []); }}>
                  <RefreshCw size={14} className="mr-2" />
                  Создать стандартные
                </Button>
              )}
              <Button onClick={() => setShowNewCat(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={14} className="mr-2" />
                Новая категория
              </Button>
            </div>
          </div>

          {/* Расходы */}
          {['expense', 'income', 'both'].map(type => {
            const cats = categories.filter(c => c.type === type);
            if (cats.length === 0) return null;
            const label = type === 'expense' ? 'Расходы' : type === 'income' ? 'Доходы' : 'Общие';
            return (
              <div key={type}>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  {type === 'income' ? <TrendingUp size={14} className="text-green-600" /> : <TrendingDown size={14} className="text-red-500" />}
                  {label}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {cats.map(cat => (
                    <Card key={cat.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full shrink-0" style={{ background: cat.color }} />
                          <span className="font-medium text-slate-900 text-sm">{cat.name}</span>
                          {cat.is_default && <Badge variant="secondary" className="text-xs px-1">default</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditCat(cat)}><Edit size={12} /></Button>
                          {!cat.is_default && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteCat(cat.id)}><Trash2 size={12} /></Button>
                          )}
                        </div>
                      </div>
                      {(cat.keywords ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(cat.keywords ?? []).slice(0, 4).map(kw => (
                            <span key={kw} className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{kw}</span>
                          ))}
                          {(cat.keywords ?? []).length > 4 && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-500">+{(cat.keywords ?? []).length - 4}</span>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {categories.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <Tag size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">Нет категорий. Создай стандартные или добавь свои.</p>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
           ВКЛАДКА: ТОВАРЫ
      ══════════════════════════════════════ */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Каталог товаров и услуг</h3>
              <p className="text-sm text-slate-500">Себестоимость используется в ОПиУ при расчёте COGS</p>
            </div>
            <Button onClick={() => setShowNewProduct(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={14} className="mr-2" />Добавить товар
            </Button>
          </div>

          {productsList.length > 0 ? (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Артикул</TableHead>
                    <TableHead>Ед. изм.</TableHead>
                    <TableHead className="text-right">Себестоимость</TableHead>
                    <TableHead className="text-right">Цена продажи</TableHead>
                    <TableHead className="text-right">Маржа</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsList.map(p => {
                    const margin = p.selling_price > 0
                      ? Math.round((p.selling_price - p.cost_price) / p.selling_price * 100)
                      : 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-slate-900">{p.name}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{p.sku || '—'}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{p.unit || 'шт.'}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-800">
                          {p.cost_price.toLocaleString('ru')} ₸
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {p.selling_price > 0 ? p.selling_price.toLocaleString('ru') + ' ₸' : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.selling_price > 0 ? (
                            <Badge className={`text-xs ${margin >= 30 ? 'bg-green-100 text-green-700' : margin >= 10 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                              {margin}%
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditProduct(p)}><Edit size={13} /></Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={async () => {
                              if (!confirm(`Удалить товар «${p.name}»?`)) return;
                              await productsApi.delete(companyId, p.id);
                              setProductsList(prev => prev.filter(x => x.id !== p.id));
                            }}><Trash2 size={13} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <FileText size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">Нет товаров. Добавь товары для расчёта себестоимости в ОПиУ.</p>
              <Button onClick={() => setShowNewProduct(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={14} className="mr-2" />Добавить первый товар
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ── Авто-категоризация промпт ── */}
      {autoPrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Tag size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Применить ко всем похожим?</h3>
                <p className="text-sm text-slate-500">Найдено ещё {autoPrompt.count} транзакций с описанием «{autoPrompt.description}»</p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              Назначить категорию <strong>«{autoPrompt.category}»</strong> автоматически всем транзакциям с таким же описанием?
            </p>
            <div className="flex gap-2">
              <button
                onClick={applyAutoPrompt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Да, применить ко всем ({autoPrompt.count})
              </button>
              <button
                onClick={() => setAutoPrompt(null)}
                className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Только эту
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Модальные окна ── */}
      {editTx && (
        <EditTransactionModal
          tx={editTx}
          categories={categories}
          companyId={companyId}
          allTransactions={transactions}
          productsList={productsList}
          onClose={() => setEditTx(null)}
          onSaved={updated => {
            setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
          }}
          onAutoCategorized={(desc, category, type) => {
            setTransactions(prev => prev.map(t =>
              t.description.toLowerCase() === desc.toLowerCase()
                ? { ...t, category, type: type as Transaction['type'], status: 'categorized', confidence: 100 }
                : t
            ));
            setEditTx(null);
          }}
        />
      )}
      {(showNewCat || editCat) && (
        <CategoryModal
          companyId={companyId}
          existing={editCat || undefined}
          onClose={() => { setShowNewCat(false); setEditCat(null); }}
          onSaved={cat => {
            if (editCat) {
              setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
            } else {
              setCategories(prev => [...prev, cat]);
            }
            setShowNewCat(false);
            setEditCat(null);
          }}
        />
      )}

      {/* ── Модалка товара ── */}
      {(showNewProduct || editProduct) && (
        <ProductModal
          companyId={companyId}
          existing={editProduct || undefined}
          onClose={() => { setShowNewProduct(false); setEditProduct(null); }}
          onSaved={p => {
            if (editProduct) {
              setProductsList(prev => prev.map(x => x.id === p.id ? p : x));
            } else {
              setProductsList(prev => [...prev, p]);
            }
            setShowNewProduct(false);
            setEditProduct(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Модальное окно добавления/редактирования товара
// ═══════════════════════════════════════════
function ProductModal({
  companyId, existing, onClose, onSaved
}: {
  companyId: string;
  existing?: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    sku: existing?.sku || '',
    cost_price: existing?.cost_price ? String(existing.cost_price) : '',
    selling_price: existing?.selling_price ? String(existing.selling_price) : '',
    unit: existing?.unit || 'шт.',
  });
  const [saving, setSaving] = useState(false);

  const margin = form.cost_price && form.selling_price
    ? Math.round((parseFloat(form.selling_price) - parseFloat(form.cost_price)) / parseFloat(form.selling_price) * 100)
    : null;

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        cost_price: parseFloat(form.cost_price) || 0,
        selling_price: parseFloat(form.selling_price) || 0,
        unit: form.unit || 'шт.',
      };
      const result = existing
        ? await productsApi.update(companyId, existing.id, body)
        : await productsApi.create(companyId, body);
      onSaved(result);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {existing ? 'Редактировать товар' : 'Новый товар'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Название <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Напр. Кроссовки Nike Air Max"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Артикул (SKU)</Label>
              <Input placeholder="Напр. NK-001" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
            </div>
            <div>
              <Label>Единица</Label>
              <Select value={form.unit} onValueChange={(v: string) => setForm(p => ({ ...p, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['шт.','кг','л','м','услуга','пара','упак.','комплект'].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Себестоимость (₸)</Label>
              <Input type="number" min="0" placeholder="0" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} />
              <p className="text-xs text-slate-500 mt-1">Используется для COGS в ОПиУ</p>
            </div>
            <div>
              <Label>Цена продажи (₸)</Label>
              <Input type="number" min="0" placeholder="0" value={form.selling_price} onChange={e => setForm(p => ({ ...p, selling_price: e.target.value }))} />
              {margin !== null && (
                <p className={`text-xs mt-1 font-medium ${margin >= 30 ? 'text-green-600' : margin >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
                  Маржа: {margin}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
            {existing ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
