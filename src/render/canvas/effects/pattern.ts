import { Border, Fill, ImageScaleMode, ShapeSize } from "../../../data/classes";
import { ImageShape } from "../../../data/shape";

const default_url = 'data:image/svg+xml;base64,PHN2ZyBkYXRhLXYtM2YyZGNlYTM9IiIgZGF0YS12LTJkNjBmMTNlPSIiIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczp4aHRtbD0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pbllNaW4gbWVldCIgb3ZlcmZsb3c9InZpc2libGUiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsiPjxnPjxnPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDIxNiwyMTYsMjE2KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjE2LDIxNiwyMTYpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwyMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDIxNiwyMTYsMjE2KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwzMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMzAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwyMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMjAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMCwwLDApIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDIwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDEwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjE2LDIxNiwyMTYpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigwLDAsMCkiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMDAsMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMzAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMjAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMCwwLDApIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDIwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDEwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEwMCwwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PC9nPjwvc3ZnPg=='

const handler: { [key: string]: (ctx: CanvasRenderingContext2D, frame: ShapeSize, fill: Fill) => any } = {};

handler[ImageScaleMode.Fill] = function (ctx: CanvasRenderingContext2D, frame: ShapeSize, fill: Fill): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const img = new Image();
    img.src = url;
    img.onload = () => {
        const pattern = ctx.createPattern(img, 'no-repeat');
        let matrix = new DOMMatrix();
        img.width = image_w;
        img.height = image_h;
        const rotatedDims = calculateRotatedDimensions(img.width, img.height, fill.rotation || 0);
        const fitScaleX = frame.width / rotatedDims.width;
        const fitScaleY = frame.height / rotatedDims.height;
        const fitScale = Math.max(fitScaleX, fitScaleY);

        matrix = matrix
            .translate(frame.width / 2, frame.height / 2)
            .rotate(fill.rotation || 0)
            .scale(fitScale)
            .translate(-img.width / 2, -img.height / 2);
        if (pattern) {
            pattern.setTransform(matrix);
            ctx.fillStyle = pattern;
        }
    }
}

handler[ImageScaleMode.Fit] = function (ctx: CanvasRenderingContext2D, frame: ShapeSize, fill: Fill): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const img = new Image();
    img.src = url;

    img.onload = () => {
        // const offscreen = new OffscreenCanvas(frame.width, frame.height);
        // const offCtx = offscreen.getContext('2d');
        const pattern = ctx.createPattern(img, 'no-repeat');
        let matrix = new DOMMatrix();

        img.width = image_w;
        img.height = image_h;
        const containDims = calculateRotatedDimensions(img.width, img.height, fill.rotation || 0);
        const containScaleX = frame.width / containDims.width;
        const containScaleY = frame.height / containDims.height;
        const containScale = Math.min(containScaleX, containScaleY);

        matrix = matrix
            .translate(frame.width / 2, frame.height / 2)
            .rotate(fill.rotation || 0)
            .scale(containScale)
            .translate(-img.width / 2, -img.height / 2);
        if (pattern) {
            pattern.setTransform(matrix);
            ctx.fillStyle = pattern;
        }
    }
}

handler[ImageScaleMode.Stretch] = function (ctx: CanvasRenderingContext2D, frame: ShapeSize, fill: Fill): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const img = new Image();
    img.src = url;
    img.onload = () => {
        const pattern = ctx.createPattern(img, 'no-repeat');
        let matrix = new DOMMatrix();
        img.width = image_w;
        img.height = image_h;

        const rad = (fill.rotation || 0) * Math.PI / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const rotatedWidth = frame.width * cos + frame.height * sin;
        const rotatedHeight = frame.width * sin + frame.height * cos;

        const baseScaleX = rotatedWidth / img.width;
        const baseScaleY = rotatedHeight / img.height;
        matrix = matrix
            .translate(frame.width / 2, frame.height / 2)
            .rotate(fill.rotation || 0)
            .scale(baseScaleX, baseScaleY)
            .translate(-img.width / 2, -img.height / 2);
        if (pattern) {
            pattern.setTransform(matrix);
            ctx.fillStyle = pattern;
        }
    }
}

handler[ImageScaleMode.Crop] = function (ctx: CanvasRenderingContext2D, frame: ShapeSize, fill: Fill): any {

}

handler[ImageScaleMode.Tile] = function (ctx: CanvasRenderingContext2D, frame: ShapeSize, fill: Fill): any {
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    let scale = typeof fill.scale === 'number' ? fill.scale : 0.5;
    const url = fill.peekImage(true) || default_url;
    const img = new Image();
    img.src = url;
    img.onload = () => {
        const pattern = ctx.createPattern(img, 'repeat');
        let matrix = new DOMMatrix();
        img.width = image_w;
        img.height = image_h;

        const offset = calculateOffset(img, scale, fill.rotation || 0);
        matrix = matrix
            .translate(offset.x, offset.y)
            .rotate(fill.rotation || 0)
            .scale(scale);
        if (pattern) {
            pattern.setTransform(matrix);
            ctx.fillStyle = pattern;
        }
    }
}

function calculateOffset(img: HTMLImageElement, scale: number, rotation: number) {
    const w = img.width;
    const h = img.height;
    const rad = rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const points = [
        { x: 0, y: 0 },
        { x: w * scale, y: 0 },
        { x: w * scale, y: h * scale },
        { x: 0, y: h * scale }
    ].map(p => ({
        x: p.x * cos - p.y * sin,
        y: p.x * sin + p.y * cos
    }));

    const minX = Math.min(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));

    return { x: -minX, y: -minY };
}

export function patternRender(ctx: CanvasRenderingContext2D, frame: ShapeSize, fill: Fill): any {
    const mode = fill.imageScaleMode as ImageScaleMode || ImageScaleMode.Fill;
    return handler[mode](ctx, frame, fill);
}

function calculateRotatedDimensions(width: number, height: number, rotation: number) {
    const rad = rotation * Math.PI / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));

    return {
        width: width * cos + height * sin,
        height: width * sin + height * cos
    };
}

const paintFilter = (h: Function, fill: Fill) => {
    const paintFilter = fill.paintFilter;
    if (!paintFilter) return;
    if (paintFilter.exposure) {

    }

}