import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawOrangeAccentTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const contentWidth = 515;
  const orange = '#f97316';
  const darkCol = '#1a1a1a';

  // Accent geometry top-right
  doc.save();
  doc.rect(490, 0, 105, 75).fill(orange);
  doc.rect(550, 55, 45, 45).fill(orange);
  doc.restore();

  // Accent bottom-left
  doc.rect(0, 770, 30, 72).fill(orange);

  // Logo / company name top-left
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 24, { fit: [120, 44] });
    } catch (e) {
      doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(14).text(organization.name, margin, 28, { width: 200 });
    }
  } else {
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(14).text(organization.name, margin, 28, { width: 200 });
  }

  if (organization.address) {
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(organization.address, margin, 50, { width: 220 });
  }
  const orgGstin = organization.tax_id ? `GSTIN: ${organization.tax_id}` : '';
  const orgPh = organization.phone ? `Ph: ${organization.phone}` : '';
  if (orgGstin || orgPh) {
    doc.fillColor('#f97316').font('Helvetica-Bold').fontSize(7.5).text([orgPh, orgGstin].filter(Boolean).join(' | '), margin, 62, { width: 220 });
  }

  // INVOICE title right
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(26).text('TAX INVOICE', 260, 24, { align: 'right', width: 220 });
  drawStatusBadge(doc, 400, 56, invoice.status);

  // Meta bar
  doc.strokeColor('#fed7aa').lineWidth(1).moveTo(margin, 82).lineTo(margin + contentWidth, 82).stroke();
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8);
  doc.text(`INVOICE NO: ${invoice.invoice_number}`, margin, 90);
  doc.text(`DATE: ${new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin + 200, 90);
  doc.text(`DUE: ${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin + 370, 90);
  doc.strokeColor('#fed7aa').lineWidth(1).moveTo(margin, 104).lineTo(margin + contentWidth, 104).stroke();

  // Billed To card
  doc.roundedRect(margin, 114, contentWidth, 52, 3).fill('#fff7ed');
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(7.5).text('BILLED TO (BUYER DETAILS):', margin + 10, 122);
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(10).text(client.name, margin + 10, 134, { width: 280 });
  let tY = 148;
  const clientLines = [
    client.company_name || '',
    client.address || '',
    client.phone ? `Ph: ${client.phone}` : '',
    client.tax_id ? `GSTIN: ${client.tax_id}` : ''
  ].filter(Boolean).join(' • ');
  doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(clientLines, margin + 10, tY, { width: contentWidth - 20 });

  // Table
  let y = 176;
  doc.roundedRect(margin, y, contentWidth, 22, 3).fill(darkCol);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('#', margin + 8, y + 7, { width: 25 });
  doc.text('DESCRIPTION', margin + 35, y + 7, { width: 230 });
  doc.text('PRICE', margin + 270, y + 7, { width: 80, align: 'right' });
  doc.text('QTY', margin + 355, y + 7, { width: 40, align: 'center' });
  doc.text('TOTAL', margin + 400, y + 7, { width: 105, align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const itemDescOA = item.description || 'Item';
    const hsnOA = item.sku_hsn ? `HSN/SAC: ${item.sku_hsn}` : '';
    const taxOA = Number(item.tax_rate) > 0 ? `GST: ${item.tax_rate}%` : '';
    const metaOA = [hsnOA, taxOA].filter(Boolean).join(' • ');

    doc.font('Helvetica').fontSize(8);
    const descH = doc.heightOfString(itemDescOA, { width: 230, lineGap: 1 });
    let subH = 0;
    if (metaOA) {
      doc.font('Helvetica-Bold').fontSize(6.8);
      subH = doc.heightOfString(metaOA, { width: 230, lineGap: 1 });
    }
    const rH = Math.max(26, Math.ceil(descH + (metaOA ? subH + 4 : 0) + 14));
    if (y + rH > 600) { doc.addPage(); y = 40; }

    if (i % 2 === 1) doc.rect(margin, y, contentWidth, rH).fill('#fff7ed');
    const textY = y + 6;
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
    doc.text(String(i + 1), margin + 8, textY, { width: 25 });
    doc.fillColor(darkCol).font('Helvetica').fontSize(8);
    doc.text(itemDescOA, margin + 35, textY, { width: 230, lineGap: 1 });
    if (metaOA) {
      const subY = textY + descH + 3;
      doc.fillColor('#ea580c').font('Helvetica-Bold').fontSize(6.8).text(metaOA, margin + 35, subY, { width: 230, lineGap: 1 });
    }
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), margin + 270, textY, { width: 80, align: 'right' });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), margin + 355, textY, { width: 40, align: 'center' });
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), margin + 400, textY, { width: 105, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#fed7aa').lineWidth(0.5).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
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
  doc.roundedRect(margin, summaryStartY, 255, wordsH, 4).fill('#fff7ed');
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(7.5).text('AMOUNT IN WORDS', margin + 8, summaryStartY + 6);
  doc.fillColor(darkCol).font('Helvetica-Oblique').fontSize(7.2).text(words, margin + 8, summaryStartY + 18, { width: 240, lineGap: 1 });

  let calcY = summaryStartY;
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  doc.text('SUBTOTAL :', calcX, calcY, { width: calcW - 110, align: 'right' });
  doc.fillColor(darkCol).font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
  calcY += 14;

  if (taxInfo.discount > 0) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text('DISCOUNT :', calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor('#ef4444').text(`-${formatCurrency(taxInfo.discount, invoice.currency)}`, calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  }

  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`CGST (${taxInfo.cgstRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(darkCol).text(formatCurrency(taxInfo.cgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`SGST (${taxInfo.sgstRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(darkCol).text(formatCurrency(taxInfo.sgstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`IGST (${taxInfo.igstRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(darkCol).text(formatCurrency(taxInfo.igstAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`TAX (${taxInfo.taxRate}%) :`, calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(darkCol).text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  } else if (taxInfo.hasItemTax) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text('GST TAX (ITEM-WISE) :', calcX, calcY, { width: calcW - 110, align: 'right' });
    doc.fillColor(darkCol).text(formatCurrency(taxInfo.taxAmount, invoice.currency), calcX + calcW - 105, calcY, { width: 105, align: 'right' });
    calcY += 14;
  }

  doc.roundedRect(calcX, calcY, calcW, 24, 4).fill(orange);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('GRAND TOTAL :', calcX + 8, calcY + 7, { width: 100, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, calcY + 7, { width: calcW - 108, align: 'right' });
  calcY += 24;

  y = Math.max(summaryStartY + wordsH + 10, calcY + 14, 435);

  // Thanks banner
  const thanksMsg = invoice.thanks_message || organization.thanks_message || 'Thank you for your business!';
  doc.roundedRect(margin, y, contentWidth, 20, 3).fill('#ffedd5');
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(8).text(thanksMsg, margin, y + 6, { width: contentWidth, align: 'center' });

  y += 28;

  // 3 Bottom Cards
  const bCardW = (contentWidth - 16) / 3;
  const bCardH = 100;

  // Bank & Contact
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill('#fff7ed');
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS & CONTACT', margin + 8, y + 7);
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
  const termsText = invoice.terms_conditions || organization.terms_conditions || invoice.notes || 'Payment due within 30 days. Standard billing terms apply.';
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill('#fff7ed');
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(6.8).text(termsText, termsX + 8, y + 19, { width: bCardW - 16, lineGap: 1.5 });

  // Signature
  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill('#fff7ed');
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [40, 40] });
      doc.fillColor('#6b7280').font('Helvetica').fontSize(6).text('Scan to Pay / View', sigX + 4, y + 58, { width: 44, align: 'center' });
    } catch (e) {}
  }
  const sX = qrCodeUri ? sigX + 52 : sigX + 8;
  const sW = qrCodeUri ? bCardW - 58 : bCardW - 16;
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(7).text(`For ${organization.name}`, sX, y + 7, { width: sW, align: 'center' });
  doc.strokeColor('#fed7aa').lineWidth(0.8).moveTo(sX, y + 68).lineTo(sX + sW, y + 68).stroke();
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', sX, y + 72, { width: sW, align: 'center' });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', sX, y + 82, { width: sW, align: 'center' });

  // Footer
  drawHMorixFooter(doc, margin, 782, contentWidth, publicBillUrl);
}
