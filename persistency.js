import { Value, signals } from "./jsml/signals.js";
import { LANG } from "./lang.js";
export function saveSettings(s) {
    const jsonSettings = JSON.stringify(s, (k, v) => {
        if (v instanceof Value) {
            return v.value;
        }
        return v;
    });
    try {
        localStorage.setItem("settingsVersion", "1");
        localStorage.setItem("settings", jsonSettings);
        localStorage.setItem("lang", LANG.get());
    }
    catch {
        console.warn("Unable to save settings.");
    }
}
export function loadSettings() {
    const lang = localStorage.getItem("lang");
    if (lang) {
        LANG.set(lang);
    }
    const version = localStorage.getItem("settingsVersion");
    if (version === null) {
        return {
            graphics: {
                blur: signals.value("low"),
                gate_symbols: signals.value("ansi"),
            },
            advanced: {
                debug_display: signals.value(false),
                perf_graph: signals.value(false),
            }
        };
    }
    const s = localStorage.getItem("settings");
    if (version === "1") {
        return JSON.parse(s, (k, v) => {
            if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") {
                return signals.value(v);
            }
            return v;
        });
    }
    throw new Error(`Trying to load settings... from the future???!?! (settingsVersion: ${version})`);
}
