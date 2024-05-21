import { Color, RGB } from "./colors.js";
import { Vec2, lerp } from "./engine.js";


export type ColorStop = { color: Color, position: number, interpolation: (a: Color, b: Color, t: number) => RGB }
export type GradientFn = (pixel: Vec2, size: Vec2) => number;
export type DitheringFn = (pixels: RGB[][]) => void;

export class Gradient {
    static INTERPOLATIONS = {
        LINEAR: (a: Color, b: Color, t: number): RGB => {
            const aRgb = a.toRGB();
            const bRgb = b.toRGB();
            return new RGB(
                lerp(aRgb.r, bRgb.r, t),
                lerp(aRgb.g, bRgb.g, t),
                lerp(aRgb.b, bRgb.b, t)
            );
        },
        STEP: (a: Color, b: Color, t: number): RGB => {
            return b.toRGB();
        }
    }
    static GRADIENTS = {
        RADIAL: (centerFn: (size: Vec2) => Vec2) => (pixel: Vec2, size: Vec2): number => {
            return pixel.dist(centerFn(size)) / size.hypot();
        }
    }
    static DITHERING = {
        NONE: (image: RGB[][]) => {},
        FLOYD_STEINBERG: (image: RGB[][]) => {
            for (let y = 0; y < image.length; y++) {
                for (let x = 0; x < image[0].length; x++) {
                    const oldPx = image[y][x].toArray();
                    const newPx = oldPx.map(v => Math.floor(v));
                    const error = oldPx.map((v, i) => v - newPx[i]);
                    const lastX = x == image[0].length - 1;
                    const lastY = y == image.length - 1;
                    if (!lastX) {
                        image[y    ][x + 1] = new RGB(
                            image[y    ][x + 1].r + (error[0] * (7 / 16)),
                            image[y    ][x + 1].g + (error[1] * (7 / 16)),
                            image[y    ][x + 1].b + (error[2] * (7 / 16))
                        );
                    }
                    if (!(lastY || x === 0)) {
                        image[y + 1][x - 1] = new RGB(
                            image[y + 1][x - 1].r + (error[0] * (3 / 16)),
                            image[y + 1][x - 1].g + (error[1] * (3 / 16)),
                            image[y + 1][x - 1].b + (error[2] * (3 / 16))
                        );
                    }
                    if (!lastY) {
                        image[y + 1][x    ] = new RGB(
                            image[y + 1][x    ].r + (error[0] * (5 / 16)),
                            image[y + 1][x    ].g + (error[1] * (5 / 16)),
                            image[y + 1][x    ].b + (error[2] * (5 / 16))
                        );
                    }
                    if (!(lastX || lastY)) {
                        image[y + 1][x + 1] = new RGB(
                            image[y + 1][x + 1].r + (error[0] * (1 / 16)),
                            image[y + 1][x + 1].g + (error[1] * (1 / 16)),
                            image[y + 1][x + 1].b + (error[2] * (1 / 16))
                        );
                    }
                }
            }
        }
    }

    gradientFn: GradientFn;
    ditheringFn: DitheringFn;
    _startColor?: Color;
    colorStops: ColorStop[] = [];

    constructor(gradientFn: GradientFn, ditheringFn: DitheringFn = Gradient.DITHERING.FLOYD_STEINBERG) {
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

    getColor(t: number): RGB {
        for (let i = 0; i < this.colorStops.length; i++) {
            if (t < this.colorStops[i].position) {
                if (i === 0) {
                    return this.colorStops[i].interpolation(
                        this._startColor as Color,
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
        return new RGB(0, 0, 0);
    }

    renderTo(imageData: ImageData) {
        const data: RGB[][] = [];
        const size = new Vec2(imageData.width, imageData.height);
        if (!this._startColor) {
            throw new Error("Start color must be set");
        } else if (this.colorStops.length === 0 || this.colorStops[this.colorStops.length - 1].position !== 1) {
            throw new Error("End color stop must be set");
        }
        for (let y = 0; y < size.y; y++) {
            const row: RGB[] = [];
            for (let x = 0; x < size.x; x++) {
                row[x] = this.getColor(this.gradientFn(new Vec2(x, y), size));
            }
            data.push(row);
        }   
        this.ditheringFn(data);
        for (let i = 0; i < size.area(); i++) {
            const color = data[Math.floor(i / size.x)][i % size.x];
            imageData.data[i * 4] = Math.floor(color.r);
            imageData.data[i * 4 + 1] = Math.floor(color.g);
            imageData.data[i * 4 + 2] = Math.floor(color.b);
            imageData.data[i * 4 + 3] = 255;
        }
    }
}