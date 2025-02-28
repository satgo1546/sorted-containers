import { describe, test, expect } from 'vitest'
import { SortedArray } from './sorted-array'
import seedrandom from 'seedrandom'

function* range(start: number, end?: number, step: number = 1): Generator<number> {
	if (end === undefined) {
		end = start
		start = 0
	}
	for (let i = start; i < end; i += step) {
		yield i
	}
}

describe('SortedArray', () => {
	test('init', () => {
		let slt = new SortedArray(undefined, { loadFactor: 10000 })
		slt._check()

		slt = new SortedArray(range(10000))
		expect(Array.from(slt)).toStrictEqual(Array.from(range(10000)))

		slt.clear()
		expect(slt.length).toBe(0)
		slt._check()
	})

	test('add', () => {
		let slt = new SortedArray<number>
		const random = seedrandom('')
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
			slt.add(random())
			slt._check()
		}
	})

	test('update', () => {
		let slt = new SortedArray<number>
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
		let slt = new SortedArray<number>
		expect(slt.includes(0)).toBeFalsy()

		slt.update(range(10000))

		for (const val of range(10000)) {
			expect(slt.includes(val)).toBe(true)
		}

		expect(slt.includes(10000)).toBeFalsy()
		slt._check()
	})

	test('discard', () => {
		let slt = new SortedArray<number>
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
		slt._check()
		for (const val of range(20)) {
			slt.delete(val)
			slt._check()
		}
		expect(slt.length).toBe(0)
	})

	test('getitem', () => {
		let slt = new SortedArray(undefined, { loadFactor: 17 })
		const random = seedrandom('')

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
		expect(slt.at(5)).toBeUndefined()
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
		while (slt.length > 0) {
			const pos = Math.floor(random() * slt.length)
			slt.deleteAt(pos)
			slt._check()
		}

		slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.deleteSlice(0, slt.length)
		expect(slt.length).toBe(0)
		slt._check()
	})

	test('delitem_slice', () => {
		let slt = new SortedArray(range(100), { loadFactor: 17 })
		slt.deleteSlice(10, 40)
		expect(slt.length).toBe(70)
		expect(Array.from(slt)).toStrictEqual([...range(10), ...range(40, 100)])
	})

	test('iter', () => {
		let slt = new SortedArray(range(10000))
		const itr = slt[Symbol.iterator]()
		expect(Array.from(itr)).toStrictEqual(Array.from(range(10000)))
	})

	test('islice', () => {
		let slt = new SortedArray(undefined, { loadFactor: 7 })

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
		slt._check()
		expect(slt.bisectLeft(50)).toBe(100)
		expect(slt.bisectLeft(200)).toBe(200)
	})

	test('bisect_right', () => {
		let slt = new SortedArray<number>
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

	test('count', () => {
		let slt = new SortedArray(undefined, { loadFactor: 7 })

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
		let slt = new SortedArray(range(10), { loadFactor: 4 })
		slt._check()
		expect(slt.pop()).toBe(9)
		slt._check()
		expect(slt.pop(0)).toBe(0)
		slt._check()
		expect(slt.pop(-2)).toBe(7)
		slt._check()
		expect(slt.pop(4)).toBe(5)
		slt._check()
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
		thisList._check()
		thatList._check()
		expect(Array.from(thisList)).toStrictEqual(Array.from(range(10)))
		expect(Array.from(thatList)).toStrictEqual(Array.from(range(10)).flatMap(x => Array(5).fill(x)))
		expect(thisList).not.toStrictEqual(thatList)
		expect(Array.from(thisList)).not.toStrictEqual(Array.from(thatList))
	})

	test('imul', () => {
		const thisList = new SortedArray(range(10), { loadFactor: 4 })
		thisList.update(thisList)
		thisList._check()
		thisList.update(thisList)
		thisList._check()
		expect(Array.from(thisList)).toStrictEqual(Array.from(range(10)).flatMap(x => Array(4).fill(x)))
	})

	test('check', () => {
		let slt = new SortedArray(range(10), { loadFactor: 4 })
		Object.assign(slt, { _len: 5 })
		expect(() => slt._check()).toThrow()
	})
})
