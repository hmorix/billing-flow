import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawRetroBoldTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const contentWidth = 515;
  const cream = '#faf8f5';
  const crimson = '#be123c';
  const ink = '#1c1c1c';

  doc.rect(0, 0, 595, 842).fill(cream);

  // Top border bars
  doc.rect(margin, 30, contentWidth, 4).fill(crimson);
  doc.rect(margin, 38, contentWidth, 1).fill(crimson);

  // Header
  let headerX = margin;
  if (logoUri) {
    try { doc.image(logoUri, margin, 50, { fit: [70, 40] }); headerX = margin + 80; } catch (e) {}
  }
  doc.fillColor(ink).font('Courier-Bold').fontSize(17).text(organization.name.toUpperCase(), headerX, 50, { width: 300 });
  doc.fillColor(crimson).font('Courier').fontSize(7.5).text(
    [organization.address, organization.phone, organization.email].filter(Boolean).join('  |  '),
    headerX, 72, { width: 300 }
  );

  drawStatusBadge(doc, margin + contentWidth - 70, 50, invoice.status);
  doc.fillColor(crimson).font('Courier-Bold').fontSize(28).text('INVOICE', margin + 310, 46, { width: 195, align: 'right' });
  doc.fillColor(ink).font('Courier').fontSize(8)
    .text('No: ' + invoice.invoice_number, margin + 310, 80, { width: 195, align: 'right' })
    .text('Date: ' + new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 310, 91, { width: 195, align: 'right' })
    .text('Due: ' + new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), margin + 310, 102, { width: 195, align: 'right' });

  doc.rect(margin, 114, contentWidth, 2).fill(crimson);
  doc.rect(margin, 118, contentWidth, 0.5).fill(crimson);

  doc.fillColor(crimson).font('Courier-Bold').fontSize(7.5).text('BILLED FROM:', margin, 128);
  doc.fillColor(ink).font('Courier-Bold').fontSize(9).text(organization.name, margin, 138, { width: 240 });
  if (organization.tax_id) doc.font('Courier').fontSize(7.5).text('GSTIN: ' + organization.tax_id, margin, 150, { width: 240 });

  doc.fillColor(crimson).font('Courier-Bold').fontSize(7.5).text('BILLED TO:', margin + 270, 128);
  doc.fillColor(ink).font('Courier-Bold').fontSize(9).text(client.name, margin + 270, 138, { width: 245 });
  if (client.company_name) doc.font('Courier').fontSize(8).text(client.company_name, margin + 270, 150, { width: 245 });
  if (client.address) doc.font('Courier').fontSize(7.5).fillColor('#4b5563').text(client.address, margin + 270, 160, { width: 245 });
  if (client.tax_id) doc.font('Courier-Bold').fontSize(7.5).fillColor(ink).text('GSTIN: ' + client.tax_id, margin + 270, 175, { width: 245 });

  doc.rect(margin, 192, contentWidth, 1.5).fill(crimson);

  // Table Header
  let y = 200;
  doc.rect(margin, y, contentWidth, 20).fill(crimson);
  doc.fillColor('#ffffff').font('Courier-Bold').fontSize(8);
  doc.text('#', margin + 4, y + 6, { width: 20 });
  doc.text('DESCRIPTION', margin + 28, y + 6, { width: 220 });
  doc.text('RATE', margin + 255, y + 6, { width: 75, align: 'right' });
  doc.text('QTY', margin + 337, y + 6, { width: 45, align: 'center' });
  doc.text('AMOUNT', margin + 390, y + 6, { width: 115, align: 'right' });
  y += 20;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rowH = Math.max(18, doc.heightOfString(item.description, { width: 220, fontSize: 8 }) + 6);

    if (y + rowH > 620) {
      doc.addPage();
      doc.rect(0, 0, 595, 842).fill(cream);
      doc.rect(margin, 40, contentWidth, 20).fill(crimson);
      doc.fillColor('#fff').font('Courier-Bold').fontSize(8);
      doc.text('#', margin + 4, 46, { width: 20 });
      doc.text('DESCRIPTION', margin + 28, 46, { width: 220 });
      doc.text('RATE', margin + 255, 46, { width: 75, align: 'right' });
      doc.text('QTY', margin + 337, 46, { width: 45, align: 'center' });
      doc.text('AMOUNT', margin + 390, 46, { width: 115, align: 'right' });
      y = 60;
    }

    if (i % 2 === 1) doc.rect(margin, y, contentWidth, rowH).fill('#f5ede8');
    doc.fillColor('#9ca3af').font('Courier').fontSize(7.5).text(String(i + 1), margin + 4, y + 4, { width: 20 });
    doc.fillColor(ink).text(item.description, margin + 28, y + 4, { width: 220 });
    doc.fillColor('#4b5563').text(formatCurrency(item.unit_price, invoice.currency), margin + 255, y + 4, { width: 75, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), margin + 337, y + 4, { width: 45, align: 'center' });
    doc.fillColor(ink).font('Courier-Bold').text(formatCurrency(itemTotal, invoice.currency), margin + 390, y + 4, { width: 115, align: 'right' });
    doc.font('Courier');
    doc.strokeColor('#d1b89e').lineWidth(0.5).moveTo(margin, y + rowH).lineTo(margin + contentWidth, y + rowH).stroke();
    y += rowH;
  });

  doc.rect(margin, y, contentWidth, 1.5).fill(crimson);
  y += 12;

  const taxInfo = calculateTaxBreakdown(invoice, subtotal);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);
  const calcX = margin + 270;
  const calcW = contentWidth - 270;

  doc.roundedRect(margin, y, 245, 50, 2).fill('#fffbf9');
  doc.fillColor(crimson).font('Courier-Bold').fontSize(7.5).text('IN WORDS', margin + 8, y + 6);
  doc.fillColor(ink).font('Courier-Oblique').fontSize(7.5).text(words, margin + 8, y + 18, { width: 230 });

  doc.fillColor('#4b5563').font('Courier-Bold').fontSize(8);
  doc.text('SUBTOTAL :', calcX, y, { width: calcW - 110, align: 'right' });
  doc.fillColor(ink).text(formatCurrency(taxInfo.subtotal, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 13;
  if (taxInfo.discount > 0) {
    doc.fillColor('#4b5563').text('DISCOUNT :', calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor('#dc2626').text('-' + formatCurrency(taxInfo.discount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 13;
  }
  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#4b5563').text('CGST (' + taxInfo.cgstRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(ink).text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 13;
    doc.fillColor('#4b5563').text('SGST (' + taxInfo.sgstRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(ink).text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 13;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#4b5563').text('IGST (' + taxInfo.igstRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(ink).text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 13;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#4b5563').text('TAX (' + taxInfo.taxRate + '%) :', calcX, y, { width: calcW - 110, align: 'right' });
    doc.fillColor(ink).text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, y, { width: 105, align: 'right' }); y += 13;
  }

  doc.rect(calcX, y, calcW, 22).fill(crimson);
  doc.fillColor('#fff').font('Courier-Bold').fontSize(9.5);
  doc.text('TOTAL DUE:', calcX + 8, y + 6, { width: 100 });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, y + 6, { width: calcW - 108, align: 'right' });
  y = Math.max(y + 35, 455);

  doc.rect(margin, y, contentWidth, 1.5).fill(crimson);
  y += 8;

  const bCardW = (contentWidth - 16) / 3;
  const bCardH = 100;

  doc.roundedRect(margin, y, bCardW, bCardH, 2).fill('#fffbf9');
  doc.fillColor(crimson).font('Courier-Bold').fontSize(7.5).text('PAYMENT DETAILS', margin + 8, y + 7);
  let bankY = y + 20; doc.fillColor(ink).font('Courier').fontSize(7);
  if (organization.bank_name) { doc.font('Courier-Bold').text('Bank: ' + organization.bank_name, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_account_no) { doc.font('Courier').text('A/C: ' + organization.bank_account_no, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_ifsc) { doc.text('IFSC: ' + organization.bank_ifsc, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.bank_upi_id) { doc.text('UPI: ' + organization.bank_upi_id, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10; }
  if (organization.phone) { doc.font('Courier-Bold').text('Ph: ' + organization.phone, margin + 8, bankY, { width: bCardW - 16 }); }

  const termsX = margin + bCardW + 8;
  const termsText = invoice.terms_conditions || organization.terms_conditions || '1. Payment due within due date.\n2. Mention invoice no. in reference.\n3. Late payments attract interest.';
  doc.roundedRect(termsX, y, bCardW, bCardH, 2).fill('#fffbf9');
  doc.fillColor(crimson).font('Courier-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Courier').fontSize(6.8).text(termsText, termsX + 8, y + 20, { width: bCardW - 16, lineGap: 1.5 });

  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 2).fill('#fffbf9');
  if (qrCodeUri) { try { doc.image(qrCodeUri, sigX + 6, y + 14, { fit: [42, 42] }); doc.fillColor('#6b7280').font('Courier').fontSize(6).text('Scan to Pay', sigX + 4, y + 58, { width: 46, align: 'center' }); } catch (e) {} }
  const signX2 = qrCodeUri ? sigX + 54 : sigX + 8;
  const signW2 = qrCodeUri ? bCardW - 60 : bCardW - 16;
  doc.fillColor(ink).font('Courier-Bold').fontSize(7).text('For ' + organization.name, signX2, y + 7, { width: signW2, align: 'center' });
  doc.strokeColor(crimson).lineWidth(0.8).moveTo(signX2, y + 72).lineTo(signX2 + signW2, y + 72).stroke();
  doc.fillColor(ink).font('Courier-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', signX2, y + 76, { width: signW2, align: 'center' });
  doc.fillColor('#6b7280').font('Courier').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', signX2, y + 86, { width: signW2, align: 'center' });

  doc.rect(margin, y + bCardH + 6, contentWidth, 3).fill(crimson);
  drawHMorixFooter(doc, margin, 782, contentWidth, publicBillUrl);
}
