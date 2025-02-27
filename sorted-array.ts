function bisectLeft<T>(a: T[], x: T, lo = 0, hi = a.length): number {
	while (lo < hi) {
		const mid = lo + hi >> 1
		if (a[mid] < x) {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

function bisectRight<T>(a: T[], x: T, lo = 0, hi = a.length): number {
	while (lo < hi) {
		const mid = lo + hi >> 1
		if (x < a[mid]) {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}

function insort<T>(a: T[], x: T): void {
	a.splice(bisectRight(a, x), 0, x)
}

/**
 * Sorted array is a sorted mutable collection.
 *
 * Sorted array values are maintained in sorted order.
 *
 * Sorted array values must be comparable.
 * The total ordering of values must not change while they are stored in the sorted array.
 * 【TODO: check compareFn】
 *
 * Methods for adding values:
 *
 * - {@link SortedArray#add}
 * - {@link SortedArray#update}
 *
 * Methods for removing values:
 *
 * - {@link SortedArray#clear}
 * - {@link SortedArray#delete}
 * - {@link SortedArray#deleteAt}
 * - {@link SortedArray#deleteSlice}
 * - {@link SortedArray#pop}
 *
 * Methods for looking up values:
 *
 * - {@link SortedArray#at}
 * - {@link SortedArray#bisectLeft}
 * - {@link SortedArray#bisectRight}
 * - {@link SortedArray#count}
 * - {@link SortedArray#includes}
 * - {@link SortedArray#indexOf}
 *
 * Methods for iterating values:
 *
 * - {@link SortedArray#irange}
 * - {@link SortedArray#islice}
 * - {@link SortedArray#slice}
 * - {@link SortedArray#[Symbol.iterator]}
 *
 * Miscellaneous methods and properties:
 *
 * - {@link SortedArray#concat}
 * - {@link SortedArray#length}
 * - {@link SortedArray#toJSON}
 * - {@link SortedArray#toString}
 * - {@link SortedArray#_check}
 */
export class SortedArray<T> {
	static readonly DEFAULT_LOAD_FACTOR = 1000
	private readonly _load: number

	private _len = 0
	private _lists: T[][] = []
	private _maxes: T[] = []
	private _index: number[] = []
	private _offset = 0

	/**
	 * Initialize sorted array instance.
	 *
	 * Optional `iterable` argument provides an initial iterable of values to initialize the sorted array.
	 *
	 * @param iterable - Initial values (optional).
	 * @param {object} options - An object that specifies characteristics about the sorted container.
	 * @param options.loadFactor - Specifies the load-factor for sorted array sublists.
	 * The default load factor of 1000 works well for lists from tens to tens-of-millions of values.
	 * Good practice is to use a value that is the cube root of the list size.
	 * With billions of elements, the best load factor depends on your usage.
	 * It's best to leave the load factor at the default until you start benchmarking.
	 * @param options.compareFn - 【TODO】
	 *
	 * @see https://grantjenks.com/docs/sortedcontainers/implementation.html
	 * @see https://grantjenks.com/docs/sortedcontainers/performance-scale.html
	 */
	constructor(iterable?: Iterable<T>, options?: {
		loadFactor: number,
		// compareFn: (a: T, b: T) => number,
	}) {
		this._load = options?.loadFactor ?? SortedArray.DEFAULT_LOAD_FACTOR
		if (iterable) {
			this.update(iterable)
		}
	}

	/**
	 * Remove all values from sorted array.
	 */
	clear(): void {
		this._len = 0
		this._lists = []
		this._maxes = []
		this._index = []
		this._offset = 0
	}

	/**
	 * Add `value` to sorted array.
	 *
	 * @example
	 * const sl = new SortedArray();
	 * sl.add(3);
	 * sl.add(1);
	 * sl.add(2);
	 * sl // SortedArray [1, 2, 3]
	 *
   * @param value - Value to add to sorted array.
	 */
	add(value: T): void {
		if (this._maxes.length) {
			let pos = bisectRight(this._maxes, value)

			if (pos === this._maxes.length) {
				pos--
				this._lists[pos].push(value)
				this._maxes[pos] = value
			} else {
				insort(this._lists[pos], value)
			}

			this._expand(pos)
		} else {
			this._lists.push([value])
			this._maxes.push(value)
		}

		this._len++
	}

	/**
	 * Split sublists with length greater than double the load-factor.
	 *
   * Updates the index when the sublist length is less than double the load level.
	 * This requires incrementing the nodes in a traversal from the leaf node to the root.
	 * For an example traversal see {@link _loc}.
	 */
	private _expand(pos: number): void {
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
					child = (child - 1) >> 1
				}
				this._index[0]++
			}
		}
	}

	/**
	 * Update sorted array by adding all values from `iterable`.
	 *
	 * @example
	 * const sl = new SortedArray();
	 * sl.update([3, 1, 2]);
	 * sl // SortedArray [1, 2, 3]
	 *
	 * @param iterable - Iterable of values to add.
	 */
	update(iterable: Iterable<T>): void {
		let values = Array.from(iterable).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)

		if (this._maxes.length) {
			if (values.length * 4 >= this._len) {
				this._lists.push(values)
				values = this._lists.flat()
				values.sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
				this.clear()
			} else {
				for (const val of values) this.add(val)
				return
			}
		}

		for (let pos = 0; pos < values.length; pos += this._load) {
			this._lists.push(values.slice(pos, pos + this._load))
		}
		for (const sublist of this._lists) {
			this._maxes.push(sublist[sublist.length - 1])
		}
		this._len = values.length
		this._index = []
	}

	/**
	 * Return true if `value` is an element of the sorted array.
	 *
	 * @example
	 * const sl = new SortedArray([1, 2, 3, 4, 5]);
	 * sl.includes(3) // true
	 *
	 * @param value - Search for value in sorted array.
	 * @returns - True if `value` in sorted array.
	 */
	includes(value: T): boolean {
		if (!this._maxes.length) return false

		const pos = bisectLeft(this._maxes, value)
		if (pos === this._maxes.length) return false

		const idx = bisectLeft(this._lists[pos], value)
		return this._lists[pos][idx] === value
	}

	/**
	 * Remove one `value` from sorted array if it is a member.
	 *
	 * If `value` is not a member, do nothing.
	 *
	 * @example
	 * const sl = new SortedArray([1, 2, 3, 4, 5])
	 * sl.delete(5)
	 * sl.delete(0)
	 * Array.from(sl) // [1, 2, 3, 4]
	 * @param value - Value to discard from sorted array.
	 * @returns Returns true if an element in the sorted array existed and has been removed, or false if the element does not exist.
	 */
	delete(value: T): boolean {
		if (!this._maxes.length) return false

		const pos = bisectLeft(this._maxes, value)
		if (pos === this._maxes.length) return false

		const idx = bisectLeft(this._lists[pos], value)
		if (this._lists[pos][idx] !== value) return false

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
	 */
	private _delete(pos: number, idx: number): void {
		const _lists_pos = this._lists[pos]
		_lists_pos.splice(idx, 1)
		this._len--

		const len_lists_pos = _lists_pos.length

		if (len_lists_pos > (this._load >> 1)) {
			this._maxes[pos] = _lists_pos[_lists_pos.length - 1]

			if (this._index.length) {
				let child = this._offset + pos
				while (child > 0) {
					this._index[child]--
					child = (child - 1) >> 1
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
	 * Convert an index pair (lists index, sublist index) into a single index number that corresponds to the position of the value in the sorted array.
	 *
	 * Many queries require the index be built.
	 * Details of the index are described in {@link _build_index}.
	 *
	 * Indexing requires traversing the tree from a leaf node to the root.
	 * The parent of each node is easily computable at `(pos - 1) >> 1`.
	 *
	 * Left-child nodes are always at odd indices and right-child nodes are always at even indices.
	 *
	 * When traversing up from a right-child node, increment the total by the left-child node.
	 *
	 * The final index is the sum from traversal and the index in the sublist.
	 *
	 * @param pos - Lists index.
	 * @param idx - Sublist index.
	 * @returns - Index in sorted array.
	 */
	private _loc(pos: number, idx: number): number {
		if (pos === 0) return idx
		if (!this._index.length) this._buildIndex()

		let total = 0
		// Increment pos to point in the index to len(self._lists[pos]).
		pos += this._offset
		// Iterate until reaching the root of the index tree at pos = 0.
		while (pos > 0) {
			// Right-child nodes are at odd indices. At such indices account the total below the left child node.
			if (!(pos & 1)) {
				total += this._index[pos - 1]
			}
			pos = (pos - 1) >> 1
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
	 * @param idx - Index in sorted array.
	 * @returns - (lists index, sublist index) pair.
	 */
	private _pos(idx: number): [number, number] {
		if (idx < 0) {
			const lastLength = this._lists[this._lists.length - 1].length

			if (-idx <= lastLength) {
				return [this._lists.length - 1, lastLength + idx]
			}

			idx += this._len

			if (idx < 0) {
				throw new Error('list index out of range')
			}
		} else if (idx >= this._len) {
			throw new Error('list index out of range')
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
	 * Build a positional index for indexing the sorted array.
	 *
	 * Indexes are represented as binary trees in a dense array notation similar to a binary heap.
	 *
	 * When built, the index can be used for efficient indexing into the list.
	 * See the comment and notes on {@link _pos} for details.
	 */
	private _buildIndex(): void {
		const row0 = this._lists.map(list => list.length)

		if (row0.length === 1) {
			this._index = row0
			this._offset = 0
			return
		}

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

		const size = 1 << (Math.log2(row1.length - 1) | 0) + 1
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
	 * Remove value at `index` from sorted array.
	 *
	 * @example
	 * const sl = new SortedArray('abcde');
	 * sl.deleteAt(2);
	 * sl // SortedArray ['a', 'b', 'd', 'e']
	 *
	 * @param index - Integer or slice for indexing. Negative integers count back from the last item in the array.
	 * @throws {Error} - If index out of range.
	 */
	deleteAt(index: number): void {
		const [pos, idx] = this._pos(index)
		this._delete(pos, idx)
	}

	/**
	 * Removes elements from sorted array by index.
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
   * Returns a copy of a section of sorted array as an ordinary Array.
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
	 * Lookup value at `index` in sorted array.
	 *
	 * @example
	 * const sl = new SortedList('abcde');
	 * sl.at(1) // 'b'
	 * sl.at(-1) // 'e'
	 * sl.at(7) // undefined
	 *
	 * @param index - The zero-based index of the desired code unit. A negative index will count back from the last item.
	 * @returns The item located at the specified index.
	 * @throws {Error} - If index out of range.
	 */
	at(index: number): T {
		if (this._len) {
			if (index === 0) {
				return this._lists[0][0]
			} else if (index === -1) {
				const lastList = this._lists[this._lists.length - 1]
				return lastList[lastList.length - 1]
			}
		} else {
			throw new Error('list index out of range')
		}

		if (index >= 0 && index < this._lists[0].length) {
			return this._lists[0][index]
		}

		const lastList = this._lists[this._lists.length - 1]
		const lastLength = lastList.length
		if (index > -lastLength && index < 0) {
			return lastList[lastLength + index]
		}

		const [pos, idx] = this._pos(index)
		return this._lists[pos][idx]
	}

	/**
	 * Return an iterator over the sorted array.
	 *
	 * Iterating the sorted array while adding or deleting values may throw an error or fail to iterate over all values.
	 */
	*[Symbol.iterator](): IterableIterator<T> {
		for (const list of this._lists) {
			yield* list
		}
	}

	/**
	 * Return an iterator that slices sorted array from `start` to `stop`.
	 *
	 * The `start` and `stop` index are treated inclusive and exclusive, respectively.
	 *
	 * A negative index will count back from the last item.
	 *
	 * Both `start` and `stop` default to `undefined` which is automatically inclusive of the beginning and end of the sorted array.
	 *
	 * When `reverse` is `true` the values are yielded from the iterator in reverse order; `reverse` defaults to `false`.
	 *
	 * @example
	 * const sl = new SortedArray('abcdefghij');
	 * const it = sl.islice(2, 6);
	 * Array.from(it) // ['c', 'd', 'e', 'f']
	 *
	 * @param start - Start index (inclusive).
	 * @param stop - Stop index (exclusive).
	 * @param reverse - Yield values in reverse order.
	 * @returns - Iterator.
	 */
	islice(start = 0, end = this._len, reverse = false): IterableIterator<T> {
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
	 * Return an iterator that slices sorted array using two index pairs.
	 *
	 * The index pairs are (min_pos, min_idx) and (max_pos, max_idx), the first inclusive and the latter exclusive.
	 * See {@link _pos} for details on how an index is converted to an index pair.
	 *
	 * When `reverse` is `true`, values are yielded from the iterator in reverse order.
	 */
	private *_islice(minPos: number, minIdx: number, maxPos: number, maxIdx: number, reverse: boolean): IterableIterator<T> {
		if (minPos > maxPos) return

		if (minPos === maxPos) {
			if (reverse) {
				for (let idx = maxIdx - 1; idx >= minIdx; idx--) {
					yield this._lists[minPos][idx]
				}
			} else {
				for (let idx = minIdx; idx < maxIdx; idx++) {
					yield this._lists[minPos][idx]
				}
			}
			return
		}

		if (reverse) {
			for (let idx = maxIdx - 1; idx >= 0; idx--) {
				yield this._lists[maxPos][idx]
			}
			for (let pos = maxPos - 1; pos > minPos; pos--) {
				for (let idx = this._lists[pos].length - 1; idx >= 0; idx--) {
					yield this._lists[pos][idx]
				}
			}
			for (let idx = this._lists[minPos].length - 1; idx >= minIdx; idx--) {
				yield this._lists[minPos][idx]
			}
		} else {
			for (let idx = minIdx; idx < this._lists[minPos].length; idx++) {
				yield this._lists[minPos][idx]
			}
			for (let pos = minPos + 1; pos < maxPos; pos++) {
				yield* this._lists[pos]
			}
			for (let idx = 0; idx < maxIdx; idx++) {
				yield this._lists[maxPos][idx]
			}
		}
	}

	/**
	 * Create an iterator of values between `minimum` and `maximum`.
	 *
	 * Both `minimum` and `maximum` default to `undefined` which is automatically inclusive of the beginning and end of the sorted array.
	 *
	 * The argument `includeMinimum` and `includeMaximum` is a pair of booleans that indicates whether the minimum and maximum ought to be included in the range, respectively.
	 * Both arguments default to `true` such that the range is inclusive of both minimum and maximum.
	 *
	 * When `reverse` is `true` the values are yielded from the iterator in reverse order; `reverse` defaults to `false`.
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
	 * @returns - Iterator.
	 */
	irange(minimum?: T, maximum?: T, includeMinimum = true, includeMaximum = true, reverse = false): IterableIterator<T> {
		if (!this._maxes.length) return [][Symbol.iterator]()

		let minPos: number, minIdx: number
		if (minimum === undefined) {
			minPos = 0
			minIdx = 0
		} else {
			if (includeMinimum) {
				minPos = bisectLeft(this._maxes, minimum)
				if (minPos === this._maxes.length) return [][Symbol.iterator]()
				minIdx = bisectLeft(this._lists[minPos], minimum)
			} else {
				minPos = bisectRight(this._maxes, minimum)
				if (minPos === this._maxes.length) return [][Symbol.iterator]()
				minIdx = bisectRight(this._lists[minPos], minimum)
			}
		}

		let maxPos: number, maxIdx: number
		if (maximum === undefined) {
			maxPos = this._maxes.length - 1
			maxIdx = this._lists[maxPos].length
		} else {
			if (includeMaximum) {
				maxPos = bisectRight(this._maxes, maximum)
				if (maxPos === this._maxes.length) {
					maxPos--
					maxIdx = this._lists[maxPos].length
				} else {
					maxIdx = bisectRight(this._lists[maxPos], maximum)
				}
			} else {
				maxPos = bisectLeft(this._maxes, maximum)
				if (maxPos === this._maxes.length) {
					maxPos--
					maxIdx = this._lists[maxPos].length
				} else {
					maxIdx = bisectLeft(this._lists[maxPos], maximum)
				}
			}
		}

		return this._islice(minPos, minIdx, maxPos, maxIdx, reverse)
	}

	/**
	 * The size of the sorted array.
	 */
	get length(): number {
		return this._len
	}

	/**
	 * Return an index to insert `value` in the sorted array.
	 *
	 * If the `value` is already present, the insertion point will be before (to the left of) any existing values.
	 *
	 * @example
	 * const sl = new SortedArray([10, 11, 12, 13, 14]);
	 * sl.bisect_left(12) // 2
	 *
	 * @param value - Insertion index of value in sorted array.
	 * @returns - Index.
	 */
	bisectLeft(value: T): number {
		if (!this._maxes.length) return 0
		const pos = bisectLeft(this._maxes, value)
		if (pos === this._maxes.length) return this._len
		const idx = bisectLeft(this._lists[pos], value)
		return this._loc(pos, idx)
	}

	/**
	 * Return an index to insert `value` in the sorted array.
	 *
	 * Similar to {@link bisectLeft}, but if `value` is already present, the insertion point will be after (to the right of) any existing values.
	 *
	 * @example
	 * const sl = new SortedArray([10, 11, 12, 13, 14]);
	 * sl.bisect_right(12) // 3
	 *
	 * @param value - Insertion index of value in sorted array.
	 * @returns - Index.
	 */
	bisectRight(value: T): number {
		if (!this._maxes.length) return 0
		const pos = bisectRight(this._maxes, value)
		if (pos === this._maxes.length) return this._len
		const idx = bisectRight(this._lists[pos], value)
		return this._loc(pos, idx)
	}

	/**
	 * Return number of occurrences of `value` in the sorted array.
	 *
	 * @example
	 * const sl = new SortedArray([1, 2, 2, 3, 3, 3, 4, 4, 4, 4]);
	 * sl.count(3) // 3
	 *
	 * @param value - Value to count in sorted array.
	 * @returns - Count.
	 */
	count(value: T): number {
		if (!this._maxes.length) return 0

		const posLeft = bisectLeft(this._maxes, value)
		if (posLeft === this._maxes.length) return 0
		const idxLeft = bisectLeft(this._lists[posLeft], value)

		const posRight = bisectRight(this._maxes, value)
		if (posRight === this._maxes.length) {
			return this._len - this._loc(posLeft, idxLeft)
		}

		const idxRight = bisectRight(this._lists[posRight], value)

		if (posLeft === posRight) {
			return idxRight - idxLeft
		}

		const right = this._loc(posRight, idxRight)
		const left = this._loc(posLeft, idxLeft)
		return right - left
	}

	/**
	 * Remove and return value at `index` in sorted array.
	 *
	 * Throws error if the sorted array is empty or index is out of range.
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
	 * @returns - Value.
	 * @throws {Error} - If index is out of range.
	 */
	pop(index = -1): T {
		if (!this._len) {
			throw new Error('pop index out of range')
		}

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

		if (index >= 0 && index < this._lists[0].length) {
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

		const [pos, idx] = this._pos(index)
		const val = this._lists[pos][idx]
		this._delete(pos, idx)
		return val
	}

	/**
	 * Return first index of `value` in sorted array, or -1 if `value` is not present.
	 *
	 * Index must be between `start` and `end` for the `value` to be considered present.
	 * Negative indices count back from the last item.
	 *
	 * @example
	 * const sl = new SortedArray('abcde');
	 * sl.indexOf('d') // 3
	 * sl.indexOf('z') // -1
	 *
	 * @param value - Value in sorted array.
	 * @param start - The array index at which to start the search. If omitted, defaults to 0.
	 * @param end - The array index at which to end the search. If omitted, defaults to the end of the sorted array.
	 * @returns - The index of the first occurrence of `value` in the sorted array, or -1 if it is not present.
	 */
	indexOf(value: T, start = 0, end = this._len): number {
		if (!this._len) return -1

		if (start < 0) start += this._len
		if (start < 0) start = 0

		if (end < 0) end += this._len
		if (end > this._len) end = this._len

		if (end <= start) return -1

		const posLeft = bisectLeft(this._maxes, value)
		if (posLeft === this._maxes.length) return -1

		const idxLeft = bisectLeft(this._lists[posLeft], value)
		if (this._lists[posLeft][idxLeft] !== value) return -1

		end--
		const left = this._loc(posLeft, idxLeft)
		if (start <= left) {
			if (left <= end) {
				return left
			}
		} else {
			const right = this.bisectRight(value) - 1
			if (start <= right) {
				return start
			}
		}

		return -1
	}

	/**
	 * Return new sorted array containing all values in both sequences.
	 *
	 * Values in `other` do not need to be in sorted order.
	 *
	 * @example
	 * const sl1 = new SortedArray('bat');
	 * const sl2 = new SortedArray('cat');
	 * sl1.concat(sl2) // SortedArray ['a', 'a', 'b', 'c', 't', 't']
	 *
	 * @param other - Other iterable.
	 * @returns - New sorted array.
	 */
	concat(other: Iterable<T>): SortedArray<T> {
		return new SortedArray([...this._lists.flat(), ...other])
	}

	/**
	 * Return sorted array as an ordinary Array.
	 */
	toJSON(): T[] {
		return this._lists.flat()
	}

	/**
	 * Return a string representation of sorted array.
	 */
	toString(): string {
		return this._lists.toString()
	}

	/**
	 * Check invariants of sorted array.
	 */
	_check(): void {
		try {
			assert(this._load >= 4)
			assert(this._maxes.length === this._lists.length)
			assert(this._len === this._lists.reduce((acc, list) => acc + list.length, 0))

			// Check all sublists are sorted.
			for (const sublist of this._lists) {
				for (let pos = 1; pos < sublist.length; pos++) {
					assert(sublist[pos - 1] <= sublist[pos])
				}
			}

			// Check beginning/end of sublists are sorted.
			for (let pos = 1; pos < this._lists.length; pos++) {
				assert(this._lists[pos - 1][this._lists[pos - 1].length - 1] <= this._lists[pos][0])
			}

			// Check _maxes index is the last value of each sublist.
			for (let pos = 0; pos < this._maxes.length; pos++) {
				assert(this._maxes[pos] === this._lists[pos][this._lists[pos].length - 1])
			}

			// Check sublist lengths are less than double load-factor.
			const double = this._load << 1
			assert(this._lists.every(list => list.length <= double))

			// Check sublist lengths are greater than half load-factor for all but the last sublist.
			const half = this._load >> 1
			for (let pos = 0; pos < this._lists.length - 1; pos++) {
				assert(this._lists[pos].length >= half)
			}

			if (this._index.length) {
				assert(this._len === this._index[0])
				assert(this._index.length === this._offset + this._lists.length)

				// Check index leaf nodes equal length of sublists.
				for (let pos = 0; pos < this._lists.length; pos++) {
					const leaf = this._index[this._offset + pos]
					assert(leaf === this._lists[pos].length)
				}

				// Check index branch nodes are the sum of their children.
				for (let pos = 0; pos < this._offset; pos++) {
					const child = (pos << 1) + 1
					if (child >= this._index.length) {
						assert(this._index[pos] === 0)
					} else if (child + 1 === this._index.length) {
						assert(this._index[pos] === this._index[child])
					} else {
						const childSum = this._index[child] + this._index[child + 1]
						assert(childSum === this._index[pos])
					}
				}
			}
		} catch (e) {
			console.error('len', this._len)
			console.error('load', this._load)
			console.error('offset', this._offset)
			console.error('index', this._index.length, this._index)
			console.error('maxes', this._maxes.length, this._maxes)
			console.error('lists', this._lists.length, this._lists)
			throw e
		}
	}
}

function assert(predicate: unknown): void {
	if (!predicate) throw new Error('assertion failed')
}
