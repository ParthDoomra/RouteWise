import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  Radio,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { CustomerTrackingModal } from '../components/CustomerTrackingModal';
import { DriverLoginModal } from '../components/DriverLoginModal';
import { DispatcherLoginModal } from '../components/DispatcherLoginModal';
import { AlertTriangle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isDispatcherModalOpen, setIsDispatcherModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setFormError('Please enter both your work email and password.');
      return;
    }

    if (cleanPassword.length < 4) {
      setFormError('Invalid credentials. Use manager@routewise.com / password123 for demo access.');
      return;
    }

    navigate('/manager/dashboard');
  };

  const handleQuickRole = (role: 'manager' | 'driver' | 'customer') => {
    if (role === 'manager') {
      setIsDispatcherModalOpen(true);
    } else if (role === 'driver') {
      setIsDriverModalOpen(true);
    } else {
      setIsTrackingModalOpen(true);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#F5F1EA',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial atmosphere */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(196, 151, 70, 0.12) 0%, rgba(74, 93, 58, 0.08) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card animate-enter"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '2.5rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-light)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                color: '#FAF7F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 2px 6px rgba(63, 82, 46, 0.25)',
              }}
            >
              RW
            </div>
            <span style={{ fontSize: '1.65rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)' }}>
              Route<span style={{ color: 'var(--accent-gold)' }}>Wise</span>
            </span>
          </Link>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: '0.15rem 0' }}>
            Dispatch & Telematics Portal
          </h2>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '360px' }}>
            Sign in to access real-time dispatch telemetry, 2-Opt route optimization, and AI delay broadcasts.
          </p>
        </div>

        {/* Quick Role Selection Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Instant Demo Evaluation Access
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>1-Click Sign In</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => handleQuickRole('manager')}
              style={{
                padding: '0.75rem 0.45rem',
                borderRadius: '10px',
                border: '1px solid var(--border-medium)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'transform var(--duration-fast) var(--ease-spring), border-color var(--duration-fast) ease, box-shadow 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 93, 58, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
              <span>Dispatcher</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('driver')}
              style={{
                padding: '0.75rem 0.45rem',
                borderRadius: '10px',
                border: '1px solid var(--border-medium)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'transform var(--duration-fast) var(--ease-spring), border-color var(--duration-fast) ease, box-shadow 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 93, 58, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Truck size={18} style={{ color: 'var(--status-emerald-text)' }} />
              <span>Driver App</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickRole('customer')}
              style={{
                padding: '0.75rem 0.45rem',
                borderRadius: '10px',
                border: '1px solid var(--border-medium)',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'transform var(--duration-fast) var(--ease-spring), border-color var(--duration-fast) ease, box-shadow 160ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 93, 58, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Radio size={18} style={{ color: '#C49746' }} />
              <span>Customer</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>or sign in with work email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="manager@routewise.com"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem 0.7rem 2.3rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  color: 'var(--text-main)',
                  backgroundColor: '#FFFFFF',
                }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Password
              </label>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@routewise.com');
                    setPassword('password123');
                    setFormError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.75rem',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                  }}
                >
                  <Sparkles size={11} />
                  <span>Demo Account</span>
                </button>
              </div>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem 0.7rem 2.3rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  color: 'var(--text-main)',
                  backgroundColor: '#FFFFFF',
                }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {formError && (
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--status-rose-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AlertTriangle size={13} />
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '0.85rem',
              borderRadius: '10px',
              fontSize: '0.925rem',
              marginTop: '0.4rem',
              width: '100%',
            }}
          >
            <span>Launch Dispatch Console</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={13} style={{ color: 'var(--status-emerald-text)' }} />
          <span>Final Year Engineering Project • Deterministic Routing + Claude Telematics</span>
        </div>
      </div>

      {/* Dispatcher Login Modal */}
      <DispatcherLoginModal
        isOpen={isDispatcherModalOpen}
        onClose={() => setIsDispatcherModalOpen(false)}
      />

      {/* Customer Tracking Modal */}
      <CustomerTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />

      {/* Driver Login Modal */}
      <DriverLoginModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
      />
    </div>
  );
};
