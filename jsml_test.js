class JSML {
    htmlElement;
    dynElements;
    uiObject;

    constructor (htmlElement) {
        this.htmlElement = htmlElement;
        this.dynElements = [];
    }

    ui(uiFunction) {
        this.uiObject = new Ui(this);
        uiFunction(this.uiObject);
        this.uiObject.render(this.htmlElement, uiFunction);
    }

    update(dynElementIndex) {
        const dynElement = this.dynElements[dynElementIndex];
        if (dynElement.type == "text") {
            const updatedUi = new Ui(this);
            dynElement.uiFunction(updatedUi);
            dynElement.node.textContent = updatedUi.elements[dynElement.index].text;
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
        const element = {
            type: "tag",
            tagName,
            inner,
            eventListeners: [],
            click(callback) {
                this.eventListeners.push({
                    type: "click",
                    callback,
                });
            },
        };
        if (typeof inner == "string") {
            element.inner = ui => {
                console.log(inner);
                ui.text(inner, ...dyns);
            };
        }
        
        this.elements.push(element);
        return element;
    }

    text(text, ...dyns) {
        const element = {
            type: "text",
            text,
            dyns,
        };
        this.elements.push(element);
        return element;
    }

    render(htmlElement, uiFunction) {
        let index = 0;
        for (const element of this.elements) {
            if (element.type == "text") {
                const node = htmlElement.appendChild(
                    document.createTextNode(element.text)
                );
                if (element.dyns.length > 0) {
                    const dynElement = {
                        type: "text",
                        node,
                        index,
                        uiFunction,
                    };
                    const dynElementIndex = this.jsml.dynElements.push(dynElement) - 1;
                    for (const dynArg of element.dyns) {
                        if (typeof dynArg != "object" || dynArg._jsml_listeners == undefined) {
                            throw new Error("Arguments must be a dyn object. Create one with dyn(obj).");
                        }
                        dynArg._jsml_listeners.push(() => {
                            this.jsml.update(dynElementIndex);
                        });
                    }
                }
            } else {
                const innerElement = document.createElement(element.tagName);
                const innerUi = new Ui(this.jsml);
                element.inner(innerUi);
                innerUi.render(innerElement, element.inner);
                for (const eventListener of element.eventListeners) {
                    innerElement.addEventListener(eventListener.type, eventListener.callback);
                }
                htmlElement.appendChild(innerElement);
            }
            index++;
        }
    }

    p(inner, ...dyns) {
        return this.tag("p", inner, ...dyns);
    }

    button(inner, ...dyns) {
        return this.tag("button", inner, ...dyns);
    }
}

function dyn(object) {
    if (typeof object != "object") {
        throw new Error("Argument must be an object, e.g. {value: 123} instead of 123");
    }

    object._jsml_listeners = [];

    const handler = {
        get(target, property, receiver) {
            const result = Reflect.get(...arguments);
            if (typeof result == "object" && property != "_jsml_listeners") {
                return dyn(result);
            }
            return result;
        },

        set(target, property, value, receiver) {
            const result = Reflect.set(...arguments);
            for (const listener of object._jsml_listeners) {
                listener();
            }
            return result;
        },
    }

    return new Proxy(object, handler);
}



const jsml = new JSML(document.getElementById("jsml"));

const count = dyn({value: 0});

jsml.ui(ui => {
    ui.p(`counter1: ${count.value}`, count);
    ui.tag("p", `counter2: ${count.value}`, count);
    ui.p(ui => {
        ui.text(`counter3: ${count.value}`, count);
    });

    ui.button("Increment!").click(() => {
        count.value++;
    });
});