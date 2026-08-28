import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawTealCorporateTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const contentWidth = 515;
  const teal = '#00897b';
  const dark = '#1a1a2e';

  // Dual-tone header banner
  doc.rect(0, 0, 220, 90).fill(dark);
  doc.rect(220, 0, 375, 90).fill(teal);

  if (logoUri) {
    try {
      doc.image(logoUri, 15, 12, { fit: [110, 38] });
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(organization.name, 15, 54, { width: 190 });
    } catch (e) {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text(organization.name, 15, 30, { width: 190 });
    }
  } else {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13).text(organization.name, 15, 30, { width: 190 });
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text('Corporate Dispatch', 15, 48, { width: 190 });
  }

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26).text('TAX INVOICE', 235, 16, { width: 330 });
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8);
  doc.text(`Invoice No:  #${invoice.invoice_number}`, 235, 50, { width: 330 });
  doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 235, 62, { width: 330 });
  doc.text(`Due Date:   ${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 235, 74, { width: 330 });

  drawStatusBadge(doc, 485, 20, invoice.status);

  // Billed From & Billed To cards
  const cardW = 250;
  const cardH = 75;

  doc.roundedRect(margin, 102, cardW, cardH, 4).fill('#f0fdfa');
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('ISSUED BY (SELLER)', margin + 8, 108);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text(organization.name, margin + 8, 119, { width: cardW - 16 });
  let fY = 130;
  if (organization.address) { doc.fillColor('#4b5563').font('Helvetica').fontSize(7.2).text(organization.address, margin + 8, fY, { width: cardW - 16 }); fY += 9; }
  const orgGstin = organization.tax_id ? `GSTIN: ${organization.tax_id}` : '';
  const orgPh = organization.phone ? `Ph: ${organization.phone}` : '';
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(7.2).text([orgPh, orgGstin].filter(Boolean).join(' | '), margin + 8, Math.min(fY, 166), { width: cardW - 16 });

  const toX = margin + contentWidth - cardW;
  doc.roundedRect(toX, 102, cardW, cardH, 4).fill('#f0fdfa');
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('BILLED TO (BUYER)', toX + 8, 108);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text(client.name, toX + 8, 119, { width: cardW - 16 });
  let tY = 130;
  if (client.company_name) { doc.fillColor('#374151').font('Helvetica-Bold').fontSize(7.5).text(client.company_name, toX + 8, tY, { width: cardW - 16 }); tY += 9; }
  if (client.address) { doc.fillColor('#4b5563').font('Helvetica').fontSize(7.2).text(client.address, toX + 8, tY, { width: cardW - 16 }); tY += 9; }
  const clientGstin = client.tax_id ? `GSTIN: ${client.tax_id}` : '';
  const clientPh = client.phone ? `Ph: ${client.phone}` : '';
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(7.2).text([clientPh, clientGstin].filter(Boolean).join(' | '), toX + 8, Math.min(tY, 166), { width: cardW - 16 });

  // Table
  let y = 186;
  const cW = [25, contentWidth * 0.44, contentWidth * 0.18, contentWidth * 0.12, contentWidth * 0.26 - 25];
  const cX = [margin, margin + cW[0], margin + cW[0] + cW[1], margin + cW[0] + cW[1] + cW[2], margin + cW[0] + cW[1] + cW[2] + cW[3]];

  doc.roundedRect(margin, y, contentWidth, 22, 3).fill(teal);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('#', cX[0] + 6, y + 7, { width: cW[0] });
  doc.text('ITEM DESCRIPTION', cX[1], y + 7, { width: cW[1] });
  doc.text('PRICE', cX[2], y + 7, { width: cW[2], align: 'right' });
  doc.text('QTY.', cX[3], y + 7, { width: cW[3], align: 'center' });
  doc.text('TOTAL', cX[4], y + 7, { width: cW[4] - 6, align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const itemDescTC = item.description || 'Item';
    const hsnTC = item.sku_hsn ? `HSN/SAC: ${item.sku_hsn}` : '';
    const taxTC = Number(item.tax_rate) > 0 ? `GST: ${item.tax_rate}%` : '';
    const metaTC = [hsnTC, taxTC].filter(Boolean).join(' • ');

    doc.font('Helvetica').fontSize(8);
    const descH = doc.heightOfString(itemDescTC, { width: cW[1] - 8, lineGap: 1 });
    let subH = 0;
    if (metaTC) {
      doc.font('Helvetica-Bold').fontSize(6.8);
      subH = doc.heightOfString(metaTC, { width: cW[1] - 8, lineGap: 1 });
    }
    const rH = Math.max(26, Math.ceil(descH + (metaTC ? subH + 4 : 0) + 14));
    if (y + rH > 600) { doc.addPage(); y = 40; }

    if (i % 2 === 1) doc.rect(margin, y, contentWidth, rH).fill('#f0fdfa');
    const textY = y + 6;
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
    doc.text(String(i + 1).padStart(2, '0'), cX[0] + 6, textY, { width: cW[0] });
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
    doc.text(itemDescTC, cX[1], textY, { width: cW[1] - 8, lineGap: 1 });
    if (metaTC) {
      const subY = textY + descH + 3;
      doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(6.8).text(metaTC, cX[1], subY, { width: cW[1] - 8, lineGap: 1 });
    }
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), cX[2], textY, { width: cW[2], align: 'right' });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), cX[3], textY, { width: cW[3], align: 'center' });
    doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), cX[4], textY, { width: cW[4] - 6, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 10;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal, items);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);

  const calcX = margin + 270;
  const calcW = contentWidth - 270;
  const summaryStartY = y;

  // Words Box
  doc.font('Helvetica-Oblique').fontSize(7.2);
  const wordsH = Math.max(48, Math.ceil(doc.heightOfString(words, { width: 240, lineGap: 1 }) + 22));
  doc.roundedRect(margin, summaryStartY, 255, wordsH, 4).fill('#f0fdfa');
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(7.5).text('AMOUNT IN WORDS', margin + 8, summaryStartY + 6);
  doc.fillColor('#1a1a1a').font('Helvetica-Oblique').fontSize(7.2).text(words, margin + 8, summaryStartY + 18, { width: 240, lineGap: 1 });

  let calcY = summaryStartY;
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  doc.text('Subtotal:', calcX, calcY, { width: calcW - 110, align: 'right' });
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
  calcY += 14;

  if (taxInfo.discount > 0) {
    doc.fillColor('#4b5563').text('Discount:', calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#ef4444').text(`-${formatCurrency(taxInfo.discount, invoice.currency)}`, calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  }

  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#4b5563').text(`CGST (${taxInfo.cgstRate}%):`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#1a1a1a').text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
    doc.fillColor('#4b5563').text(`SGST (${taxInfo.sgstRate}%):`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#1a1a1a').text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#4b5563').text(`IGST (${taxInfo.igstRate}%):`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#1a1a1a').text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#4b5563').text(`Tax (${taxInfo.taxRate}%):`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#1a1a1a').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasItemTax) {
    doc.fillColor('#4b5563').text('GST TAX (ITEM-WISE):', calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#1a1a1a').text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  }

  doc.roundedRect(calcX, calcY, calcW, 24, 4).fill(teal);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('Total Due:', calcX + 8, calcY + 7, { width: 100, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, calcY + 7, { width: calcW - 108, align: 'right' });
  calcY += 24;

  y = Math.max(summaryStartY + wordsH + 10, calcY + 14, 435);

  // Thanks banner
  const thanksMsg = invoice.thanks_message || organization.thanks_message || 'Thank you for your business!';
  doc.roundedRect(margin, y, contentWidth, 20, 3).fill('#ccfbf1');
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text(thanksMsg, margin, y + 6, { width: contentWidth, align: 'center' });

  y += 28;

  // 3 Bottom Cards
  const bCardW = (contentWidth - 16) / 3;
  const bCardH = 100;

  // Bank & Contact
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill('#f0fdfa');
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS & CONTACT', margin + 8, y + 7);
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
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill('#f0fdfa');
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(6.8).text(termsText, termsX + 8, y + 19, { width: bCardW - 16, lineGap: 1.5 });

  // Signature
  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill('#f0fdfa');
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [40, 40] });
      doc.fillColor('#6b7280').font('Helvetica').fontSize(6).text('Scan to Pay / View', sigX + 4, y + 58, { width: 44, align: 'center' });
    } catch (e) {}
  }
  const sX = qrCodeUri ? sigX + 52 : sigX + 8;
  const sW = qrCodeUri ? bCardW - 58 : bCardW - 16;
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(7).text(`For ${organization.name}`, sX, y + 7, { width: sW, align: 'center' });
  doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(sX, y + 68).lineTo(sX + sW, y + 68).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', sX, y + 72, { width: sW, align: 'center' });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', sX, y + 82, { width: sW, align: 'center' });

  // Footer
  drawHMorixFooter(doc, margin, 782, contentWidth, publicBillUrl);
}
