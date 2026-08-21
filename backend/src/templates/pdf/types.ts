export interface PdfTemplateParams {
  doc: any;
  invoice: any;
  client: any;
  organization: any;
  items: any[];
  logoUri: string | null;
  qrCodeUri?: string | null;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const num = Number(amount || 0);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${currency} ${formatted}`;
}

export function drawStatusBadge(doc: any, x: number, y: number, statusStr: string) {
  const status = (statusStr || 'DRAFT').toUpperCase();
  let bgColor = '#64748b';
  let label = status;

  if (status === 'PAID') {
    bgColor = '#059669';
  } else if (status === 'PENDING' || status === 'SENT' || status === 'UNPAID') {
    bgColor = '#d97706';
    label = 'UNPAID';
  } else if (status === 'OVERDUE') {
    bgColor = '#dc2626';
  }

  doc.save();
  doc.rect(x, y, 65, 18).fill(bgColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5).text(label, x, y + 5, { align: 'center', width: 65 });
  doc.restore();
}
