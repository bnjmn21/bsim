export function iterify(iterableOrIterator) {
    if (typeof iterableOrIterator === "string") {
        return iterableOrIterator[Symbol.iterator]();
    }
    else if ("next" in iterableOrIterator) {
        return iterableOrIterator;
    }
    else {
        return iterableOrIterator[Symbol.iterator]();
    }
}
export function collect(iter) {
    return [...iterify(iter)];
}
export function join(iter) {
    return collect(iter).join("");
}
export function* map(iter, fn) {
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
export function* mapIter(iter, fn, ...args) {
    yield* map(iter, v => fn(v, ...args));
}
export function* flat(iter) {
    while (true) {
        const next = iter.next();
        if (next.done) {
            break;
        }
        if (typeof next.value === "object" && next.value !== null && Symbol.iterator in next.value) {
            yield* flat(iterify(next.value));
        }
        else {
            yield next.value;
        }
    }
}
export function* fill(iter, minSize, fill) {
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
export function* fillFn(iter, minSize, fill) {
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
export function* fillExact(iter, exactSize, fill) {
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
export function* fillExactFn(iter, exactSize, fill) {
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
export function* take(iter, amount) {
    for (let i = 0; i < amount; i++) {
        const next = iter.next();
        if (next.done) {
            return;
        }
        yield next.value;
    }
}
export function* takeExact(iter, amount) {
    for (let i = 0; i < amount; i++) {
        const next = iter.next();
        if (next.done) {
            throw new Error("Reached the end of the iterable.");
        }
        yield next.value;
    }
}
export function* takeExactOrZero(iter, amount) {
    for (let i = 0; i < amount; i++) {
        const next = iter.next();
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
export function* takeWhile(iter, predicate) {
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
export function* blocks(iter, size) {
    while (true) {
        const val = collect(take(iter, size));
        if (val.length === 0) {
            return;
        }
        yield iterify(val);
    }
}
export function* blocksExact(iter, size) {
    try {
        while (true) {
            const val = collect(takeExactOrZero(iter, size));
            if (val.length === 0) {
                return;
            }
            yield iterify(val);
        }
    }
    catch {
        throw new Error("The length of the iterable must be a multiple of the size");
    }
}
export function* blocksFill(iter, size, fill) {
    yield* mapIter(blocks(iter, size), fillExact, size, fill);
}
export function pairs(iter) {
    return blocks(iter, 2);
}
export function pairsExact(iter) {
    return blocksExact(iter, 2);
}
