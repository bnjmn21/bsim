import { Plugins } from "../engine/ecs.js";
import { Canvas } from "../engine/engine.js";
import * as icons from "../icons.js";
export function loadingSpinner(ui) {
    ui.div(ui => {
        ui.tag("canvas", _ => { })
            .class("spinner-canvas")
            .then(e => {
            const canvas = new Canvas(e);
            canvas.autoFitToParent();
        });
    }).class("spinner");
}
export function copyLink(ui, link) {
    let copyInput;
    ui.div(ui => {
        ui.tag("input", _ => { })
            .attribute("type", "text")
            .attribute("disabled", "true")
            .attribute("value", link.get())
            .then(e => copyInput = e);
        ui.div(ui => {
            ui.button(ui => {
                ui.html(icons.copy)
                    .class("icon")
                    .click(async (_) => {
                    try {
                        await navigator.clipboard.writeText(link.get());
                        copyInput.animate([
                            { background: "#007f00", border: "1px solid #00ff00" },
                            {}
                        ], { duration: 1000 });
                    }
                    catch { }
                });
            }).class("icon-btn");
        });
    }).class("link-copy");
}
export function selectOptions(ui, options, value) {
    ui.div(ui => {
        for (const [key, option] of Object.entries(options)) {
            ui.button(option)
                .classIf("target", () => value.get() === key)
                .click(_ => {
                value.set(key);
            });
        }
    }).class("select-options");
}
export function uiComponentsPlugin(world) {
    const { Loop, time } = world.plugin(Plugins.time);
    world.system(Loop, [], _ => {
        const angleA = (time.s() * (Math.PI * 1)) % (Math.PI * 2);
        const angleB = (time.s() * (Math.PI * 2)) % (Math.PI * 2);
        const invert = time.s() % 4 >= 2;
        const startAngle = invert ? angleB : angleA;
        const endAngle = invert ? angleA : angleB;
        const spinners = document.getElementsByClassName("spinner-canvas");
        for (const spinner of spinners) {
            const canvas = new Canvas(spinner);
            const ctx = canvas.getContext2d();
            const smallestSide = Math.min(canvas.size().x, canvas.size().y);
            ctx.clearRect(0, 0, canvas.size().x, canvas.size().y);
            ctx.strokeStyle = getComputedStyle(spinner).color;
            ctx.lineCap = "butt";
            ctx.lineWidth = smallestSide / 10;
            ctx.beginPath();
            ctx.arc(canvas.size().x / 2, canvas.size().y / 2, (smallestSide - (smallestSide / 10)) / 2, startAngle, endAngle);
            ctx.stroke();
        }
    });
}
export function isAncestorOf(node, ancestor) {
    let currentNode = node;
    while (true) {
        if (currentNode === ancestor)
            return true;
        const newNode = currentNode.parentElement;
        if (newNode === null)
            return false;
        currentNode = newNode;
    }
}
