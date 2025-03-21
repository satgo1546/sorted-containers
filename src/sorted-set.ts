import { assert } from './common.ts'
import { bisectLeft } from './bisect.ts'
import { AbstractSortedArray, checkAbstractSortedArray } from './abstract-sorted-array.ts'

/**
 * Convert an iterable to an ordinary Array that is sorted and has no duplicate elements according to the comparator function.
 */
function iterableToSortedArraySet<T>(iterable: Iterable<T>, cmp: (a: T, b: T) => number): T[] {
	const arr = Array.from(iterable)
	if (!arr.length) return arr
	arr.sort(cmp)
	const deduplicated: T[] = [arr[0]]
	for (let i = 1; i < arr.length; i++) {
		if (cmp(arr[i - 1], arr[i])) {
			deduplicated.push(arr[i])
		}
	}
	return deduplicated
}

/**
 * SortedSet is a sorted mutable set.
 *
 * SortedSet values are maintained in sorted order.
 * The design of SortedSet is simple:
 * SortedSet is implemented as a SortedArray that prevents duplicates to be inserted.
 * It does not use the native Set type at all.
 *
 * SortedSet values must have a total ordering.
 * They are compared using the provided comparator function only;
 * they do not have to be the same object to be considered equal.
 *
 * The total ordering of values must not change while they are stored in the SortedSet.
 *
 * Set methods and properties:
 *
 * - {@link SortedSet#add}
 * - {@link SortedSet#clear}
 * - {@link SortedSet#delete}
 * - {@link SortedSet#forEach}
 * - {@link SortedSet#has}
 * - {@link SortedSet#size}
 * - {@link SortedSet#entries}
 * - {@link SortedSet#keys}
 * - {@link SortedSet#values}
 * - {@link SortedSet#[Symbol.iterator]}
 * - {@link SortedSet#[Symbol.toStringTag]}
 *
 * SortedArray methods:
 *
 * - {@link SortedSet#at}
 * - {@link SortedSet#bisectLeft}
 * - {@link SortedSet#bisectRight}
 * - {@link SortedSet#deleteAt}
 * - {@link SortedSet#deleteSlice}
 * - {@link SortedSet#indexOf}
 * - {@link SortedSet#irange}
 * - {@link SortedSet#islice}
 * - {@link SortedSet#pop}
 * - {@link SortedSet#reversed}
 *
 * Set-operation methods:
 *
 * - {@link SortedSet#union}
 * - {@link SortedSet#update}
 * - {@link SortedSet#intersection}
 * - {@link SortedSet#intersectionUpdate}
 * - {@link SortedSet#difference}
 * - {@link SortedSet#differenceUpdate}
 * - {@link SortedSet#symmetricDifference}
 * - {@link SortedSet#symmetricDifferenceUpdate}
 * - {@link SortedSet#isSubsetOf}
 * - {@link SortedSet#isSupersetOf}
 * - {@link SortedSet#isDisjointFrom}
 *
 * Miscellaneous methods:
 *
 * - {@link SortedSet#clone}
 * - {@link SortedSet#count}
 * - {@link SortedSet#toString}
 * - {@link SortedSet#toJSON}
 *
 * @typeParam T - The element type.
 * @typeParam C - Part of the element that the comparator function sees.
 */
export class SortedSet<T extends C, C = T> extends AbstractSortedArray<T, C> {
	/**
	 * Initialize from an Array of sorted unique values.
	 *
	 * @internal
	 */
	_set(values: T[]) {
		this._lists = []
		for (let pos = 0; pos < values.length; pos += this._load) {
			this._lists.push(values.slice(pos, pos + this._load))
		}
		this._maxes = this._lists.map(sublist => sublist[sublist.length - 1])
		this._len = values.length
	}

	/**
	 * Check if all elements of this SortedSet are in the given set.
	 *
	 * @param other - An iterable.
	 * @returns true if all elements in this SortedSet are also in the other set, and false otherwise.
	 */
	isSubsetOf(other: Iterable<T>): boolean {
		const arr = Array.from(other).sort(this._cmp)
		for (const sublist of this._lists) {
			for (const val of sublist) {
				const idx = bisectLeft(arr, val, this._cmp)
				if (idx >= arr.length || this._cmp(arr[idx], val)) return false
			}
		}
		return true
	}

	/**
	 * Check if all elements of the given set are in this SortedSet.
	 *
	 * @param other - An iterable.
	 * @returns true if all elements in the other set are also in this SortedSet, and false otherwise.
	 */
	isSupersetOf(other: Iterable<C>): boolean {
		for (const val of other) {
			if (!this.has(val)) return false
		}
		return true
	}

	/**
	 * Check if this SortedSet has no elements in common with the given set.
	 *
	 * @param other - An iterable.
	 * @returns true if this SortedSet has no elements in common with the other set, and false otherwise.
	 */
	isDisjointFrom(other: Iterable<T>): boolean {
		for (const val of other) {
			if (this.has(val)) return false
		}
		return true
	}

	/**
	 * Return the size of the SortedSet.
	 *
	 * @returns The size of the SortedSet.
	 */
	get size(): number {
		return this._len
	}

	/**
	 * Executes a callback function once for each element in a SortedSet.
	 *
	 * @param fn - The function to execute.
	 * @param thisArg - An object to which the `this` keyword can refer in the callback function.
	 * If thisArg is omitted, undefined is used.
	 */
	forEach(fn: (value: T, value2: T, set: this) => void, thisArg?: any): void {
		for (const sublist of this._lists) {
			for (const val of sublist) fn.call(thisArg, val, val, this)
		}
	}

	/**
	 * Returns an iterable of `[value, value]` pairs for every `value` in the SortedSet.
	 */
	*entries(): SetIterator<[T, T]> {
		for (const sublist of this._lists) {
			for (const val of sublist) yield [val, val]
		}
	}

	/**
	 * Add `value` to SortedSet if it does not already exist.
	 *
	 * @example
	 * const ss = new SortedSet();
	 * ss.add(3);
	 * ss.add(1);
	 * ss.add(2);
	 * ss // SortedSet [1, 2, 3]
	 *
	 * @param value - Value to add to the SortedSet.
	 */
	add(value: T): void {
		if (this._len) {
			let pos = bisectLeft(this._maxes, value, this._cmp)

			if (pos === this._maxes.length) {
				pos--
				this._lists[pos].push(value)
				this._maxes[pos] = value
			} else {
				const sublist = this._lists[pos]
				const idx = bisectLeft(sublist, value, this._cmp)
				if (!this._cmp(sublist[idx], value)) return
				sublist.splice(idx, 0, value)
			}

			this._expand(pos)
		} else {
			this._lists.push([value])
			this._maxes.push(value)
		}

		this._len++
	}

	/**
	 * Return number of occurrences of `value` in the SortedSet.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.count(3) // 1
	 *
	 * @param value - Value to count in the SortedSet.
	 * @returns Count.
	 */
	count(value: T): 0 | 1 {
		return +this.has(value) as 0 | 1
	}

	/**
	 * Return the difference of two sets as a new SortedSet.
	 *
	 * The difference is all values that are in this SortedSet but not the other iterable.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.difference([4, 5, 6, 7, 5]) // SortedSet [1, 2, 3]
	 *
	 * @param other - An iterable. It does not have to be a Set-like.
	 * @returns The difference as a new SortedSet.
	 */
	difference(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.differenceUpdate(other)
		return ret
	}

	/**
	 * Remove all values of an iterable from this SortedSet.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.differenceUpdate([4, 5, 6, 7, 5]);
	 * ss // SortedSet [1, 2, 3]
	 *
	 * @param other - An iterable.
	 */
	differenceUpdate(other: Iterable<T>): void {
		const values = iterableToSortedArraySet(other, this._cmp)
		if (values.length * 4 < this._len) {
			for (const value of values) {
				this.delete(value)
			}
			return
		}
		const result: T[] = []
		for (const sublist of this._lists) {
			for (const value of sublist) {
				const idx = bisectLeft(values, value, this._cmp)
				if (idx >= values.length || this._cmp(values[idx], value)) {
					result.push(value)
				}
			}
		}
		this._set(result)
	}

	/**
	 * Return the intersection of two sets as a new SortedSet.
	 *
	 * The intersection is all values that are in this sorted set and the other iterable.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.intersection([4, 5, 6, 7, 5]) // SortedSet [4, 5]
	 *
	 * @param other - An iterable. It does not have to be a Set-like.
	 * @returns The intersection as a new SortedSet.
	 */
	intersection(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.intersectionUpdate(other)
		return ret
	}

	/**
	 * Update the sorted set with the intersection of two sets.
	 *
	 * Keep only values found in itself and `other`.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.intersectionUpdate([4, 5, 6, 7, 5]);
	 * ss // SortedSet [4, 5]
	 *
	 * @param other - An iterable.
	 */
	intersectionUpdate(other: Iterable<T>): void {
		const values = iterableToSortedArraySet(other, this._cmp)
		const result: T[] = []
		if (this._len < values.length) {
			for (const sublist of this._lists) {
				for (const value of sublist) {
					const idx = bisectLeft(values, value, this._cmp)
					if (idx < values.length && !this._cmp(values[idx], value)) {
						result.push(value)
					}
				}
			}
		} else {
			for (const value of values) {
				if (value === undefined) {
					const index = this.indexOf(value)
					if (index >= 0) {
						result.push(this.at(index)!)
					}
				} else {
					const thisValue = this.find(value)
					if (thisValue) {
						result.push(thisValue)
					}
				}
			}
		}
		this._set(result)
	}

	/**
	 * Return the symmetric difference with `other` as a new SortedSet.
	 *
	 * The symmetric difference is all values tha are in exactly one of the sets.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.symmetricDifference([4, 5, 6, 7, 5]) // SortedSet [1, 2, 3, 6, 7]
	 *
	 * @param other - An iterable. It does not have to be a Set-like.
	 * @returns The symmetric difference as a new SortedSet.
	 */
	symmetricDifference(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.symmetricDifferenceUpdate(other)
		return ret
	}

	/**
	 * Update the sorted set with the symmetric difference with `other`.
	 *
	 * Keep only values found in exactly one of itself and `other`.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.symmetricDifferenceUpdate([4, 5, 6, 7, 5]);
	 * ss // SortedSet [1, 2, 3, 6, 7]
	 *
	 * @param other - An iterable.
	 */
	symmetricDifferenceUpdate(other: Iterable<T>): void {
		const result: T[] = this._lists.flat()
		for (const value of other) {
			const index = this.indexOf(value)
			if (index >= 0) {
				delete result[index]
			} else {
				result.push(value)
			}
		}
		this.clear()
		this.update(result.filter((_, i, a) => i in a))
	}

	/**
	 * Return new SortedSet with values from itself and `other`.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.union([4, 5, 6, 7, 5]) // SortedSet [1, 2, 3, 4, 5, 6, 7]
	 *
	 * @param other - An iterable. It does not have to be a Set-like.
	 * @returns The union as a new SortedSet.
	 *
	 * @see {@link update} for an in-place version of this method.
	 */
	union(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.update(other)
		return ret
	}

	/**
	 * Update the sorted set adding values from `other`.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.update([4, 5, 6, 7, 5]);
	 * ss // SortedSet [1, 2, 3, 4, 5, 6, 7]
	 *
	 * @param other - An iterable.
	 *
	 * @see {@link union} for a similar method that returns a new SortedSet.
	 */
	update(other: Iterable<T>): void {
		if (this._len) {
			const values = Array.from(other)
			if (values.length * 4 >= this._len) {
				this._lists.push(values)
				this._set(iterableToSortedArraySet(this._lists.flat(), this._cmp))
			} else {
				for (const val of other) this.add(val)
				return
			}
		} else {
			this._set(iterableToSortedArraySet(other, this._cmp))
		}
	}
}

export interface SortedSet<T, C> {
	/**
	 * Return true if `value` is an element of the SortedSet.
	 *
	 * @example
	 * const ss = new SortedSet([1, 2, 3, 4, 5]);
	 * ss.has(3) // true
	 *
	 * @param value - Search for this value in the SortedSet.
	 * @returns true if `value` is in the SortedSet.
	 */
	has(value: C): boolean

	/**
	 * Despite its name, returns an iterable of the values in the SortedSet.
	 */
	keys(): SetIterator<T>

	/**
	 * Returns an iterable of values in the SortedSet.
	 */
	values(): SetIterator<T>

	/**
	 * An alias for {@link values}.
	 */
	[Symbol.iterator](): ArrayIterator<T>
}

SortedSet.prototype[Symbol.toStringTag] = 'SortedSet'
SortedSet.prototype.has = AbstractSortedArray.prototype._has
SortedSet.prototype.keys = SortedSet.prototype.values = SortedSet.prototype[Symbol.iterator]
	= AbstractSortedArray.prototype._iter

/**
 * Check the invariants of a SortedSet.
 *
 * @throws {Error} If the SortedSet is corrupted.
 */
export function checkSortedSet<T>(self: SortedSet<T>) {
	checkAbstractSortedArray(self)

	// Check all sublists are sorted.
	for (const sublist of self._lists) {
		for (let pos = 1; pos < sublist.length; pos++) {
			assert(self._cmp(sublist[pos - 1], sublist[pos]) < 0)
		}
	}

	// Check beginning/end of sublists are sorted.
	for (let pos = 1; pos < self._lists.length; pos++) {
		const l = self._lists[pos - 1][self._lists[pos - 1].length - 1]
		const r = self._lists[pos][0]
		assert(self._cmp(l, r) < 0)
	}
}
