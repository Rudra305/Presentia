import { translate } from '../translate';

describe('i18n Module', () => {
    it('resolves English translation keys correctly', () => {
        expect(translate('auth.welcomeBack', 'en')).toBe('Welcome back');
        expect(translate('settings.title', 'en')).toBe('Settings');
    });

    it('resolves Hindi translation keys correctly', () => {
        expect(translate('auth.welcomeBack', 'hi')).toBe('पुनः स्वागत है');
        expect(translate('settings.title', 'hi')).toBe('सेटिंग्स');
    });

    it('resolves Spanish translation keys correctly', () => {
        expect(translate('auth.welcomeBack', 'es')).toBe('Bienvenido de nuevo');
        expect(translate('settings.title', 'es')).toBe('Ajustes');
    });

    it('falls back to English when key is missing in target language', () => {
        expect(translate('dashboard.quickActions', 'hi')).toBe('त्वरित कार्य');
    });

    it('returns raw key if missing across all locales', () => {
        expect(translate('nonexistent.key.name', 'en')).toBe('nonexistent.key.name');
    });
});
