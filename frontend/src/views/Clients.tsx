import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, Users, Phone, Mail, MapPin, Building, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  company_name: string | null;
  tax_id: string | null;
  address: string;
  phone: string | null;
  created_at: string;
}

export const Clients: React.FC = () => {
  const { apiFetch } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/clients');
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const openCreateModal = () => {
    setSelectedClient(null);
    setName('');
    setEmail('');
    setCompanyName('');
    setTaxId('');
    setAddress('');
    setPhone('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setName(client.name);
    setEmail(client.email);
    setCompanyName(client.company_name || '');
    setTaxId(client.tax_id || '');
    setAddress(client.address);
    setPhone(client.phone || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      email,
      companyName,
      taxId,
      address,
      phone
    };

    try {
      if (selectedClient) {
        await apiFetch(`/api/clients/${selectedClient.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/clients', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message || 'Failed to save client details.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client? All associated invoices will also be removed.')) return;
    try {
      await apiFetch(`/api/clients/${id}`, {
        method: 'DELETE'
      });
      fetchClients();
    } catch (err) {
      console.error('Failed to delete client:', err);
      alert('Error: Failed to delete client.');
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company_name && c.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredClients.length / PAGE_SIZE) || 1;
  const paginatedClients = filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 700 }} className="text-gradient">
            Client Registry
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Manage and index your customer billing profiles.
          </p>
        </div>
        <button className="btn btn-primary hide-mobile" onClick={openCreateModal}>
          <Plus size={16} />
          <span>New Client</span>
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by name, email or company..."
          className="form-input"
          style={{ paddingLeft: '40px', width: '100%' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Clients Body */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ height: '70px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="pulse-glow"></div>
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="desktop-table table-scroll">
            <div className="custom-table-container fade-in">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name &amp; Contact</th>
                    <th>Company</th>
                    <th>Tax ID</th>
                    <th>Address</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{client.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} /> {client.email}
                          </span>
                          {client.phone && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} /> {client.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {client.company_name ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={14} color="var(--text-secondary)" />
                            {client.company_name}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {client.tax_id ? (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{client.tax_id}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {client.address}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openEditModal(client)} title="Edit Client"><Edit2 size={14} /></button>
                          <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(client.id)} title="Delete Client"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-card-list" style={{ gap: '12px' }}>
            {paginatedClients.map((client) => (
              <div key={client.id} className="invoice-mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '0.9rem', flexShrink: 0 }}>
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }} className="text-truncate">{client.name}</div>
                      {client.company_name && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} className="text-truncate">{client.company_name}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn btn-secondary" style={{ padding: '7px 10px' }} onClick={() => openEditModal(client)}><Edit2 size={14} /></button>
                    <button className="btn btn-danger" style={{ padding: '7px 10px' }} onClick={() => handleDelete(client.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} />{client.email}</span>
                  {client.phone && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} />{client.phone}</span>}
                  {client.address && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={12} /><span className="text-truncate">{client.address}</span></span>}
                </div>
              </div>
            ))}
          </div>

          {/* 50-Item Pagination Bar */}
          {filteredClients.length > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1} – {Math.min(currentPage * PAGE_SIZE, filteredClients.length)} of {filteredClients.length} clients (50 per page)
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={currentPage <= 1}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px' }}>
          <Users size={40} color="var(--text-muted)" />
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>No clients found</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {searchQuery ? 'Try refining your search keyword.' : 'Get started by creating your first client profile.'}
            </p>
          </div>
          {!searchQuery && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              <span>Create First Client</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile FAB */}
      <button className="fab" onClick={openCreateModal} title="Add Client">
        <Plus size={22} />
      </button>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box fade-in" style={{ maxWidth: '540px' }} onClick={e => e.stopPropagation()}>

            {/* Modal Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {selectedClient ? 'Edit Client Profile' : 'Register New Client'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Client Name *</label>
                  <input type="text" required placeholder="Jane Doe" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Email *</label>
                  <input type="email" required placeholder="jane@example.com" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Company Name</label>
                  <input type="text" placeholder="Acme Trading LLC" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tax ID / VAT</label>
                  <input type="text" placeholder="US12345678" className="form-input" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <input type="text" placeholder="+1 (555) 019-2834" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Billing Address *</label>
                <textarea
                  required
                  placeholder="123 Main St, Suite 400, New York, NY 10001"
                  className="form-input"
                  rows={3}
                  style={{ resize: 'none', fontFamily: 'var(--font-sans)', width: '100%' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{selectedClient ? 'Save Changes' : 'Create Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};