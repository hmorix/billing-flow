import {
  PdfTemplateParams, formatCurrency, drawStatusBadge,
  calculateTaxBreakdown, numberToWords, drawHMorixFooter
} from './types';

export function drawCorporateCrimsonTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const cw = 515;
  const burg = '#881337';
  const lightBurg = '#fdf2f4';

  // Full top header bar
  doc.rect(0, 0, 595, 80).fill(burg);

  let headerX = margin;
  if (logoUri) {
    try { doc.image(logoUri, margin, 18, { fit: [80, 44] }); headerX = margin + 92; } catch (e) {}
  }
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(organization.name, headerX, 20, { width: 270 });
  doc.fillColor('rgba(255,255,255,0.75)').font('Helvetica').fontSize(7.5).text(
    [organization.address, organization.phone, organization.email].filter(Boolean).join('  •  '),
    headerX, 42, { width: 270 }
  );
  if (organization.tax_id) doc.fillColor('rgba(255,255,255,0.9)').font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + organization.tax_id, headerX, 55, { width: 270 });

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26).text('INVOICE', margin + 310, 20, { width: 205, align: 'right' });
  doc.fillColor('rgba(255,255,255,0.85)').font('Helvetica').fontSize(8)
    .text('No: ' + invoice.invoice_number, margin + 310, 52, { width: 205, align: 'right' })
    .text('Date: ' + new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 310, 63, { width: 205, align: 'right' })
    .text('Due: ' + new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 310, 74, { width: 205, align: 'right' });

  // Status badge
  drawStatusBadge(doc, margin + cw - 70, 0, invoice.status);

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

  const cardH = Math.max(80, Math.max(fromTotalH, toTotalH));
  const cardStartY = 95;

  // Billed From
  doc.roundedRect(margin, cardStartY, cardW, cardH, 4).fill(lightBurg);
  doc.fillColor(burg).font('Helvetica-Bold').fontSize(7.5).text('BILLED FROM', margin + 10, cardStartY + 8);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text(organization.name, margin + 10, cardStartY + 20, { width: cardW - 20 });
  let fromY = cardStartY + 20 + fromNameH + 2;
  if (organization.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(organization.address, margin + 10, fromY, { width: cardW - 20 });
    fromY += fromAddrH + 2;
  }
  if (organization.tax_id) {
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + organization.tax_id, margin + 10, fromY, { width: cardW - 20 });
  }

  // Billed To
  const toX = margin + cw - cardW;
  doc.roundedRect(toX, cardStartY, cardW, cardH, 4).fill(lightBurg);
  doc.fillColor(burg).font('Helvetica-Bold').fontSize(7.5).text('BILLED TO', toX + 10, cardStartY + 8);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text(client.name, toX + 10, cardStartY + 20, { width: cardW - 20 });
  let toY = cardStartY + 20 + toNameH + 2;
  if (client.company_name) {
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8).text(client.company_name, toX + 10, toY, { width: cardW - 20 });
    toY += toCompH + 2;
  }
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(client.address, toX + 10, toY, { width: cardW - 20 });
    toY += toAddrH + 2;
  }
  if (client.tax_id) {
    doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + client.tax_id, toX + 10, toY, { width: cardW - 20 });
  }

  let y = cardStartY + cardH + 12;
  // Table
  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, cw, 22).fill(burg);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
    doc.text('#', margin + 6, headerY + 7, { width: 20 });
    doc.text('Description', margin + 30, headerY + 7, { width: 220 });
    doc.text('Unit Price', margin + 255, headerY + 7, { width: 80, align: 'right' });
    doc.text('Qty', margin + 340, headerY + 7, { width: 45, align: 'center' });
    doc.text('Amount', margin + 390, headerY + 7, { width: 115, align: 'right' });
    return headerY + 22;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
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
    if (y + rowH > 620) {
      doc.addPage();
      y = renderTableHeader(40);
    }
    if (i % 2 === 1) doc.rect(margin, y, cw, rowH).fill(lightBurg);
    const textY = y + 6;
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8).text(String(i + 1), margin + 6, textY, { width: 20 });
    doc.fillColor('#1f2937').font('Helvetica').fontSize(8).text(itemDesc, margin + 30, textY, { width: 220, lineGap: 1 });
    if (metaSubtitle) {
      const subY = textY + descH + 3;
      doc.fillColor(burg).font('Helvetica-Bold').fontSize(6.8).text(metaSubtitle, margin + 30, subY, { width: 220, lineGap: 1 });
    }
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), margin + 255, textY, { width: 80, align: 'right' });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), margin + 340, textY, { width: 45, align: 'center' });
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), margin + 390, textY, { width: 115, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#f0d9dd').lineWidth(0.8).moveTo(margin, y + rowH).lineTo(margin + cw, y + rowH).stroke();
    y += rowH;
  });

  y += 10;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal, items);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);

  doc.font('Helvetica-Oblique').fontSize(7.5);
  const wordsH = Math.max(48, Math.ceil(doc.heightOfString(words, { width: 240, lineGap: 1 }) + 22));

  if (y + wordsH + 40 > 620) {
    doc.addPage();
    y = 40;
  }

  const calcX = margin + 270; const calcW = cw - 270;
  const summaryStartY = y;

  doc.roundedRect(margin, summaryStartY, 255, wordsH, 4).fill(lightBurg);
  doc.fillColor(burg).font('Helvetica-Bold').fontSize(7.5).text('AMOUNT IN WORDS', margin + 8, summaryStartY + 6);
  doc.fillColor('#1f2937').font('Helvetica-Oblique').fontSize(7.5).text(words, margin + 8, summaryStartY + 18, { width: 240, lineGap: 1 });

  let calcY = summaryStartY;
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  doc.text('SUBTOTAL :', calcX, calcY, { width: calcW - 110, align: 'right' });
  doc.fillColor('#111827').text(formatCurrency(taxInfo.subtotal, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
  if (taxInfo.discount > 0) { doc.fillColor('#4b5563').text('DISCOUNT :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#ef4444').text('-' + formatCurrency(taxInfo.discount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#4b5563').text('CGST (' + taxInfo.cgstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
    doc.fillColor('#4b5563').text('SGST (' + taxInfo.sgstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#4b5563').text('IGST (' + taxInfo.igstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#4b5563').text('TAX (' + taxInfo.taxRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
  } else if (taxInfo.hasItemTax) {
    doc.fillColor('#4b5563').text('GST TAX (ITEM-WISE) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
  }
  doc.roundedRect(calcX, calcY, calcW, 24, 4).fill(burg);
  doc.fillColor('#fff').fontSize(9.5).font('Helvetica-Bold').text('TOTAL DUE :', calcX + 8, calcY + 7, { width: 100, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, calcY + 7, { width: calcW - 108, align: 'right' });
  calcY += 24;

  y = Math.max(summaryStartY + wordsH + 10, calcY + 14, 440);

  if (y + 140 > 765) {
    doc.addPage();
    y = 40;
  }

  const thanksMsg = invoice.thanks_message || organization.thanks_message || 'Thank you for your business!';
  doc.roundedRect(margin, y, cw, 20, 3).fill('#fdf2f4');
  doc.fillColor(burg).font('Helvetica-Bold').fontSize(8).text(thanksMsg, margin, y + 6, { width: cw, align: 'center' });
  y += 28;

  const bCardW = (cw - 16) / 3; const bCardH = 105;
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill(lightBurg);
  doc.fillColor(burg).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS', margin + 8, y + 7);
  let bankY = y + 20; doc.fillColor('#374151').font('Helvetica').fontSize(7);
  if (organization.bank_name) { doc.font('Helvetica-Bold').text('Bank: ' + organization.bank_name, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_account_no) { doc.font('Helvetica').text('A/C: ' + organization.bank_account_no, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_ifsc) { doc.text('IFSC: ' + organization.bank_ifsc, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_upi_id) { doc.text('UPI: ' + organization.bank_upi_id, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.phone) { doc.font('Helvetica-Bold').text('Ph: ' + organization.phone, margin + 8, bankY, { width: bCardW - 16 }); }

  const termsX = margin + bCardW + 8;
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill(lightBurg);
  doc.fillColor(burg).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(6.8).text(invoice.terms_conditions || organization.terms_conditions || '1. Payment due within due date.\n2. Mention invoice no. in reference.\n3. Late payments attract interest.', termsX + 8, y + 20, { width: bCardW - 16, lineGap: 1.5 });

  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill(lightBurg);
  if (qrCodeUri) { try { doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [42, 42] }); doc.fillColor('#6b7280').font('Helvetica').fontSize(6).text('Scan to Pay', sigX + 4, y + 60, { width: 46, align: 'center' }); } catch (e) {} }
  const signX2 = qrCodeUri ? sigX + 54 : sigX + 8; const signW2 = qrCodeUri ? bCardW - 60 : bCardW - 16;
  doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(7).text('For ' + organization.name, signX2, y + 7, { width: signW2, align: 'center' });
  doc.strokeColor('#d1a0a8').lineWidth(0.8).moveTo(signX2, y + 72).lineTo(signX2 + signW2, y + 72).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', signX2, y + 76, { width: signW2, align: 'center' });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', signX2, y + 86, { width: signW2, align: 'center' });

  drawHMorixFooter(doc, margin, 782, cw, publicBillUrl);
}
