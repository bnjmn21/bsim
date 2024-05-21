import { blocks, settings } from "../bsim.js";
import { JSML } from "../jsml/jsml.js";
import { I18N, LANG } from "../lang.js";
export function blockMenuPlugin(world) {
    const blockMenuUI = new JSML(document.getElementById("block-menu"));
    blockMenuUI.ui(ui => {
        for (const name in blocks) {
            ui.h2(ui => ui.text(I18N[LANG.get()][name.toUpperCase()]));
            ui.div(ui => {
                settings.graphics.gate_symbols.get(); //cause a rerender of this
                for (const block of blocks[name]) {
                    ui.tag("canvas", _ => { })
                        .attribute("width", "50")
                        .attribute("height", "50")
                        .class("block")
                        .then(e => {
                        const ctx = e.getContext("2d");
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
