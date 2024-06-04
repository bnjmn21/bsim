import { Circuit } from "./blocks.js";
import { b64Decode, b64Encode } from "./engine/binary.js";
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
        return initSettings();
    }
    const data = localStorage.getItem("settings");
    if (version === "1") {
        return loadSettingsV1(data);
    }
    throw new Error(`Trying to load settings... from the future???!?! (settingsVersion: ${version})`);
}
function initSettings() {
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
function loadSettingsV1(data) {
    return JSON.parse(data, (k, v) => {
        if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") {
            return signals.value(v);
        }
        return v;
    });
}
export function saveCircuitAsLink(circuit) {
    const bin = circuit.serializeBinary();
    return new URL("?d=" + b64Encode(bin), location.origin);
}
export function saveCircuitAsFileLink(circuit, format) {
    switch (format) {
        case "binary":
            const bin = circuit.serializeBinary();
            var blob = new Blob([bin]);
            return URL.createObjectURL(blob);
        case "json":
            const text = new TextEncoder().encode(circuit.serializeJSON());
            var blob = new Blob([text]);
            return URL.createObjectURL(blob);
    }
}
export function loadCircuitFromLink(link) {
    const b64 = link.searchParams.get("d");
    const bin = b64Decode(b64);
    return Circuit.deserializeBinary(bin);
}
export async function loadCircuitFromFile(file) {
    const bin = new Uint8Array(await file.arrayBuffer());
    const type = sniffFileType(bin);
    switch (type) {
        case "binary":
            return loadCircuitFromBinFile(bin);
        case "json":
            return loadCircuitFromJSONFile(bin);
    }
}
function loadCircuitFromBinFile(input) {
    return Circuit.deserializeBinary(input);
}
function loadCircuitFromJSONFile(input) {
    return Circuit.deserializeJSON(new TextDecoder("utf-8").decode(input));
}
function sniffFileType(input) {
    const jsonMagicNumbers = "\r\n\t {";
    for (const magicNumber of jsonMagicNumbers) {
        if (input[0] === new TextEncoder().encode(magicNumber)[0]) {
            return "json";
        }
    }
    return "binary";
}
