import { assert, defaultComparator, IteratorPrototype } from './common.ts'
import { AbstractSortedArray, checkAbstractSortedArray, type SortedArrayConstructorOptions } from './abstract-sorted-array.ts'
import { bisectLeft } from './bisect.ts'

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
export class SortedMap<K extends C, V, C = K> extends AbstractSortedArray<K, C> implements Map<K, V> {
	/** @internal */
	_map: Map<K, V>

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
		super(undefined, options)
		this._map = new Map
		if (iterable) {
			this.update(iterable)
		}
	}

	/**
	 * @returns The number of entries in the SortedMap.
	 */
	get size(): number {
		return this._len
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
	get<R>(key: C, defaultValue: R): V | R
	get(key: C, defaultValue?: unknown): unknown {
		if (this._map.has(key as K)) return this._map.get(key as K)!
		if (this.has(key)) return this._map.get(this.find(key)!)!
		return defaultValue
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
		// Fast path: if key is in the map as-is, update the value and call it a day.
		if (this._map.has(key)) {
			this._map.set(key, value)
			return this
		}

		if (this._len) {
			let pos = bisectLeft(this._maxes, key, this._cmp)

			if (pos === this._maxes.length) {
				pos--
				this._lists[pos].push(key)
				this._maxes[pos] = key
			} else {
				const sublist = this._lists[pos]
				const idx = bisectLeft(sublist, key, this._cmp)
				const val = sublist[idx]
				if (!this._cmp(val, key)) {
					this._map.set(val, value)
					return this
				}
				sublist.splice(idx, 0, key)
			}

			this._expand(pos)
		} else {
			this._lists.push([key])
			this._maxes.push(key)
		}

		this._map.set(key, value)
		this._len++
		return this
	}

	/**
	 * Remove all items from the SortedMap.
	 */
	clear(): void {
		super.clear()
		this._map.clear()
	}

	_delete(pos: number, idx: number): void {
		this._map.delete(this._lists[pos][idx])
		super._delete(pos, idx)
	}

	deleteSlice(start = 0, end = this._len): void {
		if (start < 0) start += this._len
		start = Math.min(Math.max(start, 0), this._len)
		if (end < 0) end += this._len
		end = Math.min(Math.max(end, 0), this._len)

		if (start >= end) return
		if (start === 0 && end === this._len) {
			return this.clear()
		}
		// if (this._len <= 8 * (end - start)) {
		// 	let keys = this.slice(0, start)
		// 	if (end < this._len) {
		// 		keys = keys.concat(this.slice(end))
		// 	}
		// 	this.clear()
		// 	return this.update(keys)
		// }

		for (let index = end - 1; index >= start; index--) {
			const [pos, idx] = this._pos(index)
			this._delete(pos, idx)
		}
	}

	/**
	 * Return a shallow copy of the SortedMap.
	 *
	 * @returns A new SortedMap instance.
	 */
	clone(): this {
		const that = super.clone()
		that._map = new Map(that._map)
		return that
	}

	/**
	 * Executes a callback function once for each key-value pair in a SortedMap.
	 *
	 * @param fn - The function to execute.
	 * @param thisArg - An object to which the `this` keyword can refer in the callback function.
	 * If thisArg is omitted, undefined is used.
	 */
	forEach(fn: (value: V, key: K, map: SortedMap<K, V>) => void, thisArg?: any): void {
		for (const sublist of this._lists) {
			for (const key of sublist) fn.call(thisArg, this._map.get(key)!, key, this)
		}
	}

	/**
	 * Return an iterator of key-value pairs over the SortedMap.
	 *
	 * The returned iterator yields the same object on every iteration to save allocations,
	 * so you must unpack the pair before calling `.next()`.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 */
	entries(): MapIterator<[K, V]> {
		const lists = this._lists
		const map = this._map
		let pos = 0
		let idx = 0
		return {
			// @ts-expect-error
			__proto__: IteratorPrototype,
			next(this: IteratorResult<[K, V], undefined>) {
				if (pos >= lists.length) {
					this.value = undefined
					this.done = true
				} else {
					const key = lists[pos][idx]
					this.value = [key, map.get(key)!]
					idx++
					if (idx >= lists[pos].length) {
						pos++
						idx = 0
					}
				}
				return this
			},
			value: undefined,
			done: false,
		}
	}

	/**
	 * Return an iterator of the SortedMap's values.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 */
	values(): MapIterator<V> {
		const map = this._map
		const iter = this._iter()
		const next = iter.next
		// @ts-expect-error
		iter.next = function () {
			next.call(iter)
			// @ts-expect-error
			iter.value = map.get(iter.value)
			return iter
		}
		// @ts-expect-error
		return iter
	}

	/**
	 * Remove and return value for the item identified by `key`.
	 *
	 * If the `key` is not found then return `defaultValue` if given.
	 * If `defaultValue` is not given then return undefined.
	 *
	 * @example
	 * const sd = new SortedMap([['a', 1], ['b', 2], ['c', 3]]);
	 * sd.popKey('c') // 3
	 * sd.popKey('z', 26) // 26
	 * sd.popKey('y') // undefined
	 *
	 * @param key - Key for item.
	 * @param defaultValue - Default value if key not found (optional).
	 * @returns Value for item.
	 */
	popKey(key: C): V | undefined
	popKey<R>(key: C, defaultValue: R): V | R
	popKey(key: C, defaultValue?: unknown): unknown {
		const val = this.get(key, defaultValue)
		this.delete(key)
		return val
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
		const entry = this.entryAt(index)
		this.deleteAt(index)
		return entry
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
	 * sd.entryAt() // ['c', 3]
	 * sd.entryAt(0) // ['a', 1]
	 * sd.entryAt(100) // undefined
	 *
	 * @param index - Index of item (default -1).
	 * @returns Key and value pair.
	 */
	entryAt(index = -1): [K, V] | undefined {
		if (index < -this._len || index >= this._len) return undefined
		const key = this.at(index)!
		return [key, this._map.get(key)!]
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
		if (this.has(key)) {
			return this.get(key)!
		}
		this.set(key, defaultValue)
		return defaultValue
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
		for (const [key, value] of Array.from(other)) {
			this.set(key, value)
		}
	}
}

export interface SortedMap<K, V, C> {
	/**
	 * @returns A boolean value indicating whether an entry with the specified key exists or not.
	 */
	has(key: C): boolean

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
	bisectLeft(key: C): number

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
	bisectRight(key: C): number

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
	indexOf(key: C, start?: number, end?: number): number

	/**
	 * Return an iterator of the SortedMap's keys.
	 *
	 * Iterating a SortedMap while adding or deleting elements may throw an error or silently fail to iterate over all entries.
	 * This is different from the native Map.
	 */
	keys(): MapIterator<K>

	/**
	 * An alias for {@link entries}.
	 */
	[Symbol.iterator](): MapIterator<[K, V]>

	[Symbol.toStringTag]: string
}

SortedMap.prototype.has = AbstractSortedArray.prototype._has
SortedMap.prototype.keys = AbstractSortedArray.prototype._iter
SortedMap.prototype[Symbol.iterator] = SortedMap.prototype.entries
SortedMap.prototype[Symbol.toStringTag] = 'SortedMap'

/**
 * Check the invariants of a SortedMap.
 *
 * @throws {Error} If the SortedMap is corrupted.
 */
export function checkSortedMap<K extends C, V, C>(self: SortedMap<K, V, C>) {
	checkAbstractSortedArray(self)

	assert(self._len === self._map.size)
	for (const key of self.keys()) {
		assert(self._map.has(key))
	}
}
