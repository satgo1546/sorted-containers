export const defaultComparator = <T>(a: T, b: T): number => {
	if (a === b) return 0
	if (a < b) return -1
	if (a > b) return 1
	return 0
}

// Iterator() constructor are only available since Oct 2024.
export const IteratorPrototype = Object.getPrototypeOf([][Symbol.iterator]())
export const IteratorConstructor: any = typeof Iterator === 'function'
	? Iterator
	: Object.assign(function () { }, { prototype: IteratorPrototype })

export function assert(predicate: unknown): void {
	if (!predicate) throw new Error('assertion failed')
}
