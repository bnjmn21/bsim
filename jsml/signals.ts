export interface Signal<T> {
    get(): T;
    listenForCalls(): void;
    hasGottenCalls(): boolean;
    addChild(childSignal: Computed<any>): void;
    hasChanged(): boolean;
    addEffect(effect: () => void): void;
}

export function isSignal<T>(signal: T): T extends Signal<any> ? true : false {
    if (signal instanceof Value || signal instanceof Computed) {
        return true as (T extends Signal<any> ? true : false);
    }
    return false as (T extends Signal<any> ? true : false);
}

export class Value<T> implements Signal<T> {
    listening: boolean = false;
    calledWhileListening: boolean = false;
    value: T;
    childSignals: Computed<any>[] = [];
    signalsInstance: Signals;
    changed: boolean = false;
    effects: (() => void)[] = [];

    constructor(signalsInstance: Signals, value: T) {
        this.value = value;
        this.signalsInstance = signalsInstance;
    }

    set(value: T) {
        const oldValue = this.value;
        this.value = value;
        if (oldValue !== value) {
            for (const child of this.childSignals) {
                child.setDirty();
            }
            this.changed = true;
            for (const effect of this.effects) {
                effect();
            }
        }
    }

    get() {
        if (this.listening)
            this.calledWhileListening = true;
        return this.value;
    }

    listenForCalls() {
        this.listening = true;
        this.calledWhileListening = false;
    }

    hasGottenCalls() {
        this.listening = false;
        return this.calledWhileListening;
    }

    addChild(childSignal: Computed<any>) {
        this.childSignals.push(childSignal);
    }

    hasChanged() {
        const changed = this.changed;
        this.changed = false;
        return changed;
    }

    addEffect(effect: () => void): void {
        this.effects.push(effect);
    }
}

export class Computed<T> implements Signal<T> {
    listening: boolean = false;
    calledWhileListening: boolean = false;
    computeFn: () => T;
    value: T;
    childSignals: Computed<any>[] = [];
    dirty: boolean = false;
    changed: boolean = false;
    signalsInstance: Signals;
    effects: (() => void)[] = [];

    constructor(signalsInstance: Signals, computeFn: () => T) {
        this.computeFn = computeFn;
        this.signalsInstance = signalsInstance;
        this.value = signalsInstance.computeAndAddToTree(this);
    }

    get() {
        if (this.listening)
            this.calledWhileListening = true;
        if (this.dirty) {
            this.value = this.computeFn();
            this.dirty = false;
            this.changed = true;
            return this.value;
        }
        return this.value;
    }

    isDirty() {
        return this.dirty;
    }

    setDirty() {
        this.dirty = true;
        this.changed = true;
        for (const effect of this.effects) {
            effect();
        }
    }

    listenForCalls() {
        this.listening = true;
        this.calledWhileListening = false;
    }
    
    hasGottenCalls() {
        this.listening = false;
        return this.calledWhileListening;
    }

    addChild(childSignal: Computed<any>) {
        this.childSignals.push(childSignal);
    }

    hasChanged() {
        const changed = this.changed;
        this.changed = false;
        return changed;
    }

    addEffect(effect: () => void): void {
        this.effects.push(effect);
    }
}

export class Signals {
    static Value = Value;
    static Computed = Computed;

    signals: Signal<any>[] = [];

    constructor() {
    }

    value<T>(value: T): Value<T> {
        const signal = new Signals.Value(this, value);
        this.signals.push(signal);
        return signal;
    }

    computed<T>(computeFn: () => T): Computed<T> {
        const signal = new Signals.Computed(this, computeFn);
        this.signals.push(signal);
        return signal;
    }

    auto<T>(computeFn: () => T): Signal<T> {
        const isRoot = this.isRoot(computeFn);
        if (isRoot) {
            return this.value(computeFn());
        } else {
            return this.computed(computeFn);
        }
    }

    computeAndAddToTree<T>(signal: Computed<T>): T {
        for (const otherSignal of this.signals) {
            otherSignal.listenForCalls();
        }

        const result = signal.computeFn();
        for (const otherSignal of this.signals) {
            if (otherSignal.hasGottenCalls()) {
                otherSignal.addChild(signal);
            }
        }

        return result;
    }

    isRoot(computeFn: () => any): boolean {
        for (const otherSignal of this.signals) {
            otherSignal.listenForCalls();
        }
        computeFn();
        let isNotRoot = false;
        for (const otherSignal of this.signals) {
            if (otherSignal.hasGottenCalls()) {
                isNotRoot = true;
            }
        }

        return !isNotRoot;
    }

    getCalledSignals(computeFn: () => any): Signal<any>[] {
        for (const otherSignal of this.signals) {
            otherSignal.listenForCalls();
        }
        computeFn();
        const calledSignals = [];
        for (const otherSignal of this.signals) {
            if (otherSignal.hasGottenCalls()) {
                calledSignals.push(otherSignal);
            }
        }
        return calledSignals;
    }
}

export function directEffect<T>(signal: Signal<T>, fn: () => void) {
    signal.addEffect(fn);
}

export const signals = new Signals();

export function awaitIntoSignal<T>(signal: Value<T>, promise: Promise<T>) {
    promise.then(v => {
        signal.set(v);
    });
}