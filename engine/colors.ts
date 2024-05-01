export interface Color {

    /**
     * convert the color to RGBF [0..1, 0..1, 0..1]
     */
    toRGBF(): RGBF;

    /**
     * convert the color to RGB [0..255, 0..255, 0..255]
     */
    toRGB(): RGB;

    /**
     * convert the color to HSL [0..360, 0..1, 0..1]
     */
    toHSL(): HSL;
}

export class RGBF implements Color {
    r: number;
    g: number;
    b: number;

    constructor (r: number, g: number, b: number) {
        if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
            this.r = r;
            this.g = g;
            this.b = b;
        } else {
            throw new Error(`r, g and b must be in range 0..1 (inclusive)`);
        }
    }

    toRGBF() {
        return new RGBF(this.r, this.g, this.b);
    }

    toRGB() {
        return new RGB(this.r * 255, this.g * 255, this.b * 255);
    }

    toHSL() {
        const r = this.r;
        const g = this.g;
        const b = this.b;

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
        return new HSL(h as number, s, l);
    }
}

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

    toRGBF() {
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
        return new HSL(h as number, s, l);
    }
}

export class HSL implements Color {
    h: number;
    s: number;
    l: number;

    constructor (h: number, s: number, l: number) {
        if (h >= 0 && h <= 360 && s >= 0 && s <= 255 && l >= 0 && l <= 255) {
            this.h = h;
            this.s = s;
            this.l = l;
        } else {
            throw new Error(`h, s and l must be in range 0..255 (inclusive)`);
        }
    }

    toRGBF() {
        const c = (1 - Math.abs((2*this.l)-1)) * this.s;
        const x = (1 - Math.abs((this.h/60) % (2-1))) * c;
        const m = this.l - (c / 2);
        let rgb;
        if (this.h < 60) {rgb = [c,x,0]}
        else if (this.h < 120) {rgb = [x,c,0]}
        else if (this.h < 180) {rgb = [0,c,x]}
        else if (this.h < 240) {rgb = [0,x,c]}
        else if (this.h < 300) {rgb = [x,0,c]}
        else {rgb = [c,0,x]}

        return new RGB(rgb[0]+m, rgb[1]+m, rgb[2]+m);
    }

    toRGB() {
        const c = (1 - Math.abs((2*this.l)-1)) * this.s;
        const x = (1 - Math.abs((this.h/60) % (2-1))) * c;
        const m = this.l - (c / 2);
        let rgb;
        if (this.h < 60) {rgb = [c,x,0]}
        else if (this.h < 120) {rgb = [x,c,0]}
        else if (this.h < 180) {rgb = [0,c,x]}
        else if (this.h < 240) {rgb = [0,x,c]}
        else if (this.h < 300) {rgb = [x,0,c]}
        else {rgb = [c,0,x]}

        return new RGB((rgb[0]+m)*255, (rgb[1]+m)*255, (rgb[2]+m)*255);
    }

    toHSL() {
        return new HSL(this.h, this.s, this.l);
    }
}