import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, CreditCard, Globe, Shield, Trash2, ChevronRight, Save, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { setUserProfile } from '../lib/firestore';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Settings() {
  const { user, profile, refreshProfile, deleteAccount, logout } = useAuth();
  const { tierInfo } = useSubscription();

  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await setUserProfile(user.uid, { name });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    try {
      await deleteAccount();
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '0.85rem' }}>Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Section icon={<User size={16} />} title="Profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <div style={{ ...inputStyle, background: '#F5F5F5', color: 'var(--color-text)' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || name === profile?.name}
            style={{
              padding: '10px 20px', borderRadius: '10px',
              background: saving || name === profile?.name ? '#E0E0E0' : 'var(--color-secondary)',
              border: 'none', color: 'white',
              fontSize: '0.82rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              alignSelf: 'flex-start',
            }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </Section>

      {/* Subscription */}
      <Section icon={<CreditCard size={16} />} title="Subscription">
        <Link to="/subscription" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: '10px',
          background: 'var(--color-bg-alt)', textDecoration: 'none',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-secondary)' }}>
              {tierInfo.name} Plan
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text)', marginTop: '2px' }}>
              {tierInfo.price === 0 ? 'Free forever' : `${tierInfo.priceLabel}`}
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--color-text)', opacity: 0.4 }} />
        </Link>
      </Section>

      {/* Language */}
      <Section icon={<Globe size={16} />} title="Language">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSwitcher />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>
            Select your preferred language
          </span>
        </div>
      </Section>

      {/* Privacy */}
      <Section icon={<Shield size={16} />} title="Privacy">
        <Link to="/privacy" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: '10px',
          background: 'var(--color-bg-alt)', textDecoration: 'none',
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-secondary)' }}>
            Privacy Policy
          </span>
          <ChevronRight size={16} style={{ color: 'var(--color-text)', opacity: 0.4 }} />
        </Link>
      </Section>

      {/* Danger Zone */}
      <Section icon={<Trash2 size={16} color="#E53935" />} title="Danger Zone" borderColor="#FFCDD2">
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} style={{
            padding: '10px 16px', borderRadius: '10px',
            background: '#FFF5F5', border: '1px solid #FFCDD2',
            color: '#E53935', fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Trash2 size={14} /> Delete Account
          </button>
        ) : (
          <div style={{
            background: '#FFF5F5', borderRadius: '12px', padding: '16px',
            border: '1px solid #FFCDD2',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
              color: '#E53935', fontSize: '0.82rem', fontWeight: 600,
            }}>
              <AlertTriangle size={16} /> This action cannot be undone
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text)', marginBottom: '12px', lineHeight: 1.5 }}>
              All your data including exercises, sessions, pain journal, and progress will be permanently deleted.
              Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              style={{ ...inputStyle, borderColor: '#FFCDD2', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm(''); }} style={{
                padding: '8px 16px', borderRadius: '8px',
                background: '#F5F5F5', border: 'none',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== 'DELETE'}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  background: deleteConfirm === 'DELETE' ? '#E53935' : '#FFCDD2',
                  border: 'none', color: 'white',
                  fontSize: '0.78rem', fontWeight: 600,
                  cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                }}
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ icon, title, children, borderColor = 'var(--color-border)' }) {
  return (
    <div style={{
      background: 'white', borderRadius: '14px',
      border: `1px solid ${borderColor}`, padding: '18px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '14px',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'var(--color-bg-alt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-secondary)',
        }}>
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '1px',
  color: 'var(--color-text)', marginBottom: '4px',
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid var(--color-border)', fontSize: '0.85rem',
  color: 'var(--color-secondary)', outline: 'none',
  boxSizing: 'border-box',
};
