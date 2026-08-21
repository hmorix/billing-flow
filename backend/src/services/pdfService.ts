import PDFDocument from 'pdfkit';

// Format currency helper with thousands separators
function formatCurrency(amount: number, currency: string = 'USD'): string {
  const num = Number(amount || 0);
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${currency} ${formatted}`;
}

// Draw Status Badge (PAID / UNPAID / OVERDUE / DRAFT)
function drawStatusBadge(doc: any, x: number, y: number, statusStr: string) {
  const status = (statusStr || 'DRAFT').toUpperCase();
  let bgColor = '#64748b';
  let label = status;

  if (status === 'PAID') {
    bgColor = '#059669';
  } else if (status === 'PENDING' || status === 'SENT' || status === 'UNPAID') {
    bgColor = '#d97706';
    label = 'UNPAID';
  } else if (status === 'OVERDUE') {
    bgColor = '#dc2626';
  }

  doc.save();
  doc.rect(x, y, 75, 20).fill(bgColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
  doc.text(label, x, y + 5, { width: 75, align: 'center' });
  doc.restore();
}

export async function generateInvoicePDF(invoiceId: string, organizationId: string, env: any): Promise<Buffer> {
  // Fetch invoice, client, items, organization from Cloudflare D1
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND organization_id = ?")
    .bind(invoiceId, organizationId)
    .first();
  if (!invoice) throw new Error('Invoice not found');

  const client = await env.DB.prepare("SELECT * FROM clients WHERE id = ? AND organization_id = ?")
    .bind(invoice.client_id, organizationId)
    .first();
  if (!client) throw new Error('Client not found');

  const organization = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?")
    .bind(organizationId)
    .first();
  if (!organization) throw new Error('Organization not found');

  const { results: items } = await env.DB.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
    .bind(invoiceId)
    .all();

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 0 }); // Custom margin control
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // --- Resolve Logo to Base64 Data URI ---
      let logoUri: string | null = null;
      if (organization.logo_url) {
        try {
          const logoKey = organization.logo_url.replace('/uploads/', '');
          const logoObject = await env.BUCKET.get(logoKey);
          if (logoObject) {
            const logoArrayBuffer = await logoObject.arrayBuffer();
            const logoBytes = new Uint8Array(logoArrayBuffer);
            let binary = '';
            for (let i = 0; i < logoBytes.byteLength; i++) {
              binary += String.fromCharCode(logoBytes[i]);
            }
            const base64 = btoa(binary);
            const ext = logoKey.split('.').pop()?.toLowerCase() ?? 'png';
            const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
            logoUri = `data:${mime};base64,${base64}`;
          }
        } catch (logoErr) {
          console.warn('Logo load failed, skipping logo embed:', logoErr);
        }
      }

      // Route drawing to selected template engine
      const template = organization.invoice_template || 'modern_purple';
      const isCustom = typeof template === 'string' && template.length === 36;

      if (isCustom) {
        const customTpl = await env.DB.prepare("SELECT * FROM custom_templates WHERE id = ? AND organization_id = ?")
          .bind(template, organizationId)
          .first();
        if (customTpl) {
          const config = JSON.parse(customTpl.config);
          drawCustomTemplate(doc, invoice, client, organization, items, logoUri, config);
        } else {
          drawModernPurpleTemplate(doc, invoice, client, organization, items, logoUri);
        }
      } else if (template === 'minimalist_dark') {
        drawMinimalistDarkTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'retro_bold') {
        drawRetroBoldTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'corporate_crimson') {
        drawCorporateCrimsonTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'emerald_clean') {
        drawEmeraldCleanTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'ocean_breeze') {
        drawOceanBreezeTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'monochrome_luxury') {
        drawMonochromeLuxuryTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'golden_elegance') {
        drawGoldenEleganceTemplate(doc, invoice, client, organization, items, logoUri);
      } else {
        drawModernPurpleTemplate(doc, invoice, client, organization, items, logoUri);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// =========================================================================
// 1. MODERN PURPLE TEMPLATE (Lavender Accents, Executive Indigo, Clean Grid)
// =========================================================================
function drawModernPurpleTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
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
     .text('HMORIX INVOICE DISPATCH', headerTextX, headerTextY + 22);

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

// =========================================================================
// 2. MINIMALIST DARK TEMPLATE (Dark Left Column, QR Code, Modern Clean Lines)
// =========================================================================
function drawMinimalistDarkTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  doc.rect(0, 0, 200, 842).fill('#0f172a');

  const marginL = 25;
  let logoY = 45;

  if (logoUri) {
    try {
      doc.image(logoUri, marginL, logoY, { fit: [150, 38] });
      logoY += 48;
    } catch (e) {
      logoY += 10;
    }
  }

  drawStatusBadge(doc, marginL, logoY, invoice.status);
  logoY += 32;

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7.5).text('ISSUE DATE', marginL, logoY);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(new Date(invoice.issue_date).toLocaleDateString(), marginL, logoY + 11);

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7.5).text('DUE DATE', marginL, logoY + 34);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(new Date(invoice.due_date).toLocaleDateString(), marginL, logoY + 45);

  doc.fillColor('#94a3b8').font('Helvetica-Bold').fontSize(7.5).text('BILLED TO', marginL, logoY + 75);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text(client.name, marginL, logoY + 88, { width: 155 });
  
  let clientAddY = logoY + 102;
  if (client.company_name) {
    doc.fillColor('#cbd5e1').font('Helvetica').fontSize(8).text(client.company_name, marginL, clientAddY, { width: 155 });
    clientAddY += 12;
  }
  if (client.address) {
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text(client.address, marginL, clientAddY, { width: 155 });
  }

  doc.rect(marginL, 660, 56, 56).stroke('#475569');
  doc.fillColor('#475569').rect(marginL + 5, 665, 12, 12).fill();
  doc.rect(marginL + 39, 665, 12, 12).fill();
  doc.rect(marginL + 5, 699, 12, 12).fill();
  doc.rect(marginL + 22, 680, 14, 14).fill();
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(7).text('Scan to Pay Invoice', marginL, 724, { width: 150 });

  const rightX = 230;
  const rightWidth = 325;
  
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(16).text(organization.name, rightX, 45, { width: rightWidth });
  doc.fillColor('#475569').font('Helvetica').fontSize(8).text(organization.address || 'Company Headquarters', rightX, 65, { width: rightWidth });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(28).text('INVOICE', rightX, 95);
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(8.5).text('Payment Record & Billing Document', rightX, 128);

  doc.rect(rightX, 150, rightWidth, 38).fill('#f1f5f9');
  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('INVOICE NUMBER:', rightX + 12, 158);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(invoice.invoice_number, rightX + 12, 169);

  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('CURRENCY:', rightX + 180, 158);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(invoice.currency, rightX + 180, 169);

  let y = 210;

  const renderTableHeader = (headerY: number) => {
    doc.rect(rightX, headerY, rightWidth, 20).fill('#0f172a');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    doc.text('Item Description', rightX + 10, headerY + 6, { width: 140 });
    doc.text('Rate', rightX + 155, headerY + 6, { width: 55, align: 'right' });
    doc.text('Qty', rightX + 215, headerY + 6, { width: 30, align: 'right' });
    doc.text('Subtotal', rightX + 250, headerY + 6, { width: 68, align: 'right' });
    return headerY + 20;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Helvetica').fontSize(8);

  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description, { width: 140 });
    const rowHeight = Math.max(22, descHeight + 8);

    if (y + rowHeight > 700) {
      doc.addPage();
      doc.rect(0, 0, 200, 842).fill('#0f172a');
      y = renderTableHeader(40);
    }

    doc.fillColor('#0f172a');
    doc.text(item.description, rightX + 10, y + 6, { width: 140 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), rightX + 155, y + 6, { width: 55, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), rightX + 215, y + 6, { width: 30, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), rightX + 250, y + 6, { width: 68, align: 'right' });

    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(rightX, y + rowHeight).lineTo(rightX + rightWidth, y + rowHeight).stroke();
    y += rowHeight;
  });

  y += 12;

  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxedAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxedAmount;

  doc.fillColor('#475569').font('Helvetica-Bold');
  doc.text('Subtotal:', rightX + 10, y);
  doc.fillColor('#0f172a').text(formatCurrency(subtotal, invoice.currency), rightX + 175, y, { align: 'right', width: 143 });
  y += 15;

  if (discount > 0) {
    doc.fillColor('#475569');
    doc.text('Discount:', rightX + 10, y);
    doc.fillColor('#dc2626').text(`-${formatCurrency(discount, invoice.currency)}`, rightX + 175, y, { align: 'right', width: 143 });
    y += 15;
  }

  if (taxRate > 0) {
    doc.fillColor('#475569');
    doc.text(`Tax (${taxRate}%):`, rightX + 10, y);
    doc.fillColor('#0f172a').text(formatCurrency(taxedAmount, invoice.currency), rightX + 175, y, { align: 'right', width: 143 });
    y += 15;
  }

  doc.strokeColor('#0f172a').lineWidth(1.5).moveTo(rightX, y).lineTo(rightX + rightWidth, y).stroke();
  y += 6;

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10.5).text('Total Due:', rightX + 10, y);
  doc.text(formatCurrency(total, invoice.currency), rightX + 175, y, { align: 'right', width: 143 });

  const footerY = 690;
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(rightX, footerY - 10).lineTo(rightX + rightWidth, footerY - 10).stroke();

  doc.fillColor('#64748b').font('Helvetica').fontSize(7.5)
     .text(invoice.notes || 'Thank you for your business. Payment terms: Net 30 days.', rightX, footerY, { width: 180, lineGap: 2 });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8).text('Support Email:', rightX + 190, footerY);
  doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(`support@${organization.slug}.com`, rightX + 190, footerY + 12);
}

// =========================================================================
// 3. RETRO BOLD TEMPLATE (Cream Background, Bold Crimson Red, Monospaced Courier)
// =========================================================================
function drawRetroBoldTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 40;
  const contentWidth = 515;

  doc.rect(0, 0, 595, 842).fill('#faf8f5');
  doc.font('Courier');

  let topY = margin;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, topY, { fit: [140, 40] });
      topY += 48;
    } catch (e) {
      topY += 10;
    }
  }

  doc.fillColor('#be123c')
     .font('Courier-Bold')
     .fontSize(32)
     .text('INVOICE', margin, topY);

  drawStatusBadge(doc, 200, topY + 6, invoice.status);

  doc.fillColor('#18181b')
     .font('Courier-Bold')
     .fontSize(14)
     .text(organization.name.toUpperCase(), 320, topY, { align: 'right', width: 235 });

  doc.font('Courier').fontSize(8).fillColor('#3f3f46')
     .text(organization.address ? organization.address.toUpperCase() : '', 320, topY + 18, { align: 'right', width: 235 })
     .text(`TEL: ${organization.phone || 'N/A'}`, 320, topY + 38, { align: 'right', width: 235 });

  topY += 60;

  doc.strokeColor('#18181b').lineWidth(1.5).moveTo(margin, topY).lineTo(margin + contentWidth, topY).stroke();
  topY += 10;

  doc.fontSize(8.5).fillColor('#18181b').font('Courier-Bold')
     .text(`INVOICE NO: #${invoice.invoice_number.replace('INV-', '')}`, margin, topY)
     .text(`DATE: ${new Date(invoice.issue_date).toLocaleDateString().toUpperCase()}`, margin + 180, topY)
     .text(`DUE DATE: ${new Date(invoice.due_date).toLocaleDateString().toUpperCase()}`, margin + 350, topY);

  topY += 24;
  doc.strokeColor('#18181b').lineWidth(1).moveTo(margin, topY).lineTo(margin + contentWidth, topY).stroke();
  topY += 14;

  doc.font('Courier-Bold').fontSize(9).text('BILL TO:', margin, topY);
  doc.font('Courier').text(client.name.toUpperCase(), margin, topY + 12, { width: 230 });
  let clientY = topY + 24;
  if (client.company_name) {
    doc.text(client.company_name.toUpperCase(), margin, clientY, { width: 230 });
    clientY += 12;
  }
  if (client.address) {
    doc.text(client.address.toUpperCase(), margin, clientY, { width: 230 });
    clientY += doc.heightOfString(client.address.toUpperCase(), { width: 230 }) + 4;
  }

  doc.font('Courier-Bold').fontSize(9).text('PAYMENT METHOD', 320, topY);
  doc.font('Courier').fontSize(8.5)
     .text('BANK: BORCELLE BANK', 320, topY + 12)
     .text(`ACCOUNT NAME: ${organization.name.toUpperCase()}`, 320, topY + 24, { width: 235 })
     .text('A/C NO: 123-456-7890', 320, topY + 36);

  let y = Math.max(clientY, topY + 54) + 15;
  doc.strokeColor('#18181b').lineWidth(1.5);

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, contentWidth, 20).stroke();
    doc.font('Courier-Bold').fontSize(8.5).fillColor('#18181b');
    doc.text('DESCRIPTION', margin + 8, headerY + 5, { width: 230 });
    doc.text('QTY', margin + 245, headerY + 5, { width: 35, align: 'center' });
    doc.text('PRICE', margin + 285, headerY + 5, { width: 90, align: 'right' });
    doc.text('SUBTOTAL', margin + 380, headerY + 5, { width: 125, align: 'right' });

    doc.moveTo(margin + 240, headerY).lineTo(margin + 240, headerY + 20).stroke();
    doc.moveTo(margin + 285, headerY).lineTo(margin + 285, headerY + 20).stroke();
    doc.moveTo(margin + 380, headerY).lineTo(margin + 380, headerY + 20).stroke();

    return headerY + 20;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Courier').fontSize(8.5);

  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description.toUpperCase(), { width: 230 });
    const rowHeight = Math.max(22, descHeight + 8);

    if (y + rowHeight > 700) {
      doc.addPage();
      doc.rect(0, 0, 595, 842).fill('#faf8f5');
      doc.fillColor('#18181b');
      y = renderTableHeader(40);
    }

    doc.rect(margin, y, contentWidth, rowHeight).stroke();
    doc.text(item.description.toUpperCase(), margin + 8, y + 6, { width: 230 });
    doc.text(Number(item.quantity).toFixed(0), margin + 245, y + 6, { width: 35, align: 'center' });
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 285, y + 6, { width: 90, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 380, y + 6, { width: 125, align: 'right' });

    doc.moveTo(margin + 240, y).lineTo(margin + 240, y + rowHeight).stroke();
    doc.moveTo(margin + 285, y).lineTo(margin + 285, y + rowHeight).stroke();
    doc.moveTo(margin + 380, y).lineTo(margin + 380, y + rowHeight).stroke();

    y += rowHeight;
  });

  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxedAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxedAmount;

  doc.rect(margin, y, contentWidth, 20).stroke();
  doc.font('Courier-Bold').text('SUBTOTAL', margin + 245, y + 5, { width: 130, align: 'right' });
  doc.text(formatCurrency(subtotal, invoice.currency), margin + 380, y + 5, { width: 125, align: 'right' });
  doc.moveTo(margin + 380, y).lineTo(margin + 380, y + 20).stroke();
  y += 20;

  if (discount > 0) {
    doc.rect(margin, y, contentWidth, 20).stroke();
    doc.font('Courier-Bold').text('DISCOUNT', margin + 245, y + 5, { width: 130, align: 'right' });
    doc.text(`-${formatCurrency(discount, invoice.currency)}`, margin + 380, y + 5, { width: 125, align: 'right' });
    doc.moveTo(margin + 380, y).lineTo(margin + 380, y + 20).stroke();
    y += 20;
  }

  if (taxRate > 0) {
    doc.rect(margin, y, contentWidth, 20).stroke();
    doc.font('Courier-Bold').text('TAX VAT', margin + 245, y + 5, { width: 130, align: 'right' });
    doc.text(formatCurrency(taxedAmount, invoice.currency), margin + 380, y + 5, { width: 125, align: 'right' });
    doc.moveTo(margin + 380, y).lineTo(margin + 380, y + 20).stroke();
    y += 20;
  }

  doc.rect(margin, y, contentWidth, 22).stroke();
  doc.font('Courier-Bold').fillColor('#be123c')
     .text('GRAND TOTAL', margin + 245, y + 6, { width: 130, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), margin + 380, y + 6, { width: 125, align: 'right' });
  doc.moveTo(margin + 380, y).lineTo(margin + 380, y + 22).stroke();

  y += 40;

  doc.font('Courier-Bold').fontSize(8.5).fillColor('#18181b').text('TERMS & CONDITIONS', margin, y);
  doc.font('Courier').fillColor('#3f3f46').fontSize(8)
     .text(invoice.notes || 'Payment due in full within 30 days of issue date.', margin, y + 14, { width: 260, lineGap: 2 });

  const sigX = 360;
  doc.strokeColor('#18181b').lineWidth(1).moveTo(sigX, y + 45).lineTo(margin + contentWidth, y + 45).stroke();
  doc.font('Times-Italic').fontSize(14).fillColor('#be123c').text(organization.name, sigX + 10, y + 26);
  
  doc.font('Courier-Bold').fontSize(8.5).fillColor('#18181b')
     .text(organization.name.toUpperCase(), sigX, y + 50)
     .text('AUTHORIZED SIGNATURE', sigX, y + 62);
}

// =========================================================================
// 4. CORPORATE CRIMSON TEMPLATE (Purchase Order Style, Executive Burgundy)
// =========================================================================
function drawCorporateCrimsonTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 40;
  const contentWidth = 515;

  doc.font('Helvetica');

  let headerTextX = margin;
  let headerTextY = 32;

  if (logoUri) {
    try {
      doc.image(logoUri, margin, 24, { fit: [140, 42] });
      headerTextX = 190;
      headerTextY = 30;
    } catch (e) {
      headerTextX = margin;
    }
  }

  doc.fillColor('#881337')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text(organization.name.toUpperCase(), headerTextX, headerTextY, { width: 200 });

  doc.fillColor('#4b5563')
     .font('Helvetica')
     .fontSize(8)
     .text('Official Invoice Document', headerTextX, headerTextY + 20);

  drawStatusBadge(doc, 480, 24, invoice.status);

  doc.fillColor('#881337').font('Helvetica-Bold').fontSize(10.5).text(new Date(invoice.issue_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), 380, 48, { align: 'right', width: 175 });
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text('Invoice Issue Date', 380, 60, { align: 'right', width: 175 });

  doc.rect(margin, 78, contentWidth, 28).fill('#881337');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text(`INVOICE / PO #${invoice.invoice_number.replace('INV-', '')}`, margin + 12, 86);

  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8.5).text('BILL TO', margin, 118);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9)
     .text(client.name, margin, 130, { width: 230 });

  let billY = 142;
  if (client.company_name) {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#374151').text(client.company_name, margin, billY, { width: 230 });
    billY += 12;
  }
  if (client.address) {
    doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563').text(client.address, margin, billY, { width: 230 });
    billY += doc.heightOfString(client.address, { width: 230 }) + 4;
  }

  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8.5).text('ISSUED BY', 300, 118);
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9)
     .text(organization.name, 300, 130, { width: 245 });

  let shipY = 142;
  if (organization.address) {
    doc.font('Helvetica').fontSize(8.5).fillColor('#4b5563').text(organization.address, 300, shipY, { width: 245 });
    shipY += doc.heightOfString(organization.address, { width: 245 }) + 4;
  }

  let termsY = Math.max(billY, shipY, 190) + 8;
  doc.rect(margin, termsY, contentWidth, 24).fill('#f8fafc');
  doc.fillColor('#881337').font('Helvetica-Bold').fontSize(7.5);
  doc.text('SHIPPING / TERMS', margin + 10, termsY + 4);
  doc.text('PAYMENT', margin + 200, termsY + 4);
  doc.text('CURRENCY', margin + 310, termsY + 4);
  doc.text('DUE DATE', margin + 410, termsY + 4);

  doc.fillColor('#111827').font('Helvetica').fontSize(8);
  doc.text('Standard Delivery', margin + 10, termsY + 13);
  doc.text('NET 30 Days', margin + 200, termsY + 13);
  doc.text(invoice.currency, margin + 310, termsY + 13);
  doc.text(new Date(invoice.due_date).toLocaleDateString(), margin + 410, termsY + 13);

  let y = termsY + 34;

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, contentWidth, 18).fill('#881337');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    doc.text('ITEM NO.', margin + 10, headerY + 5);
    doc.text('DESCRIPTION', margin + 75, headerY + 5, { width: 210 });
    doc.text('QTY', margin + 290, headerY + 5, { width: 35, align: 'right' });
    doc.text('UNIT PRICE', margin + 335, headerY + 5, { width: 80, align: 'right' });
    doc.text('TOTAL', margin + 425, headerY + 5, { width: 80, align: 'right' });

    return headerY + 18;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Helvetica').fontSize(8);

  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description, { width: 210 });
    const rowHeight = Math.max(20, descHeight + 8);

    if (y + rowHeight > 700) {
      doc.addPage();
      y = renderTableHeader(40);
    }

    if (i % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowHeight).fill('#fff1f2');
    }
    doc.fillColor('#111827');
    doc.text(`ITEM-${i + 1}`, margin + 10, y + 5);
    doc.text(item.description, margin + 75, y + 5, { width: 210 });
    doc.text(Number(item.quantity).toFixed(0), margin + 290, y + 5, { width: 35, align: 'right' });
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 335, y + 5, { width: 80, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 425, y + 5, { width: 80, align: 'right' });

    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).stroke();
    y += rowHeight;
  });

  y += 10;

  doc.rect(margin, y, 230, 65).stroke('#cbd5e1');
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text('Remarks / Notes:', margin + 10, y + 8);
  doc.font('Helvetica').fontSize(7.5).fillColor('#6b7280')
     .text(invoice.notes || 'Please include invoice number on your check or wire payment. Thank you.', margin + 10, y + 20, { width: 210 });

  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxedAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxedAmount;

  const rightColX = 300;
  const valColX = 425;

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#4b5563');
  doc.text('SUBTOTAL', rightColX, y, { width: 120, align: 'right' });
  doc.fillColor('#111827').text(formatCurrency(subtotal, invoice.currency), valColX, y, { width: 80, align: 'right' });
  y += 14;

  if (discount > 0) {
    doc.fillColor('#4b5563').text('DISCOUNT', rightColX, y, { width: 120, align: 'right' });
    doc.fillColor('#ef4444').text(`-${formatCurrency(discount, invoice.currency)}`, valColX, y, { width: 80, align: 'right' });
    y += 14;
  }

  if (taxRate > 0) {
    doc.fillColor('#4b5563').text(`TAX RATE (${taxRate}%)`, rightColX, y, { width: 120, align: 'right' });
    doc.fillColor('#111827').text(formatCurrency(taxedAmount, invoice.currency), valColX, y, { width: 80, align: 'right' });
    y += 14;
  }

  doc.rect(rightColX, y - 2, 215, 20).fill('#881337');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text('TOTAL DUE', rightColX + 10, y + 4);
  doc.text(formatCurrency(total, invoice.currency), valColX - 10, y + 4, { width: 100, align: 'right' });

  const sigY = 640;
  doc.fillColor('#881337').font('Helvetica-Bold').fontSize(13).text('THANK YOU FOR YOUR BUSINESS', margin, sigY);

  doc.strokeColor('#881337').lineWidth(1.5).moveTo(360, sigY + 28).lineTo(530, sigY + 28).stroke();
  doc.fillColor('#881337').font('Times-Italic').fontSize(12).text(organization.name, 380, sigY + 10);
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(7.5).text('AUTHORIZED SIGNATURE', 360, sigY + 34);

  doc.rect(0, 785, 595, 57).fill('#0f172a');
  
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 795, { fit: [80, 20] });
    } catch (e) {}
  }
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text(organization.name.toUpperCase(), logoUri ? margin + 90 : margin, 798);
  doc.fillColor('#cbd5e1').font('Helvetica').fontSize(7.5).text(organization.address || 'Company HQ', logoUri ? margin + 90 : margin, 810, { width: 180 });

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8).text('For questions concerning this document, please contact:', 320, 798);
  doc.fillColor('#cbd5e1').font('Helvetica').fontSize(7.5).text(`Email: support@${organization.slug}.com`, 320, 810);
}

// =========================================================================
// 5. EMERALD CLEAN TEMPLATE (Tech Startup Green & Mint Accents)
// =========================================================================
function drawEmeraldCleanTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 45;
  const contentWidth = 505;

  doc.font('Helvetica');

  // Top Emerald Accent Bar
  doc.rect(0, 0, 595, 8).fill('#059669');

  let topY = 35;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, topY, { fit: [140, 40] });
      topY += 45;
    } catch (e) {
      topY += 10;
    }
  }

  doc.fillColor('#059669').font('Helvetica-Bold').fontSize(18).text(organization.name, margin, topY, { width: 220 });
  doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(organization.address || 'Tech Center HQ', margin, topY + 20, { width: 220 });

  drawStatusBadge(doc, 475, 35, invoice.status);

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(22).text('INVOICE', 350, 60, { align: 'right', width: 200 });
  doc.fillColor('#64748b').font('Helvetica').fontSize(8.5)
     .text(`Invoice No: ${invoice.invoice_number}`, 350, 85, { align: 'right', width: 200 })
     .text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 350, 97, { align: 'right', width: 200 });

  let y = 135;
  doc.rect(margin, y, 240, 65).fill('#ecfdf5');
  doc.fillColor('#059669').font('Helvetica-Bold').fontSize(8).text('ISSUED BY', margin + 10, y + 8);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(organization.name, margin + 10, y + 20);
  doc.fillColor('#475569').font('Helvetica').fontSize(8).text(organization.address || '', margin + 10, y + 32, { width: 220 });

  doc.rect(310, y, 240, 65).fill('#ecfdf5');
  doc.fillColor('#059669').font('Helvetica-Bold').fontSize(8).text('PREPARED FOR', 320, y + 8);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9).text(client.name, 320, y + 20);
  doc.fillColor('#475569').font('Helvetica').fontSize(8).text(client.address || '', 320, y + 32, { width: 220 });

  y += 80;

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, contentWidth, 20).fill('#059669');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('Description', margin + 10, headerY + 5, { width: 220 });
    doc.text('Unit Rate', margin + 240, headerY + 5, { width: 80, align: 'right' });
    doc.text('Qty', margin + 330, headerY + 5, { width: 35, align: 'right' });
    doc.text('Amount', margin + 375, headerY + 5, { width: 120, align: 'right' });
    return headerY + 20;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Helvetica').fontSize(8.5);

  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description, { width: 220 });
    const rowHeight = Math.max(22, descHeight + 8);

    if (y + rowHeight > 700) {
      doc.addPage();
      doc.rect(0, 0, 595, 8).fill('#059669');
      y = renderTableHeader(40);
    }

    if (i % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowHeight).fill('#f0fdf4');
    }

    doc.fillColor('#0f172a');
    doc.text(item.description, margin + 10, y + 5, { width: 220 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 240, y + 5, { width: 80, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), margin + 330, y + 5, { width: 35, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 375, y + 5, { width: 120, align: 'right' });

    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).stroke();
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

  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Subtotal:', labelX, y, { width: 140, align: 'right' });
  doc.fillColor('#0f172a').text(formatCurrency(subtotal, invoice.currency), valX, y, { width: 120, align: 'right' });
  y += 15;

  if (discount > 0) {
    doc.fillColor('#475569').text('Discount:', labelX, y, { width: 140, align: 'right' });
    doc.fillColor('#dc2626').text(`-${formatCurrency(discount, invoice.currency)}`, valX, y, { width: 120, align: 'right' });
    y += 15;
  }

  if (taxRate > 0) {
    doc.fillColor('#475569').text(`Tax (${taxRate}%):`, labelX, y, { width: 140, align: 'right' });
    doc.fillColor('#0f172a').text(formatCurrency(taxedAmount, invoice.currency), valX, y, { width: 120, align: 'right' });
    y += 15;
  }

  doc.rect(labelX - 10, y, 285, 26).fill('#059669');
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
  doc.text('TOTAL DUE:', labelX, y + 7, { width: 120, align: 'left' });
  doc.text(formatCurrency(total, invoice.currency), valX - 10, y + 7, { width: 125, align: 'right' });

  const footerY = 700;
  doc.strokeColor('#059669').lineWidth(1).moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).stroke();
  doc.fillColor('#64748b').font('Helvetica').fontSize(8).text('Thank you for working with us! Powered by BillingFlow.', margin, footerY + 12, { align: 'center', width: contentWidth });
}

// =========================================================================
// 6. OCEAN BREEZE TEMPLATE (Cyan Azure Minimal & Corporate Lines)
// =========================================================================
function drawOceanBreezeTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 45;
  const contentWidth = 505;

  doc.font('Helvetica');

  let topY = 40;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, topY, { fit: [140, 40] });
      topY += 45;
    } catch (e) {
      topY += 10;
    }
  }

  doc.fillColor('#0284c7').font('Helvetica-Bold').fontSize(18).text(organization.name, margin, topY);
  doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(organization.address || 'Azure Tech HQ', margin, topY + 20);

  drawStatusBadge(doc, 475, 40, invoice.status);

  doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(22).text('INVOICE', 350, 65, { align: 'right', width: 200 });
  doc.fillColor('#64748b').font('Helvetica').fontSize(8.5)
     .text(`Invoice No: ${invoice.invoice_number}`, 350, 90, { align: 'right', width: 200 })
     .text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 350, 102, { align: 'right', width: 200 });

  doc.strokeColor('#0284c7').lineWidth(2).moveTo(margin, 125).lineTo(margin + contentWidth, 125).stroke();

  let y = 140;
  doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(8.5).text('CLIENT INFORMATION', margin, y);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(client.name, margin, y + 14);
  doc.fillColor('#475569').font('Helvetica').fontSize(8).text(client.address || '', margin, y + 26, { width: 220 });

  doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(8.5).text('PAYMENT DETAILS', 310, y);
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(organization.name, 310, y + 14);
  doc.fillColor('#475569').font('Helvetica').fontSize(8).text('Bank Account: 9876-5432-10', 310, y + 26);

  y += 65;

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, contentWidth, 20).fill('#0284c7');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('Item Description', margin + 10, headerY + 5, { width: 220 });
    doc.text('Price', margin + 240, headerY + 5, { width: 80, align: 'right' });
    doc.text('Qty', margin + 330, headerY + 5, { width: 35, align: 'right' });
    doc.text('Total', margin + 375, headerY + 5, { width: 120, align: 'right' });
    return headerY + 20;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Helvetica').fontSize(8.5);

  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description, { width: 220 });
    const rowHeight = Math.max(22, descHeight + 8);

    if (y + rowHeight > 700) {
      doc.addPage();
      y = renderTableHeader(40);
    }

    if (i % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowHeight).fill('#f0f9ff');
    }

    doc.fillColor('#0f172a');
    doc.text(item.description, margin + 10, y + 5, { width: 220 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 240, y + 5, { width: 80, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), margin + 330, y + 5, { width: 35, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 375, y + 5, { width: 120, align: 'right' });

    doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).stroke();
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

  doc.fillColor('#475569').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Subtotal:', labelX, y, { width: 140, align: 'right' });
  doc.fillColor('#0f172a').text(formatCurrency(subtotal, invoice.currency), valX, y, { width: 120, align: 'right' });
  y += 15;

  if (discount > 0) {
    doc.fillColor('#475569').text('Discount:', labelX, y, { width: 140, align: 'right' });
    doc.fillColor('#dc2626').text(`-${formatCurrency(discount, invoice.currency)}`, valX, y, { width: 120, align: 'right' });
    y += 15;
  }

  if (taxRate > 0) {
    doc.fillColor('#475569').text(`Tax (${taxRate}%):`, labelX, y, { width: 140, align: 'right' });
    doc.fillColor('#0f172a').text(formatCurrency(taxedAmount, invoice.currency), valX, y, { width: 120, align: 'right' });
    y += 15;
  }

  doc.rect(labelX - 10, y, 285, 26).fill('#0284c7');
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
  doc.text('AMOUNT DUE:', labelX, y + 7, { width: 120, align: 'left' });
  doc.text(formatCurrency(total, invoice.currency), valX - 10, y + 7, { width: 125, align: 'right' });

  const footerY = 700;
  doc.strokeColor('#0284c7').lineWidth(1).moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).stroke();
  doc.fillColor('#64748b').font('Helvetica').fontSize(8).text('Thank you for choosing Ocean Breeze billing services.', margin, footerY + 12, { align: 'center', width: contentWidth });
}

// =========================================================================
// 7. MONOCHROME LUXURY TEMPLATE (High Fashion Minimal Black & Gold Accent)
// =========================================================================
function drawMonochromeLuxuryTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 50;
  const contentWidth = 495;

  doc.font('Helvetica');

  let topY = 45;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, topY, { fit: [140, 40] });
      topY += 45;
    } catch (e) {
      topY += 10;
    }
  }

  doc.fillColor('#09090b').font('Helvetica-Bold').fontSize(20).text(organization.name.toUpperCase(), margin, topY);
  doc.fillColor('#71717a').font('Helvetica').fontSize(8).text('LUXURY ENTERPRISE', margin, topY + 22);

  drawStatusBadge(doc, 470, 45, invoice.status);

  doc.fillColor('#09090b').font('Helvetica-Bold').fontSize(24).text('INVOICE', 350, 70, { align: 'right', width: 195 });
  doc.fillColor('#71717a').font('Helvetica').fontSize(8)
     .text(`NO: ${invoice.invoice_number}`, 350, 96, { align: 'right', width: 195 })
     .text(`DATE: ${new Date(invoice.issue_date).toLocaleDateString()}`, 350, 108, { align: 'right', width: 195 });

  doc.strokeColor('#09090b').lineWidth(2).moveTo(margin, 130).lineTo(margin + contentWidth, 130).stroke();

  let y = 145;
  doc.fillColor('#09090b').font('Helvetica-Bold').fontSize(8).text('PREPARED FOR', margin, y);
  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(9.5).text(client.name.toUpperCase(), margin, y + 14);
  doc.fillColor('#71717a').font('Helvetica').fontSize(8).text(client.address || '', margin, y + 26, { width: 220 });

  doc.fillColor('#09090b').font('Helvetica-Bold').fontSize(8).text('ISSUED BY', 320, y);
  doc.fillColor('#18181b').font('Helvetica-Bold').fontSize(9.5).text(organization.name.toUpperCase(), 320, y + 14);
  doc.fillColor('#71717a').font('Helvetica').fontSize(8).text(organization.address || '', 320, y + 26, { width: 220 });

  y += 65;

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, contentWidth, 20).fill('#09090b');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    doc.text('DESCRIPTION', margin + 10, headerY + 5, { width: 220 });
    doc.text('PRICE', margin + 240, headerY + 5, { width: 80, align: 'right' });
    doc.text('QTY', margin + 330, headerY + 5, { width: 35, align: 'right' });
    doc.text('AMOUNT', margin + 375, headerY + 5, { width: 110, align: 'right' });
    return headerY + 20;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Helvetica').fontSize(8.5);

  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description.toUpperCase(), { width: 220 });
    const rowHeight = Math.max(22, descHeight + 8);

    if (y + rowHeight > 700) {
      doc.addPage();
      y = renderTableHeader(40);
    }

    doc.fillColor('#18181b');
    doc.text(item.description.toUpperCase(), margin + 10, y + 5, { width: 220 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 240, y + 5, { width: 80, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), margin + 330, y + 5, { width: 35, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 375, y + 5, { width: 110, align: 'right' });

    doc.strokeColor('#e4e4e7').lineWidth(0.5).moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).stroke();
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

  doc.fillColor('#71717a').font('Helvetica-Bold').fontSize(8);
  doc.text('SUBTOTAL:', labelX, y, { width: 135, align: 'right' });
  doc.fillColor('#09090b').text(formatCurrency(subtotal, invoice.currency), valX, y, { width: 110, align: 'right' });
  y += 15;

  if (discount > 0) {
    doc.fillColor('#71717a').text('DISCOUNT:', labelX, y, { width: 135, align: 'right' });
    doc.fillColor('#dc2626').text(`-${formatCurrency(discount, invoice.currency)}`, valX, y, { width: 110, align: 'right' });
    y += 15;
  }

  if (taxRate > 0) {
    doc.fillColor('#71717a').text(`TAX (${taxRate}%):`, labelX, y, { width: 135, align: 'right' });
    doc.fillColor('#09090b').text(formatCurrency(taxedAmount, invoice.currency), valX, y, { width: 110, align: 'right' });
    y += 15;
  }

  doc.rect(labelX - 10, y, 275, 26).fill('#09090b');
  doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold');
  doc.text('TOTAL DUE:', labelX, y + 7, { width: 120, align: 'left' });
  doc.text(formatCurrency(total, invoice.currency), valX - 10, y + 7, { width: 120, align: 'right' });

  const footerY = 700;
  doc.strokeColor('#09090b').lineWidth(1).moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).stroke();
  doc.fillColor('#71717a').font('Helvetica').fontSize(7.5).text('MONOCHROME LUXURY BILLING • CONFIDENTIAL', margin, footerY + 12, { align: 'center', width: contentWidth });
}

// =========================================================================
// 8. GOLDEN ELEGANCE TEMPLATE (Warm Amber & Ivory Luxury)
// =========================================================================
function drawGoldenEleganceTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 45;
  const contentWidth = 505;

  doc.rect(0, 0, 595, 842).fill('#fffbeb');
  doc.font('Helvetica');

  let topY = 40;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, topY, { fit: [140, 40] });
      topY += 45;
    } catch (e) {
      topY += 10;
    }
  }

  doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(18).text(organization.name, margin, topY);
  doc.fillColor('#78350f').font('Helvetica').fontSize(8).text(organization.address || 'Golden Estate HQ', margin, topY + 20);

  drawStatusBadge(doc, 475, 40, invoice.status);

  doc.fillColor('#78350f').font('Helvetica-Bold').fontSize(22).text('INVOICE', 350, 65, { align: 'right', width: 200 });
  doc.fillColor('#92400e').font('Helvetica').fontSize(8.5)
     .text(`Invoice No: ${invoice.invoice_number}`, 350, 90, { align: 'right', width: 200 })
     .text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 350, 102, { align: 'right', width: 200 });

  doc.strokeColor('#b45309').lineWidth(1.5).moveTo(margin, 125).lineTo(margin + contentWidth, 125).stroke();

  let y = 140;
  doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(8.5).text('BILLED TO:', margin, y);
  doc.fillColor('#451a03').font('Helvetica-Bold').fontSize(9.5).text(client.name, margin, y + 14);
  doc.fillColor('#78350f').font('Helvetica').fontSize(8).text(client.address || '', margin, y + 26, { width: 220 });

  doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(8.5).text('PAYMENT DETAILS:', 310, y);
  doc.fillColor('#451a03').font('Helvetica-Bold').fontSize(9.5).text(organization.name, 310, y + 14);
  doc.fillColor('#78350f').font('Helvetica').fontSize(8).text('Bank Account: 5544-3322-11', 310, y + 26);

  y += 65;

  const renderTableHeader = (headerY: number) => {
    doc.rect(margin, headerY, contentWidth, 20).fill('#b45309');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('Item Description', margin + 10, headerY + 5, { width: 220 });
    doc.text('Price', margin + 240, headerY + 5, { width: 80, align: 'right' });
    doc.text('Qty', margin + 330, headerY + 5, { width: 35, align: 'right' });
    doc.text('Total', margin + 375, headerY + 5, { width: 120, align: 'right' });
    return headerY + 20;
  };

  y = renderTableHeader(y);

  let subtotal = 0;
  doc.font('Helvetica').fontSize(8.5);

  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;

    const descHeight = doc.heightOfString(item.description, { width: 220 });
    const rowHeight = Math.max(22, descHeight + 8);

    if (y + rowHeight > 700) {
      doc.addPage();
      doc.rect(0, 0, 595, 842).fill('#fffbeb');
      y = renderTableHeader(40);
    }

    if (i % 2 === 1) {
      doc.rect(margin, y, contentWidth, rowHeight).fill('#fef3c7');
    }

    doc.fillColor('#451a03');
    doc.text(item.description, margin + 10, y + 5, { width: 220 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 240, y + 5, { width: 80, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), margin + 330, y + 5, { width: 35, align: 'right' });
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 375, y + 5, { width: 120, align: 'right' });

    doc.strokeColor('#fde68a').lineWidth(0.5).moveTo(margin, y + rowHeight).lineTo(margin + contentWidth, y + rowHeight).stroke();
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

  doc.fillColor('#78350f').font('Helvetica-Bold').fontSize(8.5);
  doc.text('Subtotal:', labelX, y, { width: 140, align: 'right' });
  doc.fillColor('#451a03').text(formatCurrency(subtotal, invoice.currency), valX, y, { width: 120, align: 'right' });
  y += 15;

  if (discount > 0) {
    doc.fillColor('#78350f').text('Discount:', labelX, y, { width: 140, align: 'right' });
    doc.fillColor('#dc2626').text(`-${formatCurrency(discount, invoice.currency)}`, valX, y, { width: 120, align: 'right' });
    y += 15;
  }

  if (taxRate > 0) {
    doc.fillColor('#78350f').text(`Tax (${taxRate}%):`, labelX, y, { width: 140, align: 'right' });
    doc.fillColor('#451a03').text(formatCurrency(taxedAmount, invoice.currency), valX, y, { width: 120, align: 'right' });
    y += 15;
  }

  doc.rect(labelX - 10, y, 285, 26).fill('#b45309');
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
  doc.text('TOTAL DUE:', labelX, y + 7, { width: 120, align: 'left' });
  doc.text(formatCurrency(total, invoice.currency), valX - 10, y + 7, { width: 125, align: 'right' });

  const footerY = 700;
  doc.strokeColor('#b45309').lineWidth(1).moveTo(margin, footerY).lineTo(margin + contentWidth, footerY).stroke();
  doc.fillColor('#78350f').font('Helvetica').fontSize(8).text('Thank you for choosing Golden Elegance.', margin, footerY + 12, { align: 'center', width: contentWidth });
}

// =========================================================================
// 9. DYNAMIC CUSTOM TEMPLATE RENDER ENGINE
// =========================================================================
function drawCustomTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null, config: any) {
  const pageWidth = 595;
  const pageHeight = 842;

  const marginLeft = config.marginLeft ?? 50;
  const marginRight = config.marginRight ?? 50;
  const marginTop = config.marginTop ?? 50;
  const marginBottom = config.marginBottom ?? 50;
  const innerWidth = pageWidth - marginLeft - marginRight;

  if (config.bgGradientEnabled && config.bgGradientStart && config.bgGradientEnd) {
    const grad = doc.linearGradient(0, 0, pageWidth, pageHeight);
    grad.stop(0, config.bgGradientStart);
    grad.stop(1, config.bgGradientEnd);
    doc.rect(0, 0, pageWidth, pageHeight).fill(grad);
  } else if (config.backgroundColor && config.backgroundColor !== '#ffffff') {
    doc.rect(0, 0, pageWidth, pageHeight).fill(config.backgroundColor);
  }

  const fontName = config.fontFamily || 'Helvetica';
  const fontBold = `${fontName}-Bold`;
  doc.font(fontName);

  const primaryColor = config.primaryColor || '#6366f1';
  const textColor = config.textColor || '#1f2937';
  const secondaryTextColor = '#4b5563';
  const mutedTextColor = '#9ca3af';

  let y = marginTop;

  const blocks = config.blocks || [];
  blocks.forEach((block: any) => {
    if (y > pageHeight - marginBottom - 40) return;

    switch (block.type) {
      case 'header': {
        const showLogo = block.showLogo !== false && logoUri !== null;
        let headerTextX = marginLeft;
        
        if (showLogo && logoUri) {
          try {
            doc.image(logoUri, marginLeft, y, { fit: [130, 35] });
            headerTextX = marginLeft + 145;
          } catch (e) {
            headerTextX = marginLeft;
          }
        }

        doc.fillColor(primaryColor)
           .font(fontBold)
           .fontSize(14)
           .text(organization.name.toUpperCase(), headerTextX, y + 2, { width: 180 });

        doc.fillColor(secondaryTextColor)
           .font(fontName)
           .fontSize(7.5)
           .text('Custom Invoice Document', headerTextX, y + 18);

        drawStatusBadge(doc, pageWidth - marginRight - 80, y, invoice.status);

        const rightWidth = 180;
        doc.fillColor(textColor)
           .font(fontBold)
           .fontSize(18)
           .text(block.title || 'INVOICE', pageWidth - marginRight - rightWidth, y + 24, { align: 'right', width: rightWidth });

        doc.fillColor(secondaryTextColor)
           .font(fontName)
           .fontSize(7.5)
           .text(`Invoice No: ${invoice.invoice_number}`, pageWidth - marginRight - rightWidth, y + 44, { align: 'right', width: rightWidth })
           .text(`Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, pageWidth - marginRight - rightWidth, y + 52, { align: 'right', width: rightWidth });

        y += 70;
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(marginLeft, y).lineTo(pageWidth - marginRight, y).stroke();
        y += 15;
        break;
      }

      case 'billing': {
        doc.fontSize(7.5).fillColor(mutedTextColor).font(fontBold).text('BILLED FROM:', marginLeft, y);
        doc.fillColor(textColor).font(fontBold).fontSize(8.5).text(organization.name, marginLeft, y + 10, { width: 210 });
        
        let fromY = y + 22;
        if (organization.address) {
          doc.font(fontName).fontSize(7.5).fillColor(secondaryTextColor).text(organization.address, marginLeft, fromY, { width: 210 });
          fromY += doc.heightOfString(organization.address, { width: 210 }) + 4;
        }
        if (organization.phone) {
          doc.font(fontName).fontSize(7.5).fillColor(secondaryTextColor).text(`Phone: ${organization.phone}`, marginLeft, fromY);
          fromY += 12;
        }

        const toX = marginLeft + 250;
        doc.fontSize(7.5).fillColor(mutedTextColor).font(fontBold).text('BILLED TO:', toX, y);
        doc.fillColor(textColor).font(fontBold).fontSize(8.5).text(client.name, toX, y + 10, { width: 210 });
        
        let toY = y + 22;
        if (client.company_name) {
          doc.font(fontName).fontSize(7.5).fillColor(secondaryTextColor).text(client.company_name, toX, toY);
          toY += 12;
        }
        if (client.address) {
          doc.font(fontName).fontSize(7.5).fillColor(secondaryTextColor).text(client.address, toX, toY, { width: 210 });
          toY += doc.heightOfString(client.address, { width: 210 }) + 4;
        }

        y = Math.max(fromY, toY, y + 55) + 12;
        break;
      }

      case 'table': {
        const headerBg = block.headerBg || primaryColor;
        const headerTextColor = block.headerTextColor || '#ffffff';

        doc.rect(marginLeft, y, innerWidth, 18).fill(headerBg);
        doc.fillColor(headerTextColor).font(fontBold).fontSize(8);
        doc.text('DESCRIPTION', marginLeft + 8, y + 5, { width: 230 });
        doc.text('QTY', marginLeft + 245, y + 5, { width: 35, align: 'right' });
        doc.text('UNIT PRICE', marginLeft + 285, y + 5, { width: 85, align: 'right' });
        doc.text('TOTAL', marginLeft + 375, y + 5, { width: innerWidth - 380, align: 'right' });

        y += 18;

        doc.font(fontName).fontSize(7.5).fillColor(textColor);
        items.forEach((item: any, i: number) => {
          const itemTotal = Number(item.quantity) * Number(item.unit_price);
          const descHeight = doc.heightOfString(item.description, { width: 230 });
          const rowHeight = Math.max(20, descHeight + 8);

          if (i % 2 === 1) {
            doc.rect(marginLeft, y, innerWidth, rowHeight).fill('#f9fafb');
          }
          doc.fillColor(textColor);
          doc.text(item.description, marginLeft + 8, y + 5, { width: 230 });
          doc.text(Number(item.quantity).toFixed(0), marginLeft + 245, y + 5, { width: 35, align: 'right' });
          doc.text(formatCurrency(item.unit_price, invoice.currency), marginLeft + 285, y + 5, { width: 85, align: 'right' });
          doc.text(formatCurrency(itemTotal, invoice.currency), marginLeft + 375, y + 5, { width: innerWidth - 380, align: 'right' });

          doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(marginLeft, y + rowHeight).lineTo(pageWidth - marginRight, y + rowHeight).stroke();
          y += rowHeight;
        });

        y += 12;
        break;
      }

      case 'totals': {
        const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);
        const discount = Number(invoice.discount || 0);
        const taxRate = Number(invoice.tax_rate || 0);
        const taxableAmount = Math.max(0, subtotal - discount);
        const taxedAmount = taxableAmount * (taxRate / 100);
        const total = taxableAmount + taxedAmount;

        const labelX = pageWidth - marginRight - 200;
        const valX = pageWidth - marginRight - 90;

        doc.font(fontName).fontSize(8).fillColor(secondaryTextColor);
        doc.text('Subtotal:', labelX, y, { width: 105, align: 'right' });
        doc.fillColor(textColor).text(formatCurrency(subtotal, invoice.currency), valX, y, { width: 90, align: 'right' });
        y += 13;

        if (discount > 0) {
          doc.fillColor(secondaryTextColor).text('Discount:', labelX, y, { width: 105, align: 'right' });
          doc.fillColor('#ef4444').text(`-${formatCurrency(discount, invoice.currency)}`, valX, y, { width: 90, align: 'right' });
          y += 13;
        }

        if (taxRate > 0) {
          doc.fillColor(secondaryTextColor).text(`Tax (${taxRate}%):`, labelX, y, { width: 105, align: 'right' });
          doc.fillColor(textColor).text(formatCurrency(taxedAmount, invoice.currency), valX, y, { width: 90, align: 'right' });
          y += 13;
        }

        doc.strokeColor(primaryColor).lineWidth(0.8).moveTo(labelX + 10, y).lineTo(pageWidth - marginRight, y).stroke();
        y += 4;

        doc.font(fontBold).fontSize(9.5).fillColor(primaryColor);
        doc.text('Total Due:', labelX, y, { width: 105, align: 'right' });
        doc.text(formatCurrency(total, invoice.currency), valX, y, { width: 90, align: 'right' });
        
        y += 22;
        break;
      }

      case 'notes': {
        if (invoice.notes) {
          doc.fillColor(secondaryTextColor).font(fontBold).fontSize(8).text(block.title || 'Notes / Terms:', marginLeft, y);
          doc.font(fontName).fontSize(7.5).fillColor(secondaryTextColor).text(invoice.notes, marginLeft, y + 10, { width: 250, lineGap: 1.5 });
          y += 40;
        }
        break;
      }

      case 'signature': {
        const sigWidth = 140;
        const sigX = pageWidth - marginRight - sigWidth;
        doc.strokeColor(textColor).lineWidth(0.8).moveTo(sigX, y + 26).lineTo(pageWidth - marginRight, y + 26).stroke();
        doc.font('Times-Italic').fontSize(12).fillColor(primaryColor).text(organization.name, sigX + 10, y + 10);
        doc.font(fontBold).fontSize(7.5).fillColor(textColor).text('AUTHORIZED SIGNATURE', sigX, y + 30);
        y += 48;
        break;
      }
    }
  });

  const elements = config.elements || [];
  elements.sort((a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0));
  elements.forEach((el: any) => {
    doc.save();

    if (el.type === 'shape') {
      const opacity = el.fillOpacity !== undefined ? el.fillOpacity : 0.2;
      doc.opacity(opacity);

      if (el.shapeType === 'circle') {
        const radius = Math.min(el.width, el.height) / 2;
        doc.circle(el.x + radius, el.y + radius, radius);
      } else {
        const r = el.borderRadius || 0;
        if (r > 0) {
          doc.roundedRect(el.x, el.y, el.width, el.height, r);
        } else {
          doc.rect(el.x, el.y, el.width, el.height);
        }
      }

      if (el.fillColor) {
        doc.fill(el.fillColor);
      }

      if (el.borderWidth && el.borderWidth > 0) {
        doc.opacity(1);
        doc.lineWidth(el.borderWidth).strokeColor(el.borderColor || primaryColor);
        if (el.shapeType === 'circle') {
          const radius = Math.min(el.width, el.height) / 2;
          doc.circle(el.x + radius, el.y + radius, radius).stroke();
        } else {
          const r = el.borderRadius || 0;
          if (r > 0) {
            doc.roundedRect(el.x, el.y, el.width, el.height, r).stroke();
          } else {
            doc.rect(el.x, el.y, el.width, el.height).stroke();
          }
        }
      }
    } else if (el.type === 'line') {
      doc.lineWidth(el.borderWidth || 1.5)
         .strokeColor(el.borderColor || primaryColor)
         .moveTo(el.x, el.y)
         .lineTo(el.x + el.width, el.y)
         .stroke();
    } else if (el.type === 'text') {
      let fontStyle = fontName;
      if (el.fontStyle === 'bold') fontStyle = fontBold;
      else if (el.fontStyle === 'italic') fontStyle = `${fontName}-Oblique`;
      else if (el.fontStyle === 'bold-italic') fontStyle = `${fontName}-BoldOblique`;

      if (fontName === 'Times-Roman') {
        if (el.fontStyle === 'bold') fontStyle = 'Times-Bold';
        else if (el.fontStyle === 'italic') fontStyle = 'Times-Italic';
        else if (el.fontStyle === 'bold-italic') fontStyle = 'Times-BoldItalic';
      } else if (fontName === 'Courier') {
        if (el.fontStyle === 'bold') fontStyle = 'Courier-Bold';
        else if (el.fontStyle === 'italic') fontStyle = 'Courier-Oblique';
        else if (el.fontStyle === 'bold-italic') fontStyle = 'Courier-BoldOblique';
      }

      const size = el.fontSize || 9;
      const txtColor = el.textColor || textColor;
      const pad = el.padding || 0;
      const align = el.alignment || 'left';
      const textOpts: any = {
        width: el.width - (pad * 2),
        align: align
      };

      if (el.textDecoration === 'underline') {
        textOpts.underline = true;
      }

      doc.font(fontStyle)
         .fontSize(size)
         .fillColor(txtColor)
         .text(el.content || '', el.x + pad, el.y + pad, textOpts);
    }

    doc.restore();
  });

  doc.font(fontName).fontSize(7.5).fillColor(mutedTextColor);
  doc.text(config.footerText || 'Thank you for your business! Generated via BillingFlow.', marginLeft, pageHeight - marginBottom + 10, { align: 'center', width: innerWidth });
}
