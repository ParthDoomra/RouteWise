import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
import { AnimatedCounter } from '../components/AnimatedCounter';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  BarChart3,
  Send,
} from 'lucide-react';
import { getGlobalOrders } from '../data/mockOrders';

const onTimeData = [
  { day: 'Day 1', onTimeRate: 91.2 },
  { day: 'Day 2', onTimeRate: 92.5 },
  { day: 'Day 3', onTimeRate: 88.0 },
  { day: 'Day 4', onTimeRate: 94.1 },
  { day: 'Day 5', onTimeRate: 95.3 },
  { day: 'Day 6', onTimeRate: 89.6 },
  { day: 'Day 7', onTimeRate: 93.0 },
  { day: 'Day 8', onTimeRate: 96.2 },
  { day: 'Day 9', onTimeRate: 94.8 },
  { day: 'Day 10', onTimeRate: 91.5 },
  { day: 'Day 11', onTimeRate: 93.9 },
  { day: 'Day 12', onTimeRate: 90.1 },
  { day: 'Day 13', onTimeRate: 95.8 },
  { day: 'Day 14', onTimeRate: 94.2 },
];

const vehicleDeliveryTimeData = [
  { vehicle: 'Tata Ace (EV)', avgMins: 28 },
  { vehicle: 'Bolero Truck', avgMins: 42 },
  { vehicle: 'Euler EV Van', avgMins: 22 },
  { vehicle: 'Eeco Cargo', avgMins: 31 },
  { vehicle: 'Eicher Truck', avgMins: 48 },
  { vehicle: 'Ather EV', avgMins: 19 },
];

export const ManagerAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai_simulator'>('analytics');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Simulator state
  const [simScenario, setSimScenario] = useState<'traffic' | 'weather' | 'pickup' | 'custom'>('traffic');
  const [simRecipient, setSimRecipient] = useState('Siddharth Rao');
  const [simOrderId, setSimOrderId] = useState('ORD-8942');
  const [simDelayMin, setSimDelayMin] = useState(25);
  const [simGeneratedMessage, setSimGeneratedMessage] = useState(
    'Hello Siddharth, your RouteWise order ORD-8942 is running ~25 mins delayed due to heavy bottleneck traffic at HSR Outer Ring Road. Driver Priya Nair is taking the shortest alternate bypass to reach you safely.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'sent'>('idle');

  const orders = getGlobalOrders();

  const handleGenerateAiMessage = () => {
    setIsGenerating(true);
    setDispatchStatus('idle');
    setTimeout(() => {
      if (simScenario === 'traffic') {
        setSimGeneratedMessage(
          `Hello ${simRecipient}, your RouteWise order ${simOrderId} is running ~${simDelayMin} mins delayed due to heavy bottleneck traffic at HSR Outer Ring Road. Driver Priya Nair is taking the shortest alternate bypass to reach you safely.`
        );
      } else if (simScenario === 'weather') {
        setSimGeneratedMessage(
          `Hello ${simRecipient}, sudden monsoon rains around Electronic City have slowed down our dispatch speed. Delivery ${simOrderId} is safe and moving with a revised ETA of ~${simDelayMin} mins.`
        );
      } else if (simScenario === 'pickup') {
        setSimGeneratedMessage(
          `Great news ${simRecipient}! Your RouteWise order ${simOrderId} has just been picked up from our Indiranagar Depot by driver Rahul Sharma. Live tracking is active.`
        );
      } else {
        setSimGeneratedMessage(
          `Update for ${simRecipient}: Delivery ${simOrderId} has been rescheduled to accommodate customer delivery window. Live dispatch tracking is updated.`
        );
      }
      setIsGenerating(false);
    }, 450);
  };

  const handleSendDispatch = () => {
    setDispatchStatus('sent');
    setTimeout(() => setDispatchStatus('idle'), 3000);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* ── Page Header & Tabs ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Analytics & AI Dispatches
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Fleet SLA benchmarks, delivery turnarounds, and automated Claude AI customer communications.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`tab-pill ${activeTab === 'analytics' ? 'active' : ''}`}
              style={{ fontSize: '0.85rem', padding: '0.45rem 1.15rem' }}
            >
              <BarChart3 size={16} />
              <span>SLA Performance</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ai_simulator')}
              className={`tab-pill ${activeTab === 'ai_simulator' ? 'active' : ''}`}
              style={{ fontSize: '0.85rem', padding: '0.45rem 1.15rem' }}
            >
              <Sparkles size={16} />
              <span>AI Message Simulator</span>
            </button>
          </div>
        </div>

        {/* ══ TAB 1: SLA PERFORMANCE & ANALYTICS ══ */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Top Stat Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.15rem' }}>
              <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  14-Day Avg SLA Compliance
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <AnimatedCounter value={94.2} decimals={1} suffix="%" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }} />
                  <span className="status-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                    <TrendingUp size={11} /> +2.2% vs Benchmark
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target SLA threshold: 92.0%</span>
              </div>

              <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Avg Delivery Turnaround
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <AnimatedCounter value={31.4} decimals={1} suffix=" min" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }} />
                  <span className="status-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                    -4.2 min faster
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Per completed customer drop</span>
              </div>

              <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  AI Dispatches Handled
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <AnimatedCounter value={184} suffix=" msgs" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }} />
                  <span className="status-badge badge-olive" style={{ fontSize: '0.72rem' }}>
                    100% Automated
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Zero manual agent overhead</span>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem' }}>
              
              {/* SLA Compliance Trend */}
              <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Daily SLA Compliance Trend (%)
                  </h3>
                  <span className="status-badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                    94.2% Current
                  </span>
                </div>

                <div style={{ width: '100%', height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={onTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAE3D6" />
                      <XAxis dataKey="day" stroke="#807567" fontSize={11} tickLine={false} />
                      <YAxis domain={[80, 100]} stroke="#807567" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="onTimeRate"
                        name="On-Time Rate %"
                        stroke="#3F522E"
                        strokeWidth={2.5}
                        dot={{ fill: '#3F522E', r: 3 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Delivery Speed by Vehicle */}
              <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Avg Turnaround by Fleet Asset (Mins)
                </h3>

                <div style={{ width: '100%', height: '260px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vehicleDeliveryTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EAE3D6" />
                      <XAxis dataKey="vehicle" stroke="#807567" fontSize={10} tickLine={false} />
                      <YAxis stroke="#807567" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                        }}
                      />
                      <Bar dataKey="avgMins" name="Avg Mins / Drop" fill="#C49746" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ══ TAB 2: AI MESSAGE SIMULATOR & AUDIT LOGS ══ */}
        {activeTab === 'ai_simulator' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
            
            {/* Simulator Form & Output */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'var(--primary-tint)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                    Claude AI Notification Engine
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Test contextual customer status message generation
                  </div>
                </div>
              </div>

              {/* Scenario Selector */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Select Telemetry Trigger</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setSimScenario('traffic')}
                    className={`tab-pill ${simScenario === 'traffic' ? 'active' : ''}`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Traffic Delay
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimScenario('weather')}
                    className={`tab-pill ${simScenario === 'weather' ? 'active' : ''}`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Monsoon Rain
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimScenario('pickup')}
                    className={`tab-pill ${simScenario === 'pickup' ? 'active' : ''}`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Hub Departure
                  </button>
                </div>
              </div>

              {/* Recipient & Order */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Name</label>
                  <input
                    type="text"
                    value={simRecipient}
                    onChange={(e) => setSimRecipient(e.target.value)}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Order ID</label>
                  <input
                    type="text"
                    value={simOrderId}
                    onChange={(e) => setSimOrderId(e.target.value)}
                    className="input-clean"
                    style={{ marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Delay: {simDelayMin} Mins</label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={simDelayMin}
                  onChange={(e) => setSimDelayMin(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '0.4rem', accentColor: 'var(--primary)' }}
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAiMessage}
                disabled={isGenerating}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', width: '100%' }}
              >
                <RefreshCw size={15} className={isGenerating ? 'spin' : ''} />
                <span>{isGenerating ? 'Generating Contextual Prompt...' : 'Generate AI Customer Dispatch'}</span>
              </button>

              {/* Generated Message Box */}
              <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    Generated SMS / WhatsApp Copy
                  </span>
                  <button
                    onClick={() => copyText(simGeneratedMessage, 'sim-copy')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {copiedId === 'sim-copy' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === 'sim-copy' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                  "{simGeneratedMessage}"
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleSendDispatch}
                    className="btn btn-accent"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.95rem' }}
                  >
                    <Send size={13} />
                    <span>{dispatchStatus === 'sent' ? '✓ Dispatched to Recipient!' : 'Simulate Send SMS'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Live Audit Log Feed */}
            <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Recent AI Dispatches Log
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.95rem',
                      borderRadius: '10px',
                      backgroundColor: item.isDelayed ? 'var(--status-amber-bg)' : 'var(--bg-surface)',
                      border: item.isDelayed ? '1px solid var(--status-amber-border)' : '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.825rem' }}>
                        {item.id}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.feedTime}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                      "{item.feedMessage}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        To: {item.customerName}
                      </span>
                      <a
                        href={`/track/${item.trackingUuid}`}
                        style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Recipient Link &rarr;
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </ManagerLayout>
  );
};
