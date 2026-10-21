import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Lock,
  Phone,
  X,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  FLEET_DRIVERS,
  authenticateDriver,
  setStoredDriver,
  type DriverProfile,
} from '../data/mockDrivers';

interface DriverLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (driver: DriverProfile) => void;
}

export const DriverLoginModal: React.FC<DriverLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [identifier, setIdentifier] = useState('Rahul Sharma');
  const [pin, setPin] = useState('1024');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => {
        phoneInputRef.current?.focus();
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Driver Phone, Name, or Vehicle Plate.');
      phoneInputRef.current?.focus();
      return;
    }

    const authDriver = authenticateDriver(identifier, pin);
    if (!authDriver) {
      setError('Invalid driver credentials. Please check your Driver ID or 4-digit PIN.');
      return;
    }

    setStoredDriver(authDriver);
    if (onSuccess) {
      onSuccess(authDriver);
    }
    onClose();
    navigate('/driver/route');
  };

  const handleSelectDriverQuick = (driver: DriverProfile) => {
    setIdentifier(driver.name);
    setPin(driver.pin);
    setError(null);
    setStoredDriver(driver);
    if (onSuccess) {
      onSuccess(driver);
    }
    onClose();
    navigate('/driver/route');
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
          width: '520px',
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
              <Truck size={22} />
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
                Driver Console Login
              </h3>
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.15rem',
                }}
              >
                Enter your driver credentials to launch today's delivery waypoint route.
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
          
          {/* Quick Driver Profile Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Sparkles size={12} style={{ color: 'var(--accent-gold)' }} />
                <span>Select Fleet Driver (1-Click Sign In)</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {FLEET_DRIVERS.slice(0, 3).map((d) => {
                const isSelected = identifier === d.name;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDriverQuick(d)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                      backgroundColor: isSelected ? 'var(--primary-tint)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--duration-fast) ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                        e.currentTarget.style.borderColor = 'var(--border-medium)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-surface)',
                          color: isSelected ? '#FAF7F2' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        {d.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {d.vehiclePlate} • {d.vehicleModel}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                      <span>Launch</span>
                      <ArrowRight size={13} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              or enter custom driver PIN
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label
                htmlFor="driver-identifier"
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
                Driver Name, Mobile, or Vehicle Plate
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                }}
              >
                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  id="driver-identifier"
                  ref={phoneInputRef}
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Rahul Sharma or KA-01-EA-1024"
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
              <label
                htmlFor="driver-pin"
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
                4-Digit Driver Security PIN
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                }}
              >
                <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  id="driver-pin"
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. 1024"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                    letterSpacing: '0.15em',
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
              }}
            >
              <span>Authenticate & Open Driver Route</span>
              <ArrowRight size={15} />
            </button>
          </form>

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
            <span>Driver Telematics • Auto-syncs live GPS coords to Dispatcher Map</span>
          </div>

        </div>
      </div>
    </div>
  );
};
