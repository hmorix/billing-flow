import {
  PdfTemplateParams, formatCurrency, drawStatusBadge,
  calculateTaxBreakdown, numberToWords, drawHMorixFooter
} from './types';

export function drawGoldenEleganceTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const cw = 515;
  const gold = '#b45309';
  const amber = '#d97706';
  const ivory = '#fffbeb';
  const warmBg = '#fef3c7';

  doc.rect(0, 0, 595, 842).fill(ivory);
  doc.rect(0, 0, 595, 5).fill(gold);
  doc.rect(0, 5, 595, 2).fill(amber);

  let headerX = margin;
  if (logoUri) {
    try { doc.image(logoUri, margin, 20, { fit: [85, 45] }); headerX = margin + 95; } catch (e) {}
  }
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(17).text(organization.name, headerX, 22, { width: 270 });
  doc.fillColor('#78350f').font('Helvetica').fontSize(7.5).text(
    [organization.address, organization.phone, organization.email].filter(Boolean).join('  •  '),
    headerX, 44, { width: 270 }
  );
  if (organization.tax_id) doc.fillColor(gold).font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + organization.tax_id, headerX, 56);

  drawStatusBadge(doc, margin + cw - 70, 22, invoice.status);
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(26).text('INVOICE', margin + 290, 18, { width: 215, align: 'right' });
  doc.fillColor('#78350f').font('Helvetica').fontSize(8)
    .text('No: ' + invoice.invoice_number, margin + 290, 52, { width: 215, align: 'right' })
    .text('Date: ' + new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 290, 63, { width: 215, align: 'right' })
    .text('Due: ' + new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 290, 74, { width: 215, align: 'right' });

  doc.strokeColor(amber).lineWidth(1.5).moveTo(margin, 84).lineTo(margin + cw, 84).stroke();

  let y = 92;
  const cardW = 248;
  doc.roundedRect(margin, y, cardW, 76, 4).fill(warmBg);
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(7.5).text('BILLED FROM', margin + 10, y + 8);
  doc.fillColor('#1c1917').font('Helvetica-Bold').fontSize(9).text(organization.name, margin + 10, y + 20, { width: cardW - 20 });
  if (organization.address) doc.fillColor('#78350f').font('Helvetica').fontSize(7.5).text(organization.address, margin + 10, y + 32, { width: cardW - 20 });
  if (organization.tax_id) doc.fillColor('#1c1917').font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + organization.tax_id, margin + 10, y + 55, { width: cardW - 20 });

  const toX = margin + cw - cardW;
  doc.roundedRect(toX, y, cardW, 76, 4).fill(warmBg);
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(7.5).text('BILLED TO', toX + 10, y + 8);
  doc.fillColor('#1c1917').font('Helvetica-Bold').fontSize(9).text(client.name, toX + 10, y + 20, { width: cardW - 20 });
  if (client.company_name) doc.fillColor('#78350f').font('Helvetica-Bold').fontSize(8).text(client.company_name, toX + 10, y + 32, { width: cardW - 20 });
  if (client.address) doc.fillColor('#78350f').font('Helvetica').fontSize(7.5).text(client.address, toX + 10, y + 42, { width: cardW - 20 });
  if (client.tax_id) doc.fillColor('#1c1917').font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + client.tax_id, toX + 10, y + 55, { width: cardW - 20 });

  y += 86;
  doc.rect(margin, y, cw, 22).fill(gold);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
  doc.text('#', margin + 6, y + 7, { width: 20 }); doc.text('Item Description', margin + 30, y + 7, { width: 220 });
  doc.text('Unit Price', margin + 255, y + 7, { width: 80, align: 'right' }); doc.text('Qty', margin + 340, y + 7, { width: 45, align: 'center' }); doc.text('Amount', margin + 390, y + 7, { width: 115, align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price); subtotal += itemTotal;
    const rowH = Math.max(22, doc.heightOfString(item.description, { width: 220, fontSize: 8 }) + 8);
    if (y + rowH > 620) { doc.addPage(); doc.rect(0, 0, 595, 842).fill(ivory); doc.rect(margin, 40, cw, 22).fill(gold); doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8); doc.text('#', margin + 6, 47, { width: 20 }); doc.text('Item Description', margin + 30, 47, { width: 220 }); doc.text('Unit Price', margin + 255, 47, { width: 80, align: 'right' }); doc.text('Qty', margin + 340, 47, { width: 45, align: 'center' }); doc.text('Amount', margin + 390, 47, { width: 115, align: 'right' }); y = 62; }
    if (i % 2 === 1) doc.rect(margin, y, cw, rowH).fill(warmBg);
    doc.fillColor('#a16207').font('Helvetica').fontSize(8).text(String(i + 1), margin + 6, y + 6, { width: 20 });
    doc.fillColor('#1c1917').text(item.description, margin + 30, y + 6, { width: 220 });
    doc.fillColor('#78350f').text(formatCurrency(item.unit_price, invoice.currency), margin + 255, y + 6, { width: 80, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), margin + 340, y + 6, { width: 45, align: 'center' });
    doc.fillColor('#1c1917').font('Helvetica-Bold').text(formatCurrency(itemTotal, invoice.currency), margin + 390, y + 6, { width: 115, align: 'right' });
    doc.font('Helvetica'); doc.strokeColor('#fde68a').lineWidth(0.8).moveTo(margin, y + rowH).lineTo(margin + cw, y + rowH).stroke(); y += rowH;
  });

  y += 10;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);
  const calcX = margin + 270; const calcW = cw - 270;

  doc.roundedRect(margin, y, 255, 48, 4).fill(warmBg);
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(7.5).text('AMOUNT IN WORDS', margin + 8, y + 6);
  doc.fillColor('#1c1917').font('Helvetica-Oblique').fontSize(7.5).text(words, margin + 8, y + 18, { width: 240 });

  doc.fillColor('#78350f').font('Helvetica-Bold').fontSize(8);
  doc.text('SUBTOTAL :', calcX, y, { width: calcW - 110, align: 'right' }); doc.fillColor('#1c1917').text(formatCurrency(taxInfo.subtotal, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 14;
  if (taxInfo.discount > 0) { doc.fillColor('#78350f').text('DISCOUNT :', calcX, y, { width: calcW - 110, align: 'right' }); doc.fillColor('#dc2626').text('-' + formatCurrency(taxInfo.discount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 14; }
  if (taxInfo.hasCgstSgst) { doc.fillColor('#78350f').text('CGST (' + taxInfo.cgstRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' }); doc.fillColor('#1c1917').text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 14; doc.fillColor('#78350f').text('SGST (' + taxInfo.sgstRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' }); doc.fillColor('#1c1917').text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 14; }
  else if (taxInfo.hasIgst) { doc.fillColor('#78350f').text('IGST (' + taxInfo.igstRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' }); doc.fillColor('#1c1917').text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 14; }
  else if (taxInfo.hasFlatTax) { doc.fillColor('#78350f').text('TAX (' + taxInfo.taxRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' }); doc.fillColor('#1c1917').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 14; }
  doc.roundedRect(calcX, y, calcW, 24, 4).fill(gold);
  doc.fillColor('#fff').fontSize(9.5).font('Helvetica-Bold').text('TOTAL DUE :', calcX + 8, y + 7, { width: 100 });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, y + 7, { width: calcW - 108, align: 'right' });

  y = Math.max(y + 36, 440);
  doc.roundedRect(margin, y, cw, 20, 3).fill(warmBg);
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(8).text(invoice.thanks_message || organization.thanks_message || 'Thank you for your business!', margin, y + 6, { width: cw, align: 'center' });
  y += 28;

  const bCardW = (cw - 16) / 3; const bCardH = 105;
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill(warmBg);
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS', margin + 8, y + 7);
  let bankY = y + 20; doc.fillColor('#78350f').font('Helvetica').fontSize(7);
  if (organization.bank_name) { doc.font('Helvetica-Bold').text('Bank: ' + organization.bank_name, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_account_no) { doc.font('Helvetica').text('A/C: ' + organization.bank_account_no, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_ifsc) { doc.text('IFSC: ' + organization.bank_ifsc, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_upi_id) { doc.text('UPI: ' + organization.bank_upi_id, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.phone) { doc.font('Helvetica-Bold').text('Ph: ' + organization.phone, margin + 8, bankY, { width: bCardW - 16 }); }

  const termsX = margin + bCardW + 8;
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill(warmBg);
  doc.fillColor(gold).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#78350f').font('Helvetica').fontSize(6.8).text(invoice.terms_conditions || organization.terms_conditions || '1. Payment due within due date.\n2. Mention invoice no. in reference.', termsX + 8, y + 20, { width: bCardW - 16, lineGap: 1.5 });

  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill(warmBg);
  if (qrCodeUri) { try { doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [42, 42] }); doc.fillColor('#a16207').font('Helvetica').fontSize(6).text('Scan to Pay', sigX + 4, y + 60, { width: 46, align: 'center' }); } catch (e) {} }
  const signX2 = qrCodeUri ? sigX + 54 : sigX + 8; const signW2 = qrCodeUri ? bCardW - 60 : bCardW - 16;
  doc.fillColor('#1c1917').font('Helvetica-Bold').fontSize(7).text('For ' + organization.name, signX2, y + 7, { width: signW2, align: 'center' });
  doc.strokeColor(amber).lineWidth(0.8).moveTo(signX2, y + 72).lineTo(signX2 + signW2, y + 72).stroke();
  doc.fillColor('#1c1917').font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', signX2, y + 76, { width: signW2, align: 'center' });
  doc.fillColor('#a16207').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', signX2, y + 86, { width: signW2, align: 'center' });

  doc.strokeColor(amber).lineWidth(1.5).moveTo(margin, y + bCardH + 8).lineTo(margin + cw, y + bCardH + 8).stroke();
  drawHMorixFooter(doc, margin, 782, cw, publicBillUrl);
}
