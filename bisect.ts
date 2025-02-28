export function bisectLeft<T>(a: T[], x: T, lo = 0, hi = a.length): number {
	while (lo < hi) {
		const mid = lo + (hi - lo >>> 1)
		if (a[mid] < x) {
			lo = mid + 1
		} else {
			hi = mid
		}
	}
	return lo
}

export function bisectRight<T>(a: T[], x: T, lo = 0, hi = a.length): number {
	while (lo < hi) {
		const mid = lo + (hi - lo >>> 1)
		if (x < a[mid]) {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}

export function insort<T>(a: T[], x: T): void {
	a.splice(bisectRight(a, x), 0, x)
}
