import en from './locales/en.json';
import es from './locales/es.json';
import hi from './locales/hi.json';

export type Language = 'en' | 'hi' | 'es';

const dictionaries: Record<Language, Record<string, any>> = {
    en,
    hi,
    es,
};

export function translate(key: string, lang: Language = 'en'): string {
    const parts = key.split('.');
    let curr: any = dictionaries[lang] ?? dictionaries.en;

    for (const part of parts) {
        if (curr && typeof curr === 'object' && part in curr) {
            curr = curr[part];
        } else {
            // Fallback to English if missing in target language
            let fallbackCurr: any = dictionaries.en;
            for (const fallbackPart of parts) {
                if (
                    fallbackCurr &&
                    typeof fallbackCurr === 'object' &&
                    fallbackPart in fallbackCurr
                ) {
                    fallbackCurr = fallbackCurr[fallbackPart];
                } else {
                    return key; // Return raw key if not found in fallback
                }
            }
            return typeof fallbackCurr === 'string' ? fallbackCurr : key;
        }
    }

    return typeof curr === 'string' ? curr : key;
}
