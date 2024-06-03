import { signals, directEffect } from "./signals.js";
function unreachable() {
    throw new Error("Entered unreachable code.");
}
export class JSML {
    htmlElement;
    vNodes = [];
    registeredSignals = [];
    constructor(htmlElement) {
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
    update(signal) {
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
    supplier;
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
    htmlNode;
    signal;
    constructor(htmlNode, signal) {
        this.htmlNode = htmlNode;
        this.signal = signal;
    }
    registerSignals() {
        return [this.signal];
    }
    update() {
        this.htmlNode.textContent = this.signal.get();
        return false;
    }
}
class Tag {
    name;
    inner;
    classList = [];
    eventListeners = [];
    attributes = new Map();
    styles = new Map();
    thenFns = [];
    classIfList = [];
    constructor(name, inner) {
        this.name = name;
        this.inner = inner;
    }
    class(className) {
        if (!this.classList.find(v => v === className)) {
            this.classList.push(className);
        }
        return this;
    }
    classIf(className, condition) {
        this.classIfList.push([className, condition]);
        return this;
    }
    addEventListener(type, callback) {
        this.eventListeners.push({ type, callback });
        return this;
    }
    attribute(name, value) {
        this.attributes.set(name, value);
        return this;
    }
    style(name, value) {
        this.styles.set(name, value);
        return this;
    }
    then(fn) {
        this.thenFns.push(fn);
        return this;
    }
    render(htmlElement) {
        const ui = new Ui();
        const element = document.createElement(this.name);
        const signalClassIfList = this.classIfList.map(([c, s]) => {
            if (typeof s === "function") {
                return [c, signals.computed(s)];
            }
            else
                return [c, s];
        });
        for (const className of this.classList) {
            element.classList.add(className);
        }
        for (const classIfName of signalClassIfList) {
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
            }
            else {
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
        if (calledSignals.length === 0 && dynStyles.size === 0 && this.classIfList.length === 0) {
            return innerVNodes;
        }
        else {
            return [new TagVNode(this.inner, calledSignals, element, innerVNodes, dynStyles, signalClassIfList)];
        }
    }
    click(callback) {
        return this.addEventListener("click", callback);
    }
}
class TagVNode {
    ui;
    signals;
    innerSignals;
    htmlElement;
    inner = [];
    focusSignal;
    styles;
    classIfList;
    constructor(ui, signals, htmlElement, inner, styles, classIfList) {
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
    registerSignals() {
        return [...this.signals, ...this.innerSignals, ...this.styles.values(), ...this.classIfList.map(v => v[1])];
    }
    update(changed) {
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
                }
                else {
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
class Html {
    html;
    classList = [];
    classIfList = [];
    eventListeners = [];
    constructor(html) {
        this.html = html;
    }
    class(className) {
        if (!this.classList.find(v => v === className)) {
            this.classList.push(className);
        }
        return this;
    }
    classIf(className, condition) {
        this.classIfList.push([className, condition]);
        return this;
    }
    addEventListener(type, callback) {
        this.eventListeners.push({ type, callback });
        return this;
    }
    click(callback) {
        return this.addEventListener("click", callback);
    }
    render(htmlElement) {
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
class HtmlVNode {
    htmlElement;
    classIfList;
    constructor(htmlElement, classIfList) {
        this.htmlElement = htmlElement;
        this.classIfList = classIfList;
    }
    registerSignals() {
        return this.classIfList.map(v => v[1]);
    }
    update(changed) {
        for (const classIfName of this.classIfList) {
            if (classIfName[1] === changed) {
                if (changed.get()) {
                    this.htmlElement.classList.add(classIfName[0]);
                }
                else {
                    this.htmlElement.classList.remove(classIfName[0]);
                }
            }
        }
        return false;
    }
}
export class Ui {
    elements = [];
    classList = [];
    constructor() {
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
    html(supplier) {
        const html = new Html(uiSupplierType(supplier));
        this.elements.push(html);
        return html;
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
    h1(ui) {
        return this.tag("h1", ui);
    }
    h2(ui) {
        return this.tag("h2", ui);
    }
    h3(ui) {
        return this.tag("h3", ui);
    }
    h4(ui) {
        return this.tag("h4", ui);
    }
    h5(ui) {
        return this.tag("h5", ui);
    }
    h6(ui) {
        return this.tag("h6", ui);
    }
}
