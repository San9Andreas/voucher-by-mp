import { useState } from 'react';
import { useAuth } from '../store/auth';
import { FileText, AlertCircle, Loader2, Shield, UserCheck, Lock, CheckCircle } from 'lucide-react';
import { isConfigured } from '../lib/firebase';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) setError(res.error || 'ဝင်ရောက်ခြင်း မအောင်မြင်ပါ');
    } catch (err: any) {
      setError(err.message || 'တစ်ခုခု မှားယွင်းနေပါသည်');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl shadow-indigo-500/30 mb-5">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">ပြေစာ စနစ်</h1>
          <p className="text-slate-400 mt-2 text-lg">Cloud ပြေစာ စီမံခန့်ခွဲမှု စနစ်</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1 text-center">ကြိုဆိုပါသည်</h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            ဆက်လက်ရန် သင့် Google အကောင့်ဖြင့် ဝင်ရောက်ပါ
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">ဝင်ရောက်ခြင်း အမှား</p>
                <p className="text-red-300/80 mt-0.5 text-xs">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-wait group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {loading ? 'ဝင်ရောက်နေသည်...' : 'Google ဖြင့် ဝင်ရောက်ပါ'}
          </button>

          {!isConfigured && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Firebase မသတ်မှတ်ရသေးပါ
              </p>
              <p className="text-amber-200/70 text-xs leading-relaxed">
                Google Sign-In အတွက် Firebase လိုအပ်ပါသည်။{' '}
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">.env</code> ဖိုင်
                ဖန်တီးပါ:
              </p>
              <div className="mt-3 p-3 bg-black/30 rounded-lg border border-amber-500/10">
                <code className="text-[11px] text-amber-200/60 font-mono leading-relaxed block">
                  VITE_FIREBASE_API_KEY=...<br />
                  VITE_FIREBASE_AUTH_DOMAIN=...<br />
                  VITE_FIREBASE_PROJECT_ID=...<br />
                  VITE_FIREBASE_STORAGE_BUCKET=...<br />
                  VITE_FIREBASE_MESSAGING_SENDER_ID=...<br />
                  VITE_FIREBASE_APP_ID=...
                </code>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Lock className="w-3 h-3" />
            <span>Firebase Authentication ဖြင့် လုံခြုံစွာ ကာကွယ်ထားသည်</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-bold text-amber-300 uppercase">ပိုင်ရှင်</span>
            </div>
            <ul className="space-y-1">
              <li className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> ပြေစာ ဖန်တီးခြင်း
              </li>
              <li className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> ပြင်ဆင် နှင့် ဖျက်ခြင်း
              </li>
              <li className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> စီမံခန့်ခွဲခွင့် အပြည့်
              </li>
            </ul>
          </div>
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <span className="text-xs font-bold text-sky-300 uppercase">ဝန်ထမ်း</span>
            </div>
            <ul className="space-y-1">
              <li className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> ပြေစာ ဖန်တီးခြင်း
              </li>
              <li className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> ကြည့်ရှု နှင့် ပြင်ဆင်ခြင်း
              </li>
              <li className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-slate-500 flex-shrink-0" /> ဖျက်ခွင့် မရှိ
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          ပထမဆုံး ဝင်ရောက်သူသည် <strong className="text-slate-500">ပိုင်ရှင်</strong> အဖြစ် အလိုအလျောက် သတ်မှတ်သည်။
          <br />
          နောက်ထပ် ဝင်ရောက်သူများသည် <strong className="text-slate-500">ဝန်ထမ်း</strong> အဖြစ် ပါဝင်သည်။
        </p>
      </div>
    </div>
  );
}
