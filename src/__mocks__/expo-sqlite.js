// Not used in tests — all repo tests wire BetterSqliteAdapter directly.
// This mock exists so files that import expo-sqlite transitively (e.g.
// db.ts's ExpoSQLiteAdapter) don't crash Jest's module resolver.
module.exports = {
    openDatabaseAsync: async () => {
        throw new Error(
            'expo-sqlite must not be used in tests — use BetterSqliteAdapter directly.',
        );
    },
};
