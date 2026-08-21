import PDFDocument from 'pdfkit';

async function resolveLogoUri(logoUrl: string | null | undefined, env: any): Promise<string | null> {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('data:image/')) return logoUrl;

  try {
    let key = logoUrl;
    if (logoUrl.includes('/billingflow-logos/')) {
      key = logoUrl.split('/billingflow-logos/').pop() || logoUrl;
    } else if (logoUrl.startsWith('/uploads/')) {
      key = logoUrl.replace('/uploads/', '');
    }

    if (env?.BUCKET?.get) {
      try {
        const logoObject = await env.BUCKET.get(key);
        if (logoObject) {
          const logoArrayBuffer = await logoObject.arrayBuffer();
          const logoBytes = new Uint8Array(logoArrayBuffer);
          let binary = '';
          for (let i = 0; i < logoBytes.byteLength; i++) {
            binary += String.fromCharCode(logoBytes[i]);
          }
          const base64 = btoa(binary);
          const ext = key.split('.').pop()?.toLowerCase() ?? 'png';
          const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
          return `data:${mime};base64,${base64}`;
        }
      } catch (e) {
        // Fallback to fetch below
      }
    }

    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const contentType = res.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${base64}`;
      }
    }
  } catch (err) {
    console.warn('Failed to resolve logo image for PDF:', err);
  }
  return null;
}

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
      const logoUri: string | null = await resolveLogoUri(organization.logo_url, env);

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
      } else if (template === 'sidebar_mono') {
        drawSidebarMonoTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'clean_purple_pro') {
        drawCleanPurpleProTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'orange_accent') {
        drawOrangeAccentTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'navy_geometric') {
        drawNavyGeometricTemplate(doc, invoice, client, organization, items, logoUri);
      } else if (template === 'teal_corporate') {
        drawTealCorporateTemplate(doc, invoice, client, organization, items, logoUri);
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

// =========================================================================
// TEMPLATE: SIDEBAR MONO (Black sidebar, QR area, clean white body)
// =========================================================================
function drawSidebarMonoTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const sideW = 185;
  const bodyX = sideW + 30;
  const bodyW = 595 - bodyX - 30;

  // Dark sidebar
  doc.rect(0, 0, sideW, 842).fill('#1a1a1a');

  // QR code placeholder block in sidebar
  doc.rect(20, 30, 145, 110).fill('#ffffff');
  doc.rect(24, 34, 137, 102).fill('#f3f4f6');
  // QR grid simulation
  for (let qi = 0; qi < 8; qi++) {
    for (let qj = 0; qj < 8; qj++) {
      if ((qi + qj) % 2 === 0) {
        doc.rect(28 + qi * 16, 38 + qj * 12, 14, 10).fill('#1a1a1a');
      }
    }
  }

  // Sidebar info
  let sy = 160;
  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7).text('DATE :', 20, sy);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.issue_date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }), 20, sy + 12, { width: 155 });
  sy += 34;

  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7).text('DUE DATE :', 20, sy);
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8).text(new Date(invoice.due_date).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }), 20, sy + 12, { width: 155 });
  sy += 34;

  // Thin white rule
  doc.strokeColor('#333333').lineWidth(0.5).moveTo(20, sy).lineTo(165, sy).stroke();
  sy += 15;

  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7).text('TO', 20, sy);
  sy += 12;
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5).text(client.name, 20, sy, { width: 155 });
  sy += 14;
  if (client.company_name) {
    doc.fillColor('#d1d5db').font('Helvetica').fontSize(7.5).text(client.company_name, 20, sy, { width: 155 });
    sy += 12;
  }
  if (client.email) {
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text(client.email, 20, sy, { width: 155 });
    sy += 11;
  }
  if (client.phone) {
    doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text(client.phone, 20, sy, { width: 155 });
    sy += 11;
  }

  // Body: Logo / Company name top-right
  let nameX = bodyX;
  if (logoUri) {
    try {
      doc.image(logoUri, bodyX, 28, { fit: [100, 36] });
      nameX = bodyX + 110;
    } catch (e) {
      nameX = bodyX;
    }
  }

  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(14);
  doc.text(organization.name, nameX, 30, { width: 230 });
  if (organization.slug || organization.address) {
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(organization.address || 'Official Dispatch', nameX, 47, { width: 220 });
  }

  // Large INVOICE word
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(38).text('INVOICE', bodyX, 82, { width: bodyW });
  doc.fillColor('#9ca3af').font('Helvetica').fontSize(8.5).text('Document Payment Information', bodyX, 126, { width: bodyW });

  // Account / Invoice number info box
  doc.rect(bodyX, 145, bodyW, 36).fill('#f3f4f6');
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text('Account No:', bodyX + 10, 152).text('Invoice No:', bodyX + 140, 152);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5);
  doc.text(invoice.invoice_number.slice(-8) || '123-456', bodyX + 10, 163).text(`#${invoice.invoice_number}`, bodyX + 140, 163);

  // Payment Method
  let pmY = 194;
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5).text('Payment', bodyX, pmY);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5).text('Method', bodyX, pmY + 11);
  doc.strokeColor('#1a1a1a').lineWidth(1.5).moveTo(bodyX, pmY + 24).lineTo(bodyX + 60, pmY + 24).stroke();

  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text('Account Name:', bodyX + 80, pmY);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(organization.name, bodyX + 80, pmY + 11, { width: bodyW - 80 });

  // Table
  let y = 250;
  const col1 = bodyX;
  const col2 = col1 + 160;
  const col3 = col2 + 70;
  const col4 = col3 + 60;

  doc.rect(col1, y, bodyW, 22).fill('#1a1a1a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('Item Description', col1 + 8, y + 7, { width: 150 });
  doc.text('Rate', col2, y + 7, { width: 68, align: 'right' });
  doc.text('Unit', col3, y + 7, { width: 58, align: 'right' });
  doc.text('Subtotal', col4, y + 7, { width: bodyW - (col4 - col1), align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 24;
    if (y + rH > 680) { doc.addPage(); doc.rect(0, 0, sideW, 842).fill('#1a1a1a'); y = 40; }
    if (i % 2 === 1) doc.rect(col1, y, bodyW, rH).fill('#f9fafb');
    doc.fillColor('#1f2937').font('Helvetica').fontSize(8);
    doc.text(item.description, col1 + 8, y + 8, { width: 150 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), col2, y + 8, { width: 68, align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), col3, y + 8, { width: 58, align: 'right' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold');
    doc.text(formatCurrency(itemTotal, invoice.currency), col4, y + 8, { width: bodyW - (col4 - col1), align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(col1, y + rH).lineTo(col1 + bodyW, y + rH).stroke();
    y += rH;
  });

  y += 12;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  const rX = col3 - 10;
  doc.text('Subtotal :', rX, y, { width: 80, align: 'right' });
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), col4, y, { width: bodyW - (col4 - col1), align: 'right' });
  y += 15;
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`Tax Vat (${taxRate}%) :`, rX, y, { width: 80, align: 'right' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(formatCurrency(taxed, invoice.currency), col4, y, { width: bodyW - (col4 - col1), align: 'right' });
    y += 15;
  }
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text('Total :', rX, y, { width: 80, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), col4, y, { width: bodyW - (col4 - col1), align: 'right' });

  // Footer
  const fy = 756;
  doc.rect(0, fy, 595, 86).fill('#f3f4f6');
  if (invoice.notes) {
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7).text(invoice.notes, bodyX, fy + 10, { width: 160 });
  }
  doc.rect(bodyX + 175, fy + 8, 8, 8).fill('#1a1a1a');
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text('E-mail', bodyX + 188, fy + 8);
  doc.fillColor('#1a1a1a').font('Helvetica').fontSize(7.5).text(`${organization.slug || 'billing'}@company.com`, bodyX + 188, fy + 19, { width: 150 });
  doc.rect(bodyX + 175, fy + 36, 8, 8).fill('#1a1a1a');
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text('Address', bodyX + 188, fy + 36);
  doc.fillColor('#1a1a1a').font('Helvetica').fontSize(7.5).text(organization.address || 'Main Street, Anytown', bodyX + 188, fy + 47, { width: 150 });
}

// =========================================================================
// TEMPLATE: CLEAN PURPLE PRO (Purple corporate, logo top-left, clean rows)
// =========================================================================
function drawCleanPurpleProTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 45;
  const contentWidth = 505;
  const purple = '#4338ca';

  // Logo + company name top-left
  let logoEndX = margin;
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 38, { fit: [52, 52] });
      logoEndX = margin + 60;
    } catch (e) {}
  } else {
    // Circular logo mark placeholder
    doc.circle(margin + 20, 58, 20).fill(purple);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(14).text(organization.name.charAt(0), margin + 13, 51);
    logoEndX = margin + 48;
  }

  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(13).text(organization.name, logoEndX + 4, 38, { width: 200 });
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(13).text('.', logoEndX + 4 + doc.widthOfString(organization.name, { fontSize: 13 }), 38);

  // Large INVOICE top-right
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(28).text('INVOICE', 350, 32, { align: 'right', width: 200 });
  doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8.5).text(new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 350, 66, { align: 'right', width: 200 });

  // Horizontal separator
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, 105).lineTo(margin + contentWidth, 105).stroke();

  // From / To addresses
  let fromY = 118;
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5).text('Office Address', margin, fromY);
  fromY += 13;
  if (organization.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(organization.address, margin, fromY, { width: 200 });
    fromY += doc.heightOfString(organization.address, { width: 200 }) + 4;
  }
  if (organization.phone) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(organization.phone, margin, fromY, { width: 200 });
  }

  doc.fillColor('#6b7280').font('Helvetica').fontSize(8).text('To :', 310, 118);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(10.5).text(client.name, 310, 131, { width: 240 });
  let toY = 146;
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.address, 310, toY, { width: 235 });
    toY += doc.heightOfString(client.address, { width: 235 }) + 3;
  }
  if (client.email) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.email, 310, toY, { width: 235 });
  }

  // Table
  let y = 196;
  const cW = [contentWidth * 0.45, contentWidth * 0.18, contentWidth * 0.12, contentWidth * 0.25];
  const cX = [margin, margin + cW[0], margin + cW[0] + cW[1], margin + cW[0] + cW[1] + cW[2]];

  doc.rect(margin, y, contentWidth, 24).fill(purple);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('Items Description', cX[0] + 8, y + 8, { width: cW[0] - 8 });
  doc.text('Unit Price', cX[1], y + 8, { width: cW[1], align: 'center' });
  doc.text('Qnt', cX[2], y + 8, { width: cW[2], align: 'center' });
  doc.text('Total', cX[3], y + 8, { width: cW[3] - 8, align: 'right' });
  y += 24;

  let subtotal = 0;
  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const descH = doc.heightOfString(item.description, { width: cW[0] - 8 });
    const rH = Math.max(30, descH + 14);
    if (y + rH > 680) { doc.addPage(); y = 40; }

    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5);
    doc.text(item.description, cX[0] + 8, y + 8, { width: cW[0] - 16 });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8.5);
    doc.text(formatCurrency(item.unit_price, invoice.currency), cX[1], y + 8, { width: cW[1], align: 'center' });
    doc.text(Number(item.quantity).toFixed(0), cX[2], y + 8, { width: cW[2], align: 'center' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8.5);
    doc.text(formatCurrency(itemTotal, invoice.currency), cX[3], y + 8, { width: cW[3] - 8, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.8).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 10;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  const totX = cX[2];
  doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text('SUBTOTAL :', totX, y, { width: cW[2], align: 'right' });
  doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), cX[3], y, { width: cW[3] - 8, align: 'right' });
  y += 14;
  if (taxRate > 0) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`Tax VAT ${taxRate}% :`, totX, y, { width: cW[2], align: 'right' });
    doc.fillColor(purple).font('Helvetica-Bold').text(formatCurrency(taxed, invoice.currency), cX[3], y, { width: cW[3] - 8, align: 'right' });
    y += 14;
  }
  if (discount > 0) {
    doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(8).text(`DISCOUNT :`, totX, y, { width: cW[2], align: 'right' });
    doc.fillColor('#ef4444').font('Helvetica-Bold').text(`-${formatCurrency(discount, invoice.currency)}`, cX[3], y, { width: cW[3] - 8, align: 'right' });
    y += 14;
  }

  // TOTAL DUE filled box
  const totW = contentWidth - (cX[2] - margin);
  doc.rect(cX[2] - 10, y, totW + 10, 26).fill(purple);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('TOTAL DUE :', cX[2], y + 8, { width: cW[2] - 2, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), cX[3], y + 8, { width: cW[3] - 8, align: 'right' });

  y += 42;

  // Thank you
  doc.fillColor(purple).font('Helvetica-Bold').fontSize(10).text('Thank you for your Business', margin, y);

  // Footer
  const fy = 728;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, fy).lineTo(margin + contentWidth, fy).stroke();
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text('Questions?', margin, fy + 10);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text(`Email us  : ${organization.slug || 'company'}@mail.site`, margin, fy + 23);
  doc.text(`Call us   : ${organization.phone || '+123 456 789'}`, margin, fy + 33);

  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text('Payment Info :', 210, fy + 10);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5);
  doc.text('Account  : 1234 567 890', 210, fy + 23);
  doc.text(`A/C Name : ${organization.name}`, 210, fy + 33);

  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text('Terms & Conditions/Note:', 370, fy + 10);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(invoice.notes || 'Payment due within 30 days. All transactions are subject to our standard terms.', 370, fy + 23, { width: 175 });
}

// =========================================================================
// TEMPLATE: ORANGE ACCENT (Corner accents, bold orange headers)
// =========================================================================
function drawOrangeAccentTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 45;
  const contentWidth = 505;
  const orange = '#f97316';
  const darkCol = '#1a1a1a';

  // Orange accent corner top-right
  doc.save();
  doc.rect(480, 0, 115, 80).fill(orange);
  doc.rect(545, 60, 50, 50).fill(orange);
  doc.restore();

  // Orange accent corner bottom-left
  doc.rect(0, 750, 50, 92).fill(orange);
  doc.rect(0, 700, 30, 92).fill(orange);

  // Logo / company name top-left
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 25, { fit: [120, 42] });
    } catch (e) {
      doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(14).text(organization.name, margin, 32, { width: 200 });
    }
  } else {
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(14).text(organization.name, margin, 32, { width: 200 });
  }

  if (organization.address) {
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(organization.address, margin, 52, { width: 200 });
  }

  // INVOICE large right
  doc.fillColor(orange).font('Helvetica-Bold').fontSize(32).text('INVOICE', 310, 28, { align: 'right', width: 235 });
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9).text(new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), 310, 66, { align: 'right', width: 235 });

  // TO: block right-aligned
  doc.fillColor('#9ca3af').font('Helvetica').fontSize(7.5).text('TO.', margin + 250, 105);
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(13).text(client.name, margin + 250, 117, { width: 255 });
  let toY = 133;
  if (client.company_name) {
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text(client.company_name, margin + 250, toY, { width: 255 }); toY += 13;
  }
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.address, margin + 250, toY, { width: 255 }); toY += 12;
  }

  // NO/ISN invoice number left
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9).text(`NO/ISN ${invoice.invoice_number}`, margin, 117);

  // Table
  let y = 185;
  doc.strokeColor('#d1d5db').lineWidth(0.8).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 10;

  doc.fillColor('#9ca3af').font('Helvetica-Bold').fontSize(7.5);
  doc.text('QTY', margin, y, { width: 40 });
  doc.text('DESCRIPTION', margin + 48, y, { width: 220 });
  doc.text('PRICE', margin + 280, y, { width: 100, align: 'right' });
  doc.text('TOTAL', margin + 395, y, { width: 115, align: 'right' });
  y += 6;
  doc.strokeColor('#d1d5db').lineWidth(0.8).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 12;

  let subtotal = 0;
  items.forEach((item: any) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const descH = doc.heightOfString(item.description, { width: 210 });
    const rH = Math.max(26, descH + 12);
    if (y + rH > 660) { doc.addPage(); y = 40; }
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9);
    doc.text(Number(item.quantity).toFixed(0), margin, y + 4, { width: 40 });
    doc.text(item.description, margin + 48, y + 4, { width: 220 });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(9);
    doc.text(formatCurrency(item.unit_price, invoice.currency), margin + 280, y + 4, { width: 100, align: 'right' });
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(9);
    doc.text(formatCurrency(itemTotal, invoice.currency), margin + 395, y + 4, { width: 115, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 12;
  doc.strokeColor('#d1d5db').lineWidth(0.8).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 12;

  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  // Payment method left, totals right
  if (invoice.notes) {
    doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text('Payment Method', margin, y);
    doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(invoice.notes, margin, y + 13, { width: 200 });
  }

  doc.fillColor('#4b5563').font('Helvetica').fontSize(8.5).text('Sub Total', margin + 280, y, { width: 100, align: 'right' });
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text(formatCurrency(subtotal, invoice.currency), margin + 395, y, { width: 115, align: 'right' });
  y += 15;
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8.5).text(`Tax ${taxRate}%`, margin + 280, y, { width: 100, align: 'right' });
    doc.fillColor(darkCol).font('Helvetica-Bold').text(formatCurrency(taxed, invoice.currency), margin + 395, y, { width: 115, align: 'right' });
    y += 15;
  }

  y += 8;
  const termsY = y;
  doc.fillColor(darkCol).font('Helvetica-Bold').fontSize(8.5).text('Terms & Condition', margin, y);
  y += 13;
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text('Payment due within 30 days. Standard billing terms apply.', margin, y, { width: 200 });

  // GRAND TOTAL orange box
  doc.rect(margin + 280, termsY - 2, 230, 26).fill(orange);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9.5);
  doc.text('GRAND TOTAL', margin + 292, termsY + 7, { width: 100 });
  doc.text(formatCurrency(total, invoice.currency), margin + 380, termsY + 7, { width: 120, align: 'right' });
}

// =========================================================================
// TEMPLATE: NAVY GEOMETRIC (Full-width navy header, sidebar for payment info)
// =========================================================================
function drawNavyGeometricTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const navy = '#1e3a5f';
  const navyLight = '#2563a8';
  const margin = 40;
  const contentWidth = 515;

  // Full-width navy header bar
  doc.rect(0, 0, 595, 105).fill(navy);

  // Geometric decorations in header (right side circles)
  doc.save();
  doc.circle(530, 40, 38).fill(navyLight);
  doc.circle(530, 40, 22).fill(navy);
  doc.rect(500, 15, 60, 12).fill(navyLight);
  doc.rect(500, 38, 60, 8).fill(navyLight);
  doc.circle(565, 80, 12).fill(navyLight);
  doc.circle(545, 88, 6).fill(navyLight);
  doc.restore();

  // Logo in header
  if (logoUri) {
    try {
      doc.image(logoUri, margin, 26, { fit: [130, 52] });
    } catch (e) {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(organization.name, margin, 38, { width: 180 });
    }
  } else {
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16).text(organization.name, margin, 38, { width: 180 });
  }

  // INVOICE: text in header
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(26).text('INVOICE:', 200, 36, { width: 280 });

  // Invoice info area
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8);
  doc.text(`Invoice No: ${invoice.invoice_number}`, 390, 115);
  doc.text(`Invoice Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 390, 128);

  // Client billing info
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('INVOICE TO :', margin, 115);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(12).text(client.name, margin + 70, 112, { width: 280 });
  let cY = 130;
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
    doc.circle(margin + 72, cY + 3, 2).fill(navy);
    doc.text(client.address, margin + 80, cY, { width: 250 }); cY += 14;
  }
  if (client.phone) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
    doc.circle(margin + 72, cY + 3, 2).fill(navy);
    doc.text(client.phone, margin + 80, cY, { width: 250 }); cY += 14;
  }

  // Divider
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, 168).lineTo(margin + contentWidth, 168).stroke();

  // Left sidebar (payment method panel)
  const sideW = 155;
  doc.rect(margin, 178, sideW, 200).fill('#f1f5f9');

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('PAYMENT', margin + 10, 192);
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('METHOD', margin + 10, 204);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
  doc.text(`Account Name: ${organization.name}`, margin + 10, 225, { width: sideW - 20 });
  doc.text('Bank Transfer / Online', margin + 10, 245, { width: sideW - 20 });

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('TERMS &', margin + 10, 272);
  doc.fillColor(navy).font('Helvetica-Bold').fontSize(8).text('CONDITIONS:', margin + 10, 282);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(7).text(invoice.notes || 'Payment is due within 30 days. Thank you for your business.', margin + 10, 298, { width: sideW - 20 });

  // Right: items table
  let y = 178;
  const tX = margin + sideW + 10;
  const tW = contentWidth - sideW - 10;
  const c = [tX, tX + tW * 0.42, tX + tW * 0.62, tX + tW * 0.79];

  doc.rect(tX, y, tW, 22).fill(navy);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('PRODUCT', c[0] + 6, y + 7, { width: tW * 0.40 });
  doc.text('PRICE', c[1], y + 7, { width: tW * 0.20, align: 'center' });
  doc.text('QTY', c[2], y + 7, { width: tW * 0.17, align: 'center' });
  doc.text('TOTAL', c[3], y + 7, { width: tW * 0.21 - 6, align: 'right' });
  y += 22;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 22;
    if (y + rH > 640) { doc.addPage(); y = 40; }
    if (i % 2 === 1) doc.rect(tX, y, tW, rH).fill('#f8fafc');
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
    doc.text(item.description, c[0] + 6, y + 7, { width: tW * 0.40 });
    doc.text(formatCurrency(item.unit_price, invoice.currency), c[1], y + 7, { width: tW * 0.20, align: 'center' });
    doc.text(Number(item.quantity).toFixed(0), c[2], y + 7, { width: tW * 0.17, align: 'center' });
    doc.fillColor(navy).font('Helvetica-Bold').fontSize(8);
    doc.text(formatCurrency(itemTotal, invoice.currency), c[3], y + 7, { width: tW * 0.21 - 6, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(tX, y + rH).lineTo(tX + tW, y + rH).stroke();
    y += rH;
  });

  y += 12;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(tX, y).lineTo(tX + tW, y).stroke();
  y += 8;
  doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text('SUB TOTAL', tX, y, { width: tW, align: 'right' });
  doc.fillColor(navy).font('Helvetica-Bold').text(formatCurrency(subtotal, invoice.currency), tX, y + 11, { width: tW, align: 'right' });
  y += 25;
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica-Bold').fontSize(8).text(`TAX   ${taxRate}.00%`, tX, y, { width: tW, align: 'right' });
    y += 13;
  }
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text('TOTAL', tX, y, { width: tW, align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), tX, y + 12, { width: tW, align: 'right' });

  // Signature area
  const sigY = 590;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, sigY).lineTo(margin + contentWidth, sigY).stroke();
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text(organization.name + ' Team', margin + 220, sigY + 8);
  doc.fillColor('#6b7280').font('Helvetica').fontSize(8);
  doc.text('Authorized Signatory', margin + 210, sigY + 20);

  // Bottom geometric footer bar
  const fy = 728;
  doc.rect(0, fy, 595, 114).fill(navy);

  // Corner geometric decoration bottom-left
  doc.save();
  doc.circle(40, 800, 45).fill(navyLight);
  doc.circle(25, 842, 28).fill(navyLight);
  doc.rect(0, 740, 20, 102).fill(navyLight);
  doc.restore();

  // Footer content
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
  doc.text(`${organization.phone || '+1 234 567 8900'}`, 195, fy + 18, { width: 205, align: 'center' });
  doc.fillColor('#93c5fd').font('Helvetica').fontSize(8);
  doc.text(`${organization.slug || 'billing'}@company.com`, 195, fy + 36, { width: 205, align: 'center' });
  doc.text('Official Document', 195, fy + 48, { width: 205, align: 'center' });
}

// =========================================================================
// TEMPLATE: TEAL CORPORATE (Dark header block + teal diagonal accent, numbered rows)
// =========================================================================
function drawTealCorporateTemplate(doc: any, invoice: any, client: any, organization: any, items: any[], logoUri: string | null) {
  const margin = 40;
  const contentWidth = 515;
  const teal = '#00897b';
  const dark = '#1a1a2e';

  // Dark block top-left (company area)
  doc.rect(0, 0, 220, 90).fill(dark);

  // Teal right block for INVOICE title
  doc.rect(220, 0, 375, 90).fill(teal);

  // Logo in dark block
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

  // INVOICE text in teal block
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(28).text('INVOICE', 235, 16, { width: 330 });
  doc.fillColor('#ffffff').font('Helvetica').fontSize(8);
  doc.text(`Invoice No:  #${invoice.invoice_number}`, 235, 52, { width: 330 });
  doc.text(`Due Date:    ${new Date(invoice.due_date).toLocaleDateString()}`, 235, 63, { width: 330 });
  doc.text(`Invoice Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 235, 74, { width: 330 });

  // Client billing info left
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('INVOICE TO:', margin, 105);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(12).text(client.name, margin, 118, { width: 250 });
  let cY = 135;
  if (client.company_name) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.company_name, margin, cY, { width: 235 }); cY += 12;
  }
  if (client.address) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(client.address, margin, cY, { width: 235 }); cY += 12;
  }
  if (client.phone) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(`Phone: ${client.phone}`, margin, cY); cY += 12;
  }

  // Payment Method right
  doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('PAYMENT METHOD', 310, 105);
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
  doc.text(`Account No:    ${invoice.invoice_number.slice(-8)}`, 310, 120, { width: 245 });
  doc.text(`Account Name: ${organization.name}`, 310, 132, { width: 245 });
  doc.text('Branch Name:  Main Branch', 310, 144, { width: 245 });

  // Table
  let y = 185;
  doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
  y += 12;

  const cW = [30, contentWidth * 0.42, contentWidth * 0.16, contentWidth * 0.12, contentWidth * 0.22];
  const cX = [margin, margin + cW[0] + 6, margin + cW[0] + cW[1] + 6, margin + cW[0] + cW[1] + cW[2] + 6, margin + cW[0] + cW[1] + cW[2] + cW[3] + 6];

  doc.rect(margin, y, contentWidth, 24).fill(teal);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  doc.text('NO.', cX[0], y + 8, { width: cW[0] });
  doc.text('ITEM DESCRIPTION', cX[1], y + 8, { width: cW[1] });
  doc.text('PRICE', cX[2], y + 8, { width: cW[2], align: 'right' });
  doc.text('QTY.', cX[3], y + 8, { width: cW[3], align: 'center' });
  doc.text('TOTAL', cX[4], y + 8, { width: cW[4] - 6, align: 'right' });
  y += 24;

  let subtotal = 0;
  items.forEach((item: any, i: number) => {
    const itemTotal = Number(item.quantity) * Number(item.unit_price);
    subtotal += itemTotal;
    const rH = 24;
    if (y + rH > 640) { doc.addPage(); y = 40; }
    if (i % 2 === 1) doc.rect(margin, y, contentWidth, rH).fill('#f0fdfa');
    doc.fillColor('#6b7280').font('Helvetica').fontSize(8);
    doc.text(String(i + 1).padStart(2, '0'), cX[0], y + 8, { width: cW[0] });
    doc.fillColor('#1a1a1a').font('Helvetica').fontSize(8);
    doc.text(item.description, cX[1], y + 8, { width: cW[1] });
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8);
    doc.text(formatCurrency(item.unit_price, invoice.currency), cX[2], y + 8, { width: cW[2], align: 'right' });
    doc.text(Number(item.quantity).toFixed(0), cX[3], y + 8, { width: cW[3], align: 'center' });
    doc.fillColor(teal).font('Helvetica-Bold').fontSize(8);
    doc.text(formatCurrency(itemTotal, invoice.currency), cX[4], y + 8, { width: cW[4] - 6, align: 'right' });
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(margin, y + rH).lineTo(margin + contentWidth, y + rH).stroke();
    y += rH;
  });

  y += 14;
  const discount = Number(invoice.discount || 0);
  const taxRate = Number(invoice.tax_rate || 0);
  const taxed = Math.max(0, subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount) + taxed;

  const rX = cX[3];
  doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text('Subtotal:', rX, y, { width: cW[3], align: 'right' });
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text(formatCurrency(subtotal, invoice.currency), cX[4], y, { width: cW[4] - 6, align: 'right' });
  y += 14;
  if (discount > 0) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text('Discount:', rX, y, { width: cW[3], align: 'right' });
    doc.fillColor('#ef4444').font('Helvetica-Bold').fontSize(8).text(`-${formatCurrency(discount, invoice.currency)}`, cX[4], y, { width: cW[4] - 6, align: 'right' });
    y += 14;
  }
  if (taxRate > 0) {
    doc.fillColor('#4b5563').font('Helvetica').fontSize(8).text(`Tax (${taxRate}%):`, rX, y, { width: cW[3], align: 'right' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(8).text(formatCurrency(taxed, invoice.currency), cX[4], y, { width: cW[4] - 6, align: 'right' });
    y += 14;
  }

  // Total teal bar
  doc.rect(rX - 10, y, cW[3] + cW[4] + 16, 26).fill(teal);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
  doc.text('Total:', rX, y + 8, { width: cW[3], align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), cX[4], y + 8, { width: cW[4] - 6, align: 'right' });
  y += 38;

  // Terms
  if (invoice.notes) {
    doc.fillColor(teal).font('Helvetica-Bold').fontSize(8).text('TERMS & CONDITIONS:', margin, y);
    doc.fillColor('#4b5563').font('Helvetica').fontSize(7.5).text(invoice.notes, margin, y + 12, { width: 280 });
  }

  // Thank you
  doc.fillColor(dark).font('Helvetica-Bold').fontSize(9).text('THANK YOU FOR YOUR BUSINESS.', margin, y + 38);

  // Signature
  const sigY = Math.max(y + 60, 640);
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(9).text('Authorized Signature', margin + 310, sigY + 8);
  doc.strokeColor('#1a1a1a').lineWidth(0.8).moveTo(margin + 305, sigY + 26).lineTo(margin + 475, sigY + 26).stroke();

  // Footer bar
  const fy = 730;
  doc.rect(0, fy, 595, 112).fill(dark);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
  const fItems = [
    { label: 'Tel:', text: organization.phone || '+1234 5678 9012' },
    { label: 'Email:', text: `${organization.slug || 'billing'}@company.com` },
    { label: 'Addr:', text: organization.address || '123 Main Road, Executive City' }
  ];
  fItems.forEach((fi, idx) => {
    const fx = margin + idx * 165;
    doc.fillColor('#4ade80').font('Helvetica-Bold').fontSize(8).text(fi.label, fx, fy + 18);
    doc.fillColor('#ffffff').font('Helvetica').fontSize(7.5).text(fi.text, fx + 30, fy + 18, { width: 130 });
  });
}
