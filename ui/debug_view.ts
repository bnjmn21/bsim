import { overlayCanvas, settings } from "../bsim.js";
import { Plugins, Time, World } from "../engine/ecs.js";
import { Vec2 } from "../engine/engine.js";
import { APieceOfCake, LineGraph, PieGraph } from "../engine/graphs.js";

export const perfData = {
    render: {
        total: 0,
        bg: 0,
        nodes: 0,
        wires: 0,
        blocks: 0,
        other: 0,
    },
    simulation: 0,

    idle: 0,
    other: 0,

    last_idle_start: 0,
    last_frame_start: 0,
};

export const lastFrameTimes: number[] = [];

export function debugViewPlugin(world: World) {
    const { time, Loop, AfterLoop } = world.plugin(Plugins.time);
    const rem = parseFloat(getComputedStyle(document.body).fontSize);
    const FPSSize = new Vec2(100, 40);
    const FPSGraph = new LineGraph(overlayCanvas.context2d, new Vec2(0, rem * 3), FPSSize);
    const pieGraph = new PieGraph(overlayCanvas.context2d, overlayCanvas.size().sub(new Vec2(200)), 150);
    let showIdleInPieGraph = true;
    let currentPieGraph = 0;
    document.addEventListener("keypress", e => {
        if (e.key === "i") {
            showIdleInPieGraph = !showIdleInPieGraph;
        } else if (!isNaN(parseInt(e.key))) {
            currentPieGraph = parseInt(e.key);
        }
    });
    world.system(Loop, _ => {
        perfData.last_frame_start = time.ms();
        perfData.simulation = 0;
        perfData.render.total = 0;
        perfData.render.bg = 0;
        perfData.render.nodes = 0;
        perfData.render.wires = 0;
        perfData.render.blocks = 0;
        perfData.render.other = 0;
    });
    world.system(AfterLoop, _ => {
        const ctx = overlayCanvas.context2d;
        if (settings.advanced.debug_display.get()) {
            if (lastFrameTimes.length > 60) {
                lastFrameTimes.shift();
                lastFrameTimes.push(time.deltaS());
            } else {
                lastFrameTimes.push(time.deltaS());
            }
            const avgFPS = 1 / (lastFrameTimes.reduce((p, c) => p+c) / lastFrameTimes.length);
            const fillGradient = ctx.createLinearGradient(0, rem * 3, 0, rem * 3 + FPSSize.y);
            fillGradient.addColorStop(0, "#00ff007f");
            fillGradient.addColorStop(1, "#00ff0000");
            ctx.fillStyle = fillGradient;
            const strokeGradient = ctx.createLinearGradient(0, rem * 3, 0, rem * 3 + FPSSize.y);
            strokeGradient.addColorStop(0, "#ff0000");
            strokeGradient.addColorStop(1, "#00ff00");
            ctx.strokeStyle = strokeGradient;
            FPSGraph.render(lastFrameTimes, 1 / 60 * 3);
            ctx.fillStyle = "#ffffff7f";
            ctx.font = `20px "JetBrains Mono", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`FPS:${avgFPS.toPrecision(2)}`, FPSSize.x / 2, rem * 3 + (FPSSize.y / 2));
        }
        if (settings.advanced.perf_graph.get()) {
            const total = time.ms() - perfData.last_frame_start;
            perfData.idle = time.ms() - perfData.last_idle_start;

            perfData.render.total = perfData.render.bg + perfData.render.nodes + perfData.render.wires + perfData.render.blocks + perfData.render.other;

            perfData.other = total - (perfData.render.total + perfData.simulation);
            pieGraph.center = overlayCanvas.size().sub(new Vec2(200));
            const pieces: APieceOfCake[] = [];
            if (currentPieGraph === 0) {
                pieces.push({name: "render", style: "#ff0000", val: perfData.render.total});
                pieces.push({name: "simulation", style: "#00ffff", val: perfData.simulation});
                pieces.push({name: "other", style: "#ffff00", val: perfData.other});
                if (showIdleInPieGraph) {
                    pieces.push({name: "idle", style: "#7f7f7f", val: perfData.idle});
                }
            } else if (currentPieGraph === 1) {
                pieces.push({name: "bg", style: "#ff0000", val: perfData.render.bg});
                pieces.push({name: "nodes", style: "#00ffff", val: perfData.render.nodes});
                pieces.push({name: "wires", style: "#ffff00", val: perfData.render.wires});
                pieces.push({name: "blocks", style: "#0000ff", val: perfData.render.blocks});
                pieces.push({name: "other", style: "#00ff00", val: perfData.render.other});
            }
            pieGraph.render(pieces);
            ctx.fillStyle = "#ffffff";
            if (currentPieGraph === 0) {
                ctx.fillText("[0] MAIN", overlayCanvas.size().x - 200, overlayCanvas.size().y - 40);
            } else if (currentPieGraph === 1) {
                ctx.fillText("[1] RENDER", overlayCanvas.size().x - 200, overlayCanvas.size().y - 40);
            }
            ctx.fillText("[0-9] Select graph", overlayCanvas.size().x - 200, overlayCanvas.size().y - 30);
            if (currentPieGraph === 0) {
                ctx.fillText("[i] Toggle idle time", overlayCanvas.size().x - 200, overlayCanvas.size().y - 20);
            }
            perfData.last_idle_start = time.ms();
        }
    });
}

export function timed<T>(time: Time, fn: () => T): [number, T] {
    const startTime = time.ms();
    const returnVal = fn();
    return [time.ms() - startTime, returnVal];
}