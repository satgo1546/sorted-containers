import { Bench } from 'tinybench'

let bench: Bench
export function describe(name: string, fn: () => void) {
	console.log(name)
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

export function makeStockAndBench<T>(name: string, factory: () => T): [T, (fn: (x: T) => void) => void, (fn: (x: T) => void) => void] {
	const stock = factory()
	return [stock, fn => {
		bench.add(name, () => fn(stock))
		console.log(fn(stock), name)
	}, fn => {
		let x: T
		bench.add(name, () => fn(x), {
			beforeEach() {
				x = factory()
			},
		})
		console.log(fn(factory()), name)
	}]
}
