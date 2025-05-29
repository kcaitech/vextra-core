/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { objectId } from "../../../basic/objectid";
import { Fill, ImageScaleMode, ShapeSize } from "../../../data/classes";
import { ImageShape } from "../../../data/shape";
import { randomId } from "../../basic";

const default_url = 'data:image/svg+xml;base64,PHN2ZyBkYXRhLXYtM2YyZGNlYTM9IiIgZGF0YS12LTJkNjBmMTNlPSIiIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgNDAwIDQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczp4aHRtbD0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pbllNaW4gbWVldCIgb3ZlcmZsb3c9InZpc2libGUiIHN0eWxlPSJiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsiPjxnPjxnPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDIxNiwyMTYsMjE2KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjE2LDIxNiwyMTYpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwyMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDIxNiwyMTYsMjE2KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwzMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMzAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwyMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMjAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMCwwLDApIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDIwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwxMDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigyMTYsMjE2LDIxNikiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzAwLDEwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwMCwwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjE2LDIxNiwyMTYpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjAwLDApIj48cGF0aCBkPSJNIDAgMCBMIDEwMCAwIEwgMTAwIDEwMCBMIDAgMTAwIEwgMCAwIFoiIGZpbGw9InJnYigwLDAsMCkiIGZpbGwtb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMDAsMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMzAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDMwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMjAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMCwwLDApIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDIwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDI1NSwyNTUsMjU1KSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMTAwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAwLDEwMCkiPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnPjxwYXRoIGQ9Ik0gMCAwIEwgMTAwIDAgTCAxMDAgMTAwIEwgMCAxMDAgTCAwIDAgWiIgZmlsbD0icmdiKDAsMCwwKSIgZmlsbC1vcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEwMCwwKSI+PHBhdGggZD0iTSAwIDAgTCAxMDAgMCBMIDEwMCAxMDAgTCAwIDEwMCBMIDAgMCBaIiBmaWxsPSJyZ2IoMjU1LDI1NSwyNTUpIiBmaWxsLW9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L2c+PC9nPjwvc3ZnPg=='

const handler: { [key: string]: (h: Function, frame: ShapeSize, id: string, path: string, fill: Fill) => any } = {};

handler[ImageScaleMode.Fill] = function (h: Function, frame: ShapeSize, id: string, path: string, fill: Fill): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    const img_props: any = {
        'xlink:href': url,
        x: 0,
        y: 0,
        'object-fit': "contain",
        'preserveAspectRatio': 'none meet',
    };

    const props: any = {
        width: frame.width + 1,
        height: frame.height + 1,
        x: 0,
        y: 0,
        patternUnits: 'userSpaceOnUse',
        id: id,
    };
    const proportion_w = frame.width / image_w;
    const proportion_h = frame.height / image_h;
    if (frame.width > frame.height) {
        img_props.width = frame.width;
        const height = image_h * proportion_w;
        let offset = (height - frame.height) / 2;
        if (offset < 0) {
            delete img_props.width;
            img_props.height = frame.height;
            const width = image_w * proportion_h;
            offset = (width - frame.width) / 2;
            img_props.x = -offset;
        } else {
            img_props.y = -offset;
        }
    } else {
        img_props.height = frame.height;
        const width = image_w * proportion_h;
        let offset = (width - frame.width) / 2;
        if (offset < 0) {
            delete img_props.height;
            img_props.width = frame.width;
            const height = image_h * proportion_w;
            offset = (height - frame.height) / 2;
            img_props.y = -offset;
        } else {
            img_props.x = -offset;
        }
    }
    if (fill.rotation && fill.rotation > 0) {
        if (fill.rotation === 90 || fill.rotation === 270) {
            const style: any = {};
            if (img_props.width > 0) {
                img_props.height = img_props.width;
                delete img_props.width;
                if (fill.rotation === 270) {
                    style.transform = `translate(${0}px ,${(frame.height / 2) + ((image_w * (frame.width / image_h)) / 2)}px) rotate(${fill.rotation}deg)`
                    img_props.y = 0;
                } else {
                    style.transform = `translate(${frame.width}px, ${(frame.height / 2) - ((image_w * (frame.width / image_h)) / 2)}px) rotate(${fill.rotation}deg)`;
                    img_props.y = 0;
                }
            } else {
                img_props.width = img_props.height;
                delete img_props.height;
                if (fill.rotation === 270) {
                    if ((frame.height / image_w) * image_h > frame.width) {
                        const offsetx = (((frame.height / image_w) * image_h) - frame.width) / 2;
                        style.transform = `translate(${-offsetx}px ,${frame.height}px) rotate(${fill.rotation}deg)`;
                    } else {
                        img_props.height = frame.width;
                        delete img_props.width;
                        style.transform = `translate(${0}px ,${(frame.height / 2) + ((image_w * (frame.width / image_h)) / 2)}px) rotate(${fill.rotation}deg)`;
                    }
                    img_props.x = 0;
                } else {
                    if ((frame.height / image_w) * image_h > frame.width) {
                        const offsetx = (((frame.height / image_w) * image_h) - frame.width) / 2;
                        style.transform = `translate(${frame.width + offsetx}px, ${0}px) rotate(${fill.rotation}deg)`;
                    } else {
                        img_props.height = frame.width;
                        delete img_props.width;
                        style.transform = `translate(${frame.width}px ,${(frame.height / 2) - ((image_w * (frame.width / image_h)) / 2)}px) rotate(${fill.rotation}deg)`;
                    }
                    img_props.x = 0;
                }
            }
            img_props.style = style;
        } else {
            img_props.style = transformRotate(fill.rotation, frame);
        }
    }
    const paint_filter = paintFilter(h, fill);
    const img = h("image", img_props);
    const pattern = h('pattern', props, [img]);
    if (paint_filter) {
        if (img_props.style) {
            img_props.style.filter = paint_filter.filter;
        } else {
            img_props.style = {
                filter: paint_filter.filter
            }
        }
        if (paint_filter.node.length) {
            const defs = h('defs', paint_filter.node);
            return h('g', [defs, pattern])
        }
    }
    return pattern;
}

handler[ImageScaleMode.Fit] = function (h: Function, frame: ShapeSize, id: string, path: string, fill: Fill): any {
    const url = fill.peekImage(true) || default_url;
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;

    const img_props: any = {
        'xlink:href': url,
        x: 0,
        y: 0,
        'object-fit': "contain",
        'preserveAspectRatio': 'none meet',
    };

    const props: any = {
        width: frame.width + 1,
        height: frame.height + 1,
        x: 0,
        y: 0,
        patternUnits: 'userSpaceOnUse',
        id: id,
    };
    if (fill.rotation && fill.rotation > 0) {
        if (fill.rotation === 90 || fill.rotation === 270) {
            const w = image_w;
            image_w = image_h;
            image_h = w;
        } else {
            img_props.style = transformRotate(fill.rotation, frame);
        }
    }
    const proportion_w = frame.width / image_w;
    const proportion_h = frame.height / image_h;
    if (frame.width > frame.height) {
        img_props.width = frame.width;
        const height = image_h * proportion_w;
        let offset = (frame.height - height) / 2;
        if (offset < 0) {
            delete img_props.width;
            img_props.height = frame.height;
            const width = image_w * proportion_h;
            offset = (frame.width - width) / 2;
            img_props.x = offset;
        } else {
            img_props.y = offset;
        }
    } else {
        img_props.height = frame.height;
        const width = image_w * proportion_h;
        let offset = (frame.width - width) / 2;
        if (offset < 0) {
            delete img_props.height;
            img_props.width = frame.width;
            const height = image_h * proportion_w;
            offset = (frame.height - height) / 2;
            img_props.y = offset;
        } else {
            img_props.x = offset;
        }
    }

    if (fill.rotation && fill.rotation > 0) {
        if (fill.rotation === 90 || fill.rotation === 270) {
            const style: any = {};
            if (img_props.width > 0) {
                img_props.height = img_props.width;
                delete img_props.width;
                if (fill.rotation === 270) {
                    style.transform = `translate(${0}px ,${frame.height - img_props.y}px) rotate(${fill.rotation}deg)`
                } else {
                    style.transform = `translate(${frame.width}px, 0) rotate(${fill.rotation}deg)`;
                    img_props.x = img_props.y;
                }
                img_props.y = 0;
            } else {
                img_props.width = img_props.height;
                delete img_props.height;
                if (fill.rotation === 270) {
                    style.transform = `translate(${(frame.width / 2) - ((image_w * proportion_h) / 2)}px ,${frame.height}px) rotate(${fill.rotation}deg)`
                } else {
                    style.transform = `translate(${frame.width - img_props.x}px, 0) rotate(${fill.rotation}deg)`
                }
                img_props.x = 0;
            }
            img_props.style = style;
        }
    }
    const paint_filter = paintFilter(h, fill);
    const img = h("image", img_props);
    const pattern = h('pattern', props, [img]);
    if (paint_filter) {
        if (img_props.style) {
            img_props.style.filter = paint_filter.filter;
        } else {
            img_props.style = {
                filter: paint_filter.filter
            }
        }
        if (paint_filter.node.length) {
            const defs = h('defs', paint_filter.node);
            return h('g', [defs, pattern])
        }
    }
    return pattern;
}

handler[ImageScaleMode.Stretch] = function (h: Function, frame: ShapeSize, id: string, path: string, fill: Fill): any {
    const url = fill.peekImage(true) || default_url;
    const props: any = {
        'xlink:href': url,
        width: frame.width,
        height: frame.height,
        x: 0,
        y: 0,
        'preserveAspectRatio': 'none meet',
    };
    if (fill.rotation && fill.rotation > 0) {
        if (fill.rotation === 90 || fill.rotation === 270) {
            props.width = frame.height;
            props.height = frame.width;
            props.style = {
                transform: `translate(${fill.rotation === 90 ? frame.width : 0}px, ${fill.rotation === 270 ? frame.height : 0}px) rotate(${fill.rotation}deg)`
            };
        } else {
            props.style = transformRotate(fill.rotation, frame);
        }
    }
    const paint_filter = paintFilter(h, fill);
    const img = h("image", props);
    const pattern = h('pattern', {
        width: frame.width + 1,
        height: frame.height + 1,
        x: 0,
        y: 0,
        patternUnits: 'userSpaceOnUse',
        id: id,
    }, [img]);
    if (paint_filter) {
        if (props.style) {
            props.style.filter = paint_filter.filter;
        } else {
            props.style = {
                filter: paint_filter.filter
            }
        }
        if (paint_filter.node.length) {
            const defs = h('defs', paint_filter.node);
            return h('g', [defs, pattern])
        }
    }
    return pattern;
}

handler[ImageScaleMode.Crop] = function (h: Function, frame: ShapeSize, id: string, path: string, fill: Fill): any {

}

handler[ImageScaleMode.Tile] = function (h: Function, frame: ShapeSize, id: string, path: string, fill: Fill): any {
    let image_w = fill.originalImageWidth || frame.width;
    let image_h = fill.originalImageHeight || frame.height;
    let scale = typeof fill.scale === 'number' ? fill.scale : 0.5;
    const url = fill.peekImage(true) || default_url;
    const maskId = "mask-" + objectId(fill) + randomId();
    const props: any = {
        'xlink:href': url,
        width: image_w * scale,
        height: image_h * scale,
        x: 0,
        y: 0,
        'object-fit': "contain",
        'preserveAspectRatio': 'none meet',
    };
    const pattern_props: any = {
        width: image_w * scale,
        height: image_h * scale,
        x: 0,
        y: 0,
        patternUnits: 'userSpaceOnUse',
        id: id,
    }
    if (fill.rotation && fill.rotation > 0) {
        if (fill.rotation === 90 || fill.rotation === 270) {
            pattern_props.style = {
                transform: `translate(${pattern_props.height / 2}px, ${pattern_props.width / 2}px) rotate(${fill.rotation}deg) translate(${-pattern_props.width / 2}px, ${-pattern_props.height / 2}px)`
            };
        } else {
            pattern_props.style = transformRotate(fill.rotation, {
                width: pattern_props.width,
                height: pattern_props.height
            });
        }
    }
    const paint_filter = paintFilter(h, fill);
    const img = h("image", props);
    const pattern = h('pattern', pattern_props, [img]);
    const mask = h('mask', {
        id: maskId,
        width: image_w * scale,
        height: image_h * scale
    }, [
        h('rect', { width: image_w * scale, height: image_h * scale, fill: "white", 'fill-opacity': "0.5" }),
        h('path', { d: path, fill: "white" }),
    ])
    if (fill.isEditingImage && image_w * scale > frame.width) {
        let style: any = {}
        if (fill.rotation && fill.rotation > 0) {
            if (fill.rotation === 90 || fill.rotation === 270) {
                style = {
                    transform: `translate(${(image_h * scale) / 2}px, ${(image_w * scale) / 2}px) rotate(${fill.rotation}deg) translate(${-(image_w * scale) / 2}px, ${-(image_h * scale) / 2}px)`
                };
            } else {
                style = transformRotate(fill.rotation, { width: image_w * scale, height: image_h * scale });
            }
        }
        const node = [
            pattern, mask, h("image", { ...props, style, opacity: fill.color.alpha, mask: 'url(#' + maskId + ')' })
        ]
        if (paint_filter) {
            if (paint_filter.node.length) {
                const defs = h('defs', paint_filter.node);
                node.unshift(defs);
            }
            props.style = {
                filter: paint_filter.filter
            }
        }
        return h('g', node);
    } else {
        if (paint_filter) {
            props.style = {
                filter: paint_filter.filter
            }
            if (paint_filter.node.length) {
                const defs = h('defs', paint_filter.node);
                return h('g', [defs, pattern])
            }
        }
        return pattern;
    }
}

export function patternRender(h: Function, frame: ShapeSize, id: string, path: string, fill: Fill): any {
    const mode = fill.imageScaleMode as ImageScaleMode || ImageScaleMode.Fill;
    return handler[mode](h, frame, id, path, fill);
}

export function renderMaskPattern(h: Function, path: string, shape: ImageShape, url: string): any {

}

const transformRotate = (rotation: number, frame: { width: number, height: number }) => {
    if (!rotation) return;
    const { width, height } = frame;
    const style: any = {}
    let transform = `translate(${width / 2}px, ${height / 2}px) rotate(${rotation}deg) translate(${-width / 2}px, ${-height / 2}px)`
    style.transform = transform;
    return style;
}

const paintFilter = (h: Function, fill: Fill) => {
    let filters: any = [];
    let filter = ''
    const paintFilter = fill.paintFilter;
    if (!paintFilter) return;
    if (paintFilter.exposure) {
        const exposure = (paintFilter.exposure / 200);
        const filterId = "exposureFilter-" + objectId(fill) + randomId();
        const fe_func = {
            type: 'linear',
            slope: '1',
            intercept: exposure
        }
        const feComponentTransfer = h('feComponentTransfer', [
            h('feFuncR', fe_func),
            h('feFuncG', fe_func),
            h('feFuncB', fe_func),
        ])
        const filter_node = h('filter', { id: filterId }, [feComponentTransfer]);
        filters.push(filter_node);
        filter += `url(#${filterId}) `
    }
    if (paintFilter.contrast) {
        const contrast = 1 + (paintFilter.contrast / 200);
        filter += `contrast(${contrast}) `
    }
    if (paintFilter.saturation) {
        const saturation = 1 + (paintFilter.saturation / 100);
        const fe_color_matrix = {
            type: 'saturate',
            values: saturation
        }
        const feColorMatrix = h('feColorMatrix', fe_color_matrix);
        const filterId = "shadowFilter-" + objectId(fill) + randomId();
        const filter_node = h('filter', { id: filterId }, [feColorMatrix]);
        filters.push(filter_node);
        filter += `url(#${filterId}) `
    }
    if (paintFilter.temperature) {
        let redMultiplier = 1
        let blueMultiplier = 1
        if (paintFilter.temperature < 0) {
            redMultiplier = 1 + (paintFilter.temperature / 200);
            blueMultiplier = 1 - (paintFilter.temperature / 25);
        } else {
            redMultiplier = 1 + (paintFilter.temperature / 200);
            blueMultiplier = 1 - (paintFilter.temperature / 100);
        }
        const fe_color_matrix = {
            type: 'matrix',
            values: `${redMultiplier} 0 0 0 0
                     0 1 0 0 0
                     0 0 ${blueMultiplier} 0 0
                     0 0 0 1 0`
        }
        const feColorMatrix = h('feColorMatrix', fe_color_matrix);
        const filterId = "shadowFilter-" + objectId(fill) + randomId();
        const filter_node = h('filter', { id: filterId }, [feColorMatrix]);
        filters.push(filter_node);
        filter += `url(#${filterId}) `
    }
    if (paintFilter.tint) {
        let redMultiplier = 1
        let greenMultiplier = 1
        if (paintFilter.tint < 0) {
            redMultiplier = 1 + (paintFilter.tint / 200);
            greenMultiplier = 1 - (paintFilter.tint / 200);
        } else {
            redMultiplier = 1 + (paintFilter.tint / 200);
            greenMultiplier = 1 - (paintFilter.tint / 200);
        }
        const filterId = "shadowFilter-" + objectId(fill) + randomId();
        const fe_color_matrix = {
            type: 'matrix',
            values: `${redMultiplier} 0 0 0 0
                     0 ${greenMultiplier} 0 0 0
                     0 0 1 0 0
                     0 0 0 1 0`
        }
        const feColorMatrix = h('feColorMatrix', fe_color_matrix);
        const filter_node = h('filter', { id: filterId }, [feColorMatrix]);
        filters.push(filter_node);
        filter += `url(#${filterId}) `
    }
    if (paintFilter.shadow) {
        const shadow = (paintFilter.shadow / 1000);
        const filterId = "shadowFilter-" + objectId(fill) + randomId();
        const fe_func = {
            type: 'linear',
            slope: '1',
            intercept: shadow
        }
        const feComponentTransfer = h('feComponentTransfer', [
            h('feFuncR', fe_func),
            h('feFuncG', fe_func),
            h('feFuncB', fe_func),
        ])
        const filter_node = h('filter', { id: filterId }, [feComponentTransfer]);
        filters.push(filter_node);
        filter += `url(#${filterId}) `
    }
    if (paintFilter.hue) {
        const filterId = "hueFilter-" + objectId(fill) + randomId();
        const fe_color_matrix = {
            type: 'hueRotate',
            values: paintFilter.hue
        }
        const feColorMatrix = h('feColorMatrix', fe_color_matrix);
        const filter_node = h('filter', { id: filterId }, [feColorMatrix]);
        filters.push(filter_node);
        filter += `url(#${filterId}) `
    }
    if (!filter.length) return;
    return { node: filters, filter: filter }
}