import { PdfTemplateParams, formatCurrency, drawStatusBadge } from './types';

export function drawModernPurpleTemplate(params: PdfTemplateParams) {
  const { doc, invoice, client, organization, items, logoUri } = params;
  const margin = 50;
  const contentWidth = 495;
  
  doc.font('Helvetica');

  let headerTextX = margin;
  let headerTextY = margin;

  if (logoUri) {
    try {
      doc.image(logoUri, margin, 40, { fit: [140, 42] });
      headerTextX = 200;
      headerTextY = 42;
    } catch (e) {
      headerTextX = margin;
    }
  }

  // Business Name
  doc.fillColor('#4f46e5')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text(organization.name, headerTextX, headerTextY, { width: 200 });

  doc.fillColor('#6b7280')
     .font('Helvetica')
     .fontSize(8)
     .text('OFFICIAL INVOICE STATEMENT', headerTextX, headerTextY + 22);

  // Status Stamp Badge & Invoice Info Right
  drawStatusBadge(doc, 470, 38, invoice.status);

  doc.fillColor('#1e1b4b')
     .font('Helvetica-Bold')
     .fontSize(20)
     .text('INVOICE', 350, 64, { align: 'right', width: 195 });

  doc.fillColor('#4b5563')
     .font('Helvetica')
     .fontSize(8.5)
     .text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 350, 88, { align: 'right', width: 195 })
     .text(`Invoice No: ${invoice.invoice_number}`, 350, 100, { align: 'right', width: 195 });

  // Divider Line
  doc.strokeColor('#e5e7eb')
     .lineWidth(1)
     .moveTo(margin, 120)
     .lineTo(margin + contentWidth, 120)
     .stroke();

  // Billed From Card
  doc.rect(margin, 132, 235, 72).fill('#f8fafc');
  doc.fontSize(8).fillColor('#6366f1').font('Helvetica-Bold').text('BILLED FROM', margin + 10, 140);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9.5).text(organization.name, margin + 10, 152, { width: 215 });
  
  let fromY = 166;
  if (organization.address) {
    doc.font('Helvetica').fontSize(8).fillColor('#4b5563').text(organization.address, margin + 10, fromY, { width: 215 });
    fromY += doc.heightOfString(organization.address, { width: 215 }) + 3;
  }
  if (organization.phone) {
    doc.font('Helvetica').fontSize(8).fillColor('#4b5563').text(`Phone: ${organization.phone}`, margin + 10, fromY, { width: 215 });
  }

  // Billed To Card
  const toX = 310;
  doc.rect(toX, 132, 235, 72).fill('#f8fafc');
  doc.fontSize(8).fillColor('#6366f1').font('Helvetica-Bold').text('BILLED TO', toX + 10, 140);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9.5).text(client.name, toX + 10, 152, { width: 215 });
  
  let toY = 166;
  if (client.company_name) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#374151').text(client.company_name, toX + 10, toY, { width: 215 });
    toY += 12;
  }
  if (client.address) {
    doc.font('Helvetica').fontSize(8).fillColor('#4b5563').text(client.address, toX + 10, toY, { width: 215 });
  }

  let y = 220;

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, contentWidth, 22).fill('#4f46e5');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('Item Description', margin + 12, headerY + 6, { width: 210 });
    doc.text('Unit Price', margin + 230, headerY + 6, { width: 85, align: 'right' });
    doc.text('Qty', margin + 325, headerY + 6, { width: 40, align: 'right' });
    doc.text('Total Amount', margin + 375, headerY + 6, { width: 110, align: 'right' });
    return headerY + 22;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Helvetica').fontSize(8.5);

  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description, { width: 210 });
    const rowHeight = Math.max(22, descHeight + 10);

    if (y + rowHeight > 710) {
      doc.addPage();
      y = renderTableHeader(40);
    }

    if (i % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowHeight).fill('#f5f3ff');
    }

    doc.fillColor('#1f2937');
    doc.text(item.description, margin + 12, y + 6, { width: 210 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 230, y + 6, { width: 85, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), margin + 325, y + 6, { width: 40, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 375, y + 6, { width: 110, align: 'right' });

    doc.strokeColor('#f3f4f6')
       .lineWidth(1)
       .moveTo(margin, y + rowHeight)
       .lineTo(margin + contentWidth, y + rowHeight)
       .stroke();

    y += rowHeight;
  });

  y += 15;

  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxedAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxedAmount;

  const labelX = margin + 230;
  const valX = margin + 375;

  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8.5);
  doc.text('SUBTOTAL :', labelX, y, { width: 135, align: 'right' });
  doc.fillColor('#1f2937').text(formatCurrency(subtotal, invoice.currency), valX, y, { width: 110, align: 'right' });
  y += 16;

  if (discount > 0) {
    doc.fillColor('#4b5563').text('DISCOUNT :', labelX, y, { width: 135, align: 'right' });
    doc.fillColor('#ef4444').text(`-${formatCurrency(discount, invoice.currency)}`, valX, y, { width: 110, align: 'right' });
    y += 16;
  }

  if (taxRate > 0) {
    doc.fillColor('#4b5563').text(`TAX (${taxRate}%) :`, labelX, y, { width: 135, align: 'right' });
    doc.fillColor('#1f2937').text(formatCurrency(taxedAmount, invoice.currency), valX, y, { width: 110, align: 'right' });
    y += 16;
  }

  doc.rect(labelX - 10, y, 275, 28).fill('#4f46e5');
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
  doc.text('TOTAL DUE :', labelX, y + 8, { width: 120, align: 'left' });
  doc.text(formatCurrency(total, invoice.currency), valX - 10, y + 8, { width: 120, align: 'right' });

  if (invoice.notes) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text('Note / Instructions:', margin, y - 35);
    doc.font('Helvetica').fillColor('#6b7280').text(invoice.notes, margin, y - 23, { width: 210, lineGap: 2 });
  }

  const footY = 690;
  doc.fillColor('#4f46e5').font('Helvetica-Bold').fontSize(11).text('Thank you for your Business', margin, footY - 35);

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, footY - 15).lineTo(margin + contentWidth, footY - 15).stroke();

  doc.fontSize(8);
  doc.fillColor('#1f2937').font('Helvetica-Bold').text('Questions?', margin, footY);
  doc.fillColor('#6b7280').font('Helvetica')
     .text(`Email: support@${organization.slug}.com`, margin, footY + 12)
     .text(`Call: ${organization.phone || 'N/A'}`, margin, footY + 22);

  doc.fillColor('#1f2937').font('Helvetica-Bold').text('Payment Info :', 210, footY);
  doc.fillColor('#6b7280').font('Helvetica')
     .text('Bank Account: 1234-5678-9012', 210, footY + 12)
     .text(`A/C Name: ${organization.name}`, 210, footY + 22);

  doc.fillColor('#1f2937').font('Helvetica-Bold').text('Terms & Conditions:', 370, footY);
  doc.fillColor('#6b7280').font('Helvetica')
     .text('Payment is due within 30 days of issue date. Thank you.', 370, footY + 12, { width: 175 });
}
