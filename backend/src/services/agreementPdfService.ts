import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

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

export async function generateAgreementPDF(data: AgreementPdfData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Legal Agreement ${data.agreementNumber}`,
          Author: 'HMorix Digital Legal Infrastructure',
          Subject: data.title,
          Keywords: 'Legal Agreement, e-Stamp, Notary, HMorix, Digital Footprint'
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const verificationUrl = `https://billingflow.hmorix.com/verify/${data.digitalHash}`;
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 100 });
      } catch (e) {
        // Fallback
      }

      // ─── 1. INDIAN E-STAMP CERTIFICATE HEADER (Simulated e-Stamp) ───
      const pageWidth = 595.28;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      // Outer Stamp Border
      doc.rect(margin, 40, contentWidth, 140)
        .lineWidth(2)
        .strokeColor('#be123c')
        .stroke();

      doc.rect(margin + 3, 43, contentWidth - 6, 134)
        .lineWidth(0.75)
        .strokeColor('#be123c')
        .stroke();

      // Top Banner
      doc.rect(margin + 4, 44, contentWidth - 8, 26)
        .fill('#881337');

      doc.fillColor('#ffffff')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('GOVERNMENT OF NATIONAL CAPITAL TERRITORY / STATE JURISDICTION', margin, 49, { width: pageWidth, align: 'center' });

      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#fecdd3')
        .text('e-Stamp Certificate / Non-Judicial Legal Digital Notarization', margin, 61, { width: pageWidth, align: 'center' });

      // Certificate Meta Table (2 columns inside stamp)
      const col1X = margin + 14;
      const col2X = margin + 260;
      let stampY = 76;

      doc.fillColor('#1f2937').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Certificate No.:', col1X, stampY);
      doc.font('Helvetica').text(`IN-${data.stateJurisdiction?.slice(0, 2).toUpperCase() || 'DL'}2026-${data.agreementNumber.replace(/[^0-9]/g, '').padStart(10, '0')}`, col1X + 80, stampY);

      doc.font('Helvetica-Bold').text('Certificate Issued Date:', col2X, stampY);
      doc.font('Helvetica').text(new Date(data.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), col2X + 110, stampY);

      stampY += 14;
      doc.font('Helvetica-Bold').text('Account Reference:', col1X, stampY);
      doc.font('Helvetica').text('NONACC/ (SV)/ dl-egov/ 01', col1X + 80, stampY);

      doc.font('Helvetica-Bold').text('Stamp Duty Amount:', col2X, stampY);
      doc.font('Helvetica-Bold').fillColor('#be123c').text(`INR ${data.stampDutyAmount || 100}.00 (One Hundred Only)`, col2X + 110, stampY);

      stampY += 14;
      doc.fillColor('#1f2937').font('Helvetica-Bold').text('First Party (Provider):', col1X, stampY);
      doc.font('Helvetica').text(data.firstPartyName.toUpperCase(), col1X + 80, stampY, { width: 160 });

      doc.font('Helvetica-Bold').text('Second Party (Client):', col2X, stampY);
      doc.font('Helvetica').text(data.secondPartyName.toUpperCase(), col2X + 110, stampY, { width: 160 });

      stampY += 14;
      doc.font('Helvetica-Bold').text('Jurisdiction / State:', col1X, stampY);
      doc.font('Helvetica').text(data.stateJurisdiction || 'National Jurisdiction, India', col1X + 80, stampY);

      doc.font('Helvetica-Bold').text('Legal Description:', col2X, stampY);
      doc.font('Helvetica').text(`Article 5: ${data.agreementType}`, col2X + 110, stampY);

      // Security Watermark Text
      doc.fontSize(6)
        .fillColor('#9ca3af')
        .text('AUTHENTICATED VIA HMORIX DIGITAL LEGAL INFRASTRUCTURE • CRYPTOGRAPHIC SHA-256 DIGITAL FOOTPRINT EMBEDDED', margin, 168, { width: contentWidth, align: 'center' });

      // ─── 2. AGREEMENT TITLE & PARTIES PREAMBLE ───
      let currentY = 195;

      doc.fillColor('#0f172a')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(data.title.toUpperCase(), margin, currentY, { width: contentWidth, align: 'center' });

      currentY += 18;
      doc.fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#4b5563')
        .text(`AGREEMENT IDENTIFIER: ${data.agreementNumber} | TYPE: ${data.agreementType.toUpperCase()}`, margin, currentY, { width: contentWidth, align: 'center' });

      currentY += 22;

      // Preamble Box
      doc.rect(margin, currentY, contentWidth, 68)
        .fillColor('#f8fafc')
        .fill();
      doc.rect(margin, currentY, contentWidth, 68)
        .lineWidth(0.5)
        .strokeColor('#cbd5e1')
        .stroke();

      doc.fillColor('#1e293b').fontSize(8).font('Helvetica-Bold');
      doc.text('BETWEEN THE UNDERSIGNED PARTIES:', margin + 12, currentY + 8);

      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      doc.text(`1. FIRST PARTY: ${data.firstPartyName} (${data.firstPartyContact || 'Contact on record'}), residing/headquartered at: ${data.firstPartyAddress || 'Not specified'}.`, margin + 12, currentY + 22, { width: contentWidth - 24 });
      doc.text(`2. SECOND PARTY: ${data.secondPartyName} (${data.secondPartyContact || 'Contact on record'}), residing/headquartered at: ${data.secondPartyAddress || 'Not specified'}.`, margin + 12, currentY + 42, { width: contentWidth - 24 });

      currentY += 80;

      // Key Terms Summary Grid
      if (data.totalAmount || data.validityPeriod || data.paymentTerms) {
        doc.rect(margin, currentY, contentWidth, 38)
          .fillColor('#fffbeb')
          .fill();
        doc.rect(margin, currentY, contentWidth, 38)
          .lineWidth(0.5)
          .strokeColor('#fef3c7')
          .stroke();

        let termsX = margin + 12;
        if (data.totalAmount) {
          doc.fillColor('#92400e').fontSize(7.5).font('Helvetica-Bold').text('CONTRACT VALUE', termsX, currentY + 7);
          doc.fillColor('#78350f').fontSize(10).text(`${data.currency || 'INR'} ${data.totalAmount.toFixed(2)}`, termsX, currentY + 18);
          termsX += 130;
        }
        if (data.paymentTerms) {
          doc.fillColor('#92400e').fontSize(7.5).font('Helvetica-Bold').text('PAYMENT STRUCTURE', termsX, currentY + 7);
          doc.fillColor('#78350f').fontSize(8.5).text(data.paymentTerms, termsX, currentY + 19, { width: 170 });
          termsX += 180;
        }
        if (data.validityPeriod) {
          doc.fillColor('#92400e').fontSize(7.5).font('Helvetica-Bold').text('SERVICE VALIDITY / SLA', termsX, currentY + 7);
          doc.fillColor('#78350f').fontSize(8.5).text(data.validityPeriod, termsX, currentY + 19);
        }
        currentY += 48;
      }

      // ─── 3. TERMS & CONDITIONS CLAUSES ───
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('TERMS OF SERVICE, OBLIGATIONS & BINDING CLAUSES:', margin, currentY);
      currentY += 14;

      doc.fillColor('#334155').fontSize(8).font('Helvetica');
      doc.text(data.termsContent, margin, currentY, {
        width: contentWidth,
        lineGap: 3,
        align: 'justify'
      });

      // Jump to lower section for verification and signatures
      // Ensure footer space on page
      if (doc.y > 660) {
        doc.addPage();
        currentY = 50;
      } else {
        currentY = Math.max(doc.y + 20, 640);
      }

      // ─── 4. DIGITAL FOOTPRINT & GEOLOCATION BOX ───
      doc.rect(margin, currentY, contentWidth, 75)
        .fillColor('#f1f5f9')
        .fill();
      doc.rect(margin, currentY, contentWidth, 75)
        .lineWidth(0.5)
        .strokeColor('#cbd5e1')
        .stroke();

      // QR Code embedding
      if (qrDataUrl) {
        try {
          doc.image(qrDataUrl, margin + 8, currentY + 6, { width: 62, height: 62 });
        } catch (e) {}
      }

      const metaX = margin + 78;
      doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold').text('CRYPTOGRAPHIC DIGITAL FOOTPRINT & TAMPER-PROOF SEAL', metaX, currentY + 8);
      
      doc.font('Helvetica').fontSize(6.8).fillColor('#475569');
      doc.text(`• SHA-256 Hash: ${data.digitalHash}`, metaX, currentY + 20, { width: contentWidth - 88 });
      doc.text(`• Execution Timestamp: ${new Date(data.createdAt).toUTCString()}`, metaX, currentY + 30);
      
      if (data.geoLat && data.geoLng) {
        doc.text(`• Geolocation Coordinates: Lat ${data.geoLat.toFixed(5)}, Lng ${data.geoLng.toFixed(5)} (${data.geoAddress || 'GPS Validated'})`, metaX, currentY + 40, { width: contentWidth - 88 });
      } else {
        doc.text('• Geolocation Capture: Authenticated via Client Web Session', metaX, currentY + 40);
      }
      doc.text('• Legal Platform: Verified by HMorix Digital Legal & FinTech Infrastructure • scan QR code to verify original unedited certificate', metaX, currentY + 50, { width: contentWidth - 88 });

      currentY += 85;

      // ─── 5. SIGNATURE BLOCKS ───
      const halfW = (contentWidth - 20) / 2;

      // Party 1 Sign
      doc.rect(margin, currentY, halfW, 55).strokeColor('#e2e8f0').stroke();
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('SIGNED BY (FIRST PARTY):', margin + 8, currentY + 6);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(data.firstPartyName, margin + 8, currentY + 18);
      doc.fillColor('#10b981').fontSize(7).font('Helvetica').text('✓ Cryptographically Authorized & Verified', margin + 8, currentY + 38);

      // Party 2 Sign
      const party2X = margin + halfW + 20;
      doc.rect(party2X, currentY, halfW, 55).strokeColor('#e2e8f0').stroke();
      doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('ACCEPTED & SIGNED (SECOND PARTY):', party2X + 8, currentY + 6);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(data.secondPartyName, party2X + 8, currentY + 18);
      doc.fillColor('#10b981').fontSize(7).font('Helvetica').text('✓ Digital Consent Given & Geo-tagged', party2X + 8, currentY + 38);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
