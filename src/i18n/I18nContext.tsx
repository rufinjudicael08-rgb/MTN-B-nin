import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  TranslationKey,
  detectBestLanguage,
  translate,
} from './translations';

interface I18nContextValue {
  lang: LanguageCode;
  dir: 'ltr' | 'rtl';
  setLang: (next: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'fr',
  dir: 'ltr',
  setLang: () => {},
  t: (key) => translate('fr', key),
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => detectBestLanguage());

  const dir = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr',
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      window.localStorage.setItem('momo_benin_lang', lang);
    } catch {
      // ignore storage restriction
    }
  }, [lang, dir]);

  const setLang = (next: LanguageCode) => {
    setLangState(next);
  };

  const t = useMemo(() => (key: TranslationKey) => translate(lang, key), [lang]);

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
