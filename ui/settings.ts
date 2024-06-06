import { World } from "../engine/ecs.js";
import { JSML, Ui } from "../jsml/jsml.js";
import { I18N, LANG } from "../lang.js";
import * as icons from "../icons.js";
import { Value, signals } from "../jsml/signals.js";
import { effectAndInit, settings } from "../bsim.js";
import { saveSettings } from "../persistency.js";
import { showInputEvents } from "./debug_view.js";

export const showSettings = signals.value(false);
effectAndInit(showSettings, () => {
    if (showSettings.get()) {
        (document.getElementById("settings-container") as HTMLElement).classList.add("show");
    } else {
        (document.getElementById("settings-container") as HTMLElement).classList.remove("show");
    }
});

function section(ui: Ui, icon: string, name: () => string, inner: (ui: Ui) => void) {
    ui.div(ui => {
        ui.h3(ui => {
            ui.html(icon).class("icon");
            ui.text(name);
        });
        ui.div(inner).class("settings-subsection-inner");
    }).class("settings-subsection");
}

function setting(ui: Ui, name: () => string, inner: (ui: Ui) => void) {
    ui.h4(ui => {
        ui.text(name);
    });
    ui.div(inner).class("settings-buttons-select");
}

function option<T>(ui: Ui, name: () => string, signal: Value<T>, value: T) {
    ui.button(ui => ui.text(name))
        .classIf("focus", () => signal.get() === value)
        .click(_ => signal.set(value));
}

function note(ui: Ui, text: () => string) {
    ui.p(ui => ui.text(text)).class("setting-note");
}

export function settingsPlugin(world: World) {
    const settingsUi = new JSML(document.getElementById("settings-window") as HTMLElement);
    settingsUi.ui(ui => {
        ui.div(ui => {
            ui.h2(ui => ui.text(I18N[LANG.get()].SETTINGS.TITLE));
            ui.div(_ => {}).class("side-seperator");
            ui.button(ui => {
                ui.html(icons.close).class("icon");
            })
                .class("icon-btn")
                .click(_ => {
                    showSettings.set(false);
                    saveSettings(settings);
                });
        }).class("settings-title-bar");
        ui.div(ui => {
            ui.h3(ui => {
                ui.html(icons.language).class("icon");
                ui.text(I18N[LANG.get()].SETTINGS.LANGUAGE);
            });
            ui.div(ui => {
                ui.button(ui => ui.text(I18N["en_us"].LANGS.EN_US))
                    .classIf("focus", () => LANG.get() === "en_us")
                    .click(_ => LANG.set("en_us"));
                ui.button(ui => ui.text(I18N["de_de"].LANGS.DE_DE))
                    .classIf("focus", () => LANG.get() === "de_de")
                    .click(_ => LANG.set("de_de"));
            }).class("settings-buttons-select");
            section(ui, icons.display, () => I18N[LANG.get()].SETTINGS.GRAPHICS, ui => {
                setting(ui, () => I18N[LANG.get()].SETTINGS.BLUR, ui => {
                    option(ui, () => I18N[LANG.get()].SETTINGS.OFF, settings.graphics.blur, "off");
                    option(ui, () => I18N[LANG.get()].SETTINGS.LOW, settings.graphics.blur, "low");
                    option(ui, () => I18N[LANG.get()].SETTINGS.HIGH, settings.graphics.blur, "high");
                });
                setting(ui, () => I18N[LANG.get()].SETTINGS.GATE_SYMBOLS, ui => {
                    option(ui, () => I18N[LANG.get()].SETTINGS.GATE_SYMBOLS_ANSI, settings.graphics.gate_symbols, "ansi");
                    option(ui, () => I18N[LANG.get()].SETTINGS.GATE_SYMBOLS_IEC, settings.graphics.gate_symbols, "iec");
                });
            });
            section(ui, icons.cube, () => I18N[LANG.get()].SETTINGS.ADVANCED, ui => {
                setting(ui, () => I18N[LANG.get()].SETTINGS.DEBUG_DISPLAY, ui => {
                    option(ui, () => I18N[LANG.get()].SETTINGS.HIDE, settings.advanced.debug_display, false);
                    option(ui, () => I18N[LANG.get()].SETTINGS.SHOW, settings.advanced.debug_display, true);
                });
                setting(ui, () => I18N[LANG.get()].SETTINGS.PERF_GRAPH, ui => {
                    option(ui, () => I18N[LANG.get()].SETTINGS.HIDE, settings.advanced.perf_graph, false);
                    option(ui, () => I18N[LANG.get()].SETTINGS.SHOW, settings.advanced.perf_graph, true);
                });
                note(ui, () => I18N[LANG.get()].SETTINGS.PERF_GRAPH_NOTE);
                setting(ui, () => I18N[LANG.get()].SETTINGS.INPUT_EVENTS, ui => {
                    option(ui, () => I18N[LANG.get()].SETTINGS.HIDE, showInputEvents, false);
                    option(ui, () => I18N[LANG.get()].SETTINGS.SHOW, showInputEvents, true);
                });
            });
        }).class("settings-main");
    });
}