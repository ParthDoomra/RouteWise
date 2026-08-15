import React from 'react';
import { ManagerLayout } from '../components/ManagerLayout';
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

const onTimeData = [
  { day: 'Aug 01', onTimeRate: 91.2 },
  { day: 'Aug 02', onTimeRate: 92.5 },
  { day: 'Aug 03', onTimeRate: 88.0 },
  { day: 'Aug 04', onTimeRate: 94.1 },
  { day: 'Aug 05', onTimeRate: 95.3 },
  { day: 'Aug 06', onTimeRate: 89.6 },
  { day: 'Aug 07', onTimeRate: 93.0 },
  { day: 'Aug 08', onTimeRate: 96.2 },
  { day: 'Aug 09', onTimeRate: 94.8 },
  { day: 'Aug 10', onTimeRate: 91.5 },
  { day: 'Aug 11', onTimeRate: 93.9 },
  { day: 'Aug 12', onTimeRate: 90.1 },
  { day: 'Aug 13', onTimeRate: 95.8 },
  { day: 'Aug 14', onTimeRate: 94.2 },
];

const vehicleDeliveryTimeData = [
  { vehicle: 'KA-01-EA-1024', avgMins: 28 },
  { vehicle: 'KA-01-GB-5091', avgMins: 42 },
  { vehicle: 'KA-05-MC-8812', avgMins: 22 },
  { vehicle: 'KA-03-HA-3301', avgMins: 31 },
  { vehicle: 'KA-04-MH-9920', avgMins: 48 },
  { vehicle: 'KA-02-JL-4411', avgMins: 19 },
];

export const ManagerAnalyticsPage: React.FC = () => {
  return (
    <ManagerLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Fleet Performance Analytics</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Historical SLA performance metrics, cost-per-delivery estimations & vehicle utilization efficiency.
          </p>
        </div>

        {/* Summary Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="card">
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Avg On-Time SLA (14 Days)</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>93.1%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: 90.0% benchmark</div>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Estimated Cost-per-Delivery</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary-navy)', marginTop: '0.25rem' }}>₹42.80</div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a' }}>↓ ₹3.40 reduction after 2-opt optimization</div>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Fleet Utilization Rate</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: '0.25rem' }}>84.5%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>15.2 active operating hours / day</div>
          </div>

          <div className="card">
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Avg Delivery Turnaround</span>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>31.6 mins</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order creation to final drop-off</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
          
          {/* Line Chart: On-Time % over 14 days */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>On-Time Delivery % (Last 14 Days)</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily SLA compliance trend</span>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={onTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" style={{ fontSize: '0.75rem' }} />
                  <YAxis domain={[80, 100]} style={{ fontSize: '0.75rem' }} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'On-Time Rate']} />
                  <Line type="monotone" dataKey="onTimeRate" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Average Delivery Time by Vehicle */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Avg Delivery Duration by Vehicle</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average minutes spent per order drop-off</span>
            </div>

            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleDeliveryTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="vehicle" style={{ fontSize: '0.7rem' }} />
                  <YAxis style={{ fontSize: '0.75rem' }} />
                  <Tooltip formatter={(value: number) => [`${value} mins`, 'Avg Duration']} />
                  <Bar dataKey="avgMins" fill="#0f172a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </ManagerLayout>
  );
};
