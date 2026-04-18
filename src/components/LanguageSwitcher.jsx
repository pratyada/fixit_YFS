import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
];

export default function LanguageSwitcher({ style }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  const toggle = () => {
    const next = current === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('fixit_language', next);
  };

  return (
    <button
      onClick={toggle}
      title={current === 'en' ? 'Passer au français' : 'Switch to English'}
      style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        background: 'var(--color-bg-alt, #f5f5f5)',
        border: '1px solid var(--color-border, #e0e0e0)',
        borderRadius: '50px', padding: '3px', cursor: 'pointer',
        fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.5px',
        ...style,
      }}
    >
      {LANGS.map(({ code, label }) => (
        <span
          key={code}
          style={{
            padding: '3px 7px', borderRadius: '50px',
            background: current === code ? 'var(--color-secondary, #4E4E53)' : 'transparent',
            color: current === code ? 'white' : 'var(--color-text, #888)',
            transition: 'all 0.2s',
          }}
        >
          {label}
        </span>
      ))}
    </button>
  );
}
