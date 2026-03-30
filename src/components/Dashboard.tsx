import { useInvoices } from '../store/invoices';
import { useAuth } from '../store/auth';
import type { Page } from '../types';
import {
  FilePlus, Clock, DollarSign, FileText, TrendingUp, Users, AlertTriangle,
  ArrowRight, Shield, UserCheck, CheckCircle, Send, FileWarning,
  Cloud, HardDrive, Wifi, Database, BarChart3,
} from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  MMK: 'Ks', THB: '฿', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', INR: '₹', BRL: 'R$',
};

function fmt(amount: number, currency: string) {
  return `${CURRENCY_SYMBOLS[currency] || 'Ks'}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'မူကြမ်း',
  sent: 'ပို့ပြီး',
  paid: 'ပေးပြီး',
  overdue: 'ရက်လွန်',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <FileText className="w-4 h-4" />,
  sent: <Send className="w-4 h-4" />,
  paid: <CheckCircle className="w-4 h-4" />,
  overdue: <FileWarning className="w-4 h-4" />,
};

interface Props {
  onNavigate: (page: Page) => void;
  onView: (id: string) => void;
}

export default function Dashboard({ onNavigate, onView }: Props) {
  const { invoices, storageMode, firestoreConnected, firestoreError } = useInvoices();
  const { user, isOwner } = useAuth();

  const totalRevenue = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalBalance = invoices.reduce((s, i) => s + Math.max(0, (i.balanceDue ?? i.total - (i.paidAmount || 0))), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const uniqueClients = new Set(invoices.map(i => i.clientEmail || i.clientName).filter(Boolean)).size;

  const statusCounts = {
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 pb-28 sm:pb-8">
      {/* Welcome */}
      <div className="mb-5 sm:mb-8">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-800">
              ပြန်လာတာ ကြိုဆိုပါတယ် 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{user?.name}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isOwner ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}>
                {isOwner ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                {isOwner ? 'ပိုင်ရှင်' : 'ဝန်ထမ်း'}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                storageMode === 'firestore' && firestoreConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {storageMode === 'firestore' && firestoreConnected ? (
                  <><Cloud className="w-3 h-3" /> Firestore</>
                ) : (
                  <><HardDrive className="w-3 h-3" /> Local</>
                )}
              </span>
            </div>
          </div>
          {/* Action buttons — grid on mobile */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
            <button
              onClick={() => onNavigate('financial')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs sm:text-sm font-medium active:scale-95 transition-all shadow-sm"
            >
              <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">ငွေကြေး</span><span className="sm:hidden">စီမံ</span>
            </button>
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-medium active:scale-95 transition-all shadow-sm"
            >
              <FilePlus className="w-4 h-4" /> အသစ်
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium active:scale-95 transition-all"
            >
              <Clock className="w-4 h-4" /> မှတ်တမ်း
            </button>
          </div>
        </div>
      </div>

      {/* Firestore connection card */}
      <div className={`mb-6 rounded-2xl border p-5 ${
        storageMode === 'firestore' && firestoreConnected
          ? 'bg-emerald-50 border-emerald-200'
          : storageMode === 'firestore' && !firestoreConnected
          ? 'bg-amber-50 border-amber-200'
          : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            storageMode === 'firestore' && firestoreConnected
              ? 'bg-emerald-100'
              : storageMode === 'firestore'
              ? 'bg-amber-100'
              : 'bg-indigo-100'
          }`}>
            {storageMode === 'firestore' && firestoreConnected ? (
              <Cloud className="w-6 h-6 text-emerald-600" />
            ) : storageMode === 'firestore' ? (
              <Cloud className="w-6 h-6 text-amber-600" />
            ) : (
              <Database className="w-6 h-6 text-indigo-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${
                storageMode === 'firestore' && firestoreConnected
                  ? 'text-emerald-800'
                  : storageMode === 'firestore'
                  ? 'text-amber-800'
                  : 'text-indigo-800'
              }`}>
                {storageMode === 'firestore' && firestoreConnected
                  ? '🔥 Firebase Firestore ချိတ်ဆက်ပြီး'
                  : storageMode === 'firestore'
                  ? '⚠️ Firestore ချိတ်ဆက်မှု ပြဿနာ'
                  : '💾 Local Storage အသုံးပြုနေသည်'}
              </h3>
              {storageMode === 'firestore' && firestoreConnected && (
                <Wifi className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p className={`text-sm ${
              storageMode === 'firestore' && firestoreConnected
                ? 'text-emerald-700'
                : storageMode === 'firestore'
                ? 'text-amber-700'
                : 'text-indigo-700'
            }`}>
              {storageMode === 'firestore' && firestoreConnected
                ? 'ပြေစာ အချက်အလက်အားလုံးကို Firebase Firestore တွင် သိမ်းဆည်းထားပြီး စက်အားလုံးတွင် အချိန်နှင့်တစ်ပြေးညီ sync ဖြစ်သည်။'
                : storageMode === 'firestore' && firestoreError
                ? `ချိတ်ဆက်မှု ပြဿနာ: ${firestoreError}။ Local storage ကို ပြန်သုံးနေသည်။`
                : 'ပြေစာ အချက်အလက်ကို ဘရောက်ဆာတွင် သိမ်းဆည်းထားသည်။ Cloud sync ဖွင့်ရန် Firebase environment variables (VITE_FIREBASE_*) သတ်မှတ်ပါ။'}
            </p>
            {storageMode === 'local' && (
              <div className="mt-3 p-3 bg-white/70 rounded-lg border border-indigo-100">
                <p className="text-xs font-mono text-indigo-600 leading-relaxed">
                  {`# .env ဖိုင်ဖန်တီးပါ:\n`}
                  VITE_FIREBASE_API_KEY=your-key<br />
                  VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com<br />
                  VITE_FIREBASE_PROJECT_ID=your-project-id<br />
                  VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com<br />
                  VITE_FIREBASE_MESSAGING_SENDER_ID=123456<br />
                  VITE_FIREBASE_APP_ID=1:123:web:abc
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid — horizontal scroll on mobile */}
      <div className="flex gap-3 mb-5 sm:mb-8 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:overflow-visible">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-[130px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">စုစုပေါင်း</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">{invoices.length}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">Ks{totalBilled.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">ရရှိပြီး</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-emerald-600">Ks{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">ပေးပြီးငွေ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">ကျန်ရှိ</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-amber-600">Ks{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">ကျန်ငွေ</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm min-w-[120px] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">ဖောက်သည်</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800">{uniqueClients}</p>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1">အရေအတွက်</p>
        </div>
      </div>

      {/* Status Breakdown + Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-5 sm:mb-8">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 sm:mb-4">အခြေအနေ ခွဲခြမ်းချက်</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {(Object.entries(statusCounts) as [string, number][]).map(([status, count]) => (
              <div key={status} className={`rounded-xl p-4 ${STATUS_STYLES[status]} bg-opacity-50`}>
                <div className="flex items-center gap-2 mb-2">
                  {STATUS_ICONS[status]}
                  <span className="text-xs font-semibold uppercase">{STATUS_LABELS[status] || status}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </div>

        {overdueCount > 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-sm font-bold text-red-700 uppercase tracking-wider">အရေးပေါ်</h2>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-1">{overdueCount}</p>
            <p className="text-sm text-red-600">
              ရက်လွန် ပြေစာ{overdueCount > 1 ? 'များ' : ''} ချက်ချင်း ဆောင်ရွက်ရန် လိုအပ်သည်
            </p>
            <button
              onClick={() => onNavigate('history')}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
            >
              ရက်လွန်များ ကြည့်ရန် <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">အားလုံး ကောင်းပါတယ်</h2>
            </div>
            <p className="text-sm text-emerald-600 mt-2">
              ရက်လွန် ပြေစာ မရှိပါ! ပေးချေမှုအားလုံး မှန်ကန်နေပါသည်။
            </p>
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">မကြာမီက ပြေစာများ</h2>
          <button
            onClick={() => onNavigate('history')}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            အားလုံးကြည့် <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">ပြေစာ မရှိသေးပါ</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">ပထမဆုံး ပြေစာ ဖန်တီးပါ</p>
            <button
              onClick={() => onNavigate('create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500"
            >
              <FilePlus className="w-4 h-4" /> ပြေစာ ဖန်တီးရန်
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentInvoices.map(inv => (
              <button
                key={inv.id}
                onClick={() => onView(inv.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-600 font-semibold">{inv.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[inv.status]}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium mt-0.5">{inv.clientName || 'အမည်မဖော်ပြ'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{fmt(inv.total, inv.currency)}</p>
                  {(inv.paidAmount || 0) > 0 && (
                    <p className="text-xs text-emerald-600 mt-0.5">ပေးပြီး: {fmt(inv.paidAmount || 0, inv.currency)}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(inv.date + 'T00:00:00').toLocaleDateString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Info */}
      <div className="mt-5 sm:mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-0">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">ခွင့်ပြုချက်များ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`rounded-xl p-4 border ${isOwner ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-slate-800">ပိုင်ရှင်</span>
              {isOwner && <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full uppercase">သင်</span>}
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ပြေစာ ဖန်တီးခြင်း</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ကြည့်ရှု နှင့် ရှာဖွေခြင်း</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ပြေစာ ပြင်ဆင်ခြင်း</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ပြေစာ ဖျက်ခြင်း</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ပရင့်ထုတ် နှင့် ဒေါင်းလုဒ်</li>
            </ul>
          </div>
          <div className={`rounded-xl p-4 border ${!isOwner ? 'bg-sky-50 border-sky-200' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-5 h-5 text-sky-600" />
              <span className="font-semibold text-slate-800">ဝန်ထမ်း</span>
              {!isOwner && <span className="px-2 py-0.5 bg-sky-200 text-sky-800 text-[10px] font-bold rounded-full uppercase">သင်</span>}
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ပြေစာ ဖန်တီးခြင်း</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ကြည့်ရှု နှင့် ရှာဖွေခြင်း</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ပြေစာ ပြင်ဆင်ခြင်း</li>
              <li className="flex items-center gap-2 text-slate-400"><span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 flex-shrink-0" /> ပြေစာ ဖျက်ခွင့် မရှိ</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> ပရင့်ထုတ် နှင့် ဒေါင်းလုဒ်</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
