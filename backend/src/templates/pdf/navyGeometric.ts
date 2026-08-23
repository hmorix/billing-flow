import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawNavyGeometricTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const navy = '#1e3a5f';
  const navyLight = '#2563a8';
  const margin = 40;
  const contentWidth = 515;

  // Header Banner
  doc.rect(0, 0, 595, 96).fill(navy);

  doc.save();
  doc.circle(530, 36, 34).fill(navyLight);
  doc.circle(530, 36, 20).fill(navy);
  doc.rect(500, 15, 55, 10).fill(navyLight);
  doc.circle(565, 75, 10).fill(navyLight);
  doc.restore();

  if (logoUri) {
    try {
      doc.image(logoUri, margin, 24, { fit: [130, 48] });
    } catch (e) {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(organization.name, margin, 32, { width: 200 });
    }
  } else {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(organization.name, margin, 32, { width: 200 });
  }

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('TAX INVOICE', 220, 34, { width: 220 });
  drawStatusBadge(doc, 480, 28, invoice.status);

  // Meta row below header
  doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(8.5);
  doc.text(`Invoice No: ${invoice.invoice_number}`, margin, 108);
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin + 170, 108);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin + 340, 108);

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, 122).lineTo(margin + contentWidth, 122).stroke();

  // Billed From / Billed To Cards
  const cardW = 250;
  const cardH = 75;

  doc.roundedRect(margin, 128, cardW, cardH, 4).fill('#f8fafc');
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('BILLED FROM (SELLER)', margin + 8, 134);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text(organization.name, margin + 8, 145, { width: cardW - 16 });
  let fY = 156;
  if (organization.address) { doc.fillColor('#4b5563').font('Helvetica').fontSize(7.2).text(organization.address, margin + 8, fY, { width: cardW - 16 }); fY += 9; }
  const orgGstin = organization.tax_id ? `GSTIN: ${organization.tax_id}` : '';
  const orgPh = organization.phone ? `Ph: ${organization.phone}` : '';
  doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(7.2).text([orgPh, orgGstin].filter(Boolean).join(' | '), margin + 8, Math.min(fY, 192), { width: cardW - 16 });

  const toX = margin + contentWidth - cardW;
  doc.roundedRect(toX, 128, cardW, cardH, 4).fill('#f8fafc');
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('BILLED TO (BUYER)', toX + 8, 134);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text(client.name, toX + 8, 145, { width: cardW - 16 });
  let tY = 156;
  if (client.company_name) { doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7.5).text(client.company_name, toX + 8, tY, { width: cardW - 16 }); tY += 9; }
  if (client.address) { doc.fillColor('#4b5563').font('Helvetica').fontSize(7.2).text(client.address, toX + 8, tY, { width: cardW - 16 }); tY += 9; }
  const clientGstin = client.tax_id ? `GSTIN: ${client.tax_id}` : '';
  const clientPh = client.phone ? `Ph: ${client.phone}` : '';
  doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(7.2).text([clientPh, clientGstin].filter(Boolean).join(' | '), toX + 8, Math.min(tY, 192), { width: cardW - 16 });

  // Table
  let y = 212;
  const cW = [25, contentWidth * 0.44, contentWidth * 0.18, contentWidth * 0.12, contentWidth * 0.26 - 25];
  const cX = [margin, margin + cW[0], margin + cW[0] + cW[1], margin + cW[0] + cW[1] + cW[2], margin + cW[0] + cW[1] + cW[2] + cW[3]];

  doc.roundedRect(margin, y, contentWidth, 22, 3).fill(navy);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('#', cX[0] + 6, y + 7, { width: cW[0] });
  doc.text('PRODUCT / SERVICE', cX[1], y + 7, { width: cW[1] });
  doc.text('PRICE', cX[2], y + 7, { width: cW[2], align: 'right' });
  doc.text('QTY', cX[3], y + 7, { width: cW[3], align: 'center' });
  doc.text('TOTAL', cX[4], y + 7, { width: cW[4] - 6, align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 20;
    if (y + rH > 600) { doc.addPage(); y = 40; }
    if (i % 2 === 1) doc.rect(margin, y, contentWidth, rH).fill('#f8fafc');
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
    doc.text(String(i + 1), cX[0] + 6, y + 5, { width: cW[0] });
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
    doc.text(item.description, cX[1], y + 5, { width: cW[1] - 8 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), cX[2], y + 5, { width: cW[2], align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), cX[3], y + 5, { width: cW[3], align: 'center' });
    doc.fillColor(navy).font('Helvetica-Bold');
    doc.text(formatCurrency(itemTotal, invoice.currency), cX[4], y + 5, { width: cW[4] - 6, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 8;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);

  const calcX = margin + 270;
  const calcW = contentWidth - 270;

  // Words Box
  doc.roundedRect(margin, y, 255, 48, 4).fill('#f8fafc');
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(7.5).text('AMOUNT IN WORDS', margin + 8, y + 6);
  doc.fillColor('#1f2937').font('Helvetica-Oblique').fontSize(7.2).text(words, margin + 8, y + 18, { width: 240 });

  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  doc.text('SUB TOTAL :', calcX, y, { width: calcW - 110, align: 'right' });
  doc.fillColor(navy).font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' });
  y += 13;

  if (taxInfo.discount > 0) {
    doc.fillColor('#4b5563').text('DISCOUNT :', calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor('#ef4444').text(`-${formatCurrency(taxInfo.discount, invoice.currency)}`, calcX + calcW - 105, y, { width: 105, align: 'right' });
    y += 13;
  }

  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#4b5563').text(`CGST (${taxInfo.cgstRate}%) :`, calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(navy).text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' });
    y += 13;
    doc.fillColor('#4b5563').text(`SGST (${taxInfo.sgstRate}%) :`, calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(navy).text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' });
    y += 13;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#4b5563').text(`IGST (${taxInfo.igstRate}%) :`, calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(navy).text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' });
    y += 13;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#4b5563').text(`TAX (${taxInfo.taxRate}%) :`, calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(navy).text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' });
    y += 13;
  }

  doc.roundedRect(calcX, y, calcW, 24, 4).fill(navy);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('TOTAL DUE :', calcX + 8, y + 7, { width: 100, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, y + 7, { width: calcW - 108, align: 'right' });

  y = Math.max(y + 34, 435);

  // Thanks banner
  const thanksMsg = invoice.thanks_message || organization.thanks_message || 'Thank you for choosing our business!';
  doc.roundedRect(margin, y, contentWidth, 20, 3).fill('#e0f2fe');
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text(thanksMsg, margin, y + 6, { width: contentWidth, align: 'center' });

  y += 28;

  // 3 Bottom Cards
  const bCardW = (contentWidth - 16) / 3;
  const bCardH = 100;

  // Bank & Contact
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill('#f8fafc');
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS & CONTACT', margin + 8, y + 7);
  doc.fillColor('#374151').font('Helvetica').fontSize(7);
  let bY = y + 19;
  if (organization.bank_name) { doc.font('Helvetica-Bold').text(`Bank: ${organization.bank_name}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  if (organization.bank_account_no) { doc.font('Helvetica').text(`A/C: ${organization.bank_account_no}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  if (organization.bank_ifsc) { doc.text(`IFSC: ${organization.bank_ifsc}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  if (organization.bank_upi_id) { doc.text(`UPI: ${organization.bank_upi_id}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  const cPhone = organization.contact_phone || organization.phone;
  if (cPhone) { doc.font('Helvetica-Bold').text(`Ph: ${cPhone}`, margin + 8, bY, { width: bCardW - 16 }); }

  // Terms
  const termsX = margin + bCardW + 8;
  const termsText = invoice.terms_conditions || organization.terms_conditions || invoice.notes || 'Payment due within 30 days. Standard commercial terms apply.';
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill('#f8fafc');
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(6.8).text(termsText, termsX + 8, y + 19, { width: bCardW - 16, lineGap: 1.5 });

  // Signature
  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill('#f8fafc');
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [40, 40] });
      doc.fillColor('#6b7280').font('Helvetica').fontSize(6).text('Scan to Pay / View', sigX + 4, y + 58, { width: 44, align: 'center' });
    } catch (e) {}
  }
  const sX = qrCodeUri ? sigX + 52 : sigX + 8;
  const sW = qrCodeUri ? bCardW - 58 : bCardW - 16;
  doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(7).text(`For ${organization.name}`, sX, y + 7, { width: sW, align: 'center' });
  doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(sX, y + 68).lineTo(sX + sW, y + 68).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', sX, y + 72, { width: sW, align: 'center' });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', sX, y + 82, { width: sW, align: 'center' });

  // Footer
  drawHMorixFooter(doc, margin, 782, contentWidth, publicBillUrl);
}
