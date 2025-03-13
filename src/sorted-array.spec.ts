import { describe, test, expect } from 'vitest'
import { SortedArray, checkSortedArray } from './sorted-array.ts'
import seedrandom from 'seedrandom'

function* range(start: number, end?: number, step: number = 1): Generator<number> {
	if (end === undefined) {
		end = start
		start = 0
	}
	if (step > 0) {
		for (let i = start; i < end; i += step) yield i
	} else {
		for (let i = start; i > end; i += step) yield i
	}
}

describe('SortedArray', () => {
	test('init', () => {
		let slt = new SortedArray<number>(undefined, { loadFactor: 10000 })
		expect(slt instanceof SortedArray).toBe(true)
		checkSortedArray(slt)

		slt = new SortedArray(range(10000))
		expect(Array.from(slt)).toStrictEqual(Array.from(range(10000)))

		slt.clear()
		expect(slt._len).toBe(0)
		expect(slt.length).toBe(0)
		expect(slt._maxes).toStrictEqual([])
		expect(slt._lists).toStrictEqual([])
		checkSortedArray(slt)
	})

	test('add', () => {
		let slt = new SortedArray<number>
		const random = seedrandom('')
		for (const val of range(1000)) {
			slt.add(val)
			checkSortedArray(slt)
		}

		slt = new SortedArray()
		for (const val of range(1000, 0, -1)) {
			slt.add(val)
			checkSortedArray(slt)
		}

		slt = new SortedArray()
		for (const val of range(1000)) {
			slt.add(random())
			checkSortedArray(slt)
		}
	})

	test('update', () => {
		let slt = new SortedArray<number>
		slt.update(range(1000))
		expect(slt.length).toBe(1000)
		checkSortedArray(slt)

		slt.update(range(100))
		expect(slt.length).toBe(1100)
		checkSortedArray(slt)

		slt.update(range(10000))
		expect(slt.length).toBe(11100)
		checkSortedArray(slt)

		const values = [...range(1000), ...range(100), ...range(10000)].sort((a, b) => a - b)
		expect(Array.from(slt)).toStrictEqual(values)
	})

	test('contains', () => {
		let slt = new SortedArray<number>
		expect(slt.includes(0)).toBeFalsy()

		slt.update(range(10000))

		for (const val of range(10000)) {
			expect(slt.includes(val)).toBe(true)
		}

		expect(slt.includes(10000)).toBeFalsy()
		checkSortedArray(slt)
	})

	test('discard', () => {
		let slt = new SortedArray<number>
		expect(slt.delete(0)).toBe(false)
		expect(slt.length).toBe(0)
		checkSortedArray(slt)

		slt = new SortedArray([1, 2, 2, 2, 3, 3, 5], { loadFactor: 4 })

		expect(slt.delete(6)).toBe(false)
		checkSortedArray(slt)
		expect(slt.delete(4)).toBe(false)
		checkSortedArray(slt)
		expect(slt.delete(2)).toBe(true)
		checkSortedArray(slt)

		expect(Array.from(slt)).toStrictEqual([1, 2, 2, 3, 3, 5])
	})

	test('remove_valueerror1', () => {
		let slt = new SortedArray<number>
		expect(slt.delete(0)).toBe(false)
	})

	test('remove_valueerror2', () => {
		let slt = new SortedArray(range(100), { loadFactor: 10 })
		expect(slt.delete(100)).toBe(false)
	})

	test('remove_valueerror3', () => {
		let slt = new SortedArray([1, 2, 2, 2, 3, 3, 5])
		expect(slt.delete(4)).toBe(false)
	})

	test('delete', () => {
		let slt = new SortedArray(range(20), { loadFactor: 4 })
		checkSortedArray(slt)
		for (const val of range(20)) {
			slt.delete(val)
			checkSortedArray(slt)
		}
		expect(slt.length).toBe(0)
		expect(slt._maxes).toStrictEqual([])
		expect(slt._lists).toStrictEqual([])
	})

	test('getitem', () => {
		const random = seedrandom('')
		let slt = new SortedArray(undefined, { loadFactor: 4 })
		for (let idx = 0; idx < 100; idx++) {
			expect(slt.at(idx)).toBeUndefined()
			slt.add(random())
			expect(typeof slt.at(idx)).toBe('number')
		}

		slt = new SortedArray(undefined, { loadFactor: 17 })
		for (let idx = -100; idx < 100; idx++) {
			expect(slt.at(idx)).toBeUndefined()
		}

		slt.clear()
		const lst: number[] = []

		for (const rpt of range(100)) {
			const val = random()
			slt.add(val)
			lst.push(val)
		}

		lst.sort((a, b) => a - b)

		for (let idx = 0; idx < 100; idx++) {
			expect(slt.at(idx)).toBe(lst[idx])
			expect(slt.at(idx - 99)).toBe(lst.at(idx - 99))
		}
	})

	test('getitem_slice', () => {
		let slt = new SortedArray(undefined, { loadFactor: 17 })
		const random = seedrandom('')

		const lst: number[] = []

		for (const rpt of range(100)) {
			const val = random()
			slt.add(val)
			lst.push(val)
		}

		lst.sort((a, b) => a - b)

		for (const start of [-75, -25, 0, 25, 75]) {
			expect(slt.slice(start)).toStrictEqual(lst.slice(start))
		}
		for (const stop of [-75, -25, 0, 25, 75]) {
			expect(slt.slice(0, stop)).toStrictEqual(lst.slice(0, stop))
		}

		for (const start of [-75, -25, 0, 25, 75]) {
			for (const stop of [-75, -25, 0, 25, 75]) {
				expect(slt.slice(start, stop)).toStrictEqual(lst.slice(start, stop))
			}
		}

		for (const stop of [-75, -25, 0, 25, 75]) {
			expect(slt.slice(0, stop)).toStrictEqual(lst.slice(0, stop))
		}

		for (const start of [-75, -25, 0, 25, 75]) {
			expect(slt.slice(start, undefined)).toStrictEqual(lst.slice(start, undefined))
		}

		for (const start of [-75, -25, 0, 25, 75]) {
			for (const stop of [-75, -25, 0, 25, 75]) {
				expect(slt.slice(start, stop)).toStrictEqual(lst.slice(start, stop))
			}
		}
	})

	test('getitem_slice_big', () => {
		let slt = new SortedArray(range(4))
		const lst = Array.from(range(4))

		for (const start of [-6, -4, -2, 0, 2, 4, 6]) {
			for (const stop of [-6, -4, -2, 0, 2, 4, 6]) {
				expect(slt.slice(start, stop)).toStrictEqual(lst.slice(start, stop))
			}
		}
	})

	test('getitem_indexerror1', () => {
		let slt = new SortedArray<number>
		for (let i = -100; i < 100; i++) {
			expect(slt.at(i)).toBeUndefined()
		}
	})

	test('getitem_indexerror2', () => {
		let slt = new SortedArray(range(100))
		expect(slt.at(200)).toBeUndefined()
	})

	test('getitem_indexerror3', () => {
		let slt = new SortedArray(range(100))
		expect(slt.at(-101)).toBeUndefined()
	})

	test('delitem', () => {
		let slt = new SortedArray(range(100), { loadFactor: 17 })
		const random = seedrandom('')
		for (let i = 0; i < 100; i++) {
			slt.deleteAt(100 + i)
			slt.deleteAt(-101 - i)
			expect(slt.length).toBe(100)
			checkSortedArray(slt)
		}
		while (slt.length > 0) {
			const pos = Math.floor(random() * slt.length)
			slt.deleteAt(pos)
			checkSortedArray(slt)
		}

		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.deleteSlice(0, slt.length)
		expect(slt.length).toBe(0)
		checkSortedArray(slt)
	})

	test('delitem_slice', () => {
		let slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.deleteSlice(10, 40)
		expect(slt.length).toBe(70)
		expect(Array.from(slt)).toStrictEqual([...range(10), ...range(40, 100)])
	})

	test('forEach', () => {
		let slt = new SortedArray(range(10000))
		const arr: number[] = []
		slt.forEach(function (x, i, a) {
			expect(typeof x).toBe('number')
			expect(i).toBe(arr.length)
			expect(a).toBe(slt)
			expect(this).toBe(Object)
			arr.push(x)
		}, Object)
		expect(arr).toStrictEqual(Array.from(range(10000)))
	})

	test('iter', () => {
		let slt = new SortedArray(range(10000))
		const itr = slt[Symbol.iterator]()
		expect(Array.from(itr)).toStrictEqual(Array.from(range(10000)))
	})

	test('reversed', () => {
		let slt = new SortedArray(range(10000))
		const rev = slt.reversed()
		expect(Array.from(rev)).toStrictEqual(Array.from(range(9999, -1, -1)))

		slt = new SortedArray(undefined, { loadFactor: 7 })
		expect(Array.from(slt.reversed())).toStrictEqual([])
	})

	test('islice', () => {
		let slt = new SortedArray(undefined, { loadFactor: 7 })

		expect(slt.slice()).toStrictEqual([])

		const values = Array.from(range(53))
		slt.update(values)

		for (const start of range(-55, 55)) {
			for (const stop of range(-55, 55)) {
				expect(Array.from(slt.islice(start, stop))).toStrictEqual(values.slice(start, stop))
				expect(Array.from(slt.islice(start, stop, true))).toStrictEqual(values.slice(start, stop).reverse())
			}
		}

		for (const start of range(-55, 55)) {
			expect(Array.from(slt.islice(start))).toStrictEqual(values.slice(start))
			expect(Array.from(slt.islice(start, undefined, true))).toStrictEqual(values.slice(start).reverse())
		}

		for (const stop of range(-55, 55)) {
			expect(Array.from(slt.islice(0, stop))).toStrictEqual(values.slice(0, stop))
			expect(Array.from(slt.islice(0, stop, true))).toStrictEqual(values.slice(0, stop).reverse())
		}
	})

	test('irange', () => {
		let slt = new SortedArray(undefined, { loadFactor: 7 })

		expect(Array.from(slt.irange())).toStrictEqual([])

		const values = Array.from(range(53))
		slt.update(values)

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(Array.from(slt.irange(start, end))).toStrictEqual(values.slice(start, end + 1))
				expect(Array.from(slt.irange(start, end, undefined, undefined, true))).toStrictEqual(values.slice(start, end + 1).reverse())
			}
		}

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(Array.from(slt.irange(start, end, true, false))).toStrictEqual(Array.from(range(start, end)))
			}
		}

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(Array.from(slt.irange(start, end, false, true))).toStrictEqual(Array.from(range(start + 1, end + 1)))
			}
		}

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(Array.from(slt.irange(start, end, false, false))).toStrictEqual(Array.from(range(start + 1, end)))
			}
		}

		for (const start of range(53)) {
			expect(Array.from(slt.irange(start))).toStrictEqual(Array.from(range(start, 53)))
		}

		for (const end of range(53)) {
			expect(Array.from(slt.irange(undefined, end, true, false))).toStrictEqual(Array.from(range(0, end)))
		}

		expect(Array.from(slt.irange(undefined, undefined, false, false))).toStrictEqual(values)
		expect(Array.from(slt.irange(53))).toStrictEqual([])
		expect(Array.from(slt.irange(undefined, 53, true, false))).toStrictEqual(values)
	})

	test('len', () => {
		let slt = new SortedArray<number>
		for (const val of range(10000)) {
			slt.add(val)
			expect(slt.length).toBe(val + 1)
		}
	})

	test('bisect_left', () => {
		let slt = new SortedArray<number>
		expect(slt.bisectLeft(0)).toBe(0)
		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.update(range(100))
		checkSortedArray(slt)
		expect(slt.bisectLeft(50)).toBe(100)
		expect(slt.bisectLeft(200)).toBe(200)
	})

	test('bisect_right', () => {
		let slt = new SortedArray<number>
		expect(slt.bisectRight(10)).toBe(0)
		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.update(range(100))
		checkSortedArray(slt)
		expect(slt.bisectRight(10)).toBe(22)
		expect(slt.bisectRight(200)).toBe(200)
	})

	test('copy', () => {
		const alpha = new SortedArray(range(100), { loadFactor: 7 })
		const beta = alpha.clone()
		expect(beta instanceof SortedArray).toBe(true)
		checkSortedArray(beta)
		expect(Array.from(beta)).toStrictEqual(Array.from(alpha))
		alpha.add(100)
		expect(alpha.length).toBe(101)
		expect(beta.length).toBe(100)
		beta.add(100)
		expect(Array.from(beta)).toStrictEqual(Array.from(alpha))
	})

	test('count', () => {
		let slt = new SortedArray(undefined, { loadFactor: 7 })

		expect(slt.count(0)).toBe(0)

		for (const iii of range(100)) {
			for (const jjj of range(iii)) {
				slt.add(iii)
			}
			checkSortedArray(slt)
		}

		for (const iii of range(100)) {
			expect(slt.count(iii)).toBe(iii)
		}

		expect(slt.count(100)).toBe(0)
	})

	test('pop', () => {
		let slt = new SortedArray(range(10), { loadFactor: 4 })
		checkSortedArray(slt)
		expect(slt.pop()).toBe(9)
		checkSortedArray(slt)
		expect(slt.pop(0)).toBe(0)
		checkSortedArray(slt)
		expect(slt.pop(-2)).toBe(7)
		checkSortedArray(slt)
		expect(slt.pop(4)).toBe(5)
		checkSortedArray(slt)
		expect(slt.pop(1)).toBe(2)
		checkSortedArray(slt)
	})

	test('pop_indexerror1', () => {
		let slt = new SortedArray(range(10), { loadFactor: 4 })
		expect(slt.pop(-11)).toBeUndefined()
	})

	test('pop_indexerror2', () => {
		let slt = new SortedArray(range(10), { loadFactor: 4 })
		expect(slt.pop(10)).toBeUndefined()
	})

	test('pop_indexerror3', () => {
		let slt = new SortedArray<number>
		expect(slt.pop()).toBeUndefined()
	})

	test('index', () => {
		let slt = new SortedArray(range(100), { loadFactor: 17 })
		checkSortedArray(slt)

		for (const val of range(100)) {
			expect(slt.indexOf(val)).toBe(val)
		}

		expect(slt.indexOf(99, 0, 1000)).toBe(99)

		slt = new SortedArray(Array(100).fill(0), { loadFactor: 17 })

		for (const start of range(100)) {
			for (const stop of range(start, 100)) {
				expect(slt.indexOf(0, start, stop + 1)).toBe(start)
			}
		}

		for (const start of range(100)) {
			expect(slt.indexOf(0, -(100 - start))).toBe(start)
		}

		expect(slt.indexOf(0, -1000)).toBe(0)
	})

	test('index_valueerror1', () => {
		let slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(0, 10)).toBe(-1)
	})

	test('index_valueerror2', () => {
		let slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(0, 0, -10)).toBe(-1)
	})

	test('index_valueerror3', () => {
		let slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(0, 7, 3)).toBe(-1)
	})

	test('index_valueerror4', () => {
		let slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(1)).toBe(-1)
	})

	test('index_valueerror5', () => {
		let slt = new SortedArray<number>
		expect(slt.indexOf(1)).toBe(-1)
	})

	test('index_valueerror6', () => {
		let slt = new SortedArray(range(10), { loadFactor: 4 })
		expect(slt.indexOf(3, 5)).toBe(-1)
	})

	test('index_valueerror7', () => {
		let slt = new SortedArray([...Array(10).fill(0), ...Array(10).fill(2)], { loadFactor: 4 })
		expect(slt.indexOf(1, 0, 10)).toBe(-1)
	})

	test('mul', () => {
		const thisList = new SortedArray(range(10), { loadFactor: 4 })
		const thatList = thisList.concat(thisList).concat(thisList).concat(thisList).concat(thisList)
		checkSortedArray(thisList)
		checkSortedArray(thatList)
		expect(Array.from(thisList)).toStrictEqual(Array.from(range(10)))
		expect(Array.from(thatList)).toStrictEqual(Array.from(range(10)).flatMap(x => Array(5).fill(x)))
		expect(thisList).not.toStrictEqual(thatList)
		expect(Array.from(thisList)).not.toStrictEqual(Array.from(thatList))
	})

	test('imul', () => {
		const thisList = new SortedArray(range(10), { loadFactor: 4 })
		thisList.update(thisList)
		checkSortedArray(thisList)
		thisList.update(thisList)
		checkSortedArray(thisList)
		expect(Array.from(thisList)).toStrictEqual(Array.from(range(10)).flatMap(x => Array(4).fill(x)))
	})

	test('check', () => {
		let slt = new SortedArray(range(10), { loadFactor: 4 })
		Object.assign(slt, { _len: 5 })
		expect(() => checkSortedArray(slt)).toThrow()
	})
})

describe('SortedArray modulo 10', () => {
	function moduloComparator(a: number, b: number): number {
		return a % 10 - b % 10
	}

	test('init', () => {
		let slt = new SortedArray(undefined, { comparator: moduloComparator })
		expect(slt instanceof SortedArray).toBe(true)
		checkSortedArray(slt)

		slt = new SortedArray(undefined, { comparator: moduloComparator, loadFactor: 10000 })
		checkSortedArray(slt)

		slt = new SortedArray(range(10000), { comparator: moduloComparator })
		expect(slt.toJSON()).toStrictEqual(Array.from(range(10000)).sort(moduloComparator))

		slt.clear()
		expect(slt.length).toBe(0)
		expect(slt.toJSON()).toStrictEqual([])

		expect(slt instanceof SortedArray).toBe(true)
		checkSortedArray(slt)
	})

	test('new', () => {
		let slt = new SortedArray(range(1000), { comparator: moduloComparator })
		expect(slt.toJSON()).toStrictEqual(Array.from(range(1000)).sort(moduloComparator))
		checkSortedArray(slt)

		expect(slt instanceof SortedArray).toBe(true)
		expect(slt.constructor).toBe(SortedArray)

		slt = new SortedArray(range(1000), { comparator: moduloComparator })
		expect(slt.toJSON()).toStrictEqual(Array.from(range(1000)).sort(moduloComparator))
		checkSortedArray(slt)

		expect(slt instanceof SortedArray).toBe(true)
		expect(slt.constructor).toBe(SortedArray)
	})

	test('key', () => {
		const slt = new SortedArray(range(10000), { comparator: moduloComparator })
		checkSortedArray(slt)

		const values = Array.from(range(10000)).sort(moduloComparator)
		expect(slt.toJSON()).toStrictEqual(values)
		expect(Array(10000).fill(undefined).every((_, val) => slt.includes(val))).toBe(true)
	})

	test('key2', () => {
		class Incomparable { }
		const a = new Incomparable()
		const b = new Incomparable()
		const slt = new SortedArray(undefined, { comparator: () => 0 })
		slt.add(a)
		slt.add(b)
		expect(slt.toJSON()).toStrictEqual([a, b])
	})

	test('add', () => {
		const random = seedrandom('')
		let slt = new SortedArray(undefined, { comparator: moduloComparator })
		for (const val of range(1000)) slt.add(val)
		checkSortedArray(slt)

		slt = new SortedArray(undefined, { comparator: moduloComparator })
		for (const val of range(1000, 0, -1)) slt.add(val)
		checkSortedArray(slt)

		slt = new SortedArray(undefined, { comparator: moduloComparator })
		for (const val of range(1000)) slt.add(random())
		checkSortedArray(slt)
	})

	test('update', () => {
		const slt = new SortedArray(undefined, { comparator: moduloComparator })

		slt.update(range(1000))
		expect(slt.toJSON()).toStrictEqual(Array.from(range(1000)).sort(moduloComparator))
		expect(slt.length).toBe(1000)
		checkSortedArray(slt)

		slt.update(range(10000))
		expect(slt.length).toBe(11000)
		checkSortedArray(slt)
	})

	test('update order consistency', () => {
		const setup = [10, 20, 30]
		const slt1 = new SortedArray(setup, { comparator: moduloComparator })
		const slt2 = new SortedArray(setup, { comparator: moduloComparator })
		const addition = [40, 50, 60]
		addition.forEach(value => slt1.add(value))
		slt2.update(addition)
		expect(slt1.toJSON()).toStrictEqual(slt2.toJSON())
	})

	test('includes', () => {
		const slt = new SortedArray(undefined, { comparator: moduloComparator, loadFactor: 7 })

		expect(slt.includes(0)).toBe(false)

		slt.update(range(100))

		for (const val of range(100)) expect(slt.includes(val)).toBe(true)
		expect(slt.includes(100)).toBe(true) // 100 ≡ 0 (mod 10)

		checkSortedArray(slt)

		const slt2 = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 4 })
		for (const val of range(100, 200)) expect(slt2.includes(val)).toBe(true)
	})

	test('delete', () => {
		let slt = new SortedArray(undefined, { comparator: moduloComparator })

		expect(slt.delete(0)).toBe(false)
		expect(slt.length).toBe(0)
		checkSortedArray(slt)

		slt = new SortedArray([1, 2, 2, 2, 3, 3, 5], { comparator: moduloComparator, loadFactor: 4 })

		expect(slt.delete(6)).toBe(false)
		checkSortedArray(slt)
		expect(slt.delete(4)).toBe(false)
		checkSortedArray(slt)
		expect(slt.delete(2)).toBe(true)
		checkSortedArray(slt)
		expect(slt.delete(11)).toBe(true) // 11 ≡ 1 (mod 10)
		expect(slt.delete(12)).toBe(true)
		expect(slt.delete(13)).toBe(true)
		expect(slt.delete(15)).toBe(true)

		expect(slt.toJSON()).toStrictEqual([2, 3])
	})

	test('delete', () => {
		let slt = new SortedArray(undefined, { comparator: moduloComparator })
		expect(slt.delete(0)).toBe(false)
		expect(slt.length).toBe(0)
		checkSortedArray(slt)

		slt = new SortedArray([1, 2, 2, 2, 3, 3, 5], { comparator: moduloComparator, loadFactor: 4 })

		expect(slt.delete(2)).toBe(true)
		checkSortedArray(slt)
		expect(slt.toJSON()).toStrictEqual([1, 2, 2, 3, 3, 5])
	})

	test('delete throws', () => {
		let slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 10 })
		expect(slt.delete(100)).toBe(true) // 100 ≡ 0 (mod 10)
		expect(Array.from(slt)).toStrictEqual(Array.from(range(1, 100)).sort(moduloComparator))

		slt = new SortedArray([1, 2, 2, 2, 3, 3, 5], { comparator: moduloComparator })
		expect(slt.delete(4)).toBe(false)
		expect(Array.from(slt)).toStrictEqual([1, 2, 2, 2, 3, 3, 5])

		slt = new SortedArray([1, 1, 1, 2, 2, 2], { comparator: moduloComparator })
		expect(slt.delete(13)).toBe(false)
		expect(slt.delete(10)).toBe(false)
		expect(Array.from(slt)).toStrictEqual([1, 1, 1, 2, 2, 2])
	})

	test('deleteSlice', () => {
		const slt = new SortedArray(range(20), { comparator: moduloComparator, loadFactor: 4 })
		checkSortedArray(slt)
		for (const val of range(20)) {
			slt.deleteAt(0)
			checkSortedArray(slt)
		}
		expect(slt.length).toBe(0)
		expect(slt.toJSON()).toStrictEqual([])
	})

	test('at', () => {
		const random = seedrandom('')
		const slt = new SortedArray(undefined, { comparator: moduloComparator, loadFactor: 17 })

		slt.add(5)
		checkSortedArray(slt)
		expect(slt.at(0)).toBe(5)
		slt.clear()

		const lst = Array.from({ length: 100 }, () => random())
		slt.update(lst)
		const sortedLst = [...lst].sort(moduloComparator)

		for (const idx of range(100)) {
			expect(slt.at(idx)).toBe(sortedLst[idx])
			expect(slt.at(idx - 99)).toBe(sortedLst.at(idx - 99))
		}
	})

	test('slice', () => {
		const random = seedrandom('')
		const slt = new SortedArray(undefined, { comparator: moduloComparator, loadFactor: 17 })

		const lst: number[] = []
		for (const _ of range(100)) {
			const val = random()
			slt.add(val)
			lst.push(val)
		}

		const sortedLst = [...lst].sort(moduloComparator)

		expect(slt.slice(-75)).toStrictEqual(sortedLst.slice(-75))
		expect(slt.slice(-25)).toStrictEqual(sortedLst.slice(-25))
		expect(slt.slice(0)).toStrictEqual(sortedLst.slice(0))
		expect(slt.slice(25)).toStrictEqual(sortedLst.slice(25))
		expect(slt.slice(75)).toStrictEqual(sortedLst.slice(75))

		expect(slt.slice(undefined, -75)).toStrictEqual(sortedLst.slice(undefined, -75))
		expect(slt.slice(undefined, -25)).toStrictEqual(sortedLst.slice(undefined, -25))
		expect(slt.slice(undefined, 0)).toStrictEqual(sortedLst.slice(undefined, 0))
		expect(slt.slice(undefined, 25)).toStrictEqual(sortedLst.slice(undefined, 25))
		expect(slt.slice(undefined, 75)).toStrictEqual(sortedLst.slice(undefined, 75))

		expect(slt.slice(undefined, undefined)).toStrictEqual(sortedLst.slice(undefined, undefined))

		const starts = [-75, -25, 0, 25, 75]
		const stops = [-75, -25, 0, 25, 75]
		starts.forEach(start => {
			stops.forEach(stop => {
				expect(slt.slice(start, stop)).toStrictEqual(sortedLst.slice(start, stop))
			})
		})

		stops.forEach(stop => {
			expect(slt.slice(undefined, stop)).toStrictEqual(sortedLst.slice(undefined, stop))
		})

		starts.forEach(start => {
			expect(slt.slice(start, undefined)).toStrictEqual(sortedLst.slice(start, undefined))
		})

		starts.forEach(start => {
			stops.forEach(stop => {
				expect(slt.slice(start, stop)).toStrictEqual(sortedLst.slice(start, stop))
			})
		})
	})

	test('slice big', () => {
		const slt = new SortedArray(range(4), { comparator: moduloComparator })
		const lst = [...range(4)].sort(moduloComparator)

		const starts = [-6, -4, -2, 0, 2, 4, 6]
		const stops = [-6, -4, -2, 0, 2, 4, 6]

		starts.forEach(start => {
			stops.forEach(stop => {
				expect(slt.slice(start, stop)).toStrictEqual(lst.slice(start, stop))
			})
		})
	})

	test('at throws', () => {
		const slt = new SortedArray(undefined, { comparator: moduloComparator })
		expect(slt.at(5)).toBeUndefined()

		const slt2 = new SortedArray(range(100), { comparator: moduloComparator })
		expect(slt2.at(200)).toBeUndefined()
		expect(slt2.at(-101)).toBeUndefined()
	})

	test('deleteAt', () => {
		const random = seedrandom('')

		let slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 17 })

		for (let i = 0; i < 100; i++) {
			slt.deleteAt(100 + i)
			expect(slt.length).toBe(100)
			checkSortedArray(slt)

			slt.deleteAt(-101 - i)
			expect(slt.length).toBe(100)
			checkSortedArray(slt)
		}

		while (slt.length > 0) {
			slt.deleteAt(Math.floor(random() * slt.length))
			checkSortedArray(slt)
		}

		slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 17 })
		slt.deleteSlice()
		expect(slt.length).toBe(0)
		checkSortedArray(slt)

		for (const i of range(-100, 100)) {
			slt.deleteAt(i)
			expect(slt.length).toBe(0)
			checkSortedArray(slt)
		}
	})

	test('deleteSlice', () => {
		const slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 17 })
		slt.deleteSlice(10, 40)
	})

	test('forEach', () => {
		let slt = new SortedArray(range(10000), { comparator: moduloComparator })
		const arr: number[] = []
		slt.forEach((x, i, a) => {
			expect(typeof x).toBe('number')
			expect(i).toBe(arr.length)
			expect(a).toBe(slt)
			arr.push(x)
		})
		expect(arr).toStrictEqual(Array.from(slt))
	})

	test('iterator', () => {
		const slt = new SortedArray(range(10000), { comparator: moduloComparator })
		const itr = slt[Symbol.iterator]()
		expect([...itr]).toStrictEqual(Array.from(range(10000)).sort(moduloComparator))
	})

	test('reverse iterator', () => {
		const slt = new SortedArray(range(10000), { comparator: moduloComparator })
		const rev = [...slt].reverse()
		expect([...slt].reverse()).toStrictEqual(rev)
	})

	test('islice', () => {
		const sl = new SortedArray(undefined, { comparator: moduloComparator, loadFactor: 7 })
		expect([...sl.islice()]).toStrictEqual([])

		const values = Array.from(range(53)).sort(moduloComparator)
		sl.update(values)

		for (const start of range(-55, 55)) {
			for (const stop of range(-55, 55)) {
				expect([...sl.islice(start, stop)]).toStrictEqual(values.slice(start, stop))
				expect([...sl.islice(start, stop, true)]).toStrictEqual(values.slice(start, stop).reverse())
			}
		}

		for (const start of range(-55, 55)) {
			expect([...sl.islice(start)]).toStrictEqual(values.slice(start))
			expect([...sl.islice(start, undefined, true)]).toStrictEqual(values.slice(start).reverse())
		}

		for (const stop of range(-55, 55)) {
			expect([...sl.islice(undefined, stop)]).toStrictEqual(values.slice(undefined, stop))
			expect([...sl.islice(undefined, stop, true)]).toStrictEqual(values.slice(undefined, stop).reverse())
		}
	})

	test('irange', () => {
		const values = Array.from(range(100)).sort(moduloComparator)

		for (const load of range(5, 16)) {
			const slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: load })

			for (const start of range(10)) {
				for (const end of range(start, 10)) {
					expect(Array.from(slt.irange(start, end)))
						.toStrictEqual(values.slice(start * 10, (end + 1) * 10))
					expect(Array.from(slt.irange(start, end, undefined, undefined, true)))
						.toStrictEqual(values.slice(start * 10, (end + 1) * 10).reverse())
					expect(Array.from(slt.irange(start, end, true, false)))
						.toStrictEqual(values.slice(start * 10, end * 10))
					expect(Array.from(slt.irange(start, end, false, true)))
						.toStrictEqual(values.slice((start + 1) * 10, (end + 1) * 10))
					expect(Array.from(slt.irange(start, end, false, false)))
						.toStrictEqual(values.slice((start + 1) * 10, end * 10))
				}
			}

			for (const start of range(10)) {
				expect(Array.from(slt.irange(start))).toStrictEqual(values.slice(start * 10))
			}

			for (const end of range(10)) {
				expect(Array.from(slt.irange(undefined, end))).toStrictEqual(values.slice(0, (end + 1) * 10))
			}
		}
	})

	test('length', () => {
		const slt = new SortedArray(undefined, { comparator: moduloComparator })

		for (const val of range(10000)) {
			slt.add(val)
			expect(slt.length).toBe(val + 1)
		}
	})

	test('bisectLeft', () => {
		let slt = new SortedArray(undefined, { comparator: moduloComparator })
		expect(slt.bisectLeft(0)).toBe(0)

		slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 17 })
		slt.update(range(100))
		checkSortedArray(slt)
		expect(slt.bisectLeft(50)).toBe(0)
		expect(slt.bisectLeft(0)).toBe(0)
	})

	test('bisectRight', () => {
		let slt = new SortedArray(undefined, { comparator: moduloComparator })
		expect(slt.bisectRight(10)).toBe(0)

		slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 17 })
		slt.update(range(100))
		checkSortedArray(slt)
		expect(slt.bisectRight(10)).toBe(20)
		expect(slt.bisectRight(0)).toBe(20)
	})

	test('copy', () => {
		const slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 7 })
		const two = slt.clone()
		expect(two instanceof SortedArray).toBe(true)
		checkSortedArray(two)
		expect(Array.from(two)).toStrictEqual(Array.from(slt))
		slt.add(100)
		expect(slt.length).toBe(101)
		expect(two.length).toBe(100)
		two.add(100)
		expect(Array.from(two)).toStrictEqual(Array.from(slt))
	})

	test('count', () => {
		let slt = new SortedArray(undefined, { comparator: moduloComparator, loadFactor: 7 })
		expect(slt.count(0)).toBe(0)

		for (const iii of range(100)) {
			for (const _ of range(iii)) {
				slt.add(iii)
			}
		}
		checkSortedArray(slt)

		for (const iii of range(100)) {
			expect(slt.count(iii)).toBe(iii % 10 * 10 + 450)
		}

		slt = new SortedArray(range(8), { comparator: moduloComparator })
		expect(slt.count(9)).toBe(0)
	})

	test('pop', () => {
		const slt = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		checkSortedArray(slt)
		expect(slt.pop()).toBe(9)
		checkSortedArray(slt)
		expect(slt.pop(0)).toBe(0)
		checkSortedArray(slt)
		expect(slt.pop(-2)).toBe(7)
		checkSortedArray(slt)
		expect(slt.pop(4)).toBe(5)
		checkSortedArray(slt)
		expect(slt.pop(1)).toBe(2)
		checkSortedArray(slt)
	})

	test('pop throws', () => {
		const slt = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		expect(slt.pop(-11)).toBeUndefined()
		expect(slt.pop(10)).toBeUndefined()
	})

	test('indexOf', () => {
		const slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 7 })

		const sortedValues = Array.from(range(100)).sort(moduloComparator)
		for (const val of range(100)) {
			expect(slt.indexOf(val)).toBe(sortedValues.indexOf(val % 10))
		}

		expect(slt.indexOf(9, 0, 1000)).toBe(sortedValues.indexOf(9))

		const slt2 = new SortedArray(Array(100).fill(0), { comparator: moduloComparator, loadFactor: 7 })
		for (const start of range(100)) {
			for (const stop of range(start, 100)) {
				expect(slt2.indexOf(0, start, stop + 1)).toBe(start)
			}
		}

		for (const start of range(100)) {
			expect(slt2.indexOf(0, -(100 - start))).toBe(start)
		}

		expect(slt2.indexOf(0, -1000)).toBe(0)
	})

	test('indexOf throws', () => {
		let slt = new SortedArray(Array(10).fill(0), { comparator: moduloComparator, loadFactor: 4 })
		expect(slt.indexOf(0, 10)).toBe(-1)
		expect(slt.indexOf(0, 0, -10)).toBe(-1)
		expect(slt.indexOf(0, 7, 3)).toBe(-1)
		expect(slt.indexOf(1)).toBe(-1)

		slt = new SortedArray(undefined, { comparator: moduloComparator })
		expect(slt.indexOf(1)).toBe(-1)

		slt = new SortedArray(range(100), { comparator: moduloComparator, loadFactor: 4 })
		const sortedValues = Array.from(range(100)).sort(moduloComparator)
		expect(slt.indexOf(91, 0, 15)).toBe(sortedValues.indexOf(1))

		slt = new SortedArray([...Array(10).fill(0), ...Array(10).fill(1), ...Array(10).fill(2)], { comparator: moduloComparator, loadFactor: 4 })
		expect(slt.indexOf(1, 0, 10)).toBe(-1)

		slt = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		expect(slt.indexOf(4, 5)).toBe(-1)
		expect(slt.indexOf(19)).toBe(9)

		slt = new SortedArray(undefined, { comparator: moduloComparator, loadFactor: 4 })
		expect(slt.indexOf(5)).toBe(-1)
	})

	test('mul', () => {
		const thisList = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		const thatList = thisList.concat(thisList).concat(thisList).concat(thisList).concat(thisList)
		checkSortedArray(thisList)
		checkSortedArray(thatList)
		expect(Array.from(thisList)).toStrictEqual(Array.from(range(10)))
		expect(Array.from(thatList)).toStrictEqual(Array.from(range(10)).flatMap(x => Array(5).fill(x)))
		expect(thisList).not.toStrictEqual(thatList)
		expect(Array.from(thisList)).not.toStrictEqual(Array.from(thatList))
	})

	test('imul', () => {
		const thisList = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		thisList.update(thisList)
		checkSortedArray(thisList)
		thisList.update(thisList)
		checkSortedArray(thisList)
		expect(Array.from(thisList)).toStrictEqual(Array.from(range(10)).flatMap(x => Array(4).fill(x)))
	})

	test('concat', () => {
		const thisArr = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		const thatArr = thisArr.concat(thisArr).concat(thisArr)
		thisArr.add(100)
		expect(thisArr.length).toBe(11)
		expect(thatArr.length).toBe(30)
		expect(thisArr.toJSON()).toStrictEqual([...range(10), 100].sort(moduloComparator))
		expect(thatArr.toJSON()).toStrictEqual([...range(10), ...range(10), ...range(10)].sort(moduloComparator))
		expect(thisArr.toJSON()).not.toStrictEqual(thatArr.toJSON())
	})

	test('toString', () => {
		const thisArr = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		expect(thisArr.toString()).toBe('0,1,2,3,4,5,6,7,8,9')
	})

	test('toString recursion', () => {
		const thisArr = new SortedArray<unknown[]>([[1], [2], [3], [4]], { comparator: (a, b) => a.length - b.length })
		thisArr.add([thisArr])
		expect(thisArr.toString()).toBe('1,2,3,4,')
	})

	test('check throws', () => {
		const slt = new SortedArray(range(10), { comparator: moduloComparator, loadFactor: 4 })
		slt._len = 5
		expect(() => checkSortedArray(slt)).toThrow()
	})
})

describe('SortedArray negate', () => {
	function negateComparator(a: number, b: number): number {
		return b - a
	}

	test('init', () => {
		let slt = new SortedArray(undefined, { comparator: negateComparator })
		checkSortedArray(slt)

		slt = new SortedArray(undefined, { comparator: negateComparator, loadFactor: 10000 })
		checkSortedArray(slt)

		slt = new SortedArray(range(10000), { comparator: negateComparator })
		expect(Array.from(slt)).toStrictEqual(Array.from(range(10000)).reverse())

		slt.clear()
		expect(slt.length).toBe(0)
		checkSortedArray(slt)
	})

	test('comparator', () => {
		const slt = new SortedArray(range(10000), {
			comparator: (a, b) => a % 10 - b % 10,
		})
		checkSortedArray(slt)

		const values = Array.from(range(10000)).sort((a, b) => {
			return a % 10 === b % 10 ? a - b : a % 10 - b % 10
		})
		expect(Array.from(slt)).toStrictEqual(values)
		for (const val of range(10000)) {
			expect(slt.includes(val)).toBe(true)
		}
	})

	test('add', () => {
		const random = seedrandom('')
		const slt = new SortedArray(undefined, { comparator: negateComparator })
		for (const val of range(1000)) {
			slt.add(val)
			checkSortedArray(slt)
		}

		slt.clear()
		for (const val of range(1000, 0, -1)) {
			slt.add(val)
			checkSortedArray(slt)
		}

		slt.clear()
		for (const val of range(1000)) {
			slt.add(random())
			checkSortedArray(slt)
		}
	})

	test('update', () => {
		const slt = new SortedArray(undefined, { comparator: negateComparator })

		slt.update(range(1000))
		expect(slt.length).toBe(1000)
		checkSortedArray(slt)

		slt.update(range(100))
		expect(slt.length).toBe(1100)
		checkSortedArray(slt)

		slt.update(range(10000))
		expect(slt.length).toBe(11100)
		checkSortedArray(slt)

		const values = Array.from(range(100))
			.concat(Array.from(range(1000)))
			.concat(Array.from(range(10000)))
			.sort(negateComparator)
		expect(Array.from(slt)).toStrictEqual(values)
	})

	test('includes', () => {
		const slt = new SortedArray(undefined, { comparator: negateComparator })
		expect(slt.includes(0)).toBe(false)

		slt.update(range(10000))

		for (const val of range(10000)) {
			expect(slt.includes(val)).toBe(true)
		}

		expect(slt.includes(10000)).toBe(false)
		expect(slt.includes(-1)).toBe(false)

		checkSortedArray(slt)
	})

	test('delete', () => {
		let slt = new SortedArray(undefined, { comparator: negateComparator })

		expect(slt.delete(0)).toBe(false)
		expect(slt.length).toBe(0)
		checkSortedArray(slt)

		slt = new SortedArray([1, 2, 2, 2, 3, 3, 5], { comparator: negateComparator, loadFactor: 4 })
		expect(slt.delete(6)).toBe(false)
		checkSortedArray(slt)
		expect(slt.delete(4)).toBe(false)
		checkSortedArray(slt)
		expect(slt.delete(2)).toBe(true)
		checkSortedArray(slt)

		expect(Array.from(slt)).toStrictEqual([5, 3, 3, 2, 2, 1])
	})

	test('delete error', () => {
		let slt = new SortedArray(range(100), { comparator: negateComparator, loadFactor: 10 })

		expect(slt.delete(100)).toBe(false)
		checkSortedArray(slt)

		slt = new SortedArray(range(20), { comparator: negateComparator, loadFactor: 4 })
		checkSortedArray(slt)
		for (const val of range(20)) {
			expect(slt.delete(val)).toBe(true)
			checkSortedArray(slt)
		}
		expect(slt.length).toBe(0)
	})

	test('at', () => {
		const random = seedrandom('')
		const slt = new SortedArray(undefined, { comparator: negateComparator, loadFactor: 17 })

		slt.add(5)
		expect(slt.at(0)).toBe(5)
		slt.clear()

		const lst: number[] = []
		for (const _ of range(100)) {
			const val = random()
			slt.add(val)
			lst.push(val)
		}

		lst.sort(negateComparator)

		for (const idx of range(100)) {
			expect(slt.at(idx)).toBe(lst[idx])
			expect(slt.at(idx - 99)).toBe(lst.at(idx - 99))
		}
	})

	test('slice', () => {
		const random = seedrandom('')
		const slt = new SortedArray(undefined, { comparator: negateComparator, loadFactor: 17 })

		const lst: number[] = []
		for (const _ of range(100)) {
			const val = random()
			slt.add(val)
			lst.push(val)
		}

		lst.sort(negateComparator)

		for (const start of [-75, -25, 0, 25, 75]) {
			expect(slt.slice(start)).toStrictEqual(lst.slice(start))
		}

		for (const end of [-75, -25, 0, 25, 75]) {
			expect(slt.slice(0, end)).toStrictEqual(lst.slice(0, end))
		}

		for (const start of [-75, -25, 0, 25, 75]) {
			for (const stop of [-75, -25, 0, 25, 75]) {
				expect(slt.slice(start, stop)).toStrictEqual(lst.slice(start, stop))
			}
		}
	})

	test('slice big', () => {
		const slt = new SortedArray(range(4), { comparator: negateComparator })
		const lst = Array.from(range(4)).reverse()

		for (const start of [-6, -4, -2, 0, 2, 4, 6]) {
			for (const stop of [-6, -4, -2, 0, 2, 4, 6]) {
				expect(slt.slice(start, stop)).toStrictEqual(lst.slice(start, stop))
			}
		}
	})

	test('at errors', () => {
		let slt = new SortedArray(undefined, { comparator: negateComparator })
		expect(slt.at(5)).toBeUndefined()

		slt = new SortedArray(range(100), { comparator: negateComparator })
		expect(slt.at(200)).toBeUndefined()
		expect(slt.at(-101)).toBeUndefined()
	})

	test('deleteAt', () => {
		const random = seedrandom('')
		const slt = new SortedArray(range(100), { comparator: negateComparator, loadFactor: 17 })
		for (let i = 0; i < 100; i++) {
			slt.deleteAt(100 + i)
			slt.deleteAt(-101 - i)
			expect(slt.length).toBe(100)
			checkSortedArray(slt)
		}
		while (slt.length > 0) {
			slt.deleteAt(Math.floor(random() * slt.length))
			checkSortedArray(slt)
		}
	})

	test('deleteSlice', () => {
		const slt = new SortedArray(range(100), { comparator: negateComparator, loadFactor: 17 })
		slt.deleteSlice(10, 40)
		checkSortedArray(slt)
		expect(Array.from(slt)).toStrictEqual([...range(99, 89, -1), ...range(59, -1, -1)])
	})

	test('forEach', () => {
		let slt = new SortedArray(range(10000), { comparator: negateComparator })
		const arr: number[] = []
		slt.forEach((x, i, a) => {
			expect(typeof x).toBe('number')
			expect(i).toBe(arr.length)
			expect(a).toBe(slt)
			arr.push(x)
		})
		expect(arr).toStrictEqual(Array.from(slt))
	})

	test('iterator', () => {
		const slt = new SortedArray(range(10000), { comparator: negateComparator })
		const itr = slt[Symbol.iterator]()
		expect(Array.from(itr)).toStrictEqual(Array.from(range(10000)).reverse())
	})

	test('reversed', () => {
		const slt = new SortedArray(range(10000), { comparator: negateComparator })
		const rev = slt.reversed()
		expect(Array.from(rev)).toStrictEqual(Array.from(range(10000)))
	})

	test('islice', () => {
		const slt = new SortedArray(undefined, { comparator: negateComparator, loadFactor: 7 })

		expect(Array.from(slt.islice())).toStrictEqual([])

		const values = Array.from(range(53)).sort(negateComparator)
		slt.update(values)

		for (const start of range(-55, 55)) {
			for (const stop of range(-55, 55)) {
				expect([...slt.islice(start, stop)]).toStrictEqual(values.slice(start, stop))
				expect([...slt.islice(start, stop, true)]).toStrictEqual(values.slice(start, stop).reverse())
			}
		}

		for (const start of range(-55, 55)) {
			expect([...slt.islice(start)]).toStrictEqual(values.slice(start))
			expect([...slt.islice(start, undefined, true)]).toStrictEqual(values.slice(start).reverse())
		}

		for (const stop of range(-55, 55)) {
			expect([...slt.islice(undefined, stop)]).toStrictEqual(values.slice(0, stop))
			expect([...slt.islice(undefined, stop, true)]).toStrictEqual(values.slice(0, stop).reverse())
		}
	})

	test('irange', () => {
		const slt = new SortedArray(undefined, { comparator: negateComparator, loadFactor: 7 })
		expect(Array.from(slt.irange())).toStrictEqual([])

		const values = Array.from(range(53))
		slt.update(values)

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(Array.from(slt.irange(end, start)))
					.toStrictEqual(values.slice(start, end + 1).reverse())
				expect(Array.from(slt.irange(end, start, undefined, undefined, true)))
					.toStrictEqual(values.slice(start, end + 1))
			}
		}

		for (const start of range(53)) {
			expect(Array.from(slt.irange(start)))
				.toStrictEqual(values.slice(0, start + 1).reverse())
		}

		for (const end of range(53)) {
			expect(Array.from(slt.irange(undefined, end, true, false)))
				.toStrictEqual(values.slice(end + 1).reverse())
		}

		expect(Array.from(slt.irange(undefined, undefined, false, false)))
			.toStrictEqual(values.slice().reverse())

		expect(Array.from(slt.irange(-1))).toStrictEqual([])
		expect(Array.from(slt.irange(undefined, -1, true, false)))
			.toStrictEqual(values.slice().reverse())
	})

	test('length', () => {
		const slt = new SortedArray(undefined, { comparator: negateComparator })

		for (const val of range(10000)) {
			slt.add(val)
			expect(slt.length).toBe(val + 1)
		}
	})

	test('bisectLeft', () => {
		let slt = new SortedArray(undefined, { comparator: negateComparator })
		expect(slt.bisectLeft(0)).toBe(0)

		slt = new SortedArray(range(100), { comparator: negateComparator, loadFactor: 17 })
		slt.update(range(100))
		checkSortedArray(slt)
		expect(slt.bisectLeft(50)).toBe(98)
		expect(slt.bisectLeft(0)).toBe(198)
		expect(slt.bisectLeft(-1)).toBe(200)
	})

	test('bisectRight', () => {
		let slt = new SortedArray(undefined, { comparator: negateComparator })
		expect(slt.bisectRight(10)).toBe(0)

		slt = new SortedArray(range(100), { comparator: negateComparator, loadFactor: 17 })
		slt.update(range(100))
		checkSortedArray(slt)
		expect(slt.bisectRight(10)).toBe(180)
		expect(slt.bisectRight(0)).toBe(200)
	})

	test('copy', () => {
		const slt = new SortedArray(range(100), { comparator: negateComparator, loadFactor: 7 })
		const two = slt.clone()
		expect(two instanceof SortedArray).toBe(true)
		checkSortedArray(two)
		expect(Array.from(two)).toStrictEqual(Array.from(slt))
		slt.add(100)
		expect(slt.length).toBe(101)
		expect(two.length).toBe(100)
		two.add(100)
		expect(Array.from(two)).toStrictEqual(Array.from(slt))
	})

	test('count', () => {
		const slt = new SortedArray(undefined, { comparator: negateComparator, loadFactor: 7 })

		expect(slt.count(0)).toBe(0)

		for (const iii of range(100)) {
			for (const jjj of range(iii)) {
				slt.add(iii)
			}
			checkSortedArray(slt)
		}

		for (const iii of range(100)) {
			expect(slt.count(iii)).toBe(iii)
		}
	})

	test('pop', () => {
		const slt = new SortedArray(range(10), { comparator: negateComparator, loadFactor: 4 })
		checkSortedArray(slt)
		expect(slt.pop()).toBe(0)
		checkSortedArray(slt)
		expect(slt.pop(0)).toBe(9)
		checkSortedArray(slt)
		expect(slt.pop(-2)).toBe(2)
		checkSortedArray(slt)
		expect(slt.pop(4)).toBe(4)
		checkSortedArray(slt)
		expect(slt.pop(1)).toBe(7)
		checkSortedArray(slt)
	})

	test('pop errors', () => {
		const slt = new SortedArray(range(10), { comparator: negateComparator, loadFactor: 4 })
		expect(slt.pop(-11)).toBeUndefined()
		expect(slt.pop(10)).toBeUndefined()
		slt.clear()
		expect(slt.pop()).toBeUndefined()
	})

	test('indexOf', () => {
		let slt = new SortedArray(range(100), { comparator: negateComparator, loadFactor: 17 })

		for (const [pos, val] of Array.from(range(99, -1, -1)).entries()) {
			expect(slt.indexOf(pos)).toBe(val)
		}

		expect(slt.indexOf(99, 0, 1000)).toBe(0)

		slt = new SortedArray(Array(100).fill(0), { comparator: negateComparator, loadFactor: 17 })
		for (const start of range(100)) {
			for (const stop of range(start, 100)) {
				expect(slt.indexOf(0, start, stop + 1)).toBe(start)
			}
		}

		for (const start of range(100)) {
			expect(slt.indexOf(0, -(100 - start))).toBe(start)
		}

		expect(slt.indexOf(0, -1000)).toBe(0)
	})

	test('indexOf errors', () => {
		const slt = new SortedArray(Array(10).fill(0), { comparator: negateComparator, loadFactor: 4 })
		expect(slt.indexOf(0, 10)).toBe(-1)
		expect(slt.indexOf(0, 0, -10)).toBe(-1)
		expect(slt.indexOf(0, 7, 3)).toBe(-1)
		expect(slt.indexOf(1)).toBe(-1)
		expect(slt.indexOf(6, 5)).toBe(-1)
		slt.clear()
		expect(slt.indexOf(1)).toBe(-1)
	})

	test('mul', () => {
		const thisArr = new SortedArray(range(10), { comparator: negateComparator, loadFactor: 4 })
		const thatArr = thisArr.concat(thisArr).concat(thisArr).concat(thisArr).concat(thisArr)
		checkSortedArray(thisArr)
		checkSortedArray(thatArr)
		expect(Array.from(thisArr)).toStrictEqual(Array.from(range(10)).reverse())
		expect(Array.from(thatArr)).toStrictEqual(Array.from({ length: 50 }, (_, i) => 9 - Math.floor(i / 5)))
		expect(thisArr).not.toStrictEqual(thatArr)
	})

	test('imul', () => {
		const thisList = new SortedArray(range(10), { comparator: negateComparator, loadFactor: 4 })
		thisList.update(thisList)
		checkSortedArray(thisList)
		thisList.update(thisList)
		checkSortedArray(thisList)
		expect(Array.from(thisList)).toStrictEqual(Array.from(range(10)).reverse().flatMap(x => Array(4).fill(x)))
	})

	test('toString', () => {
		const thisArr = new SortedArray(range(10), { comparator: negateComparator, loadFactor: 4 })
		expect(thisArr.toString()).toBe('9,8,7,6,5,4,3,2,1,0')
	})

	test('checkSortedArray', () => {
		const slt = new SortedArray(range(10), { comparator: negateComparator })
		slt._len = 5
		expect(() => checkSortedArray(slt)).toThrow()
	})
})

describe('JavaScript specialty', () => {
	test('NaN with default comparator', () => {
		const slt = new SortedArray(Array(100).fill(NaN), { loadFactor: 17 })
		expect(slt.length).toBe(100)
		expect(Array.from(slt)).toStrictEqual(Array(100).fill(NaN))
		expect(slt.at(50)).toBe(NaN)
		expect(slt.includes(NaN)).toBe(true)
		expect(slt.indexOf(NaN)).toBe(0)
		expect(slt.count(NaN)).toBe(100)
	})

	test('±0 with default comparator', () => {
		const arr = Array.from({ length: 100 }, (_, i) => (i % 2 - .5) * 0)
		const slt = new SortedArray(arr, { loadFactor: 17 })
		expect(slt.length).toBe(100)
		expect(Array.from(slt)).toStrictEqual(arr)
		expect(Array.from(slt)).not.toStrictEqual(Array(100).fill(0))
		expect(slt.at(0)).toBe(-0)
		expect(slt.at(0)).not.toBe(0)
		expect(slt.at(51)).toBe(0)
		expect(slt.at(51)).not.toBe(-0)
	})

	test('undefined and null', () => {
		const slt = new SortedArray(
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
		expect(slt.length).toBe(100)
		expect(Array.from(slt)).toStrictEqual(Array(66).fill(null).concat(Array(34).fill(undefined)))
		expect(slt.at(50)).toBeNull()
		expect(slt.at(51)).toBeNull()
		expect(slt.at(-3)).toBeUndefined()
		expect(slt.at(-103)).toBeUndefined()
		expect(slt.includes(undefined)).toBe(true)
		expect(slt.includes(null)).toBe(true)
		expect(slt.indexOf(undefined)).toBe(66)
		expect(slt.indexOf(null)).toBe(0)
		expect(slt.count(undefined)).toBe(34)
		expect(slt.count(null)).toBe(66)
	})

	test('keys', () => {
		const random = seedrandom('')
		const slt = new SortedArray(Array.from({ length: 100 }, () => random()))
		expect(Array.from(slt.keys())).toStrictEqual(Array.from({ length: 100 }, (_, i) => i))
		slt.clear()
		expect(Array.from(slt.keys())).toStrictEqual([])
	})

	test('entries', () => {
		const slt = new SortedArray(
			Array.from({ length: 100 }, (_, i) => i),
			{ comparator: (a, b) => b - a, loadFactor: 17 },
		)
		expect(Array.from(slt.entries())).toStrictEqual(Array.from({ length: 100 }, (_, i) => [i, 99 - i]))
	})

	test('find', () => {
		const slt = new SortedArray(Array.from({ length: 100 }, (_, i) => i * 2))
		for (let i = 0; i < 100; i++) {
			expect(slt.find(i * 2)).toBe(i * 2)
			expect(slt.find(i * 2 + 1)).toBeUndefined()
		}
	})

	test('find object', () => {
		const arr = Array.from({ length: 100 }, (_, i) => ({
			i,
			v: i * 2,
		}))
		const slt = new SortedArray(arr.slice().reverse(), {
			comparator: (a: { i: number }, b) => a.i - b.i,
			loadFactor: 17,
		})
		for (let i = 0; i < 100; i++) {
			expect(slt.find({ i })).toBe(arr[i])
		}
		for (let i = 100; i < 200; i++) {
			expect(slt.find({ i })).toBeUndefined()
		}
	})
})
