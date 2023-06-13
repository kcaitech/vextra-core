/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

import * as impl from "../data/classes"
import { BasicArray } from "../data/basic"
import * as types from "../data/typesdefine"


export interface IImportContext {
    afterImport(obj: any): void
}
/* winding rule */
export function importWindingRule(ctx: IImportContext, source: types.WindingRule): impl.WindingRule {
    return source
}
/* user infomation */
export function importUserInfo(ctx: IImportContext, source: types.UserInfo): impl.UserInfo {
    const ret: impl.UserInfo = new impl.UserInfo (
        source.userId,
        source.userNickname,
        source.avatar
    )
    ctx.afterImport(ret)
    return ret
}
/* text */
export function importText(ctx: IImportContext, source: types.Text): impl.Text {
    const ret: impl.Text = new impl.Text (
        (() => {
            const ret = new BasicArray<impl.Para>()
            for (let i = 0, len = source.paras.length; i < len; i++) {
                const r = importPara(ctx, source.paras[i])
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.attr = source.attr && importTextAttr(ctx, source.attr)
    ctx.afterImport(ret)
    return ret
}
/* text vertical alignment */
export function importTextVerAlign(ctx: IImportContext, source: types.TextVerAlign): impl.TextVerAlign {
    return source
}
/* text orientation */
export function importTextOrientation(ctx: IImportContext, source: types.TextOrientation): impl.TextOrientation {
    return source
}
/* text horizontal alignment */
export function importTextHorAlign(ctx: IImportContext, source: types.TextHorAlign): impl.TextHorAlign {
    return source
}
/* text behaviour */
export function importTextBehaviour(ctx: IImportContext, source: types.TextBehaviour): impl.TextBehaviour {
    return source
}
/* style */
export function importStyle(ctx: IImportContext, source: types.Style): impl.Style {
    const ret: impl.Style = new impl.Style (
        source.miterLimit,
        importWindingRule(ctx, source.windingRule),
        importBlur(ctx, source.blur),
        importBorderOptions(ctx, source.borderOptions),
        (() => {
            const ret = new BasicArray<impl.Border>()
            for (let i = 0, len = source.borders.length; i < len; i++) {
                const r = importBorder(ctx, source.borders[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        importContextSettings(ctx, source.contextSettings),
        (() => {
            const ret = new BasicArray<impl.Fill>()
            for (let i = 0, len = source.fills.length; i < len; i++) {
                const r = importFill(ctx, source.fills[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        (() => {
            const ret = new BasicArray<impl.Shadow>()
            for (let i = 0, len = source.innerShadows.length; i < len; i++) {
                const r = importShadow(ctx, source.innerShadows[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        (() => {
            const ret = new BasicArray<impl.Shadow>()
            for (let i = 0, len = source.shadows.length; i < len; i++) {
                const r = importShadow(ctx, source.shadows[i])
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.colorControls = source.colorControls && importColorControls(ctx, source.colorControls)
    ctx.afterImport(ret)
    return ret
}
/* stop */
export function importStop(ctx: IImportContext, source: types.Stop): impl.Stop {
    const ret: impl.Stop = new impl.Stop (
        source.position
    )
    ret.color = source.color && importColor(ctx, source.color)
    ctx.afterImport(ret)
    return ret
}
/* span attr */
export function importSpanAttr(ctx: IImportContext, source: types.SpanAttr): impl.SpanAttr {
    const ret: impl.SpanAttr = new impl.SpanAttr (
    )
    ret.fontName = source.fontName
    ret.fontSize = source.fontSize
    ret.color = source.color && importColor(ctx, source.color)
    ctx.afterImport(ret)
    return ret
}
/* shape */
export function importShape(ctx: IImportContext, source: types.Shape): impl.Shape {
    const ret: impl.Shape = new impl.Shape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp)
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* shape types */
export function importShapeType(ctx: IImportContext, source: types.ShapeType): impl.ShapeType {
    return source
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export function importShapeFrame(ctx: IImportContext, source: types.ShapeFrame): impl.ShapeFrame {
    const ret: impl.ShapeFrame = new impl.ShapeFrame (
        source.x,
        source.y,
        source.width,
        source.height
    )
    ctx.afterImport(ret)
    return ret
}
/* shadow */
export function importShadow(ctx: IImportContext, source: types.Shadow): impl.Shadow {
    const ret: impl.Shadow = new impl.Shadow (
        source.isEnabled,
        source.blurRadius,
        importColor(ctx, source.color),
        importGraphicsContextSettings(ctx, source.contextSettings),
        source.offsetX,
        source.offsetY,
        source.spread
    )
    ctx.afterImport(ret)
    return ret
}
/* resize type */
export function importResizeType(ctx: IImportContext, source: types.ResizeType): impl.ResizeType {
    return source
}
/* rect radius */
export function importRectRadius(ctx: IImportContext, source: types.RectRadius): impl.RectRadius {
    const ret: impl.RectRadius = new impl.RectRadius (
        source.rlt,
        source.rrt,
        source.rrb,
        source.rlb
    )
    ctx.afterImport(ret)
    return ret
}
/* point 2d */
export function importPoint2D(ctx: IImportContext, source: types.Point2D): impl.Point2D {
    const ret: impl.Point2D = new impl.Point2D (
        source.x,
        source.y
    )
    ctx.afterImport(ret)
    return ret
}
/* para */
export function importPara(ctx: IImportContext, source: types.Para): impl.Para {
    const ret: impl.Para = new impl.Para (
        source.text,
        (() => {
            const ret = new BasicArray<impl.Span>()
            for (let i = 0, len = source.spans.length; i < len; i++) {
                const r = importSpan(ctx, source.spans[i])
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.attr = source.attr && importParaAttr(ctx, source.attr)
    ctx.afterImport(ret)
    return ret
}
/* page list item */
export function importPageListItem(ctx: IImportContext, source: types.PageListItem): impl.PageListItem {
    const ret: impl.PageListItem = new impl.PageListItem (
        source.id,
        source.name
    )
    ctx.afterImport(ret)
    return ret
}
/* override list item */
export function importOverrideItem(ctx: IImportContext, source: types.OverrideItem): impl.OverrideItem {
    const ret: impl.OverrideItem = new impl.OverrideItem (
        source.id
    )
    ret.value = source.value && (() => {

        if (source.value.typeId == 'style') {
            return importStyle(ctx, source.value as types.Style)
        }
    })()
    ctx.afterImport(ret)
    return ret
}
/* marker type */
export function importMarkerType(ctx: IImportContext, source: types.MarkerType): impl.MarkerType {
    return source
}
/* line join style */
export function importLineJoinStyle(ctx: IImportContext, source: types.LineJoinStyle): impl.LineJoinStyle {
    return source
}
/* line cap style */
export function importLineCapStyle(ctx: IImportContext, source: types.LineCapStyle): impl.LineCapStyle {
    return source
}
/* graphics contex settings */
export function importGraphicsContextSettings(ctx: IImportContext, source: types.GraphicsContextSettings): impl.GraphicsContextSettings {
    const ret: impl.GraphicsContextSettings = new impl.GraphicsContextSettings (
        importBlendMode(ctx, source.blendMode),
        source.opacity
    )
    ctx.afterImport(ret)
    return ret
}
/* gradient */
export function importGradient(ctx: IImportContext, source: types.Gradient): impl.Gradient {
    const ret: impl.Gradient = new impl.Gradient (
        source.elipseLength,
        importPoint2D(ctx, source.from),
        importPoint2D(ctx, source.to),
        importGradientType(ctx, source.gradientType),
        (() => {
            const ret = new BasicArray<impl.Stop>()
            for (let i = 0, len = source.stops.length; i < len; i++) {
                const r = importStop(ctx, source.stops[i])
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ctx.afterImport(ret)
    return ret
}
/* gradient type */
export function importGradientType(ctx: IImportContext, source: types.GradientType): impl.GradientType {
    return source
}
/* fill */
export function importFill(ctx: IImportContext, source: types.Fill): impl.Fill {
    const ret: impl.Fill = new impl.Fill (
        source.isEnabled,
        importFillType(ctx, source.fillType),
        importColor(ctx, source.color),
        importContextSettings(ctx, source.contextSettings)
    )
    ret.gradient = source.gradient && importGradient(ctx, source.gradient)
    ctx.afterImport(ret)
    return ret
}
/* fill types */
export function importFillType(ctx: IImportContext, source: types.FillType): impl.FillType {
    return source
}
/* visible scale type */
export function importExportVisibleScaleType(ctx: IImportContext, source: types.ExportVisibleScaleType): impl.ExportVisibleScaleType {
    return source
}
/* export options */
export function importExportOptions(ctx: IImportContext, source: types.ExportOptions): impl.ExportOptions {
    const ret: impl.ExportOptions = new impl.ExportOptions (
        (() => {
            const ret = new BasicArray<impl.ExportFormat>()
            for (let i = 0, len = source.exportFormats.length; i < len; i++) {
                const r = importExportFormat(ctx, source.exportFormats[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        (() => {
            const ret = new BasicArray<string>()
            for (let i = 0, len = source.includedChildIds.length; i < len; i++) {
                const r = source.includedChildIds[i]
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.childOptions,
        source.shouldTrim
    )
    ctx.afterImport(ret)
    return ret
}
/* export format */
export function importExportFormat(ctx: IImportContext, source: types.ExportFormat): impl.ExportFormat {
    const ret: impl.ExportFormat = new impl.ExportFormat (
    )
    ret.absoluteSize = source.absoluteSize
    ret.fileFormat = source.fileFormat && importExportFileFormat(ctx, source.fileFormat)
    ret.name = source.name
    ret.namingScheme = source.namingScheme && importExportFormatNameingScheme(ctx, source.namingScheme)
    ret.scale = source.scale
    ret.visibleScaleType = source.visibleScaleType && importExportVisibleScaleType(ctx, source.visibleScaleType)
    ctx.afterImport(ret)
    return ret
}
/* export format nameing scheme */
export function importExportFormatNameingScheme(ctx: IImportContext, source: types.ExportFormatNameingScheme): impl.ExportFormatNameingScheme {
    return source
}
/* export file format */
export function importExportFileFormat(ctx: IImportContext, source: types.ExportFileFormat): impl.ExportFileFormat {
    return source
}
/* ellipse attributes */
export function importEllipse(ctx: IImportContext, source: types.Ellipse): impl.Ellipse {
    const ret: impl.Ellipse = new impl.Ellipse (
        source.cx,
        source.cy,
        source.rx,
        source.ry
    )
    ctx.afterImport(ret)
    return ret
}
/* document meta */
export function importDocumentMeta(ctx: IImportContext, source: types.DocumentMeta): impl.DocumentMeta {
    const ret: impl.DocumentMeta = new impl.DocumentMeta (
        source.name,
        (() => {
            const ret = new BasicArray<impl.PageListItem>()
            for (let i = 0, len = source.pagesList.length; i < len; i++) {
                const r = importPageListItem(ctx, source.pagesList[i])
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ctx.afterImport(ret)
    return ret
}
/* curve point */
export function importCurvePoint(ctx: IImportContext, source: types.CurvePoint): impl.CurvePoint {
    const ret: impl.CurvePoint = new impl.CurvePoint (
        source.cornerRadius,
        importPoint2D(ctx, source.curveFrom),
        importPoint2D(ctx, source.curveTo),
        source.hasCurveFrom,
        source.hasCurveTo,
        importCurveMode(ctx, source.curveMode),
        importPoint2D(ctx, source.point)
    )
    ctx.afterImport(ret)
    return ret
}
/* curve mode */
export function importCurveMode(ctx: IImportContext, source: types.CurveMode): impl.CurveMode {
    return source
}
/* context settings */
export function importContextSettings(ctx: IImportContext, source: types.ContextSettings): impl.ContextSettings {
    const ret: impl.ContextSettings = new impl.ContextSettings (
        importBlendMode(ctx, source.blenMode),
        source.opacity
    )
    ctx.afterImport(ret)
    return ret
}
/* comment */
export function importComment(ctx: IImportContext, source: types.Comment): impl.Comment {
    const ret: impl.Comment = new impl.Comment (
        source.pageId,
        source.id,
        importShapeFrame(ctx, source.frame),
        importUserInfo(ctx, source.user),
        source.createAt,
        source.content,
        importShape(ctx, source.parasiticBody)
    )
    ret.parentId = source.parentId
    ret.rootId = source.rootId
    ctx.afterImport(ret)
    return ret
}
/* color */
export function importColor(ctx: IImportContext, source: types.Color): impl.Color {
    const ret: impl.Color = new impl.Color (
        source.alpha,
        source.red,
        source.green,
        source.blue
    )
    ctx.afterImport(ret)
    return ret
}
/* color controls */
export function importColorControls(ctx: IImportContext, source: types.ColorControls): impl.ColorControls {
    const ret: impl.ColorControls = new impl.ColorControls (
        source.isEnabled,
        source.brightness,
        source.contrast,
        source.hue,
        source.saturation
    )
    ctx.afterImport(ret)
    return ret
}
/* border */
export function importBorder(ctx: IImportContext, source: types.Border): impl.Border {
    const ret: impl.Border = new impl.Border (
        source.isEnabled,
        importFillType(ctx, source.fillType),
        importColor(ctx, source.color),
        importContextSettings(ctx, source.contextSettings),
        importBorderPosition(ctx, source.position),
        source.thickness,
        importBorderStyle(ctx, source.borderStyle),
        importMarkerType(ctx, source.startMarkerType),
        importMarkerType(ctx, source.endMarkerType)
    )
    ret.gradient = source.gradient && importGradient(ctx, source.gradient)
    ctx.afterImport(ret)
    return ret
}
/* border style */
export function importBorderStyle(ctx: IImportContext, source: types.BorderStyle): impl.BorderStyle {
    const ret: impl.BorderStyle = new impl.BorderStyle (
        source.length,
        source.gap
    )
    ctx.afterImport(ret)
    return ret
}
/* border position */
export function importBorderPosition(ctx: IImportContext, source: types.BorderPosition): impl.BorderPosition {
    return source
}
/* border options */
export function importBorderOptions(ctx: IImportContext, source: types.BorderOptions): impl.BorderOptions {
    const ret: impl.BorderOptions = new impl.BorderOptions (
        source.isEnabled,
        importLineCapStyle(ctx, source.lineCapStyle),
        importLineJoinStyle(ctx, source.lineJoinStyle)
    )
    ctx.afterImport(ret)
    return ret
}
/* bool op types */
export function importBoolOp(ctx: IImportContext, source: types.BoolOp): impl.BoolOp {
    return source
}
/* blur */
export function importBlur(ctx: IImportContext, source: types.Blur): impl.Blur {
    const ret: impl.Blur = new impl.Blur (
        source.isEnabled,
        importPoint2D(ctx, source.center),
        source.saturation,
        importBlurType(ctx, source.type)
    )
    ret.motionAngle = source.motionAngle
    ret.radius = source.radius
    ctx.afterImport(ret)
    return ret
}
/* blur types */
export function importBlurType(ctx: IImportContext, source: types.BlurType): impl.BlurType {
    return source
}
/* blend mode */
export function importBlendMode(ctx: IImportContext, source: types.BlendMode): impl.BlendMode {
    return source
}
/* text shape */
export function importTextShape(ctx: IImportContext, source: types.TextShape): impl.TextShape {
    const ret: impl.TextShape = new impl.TextShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        importText(ctx, source.text)
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* symbol ref shape */
export function importSymbolRefShape(ctx: IImportContext, source: types.SymbolRefShape): impl.SymbolRefShape {
    const ret: impl.SymbolRefShape = new impl.SymbolRefShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        source.refId
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ret.overrides = source.overrides && (() => {
        const ret = new BasicArray<impl.OverrideItem>()
        for (let i = 0, len = source.overrides.length; i < len; i++) {
            const r = importOverrideItem(ctx, source.overrides[i])
            if (r) ret.push(r)
        }
        return ret
    })()
    ctx.afterImport(ret)
    return ret
}
/* span attr */
export function importSpan(ctx: IImportContext, source: types.Span): impl.Span {
    const ret: impl.Span = new impl.Span (
        source.length
    )
    ret.fontName = source.fontName
    ret.fontSize = source.fontSize
    ret.color = source.color && importColor(ctx, source.color)
    ctx.afterImport(ret)
    return ret
}
/* path shape */
export function importPathShape(ctx: IImportContext, source: types.PathShape): impl.PathShape {
    const ret: impl.PathShape = new impl.PathShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = importCurvePoint(ctx, source.points[i])
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ret.isClosed = source.isClosed
    ctx.afterImport(ret)
    return ret
}
/* rect shape */
export function importRectShape(ctx: IImportContext, source: types.RectShape): impl.RectShape {
    const ret: impl.RectShape = new impl.RectShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = importCurvePoint(ctx, source.points[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        importRectRadius(ctx, source.fixedRadius)
    )
    ret.isClosed = source.isClosed
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* span attr */
export function importParaAttr(ctx: IImportContext, source: types.ParaAttr): impl.ParaAttr {
    const ret: impl.ParaAttr = new impl.ParaAttr (
    )
    ret.fontName = source.fontName
    ret.fontSize = source.fontSize
    ret.color = source.color && importColor(ctx, source.color)
    ret.alignment = source.alignment && importTextHorAlign(ctx, source.alignment)
    ret.paraSpacing = source.paraSpacing
    ret.kerning = source.kerning
    ret.minimumLineHeight = source.minimumLineHeight
    ret.maximumLineHeight = source.maximumLineHeight
    ctx.afterImport(ret)
    return ret
}
/* text attr */
export function importTextAttr(ctx: IImportContext, source: types.TextAttr): impl.TextAttr {
    const ret: impl.TextAttr = new impl.TextAttr (
    )
    ret.alignment = source.alignment && importTextHorAlign(ctx, source.alignment)
    ret.paraSpacing = source.paraSpacing
    ret.kerning = source.kerning
    ret.minimumLineHeight = source.minimumLineHeight
    ret.maximumLineHeight = source.maximumLineHeight
    ret.fontName = source.fontName
    ret.fontSize = source.fontSize
    ret.color = source.color && importColor(ctx, source.color)
    ret.verAlign = source.verAlign && importTextVerAlign(ctx, source.verAlign)
    ret.orientation = source.orientation && importTextOrientation(ctx, source.orientation)
    ret.textBehaviour = source.textBehaviour && importTextBehaviour(ctx, source.textBehaviour)
    ctx.afterImport(ret)
    return ret
}
/* page */
export function importPage(ctx: IImportContext, source: types.Page): impl.Page {
    const ret: impl.Page = new impl.Page (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<(impl.Shape | impl.FlattenShape | impl.GroupShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape | impl.OvalShape | impl.LineShape | impl.Artboard | impl.SymbolShape)>()
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {

                    if (source.childs[i].typeId == 'shape') {
                        return importShape(ctx, source.childs[i] as types.Shape)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return importFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                    }
                    if (source.childs[i].typeId == 'group-shape') {
                        return importGroupShape(ctx, source.childs[i] as types.GroupShape)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return importImageShape(ctx, source.childs[i] as types.ImageShape)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return importPathShape(ctx, source.childs[i] as types.PathShape)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return importRectShape(ctx, source.childs[i] as types.RectShape)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return importTextShape(ctx, source.childs[i] as types.TextShape)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return importOvalShape(ctx, source.childs[i] as types.OvalShape)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return importLineShape(ctx, source.childs[i] as types.LineShape)
                    }
                    if (source.childs[i].typeId == 'artboard') {
                        return importArtboard(ctx, source.childs[i] as types.Artboard)
                    }
                    if (source.childs[i].typeId == 'symbol-shape') {
                        return importSymbolShape(ctx, source.childs[i] as types.SymbolShape)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* oval shape */
export function importOvalShape(ctx: IImportContext, source: types.OvalShape): impl.OvalShape {
    const ret: impl.OvalShape = new impl.OvalShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = importCurvePoint(ctx, source.points[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        importEllipse(ctx, source.ellipse)
    )
    ret.isClosed = source.isClosed
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* line shape */
export function importLineShape(ctx: IImportContext, source: types.LineShape): impl.LineShape {
    const ret: impl.LineShape = new impl.LineShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = importCurvePoint(ctx, source.points[i])
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.isClosed = source.isClosed
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* image shape */
export function importImageShape(ctx: IImportContext, source: types.ImageShape): impl.ImageShape {
    const ret: impl.ImageShape = new impl.ImageShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        source.imageRef
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* group shape */
export function importGroupShape(ctx: IImportContext, source: types.GroupShape): impl.GroupShape {
    const ret: impl.GroupShape = new impl.GroupShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<(impl.GroupShape | impl.Shape | impl.FlattenShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape)>()
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {

                    if (source.childs[i].typeId == 'group-shape') {
                        return importGroupShape(ctx, source.childs[i] as types.GroupShape)
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return importShape(ctx, source.childs[i] as types.Shape)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return importFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return importImageShape(ctx, source.childs[i] as types.ImageShape)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return importPathShape(ctx, source.childs[i] as types.PathShape)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return importRectShape(ctx, source.childs[i] as types.RectShape)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return importTextShape(ctx, source.childs[i] as types.TextShape)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* symbol shape */
export function importSymbolShape(ctx: IImportContext, source: types.SymbolShape): impl.SymbolShape {
    const ret: impl.SymbolShape = new impl.SymbolShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<(impl.GroupShape | impl.Shape | impl.FlattenShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape)>()
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {

                    if (source.childs[i].typeId == 'group-shape') {
                        return importGroupShape(ctx, source.childs[i] as types.GroupShape)
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return importShape(ctx, source.childs[i] as types.Shape)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return importFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return importImageShape(ctx, source.childs[i] as types.ImageShape)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return importPathShape(ctx, source.childs[i] as types.PathShape)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return importRectShape(ctx, source.childs[i] as types.RectShape)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return importTextShape(ctx, source.childs[i] as types.TextShape)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* flatten shape */
export function importFlattenShape(ctx: IImportContext, source: types.FlattenShape): impl.FlattenShape {
    const ret: impl.FlattenShape = new impl.FlattenShape (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<(impl.GroupShape | impl.Shape | impl.FlattenShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape)>()
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {

                    if (source.childs[i].typeId == 'group-shape') {
                        return importGroupShape(ctx, source.childs[i] as types.GroupShape)
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return importShape(ctx, source.childs[i] as types.Shape)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return importFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return importImageShape(ctx, source.childs[i] as types.ImageShape)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return importPathShape(ctx, source.childs[i] as types.PathShape)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return importRectShape(ctx, source.childs[i] as types.RectShape)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return importTextShape(ctx, source.childs[i] as types.TextShape)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
/* artboard shape */
export function importArtboard(ctx: IImportContext, source: types.Artboard): impl.Artboard {
    const ret: impl.Artboard = new impl.Artboard (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        (() => {
            const ret = new BasicArray<(impl.GroupShape | impl.Shape | impl.FlattenShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape)>()
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {

                    if (source.childs[i].typeId == 'group-shape') {
                        return importGroupShape(ctx, source.childs[i] as types.GroupShape)
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return importShape(ctx, source.childs[i] as types.Shape)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return importFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return importImageShape(ctx, source.childs[i] as types.ImageShape)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return importPathShape(ctx, source.childs[i] as types.PathShape)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return importRectShape(ctx, source.childs[i] as types.RectShape)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return importTextShape(ctx, source.childs[i] as types.TextShape)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ret.hasBackgroundColor = source.hasBackgroundColor
    ret.includeBackgroundColorInExport = source.includeBackgroundColorInExport
    ret.backgroundColor = source.backgroundColor && importColor(ctx, source.backgroundColor)
    ctx.afterImport(ret)
    return ret
}
/* artboard ref shape */
export function importArtboardRef(ctx: IImportContext, source: types.ArtboardRef): impl.ArtboardRef {
    const ret: impl.ArtboardRef = new impl.ArtboardRef (
        source.id,
        source.name,
        importShapeType(ctx, source.type),
        importShapeFrame(ctx, source.frame),
        importStyle(ctx, source.style),
        importBoolOp(ctx, source.boolOp),
        source.refId
    )
    ret.isFixedToViewport = source.isFixedToViewport
    ret.isFlippedHorizontal = source.isFlippedHorizontal
    ret.isFlippedVertical = source.isFlippedVertical
    ret.isLocked = source.isLocked
    ret.isVisible = source.isVisible
    ret.exportOptions = source.exportOptions && importExportOptions(ctx, source.exportOptions)
    ret.nameIsFixed = source.nameIsFixed
    ret.resizingConstraint = source.resizingConstraint
    ret.resizingType = source.resizingType && importResizeType(ctx, source.resizingType)
    ret.rotation = source.rotation
    ret.clippingMaskMode = source.clippingMaskMode
    ret.hasClippingMask = source.hasClippingMask
    ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    ctx.afterImport(ret)
    return ret
}
