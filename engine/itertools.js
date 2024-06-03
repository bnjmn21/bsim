export function iterify(iterableOrIterator) {
    if ("next" in iterableOrIterator) {
        return iterableOrIterator;
    }
    else {
        return iterableOrIterator[Symbol.iterator]();
    }
}
export function collect(iter) {
    return [...iterify(iter)];
}
export function* take(iter, amount) {
    const _iter = iterify(iter);
    for (let i = 0; i < amount; i++) {
        const next = _iter.next();
        if (next.done) {
            return;
        }
        yield next.value;
    }
}
export function* takeExact(iter, amount) {
    const _iter = iterify(iter);
    for (let i = 0; i < amount; i++) {
        const next = _iter.next();
        if (next.done) {
            throw new Error("Reached the end of the iterable.");
        }
        yield next.value;
    }
}
export function* takeExactOrZero(iter, amount) {
    const _iter = iterify(iter);
    for (let i = 0; i < amount; i++) {
        const next = _iter.next();
        if (next.done) {
            if (i !== 0) {
                throw new Error("Reached the end of the iterable.");
            }
            else {
                return;
            }
        }
        yield next.value;
    }
}
export function* blocks(array, size) {
    while (true) {
        const val = collect(take(array, size));
        if (val.length === 0) {
            return;
        }
        yield val;
    }
}
export function* blocksExact(array, size) {
    try {
        while (true) {
            const val = collect(takeExactOrZero(array, size));
            if (val.length === 0) {
                return;
            }
            yield val;
        }
    }
    catch {
        throw new Error("The length of the iterable must be a multiple of the size");
    }
}
export function pairs(array) {
    return blocks(array, 2);
}
export function pairsExact(array) {
    return blocksExact(array, 2);
}
