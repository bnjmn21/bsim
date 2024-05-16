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
            DEBUG_DISPLAY: "Debug info",

            HIGH: "High",
            LOW: "Low",
            OFF: "Off",
            SHOW: "Show",
            HIDE: "Hide",
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
            DEBUG_DISPLAY: "Debug-Informationen",

            HIGH: "Hoch",
            LOW: "Niedrig",
            OFF: "Aus",
            SHOW: "Anzeigen",
            HIDE: "Verstecken",
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
            GATE_SYMBOLS: "[[Untranslated]]",
            GATE_SYMBOLS_ANSI: "ANSI (Terra ignota)",
            GATE_SYMBOLS_IEC: "IEC (???)",
            ADVANCED: "plus",
            DEBUG_DISPLAY: "Informatio",

            HIGH: "Altus",
            LOW: "Brevis",
            OFF: "Nihil",
            SHOW: "Demonstrare",
            HIDE: "Occultare",
        }
    }
}

export const LANG = signals.value<"en_us" | "de_de" | "la_ro">("en_us");