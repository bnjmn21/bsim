import { World } from "../engine/ecs.js";
import { JSML } from "../jsml/jsml.js";
import * as icons from "../icons.js";
import { controlState } from "../bsim.js";

export function controlsPlugin(world: World) {
    const controlsUI = new JSML(document.getElementById("controls") as HTMLElement);
    controlsUI.ui(ui => {
        ui.tag("button", ui => {
            if (controlState.playing.get()) {
                ui.html(icons.pause).class("icon");
            } else {
                ui.html(icons.play).class("icon");
            }
        })
            .class("icon-btn")
            .click(
                () => controlState.playing.set(!controlState.playing.get())
            );
        ui.tag("input", ui => {})
            .attribute("type", "range")
            .attribute("name", "play-speed")
            .attribute("min", "0")
            .attribute("max", "3")
            .attribute("step", "0.25")
            .attribute("value", "0")
            .addEventListener("input", e => {
                controlState.speed.set(Math.pow(10, (e.target as HTMLInputElement).valueAsNumber));
            });
        ui.p(ui => {
            ui.text(() => controlState.speed.get().toFixed(1) + " Hz");
        });
    });
}