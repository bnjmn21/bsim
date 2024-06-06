import { Signal, directEffect, signals } from "./jsml/signals.js";
import { Plugins, Time, World } from "./engine/ecs.js";
import { Camera2d, Canvas, CanvasObject, Transform, Vec2, render2dPlugin } from "./engine/engine.js";
import { I18N, LANG } from "./lang.js";
import { And, Or, Xor, Toggle, LED, Block, circuitPlugin, OutputNode, InputNode, BlockDef, Hitbox, NodeRef, Delay, WireNode, Not } from "./blocks.js";
import { blockMenuPlugin } from "./ui/block_menu.js";
import { titleBarPlugin } from "./ui/title_bar.js";
import { debugViewPlugin, perfData, timed } from "./ui/debug_view.js";
import { settingsPlugin } from "./ui/settings.js";
import { GRID_SIZE } from "./constants.js";
import { JSML } from "./jsml/jsml.js";
import { garbage } from "./icons.js";
import { keyboardTipsPlugin } from "./ui/keyboard_tips.js";
import { controlsPlugin } from "./ui/controls.js";
import { loadCircuitFromLink, loadSettings } from "./persistency.js";
import { b64Decode, b64Encode } from "./engine/binary.js";
import { RGB, color_mix } from "./engine/colors.js";

export const settings = loadSettings();
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
export type BlockType = Function & {staticData: BlockDef};
export const blocks: {gates: BlockType[], io: BlockType[], misc: BlockType[]} = {
    gates: [
        And,
        Or,
        Xor,
        Not
    ],
    io: [
        Toggle,
        LED,
    ],
    misc: [
        Delay,
        WireNode,
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

export const keys = {
    shift: signals.value(false),
    ctrl: signals.value(false),
    alt: signals.value(false),
    meta: signals.value(false),
}

export const hoverState = {
    wireNode: signals.value(false),
    inputNode: signals.value(false),
    outputNode: signals.value(false),
    hitbox: signals.value(false),
    block: signals.value(false),
}

export const controlState = {
    playing: signals.value(false),
    speed: signals.value(1),
}

export function bsim(world: World) {
    const { time, Loop } = world.plugin(Plugins.time);

    world.system(Loop, [], () => {
       overlayCanvas.context2d.clearRect(0, 0, overlayCanvas.size().x, overlayCanvas.size().y);
    });

    world.plugin(debugViewPlugin);
    world.plugin(circuitPlugin);
    world.plugin(render2dPlugin);
    world.plugin(blockMenuPlugin);
    world.plugin(settingsPlugin);
    world.plugin(keyboardTipsPlugin);
    world.plugin(controlsPlugin);
    
    const camera = new Camera2d(canvas.size().div(new Vec2(2)).invert(), new Vec2(1));
    world.plugin(titleBarPlugin, camera);

    world.system(Loop, [], _ => {
        if (hoverState.inputNode.get() || hoverState.outputNode.get()) {
            document.body.style.cursor = "grab";
        } else if (hoverState.hitbox.get()) {
            document.body.style.cursor = "pointer";
        } else if (dragging.inner !== null) {
            document.body.style.cursor = "grabbing";
        } else if (hoverState.block.get() || hoverState.wireNode.get()) {
            document.body.style.cursor = "grab";
        } else {
            document.body.style.cursor = "initial";
        }
    });

    let bin: Uint8Array;
    addEventListener("keydown", e => {
        if (e.key === "Control") {
            keys.ctrl.set(true);
        } else if (e.key === "Shift") {
            keys.shift.set(true);
        } else if (e.key === "Alt") {
            keys.alt.set(true);
        } else if (e.key === "Meta") {
            keys.meta.set(true);
        }
    });

    addEventListener("keyup", e => {
        if (e.key === "Control") {
            keys.ctrl.set(false);
        } else if (e.key === "Shift") {
            keys.shift.set(false);
        } else if (e.key === "Alt") {
            keys.alt.set(false);
        } else if (e.key === "Meta") {
            keys.meta.set(false);
        }
    });

    addEventListener("pointermove", e => {
        const unroundedPos = camera.mouseWorldCoords();
        const roundedPos = new Vec2(Math.round(unroundedPos.x / GRID_SIZE) * GRID_SIZE, Math.round(unroundedPos.y / GRID_SIZE) * GRID_SIZE);
        if (dragging.inner?.type === "new") {
            dragging.inner.pos = roundedPos;
        }
        if (dragging.inner?.type === "move") {
            dragging.inner.block.pos.set(roundedPos);
        }

        const hoveringBlock = getHoveringBlock(world, camera);
        hoverState.inputNode.set(!!getConnectedHoveringInputNode(world, camera));
        hoverState.wireNode.set(hoveringBlock?.block instanceof WireNode);
        hoverState.hitbox.set(!!getHoveringListener(world, camera));
        hoverState.block.set((!!hoveringBlock) && !(hoveringBlock?.block instanceof WireNode));
        hoverState.outputNode.set(!!getHoveringOutputNode(world, camera));
    });

    canvas.canvas.addEventListener("pointerdown", e => {
        if (e.button === 0) {
            if (keys.alt.get() && (!(keys.ctrl.get() || keys.meta.get()))) {
                const hoveringInputNode = getConnectedHoveringInputNode(world, camera);
                if (hoveringInputNode) {
                    dragging.inner = {
                        type: "wire",
                        from: {
                            block: (hoveringInputNode.ref.inputs[hoveringInputNode.inputId] as NodeRef).block,
                            outputId: (hoveringInputNode.ref.inputs[hoveringInputNode.inputId] as NodeRef).outputId
                        },
                    }
                    hoveringInputNode.ref.inputs[hoveringInputNode.inputId] = false;
                    recalculate(world);
                    return;
                }
            }

            if (!(keys.ctrl.get() || keys.meta.get())) {
                const hoveringOutputNode = getHoveringOutputNode(world, camera);
                if (hoveringOutputNode) {
                    dragging.inner = {
                        type: "wire",
                        from: {
                            block: hoveringOutputNode.ref,
                            outputId: hoveringOutputNode.outputId
                        },
                    }
                    return;
                }
            }

            const hoveringBlock = getHoveringBlock(world, camera);
            if (hoveringBlock) {
                dragging.inner = {
                    type: "move",
                    block: hoveringBlock
                }
                return;
            }
        }
    });

    addEventListener("pointerup", e => {
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
        if (dragging.inner?.type === "move" && e.button === 0) {
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
        if (dragging.inner?.type === "wire" && e.button === 0) {
            const inputNodes = world.getEntities(InputNode).map<InputNode>(v => v(InputNode));
            for (const node of inputNodes) {
                const startPos = node.ref.pos.pos.add(
                    node.ref.block.inputNodes[node.inputId]
                );
                if (circleHitbox(startPos, GRID_SIZE / 2, camera.mouseWorldCoords())) {
                    const oldInput = node.ref.inputs[node.inputId];
                    node.ref.inputs[node.inputId] = dragging.inner.from;
                    if (recalculateAndCheckForLoops(world)) {
                        (document.getElementById("loop-created-container") as HTMLElement).animate([
                            {
                                opacity: 1,
                            },
                            {
                                opacity: 0,
                            }
                        ], 4000);
                        node.ref.inputs[node.inputId] = oldInput;
                    };
                    recalculate(world);
                    break;
                }
            }
            dragging.inner = null;
        }
    });

    canvas.autoFitToParent();

    overlayCanvas.autoFitToParent();

    canvas.canvas.addEventListener("click", event => {
        if (keys.ctrl.get() || keys.meta.get()) return;
        const listener = getHoveringListener(world, camera);
        if (listener) {
            if (listener(event)) {
                recalculate(world);
            }
        }
    });

    camera.enableCanvasMouseControls(canvas.canvas, 2, true);

    world.system(Loop, [], _ => {
        perfData.render.bg = timed(time, () => {
            canvas.context2d.clearRect(0, 0, canvas.size().x, canvas.size().y);
            drawGrid(camera, canvas);
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
    world.system(Loop, [], _ => {
        perfData.render.other += timed(time, () => {
            if (dragging.inner?.type === "new") {
                const ctx = overlayCanvas.context2d;
                ctx.save();
                camera.toTransform().applyTransforms(ctx);
                ctx.translate(dragging.inner.pos.x, dragging.inner.pos.y);
                if (dragging.inner.block.menuRender) {
                    dragging.inner.block.menuRender(ctx);
                } else {
                    dragging.inner.block.default().render(ctx);
                }
                ctx.restore();
            }
        })[0];
    });
    world.system(Loop, [], _ => {
        perfData.render.other += timed(time, () => {
            if (dragging.inner?.type === "wire") {
                let connect = false;
                const inputNodes = world.getEntities([InputNode, Transform]).map<[InputNode, Transform]>(v => [v(InputNode), v(Transform)]);
                for (const node of inputNodes) {
                    const startPos = node[0].ref.pos.pos.add(
                        node[0].ref.block.inputNodes[node[0].inputId]
                    );
                    if (circleHitbox(startPos, GRID_SIZE / 2, camera.mouseWorldCoords())) {
                        connect = true;
                    }
                }

                const ctx = overlayCanvas.context2d;
                ctx.save();
                camera.toTransform().applyTransforms(ctx);
                if (connect) {
                    ctx.strokeStyle = "#3f3fff";
                    ctx.lineWidth = GRID_SIZE / 2;
                } else {
                    ctx.strokeStyle = "#ffffff7f";
                    ctx.lineWidth = GRID_SIZE / 3;
                }
                ctx.lineCap = "round";
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

    addEventListener("pointermove", e => {
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

    const loopCreatedUi = new JSML(document.getElementById("loop-created-container") as HTMLElement);
    loopCreatedUi.ui(ui => {
        ui.div(ui => {
            ui.p(ui => ui.text(I18N[LANG.get()].LOOP_CREATED.MAIN)).class("loop-created-text");
            ui.p(ui => {
                ui.text(I18N[LANG.get()].LOOP_CREATED.FIX_MESSAGE_0);
                ui.tag("b", ui => ui.text(I18N[LANG.get()].LOOP_CREATED.FIX_MESSAGE_1)).class("special");
                ui.text(I18N[LANG.get()].LOOP_CREATED.FIX_MESSAGE_2);
            }).class("loop-created-text");
        })
            .class("loop-created");
    });


    let timeSinceTick = 0;
    world.system(Loop, [], _ => {
        perfData.simulation += timed(time, () => {
            if (controlState.playing.get()) {
                let ticked = false;
                timeSinceTick = Math.min(timeSinceTick, controlState.speed.get() * 20);
                for (let i = 1 / controlState.speed.get(); i < timeSinceTick; i += (1 / controlState.speed.get())) {
                    tick(world);
                    ticked = true;
                }
                if (ticked) {
                    timeSinceTick = 0;
                }
                timeSinceTick += time.deltaS();
            }
        })[0];
    });

    if (new URL(location.href).searchParams.has("d")) {
        const circuit = loadCircuitFromLink(new URL(location.href))
        if (circuit.name) {
            circuitName.set(circuit.name);
        }
        circuit.load(world, camera, new Vec2(0, 0));
    }
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

/**
 * Tries to recalculate the circuit.
 * If there are any loops, the function quits and returns true.
 */
function recalculateAndCheckForLoops(world: World) {
    for (const block of world.getEntities(Block)) {
        block(Block).output = null;
    }
    for (const block of world.getEntities(Block)) {
        if (block(Block).getOutputWithLoopCheck() === null) return true;
    }
    return false;
}

function tick(world: World) {
    for (const block of world.getEntities(Block)) {
        block(Block).tick();
    }
    recalculate(world);
}

function getConnectedHoveringInputNode(world: World, camera: Camera2d): InputNode | null {
    const inputNodes = world.getEntities(InputNode).map<InputNode>(v => v(InputNode));
    for (const node of inputNodes) {
        if (typeof node.ref.inputs[node.inputId] !== "boolean") {
            const nodePos = node.ref.pos.pos.add(
                node.ref.block.inputNodes[node.inputId]
            );
            if (circleHitbox(nodePos, GRID_SIZE / 2, camera.mouseWorldCoords())) {
                return node;
            }
        }
    }
    return null;
}

function getHoveringOutputNode(world: World, camera: Camera2d): OutputNode | null {
    const outputNodes = world.getEntities(OutputNode).map(v => v(OutputNode));
    for (const node of outputNodes) {
        const startPos = node.ref.pos.pos.add(
            node.ref.block.outputNodes[node.outputId]
        );
        if (circleHitbox(startPos, GRID_SIZE / 2, camera.mouseWorldCoords())) {
            return node;
        }
    }
    return null;
}

function getHoveringBlock(world: World, camera: Camera2d): Block | null {
    const blocks = world.getEntities(Block).map<Block>(v => v(Block));
    for (const block of blocks) {
        const hb = block.block.data.hitbox;
        const mouseRelativeToHb = camera.mouseWorldCoords().sub(block.pos.pos);
        if (hitbox(hb, mouseRelativeToHb)) {
            return block;
        }
    }
    return null;
}

function getHoveringListener(world: World, camera: Camera2d): ((e: MouseEvent) => boolean) | null {
    for (const e of world.getEntities(Block)) {
        for (const listener of e(Block).block.listeners) {
            if (hitbox(listener.hitbox, camera.mouseWorldCoords().sub(e(Block).pos.pos))) {
                return listener.fn;
            }
        }
    }
    return null;
}