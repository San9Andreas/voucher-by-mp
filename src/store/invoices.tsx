import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Invoice } from '../types';
import { db, INVOICES_COLLECTION } from '../lib/firebase';
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';

type StorageMode = 'firestore' | 'local';

interface InvoiceContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoice: (id: string) => Invoice | undefined;
  searchInvoices: (query: string) => Invoice[];
  getNextInvoiceNumber: () => string;
  lastUpdate: number;
  storageMode: StorageMode;
  firestoreConnected: boolean;
  firestoreError: string | null;
  loading: boolean;
}

const InvoiceContext = createContext<InvoiceContextType | null>(null);

// ── Local storage fallback helpers ──────────────────────────
const INVOICES_KEY = 'invoice_app_invoices';
const SYNC_EVENT = 'invoice_app_sync';

function loadLocalInvoices(): Invoice[] {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function persistLocalInvoices(invoices: Invoice[]) {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: Date.now() }));
}

// ── Provider ────────────────────────────────────────────────
export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [firestoreConnected, setFirestoreConnected] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const internalUpdate = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // ── Firestore real-time listener ──────────────────────────
  useEffect(() => {
    if (db) {
      try {
        const q = query(
          collection(db, INVOICES_COLLECTION),
          orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(
          q,
          (snapshot) => {
            const docs: Invoice[] = [];
            snapshot.forEach((d) => {
              docs.push({ id: d.id, ...d.data() } as Invoice);
            });
            setInvoices(docs);
            setStorageMode('firestore');
            setFirestoreConnected(true);
            setFirestoreError(null);
            setLastUpdate(Date.now());
            setLoading(false);
          },
          (err) => {
            console.error('Firestore onSnapshot error:', err);
            setFirestoreError(err.message);
            setFirestoreConnected(false);
            // Fallback to local
            setStorageMode('local');
            setInvoices(loadLocalInvoices());
            setLoading(false);
          }
        );

        unsubRef.current = unsub;
        return () => unsub();
      } catch (err) {
        console.error('Firestore setup error:', err);
        setFirestoreError(err instanceof Error ? err.message : 'Firestore setup failed');
        setStorageMode('local');
        setInvoices(loadLocalInvoices());
        setLoading(false);
      }
    } else {
      // No Firestore — use localStorage
      setStorageMode('local');
      setInvoices(loadLocalInvoices());
      setLoading(false);
    }

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  // ── Local storage sync (for local mode only) ─────────────
  useEffect(() => {
    if (storageMode !== 'local') return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === INVOICES_KEY) {
        setInvoices(loadLocalInvoices());
        setLastUpdate(Date.now());
      }
    };
    const handleSync = () => {
      if (!internalUpdate.current) {
        setInvoices(loadLocalInvoices());
      }
      internalUpdate.current = false;
      setLastUpdate(Date.now());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SYNC_EVENT, handleSync);
    };
  }, [storageMode]);

  // ── CRUD operations ──────────────────────────────────────

  const addInvoice = useCallback(async (invoice: Invoice) => {
    if (storageMode === 'firestore' && db) {
      try {
        const { id, ...data } = invoice;
        // Use setDoc with the custom ID so we can reference it later
        await setDoc(doc(db, INVOICES_COLLECTION, id), data);
        // onSnapshot will update the state
      } catch (err) {
        console.error('Firestore addInvoice error:', err);
        // Fallback to local
        internalUpdate.current = true;
        setInvoices((prev) => {
          const next = [invoice, ...prev];
          persistLocalInvoices(next);
          return next;
        });
      }
    } else {
      internalUpdate.current = true;
      setInvoices((prev) => {
        const next = [invoice, ...prev];
        persistLocalInvoices(next);
        return next;
      });
    }
  }, [storageMode]);

  const updateInvoice = useCallback(async (invoice: Invoice) => {
    const updated = { ...invoice, updatedAt: new Date().toISOString() };
    if (storageMode === 'firestore' && db) {
      try {
        const { id, ...data } = updated;
        await updateDoc(doc(db, INVOICES_COLLECTION, id), data as Record<string, unknown>);
        // onSnapshot will update the state
      } catch (err) {
        console.error('Firestore updateInvoice error:', err);
        internalUpdate.current = true;
        setInvoices((prev) => {
          const next = prev.map((i) => (i.id === updated.id ? updated : i));
          persistLocalInvoices(next);
          return next;
        });
      }
    } else {
      internalUpdate.current = true;
      setInvoices((prev) => {
        const next = prev.map((i) => (i.id === updated.id ? updated : i));
        persistLocalInvoices(next);
        return next;
      });
    }
  }, [storageMode]);

  const deleteInvoice = useCallback(async (id: string) => {
    if (storageMode === 'firestore' && db) {
      try {
        await deleteDoc(doc(db, INVOICES_COLLECTION, id));
        // onSnapshot will update the state
      } catch (err) {
        console.error('Firestore deleteInvoice error:', err);
        internalUpdate.current = true;
        setInvoices((prev) => {
          const next = prev.filter((i) => i.id !== id);
          persistLocalInvoices(next);
          return next;
        });
      }
    } else {
      internalUpdate.current = true;
      setInvoices((prev) => {
        const next = prev.filter((i) => i.id !== id);
        persistLocalInvoices(next);
        return next;
      });
    }
  }, [storageMode]);

  const getInvoice = useCallback(
    (id: string) => invoices.find((i) => i.id === id),
    [invoices]
  );

  const searchInvoices = useCallback(
    (q: string) => {
      if (!q.trim()) return invoices;
      const lower = q.toLowerCase();
      return invoices.filter(
        (inv) =>
          inv.clientName.toLowerCase().includes(lower) ||
          inv.clientCompany.toLowerCase().includes(lower) ||
          inv.clientEmail.toLowerCase().includes(lower) ||
          inv.invoiceNumber.toLowerCase().includes(lower) ||
          inv.senderName.toLowerCase().includes(lower) ||
          inv.status.toLowerCase().includes(lower)
      );
    },
    [invoices]
  );

  // ── Sequential Invoice Number Generator ───────────────────
  const getNextInvoiceNumber = useCallback(() => {
    let maxNum = 0;
    invoices.forEach((inv) => {
      // Match patterns like INV-0001, INV-0042, INV-123
      const match = inv.invoiceNumber.match(/^INV-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `INV-${String(nextNum).padStart(4, '0')}`;
  }, [invoices]);

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoice,
        searchInvoices,
        getNextInvoiceNumber,
        lastUpdate,
        storageMode,
        firestoreConnected,
        firestoreError,
        loading,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be inside InvoiceProvider');
  return ctx;
}
