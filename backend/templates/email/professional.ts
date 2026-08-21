import { EmailTemplateData, getLogoHeader } from './types';

export function renderProfessionalEmail(data: EmailTemplateData): string {
  const { orgName, clientName, invoiceNumber, issueDate, dueDate, currency, total, logoUrl } = data;
  const logoHeader = getLogoHeader(logoUrl, orgName).light;

  return `
  <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#f0f4f8;padding:40px 16px;min-height:100vh;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:36px 40px;text-align:center;">
        ${logoHeader}
        <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:700;letter-spacing:-0.3px;">${orgName}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.85rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Payment Reminder</p>
      </div>
      <div style="padding:36px 40px;">
        <p style="color:#1e293b;font-size:1.05rem;line-height:1.6;margin:0 0 10px;">Dear <strong>${clientName}</strong>,</p>
        <p style="color:#475569;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">This is a courteous reminder that Invoice <strong style="color:#1e293b;">${invoiceNumber}</strong> is currently pending payment. Below is a summary of the statement details.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:28px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;font-size:0.9rem;font-weight:500;">Invoice Reference</td><td style="padding:8px 0;color:#0f172a;font-weight:700;text-align:right;">${invoiceNumber}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:0.9rem;font-weight:500;">Issue Date</td><td style="padding:8px 0;color:#334155;text-align:right;">${issueDate}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:0.9rem;font-weight:500;">Due Date</td><td style="padding:8px 0;color:#dc2626;font-weight:700;text-align:right;">${dueDate}</td></tr>
            <tr style="border-top:2px solid #cbd5e1;"><td style="padding:14px 0 0;color:#0f172a;font-size:1.05rem;font-weight:700;">Total Amount Due</td><td style="padding:14px 0 0;color:#2563eb;font-size:1.35rem;font-weight:800;text-align:right;">${currency} ${total}</td></tr>
          </table>
        </div>
        <p style="color:#475569;font-size:0.92rem;line-height:1.6;margin:0 0 28px;">Please arrange for payment by the due date. Should you have any questions or require assistance, please reply directly to this email.</p>
        <p style="color:#334155;font-size:0.9rem;margin:0;">Warm regards,<br><strong style="color:#0f172a;">${orgName} Billing Department</strong></p>
      </div>
      <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
        <p style="color:#94a3b8;font-size:0.75rem;margin:0;">Official notification issued by ${orgName}. All rights reserved.</p>
      </div>
    </div>
  </div>`;
}
