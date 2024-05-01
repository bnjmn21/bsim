import { RGB } from "./colors.js";
function lerp(a, b, t) {
    return ((1 - t) * a) + (t * b);
}
export class Gradient {
    static LINEAR = (a, b, t) => {
        const aRgb = a.toRGB();
        const bRgb = b.toRGB();
        return new RGB(lerp(aRgb.r, bRgb.r, t), lerp(aRgb.g, bRgb.g, t), lerp(aRgb.b, aRgb.b, t));
    };
    static STEP = (a, b, t) => {
        return b.toRGB();
    };
    gradientFn;
    _startColor;
    colorStops = [];
    constructor(gradientFn) {
        this.gradientFn = gradientFn;
    }
    resetColors() {
        this._startColor = undefined;
        this.colorStops = [];
    }
    startColor(color) {
        this._startColor = color;
    }
    colorStopLinear(color, position) {
        this.colorStops.push({
            color,
            position,
            interpolation: Gradient.LINEAR
        });
    }
    colorStopStep(color, position) {
        this.colorStops.push({
            color,
            position,
            interpolation: Gradient.STEP
        });
    }
}
