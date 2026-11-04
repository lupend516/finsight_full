import React, { useState } from 'react';
import { Screen } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import {
  Brain, Building2, ShoppingCart, Target, CheckCircle2,
  ArrowRight, ArrowLeft, FileSpreadsheet, CreditCard, Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { companies, currentCompany } from '../lib/api';

interface InitialAuditProps {
  onNavigate: (screen: Screen) => void;
}

export function InitialAudit({ onNavigate }: InitialAuditProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    // Step 1 — Basic Business Profile
    businessCategory: '',
    country: '',
    annualRevenue: '',
    businessAge: '',
    employees: '',
    userRole: '',
    // Step 2 — Business Model
    salesType: '',
    salesChannels: [] as string[],
    productsCount: '',
    averageCheck: '',
    salesFrequency: '',
    seasonality: '' as 'yes' | 'no' | '',
    // Step 3 — Accounting & Tax
    accountingSystem: '',
    taxSystem: '',
    // Step 4 — Financial Goals
    financialGoals: [] as string[],
  });

  const salesChannelOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'marketplaces', label: 'Маркетплейсы (Kaspi, Wildberries…)' },
    { value: 'website', label: 'Собственный сайт' },
    { value: 'offline', label: 'Офлайн магазин' },
    { value: 'b2b_direct', label: 'B2B прямые продажи' },
    { value: 'other', label: 'Другое' },
  ];

  const financialGoalOptions = [
    'Revenue growth',
    'Cost optimization',
    'Fundraising preparation',
    'Improve cash flow',
    'Tax optimization',
    'Operational efficiency',
  ];

  const toggleChannel = (val: string) => {
    setFormData(prev => ({
      ...prev,
      salesChannels: prev.salesChannels.includes(val)
        ? prev.salesChannels.filter(c => c !== val)
        : [...prev.salesChannels, val],
    }));
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      financialGoals: prev.financialGoals.includes(goal)
        ? prev.financialGoals.filter(g => g !== goal)
        : [...prev.financialGoals, goal],
    }));
  };

  const handleComplete = async () => {
    const company = currentCompany.get();
    if (!company) {
      onNavigate('dashboard');
      return;
    }

    setSaving(true);
    try {
      await companies.update(company.id, {
        business_category: formData.businessCategory,
        country:           formData.country,
        annual_revenue:    formData.annualRevenue,
        business_age:      formData.businessAge,
        employees:         formData.employees,
        user_role:         formData.userRole,
        sales_type:        formData.salesType,
        sales_channels:    formData.salesChannels,
        products_count:    formData.productsCount,
        average_check:     formData.averageCheck,
        sales_frequency:   formData.salesFrequency,
        seasonality:       formData.seasonality === 'yes' ? true
                         : formData.seasonality === 'no'  ? false
                         : undefined,
        accounting_system: formData.accountingSystem,
        tax_system:        formData.taxSystem,
        financial_goals:   formData.financialGoals,
      });
    } catch {
      // не блокируем переход если что-то пошло не так
    } finally {
      setSaving(false);
    }

    onNavigate('dashboard');
  };

  const field = (key: keyof typeof formData, val: string) =>
    setFormData(prev => ({ ...prev, [key]: val }));

  const renderStep = () => {
    switch (currentStep) {
      // ─────────────────────────────────────────────────────────────
      // ШАГ 1: Базовый профиль бизнеса
      // ─────────────────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Базовый профиль бизнеса</h2>
              <p className="text-slate-600">Расскажи о своём бизнесе — AI настроит аналитику под тебя</p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              {/* Категория бизнеса */}
              <div>
                <Label>Категория бизнеса *</Label>
                <Select value={formData.businessCategory} onValueChange={v => field('businessCategory', v)}>
                  <SelectTrigger><SelectValue placeholder="Выбери категорию" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Ритейл</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="manufacturing">Производство</SelectItem>
                    <SelectItem value="services">Услуги</SelectItem>
                    <SelectItem value="b2b">B2B</SelectItem>
                    <SelectItem value="b2c">B2C</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Страна / рынок */}
              <div>
                <Label>Страна / рынок *</Label>
                <Select value={formData.country} onValueChange={v => field('country', v)}>
                  <SelectTrigger><SelectValue placeholder="Выбери страну" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kz">Казахстан</SelectItem>
                    <SelectItem value="ru">Россия</SelectItem>
                    <SelectItem value="us">США</SelectItem>
                    <SelectItem value="uk">Великобритания</SelectItem>
                    <SelectItem value="eu">Европа</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Годовая выручка */}
              <div>
                <Label>Годовая выручка *</Label>
                <Select value={formData.annualRevenue} onValueChange={v => field('annualRevenue', v)}>
                  <SelectTrigger><SelectValue placeholder="Выбери диапазон" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lt50k">Менее $50k</SelectItem>
                    <SelectItem value="50k-150k">$50k – $150k</SelectItem>
                    <SelectItem value="150k-500k">$150k – $500k</SelectItem>
                    <SelectItem value="500k+">$500k+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Возраст бизнеса */}
              <div>
                <Label>Возраст бизнеса *</Label>
                <Select value={formData.businessAge} onValueChange={v => field('businessAge', v)}>
                  <SelectTrigger><SelectValue placeholder="Сколько лет бизнесу" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0–1 год</SelectItem>
                    <SelectItem value="1-3">1–3 года</SelectItem>
                    <SelectItem value="3-5">3–5 лет</SelectItem>
                    <SelectItem value="5+">5+ лет</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Кол-во сотрудников */}
                <div>
                  <Label>Сотрудников</Label>
                  <Select value={formData.employees} onValueChange={v => field('employees', v)}>
                    <SelectTrigger><SelectValue placeholder="Размер команды" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Только я</SelectItem>
                      <SelectItem value="2-5">2–5</SelectItem>
                      <SelectItem value="6-20">6–20</SelectItem>
                      <SelectItem value="21-50">21–50</SelectItem>
                      <SelectItem value="50+">50+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Роль пользователя */}
                <div>
                  <Label>Твоя роль</Label>
                  <Select value={formData.userRole} onValueChange={v => field('userRole', v)}>
                    <SelectTrigger><SelectValue placeholder="Кто ты в компании" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner / Владелец</SelectItem>
                      <SelectItem value="ceo">CEO</SelectItem>
                      <SelectItem value="cfo">CFO</SelectItem>
                      <SelectItem value="accountant">Бухгалтер</SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      // ─────────────────────────────────────────────────────────────
      // ШАГ 2: Бизнес-модель
      // ─────────────────────────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Бизнес-модель</h2>
              <p className="text-slate-600">Как ты продаёшь — AI поймёт volatility и cash flow</p>
            </div>

            <div className="space-y-5 max-w-lg mx-auto">
              {/* Тип продаж */}
              <div>
                <Label className="mb-3 block">Тип продаж *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'online', label: 'Онлайн' },
                    { value: 'offline', label: 'Офлайн' },
                    { value: 'mixed', label: 'Смешанный' },
                  ].map(opt => (
                    <Card
                      key={opt.value}
                      onClick={() => field('salesType', opt.value)}
                      className={`p-3 text-center cursor-pointer transition-all ${
                        formData.salesType === opt.value
                          ? 'border-2 border-purple-500 bg-purple-50'
                          : 'border-2 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-medium text-sm text-slate-900">{opt.label}</span>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Каналы продаж */}
              <div>
                <Label className="mb-3 block">Каналы продаж (можно несколько)</Label>
                <div className="space-y-2">
                  {salesChannelOptions.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => toggleChannel(opt.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.salesChannels.includes(opt.value)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Checkbox
                        checked={formData.salesChannels.includes(opt.value)}
                        onCheckedChange={() => toggleChannel(opt.value)}
                      />
                      <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                      {formData.salesChannels.includes(opt.value) && (
                        <CheckCircle2 size={16} className="text-purple-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Кол-во продуктов */}
                <div>
                  <Label>Кол-во продуктов</Label>
                  <Select value={formData.productsCount} onValueChange={v => field('productsCount', v)}>
                    <SelectTrigger><SelectValue placeholder="Примерно" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1–10</SelectItem>
                      <SelectItem value="11-50">11–50</SelectItem>
                      <SelectItem value="51-200">51–200</SelectItem>
                      <SelectItem value="200+">200+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Средний чек */}
                <div>
                  <Label>Средний чек</Label>
                  <Select value={formData.averageCheck} onValueChange={v => field('averageCheck', v)}>
                    <SelectTrigger><SelectValue placeholder="Диапазон" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lt50">Менее $50</SelectItem>
                      <SelectItem value="50-200">$50–$200</SelectItem>
                      <SelectItem value="200-500">$200–$500</SelectItem>
                      <SelectItem value="500+">$500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Частота продаж */}
                <div>
                  <Label>Частота продаж</Label>
                  <Select value={formData.salesFrequency} onValueChange={v => field('salesFrequency', v)}>
                    <SelectTrigger><SelectValue placeholder="Как часто" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Ежедневно</SelectItem>
                      <SelectItem value="weekly">Еженедельно</SelectItem>
                      <SelectItem value="irregular">Нерегулярно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Сезонность */}
                <div>
                  <Label>Сезонность</Label>
                  <Select value={formData.seasonality} onValueChange={v => field('seasonality', v as 'yes' | 'no')}>
                    <SelectTrigger><SelectValue placeholder="Есть ли сезонность" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Да</SelectItem>
                      <SelectItem value="no">Нет</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      // ─────────────────────────────────────────────────────────────
      // ШАГ 3: Бухгалтерия и налоги
      // ─────────────────────────────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Бухгалтерия и налоги</h2>
              <p className="text-slate-600">Какие системы ты сейчас используешь?</p>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <Label>Система учёта *</Label>
                <Select value={formData.accountingSystem} onValueChange={v => field('accountingSystem', v)}>
                  <SelectTrigger><SelectValue placeholder="Выбери систему" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1c">1C Бухгалтерия</SelectItem>
                    <SelectItem value="quickbooks">QuickBooks</SelectItem>
                    <SelectItem value="xero">Xero</SelectItem>
                    <SelectItem value="excel">Excel / таблицы</SelectItem>
                    <SelectItem value="none">Нет системы (вручную)</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Система налогообложения *</Label>
                <Select value={formData.taxSystem} onValueChange={v => field('taxSystem', v)}>
                  <SelectTrigger><SelectValue placeholder="Выбери систему" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Общая система (ОСН)</SelectItem>
                    <SelectItem value="simplified">Упрощённая (УСН)</SelectItem>
                    <SelectItem value="patent">Патентная система</SelectItem>
                    <SelectItem value="vat">С НДС</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Label className="mb-3 block">Подключение банка (опционально)</Label>
                <Card className="p-4 border-2 border-dashed border-slate-300">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard size={24} className="text-slate-400" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Подключи банк</p>
                      <p className="text-sm text-slate-600">Автоматическая синхронизация транзакций</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">Подключить банк</Button>
                </Card>
              </div>
            </div>
          </div>
        );

      // ─────────────────────────────────────────────────────────────
      // ШАГ 4: Финансовые цели
      // ─────────────────────────────────────────────────────────────
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Финансовые цели</h2>
              <p className="text-slate-600">Выбери всё, что актуально — AI расставит приоритеты</p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              {financialGoalOptions.map(goal => (
                <Card
                  key={goal}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.financialGoals.includes(goal)
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border-2 border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => toggleGoal(goal)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.financialGoals.includes(goal)}
                      onCheckedChange={() => toggleGoal(goal)}
                    />
                    <span className="font-medium text-slate-900">{goal}</span>
                    {formData.financialGoals.includes(goal) && (
                      <CheckCircle2 size={20} className="text-blue-600 ml-auto" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-6 max-w-lg mx-auto mt-6">
              <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Brain size={20} className="text-blue-600" />
                AI персонализация
              </h3>
              <p className="text-sm text-slate-700">
                На основе твоих ответов FinSight настроит инсайты и рекомендации под твои цели.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">FinSight</h1>
          </div>
          <div className="text-sm text-slate-600">Шаг {currentStep} из {totalSteps}</div>
        </div>
      </header>

      <div className="flex items-center justify-center p-8 min-h-[calc(100vh-72px)]">
        <Card className="max-w-3xl w-full p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Начальный аудит бизнеса</span>
              <span className="text-sm text-slate-500">{Math.round((currentStep / totalSteps) * 100)}% завершено</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} />
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft size={16} className="mr-2" />
              Назад
            </Button>
            <Button
              onClick={() => {
                if (currentStep === totalSteps) {
                  handleComplete();
                } else {
                  setCurrentStep(s => s + 1);
                }
              }}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <><Loader2 size={16} className="mr-2 animate-spin" />Сохранение…</>
              ) : currentStep === totalSteps ? (
                <>Завершить<ArrowRight size={16} className="ml-2" /></>
              ) : (
                <>Далее<ArrowRight size={16} className="ml-2" /></>
              )}
            </Button>
          </div>

          {currentStep < totalSteps && (
            <div className="text-center mt-4">
              <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-sm text-slate-500">
                Пропустить пока
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
