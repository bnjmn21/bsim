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

            HIGH: "High",
            LOW: "Low",
            OFF: "Off",
            SHOW: "Show",
            HIDE: "Hide",
        },
        CATEGORIES: {
            GATES: "Gates",
            IO: "I/O", 
        },
        BLOCKS: {
            AND: "AND",
            OR: "OR",
            XOR: "XOR",
            NOT: "NOT",
            NAND: "NAND",
            NOR: "NOR",
            NXOR: "NXOR",

            TOGGLE: "Toggle",
            LED: "LED",
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

            HIGH: "Hoch",
            LOW: "Niedrig",
            OFF: "Aus",
            SHOW: "Anzeigen",
            HIDE: "Verstecken",
        },
        CATEGORIES: {
            GATES: "Gatter",
            IO: "I/O", 
        },
        BLOCKS: {
            AND: "UND",
            OR: "ODER",
            XOR: "X-ODER",
            NOT: "NICHT",
            NAND: "N-UND",
            NOR: "N-ODER",
            NXOR: "NX-ODER",

            TOGGLE: "Toggle",
            LED: "LED",
        }
    },
    la_ro: {
        NAME: "BSim",
        UNNAMED_CIRCUIT: "Machina anonyma",
        LANGS: {
            EN_US: "??? (Terra ignota)",
            DE_DE: "??? (Germania)",
            LA_RO: "Latina (S.P.Q.R.)",
        },
        SETTINGS: {
            TITLE: "Selectio",
            LANGUAGE: "Lingua",
            GRAPHICS: "Forma",
            BLUR: "Obscurae formae",
            BACKGROUND: "Recessus",
            BACKGROUND_FLAT: "Planus",
            BACKGROUND_SHADED: "Colos",
            GATE_SYMBOLS: "la_ro/SETTINGS/GATE_SYMBOLS",
            GATE_SYMBOLS_ANSI: "ANSI (Terra ignota)",
            GATE_SYMBOLS_IEC: "IEC (???)",
            ADVANCED: "plus",
            DEBUG_DISPLAY: "Informatio",
            PERF_GRAPH: "la_ro/SETTINGS/PERF_GRAPH",

            HIGH: "Altus",
            LOW: "Brevis",
            OFF: "Nihil",
            SHOW: "Demonstrare",
            HIDE: "Occultare",
        },
        CATEGORIES: {
            GATES: "Gates",
            IO: "I/O", 
        },
        BLOCKS: {
            AND: "AND",
            OR: "OR",
            XOR: "XOR",
            NOT: "NOT",
            NAND: "NAND",
            NOR: "NOR",
            NXOR: "NXOR",

            TOGGLE: "Toggle",
            LED: "LED",
        }
    }
}

export const LANG = signals.value<"en_us" | "de_de" | "la_ro">("en_us");