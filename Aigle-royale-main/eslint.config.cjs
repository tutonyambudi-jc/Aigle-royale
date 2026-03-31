// Minimal flat config to satisfy ESLint v9/Next.js. Keeps rules empty to avoid external deps.
module.exports = [
	{ ignores: ['.next/**', 'node_modules/**'] },
	{
		languageOptions: {
			parser: require('@typescript-eslint/parser'),
			parserOptions: {
				ecmaVersion: 2024,
				sourceType: 'module',
				ecmaFeatures: { jsx: true },
			},
		},
		plugins: {
			'@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
		},
		rules: {
			'react-hooks/exhaustive-deps': 'off',
		},
	},
]
