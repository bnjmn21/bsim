import { World } from "./engine/ecs.js";
import { bsim } from "./bsim.js";

const world = new World();
world.plugin(bsim);
world.run();