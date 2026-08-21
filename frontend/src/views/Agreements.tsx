import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Plus, Search, ShieldCheck, Download, Share2, Trash2,
  ExternalLink, MapPin, Eye, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { shareViaWhatsApp, generateAgreementWhatsAppText } from '../utils/whatsappService';
import { formatCurrency, type SupportedCurrency } from '../utils/i18n';
import { AgreementSkeleton } from '../components/skeletons/AgreementSkeleton';

export interface AgreementItem {
  id: string;
  agreement_number: string;
  agreement_type: string;
  title: string;
  first_party_name: string;
  second_party_name: string;
  second_party_contact?: string;
  total_amount?: number;
  currency?: string;
  validity_period?: string;
  state_jurisdiction?: string;
  stamp_duty_amount?: number;
  digital_hash: string;
  geo_address?: string;
  status: string;
  created_at: string;
}

export const Agreements: React.FC = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<AgreementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchAgreements = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/agreements');
      setAgreements(data || []);
    } catch (err) {
      console.error('Failed to load agreements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleDelete = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete legal agreement ${number}?`)) return;
    try {
      await apiFetch(`/api/agreements/${id}`, { method: 'DELETE' });
      fetchAgreements();
    } catch (err: any) {
      alert(`Failed to delete agreement: ${err.message || err}`);
    }
  };

  const handleCopyVerifyUrl = (hash: string) => {
    const url = `${window.location.origin}/verify/${hash}`;
    navigator.clipboard.writeText(url);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleWhatsAppShare = (agr: AgreementItem) => {
    const text = generateAgreementWhatsAppText({
      agreementNumber: agr.agreement_number,
      title: agr.title,
      agreementType: agr.agreement_type,
      firstParty: agr.first_party_name,
      secondParty: agr.second_party_name,
      secondPartyPhone: agr.second_party_contact,
      totalAmount: agr.total_amount ? Number(agr.total_amount) : undefined,
      currency: agr.currency || 'INR',
      validityPeriod: agr.validity_period,
      digitalHash: agr.digital_hash
    });
    shareViaWhatsApp(text, agr.second_party_contact);
  };

  const handleDownloadPdf = async (id: string, number: string) => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const endpoint = `${apiUrl}/api/agreements/${id}/pdf`;
    
    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agreement_${number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(`Error downloading agreement PDF: ${err.message}`);
    }
  };

  const filtered = agreements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.agreement_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.second_party_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.agreement_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <AgreementSkeleton />;
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.75rem)', fontWeight: 700 }} className="text-gradient">
              Digital Legal Agreements &amp; Affidavits
            </h2>
            <span className="badge badge-info hide-mobile" style={{ fontSize: '0.7rem' }}>
              Powered by HMorix Legal
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Bilingual notarized contracts with Indian e-Stamp simulation, live GPS capture &amp; SHA-256 tamper-proof verification.
          </p>
        </div>
        <button className="btn btn-primary hide-mobile" onClick={() => navigate('/agreements/new')}>
          <Plus size={16} />
          <span>New Agreement</span>
        </button>
      </div>

      {/* Trust Notice Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(16,185,129,0.06))',
        border: '1px solid var(--border-color)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={24} color="var(--primary)" />
          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600 }}>Tamper-Evident Cryptographic Seal (SHA-256)</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              All agreements are legally notarized with timestamp, GPS coordinates &amp; QR verification. Valid even after printing.
            </p>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={() => navigate('/agreements/new')}
        >
          <Plus size={14} /> Quick Agreement Creator
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ position: 'relative' }}>
        <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search by title, contract number, party name, or type (Work First Pay Later, 50-50, Affidavit)..."
          className="form-input"
          style={{ paddingLeft: '40px', width: '100%' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Agreements List */}
      {filtered.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="desktop-table table-scroll">
            <div className="custom-table-container fade-in">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ref / Number</th>
                    <th>Agreement Title &amp; Type</th>
                    <th>Parties</th>
                    <th>Value / SLA</th>
                    <th>Digital Stamp</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((agr) => (
                    <tr key={agr.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {agr.agreement_number}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{agr.title}</span>
                          <span className="badge badge-info" style={{ alignSelf: 'flex-start', fontSize: '0.68rem' }}>
                            {agr.agreement_type}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem' }}>
                          <span><strong>1st:</strong> {agr.first_party_name}</span>
                          <span style={{ color: 'var(--text-muted)' }}><strong>2nd:</strong> {agr.second_party_name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {agr.total_amount ? (
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {formatCurrency(agr.total_amount, (agr.currency || 'INR') as SupportedCurrency)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Custom Terms</span>
                          )}
                          {agr.validity_period && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {agr.validity_period}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-success" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={10} /> e-Stamp ₹{agr.stamp_duty_amount || 100}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(agr.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px' }}
                            onClick={() => handleDownloadPdf(agr.id, agr.agreement_number)}
                            title="Download Signed e-Stamp PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', color: '#25D366' }}
                            onClick={() => handleWhatsAppShare(agr)}
                            title="Share via WhatsApp (No Payment Link)"
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px' }}
                            onClick={() => handleCopyVerifyUrl(agr.digital_hash)}
                            title="Copy Public Verification Link"
                          >
                            {copiedHash === agr.digital_hash ? <CheckCircle2 size={14} color="var(--success)" /> : <ExternalLink size={14} />}
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 10px' }}
                            onClick={() => handleDelete(agr.id, agr.agreement_number)}
                            title="Delete Agreement"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="mobile-card-list" style={{ gap: '12px' }}>
            {filtered.map((agr) => (
              <div key={agr.id} className="invoice-mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                      {agr.agreement_number}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '2px' }} className="text-truncate">
                      {agr.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {agr.first_party_name} ➔ {agr.second_party_name}
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                    e-Stamp ₹{agr.stamp_duty_amount || 100}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px solid var(--border-color)' }}>
                  <span>{agr.agreement_type}</span>
                  {agr.total_amount && (
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(agr.total_amount, (agr.currency || 'INR') as SupportedCurrency)}
                    </strong>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleDownloadPdf(agr.id, agr.agreement_number)}>
                    <Download size={14} /> PDF
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#25D366' }} onClick={() => handleWhatsAppShare(agr)}>
                    <Share2 size={14} /> WhatsApp
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleCopyVerifyUrl(agr.digital_hash)}>
                    <ExternalLink size={14} /> Verify Link
                  </button>
                  <button className="btn btn-danger" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(agr.id, agr.agreement_number)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: '16px', textAlign: 'center' }}>
          <FileText size={44} color="var(--text-muted)" />
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>No agreements recorded yet</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', maxWidth: '420px' }}>
              Draft your first legally binding agreement with simulated Indian e-Stamp Paper, GPS geo-tagging, and SHA-256 verification seal.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/agreements/new')}>
            <Plus size={16} />
            <span>Create First Agreement</span>
          </button>
        </div>
      )}

      {/* Mobile FAB */}
      <button className="fab" onClick={() => navigate('/agreements/new')} title="Create Legal Agreement">
        <Plus size={22} />
      </button>

    </div>
  );
};
