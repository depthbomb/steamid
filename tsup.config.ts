import { defineConfig } from 'tsup';

export default defineConfig(() => ({
	clean: true,
	entry: [
		'src/index.ts'
	],
	format: ['esm', 'cjs'],
	dts: true,
	minify: 'terser',
	skipNodeModulesBundle: false,
	noExternal: [
		'cuint'
	],
	target: 'esnext',
	tsconfig: './tsconfig.json',
	splitting: true,
}));
