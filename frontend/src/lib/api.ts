// ─────────────────────────────────────────
// FinSight API Client
// Все запросы к бэкенду идут через этот файл
// ─────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ─── Типы ────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  country: string;
  currency: string;
  owner_id: string;
  logo_url?: string;
  is_active: boolean;
  plan: string;
  created_at: string;
  // Business Profile
  business_category?: string;
  annual_revenue?: string;
  business_age?: string;
  employees?: string;
  user_role?: string;
  // Business Model
  sales_type?: string;
  sales_channels?: string[];
  products_count?: string;
  average_check?: string;
  sales_frequency?: string;
  seasonality?: boolean;
  // Accounting & Tax
  accounting_system?: string;
  tax_system?: string;
  // Financial Goals
  financial_goals?: string[];
}

export type Role = 'owner' | 'admin' | 'accountant' | 'analyst' | 'viewer';

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: Role;
  permissions: string[];
  joined_at: string;
  is_active: boolean;
  user: User;
}

export interface Invitation {
  id: string;
  company_id: string;
  email: string;
  role: Role;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// ─── Token helpers ───────────────────────

export const token = {
  get: () => localStorage.getItem('access_token'),
  set: (t: string) => localStorage.setItem('access_token', t),
  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_company');
  },
};

export const currentUser = {
  get: (): User | null => {
    const u = localStorage.getItem('current_user');
    return u ? JSON.parse(u) : null;
  },
  set: (u: User) => localStorage.setItem('current_user', JSON.stringify(u)),
};

export const currentCompany = {
  get: (): Company | null => {
    const c = localStorage.getItem('current_company');
    return c ? JSON.parse(c) : null;
  },
  set: (c: Company) => localStorage.setItem('current_company', JSON.stringify(c)),
};

// ─── HTTP helper ─────────────────────────

let _isRefreshing = false;
let _refreshQueue: Array<(newToken: string) => void> = [];

async function tryRefresh(): Promise<string | null> {
  const rt = localStorage.getItem('refresh_token');
  if (!rt) return null;

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: rt }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const payload: AuthResponse = data.data ?? data;
  token.set(payload.access_token);
  localStorage.setItem('refresh_token', payload.refresh_token);
  return payload.access_token;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const t = token.get();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    if (!_isRefreshing) {
      _isRefreshing = true;
      const newToken = await tryRefresh().finally(() => { _isRefreshing = false; });

      if (newToken) {
        _refreshQueue.forEach(cb => cb(newToken));
        _refreshQueue = [];
        // Retry original request with new token
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
        const retryData = await retry.json();
        if (!retry.ok) throw new Error(retryData.error || retryData.message || 'Request failed');
        return retryData.data ?? retryData;
      } else {
        _refreshQueue = [];
        token.clear();
        window.dispatchEvent(new Event('auth:expired'));
        throw new Error('Session expired. Please log in again.');
      }
    } else {
      // Another refresh is in progress — queue this request
      const newToken = await new Promise<string>((resolve) => {
        _refreshQueue.push(resolve);
      });
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
      const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders });
      const retryData = await retry.json();
      if (!retry.ok) throw new Error(retryData.error || retryData.message || 'Request failed');
      return retryData.data ?? retryData;
    }
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data.data ?? data;
}

// ─── AUTH ────────────────────────────────

export const auth = {
  register: (body: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<User>('/auth/me'),

  refresh: (refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }),

  updateProfile: (body: { first_name?: string; last_name?: string; avatar?: string }) =>
    request<User>('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),

  changePassword: (body: { old_password: string; new_password: string }) =>
    request<void>('/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
};

// ─── COMPANIES ───────────────────────────

export const companies = {
  create: (body: { name: string; industry?: string; country?: string; currency?: string }) =>
    request<Company>('/companies', { method: 'POST', body: JSON.stringify(body) }),

  list: () => request<Company[]>('/companies'),

  get: (id: string) => request<Company>(`/companies/${id}`),

  update: (id: string, body: Partial<Company>) =>
    request<Company>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ─── MEMBERS ─────────────────────────────

export const members = {
  list: (companyId: string) =>
    request<CompanyMember[]>(`/companies/${companyId}/members`),

  updateRole: (companyId: string, userId: string, role: Role) =>
    request<void>(`/companies/${companyId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  remove: (companyId: string, userId: string) =>
    request<void>(`/companies/${companyId}/members/${userId}`, { method: 'DELETE' }),
};

// ─── BOOKKEEPING ─────────────────────────

export type TransactionType = 'income' | 'expense' | 'transfer_in' | 'transfer_out';

export interface Transaction {
  id: string;
  company_id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  category_id?: string;
  status: 'categorized' | 'needs-review' | 'uncategorized';
  confidence: number;
  source_file?: string;
  month?: number;
  year?: number;
  product_name?: string;
  quantity?: number;
  bank?: string;
  product_id?: string;
  created_at: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string;
  icon: string;
  keywords: string[];
  is_default: boolean;
  pnl_section?: 'variable' | 'fixed' | 'below' | '';
  created_at: string;
}

export interface BookkeepingStats {
  total_transactions: number;
  categorized: number;
  needs_review: number;
  total_income: number;
  total_expenses: number;
}

export interface DashboardStats {
  total_transactions: number;
  categorized: number;
  needs_review: number;
  total_income: number;
  total_expenses: number;
  current_month_income: number;
  current_month_expenses: number;
  monthly: { year: number; month: number; income: number; expenses: number }[];
  categories: { name: string; total: number }[];
  flagged_monthly: { year: number; month: number; count: number }[];
  flagged: Transaction[];
  recent: Transaction[];
}

export interface TransactionsPage {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  sku?: string;
  cost_price: number;
  selling_price: number;
  unit?: string;
  is_active: boolean;
  created_at: string;
}

export interface CategoryAmount {
  category: string;
  amount: number;
}

export interface PnLMonth {
  year: number;
  month: number;
  revenue: number;
  // Переменные расходы — динамические категории клиента
  variable_costs: CategoryAmount[];
  var_total: number;
  gross_profit: number;
  // Постоянные расходы — динамические категории клиента
  fixed_costs: CategoryAmount[];
  fixed_total: number;
  operating_profit: number;
  // Ниже EBITDA — динамические категории клиента
  below_ebitda: CategoryAmount[];
  below_ebitda_total: number;
  net_profit: number;
}

export interface Employee {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  position: string;
  salary: number;
  kpi: number;
  is_active: boolean;
  created_at: string;
}

export const bookkeeping = {
  upload: (companyId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const t = token.get();
    return fetch(`${BASE_URL}/companies/${companyId}/upload`, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: form,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data.data ?? data;
    }) as Promise<{ parsed: number; saved: number; filename: string; transactions: Transaction[] }>;
  },

  getTransactions: (companyId: string, params?: { type?: string; category?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') p[k] = String(v); });
    }
    const qs = Object.keys(p).length ? '?' + new URLSearchParams(p).toString() : '';
    return request<TransactionsPage>(`/companies/${companyId}/transactions${qs}`);
  },

  getDashboardStats: (companyId: string) =>
    request<DashboardStats>(`/companies/${companyId}/bookkeeping/dashboard`),

  createTransaction: (companyId: string, body: Partial<Transaction>) =>
    request<Transaction>(`/companies/${companyId}/transactions`, { method: 'POST', body: JSON.stringify(body) }),

  updateTransaction: (companyId: string, txId: string, body: Partial<Transaction>) =>
    request<Transaction>(`/companies/${companyId}/transactions/${txId}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteTransaction: (companyId: string, txId: string) =>
    request<void>(`/companies/${companyId}/transactions/${txId}`, { method: 'DELETE' }),

  getStats: (companyId: string) =>
    request<BookkeepingStats>(`/companies/${companyId}/bookkeeping/stats`),

  getCategories: (companyId: string) =>
    request<Category[]>(`/companies/${companyId}/categories`),

  createCategory: (companyId: string, body: Partial<Category>) =>
    request<Category>(`/companies/${companyId}/categories`, { method: 'POST', body: JSON.stringify(body) }),

  initCategories: (companyId: string) =>
    request<Category[]>(`/companies/${companyId}/categories/init`, { method: 'POST' }),

  updateCategory: (companyId: string, catId: string, body: Partial<Category>) =>
    request<Category>(`/companies/${companyId}/categories/${catId}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteCategory: (companyId: string, catId: string) =>
    request<void>(`/companies/${companyId}/categories/${catId}`, { method: 'DELETE' }),

  autoCategorize: (companyId: string, body: { description: string; category: string; type?: string }) =>
    request<{ updated: number }>(`/companies/${companyId}/transactions/auto-categorize`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  getPnL: (companyId: string) =>
    request<PnLMonth[]>(`/companies/${companyId}/bookkeeping/pnl`),
};

// ─── PRODUCTS ────────────────────────────

export const products = {
  list: (companyId: string) =>
    request<Product[]>(`/companies/${companyId}/products`),

  create: (companyId: string, body: Partial<Product>) =>
    request<Product>(`/companies/${companyId}/products`, { method: 'POST', body: JSON.stringify(body) }),

  update: (companyId: string, productId: string, body: Partial<Product>) =>
    request<Product>(`/companies/${companyId}/products/${productId}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (companyId: string, productId: string) =>
    request<void>(`/companies/${companyId}/products/${productId}`, { method: 'DELETE' }),
};

// ─── EMPLOYEES ───────────────────────────

export const employees = {
  list: (companyId: string) =>
    request<Employee[]>(`/companies/${companyId}/employees`),

  create: (companyId: string, body: Partial<Employee>) =>
    request<Employee>(`/companies/${companyId}/employees`, { method: 'POST', body: JSON.stringify(body) }),

  update: (companyId: string, empId: string, body: Partial<Employee>) =>
    request<Employee>(`/companies/${companyId}/employees/${empId}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (companyId: string, empId: string) =>
    request<void>(`/companies/${companyId}/employees/${empId}`, { method: 'DELETE' }),
};

// ─── INVITATIONS ─────────────────────────

export const invitations = {
  invite: (companyId: string, body: { email: string; role: Role }) =>
    request<{ invitation: Invitation; invite_link: string; message: string }>(
      `/companies/${companyId}/invite`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  list: (companyId: string) =>
    request<Invitation[]>(`/companies/${companyId}/invitations`),

  revoke: (companyId: string, invId: string) =>
    request<void>(`/companies/${companyId}/invitations/${invId}`, { method: 'DELETE' }),

  verify: (tokenStr: string) =>
    request<{ email: string; role: Role; company_name: string; expires_at: string }>(
      `/invitations/verify/${tokenStr}`
    ),

  accept: (tokenStr: string) =>
    request<void>('/invitations/accept', { method: 'POST', body: JSON.stringify({ token: tokenStr }) }),
};
