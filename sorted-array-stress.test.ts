import { test, expect } from 'vitest'
import { SortedArray } from './sorted-array'
import seedrandom from 'seedrandom'
import { bisectLeft, bisectRight } from './bisect'

let random = seedrandom('')

function notEmpty(slt: SortedArray<number>) {
	if (slt.length < 100) {
		actions.stressUpdate(slt)
	}
}

const actions = {
	stressClear(slt: SortedArray<number>) {
		if (random() < 0.1) {
			slt.clear()
		} else {
			const values = Array.from(slt)
			slt.clear()
			slt.update(values.slice(0, Math.floor(values.length / 2)))
		}
	},

	stressAdd(slt: SortedArray<number>) {
		if (random() < 0.1) {
			slt.clear()
		}
		slt.add(random())
	},

	stressUpdate(slt: SortedArray<number>) {
		slt.update(Array.from({ length: 350 }, () => random()))
	},

	stressContains(slt: SortedArray<number>) {
		notEmpty(slt)
		if (random() < 0.1) {
			slt.clear()
			expect(slt).not.toContain(0)
		} else {
			const val = slt.at(Math.floor(random() * slt.length))!
			expect(slt).toContain(val)
			expect(slt).not.toContain(1)
		}
	},

	stressDiscard(slt: SortedArray<number>) {
		notEmpty(slt)
		const val = slt.at(Math.floor(random() * slt.length))!
		slt.delete(val)
	},

	stressDiscard2(slt: SortedArray<number>) {
		if (random() < 0.1) {
			slt.clear()
		}
		slt.delete(random())
	},

	stressRemove(slt: SortedArray<number>) {
		if (slt.length > 0) {
			const val = slt.at(Math.floor(random() * slt.length))!
			expect(slt.delete(val)).toBe(true)
		}
		expect(slt.delete(1)).toBe(false)
		expect(slt.delete(-1)).toBe(false)
	},

	stressDelitem(slt: SortedArray<number>) {
		notEmpty(slt)
		slt.deleteAt(Math.floor(random() * slt.length))
	},

	stressGetitem(slt: SortedArray<number>) {
		if (slt.length > 0) {
			const pos = Math.floor(random() * slt.length)
			expect(slt.at(pos)).toBe(Array.from(slt)[pos])

			expect(slt.at(-(slt.length + 5))).toBeUndefined()
			expect(slt.at(slt.length + 5)).toBeUndefined()
		} else {
			expect(slt.at(0)).toBeUndefined()
		}
	},

	stressDelitemSlice(slt: SortedArray<number>) {
		notEmpty(slt)
		const i = Math.floor(random() * slt.length)
		const j = Math.floor(random() * slt.length)
		slt.deleteSlice(Math.min(i, j), Math.max(i, j))
	},

	stressIter(slt: SortedArray<number>) {
		const itr1 = slt[Symbol.iterator]()
		for (let i = 0; i < slt.length; i++) {
			expect(itr1.next().value).toBe(slt.at(i))
		}
	},

	stressIslice(slt: SortedArray<number>) {
		if (slt.length < 10) return
		const start = Math.floor(random() * (slt.length - 5))
		const stop = Math.floor(random() * (slt.length - start)) + start
		const itr = slt.islice(start, stop)
		for (let pos = start; pos < stop; pos++) {
			expect(slt.at(pos)).toBe(itr.next().value)
		}
	},

	stressIrange(slt: SortedArray<number>) {
		const values = Array.from(new Set(slt))
		slt.clear()
		slt.update(values)
		if (slt.length < 10) return
		const start = Math.floor(random() * (slt.length - 5))
		const stop = Math.floor(random() * (slt.length - start)) + start
		const itr = slt.irange(slt.at(start), slt.at(stop), true, false)
		for (let pos = start; pos < stop; pos++) {
			expect(slt.at(pos)).toBe(itr.next().value)
		}
	},

	stressBisectLeft(slt: SortedArray<number>) {
		const values = Array.from(slt)
		const value = random()
		values.sort((a, b) => a - b)
		expect(bisectLeft(values, value)).toBe(slt.bisectLeft(value))
	},

	stressBisectRight(slt: SortedArray<number>) {
		const values = Array.from(slt)
		const value = random()
		values.sort((a, b) => a - b)
		expect(bisectRight(values, value)).toBe(slt.bisectRight(value))
	},

	stressDups(slt: SortedArray<number>) {
		notEmpty(slt)
		const pos = Math.min(Math.floor(random() * slt.length), 300)
		const val = slt.at(pos)!
		for (let rpt = 0; rpt < pos; rpt++) {
			slt.add(val)
		}
	},

	stressCount(slt: SortedArray<number>) {
		notEmpty(slt)
		const values = Array.from(slt)
		const val = slt.at(Math.floor(random() * slt.length))!
		expect(slt.count(val)).toBe(values.filter(v => v === val).length)
	},

	stressPop(slt: SortedArray<number>) {
		notEmpty(slt)
		const pos = Math.floor(random() * slt.length) + 1
		expect(slt.at(-pos)).toBe(slt.pop(-pos))
	},

	stressIndex(slt: SortedArray<number>) {
		notEmpty(slt)
		const values = new Set(slt)
		slt.clear()
		slt.update(values)
		const pos = Math.floor(random() * slt.length)
		expect(slt.indexOf(slt.at(pos)!)).toBe(pos)
	},

	stressIndex2(slt: SortedArray<number>) {
		notEmpty(slt)
		const values = Array.from(slt).slice(0, 3).flatMap(v => Array(200).fill(v))
		slt = new SortedArray(values)
		for (let idx = 0; idx < slt.length; idx++) {
			expect(slt.indexOf(slt.at(idx)!, idx)).toBe(idx)
		}
	},

	stressEq(slt: SortedArray<number>) {
		notEmpty(slt)
		expect(slt.length).not.toBe(0)
	},
}
const actionNames = Object.keys(actions)

function testStress(repeat: number) {
	const slt = new SortedArray(
		Array.from({ length: 1000 }, () => random()),
		{ loadFactor: 23 },
	)

	for (let rpt = 0; rpt < repeat; rpt++) {
		const action = actions[actionNames[Math.floor(random() * actionNames.length)]]
		action(slt)

		slt._check()

		const fourth = Math.floor(slt.length / 4)
		let count = fourth === 0 ? 0 : Math.floor(random() * (fourth * 2)) - fourth

		while (count > 0) {
			slt.add(random())
			count--
		}

		while (count < 0) {
			const pos = Math.floor(random() * slt.length)
			slt.deleteAt(pos)
			count++
		}

		while (slt.length > 2000) {
			// Shorten the sortedlist. This maintains the "jaggedness" of the sublists which helps coverage.
			const slt_: any = slt
			const pos = Math.floor(random() * slt_._maxes.length)
			slt_._len -= slt_._lists[pos].length
			slt_._lists.splice(pos, 1)
			slt_._maxes.splice(pos, 1)
			slt_._index = []
			slt._check()
		}

		slt._check()
	}

	slt._check()

	actions.stressUpdate(slt)

	while (slt.length > 0) {
		const pos = Math.floor(random() * slt.length)
		slt.deleteAt(pos)
	}

	slt._check()
}

test('SortedArray stress test', () => {
	random = seedrandom('')
	testStress(1000)
})
