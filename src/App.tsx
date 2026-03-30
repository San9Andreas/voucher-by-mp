import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './store/auth';
import { InvoiceProvider, useInvoices } from './store/invoices';
import type { Page } from './types';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import InvoiceHistory from './components/InvoiceHistory';
import FinancialDashboard from './components/FinancialDashboard';
import { Loader2, FileText } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, authLoading } = useAuth();
  const { deleteInvoice, loading } = useInvoices();

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
    if (page !== 'edit' && page !== 'preview') {
      setSelectedInvoiceId(null);
    }
  }, []);

  const handleView = useCallback((id: string) => {
    setSelectedInvoiceId(id);
    setCurrentPage('preview');
  }, []);

  const handleEdit = useCallback((id: string) => {
    setSelectedInvoiceId(id);
    setCurrentPage('edit');
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteInvoice(id);
    setCurrentPage('history');
    setSelectedInvoiceId(null);
  }, [deleteInvoice]);

  const handleBack = useCallback(() => {
    setCurrentPage('dashboard');
    setSelectedInvoiceId(null);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 text-white">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg font-medium">session စစ်ဆေးနေသည်...</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">အတည်ပြုခြင်း စစ်ဆေးနေသည်</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-lg font-medium">ပြေစာများ ဖတ်နေသည်...</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">Cloud storage နှင့် ချိတ်ဆက်နေသည်</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar currentPage={currentPage} onNavigate={navigate} />
      <main className="print:p-0">
        {currentPage === 'dashboard' && (
          <Dashboard onNavigate={navigate} onView={handleView} />
        )}
        {currentPage === 'create' && (
          <InvoiceForm
            onBack={handleBack}
            onPreview={handleView}
          />
        )}
        {currentPage === 'edit' && (
          <InvoiceForm
            editInvoiceId={selectedInvoiceId}
            onBack={handleBack}
            onPreview={handleView}
          />
        )}
        {currentPage === 'preview' && selectedInvoiceId && (
          <InvoicePreview
            invoiceId={selectedInvoiceId}
            onBack={() => navigate('history')}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        {currentPage === 'financial' && (
          <FinancialDashboard onBack={() => navigate('dashboard')} />
        )}
        {currentPage === 'history' && (
          <InvoiceHistory onView={handleView} onEdit={handleEdit} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InvoiceProvider>
        <AppContent />
      </InvoiceProvider>
    </AuthProvider>
  );
}
