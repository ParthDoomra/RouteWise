import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Compass,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { findOrderByQuery } from '../data/mockOrders';

interface CustomerTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerTrackingModal: React.FC<CustomerTrackingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [isOpen]);

  // Handle escape key
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
    const clean = query.trim();
    if (!clean) {
      setError('Please enter your Order ID or Tracking ID to track your package.');
      inputRef.current?.focus();
      return;
    }

    const matched = findOrderByQuery(clean);
    onClose();
    if (matched) {
      navigate(`/track/${matched.trackingUuid}`);
    } else {
      // Dynamic fallback for custom tracking IDs
      navigate(`/track/${encodeURIComponent(clean)}`);
    }
  };

  const handleQuickFill = (sampleId: string) => {
    setQuery(sampleId);
    setError(null);
    inputRef.current?.focus();
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
          width: '500px',
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
              <Compass size={22} />
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
                Track Your Delivery
              </h3>
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem',
                }}
              >
                Enter your private Tracking ID or Order ID to view real-time delivery status.
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

        {/* Input Form Body */}
        <div style={{ padding: '1.75rem 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <label
              htmlFor="tracking-input"
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Order ID or Tracking ID
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--bg-surface)',
                border: error ? '1.5px solid var(--status-rose-text)' : '1px solid var(--border-medium)',
                borderRadius: '12px',
                padding: '0.45rem 0.5rem 0.45rem 0.95rem',
                transition: 'border-color var(--duration-fast) ease',
              }}
            >
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                id="tracking-input"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. ORD-8942 or 36-digit tracking code..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.925rem',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-main)',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setError(null);
                    inputRef.current?.focus();
                  }}
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.875rem',
                  borderRadius: '9px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Track Package</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--status-rose-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginTop: '0.2rem',
                }}
              >
                <AlertTriangle size={13} />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Quick Demo Helper Pills (Discreet, privacy-preserving) */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-card-subtle)',
              borderRadius: '12px',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <ShieldCheck size={14} style={{ color: 'var(--primary)' }} />
              <span>Customer Privacy Protected • Only your designated order is accessible</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Demo evaluation IDs:
              </span>
              {['ORD-8942', 'ORD-8945', 'ORD-8943'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleQuickFill(id)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all var(--duration-fast) ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
