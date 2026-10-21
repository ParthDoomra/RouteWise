import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ManagerLayout } from '../components/ManagerLayout';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { getGlobalOrders, getOrderByTrackingId } from '../data/mockOrders';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Code2,
  RefreshCw,
} from 'lucide-react';

interface NotificationLogItem {
  id: string;
  orderId: string;
  trackingUuid: string;
  message: string;
  channel: 'SMS' | 'Email' | 'WhatsApp';
  isAiGenerated: boolean;
  promptTokens?: number;
  sentAt: string;
  recipient: string;
}

const initialNotificationLogs: NotificationLogItem[] = [
  {
    id: 'NOTIF-901',
    orderId: 'ORD-8942',
    trackingUuid: 'a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10',
    message: 'Hello Siddharth, your RouteWise delivery ORD-8942 is experiencing a ~25 min delay due to heavy congestion along the HSR Outer Ring Road junction. Driver Priya Nair is en route and navigating the shortest alternate bypass path to reach you safely.',
    channel: 'SMS',
    isAiGenerated: true,
    promptTokens: 142,
    sentAt: 'Today, 14:15 PM',
    recipient: '+91 99001 22334 (Siddharth Rao)',
  },
  {
    id: 'NOTIF-902',
    orderId: 'ORD-8945',
    trackingUuid: 'e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e',
    message: 'Your RouteWise order ORD-8945 has been picked up by Rahul Sharma! Track live: routewise.com/track/e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e — ETA: 2:20 PM',
    channel: 'SMS',
    isAiGenerated: false,
    sentAt: 'Today, 13:40 PM',
    recipient: '+91 98765 43210 (Aarav Sharma)',
  },
  {
    id: 'NOTIF-903',
    orderId: 'ORD-8931',
    trackingUuid: 'f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c',
    message: 'Hello Ananya, severe monsoon showers in the Electronic City zone have slowed our delivery vehicle. Driver Vikram Singh is carefully navigating with revised ETA at 4:30 PM. Track live here.',
    channel: 'WhatsApp',
    isAiGenerated: true,
    promptTokens: 168,
    sentAt: 'Today, 12:30 PM',
    recipient: '+91 98440 55112 (Ananya Deshmukh)',
  },
  {
    id: 'NOTIF-904',
    orderId: 'ORD-8938',
    trackingUuid: 'c4d3b2a1-8e7f-4a5b-9c8d-1e2f3a4b5c6d',
    message: 'Package loaded and confirmed: Order ORD-8938 picked up by Amit Patel (KA-05-MC-8812). Driver en route to Jayanagar 4th Block with on-time ETA 2:45 PM.',
    channel: 'SMS',
    isAiGenerated: false,
    sentAt: 'Today, 13:25 PM',
    recipient: '+91 97456 12389 (Rohan Gupta)',
  },
  {
    id: 'NOTIF-905',
    orderId: 'ORD-8940',
    trackingUuid: 'd5e6f7a8-1b2c-3d4e-5f6a-7b8c9d0e1f2a',
    message: 'Notice: Order ORD-8940 assigned to Deepak Kumar (KA-02-JL-4411) for evening delivery to JP Nagar with estimated ETA 5:30 PM.',
    channel: 'SMS',
    isAiGenerated: true,
    promptTokens: 135,
    sentAt: 'Today, 11:50 AM',
    recipient: '+91 97312 99887 (Karan Verma)',
  },
];

export const ManagerNotificationsPage: React.FC = () => {
  const allOrders = getGlobalOrders();
  const [logs, setLogs] = useState<NotificationLogItem[]>(initialNotificationLogs);
  const [filterType, setFilterType] = useState<'all' | 'ai' | 'sms' | 'whatsapp'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [simOrderId, setSimOrderId] = useState('ORD-8942');
  const [simDisruption, setSimDisruption] = useState('heavy_traffic');
  const [simEstimatedDelay, setSimEstimatedDelay] = useState('25 mins');
  const [isGenerating, setIsGenerating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  const selectedOrderObj = getOrderByTrackingId(simOrderId);

  const handleSimulateClaude = () => {
    setIsGenerating(true);
    setSimResult(null);

    setTimeout(() => {
      const order = getOrderByTrackingId(simOrderId);
      let generated = '';
      if (simDisruption === 'heavy_traffic') {
        generated = `Hello ${order.customerName}, your delivery ${order.id} is experiencing a temporary ~${simEstimatedDelay} delay due to peak traffic congestion along the main junction. Driver ${order.driverName} is actively taking the fastest alternate bypass to reach you safely.`;
      } else if (simDisruption === 'rain') {
        generated = `Hello ${order.customerName}, heavy monsoon rainfall in your delivery sector has necessitated cautious driving. Your package ${order.id} will arrive in approximately ~${simEstimatedDelay}. Driver ${order.driverName} is navigating carefully.`;
      } else {
        generated = `Hello ${order.customerName}, an unexpected road closure diversion added ~${simEstimatedDelay} to our vehicle route. Driver ${order.driverName} (${order.vehiclePlate}) is already rerouted and en route to your doorstep.`;
      }

      setSimResult(generated);
      setIsGenerating(false);

      const newLogItem: NotificationLogItem = {
        id: `NOTIF-${Math.floor(910 + Math.random() * 80)}`,
        orderId: order.id,
        trackingUuid: order.trackingUuid,
        message: generated,
        channel: 'SMS',
        isAiGenerated: true,
        promptTokens: 154,
        sentAt: 'Just now (Simulated)',
        recipient: `${order.customerPhone} (${order.customerName})`,
      };
      setLogs([newLogItem, ...logs]);
    }, 750);
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ai') return log.isAiGenerated;
    if (filterType === 'sms') return log.channel === 'SMS';
    if (filterType === 'whatsapp') return log.channel === 'WhatsApp';
    return true;
  });

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
                AI Customer Dispatches & Logs
              </h1>
              <span className="status-badge badge-olive">
                <Sparkles size={12} /> Claude 3.5 Sonnet Connected
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Real-time audit trail of automated SMS, WhatsApp, and email notices dispatched during route disruptions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="status-badge badge-slate" style={{ fontSize: '0.8rem' }}>
              Avg Generation Latency: <strong>720ms</strong>
            </span>
          </div>
        </div>

        {/* ── KPI Counter Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'DISPATCHES TODAY', count: 184, sub: '99.4% Delivery Success Rate', accent: '#4A5D3A', bg: 'var(--status-olive-bg)' },
            { label: 'CLAUDE AI NOTICES', count: 62, sub: 'Natural-language translations', accent: '#C49746', bg: 'var(--status-amber-bg)' },
            { label: 'WISMO CALLS AVOIDED', count: 142, sub: '77% reduction in inquiries', accent: '#285433', bg: 'var(--status-emerald-bg)' },
            { label: 'AVG CSAT SCORE', count: 4.8, decimals: 1, suffix: ' / 5.0', sub: 'Post-delivery feedback', accent: '#8E4C0E', bg: 'var(--status-amber-bg)' },
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
                decimals={kpi.decimals || 0}
                suffix={kpi.suffix || ''}
                style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{kpi.sub}</span>
            </div>
          ))}
        </div>

        {/* ── Interactive Claude AI Prompt Playground Simulator ── */}
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
                {allOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {o.customerName} ({o.zone})
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
              Target Recipient: <strong style={{ color: 'var(--text-main)' }}>{selectedOrderObj.customerName}</strong> ({selectedOrderObj.customerPhone}) • Driver: <strong>{selectedOrderObj.driverName}</strong>
            </div>

            <button
              onClick={handleSimulateClaude}
              disabled={isGenerating}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '0.55rem 1.35rem' }}
            >
              {isGenerating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
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
                  Generated Claude Output (Ready for SMS / WhatsApp Dispatch)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>154 tokens • Latency: 720ms</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, fontWeight: 500 }}>
                "{simResult}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Link
                  to={`/track/${selectedOrderObj.trackingUuid}`}
                  target="_blank"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
                >
                  <span>Simulate Live Recipient Experience for {selectedOrderObj.id}</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {[
              { key: 'all', label: 'All Channels' },
              { key: 'ai', label: 'Claude AI Generated' },
              { key: 'sms', label: 'SMS Gateway' },
              { key: 'whatsapp', label: 'WhatsApp API' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key as any)}
                className={`btn ${filterType === f.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.78rem' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {filteredLogs.length} logged dispatches
          </span>
        </div>

        {/* ── Notifications Audit Log Cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredLogs.map((log, idx) => (
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
                borderLeft: log.isAiGenerated ? '4px solid #C49746' : '4px solid var(--primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {log.orderId}
                  </span>

                  {log.isAiGenerated ? (
                    <span className="status-badge badge-olive" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                      <Sparkles size={11} /> AI Explainer
                    </span>
                  ) : (
                    <span className="status-badge badge-slate" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                      Standard Dispatch
                    </span>
                  )}

                  <span className="status-badge badge-slate" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                    {log.channel}
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

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.sentAt}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {log.message}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                <span>Recipient: <strong>{log.recipient}</strong></span>
                <Link
                  to={`/track/${log.trackingUuid}`}
                  style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none' }}
                >
                  <span>Simulate Live Recipient Experience</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </ManagerLayout>
  );
};
