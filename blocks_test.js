"use strict";
class And {
    calculate(input) {
        return [input.every(v => v)];
    }
}
class Or {
    calculate(input) {
        return [input.some(v => v)];
    }
}
class Xor {
    calculate(input) {
        return [input.filter(v => v).length % 2 === 1];
    }
}
class Toggle {
    state;
    constructor(state) {
        this.state = state;
    }
    calculate(input) {
        return [this.state];
    }
}
class Block {
    inputs;
    output;
    block;
    constructor(inputs, block) {
        this.inputs = inputs;
        this.output = null;
        this.block = block;
    }
    getOutput(blocks) {
        if (this.output !== null) {
            return this.output;
        }
        const inputs = [];
        for (const input of this.inputs) {
            if (typeof input === "boolean") {
                inputs.push(input);
            }
            else {
                const block = blocks[input.blockId];
                inputs.push(block.getOutput(blocks)[input.outputId]);
            }
        }
        return this.block.calculate(inputs);
    }
}
class Graph {
    blocks = [];
    addBlock(block) {
        return this.blocks.push(block) - 1;
    }
    getBlock(id) {
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
const and2 = graph.addBlock(new Block([{ blockId: toggle, outputId: 0 }, true], new And()));
const or = graph.addBlock(new Block([
    { blockId: and1, outputId: 0 },
    { blockId: and2, outputId: 0 }
], new Xor()));
console.log(graph.getBlock(or).getOutput(graph.blocks)[0]);
const button = document.createElement("button");
button.innerText = "toggle";
button.addEventListener("click", () => {
    graph.reset();
    inner_toggle.state = !inner_toggle.state;
});
document.body.appendChild(button);
