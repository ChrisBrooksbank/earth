import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            'intensity',
            'args',
            'position',
            'rotation',
            'scale',
            'color',
            'attach',
            'object',
            'castShadow',
            'receiveShadow',
            'geometry',
            'material',
            'visible',
            'frustumCulled',
            'renderOrder',
            'userData',
            'up',
            'matrixAutoUpdate',
            'layers',
            'raycast',
            'onPointerOver',
            'onPointerOut',
            'onPointerMove',
            'onPointerDown',
            'onPointerUp',
            'onClick',
            'onWheel',
            'enableDamping',
            'dampingFactor',
            'makeDefault',
            'minDistance',
            'maxDistance',
            'minPolarAngle',
            'maxPolarAngle',
            'autoRotate',
            'autoRotateSpeed',
            'enableZoom',
            'enablePan',
            'enableRotate',
            'target',
            'ref',
            'map',
            'bumpMap',
            'bumpScale',
            'specularMap',
            'specular',
            'shininess',
          ],
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: [
      'dist/',
      'coverage/',
      'node_modules/',
      'build/',
      'playwright-report/',
      'test-results/',
    ],
  }
);
