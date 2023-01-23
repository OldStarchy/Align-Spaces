export class LazyIterator<T> implements Iterable<T> {
	constructor(private readonly iterable: Iterable<T>) {}

	*[Symbol.iterator](): Iterator<T> {
		for (const value of this.iterable) {
			yield value;
		}
	}

	map<U>(mapper: (value: T) => U): LazyIterator<U> {
		return new LazyIterator(
			((self) => ({
				*[Symbol.iterator](): Iterator<U> {
					for (const value of self) {
						yield mapper(value);
					}
				},
			}))(this)
		);
	}

	flatMap<U>(mapper: (value: T) => Iterable<U>): LazyIterator<U> {
		return new LazyIterator(
			((self) => ({
				*[Symbol.iterator](): Iterator<U> {
					for (const value of self) {
						for (const mapped of mapper(value)) {
							yield mapped;
						}
					}
				},
			}))(this)
		);
	}

	find(predicate: (value: T) => boolean): T | undefined {
		for (const value of this) {
			if (predicate(value)) {
				return value;
			}
		}
		return undefined;
	}

	findIndex(predicate: (value: T) => boolean): number {
		let index = 0;
		for (const value of this) {
			if (predicate(value)) {
				return index;
			}
			index++;
		}
		return -1;
	}

	some(predicate: (value: T) => boolean): boolean {
		for (const value of this) {
			if (predicate(value)) {
				return true;
			}
		}
		return false;
	}

	filter(predicate: (value: T) => boolean): LazyIterator<T> {
		const self = this;
		return new LazyIterator(
			(function* () {
				for (const value of self) {
					if (predicate(value)) {
						yield value;
					}
				}
			})()
		);
	}
}
