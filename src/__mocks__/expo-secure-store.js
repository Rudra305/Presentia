// Mocks the modules we can't run in Node so the auth tests focus on logic.

const memory = new Map();

module.exports = {
  async getItemAsync(key) {
    return memory.get(key) ?? null;
  },
  async setItemAsync(key, value) {
    memory.set(key, value);
  },
  async deleteItemAsync(key) {
    memory.delete(key);
  },
  // Test-only helper (not part of expo-secure-store API) used to reset state
  // between test cases.
  __reset() {
    memory.clear();
  },
};
