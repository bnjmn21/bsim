import { settings } from "./bsim.js";
import { Value, signals } from "./jsml/signals.js";
import { LANG } from "./lang.js";

type Settings = {
    graphics: {
        blur: Value<"off"|"low"|"high">,
        gate_symbols: Value<"ansi"|"iec">,
    },
    advanced: {
        debug_display: Value<boolean>,
        perf_graph: Value<boolean>,
    }
}

export function saveSettings(s: Settings) {
    const jsonSettings = JSON.stringify(s, (k: string, v: any) => {
        if (v instanceof Value) {
            return v.value;
        }
    
        return v;
    });
    try {
        localStorage.setItem("settingsVersion", "1");
        localStorage.setItem("settings", jsonSettings);
        localStorage.setItem("lang", LANG.get());
    } catch {
        console.warn("Unable to save settings.");
    }
}

export function loadSettings(): Settings {
    const lang = localStorage.getItem("lang");
    if (lang) {
        LANG.set(lang as typeof LANG["value"]);
    }
    const version = localStorage.getItem("settingsVersion");
    if (version === null) {
        return {
            graphics: {
                blur: signals.value<"off"|"low"|"high">("low"),
                gate_symbols: signals.value<"ansi"|"iec">("ansi"),
            },
            advanced: {
                debug_display: signals.value(true),
                perf_graph: signals.value(false),
            }
        }
    }
    const s = localStorage.getItem("settings") as string;
    if (version === "1") {
        return JSON.parse(s, (k: string, v: any) => {
            if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") {
                return signals.value(v);
            }

            return v;
        });
    }
    throw new Error(`Trying to load settings... from the future???!?! (settingsVersion: ${version})`);
}