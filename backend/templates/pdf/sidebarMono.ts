import { PdfTemplateParams, formatCurrency } from './types';

export function drawSidebarMonoTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri } = params;
  const sideW = 185;
  const bodyX = sideW + 30;
  const bodyW = 595 - bodyX - 30;

  // Dark sidebar
  doc.rect(0, 0, sideW, 842).fill('#1a1a1a');

  // Real QR Code or fallback simulation block in sidebar
  doc.rect(20, 30, 145, 110).fill('#ffffff');
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, 28, 35, { fit: [129, 100] });
    } catch (e) {
      doc.rect(24, 34, 137, 102).fill('#f3f4f6');
    }
  } else {
    doc.rect(24, 34, 137, 102).fill('#f3f4f6');
    for (let qi = 0; qi < 8; qi++) {
      for (let qj = 0; qj < 8; qj++) {
        if ((qi + qj) % 2 === 0) {
          doc.rect(28 + qi * 16, 38 + qj * 12, 14, 10).fill('#1a1a1a');
        }
      }
    }
  }

  // Sidebar info
  let sy = 160;
  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7).text('DATE :', 20, sy);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.issue_date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }), 20, sy + 12, { width: 155 });
  sy += 34;

  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7).text('DUE DATE :', 20, sy);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.due_date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }), 20, sy + 12, { width: 155 });
  sy += 34;

  // Thin rule
  doc.strokeColor('#333333').lineWidth(0.5).moveTo(20, sy).lineTo(165, sy).stroke();
  sy += 15;

  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7).text('TO', 20, sy);
  sy += 12;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text(client.name, 20, sy, { width: 155 });
  sy += 14;
  if (client.company_name) {
    doc.fillColor('#d1d5db').font('Helvetica').fontSize(7.5).text(client.company_name, 20, sy, { width: 155 });
    sy += 12;
  }
  if (client.email) {
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text(client.email, 20, sy, { width: 155 });
    sy += 11;
  }
  if (client.phone) {
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text(client.phone, 20, sy, { width: 155 });
    sy += 11;
  }

  // Body: Logo / Company name top-right
  let nameX = bodyX;
  if (logoUri) {
    try {
      doc.image(logoUri, bodyX, 28, { fit: [100, 36] });
      nameX = bodyX + 110;
    } catch (e) {
      nameX = bodyX;
    }
  }

  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(14);
  doc.text(organization.name, nameX, 30, { width: 230 });
  if (organization.slug || organization.address) {
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(organization.address || 'Official Dispatch', nameX, 47, { width: 220 });
  }

  // Large INVOICE word
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(38).text('INVOICE', bodyX, 82, { width: bodyW });
  doc.fillColor('#9ca3af').font('Helvetica').fontSize(8.5).text('Document Payment Information', bodyX, 126, { width: bodyW });

  // Account / Invoice number info box
  doc.rect(bodyX, 145, bodyW, 36).fill('#f3f4f6');
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text('Account No:', bodyX + 10, 152).text('Invoice No:', bodyX + 140, 152);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5);
  doc.text(invoice.invoice_number.slice(-8) || '123-456', bodyX + 10, 163).text(`#${invoice.invoice_number}`, bodyX + 140, 163);

  // Payment Method
  let pmY = 194;
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5).text('Payment', bodyX, pmY);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5).text('Method', bodyX, pmY + 11);
  doc.strokeColor('#1a1a1a').lineWidth(1.5).moveTo(bodyX, pmY + 24).lineTo(bodyX + 60, pmY + 24).stroke();

  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text('Account Name:', bodyX + 80, pmY);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(organization.name, bodyX + 80, pmY + 11, { width: bodyW - 80 });

  // Table
  let y = 250;
  const col1 = bodyX;
  const col2 = col1 + 160;
  const col3 = col2 + 70;
  const col4 = col3 + 60;

  doc.rect(col1, y, bodyW, 22).fill('#1a1a1a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('Item Description', col1 + 8, y + 7, { width: 150 });
  doc.text('Rate', col2, y + 7, { width: 68, align: 'right' });
  doc.text('Unit', col3, y + 7, { width: 58, align: 'right' });
  doc.text('Subtotal', col4, y + 7, { width: bodyW - (col4 - col1), align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 24;
    if (y + rH > 680) { doc.addPage(); doc.rect(0, 0, sideW, 842).fill('#1a1a1a'); y = 40; }
    if (i % 2 === 1) doc.rect(col1, y, bodyW, rH).fill('#f9fafb');
    doc.fillColor('#1f2937').font('Helvetica').fontSize(8);
    doc.text(item.description, col1 + 8, y + 8, { width: 150 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), col2, y + 8, { width: 68, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), col3, y + 8, { width: 58, align: 'right' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold');
    doc.text(formatCurrency(itemTotal, invoice.currency), col4, y + 8, { width: bodyW - (col4 - col1), align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(col1, y + rH).lineTo(col1 + bodyW, y + rH).stroke();
    y += rH;
  });

  y += 12;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  const rX = col3 - 10;
  doc.text('Subtotal :', rX, y, { width: 80, align: 'right' });
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), col4, y, { width: bodyW - (col4 - col1), align: 'right' });
  y += 15;
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`Tax Vat (${taxRate}%) :`, rX, y, { width: 80, align: 'right' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(formatCurrency(taxed, invoice.currency), col4, y, { width: bodyW - (col4 - col1), align: 'right' });
    y += 15;
  }
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text('Total :', rX, y, { width: 80, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), col4, y, { width: bodyW - (col4 - col1), align: 'right' });

  // Footer
  const fy = 756;
  doc.rect(0, fy, 595, 86).fill('#f3f4f6');
  if (invoice.notes) {
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7).text(invoice.notes, bodyX, fy + 10, { width: 160 });
  }
  doc.rect(bodyX + 175, fy + 8, 8, 8).fill('#1a1a1a');
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text('E-mail', bodyX + 188, fy + 8);
  doc.fillColor('#1a1a1a').font('Helvetica').fontSize(7.5).text(`${organization.slug || 'billing'}@company.com`, bodyX + 188, fy + 19, { width: 150 });
  doc.rect(bodyX + 175, fy + 36, 8, 8).fill('#1a1a1a');
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text('Address', bodyX + 188, fy + 36);
  doc.fillColor('#1a1a1a').font('Helvetica').fontSize(7.5).text(organization.address || 'Main Street, Anytown', bodyX + 188, fy + 47, { width: 150 });
}
