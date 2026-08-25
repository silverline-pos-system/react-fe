import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Severity policy (2026-08): errors = things that break at runtime or violate architecture
      // (no-undef, no-restricted-imports). The rules below are real code-health debt but do not
      // break the app, so they are warnings for now to keep `npm run lint` actionable as a gate.
      // They should be burned down in a dedicated cleanup pass and re-escalated to error.
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',      // components / constants intentionally kept
        argsIgnorePattern: '^[A-Z_]',      // passthrough props destructured as `icon: Icon`
        ignoreRestSiblings: true,          // `const { omitMe, ...rest } = x` is not dead code
        caughtErrors: 'none',              // `catch (e)` without using e is fine
      }],
      'no-useless-catch': 'warn',
      'no-empty': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/pos', '@/pos/**',
                '@/inventory', '@/inventory/**',
                '@/auth', '@/auth/**',
                '@/services', '@/services/**',
                '@/utils', '@/utils/**',
                '@/hooks', '@/hooks/**',
                '@/components', '@/components/**',
              ],
              message: 'Please import from @/features/*, @/shared/*, or @/lib/* instead.'
            }
          ]
        }
      ]
    },
  },
])
