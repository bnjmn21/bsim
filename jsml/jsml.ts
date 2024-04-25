import { Signals, Signal, isSignal, signals, directEffect} from "./signals.js"

function unreachable(): never {
    throw new Error("Entered unreachable code.");
}

type Supplier<T> = () => T;
type ObjToUnion<T> = {
    [P in keyof T]: {type: P, value: T[P]}
}[keyof T];
type Fields<T> = T[keyof T];

export class JSML {
    htmlElement;
    vNodes: VNode[] = [];
    registeredSignals: Signal<any>[] = [];

    constructor (htmlElement: HTMLElement) {
        this.htmlElement = htmlElement;
    }

    ui(fn: (ui: Ui) => void) {
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
        } else {
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

    update(signal: Signal<any>) {
        for (const vNode of this.vNodes) {
            if (vNode.registerSignals().find(v => v === signal) !== undefined) {
                vNode.update([signal]);
            }
        }
    }
}

type UiSupplierTypes<T> = {
    supplier: Supplier<T>,
    value: T,
};
type UiSupplier<T> = Fields<UiSupplierTypes<T>>;
type UiSupplierType<T> = ObjToUnion<UiSupplierTypes<T>>;
function uiSupplierType<T>(supplier: UiSupplier<T>): UiSupplierType<T> {
    if (typeof supplier === "function") {
        return {
            type: "supplier",
            value: supplier as Supplier<T>,
        }
    }
    return {
        type: "value",
        value: supplier as T,
    }
}

function createUiSupplierFn<T>(supplier: UiSupplierType<T>): () => T {
    if (supplier.type === "supplier") {
        return supplier.value;
    } else if (supplier.type === "value") {
        return () => supplier.value;
    }
    unreachable();
}

interface UiElement {
    render(htmlElement: HTMLElement): VNode[] | void;
}

interface VNode {
    registerSignals(): Signal<any>[];
    update(changed: Signal<any>[]): void;
}

class Text implements UiElement {
    supplier: UiSupplierType<string>;

    constructor (supplier: UiSupplierType<string>) {
        this.supplier = supplier;
    }

    render(htmlElement: HTMLElement) {
        if (signals.isRoot(createUiSupplierFn(this.supplier))) {
            const textNode = document.createTextNode(createUiSupplierFn(this.supplier)());
            htmlElement.appendChild(textNode);
        } else {
            const textSignal = signals.computed(createUiSupplierFn(this.supplier));
            const textElement = document.createTextNode(textSignal.get());
            htmlElement.appendChild(textElement);
            return [new TextVNode(textElement, textSignal)];
        }
    }
}

class TextVNode implements VNode {
    htmlNode: globalThis.Text;
    signal: Signal<string>;

    constructor(htmlNode: globalThis.Text, signal: Signal<string>) {
        this.htmlNode = htmlNode;
        this.signal = signal;
    }

    registerSignals(): Signal<any>[] {
        return [this.signal];
    }

    update() {
        this.htmlNode.textContent = this.signal.get();
    }
}

/*
class Html implements UiElement {
    supplier: UiSupplierType<string>;
    dynHtmlData: DynHtmlData | undefined;

    constructor (supplier: UiSupplierType<string>) {
        this.supplier = supplier;
    }

    render(htmlElement: HTMLElement) {
        if (signals.isRoot(createUiSupplierFn(this.supplier))) {
            const parser = new DOMParser();
            const dom = parser.parseFromString(createUiSupplierFn(this.supplier)(), "text/html");
            for (const node of dom.body.childNodes) {
                htmlElement.appendChild(node);
            }
        } else {
            const signal = signals.computed(createUiSupplierFn(this.supplier));
            const parser = new DOMParser();
            const dom = parser.parseFromString(signal.get(), "text/html");
            console.log(dom.body);
            this.dynHtmlData = new DynHtmlData(htmlElement.childElementCount - 1, dom.body.childElementCount);
            for (const node of dom.body.childNodes) {
                console.log(node);
                htmlElement.appendChild(node);
            }
            directEffect(signal, () => this.update(htmlElement, signal));
        }
    }

    update(htmlElement: HTMLElement, signal: Signal<string>) {
        console.log("updated")
        const parser = new DOMParser();
        const dom = parser.parseFromString(signal.get(), "text/html");
        for (let i = 0; i < (this.dynHtmlData as DynHtmlData).elementCount; i++) {
            htmlElement.removeChild(htmlElement.childNodes[(this.dynHtmlData as DynHtmlData).elementIndex]);
        }
        this.dynHtmlData = new DynHtmlData(htmlElement.childElementCount - 1, dom.body.childElementCount);
        let i = 0;
        for (const node of dom.body.childNodes) {
            htmlElement.insertBefore(node, htmlElement.childNodes[(this.dynHtmlData as DynHtmlData).elementIndex + i] || null);
            i++;
        }
    }
}
*/

type UiConsumer = (ui: Ui) => void;
type TagEventListener<T extends keyof HTMLElementEventMap> = {
    type: T,
    callback: (e: HTMLElementEventMap[T]) => void,
};

class Tag implements UiElement {
    name: string;
    inner: UiConsumer;
    classList: string[] = [];
    eventListeners: TagEventListener<any>[] = [];

    constructor (name: string, inner: UiConsumer) {
        this.name = name;
        this.inner = inner;
    }

    addEventListener<T extends keyof HTMLElementEventMap>(type: T, callback: (e: HTMLElementEventMap[T]) => void) {
        this.eventListeners.push({type, callback});
    }

    click(callback: (e: MouseEvent) => void) {
        this.addEventListener("click", callback);
    }

    render(htmlElement: HTMLElement) {
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
        } else {
            return [new TagVNode(this.inner, calledSignals, element, innerVNodes)];
        }
    }
}

class TagVNode implements VNode {
    ui: UiConsumer;
    signals: Signal<any>[];
    signalsWithInner: Signal<any>[];
    htmlElement: HTMLElement;
    inner: VNode[] = [];

    constructor (ui: UiConsumer, signals: Signal<any>[], htmlElement: HTMLElement, inner: VNode[]) {
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

    registerSignals(): Signal<any>[] {
        return this.signalsWithInner;
    }

    update(changed: Signal<any>[]): void {
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
    elements: UiElement[] = [];
    classList: string[] = [];

    constructor() {
    }

    text(supplier: UiSupplier<string>) {
        const text = new Text(uiSupplierType(supplier));
        this.elements.push(text);
        return text;
    }

    tag(name: string, ui: UiConsumer) {
        const tag = new Tag(name, ui);
        this.elements.push(tag);
        return tag;
    }

    render(htmlElement: HTMLElement): VNode[] {
        const vNodes = [];
        for (const element of this.elements) {
            const newVNodes = element.render(htmlElement);
            if (newVNodes !== undefined) {
                vNodes.push(...newVNodes);
            }
        }
        return vNodes;
    }


    p(ui: UiConsumer) {
        return this.tag("p", ui);
    }

    button(ui: UiConsumer) {
        return this.tag("button", ui);
    }

    br() {
        return this.tag("br", () => {});
    }

    div(ui: UiConsumer) {
        return this.tag("div", ui);
    }
}