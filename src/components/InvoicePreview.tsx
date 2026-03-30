import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useInvoices } from '../store/invoices';
import { useAuth } from '../store/auth';
import {
  ArrowLeft, Printer, Download, Edit, Trash2, Mail, Phone, Globe, MapPin, Shield,
  ImageDown, Loader2,
} from 'lucide-react';

const CURRENCY_SYMBOLS: Record<string, string> = {
  MMK: 'Ks', THB: '฿', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', INR: '₹', BRL: 'R$',
};

function fmt(amount: number, currency: string) {
  const s = CURRENCY_SYMBOLS[currency] || 'Ks';
  return `${s}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('my-MM', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
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

interface Props {
  invoiceId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function InvoicePreview({ invoiceId, onBack, onEdit, onDelete }: Props) {
  const { getInvoice } = useInvoices();
  const { isOwner } = useAuth();
  const invoice = getInvoice(invoiceId);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">ပြေစာ ရှာမတွေ့ပါ</h2>
        <button onClick={onBack} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500">နောက်သို့</button>
      </div>
    );
  }

  // ========================================
  // SINGLE-PAGE VOUCHER PRINT FUNCTION
  // ========================================
  const handlePrint = () => {
    if (!invoiceRef.current) return;

    // Build status colors
    const statusColor = invoice.status === 'paid' ? '#059669'
      : invoice.status === 'overdue' ? '#dc2626'
      : invoice.status === 'sent' ? '#2563eb' : '#475569';
    const statusBg = invoice.status === 'paid' ? '#ecfdf5'
      : invoice.status === 'overdue' ? '#fef2f2'
      : invoice.status === 'sent' ? '#eff6ff' : '#f8fafc';

    // Generate clean single-page voucher HTML
    const printHTML = `<!DOCTYPE html>
<html lang="my">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${invoice.invoiceNumber} - ပြေစာ</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: auto;
      background: white;
      color: #1e293b;
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      font-size: 12px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .voucher {
      width: 100%;
      max-width: 100%;
      padding: 0;
    }
    /* Header */
    .v-header {
      background: linear-gradient(to right, #4f46e5, #7c3aed) !important;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .v-header h1 {
      font-size: 22px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: -0.025em;
    }
    .v-header .inv-num {
      color: #a5b4fc;
      font-size: 12px;
      font-family: monospace;
      margin-top: 2px;
    }
    .v-header .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${statusColor};
      background: ${statusBg};
    }
    /* Info Grid */
    .info-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-item label {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .info-item .value {
      font-size: 12px;
      font-weight: 500;
      color: #1e293b;
    }
    .info-item .value.big {
      font-size: 16px;
      font-weight: 700;
    }
    .info-item .value.purple { color: #4f46e5; }
    .info-item .value.green { color: #059669; }
    .info-item .value.red { color: #dc2626; }
    /* Parties */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 16px 24px;
    }
    .party-box {
      background: #f8fafc;
      border-radius: 8px;
      padding: 14px;
    }
    .party-box .label {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .party-box .name {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
    }
    .party-box .detail {
      font-size: 11px;
      color: #475569;
      margin-top: 3px;
    }
    /* Items Table */
    .items-section {
      padding: 0 24px 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    thead tr {
      border-bottom: 2px solid #e2e8f0;
    }
    th {
      text-align: left;
      padding: 8px 4px;
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
    }
    th.right { text-align: right; }
    td {
      padding: 8px 4px;
      color: #1e293b;
    }
    td.right { text-align: right; }
    td.muted { color: #475569; }
    td.bold { font-weight: 600; }
    tr.even { background: #f8fafc !important; }
    /* Totals */
    .totals-section {
      padding: 0 24px 16px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 240px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;
    }
    .total-row .label { color: #64748b; }
    .total-row .val { font-weight: 500; color: #334155; }
    .total-row.main {
      border-top: 2px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 4px;
    }
    .total-row.main .label { font-size: 14px; font-weight: 700; color: #1e293b; }
    .total-row.main .val { font-size: 16px; font-weight: 700; color: #4f46e5; }
    .total-row.paid .label { color: #059669; font-weight: 500; }
    .total-row.paid .val { font-weight: 600; color: #059669; }
    .total-row.balance {
      border-top: 2px solid ${(invoice.balanceDue ?? invoice.total) <= 0 ? '#86efac' : '#fca5a5'};
      padding-top: 8px;
      margin-top: 4px;
    }
    .total-row.balance .label {
      font-size: 13px;
      font-weight: 700;
      color: ${(invoice.balanceDue ?? invoice.total) <= 0 ? '#15803d' : '#b91c1c'};
    }
    .total-row.balance .val {
      font-size: 16px;
      font-weight: 700;
      color: ${(invoice.balanceDue ?? invoice.total) <= 0 ? '#059669' : '#dc2626'};
    }
    /* Notes */
    .notes-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      padding: 12px 24px;
      border-top: 1px solid #f1f5f9;
    }
    .notes-section .sec-label {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .notes-section .sec-text {
      font-size: 11px;
      color: #475569;
      white-space: pre-wrap;
    }
    /* Footer */
    .v-footer {
      text-align: center;
      padding: 10px 24px;
      border-top: 1px solid #f1f5f9;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="voucher">
    <!-- Header -->
    <div class="v-header">
      <div>
        <h1>ပြေစာ</h1>
        <div class="inv-num">${invoice.invoiceNumber}</div>
      </div>
      <div>
        <span class="status-badge">${STATUS_LABELS[invoice.status] || invoice.status}</span>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-item">
        <label>ပြေစာ ရက်စွဲ</label>
        <div class="value">${fmtDate(invoice.date)}</div>
      </div>
      <div class="info-item">
        <label>နောက်ဆုံးရက်</label>
        <div class="value">${fmtDate(invoice.dueDate)}</div>
      </div>
      <div class="info-item">
        <label>ငွေကြေး</label>
        <div class="value">${invoice.currency}</div>
      </div>
      <div class="info-item">
        <label>စုစုပေါင်း</label>
        <div class="value big purple">${fmt(invoice.total, invoice.currency)}</div>
      </div>
      <div class="info-item">
        <label>ပေးပြီးငွေ</label>
        <div class="value big green">${fmt(invoice.paidAmount || 0, invoice.currency)}</div>
      </div>
      <div class="info-item">
        <label>ကျန်ငွေ</label>
        <div class="value big ${(invoice.balanceDue ?? invoice.total) <= 0 ? 'green' : 'red'}">${fmt(Math.max(0, invoice.balanceDue ?? invoice.total), invoice.currency)}</div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-box">
        <div class="label">ပို့သူ</div>
        <div class="name">${invoice.senderName || '—'}</div>
        ${invoice.senderEmail ? `<div class="detail">✉ ${invoice.senderEmail}</div>` : ''}
        ${invoice.senderPhone ? `<div class="detail">☎ ${invoice.senderPhone}</div>` : ''}
        ${invoice.senderWebsite ? `<div class="detail">🌐 ${invoice.senderWebsite}</div>` : ''}
        ${(invoice.senderAddress || invoice.senderCity) ? `<div class="detail">📍 ${[invoice.senderAddress, invoice.senderCity].filter(Boolean).join(', ')}</div>` : ''}
      </div>
      <div class="party-box">
        <div class="label">လက်ခံသူ</div>
        <div class="name">${invoice.clientName || '—'}</div>
        ${invoice.clientCompany ? `<div class="detail">${invoice.clientCompany}</div>` : ''}
        ${invoice.clientEmail ? `<div class="detail">✉ ${invoice.clientEmail}</div>` : ''}
        ${invoice.clientPhone ? `<div class="detail">☎ ${invoice.clientPhone}</div>` : ''}
        ${(invoice.clientAddress || invoice.clientCity) ? `<div class="detail">📍 ${[invoice.clientAddress, invoice.clientCity].filter(Boolean).join(', ')}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <div class="items-section">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>အကြောင်းအရာ</th>
            <th class="right">အရေအတွက်</th>
            <th class="right">နှုန်း</th>
            <th class="right">ပမာဏ</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, idx) => `
            <tr class="${idx % 2 === 0 ? 'even' : ''}">
              <td class="muted">${idx + 1}</td>
              <td class="bold">${item.description || '—'}</td>
              <td class="right muted">${item.quantity}</td>
              <td class="right muted">${fmt(item.rate, invoice.currency)}</td>
              <td class="right bold">${fmt(item.quantity * item.rate, invoice.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row">
          <span class="label">ခွဲစုစုပေါင်း</span>
          <span class="val">${fmt(invoice.subtotal, invoice.currency)}</span>
        </div>
        ${invoice.taxRate > 0 ? `
          <div class="total-row">
            <span class="label">အခွန် (${invoice.taxRate}%)</span>
            <span class="val">+${fmt(invoice.taxAmount, invoice.currency)}</span>
          </div>
        ` : ''}
        ${invoice.discountRate > 0 ? `
          <div class="total-row">
            <span class="label">လျှော့စျေး (${invoice.discountRate}%)</span>
            <span class="val" style="color:#ef4444">-${fmt(invoice.discountAmount, invoice.currency)}</span>
          </div>
        ` : ''}
        <div class="total-row main">
          <span class="label">စုစုပေါင်း</span>
          <span class="val">${fmt(invoice.total, invoice.currency)}</span>
        </div>
        ${(invoice.paidAmount || 0) > 0 ? `
          <div class="total-row paid">
            <span class="label">ပေးပြီးငွေ</span>
            <span class="val">-${fmt(invoice.paidAmount || 0, invoice.currency)}</span>
          </div>
        ` : ''}
        <div class="total-row balance">
          <span class="label">${(invoice.balanceDue ?? invoice.total) <= 0 ? '✓ အပြည့်ပေးပြီး' : 'ကျန်ငွေ'}</span>
          <span class="val">${fmt(Math.max(0, invoice.balanceDue ?? invoice.total), invoice.currency)}</span>
        </div>
      </div>
    </div>

    <!-- Notes & Terms -->
    ${(invoice.notes || invoice.terms) ? `
      <div class="notes-section">
        ${invoice.notes ? `
          <div>
            <div class="sec-label">မှတ်ချက်</div>
            <div class="sec-text">${invoice.notes}</div>
          </div>
        ` : '<div></div>'}
        ${invoice.terms ? `
          <div>
            <div class="sec-label">စည်းကမ်းချက်များ</div>
            <div class="sec-text">${invoice.terms}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="v-footer">
      ${invoice.createdByName} မှ ဖန်တီးသည် • ${new Date(invoice.createdAt).toLocaleDateString()}
    </div>
  </div>

  <script>
    // Auto-print and close
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
    window.onafterprint = function() {
      window.close();
    };
  </script>
</body>
</html>`;

    // Open new window with clean voucher
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
    } else {
      // Fallback if popup blocked: use iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-99999px';
      iframe.style.left = '-99999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(printHTML);
        iframeDoc.close();
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 500);
      }
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = async () => {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${invoice.invoiceNumber || 'invoice'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PNG generation error (attempt 1):', err);

      try {
        const canvas = await html2canvas(invoiceRef.current!, {
          scale: 1,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: false,
          allowTaint: true,
          foreignObjectRendering: false,
        });

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${invoice.invoiceNumber || 'invoice'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err2) {
        console.error('PNG generation error (attempt 2):', err2);

        try {
          const el = invoiceRef.current!;
          const rect = el.getBoundingClientRect();
          const c = document.createElement('canvas');
          c.width = rect.width * 2;
          c.height = rect.height * 2;
          const ctx = c.getContext('2d')!;
          ctx.scale(2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, rect.width, rect.height);

          const svgData = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
              <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">${el.innerHTML}</div>
              </foreignObject>
            </svg>`;

          const img = new window.Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const dataUrl = c.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${invoice.invoiceNumber || 'invoice'}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };
          img.onerror = () => {
            alert('ပုံ ဖန်တီးမရပါ။ Print → Save as PDF ကို သုံးပါ။');
          };
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        } catch {
          alert('ပုံ ဖန်တီးမရပါ။ Print → Save as PDF ကို သုံးပါ။');
        }
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 pb-28 sm:pb-8">
      {/* Toolbar — mobile optimized */}
      <div className="mb-4 sm:mb-6 print:hidden" data-print-hide>
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-all flex-shrink-0 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{invoice.invoiceNumber}</h1>
            <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[invoice.status]}`}>
              {STATUS_LABELS[invoice.status] || invoice.status}
            </span>
          </div>
        </div>

        {/* Action buttons — grid on mobile for equal sizing */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button onClick={handlePrint} className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all active:scale-95">
            <Printer className="w-4 h-4" /> ပရင့်
          </button>
          <button onClick={handleDownloadJSON} className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all active:scale-95">
            <Download className="w-4 h-4" /> JSON
          </button>
          <button
            onClick={handleDownloadPNG}
            disabled={downloading}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
              downloading
                ? 'bg-amber-100 text-amber-700 cursor-wait'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm'
            }`}
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> ဖန်တီးနေ...</>
            ) : (
              <><ImageDown className="w-4 h-4" /> PNG</>
            )}
          </button>
          <button
            onClick={() => onEdit(invoice.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Edit className="w-4 h-4" /> ပြင်ဆင်
          </button>
          {isOwner && (
            <button
              onClick={() => { if (confirm('ဤပြေစာကို အပြီးအပိုင် ဖျက်မည်လား?')) onDelete(invoice.id); }}
              className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-500 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" /> ဖျက်
            </button>
          )}
        </div>
      </div>

      {/* RBAC note for staff */}
      {!isOwner && (
        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-amber-700 print:hidden" data-print-hide>
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>ဝန်ထမ်း — ကြည့်ရှု၊ ပရင့်၊ ဒေါင်းလုဒ်၊ ပြင်ဆင် နိုင်သည်။ ဖျက်ပိုင်ခွင့် မရှိ။</span>
        </div>
      )}

      {/* Invoice Document */}
      <div
        ref={invoiceRef}
        id="invoice-print-doc"
        className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden print:shadow-none print:border-none print:rounded-none"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)', padding: '16px 20px' }}>
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '-0.025em', margin: 0 }}>ပြေစာ</h2>
              <p style={{ color: '#a5b4fc', marginTop: '4px', fontSize: '12px', fontFamily: 'monospace' }}>{invoice.invoiceNumber}</p>
            </div>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: invoice.status === 'paid' ? '#a7f3d0' : invoice.status === 'overdue' ? '#fca5a5' : '#ffffff',
                backgroundColor: invoice.status === 'paid' ? 'rgba(52, 211, 153, 0.2)' : invoice.status === 'overdue' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                border: `1px solid ${invoice.status === 'paid' ? 'rgba(52, 211, 153, 0.3)' : invoice.status === 'overdue' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
              }}>
                {STATUS_LABELS[invoice.status] || invoice.status}
              </span>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Dates + Amount */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', marginBottom: '20px' }}>
            <div style={{ minWidth: '120px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>ပြေစာ ရက်စွဲ</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', marginTop: '4px' }}>{fmtDate(invoice.date)}</p>
            </div>
            <div style={{ minWidth: '120px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>နောက်ဆုံးရက်</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', marginTop: '4px' }}>{fmtDate(invoice.dueDate)}</p>
            </div>
            <div style={{ minWidth: '80px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>ငွေကြေး</p>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b', marginTop: '4px' }}>{invoice.currency}</p>
            </div>
            <div style={{ minWidth: '120px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>စုစုပေါင်း</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#4f46e5', marginTop: '4px' }}>{fmt(invoice.total, invoice.currency)}</p>
            </div>
            <div style={{ minWidth: '120px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>ပေးပြီးငွေ</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>{fmt(invoice.paidAmount || 0, invoice.currency)}</p>
            </div>
            <div style={{ minWidth: '120px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>ကျန်ငွေ</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: (invoice.balanceDue ?? invoice.total) <= 0 ? '#059669' : '#dc2626', marginTop: '4px' }}>
                {fmt(Math.max(0, invoice.balanceDue ?? invoice.total), invoice.currency)}
              </p>
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-5 sm:mb-8">
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>ပို့သူ</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{invoice.senderName || '—'}</p>
              {invoice.senderEmail && <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail style={{ width: 12, height: 12 }} />{invoice.senderEmail}</p>}
              {invoice.senderPhone && <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone style={{ width: 12, height: 12 }} />{invoice.senderPhone}</p>}
              {invoice.senderWebsite && <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe style={{ width: 12, height: 12 }} />{invoice.senderWebsite}</p>}
              {(invoice.senderAddress || invoice.senderCity) && (
                <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin style={{ width: 12, height: 12, marginTop: 2, flexShrink: 0 }} />
                  <span>{[invoice.senderAddress, invoice.senderCity].filter(Boolean).join(', ')}</span>
                </p>
              )}
            </div>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>လက်ခံသူ</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{invoice.clientName || '—'}</p>
              {invoice.clientCompany && <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>{invoice.clientCompany}</p>}
              {invoice.clientEmail && <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail style={{ width: 12, height: 12 }} />{invoice.clientEmail}</p>}
              {invoice.clientPhone && <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone style={{ width: 12, height: 12 }} />{invoice.clientPhone}</p>}
              {(invoice.clientAddress || invoice.clientCity) && (
                <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin style={{ width: 12, height: 12, marginTop: 2, flexShrink: 0 }} />
                  <span>{[invoice.clientAddress, invoice.clientCity].filter(Boolean).join(', ')}</span>
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '32px' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '12px 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>အကြောင်းအရာ</th>
                  <th style={{ textAlign: 'right', padding: '12px 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>အရေအတွက်</th>
                  <th style={{ textAlign: 'right', padding: '12px 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>နှုန်း</th>
                  <th style={{ textAlign: 'right', padding: '12px 4px', fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>ပမာဏ</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                    <td style={{ padding: '12px 4px', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 4px', color: '#1e293b', fontWeight: 500 }}>{item.description || '—'}</td>
                    <td style={{ padding: '12px 4px', textAlign: 'right', color: '#475569' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 4px', textAlign: 'right', color: '#475569' }}>{fmt(item.rate, invoice.currency)}</td>
                    <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{fmt(item.quantity * item.rate, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>ခွဲစုစုပေါင်း</span>
                <span style={{ fontWeight: 500, color: '#334155' }}>{fmt(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>အခွန် ({invoice.taxRate}%)</span>
                  <span style={{ fontWeight: 500, color: '#334155' }}>+{fmt(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              {invoice.discountRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0' }}>
                  <span style={{ color: '#64748b' }}>လျှော့စျေး ({invoice.discountRate}%)</span>
                  <span style={{ fontWeight: 500, color: '#ef4444' }}>-{fmt(invoice.discountAmount, invoice.currency)}</span>
                </div>
              )}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>စုစုပေါင်း</span>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#4f46e5' }}>{fmt(invoice.total, invoice.currency)}</span>
              </div>
              {(invoice.paidAmount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '8px' }}>
                  <span style={{ color: '#059669', fontWeight: 500 }}>ပေးပြီးငွေ</span>
                  <span style={{ fontWeight: 600, color: '#059669' }}>-{fmt(invoice.paidAmount || 0, invoice.currency)}</span>
                </div>
              )}
              <div style={{
                borderTop: `2px solid ${(invoice.balanceDue ?? invoice.total) <= 0 ? '#86efac' : '#fca5a5'}`,
                paddingTop: '12px',
                marginTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: (invoice.balanceDue ?? invoice.total) <= 0 ? '#15803d' : '#b91c1c',
                }}>
                  {(invoice.balanceDue ?? invoice.total) <= 0 ? '✓ အပြည့်ပေးပြီး' : 'ကျန်ငွေ'}
                </span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: (invoice.balanceDue ?? invoice.total) <= 0 ? '#059669' : '#dc2626',
                }}>
                  {fmt(Math.max(0, invoice.balanceDue ?? invoice.total), invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 sm:pt-6 mt-4 sm:mt-6" style={{ borderTop: '1px solid #f1f5f9' }}>
              {invoice.notes && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>မှတ်ချက်</p>
                  <p style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-wrap', margin: 0 }}>{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>စည်းကမ်းချက်များ</p>
                  <p style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-wrap', margin: 0 }}>{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{invoice.createdByName} မှ ဖန်တီးသည် • {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl print:hidden" data-print-hide>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
            <ImageDown className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">PNG ပုံအဖြစ် ဒေါင်းလုဒ်ဆွဲရန်</p>
            <p className="text-xs text-slate-500">အထက်ပါ <strong>&quot;PNG ဒေါင်းလုဒ်&quot;</strong> ခလုတ်ကို နှိပ်၍ ဤပြေစာကို PNG ပုံအဖြစ် သိမ်းဆည်းပါ။</p>
          </div>
        </div>
      </div>
    </div>
  );
}
