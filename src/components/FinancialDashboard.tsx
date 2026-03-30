import { useState, useMemo } from 'react';
import { useInvoices } from '../store/invoices';
import type { Invoice } from '../types';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart, PieChart, Pie, Cell,
} from 'recharts';
import {
  DollarSign, TrendingUp, Wallet, ShoppingCart, Download, Calendar,
  Filter, ChevronDown, FileSpreadsheet, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart as PieChartIcon, Activity,
} from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  MMK: 'Ks', THB: '฿', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
  CAD: 'C$', AUD: 'A$', INR: '₹', BRL: 'R$',
};

function fmtFull(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtCurrency(amount: number, currency = 'MMK'): string {
  const sym = CURRENCY_SYMBOLS[currency] || 'Ks';
  return `${sym}${fmtFull(amount)}`;
}

type DateFilter = 'this_month' | 'last_3_months' | 'last_6_months' | 'this_year' | 'all_time' | 'custom';

const MONTH_NAMES = ['ဇန်', 'ဖေ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူ', 'ဩ', 'စက်', 'အောက်', 'နို', 'ဒီ'];

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

interface Props {
  onBack: () => void;
}

export default function FinancialDashboard({ onBack }: Props) {
  const { invoices } = useInvoices();

  const [dateFilter, setDateFilter] = useState<DateFilter>('all_time');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeChart, setActiveChart] = useState<'bar' | 'line' | 'area'>('bar');

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateFilter) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'custom':
        if (customStart) startDate = new Date(customStart + 'T00:00:00');
        if (customEnd) endDate = new Date(customEnd + 'T23:59:59');
        break;
      case 'all_time':
      default:
        break;
    }

    return invoices.filter((inv) => {
      const invDate = new Date(inv.date + 'T00:00:00');
      if (startDate && invDate < startDate) return false;
      if (endDate && invDate > endDate) return false;
      return true;
    });
  }, [invoices, dateFilter, customStart, customEnd]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
    const totalDeposits = filteredInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalOutstanding = filteredInvoices.reduce(
      (s, i) => s + Math.max(0, i.balanceDue ?? (i.total - (i.paidAmount || 0))),
      0
    );
    const orderCount = filteredInvoices.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const collectionRate = totalRevenue > 0 ? (totalDeposits / totalRevenue) * 100 : 0;

    const prevPeriodInvoices = invoices.filter((inv) => {
      const found = filteredInvoices.find((f) => f.id === inv.id);
      return !found;
    });
    const prevRevenue = prevPeriodInvoices.reduce((s, i) => s + i.total, 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      totalRevenue, totalDeposits, totalOutstanding, orderCount,
      avgOrderValue, collectionRate, revenueGrowth,
    };
  }, [filteredInvoices, invoices]);

  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { month: string; revenue: number; deposits: number; outstanding: number; orders: number }> = {};

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = {
        month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
        revenue: 0, deposits: 0, outstanding: 0, orders: 0,
      };
    }

    filteredInvoices.forEach((inv) => {
      const d = new Date(inv.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        monthMap[key].revenue += inv.total;
        monthMap[key].deposits += inv.paidAmount || 0;
        monthMap[key].outstanding += Math.max(0, inv.balanceDue ?? (inv.total - (inv.paidAmount || 0)));
        monthMap[key].orders += 1;
      }
    });

    return Object.values(monthMap);
  }, [filteredInvoices]);

  const yearlyData = useMemo(() => {
    const yearMap: Record<string, { year: string; revenue: number; deposits: number; orders: number }> = {};

    invoices.forEach((inv) => {
      const year = new Date(inv.date + 'T00:00:00').getFullYear().toString();
      if (!yearMap[year]) {
        yearMap[year] = { year, revenue: 0, deposits: 0, orders: 0 };
      }
      yearMap[year].revenue += inv.total;
      yearMap[year].deposits += inv.paidAmount || 0;
      yearMap[year].orders += 1;
    });

    return Object.values(yearMap).sort((a, b) => a.year.localeCompare(b.year));
  }, [invoices]);

  const statusData = useMemo(() => {
    const counts = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    filteredInvoices.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    return [
      { name: 'မူကြမ်း', value: counts.draft, color: '#6366f1' },
      { name: 'ပို့ပြီး', value: counts.sent, color: '#3b82f6' },
      { name: 'ပေးပြီး', value: counts.paid, color: '#10b981' },
      { name: 'ရက်လွန်', value: counts.overdue, color: '#ef4444' },
    ].filter((s) => s.value > 0);
  }, [filteredInvoices]);

  const topClients = useMemo(() => {
    const clientMap: Record<string, { name: string; company: string; total: number; paid: number; count: number }> = {};
    filteredInvoices.forEach((inv) => {
      const key = inv.clientEmail || inv.clientName || 'Unknown';
      if (!clientMap[key]) {
        clientMap[key] = { name: inv.clientName, company: inv.clientCompany, total: 0, paid: 0, count: 0 };
      }
      clientMap[key].total += inv.total;
      clientMap[key].paid += inv.paidAmount || 0;
      clientMap[key].count += 1;
    });
    return Object.values(clientMap).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [filteredInvoices]);

  const exportCSV = (data: Invoice[], filename: string) => {
    const headers = [
      'ပြေစာနံပါတ်', 'ရက်စွဲ', 'နောက်ဆုံးရက်', 'အခြေအနေ', 'ဖောက်သည်', 'ကုမ္ပဏီ',
      'အီးမေးလ်', 'ငွေကြေး', 'ခွဲစုစုပေါင်း', 'အခွန်(%)', 'အခွန်ပမာဏ',
      'လျှော့စျေး(%)', 'လျှော့စျေးပမာဏ', 'စုစုပေါင်း', 'ပေးပြီးငွေ', 'ကျန်ငွေ',
      'ဖန်တီးသူ', 'ဖန်တီးသည့်ရက်',
    ];

    const rows = data.map((inv) => [
      inv.invoiceNumber, inv.date, inv.dueDate, inv.status, inv.clientName,
      inv.clientCompany, inv.clientEmail, inv.currency, fmtFull(inv.subtotal),
      inv.taxRate.toString(), fmtFull(inv.taxAmount), inv.discountRate.toString(),
      fmtFull(inv.discountAmount), fmtFull(inv.total),
      fmtFull(inv.paidAmount || 0),
      fmtFull(inv.balanceDue ?? (inv.total - (inv.paidAmount || 0))),
      inv.createdByName, inv.createdAt,
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummaryCSV = () => {
    const headers = ['အချက်', 'တန်ဖိုး'];
    const rows = [
      ['ကာလ', dateFilter === 'custom' ? `${customStart} မှ ${customEnd}` : filterLabels[dateFilter]],
      ['စုစုပေါင်း ဝင်ငွေ', fmtFull(metrics.totalRevenue)],
      ['ရရှိပြီးငွေ စုစုပေါင်း', fmtFull(metrics.totalDeposits)],
      ['ကျန်ငွေ စုစုပေါင်း', fmtFull(metrics.totalOutstanding)],
      ['အော်ဒါ အရေအတွက်', metrics.orderCount.toString()],
      ['ပျမ်းမျှ အော်ဒါ တန်ဖိုး', fmtFull(metrics.avgOrderValue)],
      ['ရရှိမှု နှုန်း', `${metrics.collectionRate.toFixed(1)}%`],
      ['', ''],
      ['--- လစဉ် ခွဲခြမ်းချက် ---', ''],
      ['လ', 'ဝင်ငွေ,ရရှိပြီး,ကျန်ရှိ,အော်ဒါ'],
      ...monthlyData.map((m) => [m.month, `${fmtFull(m.revenue)},${fmtFull(m.deposits)},${fmtFull(m.outstanding)},${m.orders}`]),
    ];

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ငွေကြေးအကျဉ်း_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterLabels: Record<DateFilter, string> = {
    this_month: 'ဤလ',
    last_3_months: 'လ ၃ လ',
    last_6_months: 'လ ၆ လ',
    this_year: 'ဤနှစ်',
    all_time: 'အားလုံး',
    custom: 'စိတ်ကြိုက်',
  };
  const filterLabel = filterLabels[dateFilter];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
          <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              <span className="text-slate-500">{p.name}:</span>
              <span className="font-semibold text-slate-800">{fmtCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 print:p-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                ငွေကြေးစီမံ ဒက်ရှ်ဘုတ်
              </h1>
            </div>
            <p className="text-sm text-slate-500 ml-8 lg:ml-14">
              Firestore ပြေစာ အချက်အလက်မှ စီးပွားရေး စွမ်းဆောင်ရည် ခြေရာခံရန်
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <Filter className="w-4 h-4 text-indigo-500" />
                {filterLabel}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
              </button>

              {showFilterPanel && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowFilterPanel(false)} />
                  <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 p-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      ရက်စွဲ စစ်ထုတ်ခြင်း
                    </h3>
                    <div className="space-y-1.5 mb-3">
                      {(['this_month', 'last_3_months', 'last_6_months', 'this_year', 'all_time'] as DateFilter[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => { setDateFilter(f); setShowFilterPanel(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                            dateFilter === f
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {({ this_month: '📅 ဤလ', last_3_months: '📊 လ ၃ လ', last_6_months: '📈 လ ၆ လ', this_year: '🗓️ ဤနှစ်', all_time: '♾️ အားလုံး', custom: '' } as Record<DateFilter, string>)[f]}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <button
                        onClick={() => setDateFilter('custom')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition mb-2 ${
                          dateFilter === 'custom'
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        🔧 စိတ်ကြိုက် ရက်စွဲ
                      </button>
                      {dateFilter === 'custom' && (
                        <div className="space-y-2 pl-3">
                          <div>
                            <label className="text-xs text-slate-500 font-medium">စတင်ရက်</label>
                            <input
                              type="date"
                              value={customStart}
                              onChange={(e) => setCustomStart(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium">ပြီးဆုံးရက်</label>
                            <input
                              type="date"
                              value={customEnd}
                              onChange={(e) => setCustomEnd(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <button
                            onClick={() => setShowFilterPanel(false)}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition mt-1"
                          >
                            စစ်ထုတ်မည်
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={exportSummaryCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition shadow-sm shadow-emerald-500/20"
              title="ငွေကြေးအကျဉ်း ထုတ်ရန်"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">အကျဉ်း ထုတ်ရန်</span>
            </button>
            <button
              onClick={() => exportCSV(filteredInvoices, `ပြေစာများ_${dateFilter}_${new Date().toISOString().split('T')[0]}`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition shadow-sm"
              title="ပြေစာ အချက်အလက်အားလုံး ထုတ်ရန်"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">အားလုံးထုတ်</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active filter badge */}
      {dateFilter !== 'all_time' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold">
            <Calendar className="w-3 h-3" />
            {filterLabel}
            {dateFilter === 'custom' && customStart && customEnd && ` (${customStart} → ${customEnd})`}
          </span>
          <button
            onClick={() => setDateFilter('all_time')}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            စစ်ထုတ်မှု ဖျက်ရန်
          </button>
          <span className="text-xs text-slate-400">
            • ပြေစာ {filteredInvoices.length} ခု
          </span>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-indigo-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              {metrics.revenueGrowth !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  metrics.revenueGrowth > 0 ? 'bg-emerald-400/20 text-emerald-100' : 'bg-red-400/20 text-red-100'
                }`}>
                  {metrics.revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(metrics.revenueGrowth).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{fmtCurrency(metrics.totalRevenue)}</p>
            <p className="text-indigo-200 text-xs mt-1 font-medium">စုစုပေါင်း ဝင်ငွေ</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
                {metrics.collectionRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{fmtCurrency(metrics.totalDeposits)}</p>
            <p className="text-emerald-200 text-xs mt-1 font-medium">ရရှိပြီး စုစုပေါင်း</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-lg shadow-amber-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{fmtCurrency(metrics.totalOutstanding)}</p>
            <p className="text-amber-200 text-xs mt-1 font-medium">ကျန်ငွေ စုစုပေါင်း</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg shadow-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{metrics.orderCount}</p>
            <p className="text-purple-200 text-xs mt-1 font-medium">အော်ဒါ အရေအတွက်</p>
            <p className="text-white/70 text-[10px] mt-0.5">ပျမ်းမျှ: {fmtCurrency(metrics.avgOrderValue)}</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ပျမ်းမျှ တန်ဖိုး</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{fmtCurrency(metrics.avgOrderValue)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ရရှိမှု နှုန်း</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{metrics.collectionRate.toFixed(1)}%</p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2">
            <div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(metrics.collectionRate, 100)}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ဖောက်သည်</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{new Set(filteredInvoices.map(i => i.clientEmail || i.clientName).filter(Boolean)).size}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">ရက်လွန်</p>
          <p className={`text-lg font-bold mt-1 ${filteredInvoices.filter(i => i.status === 'overdue').length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {filteredInvoices.filter(i => i.status === 'overdue').length}
          </p>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              လစဉ် ရောင်းအားလမ်းကြောင်း
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">ဝင်ငွေ၊ ရရှိပြီး နှင့် ကျန်ရှိ လစဉ်</p>
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {(['bar', 'area', 'line'] as const).map(type => (
              <button
                key={type}
                onClick={() => setActiveChart(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activeChart === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type === 'bar' ? <><BarChart3 className="w-3.5 h-3.5 inline mr-1" /> Bar</> :
                 type === 'area' ? <><Activity className="w-3.5 h-3.5 inline mr-1" /> Area</> :
                 <><TrendingUp className="w-3.5 h-3.5 inline mr-1" /> Line</>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {monthlyData.some((m) => m.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={350}>
              {activeChart === 'bar' ? (
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtFull(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Bar dataKey="revenue" name="ဝင်ငွေ" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="deposits" name="ရရှိပြီး" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="outstanding" name="ကျန်ရှိ" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              ) : activeChart === 'area' ? (
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtFull(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Area type="monotone" dataKey="revenue" name="ဝင်ငွေ" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="deposits" name="ရရှိပြီး" stroke="#10b981" fill="url(#colorDeposits)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtFull(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Line type="monotone" dataKey="revenue" name="ဝင်ငွေ" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="deposits" name="ရရှိပြီး" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="outstanding" name="ကျန်ရှိ" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#f59e0b' }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">ရွေးချယ်ထားသော ကာလအတွက် အချက်အလက် မရှိပါ</p>
                <p className="text-xs text-slate-400 mt-1">လစဉ် လမ်းကြောင်း ကြည့်ရန် ပြေစာများ ဖန်တီးပါ</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Growth + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              နှစ်စဉ် တိုးတက်မှု
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">နှစ်စဉ် ဝင်ငွေ နှင့် ရရှိပြီးငွေ တိုးတက်မှု</p>
          </div>
          <div className="p-4 sm:p-6">
            {yearlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={yearlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtFull(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Line type="monotone" dataKey="revenue" name="ဝင်ငွေ" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#6366f1' }} />
                  <Line type="monotone" dataKey="deposits" name="ရရှိပြီး" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500">နှစ်စဉ် အချက်အလက် မရှိသေးပါ</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-500" />
              အခြေအနေ ခွဲဝေမှု
            </h2>
          </div>
          <div className="p-4">
            {statusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {statusData.map((_entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} အော်ဒါ`, name]}
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px', padding: '8px 12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusData.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600">{s.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">အချက်အလက် မရှိပါ</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">ထိပ်တန်း ဖောက်သည်များ</h2>
            <p className="text-xs text-slate-400 mt-0.5">ဝင်ငွေ အများဆုံး ဖောက်သည်များ</p>
          </div>
        </div>
        {topClients.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {topClients.map((client, i) => {
              const payRate = client.total > 0 ? (client.paid / client.total) * 100 : 0;
              return (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                      ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'][i]
                    }`}>
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{client.name || 'အမည်မသိ'}</p>
                      {client.company && <p className="text-xs text-slate-400">{client.company}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{fmtCurrency(client.total)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-600 font-medium">ပေးပြီး: {fmtCurrency(client.paid)}</span>
                      <span className="text-[10px] text-slate-400">({payRate.toFixed(0)}%)</span>
                      <span className="text-[10px] text-slate-400">{client.count} အော်ဒါ</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">ရွေးချယ်ထားသော ကာလအတွက် ဖောက်သည် အချက်အလက် မရှိပါ</p>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              ငွေကြေး အစီရင်ခံစာ ထုတ်ယူရန်
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              စာရင်းကိုင် နှင့် မှတ်တမ်းတင်ခြင်းအတွက် ငွေကြေး အချက်အလက်ကို CSV ဖိုင်အဖြစ် ဒေါင်းလုဒ်ဆွဲပါ
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={exportSummaryCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-400 transition shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              အကျဉ်း CSV
            </button>
            <button
              onClick={() => exportCSV(filteredInvoices, `ပြေစာ_အသေးစိတ်_${new Date().toISOString().split('T')[0]}`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-medium hover:bg-white/20 transition"
            >
              <Download className="w-4 h-4" />
              ပြေစာ CSV အပြည့်
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold">{filteredInvoices.length}</p>
            <p className="text-xs text-slate-400">မှတ်တမ်း</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{fmtCurrency(metrics.totalDeposits)}</p>
            <p className="text-xs text-slate-400">ရရှိပြီး</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{fmtCurrency(metrics.totalOutstanding)}</p>
            <p className="text-xs text-slate-400">ကျန်ရှိ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{metrics.collectionRate.toFixed(0)}%</p>
            <p className="text-xs text-slate-400">ရရှိမှု နှုန်း</p>
          </div>
        </div>
      </div>
    </div>
  );
}
