import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, AlertCircle, Calendar, RefreshCw, Mail, Activity } from 'lucide-react';

interface MetricData {
  totalRevenue: number;
  outstandingAmount: number;
  saasSubscriptionMrr: number;
  businessMonthlyRevenue: number;
  distribution: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
  };
}

interface GraphItem {
  name: string;
  revenue: number;
}

interface ActivityItem {
  type: string;
  message: string;
  date: string;
  status: string;
}

interface EmailLogItem {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const { apiFetch, organization } = useAuth();
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [graphData, setGraphData] = useState<GraphItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);
  const [graphPeriod, setGraphPeriod] = useState<'7d' | '15d' | '1m' | '3m' | '6m'>('6m');
  const [isGraphLoading, setIsGraphLoading] = useState(false);


  const fetchDashboardData = async (period = graphPeriod) => {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/api/analytics/dashboard?period=${period}`);
      setMetrics(data.metrics);
      setGraphData(data.graphData);
      setActivities(data.activities);
      setEmailLogs(data.emailLogs);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePeriodChange = async (period: '7d' | '15d' | '1m' | '3m' | '6m') => {
    setGraphPeriod(period);
    setIsGraphLoading(true);
    try {
      const data = await apiFetch(`/api/analytics/dashboard?period=${period}`);
      setGraphData(data.graphData);
    } catch (err) {
      console.error('Failed to update graph period:', err);
    } finally {
      setIsGraphLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(graphPeriod);
  }, [organization?.subscriptionPlan]);


  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ width: '200px', height: '28px', background: 'var(--bg-tertiary)', borderRadius: '4px' }} className="pulse-glow"></div>
          <div style={{ width: '100px', height: '36px', background: 'var(--bg-tertiary)', borderRadius: '4px' }} className="pulse-glow"></div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ height: '110px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="pulse-glow"></div>
          ))}
        </div>
        <div className="dashboard-main-grid">
          <div style={{ height: '280px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="pulse-glow"></div>
          <div style={{ height: '280px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} className="pulse-glow"></div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...graphData.map(d => d.revenue), 1000);
  const chartWidth = 500;
  const chartHeight = 180;
  const chartPadding = 25;
  const points = graphData.map((d, i) => {
    const x = chartPadding + (i * (chartWidth - 2 * chartPadding)) / (graphData.length - 1 || 1);
    const y = chartHeight - chartPadding - (d.revenue * (chartHeight - 2 * chartPadding)) / maxRevenue;
    return { x, y, name: d.name, revenue: d.revenue };
  });

  const linePath = points.reduce((path, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartPadding} L ${points[0].x} ${chartHeight - chartPadding} Z`
    : '';

  const totalInvoices = metrics
    ? metrics.distribution.draft + metrics.distribution.sent + metrics.distribution.paid + metrics.distribution.overdue
    : 0;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Title */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 700 }} className="text-gradient">
            Financial Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Real-time multi-tenant metrics and analytics feed.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => fetchDashboardData()}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="stats-grid">
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
              <DollarSign size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</p>
              <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
              <Calendar size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month Collections</p>
              <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.businessMonthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
              <AlertCircle size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</p>
              <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
              <RefreshCw size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SaaS MRR</p>
              <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.saasSubscriptionMrr}/mo</h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Chart & Status */}
      <div className="dashboard-main-grid">

        {/* Custom SVG Line Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Invoice Collection History</h4>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              gap: '2px'
            }}>
              {[
                { id: '7d', label: '7D' },
                { id: '15d', label: '15D' },
                { id: '1m', label: '1M' },
                { id: '3m', label: '3M' },
                { id: '6m', label: '6M' }
              ].map((p) => (
                <button
                  key={p.id}
                  disabled={isGraphLoading}
                  onClick={() => handlePeriodChange(p.id as any)}
                  style={{
                    background: graphPeriod === p.id ? 'var(--primary)' : 'transparent',
                    color: graphPeriod === p.id ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>


          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '150px' }}>
            {graphData.length > 0 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = chartPadding + ratio * (chartHeight - 2 * chartPadding);
                  return (
                    <line key={idx} x1={chartPadding} y1={y} x2={chartWidth - chartPadding} y2={y}
                      stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  );
                })}

                {areaPath && <path d={areaPath} fill="url(#chart-gradient)" />}

                {linePath && (
                  <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0px 4px 10px rgba(99, 102, 241, 0.5))' }} />
                )}

                {points.map((pt, idx) => (
                  <g key={idx}>
                    <circle cx={pt.x} cy={pt.y} r="4" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2.5" />
                    <text x={pt.x} y={pt.y - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="8" fontWeight="600">
                      ${pt.revenue.toFixed(0)}
                    </text>
                    <text x={pt.x} y={chartHeight - 6} textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontWeight="500">
                      {pt.name}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No data points available yet.</p>
            )}
          </div>
        </div>

        {/* Invoice Status Distribution */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Invoice Status</h4>

          {metrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {[
                { label: 'Paid', count: metrics.distribution.paid, color: 'var(--success)' },
                { label: 'Sent / Pending', count: metrics.distribution.sent, color: 'var(--primary)' },
                { label: 'Overdue', count: metrics.distribution.overdue, color: 'var(--danger)' },
                { label: 'Drafts', count: metrics.distribution.draft, color: 'var(--warning)' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }}></span>
                      {item.label}
                    </span>
                    <span style={{ fontWeight: 600 }}>{item.count} / {totalInvoices}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${totalInvoices ? (item.count / totalInvoices) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: '3px', transition: 'width 0.6s ease' }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Activity & Email Logs */}
      <div className="dashboard-activity-grid">

        {/* Recent Activities */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--primary)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Activities</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {activities.length > 0 ? (
              activities.map((act, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', gap: '8px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem' }} className="text-truncate">{act.message}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{new Date(act.date).toLocaleString()}</span>
                  </div>
                  <span className={`badge ${act.status === 'paid' ? 'badge-success' : act.status === 'overdue' ? 'badge-danger' : act.status === 'sent' ? 'badge-info' : 'badge-warning'}`} style={{ flexShrink: 0 }}>
                    {act.status}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>

        {/* Email Reminder Logs */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="var(--accent)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Sent Reminder Logs</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', maxHeight: '280px' }}>
            {emailLogs.length > 0 ? (
              emailLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedEmail(log)}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '4px',
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    cursor: 'pointer', transition: 'border-color var(--transition-fast)'
                  }}
                  onTouchStart={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onTouchEnd={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, gap: '8px' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }} className="text-truncate">To: {log.to_email}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', flexShrink: 0 }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }} className="text-truncate">
                    {log.subject}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No reminder emails sent yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Inspection Modal */}
      {selectedEmail && (
        <div className="modal-overlay" onClick={() => setSelectedEmail(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Sent Reminder Details</h4>
              <button
                onClick={() => setSelectedEmail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '4px', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
              <p><strong style={{ color: 'var(--text-secondary)' }}>Recipient:</strong> {selectedEmail.to_email}</p>
              <p><strong style={{ color: 'var(--text-secondary)' }}>Subject:</strong> {selectedEmail.subject}</p>
              <p><strong style={{ color: 'var(--text-secondary)' }}>Sent Date:</strong> {new Date(selectedEmail.created_at).toLocaleString()}</p>

              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)', padding: '14px', fontSize: '0.85rem',
                fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginTop: '8px',
                color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: '200px', overflowY: 'auto'
              }}>
                {selectedEmail.body}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedEmail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
