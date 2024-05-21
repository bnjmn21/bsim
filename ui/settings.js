import { JSML } from "../jsml/jsml.js";
import { I18N, LANG } from "../lang.js";
import * as icons from "../icons.js";
import { signals } from "../jsml/signals.js";
import { effectAndInit, settings } from "../bsim.js";
export const showSettings = signals.value(false);
effectAndInit(showSettings, () => {
    if (showSettings.get()) {
        document.getElementById("settings-container").classList.add("show");
    }
    else {
        document.getElementById("settings-container").classList.remove("show");
    }
});
export function settingsPlugin(world) {
    const settingsUi = new JSML(document.getElementById("settings-window"));
    settingsUi.ui(ui => {
        ui.div(ui => {
            ui.h2(ui => ui.text(I18N[LANG.get()].SETTINGS.TITLE));
            ui.div(_ => { }).class("side-seperator");
            ui.button(ui => {
                ui.html(icons.close).class("icon");
            })
                .class("icon-btn")
                .click(_ => {
                showSettings.set(false);
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
                ui.button(ui => ui.text(I18N["la_ro"].LANGS.LA_RO))
                    .classIf("focus", () => LANG.get() === "la_ro")
                    .click(_ => LANG.set("la_ro"));
            }).class("settings-buttons-select");
            ui.div(ui => {
                ui.h3(ui => {
                    ui.html(icons.display).class("icon");
                    ui.text(I18N[LANG.get()].SETTINGS.GRAPHICS);
                });
                ui.div(ui => {
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.BLUR);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.OFF))
                            .classIf("focus", () => settings.graphics.blur.get() === "off")
                            .click(_ => settings.graphics.blur.set("off"));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.LOW))
                            .classIf("focus", () => settings.graphics.blur.get() === "low")
                            .click(_ => settings.graphics.blur.set("low"));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.HIGH))
                            .classIf("focus", () => settings.graphics.blur.get() === "high")
                            .click(_ => settings.graphics.blur.set("high"));
                    }).class("settings-buttons-select");
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.BACKGROUND);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.BACKGROUND_FLAT))
                            .classIf("focus", () => !settings.graphics.shaded_background.get())
                            .click(_ => settings.graphics.shaded_background.set(false));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.BACKGROUND_SHADED))
                            .classIf("focus", settings.graphics.shaded_background)
                            .click(_ => settings.graphics.shaded_background.set(true));
                    }).class("settings-buttons-select");
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.GATE_SYMBOLS);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.GATE_SYMBOLS_ANSI))
                            .classIf("focus", () => settings.graphics.gate_symbols.get() === "ansi")
                            .click(_ => settings.graphics.gate_symbols.set("ansi"));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.GATE_SYMBOLS_IEC))
                            .classIf("focus", () => settings.graphics.gate_symbols.get() === "iec")
                            .click(_ => settings.graphics.gate_symbols.set("iec"));
                    }).class("settings-buttons-select");
                }).class("settings-subsection-inner");
            }).class("settings-subsection");
            ui.div(ui => {
                ui.h3(ui => {
                    ui.html(icons.cube).class("icon");
                    ui.text(I18N[LANG.get()].SETTINGS.ADVANCED);
                });
                ui.div(ui => {
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.DEBUG_DISPLAY);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.HIDE))
                            .classIf("focus", () => !settings.advanced.debug_display.get())
                            .click(_ => settings.advanced.debug_display.set(false));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.SHOW))
                            .classIf("focus", settings.advanced.debug_display)
                            .click(_ => settings.advanced.debug_display.set(true));
                    }).class("settings-buttons-select");
                    ui.h4(ui => {
                        ui.text(I18N[LANG.get()].SETTINGS.PERF_GRAPH);
                    });
                    ui.div(ui => {
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.HIDE))
                            .classIf("focus", () => !settings.advanced.perf_graph.get())
                            .click(_ => settings.advanced.perf_graph.set(false));
                        ui.button(ui => ui.text(I18N[LANG.get()].SETTINGS.SHOW))
                            .classIf("focus", settings.advanced.perf_graph)
                            .click(_ => settings.advanced.perf_graph.set(true));
                    }).class("settings-buttons-select");
                }).class("settings-subsection-inner");
            }).class("settings-subsection");
        }).class("settings-main");
    });
}
