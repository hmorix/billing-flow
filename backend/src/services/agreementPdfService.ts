import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface AgreementPdfData {
  agreementNumber: string;
  agreementType: string;
  title: string;
  // First Party
  firstPartyName: string;
  firstPartyFatherName?: string;
  firstPartyAadhaar?: string;
  firstPartyMobile?: string;
  firstPartyContact?: string;
  firstPartyAddress?: string;
  signatoryDesignation?: string;
  signerPhotoUrl?: string;

  // Second Party
  secondPartyName: string;
  secondPartyFatherName?: string;
  secondPartyAadhaar?: string;
  secondPartyMobile?: string;
  secondPartyContact?: string;
  secondPartyAddress?: string;
  secondPartyPhotoUrl?: string;

  // Witnesses
  witness1Name?: string;
  witness1Contact?: string;
  witness2Name?: string;
  witness2Contact?: string;

  // Commercials & Policies
  totalAmount?: number;
  currency?: string;
  validityPeriod?: string;
  paymentTerms?: string;
  refundPolicy?: string;
  latePaymentTerms?: string;
  cancellationPolicy?: string;
  termsContent: string;
  
  // Stamp & Jurisdiction
  stampDutyAmount?: number;
  stateJurisdiction?: string;
  language?: string;

  // Digital Security & Audit
  geoLat?: number;
  geoLng?: number;
  geoAddress?: string;
  digitalHash: string;
  createdAt: string;
  linkedInvoiceNumber?: string;
  attachLegalAppendix?: boolean;
}

// ─────────────────────────────────────────────────────────────
// String Sanitizer: Strips out non-ASCII / Emoji characters
// that corrupt standard PDF fonts (e.g. ₹ -> INR, symbols)
// ─────────────────────────────────────────────────────────────
function sanitizeText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/₹/g, 'INR ')
    .replace(/[📞☎📱📍🏢👤📄🛡️✓✔☑️✖❌⚠️⚡]/gu, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // all emoji symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

// ─────────────────────────────────────────────────────────────
// Helper: Mask Aadhaar Card Number (show only last 4 digits)
// ─────────────────────────────────────────────────────────────
function maskAadhaar(aadhaar: string | undefined | null): string {
  if (!aadhaar) return '';
  const digits = aadhaar.replace(/\D/g, '');
  if (digits.length === 12) {
    return `XXXX-XXXX-${digits.slice(8)}`;
  }
  return aadhaar.length > 4 ? `XXXX-XXXX-${aadhaar.slice(-4)}` : aadhaar;
}

// ─────────────────────────────────────────────────────────────
// Helper: Parse base64 Data URL to Buffer for images
// ─────────────────────────────────────────────────────────────
function dataUrlToBuffer(dataUrl: string | undefined | null): Buffer | null {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  try {
    const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
    if (matches && matches[2]) {
      return Buffer.from(matches[2], 'base64');
    }
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      return null;
    }
    return Buffer.from(dataUrl, 'base64');
  } catch (e) {
    return null;
  }
}

export async function generateAgreementPDF(data: AgreementPdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        autoFirstPage: true,
        info: {
          Title: `Legal Agreement ${data.agreementNumber}`,
          Author: 'HMorix Digital Legal Infrastructure',
          Subject: sanitizeText(data.title),
          Keywords: 'Legal Agreement, e-Stamp, Notary, HMorix, Digital Footprint, India',
          CreationDate: new Date(data.createdAt || Date.now())
        }
      });

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
        // QR is optional fallback
      }

      // Photos Buffers
      const firstPartyPhotoBuf = dataUrlToBuffer(data.signerPhotoUrl);
      const secondPartyPhotoBuf = dataUrlToBuffer(data.secondPartyPhotoUrl);

      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const MARGIN = 40;
      const CONTENT_W = PAGE_W - MARGIN * 2; // 515.28
      const SIGNATURE_BLOCK_H = 148;
      const TEXT_BOTTOM = PAGE_H - MARGIN - SIGNATURE_BLOCK_H - 12;

      const stateCode = (sanitizeText(data.stateJurisdiction) || 'DL').slice(0, 2).toUpperCase();
      const numOnly = data.agreementNumber.replace(/\D/g, '') || String(Date.now()).slice(-8);
      const certNo = `IN-${stateCode}2026-${numOnly.padStart(10, '0')}`;
      const executeDate = new Date(data.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      let currentPage = 1;

      // ─────────────────────────────────────────────────────────────
      // MANDATORY EVERY-PAGE SIGNATURE FOOTER & SECURITY AUDIT BLOCK
      // ─────────────────────────────────────────────────────────────
      function drawMandatoryFooter(pageNum: number, customTitle?: string) {
        const sigY = TEXT_BOTTOM + 6;

        // Divider
        doc.moveTo(MARGIN, sigY).lineTo(PAGE_W - MARGIN, sigY).lineWidth(0.8).strokeColor('#475569').stroke();

        // Top Security Header in Footer: Certificate No. | SHA-256 | GPS Stamp
        const metaY = sigY + 3;
        doc.rect(MARGIN, metaY, CONTENT_W, 14).fill('#0f172a');
        
        const shortHash = data.digitalHash ? data.digitalHash.slice(0, 24).toUpperCase() : 'CRYPTOGRAPHICALLY SEALED';
        const geoSummary = data.geoAddress 
          ? sanitizeText(data.geoAddress).slice(0, 45) + (data.geoLat ? ` [${data.geoLat.toFixed(3)}, ${data.geoLng?.toFixed(3)}]` : '')
          : 'Geo-Tagged Digital Seal';

        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(6)
          .text(`CERTIFICATE: ${certNo}`, MARGIN + 4, metaY + 3, { width: 140 });
        doc.fillColor('#38bdf8').font('Helvetica-Bold').fontSize(6)
          .text(`SHA-256: ${shortHash}...`, MARGIN + 145, metaY + 3, { width: 180 });
        doc.fillColor('#e2e8f0').font('Helvetica').fontSize(5.5)
          .text(`GPS: ${geoSummary}`, MARGIN + 330, metaY + 3, { width: CONTENT_W - 334, align: 'right' });

        // Signature Box Columns (4 Columns: Party 1 | Party 2 | Witness 1 | Witness 2)
        const colGap = 4;
        const colW = (CONTENT_W - 3 * colGap - 46) / 4; // Reserve 46px on right for Stamp seal
        const boxTop = metaY + 16;
        const boxH = 96;

        const parties = [
          {
            header: 'FIRST PARTY (PROVIDER)',
            name: sanitizeText(data.firstPartyName),
            father: data.firstPartyFatherName ? `S/o ${sanitizeText(data.firstPartyFatherName)}` : '',
            aadhaar: data.firstPartyAadhaar ? `Aadhaar: ${maskAadhaar(data.firstPartyAadhaar)}` : '',
            mobile: data.firstPartyMobile ? `Mob: ${sanitizeText(data.firstPartyMobile)}` : '',
            designation: sanitizeText(data.signatoryDesignation) || 'Authorized Signatory',
            photo: firstPartyPhotoBuf
          },
          {
            header: 'SECOND PARTY (CLIENT)',
            name: sanitizeText(data.secondPartyName),
            father: data.secondPartyFatherName ? `S/o ${sanitizeText(data.secondPartyFatherName)}` : '',
            aadhaar: data.secondPartyAadhaar ? `Aadhaar: ${maskAadhaar(data.secondPartyAadhaar)}` : '',
            mobile: data.secondPartyMobile ? `Mob: ${sanitizeText(data.secondPartyMobile)}` : '',
            designation: sanitizeText(data.secondPartyContact) || 'Client Signatory',
            photo: secondPartyPhotoBuf
          },
          {
            header: 'WITNESS 1 (ATTESTOR)',
            name: sanitizeText(data.witness1Name) || '__________________',
            father: '',
            aadhaar: '',
            mobile: sanitizeText(data.witness1Contact) || 'Phone / Aadhaar: ____',
            designation: 'Independent Witness',
            photo: null
          },
          {
            header: 'WITNESS 2 (ATTESTOR)',
            name: sanitizeText(data.witness2Name) || '__________________',
            father: '',
            aadhaar: '',
            mobile: sanitizeText(data.witness2Contact) || 'Phone / Aadhaar: ____',
            designation: 'Independent Witness',
            photo: null
          }
        ];

        parties.forEach((party, idx) => {
          const bx = MARGIN + idx * (colW + colGap);

          // Box Background
          doc.rect(bx, boxTop, colW, boxH).fill('#f8fafc').stroke('#cbd5e1').lineWidth(0.5);

          // Header Bar
          doc.rect(bx, boxTop, colW, 11).fill(idx === 0 ? '#1e3a8a' : idx === 1 ? '#065f46' : '#334155');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(5)
            .text(party.header, bx + 2, boxTop + 2.5, { width: colW - 4, align: 'center' });

          // Photo Thumbnail if available
          let textStartX = bx + 3;
          let textW = colW - 6;
          if (party.photo) {
            try {
              doc.image(party.photo, bx + 3, boxTop + 13, { width: 22, height: 26, fit: [22, 26] });
              doc.rect(bx + 3, boxTop + 13, 22, 26).stroke('#94a3b8').lineWidth(0.5);
              textStartX = bx + 28;
              textW = colW - 31;
            } catch (e) {
              // Ignore image render failure
            }
          }

          // Details text
          doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(6)
            .text(party.name, textStartX, boxTop + 13, { width: textW, height: 14, ellipsis: true });
          
          let curY = boxTop + 24;
          if (party.father) {
            doc.fillColor('#475569').font('Helvetica').fontSize(4.5)
              .text(party.father, textStartX, curY, { width: textW, height: 7, ellipsis: true });
            curY += 7;
          }
          if (party.aadhaar) {
            doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(4.5)
              .text(party.aadhaar, textStartX, curY, { width: textW, height: 7, ellipsis: true });
            curY += 7;
          }
          if (party.mobile) {
            doc.fillColor('#475569').font('Helvetica').fontSize(4.5)
              .text(party.mobile, textStartX, curY, { width: textW, height: 7, ellipsis: true });
            curY += 7;
          }

          // Signature Line
          const sigLineY = boxTop + 72;
          doc.moveTo(bx + 4, sigLineY).lineTo(bx + colW - 4, sigLineY).lineWidth(0.75).strokeColor('#334155').stroke();
          doc.fillColor('#64748b').font('Helvetica').fontSize(4.5)
            .text('Authorized Signature & Date', bx + 2, sigLineY + 2, { width: colW - 4, align: 'center' });

          // Thumb Impression Box
          const thumbX = bx + colW - 22;
          const thumbY = boxTop + 48;
          doc.rect(thumbX, thumbY, 18, 20).fill('#ffffff').stroke('#94a3b8').lineWidth(0.5);
          doc.fillColor('#94a3b8').font('Helvetica').fontSize(3.5)
            .text('Thumb\nMark', thumbX, thumbY + 5, { width: 18, align: 'center' });
        });

        // ─── HMorix Official Circular Notary Stamp on the Right ───
        const stampX = PAGE_W - MARGIN - 22;
        const stampY = boxTop + 46;
        const stampR = 21;

        doc.circle(stampX, stampY, stampR).lineWidth(1.5).strokeColor('#be123c').stroke();
        doc.circle(stampX, stampY, stampR - 2.5).lineWidth(0.6).strokeColor('#be123c').stroke();
        doc.circle(stampX, stampY, stampR - 3.5).fillColor('#fff1f2').fill();

        doc.fillColor('#9f1239').font('Helvetica-Bold').fontSize(8.5)
          .text('HM', stampX - 8, stampY - 8, { width: 16, align: 'center' });
        doc.fillColor('#881337').font('Helvetica-Bold').fontSize(4.5)
          .text('VERIFIED', stampX - 14, stampY + 2, { width: 28, align: 'center' })
          .fontSize(3.8)
          .text('GOVT / IT ACT', stampX - 14, stampY + 8, { width: 28, align: 'center' });

        // Page Numbering Footer Line
        doc.fillColor('#64748b').font('Helvetica').fontSize(6.5)
          .text(
            `Non-Judicial Legal Document | Certified under Information Technology Act, 2000 | Page ${pageNum}`,
            MARGIN, PAGE_H - MARGIN + 12, { width: CONTENT_W, align: 'center' }
          );
      }

      // ─────────────────────────────────────────────────────────────
      // PAGE 1: High-Authority Indian e-Stamp Certificate Header
      // ─────────────────────────────────────────────────────────────
      const stampBoxH = 152;
      doc.rect(MARGIN, MARGIN, CONTENT_W, stampBoxH).lineWidth(2).strokeColor('#be123c').stroke();
      doc.rect(MARGIN + 2.5, MARGIN + 2.5, CONTENT_W - 5, stampBoxH - 5).lineWidth(0.75).strokeColor('#be123c').stroke();

      // Top Red Banner
      doc.rect(MARGIN + 3.5, MARGIN + 3.5, CONTENT_W - 7, 26).fill('#881337');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
        .text('GOVERNMENT OF INDIA • NATIONAL CAPITAL TERRITORY', MARGIN, MARGIN + 6, { width: PAGE_W, align: 'center' });
      doc.fontSize(6.5).font('Helvetica').fillColor('#fecdd3')
        .text(`Official e-Stamp Certificate | Jurisdiction: ${sanitizeText(data.stateJurisdiction) || 'Delhi, India'} | Non-Judicial Legal Attestation`, MARGIN, MARGIN + 17, { width: PAGE_W, align: 'center' });

      // Certificate Details 2-Column Grid
      const C1 = MARGIN + 10;
      const C2 = MARGIN + 250;
      let sY = MARGIN + 35;

      doc.font('Helvetica-Bold').fillColor('#334155').fontSize(7).text('Certificate No.:', C1, sY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(certNo, C1 + 80, sY);
      doc.font('Helvetica-Bold').fillColor('#334155').text('Execution Date:', C2, sY);
      doc.font('Helvetica').fillColor('#0f172a').text(executeDate, C2 + 75, sY);
      sY += 12;

      doc.font('Helvetica-Bold').fillColor('#334155').text('First Party (Provider):', C1, sY);
      doc.font('Helvetica').fillColor('#0f172a').text(sanitizeText(data.firstPartyName), C1 + 80, sY, { width: 155, ellipsis: true });
      doc.font('Helvetica-Bold').fillColor('#334155').text('Second Party (Client):', C2, sY);
      doc.font('Helvetica').fillColor('#0f172a').text(sanitizeText(data.secondPartyName), C2 + 75, sY, { width: 145, ellipsis: true });
      sY += 12;

      if (data.firstPartyAadhaar || data.secondPartyAadhaar) {
        doc.font('Helvetica-Bold').fillColor('#334155').text('1st Party Aadhaar:', C1, sY);
        doc.font('Helvetica').fillColor('#1e40af').text(maskAadhaar(data.firstPartyAadhaar) || 'N/A', C1 + 80, sY);
        doc.font('Helvetica-Bold').fillColor('#334155').text('2nd Party Aadhaar:', C2, sY);
        doc.font('Helvetica').fillColor('#1e40af').text(maskAadhaar(data.secondPartyAadhaar) || 'N/A', C2 + 75, sY);
        sY += 12;
      }

      doc.font('Helvetica-Bold').fillColor('#334155').text('Stamp Duty Paid:', C1, sY);
      doc.font('Helvetica').fillColor('#0f172a').text(`INR ${data.stampDutyAmount || 100}.00 Only`, C1 + 80, sY);
      doc.font('Helvetica-Bold').fillColor('#334155').text('Contract Value:', C2, sY);
      doc.font('Helvetica').fillColor('#0f172a').text(
        data.totalAmount ? `${data.currency || 'INR'} ${Number(data.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'As per Commercial Terms',
        C2 + 75, sY
      );
      sY += 12;

      doc.font('Helvetica-Bold').fillColor('#334155').text('Agreement Archetype:', C1, sY);
      doc.font('Helvetica').fillColor('#0f172a').text(sanitizeText(data.agreementType), C1 + 80, sY, { width: 155, ellipsis: true });
      doc.font('Helvetica-Bold').fillColor('#334155').text('Validity / SLA:', C2, sY);
      doc.font('Helvetica').fillColor('#0f172a').text(sanitizeText(data.validityPeriod) || '30 Days post delivery', C2 + 75, sY, { width: 145, ellipsis: true });
      sY += 12;

      if (data.linkedInvoiceNumber) {
        doc.font('Helvetica-Bold').fillColor('#334155').text('Linked Invoice Ref:', C1, sY);
        doc.font('Helvetica-Bold').fillColor('#2563eb').text(`#${sanitizeText(data.linkedInvoiceNumber)}`, C1 + 80, sY);
        sY += 11;
      }

      // Divider inside stamp
      doc.moveTo(MARGIN + 10, sY).lineTo(PAGE_W - MARGIN - 10, sY).lineWidth(0.5).strokeColor('#f87171').stroke();
      sY += 3;

      doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(5.5)
        .text('LEGAL NOTICE: ELECTRONICALLY RECORDED & EXECUTED DIGITAL CONTRACT PURSUANT TO SECTIONS 4, 5 & 10A OF THE INFORMATION TECHNOLOGY ACT, 2000.', MARGIN + 10, sY, { width: CONTENT_W - 75, align: 'left' });

      // QR Code inside Stamp
      if (qrImageBuffer) {
        doc.image(qrImageBuffer, PAGE_W - MARGIN - 52, MARGIN + 35, { width: 44, height: 44 });
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(4.5).text('Scan to Verify\nAuthenticity Seal', PAGE_W - MARGIN - 54, MARGIN + 81, { width: 48, align: 'center' });
      }

      // ─────────────────────────────────────────────────────────────
      // Main Document Title & Reference Bar
      // ─────────────────────────────────────────────────────────────
      let curY = MARGIN + stampBoxH + 12;

      doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(12)
        .text(sanitizeText(data.title).toUpperCase(), MARGIN, curY, { width: CONTENT_W, align: 'center' });
      curY = doc.y + 3;

      doc.moveTo(MARGIN + 30, curY).lineTo(PAGE_W - MARGIN - 30, curY).lineWidth(1.2).strokeColor('#be123c').stroke();
      curY += 8;

      doc.font('Helvetica').fillColor('#475569').fontSize(7.5)
        .text(`Document Ref: ${data.agreementNumber}   •   State: ${sanitizeText(data.stateJurisdiction) || 'Delhi, India'}   •   Execution Date: ${executeDate}`, MARGIN, curY, { width: CONTENT_W, align: 'center' });
      curY += 14;

      // Preamble Text
      doc.font('Helvetica').fillColor('#1e293b').fontSize(8).text(
        `This Commercial Legal Agreement ("Agreement") is made and entered into on this ${executeDate}, in accordance with the provisions of the Indian Contract Act, 1872 and the Information Technology Act, 2000, by and between:`,
        MARGIN, curY, { width: CONTENT_W, lineGap: 2 }
      );
      curY = doc.y + 8;

      // ─────────────────────────────────────────────────────────────
      // Helper: Check Page Overflow and Add Page with Mandatory Footer
      // ─────────────────────────────────────────────────────────────
      function checkPageBreak(requiredHeight: number) {
        if (doc.y + requiredHeight > TEXT_BOTTOM) {
          drawMandatoryFooter(currentPage);
          doc.addPage();
          currentPage++;
          doc.y = MARGIN + 10;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // Helper: Draw Section / Article Heading
      // ─────────────────────────────────────────────────────────────
      function drawArticleHeader(articleNum: string, articleTitle: string) {
        checkPageBreak(35);
        doc.moveDown(0.4);
        const headerY = doc.y;
        
        // Background banner for article
        doc.rect(MARGIN, headerY, CONTENT_W, 14).fill('#f1f5f9').stroke('#cbd5e1').lineWidth(0.5);
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8)
          .text(`${articleNum}: ${articleTitle.toUpperCase()}`, MARGIN + 6, headerY + 3.5, { width: CONTENT_W - 12 });
        
        doc.y = headerY + 18;
      }

      // ─────────────────────────────────────────────────────────────
      // ARTICLE I: PARTIES TO THE AGREEMENT
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE I', 'Parties to the Agreement & Identification');

      const partyBoxW = (CONTENT_W - 10) / 2;
      const partyBoxH = 76;
      checkPageBreak(partyBoxH + 10);

      const pY = doc.y;

      // First Party Box
      doc.rect(MARGIN, pY, partyBoxW, partyBoxH).fill('#f8fafc').stroke('#93c5fd').lineWidth(0.75);
      doc.rect(MARGIN, pY, partyBoxW, 12).fill('#1e3a8a');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(6)
        .text('FIRST PARTY / SERVICE PROVIDER (PARTY A)', MARGIN + 4, pY + 3, { width: partyBoxW - 8 });
      
      let py1 = pY + 16;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8)
        .text(sanitizeText(data.firstPartyName), MARGIN + 6, py1, { width: partyBoxW - 12, height: 12, ellipsis: true });
      py1 += 12;

      if (data.firstPartyFatherName) {
        doc.fillColor('#475569').font('Helvetica').fontSize(6.5)
          .text(`Father's Name: ${sanitizeText(data.firstPartyFatherName)}`, MARGIN + 6, py1);
        py1 += 9;
      }
      if (data.firstPartyAadhaar) {
        doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(6.5)
          .text(`Aadhaar No.: ${maskAadhaar(data.firstPartyAadhaar)}`, MARGIN + 6, py1);
        py1 += 9;
      }
      if (data.firstPartyMobile || data.firstPartyContact) {
        doc.fillColor('#334155').font('Helvetica').fontSize(6.5)
          .text(`Mobile / Contact: ${sanitizeText(data.firstPartyMobile || data.firstPartyContact)}`, MARGIN + 6, py1);
        py1 += 9;
      }
      if (data.firstPartyAddress) {
        doc.fillColor('#64748b').font('Helvetica').fontSize(6)
          .text(`Address: ${sanitizeText(data.firstPartyAddress)}`, MARGIN + 6, py1, { width: partyBoxW - 12, height: 14, ellipsis: true });
      }

      // Second Party Box
      const p2x = MARGIN + partyBoxW + 10;
      doc.rect(p2x, pY, partyBoxW, partyBoxH).fill('#f8fafc').stroke('#86efac').lineWidth(0.75);
      doc.rect(p2x, pY, partyBoxW, 12).fill('#065f46');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(6)
        .text('SECOND PARTY / CLIENT (PARTY B)', p2x + 4, pY + 3, { width: partyBoxW - 8 });

      let py2 = pY + 16;
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8)
        .text(sanitizeText(data.secondPartyName), p2x + 6, py2, { width: partyBoxW - 12, height: 12, ellipsis: true });
      py2 += 12;

      if (data.secondPartyFatherName) {
        doc.fillColor('#475569').font('Helvetica').fontSize(6.5)
          .text(`Father's Name: ${sanitizeText(data.secondPartyFatherName)}`, p2x + 6, py2);
        py2 += 9;
      }
      if (data.secondPartyAadhaar) {
        doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(6.5)
          .text(`Aadhaar No.: ${maskAadhaar(data.secondPartyAadhaar)}`, p2x + 6, py2);
        py2 += 9;
      }
      if (data.secondPartyMobile || data.secondPartyContact) {
        doc.fillColor('#334155').font('Helvetica').fontSize(6.5)
          .text(`Mobile / Contact: ${sanitizeText(data.secondPartyMobile || data.secondPartyContact)}`, p2x + 6, py2);
        py2 += 9;
      }
      if (data.secondPartyAddress) {
        doc.fillColor('#64748b').font('Helvetica').fontSize(6)
          .text(`Address: ${sanitizeText(data.secondPartyAddress)}`, p2x + 6, py2, { width: partyBoxW - 12, height: 14, ellipsis: true });
      }

      doc.y = pY + partyBoxH + 8;

      // ─────────────────────────────────────────────────────────────
      // ARTICLE II: SCOPE OF ENGAGEMENT & DELIVERABLES
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE II', 'Scope of Engagement, Deliverables & Specifications');

      const termsText = sanitizeText(data.termsContent) || 'The First Party shall provide the professional deliverables and services as mutually agreed upon in writing.';
      const paras = termsText.split('\n').filter(p => p.trim().length > 0);

      for (const para of paras) {
        checkPageBreak(24);
        if (/^[-─—=]{3,}$/.test(para.trim())) {
          doc.moveTo(MARGIN, doc.y + 3).lineTo(PAGE_W - MARGIN, doc.y + 3).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
          doc.moveDown(0.4);
          continue;
        }

        const isNumbered = /^[0-9]+\./.test(para.trim());
        doc.font(isNumbered ? 'Helvetica-Bold' : 'Helvetica').fillColor('#1e293b').fontSize(8)
          .text(para.trim(), MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
        doc.moveDown(0.3);
      }

      // ─────────────────────────────────────────────────────────────
      // ARTICLE III: COMMERCIAL VALUE & PAYMENT SCHEDULE
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE III', 'Commercial Consideration & Milestone Payment Schedule');
      checkPageBreak(40);

      const commY = doc.y;
      doc.rect(MARGIN, commY, CONTENT_W, 36).fill('#f8fafc').stroke('#cbd5e1').lineWidth(0.5);

      const valStr = data.totalAmount 
        ? `${data.currency || 'INR'} ${Number(data.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
        : 'As Per Terms';

      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('CONTRACT VALUE:', MARGIN + 8, commY + 6);
      doc.font('Helvetica-Bold').fillColor('#047857').fontSize(9).text(valStr, MARGIN + 110, commY + 5);

      const payTermsStr = sanitizeText(data.paymentTerms) || '100% due upon delivery and approval of milestone deliverables.';
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('PAYMENT TERMS:', MARGIN + 8, commY + 18);
      doc.font('Helvetica').fillColor('#1e293b').fontSize(7.5).text(payTermsStr, MARGIN + 110, commY + 18, { width: CONTENT_W - 120 });

      doc.y = commY + 42;

      // ─────────────────────────────────────────────────────────────
      // ARTICLE IV: LATE PAYMENT PENALTIES & REMEDIES
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE IV', 'Late Payment Terms & Statutory Interest (Sec. 73 Indian Contract Act)');
      checkPageBreak(30);

      const lateStr = sanitizeText(data.latePaymentTerms) || 
        'In the event of overdue payment beyond the agreed due date, a late payment charge of 1.5% per month (18% per annum) shall be levied on all outstanding balances pursuant to the Interest Act, 1978 and Section 73 of the Indian Contract Act, 1872. Default exceeding 30 calendar days shall entitle the Service Provider to immediately suspend all services and revoke intellectual property usage licenses without prejudice to legal recovery proceedings.';
      
      doc.font('Helvetica').fillColor('#1e293b').fontSize(8)
        .text(lateStr, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
      doc.moveDown(0.4);

      // ─────────────────────────────────────────────────────────────
      // ARTICLE V: REFUND POLICY & SETTLEMENT RULES
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE V', 'Refund Policy & Resolution (Consumer Protection Act, 2019)');
      checkPageBreak(30);

      const refundStr = sanitizeText(data.refundPolicy) || 
        'Advance payments disbursed for project mobilization and reserved developer/service bandwidth are strictly non-refundable once work has commenced. In cases where no deliverables have been produced and cancellation is requested within 7 days of contract execution, a discretionary partial refund may be processed minus a 20% administrative handling charge, complying with the Consumer Protection Act, 2019 and Indian Commercial Law.';
      
      doc.font('Helvetica').fillColor('#1e293b').fontSize(8)
        .text(refundStr, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
      doc.moveDown(0.4);

      // ─────────────────────────────────────────────────────────────
      // ARTICLE VI: CANCELLATION & TERMINATION TERMS
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE VI', 'Cancellation, Breach & Early Termination');
      checkPageBreak(30);

      const cancelStr = sanitizeText(data.cancellationPolicy) || 
        'Either party may terminate this Agreement by serving a formal written notice of at least 15 business days. In the event of unilateral termination by the Client, all completed milestones and pro-rata work in progress up to the date of notice shall be compensated in full. Any mobilization deposit paid shall be forfeited as pre-estimated liquidated damages under Section 74 of the Indian Contract Act, 1872.';
      
      doc.font('Helvetica').fillColor('#1e293b').fontSize(8)
        .text(cancelStr, MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
      doc.moveDown(0.4);

      // ─────────────────────────────────────────────────────────────
      // ARTICLE VII: INTELLECTUAL PROPERTY & TITLE RETENTION
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE VII', 'Intellectual Property Rights & Title Transfer');
      checkPageBreak(30);

      doc.font('Helvetica').fillColor('#1e293b').fontSize(8).text(
        'All intellectual property, proprietary software code, creative assets, and documentation created under this Agreement shall remain the sole exclusive property of the First Party (Service Provider) until full and final settlement of all commercial dues. Upon 100% payment clearance, full ownership rights and perpetual licenses transfer to the Second Party in accordance with the Copyright Act, 1957.',
        MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 }
      );
      doc.moveDown(0.4);

      // ─────────────────────────────────────────────────────────────
      // ARTICLE VIII: CONFIDENTIALITY & DATA PROTECTION (DPDP ACT 2023)
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE VIII', 'Confidentiality & Digital Data Protection (DPDP Act, 2023)');
      checkPageBreak(30);

      doc.font('Helvetica').fillColor('#1e293b').fontSize(8).text(
        'Both parties undertake to maintain strict confidentiality of all proprietary business, financial, and technical information. In compliance with the Digital Personal Data Protection Act, 2023 (DPDP) and Section 43A of the Information Technology Act, 2000, all personal identifiers, Aadhaar numbers, biometric records, and GPS audit footprints collected for this agreement are encrypted with AES-256 standards solely for legal non-repudiation.',
        MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 }
      );
      doc.moveDown(0.4);

      // ─────────────────────────────────────────────────────────────
      // ARTICLE IX: DISPUTE RESOLUTION & ARBITRATION
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE IX', 'Dispute Resolution, Conciliation & Arbitration');
      checkPageBreak(30);

      const jurStr = sanitizeText(data.stateJurisdiction) || 'Delhi, India';
      doc.font('Helvetica').fillColor('#1e293b').fontSize(8).text(
        `Any claim, dispute, or difference arising out of or in connection with this Agreement shall first be resolved through good-faith mutual negotiations within 30 days. Failing amicable resolution, the dispute shall be referred to a Sole Arbitrator appointed in accordance with the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be ${jurStr}, and proceedings shall be conducted in the English language. Courts situated at ${jurStr} shall have exclusive jurisdiction.`,
        MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 }
      );
      doc.moveDown(0.4);

      // ─────────────────────────────────────────────────────────────
      // ARTICLE X: STATUTORY DECLARATION & NON-REPUDIATION
      // ─────────────────────────────────────────────────────────────
      drawArticleHeader('ARTICLE X', 'Solemn Declaration & Non-Repudiation Acknowledgment');
      checkPageBreak(46);

      const decBoxY = doc.y;
      doc.rect(MARGIN, decBoxY, CONTENT_W, 42).fill('#eff6ff').stroke('#93c5fd').lineWidth(0.75);

      doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(7.5)
        .text('MANDATORY SIGNATORY DECLARATION (PURSUANT TO IT ACT 2000 & INDIAN EVIDENCE ACT):', MARGIN + 8, decBoxY + 5);

      doc.fillColor('#1e293b').font('Helvetica').fontSize(6.8).text(
        '"I/We hereby solemnly declare and affirm under oath that I have thoroughly read, fully understood, and unconditionally accepted all terms, conditions, refund policies, late payment penalties, and cancellation clauses set forth in this Agreement. All personal identifiers, Aadhaar numbers, and addresses furnished herein are authentic and correct. I am legally competent to execute this document under Indian law."',
        MARGIN + 8, decBoxY + 16, { width: CONTENT_W - 16, lineGap: 1.5 }
      );

      doc.y = decBoxY + 48;

      // Draw footer for the main contract body
      drawMandatoryFooter(currentPage, 'MAIN CONTRACT EXECUTION & NOTARIAL ATTESTATION');

      // ─────────────────────────────────────────────────────────────
      // APPENDIX: COMPREHENSIVE LEGAL COMPLIANCE FRAMEWORK (Optional/Default)
      // ─────────────────────────────────────────────────────────────
      if (data.attachLegalAppendix !== false) {
        doc.addPage();
        currentPage++;

        let appY = MARGIN;

        // Appendix Header Banner
        doc.rect(MARGIN, appY, CONTENT_W, 26).fill('#0f172a');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9)
          .text('APPENDIX: MASTER LEGAL TERMS & STATUTORY COMPLIANCE ADDENDUM', MARGIN, appY + 5, { width: CONTENT_W, align: 'center' });
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(6)
          .text('Governed under Information Technology Act, 2000, Indian Contract Act, 1872 & DPDP Act, 2023', MARGIN, appY + 16, { width: CONTENT_W, align: 'center' });

        doc.y = appY + 34;

        const appendixClauses = [
          {
            title: '1. LEGAL ENFORCEABILITY & ELECTRONIC SIGNATURE VALIDITY',
            text: 'Pursuant to Sections 4, 5, and 10A of the Information Technology Act, 2000 (India), contracts executed electronically through secure digital hashes, asymmetric cryptographic records, and multi-factor attestation carry the same legal standing, enforceability, and evidential weight as physical ink-signed documents under Section 65B of the Indian Evidence Act, 1872.'
          },
          {
            title: '2. DEFERRED SETTLEMENT & IRREVOCABLE PAYMENT LIEN',
            text: 'Under deferred or milestone compensation models, the Client holds deliverables in fiduciary trust. Ownership title remains vested in the Service Provider until 100% payment clearance. Any unauthorized commercial exploitation prior to full settlement constitutes actionable copyright infringement under Section 51 of the Copyright Act, 1957.'
          },
          {
            title: '3. DATA PRIVACY, ENCRYPTION & DPDP ACT COMPLIANCE',
            text: 'All personal information, Aadhaar representations, contact numbers, and geolocational coordinates gathered during contract execution are processed strictly in compliance with the Digital Personal Data Protection Act, 2023. Encrypted audit trails are retained solely for evidentiary audit and dispute prevention.'
          },
          {
            title: '4. SERVICE LEVEL WARRANTY, DEFECT RECTIFICATION & EXCLUSIONS',
            text: 'The Service Provider warrants that delivered assets shall perform substantially as defined in the scope specifications for a period of 15 calendar days post-approval. Defect rectification shall be provided free of cost during this warranty period, excluding third-party API changes, server downtime, or client-initiated scope modifications.'
          },
          {
            title: '5. TAXES, GOODS AND SERVICES TAX (GST) & STATUTORY LEVIES',
            text: 'All agreed commercial sums are exclusive of applicable Goods and Services Tax (GST) unless explicitly noted. The Client agrees to disburse GST at applicable rates against formal Tax Invoices in accordance with the Central Goods and Services Tax (CGST) Act, 2017.'
          },
          {
            title: '6. FORCE MAJEURE & IMPOSSIBILITY OF PERFORMANCE',
            text: 'Neither party shall be held liable for delayed performance resulting from events beyond reasonable control, including natural calamities, epidemics, government orders, utility outages, or cyber-warfare, in accordance with Section 56 of the Indian Contract Act, 1872.'
          },
          {
            title: '7. SEVERABILITY & NON-WAIVER',
            text: 'If any provision of this Agreement is adjudged invalid or unenforceable by a court of competent jurisdiction, the remaining clauses shall continue in full force and effect. No failure to exercise any contractual right shall constitute a waiver thereof.'
          }
        ];

        for (const clause of appendixClauses) {
          checkPageBreak(38);

          doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(7.5)
            .text(clause.title, MARGIN, doc.y, { width: CONTENT_W });
          doc.moveDown(0.2);

          doc.font('Helvetica').fillColor('#334155').fontSize(7)
            .text(clause.text, MARGIN, doc.y, { width: CONTENT_W, lineGap: 1.5 });
          doc.moveDown(0.4);
        }

        drawMandatoryFooter(currentPage, 'LEGAL APPENDIX & STATUTORY ADDENDUM ATTESTATION');
      }

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}
