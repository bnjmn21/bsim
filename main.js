import { World } from "./engine/ecs.js";
import { bsim } from "./bsim.js";

console.info(
    "%cBSim",
    "font-size: 3em;" +
    "border: 1px solid #7777;" +
    "border-radius: 3px;" +
    "background-color: #7774;" +
    "width: 100%;" +
    "display: inline-block;" +
    "text-align: center;" +
    "padding-inline: .5em;"
);
console.info(
    "%cAnything is possible!",
    "font-size: 1.5em;" +
    "width: 100%;" +
    "display: inline-block;" +
    "text-align: center;" +
    "padding-inline: .5em;"
);

const world = new World();
world.plugin(bsim);
world.run();