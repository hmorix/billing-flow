import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawCleanPurpleProTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const contentWidth = 515;
  const purple = '#4338ca';

  let logoEndX = margin;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 34, { fit: [54, 54] });
      logoEndX = margin + 62;
    } catch (e) {}
  } else {
    doc.circle(margin + 20, 52, 18).fill(purple);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(13).text(organization.name.charAt(0), margin + 14, 46);
    logoEndX = margin + 46;
  }

  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(13).text(organization.name, logoEndX + 4, 36, { width: 200 });
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(13).text('.', logoEndX + 4 + doc.widthOfString(organization.name, { fontSize: 13 }), 36);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text('TAX INVOICE STATEMENT', logoEndX + 4, 52);

  drawStatusBadge(doc, margin + contentWidth - 70, 32, invoice.status);

  doc.fillColor(purple).font('Helvetica-Bold').fontSize(24).text('INVOICE', 320, 54, { align: 'right', width: 235 });
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
  doc.text(`Invoice No: ${invoice.invoice_number}`, 320, 82, { align: 'right', width: 235 });
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 320, 94, { align: 'right', width: 235 });
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 320, 106, { align: 'right', width: 235 });

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, 122).lineTo(margin + contentWidth, 122).stroke();

  // Dynamic Billed From & Billed To Cards
  const cardW = 250;
  doc.font('Helvetica-Bold').fontSize(9.5);
  const fromNameH = doc.heightOfString(organization.name, { width: cardW - 20 });
  doc.font('Helvetica').fontSize(7.5);
  const fromAddrH = organization.address ? doc.heightOfString(organization.address, { width: cardW - 20 }) : 0;
  const orgGstin = organization.tax_id ? `GSTIN: ${organization.tax_id}` : '';
  const orgPh = organization.phone ? `Ph: ${organization.phone}` : '';
  const orgContact = [orgPh, orgGstin].filter(Boolean).join(' | ');
  const fromTotalH = 22 + fromNameH + (fromAddrH ? fromAddrH + 4 : 0) + (orgContact ? 14 : 0) + 10;

  doc.font('Helvetica-Bold').fontSize(9.5);
  const toNameH = doc.heightOfString(client.name, { width: cardW - 20 });
  const toCompH = client.company_name ? doc.heightOfString(client.company_name, { width: cardW - 20 }) : 0;
  doc.font('Helvetica').fontSize(7.5);
  const toAddrH = client.address ? doc.heightOfString(client.address, { width: cardW - 20 }) : 0;
  const clientGstin = client.tax_id ? `GSTIN: ${client.tax_id}` : '';
  const clientPh = client.phone ? `Ph: ${client.phone}` : '';
  const clientContact = [clientPh, clientGstin].filter(Boolean).join(' | ');
  const toTotalH = 22 + toNameH + (toCompH ? toCompH + 3 : 0) + (toAddrH ? toAddrH + 4 : 0) + (clientContact ? 14 : 0) + 10;

  const cardH = Math.max(80, Math.max(fromTotalH, toTotalH));
  const cardStartY = 130;

  doc.roundedRect(margin, cardStartY, cardW, cardH, 4).fill('#faf5ff');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(8).text('ISSUED BY (SELLER)', margin + 10, cardStartY + 8);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9.5).text(organization.name, margin + 10, cardStartY + 20, { width: cardW - 20 });
  let fromY = cardStartY + 20 + fromNameH + 3;
  if (organization.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(organization.address, margin + 10, fromY, { width: cardW - 20 });
    fromY += fromAddrH + 3;
  }
  if (orgContact) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#374151').text(orgContact, margin + 10, fromY, { width: cardW - 20 });
  }

  const toX = margin + contentWidth - cardW;
  doc.roundedRect(toX, cardStartY, cardW, cardH, 4).fill('#faf5ff');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(8).text('BILLED TO (BUYER)', toX + 10, cardStartY + 8);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9.5).text(client.name, toX + 10, cardStartY + 20, { width: cardW - 20 });
  let toY = cardStartY + 20 + toNameH + 3;
  if (client.company_name) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151').text(client.company_name, toX + 10, toY, { width: cardW - 20 });
    toY += toCompH + 3;
  }
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(client.address, toX + 10, toY, { width: cardW - 20 });
    toY += toAddrH + 3;
  }
  if (clientContact) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#374151').text(clientContact, toX + 10, toY, { width: cardW - 20 });
  }

  // Table
  let y = cardStartY + cardH + 12;
  const cW = [25, contentWidth * 0.44, contentWidth * 0.18, contentWidth * 0.12, contentWidth * 0.26 - 25];
  const cX = [margin, margin + cW[0], margin + cW[0] + cW[1], margin + cW[0] + cW[1] + cW[2], margin + cW[0] + cW[1] + cW[2] + cW[3]];

  const renderTableHeader = (headerY: number) => {
    doc.roundedRect(margin, headerY, contentWidth, 22, 3).fill(purple);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    doc.text('#', cX[0] + 6, headerY + 7, { width: cW[0] });
    doc.text('Items Description', cX[1], headerY + 7, { width: cW[1] });
    doc.text('Unit Price', cX[2], headerY + 7, { width: cW[2], align: 'right' });
    doc.text('Qty', cX[3], headerY + 7, { width: cW[3], align: 'center' });
    doc.text('Total', cX[4], headerY + 7, { width: cW[4] - 6, align: 'right' });
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
    const descH = doc.heightOfString(itemDesc, { width: cW[1] - 8, lineGap: 1 });
    let subH = 0;
    if (metaSubtitle) {
      doc.font('Helvetica-Bold').fontSize(6.8);
      subH = doc.heightOfString(metaSubtitle, { width: cW[1] - 8, lineGap: 1 });
    }
    const rH = Math.max(26, Math.ceil(descH + (metaSubtitle ? subH + 4 : 0) + 14));
    if (y + rH > 620) {
      doc.addPage();
      y = renderTableHeader(40);
    }

    if (i % 2 === 1) doc.rect(margin, y, contentWidth, rH).fill('#faf5ff');
    const textY = y + 6;
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
    doc.text(String(i + 1), cX[0] + 6, textY, { width: cW[0] });
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
    doc.text(itemDesc, cX[1], textY, { width: cW[1] - 8, lineGap: 1 });
    if (metaSubtitle) {
      const subY = textY + descH + 3;
      doc.fillColor(purple).font('Helvetica-Bold').fontSize(6.8).text(metaSubtitle, cX[1], subY, { width: cW[1] - 8, lineGap: 1 });
    }

    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), cX[2], textY, { width: cW[2], align: 'right' });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), cX[3], textY, { width: cW[3], align: 'center' });
    doc.fillColor(purple).font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), cX[4], textY, { width: cW[4] - 6, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#f3f4f6').lineWidth(0.6).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
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

  const calcX = margin + 270;
  const calcW = contentWidth - 270;
  const summaryStartY = y;

  // Words Box
  doc.roundedRect(margin, summaryStartY, 255, wordsH, 4).fill('#faf5ff');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(7.5).text('AMOUNT IN WORDS', margin + 8, summaryStartY + 6);
  doc.fillColor('#1f2937').font('Helvetica-Oblique').fontSize(7.5).text(words, margin + 8, summaryStartY + 18, { width: 240, lineGap: 1 });

  let calcY = summaryStartY;
  doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8);
  doc.text('SUBTOTAL :', calcX, calcY, { width: calcW - 110, align: 'right' });
  doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
  calcY += 14;

  if (taxInfo.discount > 0) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text('DISCOUNT :', calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(`-${formatCurrency(taxInfo.discount, invoice.currency)}`, calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  }

  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`CGST (${taxInfo.cgstRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`SGST (${taxInfo.sgstRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`IGST (${taxInfo.igstRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`Tax (${taxInfo.taxRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasItemTax) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`GST TAX (ITEM-WISE) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  }

  doc.roundedRect(calcX, calcY, calcW, 24, 4).fill(purple);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('TOTAL DUE :', calcX + 8, calcY + 7, { width: 100, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, calcY + 7, { width: calcW - 108, align: 'right' });
  calcY += 24;

  y = Math.max(summaryStartY + wordsH + 10, calcY + 14, 440);

  if (y + 140 > 765) {
    doc.addPage();
    y = 40;
  }

  // Thanks banner
  const thanksMsg = invoice.thanks_message || organization.thanks_message || 'Thank you for your business! We appreciate your partnership.';
  doc.roundedRect(margin, y, contentWidth, 20, 3).fill('#ede9fe');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(8).text(thanksMsg, margin, y + 6, { width: contentWidth, align: 'center' });

  y += 28;

  // 3 Bottom Cards
  const bCardW = (contentWidth - 16) / 3;
  const bCardH = 105;

  // Bank Info & Contact
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill('#faf5ff');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS & CONTACT', margin + 8, y + 7);
  doc.fillColor('#374151').font('Helvetica').fontSize(7);
  let bY = y + 20;
  if (organization.bank_name) { doc.font('Helvetica-Bold').text(`Bank: ${organization.bank_name}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  if (organization.bank_account_no) { doc.font('Helvetica').text(`A/C: ${organization.bank_account_no}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  if (organization.bank_ifsc) { doc.text(`IFSC: ${organization.bank_ifsc}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  if (organization.bank_upi_id) { doc.text(`UPI: ${organization.bank_upi_id}`, margin + 8, bY, { width: bCardW - 16 }); bY += 10; }
  const cPhone = organization.contact_phone || organization.phone;
  if (cPhone) { doc.font('Helvetica-Bold').text(`Ph: ${cPhone}`, margin + 8, bY, { width: bCardW - 16 }); }

  // Terms
  const termsX = margin + bCardW + 8;
  const termsText = invoice.terms_conditions || organization.terms_conditions || invoice.notes || 'Payment due within 30 days. All transactions subject to standard terms.';
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill('#faf5ff');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(6.8).text(termsText, termsX + 8, y + 20, { width: bCardW - 16, lineGap: 1.5 });

  // Signature & QR
  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill('#faf5ff');
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [42, 42] });
      doc.fillColor('#6b7280').font('Helvetica').fontSize(6).text('Scan to Pay / View', sigX + 4, y + 60, { width: 46, align: 'center' });
    } catch (e) {}
  }
  const sX = qrCodeUri ? sigX + 54 : sigX + 8;
  const sW = qrCodeUri ? bCardW - 60 : bCardW - 16;
  doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(7).text(`For ${organization.name}`, sX, y + 7, { width: sW, align: 'center' });
  doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(sX, y + 72).lineTo(sX + sW, y + 72).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', sX, y + 76, { width: sW, align: 'center' });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', sX, y + 86, { width: sW, align: 'center' });

  drawHMorixFooter(doc, margin, 782, contentWidth, publicBillUrl);
}
