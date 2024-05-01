import { Plugins, ResourceRef, World } from "./ecs.js";

// --- MATH ---
export class Vec2 {
    x;
    y;

    constructor (x: number, y: number | void) {
        this.x = x;
        this.y = y !== undefined ? y : x;
    };

    add(rhs: Vec2) {
        return new Vec2(this.x + rhs.x, this.y + rhs.y);
    }

    addAssign(rhs: Vec2) {
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

    sub(rhs: Vec2) {
        return this.add(rhs.invert());
    }

    subAssign(rhs: Vec2) {
        this.addAssign(rhs.invert());
    }

    mul(rhs: Vec2) {
        return new Vec2(this.x * rhs.x, this.y * rhs.y);
    }

    div(rhs: Vec2) {
        return new Vec2(this.x / rhs.x, this.y / rhs.y);
    }

    clone() {
        return new Vec2(this.x, this.y);
    }
};

// --- CANVAS ---
export class Canvas {
    canvas: HTMLCanvasElement;
    resizeObserver: ResizeObserver;
    context2d: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.resizeObserver = new ResizeObserver(e => this.fitToParent());
        this.context2d = canvas.getContext("2d") as CanvasRenderingContext2D;
    }

    resizeCanvas(size: Vec2) {
        this.canvas.width = size.x;
        this.canvas.height = size.y;
    }

    fitToParent() {
        this.resizeCanvas(new Vec2(
            (this.canvas.parentNode as HTMLElement).clientWidth,
            (this.canvas.parentNode as HTMLElement).clientHeight
        ));
    }

    autoFitToParent() {
        this.fitToParent();
        this.resizeObserver.observe(this.canvas.parentNode as HTMLElement);
    }

    disableAutoFitToParent() {
        this.resizeObserver.unobserve(this.canvas.parentNode as HTMLElement);
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
    position: Vec2;
    scale: Vec2;
    mousePos: Vec2;
    rawScale: number;

    constructor (initalPosition: Vec2, initalScale: Vec2) {
        this.position = initalPosition;
        this.scale = initalScale;
        this.mousePos = new Vec2(0);
        this.rawScale = 1;
    }

    enableCanvasMouseControls(htmlObject: HTMLElement, translateMouseButton: number, enableScrollZoom: boolean) {
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
                if (this.scale.x < 0.05 && scrollAmt == -1) return;
                this.rawScale += scrollAmt / 50;
                const oldScale = this.scale.clone();
                this.scale = new Vec2(Math.pow(this.rawScale, 2));
                const scaleDiff = this.scale.sub(oldScale);
                this.position.addAssign(
                    this.mousePos.add(this.position).div(this.scale).mul(scaleDiff)
                );
            });
        }
    }

    screenToWorldCoords(screenCoords: Vec2) {
        return screenCoords.mul(this.scale).add(this.position);
    }

    mouseWorldCoords() {
        return this.screenToWorldCoords(this.mousePos);
    }
}

type ObjToUnion<T> = {
    [P in keyof T]: {type: P, value: T[P]}
}[keyof T];
export type Transformation = ObjToUnion<{translate: Vec2, rotate: number, scale: Vec2}>;
export type TransformationRef = {index: number};

export class Transform {
    transformations: Transformation[];
    references: TransformationRef[];
    constructor (initialTranslation: Vec2, initialRotation: number, initialScale: Vec2) {
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

    pushStart(transformation: Transformation) {
        this.references.forEach(v => v.index++);
        this.transformations.unshift(transformation);
        const reference = {index: 0};
        this.references.unshift(reference);
        return reference;
    }

    push(transformation: Transformation) {
        const index = this.transformations.push(transformation) - 1;
        const reference = {index};
        this.references.push(reference);
        return reference;
    }

    pop(reference: TransformationRef) {
        for (let i = reference.index; i < this.references.length; i++) {
            this.references[i].index--;
        }
        this.transformations.splice(reference.index, 1);
        this.references.splice(reference.index, 1);
        reference.index = undefined as unknown as number; //poisoning
    }

    replace(reference: TransformationRef, transformation: Transformation) {
        const index = this.references.findIndex(v => v === reference);
        this.transformations[index] = transformation;
    }

    translate(vec: Vec2) {
        return this.push({type: "translate", value: vec});
    }

    translateStart(vec: Vec2) {
        return this.pushStart({type: "translate", value: vec});
    }

    setTranslate(reference: TransformationRef, vec: Vec2) {
        return this.replace(reference, {type: "translate", value: vec});
    }

    rotate(amt: number) {
        return this.push({type: "rotate", value: amt});
    }

    rotateStart(amt: number) {
        return this.pushStart({type: "rotate", value: amt});
    }

    setRotate(reference: TransformationRef, amt: number) {
        return this.replace(reference, {type: "rotate", value: amt});
    }

    scale(vec: Vec2) {
        return this.push({type: "scale", value: vec});
    }

    scaleStart(vec: Vec2) {
        return this.pushStart({type: "scale", value: vec});
    }

    setScale(reference: TransformationRef, vec: Vec2) {
        return this.replace(reference, {type: "scale", value: vec});
    }
}

export class CameraTransform {
    posRef?: TransformationRef;
    scaRef?: TransformationRef;
    camera2dResource: ResourceRef<Camera2d>;

    constructor (camera2dResource: ResourceRef<Camera2d>) {
        this.camera2dResource = camera2dResource;
    }
}

export function render2dPlugin(world: World) {
    const {Loop} = world.plugin(Plugins.default);
    world.system<(typeof Transform) | (typeof CameraTransform)>(Loop, Transform, CameraTransform, (entities, res) => {
        for (const entity of entities) { // TODO HERE
            const transform = entity(Transform);
            const cameraTransform = entity(CameraTransform);
            const camera2d: Camera2d = res(cameraTransform.camera2dResource);

            if (!cameraTransform.posRef || !cameraTransform.scaRef) {
                cameraTransform.scaRef = transform.scaleStart(new Vec2(1, 1));
                cameraTransform.posRef = transform.translateStart(new Vec2(0, 0));
            }

            transform.setTranslate(cameraTransform.posRef, camera2d.position.invert());
            transform.setScale(cameraTransform.scaRef, camera2d.scale);
        }
    });
}

export type CanvasObjectRenderFn = (ctx: CanvasRenderingContext2D, ...args: any[]) => {}
export class CanvasObject {
    renderFn: CanvasObjectRenderFn;
    args: any[];
    constructor (renderFn: CanvasObjectRenderFn, ...args: any[]) {
        this.renderFn = renderFn;
        this.args = args;
    }

    render(ctx: CanvasRenderingContext2D, transform: Transform | void) {
        if (!transform) {
            this.renderFn(ctx, ...this.args);
            return;
        }
        ctx.save();
        transform.transformations.forEach(v => {
            if (v.type === "translate") ctx.translate(v.value.x, v.value.y);
            if (v.type === "rotate") ctx.rotate(v.value);
            if (v.type === "scale") ctx.scale(v.value.x, v.value.y);
        });
        this.renderFn(ctx, ...this.args);
        ctx.restore();
    }
}

export class DOM2dObject {
    htmlElement

    constructor (parentHtmlElement: HTMLElement) {
        const htmlElement = document.createElement("div");
        htmlElement.classList.add("dom2d-element");
        this.htmlElement = htmlElement;
        parentHtmlElement.appendChild(htmlElement);
    }
}