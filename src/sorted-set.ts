import { assert } from './common.ts'
import { bisectLeft } from './bisect.ts'
import { AbstractSortedArray, checkAbstractSortedArray } from './abstract-sorted-array.ts'

/**
 * SortedSet is a sorted mutable set.
 *
 * SortedSet values are maintained in sorted order.
 * The design of SortedSet is simple:
 * SortedSet is implemented as a SortedArray that prevents duplicates to be inserted.
 *
 * SortedSet values must have a total ordering.
 * They are compared using the provided comparator function only;
 * they do not need to be the same object to be considered equal.
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
 */
export class SortedSet<T> extends AbstractSortedArray<T> {
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

	isSupersetOf(other: Iterable<T>): boolean {
		for (const val of other) {
			if (!this.has(val)) return false
		}
		return true
	}

	isDisjointFrom(other: Iterable<T>): boolean {
		for (const val of other) {
			if (this.has(val)) return false
		}
		return true
	}

	get size(): number {
		return this._len
	}

	/**
	 * Executes a callback function once for each element in a SortedSet.
	 * @param fn - The function to execute.
	 * @param thisArg - An object to which the `this` keyword can refer in the callback function.
	 * If thisArg is omitted, undefined is used.
	 */
	forEach(fn: (value: T, value2: T, set: this) => void, thisArg?: any): void {
		for (const sublist of this._lists) {
			for (const val of sublist) fn.call(thisArg, val, val, this)
		}
	}

	*entries(): SetIterator<[T, T]> {
		for (const val of this) yield [val, val]
	}

	add(value: T): this {
		if (this._maxes.length) {
			let pos = bisectLeft(this._maxes, value, this._cmp)

			if (pos === this._maxes.length) {
				pos--
				this._lists[pos].push(value)
				this._maxes[pos] = value
			} else {
				const idx = bisectLeft(this._lists[pos], value, this._cmp)
				if (!this._cmp(this._lists[pos][idx], value)) return this
				this._lists[pos].splice(idx, 0, value)
			}

			this._expand(pos)
		} else {
			this._lists.push([value])
			this._maxes.push(value)
		}

		this._len++
		return this
	}

	count(value: T): 0 | 1 {
		return +this.has(value) as 0 | 1
	}

	difference(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.differenceUpdate(other)
		return ret
	}

	differenceUpdate(other: Iterable<T>): void {
	}

	intersection(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.intersectionUpdate(other)
		return ret
	}

	intersectionUpdate(other: Iterable<T>): void {
	}

	symmetricDifference(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.symmetricDifferenceUpdate(other)
		return ret
	}

	symmetricDifferenceUpdate(other: Iterable<T>): void {
	}

	union(other: Iterable<T>): SortedSet<T> {
		const ret = this.clone()
		ret.update(other)
		return ret
	}

	update(other: Iterable<T>): void {
	}
}

export interface SortedSet<T> {
	has(value: T): boolean
	keys: () => SetIterator<T>
	values: () => SetIterator<T>
}

SortedSet.prototype[Symbol.toStringTag] = 'SortedSet'
SortedSet.prototype.has = AbstractSortedArray.prototype._has
SortedSet.prototype.keys = SortedSet.prototype.values
	= AbstractSortedArray.prototype[Symbol.iterator]

/**
 * Check invariants of SortedSet.
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
