import { PdfTemplateParams, formatCurrency, drawStatusBadge } from './types';

export function drawMinimalistDarkTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri } = params;
  
  doc.rect(0, 0, 200, 842).fill('#0f172a');

  const marginL = 25;
  let logoY = 45;

  if (logoUri) {
    try {
      doc.image(logoUri, marginL, logoY, { fit: [150, 38] });
      logoY += 48;
    } catch (e) {
      logoY += 10;
    }
  }

  drawStatusBadge(doc, marginL, logoY, invoice.status);
  logoY += 32;

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7.5).text('ISSUE DATE', marginL, logoY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(new Date(invoice.issue_date).toLocaleDateString(), marginL, logoY + 11);

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7.5).text('DUE DATE', marginL, logoY + 34);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(new Date(invoice.due_date).toLocaleDateString(), marginL, logoY + 45);

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7.5).text('BILLED TO', marginL, logoY + 75);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text(client.name, marginL, logoY + 88, { width: 155 });

  let clientAddY = logoY + 102;
  if (client.company_name) {
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(8).text(client.company_name, marginL, clientAddY, { width: 155 });
    clientAddY += 12;
  }
  if (client.address) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text(client.address, marginL, clientAddY, { width: 155 });
  }

  // Real QR code area in sidebar bottom
  doc.rect(marginL, 620, 150, 160).fill('#1e293b');
  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(8).text('SCAN TO PAY', marginL + 12, 634, { width: 126, align: 'center' });
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, marginL + 25, 650, { fit: [100, 100] });
    } catch (e) {}
  } else {
    doc.rect(marginL + 25, 650, 100, 100).fill('#0f172a');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text('PAYMENT QR', marginL + 25, 695, { width: 100, align: 'center' });
  }

  // Right Column (White Canvas)
  const rightX = 235;
  const contentWidth = 320;

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(26).text('INVOICE', rightX, 45);
  doc.fillColor('#64748b').font('Helvetica').fontSize(10).text(`#${invoice.invoice_number}`, rightX, 74);

  // Table
  let y = 160;
  doc.rect(rightX, y, contentWidth, 20).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
  doc.text('Description', rightX + 8, y + 6, { width: 170 });
  doc.text('Qty', rightX + 185, y + 6, { width: 35, align: 'right' });
  doc.text('Total', rightX + 230, y + 6, { width: 80, align: 'right' });
  y += 20;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 22;
    if (y + rH > 680) { doc.addPage(); doc.rect(0, 0, 200, 842).fill('#0f172a'); y = 40; }
    doc.fillColor('#334155').font('Helvetica').fontSize(8.5);
    doc.text(item.description, rightX + 8, y + 6, { width: 170 });
    doc.text(Number(item.quantity).toFixed(0), rightX + 185, y + 6, { width: 35, align: 'right' });
    doc.fillColor('#0f172a').font('Helvetica-Bold');
    doc.text(formatCurrency(itemTotal, invoice.currency), rightX + 230, y + 6, { width: 80, align: 'right' });
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(rightX, y + rH).lineTo(rightX + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 15;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Subtotal:', rightX + 130, y, { width: 90, align: 'right' });
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), rightX + 230, y, { width: 80, align: 'right' });
  y += 16;
  if (taxRate > 0) {
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8.5).text(`Tax (${taxRate}%):`, rightX + 130, y, { width: 90, align: 'right' });
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(taxed, invoice.currency), rightX + 230, y, { width: 80, align: 'right' });
    y += 16;
  }
  doc.rect(rightX + 120, y - 2, 200, 26).fill('#0f172a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text('Total Due:', rightX + 130, y + 6, { width: 90, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), rightX + 230, y + 6, { width: 80, align: 'right' });
}
