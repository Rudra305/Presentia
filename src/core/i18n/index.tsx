import React, { createContext, useContext, useState, type ReactNode } from 'react';

import { translate, type Language } from './translate';

export type { Language };
export { translate };

interface I18nContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'en',
    setLang: () => {},
    t: (key: string) => translate(key, 'en'),
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Language>('en');

    const t = (key: string) => translate(key, lang);

    return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
    return useContext(I18nContext);
}
