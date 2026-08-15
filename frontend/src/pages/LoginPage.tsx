import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@routewise.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/manager/dashboard');
  };

  return (
    <div
      style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.75rem',
        }}
      >
        {/* Logo Branding */}
        <div style={{ textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#191c1f', letterSpacing: '-0.02em', textDecoration: 'none', display: 'block' }}>
            RouteWise
          </Link>
          <p style={{ fontSize: '0.875rem', color: '#505a63', marginTop: '0.35rem' }}>
            Smart Fleet & Delivery Route Optimization
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#191c1f', marginBottom: '0.4rem' }}>
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e2e7',
                fontSize: '1rem',
                outline: 'none',
                height: '56px',
                fontFamily: "'Inter', sans-serif",
                color: '#191c1f',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#191c1f' }}>
                Password
              </label>
              <span style={{ fontSize: '0.75rem', color: '#494fdf', cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e2e2e7',
                fontSize: '1rem',
                outline: 'none',
                height: '56px',
                fontFamily: "'Inter', sans-serif",
                color: '#191c1f',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px 28px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#000000',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '0.5rem',
              height: '48px',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.24px',
            }}
          >
            Sign In to Dashboard →
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid #e2e2e7', paddingTop: '1.25rem', fontSize: '0.8rem', color: '#505a63' }}>
          Quick Demo Access: <strong style={{ color: '#191c1f' }}>manager@routewise.com</strong>
        </div>
      </div>
    </div>
  );
};
