import { hashPin, randomHex, verifyPinHash } from '../hash';

describe('PIN hashing', () => {
  it('produces the same hash for the same pin + salt', async () => {
    const salt = await randomHex(16);
    const a = await hashPin('123456', salt);
    const b = await hashPin('123456', salt);
    expect(a).toBe(b);
    expect(a).toHaveLength(64); // sha-256 hex
  });

  it('produces different hashes for different pins', async () => {
    const salt = await randomHex(16);
    const a = await hashPin('123456', salt);
    const b = await hashPin('123457', salt);
    expect(a).not.toBe(b);
  });

  it('produces different hashes for the same pin with different salts', async () => {
    const salt1 = await randomHex(16);
    const salt2 = await randomHex(16);
    expect(salt1).not.toBe(salt2);
    const a = await hashPin('123456', salt1);
    const b = await hashPin('123456', salt2);
    expect(a).not.toBe(b);
  });

  it('verifies the correct pin', async () => {
    const salt = await randomHex(16);
    const hash = await hashPin('742108', salt);
    expect(await verifyPinHash('742108', salt, hash)).toBe(true);
    expect(await verifyPinHash('742109', salt, hash)).toBe(false);
  });

  it('generates unique salts of the requested length', async () => {
    const s1 = await randomHex(16);
    const s2 = await randomHex(16);
    expect(s1).toHaveLength(32); // 16 bytes -> 32 hex chars
    expect(s2).toHaveLength(32);
    expect(s1).not.toBe(s2);
  });
});
