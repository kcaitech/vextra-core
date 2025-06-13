/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Fill, ImageScaleMode, ShapeSize } from "../../../data/classes";

const default_url = 'data:image/svg+xml;base64,PHN2ZyBkYXRhLXYtM2YyZGNlYTM9IiIgZGF0YS12LTJkNjBmMTNlPSIiIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczp4aHRtbD0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pbllNaW4gbWVldCIgb3ZlcmZsb3c9InZpc2libGUiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsiPjxnPjxnPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDIxNiwyMTYsMjE2KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjE2LDIxNiwyMTYpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwyMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDIxNiwyMTYsMjE2KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwzMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMzAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwyMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMjAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMCwwLDApIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDIwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDEwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjE2LDIxNiwyMTYpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigwLDAsMCkiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMDAsMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMzAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMjAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMCwwLDApIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDIwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDEwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEwMCwwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PC9nPjwvc3ZnPg=='

const handler: { [key: string]: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ShapeSize, fill: Fill, path2D: Path2D) => any } = {};

handler[ImageScaleMode.Fill] = function (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ShapeSize, fill: Fill, path2D: Path2D): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const m = ctx.getTransform();
    const img = new Image();
    img.src = url;
    img.width = image_w;
    img.height = image_h;
    img.onload = () => {
        ctx.save();
        ctx.setTransform(m)
        ctx.clip(path2D, "evenodd");
        const offscreen = new OffscreenCanvas(frame.width, frame.height);
        const offCtx = offscreen.getContext('2d')!;
        const pattern = offCtx.createPattern(img, 'no-repeat');
        let matrix = new DOMMatrix();
        const rotatedDims = calculateRotatedDimensions(img.width, img.height, fill.rotation || 0);
        const fitScaleX = frame.width / rotatedDims.width;
        const fitScaleY = frame.height / rotatedDims.height;
        const fitScale = Math.max(fitScaleX, fitScaleY);

        matrix = matrix
            .translate(frame.width / 2, frame.height / 2)
            .rotate(fill.rotation || 0)
            .scale(fitScale)
            .translate(-img.width / 2, -img.height / 2);
        if (pattern && offCtx) {
            pattern.setTransform(matrix);
            offCtx.fillStyle = pattern;
            offCtx.fill(path2D);
            const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
            const data = imageData.data;
            paintFilter(data, fill);
            offCtx.putImageData(imageData, 0, 0);
        }
        ctx.drawImage(offscreen, 0, 0);
        ctx.restore();
    }
}

handler[ImageScaleMode.Fit] = function (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ShapeSize, fill: Fill, path2D: Path2D): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const m = ctx.getTransform();
    const img = new Image();
    img.src = url;
    img.width = image_w;
    img.height = image_h;
    img.onload = () => {
        ctx.save();
        ctx.setTransform(m);
        ctx.clip(path2D, "evenodd");
        const offscreen = new OffscreenCanvas(frame.width, frame.height);
        const offCtx = offscreen.getContext('2d')!;
        let matrix = new DOMMatrix();
        const pattern = offCtx.createPattern(img, 'no-repeat');
        const containDims = calculateRotatedDimensions(img.width, img.height, fill.rotation || 0);
        const containScaleX = frame.width / containDims.width;
        const containScaleY = frame.height / containDims.height;
        const containScale = Math.min(containScaleX, containScaleY);
        matrix = matrix
            .translate(frame.width / 2, frame.height / 2)
            .rotate(fill.rotation || 0)
            .scale(containScale)
            .translate(-img.width / 2, -img.height / 2);
        if (pattern && offCtx) {
            offCtx.save();
            pattern.setTransform(matrix);
            offCtx.setTransform(matrix)
            const path = new Path2D();
            path.rect(0, 0, img.width, img.height);
            offCtx.clip(path, "evenodd");
            offCtx.resetTransform();
            offCtx.fillStyle = pattern;
            offCtx.fill(path2D);
            offCtx.restore();
            const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
            const data = imageData.data;
            paintFilter(data, fill);
            offCtx.putImageData(imageData, 0, 0);
        }
        ctx.drawImage(offscreen, 0, 0);
        ctx.restore();
    }
}

handler[ImageScaleMode.Stretch] = function (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ShapeSize, fill: Fill, path2D: Path2D): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const m = ctx.getTransform();
    const img = new Image();
    img.src = url;
    img.width = image_w;
    img.height = image_h;
    img.onload = () => {
        ctx.save();
        ctx.setTransform(m);
        ctx.clip(path2D, "evenodd");
        const offscreen = new OffscreenCanvas(frame.width, frame.height);
        const offCtx = offscreen.getContext('2d')!;
        const pattern = offCtx.createPattern(img, 'no-repeat');
        let matrix = new DOMMatrix();
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
        if (pattern && offCtx) {
            pattern.setTransform(matrix);
            offCtx.fillStyle = pattern;
            offCtx.fill(path2D);
            const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
            const data = imageData.data;
            paintFilter(data, fill);
            offCtx.putImageData(imageData, 0, 0);
        }
        ctx.drawImage(offscreen, 0, 0);
        ctx.restore();
    }
}

handler[ImageScaleMode.Crop] = function (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ShapeSize, fill: Fill, path2D: Path2D): any {

}

handler[ImageScaleMode.Tile] = function (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ShapeSize, fill: Fill, path2D: Path2D): any {
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const m = ctx.getTransform();
    let scale = typeof fill.scale === 'number' ? fill.scale : 0.5;
    const url = fill.peekImage(true) || default_url;
    const img = new Image();
    img.src = url;
    img.width = image_w;
    img.height = image_h;
    img.onload = () => {
        ctx.save();
        ctx.setTransform(m);
        ctx.clip(path2D, "evenodd");
        const offscreen = new OffscreenCanvas(frame.width, frame.height);
        const offCtx = offscreen.getContext('2d')!;
        const pattern = offCtx.createPattern(img, 'repeat');
        let matrix = new DOMMatrix();

        const offset = calculateOffset(img, scale, fill.rotation || 0);
        matrix = matrix
            .translate(offset.x, offset.y)
            .rotate(fill.rotation || 0)
            .scale(scale);
        if (pattern && offCtx) {
            pattern.setTransform(matrix);
            offCtx.fillStyle = pattern;
            offCtx.fill(path2D);
            const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
            const data = imageData.data;
            paintFilter(data, fill);
            offCtx.putImageData(imageData, 0, 0);
        }
        ctx.drawImage(offscreen, 0, 0);
        ctx.restore();
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

export function patternRender(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, frame: ShapeSize, fill: Fill, path2D: Path2D): any {
    const mode = fill.imageScaleMode as ImageScaleMode || ImageScaleMode.Fill;
    return handler[mode](ctx, frame, fill, path2D);
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

const paintFilter = (data: Uint8ClampedArray, fill: Fill) => {
    const paintFilter = fill.paintFilter;
    if (!paintFilter) return;
    if (paintFilter.hue) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            let [h, s, l] = rgbToHsl(r, g, b);
            h = (h + paintFilter.hue) % 360;
            if (h < 0) h += 360;
            const newData = hslToRgb(h, s, l);
            data[i] = Math.min(255, Math.max(0, newData[0]));
            data[i + 1] = Math.min(255, Math.max(0, newData[1]));
            data[i + 2] = Math.min(255, Math.max(0, newData[2]));
        }
    }
    if (paintFilter.exposure) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(Math.max(data[i] + (paintFilter.exposure * 1.6), 0), 255);
            data[i + 1] = Math.min(Math.max(data[i + 1] + (paintFilter.exposure * 1.6), 0), 255);
            data[i + 2] = Math.min(Math.max(data[i + 2] + (paintFilter.exposure * 1.6), 0), 255);
        }
    }
    if (paintFilter.contrast) {
        // 对比度
        const contrast = (paintFilter.contrast * 0.2 + 100) / 100;
        const intercept = 128 * (1 - contrast);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * contrast + intercept));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrast + intercept));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrast + intercept));
        }
    }

    if (paintFilter.temperature) {
        // 色温
        const scale = 0.8;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(Math.max(data[i] + scale * paintFilter.temperature, 0), 255);
            data[i + 2] = Math.min(Math.max(data[i + 2] - scale * paintFilter.temperature, 0), 255);
        }
    }
    if (paintFilter.tint) {
        // 色调
        const intensity = 0.4;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            if (paintFilter.tint > 0) {
                data[i] = Math.min(255, r + paintFilter.tint * intensity);
                data[i + 1] = Math.max(0, g - paintFilter.tint * intensity);
            } else {
                data[i] = Math.max(0, r + paintFilter.tint * intensity);
                data[i + 1] = Math.min(255, g - paintFilter.tint * intensity);
            }
        }
    }
    if (paintFilter.saturation) {
        // 饱和度
        const saturationScale = 1 + (paintFilter.saturation / 100);
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
            data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * saturationScale));
            data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * saturationScale));
            data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * saturationScale));
        }
    }
    if (paintFilter.shadow) {
        // 阴影
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const shadowThreshold = 128;
            if (brightness < shadowThreshold) {
                const adjustmentStrength = (shadowThreshold - brightness) / shadowThreshold;
                const adjustment = paintFilter.shadow * adjustmentStrength;
                data[i] = Math.min(255, Math.max(0, data[i] + adjustment));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment));
            }
        }
    }

}

function rgbToHsl(r: number, g: number, b: number) {

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number) {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r, g, b;
    if (h < 60) {
        r = c; g = x; b = 0;
    } else if (h < 120) {
        r = x; g = c; b = 0;
    } else if (h < 180) {
        r = 0; g = c; b = x;
    } else if (h < 240) {
        r = 0; g = x; b = c;
    } else if (h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}
