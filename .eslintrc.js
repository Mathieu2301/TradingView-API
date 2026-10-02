// Project: https://github.com/Mathieu2301/TradingView-API
// Package: https://www.npmjs.com/package/@mathieuc/tradingview
module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
    requireConfigFile: false,
  },
  overrides: [{
    files: ['*.ts'],
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    plugins: ['@typescript-eslint'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-use-before-define': 'off',
      'no-undef': 'off',
      'no-void': 'off',
    },
  }, {
    files: ['tests/*.ts'],
    rules: { 'max-classes-per-file': 'off' },
  }],
  rules: {
    'no-console': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['./test.js', './tests/**'],
      },
    ],
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'no-continue': 'off',
    'guard-for-in': 'off',
  },
};
