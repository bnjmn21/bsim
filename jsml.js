function isType(object, type) {
    if (typeof type == "string") {
        return typeof object == type;
    } else if (typeof type == "function") {
        return typeof object == "object" && object instanceof type;
    } else {
        throw new Error("Expected type to be a string or class.");
    }
}

class EventListener {
    static CLICK = {};

    type;
    callback;

    constructor (type, callback) {
        this.type = type;
        this.callback = callback;
    }
}

class DynElement {
    static TEXT = {};
    type;
    htmlNode;

    static UI_FN = {}; // A function that defines a ui
    static ARG_FN = {}; // A function that returns a ui method argument
    uiFunctionType;
    uiFunction;
    uiPosition;

    constructor (type, htmlNode, uiFunctionType, uiFunction, uiPosition) {
        this.type = type;
        this.htmlNode = htmlNode;
        this.uiFunctionType = uiFunctionType;
        this.uiFunction = uiFunction;
        this.uiPosition = uiPosition;
    }

    addDynListeners(dyns) {
        for (const dynArg in dyns) {
            if (typeof dynArg != "object" || dynArg._jsml_listeners == undefined) {
                throw new Error("Arguments must be a dyn object. Create one with dyn(), autoDyn() or manualDyn()");
            }
            dynArg._jsml_listeners.push(this);
        }
    }

    update() {}
}

class TagElement {
    tagName;
    inner;
    dynStackPos;
    eventListeners = [];

    constructor (tagName, inner, dyns) {
        this.tagName = tagName;
        if (isType(inner, "function")) {
            this.inner = inner;
            this.dynStackPos = 0;
        } else {
            this.inner = ui => {
                ui.dynStackPosText(inner, 1, ...dyns);
            }
            this.dynStackPos = 1;
        }
    }

    click(callback) {
        this.eventListeners.push(new EventListener(EventListener.CLICK, callback));
    }

    render(htmlElement, stack) {
        const innerElement = document.createElement(element.tagName);
        const innerUi = new Ui(this.jsml);
        element.inner(innerUi);
        innerUi.render(innerElement, element.inner);
        for (const eventListener of element.eventListeners) {
            innerElement.addEventListener(eventListener.type, eventListener.callback);
        }
        htmlElement.appendChild(innerElement);
    }
};

class TextElement {
    inner;
    dynStackPos;
    dyns;

    constructor (inner, dynStackPos, dyns) {
        if (isType(inner, "function")) {
            this.inner = inner;
            this.dynStackPos = dynStackPos;
        } else {
            this.inner = () => inner;
            this.dynStackPos = dynStackPos + 1;
        }
        this.dyns = dyns;
    }

    render(htmlElement, stack) {
        const node = htmlElement.appendChild(
            document.createTextNode(this.inner())
        );

        if (this.dyns.length > 0) {
            let dynElement;
            if (this.dynStackPos == 0) {
                dynElement = new DynElement(
                    DynElement.TEXT,
                    node,
                    DynElement.ARG_FN,
                    this.inner
                );
            } else {
                dynElement = new DynElement(
                    DynElement.TEXT,
                    node,
                    DynElement.UI_FN,
                    stack[stack.length - this.dynStackPos]
                );
            }
            dynElement.addDynListeners(this.dyns);
        }
    }
}

class Ui {
    elements = [];
    jsml;

    constructor (jsml) {
        this.jsml = jsml;
    }

    tag(tagName, inner, ...dyns) {
        let element = new TagElement(tagName, inner, dyns);
        this.elements.push(element);
        return element;
    }

    text(inner, ...dyns) {
        const element = new TextElement(inner, dyns, 0);
        this.elements.push(element);
        return element;
    }

    dynStackPosText(inner, dynStackPos, ...dyns) {
        const element = new TextElement(inner, dyns, dynStackPos);
        this.elements.push(element);
        return element;
    }
}

export {JSML};