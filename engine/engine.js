import { Plugins } from "./ecs.js";
// --- MATH ---
export class Vec2 {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y !== undefined ? y : x;
    }
    ;
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
}
;
// --- CANVAS ---
export class Canvas {
    canvas;
    resizeObserver;
    context2d;
    constructor(canvas) {
        this.canvas = canvas;
        this.resizeObserver = new ResizeObserver(e => this.fitToParent());
        this.context2d = canvas.getContext("2d");
    }
    resizeCanvas(size) {
        this.canvas.width = size.x;
        this.canvas.height = size.y;
    }
    fitToParent() {
        this.resizeCanvas(new Vec2(this.canvas.parentNode.clientWidth, this.canvas.parentNode.clientHeight));
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
// --- RENDERING PRIMITIVES ---
export class Camera2d {
    position;
    scale;
    mousePos;
    rawScale;
    constructor(initalPosition, initalScale) {
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
                if (this.scale.x < 0.05 && scrollAmt == -1)
                    return;
                this.rawScale += scrollAmt / 50;
                const oldScale = this.scale.clone();
                this.scale = new Vec2(Math.pow(this.rawScale, 2));
                const scaleDiff = this.scale.sub(oldScale);
                this.position.addAssign(this.mousePos.add(this.position).div(this.scale).mul(scaleDiff));
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
export class Transform {
    transformations;
    references;
    constructor(initialTranslation, initialRotation, initialScale) {
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
        const reference = { index: 0 };
        this.references.unshift(reference);
        return reference;
    }
    push(transformation) {
        const index = this.transformations.push(transformation) - 1;
        const reference = { index };
        this.references.push(reference);
        return reference;
    }
    pop(reference) {
        for (let i = reference.index; i < this.references.length; i++) {
            this.references[i].index--;
        }
        this.transformations.splice(reference.index, 1);
        this.references.splice(reference.index, 1);
        reference.index = undefined; //poisoning
    }
    replace(reference, transformation) {
        const index = this.references.findIndex(v => v === reference);
        this.transformations[index] = transformation;
    }
    translate(vec) {
        return this.push({ type: "translate", value: vec });
    }
    translateStart(vec) {
        return this.pushStart({ type: "translate", value: vec });
    }
    setTranslate(reference, vec) {
        return this.replace(reference, { type: "translate", value: vec });
    }
    rotate(amt) {
        return this.push({ type: "rotate", value: amt });
    }
    rotateStart(amt) {
        return this.pushStart({ type: "rotate", value: amt });
    }
    setRotate(reference, amt) {
        return this.replace(reference, { type: "rotate", value: amt });
    }
    scale(vec) {
        return this.push({ type: "scale", value: vec });
    }
    scaleStart(vec) {
        return this.pushStart({ type: "scale", value: vec });
    }
    setScale(reference, vec) {
        return this.replace(reference, { type: "scale", value: vec });
    }
}
export class CameraTransform {
    posRef;
    scaRef;
    camera2dResource;
    constructor(camera2dResource) {
        this.camera2dResource = camera2dResource;
    }
}
export function render2dPlugin(world) {
    const { Loop } = world.plugin(Plugins.default);
    world.system(Loop, Transform, CameraTransform, (entities, res) => {
        for (const entity of entities) { // TODO HERE
            const transform = entity(Transform);
            const cameraTransform = entity(CameraTransform);
            const camera2d = res(cameraTransform.camera2dResource);
            if (!cameraTransform.posRef || !cameraTransform.scaRef) {
                cameraTransform.scaRef = transform.scaleStart(new Vec2(1, 1));
                cameraTransform.posRef = transform.translateStart(new Vec2(0, 0));
            }
            transform.setTranslate(cameraTransform.posRef, camera2d.position.invert());
            transform.setScale(cameraTransform.scaRef, camera2d.scale);
        }
    });
}
export class CanvasObject {
    renderFn;
    args;
    constructor(renderFn, ...args) {
        this.renderFn = renderFn;
        this.args = args;
    }
    render(ctx, transform) {
        if (!transform) {
            this.renderFn(ctx, ...this.args);
            return;
        }
        ctx.save();
        transform.transformations.forEach(v => {
            if (v.type === "translate")
                ctx.translate(v.value.x, v.value.y);
            if (v.type === "rotate")
                ctx.rotate(v.value);
            if (v.type === "scale")
                ctx.scale(v.value.x, v.value.y);
        });
        this.renderFn(ctx, ...this.args);
        ctx.restore();
    }
}
export class DOM2dObject {
    htmlElement;
    constructor(parentHtmlElement) {
        const htmlElement = document.createElement("div");
        htmlElement.classList.add("dom2d-element");
        this.htmlElement = htmlElement;
        parentHtmlElement.appendChild(htmlElement);
    }
}
