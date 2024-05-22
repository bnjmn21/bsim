import { blocks, settings } from "../bsim.js";
import { Canvas } from "../engine/engine.js";
import { JSML } from "../jsml/jsml.js";
import { I18N, LANG } from "../lang.js";
export function blockMenuPlugin(world) {
    const blockMenuUI = new JSML(document.getElementById("block-menu"));
    blockMenuUI.ui(ui => {
        for (const name in blocks) {
            ui.h2(ui => ui.text(I18N[LANG.get()].CATEGORIES[name.toUpperCase()]));
            ui.div(ui => {
                settings.graphics.gate_symbols.get(); //cause a rerender of this
                for (const block of blocks[name]) {
                    ui.div(ui => {
                        ui.div(ui => {
                            ui.tag("canvas", _ => { })
                                .then(e => {
                                requestAnimationFrame(() => {
                                    const canvas = new Canvas(e);
                                    canvas.fitToParent();
                                    const ctx = canvas.getContext2d();
                                    ctx.clearRect(0, 0, canvas.size().x, canvas.size().y);
                                    ctx.translate(canvas.size().x / 2, canvas.size().y / 2);
                                    ctx.scale((1 / block.iconSize) * canvas.size().x, (1 / block.iconSize) * canvas.size().y);
                                    ctx.translate(-block.center.x, -block.center.y);
                                    block.default.render(ctx);
                                });
                            });
                        })
                            .class("block-canvas-container");
                    })
                        .class("block")
                        .attribute("data-name", I18N[LANG.get()].BLOCKS[block.name]);
                }
            }).class("block-category");
        }
    });
}
