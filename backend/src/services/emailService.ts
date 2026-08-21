import nodemailer from 'nodemailer';

// ─── EMAIL TEMPLATE RENDERER ─────────────────────────────────────────────────

function renderEmailTemplate(
  template: string,
  data: {
    orgName: string;
    clientName: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    total: string;
    logoUrl?: string | null;
  }
): string {
  const { orgName, clientName, invoiceNumber, issueDate, dueDate, currency, total, logoUrl } = data;

  const logoHeader = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="max-height:52px;max-width:200px;object-fit:contain;margin-bottom:12px;display:inline-block;vertical-align:middle;" />`
    : `<div style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;background:rgba(255,255,255,0.15);border-radius:10px;font-size:1.4rem;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">${orgName}</div>`;

  const logoHeaderDark = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="max-height:52px;max-width:200px;object-fit:contain;margin-bottom:12px;display:inline-block;" />`
    : `<div style="font-size:1.3rem;font-weight:800;color:#f8fafc;letter-spacing:-0.5px;">${orgName}</div>`;

  const templates: Record<string, string> = {

    // 1. Professional (clean blue/white corporate)
    professional: `
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
    </div>`,

    // 2. Modern Dark (dark mode executive)
    modern_dark: `
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
    </div>`,

    // 3. Vibrant Purple (gradient purple/violet)
    vibrant_purple: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:linear-gradient(135deg,#311042,#5b21b6,#7c3aed);padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="text-align:center;padding:24px 0;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:0.85rem;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Invoice Notice</p>
        </div>
        <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.18);border-radius:20px;padding:36px;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.95);font-size:1.05rem;line-height:1.6;margin:0 0 24px;">Hello <strong style="color:#ffffff;">${clientName}</strong>,</p>
          <p style="color:rgba(255,255,255,0.75);font-size:0.92rem;line-height:1.6;margin:0 0 28px;">This is a reminder regarding your pending invoice statement detailed below.</p>
          <div style="background:rgba(0,0,0,0.3);border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:rgba(255,255,255,0.6);font-size:0.88rem;">Invoice Number</span><span style="color:#fff;font-weight:700;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:rgba(255,255,255,0.6);font-size:0.88rem;">Issue Date</span><span style="color:rgba(255,255,255,0.9);">${issueDate}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:20px;"><span style="color:rgba(255,255,255,0.6);font-size:0.88rem;">Due Date</span><span style="color:#fca5a5;font-weight:700;">${dueDate}</span></div>
            <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:16px;text-align:center;">
              <p style="color:rgba(255,255,255,0.65);font-size:0.78rem;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Total Due</p>
              <p style="color:#ffffff;font-size:2rem;font-weight:800;margin:0;">${currency} ${total}</p>
            </div>
          </div>
          <p style="color:rgba(255,255,255,0.7);font-size:0.88rem;text-align:center;margin:0;">Sincerely — <strong style="color:#ffffff;">${orgName} Billing</strong></p>
        </div>
      </div>
    </div>`,

    // 4. Ocean Wave (teal/cyan coastal)
    ocean_wave: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#ecfeff;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(8,145,178,0.12);border:1px solid #cffaff;">
        <div style="background:linear-gradient(135deg,#0e7490,#06b6d4);padding:36px 40px;text-align:center;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Statement Reminder</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#164e63;font-size:1.05rem;font-weight:600;margin:0 0 10px;">Dear ${clientName},</p>
          <p style="color:#0891b2;font-size:0.94rem;line-height:1.6;margin:0 0 28px;">We hope this email finds you well. This is a friendly notice regarding your outstanding invoice.</p>
          <div style="border:1.5px solid #a5f3fc;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <div style="background:#ecfeff;padding:12px 20px;border-bottom:1px solid #cffaff;display:flex;justify-content:space-between;"><span style="color:#0891b2;font-size:0.88rem;font-weight:500;">Invoice Reference</span><span style="color:#164e63;font-weight:700;">${invoiceNumber}</span></div>
            <div style="background:#ffffff;padding:12px 20px;border-bottom:1px solid #cffaff;display:flex;justify-content:space-between;"><span style="color:#0891b2;font-size:0.88rem;font-weight:500;">Issue Date</span><span style="color:#334155;">${issueDate}</span></div>
            <div style="background:#ecfeff;padding:12px 20px;border-bottom:1px solid #cffaff;display:flex;justify-content:space-between;"><span style="color:#0891b2;font-size:0.88rem;font-weight:500;">Due Date</span><span style="color:#e11d48;font-weight:700;">${dueDate}</span></div>
            <div style="background:#ffffff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;"><span style="color:#0e7490;font-size:1rem;font-weight:700;">Amount Due</span><span style="color:#0e7490;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
          </div>
          <p style="color:#475569;font-size:0.9rem;line-height:1.6;margin:0 0 28px;">Thank you for your business. Please reach out if you have any questions.</p>
          <p style="color:#164e63;font-size:0.88rem;margin:0;">Best regards,<br><strong>${orgName} Accounts</strong></p>
        </div>
      </div>
    </div>`,

    // 5. Corporate Red (bold executive red)
    corporate_red: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#fff5f5;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(153,27,27,0.08);border:1px solid #fee2e2;">
        <div style="background:linear-gradient(135deg,#991b1b,#dc2626);padding:36px 40px;text-align:center;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Payment Reminder</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#18181b;font-size:1.05rem;line-height:1.6;margin:0 0 10px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#52525b;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">Please be advised that Invoice <strong style="color:#991b1b;">${invoiceNumber}</strong> is due for payment.</p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#71717a;font-size:0.88rem;">Invoice #</td><td style="padding:8px 0;color:#18181b;font-weight:700;text-align:right;">${invoiceNumber}</td></tr>
              <tr><td style="padding:8px 0;color:#71717a;font-size:0.88rem;">Issued</td><td style="padding:8px 0;color:#3f3f46;text-align:right;">${issueDate}</td></tr>
              <tr><td style="padding:8px 0;color:#71717a;font-size:0.88rem;">Due Date</td><td style="padding:8px 0;color:#dc2626;font-weight:700;text-align:right;">${dueDate}</td></tr>
              <tr style="border-top:2px solid #fca5a5;"><td style="padding:14px 0 0;color:#991b1b;font-size:1.05rem;font-weight:700;">Total Due</td><td style="padding:14px 0 0;color:#991b1b;font-size:1.35rem;font-weight:800;text-align:right;">${currency} ${total}</td></tr>
            </table>
          </div>
          <p style="color:#52525b;font-size:0.9rem;line-height:1.6;margin:0 0 28px;">Please issue payment at your earliest convenience.</p>
          <p style="color:#18181b;font-size:0.88rem;margin:0;">Sincerely,<br><strong>${orgName} Accounting</strong></p>
        </div>
      </div>
    </div>`,

    // 6. Emerald Green (fresh mint)
    emerald_green: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#ecfdf5;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(5,150,105,0.08);border:1px solid #d1fae5;">
        <div style="background:linear-gradient(135deg,#065f46,#059669);padding:36px 40px;text-align:center;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Account Statement</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#064e3b;font-size:1.05rem;line-height:1.6;margin:0 0 10px;">Hello <strong>${clientName}</strong>,</p>
          <p style="color:#374151;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">This is a friendly statement notice for Invoice <strong style="color:#059669;">${invoiceNumber}</strong>.</p>
          <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:0.88rem;">Invoice Ref</td><td style="padding:8px 0;color:#064e3b;font-weight:700;text-align:right;">${invoiceNumber}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:0.88rem;">Date</td><td style="padding:8px 0;color:#374151;text-align:right;">${issueDate}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:0.88rem;">Due Date</td><td style="padding:8px 0;color:#dc2626;font-weight:700;text-align:right;">${dueDate}</td></tr>
              <tr style="border-top:2px solid #6ee7b7;"><td style="padding:14px 0 0;color:#065f46;font-size:1.05rem;font-weight:700;">Balance Due</td><td style="padding:14px 0 0;color:#059669;font-size:1.35rem;font-weight:800;text-align:right;">${currency} ${total}</td></tr>
            </table>
          </div>
          <p style="color:#374151;font-size:0.9rem;margin:0;">Thank you,<br><strong>${orgName} Team</strong></p>
        </div>
      </div>
    </div>`,

    // 7. Sunset Orange
    sunset_orange: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#fff7ed;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(194,65,12,0.08);border:1px solid #ffedd5;">
        <div style="background:linear-gradient(135deg,#c2410c,#ea580c);padding:36px 40px;text-align:center;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Payment Notice</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#7c2d12;font-size:1.05rem;margin:0 0 10px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#431407;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">Your invoice <strong style="color:#ea580c;">${invoiceNumber}</strong> is ready for payment settlement.</p>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#9a3412;">Invoice #</span><span style="font-weight:700;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#9a3412;">Due Date</span><span style="color:#dc2626;font-weight:700;">${dueDate}</span></div>
            <div style="border-top:1.5px solid #fdba74;padding-top:14px;display:flex;justify-content:space-between;align-items:center;"><span style="color:#7c2d12;font-weight:700;">Total</span><span style="color:#ea580c;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
          </div>
          <p style="color:#7c2d12;font-size:0.9rem;margin:0;">Regards,<br><strong>${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 8. Midnight Blue
    midnight_blue: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#090d16;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#0f172a;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);border:1px solid #1e293b;">
        <div style="padding:36px 40px;background:#020617;border-bottom:1px solid #1e293b;">
          ${logoHeaderDark}
          <p style="color:#38bdf8;margin:6px 0 0;font-size:0.8rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Official Billing Notice</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#f1f5f9;font-size:1.05rem;margin:0 0 12px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#94a3b8;font-size:0.92rem;line-height:1.6;margin:0 0 28px;">This is an automated notification regarding Invoice <strong style="color:#38bdf8;">${invoiceNumber}</strong>.</p>
          <div style="background:#020617;border:1px solid #1e293b;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#64748b;">Invoice Number</span><span style="color:#f8fafc;font-weight:700;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#64748b;">Due Date</span><span style="color:#f87171;font-weight:700;">${dueDate}</span></div>
            <div style="border-top:1px solid #1e293b;padding-top:14px;display:flex;justify-content:space-between;"><span style="color:#38bdf8;font-weight:700;">Amount Due</span><span style="color:#38bdf8;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
          </div>
          <p style="color:#64748b;font-size:0.88rem;margin:0;">Thank you,<br><strong style="color:#f1f5f9;">${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 9. Rose Gold
    rose_gold: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#fff5f7;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(225,29,72,0.08);border:1px solid #ffe4e6;">
        <div style="background:linear-gradient(135deg,#9f1239,#e11d48);padding:36px 40px;text-align:center;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Statement Notice</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#881337;font-size:1.05rem;margin:0 0 10px;">Hello <strong>${clientName}</strong>,</p>
          <p style="color:#4c0519;font-size:0.94rem;line-height:1.6;margin:0 0 28px;">Your invoice <strong style="color:#e11d48;">${invoiceNumber}</strong> is currently pending payment.</p>
          <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#9f1239;">Invoice #</span><span style="font-weight:700;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#9f1239;">Due Date</span><span style="color:#e11d48;font-weight:700;">${dueDate}</span></div>
            <div style="border-top:1.5px solid #fda4af;padding-top:14px;display:flex;justify-content:space-between;"><span style="color:#881337;font-weight:700;">Total</span><span style="color:#e11d48;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
          </div>
          <p style="color:#881337;font-size:0.88rem;margin:0;">Warmly,<br><strong>${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 10. Forest Sage
    forest_sage: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#f4f7f4;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(20,83,45,0.08);border:1px solid #dcfce7;">
        <div style="background:linear-gradient(135deg,#14532d,#166534);padding:36px 40px;text-align:center;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Payment Reminder</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#14532d;font-size:1.05rem;margin:0 0 10px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#166534;font-size:0.94rem;line-height:1.6;margin:0 0 28px;">This is a statement reminder regarding Invoice <strong style="color:#15803d;">${invoiceNumber}</strong>.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#166534;">Invoice</span><span style="font-weight:700;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#166534;">Due Date</span><span style="color:#dc2626;font-weight:700;">${dueDate}</span></div>
            <div style="border-top:1.5px solid #86efac;padding-top:14px;display:flex;justify-content:space-between;"><span style="color:#14532d;font-weight:700;">Amount Due</span><span style="color:#15803d;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
          </div>
          <p style="color:#166534;font-size:0.88rem;margin:0;">Regards,<br><strong>${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 11. Neon Cyber
    neon_cyber: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#050508;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#0d0e15;border-radius:16px;overflow:hidden;box-shadow:0 0 30px rgba(99,102,241,0.2);border:1px solid #1e1b4b;">
        <div style="padding:36px 40px;background:#090a0f;border-bottom:1px solid #1e1b4b;">
          ${logoHeaderDark}
          <p style="color:#818cf8;margin:6px 0 0;font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Invoice Notice</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#e0e7ff;font-size:1.05rem;margin:0 0 10px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#a5b4fc;font-size:0.92rem;line-height:1.6;margin:0 0 28px;">Notice regarding pending Invoice <strong style="color:#c084fc;">${invoiceNumber}</strong>.</p>
          <div style="background:#050508;border:1px solid #312e81;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#6366f1;">Invoice Ref</span><span style="color:#ffffff;font-weight:700;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#6366f1;">Due Date</span><span style="color:#f87171;font-weight:700;">${dueDate}</span></div>
            <div style="border-top:1px solid #312e81;padding-top:14px;display:flex;justify-content:space-between;"><span style="color:#c084fc;font-weight:700;">Total Due</span><span style="color:#c084fc;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
          </div>
          <p style="color:#818cf8;font-size:0.88rem;margin:0;">Regards,<br><strong style="color:#ffffff;">${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 12. Golden Luxury
    golden_luxury: `
    <div style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;background:#fafaf9;padding:40px 16px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(180,83,9,0.08);border:1px solid #fef3c7;">
        <div style="background:linear-gradient(135deg,#78350f,#b45309);padding:36px 40px;text-align:center;">
          ${logoHeader}
          <h1 style="color:#ffffff;margin:8px 0 0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Executive Statement</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#451a03;font-size:1.05rem;margin:0 0 10px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#78350f;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">This is a payment notice for Invoice <strong style="color:#b45309;">${invoiceNumber}</strong>.</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#92400e;font-size:0.88rem;">Invoice #</td><td style="padding:8px 0;color:#451a03;font-weight:700;text-align:right;">${invoiceNumber}</td></tr>
              <tr><td style="padding:8px 0;color:#92400e;font-size:0.88rem;">Issue Date</td><td style="padding:8px 0;color:#78350f;text-align:right;">${issueDate}</td></tr>
              <tr><td style="padding:8px 0;color:#92400e;font-size:0.88rem;">Due Date</td><td style="padding:8px 0;color:#dc2626;font-weight:700;text-align:right;">${dueDate}</td></tr>
              <tr style="border-top:2px solid #fcd34d;"><td style="padding:14px 0 0;color:#78350f;font-size:1.05rem;font-weight:700;">Total Amount</td><td style="padding:14px 0 0;color:#b45309;font-size:1.35rem;font-weight:800;text-align:right;">${currency} ${total}</td></tr>
            </table>
          </div>
          <p style="color:#78350f;font-size:0.9rem;margin:0;">Sincerely,<br><strong>${orgName} Executive Office</strong></p>
        </div>
      </div>
    </div>`
  };

  return templates[template] || templates.professional;
}

// ─── DISPATCH EMAIL SERVICE ──────────────────────────────────────────────────

export async function sendReminderEmail(invoiceId: string, organizationId: string, env: any) {
  const invoice = await env.DB.prepare("SELECT * FROM invoices WHERE id = ? AND organization_id = ?")
    .bind(invoiceId, organizationId)
    .first();
  if (!invoice) throw new Error('Invoice not found.');

  const client = await env.DB.prepare("SELECT * FROM clients WHERE id = ? AND organization_id = ?")
    .bind(invoice.client_id, organizationId)
    .first();
  if (!client) throw new Error('Client not found.');

  const org = await env.DB.prepare("SELECT * FROM organizations WHERE id = ?")
    .bind(organizationId)
    .first();
  if (!org) throw new Error('Organization not found.');

  const { results: items } = await env.DB.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?")
    .bind(invoiceId)
    .all();

  const subtotal = items.reduce((acc: number, item: any) => acc + Number(item.quantity) * Number(item.unit_price), 0);
  const discount = Number(invoice.discount || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxableAmount * (Number(invoice.tax_rate || 0) / 100);
  const total = taxableAmount + tax;

  const subject = `Reminder: Invoice ${invoice.invoice_number} from ${org.name}`;
  const body = `Dear ${client.name},\n\nThis is a payment reminder regarding Invoice ${invoice.invoice_number} issued by ${org.name}.\n\nTotal Due: ${invoice.currency || 'USD'} ${total.toFixed(2)}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nThank you,\n${org.name}`;

  const emailTemplateKey = org.email_template || 'professional';

  const htmlBody = renderEmailTemplate(emailTemplateKey, {
    orgName: org.name,
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    issueDate: new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    dueDate: new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    currency: invoice.currency || 'USD',
    total: total.toFixed(2),
    logoUrl: org.logo_url || null,
  });

  let sentReal = false;

  if (org.smtp_host && org.smtp_port && org.smtp_user && org.smtp_pass && org.smtp_from) {
    try {
      const transporter = nodemailer.createTransport({
        host: org.smtp_host,
        port: Number(org.smtp_port),
        secure: Number(org.smtp_port) === 465,
        auth: { user: org.smtp_user, pass: org.smtp_pass },
        tls: { rejectUnauthorized: false }
      });

      await transporter.sendMail({
        from: `"${org.name}" <${org.smtp_from}>`,
        to: client.email,
        subject,
        text: body,
        html: htmlBody,
      });

      sentReal = true;
      console.log(`[SMTP EMAIL SENT] Real email sent to ${client.email} via ${org.smtp_host}`);
    } catch (smtpErr) {
      console.error('SMTP sending failed. Virtual log stored:', smtpErr);
    }
  }

  await env.DB.prepare("INSERT INTO email_logs (id, organization_id, invoice_id, to_email, subject, body) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), organizationId, invoiceId, client.email, subject, body)
    .run();

  return { to_email: client.email, subject, body, sentReal };
}
