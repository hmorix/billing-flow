import { EmailTemplateData, getLogoHeader } from './types';

export function renderModernDarkEmail(data: EmailTemplateData): string {
  const { orgName, clientName, invoiceNumber, issueDate, dueDate, currency, total, logoUrl } = data;
  const logoHeaderDark = getLogoHeader(logoUrl, orgName).dark;

  return `
  <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#0b0f19;padding:40px 16px;min-height:100vh;">
    <div style="max-width:600px;margin:0 auto;background:#131c2e;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);border:1px solid #1e293b;">
      <div style="padding:36px 40px;border-bottom:1px solid #1e293b;background:#0f172a;">
        ${logoHeaderDark}
        <div style="margin-top:6px;">
          <p style="color:#94a3b8;margin:0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Payment Notice</p>
        </div>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#e2e8f0;font-size:1.05rem;line-height:1.6;margin:0 0 24px;">Dear <strong style="color:#f8fafc;">${clientName}</strong>,</p>
        <p style="color:#94a3b8;font-size:0.92rem;line-height:1.6;margin:0 0 28px;">This notice is regarding outstanding Invoice <strong style="color:#818cf8;">${invoiceNumber}</strong> with ${orgName}.</p>
        <div style="background:#090d16;border:1px solid #1e293b;border-radius:12px;padding:24px;margin-bottom:28px;">
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.88rem;">Invoice No.</span><span style="color:#f1f5f9;font-weight:700;">${invoiceNumber}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.88rem;">Issue Date</span><span style="color:#cbd5e1;">${issueDate}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.88rem;">Due Date</span><span style="color:#f87171;font-weight:700;">${dueDate}</span></div>
          <div style="display:flex;justify-content:space-between;padding:16px 0 0;"><span style="color:#818cf8;font-size:1.05rem;font-weight:700;">Balance Due</span><span style="color:#818cf8;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
        </div>
        <p style="color:#94a3b8;font-size:0.9rem;line-height:1.6;margin:0 0 28px;">Please process your payment to maintain active service. Thank you for your prompt attention.</p>
        <p style="color:#64748b;font-size:0.85rem;margin:0;">Regards,<br><span style="color:#f1f5f9;font-weight:600;">${orgName} Finance</span></p>
      </div>
      <div style="background:#090d16;border-top:1px solid #1e293b;padding:18px 40px;text-align:center;">
        <p style="color:#475569;font-size:0.75rem;margin:0;">Automated account statement from ${orgName}.</p>
      </div>
    </div>
  </div>`;
}
