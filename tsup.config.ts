import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm', 'iife'],
	clean: true,
	dts: true,
	esbuildOptions: (options, { format }) => {
		if (format === 'iife') {
			options.globalName = 'SortedContainers'
			options.minify = true
		}
	}
})
