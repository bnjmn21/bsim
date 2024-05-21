import { Vec2 } from "./engine";

export type FillStrokeStyle = string | CanvasGradient | CanvasPattern;

export class LineGraph {
    ctx: CanvasRenderingContext2D;
    pos: Vec2;
    size: Vec2;

    constructor (ctx: CanvasRenderingContext2D, pos: Vec2, size: Vec2) {
        this.ctx = ctx;
        this.pos = pos;
        this.size = size;
    }

    render(data: number[], maxVal: number) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.pos.x, this.pos.y + (data[0] / maxVal * this.size.y));
        let i = 1;
        for (const val of data) {
            this.ctx.lineTo(this.pos.x + (i / data.length * this.size.x), this.pos.y + this.size.y - (val / maxVal * this.size.y));
            i++;
        }
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.pos.x + this.size.x, this.pos.y + this.size.y);
        this.ctx.lineTo(this.pos.x, this.pos.y + this.size.y);
        this.ctx.lineTo(this.pos.x, this.pos.y + (data[0] / maxVal * this.size.y));
        i = 1;
        for (const val of data) {
            this.ctx.lineTo(this.pos.x + (i / data.length * this.size.x), this.pos.y + this.size.y - (val / maxVal * this.size.y));
            i++;
        }
        this.ctx.fill();
    }
}

export type APieceOfCake = {style: FillStrokeStyle, val: number, name: string}
export class PieGraph {
    ctx: CanvasRenderingContext2D;
    center: Vec2;
    radius: number;

    constructor (ctx: CanvasRenderingContext2D, center: Vec2, radius: number) {
        this.ctx = ctx;
        this.center = center;
        this.radius = radius;
    }

    render(pieces: APieceOfCake[]) {
        const total = pieces.map(piece => piece.val).reduce((p, c) => p + c);
        let current = 0;
        let i = 0;
        this.ctx.font = `10px "JetBrains Mono", monospace`;
        for (const piece of pieces) {
            this.ctx.fillStyle = piece.style;
            this.ctx.beginPath();
            this.ctx.moveTo(this.center.x, this.center.y);
            this.ctx.arc(this.center.x, this.center.y, 150, 2 * Math.PI * (current / total), 2 * Math.PI * ((current + piece.val) / total));
            this.ctx.lineTo(this.center.x, this.center.y);
            this.ctx.fill();
            this.ctx.fillText(piece.name, this.center.x, this.center.y - this.radius - ((pieces.length - i) * 10));
            current += piece.val;
            i++;
        }
    }
}