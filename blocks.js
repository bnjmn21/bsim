import { blocks, circuitName, dragging, hitboxToRect, selectionFrame, settings } from "./bsim.js";
import { GRID_SIZE } from "./constants.js";
import { Reader, Writer } from "./engine/binary.js";
import { RGB, color_mix } from "./engine/colors.js";
import { Plugins } from "./engine/ecs.js";
import { CameraTransform, CanvasObject, SharedTranslate, Transform, Vec2 } from "./engine/engine.js";
import { showSelectionTools } from "./ui/selection_tools.js";
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
    render(ctx, selected) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.AND.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.AND).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.AND, new RGB(255, 255, 255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.AND), new RGB(255, 255, 255)).toCSS();
        }
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
    serialize() {
        return {};
    }
    clone() {
        return new And();
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
    render(ctx, selected) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.OR.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.OR).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.OR, new RGB(255, 255, 255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.OR), new RGB(255, 255, 255)).toCSS();
        }
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
    serialize() {
        return {};
    }
    clone() {
        return new Or();
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
    render(ctx, selected) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.XOR.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.XOR).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.XOR, new RGB(255, 255, 255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.XOR), new RGB(255, 255, 255)).toCSS();
        }
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
    serialize() {
        return {};
    }
    clone() {
        return new Xor();
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
    render(ctx, selected) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.NOT.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.NOT).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.NOT, new RGB(255, 255, 255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.NOT), new RGB(255, 255, 255)).toCSS();
        }
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
    serialize() {
        return {};
    }
    clone() {
        return new Not();
    }
}
export class Toggle {
    static staticData = {
        default: () => new Toggle(false),
        defaultInputs: () => [],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "TOGGLE",
        hitbox: { type: "rect", pos: new Vec2(0, -GRID_SIZE / 2), size: new Vec2(GRID_SIZE) },
        deserialize: (d) => new Toggle(d),
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
    render(ctx, selected) {
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
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.OFF, new RGB(255, 255, 255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.OFF), new RGB(255, 255, 255)).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.fillRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
    }
    serialize() {
        return this.state;
    }
    clone() {
        return new Toggle(this.state);
    }
}
export class LED {
    static staticData = {
        default: () => new LED(false),
        defaultInputs: () => [false],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "LED",
        hitbox: { type: "circle", center: new Vec2(GRID_SIZE / 2, 0), radius: GRID_SIZE / 2 },
        deserialize: (d) => new LED(d),
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
    render(ctx, selected) {
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
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.OFF, new RGB(255, 255, 255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.LED.OFF), new RGB(255, 255, 255)).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.beginPath();
        ctx.arc(GRID_SIZE / 2, 0, GRID_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    serialize() {
        return this.state;
    }
    clone() {
        return new LED(this.state);
    }
}
export class Delay {
    static staticData = {
        default: () => new Delay(),
        defaultInputs: () => [false],
        center: new Vec2(-GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5,
        name: "DELAY",
        hitbox: { type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2 * GRID_SIZE) },
    };
    data = And.staticData;
    inputNodes = [new Vec2(-GRID_SIZE, 0)];
    outputNodes = [new Vec2(0, 0)];
    listeners = [];
    ioDeps = [];
    state = false;
    constructor(state) {
        this.state = state || false;
    }
    calculate(input) {
        return [this.state];
    }
    tick(input) {
        this.state = input[0];
    }
    render(ctx, selected) {
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
    serialize() { }
    clone() {
        return new Delay(this.state);
    }
}
export class WireNode {
    static staticData = {
        default: () => new WireNode(),
        defaultInputs: () => [false],
        center: new Vec2(0, 0),
        iconSize: GRID_SIZE,
        name: "NODE",
        hitbox: { type: "circle", center: new Vec2(0), radius: GRID_SIZE / 4 },
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
    data = WireNode.staticData;
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
    serialize() {
        return {};
    }
    clone() {
        return new WireNode();
    }
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
    selected = false;
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
        world.spawn([this, transform, new CameraTransform(camera), new CanvasObject(ctx => this.block.render(ctx, this.selected))]);
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
export function circuitPlugin(world, camera) {
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
    world.system(Loop, Block, entities => {
        if (dragging.inner?.type === "selection") {
            const selectionP1 = new Vec2(Math.min(dragging.inner.start.x, camera.mouseWorldCoords().x), Math.min(dragging.inner.start.y, camera.mouseWorldCoords().y));
            const selectionP2 = new Vec2(Math.max(dragging.inner.start.x, camera.mouseWorldCoords().x), Math.max(dragging.inner.start.y, camera.mouseWorldCoords().y));
            for (const e of entities) {
                e(Block).selected = hitboxToRect(e(Block).block.data.hitbox, { pos1: selectionP1.sub(e(Block).pos.pos), pos2: selectionP2.sub(e(Block).pos.pos) });
            }
        }
    });
}
export class CircuitBlock {
    block;
    pos;
    inputs;
    constructor(block, pos, inputs) {
        this.block = block;
        this.pos = pos;
        this.inputs = inputs;
    }
}
export class Circuit {
    blocks = [];
    name;
    constructor(blocks, name) {
        this.blocks = blocks;
        this.name = name;
    }
    static fromBlocks(blocks, name, outerConnections = "throw") {
        const circuit = new Circuit([], name);
        for (const block of blocks) {
            const inputs = [];
            for (const input of block.inputs) {
                if (typeof input === "boolean") {
                    inputs.push(input);
                }
                else {
                    const block = blocks.findIndex(v => v === input.block);
                    if (block === -1) {
                        if (outerConnections === "remove") {
                            inputs.push(false);
                        }
                        else if (outerConnections === "throw") {
                            throw new Error("Outer connection found while exporting circuit. Use outerConnections: 'remove' to ignore");
                        }
                    }
                    else {
                        inputs.push({
                            block,
                            output: input.outputId,
                        });
                    }
                }
            }
            circuit.blocks.push(new CircuitBlock(block.block.clone(), block.pos.pos.clone(), inputs));
        }
        return circuit;
    }
    static saveCircuit(world) {
        return Circuit.fromBlocks(getBlocks(world), circuitName.get(), "throw");
    }
    load(world, camera, pos, addToSelection = false) {
        const newBlocks = [];
        for (const block of this.blocks) {
            const inputs = [];
            for (const input of block.inputs) {
                if (typeof input === "boolean") {
                    inputs.push(input);
                }
                else {
                    inputs.push(false);
                }
            }
            const newBlock = new Block(inputs, block.block, block.pos.add(pos));
            if (addToSelection) {
                newBlock.selected = true;
            }
            newBlock.render(world, camera);
            newBlocks.push(newBlock);
        }
        for (const [block, newBlock] of this.blocks.map((v, i) => [v, newBlocks[i]])) {
            for (const [i, input] of block.inputs.entries()) {
                if (typeof input !== "boolean") {
                    newBlock.inputs[i] = {
                        block: newBlocks[input.block],
                        outputId: input.output,
                    };
                }
            }
        }
    }
    serializeJSON() {
        return JSON.stringify({ version: 1, blocks: this.blocks, name: this.name }, (k, v) => {
            if (v instanceof CircuitBlock) {
                return {
                    block: getBlockId(v.block),
                    pos: v.pos,
                    inputs: v.inputs,
                    data: v.block.serialize()
                };
            }
            return v;
        });
    }
    static deserializeJSON(d) {
        const json = JSON.parse(d);
        const name = "name" in json ? json.name : undefined;
        const blocks = expect(json.blocks, Array).map(v => {
            const block = expect(v, "object");
            const type = fromBlockId(expectField(block, "block", "string"), "data" in block ? block.data : undefined);
            const posField = expectField(block, "pos", "object");
            const pos = new Vec2(expectField(posField, "x", "number"), expectField(posField, "y", "number"));
            const inputs = expectField(block, "inputs", Array).map(v => {
                if (typeof v === "boolean") {
                    return v;
                }
                else {
                    const input = expect(v, "object");
                    return {
                        block: expectField(input, "block", "number"),
                        output: expectField(input, "output", "number"),
                    };
                }
            });
            return new CircuitBlock(type, pos, inputs);
        });
        return new Circuit(blocks, name);
    }
    serializeBinary() {
        const VERSION = 1; // Version must not be: 9, 10, 13, 32, 123 as these are the magic numbers for detecting json files.
        const w = new Writer();
        w.i32(VERSION);
        w.bool(this.name !== undefined);
        if (this.name !== undefined) {
            w.string(this.name);
        }
        ;
        const blocks = [];
        for (const block of this.blocks) {
            const bw = new Writer();
            bw.string(getBlockId(block.block));
            bw.f32(block.pos.x);
            bw.f32(block.pos.y);
            const inputs = [];
            for (const input of block.inputs) {
                const iw = new Writer();
                iw.bool(typeof input === "boolean");
                if (typeof input === "boolean") {
                    iw.bool(input);
                }
                else {
                    iw.i32(input.block);
                    iw.i32(input.output);
                }
                inputs.push(iw);
            }
            bw.array(inputs);
            bw.string(JSON.stringify(block.block.serialize()));
            blocks.push(bw);
        }
        w.array(blocks);
        return w.intoUint8Array();
    }
    static deserializeBinary(d) {
        const r = new Reader(d);
        const version = r.i32();
        if (version === 1) {
            let name;
            const hasName = r.bool();
            if (hasName) {
                name = r.string();
            }
            const blocks = [];
            r.array(br => {
                const blockId = br.string();
                const pos = new Vec2(br.f32(), br.f32());
                const inputs = [];
                br.array(ir => {
                    const isBool = ir.bool();
                    if (isBool) {
                        inputs.push(ir.bool());
                    }
                    else {
                        inputs.push({
                            block: ir.i32(),
                            output: ir.i32(),
                        });
                    }
                });
                const data = JSON.parse(br.string());
                blocks.push(new CircuitBlock(fromBlockId(blockId, data), pos, inputs));
            });
            return new Circuit(blocks, name);
        }
        throw new Error("Invalid circuit binary version");
    }
}
export function getBlocks(world) {
    return world.getEntities(Block).map(v => v(Block));
}
export function getSelectedBlocks(world) {
    return world.getEntities(Block).map(v => v(Block)).filter(v => v.selected);
}
export function isEmpty(world) {
    return getBlocks(world).length === 0;
}
export function deleteAllBlocks(world) {
    getBlocks(world).forEach(b => b.remove(world));
}
export function deselectAll(world) {
    showSelectionTools.set(false);
    selectionFrame.inner = null;
    getSelectedBlocks(world).forEach(v => v.selected = false);
}
function getBlockId(b) {
    for (const [catName, category] of Object.entries(blocks)) {
        for (const block of category.values()) {
            if (b instanceof block) {
                return `${catName}:${block.name}`;
            }
        }
    }
    throw new Error("Could not serialize block. The block must be part of the blocks object in bsim.ts");
}
function fromBlockId(id, data) {
    for (const [catName, category] of Object.entries(blocks)) {
        for (const block of category.values()) {
            if (id === `${catName}:${block.name}`) {
                if (block.staticData.deserialize) {
                    return block.staticData.deserialize(data);
                }
                else {
                    return block.staticData.default();
                }
            }
        }
    }
    throw new Error(`Invalid block id (got: ${id})`);
}
function expect(v, t) {
    if (typeof t === "string") {
        if (typeof v === t) {
            return v;
        }
        else {
            throw new Error(`Invalid type, expected ${t}, found ${typeof v}`);
        }
    }
    else {
        if (v instanceof t) {
            return v;
        }
        else {
            throw new Error(`Invalid type, expected ${t.name}`);
        }
    }
}
function expectField(v, f, t) {
    if (f in v) {
        if (t === "any") {
            return v[f];
        }
        else {
            return expect(v[f], t);
        }
    }
    else {
        throw new Error(`Invalid type, expected field ${f}`);
    }
}
