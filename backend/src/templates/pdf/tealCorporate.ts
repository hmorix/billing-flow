import { PdfTemplateParams, formatCurrency } from './types';

export function drawTealCorporateTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri } = params;
  const margin = 40;
  const contentWidth = 515;
  const teal = '#00897b';
  const dark = '#1a1a2e';

  doc.rect(0, 0, 220, 90).fill(dark);
  doc.rect(220, 0, 375, 90).fill(teal);

  if (logoUri) {
    try {
      doc.image(logoUri, 15, 12, { fit: [110, 38] });
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(organization.name, 15, 54, { width: 190 });
    } catch (e) {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text(organization.name, 15, 30, { width: 190 });
    }
  } else {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13).text(organization.name, 15, 30, { width: 190 });
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text('Corporate Dispatch', 15, 48, { width: 190 });
  }

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text('INVOICE', 235, 16, { width: 330 });
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8);
  doc.text(`Invoice No:  #${invoice.invoice_number}`, 235, 52, { width: 330 });
  doc.text(`Due Date:    ${new Date(invoice.due_date).toLocaleDateString()}`, 235, 63, { width: 330 });
  doc.text(`Invoice Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 235, 74, { width: 330 });

  doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('INVOICE TO:', margin, 105);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(12).text(client.name, margin, 118, { width: 250 });
  let cY = 135;
  if (client.company_name) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.company_name, margin, cY, { width: 235 }); cY += 12;
  }
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.address, margin, cY, { width: 235 }); cY += 12;
  }
  if (client.phone) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(`Phone: ${client.phone}`, margin, cY); cY += 12;
  }

  doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('PAYMENT METHOD', 310, 105);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
  doc.text(`Account No:    ${invoice.invoice_number.slice(-8)}`, 310, 120, { width: 245 });
  doc.text(`Account Name: ${organization.name}`, 310, 132, { width: 245 });
  doc.text('Branch Name:  Main Branch', 310, 144, { width: 245 });

  let y = 185;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 12;

  const cW = [30, contentWidth * 0.42, contentWidth * 0.16, contentWidth * 0.12, contentWidth * 0.22];
  const cX = [margin, margin + cW[0] + 6, margin + cW[0] + cW[1] + 6, margin + cW[0] + cW[1] + cW[2] + 6, margin + cW[0] + cW[1] + cW[2] + cW[3] + 6];

  doc.rect(margin, y, contentWidth, 24).fill(teal);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('NO.', cX[0], y + 8, { width: cW[0] });
  doc.text('ITEM DESCRIPTION', cX[1], y + 8, { width: cW[1] });
  doc.text('PRICE', cX[2], y + 8, { width: cW[2], align: 'right' });
  doc.text('QTY.', cX[3], y + 8, { width: cW[3], align: 'center' });
  doc.text('TOTAL', cX[4], y + 8, { width: cW[4] - 6, align: 'right' });
  y += 24;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 24;
    if (y + rH > 640) { doc.addPage(); y = 40; }
    if (i % 2 === 1) doc.rect(margin, y, contentWidth, rH).fill('#f0fdfa');
    doc.fillColor('#6b7280').font('Helvetica').fontSize(8);
    doc.text(String(i + 1).padStart(2, '0'), cX[0], y + 8, { width: cW[0] });
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
    doc.text(item.description, cX[1], y + 8, { width: cW[1] });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
    doc.text(formatCurrency(item.unit_price, invoice.currency), cX[2], y + 8, { width: cW[2], align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), cX[3], y + 8, { width: cW[3], align: 'center' });
    doc.fillColor(teal).font('Helvetica-Bold').fontSize(8);
    doc.text(formatCurrency(itemTotal, invoice.currency), cX[4], y + 8, { width: cW[4] - 6, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 14;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  const rX = cX[3];
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text('Subtotal:', rX, y, { width: cW[3], align: 'right' });
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text(formatCurrency(subtotal, invoice.currency), cX[4], y, { width: cW[4] - 6, align: 'right' });
  y += 14;
  if (discount > 0) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text('Discount:', rX, y, { width: cW[3], align: 'right' });
    doc.fillColor('#ef4444').font('Helvetica-Bold').fontSize(8).text(`-${formatCurrency(discount, invoice.currency)}`, cX[4], y, { width: cW[4] - 6, align: 'right' });
    y += 14;
  }
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(`Tax (${taxRate}%):`, rX, y, { width: cW[3], align: 'right' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text(formatCurrency(taxed, invoice.currency), cX[4], y, { width: cW[4] - 6, align: 'right' });
    y += 14;
  }

  doc.rect(rX - 10, y, cW[3] + cW[4] + 16, 26).fill(teal);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
  doc.text('Total:', rX, y + 8, { width: cW[3], align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), cX[4], y + 8, { width: cW[4] - 6, align: 'right' });
  y += 38;

  if (invoice.notes) {
    doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('TERMS & CONDITIONS:', margin, y);
    doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(invoice.notes, margin, y + 12, { width: 280 });
  }

  doc.fillColor(dark).font('Helvetica-Bold').fontSize(9).text('THANK YOU FOR YOUR BUSINESS.', margin, y + 38);

  const sigY = Math.max(y + 60, 640);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text('Authorized Signature', margin + 310, sigY + 8);
  doc.strokeColor('#1a1a1a').lineWidth(0.8).moveTo(margin + 305, sigY + 26).lineTo(margin + 475, sigY + 26).stroke();

  const fy = 730;
  doc.rect(0, fy, 595, 112).fill(dark);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  const fItems = [
    { label: 'Tel:', text: organization.phone || '+1234 5678 9012' },
    { label: 'Email:', text: `${organization.slug || 'billing'}@company.com` },
    { label: 'Addr:', text: organization.address || '123 Main Road, Executive City' }
  ];
  fItems.forEach((fi, idx) => {
    const fx = margin + idx * 165;
    doc.fillColor('#4ade80').font('Helvetica-Bold').fontSize(8).text(fi.label, fx, fy + 18);
    doc.fillColor('#ffffff').font('Helvetica').fontSize(7.5).text(fi.text, fx + 30, fy + 18, { width: 130 });
  });
}
