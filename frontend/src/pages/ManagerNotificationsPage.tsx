import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ManagerLayout } from '../components/ManagerLayout';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { apiClient } from '../api/client';
import axios from 'axios';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Code2,
  RefreshCw,
  AlertTriangle,
  Bell,
} from 'lucide-react';

export interface BackendNotification {
  id: number;
  order_id: number | null;
  message: string;
  channel: string;
  is_ai_generated: boolean;
  sent_at: string | null;
}

export interface BackendOrderSummary {
  id: number;
  order_code: string;
  tracking_uuid: string;
  customer_name: string | null;
  customer_phone: string | null;
  drop_address: string | null;
}

export const ManagerNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);
  const [orders, setOrders] = useState<BackendOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [aiOnly, setAiOnly] = useState(false);
  const [filterChannel, setFilterChannel] = useState<'all' | 'SMS' | 'WhatsApp' | 'Email'>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Playground simulation state
  const [simOrderId, setSimOrderId] = useState<string>('');
  const [simDisruption, setSimDisruption] = useState('heavy_traffic');
  const [simEstimatedDelay, setSimEstimatedDelay] = useState('25 mins');
  const [isGenerating, setIsGenerating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [nRes, oRes] = await Promise.all([
        apiClient.get<BackendNotification[]>('/notifications'),
        apiClient.get<BackendOrderSummary[]>('/orders').catch(() => ({ data: [] as BackendOrderSummary[] })),
      ]);
      setNotifications(nRes.data);
      setOrders(oRes.data);
      if (oRes.data.length > 0 && !simOrderId) {
        setSimOrderId(String(oRes.data[0].id));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setFetchError(err.response?.data?.detail || err.message || 'Cannot reach server');
      } else {
        setFetchError('Failed to load notifications from server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getOrderInfo = (orderId: number | null) => {
    if (!orderId) return null;
    return orders.find((o) => o.id === orderId) || null;
  };

  const selectedOrderObj = orders.find((o) => String(o.id) === simOrderId) || orders[0] || null;

  const handleSimulateClaude = async () => {
    if (!selectedOrderObj) return;
    setIsGenerating(true);
    setSimResult(null);

    const disruptionMap: Record<string, string> = {
      heavy_traffic: 'traffic',
      rain: 'weather',
      road_closure: 'unspecified',
    };
    const delayMinutesMap: Record<string, number> = {
      '15 mins': 15,
      '25 mins': 25,
      '40 mins': 40,
    };

    try {
      const resp = await apiClient.post<{ message: string; is_ai_generated: boolean; generation_source: string }>(
        `/orders/${selectedOrderObj.id}/flag-delay`,
        {
          reason: disruptionMap[simDisruption] || 'traffic',
          delay_minutes: delayMinutesMap[simEstimatedDelay] || 25,
        }
      );

      setSimResult(resp.data.message);
      await fetchData();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSimResult(`Error: ${err.response?.data?.detail || err.message}`);
      } else {
        setSimResult('Unexpected error generating notification');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = notifications.filter((log) => {
    if (aiOnly && !log.is_ai_generated) return false;
    if (filterChannel !== 'all' && log.channel.toLowerCase() !== filterChannel.toLowerCase()) return false;
    return true;
  });

  const aiCount = notifications.filter((n) => n.is_ai_generated).length;

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* ── Header Bar ── */}
        <div
          className="card animate-enter"
          style={{
            padding: '1.5rem 1.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            backgroundColor: '#FFFFFF',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Notifications & AI Dispatches
              </h1>
              <span className="status-badge badge-olive">
                <Sparkles size={12} /> Live API Feed
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Real-time audit trail of automated customer advisories dispatched across delivery channels.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={fetchData}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              title="Refresh notifications"
            >
              <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {fetchError && (
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--status-rose-bg, #FFF1F2)',
              border: '1px solid var(--status-rose-border, #FECDD3)',
              borderRadius: '12px',
              color: 'var(--status-rose-text, #9F1239)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={18} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fetchError}</span>
            </div>
            <button
              onClick={fetchData}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── KPI Counter Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'TOTAL DISPATCHES', count: notifications.length, sub: 'Logged system alerts' },
            { label: 'AI EXPLAINERS', count: aiCount, sub: 'Natural language summaries' },
            { label: 'STANDARD NOTICES', count: notifications.length - aiCount, sub: 'Template dispatches' },
            { label: 'DELIVERY ORDERS', count: orders.length, sub: 'Registered manifest orders' },
          ].map((kpi, idx) => (
            <div
              key={kpi.label}
              className={`card card-hover-lift animate-enter stagger-${idx + 1}`}
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#FFFFFF', borderRadius: '14px' }}
            >
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {kpi.label}
              </span>
              <AnimatedCounter
                value={kpi.count}
                style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{kpi.sub}</span>
            </div>
          ))}
        </div>

        {/* ── Interactive Claude AI Prompt Playground Simulator ── */}
        {selectedOrderObj && (
          <div
            className="card card-hover-lift animate-enter stagger-2"
            style={{
              padding: '1.75rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '18px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-tint)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Code2 size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Interactive AI Delay Message Generator
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Simulate dynamic Claude AI prompts translating telemetry events into empathetic recipient advisories.
                  </p>
                </div>
              </div>

              <span className="status-badge badge-olive" style={{ fontSize: '0.72rem' }}>
                LLM Prompt: Structured Zero-Shot
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Select Delivery Order
                </label>
                <select
                  value={simOrderId}
                  onChange={(e) => setSimOrderId(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.85rem', backgroundColor: '#FFFFFF', color: 'var(--text-main)' }}
                >
                  {orders.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.order_code} — {o.customer_name || 'Customer'} ({o.drop_address || 'Bengaluru'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Telemetry Disruption Reason
                </label>
                <select
                  value={simDisruption}
                  onChange={(e) => setSimDisruption(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.85rem', backgroundColor: '#FFFFFF', color: 'var(--text-main)' }}
                >
                  <option value="heavy_traffic">Peak Junction Traffic Congestion</option>
                  <option value="rain">Monsoon Downpour & Reduced Speed</option>
                  <option value="road_closure">Emergency Construction Diversion</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Estimated Delay Duration
                </label>
                <select
                  value={simEstimatedDelay}
                  onChange={(e) => setSimEstimatedDelay(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.85rem', backgroundColor: '#FFFFFF', color: 'var(--text-main)' }}
                >
                  <option value="15 mins">15 mins delay</option>
                  <option value="25 mins">25 mins delay</option>
                  <option value="40 mins">40 mins delay</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Target Recipient: <strong style={{ color: 'var(--text-main)' }}>{selectedOrderObj.customer_name}</strong> ({selectedOrderObj.customer_phone || 'Customer'})
              </div>

              <button
                onClick={handleSimulateClaude}
                disabled={isGenerating}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.55rem 1.35rem' }}
              >
                {isGenerating ? <RefreshCw size={15} className="spin-icon" /> : <Sparkles size={15} />}
                <span>{isGenerating ? 'Generating with Claude API...' : 'Generate & Dispatch AI Notice'}</span>
              </button>
            </div>

            {simResult && (
              <div
                className="animate-enter"
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--status-amber-bg)',
                  border: '1px solid var(--status-amber-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--status-amber-text)', textTransform: 'uppercase' }}>
                    Generated Claude Output (Logged to Notifications)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Structured Prompt Dispatched</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 500 }}>
                  "{simResult}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Link
                    to={`/track/${selectedOrderObj.tracking_uuid}`}
                    target="_blank"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem', textDecoration: 'none' }}
                  >
                    <span>Open Live Recipient View for {selectedOrderObj.order_code}</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Filter Bar with AI-Generated Toggle ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* AI Only Toggle Pill */}
            <button
              onClick={() => setAiOnly(!aiOnly)}
              className={`btn ${aiOnly ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.95rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Sparkles size={14} style={{ color: aiOnly ? '#FAF7F2' : 'var(--accent-gold)' }} />
              <span>AI-generated only</span>
              {aiOnly && <span className="status-badge badge-olive" style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>Active</span>}
            </button>

            {/* Channel filter pills */}
            {(['all', 'SMS', 'WhatsApp', 'Email'] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setFilterChannel(ch)}
                className={`tab-pill ${filterChannel === ch ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                {ch === 'all' ? 'All Channels' : ch}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredLogs.length} of {notifications.length} logged dispatches
          </span>
        </div>

        {/* ── Notifications Audit Log Cards ── */}
        {isLoading ? (
          <div
            style={{
              padding: '4rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
            }}
          >
            <RefreshCw size={28} className="spin-icon" style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Loading system notification logs...
            </span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '3.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              textAlign: 'center',
            }}
          >
            <Bell size={36} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              No Notifications Found
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '400px' }}>
              {aiOnly
                ? 'No AI-generated notifications match your current filter selection.'
                : 'No notifications currently registered in the database.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredLogs.map((log, idx) => {
              const orderInfo = getOrderInfo(log.order_id);

              return (
                <div
                  key={log.id}
                  className={`card card-hover-lift animate-enter stagger-${Math.min(idx + 1, 5)}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    padding: '1.35rem',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    borderLeft: log.is_ai_generated ? '4px solid #C49746' : '4px solid var(--primary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {orderInfo ? orderInfo.order_code : log.order_id ? `Order #${log.order_id}` : 'System Broadcast'}
                      </span>

                      {log.is_ai_generated ? (
                        <span className="status-badge badge-olive" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                          <Sparkles size={11} /> AI-Generated
                        </span>
                      ) : (
                        <span className="status-badge badge-slate" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                          template
                        </span>
                      )}

                      <span className="status-badge badge-slate" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                        {log.channel} (simulated send)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleCopyMessage(log.message, log.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: copiedId === log.id ? 'var(--status-emerald-text)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontWeight: 600,
                        }}
                      >
                        {copiedId === log.id ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedId === log.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.sent_at ? new Date(log.sent_at).toLocaleTimeString() : 'Dispatched'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {log.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <span>
                      Recipient: <strong>{orderInfo?.customer_name || 'Customer'}</strong>
                      {orderInfo?.customer_phone ? ` (${orderInfo.customer_phone})` : ''}
                    </span>
                    {orderInfo && (
                      <Link
                        to={`/track/${orderInfo.tracking_uuid}`}
                        target="_blank"
                        style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                      >
                        <span>Open Live Tracking</span>
                        <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </ManagerLayout>
  );
};
