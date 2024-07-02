const doTests = true;

export function test(name: string, fn: () => void) {
    if (doTests) {
        console.log(`Running test: ${name}`);
        fn();
    }
}

export function assert(condition: boolean) {
    if (!condition) {
        throw new Error("Assertion failed");
    }
}

export function assert_eq<T>(a: T, b: T) {
    assert(a === b);
}

export function assert_ne<T>(a: T, b: T) {
    assert(a !== b);
}