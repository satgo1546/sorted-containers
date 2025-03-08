import { describe, makeStockAndBench } from './benchmark-utils.ts'
import seedrandom from 'seedrandom'
import { SortedArray } from './sorted-array.ts'
import { AVLTree } from 'avl'
import SplayTree from 'splaytree'
import { TreeMultiSet } from 'jstreemap'
import createRBTree from 'functional-red-black-tree'
import { bisectLeft, bisectRight, insort } from './bisect.ts'

let random = seedrandom('')
const [stockArray, benchArrayReadOnly, benchArray] = makeStockAndBench('Array', () => Array.from({ length: 1000000 }, (_, i) => ({ value: i * 2 })))
const list = stockArray.slice()
for (let i = list.length - 1; i; i--) {
	const j = Math.floor(random() * (i + 1))
	const tmp = list[i]
	list[i] = list[j]
	list[j] = tmp
}
const comparator = (a: { value: number }, b: { value: number }) => Math.sign(a.value - b.value) as -1 | 0 | 1

const [, benchSortedArrayReadOnly, benchSortedArray] = makeStockAndBench('SortedArray', () => {
	// Insert values one by one instead of `new SortedArray(list)` to align with other implementations.
	const slt = new SortedArray<{ value: number }>(undefined, { comparator })
	for (const val of list) slt.add(val)
	return slt
})
const [, benchAVLReadOnly, benchAVL] = makeStockAndBench('avl', () => {
	const tree = new AVLTree<{ value: number }>(comparator)
	for (const val of list) tree.insert(val)
	return tree
})
const [, benchSplayReadOnly, benchSplay] = makeStockAndBench('splaytree', () => {
	const tree = new SplayTree<{ value: number }>(comparator)
	for (const val of list) tree.insert(val)
	return tree
})
const [, benchTreeMultiSetReadOnly, benchTreeMultiSet] = makeStockAndBench('jstreemap TreeMultiSet', () => {
	let set = new TreeMultiSet<{ value: number }>()
	set.compareFunc = comparator
	for (const val of list) set.add(val)
	return set
})
const [, benchFunctionalRedBlackTree] = makeStockAndBench('functional-red-black-tree', () => {
	let tree = createRBTree<{ value: number }, undefined>(comparator)
	for (const val of list) tree = tree.insert(val, undefined)
	return tree
})

describe('initialize with 1,000,000 elements', () => {
	benchSortedArrayReadOnly(() => new SortedArray(list, { comparator }).length)
	benchArrayReadOnly(() => list.slice().sort(comparator).length)
	benchAVLReadOnly(() => {
		const tree = new AVLTree<{ value: number }>(comparator)
		for (const val of list) tree.insert(val)
		return tree.size
	})
	benchSplayReadOnly(() => {
		const tree = new SplayTree<{ value: number }>(comparator)
		for (const val of list) tree.insert(val)
		return tree.size
	})
	benchTreeMultiSetReadOnly(() => {
		const set = new TreeMultiSet<{ value: number }>()
		set.compareFunc = comparator
		for (const val of list) set.add(val)
		return set.size
	})
	benchFunctionalRedBlackTree(() => {
		let tree = createRBTree<{ value: number }, undefined>(comparator)
		for (const val of list) tree = tree.insert(val, undefined)
		return tree.length
	})
})

for (const [description, values] of Object.entries({
	'add 1000 random new elements': Array.from({ length: 1000 }, (_, i) => ({ value: list[i * 100].value + 1 })),
	'add 1000 random existing elements': Array.from({ length: 1000 }, (_, i) => list[i * 100]),
	'add 1000 same existing elements': Array(1000).fill(list[list.length >> 1]),
})) describe(description, () => {
	benchSortedArray(slt => {
		for (const val of values) slt.add(val)
		return slt.length
	})

	benchArray(arr => {
		for (const val of values) insort(arr, val, comparator)
		return arr.length
	})

	benchAVL(tree => {
		for (const val of values) tree.insert(val)
		return tree.size
	})

	benchSplay(tree => {
		for (const val of values) tree.insert(val)
		return tree.size
	})

	benchTreeMultiSet(set => {
		for (const val of values) set.add(val)
		return set.size
	})

	benchFunctionalRedBlackTree(tree => {
		for (const val of values) tree = tree.insert(val, undefined)
		return tree.length
	})
})

for (const [description, values] of Object.entries({
	'delete 1000 random elements': Array.from({ length: 1000 }, () => stockArray[Math.floor(random() * stockArray.length)]),
	'delete 1000 random nonexistent elements': Array.from({ length: 1000 }, () => ({ value: Math.floor(random() * stockArray.length) * 2 + 1 })),
})) describe(description, () => {
	benchSortedArray(slt => {
		for (const val of values) slt.delete(val)
		return slt.length
	})

	benchArray(arr => {
		for (const val of values) {
			const i = bisectLeft(arr, val, comparator)
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

	benchTreeMultiSet(set => {
		for (const val of values) set.delete(val)
		return set.size
	})

	benchFunctionalRedBlackTree(tree => {
		for (const val of values) tree = tree.remove(val)
		return tree.length
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
			if (max !== null) tree.remove(max)
		}
		return tree.size
	})

	benchTreeMultiSet(set => {
		for (let i = 0; i < 1000; i++) {
			const max = set.last()
			if (max !== undefined) set.delete(max)
		}
		return set.size
	})

	benchFunctionalRedBlackTree(tree => {
		for (let i = 0; i < 1000; i++) tree = tree.end.remove()
		return tree.length
	})
})

describe('test for 2000 elements about half of which are nonexistent', () => {
	const values = Array.from({ length: 2000 }, (_, i) => ({ value: list[i * 100].value + +(random() < .5) }))

	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (const val of values) if (slt.includes(val)) sum++
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (const val of values) {
			if (comparator(arr[bisectLeft(arr, val, comparator)], val) === 0) sum++
		}
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

	benchTreeMultiSetReadOnly(set => {
		let sum = 0
		for (const val of values) if (set.has(val)) sum++
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		for (const val of values) if (tree.find(val).valid) sum++
		return sum
	})
})

describe('count 1000 existing elements', () => {
	const values = Array.from({ length: 1000 }, (_, i) => list[i * 100])

	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (const val of values) sum += slt.count(val)
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (const val of values) {
			sum += bisectRight(arr, val, comparator) - bisectLeft(arr, val, comparator)
		}
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		for (const val of values) sum += tree.gt(val).index - tree.ge(val).index
		return sum
	})
})

describe('indexOf 2000 elements about half of which are nonexistent with checks', () => {
	const values = Array.from({ length: 2000 }, (_, i) => ({ value: list[i * 100].value + +(random() < .5) }))

	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (const val of values) {
			const i = slt.indexOf(val)
			if (i >= 0) sum += i
		}
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (const val of values) {
			const i = bisectLeft(arr, val, comparator)
			if (comparator(arr[i], val) === 0) sum += i
		}
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		for (const val of values) {
			const { index, valid } = tree.find(val)
			if (valid) sum += index
		}
		return sum
	})
})
