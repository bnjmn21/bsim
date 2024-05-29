import { hoverState, keys } from "../bsim.js";
import { World } from "../engine/ecs.js";
import { leftClick } from "../icons.js";
import { JSML, Ui } from "../jsml/jsml.js";
import { signals } from "../jsml/signals.js";
import { I18N, LANG } from "../lang.js";

function key(ui: Ui, text: () => string, isMod: boolean = false) {
    const span = ui.tag("span", ui => ui.text(text)).class("keyboard-key");
    if (isMod) {
        span.class("modifier-key");
    }
}

function icon(ui: Ui, icon: string) {
    ui.html(icon).class("icon");
}

function tip(ui: Ui, keys: (ui: Ui) => void, text: (ui: Ui) => void) {
    ui.p(ui => {
        keys(ui);
        ui.text(": ");
        text(ui);
    });
}

export function keyboardTipsPlugin(world: World) {
    const keyboardTipsUI = new JSML(document.getElementById("keyboard-tips-container") as HTMLElement);
    keyboardTipsUI.ui(ui => {
        if (hoverState.wireNode.get()) {
            tip(ui, ui => {
                key(ui, () => I18N[LANG.get()].KEYBOARD.CTRL_PC, true);
                key(ui, () => I18N[LANG.get()].KEYBOARD.META_MAC, true);
            }, ui => {
                ui.text(() => I18N[LANG.get()].TIPS.MOVE_NODE);
            });
        }

        if (hoverState.inputNode.get()) {
            tip(ui, ui => {
                key(ui, () => I18N[LANG.get()].KEYBOARD.ALT_PC, true);
                key(ui, () => I18N[LANG.get()].KEYBOARD.ALT_MAC, true);
            }, ui => {
                ui.text(() => I18N[LANG.get()].TIPS.DISCONNECT);
            });
        }

        if (hoverState.hitbox.get()) {
            tip(ui, ui => {
                icon(ui, leftClick);
            }, ui => {
                ui.text(() => I18N[LANG.get()].TIPS.INTERACT);
            });
        }
    });
}