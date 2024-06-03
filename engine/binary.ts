import { iterify, pairsExact } from "./itertools.js";

/**
 * An Object for creating binary files.
 * Uses Big Endian encoding.
 */
export class Writer {
    buf: number[] = [];
    constructor() {}

    bytes(d: Uint8Array) {
        this.buf.push(...d);
    }

    /**
     * Appends an 8-bit unsigned integer to the array.
     */
    u8(d: number) {
        if (d < 0 || d >= (1 << 8) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeU8(d);
        return this;
    }

    /**
     * Appends an 8-bit unsigned integer to the array, without performing safety checks.
     */
    unsafeU8(d: number) {
        this.buf.push(d);
        return this;
    }

    /**
     * Appends an 8-bit signed integer to the array.
     */
    i8(d: number) {
        if (d < -(1 << 7) || d >= (1 << 7) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeI8(d);
        return this;
    }

    /**
     * Appends an 8-bit signed integer to the array, without performing safety checks.
     */
    unsafeI8(d: number) {
        this.buf.push(d < 0 ? (-d) + (1 << 7) : d);
        return this;
    }

    bool(d: boolean) {
        this.unsafeU8(d ? 1 : 0);
        return this;
    }

    /**
     * Appends an 16-bit unsigned integer to the array.
     */
    u16(d: number) {
        if (d < 0 || d >= (1 << 16) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeU16(d);
        return this;
    }

    /**
     * Appends an 16-bit unsigned integer to the array, without performing safety checks.
     */
    unsafeU16(d: number) {
        this.buf.push(d & 0xff);
        this.buf.push((d >> 8) & 0xff);
        return this;
    }

    /**
     * Appends an 16-bit signed integer to the array.
     */
    i16(d: number) {
        if (d < -(1 << 15) || d >= (1 << 15) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeI16(d);
        return this;
    }

    /**
     * Appends an 16-bit signed integer to the array, without performing safety checks.
     */
    unsafeI16(d: number) {
        const complement = d < 0 ? (-d) + (1 << 15) : d;
        this.buf.push(complement & 0xff);
        this.buf.push((complement >> 8) & 0xff);
        return this;
    }

    /**
     * Appends an 32-bit signed integer to the array.
     */
    i32(d: number) {
        if (d < -Math.pow(2, 31) || d >= Math.pow(2, 31) || d % 1 !== 0 || !isFinite(d)) {
            throw new Error("Invalid input.");
        }
        this.unsafeI32(d);
        return this;
    }

    /**
     * Appends an 32-bit signed integer to the array, without performing safety checks.
     */
    unsafeI32(d: number) {
        this.bytes(new Uint8Array(new Int32Array([d]).buffer));
        return this;
    }

    /**
     * Appends an 32-bit float to the array.
     */
    f32(d: number) {
        this.bytes(new Uint8Array(new Float32Array([d]).buffer));
        return this;
    }

    /**
     * Appends an 32-bit float to the array.
     */
    f64(d: number) {
        this.bytes(new Uint8Array(new Float64Array([d]).buffer));
        return this;
    }

    /**
     * Appends a UTF-8 string to the array. The encoding begins with the length as an u32.
     */
    string(d: string) {
        const bytes = new TextEncoder().encode(d);
        this.i32(bytes.buffer.byteLength);
        this.bytes(bytes);
        return this;
    }

    /**
     * Appends another writer to this writer.
     */
    append(writer: Writer) {
        this.buf.push(...writer.buf);
        return this;
    }

    /**
     * Appends an array of writers to this array.
     * The format is:
     * - amount of elements: u32
     * - elements: ...
     */
    array(d: Writer[]) {
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
    indexableArray(d: Writer[]) {
        this.i32(d.length);
        let pos = 4 + (4*d.length);
        let first = true;
        for (const element of d) {
            if (!first) {
                this.i32(pos);
            } else {
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
    indexableMap(d: Map<Writer, Writer>) {
        this.indexableArray([...d.entries()].flat());
        return this;
    }

    intoUint8Array(): Uint8Array {
        return new Uint8Array(this.buf);
    }
}

export class Reader {
    pos: number = 0;
    buf: Uint8Array;
    constructor (data: Uint8Array) {
        this.buf = data;
    }

    skip(n: number) {
        this.pos += n;
    }

    bytes(n: number): Uint8Array {
        return this.buf.slice(this.pos, this.pos += n);
    }

    lookAhead(n: number): Uint8Array {
        return this.buf.slice(this.pos, this.pos + n);
    }

    u8(): number {
        return this.bytes(1)[0];
    }

    i8(): number {
        const byte = this.bytes(1)[0];
        return (byte & 0b0111_1111) - (byte & 0b1000_0000);
    }

    bool(): boolean {
        return this.bytes(1)[0] > 0;
    }

    u16(): number {
        const bytes = this.bytes(2);
        return (bytes[0] << 8) + bytes[1];
    }

    i16(): number {
        const bytes = this.bytes(2);
        return (((bytes[0] & 0b0111_1111) << 8) + bytes[1]) - ((bytes[0] & 0b1000_0000) << 8);
    }

    i32(): number {
        return new Int32Array(this.bytes(4).buffer)[0];
    }

    f32(): number {
        return new Float32Array(new Uint8Array(this.bytes(4)).buffer)[0];
    }
    
    f64(): number {
        return new Float64Array(new Uint8Array(this.bytes(8)).buffer)[0];
    }

    string(): string {
        const len = this.i32();
        return new TextDecoder().decode(this.bytes(len));
    }

    get(n: number): Reader {
        return new Reader(this.bytes(n));
    }

    lookAheadGet(n: number): Reader {
        return new Reader(this.lookAhead(n));
    }

    array(callback: (r: Reader) => void) {
        const length = this.i32();
        for (let i = 0; i < length; i++) {
            const b = this.lookAheadGet(this.buf.length - this.pos);
            callback(b);
            this.skip(b.pos);
        }
    }

    indexableArray(): Reader[] {
        const startPos = this.pos;
        const length = this.i32();
        const elementEndPositions: number[] = [];
        for (let i = 0; i < length; i++) {
            elementEndPositions.push(this.i32());
        }
        const elements: Reader[] = [];
        for (let i = 0; i < length; i++) {
            const elementSize = elementEndPositions[i] - (this.pos - startPos);
            elements.push(this.get(elementSize));
        }
        return elements;
    }

    indexableMap(): Map<Reader, Reader> {
        return new Map(pairsExact(iterify(this.indexableArray())));
    }
}