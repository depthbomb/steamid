import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

export default [
	{
		ignores: ['coverage/**', 'dist/**', 'node_modules/**'],
	},
	{
		files: ['**/*.ts', '**/*.mts'],
		languageOptions: {
			parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': plugin,
		},
		rules: {
			...plugin.configs.recommended.rules,
			'dot-notation': 'error',
			'eol-last': 'warn',
			'eqeqeq': 'error',
			'no-empty': 'warn',
			'no-mixed-spaces-and-tabs': 'off',
			'no-useless-escape': 'off',
			'@typescript-eslint/ban-ts-comment': 'warn',
			'@typescript-eslint/no-empty-function': 'off',
			'@typescript-eslint/no-inferrable-types': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
		},
	},
];
