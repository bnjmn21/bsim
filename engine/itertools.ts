type IterableIterator<T, TR = void, TN = void> = Iterator<T, TR, TN> & Iterable<T, TR, TN>;
type Iterable<T, TR = void, TN = void> = {
    [Symbol.iterator](): IterableIterator<T, TR, TN>,
}

type Iter<T, TR = void, TN = void> = Iterable<T, TR, TN> | IterableIterator<T, TR, TN>;
type Gen<T, TR = void, TN = void> = IterableIterator<T, TR, TN>;
export function iterify<T, TR, TN>(iterableOrIterator: Iter<T, TR, TN>): Gen<T, TR, TN> {
    if ("next" in iterableOrIterator) {
        return iterableOrIterator;
    } else {
        return iterableOrIterator[Symbol.iterator]();
    }
}

export function collect<T>(iter: Gen<T>): T[] {
    return [...iterify(iter)];
}

export function* take<T>(iter: Gen<T>, amount: number): Gen<T> {
    const _iter = iterify(iter);
    for (let i = 0; i < amount; i++) {
        const next = _iter.next();
        if (next.done) {
            return;
        }
        yield next.value;
    }
}

export function* takeExact<T>(iter: Gen<T>, amount: number): Gen<T> {
    const _iter = iterify(iter);
    for (let i = 0; i < amount; i++) {
        const next = _iter.next();
        if (next.done) {
            throw new Error("Reached the end of the iterable.");
        }
        yield next.value;
    }
}

export function* takeExactOrZero<T>(iter: Gen<T>, amount: number): Gen<T> {
    const _iter = iterify(iter);
    for (let i = 0; i < amount; i++) {
        const next = _iter.next();
        if (next.done) {
            if (i !== 0) {
                throw new Error("Reached the end of the iterable.");
            } else {
                return;
            }
        }
        yield next.value;
    }
}

export function* blocks<T>(array: Gen<T>, size: number): Gen<T[]> {
    while (true) {
        const val = collect(take(array, size));
        if (val.length === 0) {
            return;
        }
        yield val;
    }
}

export function* blocksExact<T>(array: Gen<T>, size: number): Gen<T[]> {
    try {
        while (true) {
            const val = collect(takeExactOrZero(array, size));
            if (val.length === 0) {
                return;
            }
            yield val;
        }
    } catch {
        throw new Error("The length of the iterable must be a multiple of the size");
    }
}

export function pairs<T>(array: Gen<T>): Gen<[T, T] | [T]> {
    return blocks(array, 2) as Gen<[T, T] | [T]>;
}

export function pairsExact<T>(array: Gen<T>): Gen<[T, T]> {
    return blocksExact(array, 2) as Gen<[T, T]>;
}