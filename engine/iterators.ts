export type IterableIterator<T, TR = void, TN = void> = Iterator<T, TR, TN> & Iterable<T, TR, TN>;
export type Iterable<T, TR = void, TN = void> = {
    [Symbol.iterator](): IterableIterator<T, TR, TN>,
}

export type IntoIter<T, TR = void, TN = void> = Iterable<T, TR, TN> | IterableIterator<T, TR, TN>;
export type Iter<T, TR = void, TN = void> = IterableIterator<T, TR, TN>;

export function iter<T, TR, TN>(iterableOrIterator: IntoIter<T, TR, TN>): Iter<T, TR, TN> {
    if (typeof iterableOrIterator === "string") {
        return (iterableOrIterator as Iterable<T, TR, TN>)[Symbol.iterator]();
    } else if ("next" in iterableOrIterator) {
        return iterableOrIterator;
    } else {
        return iterableOrIterator[Symbol.iterator]();
    }
}


// --- COLLECTORS ---

export function collect<T>(iter: Iter<T>): T[] {
    return [...iter];
}

export function join(iter: Iter<string>, join_str = ""): string {
    return collect(iter).join(join_str);
}

export function all(iter: Iter<boolean>): boolean {
    for (const v of iter) {
        if (!v) {
            return false;
        }
    }
    return true;
}

export function any(iter: Iter<boolean>): boolean {
    for (const v of iter) {
        if (v) {
            return true;
        }
    }
    return false;
}

// --- TRANSFORMERS ---

export type MapFn<I, T> = (value: I, index: number) => T;
export function* map<I, T>(iter: Iter<I>, fn: MapFn<I, T>): Iter<T> {
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

// --- SPECIAL ---

export function* flip<T>(iters: Iter<T>[]): Iter<T[]> {
    while (true) {
        const row = [];
        for (const iter of iters) {
            const next = iter.next();
            if (next.done) {
                break;
            }
            row.push(next.value);
        }
        yield row;
    }
}

export function* chain<T>(iter: Iter<T>, iter2: Iter<T>): Iter<T> {
    yield* iter;
    yield* iter2;
}

export function* zip<A, B>(iter: Iter<A>, iter2: Iter<B>): Iter<[A, B]> {
    yield* flip<A | B>([iter, iter2]) as Iter<[A, B]>;
}