import { JSML } from "../jsml/jsml.js";
import { I18N, LANG } from "../lang.js";
export function keyboardTipsPlugin(world) {
    const keyboardTipsUI = new JSML(document.getElementById("keyboard-tips-container"));
    keyboardTipsUI.ui(ui => {
        ui.p(ui => {
            ui.tag("span", ui => ui.text(I18N[LANG.get()].KEYBOARD.CTRL_PC)).class("keyboard-key").class("modifier-key");
            ui.tag("span", ui => ui.text(I18N[LANG.get()].KEYBOARD.CTRL_MAC)).class("keyboard-key").class("modifier-key");
            ui.text(": " + I18N[LANG.get()].TIPS.MOVE_NODE);
        });
        ui.p(ui => {
            ui.tag("span", ui => ui.text(I18N[LANG.get()].KEYBOARD.ALT_PC)).class("keyboard-key").class("modifier-key");
            ui.tag("span", ui => ui.text(I18N[LANG.get()].KEYBOARD.ALT_MAC)).class("keyboard-key").class("modifier-key");
            ui.text(": " + I18N[LANG.get()].TIPS.DISCONNECT);
        });
    });
}
