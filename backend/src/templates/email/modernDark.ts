import { EmailTemplateData, getLogoHeader } from './types';

export function renderModernDarkEmail(data: EmailTemplateData): string {
  const {
    orgName,
    clientName,
    invoiceNumber,
    issueDate,
    dueDate,
    currency,
    subtotal,
    discount,
    hasCgstSgst,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    hasIgst,
    igstRate,
    igstAmount,
    hasFlatTax,
    taxRate,
    taxAmount,
    total,
    publicBillUrl,
    logoUrl,
    bankName,
    bankAccountNo,
    bankIfsc,
    bankUpiId,
    contactPhone,
    contactEmail,
    thanksMessage
  } = data;
  const logoHeaderDark = getLogoHeader(logoUrl, orgName).dark;

  let taxRows = '';
  if (hasCgstSgst) {
    taxRows += `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">CGST (${cgstRate}%)</span><span style="color:#cbd5e1;font-size:0.85rem;">${currency} ${cgstAmount}</span></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">SGST (${sgstRate}%)</span><span style="color:#cbd5e1;font-size:0.85rem;">${currency} ${sgstAmount}</span></div>
    `;
  } else if (hasIgst) {
    taxRows += `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">IGST (${igstRate}%)</span><span style="color:#cbd5e1;font-size:0.85rem;">${currency} ${igstAmount}</span></div>
    `;
  } else if (hasFlatTax) {
    taxRows += `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">Tax (${taxRate}%)</span><span style="color:#cbd5e1;font-size:0.85rem;">${currency} ${taxAmount}</span></div>
    `;
  }

  let bankSection = '';
  if (bankName || bankAccountNo || bankIfsc || bankUpiId || contactPhone) {
    bankSection = `
      <div style="background:#090d16;border:1px solid #1e293b;border-radius:10px;padding:18px;margin-bottom:24px;">
        <h4 style="margin:0 0 10px;color:#818cf8;font-size:0.88rem;font-weight:700;">Payment & Bank Information</h4>
        <table style="width:100%;font-size:0.85rem;color:#cbd5e1;">
          ${bankName ? `<tr><td style="padding:3px 0;color:#64748b;width:120px;">Bank:</td><td>${bankName}</td></tr>` : ''}
          ${bankAccountNo ? `<tr><td style="padding:3px 0;color:#64748b;">Account No:</td><td>${bankAccountNo}</td></tr>` : ''}
          ${bankIfsc ? `<tr><td style="padding:3px 0;color:#64748b;">IFSC:</td><td>${bankIfsc}</td></tr>` : ''}
          ${bankUpiId ? `<tr><td style="padding:3px 0;color:#64748b;">UPI ID:</td><td>${bankUpiId}</td></tr>` : ''}
          ${contactPhone ? `<tr><td style="padding:3px 0;color:#64748b;">Contact:</td><td>${contactPhone}</td></tr>` : ''}
        </table>
      </div>
    `;
  }

  return `
  <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#0b0f19;padding:40px 16px;min-height:100vh;">
    <div style="max-width:600px;margin:0 auto;background:#131c2e;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);border:1px solid #1e293b;">
      <div style="padding:36px 40px;border-bottom:1px solid #1e293b;background:#0f172a;">
        ${logoHeaderDark}
        <div style="margin-top:6px;">
          <p style="color:#94a3b8;margin:0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Official Tax Invoice</p>
        </div>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#e2e8f0;font-size:1.05rem;line-height:1.6;margin:0 0 16px;">Dear <strong style="color:#f8fafc;">${clientName}</strong>,</p>
        <p style="color:#94a3b8;font-size:0.92rem;line-height:1.6;margin:0 0 24px;">Please find the billing details for Invoice <strong style="color:#818cf8;">${invoiceNumber}</strong> issued by ${orgName}.</p>
        
        <div style="background:#090d16;border:1px solid #1e293b;border-radius:12px;padding:22px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.88rem;">Invoice Reference</span><span style="color:#f1f5f9;font-weight:700;">${invoiceNumber}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.88rem;">Issue Date</span><span style="color:#cbd5e1;">${issueDate}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.88rem;">Due Date</span><span style="color:#f87171;font-weight:700;">${dueDate}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">Subtotal</span><span style="color:#cbd5e1;font-size:0.85rem;">${currency} ${subtotal}</span></div>
          ${discount && Number(discount) > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">Discount</span><span style="color:#f87171;font-size:0.85rem;">-${currency} ${discount}</span></div>` : ''}
          ${taxRows}
          <div style="display:flex;justify-content:space-between;padding:16px 0 0;"><span style="color:#818cf8;font-size:1.05rem;font-weight:700;">Total Amount Due</span><span style="color:#818cf8;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="${publicBillUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);color:#ffffff;text-decoration:none;font-weight:700;font-size:0.95rem;padding:14px 32px;border-radius:10px;box-shadow:0 4px 16px rgba(99,102,241,0.4);">
            📄 View & Download Bill Online
          </a>
          <p style="margin:8px 0 0;color:#64748b;font-size:0.75rem;">Access private invoice without logging in</p>
        </div>

        ${bankSection}

        <p style="color:#94a3b8;font-size:0.9rem;line-height:1.6;margin:0 0 20px;">
          ${thanksMessage || 'Thank you for your business! We appreciate your partnership.'}
        </p>

        <p style="color:#64748b;font-size:0.85rem;margin:0;">Regards,<br><span style="color:#f1f5f9;font-weight:600;">${orgName}</span></p>
      </div>
      <div style="background:#090d16;border-top:1px solid #1e293b;padding:18px 40px;text-align:center;">
        <p style="color:#475569;font-size:0.75rem;margin:0;">Automated tax invoice statement from ${orgName}.</p>
        <p style="color:#818cf8;font-size:0.75rem;font-weight:700;margin:4px 0 0;">BillingFlow • Powered by HMorix</p>
      </div>
    </div>
  </div>`;
}
