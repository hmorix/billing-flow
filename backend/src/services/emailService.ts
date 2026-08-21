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
  }
): string {
  const { orgName, clientName, invoiceNumber, issueDate, dueDate, currency, total } = data;

  const templates: Record<string, string> = {

    // 1. Professional (clean blue/white corporate)
    professional: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:36px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:1.6rem;font-weight:700;letter-spacing:-0.5px;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:0.9rem;">Invoice Reminder</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#374151;font-size:1rem;line-height:1.6;margin:0 0 8px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#6b7280;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">This is a friendly reminder that the following invoice is currently outstanding and requires your attention.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;margin-bottom:28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:0.9rem;font-weight:500;">Invoice #</td><td style="padding:8px 0;color:#111827;font-weight:700;text-align:right;">${invoiceNumber}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:0.9rem;font-weight:500;">Issue Date</td><td style="padding:8px 0;color:#374151;text-align:right;">${issueDate}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:0.9rem;font-weight:500;">Due Date</td><td style="padding:8px 0;color:#dc2626;font-weight:600;text-align:right;">${dueDate}</td></tr>
              <tr style="border-top:2px solid #e2e8f0;"><td style="padding:14px 0 0;color:#111827;font-size:1.05rem;font-weight:700;">Total Due</td><td style="padding:14px 0 0;color:#1e40af;font-size:1.3rem;font-weight:800;text-align:right;">${currency} ${total}</td></tr>
            </table>
          </div>
          <p style="color:#6b7280;font-size:0.9rem;line-height:1.6;margin:0 0 28px;">Please arrange payment at your earliest convenience. If you have any questions, do not hesitate to reach out.</p>
          <p style="color:#374151;font-size:0.9rem;margin:0;">Sincerely,<br><strong style="color:#111827;">${orgName} Billing Team</strong></p>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
          <p style="color:#9ca3af;font-size:0.75rem;margin:0;">This is an automated invoice reminder from ${orgName}.</p>
        </div>
      </div>
    </div>`,

    // 2. Modern Dark (dark mode premium)
    modern_dark: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f172a;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#1e293b;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.4);border:1px solid #334155;">
        <div style="padding:36px 40px;border-bottom:1px solid #334155;display:flex;align-items:center;gap:16px;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;">
            <span style="color:#fff;font-weight:800;font-size:1.2rem;">${orgName.charAt(0)}</span>
          </div>
          <div>
            <h1 style="color:#f1f5f9;margin:0;font-size:1.2rem;font-weight:700;">${orgName}</h1>
            <p style="color:#64748b;margin:2px 0 0;font-size:0.8rem;">Payment Reminder Notice</p>
          </div>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#cbd5e1;font-size:1rem;line-height:1.6;margin:0 0 24px;">Dear <strong style="color:#f1f5f9;">${clientName}</strong>, you have an outstanding invoice that requires attention.</p>
          <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">Invoice</span><span style="color:#e2e8f0;font-weight:600;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">Issued</span><span style="color:#e2e8f0;">${issueDate}</span></div>
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1e293b;"><span style="color:#64748b;font-size:0.85rem;">Due By</span><span style="color:#f87171;font-weight:600;">${dueDate}</span></div>
            <div style="display:flex;justify-content:space-between;padding:16px 0 0;"><span style="color:#a78bfa;font-size:1rem;font-weight:700;">Amount Due</span><span style="color:#a78bfa;font-size:1.4rem;font-weight:800;">${currency} ${total}</span></div>
          </div>
          <p style="color:#94a3b8;font-size:0.88rem;line-height:1.6;margin:0 0 28px;">Please process your payment to avoid any service interruptions. Thank you for your continued business.</p>
          <p style="color:#64748b;font-size:0.85rem;margin:0;">Best regards,<br><span style="color:#e2e8f0;font-weight:600;">${orgName}</span></p>
        </div>
        <div style="background:#0f172a;border-top:1px solid #334155;padding:16px 40px;text-align:center;">
          <p style="color:#334155;font-size:0.72rem;margin:0;">Automated billing notice • ${orgName}</p>
        </div>
      </div>
    </div>`,

    // 3. Vibrant Purple (gradient purple/violet)
    vibrant_purple: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(135deg,#4c1d95,#7c3aed,#a855f7);padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="text-align:center;padding:32px 0 24px;">
          <h1 style="color:#ffffff;margin:0;font-size:2rem;font-weight:800;letter-spacing:-1px;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:0.9rem;text-transform:uppercase;letter-spacing:2px;">Invoice Reminder</p>
        </div>
        <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:36px;margin-bottom:20px;">
          <p style="color:rgba(255,255,255,0.9);font-size:1rem;line-height:1.6;margin:0 0 24px;">Hello <strong style="color:#ffffff;">${clientName}</strong>,</p>
          <p style="color:rgba(255,255,255,0.7);font-size:0.92rem;line-height:1.6;margin:0 0 28px;">We wanted to send you a polite reminder about the outstanding invoice below. Your timely payment is greatly appreciated.</p>
          <div style="background:rgba(0,0,0,0.25);border-radius:14px;padding:24px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Invoice Number</span><span style="color:#fff;font-weight:700;">${invoiceNumber}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Issue Date</span><span style="color:rgba(255,255,255,0.85);">${issueDate}</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:20px;"><span style="color:rgba(255,255,255,0.5);font-size:0.85rem;">Payment Due</span><span style="color:#fca5a5;font-weight:600;">${dueDate}</span></div>
            <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;text-align:center;">
              <p style="color:rgba(255,255,255,0.6);font-size:0.8rem;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Total Amount Due</p>
              <p style="color:#ffffff;font-size:2rem;font-weight:800;margin:0;">${currency} ${total}</p>
            </div>
          </div>
          <p style="color:rgba(255,255,255,0.6);font-size:0.85rem;text-align:center;margin:0;">With gratitude — <strong style="color:rgba(255,255,255,0.9);">${orgName} Team</strong></p>
        </div>
      </div>
    </div>`,

    // 4. Ocean Wave (teal/cyan coastal)
    ocean_wave: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#ecfeff;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(6,182,212,0.12);">
        <div style="background:linear-gradient(135deg,#0891b2,#06b6d4,#22d3ee);padding:40px;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
          <div style="position:absolute;bottom:-20px;left:20px;width:80px;height:80px;background:rgba(255,255,255,0.08);border-radius:50%;"></div>
          <h1 style="color:#ffffff;margin:0;font-size:1.5rem;font-weight:800;position:relative;">${orgName}</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:0.85rem;position:relative;">📧 Invoice Payment Reminder</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#164e63;font-size:1rem;font-weight:600;margin:0 0 8px;">Dear ${clientName},</p>
          <p style="color:#0e7490;font-size:0.92rem;line-height:1.7;margin:0 0 28px;">We hope this message finds you well. We're writing to remind you about the following outstanding invoice.</p>
          <div style="border:2px solid #a5f3fc;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <div style="background:#ecfeff;padding:12px 20px;border-bottom:1px solid #a5f3fc;display:flex;justify-content:space-between;"><span style="color:#0e7490;font-size:0.85rem;font-weight:500;">Invoice Reference</span><span style="color:#164e63;font-weight:700;">${invoiceNumber}</span></div>
            <div style="background:#ffffff;padding:12px 20px;border-bottom:1px solid #a5f3fc;display:flex;justify-content:space-between;"><span style="color:#0e7490;font-size:0.85rem;font-weight:500;">Issue Date</span><span style="color:#374151;">${issueDate}</span></div>
            <div style="background:#ecfeff;padding:12px 20px;border-bottom:1px solid #a5f3fc;display:flex;justify-content:space-between;"><span style="color:#0e7490;font-size:0.85rem;font-weight:500;">Due Date</span><span style="color:#dc2626;font-weight:600;">${dueDate}</span></div>
            <div style="background:linear-gradient(135deg,#0891b2,#06b6d4);padding:20px;text-align:center;">
              <p style="color:rgba(255,255,255,0.8);font-size:0.8rem;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Amount Due</p>
              <p style="color:#ffffff;font-size:1.8rem;font-weight:800;margin:0;">${currency} ${total}</p>
            </div>
          </div>
          <p style="color:#0e7490;font-size:0.88rem;line-height:1.6;margin:0 0 20px;">Thank you for your prompt attention to this matter. Please don't hesitate to contact us if you have any questions.</p>
          <p style="color:#164e63;font-size:0.88rem;margin:0;">Warm regards,<br><strong>${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 5. Corporate Red (bold authoritative red)
    corporate_red: `
    <div style="font-family:Arial,sans-serif;background:#fef2f2;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(220,38,38,0.1);border-top:5px solid #dc2626;">
        <div style="padding:32px 40px 24px;border-bottom:1px solid #fee2e2;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h1 style="color:#991b1b;margin:0;font-size:1.4rem;font-weight:800;">${orgName}</h1>
            <p style="color:#ef4444;margin:4px 0 0;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Payment Reminder</p>
          </div>
          <div style="background:#dc2626;color:#fff;padding:8px 16px;border-radius:6px;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Action Required</div>
        </div>
        <div style="padding:32px 40px;">
          <p style="color:#1f2937;font-size:1rem;margin:0 0 20px;">Dear <strong>${clientName}</strong>,</p>
          <p style="color:#6b7280;font-size:0.92rem;line-height:1.6;margin:0 0 28px;">This notice is to inform you that the invoice listed below is currently pending payment. We kindly request you to process payment at your earliest convenience.</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <thead><tr style="background:#dc2626;"><th style="padding:12px 16px;color:#ffffff;text-align:left;font-size:0.85rem;font-weight:600;">Field</th><th style="padding:12px 16px;color:#ffffff;text-align:right;font-size:0.85rem;font-weight:600;">Detail</th></tr></thead>
            <tbody>
              <tr style="background:#fef2f2;"><td style="padding:12px 16px;color:#6b7280;font-size:0.85rem;border-bottom:1px solid #fee2e2;">Invoice Number</td><td style="padding:12px 16px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #fee2e2;">${invoiceNumber}</td></tr>
              <tr><td style="padding:12px 16px;color:#6b7280;font-size:0.85rem;border-bottom:1px solid #fee2e2;">Issue Date</td><td style="padding:12px 16px;color:#374151;text-align:right;border-bottom:1px solid #fee2e2;">${issueDate}</td></tr>
              <tr style="background:#fef2f2;"><td style="padding:12px 16px;color:#6b7280;font-size:0.85rem;border-bottom:1px solid #fee2e2;">Payment Due</td><td style="padding:12px 16px;color:#dc2626;font-weight:700;text-align:right;border-bottom:1px solid #fee2e2;">${dueDate}</td></tr>
              <tr style="background:#dc2626;"><td style="padding:14px 16px;color:#fff;font-weight:700;">TOTAL DUE</td><td style="padding:14px 16px;color:#fff;font-size:1.2rem;font-weight:800;text-align:right;">${currency} ${total}</td></tr>
            </tbody>
          </table>
          <p style="color:#374151;font-size:0.88rem;margin:0;">Respectfully,<br><strong>${orgName} Finance Department</strong></p>
        </div>
      </div>
    </div>`,

    // 6. Emerald Green (fresh growth green)
    emerald_green: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f0fdf4;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(16,185,129,0.1);">
        <div style="background:linear-gradient(135deg,#059669,#10b981,#34d399);padding:36px 40px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-weight:800;font-size:1.1rem;">${orgName.charAt(0)}</span>
            </div>
            <div>
              <h1 style="color:#ffffff;margin:0;font-size:1.2rem;font-weight:700;">${orgName}</h1>
              <p style="color:rgba(255,255,255,0.75);margin:2px 0 0;font-size:0.8rem;">Invoice Reminder</p>
            </div>
          </div>
        </div>
        <div style="padding:36px 40px;">
          <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px 20px;border-radius:0 10px 10px 0;margin-bottom:28px;">
            <p style="color:#065f46;font-size:1rem;margin:0;font-weight:500;">Hello <strong>${clientName}</strong> — You have a pending invoice.</p>
          </div>
          <p style="color:#6b7280;font-size:0.92rem;line-height:1.6;margin:0 0 28px;">We wanted to gently remind you about the invoice below. Please review the details and arrange payment when convenient.</p>
          <div style="background:#f9fafb;border:1px solid #d1fae5;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <div style="padding:16px 20px;border-bottom:1px solid #d1fae5;display:flex;justify-content:space-between;align-items:center;"><span style="color:#6b7280;font-size:0.85rem;">Invoice #</span><span style="color:#065f46;font-weight:700;font-size:0.95rem;">${invoiceNumber}</span></div>
            <div style="padding:16px 20px;border-bottom:1px solid #d1fae5;display:flex;justify-content:space-between;"><span style="color:#6b7280;font-size:0.85rem;">Issue Date</span><span style="color:#374151;">${issueDate}</span></div>
            <div style="padding:16px 20px;border-bottom:1px solid #d1fae5;display:flex;justify-content:space-between;"><span style="color:#6b7280;font-size:0.85rem;">Due Date</span><span style="color:#dc2626;font-weight:600;">${dueDate}</span></div>
            <div style="background:linear-gradient(135deg,#059669,#10b981);padding:20px;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:rgba(255,255,255,0.85);font-weight:600;">Total Due</span>
              <span style="color:#ffffff;font-size:1.5rem;font-weight:800;">${currency} ${total}</span>
            </div>
          </div>
          <p style="color:#374151;font-size:0.88rem;margin:0;">Thank you for your business,<br><strong style="color:#059669;">${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 7. Sunset Orange (warm amber gradient)
    sunset_orange: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:linear-gradient(180deg,#fff7ed,#fef3c7);padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(249,115,22,0.15);border:1px solid #fed7aa;">
        <div style="background:linear-gradient(135deg,#ea580c,#f97316,#fb923c,#fbbf24);padding:40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:1.8rem;font-weight:800;text-shadow:0 2px 4px rgba(0,0,0,0.1);">${orgName}</h1>
          <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:20px;padding:4px 16px;margin-top:10px;">
            <span style="color:#fff;font-size:0.8rem;font-weight:600;letter-spacing:1px;">🔔 PAYMENT REMINDER</span>
          </div>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#431407;font-size:1rem;line-height:1.6;margin:0 0 20px;">Hi <strong>${clientName}</strong>,</p>
          <p style="color:#92400e;font-size:0.92rem;line-height:1.7;margin:0 0 28px;">Hope you're having a wonderful day! We noticed the following invoice has not yet been settled. Could you please take a moment to process the payment?</p>
          <div style="border-radius:14px;overflow:hidden;border:2px solid #fed7aa;margin-bottom:28px;">
            <div style="background:#fff7ed;padding:14px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #fed7aa;"><span style="color:#92400e;font-size:0.85rem;font-weight:500;">Invoice</span><span style="color:#431407;font-weight:700;">${invoiceNumber}</span></div>
            <div style="background:#ffffff;padding:14px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #fed7aa;"><span style="color:#92400e;font-size:0.85rem;">Issued On</span><span style="color:#374151;">${issueDate}</span></div>
            <div style="background:#fff7ed;padding:14px 20px;display:flex;justify-content:space-between;border-bottom:2px solid #fed7aa;"><span style="color:#92400e;font-size:0.85rem;">Due By</span><span style="color:#dc2626;font-weight:600;">${dueDate}</span></div>
            <div style="background:linear-gradient(135deg,#ea580c,#f97316);padding:22px;text-align:center;">
              <p style="color:rgba(255,255,255,0.8);font-size:0.75rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Amount Due</p>
              <p style="color:#ffffff;font-size:2rem;font-weight:800;margin:0;">${currency} ${total}</p>
            </div>
          </div>
          <p style="color:#78350f;font-size:0.88rem;margin:0;">Warmly,<br><strong style="color:#ea580c;">${orgName} Team</strong></p>
        </div>
      </div>
    </div>`,

    // 8. Midnight Blue (deep navy sophisticated)
    midnight_blue: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0a0f2e;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:linear-gradient(180deg,#0f1f5c,#0a1540);border-radius:16px;overflow:hidden;box-shadow:0 12px 48px rgba(0,0,30,0.6);border:1px solid #1e3a8a;">
        <div style="padding:36px 40px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h1 style="color:#e0e7ff;margin:0;font-size:1.3rem;font-weight:700;">${orgName}</h1>
            <p style="color:#6272a4;margin:4px 0 0;font-size:0.8rem;">Billing Department</p>
          </div>
          <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;padding:6px 14px;border-radius:6px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Invoice Due</div>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#c7d2fe;font-size:1rem;margin:0 0 8px;">Dear <strong style="color:#e0e7ff;">${clientName}</strong>,</p>
          <p style="color:#6272a4;font-size:0.9rem;line-height:1.7;margin:0 0 28px;">We are writing to notify you of an outstanding invoice that requires your immediate attention. Please review the invoice details below and arrange payment accordingly.</p>
          <div style="background:rgba(255,255,255,0.03);border:1px solid #1e3a8a;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <div style="padding:14px 20px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between;"><span style="color:#6272a4;font-size:0.85rem;">Invoice Number</span><span style="color:#c7d2fe;font-weight:600;">${invoiceNumber}</span></div>
            <div style="padding:14px 20px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between;"><span style="color:#6272a4;font-size:0.85rem;">Date Issued</span><span style="color:#a5b4fc;">${issueDate}</span></div>
            <div style="padding:14px 20px;border-bottom:1px solid #1e3a8a;display:flex;justify-content:space-between;"><span style="color:#6272a4;font-size:0.85rem;">Payment Due</span><span style="color:#fca5a5;font-weight:600;">${dueDate}</span></div>
            <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:22px 20px;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:rgba(255,255,255,0.8);font-weight:600;font-size:0.95rem;">Total Outstanding</span>
              <span style="color:#ffffff;font-size:1.5rem;font-weight:800;">${currency} ${total}</span>
            </div>
          </div>
          <p style="color:#6272a4;font-size:0.85rem;margin:0;">Regards,<br><strong style="color:#c7d2fe;">${orgName} Finance</strong></p>
        </div>
      </div>
    </div>`,

    // 9. Rose Gold (elegant pink/gold)
    rose_gold: `
    <div style="font-family:'Georgia',serif;background:linear-gradient(135deg,#fff1f2,#fdf4ff);padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(244,63,94,0.12);border:1px solid #fecdd3;">
        <div style="background:linear-gradient(135deg,#be185d,#e11d48,#db2777,#c026d3);padding:40px;text-align:center;">
          <p style="color:rgba(255,255,255,0.7);margin:0 0 6px;font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;font-family:'Segoe UI',sans-serif;">Invoice Reminder</p>
          <h1 style="color:#ffffff;margin:0;font-size:1.8rem;font-weight:700;font-style:italic;">${orgName}</h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#881337;font-size:1rem;margin:0 0 20px;font-style:italic;">Dear <em>${clientName}</em>,</p>
          <p style="color:#9d174d;font-size:0.92rem;line-height:1.7;margin:0 0 28px;font-family:'Segoe UI',sans-serif;">We hope this correspondence finds you well. We are kindly writing to remind you of the invoice outlined below which remains outstanding.</p>
          <div style="border:1px solid #fecdd3;border-radius:14px;overflow:hidden;margin-bottom:28px;">
            <div style="background:#fff1f2;padding:14px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #fecdd3;font-family:'Segoe UI',sans-serif;"><span style="color:#9d174d;font-size:0.85rem;">Invoice Reference</span><span style="color:#881337;font-weight:700;">${invoiceNumber}</span></div>
            <div style="padding:14px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #fecdd3;font-family:'Segoe UI',sans-serif;"><span style="color:#9d174d;font-size:0.85rem;">Date of Issue</span><span style="color:#374151;">${issueDate}</span></div>
            <div style="background:#fff1f2;padding:14px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #fecdd3;font-family:'Segoe UI',sans-serif;"><span style="color:#9d174d;font-size:0.85rem;">Due Date</span><span style="color:#dc2626;font-weight:600;">${dueDate}</span></div>
            <div style="background:linear-gradient(135deg,#be185d,#e11d48);padding:22px;text-align:center;">
              <p style="color:rgba(255,255,255,0.75);font-size:0.75rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;font-family:'Segoe UI',sans-serif;">Total Due</p>
              <p style="color:#ffffff;font-size:2rem;font-weight:700;margin:0;font-family:'Georgia',serif;">${currency} ${total}</p>
            </div>
          </div>
          <p style="color:#9d174d;font-size:0.88rem;font-style:italic;margin:0;">With appreciation,<br><strong style="font-style:normal;">${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 10. Forest Sage (earthy green/olive)
    forest_sage: `
    <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f1f8f1;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#fafdf9;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(22,101,52,0.1);border:1px solid #bbf7d0;">
        <div style="background:linear-gradient(135deg,#14532d,#166534,#15803d);padding:36px 40px;position:relative;">
          <div style="position:absolute;top:0;right:0;width:100%;height:100%;opacity:0.05;background-image:repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%);background-size:20px 20px;"></div>
          <h1 style="color:#dcfce7;margin:0;font-size:1.4rem;font-weight:700;position:relative;">${orgName}</h1>
          <p style="color:#86efac;margin:6px 0 0;font-size:0.82rem;position:relative;">🌿 Invoice Reminder Notice</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#14532d;font-size:1rem;margin:0 0 16px;">Hello <strong>${clientName}</strong>,</p>
          <p style="color:#166534;font-size:0.92rem;line-height:1.7;margin:0 0 28px;">We trust you are doing well. This is a friendly reminder regarding an invoice that remains due. We would appreciate your prompt attention to this matter.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
            <div style="padding:14px 20px;border-bottom:1px solid #bbf7d0;display:flex;justify-content:space-between;"><span style="color:#166534;font-size:0.85rem;font-weight:500;">Invoice No.</span><span style="color:#14532d;font-weight:700;">${invoiceNumber}</span></div>
            <div style="padding:14px 20px;border-bottom:1px solid #bbf7d0;display:flex;justify-content:space-between;"><span style="color:#166534;font-size:0.85rem;">Issued</span><span style="color:#374151;">${issueDate}</span></div>
            <div style="padding:14px 20px;border-bottom:1px solid #bbf7d0;display:flex;justify-content:space-between;"><span style="color:#166534;font-size:0.85rem;">Due By</span><span style="color:#dc2626;font-weight:600;">${dueDate}</span></div>
            <div style="background:linear-gradient(135deg,#14532d,#166534);padding:20px 20px;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#86efac;font-weight:600;">Amount Due</span>
              <span style="color:#ffffff;font-size:1.5rem;font-weight:800;">${currency} ${total}</span>
            </div>
          </div>
          <p style="color:#166534;font-size:0.88rem;margin:0;">Kind regards,<br><strong style="color:#14532d;">${orgName}</strong></p>
        </div>
      </div>
    </div>`,

    // 11. Neon Cyber (dark cyberpunk neon)
    neon_cyber: `
    <div style="font-family:'Courier New',monospace;background:#000000;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:#0d0d0d;border-radius:4px;overflow:hidden;box-shadow:0 0 40px rgba(0,255,136,0.2),0 0 80px rgba(0,100,255,0.1);border:1px solid #00ff88;">
        <div style="padding:28px 36px;border-bottom:1px solid #00ff88;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h1 style="color:#00ff88;margin:0;font-size:1.2rem;font-weight:700;text-transform:uppercase;letter-spacing:3px;">${orgName}</h1>
            <p style="color:#004422;margin:4px 0 0;font-size:0.7rem;letter-spacing:2px;">// INVOICE_REMINDER.exe</p>
          </div>
          <div style="border:1px solid #ff0080;color:#ff0080;padding:4px 12px;font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;">PENDING</div>
        </div>
        <div style="padding:32px 36px;">
          <p style="color:#00ff88;font-size:0.9rem;margin:0 0 8px;letter-spacing:1px;">&gt; TARGET: <strong style="color:#ffffff;">${clientName}</strong></p>
          <p style="color:#444;font-size:0.8rem;margin:0 0 28px;line-height:1.8;">&gt; NOTIFICATION: Outstanding invoice detected in system. Immediate action required to avoid service disruption. Please process payment.</p>
          <div style="border:1px solid #333;border-radius:4px;overflow:hidden;margin-bottom:28px;font-size:0.82rem;">
            <div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;display:flex;justify-content:space-between;"><span style="color:#555;">INVOICE_ID</span><span style="color:#00ff88;">${invoiceNumber}</span></div>
            <div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;display:flex;justify-content:space-between;background:#0a0a0a;"><span style="color:#555;">ISSUE_DATE</span><span style="color:#888;">${issueDate}</span></div>
            <div style="padding:12px 16px;border-bottom:1px solid #1a1a1a;display:flex;justify-content:space-between;"><span style="color:#555;">DUE_DATE</span><span style="color:#ff0080;font-weight:700;">${dueDate}</span></div>
            <div style="background:#001a0a;padding:20px 16px;border-top:1px solid #00ff88;display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#00ff88;letter-spacing:2px;text-transform:uppercase;font-size:0.85rem;">AMOUNT_DUE</span>
              <span style="color:#00ff88;font-size:1.6rem;font-weight:700;text-shadow:0 0 10px rgba(0,255,136,0.5);">${currency} ${total}</span>
            </div>
          </div>
          <p style="color:#333;font-size:0.75rem;letter-spacing:1px;margin:0;">&gt; END OF TRANSMISSION // ${orgName}_BILLING_SYSTEM</p>
        </div>
      </div>
    </div>`,

    // 12. Golden Luxury (prestige gold black)
    golden_luxury: `
    <div style="font-family:'Georgia',serif;background:#1a1200;padding:40px 20px;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;background:linear-gradient(180deg,#1c1400,#0f0b00);border-radius:12px;overflow:hidden;border:1px solid #b8860b;box-shadow:0 12px 48px rgba(0,0,0,0.6),inset 0 1px 0 rgba(184,134,11,0.3);">
        <div style="border-bottom:1px solid #b8860b;padding:36px 44px;text-align:center;position:relative;">
          <div style="position:absolute;top:16px;left:44px;right:44px;height:1px;background:linear-gradient(90deg,transparent,#b8860b,transparent);"></div>
          <h1 style="color:#d4af37;margin:0;font-size:1.6rem;font-weight:700;letter-spacing:4px;text-transform:uppercase;">${orgName}</h1>
          <p style="color:#8b6914;margin:8px 0 0;font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;font-family:'Segoe UI',sans-serif;">Invoice Reminder</p>
          <div style="position:absolute;bottom:16px;left:44px;right:44px;height:1px;background:linear-gradient(90deg,transparent,#b8860b,transparent);"></div>
        </div>
        <div style="padding:40px 44px;">
          <p style="color:#d4af37;font-size:1rem;margin:0 0 16px;font-style:italic;">Dear ${clientName},</p>
          <p style="color:#8b6914;font-size:0.9rem;line-height:1.8;margin:0 0 32px;font-family:'Segoe UI',sans-serif;">We write to you most respectfully to bring to your attention the outstanding invoice detailed herein. We trust in your continued commitment and request that you arrange settlement at your earliest opportunity.</p>
          <div style="border:1px solid #b8860b;border-radius:8px;overflow:hidden;margin-bottom:32px;">
            <div style="padding:14px 20px;border-bottom:1px solid #2d2000;display:flex;justify-content:space-between;font-family:'Segoe UI',sans-serif;"><span style="color:#8b6914;font-size:0.82rem;letter-spacing:1px;text-transform:uppercase;">Invoice Ref</span><span style="color:#d4af37;font-weight:600;">${invoiceNumber}</span></div>
            <div style="background:rgba(212,175,55,0.04);padding:14px 20px;border-bottom:1px solid #2d2000;display:flex;justify-content:space-between;font-family:'Segoe UI',sans-serif;"><span style="color:#8b6914;font-size:0.82rem;letter-spacing:1px;text-transform:uppercase;">Issued</span><span style="color:#a8956a;">${issueDate}</span></div>
            <div style="padding:14px 20px;border-bottom:1px solid #b8860b;display:flex;justify-content:space-between;font-family:'Segoe UI',sans-serif;"><span style="color:#8b6914;font-size:0.82rem;letter-spacing:1px;text-transform:uppercase;">Due Date</span><span style="color:#ef4444;font-weight:600;">${dueDate}</span></div>
            <div style="background:linear-gradient(135deg,#2d1f00,#1a1200);padding:24px 20px;text-align:center;border-top:1px solid #b8860b;">
              <p style="color:#8b6914;font-size:0.7rem;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;font-family:'Segoe UI',sans-serif;">Total Amount Due</p>
              <p style="color:#d4af37;font-size:2.2rem;font-weight:700;margin:0;text-shadow:0 2px 8px rgba(212,175,55,0.3);">${currency} ${total}</p>
            </div>
          </div>
          <p style="color:#8b6914;font-size:0.85rem;font-style:italic;margin:0;text-align:right;">With the highest regard,<br><strong style="color:#d4af37;font-style:normal;letter-spacing:1px;">${orgName}</strong></p>
        </div>
        <div style="border-top:1px solid #2d2000;padding:16px 44px;text-align:center;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,#b8860b,transparent);margin-bottom:12px;"></div>
          <p style="color:#3d2d00;font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;margin:0;font-family:'Segoe UI',sans-serif;">Automated Billing Notice • ${orgName}</p>
        </div>
      </div>
    </div>`,
  };

  return templates[template] || templates['professional'];
}

// ─── SEND REMINDER EMAIL ──────────────────────────────────────────────────────

export async function sendReminderEmail(
  invoiceId: string,
  organizationId: string,
  env: any
): Promise<{ to_email: string; subject: string; body: string; sentReal: boolean }> {

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

  const subject = `Reminder: Invoice ${invoice.invoice_number} is pending payment`;
  const body = `Dear ${client.name},\n\nThis is a friendly reminder that Invoice ${invoice.invoice_number} issued by ${org.name} on ${new Date(invoice.issue_date).toLocaleDateString()} is pending payment.\n\nTotal Due: ${invoice.currency} ${total.toFixed(2)}\nDue Date: ${new Date(invoice.due_date).toLocaleDateString()}\n\nPlease process the payment as soon as possible.\n\nThank you,\n${org.name}`;

  const emailTemplateKey = org.email_template || 'professional';

  const htmlBody = renderEmailTemplate(emailTemplateKey, {
    orgName: org.name,
    clientName: client.name,
    invoiceNumber: invoice.invoice_number,
    issueDate: new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    dueDate: new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    currency: invoice.currency || 'USD',
    total: total.toFixed(2),
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
        from: `"${org.name} Billing" <${org.smtp_from}>`,
        to: client.email,
        subject,
        text: body,
        html: htmlBody,
      });

      sentReal = true;
      console.log(`[SMTP EMAIL SENT] Real email sent to ${client.email} via SMTP host ${org.smtp_host} using template "${emailTemplateKey}"`);
    } catch (smtpErr) {
      console.error('SMTP sending failed. Email logged virtually instead:', smtpErr);
    }
  }

  await env.DB.prepare("INSERT INTO email_logs (id, organization_id, invoice_id, to_email, subject, body) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), organizationId, invoiceId, client.email, subject, body)
    .run();

  return { to_email: client.email, subject, body, sentReal };
}
