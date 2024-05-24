import { Signal, directEffect, signals } from "./jsml/signals.js";
import { Gradient } from "./engine/gradient.js";
import { RGB } from "./engine/colors.js";
import { Plugins, Time, World } from "./engine/ecs.js";
import { Camera2d, CameraTransform, Canvas, CanvasObject, SharedTranslate, Transform, Vec2, render2dPlugin } from "./engine/engine.js";
import { I18N, LANG } from "./lang.js";
import { And, Or, Xor, Toggle, LED, Block, circuitPlugin, OutputNode, InputNode, IBlock, NodeOrValue, BlockDef, Hitbox, getBlocks, NodeRef } from "./blocks.js";
import { blockMenuPlugin } from "./ui/block_menu.js";
import { titleBarPlugin } from "./ui/title_bar.js";
import { debugViewPlugin, perfData, timed } from "./ui/debug_view.js";
import { settingsPlugin } from "./ui/settings.js";
import { GRID_SIZE } from "./constants.js";
import { JSML } from "./jsml/jsml.js";
import { garbage } from "./icons.js";

let firstFrame = true;
let resizedLastFrame = false;
let framesSinceResize = 0;

export const settings = {
    graphics: {
        blur: signals.value<"off"|"low"|"high">("low"),
        shaded_background: signals.value(false),
        gate_symbols: signals.value<"ansi"|"iec">("ansi"),
    },
    advanced: {
        debug_display: signals.value(true),
        perf_graph: signals.value(false),
    }
};
effectAndInit(settings.graphics.blur, () => {
    if (settings.graphics.blur.get() === "off") {
        document.body.classList.remove("blur-low");
        document.body.classList.add("blur-off");
    } else if (settings.graphics.blur.get() === "low") {
        document.body.classList.remove("blur-off");
        document.body.classList.add("blur-low");
    } else if (settings.graphics.blur.get() === "high") {
        document.body.classList.remove("blur-off");
        document.body.classList.remove("blur-low");
    }
});
effectAndInit(settings.graphics.shaded_background, () => {
    if (settings.graphics.shaded_background.get()) {
        document.body.classList.remove("simple-background");
        resizedLastFrame = true;
    } else {
        document.body.classList.add("simple-background");
    }
});
export type BlockType = {staticData: BlockDef};
export const blocks: {gates: BlockType[], io: BlockType[]} = {
    gates: [
        And,
        Or,
        Xor,
    ],
    io: [
        Toggle,
        LED,
    ]
}

export const circuitName = signals.value(I18N[LANG.get()].UNNAMED_CIRCUIT);

export const canvas = new Canvas(document.getElementById("main-canvas") as HTMLCanvasElement);
export const overlayCanvas = new Canvas(document.getElementById("overlay-canvas") as HTMLCanvasElement);

export type DraggingNewBlock = {type: "new", block: BlockDef, pos: Vec2};
export type MovingBlock = {type: "move", block: Block};
export type DraggingWire = {type: "wire", from: NodeRef};
export const dragging: {inner: DraggingNewBlock | MovingBlock | DraggingWire | null} = {
    inner: null, //Inner mutability
};

export const mouseTooltip = signals.value<null | "delete">(null);

export function bsim(world: World) {
    const { time, Loop, AfterLoop } = world.plugin(Plugins.time);

    world.system(Loop, () => {
       overlayCanvas.context2d.clearRect(0, 0, overlayCanvas.size().x, overlayCanvas.size().y);
    });

    world.plugin(debugViewPlugin);
    world.plugin(circuitPlugin);
    world.plugin(render2dPlugin);
    world.plugin(blockMenuPlugin);
    world.plugin(titleBarPlugin);
    world.plugin(settingsPlugin);

    addEventListener("resize", _ => {
        resizedLastFrame = true;
    });

    addEventListener("mousemove", e => {
        const unroundedPos = camera.mouseWorldCoords();
        const roundedPos = new Vec2(Math.round(unroundedPos.x / GRID_SIZE) * GRID_SIZE, Math.round(unroundedPos.y / GRID_SIZE) * GRID_SIZE);
        if (dragging.inner?.type === "new") {
            dragging.inner.pos = roundedPos;
        }
        if (dragging.inner?.type === "move") {
            dragging.inner.block.pos.set(roundedPos);
        }
    });

    canvas.canvas.addEventListener("mousedown", e => {
        if (e.button === 2) {
            const outputNodes = world.getEntities([OutputNode, Transform]).map<[OutputNode, Transform]>(v => [v(OutputNode), v(Transform)]);
            for (const node of outputNodes) {
                const startPos = node[0].ref.pos.pos.add(
                    node[0].ref.block.outputNodes[node[0].outputId]
                );
                if (circleHitbox(startPos, GRID_SIZE / 4, camera.mouseWorldCoords())) {
                    dragging.inner = {
                        type: "wire",
                        from: {block: node[0].ref, outputId: node[0].outputId},
                    }
                    return;
                }
            }

            const blocks = world.getEntities(Block).map<Block>(v => v(Block));
            for (const block of blocks) {
                const hb = block.block.data.hitbox;
                const mouseRelativeToHb = camera.mouseWorldCoords().sub(block.pos.pos);
                if (hitbox(hb, mouseRelativeToHb)) {
                    dragging.inner = {
                        type: "move",
                        block: block
                    }
                }
            }
        }
    });

    addEventListener("mouseup", e => {
        if (dragging.inner?.type === "new") {
            if (dragging.inner.block) {
                if (e.target !== canvas.canvas) {
                    dragging.inner = null;
                    return;
                }
                const block = new Block(dragging.inner.block.defaultInputs(), dragging.inner.block.default(), dragging.inner.pos);
                block.getOutput();
                block.render(world, camera);
                dragging.inner = null;
            }
        }
        if (dragging.inner?.type === "move") {
            if (e.target === canvas.canvas) {
                dragging.inner = null;
                return;
            }

            for (const e of world.getEntities(Block)) {
                for (const [idx, input] of e(Block).inputs.entries()) {
                    if (typeof input === "object") {
                        if (input.block === dragging.inner.block) {
                            e(Block).inputs[idx] = false;
                        }
                    }
                }
            }

            dragging.inner.block.remove(world);
            dragging.inner = null;
        }
        if (dragging.inner?.type === "wire") {
            const inputNodes = world.getEntities(InputNode).map<InputNode>(v => v(InputNode));
            for (const node of inputNodes) {
                const startPos = node.ref.pos.pos.add(
                    node.ref.block.inputNodes[node.inputId]
                );
                if (circleHitbox(startPos, GRID_SIZE / 4, camera.mouseWorldCoords())) {
                    node.ref.inputs[node.inputId] = dragging.inner.from;
                    recalculate(world);
                    break;
                }
            }
            dragging.inner = null;
        }
    });

    canvas.autoFitToParent();
    let canvasBackground = canvas.context2d.createImageData(canvas.size().x, canvas.size().y);

    overlayCanvas.autoFitToParent();

    canvas.canvas.addEventListener("click", event => {
        const clickPos = new Vec2(event.clientX, event.clientY);
        for (const e of world.getEntities(Block)) {
            for (const listener of e(Block).block.listeners) {
                if (listener.hitbox.type === "rect") {
                    if (rectHitbox(
                        camera.worldToScreenCoords(listener.hitbox.pos.add(e(Block).pos.pos)),
                        camera.worldToScreenCoords(listener.hitbox.pos.add(e(Block).pos.pos).add(listener.hitbox.size)),
                        clickPos)) {
                        const res = listener.fn(event);
                        if (res) {
                            recalculate(world);
                        }
                    }
                } else if (listener.hitbox.type === "circle") {
                    if (circleHitbox(listener.hitbox.center, listener.hitbox.radius, camera.screenToWorldCoords(clickPos))) {
                        const res = listener.fn(event);
                        if (res) {
                            for (const block of world.getEntities(Block)) {
                                block(Block).output = null;
                                block(Block).getOutput();
                            }
                        }
                    }
                }
            }
        }
    });

    const backgroundGradient = new Gradient(Gradient.GRADIENTS.RADIAL(size => size.div(new Vec2(2))));
    backgroundGradient.startColor(new RGB(0x20, 0x20, 0x20));
    backgroundGradient.colorStopLinear(new RGB(0x10, 0x10, 0x10), 1);

    const camera = new Camera2d(canvas.size().div(new Vec2(2)).invert(), new Vec2(1));
    camera.enableCanvasMouseControls(canvas.canvas, 1, true);
    
    //const toggle0 = new Block([], new Toggle(false), new Vec2(0, 0));
    //toggle0.getOutput();
    //toggle0.render(world, camera);
//
    //const toggle1 = new Block([], new Toggle(false), new Vec2(0, GRID_SIZE * 2));
    //toggle1.getOutput();
    //toggle1.render(world, camera);
//
    //const toggle2 = new Block([], new Toggle(false), new Vec2(GRID_SIZE * 4, GRID_SIZE * -1));
    //toggle2.getOutput();
    //toggle2.render(world, camera);
//
    //const xorGate = new Block([
    //    {block: toggle0, outputId: 0}, {block: toggle1, outputId: 0}
    //], new Xor(), new Vec2(GRID_SIZE * 4, GRID_SIZE));
    //xorGate.getOutput();
    //xorGate.render(world, camera);
//
    //const xorGate1 = new Block([
    //    {block: toggle2, outputId: 0}, {block: xorGate, outputId: 0}
    //], new Xor(), new Vec2(GRID_SIZE * 8, 0));
    //xorGate1.getOutput();
    //xorGate1.render(world, camera);
//
    //const andGate = new Block([
    //    {block: toggle0, outputId: 0}, {block: toggle1, outputId: 0}
    //], new And(), new Vec2(GRID_SIZE * 4, GRID_SIZE * 5));
    //andGate.getOutput();
    //andGate.render(world, camera);
//
    //const andGate1 = new Block([
    //    {block: toggle2, outputId: 0}, {block: xorGate, outputId: 0}
    //], new And(), new Vec2(GRID_SIZE * 8, GRID_SIZE * 3));
    //andGate1.getOutput();
    //andGate1.render(world, camera);
//
    //const orGate = new Block([
    //    {block: andGate1, outputId: 0}, {block: andGate, outputId: 0}
    //], new Or(), new Vec2(GRID_SIZE * 11, GRID_SIZE * 4));
    //orGate.getOutput();
    //orGate.render(world, camera);
//
    //const led = new Block([
    //    {block: xorGate1, outputId: 0}
    //], new LED(false), new Vec2(GRID_SIZE * 14, 0));
    //led.getOutput();
    //led.render(world, camera);
//
    //const led1 = new Block([
    //    {block: orGate, outputId: 0}
    //], new LED(false), new Vec2(GRID_SIZE * 14, GRID_SIZE * 2));
    //led1.getOutput();
    //led1.render(world, camera);

    world.system(Loop, _ => {
        if (resizedLastFrame) {
            framesSinceResize = 0;
        }
        perfData.render.bg = timed(time, () => {
            if (framesSinceResize === 2 || firstFrame) {
                if (settings.graphics.shaded_background.get()) {
                    canvasBackground = canvas.context2d.createImageData(canvas.size().x, canvas.size().y);
                    backgroundGradient.renderTo(canvasBackground);
                }
            }

            firstFrame = false;
            resizedLastFrame = false;
            framesSinceResize++;
    
            if (settings.graphics.shaded_background.get()) {
                canvas.context2d.putImageData(canvasBackground, 0, 0);
            } else {
                canvas.context2d.clearRect(0, 0, canvas.size().x, canvas.size().y);
            }
            drawGrid(camera, canvas);
        })[0];
    });

    world.system(Loop, [Block, CanvasObject, Transform], entities => {
        perfData.render.blocks += timed(time, () => {
            for (const e of entities) {
                if (e.has(CanvasObject) && e.has(Transform)) {
                    e(CanvasObject).render(canvas.context2d, e(Transform));
                }
            }
        })[0];
    });
    world.system(Loop, [OutputNode, CanvasObject, Transform], entities => {
        perfData.render.nodes += timed(time, () => {
            for (const e of entities) {
                if (e.has(CanvasObject) && e.has(Transform)) {
                    e(CanvasObject).render(canvas.context2d, e(Transform));
                }
            }
        })[0];
    });
    world.system(Loop, [InputNode, CanvasObject, Transform], entities => {
        perfData.render.nodes += timed(time, () => {
            for (const e of entities) {
                if (e.has(CanvasObject) && e.has(Transform)) {
                    e(CanvasObject).render(canvas.context2d, e(Transform));
                }
            }
        })[0];
    });
    world.system(Loop, InputNode, entities => {
        perfData.render.wires += timed(time, () => {
            for (const e of entities) {
                const input = e(InputNode).ref.inputs[e(InputNode).inputId];
                if (typeof input !== "boolean") {
                    const startPos = input.block.pos.pos.add(
                        input.block.block.outputNodes[input.outputId]
                    );
                    const endPos = e(InputNode).ref.pos.pos.add(
                        e(InputNode).ref.block.inputNodes[e(InputNode).inputId]
                    );
                    const ctx = canvas.context2d;
                    if (input.block.output === null) {
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, 100, 100);
                    }
                    if ((input.block.output as Boolean[])[input.outputId]) {
                        ctx.strokeStyle = "#7f0000";
                    } else {
                        ctx.strokeStyle = "#3f3f3f";
                    }
                    ctx.lineWidth = GRID_SIZE / 4 + 16;
                    ctx.lineCap = "round";
                    ctx.save();
                    camera.toTransform().applyTransforms(ctx);
                    ctx.beginPath();
                    ctx.moveTo(startPos.x, startPos.y);
                    ctx.lineTo(endPos.x, endPos.y);
                    ctx.stroke();
                    if ((input.block.output as Boolean[])[input.outputId]) {
                        ctx.strokeStyle = "#ff0000";
                    } else {
                        ctx.strokeStyle = "#7f7f7f";
                    }
                    ctx.lineWidth = GRID_SIZE / 4;
                    ctx.lineCap = "round";
                    ctx.beginPath();
                    ctx.moveTo(startPos.x, startPos.y);
                    ctx.lineTo(endPos.x, endPos.y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        })[0];
    });
    world.system(Loop, _ => {
        perfData.render.other += timed(time, () => {
            if (dragging.inner?.type === "new") {
                const ctx = overlayCanvas.context2d;
                ctx.save();
                camera.toTransform().applyTransforms(ctx);
                ctx.translate(dragging.inner.pos.x, dragging.inner.pos.y);
                if (dragging.inner.block) {
                    dragging.inner.block.default().render(ctx);
                }
                ctx.restore();
            }
        })[0];
    });
    world.system(Loop, _ => {
        perfData.render.other += timed(time, () => {
            if (dragging.inner?.type === "wire") {
                let connect = false;
                const inputNodes = world.getEntities([InputNode, Transform]).map<[InputNode, Transform]>(v => [v(InputNode), v(Transform)]);
                for (const node of inputNodes) {
                    const startPos = node[0].ref.pos.pos.add(
                        node[0].ref.block.inputNodes[node[0].inputId]
                    );
                    if (circleHitbox(startPos, GRID_SIZE / 4, camera.mouseWorldCoords())) {
                        connect = true;
                    }
                }

                const ctx = overlayCanvas.context2d;
                ctx.save();
                camera.toTransform().applyTransforms(ctx);
                if (connect) {
                    ctx.strokeStyle = "#3f3fff";
                    ctx.setLineDash([55, 20]);
                    ctx.lineWidth = 20;
                } else {
                    ctx.strokeStyle = "#ffffff7f";
                    ctx.setLineDash([45, 30]);
                    ctx.lineWidth = 15;
                }
                ctx.lineCap = "butt";
                ctx.beginPath();
                const startPos = dragging.inner.from.block.pos.pos.add(
                    dragging.inner.from.block.block.outputNodes[dragging.inner.from.outputId]
                );
                ctx.moveTo(startPos.x, startPos.y);
                const unrounded = camera.mouseWorldCoords();
                if (connect) {
                    const rounded = new Vec2(Math.round(unrounded.x / GRID_SIZE) * GRID_SIZE, Math.round(unrounded.y / GRID_SIZE) * GRID_SIZE);
                    ctx.lineTo(rounded.x, rounded.y);
                } else {
                    ctx.lineTo(unrounded.x, unrounded.y);
                }
                ctx.stroke();
                ctx.restore();
            }
        })[0];
    });

    addEventListener("mousemove", e => {
        if (e.target === document.getElementById("block-menu") && (dragging.inner?.type === "move" || dragging.inner?.type === "new")) {
            mouseTooltip.set("delete");
        } else {
            mouseTooltip.set(null);
        }
        const tooltips = document.getElementById("mouse-tooltip-container") as HTMLElement;
        tooltips.style.left = `${e.clientX}px`;
        tooltips.style.top = `${e.clientY}px`;
    });

    const mouseTooltips = new JSML(document.getElementById("mouse-tooltip-container") as HTMLElement);
    mouseTooltips.ui(ui => {
        if (mouseTooltip.get() === "delete") {
            ui.html(garbage)
                .class("mouse-tooltip")
                .class("delete")
                .class("icon");
        }
    });
}

function drawGrid(camera: Camera2d, canvas: Canvas) {
    const GRID_STROKE_WIDTH = 2;
    const GRID_STROKE_STYLE = "#FFFFFF2F";
    const LARGE_GRID_STROKE_WIDTH = 4;
    const LARGE_GRID_STROKE_STYLE = "#FFFFFF4F";
    const LARGE_GRID_SIZE_MULT = 10;
    const ctx = canvas.context2d;
    ctx.lineCap = "square";
    const bounds = camera.screenBounds(canvas);
    for (let x = Math.floor(bounds.top_left.x / GRID_SIZE) * GRID_SIZE; x < bounds.bottom_right.x; x += GRID_SIZE) {
        if (x % (GRID_SIZE * LARGE_GRID_SIZE_MULT) === 0) {
            ctx.lineWidth = LARGE_GRID_STROKE_WIDTH / camera.scale.x;
            ctx.strokeStyle = LARGE_GRID_STROKE_STYLE;
        } else {
            ctx.lineWidth = GRID_STROKE_WIDTH / camera.scale.x;
            ctx.strokeStyle = GRID_STROKE_STYLE;
        }
        ctx.beginPath();
        ctx.moveTo(camera.worldToScreenCoords(new Vec2(x)).x, 0);
        ctx.lineTo(camera.worldToScreenCoords(new Vec2(x)).x, canvas.size().y);
        ctx.stroke();
    }
    for (let y = Math.floor(bounds.top_left.y / GRID_SIZE) * GRID_SIZE; y < bounds.bottom_right.y; y += GRID_SIZE) {
        if (y % (GRID_SIZE * LARGE_GRID_SIZE_MULT) === 0) {
            ctx.lineWidth = LARGE_GRID_STROKE_WIDTH / camera.scale.y;
            ctx.strokeStyle = LARGE_GRID_STROKE_STYLE;
        } else {
            ctx.lineWidth = GRID_STROKE_WIDTH / camera.scale.y;
            ctx.strokeStyle = GRID_STROKE_STYLE;
        }
        ctx.beginPath();
        ctx.moveTo(0, camera.worldToScreenCoords(new Vec2(y)).y);
        ctx.lineTo(canvas.size().x, camera.worldToScreenCoords(new Vec2(y)).y);
        ctx.stroke();
    }
}

export function effectAndInit(signal: Signal<any>, fn: () => void) {
    directEffect(signal, fn);
    fn();
}

function rectHitbox(pos: Vec2, pos2: Vec2, target: Vec2) {
    return pos.sub(target).x < 0 && pos.sub(target).y < 0 &&
        pos2.sub(target).x > 0 && pos2.sub(target).y > 0;
}

function circleHitbox(center: Vec2, radius: number, target: Vec2) {
    return center.dist(target) <= radius;
}

function hitbox(hb: Hitbox, target: Vec2) {
    if (hb.type === "circle") {
        return circleHitbox(hb.center, hb.radius, target);
    } else if (hb.type === "rect") {
        return rectHitbox(hb.pos, hb.pos.add(hb.size), target);
    }
}

function recalculate(world: World) {
    for (const block of world.getEntities(Block)) {
        block(Block).output = null;
    }
    for (const block of world.getEntities(Block)) {
        block(Block).getOutput();
    }
}