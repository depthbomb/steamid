import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			100: true,
			all: true,
			include: ['src/**/*.ts'],
			provider: 'v8',
			reporter: ['text', 'html', 'json'],
		},
	},
});
