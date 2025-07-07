import { defineConfig } from 'tsdown'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm', 'iife'],
	outputOptions(options, format) {
		if (format === 'iife') {
			options.name = 'SortedContainers'
			options.minify = true
		}
	},
})
