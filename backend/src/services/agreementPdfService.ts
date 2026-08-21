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
  linkedInvoiceNumber?: string;
  attachLegalAppendix?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Robust Font Path Resolver (Dev & Production safe)
// ─────────────────────────────────────────────────────────────
function resolveFont(fontName: string): string | null {
  const searchPaths = [
    path.join(__dirname, '..', 'fonts', fontName),
    path.join(__dirname, '..', '..', 'src', 'fonts', fontName),
    path.join(__dirname, '..', '..', 'fonts', fontName),
    path.join(__dirname, 'fonts', fontName),
    path.join(process.cwd(), 'src', 'fonts', fontName),
    path.join(process.cwd(), 'backend', 'src', 'fonts', fontName),
    path.join(process.cwd(), 'fonts', fontName),
    path.join(process.cwd(), 'dist', 'fonts', fontName),
    path.join(process.cwd(), 'backend', 'dist', 'fonts', fontName)
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function hasDevanagari(text: string): boolean {
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

      // Register fonts with absolute resolved paths
      const fontRegular = resolveFont('Mukta.ttf');
      const fontBold = resolveFont('Mukta-Bold.ttf');

      const devanagariAvailable = !!(fontRegular && fontBold);
      if (devanagariAvailable) {
        doc.registerFont('Devanagari', fontRegular!);
        doc.registerFont('DevanagariBold', fontBold!);
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
      const SIGNATURE_H = 150;
      const TEXT_BOTTOM = PAGE_H - MARGIN - SIGNATURE_H - 10;

      const executeDate = new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      let currentPage = 1;

      // ─────────────────────────────────────────────────────────────
      // HELPER: Select Font for any string
      // ─────────────────────────────────────────────────────────────
      function getFont(text: string, bold = false): string {
        if (devanagariAvailable && hasDevanagari(text)) {
          return bold ? 'DevanagariBold' : 'Devanagari';
        }
        return bold ? 'Helvetica-Bold' : 'Helvetica';
      }

      // ─────────────────────────────────────────────────────────────
      // HELPER: Draw Signature & HMorix Notary Stamp Footer
      // ─────────────────────────────────────────────────────────────
      function drawSignatureFooter(pageNum: number, customHeading?: string) {
        const sigY = TEXT_BOTTOM + 10;

        // Top divider
        doc.moveTo(MARGIN, sigY).lineTo(PAGE_W - MARGIN, sigY).lineWidth(0.8).strokeColor('#6b7280').stroke();

        // Heading
        doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(7)
          .text(customHeading || 'EXECUTION & ATTESTATION BLOCK — HMorix Digital Legal Infrastructure', MARGIN, sigY + 5, { width: CONTENT_W, align: 'center' });

        // 4 signature columns
        const sigBoxW = Math.floor(CONTENT_W / 4) - 4;
        const sigBoxes = [
          { label: 'FIRST PARTY / AUTHORITY', sub: data.firstPartyName, designation: data.signatoryDesignation || 'Service Provider' },
          { label: 'SECOND PARTY / CUSTOMER', sub: data.secondPartyName, designation: data.secondPartyContact || 'Client' },
          { label: 'WITNESS 1 (साक्षी १)', sub: data.witness1Name || '_____________________', designation: data.witness1Contact || 'Govt. ID / Phone: ________' },
          { label: 'WITNESS 2 (साक्षी २)', sub: data.witness2Name || '_____________________', designation: data.witness2Contact || 'Govt. ID / Phone: ________' }
        ];

        sigBoxes.forEach((box, idx) => {
          const bx = MARGIN + idx * (sigBoxW + 5);
          const by = sigY + 16;

          // Box background
          doc.rect(bx, by, sigBoxW, 95).fill('#f9fafb').stroke('#d1d5db').lineWidth(0.5);

          // Label
          const labelFont = getFont(box.label, true);
          doc.fillColor('#6b7280').font(labelFont).fontSize(5.5)
            .text(box.label, bx + 4, by + 4, { width: sigBoxW - 8 });

          // Name
          const nameFont = getFont(box.sub, true);
          doc.fillColor('#111827').font(nameFont).fontSize(7)
            .text(box.sub, bx + 4, by + 16, { width: sigBoxW - 8, height: 16, ellipsis: true });

          // Designation
          const desigFont = getFont(box.designation, false);
          doc.fillColor('#6b7280').font(desigFont).fontSize(5.5)
            .text(box.designation, bx + 4, by + 30, { width: sigBoxW - 8, height: 14, ellipsis: true });

          // Signature line
          const lineY = by + 68;
          doc.moveTo(bx + 6, lineY).lineTo(bx + sigBoxW - 6, lineY).lineWidth(0.8).strokeColor('#374151').stroke();
          doc.fillColor('#9ca3af').font('Helvetica').fontSize(5.5)
            .text('Signature & Date', bx + 4, lineY + 2, { width: sigBoxW - 8 });

          // Thumb impression mini box
          doc.rect(bx + sigBoxW - 24, by + 44, 20, 18).strokeColor('#9ca3af').lineWidth(0.5).stroke();
          doc.fillColor('#9ca3af').font('Helvetica').fontSize(4)
            .text('Thumb\nMark', bx + sigBoxW - 23, by + 47, { width: 18, align: 'center' });
        });

        // ─── HMorix Official Circular Notary Stamp ───
        const stampCX = PAGE_W - MARGIN - 26;
        const stampCY = sigY + 58;
        const stampR = 24;

        doc.circle(stampCX, stampCY, stampR).lineWidth(2).strokeColor('#be123c').stroke();
        doc.circle(stampCX, stampCY, stampR - 3).lineWidth(0.75).strokeColor('#be123c').stroke();
        doc.circle(stampCX, stampCY, stampR - 4).fillColor('#fff8f8').fill();

        doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(10)
          .text('HM', stampCX - 8, stampCY - 7, { width: 16, align: 'center' });

        doc.fillColor('#881337').font('Helvetica-Bold').fontSize(5)
          .text('VERIFIED', stampCX - 12, stampCY + 4, { width: 24, align: 'center' })
          .fontSize(4)
          .text('HMorix Legal', stampCX - 12, stampCY + 11, { width: 24, align: 'center' });

        doc.fillColor('#9ca3af').font('Helvetica').fontSize(6.5)
          .text(`Page ${pageNum}`, MARGIN, PAGE_H - 22, { width: CONTENT_W, align: 'center' });
      }

      // ─────────────────────────────────────────────────────────────
      // PAGE 1: Indian e-Stamp Certificate Header
      // ─────────────────────────────────────────────────────────────
      doc.rect(MARGIN, 38, CONTENT_W, 158).lineWidth(2).strokeColor('#be123c').stroke();
      doc.rect(MARGIN + 3, 41, CONTENT_W - 6, 152).lineWidth(0.75).strokeColor('#be123c').stroke();

      // Red banner
      doc.rect(MARGIN + 4, 42, CONTENT_W - 8, 26).fill('#881337');
      doc.fillColor('#ffffff').fontSize(9.5).font('Helvetica-Bold')
        .text('GOVERNMENT OF NATIONAL CAPITAL TERRITORY', MARGIN, 46, { width: PAGE_W, align: 'center' });
      doc.fontSize(7).font('Helvetica').fillColor('#fecdd3')
        .text(`e-Stamp Certificate | Jurisdiction: ${data.stateJurisdiction || 'Delhi, India'} | Non-Judicial Digital Notarization under HMorix Legal Infrastructure`, MARGIN, 57, { width: PAGE_W, align: 'center' });

      // Stamp Details 2-columns
      const C1 = MARGIN + 12, C2 = MARGIN + 260;
      let sY = 74;

      const certNo = `IN-${(data.stateJurisdiction || 'DL').slice(0, 2).toUpperCase()}2026-${data.agreementNumber.replace(/\D/g, '').padStart(10, '0')}`;
      doc.font('Helvetica-Bold').fillColor('#374151').fontSize(7.5).text('Certificate No.:', C1, sY);
      doc.font('Helvetica').fillColor('#111827').text(certNo, C1 + 85, sY);
      doc.font('Helvetica-Bold').fillColor('#374151').text('Issued Date:', C2, sY);
      doc.font('Helvetica').fillColor('#111827').text(executeDate, C2 + 65, sY); sY += 12;

      doc.font('Helvetica-Bold').fillColor('#374151').text('First Party:', C1, sY);
      doc.font(getFont(data.firstPartyName)).fillColor('#111827').text(data.firstPartyName, C1 + 85, sY, { width: 160, ellipsis: true });
      doc.font('Helvetica-Bold').fillColor('#374151').text('Second Party:', C2, sY);
      doc.font(getFont(data.secondPartyName)).fillColor('#111827').text(data.secondPartyName, C2 + 65, sY, { width: 140, ellipsis: true }); sY += 12;

      doc.font('Helvetica-Bold').fillColor('#374151').text('Stamp Duty:', C1, sY);
      doc.font('Helvetica').fillColor('#111827').text(`₹ ${data.stampDutyAmount || 100}.00 Only`, C1 + 85, sY);
      doc.font('Helvetica-Bold').fillColor('#374151').text('Total Amount:', C2, sY);
      doc.font('Helvetica').fillColor('#111827').text(
        data.totalAmount ? `${data.currency || 'INR'} ${Number(data.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'As Per Terms',
        C2 + 65, sY
      ); sY += 12;

      doc.font('Helvetica-Bold').fillColor('#374151').text('Agreement Type:', C1, sY);
      doc.font(getFont(data.agreementType)).fillColor('#111827').text(data.agreementType, C1 + 85, sY, { width: 160, ellipsis: true });
      doc.font('Helvetica-Bold').fillColor('#374151').text('Validity:', C2, sY);
      doc.font(getFont(data.validityPeriod || 'As Per Terms')).fillColor('#111827').text(data.validityPeriod || 'As Per Terms', C2 + 65, sY, { width: 140, ellipsis: true }); sY += 13;

      if (data.linkedInvoiceNumber) {
        doc.font('Helvetica-Bold').fillColor('#374151').text('Linked Invoice:', C1, sY);
        doc.font('Helvetica').fillColor('#2563eb').text(`#${data.linkedInvoiceNumber}`, C1 + 85, sY);
        sY += 12;
      }

      // Divider in stamp
      doc.moveTo(MARGIN + 10, sY).lineTo(PAGE_W - MARGIN - 10, sY).lineWidth(0.5).strokeColor('#f87171').stroke();

      doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(6.5)
        .text('⚠ THIS IS A NON-JUDICIAL ELECTRONICALLY EXECUTED DIGITAL CONTRACT UNDER THE IT ACT, 2000 — FOR OFFICIAL REGISTRATION AFFIX REGISTERED TREASURY STAMP', MARGIN + 10, sY + 3, { width: CONTENT_W - 20, align: 'center' });

      // QR code inside stamp
      if (qrImageBuffer) {
        doc.image(qrImageBuffer, PAGE_W - MARGIN - 54, 76, { width: 44, height: 44 });
        doc.fillColor('#6b7280').font('Helvetica').fontSize(4.5).text('Scan to Verify\nDigital Seal', PAGE_W - MARGIN - 54, 122, { width: 44, align: 'center' });
      }

      // ─────────────────────────────────────────────────────────────
      // Agreement Title Section
      // ─────────────────────────────────────────────────────────────
      let y = 208;

      const titleFont = getFont(data.title, true);
      doc.font(titleFont).fillColor('#0f172a').fontSize(13)
        .text(data.title, MARGIN, y, { width: CONTENT_W, align: 'center' });
      y = doc.y + 4;

      doc.moveTo(MARGIN + 40, y).lineTo(PAGE_W - MARGIN - 40, y).lineWidth(1.2).strokeColor('#be123c').stroke();
      y += 10;

      // Ref line
      doc.font('Helvetica').fillColor('#374151').fontSize(8)
        .text(`Agreement Ref: ${data.agreementNumber}   |   Date: ${executeDate}   |   HMorix Ref: #${data.digitalHash.slice(0, 16).toUpperCase()}`, MARGIN, y, { width: CONTENT_W, align: 'center' });
      y += 14;

      // Preamble
      doc.font('Helvetica').fillColor('#1f2937').fontSize(8.5).text(
        `This Agreement is made and entered into on ${executeDate}, by and between the following parties:`,
        MARGIN, y, { width: CONTENT_W }
      );
      y = doc.y + 8;

      // Party boxes
      const partyBoxW = (CONTENT_W - 12) / 2;
      const partyBoxH = 62;

      // First Party Box
      doc.rect(MARGIN, y, partyBoxW, partyBoxH).fill('#fef2f2').stroke('#fecaca').lineWidth(0.75);
      doc.fillColor('#be123c').font('Helvetica-Bold').fontSize(6.5).text('FIRST PARTY (SERVICE PROVIDER / PARTY A)', MARGIN + 8, y + 6);
      doc.fillColor('#111827').font(getFont(data.firstPartyName, true)).fontSize(8.5).text(data.firstPartyName, MARGIN + 8, y + 16);
      if (data.signatoryDesignation) {
        doc.font(getFont(data.signatoryDesignation)).fontSize(7).fillColor('#4b5563').text(`Role: ${data.signatoryDesignation}`, MARGIN + 8, y + 27);
      }
      if (data.firstPartyContact) doc.font('Helvetica').fontSize(7).fillColor('#374151').text(`📞 ${data.firstPartyContact}`, MARGIN + 8, y + 37);
      if (data.firstPartyAddress) doc.font(getFont(data.firstPartyAddress)).fontSize(6.5).fillColor('#6b7280').text(data.firstPartyAddress, MARGIN + 8, y + 47, { width: partyBoxW - 16, ellipsis: true });

      // Second Party Box
      const p2x = MARGIN + partyBoxW + 12;
      doc.rect(p2x, y, partyBoxW, partyBoxH).fill('#f0fdf4').stroke('#bbf7d0').lineWidth(0.75);
      doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(6.5).text('SECOND PARTY (CLIENT / PARTY B)', p2x + 8, y + 6);
      doc.fillColor('#111827').font(getFont(data.secondPartyName, true)).fontSize(8.5).text(data.secondPartyName, p2x + 8, y + 16);
      if (data.secondPartyContact) doc.font('Helvetica').fontSize(7).fillColor('#374151').text(`📞 ${data.secondPartyContact}`, p2x + 8, y + 30);
      if (data.secondPartyAddress) doc.font(getFont(data.secondPartyAddress)).fontSize(6.5).fillColor('#6b7280').text(data.secondPartyAddress, p2x + 8, y + 42, { width: partyBoxW - 16, ellipsis: true });

      y += partyBoxH + 12;

      // ─────────────────────────────────────────────────────────────
      // Terms & Conditions Body
      // ─────────────────────────────────────────────────────────────
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(9.5)
        .text('TERMS, CONDITIONS & BINDING CLAUSES', MARGIN, y);
      y = doc.y + 3;
      doc.moveTo(MARGIN, y).lineTo(MARGIN + 180, y).lineWidth(0.8).strokeColor('#be123c').stroke();
      y += 8;

      const paragraphs = data.termsContent.split('\n').filter(p => p.trim());

      for (const para of paragraphs) {
        if (doc.y > TEXT_BOTTOM - 25) {
          drawSignatureFooter(currentPage);
          doc.addPage();
          currentPage++;
          doc.y = MARGIN + 10;
        }

        const isDivider = /^[-─—=]{3,}$/.test(para.trim());
        if (isDivider) {
          doc.moveTo(MARGIN, doc.y + 4).lineTo(PAGE_W - MARGIN, doc.y + 4).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
          doc.moveDown(0.6);
          continue;
        }

        const paraFont = getFont(para.trim(), /^[0-9१-९]+\./.test(para.trim()));
        doc.font(paraFont).fillColor('#1f2937').fontSize(9)
          .text(para.trim(), MARGIN, doc.y, { width: CONTENT_W, lineGap: 2 });
        doc.moveDown(0.35);
      }

      // ─────────────────────────────────────────────────────────────
      // Commercials & Geolocation Summary
      // ─────────────────────────────────────────────────────────────
      if (doc.y > TEXT_BOTTOM - 70) {
        drawSignatureFooter(currentPage);
        doc.addPage();
        currentPage++;
        doc.y = MARGIN + 10;
      }

      doc.moveDown(0.5);
      const metaBoxY = doc.y;
      doc.rect(MARGIN, metaBoxY, CONTENT_W, 40).fill('#f8fafc').stroke('#e2e8f0').lineWidth(0.75);

      let mY = metaBoxY + 6;
      if (data.paymentTerms) {
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('PAYMENT TERMS:', MARGIN + 8, mY);
        doc.font(getFont(data.paymentTerms)).fillColor('#1e293b').fontSize(7.5).text(data.paymentTerms, MARGIN + 105, mY, { width: CONTENT_W - 115 });
        mY += 11;
      }
      if (data.validityPeriod) {
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('SLA / VALIDITY:', MARGIN + 8, mY);
        doc.font(getFont(data.validityPeriod)).fillColor('#1e293b').fontSize(7.5).text(data.validityPeriod, MARGIN + 105, mY, { width: CONTENT_W - 115 });
        mY += 11;
      }
      if (data.geoAddress) {
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5).text('GPS AUDIT LOG:', MARGIN + 8, mY);
        doc.font('Helvetica').fillColor('#475569').fontSize(7).text(
          `${data.geoAddress}${data.geoLat ? ` (${data.geoLat.toFixed(4)}°N, ${data.geoLng?.toFixed(4)}°E)` : ''}`,
          MARGIN + 105, mY, { width: CONTENT_W - 115 }
        );
      }

      doc.y = metaBoxY + 46;

      // SHA-256 Seal
      if (doc.y > TEXT_BOTTOM - 50) {
        drawSignatureFooter(currentPage);
        doc.addPage();
        currentPage++;
        doc.y = MARGIN + 10;
      }

      const hashY = doc.y;
      doc.rect(MARGIN, hashY, CONTENT_W, 28).fill('#f1f5f9').stroke('#cbd5e1').lineWidth(0.5);
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(6).text('SHA-256 CRYPTOGRAPHIC DIGITAL FOOTPRINT (TAMPER-PROOF AUDIT SEAL)', MARGIN + 6, hashY + 4);
      doc.fillColor('#1e3a5f').font('Helvetica').fontSize(6.5).text(data.digitalHash.toUpperCase(), MARGIN + 6, hashY + 12, { characterSpacing: 0.5 });
      doc.fillColor('#64748b').fontSize(5.5).text(`Verify instantly at: ${verificationUrl}`, MARGIN + 6, hashY + 20);

      drawSignatureFooter(currentPage, 'MAIN CONTRACT EXECUTION & ATTESTATION');

      // ─────────────────────────────────────────────────────────────
      // ATTACHED APPENDIX: MASTER TERMS OF SERVICE & PRIVACY POLICY
      // ─────────────────────────────────────────────────────────────
      if (data.attachLegalAppendix !== false) {
        doc.addPage();
        currentPage++;

        let appY = MARGIN;

        // Appendix Header Banner
        doc.rect(MARGIN, appY, CONTENT_W, 28).fill('#0f172a');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10.5)
          .text('APPENDIX: MASTER TERMS OF SERVICE & DATA PRIVACY POLICY', MARGIN, appY + 5, { width: CONTENT_W, align: 'center' });
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5)
          .text('Governed under Information Technology Act 2000 (India) & Digital Personal Data Protection (DPDP) Act', MARGIN, appY + 17, { width: CONTENT_W, align: 'center' });

        appY += 38;

        const clauses = [
          {
            title: '1. LEGAL ENFORCEABILITY & ELECTRONIC SIGNATURES (विधिक वैधता एवं ई-हस्ताक्षर)',
            body: 'This electronic contract constitutes a legally binding and enforceable electronic record pursuant to Section 4 and Section 10A of the Information Technology Act, 2000 (India). All cryptographic SHA-256 signature hashes, timestamp logs, and high-accuracy GPS coordinates embedded herein provide irreversible non-repudiation proof.'
          },
          {
            title: '2. DEFERRED SETTLEMENT & WORK FIRST, PAY LATER OBLIGATIONS (भुगतान दायित्व)',
            body: 'Where services are rendered under deferred milestone or post-delivery structures, the Client (Second Party) is legally obligated to clear invoice dues within the stipulated timeframe following deliverable submission. Default in payment attracts 1.5% per month late interest and automatic revocation of intellectual property usage licenses.'
          },
          {
            title: '3. DATA PROTECTION, PRIVACY & CONFIDENTIALITY (DPDP / GDPR अनुपालन)',
            body: 'Both parties agree to treat all business information, pricing, client lists, and technical documentation as confidential. In accordance with the Digital Personal Data Protection (DPDP) Act (India) and GDPR principles, personal data collected during contract execution is stored in encrypted form (AES-256) solely for legal attestation and is never sold or shared with third parties.'
          },
          {
            title: '4. WARRANTIES, DEFECT REMEDIES & SLA (वारंटी एवं सेवा स्तर)',
            body: 'The Service Provider guarantees that deliverables conform to the agreed scope of work. Any functional bugs or defects reported within the agreed warranty window shall be rectified without additional cost. Third-party infrastructure, government fees, and cloud licenses are excluded.'
          },
          {
            title: '5. DISPUTE RESOLUTION & EXCLUSIVE JURISDICTION (विवाद समाधान एवं क्षेत्राधिकार)',
            body: 'Any dispute arising out of or in connection with this agreement shall first be attempted to be resolved amicably through mutual discussion within 30 days. Failing settlement, the dispute shall be referred to binding arbitration in New Delhi, India, in accordance with the Arbitration and Conciliation Act, 1996.'
          }
        ];

        for (const cl of clauses) {
          if (appY > TEXT_BOTTOM - 40) {
            drawSignatureFooter(currentPage, 'LEGAL APPENDIX ATTESTATION BLOCK');
            doc.addPage();
            currentPage++;
            appY = MARGIN;
          }

          const clTitleFont = getFont(cl.title, true);
          doc.font(clTitleFont).fillColor('#1e293b').fontSize(8.5)
            .text(cl.title, MARGIN, appY, { width: CONTENT_W });
          appY = doc.y + 3;

          const clBodyFont = getFont(cl.body, false);
          doc.font(clBodyFont).fillColor('#475569').fontSize(7.5)
            .text(cl.body, MARGIN, appY, { width: CONTENT_W, lineGap: 2 });
          appY = doc.y + 8;
        }

        drawSignatureFooter(currentPage, 'LEGAL APPENDIX ATTESTATION BLOCK — HMorix Legal Infrastructure');
      }

      doc.end();

    } catch (err) {
      reject(err);
    }
  });
}
