import {
  PdfTemplateParams,
  formatCurrency,
  drawStatusBadge,
  calculateTaxBreakdown,
  numberToWords,
  drawHMorixFooter
} from './types';

export function drawMinimalistDarkTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri, qrCodeUri, publicBillUrl } = params;
  
  // Left Dark Sidebar
  doc.rect(0, 0, 195, 842).fill('#0f172a');

  const marginL = 20;
  let logoY = 36;

  if (logoUri) {
    try {
      doc.image(logoUri, marginL, logoY, { fit: [155, 40] });
      logoY += 46;
    } catch (e) {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13).text(organization.name, marginL, logoY, { width: 155 });
      logoY += 24;
    }
  } else {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13).text(organization.name, marginL, logoY, { width: 155 });
    logoY += 24;
  }

  drawStatusBadge(doc, marginL, logoY, invoice.status);
  logoY += 28;

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7).text('ISSUE DATE', marginL, logoY);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.issue_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), marginL, logoY + 9);

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7).text('DUE DATE', marginL, logoY + 26);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), marginL, logoY + 35);

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7).text('BILLED TO (CLIENT)', marginL, logoY + 56);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(client.name, marginL, logoY + 67, { width: 155 });

  let clientAddY = logoY + 80;
  if (client.company_name) {
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(7.5).text(client.company_name, marginL, clientAddY, { width: 155 });
    clientAddY += 10;
  }
  if (client.address) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7).text(client.address, marginL, clientAddY, { width: 155 });
    clientAddY += doc.heightOfString(client.address, { width: 155, fontSize: 7 }) + 2;
  }
  if (client.tax_id) {
    doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(7).text(`GSTIN: ${client.tax_id}`, marginL, clientAddY, { width: 155 });
    clientAddY += 10;
  }

  // Sidebar Bank Details & Contact for Payment
  doc.rect(marginL - 5, 520, 165, 130).fill('#1e293b');
  doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(7.5).text('PAYMENT DETAILS', marginL + 5, 528, { width: 145 });
  doc.fillColor('#cbd5e1').font('Helvetica').fontSize(7);
  let sBankY = 542;
  if (organization.bank_name) { doc.text(`Bank: ${organization.bank_name}`, marginL + 5, sBankY, { width: 145 }); sBankY += 10; }
  if (organization.bank_account_no) { doc.text(`A/C: ${organization.bank_account_no}`, marginL + 5, sBankY, { width: 145 }); sBankY += 10; }
  if (organization.bank_ifsc) { doc.text(`IFSC: ${organization.bank_ifsc}`, marginL + 5, sBankY, { width: 145 }); sBankY += 10; }
  if (organization.bank_upi_id) { doc.text(`UPI: ${organization.bank_upi_id}`, marginL + 5, sBankY, { width: 145 }); sBankY += 10; }
  const cPh = organization.contact_phone || organization.phone;
  if (cPh) { doc.fillColor('#38bdf8').font('Helvetica-Bold').text(`Pay Ph: ${cPh}`, marginL + 5, sBankY, { width: 145 }); }

  // QR Code bottom sidebar
  doc.rect(marginL - 5, 660, 165, 140).fill('#1e293b');
  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7.5).text('SCAN TO PAY / VIEW', marginL + 5, 670, { width: 145, align: 'center' });
  if (qrCodeUri) {
    try {
      doc.image(qrCodeUri, marginL + 32, 686, { fit: [90, 90] });
    } catch (e) {}
  } else {
    doc.fillColor('#64748b').font('Helvetica').fontSize(7).text('PAYMENT QR', marginL + 25, 720, { width: 100, align: 'center' });
  }

  // Right Column (White Canvas)
  const rightX = 220;
  const contentWidth = 345;

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(24).text('INVOICE', rightX, 36);
  doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(`#${invoice.invoice_number}`, rightX, 62);
  if (organization.tax_id) {
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text(`Seller GSTIN: ${organization.tax_id}`, rightX, 74);
  }

  // Table
  let y = 130;
  doc.roundedRect(rightX, y, contentWidth, 20, 3).fill('#f1f5f9');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5);
  doc.text('Description', rightX + 6, y + 6, { width: 175 });
  doc.text('Price', rightX + 185, y + 6, { width: 50, align: 'right' });
  doc.text('Qty', rightX + 240, y + 6, { width: 30, align: 'center' });
  doc.text('Total', rightX + 275, y + 6, { width: 64, align: 'right' });
  y += 20;

  let subtotal = 0;
  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const itemDescMD = item.description || 'Item';
    const hsnMetaMD = item.sku_hsn ? `HSN/SAC: ${item.sku_hsn}` : '';
    const taxMetaMD = Number(item.tax_rate) > 0 ? `GST: ${item.tax_rate}%` : '';
    const metaMD = [hsnMetaMD, taxMetaMD].filter(Boolean).join(' • ');

    doc.font('Helvetica').fontSize(8);
    const descH = doc.heightOfString(itemDescMD, { width: 175, lineGap: 1 });
    let subH = 0;
    if (metaMD) {
      doc.font('Helvetica-Bold').fontSize(6.8);
      subH = doc.heightOfString(metaMD, { width: 175, lineGap: 1 });
    }
    const rH = Math.max(26, Math.ceil(descH + (metaMD ? subH + 4 : 0) + 14));
    if (y + rH > 560) { doc.addPage(); doc.rect(0, 0, 195, 842).fill('#0f172a'); y = 40; }

    const textY = y + 6;
    doc.fillColor('#334155').font('Helvetica').fontSize(8);
    doc.text(itemDescMD, rightX + 6, textY, { width: 175, lineGap: 1 });
    if (metaMD) {
      const subY = textY + descH + 3;
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(6.8).text(metaMD, rightX + 6, subY, { width: 175, lineGap: 1 });
    }
    doc.fillColor('#475569').font('Helvetica').fontSize(8).text(formatCurrency(item.unit_price, invoice.currency), rightX + 185, textY, { width: 50, align: 'right' });
    doc.fillColor('#475569').font('Helvetica').fontSize(8).text(Number(item.quantity).toFixed(0), rightX + 240, textY, { width: 30, align: 'center' });
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text(formatCurrency(itemTotal, invoice.currency), rightX + 275, textY, { width: 64, align: 'right' });
    doc.font('Helvetica').fontSize(8);
    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(rightX, y + rH).lineTo(rightX + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 10;
  const taxInfo = calculateTaxBreakdown(invoice, subtotal, items);
  const words = numberToWords(taxInfo.grandTotal, invoice.currency);

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8);
  doc.text('Subtotal:', rightX + 140, y, { width: 110, align: 'right' });
  doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), rightX + 255, y, { width: 84, align: 'right' });
  y += 13;

  if (taxInfo.discount > 0) {
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('Discount:', rightX + 140, y, { width: 110, align: 'right' });
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(`-${formatCurrency(taxInfo.discount, invoice.currency)}`, rightX + 255, y, { width: 84, align: 'right' });
    y += 13;
  }

  if (taxInfo.hasCgstSgst) {
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text(`CGST (${taxInfo.cgstRate}%):`, rightX + 140, y, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(taxInfo.cgstAmount, invoice.currency), rightX + 255, y, { width: 84, align: 'right' });
    y += 13;
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text(`SGST (${taxInfo.sgstRate}%):`, rightX + 140, y, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(taxInfo.sgstAmount, invoice.currency), rightX + 255, y, { width: 84, align: 'right' });
    y += 13;
  } else if (taxInfo.hasIgst) {
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text(`IGST (${taxInfo.igstRate}%):`, rightX + 140, y, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(taxInfo.igstAmount, invoice.currency), rightX + 255, y, { width: 84, align: 'right' });
    y += 13;
  } else if (taxInfo.hasFlatTax) {
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text(`Tax (${taxInfo.taxRate}%):`, rightX + 140, y, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(taxInfo.taxAmount, invoice.currency), rightX + 255, y, { width: 84, align: 'right' });
    y += 13;
  } else if (taxInfo.hasItemTax) {
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8).text('GST TAX (ITEM-WISE):', rightX + 140, y, { width: 110, align: 'right' });
    doc.fillColor('#0f172a').font('Helvetica-Bold').text(formatCurrency(taxInfo.taxAmount, invoice.currency), rightX + 255, y, { width: 84, align: 'right' });
    y += 13;
  }

  doc.roundedRect(rightX + 120, y - 2, contentWidth - 120, 22, 3).fill('#0f172a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('Total Due:', rightX + 130, y + 5, { width: 90, align: 'left' });
  doc.text(formatCurrency(taxInfo.grandTotal, invoice.currency), rightX + 225, y + 5, { width: contentWidth - 230, align: 'right' });

  y += 32;

  // Words Box
  doc.roundedRect(rightX, y, contentWidth, 30, 3).fill('#f8fafc');
  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(6.8).text('AMOUNT IN WORDS:', rightX + 6, y + 5);
  doc.fillColor('#0f172a').font('Helvetica-Oblique').fontSize(7).text(words, rightX + 6, y + 15, { width: contentWidth - 12 });
  y += 38;

  // Terms & Thanks
  const termsText = invoice.terms_conditions || organization.terms_conditions || invoice.notes || 'Payment due within 30 days. Standard terms apply.';
  doc.roundedRect(rightX, y, contentWidth, 42, 3).fill('#f8fafc');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7).text('TERMS & CONDITIONS', rightX + 6, y + 5);
  doc.fillColor('#64748b').font('Helvetica').fontSize(6.8).text(termsText, rightX + 6, y + 15, { width: contentWidth - 12 });
  y += 50;

  // Signatory
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5).text(`For ${organization.name}`, rightX + 150, y, { width: contentWidth - 150, align: 'right' });
  doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(rightX + 180, y + 42).lineTo(rightX + contentWidth, y + 42).stroke();
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7.5).text(organization.signatory_name || 'Authorized Signatory', rightX + 150, y + 46, { width: contentWidth - 150, align: 'right' });
  doc.fillColor('#64748b').font('Helvetica').fontSize(6.8).text(organization.signatory_designation || 'Signatory Authority', rightX + 150, y + 56, { width: contentWidth - 150, align: 'right' });

  // Footer
  drawHMorixFooter(doc, rightX, 782, contentWidth, publicBillUrl);
}
