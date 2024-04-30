export interface Color {

    /**
     * convert the color to RGB, where each channel is a number from 0 to 1
     */
    toRGBf(): [number, number, number];

    /**
     * convert the color to RGB, where each channel is a number from 0 to 255
     */
    toRGB(): RGB;

    /**
     * 
     */
    toHSL(): HSL;
}

/**
 * Range:
 * r, g, b: 0.255
 */
export class RGB implements Color {
    r: number;
    g: number;
    b: number;

    constructor (r: number, g: number, b: number) {
        if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
            this.r = r;
            this.g = g;
            this.b = b;
        } else {
            throw new Error(`r, g and b must be in range 0..255 (inclusive)`);
        }
    }

    toRGBf() {
        return new RGBF(this.r / 255, this.g / 255, this.b / 255);
    }

    toRGB() {
        return new RGB(this.r, this.g, this.b);
    }

    toHSL() {
        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        let h;
        if (diff === 0) {
            h = 0;
        } else if (max === r) {
            h = 60 * (((g - b) / diff) % 6);
        } else if (max === g) {
            h = 60 * (((b - r) / diff) + 2);
        } else if (max === b) {
            h = 60 * (((g - r) / diff) + 4);
        }
        const l = (max + min) / 2
        let s = 0;
        if (diff !== 0) {
            s = diff / (1 - Math.abs((2*l) - 1));
        }
        return new HSL(h, s, l);
    }
}

/**
 * Range:
 * h: 0..360
 * s, v: 0..1
 */
export class HSL implements Color {
    h: number;
    s: number;
    l: number;

    constructor (h: number, s: number, l: number) {
        this.h = h;
        this.s = s;
        this.l = l;
    }
}

function lerp(a: number, b: number, t: number): number {
    return ((1-t)*a) + (t*b);
}

export type ColorStop = {color: Color, interpolation: (a: Color, b: Color, t: number) => Color}

export class Gradient {
    static LINEAR = (a: Color, b: Color, t: number): Color => {
        const aRgb = a.toRGB();
        const bRgb = b.toRGB();
        return new RGB(
            lerp(aRgb.r, bRgb.r, t),
            lerp(aRgb.g, bRgb.g, t),
            lerp(aRgb.b, aRgb.b, t)
        );
    }

    gradientFn: (x: number, y: number) => number;
    startColor?: Color;
    colorStops: ColorStop[] = [];

    constructor(gradientFn: (x: number, y: number) => number) {
        this.gradientFn = gradientFn;
    }

    resetColors() {
        this.startColor = undefined;
        this.colorStops = [];
    }

    startColor(color: Color) {
        this.startColor = color;
    }

    colorStopLerp(color: Color) {
        this.colorStops.push(

        );
    }
}