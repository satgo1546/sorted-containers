import { describe, test, beforeEach, expect } from 'vitest'
import { SortedList } from './sorted-array'

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
	let slt: SortedList<number>

	beforeEach(() => {
		slt = new SortedList
	})

	test('init', () => {
		slt = new SortedList(undefined, { loadFactor: 10000 })
		slt._check()

		slt = new SortedList(range(10000))
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

		slt = new SortedList()
		for (const val of range(1000, 0, -1)) {
			slt.add(val)
			slt._check()
		}

		slt = new SortedList()
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
		expect(slt.contains(0)).toBeFalsy()

		slt.update(range(10000))

		for (const val of range(10000)) {
			expect(slt.contains(val)).toBe(true)
		}

		expect(slt.contains(10000)).toBeFalsy()
		slt._check()
	})

	test('discard', () => {
		expect(slt.discard(0)).toBeUndefined()
		expect(slt.length).toBe(0)
		slt._check()

		slt = new SortedList([1, 2, 2, 2, 3, 3, 5], { loadFactor: 4 })

		slt.discard(6)
		slt._check()
		slt.discard(4)
		slt._check()
		slt.discard(2)
		slt._check()

		expect(Array.from(slt)).toStrictEqual([1, 2, 2, 3, 3, 5])
	})

	test('remove', () => {
		expect(slt.discard(0)).toBeUndefined()
		expect(slt.length).toBe(0)
		slt._check()

		slt = new SortedList([1, 2, 2, 2, 3, 3, 5], { loadFactor: 4 })

		slt.remove(2)
		slt._check()

		expect(Array.from(slt)).toStrictEqual([1, 2, 2, 3, 3, 5])
	})

	test('remove_valueerror1', () => {
		expect(() => slt.remove(0)).toThrow(Error)
	})

	test('remove_valueerror2', () => {
		slt = new SortedList(range(100), { loadFactor: 10 })
		expect(() => slt.remove(100)).toThrow(Error)
	})

	test('remove_valueerror3', () => {
		slt = new SortedList([1, 2, 2, 2, 3, 3, 5])
		expect(() => slt.remove(4)).toThrow(Error)
	})

	test('delete', () => {
		slt = new SortedList(range(20), { loadFactor: 4 })
		slt._check()
		for (const val of range(20)) {
			slt.remove(val)
			slt._check()
		}
		expect(slt.length).toBe(0)
	})

	test('getitem', () => {
		slt = new SortedList(undefined, { loadFactor: 17 })

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
		slt = new SortedList(undefined, { loadFactor: 17 })

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
		slt = new SortedList(range(4))
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
	// 	expect(() => slt.slice(0, undefined, 0)).toThrow(Error)
	// })

	test('getitem_indexerror1', () => {
		expect(() => slt.at(5)).toThrow(Error)
	})

	test('getitem_indexerror2', () => {
		slt = new SortedList(range(100))
		expect(() => slt.at(200)).toThrow(Error)
	})

	test('getitem_indexerror3', () => {
		slt = new SortedList(range(100))
		expect(() => slt.at(-101)).toThrow(Error)
	})

	test('delitem', () => {
		slt = new SortedList(range(100), { loadFactor: 17 })
		while (slt.length > 0) {
			const pos = Math.floor(Math.random() * slt.length)
			slt.delete(pos)
			slt._check()
		}

		slt = new SortedList(range(100), { loadFactor: 17 })
		slt.deleteRange(0, slt.length)
		expect(slt.length).toBe(0)
		slt._check()
	})

	test('delitem_slice', () => {
		slt = new SortedList(range(100), { loadFactor: 17 })
		slt.deleteRange(10, 40)
		// slt.deleteRange(10, 40, -1)
		// slt.deleteRange(10, 40, 2)
		// slt.deleteRange(10, 40, -2)
	})

	test('iter', () => {
		slt = new SortedList(range(10000))
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
	// 	expect(() => slt.reverse()).toThrow(Error)
	// })

	test('islice', () => {
		slt = new SortedList(undefined, { loadFactor: 7 })

		expect(slt.slice()).toStrictEqual([])

		const values = Array.from(range(53))
		slt.update(values)

		for (const start of range(53)) {
			for (const stop of range(53)) {
				expect(slt.slice(start, stop)).toStrictEqual(values.slice(start, stop))
				expect(slt.slice(start, stop, true)).toStrictEqual(values.slice(start, stop).reverse())
			}
		}

		for (const start of range(53)) {
			expect(slt.slice(start)).toStrictEqual(values.slice(start))
			expect(slt.slice(start, undefined, true)).toStrictEqual(values.slice(start).reverse())
		}

		for (const stop of range(53)) {
			expect(slt.slice(0, stop)).toStrictEqual(values.slice(0, stop))
			expect(slt.slice(0, stop, true)).toStrictEqual(values.slice(0, stop).reverse())
		}
	})

	test('irange', () => {
		slt = new SortedList(undefined, { loadFactor: 7 })

		expect(slt.irange()).toStrictEqual([])

		const values = Array.from(range(53))
		slt.update(values)

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(slt.irange(start, end)).toStrictEqual(values.slice(start, end + 1))
				expect(slt.irange(start, end, undefined, true)).toStrictEqual(values.slice(start, end + 1).reverse())
			}
		}

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(slt.irange(start, end, [true, false])).toStrictEqual(Array.from(range(start, end)))
			}
		}

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(slt.irange(start, end, [false, true])).toStrictEqual(Array.from(range(start + 1, end + 1)))
			}
		}

		for (const start of range(53)) {
			for (const end of range(start, 53)) {
				expect(slt.irange(start, end, [false, false])).toStrictEqual(Array.from(range(start + 1, end)))
			}
		}

		for (const start of range(53)) {
			expect(slt.irange(start)).toStrictEqual(Array.from(range(start, 53)))
		}

		for (const end of range(53)) {
			expect(slt.irange(undefined, end, [true, false])).toStrictEqual(Array.from(range(0, end)))
		}

		expect(slt.irange(undefined, undefined, [false, false])).toStrictEqual(values)
		expect(slt.irange(53)).toStrictEqual([])
		expect(slt.irange(undefined, 53, [true, false])).toStrictEqual(values)
	})

	test('len', () => {
		for (const val of range(10000)) {
			slt.add(val)
			expect(slt.length).toBe(val + 1)
		}
	})

	test('bisect_left', () => {
		expect(slt.bisectLeft(0)).toBe(0)
		slt = new SortedList(range(100), { loadFactor: 17 })
		slt.update(range(100))
		slt._check()
		expect(slt.bisectLeft(50)).toBe(100)
		expect(slt.bisectLeft(200)).toBe(200)
	})

	test('bisect_right', () => {
		expect(slt.bisectRight(10)).toBe(0)
		slt = new SortedList(range(100), { loadFactor: 17 })
		slt.update(range(100))
		slt._check()
		expect(slt.bisectRight(10)).toBe(22)
		expect(slt.bisectRight(200)).toBe(200)
	})

	test('copy', () => {
		const alpha = new SortedList(range(100), { loadFactor: 7 })
		const beta = new SortedList(alpha)
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
		slt = new SortedList(undefined, { loadFactor: 7 })

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
		slt = new SortedList(range(10), { loadFactor: 4 })
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
		slt = new SortedList(range(10), { loadFactor: 4 })
		expect(() => slt.pop(-11)).toThrow(Error)
	})

	test('pop_indexerror2', () => {
		slt = new SortedList(range(10), { loadFactor: 4 })
		expect(() => slt.pop(10)).toThrow(Error)
	})

	test('pop_indexerror3', () => {
		expect(() => slt.pop()).toThrow(Error)
	})

	test('index', () => {
		slt = new SortedList(range(100), { loadFactor: 17 })
		slt._check()

		for (const val of range(100)) {
			expect(slt.index(val)).toBe(val)
		}

		expect(slt.index(99, 0, 1000)).toBe(99)

		slt = new SortedList(Array(100).fill(0), { loadFactor: 17 })

		for (const start of range(100)) {
			for (const stop of range(start, 100)) {
				expect(slt.index(0, start, stop + 1)).toBe(start)
			}
		}

		for (const start of range(100)) {
			expect(slt.index(0, -(100 - start))).toBe(start)
		}

		expect(slt.index(0, -1000)).toBe(0)
	})

	test('index_valueerror1', () => {
		slt = new SortedList(Array(10).fill(0), { loadFactor: 4 })
		expect(() => slt.index(0, 10)).toThrow(Error)
	})

	test('index_valueerror2', () => {
		slt = new SortedList(Array(10).fill(0), { loadFactor: 4 })
		expect(() => slt.index(0, 0, -10)).toThrow(Error)
	})

	test('index_valueerror3', () => {
		slt = new SortedList(Array(10).fill(0), { loadFactor: 4 })
		expect(() => slt.index(0, 7, 3)).toThrow(Error)
	})

	test('index_valueerror4', () => {
		slt = new SortedList(Array(10).fill(0), { loadFactor: 4 })
		expect(() => slt.index(1)).toThrow(Error)
	})

	test('index_valueerror5', () => {
		expect(() => slt.index(1)).toThrow(Error)
	})

	test('index_valueerror6', () => {
		slt = new SortedList(range(10), { loadFactor: 4 })
		expect(() => slt.index(3, 5)).toThrow(Error)
	})

	test('index_valueerror7', () => {
		slt = new SortedList([...Array(10).fill(0), ...Array(10).fill(2)], { loadFactor: 4 })
		expect(() => slt.index(1, 0, 10)).toThrow(Error)
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
		slt = new SortedList(range(10), { loadFactor: 4 })
		Object.assign(slt, { _len: 5 })
		expect(() => slt._check()).toThrow()
	})
})
