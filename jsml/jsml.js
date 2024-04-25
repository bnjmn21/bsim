import { signals, directEffect } from "./signals.js";
function unreachable() {
    throw new Error("Entered unreachable code.");
}
export class JSML {
    constructor(htmlElement) {
        this.vNodes = [];
        this.registeredSignals = [];
        this.htmlElement = htmlElement;
    }
    ui(fn) {
        const ui = new Ui();
        const calledSignals = signals.getCalledSignals(() => {
            fn(ui);
        });
        this.vNodes = ui.render(this.htmlElement);
        if (calledSignals.length === 0) {
            for (const vNode of this.vNodes) {
                const nodeSignals = vNode.registerSignals();
                for (const signal of nodeSignals) {
                    if (this.registeredSignals.find(v => v === signal) === undefined) {
                        directEffect(signal, () => this.update(signal));
                        this.registeredSignals.push(signal);
                    }
                }
            }
        }
        else {
            const root = new TagVNode(fn, calledSignals, this.htmlElement, this.vNodes);
            this.vNodes = [root];
            const nodeSignals = root.registerSignals();
            for (const signal of nodeSignals) {
                if (this.registeredSignals.find(v => v === signal) === undefined) {
                    directEffect(signal, () => this.update(signal));
                    this.registeredSignals.push(signal);
                }
            }
        }
    }
    update(signal) {
        for (const vNode of this.vNodes) {
            if (vNode.registerSignals().find(v => v === signal) !== undefined) {
                vNode.update([signal]);
            }
        }
    }
}
function uiSupplierType(supplier) {
    if (typeof supplier === "function") {
        return {
            type: "supplier",
            value: supplier,
        };
    }
    return {
        type: "value",
        value: supplier,
    };
}
function createUiSupplierFn(supplier) {
    if (supplier.type === "supplier") {
        return supplier.value;
    }
    else if (supplier.type === "value") {
        return () => supplier.value;
    }
    unreachable();
}
class Text {
    constructor(supplier) {
        this.supplier = supplier;
    }
    render(htmlElement) {
        if (signals.isRoot(createUiSupplierFn(this.supplier))) {
            const textNode = document.createTextNode(createUiSupplierFn(this.supplier)());
            htmlElement.appendChild(textNode);
        }
        else {
            const textSignal = signals.computed(createUiSupplierFn(this.supplier));
            const textElement = document.createTextNode(textSignal.get());
            htmlElement.appendChild(textElement);
            return [new TextVNode(textElement, textSignal)];
        }
    }
}
class TextVNode {
    constructor(htmlNode, signal) {
        this.htmlNode = htmlNode;
        this.signal = signal;
    }
    registerSignals() {
        return [this.signal];
    }
    update() {
        this.htmlNode.textContent = this.signal.get();
    }
}
class Tag {
    constructor(name, inner) {
        this.classList = [];
        this.eventListeners = [];
        this.name = name;
        this.inner = inner;
    }
    addEventListener(type, callback) {
        this.eventListeners.push({ type, callback });
    }
    click(callback) {
        this.addEventListener("click", callback);
    }
    render(htmlElement) {
        const ui = new Ui();
        const element = document.createElement(this.name);
        for (const eventListener of this.eventListeners) {
            element.addEventListener(eventListener.type, eventListener.callback);
        }
        const calledSignals = signals.getCalledSignals(() => {
            this.inner(ui);
        });
        const innerVNodes = ui.render(element);
        htmlElement.appendChild(element);
        if (calledSignals.length == 0) {
            return innerVNodes;
        }
        else {
            return [new TagVNode(this.inner, calledSignals, element, innerVNodes)];
        }
    }
}
class TagVNode {
    constructor(ui, signals, htmlElement, inner) {
        this.inner = [];
        this.ui = ui;
        this.signals = signals;
        this.htmlElement = htmlElement;
        this.inner = inner;
        this.signalsWithInner = [];
        this.signalsWithInner.push(...signals);
        for (const node of inner) {
            this.signalsWithInner.push(...node.registerSignals());
        }
    }
    registerSignals() {
        return this.signalsWithInner;
    }
    update(changed) {
        const ui = new Ui();
        this.signals = signals.getCalledSignals(() => {
            this.ui(ui);
        });
        this.htmlElement.innerHTML = "";
        const innerVNodes = ui.render(this.htmlElement);
        this.signalsWithInner = [];
        this.signalsWithInner.push(...this.signals);
        for (const node of innerVNodes) {
            this.signalsWithInner.push(...node.registerSignals());
        }
    }
}
export class Ui {
    constructor() {
        this.elements = [];
        this.classList = [];
    }
    text(supplier) {
        const text = new Text(uiSupplierType(supplier));
        this.elements.push(text);
        return text;
    }
    tag(name, ui) {
        const tag = new Tag(name, ui);
        this.elements.push(tag);
        return tag;
    }
    render(htmlElement) {
        const vNodes = [];
        for (const element of this.elements) {
            const newVNodes = element.render(htmlElement);
            if (newVNodes !== undefined) {
                vNodes.push(...newVNodes);
            }
        }
        return vNodes;
    }
    p(ui) {
        return this.tag("p", ui);
    }
    button(ui) {
        return this.tag("button", ui);
    }
    br() {
        return this.tag("br", () => { });
    }
    div(ui) {
        return this.tag("div", ui);
    }
}
