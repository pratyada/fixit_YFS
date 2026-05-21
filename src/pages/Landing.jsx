import { Link } from 'react-router-dom';
import { Activity, Dumbbell, Camera, Heart, BarChart3, Brain, Check, ArrowRight, Sparkles, Shield, Star, ChevronDown } from 'lucide-react';
import { useClinic } from '../contexts/ClinicContext';

const FEATURES = [
  { icon: Dumbbell, title: 'Exercise Library', desc: '100+ guided exercises for rehab, fitness, and pain management with step-by-step instructions.', color: '#708E86' },
  { icon: Camera, title: 'AI Pose Scoring', desc: 'Record your exercises and get real-time form analysis powered by AI pose detection.', color: '#6B7FA3' },
  { icon: BarChart3, title: 'Progress Tracking', desc: 'Visualize your journey with charts, streaks, milestones, and detailed analytics.', color: '#8B7355' },
  { icon: Heart, title: 'Pain Journal', desc: 'Track pain levels, swelling, and ROM to understand patterns and share with your care team.', color: '#A36B6B' },
  { icon: Brain, title: 'Smart Recommendations', desc: 'Get personalized exercise suggestions based on your goals, conditions, and experience level.', color: '#5E35B1' },
  { icon: Activity, title: 'Outcome Measures', desc: 'Validated questionnaires (KOOS, LEFS, DASH) to quantify your recovery progress.', color: '#00897B' },
];

const PRICING = [
  { name: 'Free', price: '$0', period: 'forever', features: ['5 exercises', '2 sessions/week', 'Pain journal', 'Basic stats'], color: '#6B7280', cta: 'Get Started Free' },
  { name: 'Basic', price: '$7', period: '/mo', features: ['Full exercise library', 'Unlimited sessions', 'Progress charts', 'Outcome measures'], color: '#1565C0', cta: 'Start Basic' },
  { name: 'Pro', price: '$15', period: '/mo', features: ['Everything in Basic', 'AI pose scoring', 'Video recording', '3D visualizations', 'Programs & protocols'], color: '#F57C00', cta: 'Go Pro', popular: true },
];

const FAQ = [
  { q: 'What is FIXIT?', a: 'FIXIT is an AI-powered health tracking app that helps you exercise with proper form, track pain and progress, and follow personalized programs — all from your phone.' },
  { q: 'Do I need any equipment?', a: 'No! Many exercises use no equipment at all. Some use common items like resistance bands or a chair. Each exercise clearly lists what\'s needed.' },
  { q: 'How does AI pose scoring work?', a: 'Using your phone camera, our AI detects your body position in real-time and scores your form on range of motion, posture, and stability — just like having a trainer watch you.' },
  { q: 'Can I cancel anytime?', a: 'Yes! There are no contracts or commitments. Cancel your subscription anytime from the billing portal. You\'ll keep access until the end of your billing period.' },
  { q: 'Is my data private?', a: 'Absolutely. We\'re PIPEDA compliant, your data is encrypted, and you can delete your account and all data at any time. Videos are stored securely and never shared.' },
];

export default function Landing() {
  const clinic = useClinic();

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* ── Nav ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={clinic.logo} alt="FIXIT" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
          <span style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.1rem', color: 'var(--color-secondary)' }}>FIXIT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="#features" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text)', textDecoration: 'none' }}>Features</a>
          <a href="#pricing" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text)', textDecoration: 'none' }}>Pricing</a>
          <Link to="/guides" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text)', textDecoration: 'none' }}>Guides</Link>
          <Link to="/login" style={{
            padding: '8px 20px', borderRadius: '8px',
            background: 'var(--color-secondary)', color: 'white',
            textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
          }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        textAlign: 'center', padding: '80px 24px 50px',
        maxWidth: '720px', margin: '0 auto',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '50px',
          background: '#EDF3F1', color: '#708E86',
          fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '1px', marginBottom: '20px',
        }}>
          <Sparkles size={12} /> AI-Powered Health Tracking
        </div>

        <h1 style={{
          fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-secondary)',
          lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-1px',
        }}>
          Your Personal
          <br />
          <span style={{ color: '#708E86' }}>AI Health Tracker</span>
        </h1>

        <p style={{
          fontSize: '1.05rem', color: 'var(--color-text)', lineHeight: 1.6,
          maxWidth: '480px', margin: '0 auto 28px',
        }}>
          Track exercises, analyze your form with AI, monitor pain, and watch your progress — all in one app. No trainer needed.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/login" style={{
            padding: '14px 32px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #708E86, #4E4E53)',
            color: 'white', textDecoration: 'none',
            fontSize: '0.95rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 16px rgba(112,142,134,0.3)',
          }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
          <a href="#features" style={{
            padding: '14px 24px', borderRadius: '12px',
            border: '2px solid var(--color-border)',
            color: 'var(--color-secondary)', textDecoration: 'none',
            fontSize: '0.95rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            Learn More <ChevronDown size={16} />
          </a>
        </div>

        {/* Trust signals */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '24px',
          marginTop: '32px', fontSize: '0.72rem', color: 'var(--color-text)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} /> PIPEDA Compliant
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Star size={12} color="#F57C00" /> 100+ Exercises
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} /> AI Scoring
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{
        padding: '60px 24px', maxWidth: '1100px', margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '8px' }}>
            Everything you need to move better
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', maxWidth: '480px', margin: '0 auto' }}>
            Whether you're rehabbing an injury, building strength, or managing pain — FIXIT has you covered.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{
                background: 'white', borderRadius: '16px',
                border: '1px solid var(--color-border)', padding: '24px',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: `${f.color}12`, color: f.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '14px',
                }}>
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '6px' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{
        padding: '60px 24px', background: 'var(--color-bg-alt)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-secondary)', marginBottom: '8px' }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
              Start free, upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {PRICING.map(p => (
              <div key={p.name} style={{
                background: 'white', borderRadius: '16px',
                border: p.popular ? `2px solid ${p.color}` : '1px solid var(--color-border)',
                padding: '28px 24px', position: 'relative',
                textAlign: 'center',
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
                    background: p.color, color: 'white',
                    padding: '3px 14px', borderRadius: '50px',
                    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <Sparkles size={10} /> Most Popular
                  </div>
                )}
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)', marginBottom: '4px' }}>
                  {p.name}
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: p.color }}>{p.price}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{p.period}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-secondary)' }}>
                      <Check size={14} color={p.color} /> {f}
                    </div>
                  ))}
                </div>
                <Link to="/login" style={{
                  display: 'block', padding: '12px', borderRadius: '10px',
                  background: p.popular ? p.color : 'var(--color-bg-alt)',
                  color: p.popular ? 'white' : 'var(--color-secondary)',
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                  border: p.popular ? 'none' : '1px solid var(--color-border)',
                }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{
        padding: '60px 24px', maxWidth: '720px', margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-secondary)', textAlign: 'center', marginBottom: '32px' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQ.map((f, i) => (
            <details key={i} style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid var(--color-border)', overflow: 'hidden',
            }}>
              <summary style={{
                padding: '16px 18px', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-secondary)',
                listStyle: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {f.q}
                <ChevronDown size={16} style={{ flexShrink: 0, opacity: 0.4 }} />
              </summary>
              <div style={{
                padding: '0 18px 16px',
                fontSize: '0.82rem', color: 'var(--color-text)', lineHeight: 1.6,
              }}>
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '40px 24px', background: 'var(--color-secondary)', color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
            <img src={clinic.logo} alt="FIXIT" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
            <span style={{ fontFamily: "'Tenor Sans', serif", fontSize: '1.1rem', color: 'white' }}>FIXIT</span>
          </div>
          <p style={{ fontSize: '0.8rem', lineHeight: 1.6, marginBottom: '16px' }}>
            AI-powered health tracking by{' '}
            <a href="https://yourformsux.com" target="_blank" rel="noopener noreferrer" style={{ color: '#B0C4BB', textDecoration: 'none', fontWeight: 600 }}>
              YourFormSux
            </a>
            . Built in Toronto, Canada.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.72rem' }}>
            <Link to="/guides" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Guides</Link>
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy Policy</Link>
            <a href="https://yourformsux.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>YourFormSux.com</a>
          </div>
          <div style={{ fontSize: '0.65rem', marginTop: '16px', opacity: 0.4 }}>
            &copy; {new Date().getFullYear()} FIXIT. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
