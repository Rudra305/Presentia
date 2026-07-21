// Test-only mock — makes `expo-crypto`'s randomUUID absent so the
// `uuid()` helper transparently falls back to Node's `crypto.randomUUID`.
module.exports = {
  randomUUID: undefined,
};
