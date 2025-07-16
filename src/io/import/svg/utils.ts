/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ColVector3D, Matrix } from "../../../basic/matrix2";
import { Color, Shadow, } from "../../../data"
import { BaseCreator } from "./creator/base"
import { Line, LineThrough0, Transform } from "../../../basic/transform";
import { NumberArray2D } from "../../../basic/number_array";
import { Path } from "@kcaitech/path";

type RectBox = { // 矩形包围盒
    lt: { x: number, y: number }, // 左上角坐标
    rb: { x: number, y: number }, // 右下角坐标
    w: number, // 宽
    h: number, // 高
}

export function getRectBox(x: number, y: number, w: number, h: number, transform: Transform): RectBox { // 获取一个矩形的包围盒
    if (!transform.hasRotation()) return {
        lt: { x: x, y: y },
        rb: { x: x + w, y: y + h },
        w: w,
        h: h,
    };
    transform = transform.makeFromRotateMatrix()
    // 矩形中心为原点的情况下，矩形的四个顶点坐标
    const points = [
        new ColVector3D([-w / 2, -h / 2, 0]), // 左上
        new ColVector3D([w / 2, -h / 2, 0]), // 右上
        new ColVector3D([w / 2, h / 2, 0]), // 右下
        new ColVector3D([-w / 2, h / 2, 0]), // 左下
    ]
    // 变换后的四个顶点坐标
    const newPoints = transform.transform(points)
    // 右下角坐标
    const maxX = Math.max(...newPoints.data.row(0))
    const maxY = Math.max(...newPoints.data.row(1))
    // 从中心点平移回原点
    return {
        lt: { x: -maxX + w / 2 + x, y: -maxY + h / 2 + y },
        rb: { x: maxX + w / 2 + x, y: maxY + h / 2 + y },
        w: maxX * 2,
        h: maxY * 2,
    }
}

export function mergeRectBox(...rectBoxes: RectBox[]): RectBox { // 合并多个矩形包围盒
    const ltX = Math.min(...rectBoxes.map(item => item.lt.x))
    const ltY = Math.min(...rectBoxes.map(item => item.lt.y))
    const rbX = Math.max(...rectBoxes.map(item => item.rb.x))
    const rbY = Math.max(...rectBoxes.map(item => item.rb.y))
    return {
        lt: { x: ltX, y: ltY },
        rb: { x: rbX, y: rbY },
        w: rbX - ltX,
        h: rbY - ltY,
    }
}

type FunctionCall = [
    string, // 函数名
    string, // 参数
]

// 获取所有函数调用。获取所有xxx(...)格式的匹配项，返回函数名和括号内的参数
export function getAllFunctionCallFromString(content: string): FunctionCall[] {
    const regexp = /(\w+)\(([^)]+)\)/g
    const result: [string, string][] = []
    for (; ;) {
        const match = regexp.exec(content)
        if (!match) break;
        result.push([match[1], match[2]])
    }
    return result.reverse()
}

// 获取style属性中的所有key:value
export function getAllStyleFromString(content: string) {
    const result: { [key: string]: string } = {}
    const items = content.split(";")
    for (const item of items) {
        const [key, value] = item.split(":").map(item => item.trim())
        if (key && value) result[key] = value
    }
    return result
}

export function parseTransform(transformContent: string, size?: { width: number, height: number }) {
    const functionCalls = getAllFunctionCallFromString(transformContent)
    const transform = new Transform()
    for (const [name, args] of functionCalls) {
        const argList = args.split(/,|\s+/).filter(arg => arg && arg.trim()) // 分隔符为逗号或空格
        const numArgList = argList.map((value, i) => {
            if (value.includes("deg")) return parseFloat(value.replace("deg", "")) * Math.PI / 180;
            else if (value.includes("rad")) return parseFloat(value.replace("rad", ""));
            else if (value.includes("grad")) return parseFloat(value.replace("grad", "")) * Math.PI / 200;
            else if (value.includes("turn")) return parseFloat(value.replace("turn", "")) * Math.PI * 2;
            else {
                if (name.startsWith("rotate") && !(name === "rotate" && i > 0) && !(name === "rotate3d" && i < 3)) {
                    return parseFloat(value.replace("deg", "")) * Math.PI / 180
                } else {
                    return parseFloat(value)
                }
            }
        })

        if (name === "matrix") {
            const matrix = new Matrix(new NumberArray2D([4, 4], [
                numArgList[0], numArgList[2], 0, numArgList[4],
                numArgList[1], numArgList[3], 0, numArgList[5],
                0, 0, 1, 0,
                0, 0, 0, 1,
            ], true) as any);
            transform.addTransform(new Transform({ matrix: matrix as any }))
        } else if (name.startsWith("rotate")) {
            if (name === "rotate") {
                if (numArgList.length === 1) {
                    // if (size) {
                    //     transform.rotateAt({
                    //         axis: Line.FromParallelZ(ColVector3D.FromXYZ(size.width / 2, size.height / 2, 0)),
                    //         angle: numArgList[0]
                    //     })
                    // } else {
                    //     transform.rotateZ({angle: numArgList[0]});
                    // }
                    transform.rotateZ({angle: numArgList[0]});
                } else if (numArgList.length === 3) {
                    transform.rotateAt({
                        axis: new Line(ColVector3D.FromXYZ(0, 0, 1), ColVector3D.FromXYZ(numArgList[0], numArgList[1], 0)),
                        angle: numArgList[0],
                    })
                }
            } else if (name === "rotateX") {
                transform.rotateX({ angle: numArgList[0] })
            } else if (name === "rotateY") {
                transform.rotateY({ angle: numArgList[0] })
            } else if (name === "rotateZ") {
                transform.rotateZ({ angle: numArgList[0] })
            } else if (name === "rotate3d") {
                transform.rotate({
                    axis: new LineThrough0(ColVector3D.FromXYZ(numArgList[0], numArgList[1], numArgList[2])),
                    angle: numArgList[3],
                })
            }
        } else if (name === "scale") {
            transform.scale({vector: new ColVector3D([numArgList[0], numArgList[1], numArgList[2] ?? 1])})
        } else if (name === "translate") {
            transform.translate(new ColVector3D([numArgList[0], numArgList[1] ?? numArgList[0], numArgList[2] ?? 0]))
        } else {
            console.log("不支持的变换函数", name, args)
        }
        // dev code
        // const res = transform.decompose()
        // console.log("after", name, args)
        // console.log("translate", res.translate.toString())
        // console.log("rotate", res.rotate.toString())
        // console.log("skew", res.skew.toString())
        // console.log("scale", res.scale.toString())
    }
    return transform
}

export type MyColor = {
    r: number,
    g: number,
    b: number,
    a: number,
}

function myColorToString(color: MyColor) {
    return `rgba(${color.r},${color.g},${color.b},${color.a})`
}

export function myColorToColor(color: MyColor | undefined) {
    if (!color) return new Color(1, 0, 0, 0);
    return new Color(color.a, color.r, color.g, color.b)
}

export type GradientStop = {
    offset: number,
    color: MyColor,
    opacity: number,
}
export type LinearGradient = {
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    opacity: number,
    stops: GradientStop[],
}
export type RadialGradient = {
    cx: number,
    cy: number,
    r: number,
    opacity: number,
    transform: Transform,
    stops: GradientStop[],
    scales: number[],
}
// https://developer.mozilla.org/zh-CN/docs/Web/CSS/named-color
const namedColorMap: Record<string, string> = {
    "black": "#000000",
    "silver": "#c0c0c0",
    "gray": "#808080",
    "white": "#ffffff",
    "maroon": "#800000",
    "red": "#ff0000",
    "purple": "#800080",
    "fuchsia": "#ff00ff",
    "green": "#008000",
    "lime": "#00ff00",
    "olive": "#808000",
    "yellow": "#ffff00",
    "navy": "#000080",
    "blue": "#0000ff",
    "teal": "#008080",
    "aqua": "#00ffff",
    "aliceblue": "#f0f8ff",
    "antiquewhite": "#faebd7",
    "aquamarine": "#7fffd4",
    "azure": "#f0ffff",
    "beige": "#f5f5dc",
    "bisque": "#ffe4c4",
    "blanchedalmond": "#ffebcd",
    "blueviolet": "#8a2be2",
    "brown": "#a52a2a",
    "burlywood": "#deb887",
    "cadetblue": "#5f9ea0",
    "chartreuse": "#7fff00",
    "chocolate": "#d2691e",
    "coral": "#ff7f50",
    "cornflowerblue": "#6495ed",
    "cornsilk": "#fff8dc",
    "crimson": "#dc143c",
    "cyan": "#00ffff",
    "darkblue": "#00008b",
    "darkcyan": "#008b8b",
    "darkgoldenrod": "#b8860b",
    "darkgray": "#a9a9a9",
    "darkgreen": "#006400",
    "darkgrey": "#a9a9a9",
    "darkkhaki": "#bdb76b",
    "darkmagenta": "#8b008b",
    "darkolivegreen": "#556b2f",
    "darkorange": "#ff8c00",
    "darkorchid": "#9932cc",
    "darkred": "#8b0000",
    "darksalmon": "#e9967a",
    "darkseagreen": "#8fbc8f",
    "darkslateblue": "#483d8b",
    "darkslategray": "#2f4f4f",
    "darkslategrey": "#2f4f4f",
    "darkturquoise": "#00ced1",
    "darkviolet": "#9400d3",
    "deeppink": "#ff1493",
    "deepskyblue": "#00bfff",
    "dimgray": "#696969",
    "dimgrey": "#696969",
    "dodgerblue": "#1e90ff",
    "firebrick": "#b22222",
    "floralwhite": "#fffaf0",
    "forestgreen": "#228b22",
    "gainsboro": "#dcdcdc",
    "ghostwhite": "#f8f8ff",
    "gold": "#ffd700",
    "goldenrod": "#daa520",
    "greenyellow": "#adff2f",
    "grey": "#808080",
    "honeydew": "#f0fff0",
    "hotpink": "#ff69b4",
    "indianred": "#cd5c5c",
    "indigo": "#4b0082",
    "ivory": "#fffff0",
    "khaki": "#f0e68c",
    "lavender": "#e6e6fa",
    "lavenderblush": "#fff0f5",
    "lawngreen": "#7cfc00",
    "lemonchiffon": "#fffacd",
    "lightblue": "#add8e6",
    "lightcoral": "#f08080",
    "lightcyan": "#e0ffff",
    "lightgoldenrodyellow": "#fafad2",
    "lightgray": "#d3d3d3",
    "lightgreen": "#90ee90",
    "lightgrey": "#d3d3d3",
    "lightpink": "#ffb6c1",
    "lightsalmon": "#ffa07a",
    "lightseagreen": "#20b2aa",
    "lightskyblue": "#87cefa",
    "lightslategray": "#778899",
    "lightslategrey": "#778899",
    "lightsteelblue": "#b0c4de",
    "lightyellow": "#ffffe0",
    "limegreen": "#32cd32",
    "linen": "#faf0e6",
    "magenta": "#ff00ff",
    "mediumaquamarine": "#66cdaa",
    "mediumblue": "#0000cd",
    "mediumorchid": "#ba55d3",
    "mediumpurple": "#9370db",
    "mediumseagreen": "#3cb371",
    "mediumslateblue": "#7b68ee",
    "mediumspringgreen": "#00fa9a",
    "mediumturquoise": "#48d1cc",
    "mediumvioletred": "#c71585",
    "midnightblue": "#191970",
    "mintcream": "#f5fffa",
    "mistyrose": "#ffe4e1",
    "moccasin": "#ffe4b5",
    "navajowhite": "#ffdead",
    "oldlace": "#fdf5e6",
    "olivedrab": "#6b8e23",
    "orange": "#ffa500",
    "orangered": "#ff4500",
    "orchid": "#da70d6",
    "palegoldenrod": "#eee8aa",
    "palegreen": "#98fb98",
    "paleturquoise": "#afeeee",
    "palevioletred": "#db7093",
    "papayawhip": "#ffefd5",
    "peachpuff": "#ffdab9",
    "peru": "#cd853f",
    "pink": "#ffc0cb",
    "plum": "#dda0dd",
    "powderblue": "#b0e0e6",
    "rebeccapurple": "#663399",
    "rosybrown": "#bc8f8f",
    "royalblue": "#4169e1",
    "saddlebrown": "#8b4513",
    "salmon": "#fa8072",
    "sandybrown": "#f4a460",
    "seagreen": "#2e8b57",
    "seashell": "#fff5ee",
    "sienna": "#a0522d",
    "skyblue": "#87ceeb",
    "slateblue": "#6a5acd",
    "slategray": "#708090",
    "slategrey": "#708090",
    "snow": "#fffafa",
    "springgreen": "#00ff7f",
    "steelblue": "#4682b4",
    "tan": "#d2b48c",
    "thistle": "#d8bfd8",
    "tomato": "#ff6347",
    "transparent": "#00000000",
    "turquoise": "#40e0d0",
    "violet": "#ee82ee",
    "wheat": "#f5deb3",
    "whitesmoke": "#f5f5f5",
    "yellowgreen": "#9acd32",
}

export function parseColor(content: string): MyColor | undefined {
    if (content in namedColorMap) content = namedColorMap[content];
    let color
    if (content.startsWith("rgba")) {
        const rgba = content.slice(5, -1).split(/,|\s+/).filter(arg => arg && arg.trim()).map(item => parseFloat(item))
        color = {
            r: rgba[0],
            g: rgba[1],
            b: rgba[2],
            a: rgba[3],
        }
    } else if (content.startsWith("rgb")) {
        const rgb = content.slice(4, -1).split(/,|\s+/).filter(arg => arg && arg.trim()).map(item => parseFloat(item))
        color = {
            r: rgb[0],
            g: rgb[1],
            b: rgb[2],
            a: 1,
        }
    } else if (content.startsWith("#")) {
        let hex = content.slice(1)
        let r, g, b, a
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16)
            g = parseInt(hex[1] + hex[1], 16)
            b = parseInt(hex[2] + hex[2], 16)
            a = 1
        } else if (hex.length === 4) {
            r = parseInt(hex[0] + hex[0], 16)
            g = parseInt(hex[1] + hex[1], 16)
            b = parseInt(hex[2] + hex[2], 16)
            a = parseInt(hex[3] + hex[3], 16) / 255
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16)
            g = parseInt(hex.substring(2, 4), 16)
            b = parseInt(hex.substring(4, 6), 16)
            a = 1
        } else if (hex.length === 8) {
            r = parseInt(hex.substring(0, 2), 16)
            g = parseInt(hex.substring(2, 4), 16)
            b = parseInt(hex.substring(4, 6), 16)
            a = parseInt(hex.substring(6, 8), 16) / 255
        } else {
            console.log("无效的颜色格式", content)
            return
        }
        color = {
            r: r,
            g: g,
            b: b,
            a: a,
        }
    } else if (content === "none") {

    } else {
        console.log("不支持的颜色格式", content)
    }

    return color
}

export type FillColor = {
    colorType: "color" | "linearGradient" | "radialGradient", // 纯色、线性渐变、径向渐变
    color?: MyColor,
    linearGradient?: LinearGradient,
    radialGradient?: RadialGradient,
}
export type MyShadow = { // 阴影
    type: "inner" | "outer", // 类型：内阴影、外阴影
    offsetX: number,
    offsetY: number,
    blur: number, // 模糊
    spread: number, // 扩散
    color: MyColor,
}
export type Attributes = { // 保存元素的一些属性
    style?: string,
    styleAttributes?: Record<string, string>,

    x?: number,
    y?: number,
    width?: number,
    height?: number,

    transform?: string,
    styleTransform?: string,

    opacity?: number,
    fill?: FillColor | null,
    textFill?: FillColor | null,
    stroke?: FillColor & {
        width?: number,
        dashArray: number[], // 虚线的length、gap参数，实线则为[0, 0]
        position: "inside" | "center" | "outside", // 位置：内部、中心、外部
    },
    strokeWidth?: number,
    shadow?: Shadow,

    // 椭圆
    cx?: number,
    cy?: number,
    rx?: number,
    ry?: number,

    // 直线
    x1?: number,
    y1?: number,
    x2?: number,
    y2?: number,

    // 图片
    href?: string,

    // path
    d?: string,
    pathX?: number,
    pathY?: number,

    // polyline
    pointsToPathD?: string,
    polylineX?: number,
    polylineY?: number,

    useTargetCreator?: BaseCreator,
}

export function getPathBoxFromD(d: string) {
    const path = new Path(d)
    const bbox = path.bbox()
    return {
        x: bbox.x,
        y: bbox.y,
        width: bbox.w,
        height: bbox.h
    }
}
