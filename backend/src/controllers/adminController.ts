import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getPlatformStats(req: AuthenticatedRequest, res: Response) {
  try {
    const orgsCountRes = await db('organizations').count('id as count').first();
    const usersCountRes = await db('users').count('id as count').first();
    const invoicesCountRes = await db('invoices').count('id as count').first();
    const paymentsCountRes = await db('payments').count('id as count').first();
    
    const revenueRes = await db('payments').sum('amount as total').first();
    
    const growthPlansRes = await db('organizations').where({ subscription_plan: 'growth' }).count('id as count').first();
    const enterprisePlansRes = await db('organizations').where({ subscription_plan: 'enterprise' }).count('id as count').first();

    return res.json({
      totalOrganizations: Number(orgsCountRes?.count || 0),
      totalUsers: Number(usersCountRes?.count || 0),
      totalInvoices: Number(invoicesCountRes?.count || 0),
      totalPayments: Number(paymentsCountRes?.count || 0),
      totalRevenue: Number(revenueRes?.total || 0),
      activePaidSubscriptions: Number(growthPlansRes?.count || 0) + Number(enterprisePlansRes?.count || 0),
      growthPlans: Number(growthPlansRes?.count || 0),
      enterprisePlans: Number(enterprisePlansRes?.count || 0)
    });
  } catch (err) {
    console.error('Fetch platform stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform metrics.' });
  }
}

export async function getAllOrganizations(req: AuthenticatedRequest, res: Response) {
  try {
    const orgs = await db('organizations')
      .select('organizations.*')
      .orderBy('organizations.created_at', 'desc');

    // Retrieve user count for each organization
    const orgsWithDetails = await Promise.all(orgs.map(async (org) => {
      const userCountRes = await db('users').where({ organization_id: org.id }).count('id as count').first();
      const invoiceCountRes = await db('invoices').where({ organization_id: org.id }).count('id as count').first();
      const totalPaidRes = await db('payments').where({ organization_id: org.id }).sum('amount as total').first();
      
      return {
        ...org,
        userCount: Number(userCountRes?.count || 0),
        invoiceCount: Number(invoiceCountRes?.count || 0),
        totalPaid: Number(totalPaidRes?.total || 0)
      };
    }));

    return res.json(orgsWithDetails);
  } catch (err) {
    console.error('Fetch all organizations error:', err);
    return res.status(500).json({ error: 'Failed to fetch organizations list.' });
  }
}

export async function updateOrganizationPlan(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { plan, status } = req.body;

  if (!plan || !['free', 'growth', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'Valid plan (free, growth, enterprise) is required.' });
  }

  try {
    const org = await db('organizations').where({ id }).first();
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    await db('organizations')
      .where({ id })
      .update({
        subscription_plan: plan,
        subscription_status: status || (plan === 'free' ? 'none' : 'active'),
        updated_at: new Date()
      });

    return res.json({ message: 'Organization subscription plan updated successfully.' });
  } catch (err) {
    console.error('Update org plan error:', err);
    return res.status(500).json({ error: 'Failed to update organization plan.' });
  }
}

export async function deleteOrganization(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const org = await db('organizations').where({ id }).first();
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    // Cascade delete is handled by database foreign keys (ON DELETE CASCADE)
    await db('organizations').where({ id }).delete();

    return res.json({ message: 'Organization and all associated data deleted successfully.' });
  } catch (err) {
    console.error('Delete organization error:', err);
    return res.status(500).json({ error: 'Failed to delete organization.' });
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await db('users')
      .join('organizations', 'users.organization_id', '=', 'organizations.id')
      .select('users.*', 'organizations.name as organization_name')
      .orderBy('users.created_at', 'desc');

    // Remove password hashes from response
    const sanitizedUsers = users.map(({ password_hash, ...rest }) => rest);

    return res.json(sanitizedUsers);
  } catch (err) {
    console.error('Fetch all users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users list.' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.role === 'superadmin' && user.email === 'admin@billingflow.com') {
      return res.status(400).json({ error: 'Default system super-administrator cannot be deleted.' });
    }

    await db('users').where({ id }).delete();
    return res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
}

export async function getAllInvoices(req: AuthenticatedRequest, res: Response) {
  try {
    const invoices = await db('invoices')
      .join('organizations', 'invoices.organization_id', '=', 'organizations.id')
      .join('clients', 'invoices.client_id', '=', 'clients.id')
      .select(
        'invoices.*',
        'organizations.name as organization_name',
        'clients.name as client_name'
      )
      .orderBy('invoices.created_at', 'desc');

    const invoicesWithDetails = await Promise.all(invoices.map(async (inv) => {
      const items = await db('invoice_items').where({ invoice_id: inv.id });
      const subtotal = items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_price), 0);
      const discount = Number(inv.discount || 0);
      const taxableAmount = Math.max(0, subtotal - discount);
      const tax = taxableAmount * (Number(inv.tax_rate || 0) / 100);
      const totalAmount = taxableAmount + tax;

      return {
        ...inv,
        totalAmount
      };
    }));

    return res.json(invoicesWithDetails);
  } catch (err) {
    console.error('Fetch all invoices error:', err);
    return res.status(500).json({ error: 'Failed to fetch invoices list.' });
  }
}

export async function updateInvoiceStatus(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['draft', 'sent', 'paid', 'overdue'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (draft, sent, paid, overdue) is required.' });
  }

  try {
    const invoice = await db('invoices').where({ id }).first();
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    await db('invoices').where({ id }).update({ status, updated_at: new Date() });
    return res.json({ message: 'Invoice status updated successfully.' });
  } catch (err) {
    console.error('Update invoice status error:', err);
    return res.status(500).json({ error: 'Failed to update invoice status.' });
  }
}

export async function deleteInvoice(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const invoice = await db('invoices').where({ id }).first();
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    await db('invoices').where({ id }).delete();
    return res.json({ message: 'Invoice deleted successfully.' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    return res.status(500).json({ error: 'Failed to delete invoice.' });
  }
}

export async function getAllPayments(req: AuthenticatedRequest, res: Response) {
  try {
    const payments = await db('payments')
      .join('organizations', 'payments.organization_id', '=', 'organizations.id')
      .join('invoices', 'payments.invoice_id', '=', 'invoices.id')
      .select(
        'payments.*',
        'organizations.name as organization_name',
        'invoices.invoice_number as invoice_number'
      )
      .orderBy('payments.payment_date', 'desc');

    return res.json(payments);
  } catch (err) {
    console.error('Fetch all payments error:', err);
    return res.status(500).json({ error: 'Failed to fetch payments list.' });
  }
}

export async function deletePayment(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  try {
    const payment = await db('payments').where({ id }).first();
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    // Rollback invoice paid status to 'sent' if it was marked paid
    const invoice = await db('invoices').where({ id: payment.invoice_id }).first();
    if (invoice && invoice.status === 'paid') {
      await db('invoices').where({ id: payment.invoice_id }).update({ status: 'sent', updated_at: new Date() });
    }

    await db('payments').where({ id }).delete();
    return res.json({ message: 'Payment record deleted and invoice status rolled back.' });
  } catch (err) {
    console.error('Delete payment error:', err);
    return res.status(500).json({ error: 'Failed to delete payment.' });
  }
}
