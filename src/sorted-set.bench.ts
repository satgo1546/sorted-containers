import { describe, makeStockAndBench } from './benchmark-utils.ts'
import seedrandom from 'seedrandom'
import { SortedSet } from './sorted-set.ts'
import { bisectLeft, bisectRight } from './bisect.ts'
import { AVLTree } from 'avl'
import SplayTree from 'splaytree'
import BTreeModule from 'sorted-btree'
const BTree: typeof BTreeModule = BTreeModule['default']
import { RBTree } from 'bintrees'
import { TreeSet } from 'jstreemap'
import { OrderedSet } from 'js-sdsl'
import CollectionsSortedSet from 'collections/sorted-set.js'

let random = seedrandom('')
const [stockArray, benchArrayReadOnly, benchArray] = makeStockAndBench('Array', () => Array.from({ length: 1000000 }, (_, i) => i * 2))
const list = stockArray.slice()
for (let i = list.length - 1; i; i--) {
	const j = Math.floor(random() * (i + 1))
	const tmp = list[i]
	list[i] = list[j]
	list[j] = tmp
}
const [, benchSetReadOnly, benchSet] = makeStockAndBench('Set', () => new Set(stockArray))

const [, benchSortedSetReadOnly, benchSortedSet] = makeStockAndBench('SortedSet', () => {
	// Insert values one by one instead of `new SortedSet(list)` to align with other implementations.
	const ss = new SortedSet<number>()
	for (const val of list) ss.add(val)
	return ss
})
const [, benchAVLReadOnly, benchAVL] = makeStockAndBench('avl', () => {
	const tree = new AVLTree<number>(undefined, true)
	for (const val of list) tree.insert(val)
	return tree
})
const [, benchSplayReadOnly, benchSplay] = makeStockAndBench('splaytree', () => {
	const tree = new SplayTree<number>()
	for (const val of list) tree.add(val)
	return tree
})
const [, benchBTreeReadOnly, benchBTree] = makeStockAndBench('sorted-btree', () => {
	const tree = new BTree<number, undefined>()
	for (const val of list) tree.set(val, undefined)
	return tree
})
const [, benchRBTreeReadOnly, benchRBTree] = makeStockAndBench('bintrees RBTree', () => {
	let tree = new RBTree<number>((a, b) => a - b)
	for (const val of list) tree.insert(val)
	return tree
})
const [, benchTreeSetReadOnly, benchTreeSet] = makeStockAndBench('jstreemap TreeSet', () => {
	const set = new TreeSet<number>()
	for (const val of list) set.add(val)
	return set
})
const [, benchOrderedSetReadOnly, benchOrderedSet] = makeStockAndBench('js-sdsl OrderedSet', () => {
	const set = new OrderedSet<number>(undefined, undefined, true)
	for (const val of list) set.insert(val)
	return set
})
const [, benchCollectionsSortedSetReadOnly, benchCollectionsSortedSet] = makeStockAndBench('collections.js SortedSet', () => {
	const set = new CollectionsSortedSet()
	for (const val of list) set.push(val)
	return set
})

describe('initialize with 1,000,000 elements', () => {
	benchSortedSetReadOnly(() => new SortedSet(list).size)
	benchArrayReadOnly(() => {
		const arr: number[] = []
		for (const val of list.slice().sort((a, b) => a - b)) {
			if (val !== arr[arr.length - 1]) arr.push(val)
		}
		return arr.length
	})
	benchSetReadOnly(() => new Set(list).size)
	benchAVLReadOnly(() => {
		const tree = new AVLTree(undefined, true)
		for (const val of list) tree.insert(val)
		return tree.size
	})
	benchSplayReadOnly(() => {
		const tree = new SplayTree()
		for (const val of list) tree.add(val)
		return tree.size
	})
	benchBTreeReadOnly(() => {
		const tree = new BTree<number, undefined>()
		for (const val of list) tree.set(val, undefined)
		return tree.size
	})
	benchRBTreeReadOnly(() => {
		const tree = new RBTree<number>((a, b) => a - b)
		for (const val of list) tree.insert(val)
		return tree.size
	})
	benchTreeSetReadOnly(() => {
		let set = new TreeSet<number>()
		for (const val of list) set.add(val)
		return set.size
	})
	benchOrderedSetReadOnly(() => new OrderedSet<number>(list, undefined, true).length)
	benchCollectionsSortedSetReadOnly(() => new CollectionsSortedSet(list).length)
})

for (const [description, values] of Object.entries({
	'add 1000 random new elements': Array.from({ length: 1000 }, (_, i) => list[i * 100] + 1),
	'add 1000 random existing elements': Array.from({ length: 1000 }, (_, i) => list[i * 100]),
	'add 1000 same existing elements': Array(1000).fill(list[list.length >> 1]),
})) describe(description, () => {
	benchSortedSet(slt => {
		for (const val of values) slt.add(val)
		return slt.size
	})

	benchArray(arr => {
		for (const val of values) {
			const i = bisectLeft(arr, val, (a, b) => a - b)
			if (arr[i] !== val) arr.splice(i, 0, val)
		}
		return arr.length
	})

	benchSet(set => {
		for (const val of values) set.add(val)
		return set.size
	})

	benchAVL(tree => {
		for (const val of values) tree.insert(val)
		return tree.size
	})

	benchSplay(tree => {
		for (const val of values) tree.add(val)
		return tree.size
	})

	benchBTree(tree => {
		for (const val of values) tree.set(val, undefined)
		return tree.size
	})

	benchRBTree(tree => {
		for (const val of values) tree.insert(val)
		return tree.size
	})

	benchTreeSet(set => {
		for (const val of values) set.add(val)
		return set.size
	})

	benchOrderedSet(set => {
		for (const val of values) set.insert(val)
		return set.length
	})

	benchCollectionsSortedSet(set => {
		for (const val of values) set.push(val)
		return set.length
	})
})

for (const [description, values] of Object.entries({
	'delete 1000 random elements': Array.from({ length: 1000 }, () => stockArray[Math.floor(random() * stockArray.length)]),
	'delete 1000 random nonexistent elements': Array.from({ length: 1000 }, () => Math.floor(random() * stockArray.length) * 2 + 1),
})) describe(description, () => {
	benchSortedSet(slt => {
		for (const val of values) slt.delete(val)
		return slt.size
	})

	benchArray(arr => {
		for (const val of values) {
			const i = bisectLeft(arr, val, (a, b) => a - b)
			if (arr[i] === val) arr.splice(i, 1)
		}
		return arr.length
	})

	benchSet(set => {
		for (const val of values) set.delete(val)
		return set.size
	})

	benchAVL(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})

	benchSplay(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})

	benchBTree(tree => {
		for (const val of values) tree.delete(val)
		return tree.size
	})

	benchRBTree(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})

	benchTreeSet(set => {
		for (const val of values) set.delete(val)
		return set.size
	})

	benchOrderedSet(set => {
		for (const val of values) set.eraseElementByKey(val)
		return set.length
	})

	benchCollectionsSortedSet(set => {
		for (const val of values) set.delete(val)
		return set.length
	})
})

describe('pop 1000 times', () => {
	benchSortedSet(slt => {
		for (let i = 0; i < 1000; i++) slt.pop()
		return slt.size
	})

	benchArray(arr => {
		for (let i = 0; i < 1000; i++) arr.pop()
		return arr.length
	})

	benchSet(set => {
		for (let i = 0; i < 1000; i++) {
			if (set.size) {
				let max = -Infinity
				for (const x of set) max = Math.max(max, x)
				set.delete(max)
			}
		}
		return set.size
	})

	benchAVL(tree => {
		for (let i = 0; i < 1000; i++) tree.popMax()?.key
		return tree.size
	})

	benchSplay(tree => {
		for (let i = 0; i < 1000; i++) {
			const max = tree.max()
			if (max !== null) tree.remove(max)
		}
		return tree.size
	})

	benchBTree(tree => {
		for (let i = 0; i < 1000; i++) {
			const max = tree.maxKey()
			if (max !== undefined) tree.delete(max)
		}
		return tree.size
	})

	benchRBTree(tree => {
		for (let i = 0; i < 1000; i++) {
			const max = tree.max()
			if (max !== null) tree.remove(max)
		}
		return tree.size
	})

	benchTreeSet(set => {
		for (let i = 0; i < 1000; i++) set.delete(set.last())
		return set.size
	})

	benchOrderedSet(set => {
		const it = set.rBegin()
		for (let i = 0; i < 1000; i++) set.eraseElementByIterator(it)
		return set.length
	})

	benchCollectionsSortedSet(set => {
		for (let i = 0; i < 1000; i++) set.pop()
		return set.length
	})
})

describe('iterate over all elements', () => {
	benchSortedSetReadOnly(slt => {
		let sum = 0
		for (const x of slt) sum += x
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (const x of arr) sum += x
		return sum
	})

	benchSetReadOnly(set => {
		const arr = Array.from(set).sort((a, b) => a - b)
		let sum = 0
		for (const x of arr) sum += x
		return sum
	})

	benchAVLReadOnly(tree => {
		let sum = 0
		tree.forEach(({ key }) => { sum += key })
		return sum
	})

	benchSplayReadOnly(tree => {
		let sum = 0
		for (const { key } of tree) sum += key
		return sum
	})

	benchBTreeReadOnly(tree => {
		let sum = 0
		// @ts-ignore
		for (const [key] of tree) sum += key
		return sum
	})

	benchRBTreeReadOnly(tree => {
		let sum = 0
		tree.each(x => sum += x)
		return sum
	})

	benchTreeSetReadOnly(set => {
		let sum = 0
		for (const x of set) sum += x
		return sum
	})

	benchOrderedSetReadOnly(set => {
		let sum = 0
		for (const x of set) sum += x
		return sum
	})

	benchCollectionsSortedSetReadOnly(set => {
		let sum = 0
		// @ts-ignore
		set.forEach(x => sum += x)
		return sum
	})
})

describe('iterate over elements between 499500 and 500500', () => {
	benchSortedSetReadOnly(slt => {
		let sum = 0
		for (const x of slt.irange(499500, 500500)) sum += x
		return sum
	})

	benchArrayReadOnly(arr => {
		const l = bisectLeft(arr, 499500, (a, b) => a - b)
		const r = bisectRight(arr, 500500, (a, b) => a - b)
		let sum = 0
		for (let i = l; i < r; i++) sum += arr[i]
		return sum
	})

	benchSetReadOnly(set => {
		const arr = Array.from(set).sort((a, b) => a - b)
		const l = bisectLeft(arr, 499500, (a, b) => a - b)
		const r = bisectRight(arr, 500500, (a, b) => a - b)
		let sum = 0
		for (let i = l; i < r; i++) sum += arr[i]
		return sum
	})

	benchAVLReadOnly(tree => {
		let sum = 0
		tree.range(499500, 500500, ({ key }) => { sum += key })
		return sum
	})

	benchSplayReadOnly(tree => {
		let sum = 0
		tree.range(499500, 500500, ({ key }) => { sum += key })
		return sum
	})

	benchBTreeReadOnly(tree => {
		let sum = 0
		tree.forRange(499500, 500500, true, val => sum += val)
		return sum
	})

	benchRBTreeReadOnly(tree => {
		let sum = 0
		const it = tree.lowerBound(499500)
		for (let val = it.data(); val !== null && val <= 500500; val = it.next()) {
			sum += val
		}
		return sum
	})

	benchTreeSetReadOnly(set => {
		let sum = 0
		const end = set.upperBound(500500)
		for (const it = set.lowerBound(499500); !it.equals(end); it.next()) {
			sum += it.key
		}
		return sum
	})

	benchOrderedSetReadOnly(set => {
		let sum = 0
		const end = set.upperBound(500500)
		for (const it = set.lowerBound(499500); !it.equals(end); it.next()) {
			sum += it.pointer
		}
		return sum
	})
})

describe('test for 2000 elements about half of which are nonexistent', () => {
	const values = Array.from({ length: 2000 }, (_, i) => list[i * 100] + +(random() < .5))

	benchSortedSetReadOnly(slt => {
		let sum = 0
		for (const val of values) if (slt.has(val)) sum++
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (const val of values) if (arr[bisectLeft(arr, val, (a, b) => a - b)] === val) sum++
		return sum
	})

	benchSetReadOnly(set => {
		let sum = 0
		for (const val of values) if (set.has(val)) sum++
		return sum
	})

	benchAVLReadOnly(tree => {
		let sum = 0
		for (const val of values) if (tree.contains(val)) sum++
		return sum
	})

	benchSplayReadOnly(tree => {
		let sum = 0
		for (const val of values) if (tree.contains(val)) sum++
		return sum
	})

	benchBTreeReadOnly(tree => {
		let sum = 0
		for (const val of values) if (tree.has(val)) sum++
		return sum
	})

	benchRBTreeReadOnly(tree => {
		let sum = 0
		for (const val of values) if (tree.find(val) !== null) sum++
		return sum
	})

	benchTreeSetReadOnly(set => {
		let sum = 0
		for (const val of values) if (set.has(val)) sum++
		return sum
	})

	benchOrderedSetReadOnly(set => {
		let sum = 0
		for (const val of values) if (!set.find(val).equals(set.end())) sum++
		return sum
	})

	benchCollectionsSortedSetReadOnly(set => {
		let sum = 0
		for (const val of values) if (set.has(val)) sum++
		return sum
	})
})

describe('convert to Array', () => {
	benchSortedSetReadOnly(slt => slt.slice().length)
	benchArrayReadOnly(arr => arr.slice().length)
	benchSetReadOnly(set => Array.from(set).sort((a, b) => a - b).length)
	benchAVLReadOnly(tree => tree.keys().length)
	benchSplayReadOnly(tree => tree.keys().length)
	benchBTreeReadOnly(tree => tree.keysArray().length)
	benchRBTreeReadOnly(tree => {
		const arr: number[] = []
		tree.each(val => arr.push(val))
		return arr.length
	})
	benchTreeSetReadOnly(set => Array.from(set).length)
	benchOrderedSetReadOnly(set => Array.from(set).length)
	// @ts-ignore
	benchCollectionsSortedSetReadOnly(set => set.toArray().length)
})
