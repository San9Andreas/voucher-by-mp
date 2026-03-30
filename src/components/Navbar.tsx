import { useAuth } from '../store/auth';
import { useInvoices } from '../store/invoices';
import type { Page } from '../types';
import {
  FileText, LayoutDashboard, FilePlus, Clock, LogOut, Shield, UserCheck, ChevronDown,
  Cloud, HardDrive, Wifi, WifiOff, BarChart3,
} from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { user, logout, isOwner } = useAuth();
  const { storageMode, firestoreConnected } = useInvoices();
  const [profileOpen, setProfileOpen] = useState(false);

  const links: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'ဒက်ရှ်ဘုတ်', icon: <LayoutDashboard className="w-5 h-5" /> },
    { page: 'financial', label: 'ငွေကြေးစီမံ', icon: <BarChart3 className="w-5 h-5" /> },
    { page: 'create', label: 'ပြေစာအသစ်', icon: <FilePlus className="w-5 h-5" /> },
    { page: 'history', label: 'မှတ်တမ်း', icon: <Clock className="w-5 h-5" /> },
  ];

  const Avatar = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    const sizeClass = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
    const textClass = size === 'md' ? 'text-base' : 'text-sm';

    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt={user.name}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-sm`}
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div className={`${sizeClass} bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white ${textClass} font-bold ring-2 ring-white shadow-sm`}>
        {user?.name?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  };

  return (
    <>
      {/* ── Top Bar ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-800 hidden xs:block">ပြေစာ စနစ်</span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map(l => (
                <button
                  key={l.page}
                  onClick={() => onNavigate(l.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === l.page
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {l.icon}
                  {l.label}
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Storage badge — hide on mobile */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                  storageMode === 'firestore' && firestoreConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : storageMode === 'firestore' && !firestoreConnected
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {storageMode === 'firestore' && firestoreConnected ? (
                  <>
                    <Cloud className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <span className="hidden lg:inline">Firestore</span>
                  </>
                ) : storageMode === 'firestore' ? (
                  <>
                    <Cloud className="w-3 h-3" />
                    <WifiOff className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3 h-3" />
                    <span className="hidden lg:inline">Local</span>
                  </>
                )}
              </div>

              {/* Role badge — hide on mobile */}
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                isOwner
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}>
                {isOwner ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                {isOwner ? 'ပိုင်ရှင်' : 'ဝန်ထမ်း'}
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Avatar size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-12 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <Avatar size="md" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isOwner ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
                          }`}>
                            {isOwner ? <Shield className="w-2.5 h-2.5" /> : <UserCheck className="w-2.5 h-2.5" />}
                            {isOwner ? 'ပိုင်ရှင်' : 'ဝန်ထမ်း'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            storageMode === 'firestore' && firestoreConnected
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-50 text-slate-500'
                          }`}>
                            {storageMode === 'firestore' && firestoreConnected ? (
                              <><Cloud className="w-2.5 h-2.5" /> Firestore</>
                            ) : (
                              <><HardDrive className="w-2.5 h-2.5" /> Local</>
                            )}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        ထွက်ရန်
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] print:hidden">
        <div className="flex items-center justify-around px-1 py-1">
          {links.map(l => {
            const isActive = currentPage === l.page || (l.page === 'create' && currentPage === 'edit');
            return (
              <button
                key={l.page}
                onClick={() => onNavigate(l.page)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl min-w-[60px] transition-all ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-400 active:bg-slate-50'
                }`}
              >
                <span className={isActive ? 'scale-110' : ''}>{l.icon}</span>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {l.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Safe area for iPhones */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </>
  );
}
