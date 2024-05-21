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
            const root = new TagVNode(fn, calledSignals, this.htmlElement, this.vNodes, new Map(), []);
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
                if (vNode.update(signal)) {
                    const nodeSignals = vNode.registerSignals();
                    for (const updateSignal of nodeSignals) {
                        if (this.registeredSignals.find(v => v === updateSignal) === undefined) {
                            directEffect(updateSignal, () => this.update(updateSignal));
                            this.registeredSignals.push(updateSignal);
                        }
                    }
                }
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
    update(changed: Signal<any>): boolean;
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
        return false;
    }
}

type UiConsumer = (ui: Ui) => void;
type TagEventListener<T extends keyof HTMLElementEventMap> = {
    type: T,
    callback: (e: HTMLElementEventMap[T]) => void,
};

type CSSProp = keyof CSSStyleDeclaration & string;
class Tag implements UiElement {
    name: string;
    inner: UiConsumer;
    classList: string[] = [];
    eventListeners: TagEventListener<any>[] = [];
    attributes: Map<string, string> = new Map();
    styles: Map<CSSProp, string | Signal<string>> = new Map();
    thenFns: ((element: HTMLElement) => void)[] = [];
    classIfList: [string, Signal<boolean>][] = [];

    constructor (name: string, inner: UiConsumer) {
        this.name = name;
        this.inner = inner;
    }

    class(className: string) {
        if (!this.classList.find(v => v === className)) {
            this.classList.push(className);
        }
        return this;
    }

    classIf(className: string, condition: Signal<boolean> | (() => boolean)) {
        if (typeof condition === "function") {
            this.classIfList.push([className, signals.computed(condition)]);
            return this;
        }
        this.classIfList.push([className, condition]);
        return this;
    }

    addEventListener<T extends keyof HTMLElementEventMap>(type: T, callback: (e: HTMLElementEventMap[T]) => void) {
        this.eventListeners.push({type, callback});
        return this;
    }

    attribute(name: string, value: string) {
        this.attributes.set(name, value);
        return this;
    }

    style(name: CSSProp, value: string | Signal<string>) {
        this.styles.set(name, value);
        return this;
    }

    then(fn: (element: HTMLElement) => void) {
        this.thenFns.push(fn);
        return this;
    }

    render(htmlElement: HTMLElement) {
        const ui = new Ui();
        const element = document.createElement(this.name);
        for (const className of this.classList) {
            element.classList.add(className);
        }
        for (const classIfName of this.classIfList) {
            if (classIfName[1].get()) {
                element.classList.add(classIfName[0]);
            }
        }
        for (const eventListener of this.eventListeners) {
            element.addEventListener(eventListener.type, eventListener.callback);
        }
        for (const attribute of this.attributes) {
            element.setAttribute(attribute[0], attribute[1]);
        }
        const dynStyles = new Map();
        for (const style of this.styles) {
            if (typeof style[1] === "string") {
                element.style.setProperty(style[0], style[1]);
            } else {
                element.style.setProperty(style[0], style[1].get());
                dynStyles.set(style[0], style[1]);
            }
        }
        const calledSignals = signals.getCalledSignals(() => {
            this.inner(ui);
        });
        const innerVNodes = ui.render(element);
        htmlElement.appendChild(element);
        for (const thenFn of this.thenFns) {
            thenFn(element);
        }
        if (calledSignals.length === 0 && dynStyles.size === 0) {
            return innerVNodes;
        } else {
            return [new TagVNode(this.inner, calledSignals, element, innerVNodes, dynStyles, this.classIfList)];
        }
    }


    click(callback: (e: MouseEvent) => void) {
        return this.addEventListener("click", callback);
    }
}

class TagVNode implements VNode {
    ui: UiConsumer;
    signals: Signal<any>[];
    innerSignals: Signal<any>[];
    htmlElement: HTMLElement;
    inner: VNode[] = [];
    focusSignal: Signal<boolean> | undefined;
    styles: Map<CSSProp, Signal<string>>;
    classIfList: [string, Signal<boolean>][];

    constructor (ui: UiConsumer, signals: Signal<any>[], htmlElement: HTMLElement, inner: VNode[], styles: Map<CSSProp, Signal<string>>, classIfList: [string, Signal<boolean>][]) {
        this.ui = ui;
        this.signals = signals;
        this.htmlElement = htmlElement;
        this.inner = inner;
        this.styles = styles;
        this.classIfList = classIfList;
        this.innerSignals = [];
        for (const node of inner) {
            this.innerSignals.push(...node.registerSignals());
        }
    }

    registerSignals(): Signal<any>[] {
        return this.signals.concat(...this.innerSignals, ...this.styles.values(), ...this.classIfList.map(v => v[1]));
    }

    update(changed: Signal<any>) {
        let reregister = false;
        for (const style of this.styles) {
            if (style[1] === changed) {
                this.htmlElement.style.setProperty(style[0], style[1].get());
            }
        }
        for (const classIfName of this.classIfList) {
            if (classIfName[1] === changed) {
                if (changed.get()) {
                    this.htmlElement.classList.add(classIfName[0]);
                } else {
                    this.htmlElement.classList.remove(classIfName[0]);
                }
            }
        }
        if (this.innerSignals.find(v => v === changed) !== undefined) {
            for (const vNode of this.inner) {
                if (vNode.registerSignals().find(v => v === changed) !== undefined) {
                    if (vNode.update(changed)) {
                        const nodeSignals = vNode.registerSignals();
                        for (const updateSignal of nodeSignals) {
                            if (this.innerSignals.find(v => v === updateSignal) === undefined) {
                                directEffect(updateSignal, () => this.update(updateSignal));
                                this.innerSignals.push(updateSignal);
                            }
                        }
                        reregister = true;
                    }
                }
            }
        }
        if (this.signals.find(v => v === changed)) {
            const ui = new Ui();
            this.signals = signals.getCalledSignals(() => {
                this.ui(ui);
            });
            this.htmlElement.innerHTML = "";
            const innerVNodes = ui.render(this.htmlElement);

            this.innerSignals = [];
            this.inner = [];
            for (const node of innerVNodes) {
                this.innerSignals.push(...node.registerSignals());
                this.inner.push(node);
            }
            reregister = true;
        }
        return reregister;
    }
}

class Html implements UiElement {
    html: UiSupplierType<string>; 
    classList: string[] = [];
    classIfList: [string, Signal<boolean>][] = [];
    eventListeners: TagEventListener<any>[] = [];

    constructor (html: UiSupplierType<string>) {
        this.html = html;
    }

    class(className: string) {
        if (!this.classList.find(v => v === className)) {
            this.classList.push(className);
        }
        return this;
    }

    classIf(className: string, condition: Signal<boolean>) {
        this.classIfList.push([className, condition]);
        return this;
    }

    addEventListener<T extends keyof HTMLElementEventMap>(type: T, callback: (e: HTMLElementEventMap[T]) => void) {
        this.eventListeners.push({type, callback});
        return this;
    }

    click(callback: (e: MouseEvent) => void) {
        return this.addEventListener("click", callback);
    }

    render(htmlElement: HTMLElement) {
        if (signals.isRoot(createUiSupplierFn(this.html))) {
            const parser = new DOMParser();
            const dom = parser.parseFromString(createUiSupplierFn(this.html)(), "text/html");
            for (const className of this.classList) {
                dom.body.children[0].classList.add(className);
            }
            for (const classIfName of this.classIfList) {
                if (classIfName[1].get()) {
                    dom.body.children[0].classList.add(classIfName[0]);
                }
            }
            for (const eventListener of this.eventListeners) {
                dom.body.children[0].addEventListener(eventListener.type, eventListener.callback);
            }
            const element = htmlElement.appendChild(dom.body.children[0]);
            if (this.classIfList.length !== 0) {
                return [new HtmlVNode(element, this.classIfList)];
            }
        }
    }
}

class HtmlVNode implements VNode {
    htmlElement: Element;
    classIfList: [string, Signal<boolean>][];

    constructor (htmlElement: Element, classIfList: [string, Signal<boolean>][]) {
        this.htmlElement = htmlElement;
        this.classIfList = classIfList;
    }

    registerSignals(): Signal<any>[] {
        return this.classIfList.map(v => v[1]);
    }

    update(changed: Signal<any>): boolean {
        for (const classIfName of this.classIfList) {
            if (classIfName[1] === changed) {
                if (changed.get()) {
                    this.htmlElement.classList.add(classIfName[0]);
                } else {
                    this.htmlElement.classList.remove(classIfName[0]);
                }
            }
        }
        return false;
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

    html(supplier: UiSupplier<string>) {
        const html = new Html(uiSupplierType(supplier));
        this.elements.push(html);
        return html;
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

    h1(ui: UiConsumer) {
        return this.tag("h1", ui);
    }

    h2(ui: UiConsumer) {
        return this.tag("h2", ui);
    }

    h3(ui: UiConsumer) {
        return this.tag("h3", ui);
    }

    h4(ui: UiConsumer) {
        return this.tag("h4", ui);
    }

    h5(ui: UiConsumer) {
        return this.tag("h5", ui);
    }

    h6(ui: UiConsumer) {
        return this.tag("h6", ui);
    }
}