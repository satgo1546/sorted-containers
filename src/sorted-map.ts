import { assert, defaultComparator, IteratorConstructor } from './common.ts'
import { SortedArray } from './sorted-array.ts'
import { checkAbstractSortedArray, type SortedArrayConstructorOptions } from './abstract-sorted-array.ts'

function* toEntries<K, V>(iterator: Iterator<{ key: K, value: V }>): IteratorObject<[K, V], undefined, unknown> {
	for (const { key, value } of { [Symbol.iterator]() { return iterator } }) {
		yield [key, value]
	}
}

/**
 * SortedMap is a sorted mutable mapping.
 * 
 * SortedMap keys are maintained in sorted order.
 * The design of SortedMap is simple:
 * SortedMap maintains a SortedArray of key-value pairs.
 * It does not use the native Map type at all.
 * 
 * SortedMap keys must have a total ordering.
 * They are compared using the provided comparator function only;
 * they do not have to be the same object to be considered equal.
 * The total ordering of keys must not change while they are stored in the SortedMap.
 * 
 * Map methods and properties:

 * {@link SortedDict#get}
 * {@link SortedDict#has}
 * {@link SortedDict#set}
 * {@link SortedDict#delete}
 * {@link SortedDict#clear}
 * {@link SortedDict#forEach}
 * {@link SortedDict#[Symbol.iterator]}
 * {@link SortedDict#keys}
 * {@link SortedDict#values}
 * {@link SortedDict#entries}
 * {@link SortedDict#size}
 * {@link SortedDict#[Symbol.toStringTag]}
 *
 * Methods for adding items:
 *
 * {@link SortedDict#upsert}
 * {@link SortedDict#update}
 *
 * Methods for removing items:
 *
 * {@link SortedDict#clear}
 * {@link SortedDict#pop}
 * {@link SortedDict#popEntry}
 *
 * Methods for looking up items:
 *
 * {@link SortedDict#has}
 * {@link SortedDict#get}
 * {@link SortedDict#peekEntry}
 *
 * Methods for views:
 *
 * {@link SortedDict#keys}
 * {@link SortedDict#items}
 * {@link SortedDict#values}
 *
 * Miscellaneous methods:
 *
 * {@link SortedDict#clone}
 * {@link SortedDict#fromKeys}
 *
 * Sorted list methods available (applies to keys):
 *
 * {@link SortedList#bisectLeft}
 * {@link SortedList#bisectRight}
 * {@link SortedList#indexOf}
 * {@link SortedList#irange}
 * {@link SortedList#islice}
 *
 * @typeParam K - The type of keys.
 * @typeParam V - The type of values.
 * @typeParam C - Part of the key that the comparator function sees.
 */
export class SortedMap<K extends C, V, C = K> implements Map<K, V> {
	/** @internal */
	_list: SortedArray<{ key: K, value: V }, { key: C }>

	/**
	 * Initialize a SortedMap instance, optionally with the given key-value pairs.
	 *
	 * @example
	 * // All of these construct a SortedMap {'alpha' => 1, 'beta' => 2}
	 * new SortedMap([['alpha', 1], ['beta', 2]])
	 * new SortedMap(Object.entries({alpha: 1, beta: 2}))
	 *
	 * const m = new Map();
	 * m.set('alpha', 1);
	 * m.set('beta', 2);
	 * new SortedMap(m)
	 *
	 * @param iterable - Optional iterable argument provides an initial sequence of pairs to initialize the SortedMap.
	 * Each pair in the sequence defines the key and corresponding value.
	 * If a key is seen more than once, the last value associated with it is stored in the new SortedMap.
	 * @param options - An object that specifies characteristics about the sorted container.
	 */
	constructor(iterable: Iterable<[K, V]>, options?: SortedArrayConstructorOptions<C>) {
		let values: { key: K, value: V }[] | undefined
		if (iterable) {
			values = []
			for (const [key, value] of iterable) {
				values.push({ key, value })
			}
			values.reverse()
		}
		const cmp = options?.comparator ?? defaultComparator
		this._list = new SortedArray(values, {
			comparator: (a, b) => cmp(a.key, b.key),
			loadFactor: options?.loadFactor,
		})
	}

	get size(): number {
		return this._list.length
	}

	has(key: C): boolean {
		return this._list.includes({ key })
	}

	get(key: C): V | undefined
	get(key: C, defaultValue: V): V
	get(key: C, defaultValue?: V): V | undefined {
		const item = this._list.find({ key })
		return item ? item.value : defaultValue
	}

	set(key: K, value: V): this {
		const item = this._list.find({ key })
		if (item) {
			item.value = value
		} else {
			this._list.add({ key, value })
		}
		return this
	}

	bisectLeft(key: C): number {
		return this._list.bisectLeft({ key })
	}

	bisectRight(key: C): number {
		return this._list.bisectRight({ key })
	}

	indexOf(key: C): number {
		return this._list.indexOf({ key })
	}

	irange(minimumKey?: C, maximumKey?: C, includeMinimum = true, includeMaximum = true, reverse = false): IteratorObject<[K, V], undefined, unknown> {
		return toEntries(this._list.irange(
			minimumKey === undefined ? undefined : { key: minimumKey },
			maximumKey === undefined ? undefined : { key: maximumKey },
			includeMinimum,
			includeMaximum,
			reverse,
		))
	}

	islice(start = 0, end = this._list._len, reverse = false): IteratorObject<[K, V], undefined, unknown> {
		return toEntries(this._list.islice(start, end, reverse))
	}

	/**
	 * Remove all items from the SortedMap.
	 */
	clear(): void {
		this._list.clear()
	}

	/**
	 * Remove item identified by `key` from the SortedMap.
	 *
	 * @example
	 * const sd = new SortedMap([['a', 1], ['b', 2], ['c', 3]]);
	 * sd.delete('b') // true
	 * sd // SortedMap { 'a' => 1, 'c' => 3 }
	 * sd.delete('z') // false
	 *
	 * @param key - Key for item lookup.
	 * @returns true if an item in the SortedMap existed and has been removed, or false if the key does not exist.
	 */
	delete(key: C): boolean {
		return this._list.delete({ key })
	}

	/**
	 * An alias for {@link entries}.
	 */
	declare [Symbol.iterator]: () => MapIterator<[K, V]>

	clone(): SortedMap<K, V, C> {
		return {
			// @ts-expect-error
			__proto__: SortedMap,
			_list: this._list.clone(),
		}
	}

	keys(): SortedKeysView<K> {
		throw new Error('Method not implemented.')
	}

	/**
	 * Executes a callback function once for each key-value pair in a SortedMap.
	 *
	 * @param fn - The function to execute.
	 * @param thisArg - An object to which the `this` keyword can refer in the callback function.
	 * If thisArg is omitted, undefined is used.
	 */
	forEach(fn: (value: V, key: K, map: SortedMap<K, V>) => void, thisArg?: any): void {
		for (const sublist of this._list._lists) {
			for (const { key, value } of sublist) fn.call(thisArg, value, key, this)
		}
	}

	/**
	 * Return an iterator of key-value pairs over the SortedMap.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all elements.
	 * This is different from the native Map.
	 */
	entries(): SortedEntriesView<K, V> {
		throw new Error('Method not implemented.')
	}

	values(): SortedValuesView<V> {
		throw new Error('Method not implemented.')
	}

	/**
	 * Remove and return value for the item identified by `key`.
	 * 
	 * If the `key` is not found then return `defaultValue` if given.
	 * If `defaultValue` is not given then return undefined.
	 * 
	 * @example
	 * const sd = new SortedDict([['a', 1], ['b', 2], ['c', 3]]);
	 * sd.pop('c') // 3
	 * sd.pop('z', 26) // 26
	 * sd.pop('y') // undefined
	 * 
	 * @param key - Key for item.
	 * @param defaultValue - Default value if key not found (optional).
	 * @returns Value for item.
	 */
	pop(key: C): V | undefined
	pop(key: C, defaultValue: V): V
	pop(key: C, defaultValue?: V): V | undefined {
		throw new Error('Method not implemented.')
	}

	/**
	 * Remove and return `[key, value]` pair at `index` from the SortedMap.
	 * 
	 * Optional argument `index` defaults to -1, the last item in the SortedMap.
	 * Specify index to be 0 for the first item in the sorted dict.
	 * 
	 * If the `index` is out of range, returns undefined.
	 * 
	 * @example
	 * const sd = new SortedDict([['a', 1], ['b', 2], ['c', 3]]);
	 * sd.popEntry() // ['c', 3]
	 * sd.popEntry(0) // ['a', 1]
	 * sd.popEntry(100) // undefined
	 * 
	 * @param index - Index of item (default -1).
	 * @returns Key and value pair.
	 */
	popEntry(index = -1): [K, V] | undefined {
		throw new Error('Method not implemented.')
	}

	/**
	 * Return `[key, value]` pair at `index` from the SortedMap.
	 * 
	 * Optional argument `index` defaults to -1, the last item in the SortedMap.
	 * Specify index to be 0 for the first item in the sorted dict.
	 * 
	 * If the `index` is out of range, returns undefined.
	 * 
	 * @example
	 * const sd = new SortedDict([['a', 1], ['b', 2], ['c', 3]]);
	 * sd.peekEntry() // ['c', 3]
	 * sd.peekEntry(0) // ['a', 1]
	 * sd.peekEntry(100) // undefined
	 * 
	 * @param index - Index of item (default -1).
	 * @returns Key and value pair.
	 */
	peekEntry(index = -1): [K, V] | undefined {
		throw new Error('Method not implemented.')
	}

	upsert(key: K, defaultValue: V): V {
		throw new Error('Method not implemented.')
	}

	update(other: Iterable<[K, V]>): void {
	}

	declare [Symbol.toStringTag]: string
}

SortedMap.prototype[Symbol.iterator] = SortedMap.prototype.entries
SortedMap.prototype[Symbol.toStringTag] = 'SortedMap'

class SortedEntriesView<K, V> extends IteratorConstructor {
	next(...[value]: [] | [unknown]): IteratorResult<[K, V], undefined> {
		throw new Error('Method not implemented.')
	}
}

interface SortedEntriesView<K, V> extends MapIterator<[K, V]> {
}

interface SortedKeysView<K> extends MapIterator<K> {
}

interface SortedValuesView<V> extends MapIterator<V> {
}

/**
 * Check the invariants of a SortedMap.
 *
 * @throws {Error} If the SortedMap is corrupted.
 */
export function checkSortedMap<K, V>(self: SortedMap<K, V>) {
	checkAbstractSortedArray(self._list)

	// Check all items are key-value objects.
	for (const item of self._list) {
		const keys = Object.keys(item)
		assert(keys.length === 2 && keys[0] === 'key' && keys[1] === 'value')
	}
}
