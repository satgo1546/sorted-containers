import { bisectLeft, bisectRight, insort } from './bisect.ts'
import { AbstractSortedArray, checkAbstractSortedArray } from './abstract-sorted-array.ts'

/**
 * SortedArray is a sorted mutable collection.
 *
 * SortedArray values are maintained in sorted order.
 *
 * SortedArray values must have a total ordering.
 * The total ordering of values must not change while they are stored in the SortedArray.
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
 * - {@link SortedArray#clone}
 * - {@link SortedArray#concat}
 * - {@link SortedArray#length}
 * - {@link SortedArray#toJSON}
 * - {@link SortedArray#toString}
 *
 * @typeParam T - The element type.
 * @typeParam C - Part of the element that the comparator function sees.
 */
export class SortedArray<T extends C, C = T> extends AbstractSortedArray<T, C> {
	/**
	 * Add `value` to SortedArray.
	 *
	 * @example
	 * const sl = new SortedArray();
	 * sl.add(3);
	 * sl.add(1);
	 * sl.add(2);
	 * sl // SortedArray [1, 2, 3]
	 *
	 * @param value - Value to add to SortedArray.
	 */
	add(value: T): void {
		if (this._maxes.length) {
			let pos = bisectRight(this._maxes, value, this._cmp)

			if (pos === this._maxes.length) {
				pos--
				this._lists[pos].push(value)
				this._maxes[pos] = value
			} else {
				insort(this._lists[pos], value, this._cmp)
			}

			this._expand(pos)
		} else {
			this._lists.push([value])
			this._maxes.push(value)
		}

		this._len++
	}

	update(iterable: Iterable<T>): void {
		let values = Array.from(iterable).sort(this._cmp)

		if (this._maxes.length) {
			if (values.length * 4 >= this._len) {
				this._lists.push(values)
				values = this._lists.flat()
				values.sort(this._cmp)
				this.clear()
			} else {
				for (const val of values) this.add(val)
				return
			}
		}

		this._set(values)
	}

	/**
	 * Return true if `value` is an element of the SortedArray.
	 *
	 * @example
	 * const sl = new SortedArray([1, 2, 3, 4, 5]);
	 * sl.includes(3) // true
	 *
	 * @param value - Search for value in SortedArray.
	 * @returns True if `value` in SortedArray.
	 */
	includes(value: C): boolean {
		return this._has(value)
	}

	/**
	 * Executes a callback function once for each element in a SortedArray.
	 * @param fn - The function to execute.
	 * @param thisArg - An object to which the `this` keyword can refer in the callback function.
	 * If thisArg is omitted, undefined is used.
	 */
	forEach(fn: (value: T, index: number, array: this) => void, thisArg?: any): void {
		let idx = 0
		for (const sublist of this._lists) {
			for (const val of sublist) fn.call(thisArg, val, idx++, this)
		}
	}

	/**
	 * An alias for {@link values}.
	 */
	[Symbol.iterator](): ArrayIterator<T> {
		return this._iter()
	}

	/**
	 * Returns an iterable of integers ranging from 0 (inclusive) to the length of the SortedArray (exclusive).
	 */
	keys(): ArrayIterator<number> {
		// Array(n) pre-allocates so Array(this._len).keys() is slower.
		return Array.prototype.keys.call({ length: this._len })
	}

	/**
	 * Returns an iterable of values in the SortedArray.
	 */
	values(): ArrayIterator<T> {
		return this._iter()
	}

	/**
	 * Returns an iterable of index-value pairs of elements in the SortedArray.
	 */
	*entries(): ArrayIterator<[number, T]> {
		let idx = 0
		for (const sublist of this._lists) {
			for (const val of sublist) yield [idx++, val]
		}
	}

	/**
	 * The size of the SortedArray.
	 */
	get length(): number {
		return this._len
	}

	/**
	 * Return number of occurrences of `value` in the SortedArray.
	 *
	 * @example
	 * const sl = new SortedArray([1, 2, 2, 3, 3, 3, 4, 4, 4, 4]);
	 * sl.count(3) // 3
	 *
	 * @param value - Value to count in SortedArray.
	 * @returns Count.
	 */
	count(value: T): number {
		if (!this._maxes.length) return 0

		const posLeft = bisectLeft(this._maxes, value, this._cmp)
		if (posLeft === this._maxes.length) return 0
		const idxLeft = bisectLeft(this._lists[posLeft], value, this._cmp)

		const posRight = bisectRight(this._maxes, value, this._cmp)
		if (posRight === this._maxes.length) {
			return this._len - this._loc(posLeft, idxLeft)
		}
		const idxRight = bisectRight(this._lists[posRight], value, this._cmp)

		if (posLeft === posRight) {
			return idxRight - idxLeft
		}

		const right = this._loc(posRight, idxRight)
		const left = this._loc(posLeft, idxLeft)
		return right - left
	}

	/**
	 * Return new SortedArray containing all values in both sequences.
	 *
	 * Values in `other` do not need to be in sorted order.
	 *
	 * @example
	 * const sl1 = new SortedArray('bat');
	 * const sl2 = new SortedArray('cat');
	 * sl1.concat(sl2) // SortedArray ['a', 'a', 'b', 'c', 't', 't']
	 *
	 * @param other - Other iterable.
	 * @returns New SortedArray.
	 */
	concat(other: Iterable<T>): SortedArray<T> {
		return new SortedArray([...this._lists.flat(), ...other], { comparator: this._cmp })
	}
}

/**
 * Check the invariants of a SortedArray.
 *
 * @throws {Error} If the SortedArray is corrupted.
 */
export const checkSortedArray: <T>(self: SortedArray<T>) => void = checkAbstractSortedArray
