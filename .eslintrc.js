module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:nuxt/recommended',
    '@vue/eslint-config-typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Must be last to override other configs
  ],
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    'vue/multi-word-component-names': 'off', // Disable requirement for multi-word component names (allows for App.vue, etc.)
    'vue/no-multiple-template-root': 'off', // Allow multiple root elements in templates (Vue 3 feature)
    'vue/require-default-prop': 'off', // Optional props don't need defaults in Vue 3
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn on unused variables except those starting with _
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
};

