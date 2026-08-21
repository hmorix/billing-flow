import { PdfTemplateParams, formatCurrency } from './types';

export function drawOrangeAccentTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri } = params;
  const margin = 45;
  const contentWidth = 505;
  const orange = '#f97316';
  const darkCol = '#1a1a1a';

  // Orange accent corner top-right
  doc.save();
  doc.rect(480, 0, 115, 80).fill(orange);
  doc.rect(545, 60, 50, 50).fill(orange);
  doc.restore();

  // Orange accent corner bottom-left
  doc.rect(0, 750, 50, 92).fill(orange);
  doc.rect(0, 700, 30, 92).fill(orange);

  // Logo / company name top-left
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 25, { fit: [120, 42] });
    } catch (e) {
      doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(14).text(organization.name, margin, 32, { width: 200 });
    }
  } else {
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(14).text(organization.name, margin, 32, { width: 200 });
  }

  if (organization.address) {
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(organization.address, margin, 52, { width: 200 });
  }

  // INVOICE large right
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(32).text('INVOICE', 310, 28, { align: 'right', width: 235 });
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9).text(new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 310, 66, { align: 'right', width: 235 });

  // TO: block right-aligned
  doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text('TO.', margin + 250, 105);
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(13).text(client.name, margin + 250, 117, { width: 255 });
  let toY = 133;
  if (client.company_name) {
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text(client.company_name, margin + 250, toY, { width: 255 }); toY += 13;
  }
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.address, margin + 250, toY, { width: 255 }); toY += 12;
  }

  // NO/ISN invoice number left
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9).text(`NO/ISN ${invoice.invoice_number}`, margin, 117);

  // Table
  let y = 185;
  doc.strokeColor('#d1d5db').lineWidth(0.8).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 10;

  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7.5);
  doc.text('QTY', margin, y, { width: 40 });
  doc.text('DESCRIPTION', margin + 48, y, { width: 220 });
  doc.text('PRICE', margin + 280, y, { width: 100, align: 'right' });
  doc.text('TOTAL', margin + 395, y, { width: 115, align: 'right' });
  y += 6;
  doc.strokeColor('#d1d5db').lineWidth(0.8).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 12;

  let subtotal = 0;
  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const descH = doc.heightOfString(item.description, { width: 210 });
    const rH = Math.max(26, descH + 12);
    if (y + rH > 660) { doc.addPage(); y = 40; }
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9);
    doc.text(Number(item.quantity).toFixed(0), margin, y + 4, { width: 40 });
    doc.text(item.description, margin + 48, y + 4, { width: 220 });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(9);
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 280, y + 4, { width: 100, align: 'right' });
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9);
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 395, y + 4, { width: 115, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 12;
  doc.strokeColor('#d1d5db').lineWidth(0.8).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 12;

  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  if (invoice.notes) {
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text('Payment Method', margin, y);
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(invoice.notes, margin, y + 13, { width: 200 });
  }

  doc.fillColor('#4b5563').font('Helvetica').fontSize(8.5).text('Sub Total', margin + 280, y, { width: 100, align: 'right' });
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text(formatCurrency(subtotal, invoice.currency), margin + 395, y, { width: 115, align: 'right' });
  y += 15;
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8.5).text(`Tax ${taxRate}%`, margin + 280, y, { width: 100, align: 'right' });
    doc.fillColor(darkCol).font('Helvetica-Bold').text(formatCurrency(taxed, invoice.currency), margin + 395, y, { width: 115, align: 'right' });
    y += 15;
  }

  y += 8;
  const termsY = y;
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text('Terms & Condition', margin, y);
  y += 13;
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text('Payment due within 30 days. Standard billing terms apply.', margin, y, { width: 200 });

  doc.rect(margin + 280, termsY - 2, 230, 26).fill(orange);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('GRAND TOTAL', margin + 292, termsY + 7, { width: 100 });
  doc.text(formatCurrency(total, invoice.currency), margin + 380, termsY + 7, { width: 120, align: 'right' });
}
