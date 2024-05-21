import { GRID_SIZE, blocks, settings } from "../bsim.js";
import { World } from "../engine/ecs.js";
import { JSML } from "../jsml/jsml.js";
import { I18N, LANG } from "../lang.js";

export function blockMenuPlugin(world: World) {
    const blockMenuUI = new JSML(document.getElementById("block-menu") as HTMLElement);
    blockMenuUI.ui(ui => {
        for (const name in blocks) {
            ui.h2(ui => ui.text(I18N[LANG.get()][name.toUpperCase() as Uppercase<keyof typeof blocks>]));
            ui.div(ui => {
                settings.graphics.gate_symbols.get(); //cause a rerender of this
                for (const block of blocks[name as keyof typeof blocks]) {
                    ui.tag("canvas", _ => {})
                        .attribute("width", "50")
                        .attribute("height", "50")
                        .class("block")
                        .then(e => {
                            const ctx = (e as HTMLCanvasElement).getContext("2d") as CanvasRenderingContext2D;
                            ctx.clearRect(0, 0, 50, 50);
                            ctx.translate(25, 25);
                            ctx.scale((1 / block.icon_size) * 50, (1 / block.icon_size) * 50);
                            ctx.translate(-block.center.x, -block.center.y);
                            block.default.render(ctx);
                        });
                }
            }).class("block-category");
        }
    });
}