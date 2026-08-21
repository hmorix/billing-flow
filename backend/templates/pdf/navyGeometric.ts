import { PdfTemplateParams, formatCurrency } from './types';

export function drawNavyGeometricTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri } = params;
  const navy = '#1e3a5f';
  const navyLight = '#2563a8';
  const margin = 40;
  const contentWidth = 515;

  doc.rect(0, 0, 595, 105).fill(navy);

  doc.save();
  doc.circle(530, 40, 38).fill(navyLight);
  doc.circle(530, 40, 22).fill(navy);
  doc.rect(500, 15, 60, 12).fill(navyLight);
  doc.rect(500, 38, 60, 8).fill(navyLight);
  doc.circle(565, 80, 12).fill(navyLight);
  doc.circle(545, 88, 6).fill(navyLight);
  doc.restore();

  if (logoUri) {
    try {
      doc.image(logoUri, margin, 26, { fit: [130, 52] });
    } catch (e) {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(organization.name, margin, 38, { width: 180 });
    }
  } else {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(organization.name, margin, 38, { width: 180 });
  }

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26).text('INVOICE:', 200, 36, { width: 280 });

  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  doc.text(`Invoice No: ${invoice.invoice_number}`, 390, 115);
  doc.text(`Invoice Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 390, 128);

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('INVOICE TO :', margin, 115);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(12).text(client.name, margin + 70, 112, { width: 280 });
  let cY = 130;
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
    doc.circle(margin + 72, cY + 3, 2).fill(navy);
    doc.text(client.address, margin + 80, cY, { width: 250 }); cY += 14;
  }
  if (client.phone) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
    doc.circle(margin + 72, cY + 3, 2).fill(navy);
    doc.text(client.phone, margin + 80, cY, { width: 250 }); cY += 14;
  }

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, 168).lineTo(margin + contentWidth, 168).stroke();

  const sideW = 155;
  doc.rect(margin, 178, sideW, 200).fill('#f1f5f9');

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('PAYMENT', margin + 10, 192);
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('METHOD', margin + 10, 204);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
  doc.text(`Account Name: ${organization.name}`, margin + 10, 225, { width: sideW - 20 });
  doc.text('Bank Transfer / Online', margin + 10, 245, { width: sideW - 20 });

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('TERMS &', margin + 10, 272);
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('CONDITIONS:', margin + 10, 282);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7).text(invoice.notes || 'Payment is due within 30 days. Thank you for your business.', margin + 10, 298, { width: sideW - 20 });

  let y = 178;
  const tX = margin + sideW + 10;
  const tW = contentWidth - sideW - 10;
  const c = [tX, tX + tW * 0.42, tX + tW * 0.62, tX + tW * 0.79];

  doc.rect(tX, y, tW, 22).fill(navy);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('PRODUCT', c[0] + 6, y + 7, { width: tW * 0.40 });
  doc.text('PRICE', c[1], y + 7, { width: tW * 0.20, align: 'center' });
  doc.text('QTY', c[2], y + 7, { width: tW * 0.17, align: 'center' });
  doc.text('TOTAL', c[3], y + 7, { width: tW * 0.21 - 6, align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 22;
    if (y + rH > 640) { doc.addPage(); y = 40; }
    if (i % 2 === 1) doc.rect(tX, y, tW, rH).fill('#f8fafc');
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
    doc.text(item.description, c[0] + 6, y + 7, { width: tW * 0.40 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), c[1], y + 7, { width: tW * 0.20, align: 'center' });
    doc.text(Number(item.quantity).toFixed(0), c[2], y + 7, { width: tW * 0.17, align: 'center' });
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(8);
    doc.text(formatCurrency(itemTotal, invoice.currency), c[3], y + 7, { width: tW * 0.21 - 6, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(tX, y + rH).lineTo(tX + tW, y + rH).stroke();
    y += rH;
  });

  y += 12;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(tX, y).lineTo(tX + tW, y).stroke();
  y += 8;
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text('SUB TOTAL', tX, y, { width: tW, align: 'right' });
  doc.fillColor(navy).font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), tX, y + 11, { width: tW, align: 'right' });
  y += 25;
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`TAX   ${taxRate}.00%`, tX, y, { width: tW, align: 'right' });
    y += 13;
  }
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text('TOTAL', tX, y, { width: tW, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), tX, y + 12, { width: tW, align: 'right' });

  const sigY = 590;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, sigY).lineTo(margin + contentWidth, sigY).stroke();
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text(organization.name + ' Team', margin + 220, sigY + 8);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(8);
  doc.text('Authorized Signatory', margin + 210, sigY + 20);

  const fy = 728;
  doc.rect(0, fy, 595, 114).fill(navy);

  doc.save();
  doc.circle(40, 800, 45).fill(navyLight);
  doc.circle(25, 842, 28).fill(navyLight);
  doc.rect(0, 740, 20, 102).fill(navyLight);
  doc.restore();

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
  doc.text(`${organization.phone || '+1 234 567 8900'}`, 195, fy + 18, { width: 205, align: 'center' });
  doc.fillColor('#93c5fd').font('Helvetica').fontSize(8);
  doc.text(`${organization.slug || 'billing'}@company.com`, 195, fy + 36, { width: 205, align: 'center' });
  doc.text('Official Document', 195, fy + 48, { width: 205, align: 'center' });
}
