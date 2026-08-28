import {
  PdfTemplateParams, formatCurrency, drawStatusBadge,
  calculateTaxBreakdown, numberToWords, drawHMorixFooter
} from './types';

export function drawEmeraldCleanTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const cw = 515;
  const emerald = '#059669';
  const mint = '#f0fdf4';
  const darkGreen = '#064e3b';

  // Top accent bar
  doc.rect(0, 0, 595, 6).fill(emerald);

  let headerX = margin;
  if (logoUri) {
    try { doc.image(logoUri, margin, 20, { fit: [90, 45] }); headerX = margin + 100; } catch (e) {}
  }
  doc.fillColor(darkGreen).font('Helvetica-Bold').fontSize(17).text(organization.name, headerX, 20, { width: 280 });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(
    [organization.address, organization.phone].filter(Boolean).join('  •  '),
    headerX, 42, { width: 280 }
  );
  if (organization.tax_id) doc.fillColor(emerald).font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + organization.tax_id, headerX, 54);

  drawStatusBadge(doc, margin + cw - 70, 22, invoice.status);
  doc.fillColor(emerald).font('Helvetica-Bold').fontSize(26).text('INVOICE', margin + 310, 16, { width: 195, align: 'right' });
  doc.fillColor('#374151').font('Helvetica').fontSize(8)
    .text('No: ' + invoice.invoice_number, margin + 310, 50, { width: 195, align: 'right' })
    .text('Date: ' + new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 310, 61, { width: 195, align: 'right' })
    .text('Due: ' + new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 310, 72, { width: 195, align: 'right' });

  doc.strokeColor('#d1fae5').lineWidth(1).moveTo(margin, 82).lineTo(margin + cw, 82).stroke();

  let y = 90;
  const cardW = 248;
  doc.roundedRect(margin, y, cardW, 76, 4).fill(mint);
  doc.fillColor(emerald).font('Helvetica-Bold').fontSize(7.5).text('BILLED FROM', margin + 10, y + 8);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text(organization.name, margin + 10, y + 20, { width: cardW - 20 });
  if (organization.address) doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(organization.address, margin + 10, y + 32, { width: cardW - 20 });
  if (organization.tax_id) doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + organization.tax_id, margin + 10, y + 55, { width: cardW - 20 });

  const toX = margin + cw - cardW;
  doc.roundedRect(toX, y, cardW, 76, 4).fill(mint);
  doc.fillColor(emerald).font('Helvetica-Bold').fontSize(7.5).text('BILLED TO', toX + 10, y + 8);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text(client.name, toX + 10, y + 20, { width: cardW - 20 });
  if (client.company_name) doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8).text(client.company_name, toX + 10, y + 32, { width: cardW - 20 });
  if (client.address) doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(client.address, toX + 10, y + 42, { width: cardW - 20 });
  if (client.tax_id) doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7.5).text('GSTIN: ' + client.tax_id, toX + 10, y + 55, { width: cardW - 20 });

  y += 86;
  doc.rect(margin, y, cw, 22).fill(emerald);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
  doc.text('#', margin + 6, y + 7, { width: 20 });
  doc.text('Item Description', margin + 30, y + 7, { width: 220 });
  doc.text('Unit Price', margin + 255, y + 7, { width: 80, align: 'right' });
  doc.text('Qty', margin + 340, y + 7, { width: 45, align: 'center' });
  doc.text('Amount', margin + 390, y + 7, { width: 115, align: 'right' });
  y += 22;

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
    if (y + rowH > 620) { doc.addPage(); doc.rect(margin, 40, cw, 22).fill(emerald); doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8); doc.text('#', margin + 6, 47, { width: 20 }); doc.text('Item Description', margin + 30, 47, { width: 220 }); doc.text('Unit Price', margin + 255, 47, { width: 80, align: 'right' }); doc.text('Qty', margin + 340, 47, { width: 45, align: 'center' }); doc.text('Amount', margin + 390, 47, { width: 115, align: 'right' }); y = 62; }
    if (i % 2 === 1) doc.rect(margin, y, cw, rowH).fill(mint);
    const textY = y + 6;
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8).text(String(i + 1), margin + 6, textY, { width: 20 });
    doc.fillColor('#1f2937').font('Helvetica').fontSize(8).text(itemDesc, margin + 30, textY, { width: 220, lineGap: 1 });
    if (metaSubtitle) {
      const subY = textY + descH + 3;
      doc.fillColor(emerald).font('Helvetica-Bold').fontSize(6.8).text(metaSubtitle, margin + 30, subY, { width: 220, lineGap: 1 });
    }
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), margin + 255, textY, { width: 80, align: 'right' });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), margin + 340, textY, { width: 45, align: 'center' });
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), margin + 390, textY, { width: 115, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#d1fae5').lineWidth(0.8).moveTo(margin, y + rowH).lineTo(margin + cw, y + rowH).stroke();
    y += rowH;
  });

  y += 10;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal, items);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);
  const calcX = margin + 270; const calcW = cw - 270;
  const summaryStartY = y;

  doc.font('Helvetica-Oblique').fontSize(7.5);
  const wordsH = Math.max(48, Math.ceil(doc.heightOfString(words, { width: 240, lineGap: 1 }) + 22));
  doc.roundedRect(margin, summaryStartY, 255, wordsH, 4).fill(mint);
  doc.fillColor(emerald).font('Helvetica-Bold').fontSize(7.5).text('AMOUNT IN WORDS', margin + 8, summaryStartY + 6);
  doc.fillColor('#1f2937').font('Helvetica-Oblique').fontSize(7.5).text(words, margin + 8, summaryStartY + 18, { width: 240, lineGap: 1 });

  let calcY = summaryStartY;
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  doc.text('SUBTOTAL :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.subtotal, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14;
  if (taxInfo.discount > 0) { doc.fillColor('#4b5563').text('DISCOUNT :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#ef4444').text('-' + formatCurrency(taxInfo.discount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  if (taxInfo.hasCgstSgst) { doc.fillColor('#4b5563').text('CGST (' + taxInfo.cgstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; doc.fillColor('#4b5563').text('SGST (' + taxInfo.sgstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  else if (taxInfo.hasIgst) { doc.fillColor('#4b5563').text('IGST (' + taxInfo.igstRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  else if (taxInfo.hasFlatTax) { doc.fillColor('#4b5563').text('TAX (' + taxInfo.taxRate + '%) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  else if (taxInfo.hasItemTax) { doc.fillColor('#4b5563').text('GST TAX (ITEM-WISE) :', calcX, calcY, { width: calcW - 110, align: 'right' }); doc.fillColor('#111827').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' }); calcY += 14; }
  doc.roundedRect(calcX, calcY, calcW, 24, 4).fill(emerald);
  doc.fillColor('#fff').fontSize(9.5).font('Helvetica-Bold').text('TOTAL DUE :', calcX + 8, calcY + 7, { width: 100 });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, calcY + 7, { width: calcW - 108, align: 'right' });
  calcY += 24;

  y = Math.max(summaryStartY + wordsH + 10, calcY + 14, 440);
  doc.roundedRect(margin, y, cw, 20, 3).fill(mint);
  doc.fillColor(emerald).font('Helvetica-Bold').fontSize(8).text(invoice.thanks_message || organization.thanks_message || 'Thank you for your business!', margin, y + 6, { width: cw, align: 'center' });
  y += 28;

  const bCardW = (cw - 16) / 3; const bCardH = 105;
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill(mint);
  doc.fillColor(emerald).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS', margin + 8, y + 7);
  let bankY = y + 20; doc.fillColor('#374151').font('Helvetica').fontSize(7);
  if (organization.bank_name) { doc.font('Helvetica-Bold').text('Bank: ' + organization.bank_name, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_account_no) { doc.font('Helvetica').text('A/C: ' + organization.bank_account_no, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_ifsc) { doc.text('IFSC: ' + organization.bank_ifsc, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_upi_id) { doc.text('UPI: ' + organization.bank_upi_id, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.phone) { doc.font('Helvetica-Bold').text('Ph: ' + organization.phone, margin + 8, bankY, { width: bCardW - 16 }); }

  const termsX = margin + bCardW + 8;
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill(mint);
  doc.fillColor(emerald).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(6.8).text(invoice.terms_conditions || organization.terms_conditions || '1. Payment due within due date.\n2. Mention invoice no. in reference.', termsX + 8, y + 20, { width: bCardW - 16, lineGap: 1.5 });

  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill(mint);
  if (qrCodeUri) { try { doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [42, 42] }); doc.fillColor('#6b7280').font('Helvetica').fontSize(6).text('Scan to Pay', sigX + 4, y + 60, { width: 46, align: 'center' }); } catch (e) {} }
  const signX2 = qrCodeUri ? sigX + 54 : sigX + 8; const signW2 = qrCodeUri ? bCardW - 60 : bCardW - 16;
  doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(7).text('For ' + organization.name, signX2, y + 7, { width: signW2, align: 'center' });
  doc.strokeColor('#6ee7b7').lineWidth(0.8).moveTo(signX2, y + 72).lineTo(signX2 + signW2, y + 72).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', signX2, y + 76, { width: signW2, align: 'center' });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', signX2, y + 86, { width: signW2, align: 'center' });

  drawHMorixFooter(doc, margin, 782, cw, publicBillUrl);
}
