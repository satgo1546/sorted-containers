import { describe, makeStockAndBench } from './benchmark-utils.ts'
import seedrandom from 'seedrandom'
import { SortedArray } from './sorted-array.ts'
import { AVLTree } from 'avl'
import SplayTree from 'splaytree'
import { bisectLeft, bisectRight, insort } from './bisect.ts'
import { RBTree } from 'bintrees'
import { TreeSet } from 'jstreemap'

let random = seedrandom('')
const [stockArray, benchArrayReadOnly, benchArray] = makeStockAndBench('Array', () => Array.from({ length: 1000000 }, (_, i) => i * 2))
const list = stockArray.slice()
for (let i = list.length - 1; i; i--) {
	const j = Math.floor(random() * (i + 1))
	const tmp = list[i]
	list[i] = list[j]
	list[j] = tmp
}

const [, benchSortedArrayReadOnly, benchSortedArray] = makeStockAndBench('SortedSet', () => {
	// Insert values one by one instead of `new SortedSet(list)` to align with other implementations.
	const slt = new SortedArray<number>()
	for (const val of list) slt.add(val)
	return slt
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
const [, benchRBTreeReadOnly, benchRBTree] = makeStockAndBench('bintrees RBTree', () => {
	let tree = new RBTree<number>((a, b) => a - b)
	for (const val of list) tree.insert(val)
	return tree
})
const [, benchTreeSetReadOnly, benchTreeSet] = makeStockAndBench('jstreemap TreeSet', () => {
	let set = new TreeSet<number>()
	for (const val of list) set.add(val)
	return set
})

describe('initialize with 1,000,000 elements', () => {
	benchSortedArrayReadOnly(() => new SortedArray(list).length)
	benchArrayReadOnly(() => {
		const arr: number[] = []
		for (const val of list.slice().sort((a, b) => a - b)) {
			if (val !== arr[arr.length - 1]) arr.push(val)
		}
		return arr.length
	})
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
	benchRBTreeReadOnly(() => {
		let tree = new RBTree<number>((a, b) => a - b)
		for (const val of list) tree.insert(val)
		return tree.size
	})
})

for (const [description, values] of Object.entries({
	'add 1000 random new elements': Array.from({ length: 1000 }, (_, i) => list[i * 100] + 1),
	'add 1000 random existing elements': Array.from({ length: 1000 }, (_, i) => list[i * 100]),
	'add 1000 same existing elements': Array(1000).fill(list[list.length >> 1]),
})) describe(description, () => {
	benchSortedArray(slt => {
		for (const val of values) slt.add(val)
		return slt.length
	})

	benchArray(arr => {
		for (const val of values) insort(arr, val, (a, b) => a - b)
		return arr.length
	})

	benchAVL(tree => {
		for (const val of values) tree.insert(val)
		return tree.size
	})

	benchSplay(tree => {
		for (const val of values) tree.add(val)
		return tree.size
	})

	benchRBTree(tree => {
		for (const val of values) tree.insert(val)
		return tree.size
	})
})

for (const [description, values] of Object.entries({
	'delete 1000 random elements': Array.from({ length: 1000 }, () => stockArray[Math.floor(random() * stockArray.length)]),
	'delete 1000 random nonexistent elements': Array.from({ length: 1000 }, () => Math.floor(random() * stockArray.length) * 2 + 1),
})) describe(description, () => {
	benchSortedArray(slt => {
		for (const val of values) slt.delete(val)
		return slt.length
	})

	benchArray(arr => {
		for (const val of values) {
			const i = bisectLeft(arr, val, (a, b) => a - b)
			if (arr[i] === val) arr.splice(i, 1)
		}
		return arr.length
	})

	benchAVL(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})

	benchSplay(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})

	benchRBTree(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})
})

describe('pop 1000 times', () => {
	benchSortedArray(slt => {
		for (let i = 0; i < 1000; i++) slt.pop()
		return slt.length
	})

	benchArray(arr => {
		for (let i = 0; i < 1000; i++) arr.pop()
		return arr.length
	})

	benchAVL(tree => {
		for (let i = 0; i < 1000; i++) tree.popMax()?.key
		return tree.size
	})

	benchSplay(tree => {
		for (let i = 0; i < 1000; i++) {
			const max = tree.max()
			if (max) tree.remove(max)
		}
		return tree.size
	})

	benchRBTree(tree => {
		for (let i = 0; i < 1000; i++) {
			const max = tree.max()
			if (max) tree.remove(max)
		}
		return tree.size
	})
})

describe('iterate over all elements', () => {
	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (const x of slt) sum += x
		return sum
	})

	benchArrayReadOnly(arr => {
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

	benchRBTreeReadOnly(tree => {
		let sum = 0
		tree.each(x => sum += x)
		return sum
	})
})

describe('iterate over elements between 499500 and 500500', () => {
	benchSortedArrayReadOnly(slt => {
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

	benchRBTreeReadOnly(tree => {
		let sum = 0
		const it = tree.lowerBound(499500)
		for (let val = it.data(); val !== null && val <= 500500; val = it.next()) {
			sum += val
		}
		return sum
	})
})

describe('test for 2000 elements where about half are nonexistent', () => {
	const values = Array.from({ length: 2000 }, (_, i) => list[i * 100] + +(random() < .5))

	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (const val of values) if (slt.includes(val)) sum++
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (const val of values) if (arr[bisectLeft(arr, val, (a, b) => a - b)] === val) sum++
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

	benchRBTreeReadOnly(tree => {
		let sum = 0
		for (const val of values) if (tree.find(val) !== null) sum++
		return sum
	})
})

describe('convert to Array', () => {
	benchSortedArrayReadOnly(slt => slt.slice().length)
	benchArrayReadOnly(arr => arr.slice().length)
	benchAVLReadOnly(tree => tree.keys().length)
	benchSplayReadOnly(tree => tree.keys().length)
	benchRBTreeReadOnly(tree => {
		const arr: number[] = []
		tree.each(val => arr.push(val))
		return arr.length
	})
})
