import * as icons from "./icons.js";
import { JSML } from "./jsml/jsml.js";
import { directEffect, signals } from "./jsml/signals.js";
import { Gradient } from "./engine/gradient.js";
import { RGB } from "./engine/colors.js";
import { Plugins } from "./engine/ecs.js";
import { Camera2d, Canvas, CanvasObject, Transform, Vec2, render2dPlugin } from "./engine/engine.js";
import { I18N, LANG } from "./lang.js";
import { And, Or, Xor, Toggle, LED, Block, circuitPlugin, OutputNode, InputNode } from "./blocks.js";
import { blockMenuPlugin } from "./ui/block_menu.js";
export const GRID_SIZE = 80;
let firstFrame = true;
let resizedLastFrame = false;
let framesSinceResize = 0;
let debugDisplay = undefined;
export const settings = {
    graphics: {
        blur: signals.value("low"),
        shaded_background: signals.value(false),
        gate_symbols: signals.value("ansi"),
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
    }
    else if (settings.graphics.blur.get() === "low") {
        document.body.classList.remove("blur-off");
        document.body.classList.add("blur-low");
    }
    else if (settings.graphics.blur.get() === "high") {
        document.body.classList.remove("blur-off");
        document.body.classList.remove("blur-low");
    }
});
effectAndInit(settings.graphics.shaded_background, () => {
    if (settings.graphics.shaded_background.get()) {
        document.body.classList.remove("simple-background");
        resizedLastFrame = true;
    }
    else {
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
};
export const perfData = {
    bg_rendering: 0,
    simulation: 0,
    html_update: 0,
    render: 0,
    idle: 0,
    other: 0,
    last_idle_start: 0,
    last_frame_start: 0,
};
const circuitName = signals.value(I18N[LANG.get()].UNNAMED_CIRCUIT);
const showSettings = signals.value(false);
effectAndInit(showSettings, () => {
    if (showSettings.get()) {
        document.getElementById("settings-container").classList.add("show");
    }
    else {
        document.getElementById("settings-container").classList.remove("show");
    }
});
const lastFrameTimes = [];
export function bsim(world) {
    const { time, Loop, AfterLoop } = world.plugin(Plugins.time);
    world.plugin(circuitPlugin);
    world.plugin(render2dPlugin);
    world.plugin(blockMenuPlugin);
    addEventListener("resize", _ => {
        resizedLastFrame = true;
    });
    const canvas = new Canvas(document.getElementById("main-canvas"));
    canvas.autoFitToParent();
    let canvasBackground = canvas.context2d.createImageData(canvas.size().x, canvas.size().y);
    canvas.canvas.addEventListener("click", event => {
        const clickPos = new Vec2(event.clientX, event.clientY);
        for (const e of world.getEntities(Block)) {
            for (const listener of e(Block).block.listeners) {
                if (listener.hitbox.type == "rect") {
                    if (rectHitbox(camera.worldToScreenCoords(listener.hitbox.pos.add(e(Block).pos.pos)), camera.worldToScreenCoords(listener.hitbox.pos.add(e(Block).pos.pos).add(listener.hitbox.size)), clickPos)) {
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
        { block: toggle0, outputId: 0 }, { block: toggle1, outputId: 0 }
    ], new Xor(), new Vec2(GRID_SIZE * 4, GRID_SIZE));
    xorGate.getOutput(world.getEntities(Block).map(v => v(Block)));
    xorGate.render(world, camera);
    const xorGate1 = new Block([
        { block: toggle2, outputId: 0 }, { block: xorGate, outputId: 0 }
    ], new Xor(), new Vec2(GRID_SIZE * 8, 0));
    xorGate1.getOutput(world.getEntities(Block).map(v => v(Block)));
    xorGate1.render(world, camera);
    const andGate = new Block([
        { block: toggle0, outputId: 0 }, { block: toggle1, outputId: 0 }
    ], new And(), new Vec2(GRID_SIZE * 4, GRID_SIZE * 5));
    andGate.getOutput(world.getEntities(Block).map(v => v(Block)));
    andGate.render(world, camera);
    const andGate1 = new Block([
        { block: toggle2, outputId: 0 }, { block: xorGate, outputId: 0 }
    ], new And(), new Vec2(GRID_SIZE * 8, GRID_SIZE * 3));
    andGate1.getOutput(world.getEntities(Block).map(v => v(Block)));
    andGate1.render(world, camera);
    const orGate = new Block([
        { block: andGate1, outputId: 0 }, { block: andGate, outputId: 0 }
    ], new Or(), new Vec2(GRID_SIZE * 11, GRID_SIZE * 4));
    orGate.getOutput(world.getEntities(Block).map(v => v(Block)));
    orGate.render(world, camera);
    const led = new Block([
        { block: xorGate1, outputId: 0 }
    ], new LED(false), new Vec2(GRID_SIZE * 14, 0));
    led.getOutput(world.getEntities(Block).map(v => v(Block)));
    led.render(world, camera);
    const led1 = new Block([
        { block: orGate, outputId: 0 }
    ], new LED(false), new Vec2(GRID_SIZE * 14, GRID_SIZE * 2));
    led1.getOutput(world.getEntities(Block).map(v => v(Block)));
    led1.render(world, camera);
    world.system(Loop, _ => {
        perfData.last_frame_start = time.ms();
        if (resizedLastFrame) {
            framesSinceResize = 0;
        }
        const perfBgRenderStart = time.ms();
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
        }
        else {
            canvas.context2d.clearRect(0, 0, canvas.size().x, canvas.size().y);
        }
        drawGrid(camera, canvas);
        perfData.bg_rendering = time.ms() - perfBgRenderStart;
        if (settings.advanced.debug_display.get()) {
            if (lastFrameTimes.length > 60) {
                lastFrameTimes.shift();
                lastFrameTimes.push(time.s());
            }
            else {
                lastFrameTimes.push(time.s());
            }
            const avgFPS = 1 / ((lastFrameTimes[lastFrameTimes.length - 1] - lastFrameTimes[0]) / lastFrameTimes.length);
            debugDisplay.textContent =
                `FPS: ${avgFPS.toFixed(2)}`;
        }
        perfData.render = 0;
    });
    world.system(Loop, [Block, CanvasObject, Transform], entities => {
        const renderStart = time.ms();
        for (const e of entities) {
            if (e.has(CanvasObject) && e.has(Transform)) {
                e(CanvasObject).render(canvas.context2d, e(Transform));
            }
        }
        perfData.render += time.ms() - renderStart;
    });
    world.system(Loop, [OutputNode, CanvasObject, Transform], entities => {
        const renderStart = time.ms();
        for (const e of entities) {
            if (e.has(CanvasObject) && e.has(Transform)) {
                e(CanvasObject).render(canvas.context2d, e(Transform));
            }
        }
        perfData.render += time.ms() - renderStart;
    });
    world.system(Loop, [InputNode, CanvasObject, Transform], entities => {
        const renderStart = time.ms();
        for (const e of entities) {
            if (e.has(CanvasObject) && e.has(Transform)) {
                e(CanvasObject).render(canvas.context2d, e(Transform));
            }
        }
        perfData.render += time.ms() - renderStart;
    });
    world.system(Loop, [InputNode], entities => {
        const renderStart = time.ms();
        for (const e of entities) {
            const input = e(InputNode).ref.inputs[e(InputNode).inputId];
            if (typeof input !== "boolean") {
                const startPos = input.block.pos.pos.add(input.block.block.outputNodes[input.outputId]);
                const endPos = e(InputNode).ref.pos.pos.add(e(InputNode).ref.block.inputNodes[e(InputNode).inputId]);
                const ctx = canvas.context2d;
                if (input.block.output === null) {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, 100, 100);
                }
                if (input.block.output[input.outputId]) {
                    ctx.strokeStyle = "#7f0000";
                }
                else {
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
                if (input.block.output[input.outputId]) {
                    ctx.strokeStyle = "#ff0000";
                }
                else {
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
        perfData.render += time.ms() - renderStart;
    });
    renderTitleBar();
    renderSettings();
    world.system(AfterLoop, () => {
        const total = time.ms() - perfData.last_frame_start;
        perfData.idle = time.ms() - perfData.last_idle_start;
        const totalWithIdle = total + perfData.idle;
        perfData.other = total - (perfData.bg_rendering + perfData.render);
        if (settings.advanced.perf_graph.get()) {
            const ctx = canvas.context2d;
            ctx.textAlign = "center";
            ctx.font = `10px "JetBrains Mono", monospace`;
            let currTotal = 0;
            ctx.fillStyle = "#ffff00";
            ctx.beginPath();
            ctx.moveTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.arc(canvas.size().x - 200, canvas.size().y - 200, 150, 2 * Math.PI * (currTotal / totalWithIdle), 2 * Math.PI * ((currTotal + perfData.bg_rendering) / totalWithIdle));
            ctx.lineTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.fill();
            ctx.fillText("bg_rendering", canvas.size().x - 200, canvas.size().y - 360);
            currTotal += perfData.bg_rendering;
            ctx.fillStyle = "#ff00ff";
            ctx.beginPath();
            ctx.moveTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.arc(canvas.size().x - 200, canvas.size().y - 200, 150, 2 * Math.PI * (currTotal / totalWithIdle), 2 * Math.PI * ((currTotal + perfData.render) / totalWithIdle));
            ctx.lineTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.fill();
            ctx.fillText("blocks_rendering", canvas.size().x - 200, canvas.size().y - 370);
            currTotal += perfData.render;
            ctx.fillStyle = "#00ffff";
            ctx.beginPath();
            ctx.moveTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.arc(canvas.size().x - 200, canvas.size().y - 200, 150, 2 * Math.PI * (currTotal / totalWithIdle), 2 * Math.PI * ((currTotal + perfData.other) / totalWithIdle));
            ctx.lineTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.fill();
            ctx.fillText("other", canvas.size().x - 200, canvas.size().y - 380);
            currTotal += perfData.other;
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.moveTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.arc(canvas.size().x - 200, canvas.size().y - 200, 150, 2 * Math.PI * (currTotal / totalWithIdle), 2 * Math.PI * ((currTotal + perfData.idle) / totalWithIdle));
            ctx.lineTo(canvas.size().x - 200, canvas.size().y - 200);
            ctx.fill();
            currTotal += perfData.idle;
        }
        perfData.last_idle_start = time.ms();
    });
}
function renderTitleBar() {
    const titleBarTextEditSizeTest = document.getElementById("title-bar-text-edit");
    let tempName = circuitName.get();
    const editingName = signals.value(false);
    const editFieldWidth = signals.computed(() => {
        titleBarTextEditSizeTest.innerText = tempName;
        return `${titleBarTextEditSizeTest.offsetWidth}px`;
    });
    let previousLang = LANG.get();
    effectAndInit(LANG, () => {
        if (circuitName.get() === I18N[previousLang].UNNAMED_CIRCUIT) {
            circuitName.set(I18N[LANG.get()].UNNAMED_CIRCUIT);
            tempName = circuitName.get();
        }
        previousLang = LANG.get();
    });
    const circuitNameIsNull = signals.computed(() => circuitName.get() === null);
    const titleBar = new JSML(document.getElementById("title-bar"));
    let renameField = null;
    let editBtn = null;
    titleBar.ui(ui => {
        ui.h1(ui => {
            ui.text(I18N[LANG.get()].NAME);
        });
        if (!circuitNameIsNull.get()) {
            ui.p(ui => ui.text("/")).class("slash");
            ui.div(ui => {
                if (!editingName.get()) {
                    ui.p(ui => ui.text(() => `${circuitName.get()}`)).class("sub-section");
                }
                else {
                    editFieldWidth.setDirty();
                    ui.tag("input", () => { })
                        .attribute("type", "text")
                        .attribute("value", tempName)
                        .class("rename-input")
                        .style("width", editFieldWidth)
                        .then(e => {
                        renameField = e;
                        e.focus();
                    })
                        .addEventListener("input", e => {
                        tempName = e.target.value;
                        editFieldWidth.setDirty();
                    })
                        .addEventListener("blur", e => {
                        if (e.target === renameField && e.relatedTarget !== editBtn) {
                            editingName.set(false);
                            circuitName.set(tempName);
                        }
                    })
                        .addEventListener("keypress", e => {
                        if (e.key === "Enter") {
                            e.target.blur();
                        }
                    });
                }
            });
            ui.button(ui => {
                ui.html(icons.edit)
                    .class("icon")
                    .classIf("focus", editingName);
            })
                .class("icon-btn")
                .click(() => {
                editingName.set(!editingName.get());
                if (editingName.get()) {
                    tempName = circuitName.get();
                }
                else {
                    circuitName.set(tempName);
                }
            })
                .then(e => {
                editBtn = e;
            });
            ui.div(_ => { }).class("side-seperator");
            ui.button(ui => {
                ui.html(icons.settings).class("icon");
            })
                .class("icon-btn")
                .click(_ => {
                showSettings.set(true);
            });
        }
        if (settings.advanced.debug_display.get()) {
            ui.p(ui => { }).class("fps-display").then(e => {
                debugDisplay = e;
            });
        }
    });
}
function drawGrid(camera, canvas) {
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
        }
        else {
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
        }
        else {
            ctx.lineWidth = GRID_STROKE_WIDTH / camera.scale.y;
            ctx.strokeStyle = GRID_STROKE_STYLE;
        }
        ctx.beginPath();
        ctx.moveTo(0, camera.worldToScreenCoords(new Vec2(y)).y);
        ctx.lineTo(canvas.size().x, camera.worldToScreenCoords(new Vec2(y)).y);
        ctx.stroke();
    }
}
function renderSettings() {
    const settingsUi = new JSML(document.getElementById("settings-window"));
    settingsUi.ui(ui => {
        ui.div(ui => {
            ui.h2(ui => ui.text(I18N[LANG.get()].SETTINGS.TITLE));
            ui.div(_ => { }).class("side-seperator");
            ui.button(ui => {
                ui.html(icons.close).class("icon");
            })
                .class("icon-btn")
                .click(_ => {
                showSettings.set(false);
            });
        }).class("settings-title-bar");
        ui.div(ui => {
            ui.h3(ui => {
                ui.html(icons.language).class("icon");
                ui.text(I18N[LANG.get()].SETTINGS.LANGUAGE);
            });
            ui.div(ui => {
                ui.button(ui => ui.text(I18N["en_us"].LANGS.EN_US))
                    .classIf("focus", () => LANG.get() === "en_us")
                    .click(_ => LANG.set("en_us"));
                ui.button(ui => ui.text(I18N["de_de"].LANGS.DE_DE))
                    .classIf("focus", () => LANG.get() === "de_de")
                    .click(_ => LANG.set("de_de"));
                ui.button(ui => ui.text(I18N["la_ro"].LANGS.LA_RO))
                    .classIf("focus", () => LANG.get() === "la_ro")
                    .click(_ => LANG.set("la_ro"));
            }).class("settings-buttons-select");
            ui.div(ui => {
                ui.h3(ui => {
                    ui.html(icons.display).class("icon");
                    ui.text(I18N[LANG.get()].SETTINGS.GRAPHICS);
                });
                ui.div(ui => {
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.BLUR);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.OFF))
                            .classIf("focus", () => settings.graphics.blur.get() === "off")
                            .click(_ => settings.graphics.blur.set("off"));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.LOW))
                            .classIf("focus", () => settings.graphics.blur.get() === "low")
                            .click(_ => settings.graphics.blur.set("low"));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.HIGH))
                            .classIf("focus", () => settings.graphics.blur.get() === "high")
                            .click(_ => settings.graphics.blur.set("high"));
                    }).class("settings-buttons-select");
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.BACKGROUND);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.BACKGROUND_FLAT))
                            .classIf("focus", () => !settings.graphics.shaded_background.get())
                            .click(_ => settings.graphics.shaded_background.set(false));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.BACKGROUND_SHADED))
                            .classIf("focus", settings.graphics.shaded_background)
                            .click(_ => settings.graphics.shaded_background.set(true));
                    }).class("settings-buttons-select");
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.GATE_SYMBOLS);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.GATE_SYMBOLS_ANSI))
                            .classIf("focus", () => settings.graphics.gate_symbols.get() === "ansi")
                            .click(_ => settings.graphics.gate_symbols.set("ansi"));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.GATE_SYMBOLS_IEC))
                            .classIf("focus", () => settings.graphics.gate_symbols.get() === "iec")
                            .click(_ => settings.graphics.gate_symbols.set("iec"));
                    }).class("settings-buttons-select");
                }).class("settings-subsection-inner");
            }).class("settings-subsection");
            ui.div(ui => {
                ui.h3(ui => {
                    ui.html(icons.cube).class("icon");
                    ui.text(I18N[LANG.get()].SETTINGS.ADVANCED);
                });
                ui.div(ui => {
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.DEBUG_DISPLAY);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.HIDE))
                            .classIf("focus", () => !settings.advanced.debug_display.get())
                            .click(_ => settings.advanced.debug_display.set(false));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.SHOW))
                            .classIf("focus", settings.advanced.debug_display)
                            .click(_ => settings.advanced.debug_display.set(true));
                    }).class("settings-buttons-select");
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.PERF_GRAPH);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.HIDE))
                            .classIf("focus", () => !settings.advanced.perf_graph.get())
                            .click(_ => settings.advanced.perf_graph.set(false));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.SHOW))
                            .classIf("focus", settings.advanced.perf_graph)
                            .click(_ => settings.advanced.perf_graph.set(true));
                    }).class("settings-buttons-select");
                }).class("settings-subsection-inner");
            }).class("settings-subsection");
        }).class("settings-main");
    });
}
function effectAndInit(signal, fn) {
    directEffect(signal, fn);
    fn();
}
function rectHitbox(pos, pos2, target) {
    return pos.sub(target).x < 0 && pos.sub(target).y < 0 &&
        pos2.sub(target).x > 0 && pos2.sub(target).y > 0;
}
