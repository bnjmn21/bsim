import { Block, Circuit, deselectAll, getSelectedBlocks } from "../blocks.js";
import { dragging, selectionFrame } from "../bsim.js";
import { Vec2 } from "../engine/engine.js";
import { copy, garbage, pan } from "../icons.js";
import { JSML } from "../jsml/jsml.js";
import { signals } from "../jsml/signals.js";
export const selectionX = signals.value(0);
export const selectionY = signals.value(0);
export const selectionW = signals.value(0);
export const showSelectionTools = signals.value(false);
export function selectionToolsPlugin(world, camera) {
    const selectionToolsUI = new JSML(document.getElementById("selection-tools-container"));
    selectionToolsUI.ui(ui => {
        ui.div(ui => {
            ui.button(ui => {
                ui.html(pan).class("icon");
            }).class("icon-btn")
                .addEventListener("pointerdown", _ => {
                showSelectionTools.set(false);
                const selFrame = selectionFrame.inner;
                dragging.inner = {
                    type: "moveSelection",
                    start: camera.mouseWorldCoords(),
                    blockPositions: getSelectedBlocks(world).map(v => v.pos.pos),
                    initialSelFrame: {
                        pos1: selFrame.pos1.clone(),
                        pos2: selFrame.pos2.clone(),
                    }
                };
            });
            ui.button(ui => {
                ui.html(copy).class("icon");
            }).class("icon-btn")
                .addEventListener("pointerdown", _ => {
                showSelectionTools.set(false);
                const selFrame = selectionFrame.inner;
                const selected = Circuit.fromBlocks(getSelectedBlocks(world), undefined, "remove");
                deselectAll(world);
                selectionFrame.inner = selFrame;
                selected.load(world, camera, new Vec2(0), true);
                dragging.inner = {
                    type: "moveSelection",
                    start: camera.mouseWorldCoords(),
                    blockPositions: getSelectedBlocks(world).map(v => v.pos.pos),
                    initialSelFrame: {
                        pos1: selFrame.pos1.clone(),
                        pos2: selFrame.pos2.clone(),
                    }
                };
            });
            ui.button(ui => {
                ui.html(garbage).class("icon");
            }).class("icon-btn").addEventListener("pointerdown", _ => {
                getSelectedBlocks(world).forEach(v => {
                    for (const e of world.getEntities(Block)) {
                        for (const [idx, input] of e(Block).inputs.entries()) {
                            if (typeof input === "object") {
                                if (input.block === v) {
                                    e(Block).inputs[idx] = false;
                                }
                            }
                        }
                    }
                    v.remove(world);
                });
                deselectAll(world);
            });
        })
            .class("selection-tools")
            .style("top", signals.computed(() => `${selectionY.get()}px`))
            .style("left", signals.computed(() => `${selectionX.get() + (selectionW.get() / 2)}px`))
            .classIf("show", showSelectionTools);
    });
}
