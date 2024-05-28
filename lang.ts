import { signals } from "./jsml/signals.js"

export const I18N = {
    en_us: {
        NAME: "BSim",
        UNNAMED_CIRCUIT: "Unnamed circuit",
        LANGS: {
            EN_US: "English (USA)",
            DE_DE: "German (Germany)",
            LA_RO: "Latin (S.P.Q.R.)",
        },
        SETTINGS: {
            TITLE: "Settings",
            LANGUAGE: "Language",
            GRAPHICS: "Graphics",
            BLUR: "Blur",
            BACKGROUND: "Background",
            BACKGROUND_FLAT: "Flat",
            BACKGROUND_SHADED: "Shaded",
            GATE_SYMBOLS: "Gate symbols",
            GATE_SYMBOLS_ANSI: "ANSI (American)",
            GATE_SYMBOLS_IEC: "IEC (EU)",
            ADVANCED: "Advanced",
            DEBUG_DISPLAY: "FPS graph",
            PERF_GRAPH: "Performance graph",
            PERF_GRAPH_NOTE: "Performance graph might not work correctly on all browsers.\nIn Firefox the privacy.reduceTimerPrecision flag must be set to false",

            HIGH: "High",
            LOW: "Low",
            OFF: "Off",
            SHOW: "Show",
            HIDE: "Hide",
        },
        CATEGORIES: {
            GATES: "Gates",
            IO: "I/O", 
            MISC: "Miscellaneous",
        },
        BLOCKS: {
            AND: "AND",
            OR: "OR",
            XOR: "XOR",
            NOT: "NOT",
            NAND: "NAND",
            NOR: "NOR",
            XNOR: "XNOR",

            TOGGLE: "Toggle",
            LED: "LED",

            DELAY: "Delay",
            NODE: "Node",
        },
        LOOP_CREATED: {
            MAIN: "This is a loop!",
            FIX_MESSAGE_0: "Break up loops with ",
            FIX_MESSAGE_1: "delay blocks",
            FIX_MESSAGE_2: ".",
        },
        KEYBOARD: {
            CTRL_PC: "CTRL",
            CTRL_MAC: "⌘",
            ALT_PC: "ALT",
            ALT_MAC: "⌥",
            SHIFT: "SHIFT",
        },
        TIPS: {
            MOVE_NODE: "Move nodes",
            DISCONNECT: "Disconnect cables from inputs",
        }
    },
    de_de: {
        NAME: "BSim",
        UNNAMED_CIRCUIT: "Unbenannter Schaltkreis",
        LANGS: {
            EN_US: "Englisch (USA)",
            DE_DE: "Deutsch (Deutschland)",
            LA_RO: "Latein (S.P.Q.R.)",
        },
        SETTINGS: {
            TITLE: "Einstellungen",
            LANGUAGE: "Sprache",
            GRAPHICS: "Grafik",
            BLUR: "Weichzeichnen",
            BACKGROUND: "Hintergrund",
            BACKGROUND_FLAT: "Einfarbig",
            BACKGROUND_SHADED: "Schattiert",
            GATE_SYMBOLS: "Gatter-Symbole",
            GATE_SYMBOLS_ANSI: "ANSI (Amerikanisch)",
            GATE_SYMBOLS_IEC: "IEC (EU)",
            ADVANCED: "Erweitert",
            DEBUG_DISPLAY: "FPS-Graph",
            PERF_GRAPH: "Performance-Graph",
            PERF_GRAPH_NOTE: `Der Performance-Graph funktioniert evtl. nicht in allen Browsern.\nIn Firefox muss die Flag "privacy.reduceTimerPrecision" auf false gesetzt werden.`,

            HIGH: "Hoch",
            LOW: "Niedrig",
            OFF: "Aus",
            SHOW: "Anzeigen",
            HIDE: "Verstecken",
        },
        CATEGORIES: {
            GATES: "Gatter",
            IO: "I/O",
            MISC: "Anderes",
        },
        BLOCKS: {
            AND: "UND",
            OR: "ODER",
            XOR: "EX. ODER",
            NOT: "NICHT",
            NAND: "NAND",
            NOR: "NOR",
            XNOR: "XNOR",

            TOGGLE: "Schalter",
            LED: "LED",
            
            DELAY: "Verzögerung",
            NODE: "Knoten",
        },
        LOOP_CREATED: {
            MAIN: "Das ist eine Rückkopplung!",
            FIX_MESSAGE_0: "Nutze ",
            FIX_MESSAGE_1: "Verzögerungsblöcke",
            FIX_MESSAGE_2: " um sie zu verhindern.",
        },
        KEYBOARD: {
            CTRL_PC: "STRG",
            CTRL_MAC: "⌘",
            ALT_PC: "ALT",
            ALT_MAC: "⌥",
            SHIFT: "SHIFT",
        },
        TIPS: {
            MOVE_NODE: "Knoten verschieben",
            DISCONNECT: "Kabel von Eingängen trennen",
        }
    }
}

export const LANG = signals.value<"en_us" | "de_de">("en_us");