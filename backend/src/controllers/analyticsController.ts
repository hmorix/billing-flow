import { Response } from 'express';
import { db } from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'Tenant context missing.' });

  try {
    // 1. Total Revenue
    const revenueRes = await db('payments')
      .where({ organization_id: orgId })
      .sum('amount as total');
    const totalRevenue = Number(revenueRes[0]?.total || 0);

    // 2. Outstanding Balance (Sent or Overdue invoices)
    const unpaidInvoices = await db('invoices')
      .where({ organization_id: orgId })
      .whereIn('status', ['sent', 'overdue']);
    
    let outstandingAmount = 0;
    for (const invoice of unpaidInvoices) {
      const items = await db('invoice_items').where({ invoice_id: invoice.id });
      const subtotal = items.reduce((acc, item) => acc + Number(item.quantity) * Number(item.unit_price), 0);
      const discount = Number(invoice.discount || 0);
      const taxableAmount = Math.max(0, subtotal - discount);
      const tax = taxableAmount * (Number(invoice.tax_rate || 0) / 100);
      outstandingAmount += (taxableAmount + tax);
    }

    // 3. SaaS Subscription MRR indicator
    const org = await db('organizations').where({ id: orgId }).first();
    let saasMrr = 0;
    if (org.subscription_plan === 'growth') saasMrr = 49;
    if (org.subscription_plan === 'enterprise') saasMrr = 199;

    // Tenant's own business monthly revenue (paid invoices in current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthlyPaidRes = await db('payments')
      .where({ organization_id: orgId })
      .where('payment_date', '>=', firstDayOfMonth)
      .sum('amount as total');
    const businessMonthlyRevenue = Number(monthlyPaidRes[0]?.total || 0);

    // 4. Invoice distribution by status
    const statusCounts = await db('invoices')
      .where({ organization_id: orgId })
      .select('status')
      .count('id as count')
      .groupBy('status');
    
    const distribution = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    statusCounts.forEach((item: any) => {
      if (item.status in distribution) {
        distribution[item.status as keyof typeof distribution] = Number(item.count);
      }
    });

    // 5. Monthly Revenue for the last 6 months (Independent of SQLite/MySQL SQL syntaxes)
    const graphData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString().split('T')[0];

      const monthPaid = await db('payments')
        .where({ organization_id: orgId })
        .where('payment_date', '>=', startDate)
        .where('payment_date', '<=', endDate)
        .sum('amount as total');

      const monthName = d.toLocaleString('default', { month: 'short' });
      graphData.push({
        name: `${monthName}`,
        revenue: Number(monthPaid[0]?.total || 0)
      });
    }

    // 6. Recent activities feed
    const recentInvoices = await db('invoices')
      .join('clients', 'invoices.client_id', '=', 'clients.id')
      .where('invoices.organization_id', orgId)
      .select('invoices.id', 'invoices.invoice_number', 'invoices.status', 'invoices.created_at', 'clients.name as client_name')
      .orderBy('invoices.created_at', 'desc')
      .limit(5);

    const recentPayments = await db('payments')
      .join('invoices', 'payments.invoice_id', '=', 'invoices.id')
      .where('payments.organization_id', orgId)
      .select('payments.id', 'payments.amount', 'payments.payment_date', 'invoices.invoice_number')
      .orderBy('payments.payment_date', 'desc')
      .limit(5);

    const activities = [
      ...recentInvoices.map((inv: any) => ({
        type: 'invoice_created',
        message: `Invoice ${inv.invoice_number} created for ${inv.client_name}`,
        date: inv.created_at,
        status: inv.status
      })),
      ...recentPayments.map((pay: any) => ({
        type: 'payment_received',
        message: `Payment of $${Number(pay.amount).toFixed(2)} received for ${pay.invoice_number}`,
        date: pay.payment_date,
        status: 'paid'
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // 7. Recent Email Logs for debugging
    const emailLogs = await db('email_logs')
      .where({ organization_id: orgId })
      .orderBy('created_at', 'desc')
      .limit(10);

    return res.json({
      metrics: {
        totalRevenue,
        outstandingAmount,
        saasSubscriptionMrr: saasMrr,
        businessMonthlyRevenue,
        distribution
      },
      graphData,
      activities,
      emailLogs
    });
  } catch (err) {
    console.error('Fetch dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to compile dashboard statistics.' });
  }
}
