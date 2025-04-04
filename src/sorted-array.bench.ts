import { describe, makeStockAndBench } from './benchmark-utils.ts'
import seedrandom from 'seedrandom'
import { SortedArray } from './sorted-array.ts'
import { AVLTree } from 'avl'
import SplayTree from 'splaytree'
import { TreeMultiSet } from 'jstreemap'
import createRBTree from 'functional-red-black-tree'
import { bisectLeft, bisectRight, insort } from './bisect.ts'

let random = seedrandom('')
const [stockArray, benchArrayReadOnly, benchArray] = makeStockAndBench('Array', () => Array.from({ length: 1000000 }, (_, i) => i * 2))
const list = stockArray.slice()
for (let i = list.length - 1; i; i--) {
	const j = Math.floor(random() * (i + 1))
	const tmp = list[i]
	list[i] = list[j]
	list[j] = tmp
}

const [, benchSortedArrayReadOnly, benchSortedArray] = makeStockAndBench('SortedArray', () => {
	// Insert values one by one instead of `new SortedArray(list)` to align with other implementations.
	const slt = new SortedArray<number>()
	for (const val of list) slt.add(val)
	return slt
})
const [, benchAVLReadOnly, benchAVL] = makeStockAndBench('avl', () => {
	const tree = new AVLTree<number>()
	for (const val of list) tree.insert(val)
	return tree
})
const [, benchSplayReadOnly, benchSplay] = makeStockAndBench('splaytree', () => {
	const tree = new SplayTree<number>()
	for (const val of list) tree.insert(val)
	return tree
})
const [, benchTreeMultiSetReadOnly, benchTreeMultiSet] = makeStockAndBench('jstreemap TreeMultiSet', () => {
	const set = new TreeMultiSet<number>()
	for (const val of list) set.add(val)
	return set
})
const [, benchFunctionalRedBlackTree] = makeStockAndBench('functional-red-black-tree', () => {
	let tree = createRBTree<number, undefined>()
	for (const val of list) tree = tree.insert(val, undefined)
	return tree
})

describe('initialize with 1,000,000 elements', () => {
	benchSortedArrayReadOnly(() => new SortedArray(list).length)
	benchArrayReadOnly(() => list.slice().sort((a, b) => a - b).length)
	benchAVLReadOnly(() => {
		const tree = new AVLTree()
		for (const val of list) tree.insert(val)
		return tree.size
	})
	benchSplayReadOnly(() => {
		const tree = new SplayTree()
		for (const val of list) tree.insert(val)
		return tree.size
	})
	benchTreeMultiSetReadOnly(() => {
		const set = new TreeMultiSet<number>()
		for (const val of list) set.add(val)
		return set.size
	})
	benchFunctionalRedBlackTree(() => {
		let tree = createRBTree<number, undefined>()
		for (const val of list) tree = tree.insert(val, undefined)
		return tree.length
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
			// The type is wrong (does not include undefined)!
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

	benchTreeMultiSetReadOnly(set => {
		let sum = 0
		for (const x of set) sum += x
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		tree.forEach(x => { sum += x })
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

	benchTreeMultiSetReadOnly(set => {
		let sum = 0
		const end = set.upperBound(500500)
		for (const it = set.lowerBound(499500); !it.equals(end); it.next()) {
			sum += it.key
		}
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		tree.forEach(x => { sum += x }, 499500, 500501)
		return sum
	})
})

describe('iterate over elements from 499500th to 500500th', () => {
	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (const x of slt.islice(499500, 500500)) sum += x
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (let i = 499500; i < 500500; i++) sum += arr[i]
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		for (let it = tree.at(499500); it.index < 500500; it.next()) sum += it.key!
		return sum
	})
})

describe('index from 499500th to 500500th', () => {
	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (let i = 499500; i < 500500; i++) sum += slt.at(i)!
		return sum
	})

	benchArrayReadOnly(arr => {
		let sum = 0
		for (let i = 499500; i < 500500; i++) sum += arr[i]
		return sum
	})

	benchAVLReadOnly(tree => {
		return tree.at(499500)!.key
	})

	benchSplayReadOnly(tree => {
		return tree.at(499500)!.key
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		for (let i = 499500; i < 500500; i++) sum += tree.at(i).key!
		return sum
	})
})

describe('test for 2000 elements about half of which are nonexistent', () => {
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
			sum += bisectRight(arr, val, (a, b) => a - b) - bisectLeft(arr, val, (a, b) => a - b)
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
	const values = Array.from({ length: 2000 }, (_, i) => list[i * 100] + +(random() < .5))

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
			const i = bisectLeft(arr, val, (a, b) => a - b)
			if (arr[i] === val) sum += i
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

describe('convert to Array', () => {
	benchSortedArrayReadOnly(slt => slt.slice().length)
	benchArrayReadOnly(arr => arr.slice().length)
	benchAVLReadOnly(tree => tree.keys().length)
	benchSplayReadOnly(tree => tree.keys().length)
	benchTreeMultiSetReadOnly(set => Array.from(set).length)
	benchFunctionalRedBlackTree(tree => tree.keys.length)
})
