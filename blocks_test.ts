interface IBlock {
    calculate(input: boolean[]): boolean[];
}

class And implements IBlock {
    calculate(input: boolean[]): boolean[] {
        return [input.every(v => v)];
    }
}

class Or implements IBlock {
    calculate(input: boolean[]): boolean[] {
        return [input.some(v => v)];
    }
}

class Xor implements IBlock {
    calculate(input: boolean[]): boolean[] {
        return [input.filter(v => v).length % 2 === 1]
    }
}

class Toggle implements IBlock {
    state: boolean;

    constructor(state: boolean) {
        this.state = state;
    }

    calculate(input: boolean[]): boolean[] {
        return [this.state];
    }
}

type InputNode = {blockId: number, outputId: number} | boolean;
class Block {
    inputs: InputNode[];
    output: boolean[] | null;
    block: IBlock;

    constructor (inputs: InputNode[], block: IBlock) {
        this.inputs = inputs;
        this.output = null;
        this.block = block;
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
                const block = blocks[input.blockId];
                inputs.push(block.getOutput(blocks)[input.outputId]);
            }
        }
        return this.block.calculate(inputs);
    }
}

class Graph {
    blocks: Block[] = [];

    addBlock(block: Block): number {
        return this.blocks.push(block) - 1;
    }

    getBlock(id: number): Block {
        return this.blocks[id];
    }

    reset() {
        this.blocks.forEach(block => {
            block.output = null;
        });
    }
}

const graph = new Graph();
const inner_toggle = new Toggle(false);
const toggle = graph.addBlock(new Block([], inner_toggle));
const and1 = graph.addBlock(new Block([true, true], new And()));
const and2 = graph.addBlock(new Block([{blockId: toggle, outputId: 0}, true], new And()));
const or   = graph.addBlock(new Block([
    {blockId: and1, outputId: 0},
    {blockId: and2, outputId: 0}
], new Xor()));

console.log(graph.getBlock(or).getOutput(graph.blocks)[0]);

const button = document.createElement("button");
button.innerText = "toggle";
button.addEventListener("click", () => {
    graph.reset();
    inner_toggle.state = !inner_toggle.state;
});
document.body.appendChild(button);