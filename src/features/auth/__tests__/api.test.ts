import { enroll, unlockWithPin, bootstrapSession, signOut, isEnrolled } from '../api';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const secureStoreMock = require('expo-secure-store') as { __reset: () => void };

// Reset SecureStore mock between tests.
beforeEach(() => {
    jest.resetModules();
    secureStoreMock.__reset();
});

describe('auth api', () => {
    it('starts with no account', async () => {
        expect(await isEnrolled()).toBe(false);
        expect(await bootstrapSession()).toBeNull();
    });

    it('enroll + bootstrap returns a live session', async () => {
        const session = await enroll({
            role: 'principal',
            fullName: 'Ada Okafor',
            pin: '742108',
            biometricEnabled: false,
        });
        expect(session.role).toBe('principal');
        expect(session.fullName).toBe('Ada Okafor');

        expect(await isEnrolled()).toBe(true);

        const boot = await bootstrapSession();
        expect(boot?.userId).toBe(session.userId);
        expect(boot?.role).toBe('principal');
    });

    it('unlockWithPin succeeds with the correct pin', async () => {
        await enroll({
            role: 'teacher',
            fullName: 'Ravi Menon',
            pin: '318204',
            biometricEnabled: false,
        });
        const result = await unlockWithPin('318204');
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.session.role).toBe('teacher');
        }
    });

    it('unlockWithPin fails with the wrong pin and reports remaining attempts', async () => {
        await enroll({
            role: 'teacher',
            fullName: 'Ravi',
            pin: '111112',
            biometricEnabled: false,
        });
        const result = await unlockWithPin('999999');
        expect(result.ok).toBe(false);
        if (!result.ok && result.reason === 'bad_pin') {
            expect(result.remaining).toBeGreaterThanOrEqual(0);
            expect(result.remaining).toBeLessThan(5);
        } else {
            throw new Error('Expected bad_pin');
        }
    });

    it('locks the account after too many failed attempts', async () => {
        await enroll({
            role: 'teacher',
            fullName: 'Ravi',
            pin: '742108',
            biometricEnabled: false,
        });
        let last;
        for (let i = 0; i < 5; i++) {
            last = await unlockWithPin('000000');
        }
        expect(last?.ok).toBe(false);
        if (last && !last.ok) {
            expect(last.reason).toBe('locked');
        }

        // Correct PIN also refused while locked.
        const locked = await unlockWithPin('742108');
        expect(locked.ok).toBe(false);
        if (!locked.ok) {
            expect(locked.reason).toBe('locked');
        }
    });

    it('signOut clears the account', async () => {
        await enroll({
            role: 'principal',
            fullName: 'Ada',
            pin: '742108',
            biometricEnabled: false,
        });
        expect(await isEnrolled()).toBe(true);
        await signOut();
        expect(await isEnrolled()).toBe(false);
        expect(await bootstrapSession()).toBeNull();
    });
});
