import { penToSquare } from "./fa-icons.js";
import { JSML } from "./jsml/jsml.js";
import { signals } from "./jsml/signals.js";

const circuitName = signals.value("Unnamed circuit");

export function bsim(world) {
    renderTitleBar();
}

function renderTitleBar() {
    const titleBarTextEditSizeTest = document.getElementById("title-bar-text-edit");

    let tempName = circuitName.get();
    const editingName = signals.value(false);
    const editFieldWidth = signals.computed(() => {
        titleBarTextEditSizeTest.innerText = tempName;
        return `${titleBarTextEditSizeTest.offsetWidth}px`;
    });
    const circuitNameIsNull = signals.computed(() => circuitName.get() === null);

    const titleBar = new JSML(document.getElementById("title-bar"));
    let renameField = null;
    let editBtn = null;

    titleBar.ui(ui => {
        ui.h1(ui => {
            ui.text("BSim");
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
                ui.html(penToSquare)
                    .class("icon")
                    .classIf("focus", editingName);
            })
                .class("edit-btn")
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
        }
    });
}