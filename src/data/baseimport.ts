/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

import * as impl from "./classes"
import * as types from "./typesdefine"
import { BasicArray } from "./basic"


export interface IImportContext {
    document: impl.Document
}
/* winding rule */
export function importWindingRule(source: types.WindingRule, ctx?: IImportContext): impl.WindingRule {
    return source
}
/* user infomation */
export function importUserInfo(source: types.UserInfo, ctx?: IImportContext): impl.UserInfo {
    const ret: impl.UserInfo = new impl.UserInfo (
        source.userId,
        source.userNickname,
        source.avatar
    )
    return ret
}
/* underline types */
export function importUnderlineType(source: types.UnderlineType, ctx?: IImportContext): impl.UnderlineType {
    return source
}
/* text */
export function importText(source: types.Text, ctx?: IImportContext): impl.Text {
    const ret: impl.Text = new impl.Text (
        (() => {
            const ret = new BasicArray<impl.Para>()
            for (let i = 0, len = source.paras && source.paras.length; i < len; i++) {
                const r = importPara(source.paras[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.attr !== undefined) ret.attr = importTextAttr(source.attr, ctx)
    return ret
}
/* text vertical alignment */
export function importTextVerAlign(source: types.TextVerAlign, ctx?: IImportContext): impl.TextVerAlign {
    return source
}
/* text transform types */
export function importTextTransformType(source: types.TextTransformType, ctx?: IImportContext): impl.TextTransformType {
    return source
}
/* text orientation */
export function importTextOrientation(source: types.TextOrientation, ctx?: IImportContext): impl.TextOrientation {
    return source
}
/* text horizontal alignment */
export function importTextHorAlign(source: types.TextHorAlign, ctx?: IImportContext): impl.TextHorAlign {
    return source
}
/* text behaviour */
export function importTextBehaviour(source: types.TextBehaviour, ctx?: IImportContext): impl.TextBehaviour {
    return source
}
/* table cell types */
export function importTableCellType(source: types.TableCellType, ctx?: IImportContext): impl.TableCellType {
    return source
}
/* style */
export function importStyle(source: types.Style, ctx?: IImportContext): impl.Style {
    const ret: impl.Style = new impl.Style (
        (() => {
            const ret = new BasicArray<impl.Border>()
            for (let i = 0, len = source.borders && source.borders.length; i < len; i++) {
                const r = importBorder(source.borders[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        (() => {
            const ret = new BasicArray<impl.Fill>()
            for (let i = 0, len = source.fills && source.fills.length; i < len; i++) {
                const r = importFill(source.fills[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.miterLimit !== undefined) ret.miterLimit = source.miterLimit
    if (source.windingRule !== undefined) ret.windingRule = importWindingRule(source.windingRule, ctx)
    if (source.blur !== undefined) ret.blur = importBlur(source.blur, ctx)
    if (source.borderOptions !== undefined) ret.borderOptions = importBorderOptions(source.borderOptions, ctx)
    if (source.colorControls !== undefined) ret.colorControls = importColorControls(source.colorControls, ctx)
    if (source.contextSettings !== undefined) ret.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.innerShadows !== undefined) ret.innerShadows = (() => {
        const ret = new BasicArray<impl.Shadow>()
        for (let i = 0, len = source.innerShadows && source.innerShadows.length; i < len; i++) {
            const r = importShadow(source.innerShadows[i], ctx)
            if (r) ret.push(r)
        }
        return ret
    })()
    if (source.shadows !== undefined) ret.shadows = (() => {
        const ret = new BasicArray<impl.Shadow>()
        for (let i = 0, len = source.shadows && source.shadows.length; i < len; i++) {
            const r = importShadow(source.shadows[i], ctx)
            if (r) ret.push(r)
        }
        return ret
    })()
    if (source.startMarkerType !== undefined) ret.startMarkerType = importMarkerType(source.startMarkerType, ctx)
    if (source.endMarkerType !== undefined) ret.endMarkerType = importMarkerType(source.endMarkerType, ctx)
    return ret
}
/* strikethrough types */
export function importStrikethroughType(source: types.StrikethroughType, ctx?: IImportContext): impl.StrikethroughType {
    return source
}
/* stop */
export function importStop(source: types.Stop, ctx?: IImportContext): impl.Stop {
    const ret: impl.Stop = new impl.Stop (
        source.position
    )
    if (source.color !== undefined) ret.color = importColor(source.color, ctx)
    return ret
}
/* span attr */
export function importSpanAttr(source: types.SpanAttr, ctx?: IImportContext): impl.SpanAttr {
    const ret: impl.SpanAttr = new impl.SpanAttr (
    )
    if (source.fontName !== undefined) ret.fontName = source.fontName
    if (source.fontSize !== undefined) ret.fontSize = source.fontSize
    if (source.color !== undefined) ret.color = importColor(source.color, ctx)
    if (source.strikethrough !== undefined) ret.strikethrough = importStrikethroughType(source.strikethrough, ctx)
    if (source.underline !== undefined) ret.underline = importUnderlineType(source.underline, ctx)
    if (source.bold !== undefined) ret.bold = source.bold
    if (source.italic !== undefined) ret.italic = source.italic
    if (source.bulletNumbers !== undefined) ret.bulletNumbers = importBulletNumbers(source.bulletNumbers, ctx)
    if (source.highlight !== undefined) ret.highlight = importColor(source.highlight, ctx)
    if (source.kerning !== undefined) ret.kerning = source.kerning
    if (source.transform !== undefined) ret.transform = importTextTransformType(source.transform, ctx)
    if (source.placeholder !== undefined) ret.placeholder = source.placeholder
    return ret
}
/* shape */
export function importShape(source: types.Shape, ctx?: IImportContext): impl.Shape {
    const ret: impl.Shape = new impl.Shape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx)
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    return ret
}
/* shape types */
export function importShapeType(source: types.ShapeType, ctx?: IImportContext): impl.ShapeType {
    return source
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export function importShapeFrame(source: types.ShapeFrame, ctx?: IImportContext): impl.ShapeFrame {
    const ret: impl.ShapeFrame = new impl.ShapeFrame (
        source.x,
        source.y,
        source.width,
        source.height
    )
    return ret
}
/* shadow */
export function importShadow(source: types.Shadow, ctx?: IImportContext): impl.Shadow {
    const ret: impl.Shadow = new impl.Shadow (
        source.isEnabled,
        source.blurRadius,
        importColor(source.color, ctx),
        source.offsetX,
        source.offsetY,
        source.spread
    )
    if (source.contextSettings !== undefined) ret.contextSettings = importGraphicsContextSettings(source.contextSettings, ctx)
    return ret
}
/* resize type */
export function importResizeType(source: types.ResizeType, ctx?: IImportContext): impl.ResizeType {
    return source
}
/* point 2d */
export function importPoint2D(source: types.Point2D, ctx?: IImportContext): impl.Point2D {
    const ret: impl.Point2D = new impl.Point2D (
        source.x,
        source.y
    )
    return ret
}
/* path segment */
export function importPathSegment(source: types.PathSegment, ctx?: IImportContext): impl.PathSegment {
    const ret: impl.PathSegment = new impl.PathSegment (
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points && source.points.length; i < len; i++) {
                const r = importCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.isClosed
    )
    return ret
}
/* para */
export function importPara(source: types.Para, ctx?: IImportContext): impl.Para {
    const ret: impl.Para = new impl.Para (
        source.text,
        (() => {
            const ret = new BasicArray<impl.Span>()
            for (let i = 0, len = source.spans && source.spans.length; i < len; i++) {
                const r = importSpan(source.spans[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.attr !== undefined) ret.attr = importParaAttr(source.attr, ctx)
    return ret
}
/* page list item */
export function importPageListItem(source: types.PageListItem, ctx?: IImportContext): impl.PageListItem {
    const ret: impl.PageListItem = new impl.PageListItem (
        source.id,
        source.name
    )
    if (source.versionId !== undefined) ret.versionId = source.versionId
    return ret
}
/* padding */
export function importPadding(source: types.Padding, ctx?: IImportContext): impl.Padding {
    const ret: impl.Padding = new impl.Padding (
    )
    if (source.left !== undefined) ret.left = source.left
    if (source.top !== undefined) ret.top = source.top
    if (source.right !== undefined) ret.right = source.right
    if (source.bottom !== undefined) ret.bottom = source.bottom
    return ret
}
/* override types */
export function importOverrideType(source: types.OverrideType, ctx?: IImportContext): impl.OverrideType {
    return source
}
/* marker type */
export function importMarkerType(source: types.MarkerType, ctx?: IImportContext): impl.MarkerType {
    return source
}
/* line join style */
export function importLineJoinStyle(source: types.LineJoinStyle, ctx?: IImportContext): impl.LineJoinStyle {
    return source
}
/* line cap style */
export function importLineCapStyle(source: types.LineCapStyle, ctx?: IImportContext): impl.LineCapStyle {
    return source
}
/* graphics contex settings */
export function importGraphicsContextSettings(source: types.GraphicsContextSettings, ctx?: IImportContext): impl.GraphicsContextSettings {
    const ret: impl.GraphicsContextSettings = new impl.GraphicsContextSettings (
        importBlendMode(source.blendMode, ctx),
        source.opacity
    )
    return ret
}
/* gradient */
export function importGradient(source: types.Gradient, ctx?: IImportContext): impl.Gradient {
    const ret: impl.Gradient = new impl.Gradient (
        source.elipseLength,
        importPoint2D(source.from, ctx),
        importPoint2D(source.to, ctx),
        importGradientType(source.gradientType, ctx),
        (() => {
            const ret = new BasicArray<impl.Stop>()
            for (let i = 0, len = source.stops && source.stops.length; i < len; i++) {
                const r = importStop(source.stops[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    return ret
}
/* gradient type */
export function importGradientType(source: types.GradientType, ctx?: IImportContext): impl.GradientType {
    return source
}
/* fill */
export function importFill(source: types.Fill, ctx?: IImportContext): impl.Fill {
    const ret: impl.Fill = new impl.Fill (
        source.id,
        source.isEnabled,
        importFillType(source.fillType, ctx),
        importColor(source.color, ctx)
    )
    if (source.contextSettings !== undefined) ret.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.gradient !== undefined) ret.gradient = importGradient(source.gradient, ctx)
    if (source.imageRef !== undefined) ret.imageRef = source.imageRef
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
    return ret
}
/* fill types */
export function importFillType(source: types.FillType, ctx?: IImportContext): impl.FillType {
    return source
}
/* visible scale type */
export function importExportVisibleScaleType(source: types.ExportVisibleScaleType, ctx?: IImportContext): impl.ExportVisibleScaleType {
    return source
}
/* export options */
export function importExportOptions(source: types.ExportOptions, ctx?: IImportContext): impl.ExportOptions {
    const ret: impl.ExportOptions = new impl.ExportOptions (
        (() => {
            const ret = new BasicArray<impl.ExportFormat>()
            for (let i = 0, len = source.exportFormats && source.exportFormats.length; i < len; i++) {
                const r = importExportFormat(source.exportFormats[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        (() => {
            const ret = new BasicArray<string>()
            for (let i = 0, len = source.includedChildIds && source.includedChildIds.length; i < len; i++) {
                const r = source.includedChildIds[i]
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.childOptions,
        source.shouldTrim
    )
    return ret
}
/* export format */
export function importExportFormat(source: types.ExportFormat, ctx?: IImportContext): impl.ExportFormat {
    const ret: impl.ExportFormat = new impl.ExportFormat (
    )
    if (source.absoluteSize !== undefined) ret.absoluteSize = source.absoluteSize
    if (source.fileFormat !== undefined) ret.fileFormat = importExportFileFormat(source.fileFormat, ctx)
    if (source.name !== undefined) ret.name = source.name
    if (source.namingScheme !== undefined) ret.namingScheme = importExportFormatNameingScheme(source.namingScheme, ctx)
    if (source.scale !== undefined) ret.scale = source.scale
    if (source.visibleScaleType !== undefined) ret.visibleScaleType = importExportVisibleScaleType(source.visibleScaleType, ctx)
    return ret
}
/* export format nameing scheme */
export function importExportFormatNameingScheme(source: types.ExportFormatNameingScheme, ctx?: IImportContext): impl.ExportFormatNameingScheme {
    return source
}
/* export file format */
export function importExportFileFormat(source: types.ExportFileFormat, ctx?: IImportContext): impl.ExportFileFormat {
    return source
}
/* ellipse attributes */
export function importEllipse(source: types.Ellipse, ctx?: IImportContext): impl.Ellipse {
    const ret: impl.Ellipse = new impl.Ellipse (
        source.cx,
        source.cy,
        source.rx,
        source.ry
    )
    return ret
}
/* document syms */
export function importDocumentSyms(source: types.DocumentSyms, ctx?: IImportContext): impl.DocumentSyms {
    const ret: impl.DocumentSyms = new impl.DocumentSyms (
        source.pageId,
        (() => {
            const ret = new BasicArray<string>()
            for (let i = 0, len = source.symbols && source.symbols.length; i < len; i++) {
                const r = source.symbols[i]
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    return ret
}
/* document meta */
export function importDocumentMeta(source: types.DocumentMeta, ctx?: IImportContext): impl.DocumentMeta {
    const ret: impl.DocumentMeta = new impl.DocumentMeta (
        source.id,
        source.name,
        (() => {
            const ret = new BasicArray<impl.PageListItem>()
            for (let i = 0, len = source.pagesList && source.pagesList.length; i < len; i++) {
                const r = importPageListItem(source.pagesList[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.lastCmdId
    )
    return ret
}
/* curve point */
export function importCurvePoint(source: types.CurvePoint, ctx?: IImportContext): impl.CurvePoint {
    const ret: impl.CurvePoint = new impl.CurvePoint (
        source.id,
        source.cornerRadius,
        importPoint2D(source.curveFrom, ctx),
        importPoint2D(source.curveTo, ctx),
        source.hasCurveFrom,
        source.hasCurveTo,
        importCurveMode(source.curveMode, ctx),
        importPoint2D(source.point, ctx)
    )
    return ret
}
/* curve mode */
export function importCurveMode(source: types.CurveMode, ctx?: IImportContext): impl.CurveMode {
    return source
}
/* context settings */
export function importContextSettings(source: types.ContextSettings, ctx?: IImportContext): impl.ContextSettings {
    const ret: impl.ContextSettings = new impl.ContextSettings (
        importBlendMode(source.blenMode, ctx),
        source.opacity
    )
    return ret
}
/* comment */
export function importComment(source: types.Comment, ctx?: IImportContext): impl.Comment {
    const ret: impl.Comment = new impl.Comment (
        source.pageId,
        source.id,
        importShapeFrame(source.frame, ctx),
        importUserInfo(source.user, ctx),
        source.createAt,
        source.content,
        importShape(source.parasiticBody, ctx)
    )
    if (source.parentId !== undefined) ret.parentId = source.parentId
    if (source.rootId !== undefined) ret.rootId = source.rootId
    return ret
}
/* color */
export function importColor(source: types.Color, ctx?: IImportContext): impl.Color {
    const ret: impl.Color = new impl.Color (
        source.alpha,
        source.red,
        source.green,
        source.blue
    )
    return ret
}
/* color controls */
export function importColorControls(source: types.ColorControls, ctx?: IImportContext): impl.ColorControls {
    const ret: impl.ColorControls = new impl.ColorControls (
        source.isEnabled,
        source.brightness,
        source.contrast,
        source.hue,
        source.saturation
    )
    return ret
}
/* bullet numbers */
export function importBulletNumbers(source: types.BulletNumbers, ctx?: IImportContext): impl.BulletNumbers {
    const ret: impl.BulletNumbers = new impl.BulletNumbers (
        importBulletNumbersType(source.type, ctx)
    )
    if (source.behavior !== undefined) ret.behavior = importBulletNumbersBehavior(source.behavior, ctx)
    if (source.offset !== undefined) ret.offset = source.offset
    return ret
}
/* bullet & item number types */
export function importBulletNumbersType(source: types.BulletNumbersType, ctx?: IImportContext): impl.BulletNumbersType {
    return source
}
/* bullet & item number behavior */
export function importBulletNumbersBehavior(source: types.BulletNumbersBehavior, ctx?: IImportContext): impl.BulletNumbersBehavior {
    return source
}
/* border */
export function importBorder(source: types.Border, ctx?: IImportContext): impl.Border {
    const ret: impl.Border = new impl.Border (
        source.id,
        source.isEnabled,
        importFillType(source.fillType, ctx),
        importColor(source.color, ctx),
        importBorderPosition(source.position, ctx),
        source.thickness,
        importBorderStyle(source.borderStyle, ctx)
    )
    if (source.contextSettings !== undefined) ret.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.gradient !== undefined) ret.gradient = importGradient(source.gradient, ctx)
    return ret
}
/* border style */
export function importBorderStyle(source: types.BorderStyle, ctx?: IImportContext): impl.BorderStyle {
    const ret: impl.BorderStyle = new impl.BorderStyle (
        source.length,
        source.gap
    )
    return ret
}
/* border position */
export function importBorderPosition(source: types.BorderPosition, ctx?: IImportContext): impl.BorderPosition {
    return source
}
/* border options */
export function importBorderOptions(source: types.BorderOptions, ctx?: IImportContext): impl.BorderOptions {
    const ret: impl.BorderOptions = new impl.BorderOptions (
        source.isEnabled,
        importLineCapStyle(source.lineCapStyle, ctx),
        importLineJoinStyle(source.lineJoinStyle, ctx)
    )
    return ret
}
/* bool op types */
export function importBoolOp(source: types.BoolOp, ctx?: IImportContext): impl.BoolOp {
    return source
}
/* blur */
export function importBlur(source: types.Blur, ctx?: IImportContext): impl.Blur {
    const ret: impl.Blur = new impl.Blur (
        source.isEnabled,
        importPoint2D(source.center, ctx),
        source.saturation,
        importBlurType(source.type, ctx)
    )
    if (source.motionAngle !== undefined) ret.motionAngle = source.motionAngle
    if (source.radius !== undefined) ret.radius = source.radius
    return ret
}
/* blur types */
export function importBlurType(source: types.BlurType, ctx?: IImportContext): impl.BlurType {
    return source
}
/* blend mode */
export function importBlendMode(source: types.BlendMode, ctx?: IImportContext): impl.BlendMode {
    return source
}
/* text shape */
export function importTextShape(source: types.TextShape, ctx?: IImportContext): impl.TextShape {
    const ret: impl.TextShape = new impl.TextShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importText(source.text, ctx)
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    return ret
}
/* table shape */
export function importTableShape(source: types.TableShape, ctx?: IImportContext): impl.TableShape {
    // inject code
    // 兼容旧数据
    if ((source as any).childs) source.datas = (source as any).childs;
    const ret: impl.TableShape = new impl.TableShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<(undefined | impl.TableCell)>()
            for (let i = 0, len = source.datas && source.datas.length; i < len; i++) {
                const r = (() => {
                    const val = source.datas[i]
                    if (!val) {
                        return val ?? undefined
                    }
                    if (val.typeId == 'table-cell') {
                        return importTableCell(val as types.TableCell, ctx)
                    }
                    {
                        throw new Error('unknow val: ' + val)
                    }
                })()
                ret.push(r)
            }
            return ret
        })(),
        (() => {
            const ret = new BasicArray<number>()
            for (let i = 0, len = source.rowHeights && source.rowHeights.length; i < len; i++) {
                const r = source.rowHeights[i]
                if (r) ret.push(r)
            }
            return ret
        })(),
        (() => {
            const ret = new BasicArray<number>()
            for (let i = 0, len = source.colWidths && source.colWidths.length; i < len; i++) {
                const r = source.colWidths[i]
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.textAttr !== undefined) ret.textAttr = importTextAttr(source.textAttr, ctx)
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
    return ret
}
/* table cell */
export function importTableCell(source: types.TableCell, ctx?: IImportContext): impl.TableCell {
    const ret: impl.TableCell = new impl.TableCell (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx)
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.cellType !== undefined) ret.cellType = importTableCellType(source.cellType, ctx)
    if (source.text !== undefined) ret.text = importText(source.text, ctx)
    if (source.imageRef !== undefined) ret.imageRef = source.imageRef
    if (source.rowSpan !== undefined) ret.rowSpan = source.rowSpan
    if (source.colSpan !== undefined) ret.colSpan = source.colSpan
    return ret
}
/* symbol ref shape */
export function importSymbolRefShape(source: types.SymbolRefShape, ctx?: IImportContext): impl.SymbolRefShape {
    const ret: impl.SymbolRefShape = new impl.SymbolRefShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        source.refId,
        (() => {
            const ret = new BasicArray<impl.OverrideShape>()
            for (let i = 0, len = source.overrides && source.overrides.length; i < len; i++) {
                const r = importOverrideShape(source.overrides[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    // inject code
    if (ctx?.document) ret.setSymbolMgr(ctx.document.symbolsMgr);
    return ret
}
/* span attr */
export function importSpan(source: types.Span, ctx?: IImportContext): impl.Span {
    const ret: impl.Span = new impl.Span (
        source.length
    )
    if (source.fontName !== undefined) ret.fontName = source.fontName
    if (source.fontSize !== undefined) ret.fontSize = source.fontSize
    if (source.color !== undefined) ret.color = importColor(source.color, ctx)
    if (source.strikethrough !== undefined) ret.strikethrough = importStrikethroughType(source.strikethrough, ctx)
    if (source.underline !== undefined) ret.underline = importUnderlineType(source.underline, ctx)
    if (source.bold !== undefined) ret.bold = source.bold
    if (source.italic !== undefined) ret.italic = source.italic
    if (source.bulletNumbers !== undefined) ret.bulletNumbers = importBulletNumbers(source.bulletNumbers, ctx)
    if (source.highlight !== undefined) ret.highlight = importColor(source.highlight, ctx)
    if (source.kerning !== undefined) ret.kerning = source.kerning
    if (source.transform !== undefined) ret.transform = importTextTransformType(source.transform, ctx)
    if (source.placeholder !== undefined) ret.placeholder = source.placeholder
    return ret
}
/* path shape */
export function importPathShape2(source: types.PathShape2, ctx?: IImportContext): impl.PathShape2 {
    const ret: impl.PathShape2 = new impl.PathShape2 (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<impl.PathSegment>()
            for (let i = 0, len = source.pathsegs && source.pathsegs.length; i < len; i++) {
                const r = importPathSegment(source.pathsegs[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    return ret
}
/* path shape */
export function importPathShape(source: types.PathShape, ctx?: IImportContext): impl.PathShape {
    const ret: impl.PathShape = new impl.PathShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points && source.points.length; i < len; i++) {
                const r = importCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.isClosed
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    return ret
}
/* rect shape */
export function importRectShape(source: types.RectShape, ctx?: IImportContext): impl.RectShape {
    const ret: impl.RectShape = new impl.RectShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points && source.points.length; i < len; i++) {
                const r = importCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.isClosed
    )
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    return ret
}
/* span attr */
export function importParaAttr(source: types.ParaAttr, ctx?: IImportContext): impl.ParaAttr {
    const ret: impl.ParaAttr = new impl.ParaAttr (
    )
    if (source.fontName !== undefined) ret.fontName = source.fontName
    if (source.fontSize !== undefined) ret.fontSize = source.fontSize
    if (source.color !== undefined) ret.color = importColor(source.color, ctx)
    if (source.strikethrough !== undefined) ret.strikethrough = importStrikethroughType(source.strikethrough, ctx)
    if (source.underline !== undefined) ret.underline = importUnderlineType(source.underline, ctx)
    if (source.bold !== undefined) ret.bold = source.bold
    if (source.italic !== undefined) ret.italic = source.italic
    if (source.bulletNumbers !== undefined) ret.bulletNumbers = importBulletNumbers(source.bulletNumbers, ctx)
    if (source.highlight !== undefined) ret.highlight = importColor(source.highlight, ctx)
    if (source.kerning !== undefined) ret.kerning = source.kerning
    if (source.transform !== undefined) ret.transform = importTextTransformType(source.transform, ctx)
    if (source.placeholder !== undefined) ret.placeholder = source.placeholder
    if (source.alignment !== undefined) ret.alignment = importTextHorAlign(source.alignment, ctx)
    if (source.paraSpacing !== undefined) ret.paraSpacing = source.paraSpacing
    if (source.minimumLineHeight !== undefined) ret.minimumLineHeight = source.minimumLineHeight
    if (source.maximumLineHeight !== undefined) ret.maximumLineHeight = source.maximumLineHeight
    if (source.indent !== undefined) ret.indent = source.indent
    return ret
}
/* text attr */
export function importTextAttr(source: types.TextAttr, ctx?: IImportContext): impl.TextAttr {
    const ret: impl.TextAttr = new impl.TextAttr (
    )
    if (source.alignment !== undefined) ret.alignment = importTextHorAlign(source.alignment, ctx)
    if (source.paraSpacing !== undefined) ret.paraSpacing = source.paraSpacing
    if (source.minimumLineHeight !== undefined) ret.minimumLineHeight = source.minimumLineHeight
    if (source.maximumLineHeight !== undefined) ret.maximumLineHeight = source.maximumLineHeight
    if (source.indent !== undefined) ret.indent = source.indent
    if (source.fontName !== undefined) ret.fontName = source.fontName
    if (source.fontSize !== undefined) ret.fontSize = source.fontSize
    if (source.color !== undefined) ret.color = importColor(source.color, ctx)
    if (source.strikethrough !== undefined) ret.strikethrough = importStrikethroughType(source.strikethrough, ctx)
    if (source.underline !== undefined) ret.underline = importUnderlineType(source.underline, ctx)
    if (source.bold !== undefined) ret.bold = source.bold
    if (source.italic !== undefined) ret.italic = source.italic
    if (source.bulletNumbers !== undefined) ret.bulletNumbers = importBulletNumbers(source.bulletNumbers, ctx)
    if (source.highlight !== undefined) ret.highlight = importColor(source.highlight, ctx)
    if (source.kerning !== undefined) ret.kerning = source.kerning
    if (source.transform !== undefined) ret.transform = importTextTransformType(source.transform, ctx)
    if (source.placeholder !== undefined) ret.placeholder = source.placeholder
    if (source.verAlign !== undefined) ret.verAlign = importTextVerAlign(source.verAlign, ctx)
    if (source.orientation !== undefined) ret.orientation = importTextOrientation(source.orientation, ctx)
    if (source.textBehaviour !== undefined) ret.textBehaviour = importTextBehaviour(source.textBehaviour, ctx)
    if (source.padding !== undefined) ret.padding = importPadding(source.padding, ctx)
    return ret
}
/* page */
export function importPage(source: types.Page, ctx?: IImportContext): impl.Page {
    const ret: impl.Page = new impl.Page (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<(impl.Shape | impl.FlattenShape | impl.GroupShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape | impl.OvalShape | impl.LineShape | impl.Artboard | impl.LineShape | impl.OvalShape | impl.TableShape | impl.SymbolShape)>()
            for (let i = 0, len = source.childs && source.childs.length; i < len; i++) {
                const r = (() => {
                    const val = source.childs[i]
                    if (val.typeId == 'shape') {
                        return importShape(val as types.Shape, ctx)
                    }
                    if (val.typeId == 'flatten-shape') {
                        return importFlattenShape(val as types.FlattenShape, ctx)
                    }
                    if (val.typeId == 'group-shape') {
                        return importGroupShape(val as types.GroupShape, ctx)
                    }
                    if (val.typeId == 'image-shape') {
                        return importImageShape(val as types.ImageShape, ctx)
                    }
                    if (val.typeId == 'path-shape') {
                        return importPathShape(val as types.PathShape, ctx)
                    }
                    if (val.typeId == 'rect-shape') {
                        return importRectShape(val as types.RectShape, ctx)
                    }
                    if (val.typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(val as types.SymbolRefShape, ctx)
                    }
                    if (val.typeId == 'text-shape') {
                        return importTextShape(val as types.TextShape, ctx)
                    }
                    if (val.typeId == 'oval-shape') {
                        return importOvalShape(val as types.OvalShape, ctx)
                    }
                    if (val.typeId == 'line-shape') {
                        return importLineShape(val as types.LineShape, ctx)
                    }
                    if (val.typeId == 'artboard') {
                        return importArtboard(val as types.Artboard, ctx)
                    }
                    if (val.typeId == 'line-shape') {
                        return importLineShape(val as types.LineShape, ctx)
                    }
                    if (val.typeId == 'oval-shape') {
                        return importOvalShape(val as types.OvalShape, ctx)
                    }
                    if (val.typeId == 'table-shape') {
                        return importTableShape(val as types.TableShape, ctx)
                    }
                    if (val.typeId == 'symbol-shape') {
                        return importSymbolShape(val as types.SymbolShape, ctx)
                    }
                    {
                        throw new Error('unknow val: ' + val)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    return ret
}
/* override shape */
export function importOverrideShape(source: types.OverrideShape, ctx?: IImportContext): impl.OverrideShape {
    const ret: impl.OverrideShape = new impl.OverrideShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        source.refId
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.override_stringValue !== undefined) ret.override_stringValue = source.override_stringValue
    if (source.override_text !== undefined) ret.override_text = source.override_text
    if (source.override_image !== undefined) ret.override_image = source.override_image
    if (source.stringValue !== undefined) ret.stringValue = source.stringValue
    if (source.text !== undefined) ret.text = importText(source.text, ctx)
    if (source.imageRef !== undefined) ret.imageRef = source.imageRef
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
    return ret
}
/* oval shape */
export function importOvalShape(source: types.OvalShape, ctx?: IImportContext): impl.OvalShape {
    const ret: impl.OvalShape = new impl.OvalShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points && source.points.length; i < len; i++) {
                const r = importCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.isClosed,
        importEllipse(source.ellipse, ctx)
    )
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    return ret
}
/* line shape */
export function importLineShape(source: types.LineShape, ctx?: IImportContext): impl.LineShape {
    const ret: impl.LineShape = new impl.LineShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points && source.points.length; i < len; i++) {
                const r = importCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.isClosed
    )
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    return ret
}
/* image shape */
export function importImageShape(source: types.ImageShape, ctx?: IImportContext): impl.ImageShape {
    // inject code
    if (!source.points || source.points.length === 0) { // 兼容旧数据
        if (!source.points) source.points = [];
        // 需要用固定的，这样如果不同用户同时打开此文档，对points做的操作，对应的point id也是对的
        const id1 = "b259921b-4eba-461d-afc3-c4c58c1fa337"
        const id2 = "62ea3ee3-3378-4602-a918-7e05f426bb8e"
        const id3 = "1519da3c-c692-4e1d-beb4-01a85cc56738"
        const id4 = "e857f541-4e7f-491b-96e6-2ca38f1d4c09"
        const p1: types.CurvePoint = {
            id: id1,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 0, y: 0 }
        }; // lt
        const p2: types.CurvePoint =
        {
            id: id2,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 1, y: 0 }
        }; // rt
        const p3: types.CurvePoint = {
            id: id3,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 1, y: 1 }
        }; // rb
        const p4: types.CurvePoint = {
            id: id4,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 0, y: 1 }
        }; // lb
        source.points.push(p1, p2, p3, p4);
    }
    const ret: impl.ImageShape = new impl.ImageShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<impl.CurvePoint>()
            for (let i = 0, len = source.points && source.points.length; i < len; i++) {
                const r = importCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        source.isClosed,
        source.imageRef
    )
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
    return ret
}
/* group shape */
export function importGroupShape(source: types.GroupShape, ctx?: IImportContext): impl.GroupShape {
    const ret: impl.GroupShape = new impl.GroupShape (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<(impl.GroupShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape | impl.Artboard | impl.LineShape | impl.OvalShape | impl.TableShape | impl.Shape | impl.FlattenShape)>()
            for (let i = 0, len = source.childs && source.childs.length; i < len; i++) {
                const r = (() => {
                    const val = source.childs[i]
                    if (val.typeId == 'group-shape') {
                        return importGroupShape(val as types.GroupShape, ctx)
                    }
                    if (val.typeId == 'image-shape') {
                        return importImageShape(val as types.ImageShape, ctx)
                    }
                    if (val.typeId == 'path-shape') {
                        return importPathShape(val as types.PathShape, ctx)
                    }
                    if (val.typeId == 'rect-shape') {
                        return importRectShape(val as types.RectShape, ctx)
                    }
                    if (val.typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(val as types.SymbolRefShape, ctx)
                    }
                    if (val.typeId == 'text-shape') {
                        return importTextShape(val as types.TextShape, ctx)
                    }
                    if (val.typeId == 'artboard') {
                        return importArtboard(val as types.Artboard, ctx)
                    }
                    if (val.typeId == 'line-shape') {
                        return importLineShape(val as types.LineShape, ctx)
                    }
                    if (val.typeId == 'oval-shape') {
                        return importOvalShape(val as types.OvalShape, ctx)
                    }
                    if (val.typeId == 'table-shape') {
                        return importTableShape(val as types.TableShape, ctx)
                    }
                    if (val.typeId == 'shape') {
                        return importShape(val as types.Shape, ctx)
                    }
                    if (val.typeId == 'flatten-shape') {
                        return importFlattenShape(val as types.FlattenShape, ctx)
                    }
                    {
                        throw new Error('unknow val: ' + val)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.isBoolOpShape !== undefined) ret.isBoolOpShape = source.isBoolOpShape
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    if (source.isUsedToBeSymbol !== undefined) ret.isUsedToBeSymbol = source.isUsedToBeSymbol
    if (source.isSymbolShape !== undefined) ret.isSymbolShape = source.isSymbolShape
    // inject code
    ret.type = types.ShapeType.Group;
    if (ctx?.document && ret.isUsedToBeSymbol) ctx.document.symbolsMgr.add(ret.id, ret);
    return ret
}
/* symbol shape */
export function importSymbolShape(source: types.SymbolShape, ctx?: IImportContext): impl.SymbolShape {
    // inject code
    const ret = importGroupShape(source, ctx);
    ret.isUsedToBeSymbol = true;
    ret.isSymbolShape = true;
    ret.type = types.ShapeType.Group;
    if (ctx?.document) ctx.document.symbolsMgr.add(ret.id, ret);
    return ret;
}
/* flatten shape */
export function importFlattenShape(source: types.FlattenShape, ctx?: IImportContext): impl.FlattenShape {
    // inject code
    const ret = importGroupShape(source, ctx);
    ret.isBoolOpShape = true;
    ret.type = types.ShapeType.Group;
    return ret;
}
/* artboard shape */
export function importArtboard(source: types.Artboard, ctx?: IImportContext): impl.Artboard {
    const ret: impl.Artboard = new impl.Artboard (
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicArray<(impl.GroupShape | impl.ImageShape | impl.PathShape | impl.RectShape | impl.SymbolRefShape | impl.TextShape | impl.Artboard | impl.LineShape | impl.OvalShape | impl.TableShape | impl.Shape | impl.FlattenShape)>()
            for (let i = 0, len = source.childs && source.childs.length; i < len; i++) {
                const r = (() => {
                    const val = source.childs[i]
                    if (val.typeId == 'group-shape') {
                        return importGroupShape(val as types.GroupShape, ctx)
                    }
                    if (val.typeId == 'image-shape') {
                        return importImageShape(val as types.ImageShape, ctx)
                    }
                    if (val.typeId == 'path-shape') {
                        return importPathShape(val as types.PathShape, ctx)
                    }
                    if (val.typeId == 'rect-shape') {
                        return importRectShape(val as types.RectShape, ctx)
                    }
                    if (val.typeId == 'symbol-ref-shape') {
                        return importSymbolRefShape(val as types.SymbolRefShape, ctx)
                    }
                    if (val.typeId == 'text-shape') {
                        return importTextShape(val as types.TextShape, ctx)
                    }
                    if (val.typeId == 'artboard') {
                        return importArtboard(val as types.Artboard, ctx)
                    }
                    if (val.typeId == 'line-shape') {
                        return importLineShape(val as types.LineShape, ctx)
                    }
                    if (val.typeId == 'oval-shape') {
                        return importOvalShape(val as types.OvalShape, ctx)
                    }
                    if (val.typeId == 'table-shape') {
                        return importTableShape(val as types.TableShape, ctx)
                    }
                    if (val.typeId == 'shape') {
                        return importShape(val as types.Shape, ctx)
                    }
                    if (val.typeId == 'flatten-shape') {
                        return importFlattenShape(val as types.FlattenShape, ctx)
                    }
                    {
                        throw new Error('unknow val: ' + val)
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })()
    )
    if (source.isBoolOpShape !== undefined) ret.isBoolOpShape = source.isBoolOpShape
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    if (source.isUsedToBeSymbol !== undefined) ret.isUsedToBeSymbol = source.isUsedToBeSymbol
    if (source.isSymbolShape !== undefined) ret.isSymbolShape = source.isSymbolShape
    if (source.boolOp !== undefined) ret.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal !== undefined) ret.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical !== undefined) ret.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked !== undefined) ret.isLocked = source.isLocked
    if (source.isVisible !== undefined) ret.isVisible = source.isVisible
    if (source.exportOptions !== undefined) ret.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) ret.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    // inject code
    if (ctx?.document) ctx.document.artboardMgr.add(ret.id, ret);
    return ret
}
