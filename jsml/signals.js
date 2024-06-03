export function isSignal(signal) {
    if (signal instanceof Value || signal instanceof Computed) {
        return true;
    }
    return false;
}
export class Value {
    listening = false;
    calledWhileListening = false;
    value;
    childSignals = [];
    signalsInstance;
    changed = false;
    effects = [];
    constructor(signalsInstance, value) {
        this.value = value;
        this.signalsInstance = signalsInstance;
    }
    set(value) {
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
    addChild(childSignal) {
        this.childSignals.push(childSignal);
    }
    hasChanged() {
        const changed = this.changed;
        this.changed = false;
        return changed;
    }
    addEffect(effect) {
        this.effects.push(effect);
    }
}
export class Computed {
    listening = false;
    calledWhileListening = false;
    computeFn;
    value;
    childSignals = [];
    dirty = false;
    changed = false;
    signalsInstance;
    effects = [];
    constructor(signalsInstance, computeFn) {
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
    addChild(childSignal) {
        this.childSignals.push(childSignal);
    }
    hasChanged() {
        const changed = this.changed;
        this.changed = false;
        return changed;
    }
    addEffect(effect) {
        this.effects.push(effect);
    }
}
export class Signals {
    static Value = Value;
    static Computed = Computed;
    signals = [];
    constructor() {
    }
    value(value) {
        const signal = new Signals.Value(this, value);
        this.signals.push(signal);
        return signal;
    }
    computed(computeFn) {
        const signal = new Signals.Computed(this, computeFn);
        this.signals.push(signal);
        return signal;
    }
    auto(computeFn) {
        const isRoot = this.isRoot(computeFn);
        if (isRoot) {
            return this.value(computeFn());
        }
        else {
            return this.computed(computeFn);
        }
    }
    computeAndAddToTree(signal) {
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
    isRoot(computeFn) {
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
    getCalledSignals(computeFn) {
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
export function directEffect(signal, fn) {
    signal.addEffect(fn);
}
export const signals = new Signals();
export function awaitIntoSignal(signal, promise) {
    promise.then(v => {
        signal.set(v);
    });
}
