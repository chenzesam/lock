const eslintrc = {
  parser: '@typescript-eslint/parser',
  extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'airbnb-typescript/base'
  ],
  plugins: [
      '@typescript-eslint',
  ],
  env: {
      browser: true,
      node: true,
      es6: true,
  },
  parserOptions: {
      project: './tsconfig.eslint.json',
  },
  globals: {
    test: true,
    expect: true
  },
  rules: {
    "import/no-extraneous-dependencies": 0
  }
};

module.exports = eslintrc;
