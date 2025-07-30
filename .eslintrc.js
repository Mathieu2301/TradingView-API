module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['airbnb-base'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 12,
    requireConfigFile: false,
  },
  rules: {
    quotes: ['error', 'single'],
    'no-console': 'off',
    'max-len': ['error', { code: 160 }],
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
