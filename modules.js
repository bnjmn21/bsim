'use strict';

class ToggleButton {
    inputs = [];
    outputs = [{type: "bit", pos: new Vec2(1, 0)}];
    default = new ToggleButton(false);

    state;
    constructor (state) {
        this.state = state;
    }
    compute(input, ctx) {
        return [{ bit: this.state }];
    }
    render(ctx) {
        let div = new HTMLDivElement();
        div.addEventListener("click", e => {
            this.state = !this.state;
            ctx.requestUpdate(e);
        });
        this.update(div);
        return div;
    }
    update(html) {
        
    }
}