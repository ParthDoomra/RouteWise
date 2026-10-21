import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  Lock,
  X,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface DispatcherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DispatcherLoginModal: React.FC<DispatcherLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 60);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both your work email and password.');
      return;
    }

    // Validate demo credentials or standard email format
    const isDemoAccount =
      cleanEmail === 'manager@routewise.com' ||
      cleanEmail === 'dispatcher@routewise.com' ||
      cleanEmail.includes('@');

    if (!isDemoAccount || cleanPassword.length < 4) {
      setError('Invalid credentials. Use manager@routewise.com / password123 for demo access.');
      return;
    }

    onClose();
    navigate('/manager/dashboard');
  };

  const handleQuickFillDemo = () => {
    setEmail('manager@routewise.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(28, 23, 19, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 250,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        className="card modal-pop-in"
        style={{
          width: '480px',
          maxWidth: '100%',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.75rem 2rem 1.25rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: '#FAF7F2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-tint)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(63, 82, 46, 0.15)',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-serif)',
                  lineHeight: 1.2,
                }}
              >
                Dispatcher Portal Login
              </h3>
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem',
                }}
              >
                Enter your dispatcher credentials to access the live operations hub.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: '#FFFFFF',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--duration-fast) ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-main)';
              e.currentTarget.style.borderColor = 'var(--text-main)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.75rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                htmlFor="dispatcher-modal-email"
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.35rem',
                }}
              >
                Work Email Address
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                }}
              >
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  id="dispatcher-modal-email"
                  ref={emailInputRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. manager@routewise.com"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label
                  htmlFor="dispatcher-modal-password"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleQuickFillDemo}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: 0,
                  }}
                >
                  <Sparkles size={11} />
                  <span>Fill Demo Info</span>
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                }}
              >
                <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  id="dispatcher-modal-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter password (e.g. password123)"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>

            {error && (
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
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                padding: '0.8rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: 700,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                marginTop: '0.25rem',
              }}
            >
              <span>Authenticate & Launch Console</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Demo Credentials Pill */}
          <div
            style={{
              padding: '0.75rem 0.95rem',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              <span>Demo credentials: </span>
              <strong style={{ color: 'var(--text-main)' }}>manager@routewise.com</strong> / <strong style={{ color: 'var(--text-main)' }}>password123</strong>
            </div>
            <button
              type="button"
              onClick={handleQuickFillDemo}
              style={{
                border: '1px solid var(--border-medium)',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                padding: '0.2rem 0.5rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--primary)',
                cursor: 'pointer',
              }}
            >
              Use
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '0.75rem',
            }}
          >
            <CheckCircle2 size={13} style={{ color: 'var(--status-emerald-text)' }} />
            <span>256-bit Encrypted Dispatch Hub Session</span>
          </div>

        </div>
      </div>
    </div>
  );
};
