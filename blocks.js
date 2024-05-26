import { settings } from "./bsim.js";
import { GRID_SIZE } from "./constants.js";
import { RGB, color_mix } from "./engine/colors.js";
import { Plugins } from "./engine/ecs.js";
import { CameraTransform, CanvasObject, SharedTranslate, Transform, Vec2 } from "./engine/engine.js";
const COLORS = {
    AND: new RGB(0x00, 0xf7, 0xff),
    OR: new RGB(0xeb, 0xff, 0x00),
    XOR: new RGB(0xd0, 0x00, 0xff),
    NOT: new RGB(209, 64, 19),
    ON: new RGB(0xff, 0x00, 0x00),
    OFF: new RGB(0x7f, 0x7f, 0x7f),
    LED: {
        ON: new RGB(0xff, 0x00, 0x00),
        OFF: new RGB(0x7f, 0x7f, 0x7f),
    },
    DELAY: new RGB(0xeb, 0xff, 0x00),
};
const OUTLINE_WIDTH = 8;
const OUTLINE_COLOR = (color) => color_mix(0.5, color, new RGB(0, 0, 0));
export class And {
    static staticData = {
        default: () => new And(),
        defaultInputs: () => [false, false],
        center: new Vec2(0),
        iconSize: GRID_SIZE * 2 + 8,
        name: "AND",
        hitbox: { type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2 * GRID_SIZE) }
    };
    data = And.staticData;
    inputNodes = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    ioDeps = [0, 1];
    calculate(input) {
        return [input.every(v => v)];
    }
    tick() { }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.AND.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.AND).toCSS();
        ctx.lineWidth = OUTLINE_WIDTH;
        if (settings.graphics.gate_symbols.get() === "ansi") {
            ctx.beginPath();
            ctx.moveTo(0, -GRID_SIZE);
            ctx.arc(0, 0, GRID_SIZE, (Math.PI / 2) * 3, 0);
            ctx.arc(0, 0, GRID_SIZE, 0, Math.PI / 2);
            ctx.lineTo(-GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(0, -GRID_SIZE);
            ctx.fill();
            ctx.stroke();
        }
        else if (settings.graphics.gate_symbols.get() === "iec") {
            ctx.beginPath();
            ctx.moveTo(-GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, -GRID_SIZE);
            ctx.fill();
            ctx.stroke();
            ctx.font = `${GRID_SIZE * 0.8}px "JetBrains Mono", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = OUTLINE_COLOR(COLORS.AND).toCSS();
            ctx.fillText("&", 0, 0);
        }
    }
}
export class Or {
    static staticData = {
        default: () => new Or(),
        defaultInputs: () => [false, false],
        center: new Vec2(0),
        iconSize: GRID_SIZE * 2 + 8,
        name: "OR",
        hitbox: { type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2 * GRID_SIZE) }
    };
    data = Or.staticData;
    inputNodes = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    ioDeps = [0, 1];
    calculate(input) {
        return [input.some(v => v)];
    }
    tick() { }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.OR.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.OR).toCSS();
        ctx.lineWidth = OUTLINE_WIDTH;
        if (settings.graphics.gate_symbols.get() === "ansi") {
            ctx.beginPath();
            ctx.moveTo(-GRID_SIZE / 2, -GRID_SIZE);
            ctx.arcTo(GRID_SIZE / 2, -GRID_SIZE, GRID_SIZE, 0, GRID_SIZE);
            ctx.lineTo(GRID_SIZE, 0);
            ctx.arcTo(GRID_SIZE / 2, GRID_SIZE, -GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, GRID_SIZE);
            ctx.arcTo(-GRID_SIZE / 2, 0, -GRID_SIZE, -GRID_SIZE, GRID_SIZE * 2.2);
            ctx.lineTo(-GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(-GRID_SIZE / 2, -GRID_SIZE);
            ctx.fill();
            ctx.stroke();
        }
        else if (settings.graphics.gate_symbols.get() === "iec") {
            ctx.beginPath();
            ctx.moveTo(-GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, -GRID_SIZE);
            ctx.fill();
            ctx.stroke();
            ctx.font = `${GRID_SIZE * 0.8}px "JetBrains Mono", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = OUTLINE_COLOR(COLORS.OR).toCSS();
            ctx.fillText("≥1", 0, 0);
        }
    }
}
export class Xor {
    static staticData = {
        default: () => new Xor(),
        defaultInputs: () => [false, false],
        center: new Vec2(0),
        iconSize: GRID_SIZE * 2 + 8,
        name: "XOR",
        hitbox: { type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2 * GRID_SIZE) }
    };
    data = Xor.staticData;
    inputNodes = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    ioDeps = [0, 1];
    calculate(input) {
        return [input.filter(v => v).length % 2 === 1];
    }
    tick() { }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.XOR.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.XOR).toCSS();
        ctx.lineWidth = OUTLINE_WIDTH;
        if (settings.graphics.gate_symbols.get() === "ansi") {
            ctx.beginPath();
            ctx.moveTo(-GRID_SIZE / 2, -GRID_SIZE);
            ctx.arcTo(GRID_SIZE / 2, -GRID_SIZE, GRID_SIZE, 0, GRID_SIZE);
            ctx.lineTo(GRID_SIZE, 0);
            ctx.arcTo(GRID_SIZE / 2, GRID_SIZE, -GRID_SIZE, GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE * 0.8, GRID_SIZE);
            ctx.arcTo(-(GRID_SIZE / 2) + (GRID_SIZE * 0.2), 0, -GRID_SIZE * 0.8, -GRID_SIZE, GRID_SIZE * 2.2);
            ctx.lineTo(-GRID_SIZE * 0.8, -GRID_SIZE);
            ctx.lineTo(-GRID_SIZE / 2, -GRID_SIZE);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-GRID_SIZE, GRID_SIZE);
            ctx.arcTo(-GRID_SIZE / 2, 0, -GRID_SIZE, -GRID_SIZE, GRID_SIZE * 2.2);
            ctx.lineTo(-GRID_SIZE, -GRID_SIZE);
            ctx.stroke();
        }
        else if (settings.graphics.gate_symbols.get() === "iec") {
            ctx.beginPath();
            ctx.moveTo(-GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(GRID_SIZE, -GRID_SIZE);
            ctx.lineTo(GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, GRID_SIZE);
            ctx.lineTo(-GRID_SIZE, -GRID_SIZE);
            ctx.fill();
            ctx.stroke();
            ctx.font = `${GRID_SIZE * 0.8}px "JetBrains Mono", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = OUTLINE_COLOR(COLORS.XOR).toCSS();
            ctx.fillText("=1", 0, 0);
        }
    }
}
export class Not {
    static staticData = {
        default: () => new Not(),
        defaultInputs: () => [false],
        center: new Vec2(-GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5,
        name: "NOT",
        hitbox: { type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2 * GRID_SIZE) }
    };
    data = And.staticData;
    inputNodes = [new Vec2(-GRID_SIZE, 0)];
    outputNodes = [new Vec2(0, 0)];
    listeners = [];
    ioDeps = [0];
    calculate(input) {
        return [!input[0]];
    }
    tick(input) { }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.NOT.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.NOT).toCSS();
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(-GRID_SIZE, -GRID_SIZE / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(-GRID_SIZE, GRID_SIZE / 2);
        ctx.lineTo(-GRID_SIZE, -GRID_SIZE / 2);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.stroke();
    }
}
export class Toggle {
    static staticData = {
        default: () => new Toggle(false),
        defaultInputs: () => [],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "TOGGLE",
        hitbox: { type: "rect", pos: new Vec2(0, -GRID_SIZE / 2), size: new Vec2(GRID_SIZE) }
    };
    data = Toggle.staticData;
    state;
    inputNodes = [];
    outputNodes = [new Vec2(GRID_SIZE, 0)];
    listeners = [
        {
            hitbox: { type: "rect", pos: new Vec2(0, -GRID_SIZE / 2), size: new Vec2(GRID_SIZE) },
            fn: e => {
                this.state = !this.state;
                return true;
            }
        }
    ];
    ioDeps = [];
    tick() { }
    constructor(state) {
        this.state = state;
    }
    calculate(input) {
        return [this.state];
    }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.ON).toCSS();
        }
        else {
            ctx.fillStyle = COLORS.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.OFF).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.fillRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
    }
}
export class LED {
    static staticData = {
        default: () => new LED(false),
        defaultInputs: () => [false],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "LED",
        hitbox: { type: "circle", center: new Vec2(GRID_SIZE / 2, 0), radius: GRID_SIZE }
    };
    data = LED.staticData;
    state;
    inputNodes = [new Vec2(0, 0)];
    outputNodes = [];
    listeners = [];
    ioDeps = [0];
    tick() { }
    constructor(state) {
        this.state = state;
    }
    calculate(input) {
        this.state = input[0];
        return [];
    }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.LED.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.LED.ON).toCSS();
        }
        else {
            ctx.fillStyle = COLORS.LED.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.LED.OFF).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.beginPath();
        ctx.arc(GRID_SIZE / 2, 0, GRID_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}
export class Delay {
    static staticData = {
        default: () => new Delay(),
        defaultInputs: () => [false],
        center: new Vec2(-GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5,
        name: "DELAY",
        hitbox: { type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2 * GRID_SIZE) }
    };
    data = And.staticData;
    inputNodes = [new Vec2(-GRID_SIZE, 0)];
    outputNodes = [new Vec2(0, 0)];
    listeners = [];
    ioDeps = [];
    state = false;
    calculate(input) {
        return [this.state];
    }
    tick(input) {
        this.state = input[0];
    }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.DELAY.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.DELAY).toCSS();
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.fillRect(-GRID_SIZE, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(-GRID_SIZE, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
        ctx.font = `${GRID_SIZE * 0.8}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = OUTLINE_COLOR(COLORS.DELAY).toCSS();
        ctx.fillText("t", -GRID_SIZE / 2, 0);
    }
}
export class WireNode {
    static staticData = {
        default: () => new WireNode(),
        defaultInputs: () => [false],
        center: new Vec2(0, 0),
        iconSize: GRID_SIZE,
        name: "NODE",
        hitbox: { type: "circle", center: new Vec2(0), radius: GRID_SIZE / 2 },
        menuRender: (ctx) => {
            ctx.lineCap = "butt";
            ctx.lineJoin = "miter";
            ctx.fillStyle = COLORS.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.OFF).toCSS();
            ctx.lineWidth = OUTLINE_WIDTH;
            ctx.beginPath();
            ctx.arc(0, 0, GRID_SIZE / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        },
    };
    data = And.staticData;
    inputNodes = [new Vec2(0, 0)];
    outputNodes = [new Vec2(0, 0)];
    listeners = [];
    ioDeps = [0];
    state = false;
    calculate(input) {
        return input;
    }
    tick(input) { }
    render(ctx) { }
}
export class Block {
    inputs;
    output;
    inputNodes;
    outputNodes;
    block;
    pos;
    inputNodeEntities = [];
    outputNodeEntities = [];
    constructor(inputs, block, pos) {
        this.inputs = inputs;
        this.output = null;
        this.block = block;
        this.inputNodes = [];
        for (const [i, input] of block.inputNodes.entries()) {
            this.inputNodes.push([input, new InputNode(this, i)]);
        }
        this.outputNodes = [];
        for (const [i, output] of block.outputNodes.entries()) {
            this.outputNodes.push([output, new OutputNode(this, i)]);
        }
        this.pos = new SharedTranslate(pos);
    }
    getOutput() {
        if (this.output !== null) {
            return this.output;
        }
        const inputs = [];
        let i = 0;
        for (const input of this.inputs) {
            if (typeof input === "boolean") {
                inputs.push(input);
            }
            else {
                if (this.block.ioDeps.find(v => v === i) !== undefined) {
                    inputs.push(input.block.getOutput()[input.outputId]);
                }
                else {
                    inputs.push(false);
                }
            }
            i++;
        }
        this.output = this.block.calculate(inputs);
        return this.output;
    }
    getOutputWithLoopCheck(computing = [this], depth = 0) {
        if (this.output !== null) {
            return this.output;
        }
        if (depth !== 0 && computing.find(v => v === this) !== undefined)
            return null;
        computing.push(this);
        const inputs = [];
        let i = 0;
        for (const input of this.inputs) {
            if (typeof input === "boolean") {
                inputs.push(input);
            }
            else {
                if (this.block.ioDeps.find(v => v === i) !== undefined) {
                    const newComputing = [...computing];
                    const outputs = input.block.getOutputWithLoopCheck(newComputing, depth + 1);
                    if (outputs === null)
                        return null;
                    inputs.push(outputs[input.outputId]);
                }
            }
            i++;
        }
        this.output = this.block.calculate(inputs);
        return this.output;
    }
    render(world, camera) {
        const transform = new Transform(new Vec2(0, 0), 0, new Vec2(1));
        this.pos.add(transform);
        for (const node of this.outputNodes) {
            const nodeTransform = new Transform(node[0], 0, new Vec2(1));
            this.pos.add(nodeTransform);
            this.outputNodeEntities.push(world.spawn([node[1], nodeTransform, new CameraTransform(camera), new CanvasObject(ctx => node[1].render(ctx))]));
        }
        for (const node of this.inputNodes) {
            const nodeTransform = new Transform(node[0], 0, new Vec2(1));
            this.pos.add(nodeTransform);
            this.inputNodeEntities.push(world.spawn([node[1], nodeTransform, new CameraTransform(camera), new CanvasObject(ctx => node[1].render(ctx))]));
        }
        world.spawn([this, transform, new CameraTransform(camera), new CanvasObject(ctx => this.block.render(ctx))]);
    }
    tick() {
        const inputs = [];
        for (const input of this.inputs) {
            if (typeof input === "boolean") {
                inputs.push(input);
            }
            else {
                inputs.push(input.block.getOutput()[input.outputId]);
            }
        }
        this.block.tick(inputs);
    }
    remove(world) {
        const e = world.getEntities(Block).find(v => v(Block) === this);
        for (const inputNode of e(Block).inputNodeEntities) {
            inputNode.delete();
        }
        for (const outputNode of e(Block).outputNodeEntities) {
            outputNode.delete();
        }
        e.delete();
    }
}
export class BlockRef {
    id;
    block;
    constructor(id, block) {
        this.id = id;
        this.block = block;
    }
    getOutputRef(id) {
        return { block: this.block, outputId: id };
    }
    get() {
        return this.block;
    }
}
export class OutputNode {
    ref;
    outputId;
    state = false;
    constructor(ref, outputId) {
        this.ref = ref;
        this.outputId = outputId;
    }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.ON).toCSS();
        }
        else {
            ctx.fillStyle = COLORS.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.OFF).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.beginPath();
        ctx.arc(0, 0, GRID_SIZE / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-GRID_SIZE / 16, -GRID_SIZE / 8);
        ctx.lineTo(GRID_SIZE / 16, 0);
        ctx.lineTo(-GRID_SIZE / 16, GRID_SIZE / 8);
        ctx.stroke();
    }
}
export class InputNode {
    ref;
    inputId;
    state = false;
    constructor(ref, outputId) {
        this.ref = ref;
        this.inputId = outputId;
    }
    render(ctx) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.ON).toCSS();
        }
        else {
            ctx.fillStyle = COLORS.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.OFF).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.beginPath();
        ctx.arc(0, 0, GRID_SIZE / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}
export function circuitPlugin(world) {
    const { time, Loop } = world.plugin(Plugins.time);
    world.system(Loop, OutputNode, entities => {
        for (const e of entities) {
            const output = e(OutputNode);
            output.state = output.ref.getOutput()[output.outputId];
        }
    });
    world.system(Loop, InputNode, entities => {
        for (const e of entities) {
            const input = e(InputNode);
            input.ref.getOutput();
            const inputVal = input.ref.inputs[input.inputId];
            if (typeof inputVal === "boolean") {
                input.state = inputVal;
            }
            else {
                input.state = inputVal.block.getOutput()[inputVal.outputId];
            }
        }
    });
}
let currentId = 0;
export class BlockID {
    id;
    constructor() {
        this.id = currentId++;
    }
}
export function getBlocks(world) {
    return new Map(world.getEntities([BlockID, Block]).map(e => [e(BlockID).id, e(Block)]));
}
