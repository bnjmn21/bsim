import { Color, RGB } from "./colors.js";

function lerp(a: number, b: number, t: number): number {
    return ((1-t)*a) + (t*b);
}

export type ColorStop = { color: Color, position: number, interpolation: (a: Color, b: Color, t: number) => RGB }

export class Gradient {
    static LINEAR = (a: Color, b: Color, t: number): RGB => {
        const aRgb = a.toRGB();
        const bRgb = b.toRGB();
        return new RGB(
            lerp(aRgb.r, bRgb.r, t),
            lerp(aRgb.g, bRgb.g, t),
            lerp(aRgb.b, aRgb.b, t)
        );
    }
    static STEP = (a: Color, b: Color, t: number): RGB => {
        return b.toRGB();
    }

    gradientFn: (x: number, y: number) => number;
    _startColor?: Color;
    colorStops: ColorStop[] = [];

    constructor(gradientFn: (x: number, y: number) => number) {
        this.gradientFn = gradientFn;
    }

    resetColors() {
        this._startColor = undefined;
        this.colorStops = [];
    }

    startColor(color: Color) {
        this._startColor = color;
    }

    colorStopLinear(color: Color, position: number) {
        this.colorStops.push({
            color,
            position,
            interpolation: Gradient.LINEAR
        });
    }

    colorStopStep(color: Color, position: number) {
        this.colorStops.push({
            color,
            position,
            interpolation: Gradient.STEP
        });
    }
}