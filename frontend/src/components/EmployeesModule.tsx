import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Plus, Edit, Trash2, X, Loader2, Users, DollarSign, TrendingUp, UserCheck
} from 'lucide-react';
import { employees as empApi, type Employee } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const POSITIONS = [
  'CEO / Директор', 'COO / Операционный директор', 'CFO / Финансовый директор',
  'Менеджер по продажам', 'Маркетолог', 'Бухгалтер', 'Разработчик', 'Дизайнер',
  'Логист', 'Кладовщик', 'Оператор', 'Администратор', 'HR', 'Другое',
];

function fmt(n: number) {
  return n.toLocaleString('ru', { maximumFractionDigits: 0 });
}

function EmployeeModal({
  existing, companyId, onClose, onSaved,
}: {
  existing?: Employee;
  companyId: string;
  onClose: () => void;
  onSaved: (e: Employee) => void;
}) {
  const [form, setForm] = useState({
    first_name: existing?.first_name || '',
    last_name:  existing?.last_name  || '',
    position:   existing?.position   || '',
    salary:     existing?.salary     ? String(existing.salary)  : '',
    kpi:        existing?.kpi        ? String(existing.kpi)     : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Имя и фамилия обязательны');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: Partial<Employee> = {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        position:   form.position,
        salary:     parseFloat(form.salary) || 0,
        kpi:        parseFloat(form.kpi)    || 0,
      };
      let emp: Employee;
      if (existing) {
        emp = await empApi.update(companyId, existing.id, body);
      } else {
        emp = await empApi.create(companyId, body);
      }
      onSaved(emp);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{existing ? 'Редактировать' : 'Добавить'} сотрудника</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X size={16} /></Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Имя *</Label>
            <Input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Иван" />
          </div>
          <div>
            <Label>Фамилия *</Label>
            <Input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Иванов" />
          </div>
        </div>

        <div>
          <Label>Должность</Label>
          <select
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white"
            value={form.position}
            onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
          >
            <option value="">— Выбери должность —</option>
            {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Оклад (₸/мес)</Label>
            <Input type="number" min="0" placeholder="150000" value={form.salary}
              onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
          </div>
          <div>
            <Label>KPI (% от продаж)</Label>
            <Input type="number" min="0" max="100" step="0.5" placeholder="5" value={form.kpi}
              onChange={e => setForm(p => ({ ...p, kpi: e.target.value }))} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
            {existing ? 'Сохранить' : 'Добавить'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function EmployeesModule() {
  const { company } = useAuth();
  const companyId = company?.id || '';

  const [list, setList]         = useState<Employee[]>([]);
  const [loading, setLoading]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [editEmp, setEditEmp]   = useState<Employee | null>(null);

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await empApi.list(companyId);
      setList(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id: string) => {
    if (!confirm('Удалить сотрудника?')) return;
    await empApi.delete(companyId, id);
    setList(prev => prev.filter(e => e.id !== id));
  };

  const onSaved = (emp: Employee) => {
    setList(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      return idx >= 0 ? prev.map(e => e.id === emp.id ? emp : e) : [...prev, emp];
    });
    setShowNew(false);
    setEditEmp(null);
  };

  const active  = list.filter(e => e.is_active);
  const totalSalary = active.reduce((s, e) => s + e.salary, 0);
  const avgKPI      = active.length > 0 ? (active.reduce((s, e) => s + e.kpi, 0) / active.length) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Всего сотрудников', value: String(list.length),       icon: Users,      color: 'text-blue-600',   bg: 'bg-blue-100'   },
          { label: 'Активных',          value: String(active.length),      icon: UserCheck,  color: 'text-green-600',  bg: 'bg-green-100'  },
          { label: 'Общий ФОТ / мес',   value: fmt(totalSalary) + ' ₸',   icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-100' },
          { label: 'Средний KPI %',      value: avgKPI.toFixed(1) + '%',   icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
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

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Сотрудники</h3>
            <p className="text-xs text-slate-500 mt-0.5">Список с окладами и KPI</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => setShowNew(true)}>
            <Plus size={14} className="mr-1" />Добавить
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={28} className="animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Загрузка...</p>
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Нет сотрудников</p>
            <p className="text-slate-400 text-sm mt-1">Нажми «Добавить» чтобы внести первого</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Должность</TableHead>
                <TableHead className="text-right">Оклад (₸/мес)</TableHead>
                <TableHead className="text-right">KPI (%)</TableHead>
                <TableHead className="text-right">Общ. затраты *</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(emp => {
                const totalCost = emp.salary; // KPI добавляется из продаж динамически
                return (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{emp.first_name} {emp.last_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{emp.position || '—'}</TableCell>
                    <TableCell className="text-right font-medium text-slate-900">{fmt(emp.salary)}</TableCell>
                    <TableCell className="text-right">
                      {emp.kpi > 0 ? (
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{emp.kpi}%</Badge>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700">{fmt(totalCost)}</TableCell>
                    <TableCell>
                      {emp.is_active
                        ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Активен</Badge>
                        : <Badge variant="secondary">Неактивен</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditEmp(emp)}><Edit size={13} /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => remove(emp.id)}><Trash2 size={13} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {list.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            * KPI % от продаж рассчитывается отдельно при проведении транзакций по категории «KPI / % от продаж»
          </div>
        )}
      </Card>

      {(showNew || editEmp) && (
        <EmployeeModal
          existing={editEmp || undefined}
          companyId={companyId}
          onClose={() => { setShowNew(false); setEditEmp(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
