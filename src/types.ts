export type UserRole = 'owner' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  date: string;
  dueDate: string;
  currency: string;

  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderWebsite: string;
  senderAddress: string;
  senderCity: string;

  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCity: string;

  items: InvoiceItem[];

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;

  notes: string;
  terms: string;

  createdBy: string;
  createdByName: string;
  createdByRole: UserRole;
}

export type Page = 'dashboard' | 'create' | 'edit' | 'preview' | 'history' | 'financial';
