import { Color, RGB } from "./colors.js";
import { Vec2, lerp } from "./engine.js";


export type ColorStop = { color: Color, position: number, interpolation: (a: Color, b: Color, t: number) => RGB }
export type GradientFn = (pixel: Vec2, size: Vec2) => number;
export type DitheringFn = (pixels: number[][]) => void;

export class Gradient {
    static INTERPOLATIONS = {
        LINEAR: (a: Color, b: Color, t: number): RGB => {
            const aRgb = a.toRGB();
            const bRgb = b.toRGB();
            return new RGB(
                lerp(aRgb.r, bRgb.r, t),
                lerp(aRgb.g, bRgb.g, t),
                lerp(aRgb.b, aRgb.b, t)
            );
        },
        STEP: (a: Color, b: Color, t: number): RGB => {
            return b.toRGB();
        }
    }
    static GRADIENTS = {
        RADIAL: (centerFn: (size: Vec2) => Vec2) => (pixel: Vec2, size: Vec2): number => {
            return pixel.dist(center(size)) / size.hypot();
        }
    }

    gradientFn: GradientFn;
    ditheringFn: DitheringFn;
    _startColor?: Color;
    colorStops: ColorStop[] = [];

    constructor(gradientFn: GradientFn, ditheringFn: DitheringFn) {
        this.gradientFn = gradientFn;
        this.ditheringFn = ditheringFn;
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
            interpolation: Gradient.INTERPOLATIONS.LINEAR
        });
    }

    colorStopStep(color: Color, position: number) {
        this.colorStops.push({
            color,
            position,
            interpolation: Gradient.INTERPOLATIONS.STEP
        });
    }

    getColor(t: number) {
        for (let i = 0; i < this.colorStops; i++) {
            if (t < this.colorStops[i].position) {
                if (i === 0) {
                    return this.colorStops[i].interpolation(
                        this._startColor,
                        this.colorStops[i].color,
                        t / this.colorStops[i].position
                    );
                } else {
                    return this.colorStops[i].interpolation(
                        this.colorStops[i - 1].color,
                        this.colorStops[i].color,
                        (t - this.colorStops[i - 1].position) /
                        (this.colorStops[i].position - this.colorStops[i - 1].position)
                    );
                }
            }
        }
    }

    renderTo(imageData: ImageData) {
        const grayscale = [];
        const size = new Vec2(imageData.width, imageData.height);
        if (!this._startColor) {
            throw new Error("Start color must be set");
        } else if (this.colorStops.length !== 0 || this.colorStops[this.colorStops.length - 1].position !== 1) {
            throw new Error("End color stop must be set");
        }
        for (let y = 0; y < size.y; y++) {
            const row = [];
            for (let x = 0; x < size.x; x++) {
                row[y] = this.gradientFn(new Vec2(x, y), size);
            }
        }
        this.ditheringFn(grayscale);
        for (let i = 0; i < size.area(); i++) {
            const color = this.getColor(grayscale)
            imageData.data[i * 4] = color.r;
            imageData.data[i * 4 + 1] = color.g;
            imageData.data[i * 4 + 2] = color.b;
            imageData.data[i * 4 + 3] = 255;
        }
    }
}