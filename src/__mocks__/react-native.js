// Minimal react-native mock for Node-side tests. Only the exports our
// storage/auth code touches need to be present.
module.exports = {
    Platform: {
        OS: 'ios',
        select: (obj) => obj.ios ?? obj.default,
    },
    AppState: {
        addEventListener: () => ({ remove: () => {} }),
    },
};
