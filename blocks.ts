import { GRID_SIZE, perfData, settings } from "./bsim.js";
import { Color, RGB, color_mix } from "./engine/colors.js";
import { EntityWrapper, Plugins, World } from "./engine/ecs.js";
import { Camera2d, CameraTransform, CanvasObject, SharedTranslate, Transform, Vec2 } from "./engine/engine.js";

const COLORS = {
    AND: new RGB(0x00, 0xf7, 0xff),
    OR: new RGB(0xeb, 0xff, 0x00),
    XOR: new RGB(0xd0, 0x00, 0xff),

    ON: new RGB(0xff, 0x00, 0x00),
    OFF: new RGB(0x7f, 0x7f, 0x7f),

    LED: {
        ON: new RGB(0xff, 0x00, 0x00),
        OFF: new RGB(0x7f, 0x7f, 0x7f),
    }
}
const OUTLINE_WIDTH = 8;
const OUTLINE_COLOR = (color: Color) => color_mix(0.5, color, new RGB(0,0,0));

type Hitbox = {type: "circle", center: Vec2, radius: number} | {type: "rect", pos: Vec2, size: Vec2};
type ClickListener = {hitbox: Hitbox, fn: (e: MouseEvent) => boolean};

interface IBlock {
    inputNodes: Vec2[];
    outputNodes: Vec2[];
    calculate(input: boolean[]): boolean[];
    render(ctx: CanvasRenderingContext2D): void;
    listeners: ClickListener[];
}

export class And implements IBlock {
    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes: Vec2[] = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    calculate(input: boolean[]): boolean[] {
        return [input.every(v => v)];
    }

    render(ctx: CanvasRenderingContext2D) {
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
        } else if (settings.graphics.gate_symbols.get() === "iec") {
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

export class Or implements IBlock {
    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes: Vec2[] = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    calculate(input: boolean[]): boolean[] {
        return [input.some(v => v)];
    }

    render(ctx: CanvasRenderingContext2D): void {
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
        } else if (settings.graphics.gate_symbols.get() === "iec") {
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

export class Xor implements IBlock {
    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes: Vec2[] = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    calculate(input: boolean[]): boolean[] {
        return [input.filter(v => v).length % 2 === 1]
    }

    render(ctx: CanvasRenderingContext2D): void {
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
        } else if (settings.graphics.gate_symbols.get() === "iec") {
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

export class Toggle implements IBlock {
    state: boolean;
    inputNodes: Vec2[] = [];
    outputNodes: Vec2[] = [new Vec2(GRID_SIZE, 0)];
    listeners: ClickListener[] = [
        {
            hitbox: {type: "rect", pos: new Vec2(0, -GRID_SIZE / 2), size: new Vec2(GRID_SIZE)},
            fn: e => {
                this.state = !this.state;
                return true;
            }
        }
    ];

    constructor(state: boolean) {
        this.state = state;
    }

    calculate(input: boolean[]): boolean[] {
        return [this.state];
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.ON).toCSS();
        } else {
            ctx.fillStyle = COLORS.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.OFF).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.fillRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
    }
}

export class LED implements IBlock {
    state: boolean;
    inputNodes: Vec2[] = [new Vec2(0, 0)];
    outputNodes: Vec2[] = [];
    listeners = [];

    constructor(state: boolean) {
        this.state = state;
    }

    calculate(input: boolean[]): boolean[] {
        this.state = input[0];
        return [];
    }

    render(ctx: CanvasRenderingContext2D): void {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.LED.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.LED.ON).toCSS();
        } else {
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

type NodeRef = {block: Block, outputId: number};
type NodeOrValue = NodeRef | boolean;
export class Block {
    inputs: NodeOrValue[];
    output: boolean[] | null;
    inputNodes: [Vec2, InputNode][];
    outputNodes: [Vec2, OutputNode][];
    block: IBlock;
    pos: SharedTranslate;

    constructor (inputs: NodeOrValue[], block: IBlock, pos: Vec2) {
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

    getOutput(blocks: Block[]): boolean[] {
        if (this.output !== null) {
            return this.output;
        }

        const inputs = [];
        for (const input of this.inputs) {
            if (typeof input === "boolean") {
                inputs.push(input);
            } else {
                inputs.push(input.block.getOutput(blocks)[input.outputId]);
            }
        }
        this.output = this.block.calculate(inputs);
        return this.output;
    }

    render(world: World, camera: Camera2d) {
        const nodes = [];
        const transform = new Transform(new Vec2(0, 0), 0, new Vec2(1));
        this.pos.add(transform);

        for (const node of this.outputNodes) {
            const nodeTransform = new Transform(node[0], 0, new Vec2(1));
            this.pos.add(nodeTransform);
            nodes.push(world.spawn([node[1], nodeTransform, new CameraTransform(camera), new CanvasObject(ctx => node[1].render(ctx))]));
        }
        for (const node of this.inputNodes) {
            const nodeTransform = new Transform(node[0], 0, new Vec2(1));
            this.pos.add(nodeTransform);
            nodes.push(world.spawn([node[1], nodeTransform, new CameraTransform(camera), new CanvasObject(ctx => node[1].render(ctx))]));
        }
        world.spawn([this, transform, new CameraTransform(camera), new CanvasObject(ctx => this.block.render(ctx))]);
    }
}

export class BlockRef {
    id: number;
    block: Block;

    constructor(id: number, block: Block) {
        this.id = id;
        this.block = block;
    }

    getOutputRef(id: number): NodeRef {
        return {block: this.block, outputId: id};
    }

    get(): Block {
        return this.block;
    }
}

export class OutputNode {
    ref: Block;
    outputId: number;
    state: boolean = false;

    constructor(ref: Block, outputId: number) {
        this.ref = ref;
        this.outputId = outputId;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.ON).toCSS();
        } else {
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
    ref: Block;
    inputId: number;
    state: boolean = false;

    constructor(ref: Block, outputId: number) {
        this.ref = ref;
        this.inputId = outputId;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.ON).toCSS();
        } else {
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

export function circuitPlugin(world: World) {
    const { time, Loop } = world.plugin(Plugins.time);
    world.system(Loop, OutputNode, entities => {
        const renderStart = time.ms();
        for (const e of entities) {
            const output = e(OutputNode);
            output.state = output.ref.getOutput(world.getEntities(Block).map(e => e(Block)))[output.outputId] as boolean;
        }
        perfData.render += time.ms() - renderStart;
    });
    world.system(Loop, InputNode, entities => {
        const renderStart = time.ms();
        for (const e of entities) {
            const input = e(InputNode);
            input.ref.getOutput(world.getEntities(Block).map(e => e(Block)));
            const inputVal = input.ref.inputs[input.inputId];
            if (typeof inputVal === "boolean") {
                input.state = inputVal;
            } else {
                input.state = inputVal.block.getOutput(world.getEntities(Block).map(e => e(Block)))[inputVal.outputId];
            }
        }
        perfData.render += time.ms() - renderStart;
    });
}