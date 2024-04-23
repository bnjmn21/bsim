import { Signals, Signal, isSignal } from "./signals"

type Supplier<T> = () => T;
type ObjToUnion<T> = {
    [P in keyof T]: {type: P, value: T[P]}
}[keyof T];
type Fields<T> = T[keyof T];

class JSML {
    htmlElement;

    constructor (htmlElement: HTMLElement) {
        this.htmlElement = htmlElement;
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

type UiElement = Text | Tag;

class Text {
    supplier: UiSupplierType<string>;

    constructor (supplier: UiSupplierType<string>) {
        this.supplier = supplier;
    }
}

type UiConsumer = (ui: Ui) => void;
class Tag {
    name: string;
    inner: UiConsumer;
    classList: string[] = [];

    constructor (name: string, inner: UiConsumer) {
        this.name = name;
        this.inner = inner;
    }
}

class Ui {
    elements: UiElement[] = [];
    classList: string[] = [];

    constructor() {
    }

    text(supplier: UiSupplier<string>) {
        this.elements.push(new Text(uiSupplierType(supplier)));
    }

    tag(name: string, inner: UiConsumer) {
        this.elements.push(new Tag(name, inner));
    }    
}