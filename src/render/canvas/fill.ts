import { Fill, FillType, ShapeSize } from "../../data";

export function render(ctx: CanvasRenderingContext2D, fills: Fill[], frame: ShapeSize, path: string) {
    for (const fill of fills) {

    }
}

const painter: { [key: string]: (ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame?: ShapeSize) => void } = {};

painter[FillType.SolidColor] = function (ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D);
}

const painterCommand: { [key: string]: (ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame?: ShapeSize) => string } = {};

painterCommand[FillType.SolidColor] = function (ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D);

    return `ctx.fillStyle = rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha});ctx.fill(path2D);`
}