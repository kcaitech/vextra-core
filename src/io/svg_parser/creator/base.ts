/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { v4 as uuid } from "uuid"
import {
    Attributes,
    FillColor,
    getAllFunctionCallFromString,
    getAllStyleFromString,
    getPathBoxFromD,
    GradientStop,
    LinearGradient,
    MyColor,
    myColorToColor,
    MyShadow,
    parseColor,
    parseTransform,
    RadialGradient
} from "../utils"
import { BaseTreeNode, TreeNodeTraverseHandler } from "../tree"
import {
    Artboard, BasicArray, BlendMode, Border,
    BorderPosition, BorderSideSetting,
    BorderStyle, ContextSettings, CornerType, Fill, FillRule,
    FillType, Gradient, GradientType, Point2D, ResourceMgr,
    Shadow, Shape, ShapeFrame, SideType, Stop, Style,
    StyleMangerMember
} from "../../../data"
import { Transform } from "../../../basic/transform"
import * as shapeCreator from "../../../editor/creator/creator"
import { ColVector3D, Matrix } from "../../../basic/matrix2"
import { Transform as ShapeTransform } from "../../../data"

export function castTransform(transform: ShapeTransform): Transform {
    return new Transform({
        matrix: new Matrix([4, 4], [
            transform.m00, transform.m01, 0, transform.m02,
            transform.m10, transform.m11, 0, transform.m12,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ], true),
    });
}

export function assignTransform(transform: ShapeTransform, transform2: Transform) {
    transform.m00 = transform2.m00;
    transform.m10 = transform2.m10;
    transform.m01 = transform2.m01;
    transform.m11 = transform2.m11;
    transform.m02 = transform2.m03;
    transform.m12 = transform2.m13;
}

export type ContextType = {
    styleMgr: ResourceMgr<StyleMangerMember>
    mediaResourceMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>
    styleMap: { [key: string]: string }
    [key: string]: any
}

export class BaseCreator extends BaseTreeNode {
    context: any
    root: BaseCreator | undefined
    parent: BaseCreator | undefined
    children: BaseCreator[] = []

    htmlElement?: {
        root: Element,
        node: Element,
        tagName: string,
    }

    localAttributes: Record<string, string> = {}
    isLocalAttributesParsed = false
    attributes: Attributes = {}
    transform = new Transform()

    shape: Shape | undefined = undefined
    style?: Style

    constructor(context: ContextType, root: BaseCreator | undefined, parent: BaseCreator | undefined, htmlElement?: {
        root: Element,
        node: Element,
    }) {
        super()

        this.context = context
        this.root = root
        this.parent = parent

        if (htmlElement) {
            this.htmlElement = {
                ...htmlElement,
                tagName: htmlElement.node.tagName,
            }
        }
    }

    static method(handlerName: keyof BaseCreator) {
        return function (creator: BaseCreator) {
            creator[handlerName]()
        } as TreeNodeTraverseHandler
    }

    getShapeNumberName(name: string) {
        let shapeNameCountMap = this.context.shapeNameCountMap
        if (Object.prototype.toString.call(shapeNameCountMap) !== "[object Object]") {
            shapeNameCountMap = this.context.shapeNameCountMap = {}
        }
        if (!(name in shapeNameCountMap)) shapeNameCountMap[name] = 0;
        const number = ++shapeNameCountMap[name]
        return `${name} ${number > 1 ? number : ""}`
    }

    /**
     * 调整节点
     * adjust() // 调整节点
     * afterChildrenAdjust() // 所有子节点adjust之后
     * afterSiblingAdjust() // 所有兄弟节点adjust之后
     * afterAllAdjust() // 所有节点adjust之后
     *
     * 创建shape
     * createShape() // 创建shape
     * afterChildrenCreateShape() // 所有子节点创建shape之后
     * afterSiblingCreateShape() // 所有兄弟节点创建shape之后
     * afterAllCreateShape() // 所有节点创建shape之后
     */

    adjust() {

    }

    afterChildrenAdjust() {

    }

    afterSiblingAdjust() {

    }

    afterAllAdjust() {

    }

    createShape() {

    }

    _createShape() {
        this.createShape()
        this.updateShapeAttr()
    }

    afterChildrenCreateShape() {

    }

    afterSiblingCreateShape() {

    }

    afterAllCreateShape() {
        if (!this.shape) return;
        this.shape.name = this.getShapeNumberName(this.localAttributes.id || this.shape.name)
    }

    parseAttributes() {
        if (!this.htmlElement) return;

        const svgRoot = this.htmlElement?.root
        if (!svgRoot) return;

        if (this.isLocalAttributesParsed) return;
        this.isLocalAttributesParsed = true

        const attributes = this.htmlElement.node.attributes
        for (const attribute of attributes) this.localAttributes[attribute.name] = attribute.value;

        // css样式属性
        const style = this.localAttributes["style"]
        if (style) {
            this.attributes.style = style
            this.attributes.styleAttributes = getAllStyleFromString(style)
        }
        const styleMap = this.context['styleMap']
        let classSelector = this.localAttributes["class"]
        if (classSelector) classSelector = '.' + classSelector;
        let idSelector = this.localAttributes["id"]
        if (idSelector) idSelector = '#' + idSelector;
        for (const styleSelector of [classSelector, idSelector]) {
            if (!styleSelector) continue;
            const styleContent = styleMap[styleSelector]
            if (!styleContent) continue;
            if (style) {
                if (!this.attributes.style!.endsWith(';')) this.attributes.style += ';';
                this.attributes.style += styleContent
                this.attributes.styleAttributes = {
                    ...this.attributes.styleAttributes,
                    ...getAllStyleFromString(styleContent),
                }
            } else {
                this.attributes.style = styleContent
                this.attributes.styleAttributes = getAllStyleFromString(styleContent)
            }
        }
        if (this.attributes.styleAttributes && "transform" in this.attributes.styleAttributes) {
            this.attributes.styleTransform = this.attributes.styleAttributes.transform
        }

        // x、y
        const x = this.localAttributes["x"]
        if (x) this.attributes.x = parseFloat(x);
        const y = this.localAttributes["y"]
        if (y) this.attributes.y = parseFloat(y);
        // width、height
        const width = this.localAttributes["width"]
        if (width) this.attributes.width = parseFloat(width);
        const height = this.localAttributes["height"]
        if (height) this.attributes.height = parseFloat(height);

        // viewBox
        if (this.htmlElement.tagName === "svg") {
            const viewBox = this.localAttributes["viewBox"]
            if (viewBox) {
                const viewBoxSplitRes = viewBox.split(/,|\s+/).filter(arg => arg && arg.trim()).map(item => parseFloat(item))
                this.attributes.width = viewBoxSplitRes[2]
                this.attributes.height = viewBoxSplitRes[3]
            }
        }

        // path
        const d = this.localAttributes["d"]
        const isPath = this.htmlElement.tagName === "path"
        if (d) {
            this.attributes.d = d
            const { x, y, width, height } = getPathBoxFromD(d)
            this.attributes.pathX = x
            this.attributes.pathY = y
            if (isPath) {
                this.attributes.width = width
                this.attributes.height = height
            }
        }

        // polyline
        const points = this.localAttributes["points"]
        const isPolyline = this.htmlElement.tagName === "polyline" || this.htmlElement.tagName === "polygon"
        const pointsToPathD = shapeCreator.polylinePointsToPathD(points, this.htmlElement.tagName === "polyline")
        if (pointsToPathD) {
            this.attributes.pointsToPathD = pointsToPathD
            const { x, y, width, height } = getPathBoxFromD(pointsToPathD)
            this.attributes.polylineX = x
            this.attributes.polylineY = y
            if (isPolyline) {
                this.attributes.width = width
                this.attributes.height = height
            }
        }

        // transform
        let transform
        if (this.attributes.styleTransform) transform = this.attributes.styleTransform;
        if (!transform) {
            this.attributes.transform = this.localAttributes["transform"] ?? undefined
            transform = this.attributes.transform
        }
        if (transform) this.transform.addTransform(parseTransform(transform, { width: this.attributes.width ?? 0, height: this.attributes.height ?? 0 }));

        // opacity
        const opacity = this.localAttributes["opacity"]
        if (opacity) this.attributes.opacity = parseFloat(opacity);

        // 解析fill、stroke
        const parseFillColor = (content: string | undefined, fillOpacity: number = 1): FillColor | undefined | null => {
            if (!content) return;

            let colorType: "color" | "linearGradient" | "radialGradient" | undefined
            let color: MyColor | undefined
            let linearGradient: LinearGradient | undefined
            let radialGradient: RadialGradient | undefined

            if (content.startsWith("url(#")) {
                const urlId = content.slice(5, -1)
                const el = svgRoot.querySelector(`#${urlId}`)
                if (el) {
                    const creator = (el as any).creator as BaseCreator
                    creator.parseAttributes()
                    const stops: GradientStop[] = creator.children.filter(child => child.htmlElement?.tagName === "stop").map(child => {
                        child.parseAttributes()
                        const attrs = child.localAttributes
                        let offset = 0
                        if (attrs["offset"]) {
                            if (attrs["offset"].includes("%")) offset = parseFloat(attrs["offset"].replace("%", "")) / 100;
                            else offset = parseFloat(attrs["offset"]);
                        }
                        const stopColor = parseColor(attrs["stop-color"] || "black")!
                        const stopOpacity = parseFloat(attrs["stop-opacity"] || "1")
                        return {
                            offset: offset,
                            color: stopColor,
                            opacity: stopOpacity,
                        }
                    })
                    if (creator.htmlElement?.tagName === "linearGradient") {
                        let x1: string | number = creator.localAttributes["x1"] || "0"
                        x1 = x1.includes("%") ? parseFloat(x1.replace("%", "")) / 100 : parseFloat(x1)

                        let y1: string | number = creator.localAttributes["y1"] || "0"
                        y1 = y1.includes("%") ? parseFloat(y1.replace("%", "")) / 100 : parseFloat(y1);

                        let x2: string | number = creator.localAttributes["x2"] || "1"
                        x2 = x2.includes("%") ? parseFloat(x2.replace("%", "")) / 100 : parseFloat(x2);

                        let y2: string | number = creator.localAttributes["y2"] || "0"
                        y2 = y2.includes("%") ? parseFloat(y2.replace("%", "")) / 100 : parseFloat(y2);

                        const parentX = parseFloat(this.localAttributes["x"] || "0")
                        const parentY = parseFloat(this.localAttributes["y"] || "0")

                        linearGradient = {
                            x1: x1 - parentX,
                            y1: y1 - parentY,
                            x2: x2 - parentX,
                            y2: y2 - parentY,
                            opacity: this.attributes.opacity || 1,
                            stops: stops,
                        }
                        colorType = "linearGradient"

                    } else if (creator.htmlElement?.tagName === "radialGradient") {
                        const cx = parseFloat(creator.localAttributes["cx"] || "0")
                        const cy = parseFloat(creator.localAttributes["cy"] || "0")
                        const r = parseFloat(creator.localAttributes["r"] || "1")
                        const transform = new Transform()
                        if (creator.localAttributes["gradientTransform"]) transform.addTransform(parseTransform(creator.localAttributes["gradientTransform"]));
                        const scaleArgs = getAllFunctionCallFromString(creator.localAttributes["gradientTransform"]).find(item => item[0] === "scale")?.[1].split(/,|\s+/).filter(arg => arg && arg.trim())
                        radialGradient = {
                            cx: cx,
                            cy: cy,
                            r: r,
                            opacity: this.attributes.opacity || 1,
                            transform: transform,
                            stops: stops,
                            scales: scaleArgs ? scaleArgs.map(arg => parseFloat(arg)) : [1, 1],
                        }
                        colorType = "radialGradient"
                    }
                }
            } else if (content === "none") {
                return null
            } else { // 纯色
                color = parseColor(content)
                if (color) {
                    color.a *= fillOpacity
                    colorType = "color"
                }
            }

            return colorType && {
                colorType: colorType,
                color: color,
                linearGradient: linearGradient,
                radialGradient: radialGradient,
            }
        }

        // fill
        let fill
        if (this.attributes.styleAttributes && "fill" in this.attributes.styleAttributes) {
            fill = this.attributes.styleAttributes.fill
        }
        if (!fill) fill = this.localAttributes["fill"];

        const fillAttrName = this.htmlElement?.tagName === "text" ? "textFill" : "fill"
        if (!fill && this.attributes[fillAttrName] === undefined
            && this.htmlElement?.tagName !== "svg" && this.htmlElement?.tagName !== "g"
        ) {
            // 寻找祖先元素的fill
            let node = this.htmlElement.node.parentElement
            while (node) {
                fill = ((node as any).creator as BaseCreator).localAttributes[fillAttrName]
                if (fill) break;
                node = node.parentElement
            }
            if (!fill) fill = "black";
        }

        const fillOpacity = parseFloat(this.localAttributes["fill-opacity"]) || 1
        let fillColor = parseFillColor(fill, fillOpacity)
        // dev code
        // if (this.localAttributes["id"] === "路径-14") {
        //     console.log(fillColor)
        // }

        let fillAttrValue
        if (fillColor) {
            fillAttrValue = {
                colorType: fillColor.colorType,
                linearGradient: fillColor.linearGradient,
                radialGradient: fillColor.radialGradient,
                color: fillColor.color,
            }
        } else {
            fillAttrValue = fillColor
        }

        // svg、g元素没有填充，而是继承给子元素
        if (this.htmlElement?.tagName === "svg" || this.htmlElement?.tagName === "g") {
            for (const child of this.children) {
                child.attributes[fillAttrName] = fillAttrValue
            }
        } else if (fillColor !== undefined) {
            this.attributes[fillAttrName] = fillAttrValue
        }

        // stroke
        let stroke
        if (this.attributes.styleAttributes && "stroke" in this.attributes.styleAttributes) {
            stroke = this.attributes.styleAttributes.stroke
        }
        if (!stroke) stroke = this.localAttributes["stroke"];
        const dashArray: number[] = this.localAttributes["stroke-dasharray"]?.split(/,|\s+/).filter(arg => arg && arg.trim()).map(item => parseFloat(item)) || [0, 0]
        if (stroke) {
            const strokeColor = parseFillColor(stroke, 1)
            const strokeOpacity = parseFloat(this.localAttributes["stroke-opacity"] || "1")
            if (strokeColor) {
                if (strokeColor.color) strokeColor.color.a *= strokeOpacity;
                this.attributes.stroke = {
                    colorType: strokeColor.colorType,
                    linearGradient: strokeColor.linearGradient,
                    radialGradient: strokeColor.radialGradient,
                    color: strokeColor.color,
                    dashArray: dashArray,
                    position: "center",
                }
            }
        }
        // stroke-width
        let strokeWidth
        if (this.attributes.styleAttributes && "stroke-width" in this.attributes.styleAttributes) {
            strokeWidth = this.attributes.styleAttributes['stroke-width']
        }
        if (!strokeWidth) strokeWidth = this.localAttributes["stroke-width"];
        if (strokeWidth) {
            this.attributes.strokeWidth = parseFloat(strokeWidth)
            if (this.attributes.stroke) this.attributes.stroke.width = this.attributes.strokeWidth;
        }

        // 解析阴影（通过filter）
        const parseShadow = (content: string): MyShadow | undefined => {
            if (!content.startsWith("url(#")) return;
            const urlId = content.slice(5, -1)
            const el = svgRoot.querySelector(`#${urlId}`)
            if (!el) return;
            const creator = (el as any).creator as BaseCreator
            creator.parseAttributes()
            for (const child of creator.children) child.parseAttributes();

            const x = creator.localAttributes["x"] || ""
            const y = creator.localAttributes["y"] || ""
            const width = creator.localAttributes["width"] || ""
            const height = creator.localAttributes["height"] || ""
            const shadowType = (x + y + width + height).includes("%") ? "inner" : "outer"

            let color
            for (const child of creator.children) {
                if (child.htmlElement?.tagName === "feColorMatrix" && !("in" in child.localAttributes) && child.localAttributes["values"]) {
                    const values = child.localAttributes["values"].split(/,|\s+/).filter(arg => arg && arg.trim())
                    if (values.length !== 20) continue;
                    color = {
                        r: (parseFloat(values[4]) || 0) * 255,
                        g: (parseFloat(values[9]) || 0) * 255,
                        b: (parseFloat(values[14]) || 0) * 255,
                        a: (parseFloat(values[18]) || 1),
                    }
                    break
                }
                if (child.htmlElement?.tagName === "feFlood" && ("flood-color" in child.localAttributes)) {
                    color = parseColor(child.localAttributes["flood-color"])
                    break
                }
            }
            if (!color) return;

            let offsetX = 0
            let offsetY = 0
            let blur = 0
            let spread = 0
            for (const child of creator.children) {
                if (child.htmlElement?.tagName === "feOffset") {
                    offsetX = parseFloat(child.localAttributes["dx"] || "0")
                    offsetY = parseFloat(child.localAttributes["dy"] || "0")
                }
                if (child.htmlElement?.tagName === "feGaussianBlur") {
                    blur = parseFloat(child.localAttributes["stdDeviation"] || "0") * 2
                }
                if (child.htmlElement?.tagName === "feMorphology") {
                    spread = parseFloat(child.localAttributes["radius"] || "0")
                }
            }

            const w = this.attributes.width || 1
            const scale = this.transform.decomposeScale()
            if (scale.x !== 1 || scale.y !== 1) {
                // 按现有算法逆推，详见kcdesign-data/src/render/shadow.ts:shadowOri[ShadowPosition.Outer]
                spread = 10000 * (scale.x - 1) * w / (19900 - w)
                offsetX *= scale.x
            }

            return {
                type: shadowType,
                offsetX: offsetX,
                offsetY: offsetY,
                blur: blur,
                spread: spread,
                color: color,
            }
        }

        // 圆形
        const cx = this.localAttributes["cx"]
        const cy = this.localAttributes["cy"]
        const rx = this.localAttributes["rx"]
        const ry = this.localAttributes["ry"]
        const r = this.localAttributes["r"]
        const isCircle = this.htmlElement.tagName === "ellipse" || this.htmlElement.tagName === "circle"
        if (rx) {
            this.attributes.rx = parseFloat(rx)
            if (isCircle) this.attributes.width = this.attributes.rx * 2;
        }
        if (ry) {
            this.attributes.ry = parseFloat(ry)
            if (isCircle) this.attributes.height = this.attributes.ry * 2;
        }
        if (r) {
            this.attributes.rx = this.attributes.ry = parseFloat(r)
            if (isCircle) this.attributes.width = this.attributes.height = this.attributes.rx * 2;
        }
        if (cx) {
            this.attributes.cx = parseFloat(cx) - parseFloat(r || rx || "0");
            if (isCircle) this.attributes.x = this.attributes.cx;
        }
        if (cy) {
            this.attributes.cy = parseFloat(cy) - parseFloat(r || ry || "0");
            if (isCircle) this.attributes.y = this.attributes.cy;
        }

        // 直线
        const isLine = this.htmlElement.tagName === "line"
        const x1 = this.localAttributes["x1"]
        if (x1) this.attributes.x1 = parseFloat(x1);
        if (isLine && !this.attributes.x) this.attributes.x = this.attributes.x1;
        const y1 = this.localAttributes["y1"]
        if (y1) this.attributes.y1 = parseFloat(y1);
        if (isLine && !this.attributes.y) this.attributes.y = this.attributes.y1;
        const x2 = this.localAttributes["x2"]
        if (x2) this.attributes.x2 = parseFloat(x2);
        const y2 = this.localAttributes["y2"]
        if (y2) this.attributes.y2 = parseFloat(y2);

        // 图片
        const href = this.localAttributes["xlink:href"] ?? this.localAttributes["href"]
        if (href) this.attributes.href = href;
    }

    updateShapeAttrByTransform() { // 根据transform更新shape的属性
        const shape = this.shape
        if (!shape) return;

        let { translate, rotate, skew, scale } = this.transform.decompose()
        // 最终的宽高
        const size = shape.size;
        const w1 = size.width * scale.x
        const h1 = size.height * scale.y

        // dev code
        // if (this.htmlElement?.tagName === "rect") {
        //     console.log("rect")
        //     console.log("updateShapeAttrByTransform before")
        //     console.log("translate", translate.toString())
        //     console.log("rotate", rotate.toString())
        //     console.log("skew", skew.toString())
        //     console.log("scale", scale.toString())
        //     console.log("shape.frame", shape.frame.width, shape.frame.height)
        // }
        // 抵消视图层在前后加的两次平移操作
        // if (this.transform.hasRotation()) {
        //     const res = this.transform.clone()
        //         .preTranslate(new ColVector3D([w1 / 2, h1 / 2, 0]))
        //         .translate(new ColVector3D([-w1 / 2, -h1 / 2, 0]))
        //         .decompose()
        //     translate = res.translate
        //     rotate = res.rotate
        //     skew = res.skew
        //     scale = res.scale
        // }

        // dev code
        // if (this.htmlElement?.tagName === "rect") {
        //     console.log("rect")
        //     console.log("updateShapeAttrByTransform after")
        //     console.log("translate", translate.toString())
        //     console.log("rotate", rotate.toString())
        //     console.log("skew", skew.toString())
        //     console.log("scale", scale.toString())
        //     console.log("shape.frame", shape.frame.width, shape.frame.height)
        // }

        // 设置缩放
        // shape.frame.width = (this.attributes.width || 0) * Math.abs(scale.x || 1)
        // shape.frame.height = (this.attributes.height || 0) * Math.abs(scale.y || 1)
        // shape.scaleX = Math.abs(scale.x)
        // shape.scaleY = Math.abs(scale.y)
        shape.size.width = (this.attributes.width || 0) * Math.abs(scale.x || 1)
        shape.size.height = (this.attributes.height || 0) * Math.abs(scale.y || 1)

        // 设置斜切
        // shape.skewX = skew.x * 180 / Math.PI

        // 设置xy
        // shape.frame.x = translate.x
        // shape.frame.y = translate.y
        // dev code
        // console.log(shape.name)
        // console.log(translate.x, translate.y)
        // console.log(shape)

        // 设置旋转
        // shape.rotation = rotate.z * 180 / Math.PI

        // 设置翻转
        // shape.isFlippedVertical = this.transform.isFlipV
        // shape.isFlippedHorizontal = this.transform.isFlipH

        const transform2 = castTransform(shape.transform)
        transform2.setTranslate(new ColVector3D([translate.x, translate.y, 0]))
        transform2.setRotateZ(rotate.z)
        transform2.setSkew({ skew: skew })
        transform2.setScale(new ColVector3D([scale.x, scale.y, scale.z]))
        assignTransform(shape.transform, transform2)
    }

    updateShapeStyle() { // 设置shape的样式
        const shape = this.shape
        if (!shape) return;

        const buildGradientByFillColor = (fillColor: FillColor) => {
            const gradient = fillColor.colorType === "linearGradient" ? fillColor.linearGradient! : fillColor.radialGradient!

            let from: Point2D, to: Point2D
            let colorType
            let elipseLength
            const opacity = gradient.opacity
            const width = this.attributes.width || 1
            const height = this.attributes.height || 1

            if (fillColor.colorType === "linearGradient") {
                from = new Point2D(fillColor.linearGradient!.x1, fillColor.linearGradient!.y1)
                to = new Point2D(fillColor.linearGradient!.x2, fillColor.linearGradient!.y2)
                colorType = GradientType.Linear
            } else {
                const translate = fillColor.radialGradient!.transform.decomposeTranslate()
                from = new Point2D(translate.x / width, translate.y / height)

                const toVec = fillColor.radialGradient!.transform.transform(new ColVector3D([1, 0, 0]))
                to = new Point2D(toVec.data.get([0, 0]) / width, toVec.data.get([1, 0]) / height)

                colorType = GradientType.Radial
                // 按现有算法逆推，详见kcdesign-data/src/render/line_gradient.ts:render()->scaleY
                elipseLength = fillColor.radialGradient!.scales[1] / fillColor.radialGradient!.scales[0] * height / width
            }

            const stops = gradient.stops.map((item, i) => {
                item.color.a *= item.opacity
                return new Stop([i] as BasicArray<number>, uuid(), item.offset, myColorToColor(item.color))
            }
            ) as BasicArray<Stop>

            return new Gradient(from, to, colorType, stops as BasicArray<Stop>, elipseLength, opacity)
        }

        const fills = new BasicArray<Fill>()
        const fillColor = this.attributes.fill
        if (fillColor) {
            const fill = new Fill(new BasicArray(), uuid(), true, FillType.SolidColor, myColorToColor(fillColor.color))
            fills.push(fill)

            if (fillColor.colorType !== "color") {
                fill.gradient = buildGradientByFillColor(fillColor)
                fill.fillType = FillType.Gradient
            }

            if (this.localAttributes["fill-rule"] === "evenodd") fill.fillRule = FillRule.Evenodd;
            else fill.fillRule = FillRule.Nonzero;
        }

        const strokePaints = new BasicArray<Fill>()
        const stroke = this.attributes.stroke
        const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
        const border = new Border(BorderPosition.Center, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);
        if (stroke) {
            const strokeWidth = stroke.width || 1

            let position: BorderPosition
            if (stroke.position === "inside") position = BorderPosition.Inner;
            else if (stroke.position === "center") position = BorderPosition.Center;
            else position = BorderPosition.Outer;
            let cornerType: CornerType
            const corner = this.localAttributes["stroke-linejoin"];
            if (corner) {
                if (corner === "miter") cornerType = CornerType.Miter;
                else if (corner === "round") cornerType = CornerType.Round;
                else cornerType = CornerType.Bevel;
            } else {
                cornerType = CornerType.Miter;
            }
            const borderStyle = new BorderStyle(stroke.dashArray[0], stroke.dashArray[1])
            const side = new BorderSideSetting(SideType.Normal, strokeWidth, strokeWidth, strokeWidth, strokeWidth);
            const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, myColorToColor(stroke.color))
            border.position = position;
            border.borderStyle = borderStyle;
            border.cornerType = cornerType;
            border.sideSetting = side;

            if (stroke.colorType !== "color") {
                strokePaint.gradient = buildGradientByFillColor(stroke)
                strokePaint.fillType = FillType.Gradient
            }
            strokePaints.push(strokePaint);
            border.strokePaints = strokePaints;
        }

        const shadows = new BasicArray<Shadow>()

        this.style = new Style(fills, shadows, border)
        if (this.attributes.opacity) this.style.contextSettings = new ContextSettings(BlendMode.Normal, this.attributes.opacity);
        shape.style = this.style
    }

    updateShapeAttr() { // 设置shape的属性
        const shape = this.shape
        if (!shape) return;

        // 叠加xy
        let x = this.attributes.x || 0
        let y = this.attributes.y || 0
        if (this.parent instanceof SvgCreator && this.parent.viewBox) { // viewBox偏移
            x -= this.parent.viewBox[0]
            y -= this.parent.viewBox[1]
        }
        if (x !== 0 || y !== 0) this.transform.preTranslate(new ColVector3D([x, y, 0]));

        // // dev code
        // 抵消视图层在前后加的两次平移操作
        // if (this.transform.hasRotation()) {
        //     const width = this.shape!.frame.width
        //     const height = this.shape!.frame.height
        //     this.transform.preTranslate({vector: new ColVector3D([width / 2, height / 2, 0])})
        //     this.transform.translate({vector: new ColVector3D([-width / 2, -height / 2, 0]), mode: TransformMode.Local})
        // }

        this.updateShapeAttrByTransform()
        this.updateShapeStyle()
    }
}

export class SvgCreator extends BaseCreator {
    viewBox: [number, number, number, number] | undefined

    createShape() {
        this.shape = shapeCreator.newArtboard("容器", new ShapeFrame(0, 0, this.attributes.width || 0, this.attributes.height || 0), this.style?.getStylesMgr()!)
    }

    afterChildrenCreateShape(): void {
        if (!this.shape) return;

        // 处理viewBox
        const viewBox = this.localAttributes["viewBox"]
        if (viewBox) {
            const viewBoxSplitRes = viewBox.split(/,|\s+/).filter(arg => arg && arg.trim()).map(item => parseFloat(item))
            if (viewBoxSplitRes.length >= 4) {
                const [dx, dy, w0, h0] = viewBoxSplitRes
                const w = this.attributes.width || 0
                const h = this.attributes.height || 0
                const scaleX = w0 === 0 ? 1 : (w / w0)
                const scaleY = h0 === 0 ? 1 : (h / h0)
                if (scaleX !== 1 || scaleY !== 1) for (const item of this.children) {
                    // item.transform.scale({
                    //     vector: new ColVector3D([scaleX, scaleY, 1]),
                    //     mode: TransformMode.Global,
                    // })
                }
                if (dx !== 0 || dy !== 0) for (const item of this.children) {
                    item.transform.translate(new ColVector3D([dx, dy, 0]))
                }
                if (scaleX !== 1 || scaleY !== 1 || dx !== 0 || dy !== 0) for (const item of this.children) {
                    item.updateShapeAttrByTransform()
                }
            }
        }

        // 插入子元素
        const svgShape = this.shape as Artboard
        const childrenShapes = this.children.filter(item => item.shape).map(item => item.shape!)
        svgShape.childs.push(...childrenShapes)

        for (const item of childrenShapes) item.resizingConstraint = 0; // 子元素跟随缩放
    }
}
