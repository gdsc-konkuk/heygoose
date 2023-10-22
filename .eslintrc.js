module.exports = {
  extends: ['airbnb-typescript/base', 'prettier'],
  reportUnusedDisableDirectives: true,
  rules: {
    'max-len': ['warn', { code: 140 }],
    'no-plusplus': 'off',
    quotes: [2, 'single', { avoidEscape: true }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
  },
};
