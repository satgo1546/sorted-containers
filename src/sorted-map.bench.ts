import { describe, makeStockAndBench } from './benchmark-utils.ts'
import seedrandom from 'seedrandom'
import { SortedMap } from './sorted-map.ts'
import { AVLTree } from 'avl'
import SplayTree from 'splaytree'
import createRBTree from 'functional-red-black-tree'
import BTreeModule from 'sorted-btree'
const BTree: typeof BTreeModule = BTreeModule['default']
import { TreeMap } from 'jstreemap'
import { OrderedMap } from 'js-sdsl'
import CollectionsSortedMap from 'collections/sorted-map.js'

const random = seedrandom('')
const list = Array.from({ length: 1000000 }, (_, i) => i)
for (let i = list.length - 1; i; i--) {
	const j = Math.floor(random() * (i + 1))
	const tmp = list[i]
	list[i] = list[j]
	list[j] = tmp
}

const [stockMap, benchMapReadOnly, benchMap] = makeStockAndBench('Map', () => {
	const map = new Map<number, number>()
	for (const val of list) map.set(val, -val)
	return map
})
const entries = Array.from(stockMap)

const [, benchSortedMapReadOnly, benchSortedMap] = makeStockAndBench('SortedMap', () => {
	const sd = new SortedMap<number, number>()
	for (const val of list) sd.set(val, -val)
	return sd
})
const [, benchAVLReadOnly, benchAVL] = makeStockAndBench('avl', () => {
	const tree = new AVLTree<number, number>(undefined, true)
	for (const val of list) tree.insert(val, -val)
	return tree
})
const [, benchSplayReadOnly, benchSplay] = makeStockAndBench('splaytree', () => {
	const tree = new SplayTree<number, number>()
	for (const val of list) tree.add(val, -val)
	return tree
})
const [, benchFunctionalRedBlackTree] = makeStockAndBench('functional-red-black-tree', () => {
	let tree = createRBTree<number, number>()
	for (const val of list) tree = tree.insert(val, -val)
	return tree
})
const [, benchBTreeReadOnly, benchBTree] = makeStockAndBench('sorted-btree', () => {
	const tree = new BTree<number, number>()
	for (const val of list) tree.set(val, -val)
	return tree
})
const [, benchTreeMapReadOnly, benchTreeMap] = makeStockAndBench('jstreemap TreeMap', () => {
	const map = new TreeMap<number, number>()
	for (const val of list) map.set(val, -val)
	return map
})
const [, benchOrderedMapReadOnly, benchOrderedMap] = makeStockAndBench('js-sdsl OrderedMap', () => {
	const map = new OrderedMap<number, number>(undefined, undefined, true)
	for (const val of list) map.setElement(val, -val)
	return map
})
const [, benchCollectionsSortedMapReadOnly, benchCollectionsSortedMap] = makeStockAndBench('collections.js SortedMap', () => {
	const map = new CollectionsSortedMap()
	for (const val of list) map.set(val, -val)
	return map
})

describe('initialize with 1,000,000 elements', () => {
	benchSortedMapReadOnly(() => new SortedMap(entries).size)
	benchMapReadOnly(() => new Map(entries).size)
	benchAVLReadOnly(() => {
		const tree = new AVLTree<number, number>(undefined, true)
		for (const [k, v] of entries) tree.insert(k, v)
		return tree.size
	})
	benchSplayReadOnly(() => {
		const tree = new SplayTree()
		for (const [k, v] of entries) tree.add(k, v)
		return tree.size
	})
	benchFunctionalRedBlackTree(() => {
		let tree = createRBTree<number, number>()
		for (const [k, v] of entries) tree = tree.insert(k, v)
		return tree.length
	})
	benchBTreeReadOnly(() => new BTree<number, number>(entries).size)
	benchTreeMapReadOnly(() => {
		const map = new TreeMap<number, number>()
		for (const [k, v] of entries) map.set(k, v)
		return map.size
	})
	benchOrderedMapReadOnly(() => new OrderedMap<number, number>(entries, undefined, true).length)
	benchCollectionsSortedMapReadOnly(() => new CollectionsSortedMap(entries).length)
})

for (const [description, values] of Object.entries({
	'get 1000 random existing keys': Array.from({ length: 1000 }, (_, i) => list[i * 100]),
	'get an existing key 1000 times': Array(1000).fill(list[list.length >> 1]),
})) describe(description, () => {
	benchSortedMapReadOnly(slt => {
		let sum = 0
		for (const val of values) sum += slt.get(val)!
		return sum
	})

	benchMapReadOnly(map => {
		let sum = 0
		for (const val of values) sum += map.get(val)!
		return sum
	})

	benchAVLReadOnly(tree => {
		let sum = 0
		for (const val of values) sum += tree.find(val)!.data!
		return sum
	})

	benchSplayReadOnly(tree => {
		let sum = 0
		for (const val of values) sum += tree.find(val)!.data
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		for (const val of values) sum += tree.get(val)!
		return sum
	})

	benchBTreeReadOnly(tree => {
		let sum = 0
		for (const val of values) sum += tree.get(val)!
		return sum
	})

	benchTreeMapReadOnly(map => {
		let sum = 0
		for (const val of values) sum += map.get(val)!
		return sum
	})

	benchOrderedMapReadOnly(map => {
		let sum = 0
		for (const val of values) sum += map.getElementByKey(val)!
		return sum
	})

	benchCollectionsSortedMapReadOnly(map => {
		let sum = 0
		for (const val of values) sum += map.get(val)
		return sum
	})
})

for (const [description, values] of Object.entries({
	'set 1000 random new keys': Array.from({ length: 1000 }, (_, i) => list[i * 100] + 1),
	'set 1000 random existing keys': Array.from({ length: 1000 }, (_, i) => list[i * 100 + 1]),
	'set a key 1000 times': Array(1000).fill(list[list.length >> 1]),
})) describe(description, () => {
	benchSortedMap(slt => {
		for (const val of values) slt.set(val, -val)
		return slt.size
	})

	benchMap(map => {
		for (const val of values) map.set(val, -val)
		return map.size
	})

	benchAVL(tree => {
		for (const val of values) tree.insert(val, -val)
		return tree.size
	})

	benchSplay(tree => {
		for (const val of values) tree.add(val, -val)
		return tree.size
	})

	benchFunctionalRedBlackTree(tree => {
		for (const val of values) tree = tree.find(val).update(-val)
		return tree.length
	})

	benchBTree(tree => {
		for (const val of values) tree.set(val, -val)
		return tree.size
	})

	benchTreeMap(map => {
		for (const val of values) map.set(val, -val)
		return map.size
	})

	benchOrderedMap(map => {
		for (const val of values) map.setElement(val, -val)
		return map.length
	})

	benchCollectionsSortedMap(map => {
		for (const val of values) map.set(val, -val)
		return map.length
	})
})

for (const [description, values] of Object.entries({
	'delete 1000 random elements': Array.from({ length: 1000 }, () => list[Math.floor(random() * list.length)]),
	'delete 1000 random nonexistent elements': Array.from({ length: 1000 }, () => Math.floor(random() * list.length) * 2 + 1),
})) describe(description, () => {
	benchSortedMap(slt => {
		for (const val of values) slt.delete(val)
		return slt.size
	})

	benchMap(map => {
		for (const val of values) map.delete(val)
		return map.size
	})

	benchAVL(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})

	benchSplay(tree => {
		for (const val of values) tree.remove(val)
		return tree.size
	})

	benchFunctionalRedBlackTree(tree => {
		for (const val of values) tree = tree.remove(val)
		return tree.length
	})

	benchBTree(tree => {
		for (const val of values) tree.delete(val)
		return tree.size
	})

	benchTreeMap(map => {
		for (const val of values) map.delete(val)
		return map.size
	})

	benchOrderedMap(map => {
		for (const val of values) map.eraseElementByKey(val)
		return map.length
	})

	benchCollectionsSortedMap(map => {
		for (const val of values) map.delete(val)
		return map.length
	})
})

describe('iterate over all key-value pairs', () => {
	benchSortedMapReadOnly(slt => {
		let sum = 0
		for (const [k, v] of slt) sum += k - v
		return sum
	})

	benchMapReadOnly(map => {
		const keys = Array.from(map.keys()).sort((a, b) => a - b)
		let sum = 0
		for (const k of keys) sum += k - map.get(k)!
		return sum
	})

	benchAVLReadOnly(tree => {
		let sum = 0
		tree.forEach(({ key, data }) => { sum += key - data! })
		return sum
	})

	benchSplayReadOnly(tree => {
		let sum = 0
		for (const { key, data } of tree) sum += key - data
		return sum
	})

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		tree.forEach((k, v) => { sum += k - v })
		return sum
	})

	benchBTreeReadOnly(tree => {
		let sum = 0
		for (const [k, v] of tree as unknown as Iterable<[number, number]>) sum += k - v
		return sum
	})

	benchTreeMapReadOnly(map => {
		let sum = 0
		for (const [k, v] of map) sum += k - v
		return sum
	})

	benchOrderedMapReadOnly(map => {
		let sum = 0
		for (const [k, v] of map) sum += k - v
		return sum
	})

	benchCollectionsSortedMapReadOnly(map => {
		let sum = 0
		map.forEach((v, k) => sum += k - v)
		return sum
	})
})

describe('test for 2000 elements about half of which are nonexistent', () => {
	const values = Array.from({ length: 2000 }, (_, i) => list[i * 100] + +(random() < .5))

	benchSortedMapReadOnly(slt => {
		let sum = 0
		for (const val of values) if (slt.has(val)) sum++
		return sum
	})

	benchMapReadOnly(map => {
		let sum = 0
		for (const val of values) if (map.has(val)) sum++
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

	benchFunctionalRedBlackTree(tree => {
		let sum = 0
		for (const val of values) if (tree.find(val).valid) sum++
		return sum
	})

	benchBTreeReadOnly(tree => {
		let sum = 0
		for (const val of values) if (tree.has(val)) sum++
		return sum
	})

	benchTreeMapReadOnly(map => {
		let sum = 0
		for (const val of values) if (map.has(val)) sum++
		return sum
	})

	benchOrderedMapReadOnly(map => {
		let sum = 0
		for (const val of values) if (!map.find(val).equals(map.end())) sum++
		return sum
	})

	benchCollectionsSortedMapReadOnly(map => {
		let sum = 0
		for (const val of values) if (map.has(val)) sum++
		return sum
	})
})
