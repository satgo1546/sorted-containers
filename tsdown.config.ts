import { defineConfig } from 'tsdown'
import { readFileSync, writeFileSync } from 'node:fs'

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm', 'iife'],
	outputOptions(options, format) {
		if (format === 'iife') {
			options.name = 'SortedContainers'
			options.minify = true
		}
	},
	onSuccess() {
		writeFileSync('dist/index.ts4.5.d.ts', `// polyfill types for TypeScript < 5.6
interface IteratorObject<T, TReturn = unknown, TNext = unknown> extends Iterator<T, TReturn, TNext> {
	[Symbol.iterator](): IteratorObject<T, TReturn, TNext>
}

interface ArrayIterator<T> extends IteratorObject<T, any, unknown> {
	[Symbol.iterator](): ArrayIterator<T>
}

interface SetIterator<T> extends IteratorObject<T, any, unknown> {
	[Symbol.iterator](): SetIterator<T>
}

interface MapIterator<T> extends IteratorObject<T, any, unknown> {
	[Symbol.iterator](): MapIterator<T>
}
// polyfill end
` + readFileSync('dist/index.d.ts'))
	},
})
