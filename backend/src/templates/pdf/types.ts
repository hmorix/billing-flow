export interface PdfTemplateParams {
  doc: any;
  invoice: any;
  client: any;
  organization: any;
  items: any[];
  logoUri: string | null;
  qrCodeUri?: string | null;
  publicBillUrl?: string | null;
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const num = Number(amount || 0);
  const formatted = num.toLocaleString('en-IN', {
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
  doc.roundedRect(x, y, 70, 18, 4).fill(bgColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5).text(label, x, y + 5, { align: 'center', width: 70 });
  doc.restore();
}

export interface TaxBreakdown {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  hasCgstSgst: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  hasIgst: boolean;
  igstRate: number;
  igstAmount: number;
  hasFlatTax: boolean;
  taxRate: number;
  taxAmount: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateTaxBreakdown(invoice: any, subtotal: number, items: any[] = []): TaxBreakdown {
  const discount = Number(invoice.discount || 0);
  const taxableAmount = Math.max(0, subtotal - discount);

  const cgstRate = Number(invoice.cgst_rate || 0);
  const sgstRate = Number(invoice.sgst_rate || 0);
  const igstRate = Number(invoice.igst_rate || 0);
  const taxRate = Number(invoice.tax_rate || 0);

  const hasCgstSgst = cgstRate > 0 || sgstRate > 0;
  const hasIgst = !hasCgstSgst && igstRate > 0;
  const hasFlatTax = !hasCgstSgst && !hasIgst && taxRate > 0;

  // Check if items have item-level differential tax rates
  const hasItemLevelTax = items && items.length > 0 && items.some((it: any) => Number(it.tax_rate) > 0);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let taxAmount = 0;
  let totalTax = 0;

  if (hasItemLevelTax && invoice.tax_calculation_type === 'item_level') {
    items.forEach((it: any) => {
      const lineTotal = Number(it.quantity || 1) * Number(it.unit_price || 0);
      const lineDiscount = Number(it.discount_rate || 0);
      const lineTaxable = Math.max(0, lineTotal - lineDiscount);
      const lineTaxRate = Number(it.tax_rate || 0);
      const lineTax = (lineTaxable * lineTaxRate) / 100;
      totalTax += lineTax;
    });
    taxAmount = totalTax;
  } else if (hasCgstSgst) {
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
    totalTax = cgstAmount + sgstAmount;
  } else if (hasIgst) {
    igstAmount = (taxableAmount * igstRate) / 100;
    totalTax = igstAmount;
  } else if (hasFlatTax) {
    taxAmount = (taxableAmount * taxRate) / 100;
    totalTax = taxAmount;
  }

  const grandTotal = taxableAmount + totalTax;

  return {
    subtotal,
    discount,
    taxableAmount,
    hasCgstSgst,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    hasIgst,
    igstRate,
    igstAmount,
    hasFlatTax,
    taxRate,
    taxAmount,
    totalTax,
    grandTotal
  };
}

export function numberToWords(amount: number, currency: string = 'INR'): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + ones[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += ones[hundred] + ' Hundred';
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const num = Math.abs(Number(amount) || 0);
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  if (intPart === 0 && decPart === 0) return 'Zero Only';

  let words = '';
  const isIndian = currency.toUpperCase() === 'INR' || currency.toUpperCase() === 'RS';

  if (isIndian) {
    const crore = Math.floor(intPart / 10000000);
    const lakh = Math.floor((intPart % 10000000) / 100000);
    const thousand = Math.floor((intPart % 100000) / 1000);
    const remainder = intPart % 1000;

    if (crore > 0) words += convertTwoDigits(crore) + ' Crore ';
    if (lakh > 0) words += convertTwoDigits(lakh) + ' Lakh ';
    if (thousand > 0) words += convertTwoDigits(thousand) + ' Thousand ';
    if (remainder > 0) words += convertThreeDigits(remainder) + ' ';

    words = words.trim() + ' Rupees';
    if (decPart > 0) {
      words += ' and ' + convertTwoDigits(decPart) + ' Paise';
    }
  } else {
    const billion = Math.floor(intPart / 1000000000);
    const million = Math.floor((intPart % 1000000000) / 1000000);
    const thousand = Math.floor((intPart % 1000000) / 1000);
    const remainder = intPart % 1000;

    if (billion > 0) words += convertThreeDigits(billion) + ' Billion ';
    if (million > 0) words += convertThreeDigits(million) + ' Million ';
    if (thousand > 0) words += convertThreeDigits(thousand) + ' Thousand ';
    if (remainder > 0) words += convertThreeDigits(remainder) + ' ';

    const currName = currency.toUpperCase() === 'USD' ? 'Dollars' :
                     currency.toUpperCase() === 'EUR' ? 'Euros' :
                     currency.toUpperCase() === 'GBP' ? 'Pounds' : currency;

    words = words.trim() + ' ' + currName;
    if (decPart > 0) {
      words += ' and ' + convertTwoDigits(decPart) + ' Cents';
    }
  }

  return (words.trim() + ' Only').replace(/\s+/g, ' ');
}

export function drawHMorixFooter(
  doc: any,
  x: number,
  y: number,
  width: number,
  publicUrl?: string | null
) {
  doc.save();
  doc.strokeColor('#e2e8f0').lineWidth(0.75).moveTo(x, y).lineTo(x + width, y).stroke();

  const brandY = y + 7;

  if (publicUrl) {
    doc.fillColor('#6366f1').font('Helvetica-Bold').fontSize(7.5);
    doc.text('Private Online Bill Link:', x, brandY, { continued: true });
    doc.fillColor('#3b82f6').font('Helvetica').fontSize(7.5).text(` ${publicUrl}`);
  }

  doc.fillColor('#64748b').font('Helvetica').fontSize(7);
  doc.text('Official Document • ', x, brandY + 11, { continued: true, width, align: 'right' });
  doc.fillColor('#4338ca').font('Helvetica-Bold').fontSize(7.5);
  doc.text('Powered by HMorix');

  doc.restore();
}
