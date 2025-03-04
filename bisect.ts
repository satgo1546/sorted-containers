export const bisectLeft = <T>(a: T[], x: T, cmp: (a: T, b: T) => number): number => {
	let lo = 0, hi = a.length
	while (lo < hi) {
		const mid = lo + (hi - lo >>> 1)
		if (cmp(a[mid], x) < 0) {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

export const bisectRight = <T>(a: T[], x: T, cmp: (a: T, b: T) => number): number => {
	let lo = 0, hi = a.length
	while (lo < hi) {
		const mid = lo + (hi - lo >>> 1)
		if (cmp(x, a[mid]) < 0) {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}

export const insort = <T>(a: T[], x: T, cmp: (a: T, b: T) => number): void => {
	a.splice(bisectRight(a, x, cmp), 0, x)
}
