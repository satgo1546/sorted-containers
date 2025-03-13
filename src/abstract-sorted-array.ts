import { assert, defaultComparator, IteratorPrototype } from './common.ts'
import { bisectLeft, bisectRight } from './bisect.ts'

/**
 * An object that specifies characteristics of a sorted container.
 *
 * @typeParam T - The type of comparable elements.
 */
export interface SortedArrayConstructorOptions<T> {
	/**
	 * Function used to determine the order of the elements.
	 * It should return a negative number if the first argument is less than the second argument,
	 * a positive number if the first argument is greater than the second argument, or a zero otherwise.
	 * The comparator should always return a number, and never return NaN.
	 * In addition, the comparator has the same requirements as the parameter of `Array.prototype.sort`
	 * (purity, stability, reflexivity, anti-symmetry, and transitivity).
	 *
	 * If omitted, the elements are compared with operators `<`, `===`, and `>`.
	 * These operators violate transitivity if the inputs have mixed types or include NaN.
	 * See [Custom Comparators](../docs/comparator.md) for more information.
	 */
	comparator?: (a: T, b: T) => number,

	/**
	 * Specifies the load-factor for sorted container sublists.
	 * The default load factor of 1000 works well for arrays from tens to tens-of-millions of values.
	 * Good practice is to use a value that is the cube root of the list size.
	 * With billions of elements, the best load factor depends on your usage.
	 * It's best to leave the load factor at the default until you start benchmarking.
	 *
	 * @see {@link https://grantjenks.com/docs/sortedcontainers/implementation.html | Implementation Details} in Python Sorted Containers
	 * @see {@link https://grantjenks.com/docs/sortedcontainers/performance-scale.html | Performance at Scale} in Python Sorted Containers
	 */
	loadFactor?: number,
}

export abstract class AbstractSortedArray<T extends C, C = T> {
	static DEFAULT_LOAD_FACTOR = 1000
	/** @internal */
	readonly _load: number
	/** @internal */
	readonly _cmp: (a: C, b: C) => number

	/** @internal */
	_len = 0
	/** @internal */
	_lists: T[][] = []
	/** @internal */
	_maxes: T[] = []
	/** @internal */
	_index: number[] = []
	/** @internal */
	_offset = 0

	/**
	 * Initialize a sorted container instance.
	 *
	 * Optional `iterable` argument provides an initial iterable of values to initialize the sorted container.
	 *
	 * @param iterable - Initial values (optional).
	 * @param options - An object that specifies characteristics about the sorted container.
	 */
	constructor(iterable?: Iterable<T>, options?: SortedArrayConstructorOptions<C>) {
		this._load = options?.loadFactor ?? new.target.DEFAULT_LOAD_FACTOR
		this._cmp = options?.comparator ?? defaultComparator
		if (iterable) {
			this.update(iterable)
		}
	}

	/**
	 * Remove all values from sorted container.
	 */
	clear(): void {
		this._len = 0
		this._lists = []
		this._maxes = []
		this._index = []
		this._offset = 0
	}

	/**
	 * Split sublists with length greater than double the load-factor.
	 *
	 * Updates the index when the sublist length is less than double the load level.
	 * This requires incrementing the nodes in a traversal from the leaf node to the root.
	 * For an example traversal see {@link _loc}.
	 *
	 * @internal
	 */
	_expand(pos: number): void {
		if (this._lists[pos].length > (this._load << 1)) {
			const _lists_pos = this._lists[pos]
			const half = _lists_pos.splice(this._load)
			this._maxes[pos] = _lists_pos[_lists_pos.length - 1]

			this._lists.splice(pos + 1, 0, half)
			this._maxes.splice(pos + 1, 0, half[half.length - 1])

			this._index = []
		} else {
			if (this._index.length) {
				let child = this._offset + pos
				while (child > 0) {
					this._index[child]++
					child = (child - 1) >>> 1
				}
				this._index[0]++
			}
		}
	}

	/**
	 * Update sorted container by adding all values from `iterable`.
	 *
	 * @example
	 * const sl = new SortedArray();
	 * sl.update([3, 1, 2]);
	 * sl // SortedArray [1, 2, 3]
	 *
	 * @param iterable - Iterable of values to add.
	 */
	abstract update(iterable: Iterable<T>): void

	/**
	 * Return true if `value` is an element of the sorted container.
	 *
	 * @internal
	 */
	_has(value: C): boolean {
		if (!this._maxes.length) return false

		const pos = bisectLeft(this._maxes, value, this._cmp)
		if (pos === this._maxes.length) return false

		const idx = bisectLeft(this._lists[pos], value, this._cmp)
		return !this._cmp(this._lists[pos][idx], value)
	}

	/**
	 * Remove one `value` from sorted container if it is a member.
	 *
	 * If `value` is not a member, do nothing.
	 *
	 * @example
	 * const sl = new SortedArray([1, 2, 3, 4, 5])
	 * sl.delete(5)
	 * sl.delete(0)
	 * Array.from(sl) // [1, 2, 3, 4]
	 * @param value - Value to discard from SortedArray.
	 * @returns Returns true if an element in the SortedArray existed and has been removed, or false if the element does not exist.
	 */
	delete(value: C): boolean {
		if (!this._maxes.length) return false

		const pos = bisectLeft(this._maxes, value, this._cmp)
		if (pos === this._maxes.length) return false

		const idx = bisectLeft(this._lists[pos], value, this._cmp)
		if (this._cmp(this._lists[pos][idx], value)) return false

		this._delete(pos, idx)
		return true
	}

	/**
	 * Delete value at the given `(pos, idx)`.
	 *
	 * Combines lists that are less than half the load level.
	 *
	 * Updates the index when the sublist length is more than half the load level.
	 * This requires decrementing the nodes in a traversal from the leaf node to the root.
	 * For an example traversal see {@link _loc}.
	 *
	 * @param pos - Lists index.
	 * @param idx - Sublist index.
	 *
	 * @internal
	 */
	_delete(pos: number, idx: number): void {
		const _lists_pos = this._lists[pos]
		_lists_pos.splice(idx, 1)
		this._len--

		const len_lists_pos = _lists_pos.length

		if (len_lists_pos > (this._load >>> 1)) {
			this._maxes[pos] = _lists_pos[_lists_pos.length - 1]

			if (this._index.length) {
				let child = this._offset + pos
				while (child > 0) {
					this._index[child]--
					child = (child - 1) >>> 1
				}
				this._index[0]--
			}
		} else if (this._lists.length > 1) {
			if (pos === 0) pos++

			const prev = pos - 1
			this._lists[prev].push(...this._lists[pos])
			this._maxes[prev] = this._lists[prev][this._lists[prev].length - 1]

			this._lists.splice(pos, 1)
			this._maxes.splice(pos, 1)
			this._index = []

			this._expand(prev)
		} else if (len_lists_pos > 0) {
			this._maxes[pos] = _lists_pos[_lists_pos.length - 1]
		} else {
			this._lists.splice(pos, 1)
			this._maxes.splice(pos, 1)
			this._index = []
		}
	}

	/**
	 * Convert an index pair (lists index, sublist index) into a single index number that corresponds to the position of the value in the sorted container.
	 *
	 * Many queries require the index be built.
	 * Details of the index are described in {@link _build_index}.
	 *
	 * Indexing requires traversing the tree from a leaf node to the root.
	 * The parent of each node is easily computable at `(pos - 1) >>> 1`.
	 *
	 * Left-child nodes are always at odd indices and right-child nodes are always at even indices.
	 *
	 * When traversing up from a right-child node, increment the total by the left-child node.
	 *
	 * The final index is the sum from traversal and the index in the sublist.
	 *
	 * @param pos - Lists index.
	 * @param idx - Sublist index.
	 * @returns Index in sorted container.
	 *
	 * @internal
	 */
	_loc(pos: number, idx: number): number {
		if (pos === 0) return idx
		if (!this._index.length) this._buildIndex()

		let total = 0
		// Increment pos to point in the index to len(self._lists[pos]).
		pos += this._offset
		// Iterate until reaching the root of the index tree at pos = 0.
		while (pos) {
			// Right-child nodes are at odd indices. At such indices account the total below the left child node.
			if (!(pos & 1)) {
				total += this._index[pos - 1]
			}
			// Advance pos to the parent node.
			pos = (pos - 1) >>> 1
		}

		return total + idx
	}

	/**
	 * Convert an index into an index pair (lists index, sublist index) that can be used to access the corresponding lists position.
	 *
	 * Many queries require the index be built.
	 * Details of the index are described in {@link _build_index}.
	 *
	 * Indexing requires traversing the tree to a leaf node.
	 * Each node has two children which are easily computable.
	 * Given an index, pos, the left-child is at `pos * 2 + 1` and the right-child is at `pos * 2 + 2`.
	 *
	 * When the index is less than the left-child, traversal moves to the left sub-tree.
	 * Otherwise, the index is decremented by the left-child and traversal moves to the right sub-tree.
	 *
	 * At a child node, the indexing pair is computed from the relative position of the child node as compared with the offset and the remaining index.
	 *
	 * @param idx - Index in sorted container.
	 * @returns (lists index, sublist index) pair.
	 *
	 * @internal
	 */
	_pos(idx: number): [pos: number, idx: number] {
		if (idx < 0) {
			const lastLength = this._lists[this._lists.length - 1].length

			if (-idx <= lastLength) {
				return [this._lists.length - 1, lastLength + idx]
			}

			idx += this._len

			// Indices should have been bounds checked before entering this method.
			/* v8 ignore next 6 */
			if (idx < 0) {
				throw new Error('index out of range')
			}
		} else if (idx >= this._len) {
			throw new Error('index out of range')
		}

		if (idx < this._lists[0].length) {
			return [0, idx]
		}

		if (!this._index.length) {
			this._buildIndex()
		}

		let pos = 0
		let child = 1
		const indexLength = this._index.length

		while (child < indexLength) {
			const indexChild = this._index[child]

			if (idx < indexChild) {
				pos = child
			} else {
				idx -= indexChild
				pos = child + 1
			}

			child = (pos << 1) + 1
		}

		return [pos - this._offset, idx]
	}

	/**
	 * Build a positional index for indexing the sorted container.
	 *
	 * Indexes are represented as binary trees in a dense array notation similar to a binary heap.
	 *
	 * When built, the index can be used for efficient indexing into the list.
	 * See the comment and notes on {@link _pos} for details.
	 *
	 * @internal
	 */
	_buildIndex(): void {
		const row0 = this._lists.map(list => list.length)

		// Checking for `row0.length === 1` is not necessary because the general algorithm works,
		// and other methods special case the first and the last sublists anyway.

		const row1: number[] = []
		for (let i = 1; i < row0.length; i += 2) {
			row1.push(row0[i - 1] + row0[i])
		}
		if (row0.length & 1) {
			row1.push(row0[row0.length - 1])
		}

		if (row1.length === 1) {
			this._index = row1.concat(row0)
			this._offset = 1
			return
		}

		const size = 1 << 32 - Math.clz32(row1.length - 1)
		row1.push(...Array(size - row1.length).fill(0))
		const tree = [row0, row1]

		while (tree[tree.length - 1].length > 1) {
			const lastLayer = tree[tree.length - 1]
			const row: number[] = []
			for (let i = 1; i < lastLayer.length; i += 2) {
				row.push(lastLayer[i - 1] + lastLayer[i])
			}
			tree.push(row)
		}

		this._index = tree.reverse().flat()
		this._offset = size * 2 - 1
	}

	/**
	 * Remove value at `index` from sorted container.
	 *
	 * If `index` is out of range, does nothing.
	 *
	 * @example
	 * const sl = new SortedArray('abcde');
	 * sl.deleteAt(2);
	 * sl // SortedArray ['a', 'b', 'd', 'e']
	 *
	 * @param index - Integer or slice for indexing. Negative integers count back from the last item in the array.
	 */
	deleteAt(index: number): void {
		if (index < -this._len || index >= this._len) return
		const [pos, idx] = this._pos(index)
		this._delete(pos, idx)
	}

	/**
	 * Removes elements from sorted container by index.
	 *
	 * @example
	 * const sl = new SortedArray('abcde');
	 * sl.deleteSlice(0, 2);
	 * sl // SortedArray ['c', 'd', 'e']
	 *
	 * @param start The zero-based location in the array from which to start removing elements.
	 * Negative integers count back from the last item in the array.
	 * @param end The zero-based location in the array at which to stop removing elements.
	 * Negative integers count back from the last item in the array.
	 * Elements up to but not including `end` are removed.
	 */
	deleteSlice(start = 0, end = this._len): void {
		if (start < 0) start += this._len
		start = Math.min(Math.max(start, 0), this._len)
		if (end < 0) end += this._len
		end = Math.min(Math.max(end, 0), this._len)

		if (start < end) {
			if (start === 0 && end === this._len) {
				return this.clear()
			} else if (this._len <= 8 * (end - start)) {
				let values = this.slice(0, start)
				if (end < this._len) {
					values = values.concat(this.slice(end))
				}
				this.clear()
				return this.update(values)
			}
		}

		for (let index = end - 1; index >= start; index--) {
			const [pos, idx] = this._pos(index)
			this._delete(pos, idx)
		}
	}

	/**
	 * Returns a copy of a section of sorted container as an ordinary Array.
	 *
	 * For both start and end, a negative index can be used to indicate an offset from the end of the array.
	 *
	 * @param start The beginning index of the specified portion of the array.
	 * If start is undefined, then the slice begins at index 0.
	 * @param end The end index of the specified portion of the array. This is exclusive of the element at the index `end`.
	 * If end is undefined, then the slice extends to the end of the array.
	 */
	slice(start = 0, end = this._len): T[] {
		if (start < 0) start += this._len
		start = Math.min(Math.max(start, 0), this._len)
		if (end < 0) end += this._len
		end = Math.min(Math.max(end, 0), this._len)

		if (start >= end) return []

		// Whole slice optimization: start to stop slices the whole sorted list.
		if (start === 0 && end === this._len) {
			return this._lists.flat()
		}

		const [startPos, startIdx] = this._pos(start)
		const startList = this._lists[startPos]
		let endIdx = startIdx + end - start

		// Small slice optimization: start index and stop index are within the start list.
		if (startList.length >= endIdx) {
			return startList.slice(startIdx, endIdx)
		}

		let endPos: number
		if (end === this._len) {
			endPos = this._lists.length - 1
			endIdx = this._lists[endPos].length
		} else {
			[endPos, endIdx] = this._pos(end)
		}

		const parts = this._lists.slice(startPos, endPos)
		parts[0] = parts[0].slice(startIdx)
		parts.push(this._lists[endPos].slice(0, endIdx))
		return parts.flat()
	}

	/**
	 * Lookup value at `index` in sorted container.
	 *
	 * If `index` is out of range, returns `undefined`.
	 *
	 * @example
	 * const sl = new SortedList('abcde');
	 * sl.at(1) // 'b'
	 * sl.at(-1) // 'e'
	 * sl.at(7) // undefined
	 *
	 * @param index - The zero-based index of the desired code unit. A negative index will count back from the last item.
	 * @returns The item located at the specified index, or `undefined` if index out of range.
	 */
	at(index: number): T | undefined {
		if (!this._len) return

		if (index === 0) {
			return this._lists[0][0]
		} else if (index === -1) {
			const lastList = this._lists[this._lists.length - 1]
			return lastList[lastList.length - 1]
		}

		if (index >= 0 && index < this._lists[0].length) {
			return this._lists[0][index]
		}

		const lastList = this._lists[this._lists.length - 1]
		const lastLength = lastList.length
		if (index > -lastLength && index < 0) {
			return lastList[lastLength + index]
		}

		if (index < -this._len || index >= this._len) return
		const [pos, idx] = this._pos(index)
		return this._lists[pos][idx]
	}

	/**
	 * Return an iterator over the sorted container.
	 *
	 * Iterating a sorted container while adding or deleting elements may throw an error or silently fail to iterate over all elements.
	 */
	[Symbol.iterator](): IteratorObject<T, undefined, unknown> {
		if (!this._len) return [][Symbol.iterator]()
		const maxPos = this._lists.length - 1
		return this._islice(0, 0, maxPos, this._lists[maxPos].length, false)
	}

	/**
	 * Return a reverse iterator over the sorted container.
	 *
	 * Iterating a sorted container while adding or deleting elements may throw an error or silently fail to iterate over all elements.
	 */
	reversed(): IteratorObject<T, undefined, unknown> {
		if (!this._len) return [][Symbol.iterator]()
		const maxPos = this._lists.length - 1
		return this._islice(0, 0, maxPos, this._lists[maxPos].length, true)
	}

	/**
	 * Return an iterator that slices sorted container from `start` to `stop`.
	 *
	 * The `start` and `stop` index are treated inclusive and exclusive, respectively.
	 *
	 * A negative index will count back from the last item.
	 *
	 * Both `start` and `stop` default to `undefined` which is automatically inclusive of the beginning and end of the sorted container.
	 *
	 * When `reverse` is `true` the values are yielded from the iterator in reverse order; `reverse` defaults to `false`.
	 *
	 * Iterating a sorted container while adding or deleting elements may throw an error or silently fail to iterate over all elements.
	 *
	 * @example
	 * const sl = new SortedArray('abcdefghij');
	 * const it = sl.islice(2, 6);
	 * Array.from(it) // ['c', 'd', 'e', 'f']
	 *
	 * @param start - Start index (inclusive).
	 * @param end - Stop index (exclusive).
	 * @param reverse - Yield values in reverse order.
	 * @returns Iterator.
	 */
	islice(start = 0, end = this._len, reverse = false): IteratorObject<T, undefined, unknown> {
		if (!this._len) return [][Symbol.iterator]()

		if (start < 0) start += this._len
		start = Math.min(Math.max(start, 0), this._len)
		if (end < 0) end += this._len
		end = Math.min(Math.max(end, 0), this._len)
		if (start >= end) return [][Symbol.iterator]()

		const [minPos, minIdx] = this._pos(start)

		let maxPos: number, maxIdx: number
		if (end === this._len) {
			maxPos = this._lists.length - 1
			maxIdx = this._lists[maxPos].length
		} else {
			[maxPos, maxIdx] = this._pos(end)
		}

		return this._islice(minPos, minIdx, maxPos, maxIdx, reverse)
	}

	/**
	 * Return an iterator that slices sorted container using two index pairs.
	 *
	 * The index pairs are (min_pos, min_idx) and (max_pos, max_idx), the first inclusive and the latter exclusive.
	 * See {@link _pos} for details on how an index is converted to an index pair.
	 *
	 * When `reverse` is `true`, values are yielded from the iterator in reverse order.
	 *
	 * @internal
	 */
	_islice(minPos: number, minIdx: number, maxPos: number, maxIdx: number, reverse: boolean): IteratorObject<T, undefined, unknown> {
		// Rolling our own Iterator object in this case is both simpler and more performant than using a generator function.
		if (reverse) {
			let pos = maxPos
			let idx = maxIdx
			return {
				// @ts-expect-error
				__proto__: IteratorPrototype,
				next: () => {
					if (pos < minPos || pos === minPos && idx <= minIdx) {
						return { value: undefined, done: true }
					}
					idx--
					if (idx < 0) {
						pos--
						idx += this._lists[pos].length
					}
					return { value: this._lists[pos][idx], done: false }
				},
			}
		} else {
			let pos = minPos
			let idx = minIdx
			return {
				// @ts-expect-error
				__proto__: IteratorPrototype,
				next: () => {
					if (pos > maxPos || pos === maxPos && idx >= maxIdx) {
						return { value: undefined, done: true }
					}
					const ret = { value: this._lists[pos][idx++], done: false as const }
					if (idx >= this._lists[pos].length) {
						pos++
						idx = 0
					}
					return ret
				},
			}
		}
	}

	/**
	 * Create an iterator of values between `minimum` and `maximum`.
	 *
	 * Both `minimum` and `maximum` default to `undefined` which is automatically inclusive of the beginning and end of the sorted container.
	 *
	 * The argument `includeMinimum` and `includeMaximum` is a pair of booleans that indicates whether the minimum and maximum ought to be included in the range, respectively.
	 * Both arguments default to `true` such that the range is inclusive of both minimum and maximum.
	 *
	 * When `reverse` is `true` the values are yielded from the iterator in reverse order; `reverse` defaults to `false`.
	 *
	 * Iterating a sorted container while adding or deleting elements may throw an error or silently fail to iterate over all elements.
	 *
	 * @example
	 * const sl = new SortedArray('abcdefghij');
	 * const it = sl.irange('c', 'f');
	 * Array.from(it) // ['c', 'd', 'e', 'f']
	 *
	 * @param minimum - Minimum value to start iterating.
	 * @param maximum - Maximum value to stop iterating.
	 * @param includeMinimum - Whether the minimum ought to be included in the range.
	 * @param includeMaximum - Whether the maximum ought to be included in the range.
	 * @param reverse - Yield values in reverse order.
	 * @returns Iterator.
	 */
	irange(minimum?: C, maximum?: C, includeMinimum = true, includeMaximum = true, reverse = false): IteratorObject<T, undefined, unknown> {
		if (!this._maxes.length) return [][Symbol.iterator]()

		// Calculate the minimum (pos, idx) pair.
		// By default this location will be inclusive in our calculation.
		let minPos: number, minIdx: number
		if (minimum === undefined) {
			minPos = 0
			minIdx = 0
		} else {
			if (includeMinimum) {
				minPos = bisectLeft(this._maxes, minimum, this._cmp)
				if (minPos === this._maxes.length) return [][Symbol.iterator]()
				minIdx = bisectLeft(this._lists[minPos], minimum, this._cmp)
			} else {
				minPos = bisectRight(this._maxes, minimum, this._cmp)
				if (minPos === this._maxes.length) return [][Symbol.iterator]()
				minIdx = bisectRight(this._lists[minPos], minimum, this._cmp)
			}
		}

		// Calculate the maximum (pos, idx) pair.
		// By default this location will be exclusive in our calculation.
		let maxPos: number, maxIdx: number
		if (maximum === undefined) {
			maxPos = this._maxes.length - 1
			maxIdx = this._lists[maxPos].length
		} else {
			if (includeMaximum) {
				maxPos = bisectRight(this._maxes, maximum, this._cmp)
				if (maxPos === this._maxes.length) {
					maxPos--
					maxIdx = this._lists[maxPos].length
				} else {
					maxIdx = bisectRight(this._lists[maxPos], maximum, this._cmp)
				}
			} else {
				maxPos = bisectLeft(this._maxes, maximum, this._cmp)
				if (maxPos === this._maxes.length) {
					maxPos--
					maxIdx = this._lists[maxPos].length
				} else {
					maxIdx = bisectLeft(this._lists[maxPos], maximum, this._cmp)
				}
			}
		}

		return this._islice(minPos, minIdx, maxPos, maxIdx, reverse)
	}

	/**
	 * Return an index to insert `value` in the sorted container.
	 *
	 * If the `value` is already present, the insertion point will be before (to the left of) any existing values.
	 *
	 * @example
	 * const sl = new SortedArray([10, 11, 12, 13, 14]);
	 * sl.bisect_left(12) // 2
	 *
	 * @param value - Insertion index of value in SortedArray.
	 * @returns Index.
	 */
	bisectLeft(value: C): number {
		if (!this._maxes.length) return 0
		const pos = bisectLeft(this._maxes, value, this._cmp)
		if (pos === this._maxes.length) return this._len
		const idx = bisectLeft(this._lists[pos], value, this._cmp)
		return this._loc(pos, idx)
	}

	/**
	 * Return an index to insert `value` in the sorted container.
	 *
	 * Similar to {@link bisectLeft}, but if `value` is already present, the insertion point will be after (to the right of) any existing values.
	 *
	 * @example
	 * const sl = new SortedArray([10, 11, 12, 13, 14]);
	 * sl.bisect_right(12) // 3
	 *
	 * @param value - Insertion index of value in SortedArray.
	 * @returns Index.
	 */
	bisectRight(value: C): number {
		if (!this._maxes.length) return 0
		const pos = bisectRight(this._maxes, value, this._cmp)
		if (pos === this._maxes.length) return this._len
		const idx = bisectRight(this._lists[pos], value, this._cmp)
		return this._loc(pos, idx)
	}

	/**
	 * Return a shallow copy of the sorted container.
	 *
	 * @returns A new sorted container.
	 */
	clone(): this {
		return {
			__proto__: Object.getPrototypeOf(this),
			...this,
			_lists: this._lists.map(sublist => sublist.slice()),
			_maxes: this._maxes.slice(),
			_index: this._index.slice(),
		}
	}

	/**
	 * Remove and return value at `index` in sorted container.
	 *
	 * If the sorted container is empty or index is out of range, `undefined` is returned and the sorted container is not modified.
	 *
	 * Negative indices count back from the last item.
	 *
	 * @example
	 * const sl = new SortedArray('abcde');
	 * sl.pop() // 'e'
	 * sl.pop(2) // 'c'
	 * sl // SortedArray ['a', 'b', 'd']
	 *
	 * @param index - Index of value (default -1).
	 * @returns Value or `undefined`.
	 */
	pop(index = -1): T | undefined {
		if (!this._len) return

		if (index === 0) {
			const val = this._lists[0][0]
			this._delete(0, 0)
			return val
		}

		if (index === -1) {
			const pos = this._lists.length - 1
			const loc = this._lists[pos].length - 1
			const val = this._lists[pos][loc]
			this._delete(pos, loc)
			return val
		}

		if (index > 0 && index < this._lists[0].length) {
			const val = this._lists[0][index]
			this._delete(0, index)
			return val
		}

		const lenLast = this._lists[this._lists.length - 1].length

		if (index > -lenLast && index < 0) {
			const pos = this._lists.length - 1
			const loc = lenLast + index
			const val = this._lists[pos][loc]
			this._delete(pos, loc)
			return val
		}

		if (index < -this._len || index >= this._len) return

		const [pos, idx] = this._pos(index)
		const val = this._lists[pos][idx]
		this._delete(pos, idx)
		return val
	}

	/**
	 * Return first index of `value` in the sorted container, or -1 if `value` is not present.
	 *
	 * Index must be between `start` and `end` for the `value` to be considered present.
	 * Negative indices count back from the last item.
	 *
	 * @example
	 * const sl = new SortedArray('abcde');
	 * sl.indexOf('d') // 3
	 * sl.indexOf('z') // -1
	 *
	 * @param value - Value in sorted container.
	 * @param start - The array index at which to start the search. If omitted, defaults to 0.
	 * @param end - The array index at which to end the search. If omitted, defaults to the end of the sorted container.
	 * @returns The index of the first occurrence of `value` in the sorted container, or -1 if it is not present.
	 */
	indexOf(value: C, start = 0, end = this._len): number {
		if (!this._len) return -1

		if (start < 0) start += this._len
		if (start < 0) start = 0

		if (end < 0) end += this._len
		if (end > this._len) end = this._len

		if (end <= start) return -1

		const posLeft = bisectLeft(this._maxes, value, this._cmp)
		if (posLeft === this._maxes.length) return -1

		const idxLeft = bisectLeft(this._lists[posLeft], value, this._cmp)
		if (this._cmp(this._lists[posLeft][idxLeft], value)) return -1

		const left = this._loc(posLeft, idxLeft)
		if (start <= left) {
			if (left < end) {
				return left
			}
		} else {
			const right = this.bisectRight(value)
			if (start < right) {
				return start
			}
		}

		return -1
	}

	/**
	 * Return the first element in the sorted container that is equal to the provided value.
	 * If it is not found, undefined is returned.
	 *
	 * With the default comparator and primitive elements,
	 * this method does not tell anything beyond whether the value exists in the sorted container.
	 * However, it can turn out to be useful with a custom comparator.
	 *
	 * @example
	 * const sl = new SortedArray(
	 *   [
	 *     { id: 1, value: 'one' },
	 *     { id: 2, value: 'two' },
	 *     { id: 3, value: 'three' },
	 *   ],
	 *   { comparator: (a, b) => a.id - b.id }
	 * );
	 * sl.find({ id: 2 }) // { id: 2, value: 'two' }
	 *
	 * @param value - The value to find.
	 */
	find(value: C): T | undefined {
		if (!this._len)	return undefined

		const pos = bisectLeft(this._maxes, value, this._cmp)
		if (pos === this._maxes.length) return undefined

		const idx = bisectLeft(this._lists[pos], value, this._cmp)
		if (this._cmp(this._lists[pos][idx], value)) return undefined

		return this._lists[pos][idx]
	}

	/**
	 * Return sorted container as an ordinary Array.
	 */
	toJSON(): T[] {
		return this._lists.flat()
	}

	/**
	 * Return a string representation of sorted container.
	 */
	toString(): string {
		return this._lists.toString()
	}

	declare [Symbol.toStringTag]: string
}

/**
 * Check the invariants of an AbstractSortedArray.
 *
 * This is a function instead of a method so that it can be tree-shaken.
 *
 * @throws {Error} If the AbstractSortedArray is corrupted.
 */
export function checkAbstractSortedArray<T>(self: AbstractSortedArray<T>): void {
	try {
		assert(self._load >= 4)
		assert(self._maxes.length === self._lists.length)
		assert(self._len === self._lists.reduce((acc, list) => acc + list.length, 0))

		// Check comparator is reflexive.
		for (const sublist of self._lists) {
			for (const val of sublist) {
				assert(self._cmp(val, val) == 0)
			}
		}

		// Check all sublists are sorted.
		for (const sublist of self._lists) {
			for (let pos = 1; pos < sublist.length; pos++) {
				const le = self._cmp(sublist[pos - 1], sublist[pos])
				const ge = self._cmp(sublist[pos], sublist[pos - 1])
				assert(le < 0 && ge > 0 || le === 0 && ge === 0)
			}
		}

		// Check beginning/end of sublists are sorted.
		for (let pos = 1; pos < self._lists.length; pos++) {
			const l = self._lists[pos - 1][self._lists[pos - 1].length - 1]
			const r = self._lists[pos][0]
			const le = self._cmp(l, r)
			const ge = self._cmp(r, l)
			assert(le < 0 && ge > 0 || le === 0 && ge === 0)
		}

		// Check _maxes index is the last value of each sublist.
		for (let pos = 0; pos < self._maxes.length; pos++) {
			assert(Object.is(self._maxes[pos], self._lists[pos][self._lists[pos].length - 1]))
		}

		// Check sublist lengths are less than double load-factor.
		const double = self._load << 1
		assert(self._lists.every(list => list.length <= double))

		// Check sublist lengths are greater than half load-factor for all but the last sublist.
		const half = self._load >>> 1
		for (let pos = 0; pos < self._lists.length - 1; pos++) {
			assert(self._lists[pos].length >= half)
		}

		if (self._index.length) {
			assert(self._len === self._index[0])
			assert(self._index.length === self._offset + self._lists.length)

			// Check index leaf nodes equal length of sublists.
			for (let pos = 0; pos < self._lists.length; pos++) {
				const leaf = self._index[self._offset + pos]
				assert(leaf === self._lists[pos].length)
			}

			// Check index branch nodes are the sum of their children.
			for (let pos = 0; pos < self._offset; pos++) {
				const child = (pos << 1) + 1
				if (child >= self._index.length) {
					assert(self._index[pos] === 0)
				} else if (child + 1 === self._index.length) {
					assert(self._index[pos] === self._index[child])
				} else {
					const childSum = self._index[child] + self._index[child + 1]
					assert(childSum === self._index[pos])
				}
			}
		}
	} catch (e) {
		console.error('len', self._len)
		console.error('load', self._load)
		console.error('offset', self._offset)
		console.error('index', self._index.length, self._index)
		console.error('maxes', self._maxes.length, self._maxes)
		console.error('lists', self._lists.length, self._lists)
		throw e
	}
}
