export interface EmailTemplateData {
  orgName: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  total: string;
  logoUrl?: string | null;
}

export function getLogoHeader(logoUrl: string | null | undefined, orgName: string): { light: string; dark: string } {
  const light = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="max-height:52px;max-width:200px;object-fit:contain;margin-bottom:12px;display:inline-block;vertical-align:middle;" />`
    : `<div style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;background:rgba(255,255,255,0.15);border-radius:10px;font-size:1.4rem;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">${orgName}</div>`;

  const dark = logoUrl
    ? `<img src="${logoUrl}" alt="${orgName}" style="max-height:52px;max-width:200px;object-fit:contain;margin-bottom:12px;display:inline-block;" />`
    : `<div style="font-size:1.3rem;font-weight:800;color:#f8fafc;letter-spacing:-0.5px;">${orgName}</div>`;

  return { light, dark };
}
