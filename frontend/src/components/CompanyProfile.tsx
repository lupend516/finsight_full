import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import {
  Building2, CreditCard, FileSpreadsheet, Mail,
  MapPin, Users, DollarSign, CheckCircle2, Edit,
  Globe, Calendar, TrendingUp, TrendingDown, BarChart3,
  Loader2
} from 'lucide-react';
import { Separator } from './ui/separator';
import { useAuth } from '../context/AuthContext';
import { useFinancialData } from '../hooks/useFinancialData';

const fmt = (n: number) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000
    ? (n / 1_000).toFixed(0) + 'K'
    : String(Math.round(n));

export function CompanyProfile() {
  const { user, company } = useAuth();
  const companyId = company?.id || '';
  const d = useFinancialData(companyId);

  if (!company || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const createdAt = company.created_at
    ? new Date(company.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const planLabel = company.plan === 'premium' ? 'Premium'
    : company.plan === 'basic'   ? 'Basic'
    : company.plan === 'trial'   ? 'Trial'
    : company.plan || 'Free';

  const netProfit  = d.totalIncome - d.totalExpenses;
  const margin     = d.totalIncome > 0 ? Math.round(netProfit / d.totalIncome * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">{company.name}</h3>
          <p className="text-slate-500 mt-1">{company.industry || 'Профиль компании'}</p>
        </div>
        <Button className="gap-2" variant="outline">
          <Edit size={16} />
          Редактировать
        </Button>
      </div>

      {/* Financial snapshot from Audit */}
      {!d.loading && d.totalTransactions > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Общий доход',   value: fmt(d.totalIncome)    + ' ' + (company.currency || '₸'), color: 'text-green-600',  bg: 'bg-green-100',  Icon: TrendingUp   },
            { label: 'Расходы',       value: fmt(d.totalExpenses)  + ' ' + (company.currency || '₸'), color: 'text-red-500',    bg: 'bg-red-100',    Icon: TrendingDown },
            { label: 'Чистая прибыль',value: fmt(Math.abs(netProfit)) + ' ' + (company.currency || '₸'), color: netProfit >= 0 ? 'text-blue-600' : 'text-red-500', bg: 'bg-blue-100', Icon: DollarSign },
            { label: 'Маржа',         value: margin + '%',                                               color: margin >= 20 ? 'text-green-600' : 'text-orange-500', bg: 'bg-purple-100', Icon: BarChart3  },
          ].map(k => {
            const Icon = k.Icon;
            return (
              <Card key={k.label} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center`}>
                    <Icon size={16} className={k.color} />
                  </div>
                  <p className="text-xs text-slate-500">{k.label}</p>
                </div>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{d.totalTransactions} транзакций</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Company Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Информация о компании</h3>
            <p className="text-sm text-slate-500">Основные данные</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-slate-500 mb-1 block text-xs">Название</Label>
            <p className="font-medium text-slate-900">{company.name}</p>
          </div>
          <div>
            <Label className="text-slate-500 mb-1 block text-xs">Отрасль</Label>
            <p className="font-medium text-slate-900">{company.industry || '—'}</p>
          </div>
          <div>
            <Label className="text-slate-500 mb-1 block text-xs">Страна</Label>
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-slate-400" />
              <p className="font-medium text-slate-900">{company.country || '—'}</p>
            </div>
          </div>
          <div>
            <Label className="text-slate-500 mb-1 block text-xs">Валюта</Label>
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-slate-400" />
              <p className="font-medium text-slate-900">{company.currency || '—'}</p>
            </div>
          </div>
          {company.employees && (
            <div>
              <Label className="text-slate-500 mb-1 block text-xs">Сотрудников</Label>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-slate-400" />
                <p className="font-medium text-slate-900">{company.employees}</p>
              </div>
            </div>
          )}
          {company.business_age && (
            <div>
              <Label className="text-slate-500 mb-1 block text-xs">Возраст бизнеса</Label>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <p className="font-medium text-slate-900">{company.business_age}</p>
              </div>
            </div>
          )}
          {company.annual_revenue && (
            <div>
              <Label className="text-slate-500 mb-1 block text-xs">Годовая выручка (план)</Label>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-slate-400" />
                <p className="font-medium text-slate-900">{company.annual_revenue}</p>
              </div>
            </div>
          )}
          <div>
            <Label className="text-slate-500 mb-1 block text-xs">Дата регистрации в FinSight</Label>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <p className="font-medium text-slate-900">{createdAt}</p>
            </div>
          </div>
        </div>

        {/* Business model extras */}
        {(company.tax_system || company.accounting_system || company.sales_type) && (
          <>
            <Separator className="my-5" />
            <div className="grid md:grid-cols-3 gap-4">
              {company.tax_system && (
                <div>
                  <Label className="text-slate-500 mb-1 block text-xs">Система налогообложения</Label>
                  <p className="text-sm font-medium text-slate-800">{company.tax_system}</p>
                </div>
              )}
              {company.accounting_system && (
                <div>
                  <Label className="text-slate-500 mb-1 block text-xs">Система учёта</Label>
                  <p className="text-sm font-medium text-slate-800">{company.accounting_system}</p>
                </div>
              )}
              {company.sales_type && (
                <div>
                  <Label className="text-slate-500 mb-1 block text-xs">Тип продаж</Label>
                  <p className="text-sm font-medium text-slate-800">{company.sales_type}</p>
                </div>
              )}
            </div>
          </>
        )}

        {company.financial_goals && company.financial_goals.length > 0 && (
          <>
            <Separator className="my-5" />
            <div>
              <Label className="text-slate-500 mb-2 block text-xs">Финансовые цели</Label>
              <div className="flex flex-wrap gap-2">
                {company.financial_goals.map(g => (
                  <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Account info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Mail size={24} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Аккаунт</h3>
            <p className="text-sm text-slate-500">Данные владельца</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-slate-400" />
            <div>
              <Label className="text-slate-500 text-xs">Email</Label>
              <p className="font-medium text-slate-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-slate-400" />
            <div>
              <Label className="text-slate-500 text-xs">Имя</Label>
              <p className="font-medium text-slate-900">{user.first_name} {user.last_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className={user.is_verified ? 'text-green-500' : 'text-slate-400'} />
            <div>
              <Label className="text-slate-500 text-xs">Email верифицирован</Label>
              <p className="font-medium text-slate-900">{user.is_verified ? 'Да' : 'Нет'}</p>
            </div>
          </div>
          {user.last_login_at && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-slate-400" />
              <div>
                <Label className="text-slate-500 text-xs">Последний вход</Label>
                <p className="font-medium text-slate-900">
                  {new Date(user.last_login_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Subscription */}
      <Card className="p-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Подписка</h3>
              <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle2 size={12} className="mr-1" />
                Активна
              </Badge>
            </div>
          </div>
          <Button variant="outline" className="bg-white">Сменить тариф</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-slate-600 mb-1 block text-xs">Тариф</Label>
            <p className="text-2xl font-bold text-slate-900">{planLabel}</p>
          </div>
          <div>
            <Label className="text-slate-600 mb-1 block text-xs">Компания активна</Label>
            <p className="font-medium text-slate-900">{company.is_active ? 'Да' : 'Нет'}</p>
          </div>
        </div>

        <Separator className="my-5 bg-blue-200" />

        <div className="bg-white rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-3">Что входит в план:</h4>
          <ul className="space-y-2">
            {[
              'Все модули FinSight',
              'AI финансовый консультант',
              'Загрузка выписок и авто-категоризация',
              'Отчёты ДДС и ОПиУ (начисление)',
              'Модуль продаж с аналитикой',
            ].map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 size={15} className="text-green-600 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Connected sources placeholder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Источники данных</h3>
            <p className="text-sm text-slate-500">Загрузка выписок и интеграции</p>
          </div>
          <Button variant="outline">+ Добавить</Button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Ручная загрузка (CSV/Excel)', type: 'Транзакции', Icon: FileSpreadsheet, ok: true },
            { name: 'Kaspi Bank API', type: 'Банк (скоро)', Icon: CreditCard, ok: false },
            { name: 'Halyk Bank API', type: 'Банк (скоро)', Icon: CreditCard, ok: false },
          ].map(s => {
            const Icon = s.Icon;
            return (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                    <Icon size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.type}</p>
                  </div>
                </div>
                <Badge className={s.ok ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-100'}>
                  {s.ok ? 'Активно' : 'Скоро'}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-2 border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-4">Опасная зона</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">Удалить компанию</p>
            <p className="text-sm text-slate-500">Все данные будут безвозвратно удалены</p>
          </div>
          <Button variant="destructive" size="sm">Удалить компанию</Button>
        </div>
      </Card>
    </div>
  );
}
