import { describe, test, expect } from 'vitest'
import { SortedSet, checkSortedSet } from './sorted-set.ts'

function negateComparator(a: number, b: number): number {
	return b - a
}

function moduloComparator(a: number, b: number): number {
	return a % 10 - b % 10
}

describe('SortedSet', () => {
	test('init', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		checkSortedSet(temp)
		for (const val of temp) {
			expect(val).toBe(temp.at(val))
		}
	})

	test('init deduplicates', () => {
		let temp = new SortedSet(Array(100), { loadFactor: 7 })
		expect(temp.size).toBe(1)
		expect(Array.from(temp)).toStrictEqual([undefined])

		temp = new SortedSet(Array.from({ length: 100 }, (_, i) => i % 10), { loadFactor: 7 })
		expect(temp.size).toBe(10)
		expect(Array.from(temp)).toStrictEqual(Array.from({ length: 10 }, (_, i) => i))
	})

	test('contains', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (let val = 0; val < 100; val++) {
			expect(temp.has(val)).toBe(true)
		}
		for (let val = 100; val < 200; val++) {
			expect(temp.has(val)).toBe(false)
		}
	})

	test('getitem', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (const val of temp) {
			expect(val).toBe(temp.at(val))
		}
	})

	test('getitem_slice', () => {
		const vals = Array.from({ length: 100 }, (_, i) => i)
		const temp = new SortedSet(vals, { loadFactor: 7 })
		expect(temp.slice(20, 30)).toStrictEqual(vals.slice(20, 30))
	})

	test('getitem_key negate', () => {
		const temp = new SortedSet(Array(100).keys(), { comparator: negateComparator, loadFactor: 7 })
		expect(temp.size).toBe(100)
		for (let val = 0; val < 100; val++) {
			expect(temp.at(val)).toBe(99 - val)
		}
	})

	test('getitem_key modulo', () => {
		const temp = new SortedSet(Array(100).keys(), { comparator: moduloComparator, loadFactor: 7 })
		expect(temp.size).toBe(10)
		for (let val = 0; val < 10; val++) {
			expect(temp.at(val)).toBe(val)
		}
	})

	test('delitem', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (let val = 49; val >= 0; val--) {
			temp.deleteAt(val)
			checkSortedSet(temp)
		}
		for (let pos = 0; pos < 50; pos++) {
			expect(temp.at(pos)).toBe(pos + 50)
		}
	})

	test('delitem_slice', () => {
		const vals = Array.from({ length: 100 }, (_, i) => i)
		const temp = new SortedSet(vals, { loadFactor: 7 })
		const expectedVals = vals.filter((_, i) => i < 20 || i >= 40)
		temp.deleteSlice(-80, -60)
		checkSortedSet(temp)
		expect(Array.from(temp)).toStrictEqual(expectedVals)
	})

	test('eq', () => {
		const alpha = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const beta = new SortedSet(Array(100).keys(), { loadFactor: 17 })
		expect(Array.from(alpha)).toStrictEqual(Array.from(beta))
		beta.add(101)
		checkSortedSet(beta)
		expect(Array.from(alpha)).not.toStrictEqual(Array.from(beta))
	})

	test('ne', () => {
		const alpha = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const beta = new SortedSet(Array(99).keys(), { loadFactor: 17 })
		expect(Array.from(alpha)).not.toStrictEqual(Array.from(beta))
		expect(alpha).not.toBe(beta)
		beta.add(99)
		checkSortedSet(beta)
		expect(Array.from(alpha)).toStrictEqual(Array.from(beta))
		expect(alpha).not.toBe(beta)
	})

	test('lt_gt', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 50 }, (_, i) => i + 25), { loadFactor: 9 })
		expect(temp.isSubsetOf(temp)).toBe(true)
		expect(that.isSubsetOf(that)).toBe(true)
		expect(temp.isSubsetOf(that)).toBe(false)
		expect(that.isSubsetOf(temp)).toBe(true)
		expect(temp.isSupersetOf(temp)).toBe(true)
		expect(that.isSupersetOf(that)).toBe(true)
		expect(temp.isSupersetOf(that)).toBe(true)
		expect(that.isSupersetOf(temp)).toBe(false)
		expect(temp.isDisjointFrom(temp)).toBe(false)
		expect(that.isDisjointFrom(that)).toBe(false)
		expect(temp.isDisjointFrom(that)).toBe(false)
		expect(that.isDisjointFrom(temp)).toBe(false)
	})

	test('le_ge', () => {
		const alpha = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const beta = new SortedSet(Array(101).keys(), { loadFactor: 17 })
		expect(alpha.isSubsetOf(beta)).toBe(true)
		expect(beta.isSupersetOf(alpha)).toBe(true)
	})

	test('isDisjointFrom', () => {
		const empty = new SortedSet<number>(undefined, { loadFactor: 4 })
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		expect(empty.isDisjointFrom(empty)).toBe(true)
		expect(empty.isDisjointFrom([])).toBe(true)
		expect(empty.isDisjointFrom([1, 2, 3])).toBe(true)
		expect(empty.isDisjointFrom(temp)).toBe(true)
		expect(temp.isDisjointFrom(empty)).toBe(true)
		expect(temp.isDisjointFrom(temp)).toBe(false)
		expect(temp.isDisjointFrom([-1])).toBe(true)
		expect(temp.isDisjointFrom([-1, -2, -3])).toBe(true)
		expect(temp.isDisjointFrom([-1, 0, 1])).toBe(false)
	})

	test('forEach', () => {
		const ss = new SortedSet(Array(10000).keys())
		const arr: number[] = []
		ss.forEach(function (x, i, a) {
			expect(x).toBe(i)
			expect(i).toBe(arr.length)
			expect(a).toBe(ss)
			expect(this).toBe(Object)
			arr.push(x)
		}, Object)
		expect(arr).toStrictEqual(Array.from({ length: 10000 }, (_, i) => i))
	})

	test('iter', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (const val of temp) {
			expect(val).toBe(temp.at(val))
		}
	})

	test('iter keys', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (const val of temp.keys()) {
			expect(val).toBe(temp.at(val))
		}
	})

	test('iter values', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (const val of temp.values()) {
			expect(val).toBe(temp.at(val))
		}
	})

	test('iter entries', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		let i = 0
		for (const val of temp.entries()) {
			expect(val).toStrictEqual([i, i])
			i++
		}
	})

	test('reversed', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		let i = 99
		for (const val of temp.reversed()) {
			expect(val).toBe(i--)
		}
	})

	test('islice', () => {
		const ss = new SortedSet<number>([], { loadFactor: 7 })
		expect(Array.from(ss.islice())).toStrictEqual([])

		const values = Array.from({ length: 53 }, (_, i) => i)
		ss.update(values)
		checkSortedSet(ss)

		for (let start = 0; start < 53; start++) {
			for (let stop = 0; stop < 53; stop++) {
				expect(Array.from(ss.islice(start, stop))).toStrictEqual(values.slice(start, stop))
				expect(Array.from(ss.islice(start, stop, true))).toStrictEqual(values.slice(start, stop).reverse())
			}
		}

		for (let start = 0; start < 53; start++) {
			expect(Array.from(ss.islice(start))).toStrictEqual(values.slice(start))
			expect(Array.from(ss.islice(start, undefined, true))).toStrictEqual(values.slice(start).reverse())
		}

		for (let stop = 0; stop < 53; stop++) {
			expect(Array.from(ss.islice(undefined, stop))).toStrictEqual(values.slice(0, stop))
			expect(Array.from(ss.islice(undefined, stop, true))).toStrictEqual(values.slice(0, stop).reverse())
		}
	})

	test('irange', () => {
		const ss = new SortedSet<number>([], { loadFactor: 7 })
		expect(Array.from(ss.irange())).toStrictEqual([])

		const values = Array.from({ length: 53 }, (_, i) => i)
		ss.update(values)
		checkSortedSet(ss)

		for (let start = 0; start < 53; start++) {
			for (let end = start; end < 53; end++) {
				expect(Array.from(ss.irange(start, end))).toStrictEqual(values.slice(start, end + 1))
				expect(Array.from(ss.irange(start, end, true, true, true))).toStrictEqual(values.slice(start, end + 1).reverse())
			}
		}

		for (let start = 0; start < 53; start++) {
			for (let end = start; end < 53; end++) {
				expect(Array.from(ss.irange(start, end, true, false))).toStrictEqual(values.slice(start, end))
			}
		}

		for (let start = 0; start < 53; start++) {
			for (let end = start; end < 53; end++) {
				expect(Array.from(ss.irange(start, end, false, true))).toStrictEqual(values.slice(start + 1, end + 1))
			}
		}

		for (let start = 0; start < 53; start++) {
			for (let end = start; end < 53; end++) {
				expect(Array.from(ss.irange(start, end, false, false))).toStrictEqual(values.slice(start + 1, end))
			}
		}

		for (let start = 0; start < 53; start++) {
			expect(Array.from(ss.irange(start))).toStrictEqual(values.slice(start))
		}

		for (let end = 0; end < 53; end++) {
			expect(Array.from(ss.irange(undefined, end, true, false))).toStrictEqual(values.slice(0, end))
		}

		expect(Array.from(ss.irange(undefined, undefined, false, false))).toStrictEqual(values)
		expect(Array.from(ss.irange(53))).toStrictEqual([])
		expect(Array.from(ss.irange(undefined, 53, true, false))).toStrictEqual(values)
	})

	test('irange_key', () => {
		const values = Array.from({ length: 10 }, (_, i) => i)

		for (let load = 5; load <= 15; load++) {
			const ss = new SortedSet(Array(100).keys(), { comparator: moduloComparator, loadFactor: load })

			for (let start = 0; start < 10; start++) {
				for (let end = start; end < 10; end++) {
					const temp = Array.from(ss.irange(start, end))
					expect(temp).toEqual(values.slice(start, end + 1))

					const tempReverse = Array.from(ss.irange(start, end, true, true, true))
					expect(tempReverse).toEqual(values.slice(start, end + 1).reverse())
				}
			}

			for (let start = 0; start < 10; start++) {
				for (let end = start; end < 10; end++) {
					const temp = Array.from(ss.irange(start, end, true, false))
					expect(temp).toEqual(values.slice(start, end))
				}
			}

			for (let start = 0; start < 10; start++) {
				for (let end = start; end < 10; end++) {
					const temp = Array.from(ss.irange(start, end, false, true))
					expect(temp).toEqual(values.slice(start + 1, end + 1))
				}
			}

			for (let start = 0; start < 10; start++) {
				for (let end = start; end < 10; end++) {
					const temp = Array.from(ss.irange(start, end, false, false))
					expect(temp).toEqual(values.slice(start + 1, end))
				}
			}

			for (let start = 0; start < 10; start++) {
				const temp = Array.from(ss.irange(start))
				expect(temp).toEqual(values.slice(start))
			}

			for (let end = 0; end < 10; end++) {
				const temp = Array.from(ss.irange(undefined, end))
				expect(temp).toEqual(values.slice(0, end + 1))
			}
		}
	})

	test('len', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		expect(temp.size).toBe(100)
	})

	test('add', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		temp.add(100)
		checkSortedSet(temp)
		expect(temp.size).toBe(101)
		temp.add(90)
		checkSortedSet(temp)
		expect(temp.size).toBe(101)
		temp.add(1.5)
		checkSortedSet(temp)
		expect(temp.size).toBe(102)
		expect(temp.has(1.5)).toBe(true)
		for (let val = 0; val <= 100; val++) {
			expect(temp.has(val)).toBe(true)
		}

		temp.clear()
		temp.add(100)
		checkSortedSet(temp)
		expect(temp.size).toBe(1)
		expect(temp.has(100)).toBe(true)
	})

	test('bisect', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (let val = 0; val < 100; val++) {
			expect(temp.bisectLeft(val)).toBe(val)
			expect(temp.bisectRight(val)).toBe(val + 1)
		}
	})

	test('bisect_key', () => {
		const temp = new SortedSet(Array(100).keys(), { comparator: (a, b) => a - b, loadFactor: 7 })
		for (let val = 0; val < 100; val++) {
			expect(temp.bisectLeft(val)).toBe(val)
			expect(temp.bisectRight(val)).toBe(val + 1)
		}
	})

	test('clear', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		temp.clear()
		checkSortedSet(temp)
		expect(temp.size).toBe(0)
	})

	test('copy', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = temp.clone()
		that.add(1000)
		checkSortedSet(that)
		expect(temp.size).toBe(100)
		expect(that.size).toBe(101)
	})

	test('copy_copy', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = new SortedSet(temp)
		that.add(1000)
		checkSortedSet(that)
		expect(temp.size).toBe(100)
		expect(that.size).toBe(101)
	})

	test('count', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (let val = 0; val < 100; val++) {
			expect(temp.count(val)).toBe(1)
		}
		expect(temp.count(100)).toBe(0)
		expect(temp.count(0)).toBe(1)
		temp.add(0)
		expect(temp.count(0)).toBe(1)
		checkSortedSet(temp)
	})

	test('sub', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = temp.difference(Array.from({ length: 20 }, (_, i) => i))
		for (let val = 0; val < 100; val++) {
			expect(temp.has(val)).toBe(true)
		}
		for (let val = 0; val < 80; val++) {
			expect(that.at(val)).toBe(val + 20)
		}
	})

	test('difference small', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = temp.difference(Array(10).keys())
			.difference(Array.from({ length: 10 }, (_, i) => i + 10))
		for (let val = 0; val < 100; val++) {
			expect(temp.has(val)).toBe(true)
		}
		for (let val = 0; val < 80; val++) {
			expect(that.at(val)).toBe(val + 20)
		}
	})

	test('difference big', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = temp.difference(Array.from({ length: 90 }, (_, i) => i + 20).reverse())
		expect(temp.size).toBe(100)
		for (let val = 0; val < 100; val++) {
			expect(temp.has(val)).toBe(true)
		}
		expect(that.size).toBe(20)
		for (let val = 0; val < 20; val++) {
			expect(that.at(val)).toBe(val)
		}
	})

	test('difference_update', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		temp.differenceUpdate(Array(10).keys())
		checkSortedSet(temp)
		temp.differenceUpdate(Array.from({ length: 10 }, (_, i) => i + 10))
		checkSortedSet(temp)
		for (let val = 0; val < 80; val++) {
			expect(temp.at(val)).toBe(val + 20)
		}
	})

	test('discard', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		temp.delete(0)
		temp.delete(99)
		temp.delete(50)
		temp.delete(1000)
		checkSortedSet(temp)
		expect(temp.size).toBe(97)
	})

	test('index', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		for (let val = 0; val < 100; val++) {
			expect(temp.indexOf(val)).toBe(val)
		}
	})

	test('intersection small', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = temp.intersection(Array.from({ length: 20 }, (_, i) => i))
			.intersection(Array.from({ length: 20 }, (_, i) => i + 10))
		for (let val = 0; val < 10; val++) {
			expect(that.at(val)).toBe(val + 10)
		}
		for (let val = 0; val < 100; val++) {
			expect(temp.has(val)).toBe(true)
		}
	})

	test('intersection big', () => {
		const temp = new SortedSet(Array(20).keys(), { loadFactor: 7 })
		const that = temp.intersection(Array.from({ length: 100 }, (_, i) => i + 10).reverse())
		for (let val = 0; val < 10; val++) {
			expect(that.at(val)).toBe(val + 10)
		}
		expect(temp.size).toBe(20)
		for (let val = 0; val < 20; val++) {
			expect(temp.has(val)).toBe(true)
		}
	})

	test('intersection_update', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		temp.intersectionUpdate(Array.from({ length: 20 }, (_, i) => i))
		checkSortedSet(temp)
		temp.intersectionUpdate(Array.from({ length: 20 }, (_, i) => i + 10))
		checkSortedSet(temp)
		for (let val = 0; val < 10; val++) {
			expect(temp.at(val)).toBe(val + 10)
		}
	})

	test('isdisjoint', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 100 }, (_, i) => i + 100), { loadFactor: 9 })
		expect(temp.isDisjointFrom(that)).toBe(true)
	})

	test('issubset', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 50 }, (_, i) => i + 25), { loadFactor: 9 })
		expect(that.isSubsetOf(temp)).toBe(true)
	})

	test('issuperset', () => {
		const temp = new SortedSet(Array(100).keys(), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 50 }, (_, i) => i + 25), { loadFactor: 9 })
		expect(temp.isSupersetOf(that)).toBe(true)
	})

	test('xor', () => {
		const temp = new SortedSet(Array.from({ length: 75 }, (_, i) => i), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 75 }, (_, i) => i + 25), { loadFactor: 9 })
		const result = temp.symmetricDifference(that)
		for (let val = 0; val < 25; val++) {
			expect(result.at(val)).toBe(val)
		}
		for (let val = 25; val < 50; val++) {
			expect(result.at(val)).toBe(val + 50)
		}
		for (let val = 0; val < 75; val++) {
			expect(temp.has(val)).toBe(true)
		}
		for (let val = 0; val < 75; val++) {
			expect(that.has(val + 25)).toBe(true)
		}
	})

	test('symmetric_difference', () => {
		const temp = new SortedSet(Array.from({ length: 75 }, (_, i) => i), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 75 }, (_, i) => i + 25), { loadFactor: 9 })
		const result = temp.symmetricDifference(that)
		for (let val = 0; val < 25; val++) {
			expect(result.at(val)).toBe(val)
		}
		for (let val = 25; val < 50; val++) {
			expect(result.at(val)).toBe(val + 50)
		}
		for (let val = 0; val < 75; val++) {
			expect(temp.has(val)).toBe(true)
		}
		for (let val = 0; val < 75; val++) {
			expect(that.has(val + 25)).toBe(true)
		}
	})

	test('symmetric_difference_update', () => {
		const temp = new SortedSet(Array.from({ length: 75 }, (_, i) => i), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 75 }, (_, i) => i + 25), { loadFactor: 9 })
		temp.symmetricDifferenceUpdate(that)
		checkSortedSet(temp)
		for (let val = 0; val < 25; val++) {
			expect(temp.at(val)).toBe(val)
		}
		for (let val = 25; val < 50; val++) {
			expect(temp.at(val)).toBe(val + 50)
		}
	})

	test('pop', () => {
		const temp = new SortedSet(Array.from({ length: 100 }, (_, i) => i), { loadFactor: 7 })
		temp.pop()
		temp.pop(0)
		for (let val = 0; val < 98; val++) {
			expect(temp.at(val)).toBe(val + 1)
		}
	})

	test('remove', () => {
		const temp = new SortedSet(Array.from({ length: 100 }, (_, i) => i), { loadFactor: 7 })
		temp.delete(50)
		checkSortedSet(temp)
		expect(temp.has(50)).toBe(false)
	})

	test('or', () => {
		const temp = new SortedSet(Array.from({ length: 50 }, (_, i) => i), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 50 }, (_, i) => i + 50), { loadFactor: 9 })
		const result = temp.union(that)
		for (let val = 0; val < 100; val++) {
			expect(result.at(val)).toBe(val)
		}
		for (let val = 0; val < 50; val++) {
			expect(temp.has(val)).toBe(true)
		}
		for (let val = 0; val < 50; val++) {
			expect(that.has(val + 50)).toBe(true)
		}
	})

	test('union', () => {
		const temp = new SortedSet(Array.from({ length: 50 }, (_, i) => i), { loadFactor: 7 })
		const that = new SortedSet(Array.from({ length: 50 }, (_, i) => i + 50), { loadFactor: 9 })
		const result = temp.union(that)
		for (let val = 0; val < 100; val++) {
			expect(result.at(val)).toBe(val)
		}
		for (let val = 0; val < 50; val++) {
			expect(temp.has(val)).toBe(true)
		}
		for (let val = 0; val < 50; val++) {
			expect(that.has(val + 50)).toBe(true)
		}
	})

	test('update', () => {
		const temp = new SortedSet(Array.from({ length: 80 }, (_, i) => i), { loadFactor: 7 })
		temp.update(Array.from({ length: 20 }, (_, i) => i + 80))
		checkSortedSet(temp)
		for (let val = 0; val < 100; val++) {
			expect(temp.has(val)).toBe(true)
		}
	})

	test('ior', () => {
		const temp = new SortedSet(Array.from({ length: 80 }, (_, i) => i), { loadFactor: 7 })
		temp.update(Array.from({ length: 10 }, (_, i) => i + 80))
		checkSortedSet(temp)
		temp.update(Array.from({ length: 10 }, (_, i) => i + 90))
		checkSortedSet(temp)
		for (let val = 0; val < 100; val++) {
			expect(temp.has(val)).toBe(true)
		}
	})

	test('repr', () => {
		const temp = new SortedSet(Array(10).keys(), {
			comparator: (a, b) => a - b,
			loadFactor: 7,
		})
		expect(temp.toString()).toBe('0,1,2,3,4,5,6,7,8,9')
	})

	test('toJSON', () => {
		const temp = new SortedSet(Array(10).keys())
		expect(temp.toJSON()).toStrictEqual(Array.from({ length: 10 }, (_, i) => i))
		expect(JSON.stringify(temp)).toBe('[0,1,2,3,4,5,6,7,8,9]')
	})
})

describe('JavaScript specialty', () => {
	test('NaN with default comparator', () => {
		const ss = new SortedSet(Array(100).fill(NaN), { loadFactor: 17 })
		expect(ss.size).toBe(1)
		expect(Array.from(ss)).toStrictEqual([NaN])
		expect(ss.has(NaN)).toBe(true)
		expect(ss.indexOf(NaN)).toBe(0)
	})

	test('±0 with default comparator', () => {
		const ss = new SortedSet(Array.from({ length: 100 }, (_, i) => (i % 2 - .5) * 0), { loadFactor: 17 })
		expect(ss.size).toBe(1)
		expect(Array.from(ss)).toStrictEqual([-0])
		expect(Array.from(ss)).not.toStrictEqual([0])
		expect(ss.has(0)).toBe(true)
		expect(ss.has(-0)).toBe(true)
	})

	test('undefined and null', () => {
		const ss = new SortedSet(
			Array.from({ length: 100 }, (_, i) => i % 3 ? null : undefined),
			{
				comparator(a, b) {
					const aStr = '' + a
					const bStr = '' + b
					return +(aStr > bStr) - +(aStr < bStr)
				},
				loadFactor: 17,
			},
		)
		expect(ss.size).toBe(2)
		expect(Array.from(ss)).toStrictEqual([null, undefined])
		expect(ss.at(-3)).toBeUndefined()
		expect(ss.at(-2)).toBeNull()
		expect(ss.at(-1)).toBeUndefined()
		expect(ss.at(0)).toBeNull()
		expect(ss.at(1)).toBeUndefined()
		expect(ss.at(2)).toBeUndefined()
		expect(ss.at(3)).toBeUndefined()
		expect(ss.has(undefined)).toBe(true)
		expect(ss.has(null)).toBe(true)
		expect(ss.indexOf(undefined)).toBe(1)
		expect(ss.indexOf(null)).toBe(0)
		expect(ss.count(undefined)).toBe(1)
		expect(ss.count(null)).toBe(1)
	})
})
