export function iter(iterableOrIterator) {
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
// --- COLLECTORS ---
export function collect(iter) {
    return [...iter];
}
export function join(iter, join_str = "") {
    return collect(iter).join(join_str);
}
export function all(iter) {
    for (const v of iter) {
        if (!v) {
            return false;
        }
    }
    return true;
}
export function any(iter) {
    for (const v of iter) {
        if (v) {
            return true;
        }
    }
    return false;
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
// --- SPECIAL ---
export function* flip(iters) {
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
export function* chain(iter, iter2) {
    yield* iter;
    yield* iter2;
}
export function* zip(iter, iter2) {
    yield* flip([iter, iter2]);
}
