import { Bench } from 'tinybench'
import seedrandom from 'seedrandom'
import { SortedArray } from './sorted-array.ts'
import { AVLTree } from 'avl'
import SplayTree from 'splaytree'
import createRBTree from 'functional-red-black-tree'
import { bisectLeft, bisectRight, insort } from './bisect.ts'

let bench: Bench
function describe(name: string, fn: () => void) {
	console.error(name)
	bench = new Bench({
		name,
		iterations: 10,
		time: 0,
		warmupIterations: 3,
		warmupTime: 0,
	})
	fn()
	bench.runSync()
	console.table(bench.table(), ['Task name', 'Latency avg (ns)', 'Throughput avg (ops/s)', 'Samples'])
}

let random = seedrandom('')
const [stockArray, benchArrayReadOnly, benchArray] = makeStockAndBench('Array', () => Array.from({ length: 1000000 }, (_, i) => i * 2))
const list = stockArray.slice()
for (let i = list.length - 1; i; i--) {
	const j = Math.floor(random() * (i + 1))
	const tmp = list[i]
	list[i] = list[j]
	list[j] = tmp
}

function makeStockAndBench<T>(name: string, factory: () => T): [T, (fn: (x: T) => void) => void, (fn: (x: T) => void) => void] {
	const stock = factory()
	return [stock, fn => {
		bench.add(name, () => fn(stock))
	}, fn => {
		let x: T
		bench.add(name, () => fn(x), {
			beforeEach() {
				x = factory()
			},
		})
	}]
}

const [, benchSortedArrayReadOnly, benchSortedArray] = makeStockAndBench('SortedArray', () => {
	// Insert values one by one instead of `new SortedArray(list)` to align with other implementations.
	// This will cause `add` to be optimized.
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
const [, benchFunctionalRedBlackTree] = makeStockAndBench('functional-red-black-tree', () => {
	let tree = createRBTree<number, undefined>()
	for (const val of list) tree = tree.insert(val, undefined)
	return tree
})

// function benchRBTree(fn: (tree: RBTree<number>) => void) {
// 	let tree: RBTree<number>
// 	bench('bintrees RBTree', () => fn(tree), {
// 		setup() {
// 			tree = new RBTree((a, b) => a - b)
// 			for (const val of list) tree.insert(val)
// 		},
// 	})
// }

describe('initialize with 1,000,000 elements', () => {
	benchSortedArrayReadOnly(() => new SortedArray(list))
	benchArrayReadOnly(() => list.slice().sort((a, b) => a - b))
	benchAVLReadOnly(() => {
		const tree = new AVLTree()
		for (const val of list) tree.insert(val)
	})
	benchSplayReadOnly(() => {
		const tree = new SplayTree()
		for (const val of list) tree.insert(val)
	})
	benchFunctionalRedBlackTree(() => {
		let tree = createRBTree<number, undefined>()
		for (const val of list) tree = tree.insert(val, undefined)
	})
})

for (const [description, values] of Object.entries({
	'add 1000 random new elements': Array.from({ length: 1000 }, (_, i) => list[i * 100] + 1),
	'add 1000 random existing elements': Array.from({ length: 1000 }, (_, i) => list[i * 100]),
	'add 1000 same existing elements': Array(1000).fill(list[list.length >> 1]),
})) describe(description, () => {
	benchSortedArray(slt => {
		for (const val of values) slt.add(val)
	})

	benchArray(arr => {
		for (const val of values) insort(arr, val, (a, b) => a - b)
	})

	benchAVL(tree => {
		for (const val of values) tree.insert(val)
	})

	benchSplay(tree => {
		for (const val of values) tree.insert(val)
	})

	benchFunctionalRedBlackTree(tree => {
		for (const val of values) tree = tree.insert(val, undefined)
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

	benchFunctionalRedBlackTree(tree => {
		for (let i = 0; i < 1000; i++) tree = tree.end.remove()
		return tree.length
	})
})

describe('iterate over all elements', () => {
	benchSortedArrayReadOnly(slt => {
		let sum = 0
		for (const x of slt) sum += x
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

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		tree.forEach(x => sum += x)
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

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		tree.forEach(x => sum += x, 499500, 500501)
		return sum
	})
})

describe('index at 499500', () => {
	benchSortedArrayReadOnly(slt => slt.at(499500))
	benchArrayReadOnly(arr => arr[499500])
	benchAVLReadOnly(tree => tree.at(499500)!.key)
	benchSplayReadOnly(tree => tree.at(499500)!.key)
	benchFunctionalRedBlackTree(tree => tree.at(499500).key)
})

describe('test for 499500', () => {
	benchSortedArrayReadOnly(slt => slt.includes(499500))
	benchArrayReadOnly(arr => bisectLeft(arr, 499500, (a, b) => a - b) === 499500)
	benchAVLReadOnly(tree => tree.contains(499500))
	benchSplayReadOnly(tree => tree.contains(499500))
	benchFunctionalRedBlackTree(tree => tree.find(499500).valid)
})

describe('count 499500', () => {
	benchSortedArrayReadOnly(slt => slt.count(499500))
	benchArrayReadOnly(arr => bisectRight(arr, 499500, (a, b) => a - b) - bisectLeft(arr, 499500, (a, b) => a - b))
	benchFunctionalRedBlackTree(tree => tree.gt(499500).index - tree.ge(499500).index)
})

describe('indexOf 499500', () => {
	benchSortedArrayReadOnly(slt => {
		const i = slt.indexOf(499500)
		return i !== -1 ? i : undefined
	})

	benchArrayReadOnly(arr => {
		const i = bisectLeft(arr, 499500, (a, b) => a - b)
		return arr[i] === 499500 ? i : undefined
	})

	benchFunctionalRedBlackTree(tree => {
		const { index, valid } = tree.find(499500)
		return valid ? index : undefined
	})
})

describe('convert to Array', () => {
	benchSortedArrayReadOnly(slt => slt.slice().length)
	benchAVLReadOnly(tree => tree.keys().length)
	benchSplayReadOnly(tree => tree.keys().length)
	benchFunctionalRedBlackTree(tree => tree.keys.length)
})
