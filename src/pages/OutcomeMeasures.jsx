import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, ChevronRight, ArrowLeft, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { OUTCOME_MEASURES, getMeasureById } from '../data/outcomeMeasures';
import { usePatientData } from '../hooks/usePatientData';
import { generateId } from '../utils/storage';
import { Line } from 'react-chartjs-2';

export default function OutcomeMeasures() {
  const { t } = useTranslation('progress');
  const [scores, setScores] = usePatientData('outcome_scores', []);
  const [activeMeasure, setActiveMeasure] = useState(null);
  const [responses, setResponses] = useState({});
  const [submittedScore, setSubmittedScore] = useState(null);

  const startMeasure = (measure) => {
    setActiveMeasure(measure);
    setResponses({});
    setSubmittedScore(null);
  };

  const submit = () => {
    const arr = activeMeasure.questions.map(q => responses[q.id]);
    const score = activeMeasure.calculate(arr);
    const interp = activeMeasure.interpret(score);
    const record = {
      id: generateId(),
      measureId: activeMeasure.id,
      measureName: activeMeasure.name,
      bodyPart: activeMeasure.bodyPart,
      score,
      interpretation: interp,
      responses: arr,
      timestamp: new Date().toISOString(),
    };
    setScores([...scores, record]);
    setSubmittedScore(record);
  };

  const isComplete = activeMeasure && activeMeasure.questions.every(q => responses[q.id] !== undefined);

  // ─── Active questionnaire view ───
  if (activeMeasure && !submittedScore) {
    const answeredCount = Object.keys(responses).length;
    const total = activeMeasure.questions.length;
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', margin: '0 auto' }}>
        <button onClick={() => setActiveMeasure(null)} style={{
          display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem',
          color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer',
          alignSelf: 'flex-start',
        }}>
          <ArrowLeft size={15} /> Back to Measures
        </button>

        <div style={{
          background: 'linear-gradient(135deg, #708E86, #4E4E53)',
          borderRadius: '20px', padding: '24px', color: 'white',
        }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
            {activeMeasure.bodyPart}
          </div>
          <h2 style={{ color: 'white', marginBottom: '6px' }}>{activeMeasure.name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {activeMeasure.instructions}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
            <span>Progress</span>
            <span>{answeredCount} / {total}</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(answeredCount / total) * 100}%`,
              background: 'white', borderRadius: '3px', transition: 'width 0.4s',
            }} />
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeMeasure.questions.map((q, i) => (
            <div key={q.id} style={{
              background: 'white', borderRadius: '14px',
              border: '1px solid var(--color-border)', padding: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                  {q.text}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {q.options.map((opt, optIdx) => {
                  const selected = responses[q.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => setResponses({ ...responses, [q.id]: optIdx })}
                      style={{
                        textAlign: 'left', padding: '10px 14px',
                        borderRadius: '10px', cursor: 'pointer',
                        border: `1.5px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selected ? 'var(--color-bg-alt)' : 'white',
                        color: selected ? 'var(--color-accent)' : 'var(--color-text)',
                        fontSize: '0.83rem',
                        display: 'flex', alignItems: 'center', gap: '10px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selected ? 'var(--color-accent)' : 'white',
                        position: 'relative',
                      }}>
                        {selected && (
                          <div style={{
                            position: 'absolute', inset: '3px', borderRadius: '50%', background: 'white',
                          }} />
                        )}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button onClick={submit} disabled={!isComplete} style={{
          padding: '14px', borderRadius: '50px',
          background: isComplete ? 'var(--color-secondary)' : '#ccc',
          color: 'white', border: 'none',
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
          cursor: isComplete ? 'pointer' : 'default',
        }}>
          {isComplete ? 'Submit & Calculate Score' : `Answer all ${total - answeredCount} remaining questions`}
        </button>
      </div>
    );
  }

  // ─── Result view ───
  if (submittedScore) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => { setActiveMeasure(null); setSubmittedScore(null); }} style={{
          display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem',
          color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer',
          alignSelf: 'flex-start',
        }}>
          <ArrowLeft size={15} /> Back to Measures
        </button>

        <div style={{
          background: 'white', borderRadius: '20px', padding: '32px 24px',
          border: '1px solid var(--color-border)', textAlign: 'center',
        }}>
          <CheckCircle2 size={42} style={{ color: '#4CAF50', margin: '0 auto 12px', display: 'block' }} />
          <h2 style={{ marginBottom: '4px' }}>{submittedScore.measureName}</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', marginBottom: '24px' }}>
            Completed {new Date(submittedScore.timestamp).toLocaleDateString()}
          </p>

          <div style={{
            background: submittedScore.interpretation.color + '15',
            borderRadius: '20px', padding: '24px',
            border: `2px solid ${submittedScore.interpretation.color}`,
          }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 700, color: submittedScore.interpretation.color, lineHeight: 1 }}>
              {submittedScore.score}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text)', marginTop: '4px' }}>out of 100</div>
            <div style={{
              display: 'inline-block', marginTop: '14px',
              padding: '6px 16px', borderRadius: '50px',
              background: submittedScore.interpretation.color, color: 'white',
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
            }}>
              {submittedScore.interpretation.level}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-secondary)', marginTop: '14px' }}>
              {submittedScore.interpretation.text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view (default) ───
  const grouped = {};
  OUTCOME_MEASURES.forEach(m => {
    if (!grouped[m.bodyPart]) grouped[m.bodyPart] = [];
    grouped[m.bodyPart].push(m);
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>Outcome Measures</h1>
        <p style={{ fontSize: '0.85rem' }}>Standardized questionnaires used by physiotherapists to track recovery</p>
      </div>

      {/* Recent results */}
      {scores.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '12px' }}>Your History</h3>
          <ScoreHistory scores={scores} />
        </div>
      )}

      {/* Available measures */}
      <div>
        <h3 style={{ marginBottom: '12px' }}>Available Questionnaires</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(grouped).map(([bp, measures]) => (
            <div key={bp}>
              <h6 style={{ marginBottom: '10px' }}>{bp}</h6>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {measures.map(m => (
                  <button key={m.id} onClick={() => startMeasure(m)} style={{
                    background: 'white', borderRadius: '14px',
                    border: '1px solid var(--color-border)', padding: '18px',
                    textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    transition: 'all 0.25s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'var(--color-bg-alt)', color: 'var(--color-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-secondary)', marginBottom: '2px' }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text)', marginBottom: '8px' }}>
                        {m.fullName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                        {m.description}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: '8px', borderTop: '1px solid var(--color-border)',
                    }}>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--color-text)' }}>
                        <span>{m.questions.length} questions</span>
                        <span>{m.estimatedTime}</span>
                      </div>
                      <ChevronRight size={15} color="var(--color-accent)" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreHistory({ scores }) {
  // Group by measureId, show latest + trend
  const byMeasure = {};
  scores.forEach(s => {
    if (!byMeasure[s.measureId]) byMeasure[s.measureId] = [];
    byMeasure[s.measureId].push(s);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {Object.entries(byMeasure).map(([mid, list]) => {
        const sorted = [...list].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const latest = sorted[sorted.length - 1];
        const previous = sorted[sorted.length - 2];
        const measure = getMeasureById(mid);
        const trend = previous ? latest.score - previous.score : null;
        // Direction: for KOOS/LEFS (higher=better) up is good; for ODI/NDI/DASH up is worse
        const higherIsBetter = ['koos-jr', 'lefs'].includes(mid);
        const isImproving = trend != null && (higherIsBetter ? trend > 0 : trend < 0);

        return (
          <div key={mid} style={{
            background: 'white', borderRadius: '14px',
            border: '1px solid var(--color-border)', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            <div style={{
              width: '54px', height: '54px', borderRadius: '12px',
              background: latest.interpretation.color + '15',
              color: latest.interpretation.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, flexShrink: 0,
            }}>
              {latest.score}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
                {latest.measureName}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text)' }}>
                {latest.interpretation.level} • {sorted.length} record{sorted.length !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-text)' }}>
                {new Date(latest.timestamp).toLocaleDateString()}
              </div>
            </div>
            {trend != null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                color: isImproving ? '#4CAF50' : '#F44336',
                fontSize: '0.75rem', fontWeight: 600,
              }}>
                {isImproving ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {trend > 0 ? '+' : ''}{trend}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
