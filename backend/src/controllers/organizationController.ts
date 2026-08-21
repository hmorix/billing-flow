import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import nodemailer from 'nodemailer';

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  const { name, address, taxId, phone } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Organization name is required.' });
  }

  try {
    await db('organizations')
      .where({ id: orgId })
      .update({
        name,
        address: address || null,
        tax_id: taxId || null,
        phone: phone || null,
        updated_at: new Date()
      });

    return res.json({ message: 'Organization profile updated successfully.' });
  } catch (err) {
    console.error('Update org profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function updateSmtp(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = req.body;

  try {
    await db('organizations')
      .where({ id: orgId })
      .update({
        smtp_host: smtpHost || null,
        smtp_port: smtpPort ? Number(smtpPort) : null,
        smtp_user: smtpUser || null,
        smtp_pass: smtpPass || null,
        smtp_from: smtpFrom || null,
        updated_at: new Date()
      });

    return res.json({ message: 'SMTP settings updated successfully.' });
  } catch (err) {
    console.error('Update SMTP config error:', err);
    return res.status(500).json({ error: 'Failed to save SMTP configurations.' });
  }
}

export async function testSmtp(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom } = req.body;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
    return res.status(400).json({ error: 'All SMTP fields (Host, Port, User, Password, From) are required to test.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465, // Use SSL/TLS for 465, STARTTLS for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false // Avoid local certificate handshake failures
      }
    });

    await transporter.sendMail({
      from: `"${req.user?.name} via BillingFlow" <${smtpFrom}>`,
      to: req.user?.email,
      subject: 'BillingFlow SMTP Connection Test',
      text: 'Congratulations! Your SMTP settings are correctly configured. You can now send real invoice reminder emails to your clients.',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #6366f1;">BillingFlow SMTP Connection Test</h2>
          <p>Congratulations! Your SMTP connection settings are configured correctly. You can now send real invoice reminders to your clients.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8rem; color: #888;">This was sent automatically from your profile settings check.</p>
        </div>
      `
    });

    return res.json({ message: 'Test email successfully dispatched! Check your mailbox.' });
  } catch (err: any) {
    console.error('SMTP test failed:', err);
    return res.status(400).json({ error: err.message || 'SMTP test connection failed. Verify host credentials.' });
  }
}

export async function uploadLogo(req: AuthenticatedRequest, res: Response) {
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  console.log('req.user:', req.user);
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  if (!req.file) {
    return res.status(400).json({ error: 'No logo image file was uploaded.' });
  }

  try {
    const publicUrl = `/uploads/${req.file.filename}`;

    await db('organizations')
      .where({ id: orgId })
      .update({
        logo_url: publicUrl,
        updated_at: new Date()
      });

    return res.json({ logoUrl: publicUrl, message: 'Company logo uploaded and configured.' });
  } catch (err) {
    console.error('Save logo URL error:', err);
    return res.status(500).json({ error: 'Failed to record logo configuration path.' });
  }
}
