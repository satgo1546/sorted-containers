import { describe, test, expect } from 'vitest'
import { SortedMap, checkSortedMap } from './sorted-map.ts'

function negateComparator(a: number, b: number): number {
	return b - a
}

function moduloComparator(a: number, b: number): number {
	return a % 10 - b % 10
}

describe('SortedMap', () => {
	test('init', () => {
		const temp = new SortedMap(undefined, { loadFactor: 4 })
		checkSortedMap(temp)
	})

	test('init_key', () => {
		const temp = new SortedMap(undefined, { comparator: negateComparator })
		checkSortedMap(temp)
	})

	test('init_args', () => {
		const temp = new SortedMap([['a', 1], ['b', 2]])
		expect(temp.size).toBe(2)
		expect(temp.get('a')).toBe(1)
		expect(temp.get('b')).toBe(2)
		checkSortedMap(temp)
	})

	test('clear', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.size).toBe(26)
		expect([...temp.entries()]).toStrictEqual(mapping)
		temp.clear()
		expect(temp.size).toBe(0)
	})

	test('contains', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(Array.from('abcdefghijklmnopqrstuvwxyz').every(val => temp.has(val))).toBe(true)
	})

	test('delitem', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		temp.delete('a')
		checkSortedMap(temp)
	})

	test('getitem', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(Array.from('abcdefghijklmnopqrstuvwxyz').every((val, pos) => temp.get(val) === pos)).toBe(true)
	})

	test('eq', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp1 = new SortedMap(mapping)
		const temp2 = new SortedMap(mapping)
		expect(Array.from(temp1)).toStrictEqual(Array.from(temp2))
		temp2.set('a', 100)
		expect(Array.from(temp1)).not.toStrictEqual(Array.from(temp2))
		temp2.delete('a')
		expect(Array.from(temp1)).not.toStrictEqual(Array.from(temp2))
		temp2.set('zz', 0)
		expect(Array.from(temp1)).not.toStrictEqual(Array.from(temp2))
	})

	test('iter', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect([...temp.keys()]).toStrictEqual(Array.from('abcdefghijklmnopqrstuvwxyz'))
	})

	test('iter_key', () => {
		const temp = new SortedMap(
			Array.from({ length: 100 }, (_, val) => [val, val]),
			{ comparator: negateComparator, loadFactor: 7 },
		)
		expect([...temp.keys()]).toStrictEqual(Array.from({ length: 100 }, (_, i) => 99 - i))
	})

	test('islice', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping, { loadFactor: 7 })
		for (let start = 0; start < 30; start++) {
			for (let stop = 0; stop < 30; stop++) {
				expect([...temp.islice(start, stop)]).toStrictEqual(mapping.slice(start, stop))
			}
		}
	})

	test('irange', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping, { loadFactor: 7 })
		for (let start = 0; start < 26; start++) {
			for (let stop = start + 1; stop < 26; stop++) {
				const result = mapping.slice(start, stop)
				expect(Array.from(temp.irange(result[0][0], result[result.length - 1][0]))).toStrictEqual(result)
			}
		}
	})

	test('irange_key', () => {
		const temp = new SortedMap<number, number>(
			Array.from({ length: 100 }, (_, val) => [val, val]),
			{ comparator: moduloComparator, loadFactor: 7 },
		)
		const values = Array.from({ length: 10 }, (_, val) => [val, val + 90])
		for (let start = 0; start < 10; start++) {
			for (let stop = start; stop < 10; stop++) {
				const result = Array.from(temp.irange(start, stop))
				expect(result).toStrictEqual(values.slice(start, stop + 1))
			}
		}
	})

	test('len', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.size).toBe(26)
	})

	test('setitem', () => {
		const temp = new SortedMap<string, number>()
		Array.from('abcdefghijklmnopqrstuvwxyz').forEach((val, pos) => {
			temp.set(val, pos)
			checkSortedMap(temp)
		})
		expect(temp.size).toBe(26)
		Array.from('abcdefghijklmnopqrstuvwxyz').forEach((val, pos) => {
			temp.set(val, pos)
			checkSortedMap(temp)
		})
		expect(temp.size).toBe(26)
	})

	test('copy', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp instanceof SortedMap).toBe(true)
		checkSortedMap(temp)
		expect(temp.size).toBe(26)
		const dup = temp.clone()
		expect(dup instanceof SortedMap).toBe(true)
		checkSortedMap(dup)
		expect(dup.size).toBe(26)
		dup.clear()
		expect(temp.size).toBe(26)
		expect(dup.size).toBe(0)
	})

	test('copy_copy', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		const dup = new SortedMap(temp)
		expect(temp.size).toBe(26)
		expect(dup.size).toBe(26)
		dup.clear()
		expect(temp.size).toBe(26)
		expect(dup.size).toBe(0)
	})

	test('fromkeys', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', val => [val, 1])
		const temp = new SortedMap(mapping)
		for (const val of temp.values()) {
			expect(val).toBe(1)
		}
	})

	test('get', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.get('a')).toBe(0)
		expect(temp.get('A', -1)).toBe(-1)
	})

	test('items', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect([...temp.entries()]).toStrictEqual(mapping)
	})

	test('keys', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect([...temp.keys()]).toStrictEqual(mapping.map(([key]) => key))
	})

	test('values', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect([...temp.values()]).toStrictEqual(mapping.map(([, value]) => value))
	})

	test('iterkeys', () => {
		const temp = new SortedMap()
		expect('iterkeys' in temp).toBe(false)
	})

	test('pop', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.pop('a')).toBe(0)
		expect(temp.pop('a', -1)).toBe(-1)
	})

	test('pop2', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.pop('A')).toBeUndefined()
	})

	test('popitem', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.popEntry()).toStrictEqual(['z', 25])
	})

	test('popitem2', () => {
		const temp = new SortedMap()
		expect(temp.popEntry()).toBeUndefined()
	})

	test('popitem3', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.popEntry(0)).toStrictEqual(['a', 0])
	})

	test('peekitem', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.at()).toStrictEqual(['z', 25])
		expect(temp.at(0)).toStrictEqual(['a', 0])
		expect(temp.at(4)).toStrictEqual(['e', 4])
	})

	test('peekitem2', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.at(100)).toBeUndefined()
	})

	test('setdefault', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.upsert('a', -1)).toBe(0)
		expect(temp.get('a')).toBe(0)
		expect(temp.upsert('A', -1)).toBe(-1)
	})

	test('update', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap()
		temp.update(mapping)
		temp.update(new Map(mapping))
		temp.update(mapping.slice(5, 7))
		expect([...temp.entries()]).toStrictEqual(mapping)
	})

	test('update2', () => {
		const mapping = new Map<string, number>
		Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => mapping.set(val, pos))
		const temp = new SortedMap()
		temp.update(mapping)
		expect(Array.from(temp.entries())).toStrictEqual(Array.from(mapping))
	})

	test('index', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.indexOf('a')).toBe(0)
		expect(temp.indexOf('f', 3, -3)).toBe(5)
	})

	test('index_key', () => {
		const temp = new SortedMap(
			Array.from({ length: 100 }, (_, val) => [val, val]),
			{ comparator: negateComparator, loadFactor: 7 },
		)
		for (let val = 0; val < 100; val++) {
			expect(temp.indexOf(val)).toBe(99 - val)
		}
	})

	test('bisect', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping)
		expect(temp.bisectLeft('a')).toBe(0)
		expect(temp.bisectRight('f')).toBe(6)
	})

	test('bisect_key', () => {
		const temp = new SortedMap(
			Array.from({ length: 100 }, (_, val) => [val, val]),
			{ loadFactor: 7 },
		)
		for (let val = 0; val < 100; val++) {
			expect(temp.bisectRight(val)).toBe(val + 1)
			expect(temp.bisectLeft(val)).toBe(val)
		}
	})

	test('bisect_key2', () => {
		const temp = new SortedMap(
			Array.from({ length: 100 }, (_, val) => [val, val]),
			{ comparator: moduloComparator, loadFactor: 7 },
		)
		for (let val = 0; val < 100; val++) {
			expect(temp.bisectRight(val)).toBe(val % 10 + 1)
			expect(temp.bisectLeft(val)).toBe(val % 10)
		}
	})

	test('keysview', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping.slice(0, 13))
		let keys = Array.from(temp.keys())
		expect(keys.length).toBe(13)
		expect(keys.includes('a')).toBe(true)
		expect(keys).toStrictEqual(mapping.slice(0, 13).map(([key]) => key))
		expect(keys[0]).toBe('a')
		expect(keys.slice().reverse()).toStrictEqual(mapping.slice(0, 13).map(([key]) => key).reverse())
		expect(keys.indexOf('f')).toBe(5)
		expect(keys.filter(k => k === 'm').length).toBe(1)
		expect(keys.filter(k => k === '0').length).toBe(0)
		expect(keys.every(k => !['1', '2', '3'].includes(k))).toBe(true)
		temp.update(mapping.slice(13))
		keys = Array.from(temp.keys())
		expect(keys.length).toBe(26)
		expect(keys.includes('z')).toBe(true)
		expect([...keys]).toStrictEqual(mapping.map(([key]) => key))
		const that = new Map(mapping)
		const thatKeys = Array.from(that.keys())
		expect(keys).toStrictEqual(thatKeys)
		expect(keys.every(k => thatKeys.includes(k))).toBe(true)
		expect(keys.some(k => !thatKeys.includes(k))).toBe(false)
		expect(keys.filter(k => thatKeys.includes(k)).length).toBe(26)
		expect(keys.filter(k => !thatKeys.includes(k)).length).toBe(0)
		expect(keys.filter(k => thatKeys.includes(k) || thatKeys.includes(k)).length).toBe(26)
		expect(keys.filter(k => thatKeys.includes(k) && thatKeys.includes(k)).length).toBe(26)
		expect(keys.filter(k => thatKeys.includes(k) && !thatKeys.includes(k)).length).toBe(0)
		expect(keys.filter(k => !thatKeys.includes(k) && thatKeys.includes(k)).length).toBe(0)
		expect(keys.filter(k => !thatKeys.includes(k) || !thatKeys.includes(k)).length).toBe(0)
		expect(keys.filter(k => thatKeys.includes(k) || thatKeys.includes(k)).length).toBe(26)
		expect(keys.filter(k => thatKeys.includes(k) && thatKeys.includes(k)).length).toBe(26)
		expect(keys.filter(k => thatKeys.includes(k) && !thatKeys.includes(k)).length).toBe(0)
		expect(keys.filter(k => !thatKeys.includes(k) && thatKeys.includes(k)).length).toBe(0)
		expect(keys.filter(k => !thatKeys.includes(k) || !thatKeys.includes(k)).length).toBe(0)
		const keys2 = Array.from(new SortedMap(mapping.slice(0, 2)).keys())
		expect(keys2).toStrictEqual(['a', 'b'])
	})

	test('valuesview', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping.slice(0, 13))
		let values = Array.from(temp.values())
		expect(values.length).toBe(13)
		expect(values.includes(0)).toBe(true)
		expect(values).toStrictEqual(mapping.slice(0, 13).map(([, value]) => value))
		expect(values[0]).toBe(0)
		expect(values.slice(-3)).toStrictEqual([10, 11, 12])
		expect(values.slice().reverse()).toStrictEqual(mapping.slice(0, 13).map(([, value]) => value).reverse())
		expect(values.indexOf(5)).toBe(5)
		expect(values.filter(v => v === 10).length).toBe(1)
		temp.update(mapping.slice(13))
		values = Array.from(temp.values())
		expect(values.length).toBe(26)
		expect(values.includes(25)).toBe(true)
		expect([...values]).toStrictEqual(mapping.map(([, value]) => value))
		const values2 = Array.from(new SortedMap(mapping.slice(0, 2)).values())
		expect(values2).toStrictEqual([0, 1])
	})

	test('values_view_index', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping.slice(0, 13))
		const values = Array.from(temp.values())
		expect(values.indexOf(100)).toBe(-1)
	})

	test('itemsview', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping.slice(0, 13))
		let items = Array.from(temp.entries())
		expect(items.length).toBe(13)
		expect(items.some(([key, value]) => key === 'a' && value === 0)).toBe(true)
		expect(items).toStrictEqual(mapping.slice(0, 13))
		expect(items[0]).toStrictEqual(['a', 0])
		expect(items.slice(-3)).toStrictEqual([['k', 10], ['l', 11], ['m', 12]])
		expect(items.slice().reverse()).toStrictEqual(mapping.slice(0, 13).reverse())
		expect(items.findIndex(([key, value]) => key === 'f' && value === 5)).toBe(5)
		expect(items.filter(([key, value]) => key === 'm' && value === 12).length).toBe(1)
		expect(items.every(([key]) => !['0', '1'].includes(key))).toBe(true)
		expect(items.some(([key]) => ['a', 'b'].includes(key))).toBe(true)
		temp.update(mapping.slice(13))
		items = Array.from(temp.entries())
		expect(items.length).toBe(26)
		expect(items.some(([key, value]) => key === 'z' && value === 25)).toBe(true)
		expect(items).toStrictEqual(mapping)
		const that = new Map(mapping)
		const thatItems = Array.from(that.entries())
		expect(items).toStrictEqual(thatItems)
		expect(items.every(([key, value]) => thatItems.some(([k, v]) => k === key && v === value))).toBe(true)
		expect(items.some(([key, value]) => !thatItems.some(([k, v]) => k === key && v === value))).toBe(false)
		expect(items.filter(([key, value]) => thatItems.some(([k, v]) => k === key && v === value)).length).toBe(26)
		expect(items.filter(([key, value]) => !thatItems.some(([k, v]) => k === key && v === value)).length).toBe(0)
		expect(items.filter(([key, value]) => thatItems.some(([k, v]) => k === key && v === value) || thatItems.some(([k, v]) => k === key && v === value)).length).toBe(26)
		expect(items.filter(([key, value]) => thatItems.some(([k, v]) => k === key && v === value) && thatItems.some(([k, v]) => k === key && v === value)).length).toBe(26)
		expect(items.filter(([key, value]) => thatItems.some(([k, v]) => k === key && v === value) && !thatItems.some(([k, v]) => k === key && v === value)).length).toBe(0)
		expect(items.filter(([key, value]) => !thatItems.some(([k, v]) => k === key && v === value) && thatItems.some(([k, v]) => k === key && v === value)).length).toBe(0)
		expect(items.filter(([key, value]) => !thatItems.some(([k, v]) => k === key && v === value) || !thatItems.some(([k, v]) => k === key && v === value)).length).toBe(0)
		const items2 = Array.from(new SortedMap(mapping.slice(0, 2)).entries())
		expect(items2).toStrictEqual([['a', 0], ['b', 1]])
	})

	test('items_view_index', () => {
		const mapping: [string, number][] = Array.from('abcdefghijklmnopqrstuvwxyz', (val, pos) => [val, pos])
		const temp = new SortedMap(mapping.slice(0, 13))
		const items = Array.from(temp.entries())
		expect(items.findIndex(([key, value]) => key === 'f' && value === 100)).toBe(-1)
	})
})

describe('JavaScript specialty', () => {
	test('NaN with default comparator', () => {
		const sd = new SortedMap<number, undefined>(Array(100).fill([NaN]), { loadFactor: 17 })
		expect(sd.size).toBe(1)
		expect(Array.from(sd)).toStrictEqual([[NaN, undefined]])
		expect(sd.has(NaN)).toBe(true)
		expect(sd.indexOf(NaN)).toBe(0)
	})

	test('±0 with default comparator', () => {
		const sd = new SortedMap(Array.from({ length: 100 }, (_, i) => [(i % 2 - .5) * 0, 'value']), { loadFactor: 17 })
		expect(sd.size).toBe(1)
		expect(Array.from(sd)).toStrictEqual([[-0, 'value']])
		expect(Array.from(sd)).not.toStrictEqual([[0, 'value']])
		expect(sd.has(0)).toBe(true)
		expect(sd.has(-0)).toBe(true)
	})

	test('undefined and null', () => {
		const sd = new SortedMap(
			Array.from({ length: 100 }, (_, i) => [i % 3 ? null : undefined, 'value']),
			{
				comparator(a, b) {
					const aStr = '' + a
					const bStr = '' + b
					return +(aStr > bStr) - +(aStr < bStr)
				},
				loadFactor: 17,
			},
		)
		expect(sd.size).toBe(2)
		expect(Array.from(sd)).toStrictEqual([[null, 'value'], [undefined, 'value']])
		expect(sd.at(-3)).toBeUndefined()
		expect(sd.at(-2)).toStrictEqual([null, 'value'])
		expect(sd.at(-1)).toStrictEqual([undefined, 'value'])
		expect(sd.at(0)).toStrictEqual([null, 'value'])
		expect(sd.at(1)).toStrictEqual([undefined, 'value'])
		expect(sd.at(2)).toBeUndefined()
		expect(sd.at(3)).toBeUndefined()
		expect(sd.has(undefined)).toBe(true)
		expect(sd.has(null)).toBe(true)
		expect(sd.indexOf(undefined)).toBe(1)
		expect(sd.indexOf(null)).toBe(0)
	})

	test('equal keys’ identity', () => {
		const ss = new SortedMap([['a', 'first'], ['b', 'second']], { comparator: () => 0 })
		expect(ss.size).toBe(1)
		expect(ss.at(0)).toStrictEqual(['a', 'second'])
		expect(ss.get('b')).toBe('second')
		ss.set('c', 'third')
		expect(ss.size).toBe(1)
		expect(ss.at(0)).toStrictEqual(['a', 'third'])
		ss.update([['d', 'fourth']])
		expect(ss.size).toBe(1)
		expect(ss.at(0)).toStrictEqual(['a', 'fourth'])
		ss.delete('e')
		expect(ss.size).toBe(0)
		ss.set('f', 'fifth')
		expect(ss.size).toBe(1)
		expect(ss.at(0)).toStrictEqual(['f', 'fifth'])
		ss.clear()
		expect(ss.size).toBe(0)
		ss.update([['a', 'first'], ['b', 'second']])
		expect(ss.size).toBe(1)
		expect(ss.at(0)).toStrictEqual(['a', 'second'])
	})
})
