import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateInvoicePDF } from '../services/pdfService';
import { sendReminderEmail } from '../services/emailService';

export async function getInvoices(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const invoices = await db('invoices')
      .join('clients', 'invoices.client_id', '=', 'clients.id')
      .where('invoices.organization_id', orgId)
      .select(
        'invoices.*',
        'clients.name as client_name',
        'clients.email as client_email',
        'clients.company_name as client_company'
      )
      .orderBy('invoices.created_at', 'desc');

    return res.json(invoices);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    return res.status(500).json({ error: 'Failed to retrieve invoices.' });
  }
}

export async function getInvoice(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const invoice = await db('invoices')
      .join('clients', 'invoices.client_id', '=', 'clients.id')
      .where({ 'invoices.id': id, 'invoices.organization_id': orgId })
      .select(
        'invoices.*',
        'clients.name as client_name',
        'clients.email as client_email',
        'clients.company_name as client_company',
        'clients.address as client_address'
      )
      .first();

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const items = await db('invoice_items').where({ invoice_id: id });
    return res.json({ ...invoice, items });
  } catch (err) {
    console.error('Fetch invoice details error:', err);
    return res.status(500).json({ error: 'Failed to retrieve invoice details.' });
  }
}

export async function createInvoice(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  const {
    clientId,
    invoiceNumber,
    issueDate,
    dueDate,
    taxRate,
    discount,
    currency,
    notes,
    items
  } = req.body;

  if (!clientId || !issueDate || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Client, dates, and at least one line item are required.' });
  }

  try {
    let finalInvoiceNumber = invoiceNumber;
    
    // Auto-generate invoice number if not provided
    if (!finalInvoiceNumber) {
      const lastInvoice = await db('invoices')
        .where({ organization_id: orgId })
        .orderBy('created_at', 'desc')
        .first();
      
      let nextNum = 1;
      if (lastInvoice) {
        const match = lastInvoice.invoice_number.match(/(\d+)/);
        if (match) {
          nextNum = parseInt(match[0], 10) + 1;
        }
      }
      finalInvoiceNumber = `INV-${String(nextNum).padStart(4, '0')}`;
    } else {
      // Check for duplication
      const existing = await db('invoices')
        .where({ organization_id: orgId, invoice_number: finalInvoiceNumber })
        .first();
      if (existing) {
        return res.status(400).json({ error: `Invoice number ${finalInvoiceNumber} is already in use.` });
      }
    }

    const invoiceId = uuidv4();

    await db.transaction(async (trx) => {
      // 1. Insert invoice
      await trx('invoices').insert({
        id: invoiceId,
        organization_id: orgId,
        client_id: clientId,
        invoice_number: finalInvoiceNumber,
        status: 'draft',
        issue_date: issueDate,
        due_date: dueDate,
        tax_rate: taxRate || 0,
        discount: discount || 0,
        currency: currency || 'USD',
        notes: notes || null,
        created_at: new Date(),
        updated_at: new Date()
      });

      // 2. Insert items
      const itemRows = items.map((item: any) => ({
        id: uuidv4(),
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await trx('invoice_items').insert(itemRows);
    });

    const createdInvoice = await db('invoices').where({ id: invoiceId }).first();
    const createdItems = await db('invoice_items').where({ invoice_id: invoiceId });

    return res.status(201).json({ ...createdInvoice, items: createdItems });
  } catch (err: any) {
    console.error('Create invoice error:', err);
    return res.status(500).json({ error: 'Failed to create invoice.' });
  }
}

export async function updateInvoice(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  const {
    clientId,
    invoiceNumber,
    status,
    issueDate,
    dueDate,
    taxRate,
    discount,
    currency,
    notes,
    items
  } = req.body;

  try {
    const invoice = await db('invoices').where({ id, organization_id: orgId }).first();
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (invoiceNumber && invoiceNumber !== invoice.invoice_number) {
      const existing = await db('invoices')
        .where({ organization_id: orgId, invoice_number: invoiceNumber })
        .whereNot({ id })
        .first();
      if (existing) {
        return res.status(400).json({ error: `Invoice number ${invoiceNumber} is already in use.` });
      }
    }

    await db.transaction(async (trx) => {
      // Update invoice details
      await trx('invoices')
        .where({ id, organization_id: orgId })
        .update({
          client_id: clientId || invoice.client_id,
          invoice_number: invoiceNumber || invoice.invoice_number,
          status: status || invoice.status,
          issue_date: issueDate || invoice.issue_date,
          due_date: dueDate || invoice.due_date,
          tax_rate: taxRate !== undefined ? taxRate : invoice.tax_rate,
          discount: discount !== undefined ? discount : invoice.discount,
          currency: currency || invoice.currency,
          notes: notes !== undefined ? notes : invoice.notes,
          updated_at: new Date()
        });

      // If items provided, replace them
      if (items && Array.isArray(items)) {
        await trx('invoice_items').where({ invoice_id: id }).delete();

        const itemRows = items.map((item: any) => ({
          id: uuidv4(),
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          created_at: new Date(),
          updated_at: new Date()
        }));

        if (itemRows.length > 0) {
          await trx('invoice_items').insert(itemRows);
        }
      }
    });

    const updatedInvoice = await db('invoices').where({ id }).first();
    const updatedItems = await db('invoice_items').where({ invoice_id: id });

    return res.json({ ...updatedInvoice, items: updatedItems });
  } catch (err: any) {
    console.error('Update invoice error:', err);
    return res.status(500).json({ error: 'Failed to update invoice.' });
  }
}

export async function deleteInvoice(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const invoice = await db('invoices').where({ id, organization_id: orgId }).first();
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    await db('invoices').where({ id, organization_id: orgId }).delete();
    return res.json({ message: 'Invoice deleted successfully.' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    return res.status(500).json({ error: 'Failed to delete invoice.' });
  }
}

export async function downloadPDF(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const pdfBuffer = await generateInvoicePDF(id, orgId);
    
    const invoice = await db('invoices').where({ id, organization_id: orgId }).first();
    const fileName = invoice ? `Invoice_${invoice.invoice_number}.pdf` : `Invoice_${id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ error: 'Failed to generate PDF invoice.' });
  }
}

export async function sendReminder(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const result = await sendReminderEmail(id, orgId);
    
    // Change invoice status to 'sent' if it was 'draft'
    const invoice = await db('invoices').where({ id, organization_id: orgId }).first();
    if (invoice && invoice.status === 'draft') {
      await db('invoices').where({ id, organization_id: orgId }).update({ status: 'sent', updated_at: new Date() });
    }

    return res.json({ 
      message: 'Reminder sent successfully.', 
      log: result 
    });
  } catch (err: any) {
    console.error('Send reminder error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reminder email.' });
  }
}

export async function payInvoice(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  const { id } = req.params;
  const { paymentMethod, notes } = req.body;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    const invoice = await db('invoices').where({ id, organization_id: orgId }).first();
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid.' });
    }

    const items = await db('invoice_items').where({ invoice_id: id });
    const subtotal = items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_price), 0);
    const discount = Number(invoice.discount || 0);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * (Number(invoice.tax_rate || 0) / 100);
    const total = taxableAmount + tax;

    await db.transaction(async (trx) => {
      await trx('invoices').where({ id, organization_id: orgId }).update({ status: 'paid', updated_at: new Date() });

      await trx('payments').insert({
        id: uuidv4(),
        organization_id: orgId,
        invoice_id: id,
        amount: total,
        payment_method: paymentMethod || 'cash',
        payment_date: new Date(),
        notes: notes || 'Recorded payment manually',
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    return res.json({ message: 'Invoice marked as paid and payment recorded successfully.' });
  } catch (err) {
    console.error('Pay invoice error:', err);
    return res.status(500).json({ error: 'Failed to record payment.' });
  }
}
