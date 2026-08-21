import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

export interface AgreementPdfData {
  agreementNumber: string;
  agreementType: string;
  title: string;
  firstPartyName: string;
  firstPartyContact?: string;
  firstPartyAddress?: string;
  secondPartyName: string;
  secondPartyContact?: string;
  secondPartyAddress?: string;
  witness1Name?: string;
  witness1Contact?: string;
  witness2Name?: string;
  witness2Contact?: string;
  signatoryDesignation?: string;
  paymentTerms?: string;
  totalAmount?: number;
  currency?: string;
  validityPeriod?: string;
  termsContent: string;
  language?: string;
  stampDutyAmount?: number;
  stateJurisdiction?: string;
  signerPhotoUrl?: string;
  geoLat?: number;
  geoLng?: number;
  geoAddress?: string;
  digitalHash: string;
  createdAt: string;
}

// Fonts
const FONTS_DIR = path.join(__dirname, '..', 'fonts');
const FONT_DEVANAGARI = path.join(FONTS_DIR, 'Mukta.ttf');
const FONT_DEVANAGARI_BOLD = path.join(FONTS_DIR, 'Mukta-Bold.ttf');

function getFontPath(bold = false): string {
  const p = bold ? FONT_DEVANAGARI_BOLD : FONT_DEVANAGARI;
  return fs.existsSync(p) ? p : (bold ? 'Helvetica-Bold' : 'Helvetica');
}

function isNonLatin(text: string): boolean {
  // Check if text contains Devanagari (Hindi) characters
  return /[\u0900-\u097F]/.test(text);
}

export async function generateAgreementPDF(data: AgreementPdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Legal Agreement ${data.agreementNumber}`,
          Author: 'HMorix Digital Legal Infrastructure',
          Subject: data.title,
          Keywords: 'Legal Agreement, e-Stamp, Notary, HMorix, Digital Footprint',
          CreationDate: new Date(data.createdAt)
        }
      });

      // Register fonts
      const devanagariFont = getFontPath(false);
      const devanagariBoldFont = getFontPath(true);
      if (typeof devanagariFont === 'string' && fs.existsSync(devanagariFont)) {
        doc.registerFont('Devanagari', devanagariFont);
        doc.registerFont('DevanagariBold', devanagariBoldFont);
      }

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const verificationUrl = `${process.env.FRONTEND_URL || 'https://billingflow.hmorix.com'}/verify/${data.digitalHash}`;
      let qrImageBuffer: Buffer | null = null;
      try {
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 120, errorCorrectionLevel: 'H' });
        qrImageBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
      } catch (e) {
        // QR optional
      }

      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const MARGIN = 50;
      const CONTENT_W = PAGE_W - MARGIN * 2;
      const SIGNATURE_H = 155; // height reserved at bottom for sig block
      const TEXT_BOTTOM = PAGE_H - MARGIN - SIGNATURE_H - 10;

      const executeDate = new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      // ─────────────────────────────────────────────────────────────
      // HELPER: render smart text (use Devanagari font for Hindi text)
      // ─────────────────────────────────────────────────────────────
      function smartText(text: string, x: number, y: number, opts: any = {}, bold = false) {
        if (!text) return;
        const hasDev = isNonLatin(text) && fs.existsSync(FONT_DEVANAGARI);
        const font = hasDev ? (bold ? 'DevanagariBold' : 'Devanagari') : (bold ? 'Helvetica-Bold' : 'Helvetica');
        doc.font(font).text(text, x, y, opts);
      }

      // ─────────────────────────────────────────────────────────────
      // HELPER: draw signature footer on current page
      // ─────────────────────────────────────────────────────────────
      function drawSignatureFooter(pageNum: number, totalPages?: number) {
        const sigY = TEXT_BOTTOM + 10;

        // Top divider
        doc.moveTo(MARGIN, sigY).lineTo(PAGE_W - MARGIN, sigY).lineWidth(0.8).strokeColor('#6b7280').stroke();

        // "Execution Block" heading
        doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(7)
          .text('EXECUTION & ATTESTATION BLOCK — HMorix Digital Legal Agreement', MARGIN, sigY + 5, { width: CONTENT_W, align: 'center' });

        // 4 signature columns
        const sigBoxW = Math.floor(CONTENT_W / 4) - 4;
        const sigBoxes = [
          { label: 'FIRST PARTY / AUTHORITY', sub: data.firstPartyName, designation: data.signatoryDesignation || 'Service Provider' },
          { label: 'SECOND PARTY / CUSTOMER', sub: data.secondPartyName, designation: data.secondPartyContact || 'Client' },
          { label: 'WITNESS 1', sub: data.witness1Name || '_____________________', designation: data.witness1Contact || 'Govt. ID: ___________' },
          { label: 'WITNESS 2', sub: data.witness2Name || '_____________________', designation: data.witness2Contact || 'Govt. ID: ___________' }
        ];

        sigBoxes.forEach((box, idx) => {
          const bx = MARGIN + idx * (sigBoxW + 5);
          const by = sigY + 16;

          // Box background
          doc.rect(bx, by, sigBoxW, 100).fill('#f9fafb').stroke('#d1d5db').lineWidth(0.5);

          // Label
          doc.fillColor('#6b7280').font('Helvetica-Bold').fontSize(5.5)
            .text(box.label, bx + 4, by + 4, { width: sigBoxW - 8 });

          // Name
          doc.fillColor('#111827').font('Helvetica-Bold').fontSize(7)
            .text(box.sub, bx + 4, by + 16, { width: sigBoxW - 8 });

          // Designation/Contact
          doc.fillColor('#6b7280').font('Helvetica').fontSize(6)
            .text(box.designation, bx + 4, by + 28, { width: sigBoxW - 8 });

          // Signature line
          const lineY = by + 72;
          doc.moveTo(bx + 6, lineY).lineTo(bx + sigBoxW - 6, lineY).lineWidth(0.8).strokeColor('#374151').stroke();
          doc.fillColor('#9ca3af').font('Helvetica').fontSize(5.5)
            .text('Signature & Date', bx + 4, lineY + 2, { width: sigBoxW - 8 });

          // Thumb impression box
          doc.rect(bx + sigBoxW - 26, by + 46, 22, 20).strokeColor('#9ca3af').lineWidth(0.5).stroke();
          doc.fillColor('#d1d5db').font('Helvetica').fontSize(4.5)
            .text('Thumb\nImpression', bx + sigBoxW - 24, by + 50, { width: 20 });
        });

        // ─── HMorix Official Circular Notary Stamp ───
        const stampCX = PAGE_W - MARGIN - 28;
        const stampCY = sigY + 60;
        const stampR = 26;

        // Outer circle (crimson)
        doc.circle(stampCX, stampCY, stampR).lineWidth(2).strokeColor('#be123c').stroke();
        doc.circle(stampCX, stampCY, stampR - 4).lineWidth(0.75).strokeColor('#be123c').stroke();

        // Inner background
        doc.circle(stampCX, stampCY, stampR - 5).fillColor('#fff8f8').fill();

        // Center crown / emblem (simplified H)
        doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(11)
          .text('HM', stampCX - 9, stampCY - 7, { width: 20, align: 'center' });

        // Curved "VERIFIED" text simulation via straight lines
        doc.fillColor('#881337').font('Helvetica-Bold').fontSize(5.5)
          .text('VERIFIED', stampCX - 12, stampCY + 5, { width: 24, align: 'center' })
          .fontSize(4.5)
          .text('HMorix Legal', stampCX - 12, stampCY + 13, { width: 24, align: 'center' });

        // Outer arc text label (top and bottom of circle)
        doc.fillColor('#6b7280').font('Helvetica').fontSize(4)
          .text('OFFICIAL NOTARY SEAL', stampCX - 20, sigY + 15, { width: 42, align: 'center' });

        // Page number
        if (pageNum > 0) {
          const pgText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
          doc.fillColor('#9ca3af').font('Helvetica').fontSize(7)
            .text(pgText, MARGIN, PAGE_H - 20, { width: CONTENT_W, align: 'center' });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // PAGE 1: Indian e-Stamp Header
      // ─────────────────────────────────────────────────────────────
      let currentPage = 1;

      // Stamp border
      doc.rect(MARGIN, 42, CONTENT_W, 155).lineWidth(2).strokeColor('#be123c').stroke();
      doc.rect(MARGIN + 3, 45, CONTENT_W - 6, 149).lineWidth(0.75).strokeColor('#be123c').stroke();

      // Top red banner
      doc.rect(MARGIN + 4, 46, CONTENT_W - 8, 28).fill('#881337');

      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
        .text('GOVERNMENT OF NATIONAL CAPITAL TERRITORY', MARGIN, 50, { width: PAGE_W, align: 'center' });

      doc.fontSize(7.5).font('Helvetica').fillColor('#fecdd3')
        .text(`e-Stamp Certificate | Jurisdiction: ${data.stateJurisdiction || 'Delhi, India'} | Non-Judicial Digital Notarization under HMorix Legal Infrastructure`, MARGIN, 62, { width: PAGE_W, align: 'center' });

      // 2-column meta inside stamp
      const C1 = MARGIN + 14, C2 = MARGIN + 265;
      let sY = 82;
      const stampRow = (label: string, val: string) => {
        doc.font('Helvetica-Bold').fillColor('#374151').fontSize(7.5).text(label, C1, sY);
        doc.font('Helvetica').fillColor('#111827').text(val, C1 + 90, sY);
        sY += 12;
      };

      const certNo = `IN-${(data.stateJurisdiction || 'DL').slice(0, 2).toUpperCase()}2026-${data.agreementNumber.replace(/\D/g, '').padStart(10, '0')}`;
      doc.font('Helvetica-Bold').fillColor('#374151').fontSize(7.5).text('Certificate No.:', C1, sY);
      doc.font('Helvetica').fillColor('#111827').text(certNo, C1 + 90, sY);
      doc.font('Helvetica-Bold').fillColor('#374151').text('Issued Date:', C2, sY);
      doc.font('Helvetica').fillColor('#111827').text(executeDate, C2 + 65, sY); sY += 12;

      doc.font('Helvetica-Bold').fillColor('#374151').text('First Party:', C1, sY);
      doc.font('Helvetica').fillColor('#111827').text(data.firstPartyName, C1 + 90, sY);
      doc.font('Helvetica-Bold').fillColor('#374151').text('Second Party:', C2, sY);
      doc.font('Helvetica').fillColor('#111827').text(data.secondPartyName, C2 + 65, sY); sY += 12;

      doc.font('Helvetica-Bold').fillColor('#374151').text('Stamp Duty:', C1, sY);
      doc.font('Helvetica').fillColor('#111827').text(`₹ ${data.stampDutyAmount || 100}.00 Only`, C1 + 90, sY);
      doc.font('Helvetica-Bold').fillColor('#374151').text('Total Amount:', C2, sY);
      doc.font('Helvetica').fillColor('#111827').text(
        data.totalAmount ? `${data.currency || 'INR'} ${Number(data.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'As Per Terms',
        C2 + 65, sY
      ); sY += 12;

      doc.font('Helvetica-Bold').fillColor('#374151').text('Agreement Type:', C1, sY);
      doc.font('Helvetica').fillColor('#111827').text(data.agreementType, C1 + 90, sY);
      doc.font('Helvetica-Bold').fillColor('#374151').text('Validity:', C2, sY);
      doc.font('Helvetica').fillColor('#111827').text(data.validityPeriod || 'As Per Terms', C2 + 65, sY); sY += 14;

      // Horizontal divider in stamp
      doc.moveTo(MARGIN + 10, sY - 2).lineTo(PAGE_W - MARGIN - 10, sY - 2).lineWidth(0.75).strokeColor('#f87171').stroke();

      doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(7)
        .text('⚠ THIS IS A NON-JUDICIAL SIMULATED e-STAMP DOCUMENT INTENDED FOR ILLUSTRATIVE LEGAL DOCUMENTATION PURPOSE ONLY — FOR OFFICIAL REGISTRATION CONTACT A REGISTERED NOTARY / SUB-REGISTRAR', MARGIN + 14, sY + 2, { width: CONTENT_W - 28 });

      // QR code top-right inside stamp
      if (qrImageBuffer) {
        doc.image(qrImageBuffer, PAGE_W - MARGIN - 60, 80, { width: 48, height: 48 });
        doc.fillColor('#6b7280').font('Helvetica').fontSize(5).text('Scan to Verify\nDigital Seal', PAGE_W - MARGIN - 56, 130, { width: 46, align: 'center' });
      }

      // ─────────────────────────────────────────────────────────────
      // Agreement Title Section
      // ─────────────────────────────────────────────────────────────
      let y = 210;

      // Title (bilingual)
      const titleText = data.title;
      if (isNonLatin(titleText) && fs.existsSync(FONT_DEVANAGARI_BOLD)) {
        doc.font('DevanagariBold').fillColor('#0f172a').fontSize(14)
          .text(titleText, MARGIN, y, { width: CONTENT_W, align: 'center' });
      } else {
        doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(13)
          .text(titleText.toUpperCase(), MARGIN, y, { width: CONTENT_W, align: 'center' });
      }
      y = doc.y + 4;

      doc.moveTo(MARGIN + 40, y).lineTo(PAGE_W - MARGIN - 40, y).lineWidth(1.2).strokeColor('#be123c').stroke();
      y += 12;

      // Agreement number + date line
      doc.font('Helvetica').fillColor('#374151').fontSize(8.5)
        .text(`Agreement Ref: ${data.agreementNumber}   |   Execution Date: ${executeDate}   |   HMorix Digital Reference: #${data.digitalHash.slice(0, 16).toUpperCase()}`, MARGIN, y, { width: CONTENT_W, align: 'center' });
      y += 16;

      // "This Agreement is made and entered into..."
      doc.font('Helvetica').fillColor('#1f2937').fontSize(9).text(
        `This Agreement is made and entered into on ${executeDate}, by and between the following parties:`,
        MARGIN, y, { width: CONTENT_W }
      );
      y = doc.y + 10;

      // Party boxes
      const partyBoxW = (CONTENT_W - 12) / 2;
      const partyBoxH = 60;

      // First Party
      doc.rect(MARGIN, y, partyBoxW, partyBoxH).fill('#fef2f2').stroke('#fecaca').lineWidth(0.75);
      doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(7).text('FIRST PARTY (SERVICE PROVIDER / PARTY A)', MARGIN + 8, y + 7);
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text(data.firstPartyName, MARGIN + 8, y + 18);
      if (data.firstPartyContact) doc.font('Helvetica').fontSize(7.5).fillColor('#374151').text(`📞 ${data.firstPartyContact}`, MARGIN + 8, y + 30);
      if (data.firstPartyAddress) doc.font('Helvetica').fontSize(7).fillColor('#6b7280').text(data.firstPartyAddress, MARGIN + 8, y + 40, { width: partyBoxW - 16, ellipsis: true });

      // Second Party
      const p2x = MARGIN + partyBoxW + 12;
      doc.rect(p2x, y, partyBoxW, partyBoxH).fill('#f0fdf4').stroke('#bbf7d0').lineWidth(0.75);
      doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(7).text('SECOND PARTY (CLIENT / PARTY B)', p2x + 8, y + 7);
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9).text(data.secondPartyName, p2x + 8, y + 18);
      if (data.secondPartyContact) doc.font('Helvetica').fontSize(7.5).fillColor('#374151').text(`📞 ${data.secondPartyContact}`, p2x + 8, y + 30);
      if (data.secondPartyAddress) doc.font('Helvetica').fontSize(7).fillColor('#6b7280').text(data.secondPartyAddress, p2x + 8, y + 40, { width: partyBoxW - 16, ellipsis: true });

      y += partyBoxH + 14;

      // ─────────────────────────────────────────────────────────────
      // Terms & Conditions — Smart bilingual rendering
      // ─────────────────────────────────────────────────────────────
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
        .text('TERMS, CONDITIONS & LEGAL CLAUSES', MARGIN, y);
      y = doc.y + 4;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + 200, y).lineWidth(1).strokeColor('#be123c').stroke();
      y += 10;

      // Split terms into paragraphs and render each with correct font
      const paragraphs = data.termsContent.split('\n').filter(p => p.trim());

      for (const para of paragraphs) {
        // Check if we need a new page (leave room for signature block)
        if (doc.y > TEXT_BOTTOM - 20) {
          drawSignatureFooter(currentPage);
          doc.addPage();
          currentPage++;
          y = MARGIN + 10;
        }

        const hasHindi = isNonLatin(para) && fs.existsSync(FONT_DEVANAGARI);

        if (hasHindi) {
          // Render Hindi paragraph with Devanagari font
          doc.font('Devanagari').fillColor('#1f2937').fontSize(9.5)
            .text(para.trim(), MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
        } else {
          // Render English paragraph with Helvetica
          const isBold = /^[0-9]+\./.test(para.trim());
          doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#1f2937').fontSize(9)
            .text(para.trim(), MARGIN, doc.y, { width: CONTENT_W, lineGap: 1.5 });
        }
        doc.moveDown(0.4);
      }

      // ─────────────────────────────────────────────────────────────
      // Payment Terms & Validity blocks
      // ─────────────────────────────────────────────────────────────
      if (doc.y > TEXT_BOTTOM - 80) {
        drawSignatureFooter(currentPage);
        doc.addPage();
        currentPage++;
      }
      y = doc.y + 10;

      if (data.paymentTerms || data.validityPeriod) {
        doc.rect(MARGIN, y, CONTENT_W, 1).fill('#e5e7eb');
        y += 8;

        if (data.paymentTerms) {
          doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8.5).text('PAYMENT TERMS:', MARGIN, y);
          doc.font('Helvetica').fillColor('#1f2937').fontSize(8.5)
            .text(data.paymentTerms, MARGIN + 95, y, { width: CONTENT_W - 95 });
          y = doc.y + 6;
        }
        if (data.validityPeriod) {
          doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8.5).text('SERVICE VALIDITY:', MARGIN, y);
          doc.font('Helvetica').fillColor('#1f2937').fontSize(8.5)
            .text(data.validityPeriod, MARGIN + 95, y, { width: CONTENT_W - 95 });
          y = doc.y + 6;
        }
        if (data.geoAddress) {
          doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8.5).text('GPS GEO STAMP:', MARGIN, y);
          doc.font('Helvetica').fillColor('#374151').fontSize(8)
            .text(`${data.geoAddress}${data.geoLat ? ` (${data.geoLat.toFixed(4)}°N, ${data.geoLng?.toFixed(4)}°E)` : ''}`, MARGIN + 95, y, { width: CONTENT_W - 95 });
          y = doc.y + 6;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Digital Hash & Verification Footer
      // ─────────────────────────────────────────────────────────────
      if (doc.y > TEXT_BOTTOM - 60) {
        drawSignatureFooter(currentPage);
        doc.addPage();
        currentPage++;
      }
      y = doc.y + 14;

      // SHA-256 block
      doc.rect(MARGIN, y, CONTENT_W, 38).fill('#f1f5f9').stroke('#cbd5e1').lineWidth(0.75);
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(6.5)
        .text('SHA-256 CRYPTOGRAPHIC DIGITAL FOOTPRINT (TAMPER-EVIDENT SEAL)', MARGIN + 6, y + 6, { width: CONTENT_W - 12 });
      doc.fillColor('#1e3a5f').font('Helvetica').fontSize(7)
        .text(data.digitalHash.toUpperCase(), MARGIN + 6, y + 16, { width: CONTENT_W - 12, characterSpacing: 0.5 });
      doc.fillColor('#64748b').fontSize(5.5)
        .text(`Verify: ${verificationUrl}`, MARGIN + 6, y + 27, { width: CONTENT_W - 12 });
      y += 48;

      // Legal Footer Note
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5)
        .text('This document is an electronically executed digital agreement under the Information Technology Act, 2000, and is legally binding upon all signatories. Any tampering, modification, or unauthorized alteration of this document after execution is punishable under the Indian Penal Code (IPC) Sections 463, 465, and 471, and the IT Act, 2000. Verify the SHA-256 seal at the above URL at any time.', MARGIN, y, { width: CONTENT_W, lineGap: 1 });

      // ─────────────────────────────────────────────────────────────
      // Last page signature block
      // ─────────────────────────────────────────────────────────────
      drawSignatureFooter(currentPage);
      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}
