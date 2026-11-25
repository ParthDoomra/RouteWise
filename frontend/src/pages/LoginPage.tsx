import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  Radio,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { CustomerTrackingModal } from '../components/CustomerTrackingModal';
import { DriverLoginModal } from '../components/DriverLoginModal';
import { DispatcherLoginModal } from '../components/DispatcherLoginModal';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import axios from 'axios';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [activeTab, setActiveTab] = useState<'manager' | 'driver'>('manager');

  // Manager inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Driver inputs
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isDispatcherModalOpen, setIsDispatcherModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const handleManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setFormError('Please enter both your work email and password.');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const resp = await apiClient.post('/auth/manager/login', {
        email: cleanEmail,
        password: cleanPassword,
      });

      const { access_token, role, display_name, user_id } = resp.data;
      login(access_token, role, display_name, user_id);
      navigate('/manager/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setFormError('Cannot reach server');
        } else if (err.response.status === 429) {
          const detail = err.response.data?.detail || 'Too many failed login attempts. Please try again later.';
          setFormError(detail);
        } else if (err.response.status === 401) {
          setFormError(err.response.data?.detail || 'Invalid credentials');
        } else {
          setFormError(err.response.data?.detail || 'Authentication failed. Please try again.');
        }
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    const cleanPin = pin.trim();

    if (!cleanPhone || !cleanPin) {
      setFormError('Please enter both your phone number and 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const resp = await apiClient.post('/auth/driver/login', {
        phone: cleanPhone,
        pin: cleanPin,
      });

      const { access_token, role, display_name, user_id } = resp.data;
      login(access_token, role, display_name, user_id);
      navigate('/driver/route');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setFormError('Cannot reach server');
        } else if (err.response.status === 429) {
          const detail = err.response.data?.detail || 'Too many failed login attempts. Please try again later.';
          setFormError(detail);
        } else if (err.response.status === 401) {
          setFormError(err.response.data?.detail || 'Invalid credentials');
        } else {
          setFormError(err.response.data?.detail || 'Authentication failed. Please try again.');
        }
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRole = (role: 'manager' | 'driver' | 'customer') => {
    setFormError(null);
    if (role === 'manager') {
      setActiveTab('manager');
      setEmail('manager@routewise.com');
      setPassword('manager123');
    } else if (role === 'driver') {
      setActiveTab('driver');
      setPhone('+91 98450 11223');
      setPin('1024');
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
          background:
            'radial-gradient(circle, rgba(196, 151, 70, 0.12) 0%, rgba(74, 93, 58, 0.08) 50%, transparent 70%)',
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
          gap: '1.25rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-light)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              textDecoration: 'none',
              marginBottom: '0.5rem',
            }}
          >
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
            <span
              style={{
                fontSize: '1.65rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-serif)',
              }}
            >
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
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
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
                border: activeTab === 'manager' ? '1.5px solid var(--primary)' : '1px solid var(--border-medium)',
                backgroundColor: activeTab === 'manager' ? 'var(--primary-tint)' : '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 160ms ease',
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
                border: activeTab === 'driver' ? '1.5px solid var(--primary)' : '1px solid var(--border-medium)',
                backgroundColor: activeTab === 'driver' ? 'var(--primary-tint)' : '#FFFFFF',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 160ms ease',
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
                transition: 'all 160ms ease',
              }}
            >
              <Radio size={18} style={{ color: '#C49746' }} />
              <span>Customer</span>
            </button>
          </div>
        </div>

        {/* Manager / Driver Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#FAF7F2',
            padding: '0.3rem',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('manager');
              setFormError(null);
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'manager' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'manager' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'manager' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 160ms ease',
            }}
          >
            Manager Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('driver');
              setFormError(null);
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: '9px',
              border: 'none',
              backgroundColor: activeTab === 'driver' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'driver' ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'driver' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 160ms ease',
            }}
          >
            Driver Portal
          </button>
        </div>

        {/* Form Container */}
        {activeTab === 'manager' ? (
          <form onSubmit={handleManagerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@routewise.com');
                    setPassword('manager123');
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
                  <span>Demo Manager</span>
                </button>
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
                  fontSize: '0.8rem',
                  color: 'var(--status-rose-text)',
                  backgroundColor: 'var(--status-rose-bg, #FFF1F2)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #FECDD3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  lineHeight: 1.4,
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                fontSize: '0.925rem',
                marginTop: '0.3rem',
                width: '100%',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <span>{isLoading ? 'Authenticating...' : 'Launch Dispatch Console'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleDriverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Driver Phone Number
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="+91 98450 11223"
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
                <Phone size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Driver 4-Digit PIN
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPhone('+91 98450 11223');
                    setPin('1024');
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
                  <span>Demo Driver</span>
                </button>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="••••"
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
                  fontSize: '0.8rem',
                  color: 'var(--status-rose-text)',
                  backgroundColor: 'var(--status-rose-bg, #FFF1F2)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #FECDD3',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  lineHeight: 1.4,
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                fontSize: '0.925rem',
                marginTop: '0.3rem',
                width: '100%',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <span>{isLoading ? 'Authenticating...' : 'Open Driver Manifest'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div
          style={{
            textAlign: 'center',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
        >
          <CheckCircle2 size={13} style={{ color: 'var(--status-emerald-text)' }} />
          <span>Deterministic Routing + Claude AI Telematics</span>
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

export default LoginPage;
