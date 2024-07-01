import { blocks, circuitName, dragging, hitboxToRect, selectionFrame, settings } from "./bsim.js";
import { GRID_SIZE } from "./constants.js";
import { Reader, Writer } from "./engine/binary.js";
import { Color, RGB, color_mix } from "./engine/colors.js";
import { Constructor, EntityWrapper, Plugins, World } from "./engine/ecs.js";
import { Camera2d, CameraTransform, CanvasObject, SharedTranslate, Transform, Vec2, lerp } from "./engine/engine.js";
import { I18N } from "./lang.js";
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
    deserialize?: (d: any) => IBlock;
};
export interface IBlock {
    inputNodes: Vec2[];
    outputNodes: Vec2[];
    calculate(input: boolean[]): boolean[];
    render(ctx: CanvasRenderingContext2D, selected: boolean): void;
    tick(input: boolean[]): void;
    listeners: ClickListener[];
    ioDeps: number[];
    serialize(): any;
    clone(): IBlock;

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

    render(ctx: CanvasRenderingContext2D, selected: boolean) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.AND.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.AND).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.AND, new RGB(255,255,255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.AND), new RGB(255,255,255)).toCSS();
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

    serialize() {
        return {};
    }

    clone(): IBlock {
        return new And();
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

    render(ctx: CanvasRenderingContext2D, selected: boolean): void {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.OR.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.OR).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.OR, new RGB(255,255,255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.OR), new RGB(255,255,255)).toCSS();
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

    serialize() {
        return {};
    }

    clone(): IBlock {
        return new Or();
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

    render(ctx: CanvasRenderingContext2D, selected: boolean): void {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.XOR.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.XOR).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.XOR, new RGB(255,255,255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.XOR), new RGB(255,255,255)).toCSS();
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
    
    serialize() {
        return {};
    }

    clone(): IBlock {
        return new Xor();
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

    render(ctx: CanvasRenderingContext2D, selected: boolean) {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.fillStyle = COLORS.NOT.toCSS();
        ctx.strokeStyle = OUTLINE_COLOR(COLORS.NOT).toCSS();
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.NOT, new RGB(255,255,255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.NOT), new RGB(255,255,255)).toCSS();
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

    clone(): IBlock {
        return new Not();
    }
}

export class Toggle implements IBlock {
    static staticData: BlockDef = {
        default: () => new Toggle(false),
        defaultInputs: () => [],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "TOGGLE",
        hitbox: {type: "rect", pos: new Vec2(0, -GRID_SIZE / 2), size: new Vec2(GRID_SIZE)},
        deserialize: (d) => new Toggle(d),
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

    render(ctx: CanvasRenderingContext2D, selected: boolean): void {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.ON).toCSS();
        } else {
            ctx.fillStyle = COLORS.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.OFF).toCSS();
        }
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.OFF, new RGB(255,255,255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.OFF), new RGB(255,255,255)).toCSS();
        }
        ctx.lineWidth = OUTLINE_WIDTH;
        ctx.fillRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
    }
    
    serialize() {
        return this.state;
    }

    clone(): IBlock {
        return new Toggle(this.state);
    }
}

export class LED implements IBlock {
    static staticData: BlockDef = {
        default: () => new LED(false),
        defaultInputs: () => [false],
        center: new Vec2(GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5 + 8,
        name: "LED",
        hitbox: {type: "circle", center: new Vec2(GRID_SIZE / 2, 0), radius: GRID_SIZE / 2},
        deserialize: (d) => new LED(d),
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

    render(ctx: CanvasRenderingContext2D, selected: boolean): void {
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        if (this.state) {
            ctx.fillStyle = COLORS.LED.ON.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.LED.ON).toCSS();
        } else {
            ctx.fillStyle = COLORS.LED.OFF.toCSS();
            ctx.strokeStyle = OUTLINE_COLOR(COLORS.LED.OFF).toCSS();
        }
        if (selected) {
            ctx.fillStyle = color_mix(0.5, COLORS.OFF, new RGB(255,255,255)).toCSS();
            ctx.strokeStyle = color_mix(0.5, OUTLINE_COLOR(COLORS.LED.OFF), new RGB(255,255,255)).toCSS();
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

    clone(): IBlock {
        return new LED(this.state);
    }
}

export class Delay implements IBlock {
    static staticData: BlockDef = {
        default: () => new Delay(),
        defaultInputs: () => [false],
        center: new Vec2(-GRID_SIZE / 2, 0),
        iconSize: GRID_SIZE * 1.5,
        name: "DELAY",
        hitbox: {type: "rect", pos: new Vec2(-GRID_SIZE), size: new Vec2(2*GRID_SIZE)},
    }
    data = And.staticData;

    inputNodes: Vec2[] = [new Vec2(-GRID_SIZE, 0)];
    outputNodes: Vec2[] = [new Vec2(0, 0)];
    listeners = [];
    ioDeps: number[] = [];

    state: boolean = false;
    constructor (state: boolean | void) {
        this.state = state || false;
    }

    calculate(input: boolean[]): boolean[] {
        return [this.state];
    }

    tick(input: boolean[]): void {
        this.state = input[0];
    }

    render(ctx: CanvasRenderingContext2D, selected: boolean) {
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

    serialize() {}
    
    clone(): IBlock {
        return new Delay(this.state);
    }
}

export class WireNode implements IBlock {
    static staticData: BlockDef = {
        default: () => new WireNode(),
        defaultInputs: () => [false],
        center: new Vec2(0, 0),
        iconSize: GRID_SIZE,
        name: "NODE",
        hitbox: {type: "circle", center: new Vec2(0), radius: GRID_SIZE / 4},
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
    data = WireNode.staticData;

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

    serialize() {
        return {};
    }
    
    clone(): IBlock {
        return new WireNode();
    }
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
    selected: boolean = false;

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
        world.spawn([this, transform, new CameraTransform(camera), new CanvasObject(ctx => this.block.render(ctx, this.selected))]);
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

export function circuitPlugin(world: World, camera: Camera2d) {
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
    world.system(Loop, Block, entities => {
        if (dragging.inner?.type === "selection") {
            const selectionP1 = new Vec2(Math.min(dragging.inner.start.x, camera.mouseWorldCoords().x), Math.min(dragging.inner.start.y, camera.mouseWorldCoords().y));
            const selectionP2 = new Vec2(Math.max(dragging.inner.start.x, camera.mouseWorldCoords().x), Math.max(dragging.inner.start.y, camera.mouseWorldCoords().y));
            for (const e of entities) {
                e(Block).selected = hitboxToRect(e(Block).block.data.hitbox, {pos1: selectionP1.sub(e(Block).pos.pos), pos2: selectionP2.sub(e(Block).pos.pos)});

            }
        }
    });
}

type CircuitNodeOrValue = boolean | {block: number, output: number};
export class CircuitBlock {
    block: IBlock;
    pos: Vec2;
    inputs: CircuitNodeOrValue[];

    constructor(block: IBlock, pos: Vec2, inputs: CircuitNodeOrValue[]) {
        this.block = block;
        this.pos = pos;
        this.inputs = inputs;
    }
}

export class Circuit {
    blocks: CircuitBlock[] = [];
    name: string | undefined;

    constructor (blocks: CircuitBlock[], name: string | undefined) {
        this.blocks = blocks;
        this.name = name;
    }

    static fromBlocks(blocks: Block[], name: string | undefined, outerConnections: "remove" | "throw" = "throw"): Circuit {
        const circuit = new Circuit([], name);
        for (const block of blocks) {
            const inputs: CircuitNodeOrValue[] = [];
            for (const input of block.inputs) {
                if (typeof input === "boolean") {
                    inputs.push(input);
                } else {
                    const block = blocks.findIndex(v => v === input.block);
                    if (block === -1) {
                        if (outerConnections === "remove") {
                            inputs.push(false);
                        } else if (outerConnections === "throw") {
                            throw new Error("Outer connection found while exporting circuit. Use outerConnections: 'remove' to ignore");
                        }
                    } else {
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

    static saveCircuit(world: World): Circuit {
        return Circuit.fromBlocks(getBlocks(world), circuitName.get(), "throw");
    }

    load(world: World, camera: Camera2d, pos: Vec2, addToSelection: boolean = false) {
        const newBlocks: Block[] = [];
        for (const block of this.blocks) {
            const inputs: NodeOrValue[] = [];
            for (const input of block.inputs) {
                if (typeof input === "boolean") {
                    inputs.push(input);
                } else {
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
        for (const [block, newBlock] of this.blocks.map<[CircuitBlock, Block]>((v, i) => [v, newBlocks[i]])) {
            for (const [i, input] of block.inputs.entries()) {
                if (typeof input !== "boolean") {
                    newBlock.inputs[i] = {
                        block: newBlocks[input.block],
                        outputId: input.output,
                    }
                }
            }
        }
    }

    serializeJSON(): string {
        return JSON.stringify({version: 1, blocks: this.blocks, name: this.name}, (k: string, v: any) => {
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

    static deserializeJSON(d: string) {
        const json = JSON.parse(d);
        const name = "name" in json ? json.name : undefined;
        const blocks = expect(json.blocks, Array).map(v => {
            const block = expect<object>(v, "object");
            const type = fromBlockId(expectField<string>(block, "block", "string"), "data" in block ? block.data : undefined);
            const posField = expectField<object>(block, "pos", "object");
            const pos = new Vec2(expectField<number>(posField, "x", "number"), expectField<number>(posField, "y", "number"));
            const inputs: CircuitNodeOrValue[] = expectField(block, "inputs", Array).map(v => {
                if (typeof v === "boolean") {
                    return v;
                } else {
                    const input = expect<object>(v, "object");
                    return {
                        block: expectField(input, "block", "number"),
                        output: expectField(input, "output", "number"),
                    }
                }
            });
            return new CircuitBlock(type, pos, inputs);
        });
        return new Circuit(blocks, name);
    }

    serializeBinary(): Uint8Array {
        const VERSION = 1; // Version must not be: 9, 10, 13, 32, 123 as these are the magic numbers for detecting json files.

        const w = new Writer();
        w.i32(VERSION);
        w.bool(this.name !== undefined);
        if (this.name !== undefined) {w.string(this.name)};
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
                } else {
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

    static deserializeBinary(d: Uint8Array): Circuit {
        const r = new Reader(d);
        const version = r.i32();
        if (version === 1) {
            let name;
            const hasName = r.bool();
            if (hasName) {name = r.string();}
            const blocks: CircuitBlock[] = [];
            r.array(br => {
                const blockId = br.string();
                const pos = new Vec2(br.f32(), br.f32());
                const inputs: CircuitNodeOrValue[] = [];
                br.array(ir => {
                    const isBool = ir.bool();
                    if (isBool) {
                        inputs.push(ir.bool());
                    } else {
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

export function getBlocks(world: World): Block[] {
    return world.getEntities(Block).map(v => v(Block));
}

export function getSelectedBlocks(world: World): Block[] {
    return world.getEntities(Block).map(v => v(Block)).filter(v => v.selected);
}

export function isEmpty(world: World): boolean {
    return getBlocks(world).length === 0;
}

export function deleteAllBlocks(world: World) {
    getBlocks(world).forEach(b => b.remove(world));
}

export function deselectAll(world: World) {
    showSelectionTools.set(false);
    selectionFrame.inner = null;
    getSelectedBlocks(world).forEach(v => v.selected = false);
}

function getBlockId(b: IBlock): string {
    for (const [catName, category] of Object.entries(blocks)) {
        for (const block of category.values()) {
            if (b instanceof block) {
                return `${catName}:${block.name}`;
            }
        }
    }
    throw new Error("Could not serialize block. The block must be part of the blocks object in bsim.ts");
}

function fromBlockId(id: string, data: any): IBlock {
    for (const [catName, category] of Object.entries(blocks)) {
        for (const block of category.values()) {
            if (id === `${catName}:${block.name}`) {
                if (block.staticData.deserialize) {
                    return block.staticData.deserialize(data);
                } else {
                    return block.staticData.default();
                }
            }
        }
    }
    throw new Error(`Invalid block id (got: ${id})`);
}

type TypeName<T> = T extends boolean  ? "boolean" :
                   T extends number   ? "number" :
                   T extends bigint   ? "bigint" :
                   T extends string   ? "string" :
                   T extends symbol   ? "symbol" :
                   T extends Function ? "function" :
                   "object";

function expect<T>(v: any, t: TypeName<T> | Constructor<T>): T {
    if (typeof t === "string") {
        if (typeof v === t) {
            return v;
        } else {
            throw new Error(`Invalid type, expected ${t}, found ${typeof v}`);
        }
    } else {
        if (v instanceof t) {
            return v;
        } else {
            throw new Error(`Invalid type, expected ${t.name}`);
        }
    }
}

function expectField<T>(v: {[key: string]: any}, f: string, t: TypeName<T> | Constructor<T> | (T extends any ? "any" : never)): T {
    if (f in v) {
        if (t === "any") {
            return v[f];
        } else {
            return expect(v[f], t);
        }
    } else {
        throw new Error(`Invalid type, expected field ${f}`);
    }
}