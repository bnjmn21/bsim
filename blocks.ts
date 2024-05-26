import { settings } from "./bsim.js";
import { GRID_SIZE } from "./constants.js";
import { Color, RGB, color_mix } from "./engine/colors.js";
import { Constructor, EntityWrapper, Plugins, World } from "./engine/ecs.js";
import { Camera2d, CameraTransform, CanvasObject, SharedTranslate, Transform, Vec2, lerp } from "./engine/engine.js";
import { I18N } from "./lang.js";

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
}
const OUTLINE_WIDTH = 8;
const OUTLINE_COLOR = (color: Color) => color_mix(0.5, color, new RGB(0,0,0));

export type Hitbox = {type: "circle", center: Vec2, radius: number} | {type: "rect", pos: Vec2, size: Vec2};
type ClickListener = {hitbox: Hitbox, fn: (e: MouseEvent) => boolean};

export type BlockDef = {
    default: () => IBlock,
    defaultInputs: () => NodeOrValue[],
    menuRender?: (ctx: CanvasRenderingContext2D) => void;
    center: Vec2,
    iconSize: number,
    name: keyof (typeof I18N)["en_us"]["BLOCKS"],
    hitbox: Hitbox,
};
export interface IBlock {
    inputNodes: Vec2[];
    outputNodes: Vec2[];
    calculate(input: boolean[]): boolean[];
    render(ctx: CanvasRenderingContext2D): void;
    tick(input: boolean[]): void;
    listeners: ClickListener[];
    ioDeps: number[];

    data: BlockDef;
}

export class And implements IBlock {
    static staticData: BlockDef = {
        default: () => new And(),
        defaultInputs: () => [false, false],
        center: new Vec2(0),
        iconSize: GRID_SIZE * 2 + 8,
        name: "AND",
        hitbox: {type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2*GRID_SIZE)}
    }
    data = And.staticData;

    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes: Vec2[] = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    ioDeps: number[] = [0, 1];
    calculate(input: boolean[]): boolean[] {
        return [input.every(v => v)];
    }

    tick(): void {}

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
    static staticData: BlockDef = {
        default: () => new Or(),
        defaultInputs: () => [false, false],
        center: new Vec2(0),
        iconSize: GRID_SIZE * 2 + 8,
        name: "OR",
        hitbox: {type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2*GRID_SIZE)}
    }
    data = Or.staticData;

    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes: Vec2[] = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    ioDeps: number[] = [0, 1];
    calculate(input: boolean[]): boolean[] {
        return [input.some(v => v)];
    }

    tick(): void {}

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
    static staticData: BlockDef = {
        default: () => new Xor(),
        defaultInputs: () => [false, false],
        center: new Vec2(0),
        iconSize: GRID_SIZE * 2 + 8,
        name: "XOR",
        hitbox: {type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2*GRID_SIZE)}
    }
    data = Xor.staticData;

    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, -GRID_SIZE), new Vec2(-GRID_SIZE, GRID_SIZE)];
    outputNodes: Vec2[] = [new Vec2(GRID_SIZE, 0)];
    listeners = [];
    ioDeps: number[] = [0, 1];
    calculate(input: boolean[]): boolean[] {
        return [input.filter(v => v).length % 2 === 1]
    }

    tick(): void {}

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

export class Not implements IBlock {
    static staticData: BlockDef = {
        default: () => new Not(),
        defaultInputs: () => [false],
        center: new Vec2(-GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5,
        name: "NOT",
        hitbox: {type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2*GRID_SIZE)}
    }
    data = And.staticData;

    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, 0)];
    outputNodes: Vec2[] = [new Vec2(0, 0)];
    listeners = [];
    ioDeps: number[] = [0];

    calculate(input: boolean[]): boolean[] {
        return [!input[0]];
    }

    tick(input: boolean[]): void {}

    render(ctx: CanvasRenderingContext2D) {
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

export class Toggle implements IBlock {
    static staticData: BlockDef = {
        default: () => new Toggle(false),
        defaultInputs: () => [],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "TOGGLE",
        hitbox: {type: "rect", pos: new Vec2(0, -GRID_SIZE / 2), size: new Vec2(GRID_SIZE)}
    }
    data = Toggle.staticData;

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
    ioDeps: number[] = [];
    
    tick(): void {}

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
    static staticData: BlockDef = {
        default: () => new LED(false),
        defaultInputs: () => [false],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "LED",
        hitbox: {type: "circle", center: new Vec2(GRID_SIZE / 2, 0), radius: GRID_SIZE}
    }
    data = LED.staticData;

    state: boolean;
    inputNodes: Vec2[] = [new Vec2(0, 0)];
    outputNodes: Vec2[] = [];
    listeners = [];
    ioDeps: number[] = [0];

    tick(): void {}

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

export class Delay implements IBlock {
    static staticData: BlockDef = {
        default: () => new Delay(),
        defaultInputs: () => [false],
        center: new Vec2(-GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5,
        name: "DELAY",
        hitbox: {type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2*GRID_SIZE)}
    }
    data = And.staticData;

    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, 0)];
    outputNodes: Vec2[] = [new Vec2(0, 0)];
    listeners = [];
    ioDeps: number[] = [];

    state: boolean = false;

    calculate(input: boolean[]): boolean[] {
        return [this.state];
    }

    tick(input: boolean[]): void {
        this.state = input[0];
    }

    render(ctx: CanvasRenderingContext2D) {
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

export class WireNode implements IBlock {
    static staticData: BlockDef = {
        default: () => new WireNode(),
        defaultInputs: () => [false],
        center: new Vec2(0, 0),
        iconSize: GRID_SIZE,
        name: "NODE",
        hitbox: {type: "circle", center: new Vec2(0), radius: GRID_SIZE / 2},
        menuRender: (ctx: CanvasRenderingContext2D) => {
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
    }
    data = And.staticData;

    inputNodes: Vec2[] = [new Vec2(0, 0)];
    outputNodes: Vec2[] = [new Vec2(0, 0)];
    listeners = [];
    ioDeps: number[] = [0];

    state: boolean = false;

    calculate(input: boolean[]): boolean[] {
        return input;
    }

    tick(input: boolean[]): void {}

    render(ctx: CanvasRenderingContext2D) {}
}

export type NodeRef = {block: Block, outputId: number};
export type InputNodeRef = {block: Block, inputId: number};
export type NodeOrValue = NodeRef | boolean;
export class Block {
    inputs: NodeOrValue[];
    output: boolean[] | null;
    inputNodes: [Vec2, InputNode][];
    outputNodes: [Vec2, OutputNode][];
    block: IBlock;
    pos: SharedTranslate;
    inputNodeEntities: EntityWrapper<Constructor<InputNode | Transform | CameraTransform | CanvasObject>>[] = [];
    outputNodeEntities: EntityWrapper<Constructor<OutputNode | Transform | CameraTransform | CanvasObject>>[] = [];

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

    getOutput(): boolean[] {
        if (this.output !== null) {
            return this.output;
        }

        const inputs = [];
        let i = 0;
        for (const input of this.inputs) {
            if (typeof input === "boolean") {
                inputs.push(input);
            } else {
                if (this.block.ioDeps.find(v => v === i) !== undefined) {
                    inputs.push(input.block.getOutput()[input.outputId]);
                } else {
                    inputs.push(false);
                }
            }
            i++;
        }
        this.output = this.block.calculate(inputs);
        return this.output;
    }

    getOutputWithLoopCheck(computing: Block[] = [this], depth: number = 0): null | boolean[] {
        if (this.output !== null) {
            return this.output;
        }

        if (depth !== 0 && computing.find(v => v === this) !== undefined) return null;
        computing.push(this);

        const inputs = [];
        let i = 0;
        for (const input of this.inputs) {
            if (typeof input === "boolean") {
                inputs.push(input);
            } else {
                if (this.block.ioDeps.find(v => v === i) !== undefined) {
                    const newComputing = [...computing];
                    const outputs = input.block.getOutputWithLoopCheck(newComputing, depth + 1);
                    if (outputs === null) return null;
                    inputs.push(outputs[input.outputId]);
                }
            }
            i++;
        }
        this.output = this.block.calculate(inputs);
        return this.output;
    }

    render(world: World, camera: Camera2d) {
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
            } else {
                inputs.push(input.block.getOutput()[input.outputId]);
            }
        }

        this.block.tick(inputs);
    }

    remove(world: World) {
        const e = world.getEntities(Block).find(v => v(Block) === this) as EntityWrapper<typeof Block>;
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
        for (const e of entities) {
            const output = e(OutputNode);
            output.state = output.ref.getOutput()[output.outputId] as boolean;
        }
    });
    world.system(Loop, InputNode, entities => {
        for (const e of entities) {
            const input = e(InputNode);
            input.ref.getOutput();
            const inputVal = input.ref.inputs[input.inputId];
            if (typeof inputVal === "boolean") {
                input.state = inputVal;
            } else {
                input.state = inputVal.block.getOutput()[inputVal.outputId];
            }
        }
    });
}

let currentId = 0;
export class BlockID {
    id: number;
    constructor () {
        this.id = currentId++;
    }
}

export function getBlocks(world: World): Map<number, Block> {
    return new Map(world.getEntities([BlockID, Block]).map(e => [e(BlockID).id, e(Block)]));
}