import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, AlertCircle, Calendar, RefreshCw, Mail, Activity, TrendingUp } from 'lucide-react';
import { browserCache } from '../utils/browserCache';

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
  const orgId = organization?.id || 'global';

  const [graphPeriod, setGraphPeriod] = useState<'7d' | '15d' | '1m' | '3m' | '6m'>('6m');

  // Try hydrating synchronously from local browserCache for 0ms initial render
  const initialCache = browserCache.get(`/api/analytics/dashboard?period=6m`, orgId);

  const [metrics, setMetrics] = useState<MetricData | null>(initialCache?.data?.metrics || null);
  const [graphData, setGraphData] = useState<GraphItem[]>(initialCache?.data?.graphData || []);
  const [activities, setActivities] = useState<ActivityItem[]>(initialCache?.data?.activities || []);
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>(initialCache?.data?.emailLogs || []);
  const [isLoading, setIsLoading] = useState(!initialCache?.data);
  const [selectedEmail, setSelectedEmail] = useState<EmailLogItem | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; name: string; revenue: number } | null>(null);

  const fetchDashboardData = async (period = graphPeriod, silent = false) => {
    // Check if we already have cached data in browser storage for this period
    const cached = browserCache.get(`/api/analytics/dashboard?period=${period}`, orgId);
    if (cached?.data) {
      setMetrics(cached.data.metrics || null);
      setGraphData(cached.data.graphData || []);
      setActivities(cached.data.activities || []);
      setEmailLogs(cached.data.emailLogs || []);
      setIsLoading(false);
    } else if (!silent) {
      setIsLoading(true);
    }

    setIsGraphLoading(true);
    try {
      const data = await apiFetch(`/api/analytics/dashboard?period=${period}`);
      if (data) {
        setMetrics(data.metrics || null);
        setGraphData(Array.isArray(data.graphData) ? data.graphData : []);
        setActivities(Array.isArray(data.activities) ? data.activities : []);
        setEmailLogs(Array.isArray(data.emailLogs) ? data.emailLogs : []);
        browserCache.set(`/api/analytics/dashboard?period=${period}`, data, orgId);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setIsLoading(false);
      setIsGraphLoading(false);
    }
  };

  const handlePeriodChange = async (period: '7d' | '15d' | '1m' | '3m' | '6m') => {
    setGraphPeriod(period);
    setHoveredPoint(null);

    // 0ms instant display from browser cache if available
    const cached = browserCache.get(`/api/analytics/dashboard?period=${period}`, orgId);
    if (cached?.data?.graphData) {
      setGraphData(cached.data.graphData);
      if (cached.data.metrics) setMetrics(cached.data.metrics);
    }

    setIsGraphLoading(true);
    try {
      const data = await apiFetch(`/api/analytics/dashboard?period=${period}`);
      if (data?.graphData) {
        setGraphData(data.graphData);
        if (data.metrics) setMetrics(data.metrics);
        browserCache.set(`/api/analytics/dashboard?period=${period}`, data, orgId);
      }
    } catch (err) {
      console.error('Failed to update graph period:', err);
    } finally {
      setIsGraphLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(graphPeriod, true);
  }, [organization?.subscriptionPlan, organization?.id]);

  if (isLoading && !metrics) {
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

  // Robust Graph Calculations with Safe Fallbacks
  const maxRevenue = Math.max(...(graphData.length > 0 ? graphData.map(d => Number(d.revenue) || 0) : [0]), 1000);
  const chartWidth = 560;
  const chartHeight = 200;
  const chartPadding = 30;
  const chartBottomPadding = 35;

  const points = graphData.map((d, i) => {
    const totalCount = graphData.length;
    const x = totalCount > 1 
      ? chartPadding + (i * (chartWidth - 2 * chartPadding)) / (totalCount - 1)
      : chartWidth / 2;
    const rev = Number(d.revenue) || 0;
    const availableHeight = chartHeight - chartPadding - chartBottomPadding;
    const y = chartHeight - chartBottomPadding - (rev * availableHeight) / maxRevenue;
    return { x, y: isNaN(y) ? chartHeight - chartBottomPadding : y, name: d.name, revenue: rev };
  });

  const linePath = points.length > 0
    ? points.reduce((path, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`), '')
    : '';

  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - chartBottomPadding} L ${points[0].x} ${chartHeight - chartBottomPadding} Z`
    : points.length === 1
    ? `M ${points[0].x - 20} ${chartHeight - chartBottomPadding} L ${points[0].x} ${points[0].y} L ${points[0].x + 20} ${chartHeight - chartBottomPadding} Z`
    : '';

  const totalInvoices = metrics && metrics.distribution
    ? (metrics.distribution.draft || 0) + (metrics.distribution.sent || 0) + (metrics.distribution.paid || 0) + (metrics.distribution.overdue || 0)
    : 0;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 3vw, 24px)' }}>

      {/* Title */}
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.75rem)', fontWeight: 700 }} className="text-gradient">
            Financial Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '4px' }}>
            Real-time multi-tenant metrics and analytics feed.
          </p>
        </div>
        <button className="btn btn-secondary" style={{ flexShrink: 0 }} onClick={() => fetchDashboardData()}>
          <RefreshCw size={16} />
          <span className="hide-mobile">Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="stats-grid">
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
              <DollarSign size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</p>
              <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
              <Calendar size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month Collections</p>
              <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.businessMonthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
              <AlertCircle size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</p>
              <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.outstandingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent)', padding: '10px', borderRadius: '10px', flexShrink: 0 }}>
              <RefreshCw size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SaaS MRR</p>
              <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.4rem)', fontWeight: 700, marginTop: '2px' }}>${metrics.saasSubscriptionMrr}/mo</h3>
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

          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px' }}>
            {isGraphLoading && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                color: 'var(--primary)',
                background: 'rgba(99, 102, 241, 0.1)',
                padding: '3px 8px',
                borderRadius: '12px'
              }}>
                <RefreshCw size={10} className="spin" />
                <span>Updating feed...</span>
              </div>
            )}

            {graphData.length > 0 ? (
              <div style={{ width: '100%', position: 'relative' }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--primary)" floodOpacity="0.5" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = chartPadding + ratio * (chartHeight - chartPadding - chartBottomPadding);
                    const val = Math.round(maxRevenue * (1 - ratio));
                    return (
                      <g key={idx}>
                        <line
                          x1={chartPadding}
                          y1={y}
                          x2={chartWidth - chartPadding}
                          y2={y}
                          stroke="rgba(255,255,255,0.05)"
                          strokeDasharray={idx === 4 ? undefined : "3 3"}
                          strokeWidth="1"
                        />
                        <text
                          x={chartPadding - 6}
                          y={y + 3}
                          textAnchor="end"
                          fill="var(--text-muted)"
                          fontSize="7"
                          fontWeight="500"
                        >
                          ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaPath && <path d={areaPath} fill="url(#chart-gradient)" />}

                  {/* Connecting Line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#glow)"
                    />
                  )}

                  {/* Data Points */}
                  {points.map((pt, idx) => {
                    const isHovered = hoveredPoint?.name === pt.name;
                    return (
                      <g
                        key={idx}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Hit target for easier mouse hover */}
                        <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                        
                        {/* Visible circle marker */}
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? "6" : "4"}
                          fill={isHovered ? "var(--primary)" : "var(--bg-secondary)"}
                          stroke={isHovered ? "#fff" : "var(--primary)"}
                          strokeWidth={isHovered ? "3" : "2"}
                          style={{ transition: 'all 0.2s ease' }}
                        />

                        {/* Revenue label on top */}
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fill={isHovered ? "var(--primary)" : "var(--text-primary)"}
                          fontSize={isHovered ? "9" : "8"}
                          fontWeight={isHovered ? "700" : "600"}
                        >
                          ${pt.revenue >= 1000 ? `${(pt.revenue / 1000).toFixed(1)}k` : pt.revenue.toFixed(0)}
                        </text>

                        {/* Period label at bottom */}
                        <text
                          x={pt.x}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          fill={isHovered ? "var(--text-primary)" : "var(--text-muted)"}
                          fontSize="8"
                          fontWeight={isHovered ? "700" : "500"}
                        >
                          {pt.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip Box when Point is Hovered */}
                {hoveredPoint && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--primary)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      pointerEvents: 'none',
                      zIndex: 10
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{hoveredPoint.name}:</span>
                    <strong style={{ color: 'var(--success)' }}>${hoveredPoint.revenue.toLocaleString()}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                <TrendingUp size={24} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>No payment collection records in this period.</p>
              </div>
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
