import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function PrivacyPolicy() {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const { user, logout, deleteAccount } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      console.error('Delete failed:', e);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const sections = [
    'introduction', 'whatWeCollect', 'whyWeCollect', 'howWeStore',
    'whoHasAccess', 'dataRetention', 'yourRights', 'howToDelete', 'contact',
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          fontSize: '0.82rem', color: 'var(--color-accent)',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, textAlign: 'left',
        }}
      >
        <ArrowLeft size={15} /> {t('back', { ns: 'common' })}
      </button>

      <div style={{
        background: 'linear-gradient(135deg, #5E35B1 0%, #4E4E53 100%)',
        borderRadius: '20px', padding: '24px', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Shield size={20} />
          <h1 style={{ color: 'white', margin: 0 }}>{t('privacyPolicy.title')}</h1>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {t('privacyPolicy.lastUpdated')}
        </p>
      </div>

      {sections.map(section => (
        <div key={section} style={{
          background: 'white', borderRadius: '14px',
          border: '1px solid var(--color-border)', padding: '20px',
        }}>
          <h3 style={{ marginBottom: '10px', fontSize: '0.95rem' }}>
            {t(`privacyPolicy.sections.${section}.title`)}
          </h3>
          <p style={{
            fontSize: '0.82rem', color: 'var(--color-text)',
            lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line',
          }}>
            {t(`privacyPolicy.sections.${section}.content`)}
          </p>
        </div>
      ))}

      {/* Delete Account */}
      {user && (
        <div style={{
          background: '#FFF3F0', borderRadius: '14px',
          border: '1px solid #FFCDD2', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Trash2 size={16} color="#C62828" />
            <h3 style={{ color: '#C62828', margin: 0, fontSize: '0.95rem' }}>
              {t('deleteAccount.title')}
            </h3>
          </div>
          <p style={{
            fontSize: '0.82rem', color: 'var(--color-text)',
            lineHeight: 1.6, marginBottom: '14px',
          }}>
            {t('deleteAccount.warning')}
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: '#C62828', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '8px',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '1px',
              }}
            >
              {t('deleteAccount.title')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: '#C62828', color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: '8px',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? t('deleting', { ns: 'common' }) : t('deleteAccount.confirm')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: 'white', color: 'var(--color-text)', border: '1px solid var(--color-border)',
                  padding: '10px 20px', borderRadius: '8px',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {t('deleteAccount.cancel')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
