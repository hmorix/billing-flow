import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Building, Users, FileSpreadsheet, DollarSign, Check, Trash2, Save, RefreshCw, AlertTriangle } from 'lucide-react';

interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  totalInvoices: number;
  totalPayments: number;
  totalRevenue: number;
  activePaidSubscriptions: number;
  growthPlans: number;
  enterprisePlans: number;
}

interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  userCount: number;
  invoiceCount: number;
  totalPaid: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_name: string;
  created_at: string;
}

interface AdminInvoice {
  id: string;
  invoice_number: string;
  organization_name: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  totalAmount: number;
  status: string;
}

interface AdminPayment {
  id: string;
  organization_name: string;
  invoice_number: string;
  amount: number;
  payment_method: string;
  payment_date: string;
}

export const Admin: React.FC = () => {
  const { apiFetch, user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'orgs' | 'users' | 'invoices' | 'payments'>('overview');
  
  // Data lists
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editing states
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editingOrgPlan, setEditingOrgPlan] = useState('');
  const [editingOrgStatus, setEditingOrgStatus] = useState('');

  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editingInvoiceStatus, setEditingInvoiceStatus] = useState('');

  const loadStats = async () => {
    try {
      const data = await apiFetch('/api/admin/stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform stats.');
    }
  };

  const loadOrgs = async () => {
    try {
      const data = await apiFetch('/api/admin/organizations');
      setOrgs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations.');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/api/admin/users');
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await apiFetch('/api/admin/invoices');
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices.');
    }
  };

  const loadPayments = async () => {
    try {
      const data = await apiFetch('/api/admin/payments');
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.');
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await loadStats();
      if (activeSubTab === 'orgs') await loadOrgs();
      if (activeSubTab === 'users') await loadUsers();
      if (activeSubTab === 'invoices') await loadInvoices();
      if (activeSubTab === 'payments') await loadPayments();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [activeSubTab]);

  // Actions
  const handleSaveOrgPlan = async (orgId: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch(`/api/admin/organizations/${orgId}/plan`, {
        method: 'PUT',
        body: JSON.stringify({
          plan: editingOrgPlan,
          status: editingOrgStatus
        })
      });
      setSuccessMsg('Organization subscription plan updated.');
      setEditingOrgId(null);
      loadOrgs();
      loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to update plan.');
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to delete organization "${orgName}"?\nThis will remove all associated users, clients, invoices, and payments permanently!`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch(`/api/admin/organizations/${orgId}`, {
        method: 'DELETE'
      });
      setSuccessMsg(`Organization "${orgName}" deleted.`);
      loadOrgs();
      loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to delete organization.');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove user "${email}"?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      setSuccessMsg(`User "${email}" deleted.`);
      loadUsers();
      loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const handleSaveInvoiceStatus = async (invoiceId: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch(`/api/admin/invoices/${invoiceId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editingInvoiceStatus
        })
      });
      setSuccessMsg('Invoice status updated.');
      setEditingInvoiceId(null);
      loadInvoices();
    } catch (err: any) {
      setError(err.message || 'Failed to update invoice status.');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, num: string) => {
    if (!window.confirm(`Are you sure you want to delete Invoice ${num}?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'DELETE'
      });
      setSuccessMsg(`Invoice ${num} deleted.`);
      loadInvoices();
      loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to delete invoice.');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This will roll back the invoice status.')) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch(`/api/admin/payments/${paymentId}`, {
        method: 'DELETE'
      });
      setSuccessMsg('Payment record deleted.');
      loadPayments();
      loadStats();
    } catch (err: any) {
      setError(err.message || 'Failed to delete payment.');
    }
  };

  if (user?.role !== 'superadmin') {
    return (
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <AlertTriangle size={48} color="var(--danger)" />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Only global system administrators can access this control panel.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }} className="text-gradient">
            <Shield size={24} color="var(--primary)" />
            <span>Admin Control Panel</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Override settings, modify database tables, and view all tenant registers.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={refreshAll} disabled={isLoading}>
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Message alerts */}
      {error && (
        <div style={{ background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.15)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(0, 0, 0, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        gap: '4px',
        maxWidth: 'fit-content'
      }}>
        {['overview', 'orgs', 'users', 'invoices', 'payments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab as any)}
            style={{
              background: activeSubTab === tab ? 'var(--primary)' : 'transparent',
              color: activeSubTab === tab ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab === 'orgs' ? 'Organizations (Tenants)' : tab}
          </button>
        ))}
      </div>

      {/* Subtab Contents */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ height: '80px', background: 'var(--bg-tertiary)', borderRadius: '12px' }} className="pulse-glow"></div>
          ))}
        </div>
      ) : (
        <div className="fade-in">
          
          {/* 1. OVERVIEW */}
          {activeSubTab === 'overview' && stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
                    <Building size={24} />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Tenants</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>{stats.totalOrganizations}</h3>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(8, 145, 178, 0.08)', color: 'var(--accent)', padding: '12px', borderRadius: '12px' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Users</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>{stats.totalUsers}</h3>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(217, 119, 6, 0.08)', color: 'var(--warning)', padding: '12px', borderRadius: '12px' }}>
                    <FileSpreadsheet size={24} />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Invoices Created</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>{stats.totalInvoices}</h3>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}>
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>Platform Collections</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>${stats.totalRevenue.toFixed(2)}</h3>
                  </div>
                </div>
              </div>

              {/* Subscriptions breakdown */}
              <div className="glass-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>SaaS Subscription Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>Growth Plans ($49/mo)</span>
                      <span style={{ fontWeight: 600 }}>{stats.growthPlans} orgs</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${stats.totalOrganizations ? (stats.growthPlans / stats.totalOrganizations) * 100 : 0}%`, height: '100%', background: 'var(--accent)' }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>Enterprise Plans ($199/mo)</span>
                      <span style={{ fontWeight: 600 }}>{stats.enterprisePlans} orgs</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${stats.totalOrganizations ? (stats.enterprisePlans / stats.totalOrganizations) * 100 : 0}%`, height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ORGANIZATIONS TAB */}
          {activeSubTab === 'orgs' && (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Organization Name</th>
                    <th>Slug</th>
                    <th>Plan Tier</th>
                    <th>Billing Status</th>
                    <th>Users</th>
                    <th>Invoices</th>
                    <th>Collections</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map(org => {
                    const isEditing = editingOrgId === org.id;
                    return (
                      <tr key={org.id}>
                        <td><strong style={{ color: 'var(--text-primary)' }}>{org.name}</strong></td>
                        <td><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{org.slug}</span></td>
                        <td>
                          {isEditing ? (
                            <select
                              value={editingOrgPlan}
                              onChange={(e) => setEditingOrgPlan(e.target.value)}
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '0.85rem', width: '120px' }}
                            >
                              <option value="free">Free</option>
                              <option value="growth">Growth</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          ) : (
                            <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{org.subscription_plan}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              value={editingOrgStatus}
                              onChange={(e) => setEditingOrgStatus(e.target.value)}
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '0.85rem', width: '120px' }}
                            >
                              <option value="none">None</option>
                              <option value="active">Active</option>
                              <option value="canceled">Canceled</option>
                            </select>
                          ) : (
                            <span className={`badge ${org.subscription_status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                              {org.subscription_status}
                            </span>
                          )}
                        </td>
                        <td>{org.userCount}</td>
                        <td>{org.invoiceCount}</td>
                        <td><strong>${org.totalPaid.toFixed(2)}</strong></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {isEditing ? (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '6px 10px' }}
                                onClick={() => handleSaveOrgPlan(org.id)}
                              >
                                <Save size={14} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px' }}
                                onClick={() => {
                                  setEditingOrgId(org.id);
                                  setEditingOrgPlan(org.subscription_plan);
                                  setEditingOrgStatus(org.subscription_status);
                                }}
                              >
                                Edit Plan
                              </button>
                            )}
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 10px' }}
                              onClick={() => handleDeleteOrg(org.id, org.name)}
                              disabled={org.slug === 'system-admin'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. USERS TAB */}
          {activeSubTab === 'users' && (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email Address</th>
                    <th>System Role</th>
                    <th>Organization</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'superadmin' ? 'badge-danger' : u.role === 'admin' ? 'badge-info' : 'badge-warning'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>{u.organization_name}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          disabled={u.email === 'admin@billingflow.com'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. INVOICES TAB */}
          {activeSubTab === 'invoices' && (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Tenant Org</th>
                    <th>Client</th>
                    <th>Issue Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const isEditing = editingInvoiceId === inv.id;
                    return (
                      <tr key={inv.id}>
                        <td><strong>{inv.invoice_number}</strong></td>
                        <td>{inv.organization_name}</td>
                        <td>{inv.client_name}</td>
                        <td>{new Date(inv.issue_date).toLocaleDateString()}</td>
                        <td><strong>$ {inv.totalAmount.toFixed(2)}</strong></td>
                        <td>
                          {isEditing ? (
                            <select
                              value={editingInvoiceStatus}
                              onChange={(e) => setEditingInvoiceStatus(e.target.value)}
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '0.85rem', width: '120px' }}
                            >
                              <option value="draft">Draft</option>
                              <option value="sent">Sent</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          ) : (
                            <span className={`badge ${inv.status === 'paid' ? 'badge-success' : inv.status === 'overdue' ? 'badge-danger' : inv.status === 'sent' ? 'badge-info' : 'badge-warning'}`}>
                              {inv.status}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {isEditing ? (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '6px 10px' }}
                                onClick={() => handleSaveInvoiceStatus(inv.id)}
                              >
                                <Save size={14} />
                              </button>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px' }}
                                onClick={() => {
                                  setEditingInvoiceId(inv.id);
                                  setEditingInvoiceStatus(inv.status);
                                }}
                              >
                                Status
                              </button>
                            )}
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 10px' }}
                              onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. PAYMENTS TAB */}
          {activeSubTab === 'payments' && (
            <div className="custom-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Organization</th>
                    <th>Invoice No.</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id}>
                      <td><span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{pay.id.substring(0, 8)}...</span></td>
                      <td>{pay.organization_name}</td>
                      <td><strong>{pay.invoice_number}</strong></td>
                      <td><strong style={{ color: 'var(--success)' }}>${pay.amount.toFixed(2)}</strong></td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{pay.payment_method}</td>
                      <td>{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px' }}
                          onClick={() => handleDeletePayment(pay.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
