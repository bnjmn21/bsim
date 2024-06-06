type IterableIterator<T, TR = void, TN = void> = Iterator<T, TR, TN> & Iterable<T, TR, TN>;
type Iterable<T, TR = void, TN = void> = {
    [Symbol.iterator](): IterableIterator<T, TR, TN>,
}

type IntoIter<T, TR = void, TN = void> = Iterable<T, TR, TN> | IterableIterator<T, TR, TN>;
export type Iter<T, TR = void, TN = void> = IterableIterator<T, TR, TN>;
export function iterify<T, TR, TN>(iterableOrIterator: IntoIter<T, TR, TN>): Iter<T, TR, TN> {
    if (typeof iterableOrIterator === "string") {
        return (iterableOrIterator as Iterable<T, TR, TN>)[Symbol.iterator]();
    } else if ("next" in iterableOrIterator) {
        return iterableOrIterator;
    } else {
        return iterableOrIterator[Symbol.iterator]();
    }
}

export function collect<T>(iter: Iter<T>): T[] {
    return [...iterify(iter)];
}

export function join(iter: Iter<string>): string {
    return collect(iter).join("");
}

export type Map<I, T> = (value: I, index: number) => T;
export function* map<I, T>(iter: Iter<I>, fn: Map<I, T>): Iter<T> {
    let i = 0;
    while (true) {
        const next = iter.next();
        if (next.done) {
            break;
        }
        yield fn(next.value, i);
        i++;
    }
}

export type IterFn<I, T, A extends any[]> = (iter: Iter<I>, ...args: A) => Iter<T>; 
export function* mapIter<I, T, A extends any[]>(iter: Iter<Iter<I>>, fn: IterFn<I, T, A>, ...args: A): Iter<Iter<T>> {
    yield* map(iter, v => fn(v, ...args));
}

export type DeepIter<T> = Iterator<T | DeepIter<T>, void, void> & {
    [Symbol.iterator](): DeepIter<T>
};
export function* flat<T>(iter: DeepIter<T>): Iter<T> {
    while (true) {
        const next = iter.next();
        if (next.done) {
            break;
        }
        if (typeof next.value === "object" && next.value !== null && Symbol.iterator in next.value) {
            yield* flat(iterify(next.value));
        } else {
            yield next.value;
        }
    }
}

export function* fill<T>(iter: Iter<T>, minSize: number, fill: T): Iter<T> {
    let i = 0;
    while (true) {
        const next = iter.next();
        if (next.done) {
            break;
        }
        yield next.value;
        i++;
    }
    for (; i < minSize; i++) {
        yield fill;
    }
}

export type FillFunction<T> = (i: number) => T;
export function* fillFn<T>(iter: Iter<T>, minSize: number, fill: FillFunction<T>): Iter<T> {
    let i = 0;
    while (true) {
        const next = iter.next();
        if (next.done) {
            break;
        }
        yield next.value;
        i++;
    }
    for (; i < minSize; i++) {
        yield fill(i);
    }
}

export function* fillExact<T>(iter: Iter<T>, exactSize: number, fill: T): Iter<T> {
    let i = 0;
    while (true) {
        const next = iter.next();
        if (next.done) {
            break;
        }
        if (i >= exactSize) {
            throw new Error("Iterator is too large");
        }
        yield next.value;
        i++;
    }
    for (; i < exactSize; i++) {
        yield fill;
    }
}

export function* fillExactFn<T>(iter: Iter<T>, exactSize: number, fill: FillFunction<T>): Iter<T> {
    let i = 0;
    while (true) {
        const next = iter.next();
        if (next.done) {
            break;
        }
        if (i >= exactSize) {
            throw new Error("Iterator is too large");
        }
        yield next.value;
        i++;
    }
    for (; i < exactSize; i++) {
        yield fill(i);
    }
}

export function* take<T>(iter: Iter<T>, amount: number): Iter<T> {
    for (let i = 0; i < amount; i++) {
        const next = iter.next();
        if (next.done) {
            return;
        }
        yield next.value;
    }
}

export function* takeExact<T>(iter: Iter<T>, amount: number): Iter<T> {
    for (let i = 0; i < amount; i++) {
        const next = iter.next();
        if (next.done) {
            throw new Error("Reached the end of the iterable.");
        }
        yield next.value;
    }
}

export function* takeExactOrZero<T>(iter: Iter<T>, amount: number): Iter<T> {
    for (let i = 0; i < amount; i++) {
        const next = iter.next();
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

export type TakePredicate<T> = (value: T, index: number) => boolean;
export function* takeWhile<T>(iter: Iter<T>, predicate: TakePredicate<T>): Iter<T> {
    let i = 0;
    while (true) {
        const next = iter.next();
        if (next.done || !predicate(next.value, i)) {
            return;
        }
        yield next.value;
        i++;
    }
}

export function* blocks<T>(iter: Iter<T>, size: number): Iter<Iter<T>> {
    while (true) {
        const val = collect(take(iter, size));
        if (val.length === 0) {
            return;
        }
        yield iterify(val);
    }
}

export function* blocksExact<T>(iter: Iter<T>, size: number): Iter<Iter<T>> {
    try {
        while (true) {
            const val = collect(takeExactOrZero(iter, size));
            if (val.length === 0) {
                return;
            }
            yield iterify(val);
        }
    } catch {
        throw new Error("The length of the iterable must be a multiple of the size");
    }
}

export function* blocksFill<T>(iter: Iter<T>, size: number, fill: T): Iter<Iter<T>> {
    yield* mapIter(blocks(iter, size), fillExact, size, fill);
}

export function pairs<T>(iter: Iter<T>): Iter<[T, T] | [T]> {
    return blocks(iter, 2) as Iter<[T, T] | [T]>;
}

export function pairsExact<T>(iter: Iter<T>): Iter<[T, T]> {
    return blocksExact(iter, 2) as Iter<[T, T]>;
}