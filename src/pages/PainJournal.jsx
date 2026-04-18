import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Plus, MapPin, Clock, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { usePatientData } from '../hooks/usePatientData';
import { PAIN_SCALE } from '../data/exercises';
import { generateId } from '../utils/storage';

const LOCATIONS = ['Knee (front)', 'Knee (back)', 'Knee (inner)', 'Knee (outer)', 'Thigh', 'Calf', 'Hip', 'Lower Back', 'Shoulder', 'Ankle', 'Other'];
const ACTIVITIES = ['Rest', 'Walking', 'Stairs', 'Exercise', 'Sitting', 'Standing', 'Night/Sleep', 'Morning stiffness'];

export default function PainJournal() {
  const { t, i18n } = useTranslation('pain');
  const [entries, setEntries] = usePatientData('pain_entries', []);
  const [showForm, setShowForm] = useState(false);
  const [level, setLevel] = useState(3);
  const [location, setLocation] = useState('Knee (front)');
  const [activity, setActivity] = useState('Rest');
  const [swelling, setSwelling] = useState('None');
  const [stiffness, setStiffness] = useState('Mild');
  const [notes, setNotes] = useState('');
  const [rom, setRom] = useState('');

  const saveEntry = () => {
    const entry = {
      id: generateId(), timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      level, location, activity, swelling, stiffness,
      rom: rom ? Number(rom) : null, notes,
    };
    setEntries(prev => [...prev, entry]);
    setShowForm(false);
    setLevel(3); setNotes(''); setRom('');
  };

  const deleteEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id));

  const recentEntries = entries.slice(-7);
  const olderEntries = entries.slice(-14, -7);
  const avgRecent = recentEntries.length ? recentEntries.reduce((a, e) => a + e.level, 0) / recentEntries.length : null;
  const avgOlder = olderEntries.length ? olderEntries.reduce((a, e) => a + e.level, 0) / olderEntries.length : null;
  const trend = avgRecent !== null && avgOlder !== null
    ? avgRecent < avgOlder ? 'improving' : avgRecent > avgOlder ? 'worsening' : 'stable' : null;
  const romEntries = entries.filter(e => e.rom != null);
  const latestRom = romEntries[romEntries.length - 1]?.rom;

  const pillStyle = (active) => ({
    fontSize: '0.7rem', padding: '5px 12px', borderRadius: '50px',
    border: `1.5px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: active ? 'var(--color-accent)' : 'white',
    color: active ? 'white' : 'var(--color-text)',
    fontFamily: "'Public Sans'", fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>{t('title')}</h1>
          <p style={{ fontSize: '0.85rem' }}>{t('subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'var(--color-secondary)', color: 'white',
          padding: '9px 16px', borderRadius: '50px', border: 'none',
          fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '1.2px', cursor: 'pointer', flexShrink: 0,
        }}>
          <Plus size={13} /> {t('newEntry')}
        </button>
      </div>

      {/* Trend Summary */}
      {entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '2px' }}>{PAIN_SCALE[entries[entries.length - 1].level]?.emoji}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-secondary)' }}>{entries[entries.length - 1].level}/10</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginTop: '2px' }}>{t('trend.latestPain')}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '14px', textAlign: 'center' }}>
            <div style={{ margin: '0 auto', display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              {trend === 'improving' ? <TrendingDown size={22} style={{ color: '#4CAF50' }} /> :
               trend === 'worsening' ? <TrendingUp size={22} style={{ color: '#F44336' }} /> :
               <Minus size={22} style={{ color: 'var(--color-text)' }} />}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize',
              color: trend === 'improving' ? '#388E3C' : trend === 'worsening' ? '#D32F2F' : 'var(--color-secondary)' }}>
              {trend ? t(`trend.${trend === 'improving' ? 'improving' : trend === 'worsening' ? 'worsening' : 'stable'}`) : t('trend.tracking')}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginTop: '2px' }}>{t('trend.sevenDayTrend')}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-secondary)', marginTop: '6px' }}>{entries.length}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginTop: '6px' }}>{t('trend.totalEntries')}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-secondary)', marginTop: '6px' }}>{latestRom ? `${latestRom}°` : '—'}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text)', marginTop: '6px' }}>{t('trend.latestROM')}</div>
          </div>
        </div>
      )}

      {/* New Entry Form */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '2px solid var(--color-accent)', padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <h4>{t('newPainEntry')}</h4>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)' }}>
              {t('painLevel', { level, label: PAIN_SCALE[level].label, emoji: PAIN_SCALE[level].emoji })}
            </label>
            <input type="range" min="0" max="10" value={level} onChange={e => setLevel(Number(e.target.value))}
              style={{ width: '100%', border: 'none', padding: 0, background: 'transparent', accentColor: PAIN_SCALE[level].color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--color-text)', marginTop: '4px' }}>
              <span>{t('noPain')}</span><span>{t('worstPossible')}</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)' }}>
              <MapPin size={11} /> {t('painLocation')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {LOCATIONS.map(loc => (<button key={loc} onClick={() => setLocation(loc)} style={pillStyle(location === loc)}>{loc}</button>))}
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)' }}>
              <Clock size={11} /> {t('duringActivity')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {ACTIVITIES.map(act => (<button key={act} onClick={() => setActivity(act)} style={pillStyle(activity === act)}>{act}</button>))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)' }}>{t('swelling')}</label>
              <select value={swelling} onChange={e => setSwelling(e.target.value)}>
                <option>None</option><option>Mild</option><option>Moderate</option><option>Severe</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)' }}>{t('stiffness')}</label>
              <select value={stiffness} onChange={e => setStiffness(e.target.value)}>
                <option>None</option><option>Mild</option><option>Moderate</option><option>Severe</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)' }}>
              {t('rangeOfMotion')}
            </label>
            <input type="number" value={rom} onChange={e => setRom(e.target.value)} placeholder={t('romPlaceholder')} min="0" max="180" />
            <p style={{ fontSize: '0.65rem', color: 'var(--color-text)', marginTop: '4px' }}>
              {t('romHelp')}
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--color-secondary)' }}>{t('notes')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notesPlaceholder')} rows={2} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveEntry} style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              background: 'var(--color-secondary)', color: 'white',
              border: 'none', fontWeight: 600, fontSize: '0.7rem',
              textTransform: 'uppercase', letterSpacing: '1.2px', cursor: 'pointer',
            }}>{t('saveEntry')}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '11px 18px', borderRadius: '10px',
              background: 'white', color: 'var(--color-text)',
              border: '1px solid var(--color-border)', fontWeight: 500,
              fontSize: '0.78rem', cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Entries */}
      {entries.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>{t('painHistory')}</h3>
          {[...entries].reverse().map(entry => (
            <div key={entry.id} style={{
              background: 'white', borderRadius: '14px',
              border: '1px solid var(--color-border)', padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: PAIN_SCALE[entry.level]?.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0,
                  }}>
                    {PAIN_SCALE[entry.level]?.emoji}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{entry.level}/10</span>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.8px', padding: '2px 8px', borderRadius: '50px',
                        background: PAIN_SCALE[entry.level]?.color + '18',
                        color: PAIN_SCALE[entry.level]?.color,
                      }}>{PAIN_SCALE[entry.level]?.label}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginTop: '2px' }}>
                      {new Date(entry.timestamp).toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteEntry(entry.id)} style={{
                  padding: '6px', borderRadius: '8px', border: 'none',
                  background: 'transparent', color: 'var(--color-text)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                <Tag text={`📍 ${entry.location}`} />
                <Tag text={`🏃 ${entry.activity}`} />
                {entry.swelling !== 'None' && <Tag text={`🫧 Swelling: ${entry.swelling}`} />}
                {entry.stiffness !== 'None' && <Tag text={`🔗 Stiffness: ${entry.stiffness}`} />}
                {entry.rom != null && <Tag text={`📐 ROM: ${entry.rom}°`} />}
              </div>

              {entry.notes && (
                <p style={{
                  fontSize: '0.78rem', color: 'var(--color-text)', marginTop: '8px',
                  background: 'var(--color-bg-alt)', borderRadius: '8px', padding: '8px 10px',
                }}>
                  {entry.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : !showForm && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Heart size={40} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--color-border)' }} />
          <h4>{t('noPainEntries')}</h4>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>{t('startLogging')}</p>
        </div>
      )}
    </div>
  );
}

function Tag({ text }) {
  return (
    <span style={{
      fontSize: '0.65rem', background: 'var(--color-bg-alt)',
      color: 'var(--color-text)', padding: '3px 10px',
      borderRadius: '50px', fontWeight: 500,
    }}>{text}</span>
  );
}
