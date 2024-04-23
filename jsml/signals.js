"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signals = exports.isSignal = void 0;
function isSignal(signal) {
    if (signal instanceof Value || signal instanceof Computed) {
        return true;
    }
    return false;
}
exports.isSignal = isSignal;
class Value {
    constructor(signalsInstance, value) {
        this.listening = false;
        this.calledWhileListening = false;
        this.childSignals = [];
        this.changed = false;
        this.internalSet = (value, signal) => {
            signal.value = value;
            for (const child of signal.childSignals) {
                child.setDirty();
            }
            signal.changed = true;
        };
        this.value = value;
        this.signalsInstance = signalsInstance;
    }
    set(value) {
        this.internalSet(value, this);
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
}
class Computed {
    constructor(signalsInstance, computeFn) {
        this.listening = false;
        this.calledWhileListening = false;
        this.childSignals = [];
        this.dirty = false;
        this.changed = false;
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
}
class Signals {
    constructor() {
        this.signals = [];
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
}
exports.Signals = Signals;
Signals.Value = Value;
Signals.Computed = Computed;
function directEffect(signal, fn) {
    if (signal instanceof Value) {
        if (signal.effects === undefined) {
            signal.effects = [];
            const oldSignalSet = structuredClone(signal.set);
            signal.internalSet = (value, signal) => {
                oldSignalSet.bind(signal, value);
                for (const effect of signal.effects) {
                    effect();
                }
            };
        }
        signal.effects.push(fn);
    }
}
