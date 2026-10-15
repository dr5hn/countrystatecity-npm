import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.codex-tmp/**'] },
  ...tseslint.configs.recommended,
  {
    // Keep the existing TypeScript checks responsible for unused declarations;
    // introducing an any-style policy is outside this tooling update.
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
