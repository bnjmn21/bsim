import { Signal, directEffect, signals } from "./jsml/signals.js";
import { Gradient } from "./engine/gradient.js";
import { RGB } from "./engine/colors.js";
import { Plugins, Time, World } from "./engine/ecs.js";
import { Camera2d, CameraTransform, Canvas, CanvasObject, Transform, Vec2, render2dPlugin } from "./engine/engine.js";
import { I18N, LANG } from "./lang.js";
import { And, Or, Xor, Toggle, LED, Block, circuitPlugin, OutputNode, InputNode } from "./blocks.js";
import { blockMenuPlugin } from "./ui/block_menu.js";
import { titleBarPlugin } from "./ui/title_bar.js";
import { debugViewPlugin, perfData, timed } from "./ui/debug_view.js";
import { settingsPlugin } from "./ui/settings.js";

export const GRID_SIZE = 80;

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

export const blocks = {
    gates: [
        {
            default: new And(),
            center: new Vec2(0),
            icon_size: GRID_SIZE * 2 + 8,
        },
        {
            default: new Or(),
            center: new Vec2(0),
            icon_size: GRID_SIZE * 2 + 8,
        },
        {
            default: new Xor(),
            center: new Vec2(0),
            icon_size: GRID_SIZE * 2 + 8,
        }
    ],
    io: [
        {
            default: new Toggle(false),
            center: new Vec2(GRID_SIZE / 2, 0),
            icon_size: GRID_SIZE * 1.5 + 8,
        },
        {
            default: new LED(false),
            center: new Vec2(GRID_SIZE / 2, 0),
            icon_size: GRID_SIZE * 1.5 + 8,
        }
    ]
}

export const circuitName = signals.value(I18N[LANG.get()].UNNAMED_CIRCUIT);

export const canvas = new Canvas(document.getElementById("main-canvas") as HTMLCanvasElement);
export const overlayCanvas = new Canvas(document.getElementById("overlay-canvas") as HTMLCanvasElement);

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

    canvas.autoFitToParent();
    let canvasBackground = canvas.context2d.createImageData(canvas.size().x, canvas.size().y);

    overlayCanvas.autoFitToParent();

    canvas.canvas.addEventListener("click", event => {
        const clickPos = new Vec2(event.clientX, event.clientY);
        for (const e of world.getEntities(Block)) {
            for (const listener of e(Block).block.listeners) {
                if (listener.hitbox.type == "rect") {
                    if (rectHitbox(
                        camera.worldToScreenCoords(listener.hitbox.pos.add(e(Block).pos.pos)),
                        camera.worldToScreenCoords(listener.hitbox.pos.add(e(Block).pos.pos).add(listener.hitbox.size)),
                        clickPos)) {
                        const res = listener.fn(event);
                        if (res) {
                            for (const block of world.getEntities(Block)) {
                                block(Block).output = null;
                                block(Block).getOutput(world.getEntities(Block).map(v => v(Block)));
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
    
    const toggle0 = new Block([], new Toggle(false), new Vec2(0, 0));
    toggle0.getOutput([]);
    toggle0.render(world, camera);

    const toggle1 = new Block([], new Toggle(false), new Vec2(0, GRID_SIZE * 2));
    toggle1.getOutput([]);
    toggle1.render(world, camera);

    const toggle2 = new Block([], new Toggle(false), new Vec2(GRID_SIZE * 4, GRID_SIZE * -1));
    toggle2.getOutput([]);
    toggle2.render(world, camera);

    const xorGate = new Block([
        {block: toggle0, outputId: 0}, {block: toggle1, outputId: 0}
    ], new Xor(), new Vec2(GRID_SIZE * 4, GRID_SIZE));
    xorGate.getOutput(world.getEntities(Block).map(v => v(Block)));
    xorGate.render(world, camera);

    const xorGate1 = new Block([
        {block: toggle2, outputId: 0}, {block: xorGate, outputId: 0}
    ], new Xor(), new Vec2(GRID_SIZE * 8, 0));
    xorGate1.getOutput(world.getEntities(Block).map(v => v(Block)));
    xorGate1.render(world, camera);

    const andGate = new Block([
        {block: toggle0, outputId: 0}, {block: toggle1, outputId: 0}
    ], new And(), new Vec2(GRID_SIZE * 4, GRID_SIZE * 5));
    andGate.getOutput(world.getEntities(Block).map(v => v(Block)));
    andGate.render(world, camera);

    const andGate1 = new Block([
        {block: toggle2, outputId: 0}, {block: xorGate, outputId: 0}
    ], new And(), new Vec2(GRID_SIZE * 8, GRID_SIZE * 3));
    andGate1.getOutput(world.getEntities(Block).map(v => v(Block)));
    andGate1.render(world, camera);

    const orGate = new Block([
        {block: andGate1, outputId: 0}, {block: andGate, outputId: 0}
    ], new Or(), new Vec2(GRID_SIZE * 11, GRID_SIZE * 4));
    orGate.getOutput(world.getEntities(Block).map(v => v(Block)));
    orGate.render(world, camera);

    const led = new Block([
        {block: xorGate1, outputId: 0}
    ], new LED(false), new Vec2(GRID_SIZE * 14, 0));
    led.getOutput(world.getEntities(Block).map(v => v(Block)));
    led.render(world, camera);


    const led1 = new Block([
        {block: orGate, outputId: 0}
    ], new LED(false), new Vec2(GRID_SIZE * 14, GRID_SIZE * 2));
    led1.getOutput(world.getEntities(Block).map(v => v(Block)));
    led1.render(world, camera);

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