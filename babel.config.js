module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      // Inlines .sql files as raw string literals at Babel transform time.
      // Works in Metro (device) and Jest (tests) with zero divergence.
      ['babel-plugin-inline-import', { extensions: ['.sql'] }],
    ],
  };
};
