import React, { useState } from 'react';
import { ManagerLayout } from '../components/ManagerLayout';

interface NotificationLogItem {
  id: string;
  orderId: string;
  message: string;
  channel: 'SMS' | 'Email' | 'WhatsApp';
  isAiGenerated: boolean;
  sentAt: string;
  recipient: string;
}

const dummyNotificationLogs: NotificationLogItem[] = [
  {
    id: 'NOTIF-901',
    orderId: 'ORD-8942',
    message: 'Your RouteWise order ORD-8942 is experiencing a ~25 min delay due to traffic in HSR zone. Track live: routewise.com/track/a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10 — ETA: 2:55 PM',
    channel: 'SMS',
    isAiGenerated: true,
    sentAt: '2026-08-14 14:15 PM',
    recipient: '+91 99001 22334',
  },
  {
    id: 'NOTIF-902',
    orderId: 'ORD-8945',
    message: 'Your RouteWise order ORD-8945 has been picked up by Rahul Sharma! Track live: routewise.com/track/e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e — ETA: 2:20 PM',
    channel: 'SMS',
    isAiGenerated: false,
    sentAt: '2026-08-14 13:40 PM',
    recipient: '+91 98765 43210',
  },
  {
    id: 'NOTIF-903',
    orderId: 'ORD-8931',
    message: 'Your RouteWise order ORD-8931 is delayed by rainfall in Electronic City. Track live: routewise.com/track/f9e8d7c6-b5a4-4f3e-2d1c-0b9a8f7e6d5c — ETA: 4:30 PM',
    channel: 'WhatsApp',
    isAiGenerated: true,
    sentAt: '2026-08-14 12:30 PM',
    recipient: '+91 98440 55112',
  },
  {
    id: 'NOTIF-904',
    orderId: 'ORD-8943',
    message: 'Order ORD-8943 successfully delivered to Rohan Gupta. Thank you for choosing RouteWise!',
    channel: 'Email',
    isAiGenerated: false,
    sentAt: '2026-08-14 13:25 PM',
    recipient: 'rohan.gupta@example.com',
  },
  {
    id: 'NOTIF-905',
    orderId: 'ORD-8936',
    message: 'Your RouteWise order ORD-8936 has been delayed by Marathahalli congestion. Track live: routewise.com/track/b8a7c6d5-e4f3-4210-9876-5a4b3c2d1e0f — ETA: 3:15 PM',
    channel: 'SMS',
    isAiGenerated: true,
    sentAt: '2026-08-14 11:50 AM',
    recipient: '+91 80 4112 3344',
  },
  {
    id: 'NOTIF-906',
    orderId: 'ORD-8939',
    message: 'Your RouteWise delivery for ORD-8939 is scheduled today between 10:00 AM - 12:00 PM. Track live: routewise.com/track/d1c2b3a4-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    channel: 'Email',
    isAiGenerated: false,
    sentAt: '2026-08-14 09:00 AM',
    recipient: 'pooja.reddy@example.com',
  },
];

export const ManagerNotificationsPage: React.FC = () => {
  const [showAiOnly, setShowAiOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLogs = dummyNotificationLogs.filter((n) => (showAiOnly ? n.isAiGenerated : true));

  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Notifications Audit Log</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Audit trail of customer dispatches highlighting AI-generated delay explanations (Claude API).
            </p>
          </div>

          <button
            onClick={() => setShowAiOnly(!showAiOnly)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: showAiOnly ? '1px solid #7c3aed' : '1px solid var(--border-color)',
              backgroundColor: showAiOnly ? '#f3e8ff' : '#ffffff',
              color: showAiOnly ? '#7c3aed' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ✨ {showAiOnly ? 'Showing AI-Generated Only' : 'Filter: Show AI-Generated Only'}
          </button>
        </div>

        {/* Notifications Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>ORDER ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>TYPE / GENERATOR</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>MESSAGE BODY</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>CHANNEL</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>SENT AT</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      {log.orderId}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>To: {log.recipient}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      {log.isAiGenerated ? (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#7c3aed',
                            backgroundColor: '#f3e8ff',
                            border: '1px solid #d8b4fe',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          ✨ AI-Generated
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Template</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', maxWidth: '380px' }}>
                      <div
                        style={{
                          color: 'var(--text-main)',
                          lineHeight: '1.4',
                          overflow: expandedId === log.id ? 'visible' : 'hidden',
                          textOverflow: expandedId === log.id ? 'clip' : 'ellipsis',
                          whiteSpace: expandedId === log.id ? 'normal' : 'nowrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {log.message}
                      </div>
                      <button
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: '0.2rem' }}
                      >
                        {expandedId === log.id ? 'Show less' : 'Expand message'}
                      </button>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>
                      {log.channel}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>
                      {log.sentAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ManagerLayout>
  );
};
