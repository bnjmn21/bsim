import { circuitName, effectAndInit, settings } from "../bsim.js";
import { World } from "../engine/ecs.js";
import { JSML } from "../jsml/jsml.js";
import { signals } from "../jsml/signals.js";
import { I18N, LANG } from "../lang.js";
import * as icons from "../icons.js";
import { showSettings } from "./settings.js";

export function titleBarPlugin(world: World) {
    const titleBarTextEditSizeTest = document.getElementById("title-bar-text-edit") as HTMLElement;

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

    const titleBar = new JSML(document.getElementById("title-bar") as HTMLElement);
    let renameField: HTMLElement | null = null;
    let editBtn: HTMLElement | null = null;

    titleBar.ui(ui => {
        ui.h1(ui => {
            ui.text(I18N[LANG.get()].NAME);
        });
        if (!circuitNameIsNull.get()) {
            ui.p(ui => ui.text("/")).class("slash");
            ui.div(ui => {
                if (!editingName.get()) {
                    ui.p(ui => ui.text(() => `${circuitName.get()}`)).class("sub-section");
                } else {
                    editFieldWidth.setDirty();
                    ui.tag("input", () => {})
                        .attribute("type", "text")
                        .attribute("value", tempName)
                        .class("rename-input")
                        .style("width", editFieldWidth)
                        .then(e => {
                            renameField = e;
                            e.focus();
                        })
                        .addEventListener("input", e => {
                            tempName = (e.target as HTMLInputElement).value;
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
                                (e.target as HTMLElement).blur();
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
                    } else {
                        circuitName.set(tempName);
                    }
                })
                .then(e => {
                    editBtn = e;
                });
            ui.div(_ => {}).class("side-seperator");
            ui.button(ui => {
                ui.html(icons.settings).class("icon");
            })
                .class("icon-btn")
                .click(_ => {
                    showSettings.set(true);
                });
        }
    });
}