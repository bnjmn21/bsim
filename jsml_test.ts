import * as jsml from "./jsml/jsml.js";
import { signals } from "./jsml/signals.js";



const toggle = signals.value(true);
const ui = new jsml.JSML(document.body);

ui.ui(ui => {
    ui.button(ui => ui.text("click to toggle")).click(() => {
        toggle.set(!toggle.get());
    });
    if (toggle.get()) {
        ui.p(ui => ui.text("Ui no. 1"));
        ui.button(ui => ui.text("button 1"));
        ui.button(ui => ui.text("button 2"));
        ui.button(ui => ui.text("button 3"));
    } else {
        ui.p(ui => ui.text("Ui no. 2"));
        ui.button(ui => ui.text("button 4"));
        ui.button(ui => ui.text("button 5"));
    }
});