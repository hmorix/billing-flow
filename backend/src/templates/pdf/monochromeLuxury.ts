import {
  PdfTemplateParams, formatCurrency, drawStatusBadge,
  calculateTaxBreakdown, numberToWords, drawHMorixFooter
} from './types';

export function drawMonochromeLuxuryTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const cw = 515;
  const black = '#09090b';
  const mid = '#52525b';
  const light = '#f4f4f5';

  // Thin top bar
  doc.rect(0, 0, 595, 3).fill(black);

  let headerX = margin;
  if (logoUri) {
    try { doc.image(logoUri, margin, 22, { fit: [80, 40] }); headerX = margin + 90; } catch (e) {}
  }
  doc.fillColor(black).font('Helvetica-Bold').fontSize(15).text(organization.name.toUpperCase(), headerX, 24, { width: 280, characterSpacing: 1.5 });
  doc.fillColor(mid).font('Helvetica').fontSize(7).text(
    [organization.address, organization.phone, organization.email].filter(Boolean).join('  ·  '),
    headerX, 44, { width: 280 }
  );
  if (organization.tax_id) doc.fillColor(black).font('Helvetica').fontSize(7).text('GSTIN: ' + organization.tax_id, headerX, 54);

  drawStatusBadge(doc, margin + cw - 70, 22, invoice.status);
  doc.fillColor(black).font('Helvetica-Bold').fontSize(24).text('INVOICE', margin + 290, 18, { width: 215, align: 'right', characterSpacing: 3 });
  doc.fillColor(mid).font('Helvetica').fontSize(8)
    .text('No: ' + invoice.invoice_number, margin + 290, 50, { width: 215, align: 'right' })
    .text('Date: ' + new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 290, 61, { width: 215, align: 'right' })
    .text('Due: ' + new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 290, 72, { width: 215, align: 'right' });

  doc.rect(margin, 82, cw, 0.75).fill(black);

  // Dynamic Billed From / To Cards
  const cardW = 248;
  doc.font('Helvetica-Bold').fontSize(9);
  const fromNameH = doc.heightOfString(organization.name, { width: cardW - 20 });
  doc.font('Helvetica').fontSize(7.5);
  const fromAddrH = organization.address ? doc.heightOfString(organization.address, { width: cardW - 20 }) : 0;
  const fromTotalH = 20 + fromNameH + (fromAddrH ? fromAddrH + 3 : 0) + (organization.tax_id ? 14 : 0) + 10;

  doc.font('Helvetica-Bold').fontSize(9);
  const toNameH = doc.heightOfString(client.name, { width: cardW - 20 });
  const toCompH = client.company_name ? doc.heightOfString(client.company_name, { width: cardW - 20 }) : 0;
  doc.font('Helvetica').fontSize(7.5);
  const toAddrH = client.address ? doc.heightOfString(client.address, { width: cardW - 20 }) : 0;
  const toTotalH = 20 + toNameH + (toCompH ? toCompH + 3 : 0) + (toAddrH ? toAddrH + 3 : 0) + (client.tax_id ? 14 : 0) + 10;

  const cardH = Math.max(76, Math.max(fromTotalH, toTotalH));
  const cardStartY = 90;

  doc.roundedRect(margin, cardStartY, cardW, cardH, 0).fill(light);
  doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('BILLED FROM', margin + 10, cardStartY + 8, { characterSpacing: 1 });
  doc.fillColor(black).font('Helvetica-Bold').fontSize(9).text(organization.name, margin + 10, cardStartY + 20, { width: cardW - 20 });
  let fromY = cardStartY + 20 + fromNameH + 2;
  if (organization.address) { doc.fillColor(mid).font('Helvetica').fontSize(7.5).text(organization.address, margin + 10, fromY, { width: cardW - 20 }); fromY += fromAddrH + 2; }
  if (organization.tax_id) { doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('GSTIN: ' + organization.tax_id, margin + 10, fromY, { width: cardW - 20 }); }

  const toX = margin + cw - cardW;
  doc.roundedRect(toX, cardStartY, cardW, cardH, 0).fill(light);
  doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('BILLED TO', toX + 10, cardStartY + 8, { characterSpacing: 1 });
  doc.fillColor(black).font('Helvetica-Bold').fontSize(9).text(client.name, toX + 10, cardStartY + 20, { width: cardW - 20 });
  let toY = cardStartY + 20 + toNameH + 2;
  if (client.company_name) { doc.fillColor(black).font('Helvetica-Bold').fontSize(8).text(client.company_name, toX + 10, toY, { width: cardW - 20 }); toY += toCompH + 2; }
  if (client.address) { doc.fillColor(mid).font('Helvetica').fontSize(7.5).text(client.address, toX + 10, toY, { width: cardW - 20 }); toY += toAddrH + 2; }
  if (client.tax_id) { doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('GSTIN: ' + client.tax_id, toX + 10, toY, { width: cardW - 20 }); }

  let y = cardStartY + cardH + 12;

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, cw, 22).fill(black);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(7.5).characterSpacing(0.5);
    doc.text('#', margin + 6, headerY + 7, { width: 20 }); doc.text('DESCRIPTION', margin + 30, headerY + 7, { width: 220 });
    doc.text('UNIT PRICE', margin + 255, headerY + 7, { width: 80, align: 'right' }); doc.text('QTY', margin + 340, headerY + 7, { width: 45, align: 'center' }); doc.text('AMOUNT', margin + 390, headerY + 7, { width: 115, align: 'right' });
    doc.characterSpacing(0);
    return headerY + 22;
  };
  y = renderTableHeader(y);

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price); subtotal += itemTotal;
    const itemDesc = item.description || 'Item';
    const hsnMeta = item.sku_hsn ? `HSN/SAC: ${item.sku_hsn}` : '';
    const taxMeta = Number(item.tax_rate) > 0 ? `GST: ${item.tax_rate}%` : '';
    const metaSubtitle = [hsnMeta, taxMeta].filter(Boolean).join(' • ');

    doc.font('Helvetica').fontSize(8);
    const descH = doc.heightOfString(itemDesc, { width: 220, lineGap: 1 });
    let subH = 0;
    if (metaSubtitle) {
      doc.font('Helvetica-Bold').fontSize(6.8);
      subH = doc.heightOfString(metaSubtitle, { width: 220, lineGap: 1 });
    }
    const rowH = Math.max(26, Math.ceil(descH + (metaSubtitle ? subH + 4 : 0) + 14));
    if (y + rowH > 620) { doc.addPage(); y = renderTableHeader(40); }
    if (i % 2 === 1) doc.rect(margin, y, cw, rowH).fill(light);
    const textY = y + 6;
    doc.fillColor(mid).font('Helvetica').fontSize(8).text(String(i + 1), margin + 6, textY, { width: 20 });
    doc.fillColor(black).font('Helvetica').fontSize(8).text(itemDesc, margin + 30, textY, { width: 220, lineGap: 1 });
    if (metaSubtitle) {
      const subY = textY + descH + 3;
      doc.fillColor(mid).font('Helvetica-Bold').fontSize(6.8).text(metaSubtitle, margin + 30, subY, { width: 220, lineGap: 1 });
    }
    doc.fillColor(mid).font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), margin + 255, textY, { width: 80, align: 'right' });
    doc.fillColor(mid).font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), margin + 340, textY, { width: 45, align: 'center' });
    doc.fillColor(black).font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), margin + 390, textY, { width: 115, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#e4e4e7').lineWidth(0.6).moveTo(margin, y + rowH).lineTo(margin + cw, y + rowH).stroke();
    y += rowH;
  });

  doc.rect(margin, y, cw, 0.75).fill(black);
  y += 12;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal, items);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);

  doc.font('Helvetica-Oblique').fontSize(7.5);
  const wordsH = Math.max(48, Math.ceil(doc.heightOfString(words, { width: 240, lineGap: 1 }) + 22));
  if (y + wordsH + 40 > 620) { doc.addPage(); y = 40; }

  const calcX = margin + 270; const calcW = cw - 270;
  const summaryStartY = y;

  doc.roundedRect(margin, summaryStartY, 255, wordsH, 0).fill(light);
  doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('AMOUNT IN WORDS', margin + 8, summaryStartY + 6, { characterSpacing: 0.5 });
  doc.fillColor(mid).font('Helvetica-Oblique').fontSize(7.5).text(words, margin + 8, summaryStartY + 18, { width: 240, lineGap: 1 });

  let calcY = summaryStartY;
  doc.fillColor(mid).font('Helvetica-Bold').fontSize(8);
  doc.text('SUBTOTAL :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor(black).text(formatCurrency(taxInfo.subtotal, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
  if (taxInfo.discount > 0) { doc.fillColor(mid).text('DISCOUNT :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#dc2626').text('-' + formatCurrency(taxInfo.discount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  if (taxInfo.hasCgstSgst) { doc.fillColor(mid).text('CGST (' + taxInfo.cgstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor(black).text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; doc.fillColor(mid).text('SGST (' + taxInfo.sgstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor(black).text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  else if (taxInfo.hasIgst) { doc.fillColor(mid).text('IGST (' + taxInfo.igstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor(black).text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  else if (taxInfo.hasFlatTax) { doc.fillColor(mid).text('TAX (' + taxInfo.taxRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor(black).text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  else if (taxInfo.hasItemTax) { doc.fillColor('#4b5563').text('GST TAX (ITEM-WISE) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  doc.rect(calcX, calcY, calcW, 24).fill(black);
  doc.fillColor('#fff').fontSize(9.5).font('Helvetica-Bold').characterSpacing(0.5).text('TOTAL DUE :', calcX + 8, calcY + 7, { width: 100 });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, calcY + 7, { width: calcW - 108, align: 'right' }); doc.characterSpacing(0);
  calcY += 24;

  y = Math.max(summaryStartY + wordsH + 10, calcY + 14, 440);

  if (y + 140 > 765) { doc.addPage(); y = 40; }

  doc.rect(margin, y, cw, 20).fill(light);
  doc.fillColor(black).font('Helvetica-Bold').fontSize(8).text(invoice.thanks_message || organization.thanks_message || 'Thank you for your business.', margin, y + 6, { width: cw, align: 'center' });
  y += 28;

  const bCardW = (cw - 16) / 3; const bCardH = 105;
  doc.rect(margin, y, bCardW, bCardH).fill(light);
  doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('PAYMENT DETAILS', margin + 8, y + 7, { characterSpacing: 0.5 });
  let bankY = y + 20; doc.fillColor(mid).font('Helvetica').fontSize(7);
  if (organization.bank_name) { doc.font('Helvetica-Bold').fillColor(black).text('Bank: ' + organization.bank_name, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_account_no) { doc.font('Helvetica').fillColor(mid).text('A/C: ' + organization.bank_account_no, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_ifsc) { doc.text('IFSC: ' + organization.bank_ifsc, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_upi_id) { doc.text('UPI: ' + organization.bank_upi_id, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.phone) { doc.font('Helvetica-Bold').fillColor(black).text('Ph: ' + organization.phone, margin + 8, bankY, { width: bCardW - 16 }); }

  const termsX = margin + bCardW + 8;
  doc.rect(termsX, y, bCardW, bCardH).fill(light);
  doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('TERMS & CONDITIONS', termsX + 8, y + 7, { characterSpacing: 0.5 });
  doc.fillColor(mid).font('Helvetica').fontSize(6.8).text(invoice.terms_conditions || organization.terms_conditions || '1. Payment due within due date.\n2. Mention invoice no. in reference.', termsX + 8, y + 20, { width: bCardW - 16, lineGap: 1.5 });

  const sigX = termsX + bCardW + 8;
  doc.rect(sigX, y, bCardW, bCardH).fill(light);
  if (qrCodeUri) { try { doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [42, 42] }); doc.fillColor(mid).font('Helvetica').fontSize(6).text('Scan to Pay', sigX + 4, y + 60, { width: 46, align: 'center' }); } catch (e) {} }
  const signX2 = qrCodeUri ? sigX + 54 : sigX + 8; const signW2 = qrCodeUri ? bCardW - 60 : bCardW - 16;
  doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text('For ' + organization.name, signX2, y + 7, { width: signW2, align: 'center' });
  doc.strokeColor(black).lineWidth(0.8).moveTo(signX2, y + 72).lineTo(signX2 + signW2, y + 72).stroke();
  doc.fillColor(black).font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', signX2, y + 76, { width: signW2, align: 'center' });
  doc.fillColor(mid).font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', signX2, y + 86, { width: signW2, align: 'center' });

  doc.rect(margin, y + bCardH + 6, cw, 0.75).fill(black);
  drawHMorixFooter(doc, margin, 782, cw, publicBillUrl);
}
