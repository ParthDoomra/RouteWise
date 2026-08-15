import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#000000', color: '#ffffff', fontFamily: "'Inter', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Nav Bar ── */}
      <header
        style={{
          backgroundColor: '#000000',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em', textDecoration: 'none' }}>
            RouteWise
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a
              href="#how-it-works"
              onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', textDecoration: 'none', fontWeight: 500, cursor: 'pointer' }}
            >
              Features
            </a>
            <Link
              to="/track/ORD-8942"
              style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', textDecoration: 'none', fontWeight: 500 }}
            >
              Track Order
            </Link>
            <Link
              to="/login"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '0.6rem 1.5rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.24px',
              }}
            >
              Sign In →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Band (Dark Canvas) ── */}
      <section style={{ padding: '88px 2rem', backgroundColor: '#000000' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#16181a',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              width: 'fit-content',
              fontSize: '0.75rem',
              color: '#ffffff',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}>
              <span style={{ color: '#494fdf' }}>●</span> AI/ML Final Year Engineering Project
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 500,
              lineHeight: 1.0,
              letterSpacing: '-0.8px',
              color: '#ffffff',
            }}>
              Algorithmic Fleet Dispatch & AI-Powered Delay Communication
            </h1>

            <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.72)', lineHeight: '1.56', letterSpacing: '-0.09px', maxWidth: '540px' }}>
              RouteWise automates multi-stop vehicle route optimization using a custom Nearest Neighbor and 2-opt heuristic engine, backed by live simulated tracking and natural-language AI delay explanations.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <Link
                to="/login"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  padding: '14px 28px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  letterSpacing: '0.24px',
                }}
              >
                Launch Manager Console
              </Link>
              <Link
                to="/track/ORD-8942"
                style={{
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  padding: '13px 27px',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  letterSpacing: '0.24px',
                }}
              >
                Try Customer Tracking Demo
              </Link>
            </div>
          </div>

          {/* Route Visualiser Card */}
          <div
            style={{
              backgroundColor: '#16181a',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Routing Engine Demo</span>
              <span style={{ fontSize: '0.7rem', color: '#00a87e', backgroundColor: 'rgba(0,168,126,0.12)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>2-opt Converged</span>
            </div>

            <svg viewBox="0 0 400 240" style={{ width: '100%', height: 'auto', backgroundColor: '#0a0a0a', borderRadius: '12px' }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <path d="M 50 180 L 120 70 L 220 150 L 340 60" fill="none" stroke="rgba(73,79,223,0.4)" strokeWidth="4" strokeDasharray="6 6" />
              <path d="M 50 180 L 120 70 L 220 150 L 340 60" fill="none" stroke="#494fdf" strokeWidth="3" />

              <circle cx="50" cy="180" r="10" fill="#00a87e" />
              <text x="50" y="184" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle">D</text>
              <text x="50" y="205" fontSize="11" fill="rgba(255,255,255,0.5)" textAnchor="middle">Depot (Start)</text>

              <circle cx="120" cy="70" r="9" fill="#494fdf" />
              <text x="120" y="74" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle">1</text>
              <text x="120" y="50" fontSize="11" fill="rgba(255,255,255,0.72)" textAnchor="middle">Stop 1 (ORD-8940)</text>

              <circle cx="220" cy="150" r="9" fill="#ec7e00" />
              <text x="220" y="154" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle">2</text>
              <text x="220" y="175" fontSize="11" fill="#ec7e00" textAnchor="middle">Stop 2 (Delayed)</text>

              <circle cx="340" cy="60" r="9" fill="#494fdf" />
              <text x="340" y="64" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle">3</text>
              <text x="340" y="42" fontSize="11" fill="rgba(255,255,255,0.72)" textAnchor="middle">Stop 3 (Final Drop)</text>
            </svg>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
              <span>Distance: <strong style={{ color: '#ffffff' }}>24.6 km</strong></span>
              <span>Algorithm Time: <strong style={{ color: '#ffffff' }}>&lt; 15ms</strong></span>
              <span>AI Message Trigger: <strong style={{ color: '#00a87e' }}>Active</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: '100px 2rem', backgroundColor: '#000000', borderTop: '1px solid rgba(255,255,255,0.08)', scrollMarginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '-0.48px',
              lineHeight: 1.15,
            }}>
              How RouteWise Works
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', marginTop: '1rem', lineHeight: 1.6 }}>
              From incoming order to doorstep delivery — four stages, fully automated.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: '📦',
                num: '01',
                title: 'Orders Come In',
                desc: 'New delivery orders are logged into the system with pickup location, drop address, and package details.',
              },
              {
                icon: '🧮',
                num: '02',
                title: 'Routes Auto-Optimized',
                desc: 'The routing engine calculates the most efficient multi-stop path using Nearest Neighbor + 2-opt heuristics.',
              },
              {
                icon: '🚛',
                num: '03',
                title: 'Drivers Get Directions',
                desc: 'Assigned drivers receive their optimized route sequence on their device and begin deliveries.',
              },
              {
                icon: '📡',
                num: '04',
                title: 'Customers Get Live Updates',
                desc: 'Real-time tracking and AI-generated delay notifications are sent to customers automatically.',
              },
            ].map((step) => (
              <div
                key={step.num}
                style={{
                  backgroundColor: '#16181a',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Step number watermark */}
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '16px',
                  fontSize: '5rem',
                  fontWeight: 800,
                  color: 'rgba(255,255,255,0.03)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                  {step.num}
                </span>

                <span style={{ fontSize: '1.75rem' }}>{step.icon}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.33, marginTop: '0.25rem' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Capabilities ── */}
      <section id="features" style={{ padding: '100px 2rem', backgroundColor: '#000000', borderTop: '1px solid rgba(255,255,255,0.08)', scrollMarginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 500,
              color: '#ffffff',
              letterSpacing: '-0.48px',
              lineHeight: 1.15,
            }}>
              Built for Real Operations
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', marginTop: '1rem', lineHeight: 1.6 }}>
              Every capability is purpose-built for fleet delivery — no generic dashboards or third-party black boxes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: '⚡',
                title: 'Route Optimization',
                desc: 'Custom-built Nearest Neighbor + 2-opt algorithm computes optimal multi-stop sequences — fully self-implemented, no third-party routing API.',
                accentColor: '#494fdf',
              },
              {
                icon: '🗺️',
                title: 'Live Fleet Tracking',
                desc: 'Real-time vehicle positions rendered on an interactive map with color-coded status markers, route polylines, and driver detail inspectors.',
                accentColor: '#00a87e',
              },
              {
                icon: '🔧',
                title: 'Predictive Maintenance',
                desc: 'Automated mileage-based monitoring triggers service alerts when vehicles approach maintenance thresholds — before breakdowns happen.',
                accentColor: '#ec7e00',
              },
              {
                icon: '✨',
                title: 'AI Delay Notifications',
                desc: 'When deliveries hit traffic or weather delays, the Claude API generates specific, reassuring customer messages explaining the situation and revised ETA.',
                accentColor: '#494fdf',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  backgroundColor: '#16181a',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                }}
              >
                {/* Accent top bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '28px',
                  right: '28px',
                  height: '2px',
                  background: `linear-gradient(90deg, ${item.accentColor}, transparent)`,
                  borderRadius: '0 0 2px 2px',
                }} />

                <span style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{item.icon}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', lineHeight: 1.33, marginTop: '0.25rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        backgroundColor: '#0a0a0a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '64px 2rem 0',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Top row — brand + columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            paddingBottom: '48px',
          }}>

            {/* Brand column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link to="/" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', textDecoration: 'none', letterSpacing: '-0.02em' }}>
                RouteWise
              </Link>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: '280px' }}>
                Smart fleet dispatch and AI-powered delivery communication platform — built as an AI/ML Final Year Engineering Project.
              </p>
            </div>

            {/* Quick Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                Quick Links
              </span>
              <Link to="/login" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Manager Console</Link>
              <Link to="/track/ORD-8942" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Track an Order</Link>
              <Link to="/driver/route" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Driver View</Link>
            </div>

            {/* Tech Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                Tech Stack
              </span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>React + TypeScript</span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Leaflet / OpenStreetMap</span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Claude API (Anthropic)</span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Custom 2-Opt Engine</span>
            </div>

            {/* Project Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                Project
              </span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Final Year B.Tech</span>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>AI/ML Domain</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.6)',
              }}>
                <span style={{ color: '#494fdf' }}>●</span> Academic Project
              </span>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '1.5rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
              © {new Date().getFullYear()} RouteWise — Built for academic demonstration purposes.
            </span>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
              Designed & Developed with ❤️
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
