import { assert, defaultComparator, IteratorPrototype } from './common.ts'
import { SortedArray } from './sorted-array.ts'
import { checkAbstractSortedArray, type SortedArrayConstructorOptions } from './abstract-sorted-array.ts'

/**
 * Map an iterator of key-value objects to an iterator of keys.
 */
function toKeys<K>(iterator: Iterator<{ key: K }>): IteratorObject<K, undefined, unknown> {
	return {
		// @ts-expect-error
		__proto__: IteratorPrototype,
		next: () => {
			const { value, done } = iterator.next()
			return done
				? { value: undefined, done: true }
				: { value: value.key, done: false }
		},
	}
}

/**
 * Map an iterator of key-value objects to an iterator of values.
 */
function toValues<V>(iterator: Iterator<{ value: V }>): IteratorObject<V, undefined, unknown> {
	return {
		// @ts-expect-error
		__proto__: IteratorPrototype,
		next: () => {
			const { value, done } = iterator.next()
			return done
				? { value: undefined, done: true }
				: { value: value.value, done: false }
		},
	}
}

/**
 * Map an iterator of key-value objects to an iterator of key-value pairs.
 */
function toEntries<K, V>(iterator: Iterator<{ key: K, value: V }>): IteratorObject<[K, V], undefined, unknown> {
	return {
		// @ts-expect-error
		__proto__: IteratorPrototype,
		next: () => {
			const { value, done } = iterator.next()
			return done
				? { value: undefined, done: true }
				: { value: [value.key, value.value], done: false }
		},
	}
}

/**
 * SortedMap is a sorted mutable mapping.
 *
 * SortedMap keys are maintained in sorted order.
 * The design of SortedMap is simple:
 * SortedMap maintains a SortedArray of key-value pair objects.
 * It does not use the native Map type at all.
 *
 * SortedMap is compatible with Map.
 * A SortedMap can be used wherever a Map is expected, as long as the code relies on duck typing.
 * SortedMap does not actually inherit Map, however.
 *
 * SortedMap keys must have a total ordering.
 * They are compared using the provided comparator function only;
 * they do not have to be the same object to be considered equal.
 * The total ordering of keys must not change while they are stored in the SortedMap.
 *
 * Map methods and properties:

 * {@link SortedMap#get}
 * {@link SortedMap#has}
 * {@link SortedMap#set}
 * {@link SortedMap#delete}
 * {@link SortedMap#clear}
 * {@link SortedMap#forEach}
 * {@link SortedMap#[Symbol.iterator]}
 * {@link SortedMap#keys}
 * {@link SortedMap#values}
 * {@link SortedMap#entries}
 * {@link SortedMap#size}
 * {@link SortedMap#[Symbol.toStringTag]}
 *
 * Methods for adding items:
 *
 * {@link SortedMap#upsert}
 * {@link SortedMap#update}
 *
 * Methods for removing items:
 *
 * {@link SortedMap#clear}
 * {@link SortedMap#pop}
 * {@link SortedMap#popEntry}
 *
 * Methods for looking up items:
 *
 * {@link SortedMap#has}
 * {@link SortedMap#get}
 * {@link SortedMap#at}
 *
 * Methods for views:
 *
 * {@link SortedMap#keys}
 * {@link SortedMap#items}
 * {@link SortedMap#values}
 *
 * Miscellaneous methods:
 *
 * {@link SortedMap#clone}
 *
 * SortedArray methods available (applies to keys):
 *
 * {@link SortedMap#bisectLeft}
 * {@link SortedMap#bisectRight}
 * {@link SortedMap#indexOf}
 * {@link SortedMap#irange}
 * {@link SortedMap#islice}
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
	 * If a key is seen more than once, the first key and the last value is stored in the SortedMap.
	 * @param options - An object that specifies characteristics about the sorted container.
	 */
	constructor(iterable?: Iterable<[K, V]>, options?: SortedArrayConstructorOptions<C>) {
		const cmp = options?.comparator ?? defaultComparator
		this._list = new SortedArray(undefined, {
			comparator: (a, b) => cmp(a.key, b.key),
			loadFactor: options?.loadFactor,
		})
		if (iterable) {
			this.update(iterable)
		}
	}

	/**
	 * @returns The number of entries in the SortedMap.
	 */
	get size(): number {
		return this._list.length
	}

	/**
	 * @returns A boolean value indicating whether an entry with the specified key exists or not.
	 */
	has(key: C): boolean {
		return this._list.includes({ key })
	}

	/**
	 * Get the value associated with the `key`, with `defaultValue` as a fallback.
	 *
	 * @param key - The key to look up.
	 * @param defaultValue - The value to return if no value is associated with the key.
	 * @returns The value associated with the specified key, or the default value if the key is not found.
	 * If neither an entry is found nor a default value is provided, undefined is returned.
	 */
	get(key: C): V | undefined
	get(key: C, defaultValue: V): V
	get(key: C, defaultValue?: V): V | undefined {
		const item = this._list.find({ key })
		return item ? item.value : defaultValue
	}

	/**
	 * Store an entry in SortedMap with `key` and corresponding `value`.
	 * Keep the key but overwrite the value if the key already has an associated value.
	 *
	 * @example
	 * const sd = new SortedMap();
	 * sd.set('c', 3);
	 * sd.set('a', 1);
	 * sd.set('b', 2);
	 * sd // SortedMap {'a' => 1, 'b' => 2, 'c' => 3}
	 *
	 * @param key - Key for entry.
	 * @param value - Value for entry.
	 */
	set(key: K, value: V): this {
		const item = this._list.find({ key })
		if (item) {
			item.value = value
		} else {
			this._list.add({ key, value })
		}
		return this
	}

	/**
	 * Return an index to insert `key` in the SortedMap.
	 *
	 * If the `key` is already present, the insertion point will be the index of that entry.
	 *
	 * @example
	 * const sd = new SortedMap([[10, 4], [11, 2], [12, 6], [13, 2], [14, 4]]);
	 * sd.bisectLeft(12) // 2
	 *
	 * @param key - Key to find the insertion point of.
	 * @returns Insertion index of `key` in the SortedMap.
	 */
	bisectLeft(key: C): number {
		return this._list.bisectLeft({ key })
	}

	/**
	 * Return an index to insert `key` in the SortedMap.
	 *
	 * Similar to {@link bisectLeft}, but if `value` is already present, the insertion point will be after (to the right of) the existing entry.
	 *
	 * @example
	 * const sd = new SortedMap([[10, 4], [11, 2], [12, 6], [13, 2], [14, 4]]);
	 * sl.bisectRight(12) // 3
	 *
	 * @param key - Key to find the insertion point of.
	 * @returns Insertion index of `key` in the SortedMap.
	 */
	bisectRight(key: C): number {
		return this._list.bisectRight({ key })
	}

	/**
	 * Return the index of `key` in the SortedMap, or -1 if `key` is not present.
	 *
	 * Index must be between `start` and `end` for the `key` to be considered present.
	 * Negative indices count back from the last item.
	 *
	 * @example
	 * const sl = new SortedMap([['a', 1], ['b', 2], ['c', 4]]);
	 * sl.indexOf('c') // 2
	 * sl.indexOf('z') // -1
	 *
	 * @param key - Key in SortedMap.
	 * @param start - The index at which to start the search (default 0).
	 * @param end - The index at which to end the search (default length).
	 * @returns The index of the occurrence of `key` in the sorted container, or -1 if it is not present.
	 */
	indexOf(key: C, start = 0, end = this._list._len): number {
		return this._list.indexOf({ key }, start, end)
	}

	/**
	 * Create an iterator of key-value pairs for keys between `minimumKey` and `maximumKey`.
	 *
	 * Both `minimum` and `maximum` default to `undefined` which is automatically inclusive of the beginning and end of the SortedMap.
	 *
	 * The argument `includeMinimum` and `includeMaximum` is a pair of booleans that indicates whether the minimum and maximum ought to be included in the range, respectively.
	 * Both arguments default to `true` such that the range is inclusive of both minimum and maximum.
	 *
	 * When `reverse` is `true` the entries are yielded from the iterator in reverse order; `reverse` defaults to `false`.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 *
	 * @example
	 * const sd = new SortedMap([['a', 1], ['b', 2], ['c', 4], ['d', 7]]);
	 * const it = sd.irange('b', 'c');
	 * Array.from(it) // [['b', 2], ['c', 4]]
	 *
	 * @param minimum - Minimum value to start iterating.
	 * @param maximum - Maximum value to stop iterating.
	 * @param includeMinimum - Whether the minimum ought to be included in the range.
	 * @param includeMaximum - Whether the maximum ought to be included in the range.
	 * @param reverse - Whether to yield entries in reverse order.
	 * @returns Iterator of key-value pairs.
	 */
	irange(minimumKey?: C, maximumKey?: C, includeMinimum = true, includeMaximum = true, reverse = false): IteratorObject<[K, V], undefined, unknown> {
		return toEntries(this._list.irange(
			minimumKey === undefined ? undefined : { key: minimumKey },
			maximumKey === undefined ? undefined : { key: maximumKey },
			includeMinimum,
			includeMaximum,
			reverse,
		))
	}

	/**
	 * Return an iterator that slices key-value pairs from `start` to `end`.
	 *
	 * The `start` and `end` index are treated inclusive and exclusive, respectively.
	 *
	 * A negative index will count back from the last item.
	 *
	 * Both `start` and `end` default to `undefined` which is automatically inclusive of the beginning and end of the SortedMap.
	 *
	 * When `reverse` is `true` the entries are yielded from the iterator in reverse order; `reverse` defaults to `false`.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 *
	 * @example
	 * const sd = new SortedMap([['a', 1], ['b', 2], ['c', 4], ['d', 7]]);
	 * const it = sd.islice(1, 3);
	 * Array.from(it) // [['b', 2], ['c', 4]]
	 *
	 * @param start - Start index (inclusive).
	 * @param end - Stop index (exclusive).
	 * @param reverse - Whether to yield entries in reverse order.
	 * @returns Iterator of key-value pairs.
	 */
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
	 * sd // SortedMap {'a' => 1, 'c' => 3}
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

	/**
	 * Return a shallow copy of the SortedMap.
	 *
	 * @returns A new SortedMap instance.
	 */
	clone(): SortedMap<K, V, C> {
		return {
			// @ts-expect-error
			__proto__: SortedMap.prototype,
			_list: this._list.clone(),
		}
	}

	/**
	 * Return an iterator of the SortedMap's keys.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 */
	keys(): MapIterator<K> {
		return toKeys(this._list.values())
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
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 */
	entries(): MapIterator<[K, V]> {
		return this.islice()
	}

	/**
	 * Return an iterator of the SortedMap's values.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 */
	values(): MapIterator<V> {
		return toValues(this._list.values())
	}

	/**
	 * Remove and return value for the item identified by `key`.
	 *
	 * If the `key` is not found then return `defaultValue` if given.
	 * If `defaultValue` is not given then return undefined.
	 *
	 * @example
	 * const sd = new SortedMap([['a', 1], ['b', 2], ['c', 3]]);
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
		const item = this._list.find({ key })
		if (item) {
			this._list.delete({ key })
			return item.value
		}
		return defaultValue
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
	 * const sd = new SortedMap([['a', 1], ['b', 2], ['c', 3]]);
	 * sd.popEntry() // ['c', 3]
	 * sd.popEntry(0) // ['a', 1]
	 * sd.popEntry(100) // undefined
	 *
	 * @param index - Index of item (default -1).
	 * @returns Key and value pair.
	 */
	popEntry(index = -1): [K, V] | undefined {
		const item = this._list.pop(index)
		return item ? [item.key, item.value] : undefined
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
	 * const sd = new SortedMap([['a', 1], ['b', 2], ['c', 3]]);
	 * sd.at() // ['c', 3]
	 * sd.at(0) // ['a', 1]
	 * sd.at(100) // undefined
	 *
	 * @param index - Index of item (default -1).
	 * @returns Key and value pair.
	 */
	at(index = -1): [K, V] | undefined {
		const item = this._list.at(index)
		return item ? [item.key, item.value] : undefined
	}

	/**
	 * Return the value for the entry identified by `key` in the SortedMap.
	 *
	 * If `key` is in the SortedMap then return its value.
	 * If `key` is not in the SortedMap then insert `key` with value `default` and return `default`.
	 *
	 * @example
	 * const sd = new SortedMap();
	 * sd.upsert('a', 1) // 1
	 * sd.upsert('a', 10) // 1
	 * sd // SortedMap {'a' => 1}
	 *
	 * @param key - Key of the entry.
	 * @param defaultValue - Value of the entry if the entry does not exist.
	 * @returns Value of the entry after potential insertion.
	 */
	upsert(key: K, defaultValue: V): V {
		const item = this._list.find({ key })
		if (item) {
			return item.value
		} else {
			this._list.add({ key, value: defaultValue })
			return defaultValue
		}
	}

	/**
	 * Update SortedMap with entries from `other`.
	 *
	 * Overwrites existing items.
	 *
	 * `other` argument may be a Map, a SortedMap, an iterable of pairs.
	 * See {@link SortedMap#constructor} for details.
	 *
	 * @param other - Iterable of pairs.
	 */
	update(other: Iterable<[K, V]>): void {
		for (const [key, value] of other) {
			this.set(key, value)
		}
	}

	declare [Symbol.toStringTag]: string
}

SortedMap.prototype[Symbol.iterator] = SortedMap.prototype.entries
SortedMap.prototype[Symbol.toStringTag] = 'SortedMap'

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
