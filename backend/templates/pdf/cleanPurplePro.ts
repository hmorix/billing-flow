import { PdfTemplateParams, formatCurrency } from './types';

export function drawCleanPurpleProTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri } = params;
  const margin = 45;
  const contentWidth = 505;
  const purple = '#4338ca';

  let logoEndX = margin;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 38, { fit: [52, 52] });
      logoEndX = margin + 60;
    } catch (e) {}
  } else {
    doc.circle(margin + 20, 58, 20).fill(purple);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(14).text(organization.name.charAt(0), margin + 13, 51);
    logoEndX = margin + 48;
  }

  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(13).text(organization.name, logoEndX + 4, 38, { width: 200 });
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(13).text('.', logoEndX + 4 + doc.widthOfString(organization.name, { fontSize: 13 }), 38);

  doc.fillColor(purple).font('Helvetica-Bold').fontSize(28).text('INVOICE', 350, 32, { align: 'right', width: 200 });
  doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8.5).text(new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 350, 66, { align: 'right', width: 200 });

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, 105).lineTo(margin + contentWidth, 105).stroke();

  let fromY = 118;
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5).text('Office Address', margin, fromY);
  fromY += 13;
  if (organization.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(organization.address, margin, fromY, { width: 200 });
    fromY += doc.heightOfString(organization.address, { width: 200 }) + 4;
  }
  if (organization.phone) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(organization.phone, margin, fromY, { width: 200 });
  }

  doc.fillColor('#6b7280').font('Helvetica').fontSize(8).text('To :', 310, 118);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(10.5).text(client.name, 310, 131, { width: 240 });
  let toY = 146;
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.address, 310, toY, { width: 235 });
    toY += doc.heightOfString(client.address, { width: 235 }) + 3;
  }
  if (client.email) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.email, 310, toY, { width: 235 });
  }

  let y = 196;
  const cW = [contentWidth * 0.45, contentWidth * 0.18, contentWidth * 0.12, contentWidth * 0.25];
  const cX = [margin, margin + cW[0], margin + cW[0] + cW[1], margin + cW[0] + cW[1] + cW[2]];

  doc.rect(margin, y, contentWidth, 24).fill(purple);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('Items Description', cX[0] + 8, y + 8, { width: cW[0] - 8 });
  doc.text('Unit Price', cX[1], y + 8, { width: cW[1], align: 'center' });
  doc.text('Qnt', cX[2], y + 8, { width: cW[2], align: 'center' });
  doc.text('Total', cX[3], y + 8, { width: cW[3] - 8, align: 'right' });
  y += 24;

  let subtotal = 0;
  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const descH = doc.heightOfString(item.description, { width: cW[0] - 8 });
    const rH = Math.max(30, descH + 14);
    if (y + rH > 680) { doc.addPage(); y = 40; }

    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5);
    doc.text(item.description, cX[0] + 8, y + 8, { width: cW[0] - 16 });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8.5);
    doc.text(formatCurrency(item.unit_price, invoice.currency), cX[1], y + 8, { width: cW[1], align: 'center' });
    doc.text(Number(item.quantity).toFixed(0), cX[2], y + 8, { width: cW[2], align: 'center' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5);
    doc.text(formatCurrency(itemTotal, invoice.currency), cX[3], y + 8, { width: cW[3] - 8, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.8).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 10;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  const totX = cX[2];
  doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text('SUBTOTAL :', totX, y, { width: cW[2], align: 'right' });
  doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), cX[3], y, { width: cW[3] - 8, align: 'right' });
  y += 14;
  if (taxRate > 0) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`Tax VAT ${taxRate}% :`, totX, y, { width: cW[2], align: 'right' });
    doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(taxed, invoice.currency), cX[3], y, { width: cW[3] - 8, align: 'right' });
    y += 14;
  }
  if (discount > 0) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`DISCOUNT :`, totX, y, { width: cW[2], align: 'right' });
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(`-${formatCurrency(discount, invoice.currency)}`, cX[3], y, { width: cW[3] - 8, align: 'right' });
    y += 14;
  }

  const totW = contentWidth - (cX[2] - margin);
  doc.rect(cX[2] - 10, y, totW + 10, 26).fill(purple);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('TOTAL DUE :', cX[2], y + 8, { width: cW[2] - 2, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), cX[3], y + 8, { width: cW[3] - 8, align: 'right' });

  y += 42;
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(10).text('Thank you for your Business', margin, y);

  const fy = 728;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, fy).lineTo(margin + contentWidth, fy).stroke();
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text('Questions?', margin, fy + 10);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text(`Email us  : ${organization.slug || 'company'}@mail.site`, margin, fy + 23);
  doc.text(`Call us   : ${organization.phone || '+123 456 789'}`, margin, fy + 33);

  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text('Payment Info :', 210, fy + 10);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text('Account  : 1234 567 890', 210, fy + 23);
  doc.text(`A/C Name : ${organization.name}`, 210, fy + 33);

  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text('Terms & Conditions/Note:', 370, fy + 10);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(invoice.notes || 'Payment due within 30 days. All transactions are subject to our standard terms.', 370, fy + 23, { width: 175 });
}
