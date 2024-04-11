// --- MATH ---

class Vec2 {
    x;
    y;

    constructor (x, y) {
        this.x = x;
        this.y = y !== undefined ? y : x;
    };

    add(rhs) {
        return new Vec2(this.x + rhs.x, this.y + rhs.y);
    }

    addAssign(rhs) {
        this.x += rhs.x;
        this.y += rhs.y;
    }

    invert() {
        return new Vec2(-this.x, -this.y);
    }

    invertAssign() {
        this.x *= -1;
        this.y *= -1;
    }

    sub(rhs) {
        return this.add(rhs.invert());
    }

    subAssign(rhs) {
        this.addAssign(rhs.invert());
    }

    mul(rhs) {
        return new Vec2(this.x * rhs.x, this.y * rhs.y);
    }

    div(rhs) {
        return new Vec2(this.x / rhs.x, this.y / rhs.y);
    }

    clone() {
        return new Vec2(this.x, this.y);
    }
};

// --- CANVAS ---

function canvasPlugin() {
    class Canvas {
        canvas;
        resizeObserver;
        context2d;
    
        constructor (canvas) {
            this.canvas = canvas;
            this.resizeObserver = new ResizeObserver(e => this.fitToParent());
            this.context2d = canvas.getContext("2d");
        }
    
        resizeCanvas(x, y) {
            this.canvas.width = x;
            this.canvas.height = y;
        }
    
        fitToParent() {
            this.resizeCanvas(this.canvas.parentNode.clientWidth, this.canvas.parentNode.clientHeight);
        }
    
        autoFitToParent() {
            this.fitToParent();
            this.resizeObserver.observe(this.canvas.parentNode);
        }
    
        disableAutoFitToParent() {
            this.resizeObserver.unobserve(this.canvas.parentNode);
        }
    
        getContext2d() {
            return this.context2d;
        }

        size() {
            return new Vec2(this.canvas.width, this.canvas.height);
        }

        clear() {
            const size = this.size();
            this.getContext2d().clearRect(0, 0, size.x, size.y);
        }
    }

    return {
        Canvas,
    }
}

// --- RENDERING PRIMITIVES ---
function render2dPlugin(world) {
    const TransformComponent = world.component(class {
        constructor (initialTranslation, initialRotation, initialScale) {
            this.transformations = [];
            this.references = [];
            if (initialTranslation !== undefined) {
                this.translate(initialTranslation);
            }
            if (initialRotation !== undefined) {
                this.rotate(initialRotation);
            }
            if (initialScale !== undefined) {
                this.scale(initialScale);
            }
        }

        pushStart(transformation) {
            this.references.forEach(v => v.index++);
            this.transformations.unshift(transformation);
            const reference = {index: 0};
            this.references.unshift(reference);
            return reference;
        }

        push(transformation) {
            const index = this.transformations.push(transformation) - 1;
            const reference = {index};
            this.references.push(reference);
            return reference;
        }

        pop(reference) {
            for (const i = reference.index; i < this.references.length; i++) {
                this.references[i].index--;
            }
            this.transformations.splice(reference.index, 1);
            this.references.splice(reference.index, 1);
            reference.index = undefined;
        }

        replace(reference, transformation) {
            const index = this.references.findIndex(v => v === reference);
            this.transformations[index] = transformation;
        }

        translate(vec) {
            return this.push({type: "translate", data: vec});
        }

        translateStart(vec) {
            return this.pushStart({type: "translate", data: vec});
        }

        setTranslate(reference, vec) {
            return this.replace(reference, {type: "translate", data: vec});
        }

        rotate(vec) {
            return this.push({type: "rotate", data: vec});
        }

        rotateStart(vec) {
            return this.pushStart({type: "rotate", data: vec});
        }

        setRotate(reference, vec) {
            return this.replace(reference, {type: "rotate", data: vec});
        }

        scale(vec) {
            return this.push({type: "scale", data: vec});
        }

        scaleStart(vec) {
            return this.pushStart({type: "scale", data: vec});
        }

        setScale(reference, vec) {
            return this.replace(reference, {type: "scale", data: vec});
        }
    });

    const CameraTransformComponent = world.component(class {
        posRef;
        scaRef;

        constructor (camera2dResource) {
            this.camera2dResource = camera2dResource;
        }
    });

    class Camera2d {
        constructor (initalPosition, initalScale) {
            this.position = initalPosition;
            this.scale = initalScale;
            this.mousePos = new Vec2(0);
            this.rawScale = 1;
        }

        enableCanvasMouseControls(htmlObject, translateMouseButton, enableScrollZoom) {
            if (translateMouseButton) {
                htmlObject.addEventListener("mousemove", e => {
                    if (e.buttons & translateMouseButton) {
                        this.position.subAssign(new Vec2(e.movementX, e.movementY));
                    }
                });
            }
            if (enableScrollZoom) {
                htmlObject.addEventListener("mousemove", e => {
                    this.mousePos = new Vec2(e.clientX, e.clientY);
                });
                htmlObject.addEventListener("wheel", e => {
                    const scrollAmt = e.deltaY == 0 ? 0 : (e.deltaY > 0 ? -1 : 1);
                    if (this.scale.x < 0.05 & scrollAmt == -1) return;
                    this.rawScale += scrollAmt / 50;
                    const oldScale = this.scale.clone();
                    this.scale = new Vec2(Math.pow(this.rawScale, 2));
                    const scaleDiff = this.scale.sub(oldScale);
                    console.log(scaleDiff);
                    this.position.addAssign(
                        this.mousePos.add(this.position).div(this.scale).mul(scaleDiff)
                    );
                });
            }
        }

        screenToWorldCoords(screenCoords) {
            return screenCoords.mul(this.scale).add(this.position);
        }

        mouseWorldCoords() {
            return this.screenToWorldCoords(this.mousePos);
        }
    }

    const {Loop} = world.plugin(Plugins.default);
    world.system(Loop, TransformComponent, CameraTransformComponent, (entities, res) => {
        for (const entity of entities) {
            const transform = entity(TransformComponent);
            const cameraTransform = entity(CameraTransformComponent);
            const camera2d = res(cameraTransform.camera2dResource);

            if (!cameraTransform.posRef) {
                cameraTransform.sizRef = transform.scaleStart(new Vec2(1, 1));
                cameraTransform.posRef = transform.translateStart(new Vec2(0, 0));
            }

            transform.setTranslate(cameraTransform.posRef, camera2d.position.invert());
            transform.setScale(cameraTransform.sizRef, camera2d.scale);
        }
    });

    return {
        TransformComponent,
        CameraTransformComponent,
        Camera2d,
    }
}

function canvasRendererPlugin(world) {
    const {Canvas} = world.plugin(canvasPlugin);

    class CanvasObject {
        constructor (renderFn, ...args) {
            this.renderFn = renderFn;
            this.args = args;
        }

        render(ctx, transform) {
            if (!transform) {
                this.renderFn(ctx, this.args);
                return;
            }
            ctx.save();
            transform.transformations.forEach(v => {
                if (v.type === "translate") ctx.translate(v.data.x, v.data.y);
                if (v.type === "rotate") ctx.rotate(v.data);
                if (v.type === "scale") ctx.scale(v.data.x, v.data.y);
            });
            this.render(ctx);
            ctx.restore();
        }
    }

    const CanvasObjectComponent = world.component(CanvasObject);

    return {
        Canvas,
        CanvasObjectComponent
    }
}

function DOM2dPlugin(world) {
    class DOM2dObject {
        htmlElement

        constructor (parentHtmlElement) {
            const htmlElement = document.createElement("div");
            htmlElement.classList.add("dom2d-element");
            this.htmlElement = htmlElement;
            parentHtmlElement.appendChild(htmlElement);
        }
    }

    DOM2dObjectComponent = world.component(DOM2dObject);

    return {
        DOM2dObjectComponent
    }
}