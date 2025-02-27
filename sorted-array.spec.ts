import { describe, test, beforeEach, expect } from 'vitest'
import { SortedArray } from './sorted-array'

function* range(start: number, end?: number, step: number = 1): Generator<number> {
	if (end === undefined) {
		end = start
		start = 0
	}
	for (let i = start; i < end; i += step) {
		yield i
	}
}

function* chain<T>(...iterables: Iterable<T>[]): Generator<T> {
	for (const a of iterables) yield* a
}

describe('SortedArray', () => {
	let slt: SortedArray<number>

	beforeEach(() => {
		slt = new SortedArray
	})

	test('init', () => {
		slt = new SortedArray(undefined, { loadFactor: 10000 })
		slt._check()

		slt = new SortedArray(range(10000))
		expect(Array.from(slt)).toStrictEqual(Array.from(range(10000)))

		slt.clear()
		expect(slt.length).toBe(0)
		slt._check()
	})

	test('add', () => {
		for (const val of range(1000)) {
			slt.add(val)
			slt._check()
		}

		slt = new SortedArray()
		for (const val of range(1000, 0, -1)) {
			slt.add(val)
			slt._check()
		}

		slt = new SortedArray()
		for (const val of range(1000)) {
			slt.add(Math.random())
			slt._check()
		}
	})

	test('update', () => {
		slt.update(range(1000))
		expect(slt.length).toBe(1000)
		slt._check()

		slt.update(range(100))
		expect(slt.length).toBe(1100)
		slt._check()

		slt.update(range(10000))
		expect(slt.length).toBe(11100)
		slt._check()

		const values = [...range(1000), ...range(100), ...range(10000)].sort((a, b) => a - b)
		expect(Array.from(slt)).toStrictEqual(values)
	})

	test('contains', () => {
		expect(slt.includes(0)).toBeFalsy()

		slt.update(range(10000))

		for (const val of range(10000)) {
			expect(slt.includes(val)).toBe(true)
		}

		expect(slt.includes(10000)).toBeFalsy()
		slt._check()
	})

	test('discard', () => {
		expect(slt.delete(0)).toBe(false)
		expect(slt.length).toBe(0)
		slt._check()

		slt = new SortedArray([1, 2, 2, 2, 3, 3, 5], { loadFactor: 4 })

		expect(slt.delete(6)).toBe(false)
		slt._check()
		expect(slt.delete(4)).toBe(false)
		slt._check()
		expect(slt.delete(2)).toBe(true)
		slt._check()

		expect(Array.from(slt)).toStrictEqual([1, 2, 2, 3, 3, 5])
	})

	test('remove_valueerror1', () => {
		expect(slt.delete(0)).toBe(false)
	})

	test('remove_valueerror2', () => {
		slt = new SortedArray(range(100), { loadFactor: 10 })
		expect(slt.delete(100)).toBe(false)
	})

	test('remove_valueerror3', () => {
		slt = new SortedArray([1, 2, 2, 2, 3, 3, 5])
		expect(slt.delete(4)).toBe(false)
	})

	test('delete', () => {
		slt = new SortedArray(range(20), { loadFactor: 4 })
		slt._check()
		for (const val of range(20)) {
			slt.delete(val)
			slt._check()
		}
		expect(slt.length).toBe(0)
	})

	test('getitem', () => {
		slt = new SortedArray(undefined, { loadFactor: 17 })

		const lst: number[] = []

		for (const rpt of range(100)) {
			const val = Math.random()
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
		slt = new SortedArray(undefined, { loadFactor: 17 })

		const lst: number[] = []

		for (const rpt of range(100)) {
			const val = Math.random()
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
		// expect([-5, -1, 1, 5].every(step => slt.slice(0, undefined, step) === lst.slice(0, undefined, step))).toBe(true)

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
		slt = new SortedArray(range(4))
		const lst = Array.from(range(4))

		for (const start of [-6, -4, -2, 0, 2, 4, 6]) {
			for (const stop of [-6, -4, -2, 0, 2, 4, 6]) {
				console.log(start,stop)
				expect(slt.slice(start, stop)).toStrictEqual(lst.slice(start, stop))
			}
		}
	})

	// test('getitem_slicezero', () => {
	// 	slt = new SortedList(range(100), { loadFactor: 17 })
	// 	expect(() => slt.slice(0, undefined, 0)).toThrow()
	// })

	test('getitem_indexerror1', () => {
		expect(slt.at(5)).toBeUndefined()
	})

	test('getitem_indexerror2', () => {
		slt = new SortedArray(range(100))
		expect(slt.at(200)).toBeUndefined()
	})

	test('getitem_indexerror3', () => {
		slt = new SortedArray(range(100))
		expect(slt.at(-101)).toBeUndefined()
	})

	test('delitem', () => {
		slt = new SortedArray(range(100), { loadFactor: 17 })
		while (slt.length > 0) {
			const pos = Math.floor(Math.random() * slt.length)
			slt.deleteAt(pos)
			slt._check()
		}

		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.deleteSlice(0, slt.length)
		expect(slt.length).toBe(0)
		slt._check()
	})

	test('delitem_slice', () => {
		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.deleteSlice(10, 40)
		// slt.deleteRange(10, 40, -1)
		// slt.deleteRange(10, 40, 2)
		// slt.deleteRange(10, 40, -2)
	})

	test('iter', () => {
		slt = new SortedArray(range(10000))
		const itr = slt[Symbol.iterator]()
		expect(Array.from(itr)).toStrictEqual(Array.from(range(10000)))
	})

	// test('reversed', () => {
	// 	slt = new SortedList(range(10000))
	// 	const rev = Array.from(slt.reverse())
	// 	expect(zip(rev, range(9999, -1, -1)).every(([a, b]) => a === b)).toBe(true)
	// })

	// test('reverse', () => {
	// 	slt = new SortedList(range(10000))
	// 	expect(() => slt.reverse()).toThrow()
	// })

	test('islice', () => {
		slt = new SortedArray(undefined, { loadFactor: 7 })

		expect(slt.slice()).toStrictEqual([])

		const values = Array.from(range(53))
		slt.update(values)

		for (const start of range(53)) {
			for (const stop of range(53)) {
				expect(Array.from(slt.islice(start, stop))).toStrictEqual(values.slice(start, stop))
				expect(Array.from(slt.islice(start, stop, true))).toStrictEqual(values.slice(start, stop).reverse())
			}
		}

		for (const start of range(53)) {
			expect(Array.from(slt.islice(start))).toStrictEqual(values.slice(start))
			expect(Array.from(slt.islice(start, undefined, true))).toStrictEqual(values.slice(start).reverse())
		}

		for (const stop of range(53)) {
			expect(Array.from(slt.islice(0, stop))).toStrictEqual(values.slice(0, stop))
			expect(Array.from(slt.islice(0, stop, true))).toStrictEqual(values.slice(0, stop).reverse())
		}
	})

	test('irange', () => {
		slt = new SortedArray(undefined, { loadFactor: 7 })

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
		for (const val of range(10000)) {
			slt.add(val)
			expect(slt.length).toBe(val + 1)
		}
	})

	test('bisect_left', () => {
		expect(slt.bisectLeft(0)).toBe(0)
		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.update(range(100))
		slt._check()
		expect(slt.bisectLeft(50)).toBe(100)
		expect(slt.bisectLeft(200)).toBe(200)
	})

	test('bisect_right', () => {
		expect(slt.bisectRight(10)).toBe(0)
		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.update(range(100))
		slt._check()
		expect(slt.bisectRight(10)).toBe(22)
		expect(slt.bisectRight(200)).toBe(200)
	})

	test('copy', () => {
		const alpha = new SortedArray(range(100), { loadFactor: 7 })
		const beta = new SortedArray(alpha)
		alpha.add(100)
		expect(alpha.length).toBe(101)
		expect(beta.length).toBe(100)
	})

	// test('copy_copy', () => {
	// 	const alpha = new SortedList(range(100),{loadFactor:7})
	// 	const beta = Object.assign(Object.create(Object.getPrototypeOf(alpha)), alpha)
	// 	alpha.add(100)
	// 	expect(alpha.length).toBe(101)
	// 	expect(beta.length).toBe(100)
	// })

	test('count', () => {
		slt = new SortedArray(undefined, { loadFactor: 7 })

		expect(slt.count(0)).toBe(0)

		for (const iii of range(100)) {
			for (const jjj of range(iii)) {
				slt.add(iii)
			}
			slt._check()
		}

		for (const iii of range(100)) {
			expect(slt.count(iii)).toBe(iii)
		}

		expect(slt.count(100)).toBe(0)
	})

	test('pop', () => {
		slt = new SortedArray(range(10), { loadFactor: 4 })
		slt._check()
		expect(slt.pop()).toBe(9)
		slt._check()
		expect(slt.pop(0)).toBe(0)
		slt._check()
		expect(slt.pop(-2)).toBe(7)
		slt._check()
		console.log(slt)
		expect(slt.pop(4)).toBe(5)
		slt._check()
	})

	test('pop_indexerror1', () => {
		slt = new SortedArray(range(10), { loadFactor: 4 })
		expect(slt.pop(-11)).toBeUndefined()
	})

	test('pop_indexerror2', () => {
		slt = new SortedArray(range(10), { loadFactor: 4 })
		expect(slt.pop(10)).toBeUndefined()
	})

	test('pop_indexerror3', () => {
		expect(slt.pop()).toBeUndefined()
	})

	test('index', () => {
		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt._check()

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
		slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(0, 10)).toBe(-1)
	})

	test('index_valueerror2', () => {
		slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(0, 0, -10)).toBe(-1)
	})

	test('index_valueerror3', () => {
		slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(0, 7, 3)).toBe(-1)
	})

	test('index_valueerror4', () => {
		slt = new SortedArray(Array(10).fill(0), { loadFactor: 4 })
		expect(slt.indexOf(1)).toBe(-1)
	})

	test('index_valueerror5', () => {
		expect(slt.indexOf(1)).toBe(-1)
	})

	test('index_valueerror6', () => {
		slt = new SortedArray(range(10), { loadFactor: 4 })
		expect(slt.indexOf(3, 5)).toBe(-1)
	})

	test('index_valueerror7', () => {
		slt = new SortedArray([...Array(10).fill(0), ...Array(10).fill(2)], { loadFactor: 4 })
		expect(slt.indexOf(1, 0, 10)).toBe(-1)
	})

	// test('mul', () => {
	// 	const thisList = new SortedList(range(10),{loadFactor:4})
	// 	const thatList = thisList.multiply(5)
	// 	thisList._check()
	// 	thatList._check()
	// 	expect(thisList.toArray()).toStrictEqual(range(10))
	// 	expect(thatList.toArray()).toStrictEqual(range(10).flatMap(x => Array(5).fill(x)).sort((a, b) => a - b))
	// 	expect(thisList).not.toStrictEqual(thatList)
	// })

	// test('imul', () => {
	// 	const thisList = new SortedList(range(10))
	// 	thisList._reset(4)
	// 	thisList.multiplyInPlace(5)
	// 	thisList._check()
	// 	expect(thisList.toArray()).toStrictEqual(range(10).flatMap(x => Array(5).fill(x)).sort((a, b) => a - b))
	// })

	test('check', () => {
		slt = new SortedArray(range(10), { loadFactor: 4 })
		Object.assign(slt, { _len: 5 })
		expect(() => slt._check()).toThrow()
	})
})
