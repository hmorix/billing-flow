import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawModernPurpleTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const margin = 40;
  const contentWidth = 515;
  const purple = '#4f46e5';
  const darkIndigo = '#1e1b4b';

  doc.font('Helvetica');

  let headerTextX = margin;
  let headerTextY = 38;

  if (logoUri) {
    try {
      doc.image(logoUri, margin, 36, { fit: [130, 44] });
      headerTextX = margin + 140;
      headerTextY = 38;
    } catch (e) {
      headerTextX = margin;
    }
  }

  // Business Name
  doc.font('Helvetica-Bold').fontSize(16);
  const orgNameH = doc.heightOfString(organization.name, { width: 220 });
  doc.fillColor(purple)
     .text(organization.name, headerTextX, headerTextY, { width: 220 });

  doc.fillColor('#6b7280')
     .font('Helvetica')
     .fontSize(8)
     .text('TAX INVOICE / OFFICIAL BILL', headerTextX, headerTextY + orgNameH + 3);

  // Status Stamp Badge & Invoice Info Right
  drawStatusBadge(doc, margin + contentWidth - 70, 36, invoice.status);

  doc.fillColor(darkIndigo)
     .font('Helvetica-Bold')
     .fontSize(22)
     .text('INVOICE', 320, 60, { align: 'right', width: 235 });

  doc.fillColor('#4b5563')
     .font('Helvetica')
     .fontSize(8.5)
     .text(`Invoice No: ${invoice.invoice_number}`, 320, 84, { align: 'right', width: 235 })
     .text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 320, 96, { align: 'right', width: 235 })
     .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 320, 108, { align: 'right', width: 235 });

  // Divider Line
  doc.strokeColor('#e5e7eb')
     .lineWidth(1)
     .moveTo(margin, 124)
     .lineTo(margin + contentWidth, 124)
     .stroke();

  // Dynamic Billed From / Billed To Cards
  const cardW = 250;
  doc.font('Helvetica-Bold').fontSize(9.5);
  const fromNameH = doc.heightOfString(organization.name, { width: cardW - 20 });
  doc.font('Helvetica').fontSize(7.5);
  const fromAddrH = organization.address ? doc.heightOfString(organization.address, { width: cardW - 20 }) : 0;
  const orgGstin = organization.tax_id ? `GSTIN / Tax ID: ${organization.tax_id}` : '';
  const orgContact = [organization.phone ? `Phone: ${organization.phone}` : '', orgGstin].filter(Boolean).join(' | ');
  const fromTotalH = 22 + fromNameH + (fromAddrH ? fromAddrH + 4 : 0) + (orgContact ? 14 : 0) + 10;

  doc.font('Helvetica-Bold').fontSize(9.5);
  const toNameH = doc.heightOfString(client.name, { width: cardW - 20 });
  const toCompH = client.company_name ? doc.heightOfString(client.company_name, { width: cardW - 20 }) : 0;
  doc.font('Helvetica').fontSize(7.5);
  const toAddrH = client.address ? doc.heightOfString(client.address, { width: cardW - 20 }) : 0;
  const clientGstin = client.tax_id ? `GSTIN: ${client.tax_id}` : '';
  const clientContact = [client.phone ? `Ph: ${client.phone}` : '', clientGstin].filter(Boolean).join(' | ');
  const toTotalH = 22 + toNameH + (toCompH ? toCompH + 3 : 0) + (toAddrH ? toAddrH + 4 : 0) + (clientContact ? 14 : 0) + 10;

  const cardH = Math.max(82, Math.max(fromTotalH, toTotalH));
  const cardStartY = 132;

  // Billed From Card
  doc.roundedRect(margin, cardStartY, cardW, cardH, 4).fill('#f8fafc');
  doc.fontSize(8).fillColor(purple).font('Helvetica-Bold').text('BILLED FROM (SELLER)', margin + 10, cardStartY + 8);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9.5).text(organization.name, margin + 10, cardStartY + 20, { width: cardW - 20 });
  let fromY = cardStartY + 20 + fromNameH + 3;
  if (organization.address) {
    doc.font('Helvetica').fontSize(7.5).fillColor('#4b5563').text(organization.address, margin + 10, fromY, { width: cardW - 20 });
    fromY += fromAddrH + 3;
  }
  if (orgContact) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#374151').text(orgContact, margin + 10, fromY, { width: cardW - 20 });
  }

  // Billed To Card
  const toX = margin + contentWidth - cardW;
  doc.roundedRect(toX, cardStartY, cardW, cardH, 4).fill('#f8fafc');
  doc.fontSize(8).fillColor(purple).font('Helvetica-Bold').text('BILLED TO (BUYER / CLIENT)', toX + 10, cardStartY + 8);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9.5).text(client.name, toX + 10, cardStartY + 20, { width: cardW - 20 });
  let toY = cardStartY + 20 + toNameH + 3;
  if (client.company_name) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151').text(client.company_name, toX + 10, toY, { width: cardW - 20 });
    toY += toCompH + 3;
  }
  if (client.address) {
    doc.font('Helvetica').fontSize(7.5).fillColor('#4b5563').text(client.address, toX + 10, toY, { width: cardW - 20 });
    toY += toAddrH + 3;
  }
  if (clientContact) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#374151').text(clientContact, toX + 10, toY, { width: cardW - 20 });
  }

  // Table
  let y = cardStartY + cardH + 12;

  const renderTableHeader = (headerY: number) => {
    doc.roundedRect(margin, headerY, contentWidth, 22, 3).fill(purple);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    doc.text('#', margin + 8, headerY + 6, { width: 20 });
    doc.text('Item Description', margin + 30, headerY + 6, { width: 220 });
    doc.text('Unit Price', margin + 255, headerY + 6, { width: 80, align: 'right' });
    doc.text('Qty', margin + 340, headerY + 6, { width: 45, align: 'center' });
    doc.text('Amount', margin + 390, headerY + 6, { width: 115, align: 'right' });
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

    if (i % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowH).fill('#f9fafb');
    }

    const textY = y + 6;
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(8).text(String(i + 1), margin + 8, textY, { width: 20 });
    doc.fillColor('#1f2937').font('Helvetica').fontSize(8).text(itemDesc, margin + 30, textY, { width: 220, lineGap: 1 });
    if (metaSubtitle) {
      const subY = textY + descH + 3;
      doc.fillColor(purple).font('Helvetica-Bold').fontSize(6.8).text(metaSubtitle, margin + 30, subY, { width: 220, lineGap: 1 });
    }

    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), margin + 255, textY, { width: 80, align: 'right' });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), margin + 340, textY, { width: 45, align: 'center' });
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), margin + 390, textY, { width: 115, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#f3f4f6').lineWidth(0.6).moveTo(margin, y + rowH).lineTo(margin + contentWidth, y + rowH).stroke();
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

  // Grand Total banner
  doc.roundedRect(calcX, calcY, calcW, 24, 4).fill(purple);
  doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold');
  doc.text('TOTAL DUE :', calcX + 8, calcY + 7, { width: 100, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), calcX + 100, calcY + 7, { width: calcW - 108, align: 'right' });
  calcY += 24;

  y = Math.max(summaryStartY + wordsH + 10, calcY + 14, 440);

  if (y + 140 > 765) {
    doc.addPage();
    y = 40;
  }

  // Thank You / Business Message Bar
  const thanksMsg = invoice.thanks_message || organization.thanks_message || 'Thank you for your business! We appreciate your trust.';
  doc.roundedRect(margin, y, contentWidth, 20, 3).fill('#ede9fe');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(8).text(thanksMsg, margin, y + 6, { width: contentWidth, align: 'center' });

  y += 28;

  // Bottom 3 Cards: Payment & Bank Contact | Terms & Conditions | Authorized Signatory
  const bCardW = (contentWidth - 16) / 3;
  const bCardH = 105;

  // Card 1: Bank & Contact for Payment
  doc.roundedRect(margin, y, bCardW, bCardH, 4).fill('#f8fafc');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS & CONTACT', margin + 8, y + 7);
  doc.fillColor('#374151').font('Helvetica').fontSize(7);
  let bankY = y + 20;
  if (organization.bank_name) {
    doc.font('Helvetica-Bold').text(`Bank: ${organization.bank_name}`, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10;
  }
  if (organization.bank_account_no) {
    doc.font('Helvetica').text(`A/C: ${organization.bank_account_no}`, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10;
  }
  if (organization.bank_ifsc) {
    doc.text(`IFSC/SWIFT: ${organization.bank_ifsc}`, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10;
  }
  if (organization.bank_upi_id) {
    doc.text(`UPI: ${organization.bank_upi_id}`, margin + 8, bankY, { width: bCardW - 16 }); bankY += 10;
  }
  const contactPhone = organization.contact_phone || organization.phone;
  if (contactPhone) {
    doc.font('Helvetica-Bold').text(`Contact: ${contactPhone}`, margin + 8, bankY, { width: bCardW - 16 });
  }

  // Card 2: Terms & Conditions
  const termsX = margin + bCardW + 8;
  const termsText = invoice.terms_conditions || organization.terms_conditions || invoice.notes || '1. Payment due within due date.\n2. Please mention invoice number in reference.\n3. Delayed payments subject to standard interest.';
  doc.roundedRect(termsX, y, bCardW, bCardH, 4).fill('#f8fafc');
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(7.5).text('TERMS & CONDITIONS', termsX + 8, y + 7);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(6.8).text(termsText, termsX + 8, y + 20, { width: bCardW - 16, lineGap: 1.5 });

  // Card 3: QR Code & Authorized Signatory
  const sigX = termsX + bCardW + 8;
  doc.roundedRect(sigX, y, bCardW, bCardH, 4).fill('#f8fafc');
  
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, sigX + 6, y + 16, { fit: [42, 42] });
      doc.fillColor('#6b7280').font('Helvetica').fontSize(6).text('Scan to Pay / View', sigX + 4, y + 60, { width: 46, align: 'center' });
    } catch (e) {}
  }

  const signTextX = qrCodeUri ? sigX + 54 : sigX + 8;
  const signTextW = qrCodeUri ? bCardW - 60 : bCardW - 16;
  doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(7).text(`For ${organization.name}`, signTextX, y + 7, { width: signTextW, align: 'center' });

  // Signature line
  doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(signTextX, y + 72).lineTo(signTextX + signTextW, y + 72).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7).text(organization.signatory_name || 'Authorized Signatory', signTextX, y + 76, { width: signTextW, align: 'center' });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(6.5).text(organization.signatory_designation || 'Signatory Authority', signTextX, y + 86, { width: signTextW, align: 'center' });

  // Footer: Powered by HMorix & Private Bill Link
  drawHMorixFooter(doc, margin, 782, contentWidth, publicBillUrl);
}
