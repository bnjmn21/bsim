const doTests = true;
export function test(name, fn) {
    if (doTests) {
        console.log(`Running test: ${name}`);
        fn();
    }
}
export function assert(condition) {
    if (!condition) {
        throw new Error("Assertion failed");
    }
}
export function assert_eq(a, b) {
    assert(a === b);
}
export function assert_ne(a, b) {
    assert(a !== b);
}
