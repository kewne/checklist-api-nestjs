// @ts-check
import js from '@eslint/js';
import pluginJest from 'eslint-plugin-jest';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    plugins: {
      jest: pluginJest,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
// export default tseslint.config(
// {
//   ignores: ['eslint.config.mjs'],
// },

// eslintConfigPrettier,
// {

// },
// {
//   rules: {
//     '@typescript-eslint/no-explicit-any': 'off',
//     '@typescript-eslint/no-floating-promises': 'warn',
//     '@typescript-eslint/no-unsafe-argument': 'warn',
//     '@typescript-eslint/no-unused-vars': [
//       'error',
//       {
//         args: 'all',
//         argsIgnorePattern: '^_',
//       },
//     ],
//   },
// },
// );
