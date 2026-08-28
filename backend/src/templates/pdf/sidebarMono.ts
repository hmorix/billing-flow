import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawSidebarMonoTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  const sideW = 180;
  const bodyX = sideW + 25;
  const bodyW = 595 - bodyX - 25;

  // Dark sidebar
  doc.rect(0, 0, sideW, 842).fill('#18181b');

  // QR Code top sidebar
  doc.roundedRect(15, 25, 150, 140, 4).fill('#27272a');
  doc.fillColor('#a1a1aa').font('Helvetica-Bold').fontSize(7.5).text('SCAN TO PAY / VIEW', 15, 33, { width: 150, align: 'center' });
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, 40, 48, { fit: [100, 100] });
    } catch (e) {}
  } else {
    doc.rect(40, 48, 100, 100).fill('#18181b');
    doc.fillColor('#71717a').font('Helvetica').fontSize(7).text('PAYMENT QR', 40, 92, { width: 100, align: 'center' });
  }

  // Sidebar info
  let sy = 180;
  doc.fillColor('#a1a1aa').font('Helvetica-Bold').fontSize(7).text('DATE :', 18, sy);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 18, sy + 11, { width: 145 });
  sy += 30;

  doc.fillColor('#a1a1aa').font('Helvetica-Bold').fontSize(7).text('DUE DATE :', 18, sy);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 18, sy + 11, { width: 145 });
  sy += 30;

  doc.strokeColor('#3f3f46').lineWidth(0.5).moveTo(18, sy).lineTo(162, sy).stroke();
  sy += 12;

  doc.fillColor('#a1a1aa').font('Helvetica-Bold').fontSize(7).text('BILLED TO (CLIENT)', 18, sy);
  sy += 11;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(client.name, 18, sy, { width: 145 });
  sy += 13;
  if (client.company_name) { doc.fillColor('#d4d4d8').font('Helvetica').fontSize(7.5).text(client.company_name, 18, sy, { width: 145 }); sy += 11; }
  if (client.address) { doc.fillColor('#a1a1aa').font('Helvetica').fontSize(7).text(client.address, 18, sy, { width: 145 }); sy += doc.heightOfString(client.address, { width: 145, fontSize: 7 }) + 2; }
  if (client.tax_id) { doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(7).text(`GSTIN: ${client.tax_id}`, 18, sy, { width: 145 }); sy += 12; }

  // Sidebar Bank Details
  sy = Math.max(sy + 8, 480);
  doc.roundedRect(15, sy, 150, 120, 4).fill('#27272a');
  doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS', 22, sy + 8, { width: 136 });
  doc.fillColor('#d4d4d8').font('Helvetica').fontSize(7);
  let bY = sy + 22;
  if (organization.bank_name) { doc.text(`Bank: ${organization.bank_name}`, 22, bY, { width: 136 }); bY += 10; }
  if (organization.bank_account_no) { doc.text(`A/C: ${organization.bank_account_no}`, 22, bY, { width: 136 }); bY += 10; }
  if (organization.bank_ifsc) { doc.text(`IFSC: ${organization.bank_ifsc}`, 22, bY, { width: 136 }); bY += 10; }
  if (organization.bank_upi_id) { doc.text(`UPI: ${organization.bank_upi_id}`, 22, bY, { width: 136 }); bY += 10; }
  const cPh = organization.contact_phone || organization.phone;
  if (cPh) { doc.fillColor('#38bdf8').font('Helvetica-Bold').text(`Pay Ph: ${cPh}`, 22, bY, { width: 136 }); }

  // Body: Logo / Company name top-right
  let nameX = bodyX;
  if (logoUri) {
    try {
      doc.image(logoUri, bodyX, 24, { fit: [100, 36] });
      nameX = bodyX + 110;
    } catch (e) {
      nameX = bodyX;
    }
  }

  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(14).text(organization.name, nameX, 26, { width: 250 });
  if (organization.address) {
    doc.fillColor('#71717a').font('Helvetica').fontSize(7.5).text(organization.address, nameX, 42, { width: 250 });
  }
  if (organization.tax_id) {
    doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(7.5).text(`Seller GSTIN: ${organization.tax_id}`, nameX, 54, { width: 250 });
  }

  drawStatusBadge(doc, 595 - 25 - 70, 24, invoice.status);

  // Large INVOICE word
  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(28).text('INVOICE', bodyX, 74, { width: bodyW });

  // Account / Invoice number info box
  doc.roundedRect(bodyX, 110, bodyW, 26, 3).fill('#f4f4f5');
  doc.fillColor('#71717a').font('Helvetica').fontSize(7.5);
  doc.text('Invoice No:', bodyX + 8, 117);
  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(8.5);
  doc.text(`#${invoice.invoice_number}`, bodyX + 60, 116);

  // Table
  let y = 148;
  const col1 = bodyX;
  const col2 = col1 + 180;
  const col3 = col2 + 65;
  const col4 = col3 + 45;

  doc.roundedRect(col1, y, bodyW, 20, 3).fill('#18181b');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
  doc.text('Item Description', col1 + 8, y + 6, { width: 170 });
  doc.text('Rate', col2, y + 6, { width: 60, align: 'right' });
  doc.text('Qty', col3, y + 6, { width: 40, align: 'center' });
  doc.text('Amount', col4, y + 6, { width: bodyW - (col4 - col1) - 6, align: 'right' });
  y += 20;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const itemDescSM = item.description || 'Item';
    const hsnSM = item.sku_hsn ? `HSN/SAC: ${item.sku_hsn}` : '';
    const taxSM = Number(item.tax_rate) > 0 ? `GST: ${item.tax_rate}%` : '';
    const metaSM = [hsnSM, taxSM].filter(Boolean).join(' • ');

    doc.font('Helvetica').fontSize(8);
    const descH = doc.heightOfString(itemDescSM, { width: 170, lineGap: 1 });
    let subH = 0;
    if (metaSM) {
      doc.font('Helvetica-Bold').fontSize(6.8);
      subH = doc.heightOfString(metaSM, { width: 170, lineGap: 1 });
    }
    const rH = Math.max(26, Math.ceil(descH + (metaSM ? subH + 4 : 0) + 14));
    if (y + rH > 560) { doc.addPage(); doc.rect(0, 0, sideW, 842).fill('#18181b'); y = 40; }

    if (i % 2 === 1) doc.rect(col1, y, bodyW, rH).fill('#fafafa');
    const textY = y + 6;
    doc.fillColor('#27272a').font('Helvetica').fontSize(8);
    doc.text(itemDescSM, col1 + 8, textY, { width: 170, lineGap: 1 });
    if (metaSM) {
      const subY = textY + descH + 3;
      doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(6.8).text(metaSM, col1 + 8, subY, { width: 170, lineGap: 1 });
    }
    doc.fillColor('#27272a').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), col2, textY, { width: 60, align: 'right' });
    doc.fillColor('#27272a').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), col3, textY, { width: 40, align: 'center' });
    doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), col4, textY, { width: bodyW - (col4 - col1) - 6, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#e4e4e7').lineWidth(0.5).moveTo(col1, y + rH).lineTo(col1 + bodyW, y + rH).stroke();
    y += rH;
  });

  y += 10;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal, items);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);

  doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8);
  const rX = col3 - 40;
  const rW = bodyW - (rX - col1);
  doc.text('Subtotal :', rX, y, { width: 100, align: 'right' });
  doc.fillColor('#18181b').font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), rX + 105, y, { width: rW - 110, align: 'right' });
  y += 13;

  if (taxInfo.discount > 0) {
    doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8).text('Discount :', rX, y, { width: 100, align: 'right' });
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(`-${formatCurrency(taxInfo.discount, invoice.currency)}`, rX + 105, y, { width: rW - 110, align: 'right' });
    y += 13;
  }

  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8).text(`CGST (${taxInfo.cgstRate}%) :`, rX, y, { width: 100, align: 'right' });
    doc.fillColor('#18181b').font('Helvetica-Bold').text(formatCurrency(taxInfo.cgstAmount, invoice.currency), rX + 105, y, { width: rW - 110, align: 'right' });
    y += 13;
    doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8).text(`SGST (${taxInfo.sgstRate}%) :`, rX, y, { width: 100, align: 'right' });
    doc.fillColor('#18181b').font('Helvetica-Bold').text(formatCurrency(taxInfo.sgstAmount, invoice.currency), rX + 105, y, { width: rW - 110, align: 'right' });
    y += 13;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8).text(`IGST (${taxInfo.igstRate}%) :`, rX, y, { width: 100, align: 'right' });
    doc.fillColor('#18181b').font('Helvetica-Bold').text(formatCurrency(taxInfo.igstAmount, invoice.currency), rX + 105, y, { width: rW - 110, align: 'right' });
    y += 13;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8).text(`Tax (${taxInfo.taxRate}%) :`, rX, y, { width: 100, align: 'right' });
    doc.fillColor('#18181b').font('Helvetica-Bold').text(formatCurrency(taxInfo.taxAmount, invoice.currency), rX + 105, y, { width: rW - 110, align: 'right' });
    y += 13;
  } else if (taxInfo.hasItemTax) {
    doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8).text('GST Tax (Item-wise) :', rX, y, { width: 100, align: 'right' });
    doc.fillColor('#18181b').font('Helvetica-Bold').text(formatCurrency(taxInfo.taxAmount, invoice.currency), rX + 105, y, { width: rW - 110, align: 'right' });
    y += 13;
  }

  doc.roundedRect(rX, y, rW, 22, 3).fill('#18181b');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('Total Due :', rX + 8, y + 6, { width: 80, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), rX + 90, y + 6, { width: rW - 96, align: 'right' });

  y += 32;

  // Words Box
  doc.roundedRect(bodyX, y, bodyW, 30, 3).fill('#f4f4f5');
  doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(6.8).text('AMOUNT IN WORDS:', bodyX + 6, y + 5);
  doc.fillColor('#18181b').font('Helvetica-Oblique').fontSize(7).text(words, bodyX + 6, y + 15, { width: bodyW - 12 });
  y += 38;

  // Terms & Conditions
  const termsText = invoice.terms_conditions || organization.terms_conditions || invoice.notes || 'Payment due within 30 days. Standard commercial terms apply.';
  doc.roundedRect(bodyX, y, bodyW, 40, 3).fill('#f4f4f5');
  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(7).text('TERMS & CONDITIONS', bodyX + 6, y + 5);
  doc.fillColor('#71717a').font('Helvetica').fontSize(6.8).text(termsText, bodyX + 6, y + 15, { width: bodyW - 12 });
  y += 48;

  // Signatory
  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(7.5).text(`For ${organization.name}`, bodyX + 150, y, { width: bodyW - 150, align: 'right' });
  doc.strokeColor('#d4d4d8').lineWidth(0.8).moveTo(bodyX + 180, y + 40).lineTo(bodyX + bodyW, y + 40).stroke();
  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(7.5).text(organization.signatory_name || 'Authorized Signatory', bodyX + 150, y + 44, { width: bodyW - 150, align: 'right' });
  doc.fillColor('#71717a').font('Helvetica').fontSize(6.8).text(organization.signatory_designation || 'Signatory Authority', bodyX + 150, y + 54, { width: bodyW - 150, align: 'right' });

  // Footer
  drawHMorixFooter(doc, bodyX, 782, bodyW, publicBillUrl);
}
