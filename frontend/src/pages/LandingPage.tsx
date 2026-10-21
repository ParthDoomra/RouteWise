import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InteractiveGlobe } from '../components/InteractiveGlobe';
import { ArrowRight, ShieldCheck, Zap, Sparkles, MapPin } from 'lucide-react';
import { CustomerTrackingModal } from '../components/CustomerTrackingModal';

export const LandingPage: React.FC = () => {
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Top Navigation Bar (Light Warm Theme) ── */}
      <header
        style={{
          backgroundColor: '#FAF7F2',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 2rem',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(43, 36, 30, 0.03)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#FAF7F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
              }}
            >
              RW
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em', fontFamily: 'var(--font-serif)' }}>
              Route<span style={{ color: '#C49746' }}>Wise</span>
            </div>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <a
              href="#how-it-works"
              onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, transition: 'color 160ms ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, transition: 'color 160ms ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              Key Capabilities
            </a>
            <button
              type="button"
              onClick={() => setIsTrackingModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                color: 'var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
                transition: 'opacity 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Track Order
            </button>
            <Link
              to="/login"
              style={{
                backgroundColor: '#201A16',
                color: '#FAF7F2',
                padding: '0.6rem 1.45rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: '0.01em',
                transition: 'transform 160ms var(--ease-spring), background-color 160ms ease',
                boxShadow: '0 2px 8px rgba(32, 26, 22, 0.18)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Dispatcher Portal &rarr;
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section (Light Warm Theme + 3D WebGL Globe Background Layer) ── */}
      <section
        style={{
          backgroundColor: '#F5F1EA',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '680px',
          display: 'flex',
          alignItems: 'center',
          padding: '80px 2rem 90px',
        }}
      >
        {/* ── 1. Large 3D Rotating WebGL Globe as Background Layer ── */}
        <div
          style={{
            position: 'absolute',
            right: '-4%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 'clamp(580px, 58vw, 920px)',
            height: 'clamp(580px, 58vw, 920px)',
            zIndex: 1,
            pointerEvents: 'auto',
            opacity: 1.0,
          }}
        >
          <InteractiveGlobe />
        </div>

        {/* ── 2. Subtle Radial Light Mask for Perfect Text Readability ── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            background: 'radial-gradient(circle at 18% 50%, rgba(245, 241, 234, 0.98) 0%, rgba(245, 241, 234, 0.88) 35%, rgba(245, 241, 234, 0.15) 62%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* ── 3. Foreground Hero Text & Actions (Layered on top) ── */}
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            position: 'relative',
            zIndex: 10,
            pointerEvents: 'none', // Allow clicks to pass through except on interactive children
          }}
        >
          <div
            className="animate-enter"
            style={{
              maxWidth: '640px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.75rem',
              pointerEvents: 'auto', // Re-enable interaction for buttons and text
            }}
          >
            {/* Top Operational Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                backgroundColor: '#FAF7F2',
                border: '1px solid var(--border-medium)',
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                width: 'fit-content',
                fontSize: '0.78rem',
                color: 'var(--text-main)',
                fontWeight: 700,
                boxShadow: '0 1px 3px rgba(43, 36, 30, 0.04)',
              }}
            >
              <span className="live-pulse-dot" style={{ backgroundColor: '#4A5D3A', width: '7px', height: '7px' }} />
              <span style={{ color: 'var(--text-secondary)' }}>2-Opt Deterministic Routing • Claude AI Delay Dispatches</span>
            </div>

            {/* Editorial Serif Heading */}
            <h1
              style={{
                fontSize: 'clamp(42px, 5.2vw, 68px)',
                fontWeight: 500,
                lineHeight: 1.08,
                color: 'var(--text-main)',
                letterSpacing: '-0.025em',
              }}
            >
              Precision Fleet Logistics for the <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>Modern</em> Enterprise
            </h1>

            {/* Clear Subtitle */}
            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.62,
                maxWidth: '540px',
                fontWeight: 450,
              }}
            >
              RouteWise pairs sub-15ms 2-Opt multi-stop route optimization with real-time GPS telemetry and natural-language AI delay explanations — cutting transit mileage and building recipient confidence.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <Link
                to="/login"
                className="btn btn-pill"
                style={{
                  backgroundColor: '#201A16',
                  color: '#FAF7F2',
                  padding: '14px 28px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  boxShadow: '0 4px 14px rgba(32, 26, 22, 0.22)',
                }}
              >
                <span>Launch Dispatch Console</span>
                <ArrowRight size={16} />
              </Link>

              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(true)}
                className="btn btn-pill"
                style={{
                  backgroundColor: '#FAF7F2',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-medium)',
                  padding: '14px 26px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: '0 1px 3px rgba(43, 36, 30, 0.04)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  e.currentTarget.style.backgroundColor = '#FAF7F2';
                }}
              >
                <span>Live Customer Tracking Demo</span>
              </button>
            </div>

            {/* Quick Metrics Card Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.25rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-light)',
                marginTop: '0.75rem',
              }}
            >
              <div>
                <div className="font-mono" style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main)' }}>&lt; 15 ms</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>2-Opt Heuristic Latency</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--primary)' }}>14.2%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Transit Distance Saved</div>
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--status-emerald-text)' }}>94.2%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>On-Time SLA Compliance</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How It Works (Warm Cream Canvas + Curated Photography) ── */}
      <section id="how-it-works" style={{ padding: '100px 2rem', backgroundColor: 'var(--bg-app)', scrollMarginTop: '70px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              End-to-End Orchestration
            </span>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 500,
              color: 'var(--text-main)',
              marginTop: '0.4rem',
              lineHeight: 1.15,
            }}>
              How RouteWise Transforms Fleet Dispatch
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              From initial dispatch intake to doorstep verification — four coordinated stages engineered for total operational clarity.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1.75rem' }}>
            {[
              {
                num: '01',
                title: 'Order Manifest Intake',
                desc: 'Incoming packages and multi-drop delivery manifests are captured with recipient delivery windows, addresses, and payload weights.',
                img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
                alt: 'Modern logistics warehouse sorting facility',
              },
              {
                num: '02',
                title: '2-Opt Route Optimization',
                desc: 'Our client-side heuristic engine calculates optimal multi-stop sequences in sub-15ms, eliminating intersecting delivery loops.',
                img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80',
                alt: 'City logistics map and traffic telemetry visualization',
              },
              {
                num: '03',
                title: 'Driver Console Guidance',
                desc: 'Couriers receive ordered turn-by-turn waypoint manifests on mobile devices with instant one-tap delay and completion logging.',
                img: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
                alt: 'Delivery courier vehicle on route in city street',
              },
              {
                num: '04',
                title: 'AI Customer Delay Notices',
                desc: 'When GPS telemetry detects traffic bottlenecks, Claude AI drafts reassuring natural-language notices with revised arrival ETAs.',
                img: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=600&q=80',
                alt: 'Customer receiving doorstep package notification',
              },
            ].map((step, idx) => (
              <div
                key={step.num}
                className={`card card-hover-lift animate-enter stagger-${idx + 1}`}
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-light)',
                  borderRadius: '16px',
                }}
              >
                {/* Editorial Photo Frame */}
                <div style={{ height: '180px', position: 'relative', overflow: 'hidden', backgroundColor: '#EFEAE1' }}>
                  <img
                    src={step.img}
                    alt={step.alt}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'contrast(1.02) brightness(0.96)',
                      transition: 'transform 400ms var(--ease-out)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(32, 26, 22, 0.88)',
                      color: '#FAF7F2',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    STEP {step.num}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Key Capabilities (Warm Sand Panel + Clean Editorial Cards) ── */}
      <section id="features" style={{ padding: '100px 2rem', backgroundColor: '#FAF7F2', borderTop: '1px solid var(--border-light)', scrollMarginTop: '70px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4rem' }}>

          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Engineered Capabilities
            </span>
            <h2 style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 500,
              color: 'var(--text-main)',
              marginTop: '0.4rem',
              lineHeight: 1.15,
            }}>
              Designed for High-Density Operations
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginTop: '0.75rem', lineHeight: 1.6 }}>
              Deterministic combinatorial optimization paired with Claude LLM intelligence to eliminate city delivery friction.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {[
              {
                icon: <Zap size={22} />,
                title: 'Deterministic 2-Opt Optimizer',
                highlight: 'Sub-15ms Client-Side Matrix',
                desc: 'Computes Euclidean & Haversine distance matrices on the fly, systematically swapping intersecting route edges to deliver the shortest path without server-side compute bottlenecks.',
              },
              {
                icon: <Sparkles size={22} />,
                title: 'Natural-Language AI Dispatches',
                highlight: 'Claude API Integration',
                desc: 'Translates GPS traffic telemetry, weather flags, and route diversions into empathetic, context-rich recipient notifications that reduce anxious customer inquiries.',
              },
              {
                icon: <MapPin size={22} />,
                title: 'Real-Time Telemetry Map',
                highlight: 'Animated Polyline & Live GPS',
                desc: 'Simulates continuous vehicle coordinates along delivery routes with speedometers, battery/fuel monitoring, and dedicated customer tracking links.',
              },
              {
                icon: <ShieldCheck size={22} />,
                title: 'Predictive Fleet Health',
                highlight: 'Automated Odometer Thresholds',
                desc: 'Monitors vehicle mileage against 5,000 km service intervals, auto-generating workshop maintenance tickets before equipment failure disrupts delivery schedules.',
              },
            ].map((cap, idx) => (
              <div
                key={cap.title}
                className={`card card-hover-lift animate-enter stagger-${idx + 1}`}
                style={{
                  padding: '2.25rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary-tint)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--primary-border)',
                  }}
                >
                  {cap.icon}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {cap.title}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {cap.highlight}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Editorial Footer (Light Warm Theme) ── */}
      <footer style={{ backgroundColor: '#FAF7F2', color: 'var(--text-main)', borderTop: '1px solid var(--border-light)', padding: '72px 2rem 36px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
            
            {/* Column 1: Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary)',
                    color: '#FAF7F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                  }}
                >
                  RW
                </div>
                <span style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-serif)' }}>
                  RouteWise
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '280px' }}>
                Algorithmic fleet dispatch and AI-powered delay communication platform for modern logistics operations.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className="live-pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--status-emerald-text)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>All Telemetry Streams Active</span>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Application Views
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  Dispatcher Command Center
                </Link>
                <Link to="/manager/map" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  Live Fleet Dispatch Map
                </Link>
                <Link to="/driver/route" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>
                  Driver Route Console
                </Link>
                <button
                  type="button"
                  onClick={() => setIsTrackingModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    padding: 0,
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  Customer Live Tracking
                </button>
              </div>
            </div>

            {/* Column 3: Tech Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Architecture & Stack
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>React 19 + TypeScript + Vite</span>
                <span>react-globe.gl 3D WebGL Engine</span>
                <span>Claude 3.5 Sonnet / Haiku API</span>
                <span>Leaflet + OpenStreetMap</span>
                <span>Client-Side 2-Opt Heuristic</span>
              </div>
            </div>

            {/* Column 4: Academic Context */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Project Overview
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>AI/ML Final Year Capstone</span>
                <span>Deterministic + LLM Hybrid</span>
                <span>Client-Side Haversine Matrix</span>
                <span style={{ color: 'var(--status-emerald-text)', fontWeight: 700 }}>Sub-15ms Heuristic Latency</span>
              </div>
            </div>

          </div>

          <div style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}>
            <span>&copy; {new Date().getFullYear()} RouteWise. Final Year Engineering Project.</span>
            <span>All operational systems active.</span>
          </div>

        </div>
      </footer>

      {/* Customer Tracking Modal */}
      <CustomerTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />
    </div>
  );
};
