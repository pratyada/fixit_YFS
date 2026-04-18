import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English
import commonEN from './en/common.json';
import authEN from './en/auth.json';
import navEN from './en/nav.json';
import dashboardEN from './en/dashboard.json';
import exercisesEN from './en/exercises.json';
import exerciseDataEN from './en/exerciseData.json';
import painEN from './en/pain.json';
import progressEN from './en/progress.json';
import planEN from './en/plan.json';
import practitionerEN from './en/practitioner.json';
import adminEN from './en/admin.json';
import kioskEN from './en/kiosk.json';
import complianceEN from './en/compliance.json';

// French
import commonFR from './fr/common.json';
import authFR from './fr/auth.json';
import navFR from './fr/nav.json';
import dashboardFR from './fr/dashboard.json';
import exercisesFR from './fr/exercises.json';
import exerciseDataFR from './fr/exerciseData.json';
import painFR from './fr/pain.json';
import progressFR from './fr/progress.json';
import planFR from './fr/plan.json';
import practitionerFR from './fr/practitioner.json';
import adminFR from './fr/admin.json';
import kioskFR from './fr/kiosk.json';
import complianceFR from './fr/compliance.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: commonEN, auth: authEN, nav: navEN, dashboard: dashboardEN, exercises: exercisesEN, exerciseData: exerciseDataEN, pain: painEN, progress: progressEN, plan: planEN, practitioner: practitionerEN, admin: adminEN, kiosk: kioskEN, compliance: complianceEN },
      fr: { common: commonFR, auth: authFR, nav: navFR, dashboard: dashboardFR, exercises: exercisesFR, exerciseData: exerciseDataFR, pain: painFR, progress: progressFR, plan: planFR, practitioner: practitionerFR, admin: adminFR, kiosk: kioskFR, compliance: complianceFR },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'fixit_language',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
