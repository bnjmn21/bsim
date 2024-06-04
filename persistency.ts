import { Circuit } from "./blocks.js";
import { settings } from "./bsim.js";
import { b64Decode, b64Encode } from "./engine/binary.js";
import { World } from "./engine/ecs.js";
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
        return initSettings();
    }
    const data = localStorage.getItem("settings") as string;
    if (version === "1") {
        return loadSettingsV1(data);
    }
    throw new Error(`Trying to load settings... from the future???!?! (settingsVersion: ${version})`);
}

function initSettings(): Settings {
    return {
        graphics: {
            blur: signals.value<"off"|"low"|"high">("low"),
            gate_symbols: signals.value<"ansi"|"iec">("ansi"),
        },
        advanced: {
            debug_display: signals.value(false),
            perf_graph: signals.value(false),
        }
    }
}

function loadSettingsV1(data: string): Settings {
    return JSON.parse(data, (k: string, v: any) => {
        if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") {
            return signals.value(v);
        }

        return v;
    });
}


export function saveCircuitAsLink(circuit: Circuit): URL {
    const bin = circuit.serializeBinary();
    return new URL("?d="+b64Encode(bin), location.origin);
}

export function saveCircuitAsFileLink(circuit: Circuit, format: "binary" | "json"): string {
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

export function loadCircuitFromLink(link: URL): Circuit {
    const b64 = link.searchParams.get("d") as string;
    const bin = b64Decode(b64);
    return Circuit.deserializeBinary(bin);
}

export async function loadCircuitFromFile(file: File): Promise<Circuit> {
    const bin = new Uint8Array(await file.arrayBuffer());
    const type = sniffFileType(bin);
    switch (type) {
        case "binary":
            return loadCircuitFromBinFile(bin);
        case "json":
            return loadCircuitFromJSONFile(bin);
    }
}

function loadCircuitFromBinFile(input: Uint8Array): Circuit {
    return Circuit.deserializeBinary(input);
}

function loadCircuitFromJSONFile(input: Uint8Array): Circuit {
    return Circuit.deserializeJSON(new TextDecoder("utf-8").decode(input));
}

function sniffFileType(input: Uint8Array): "binary" | "json" {
    const jsonMagicNumbers = "\r\n\t {";
    for (const magicNumber of jsonMagicNumbers) {
        if (input[0] === new TextEncoder().encode(magicNumber)[0]) {
            return "json";
        }
    }
    return "binary";
}