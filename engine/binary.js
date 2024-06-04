import { blocks, blocksExact, blocksFill, collect, flat, iterify, join, map, pairsExact, takeWhile } from "./itertools.js";
/**
 * An Object for creating binary files.
 * Uses Big Endian encoding.
 */
export class Writer {
    buf = [];
    constructor() { }
    bytes(d) {
        this.buf.push(...d);
    }
    /**
     * Appends an 8-bit unsigned integer to the array.
     */
    u8(d) {
        if (d < 0 || d >= (1 << 8) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeU8(d);
        return this;
    }
    /**
     * Appends an 8-bit unsigned integer to the array, without performing safety checks.
     */
    unsafeU8(d) {
        this.buf.push(d);
        return this;
    }
    /**
     * Appends an 8-bit signed integer to the array.
     */
    i8(d) {
        if (d < -(1 << 7) || d >= (1 << 7) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeI8(d);
        return this;
    }
    /**
     * Appends an 8-bit signed integer to the array, without performing safety checks.
     */
    unsafeI8(d) {
        this.buf.push(d < 0 ? (-d) + (1 << 7) : d);
        return this;
    }
    bool(d) {
        this.unsafeU8(d ? 1 : 0);
        return this;
    }
    /**
     * Appends an 16-bit unsigned integer to the array.
     */
    u16(d) {
        if (d < 0 || d >= (1 << 16) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeU16(d);
        return this;
    }
    /**
     * Appends an 16-bit unsigned integer to the array, without performing safety checks.
     */
    unsafeU16(d) {
        this.buf.push(d & 0xff);
        this.buf.push((d >> 8) & 0xff);
        return this;
    }
    /**
     * Appends an 16-bit signed integer to the array.
     */
    i16(d) {
        if (d < -(1 << 15) || d >= (1 << 15) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeI16(d);
        return this;
    }
    /**
     * Appends an 16-bit signed integer to the array, without performing safety checks.
     */
    unsafeI16(d) {
        const complement = d < 0 ? (-d) + (1 << 15) : d;
        this.buf.push(complement & 0xff);
        this.buf.push((complement >> 8) & 0xff);
        return this;
    }
    /**
     * Appends an 32-bit signed integer to the array.
     */
    i32(d) {
        if (d < -Math.pow(2, 31) || d >= Math.pow(2, 31) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeI32(d);
        return this;
    }
    /**
     * Appends an 32-bit signed integer to the array, without performing safety checks.
     */
    unsafeI32(d) {
        this.bytes(new Uint8Array(new Int32Array([d]).buffer));
        return this;
    }
    /**
     * Appends an 32-bit float to the array.
     */
    f32(d) {
        this.bytes(new Uint8Array(new Float32Array([d]).buffer));
        return this;
    }
    /**
     * Appends an 32-bit float to the array.
     */
    f64(d) {
        this.bytes(new Uint8Array(new Float64Array([d]).buffer));
        return this;
    }
    /**
     * Appends a UTF-8 string to the array. The encoding begins with the length as an u32.
     */
    string(d) {
        const bytes = new TextEncoder().encode(d);
        this.i32(bytes.buffer.byteLength);
        this.bytes(bytes);
        return this;
    }
    /**
     * Appends another writer to this writer.
     */
    append(writer) {
        this.buf.push(...writer.buf);
        return this;
    }
    /**
     * Appends an array of writers to this array.
     * The format is:
     * - amount of elements: u32
     * - elements: ...
     */
    array(d) {
        this.i32(d.length);
        for (const element of d) {
            this.append(element);
        }
    }
    /**
     * Appends an array of writers to this array.
     * The array stores the positions of all elements, meaning that each one can be parsed without having to parse the previous ones.
     * The format is:
     * - amount of elements: u32
     * - positions of elements relative to start of the array excluding the first: u32[]
     * - size of the array in bytes: u32
     * - elements: ...
     */
    indexableArray(d) {
        this.i32(d.length);
        let pos = 4 + (4 * d.length);
        let first = true;
        for (const element of d) {
            if (!first) {
                this.i32(pos);
            }
            else {
                first = false;
            }
            pos += element.buf.length;
        }
        this.i32(pos);
        for (const element of d) {
            this.append(element);
        }
        return this;
    }
    /**
     * Appends a map of writers to this array.
     * The map stores the positions of all elements, meaning that each one can be parsed without having to parse the previous ones.
     * The format is:
     * - amount of keys and elements combined: u32
     * - positions of keys and elements respectively, excluding the first key: u32[]
     * - size of the map in bytes: u32
     * - keys and elements: ...
     */
    indexableMap(d) {
        this.indexableArray([...d.entries()].flat());
        return this;
    }
    intoUint8Array() {
        return new Uint8Array(this.buf);
    }
}
export class Reader {
    pos = 0;
    buf;
    constructor(data) {
        this.buf = data;
    }
    skip(n) {
        this.pos += n;
    }
    bytes(n) {
        return this.buf.slice(this.pos, this.pos += n);
    }
    lookAhead(n) {
        return this.buf.slice(this.pos, this.pos + n);
    }
    u8() {
        return this.bytes(1)[0];
    }
    i8() {
        const byte = this.bytes(1)[0];
        return (byte & 127) - (byte & 128);
    }
    bool() {
        return this.bytes(1)[0] > 0;
    }
    u16() {
        const bytes = this.bytes(2);
        return (bytes[0] << 8) + bytes[1];
    }
    i16() {
        const bytes = this.bytes(2);
        return (((bytes[0] & 127) << 8) + bytes[1]) - ((bytes[0] & 128) << 8);
    }
    i32() {
        return new Int32Array(this.bytes(4).buffer)[0];
    }
    f32() {
        return new Float32Array(new Uint8Array(this.bytes(4)).buffer)[0];
    }
    f64() {
        return new Float64Array(new Uint8Array(this.bytes(8)).buffer)[0];
    }
    string() {
        const len = this.i32();
        return new TextDecoder().decode(this.bytes(len));
    }
    get(n) {
        return new Reader(this.bytes(n));
    }
    lookAheadGet(n) {
        return new Reader(this.lookAhead(n));
    }
    array(callback) {
        const length = this.i32();
        for (let i = 0; i < length; i++) {
            const b = this.lookAheadGet(this.buf.length - this.pos);
            callback(b);
            this.skip(b.pos);
        }
    }
    indexableArray() {
        const startPos = this.pos;
        const length = this.i32();
        const elementEndPositions = [];
        for (let i = 0; i < length; i++) {
            elementEndPositions.push(this.i32());
        }
        const elements = [];
        for (let i = 0; i < length; i++) {
            const elementSize = elementEndPositions[i] - (this.pos - startPos);
            elements.push(this.get(elementSize));
        }
        return elements;
    }
    indexableMap() {
        return new Map(pairsExact(iterify(this.indexableArray())));
    }
}
const B64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
/**
 * Encodes an `Uint8Array` into Base64 using the URL-safe alphabet.
 *
 * Based on: https://datatracker.ietf.org/doc/html/rfc4648
 */
export function b64Encode(array) {
    const blocksOf3 = blocks(iterify(array), 3);
    const unpadded = join(map(blocksOf3, bytes => {
        const bin = join(map(bytes, v => v.toString(2).padStart(8, "0")));
        const sextets = map(blocksFill(iterify(bin), 6, "0"), v => parseInt(join(v), 2));
        return join(map(sextets, v => B64URL_ALPHABET[v]));
    }));
    const paddedB64Blocks = blocksFill(iterify(unpadded), 4, "=");
    return join(flat(paddedB64Blocks));
}
/**
 * Decodes a Base64-string into an `Uint8Array` using the URL-safe alphabet.
 *
 * Based on: https://datatracker.ietf.org/doc/html/rfc4648
 */
export function b64Decode(b64) {
    const iter = iterify(b64);
    const blocksOf4 = map(blocksExact(iter, 4), v => {
        const unpadded = join(takeWhile(v, v => v !== "="));
        const bits = join(map(iterify(unpadded), v => B64URL_ALPHABET.indexOf(v).toString(2).padStart(6, "0")));
        const bytes = takeWhile(map(blocks(iterify(bits), 8), v => collect(v)), v => v.length === 8);
        return map(bytes, v => parseInt(join(iterify(v)), 2));
    });
    return new Uint8Array(flat(blocksOf4));
}
/**
 * A simple and fast hasher for strings that is *NOT* cryptographically safe.
 */
export function fastHash(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
