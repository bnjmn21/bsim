"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JSML {
    constructor(htmlElement) {
        this.htmlElement = htmlElement;
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
class Text {
    constructor(supplier) {
        this.supplier = supplier;
    }
}
class Tag {
    constructor(name, inner) {
        this.name = name;
        this.inner = inner;
    }
}
class Ui {
    constructor() {
        this.elements = [];
    }
    text(supplier) {
        this.elements.push(new Text(uiSupplierType(supplier)));
    }
    tag(name, inner) {
        this.elements.push(new Tag(name, inner));
    }
}
