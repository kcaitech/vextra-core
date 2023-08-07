/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

import * as adaptor from "./exportadaptor"
import * as types from "../data/typesdefine"


export interface IExportContext {
    symbols?:Set<string>
    medias?:Set<string>
}
/* winding rule */
export function exportWindingRule(source: types.WindingRule, ctx?: IExportContext): types.WindingRule {
    return source
}
/* user infomation */
export function exportUserInfo(source: types.UserInfo, ctx?: IExportContext): types.UserInfo {
    const ret = {
        userId: source.userId,
        userNickname: source.userNickname,
        avatar: source.avatar,
    }
    return ret
}
/* underline types */
export function exportUnderlineType(source: types.UnderlineType, ctx?: IExportContext): types.UnderlineType {
    return source
}
/* text */
export function exportText(source: types.Text, ctx?: IExportContext): types.Text {
    const ret = {
        paras: (() => {
            const ret = []
            for (let i = 0, len = source.paras.length; i < len; i++) {
                const r = (adaptor.exportPara || exportPara)(source.paras[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        attr: source.attr && (adaptor.exportTextAttr || exportTextAttr)(source.attr, ctx),
    }
    return ret
}
/* text vertical alignment */
export function exportTextVerAlign(source: types.TextVerAlign, ctx?: IExportContext): types.TextVerAlign {
    return source
}
/* text transform types */
export function exportTextTransformType(source: types.TextTransformType, ctx?: IExportContext): types.TextTransformType {
    return source
}
/* text orientation */
export function exportTextOrientation(source: types.TextOrientation, ctx?: IExportContext): types.TextOrientation {
    return source
}
/* text horizontal alignment */
export function exportTextHorAlign(source: types.TextHorAlign, ctx?: IExportContext): types.TextHorAlign {
    return source
}
/* text behaviour */
export function exportTextBehaviour(source: types.TextBehaviour, ctx?: IExportContext): types.TextBehaviour {
    return source
}
/* table cell types */
export function exportTableCellType(source: types.TableCellType, ctx?: IExportContext): types.TableCellType {
    return source
}
/* style */
export function exportStyle(source: types.Style, ctx?: IExportContext): types.Style {
    const ret = {
        typeId: source.typeId,
        miterLimit: source.miterLimit,
        windingRule: source.windingRule && (adaptor.exportWindingRule || exportWindingRule)(source.windingRule, ctx),
        blur: source.blur && (adaptor.exportBlur || exportBlur)(source.blur, ctx),
        borderOptions: source.borderOptions && (adaptor.exportBorderOptions || exportBorderOptions)(source.borderOptions, ctx),
        borders: (() => {
            const ret = []
            for (let i = 0, len = source.borders.length; i < len; i++) {
                const r = (adaptor.exportBorder || exportBorder)(source.borders[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        colorControls: source.colorControls && (adaptor.exportColorControls || exportColorControls)(source.colorControls, ctx),
        contextSettings: source.contextSettings && (adaptor.exportContextSettings || exportContextSettings)(source.contextSettings, ctx),
        fills: (() => {
            const ret = []
            for (let i = 0, len = source.fills.length; i < len; i++) {
                const r = (adaptor.exportFill || exportFill)(source.fills[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        innerShadows: source.innerShadows && (() => {
            const ret = []
            for (let i = 0, len = source.innerShadows.length; i < len; i++) {
                const r = (adaptor.exportShadow || exportShadow)(source.innerShadows[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        shadows: source.shadows && (() => {
            const ret = []
            for (let i = 0, len = source.shadows.length; i < len; i++) {
                const r = (adaptor.exportShadow || exportShadow)(source.shadows[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    return ret
}
/* strikethrough types */
export function exportStrikethroughType(source: types.StrikethroughType, ctx?: IExportContext): types.StrikethroughType {
    return source
}
/* stop */
export function exportStop(source: types.Stop, ctx?: IExportContext): types.Stop {
    const ret = {
        position: source.position,
        color: source.color && (adaptor.exportColor || exportColor)(source.color, ctx),
    }
    return ret
}
/* span attr */
export function exportSpanAttr(source: types.SpanAttr, ctx?: IExportContext): types.SpanAttr {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && (adaptor.exportColor || exportColor)(source.color, ctx),
        strikethrough: source.strikethrough && (adaptor.exportStrikethroughType || exportStrikethroughType)(source.strikethrough, ctx),
        underline: source.underline && (adaptor.exportUnderlineType || exportUnderlineType)(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && (adaptor.exportBulletNumbers || exportBulletNumbers)(source.bulletNumbers, ctx),
        highlight: source.highlight && (adaptor.exportColor || exportColor)(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && (adaptor.exportTextTransformType || exportTextTransformType)(source.transform, ctx),
        placeholder: source.placeholder,
    }
    return ret
}
/* shape */
export function exportShape(source: types.Shape, ctx?: IExportContext): types.Shape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        name: source.name,
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    return ret
}
/* shape types */
export function exportShapeType(source: types.ShapeType, ctx?: IExportContext): types.ShapeType {
    return source
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export function exportShapeFrame(source: types.ShapeFrame, ctx?: IExportContext): types.ShapeFrame {
    const ret = {
        x: source.x,
        y: source.y,
        width: source.width,
        height: source.height,
    }
    return ret
}
/* shadow */
export function exportShadow(source: types.Shadow, ctx?: IExportContext): types.Shadow {
    const ret = {
        isEnabled: source.isEnabled,
        blurRadius: source.blurRadius,
        color: (adaptor.exportColor || exportColor)(source.color, ctx),
        contextSettings: source.contextSettings && (adaptor.exportGraphicsContextSettings || exportGraphicsContextSettings)(source.contextSettings, ctx),
        offsetX: source.offsetX,
        offsetY: source.offsetY,
        spread: source.spread,
    }
    return ret
}
/* resize type */
export function exportResizeType(source: types.ResizeType, ctx?: IExportContext): types.ResizeType {
    return source
}
/* point 2d */
export function exportPoint2D(source: types.Point2D, ctx?: IExportContext): types.Point2D {
    const ret = {
        x: source.x,
        y: source.y,
    }
    return ret
}
/* path segment */
export function exportPathSegment(source: types.PathSegment, ctx?: IExportContext): types.PathSegment {
    const ret = {
        points: (() => {
            const ret = []
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = (adaptor.exportCurvePoint || exportCurvePoint)(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        isClosed: source.isClosed,
    }
    return ret
}
/* para */
export function exportPara(source: types.Para, ctx?: IExportContext): types.Para {
    const ret = {
        text: source.text,
        spans: (() => {
            const ret = []
            for (let i = 0, len = source.spans.length; i < len; i++) {
                const r = (adaptor.exportSpan || exportSpan)(source.spans[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        attr: source.attr && (adaptor.exportParaAttr || exportParaAttr)(source.attr, ctx),
    }
    return ret
}
/* page list item */
export function exportPageListItem(source: types.PageListItem, ctx?: IExportContext): types.PageListItem {
    const ret = {
        id: source.id,
        name: source.name,
        versionId: source.versionId,
    }
    return ret
}
/* override list item */
export function exportOverrideItem(source: types.OverrideItem, ctx?: IExportContext): types.OverrideItem {
    const ret = {
        id: source.id,
        value: (() => {
            if (typeof source.value != 'object') {
                return source.value
            }
            if (source.value.typeId == 'style') {
                return (adaptor.exportStyle || exportStyle)(source.value as types.Style, ctx)
            }
            {
                console.error(source.value)
            }
        })(),
    }
    return ret
}
/* marker type */
export function exportMarkerType(source: types.MarkerType, ctx?: IExportContext): types.MarkerType {
    return source
}
/* line join style */
export function exportLineJoinStyle(source: types.LineJoinStyle, ctx?: IExportContext): types.LineJoinStyle {
    return source
}
/* line cap style */
export function exportLineCapStyle(source: types.LineCapStyle, ctx?: IExportContext): types.LineCapStyle {
    return source
}
/* graphics contex settings */
export function exportGraphicsContextSettings(source: types.GraphicsContextSettings, ctx?: IExportContext): types.GraphicsContextSettings {
    const ret = {
        blendMode: (adaptor.exportBlendMode || exportBlendMode)(source.blendMode, ctx),
        opacity: source.opacity,
    }
    return ret
}
/* gradient */
export function exportGradient(source: types.Gradient, ctx?: IExportContext): types.Gradient {
    const ret = {
        elipseLength: source.elipseLength,
        from: (adaptor.exportPoint2D || exportPoint2D)(source.from, ctx),
        to: (adaptor.exportPoint2D || exportPoint2D)(source.to, ctx),
        stops: (() => {
            const ret = []
            for (let i = 0, len = source.stops.length; i < len; i++) {
                const r = (adaptor.exportStop || exportStop)(source.stops[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        gradientType: (adaptor.exportGradientType || exportGradientType)(source.gradientType, ctx),
    }
    return ret
}
/* gradient type */
export function exportGradientType(source: types.GradientType, ctx?: IExportContext): types.GradientType {
    return source
}
/* fill */
export function exportFill(source: types.Fill, ctx?: IExportContext): types.Fill {
    const ret = {
        id: source.id,
        isEnabled: source.isEnabled,
        fillType: (adaptor.exportFillType || exportFillType)(source.fillType, ctx),
        color: (adaptor.exportColor || exportColor)(source.color, ctx),
        contextSettings: source.contextSettings && (adaptor.exportContextSettings || exportContextSettings)(source.contextSettings, ctx),
        gradient: source.gradient && (adaptor.exportGradient || exportGradient)(source.gradient, ctx),
        imageRef: source.imageRef,
    }
    return ret
}
/* fill types */
export function exportFillType(source: types.FillType, ctx?: IExportContext): types.FillType {
    return source
}
/* visible scale type */
export function exportExportVisibleScaleType(source: types.ExportVisibleScaleType, ctx?: IExportContext): types.ExportVisibleScaleType {
    return source
}
/* export options */
export function exportExportOptions(source: types.ExportOptions, ctx?: IExportContext): types.ExportOptions {
    const ret = {
        exportFormats: (() => {
            const ret = []
            for (let i = 0, len = source.exportFormats.length; i < len; i++) {
                const r = (adaptor.exportExportFormat || exportExportFormat)(source.exportFormats[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        includedChildIds: (() => {
            const ret = []
            for (let i = 0, len = source.includedChildIds.length; i < len; i++) {
                const r = source.includedChildIds[i]
                if (r) ret.push(r)
            }
            return ret
        })(),
        childOptions: source.childOptions,
        shouldTrim: source.shouldTrim,
    }
    return ret
}
/* export format */
export function exportExportFormat(source: types.ExportFormat, ctx?: IExportContext): types.ExportFormat {
    const ret = {
        absoluteSize: source.absoluteSize,
        fileFormat: source.fileFormat && (adaptor.exportExportFileFormat || exportExportFileFormat)(source.fileFormat, ctx),
        name: source.name,
        namingScheme: source.namingScheme && (adaptor.exportExportFormatNameingScheme || exportExportFormatNameingScheme)(source.namingScheme, ctx),
        scale: source.scale,
        visibleScaleType: source.visibleScaleType && (adaptor.exportExportVisibleScaleType || exportExportVisibleScaleType)(source.visibleScaleType, ctx),
    }
    return ret
}
/* export format nameing scheme */
export function exportExportFormatNameingScheme(source: types.ExportFormatNameingScheme, ctx?: IExportContext): types.ExportFormatNameingScheme {
    return source
}
/* export file format */
export function exportExportFileFormat(source: types.ExportFileFormat, ctx?: IExportContext): types.ExportFileFormat {
    return source
}
/* ellipse attributes */
export function exportEllipse(source: types.Ellipse, ctx?: IExportContext): types.Ellipse {
    const ret = {
        cx: source.cx,
        cy: source.cy,
        rx: source.rx,
        ry: source.ry,
    }
    return ret
}
/* document syms */
export function exportDocumentSyms(source: types.DocumentSyms, ctx?: IExportContext): types.DocumentSyms {
    const ret = {
        pageId: source.pageId,
        symbols: (() => {
            const ret = []
            for (let i = 0, len = source.symbols.length; i < len; i++) {
                const r = source.symbols[i]
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    return ret
}
/* document meta */
export function exportDocumentMeta(source: types.DocumentMeta, ctx?: IExportContext): types.DocumentMeta {
    const ret = {
        id: source.id,
        name: source.name,
        pagesList: (() => {
            const ret = []
            for (let i = 0, len = source.pagesList.length; i < len; i++) {
                const r = (adaptor.exportPageListItem || exportPageListItem)(source.pagesList[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        lastCmdId: source.lastCmdId,
    }
    return ret
}
/* curve point */
export function exportCurvePoint(source: types.CurvePoint, ctx?: IExportContext): types.CurvePoint {
    const ret = {
        id: source.id,
        cornerRadius: source.cornerRadius,
        curveFrom: (adaptor.exportPoint2D || exportPoint2D)(source.curveFrom, ctx),
        curveTo: (adaptor.exportPoint2D || exportPoint2D)(source.curveTo, ctx),
        hasCurveFrom: source.hasCurveFrom,
        hasCurveTo: source.hasCurveTo,
        curveMode: (adaptor.exportCurveMode || exportCurveMode)(source.curveMode, ctx),
        point: (adaptor.exportPoint2D || exportPoint2D)(source.point, ctx),
    }
    return ret
}
/* curve mode */
export function exportCurveMode(source: types.CurveMode, ctx?: IExportContext): types.CurveMode {
    return source
}
/* context settings */
export function exportContextSettings(source: types.ContextSettings, ctx?: IExportContext): types.ContextSettings {
    const ret = {
        blenMode: (adaptor.exportBlendMode || exportBlendMode)(source.blenMode, ctx),
        opacity: source.opacity,
    }
    return ret
}
/* comment */
export function exportComment(source: types.Comment, ctx?: IExportContext): types.Comment {
    const ret = {
        pageId: source.pageId,
        id: source.id,
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        user: (adaptor.exportUserInfo || exportUserInfo)(source.user, ctx),
        createAt: source.createAt,
        content: source.content,
        parasiticBody: (adaptor.exportShape || exportShape)(source.parasiticBody, ctx),
        parentId: source.parentId,
        rootId: source.rootId,
    }
    return ret
}
/* color */
export function exportColor(source: types.Color, ctx?: IExportContext): types.Color {
    const ret = {
        alpha: source.alpha,
        red: source.red,
        green: source.green,
        blue: source.blue,
    }
    return ret
}
/* color controls */
export function exportColorControls(source: types.ColorControls, ctx?: IExportContext): types.ColorControls {
    const ret = {
        isEnabled: source.isEnabled,
        brightness: source.brightness,
        contrast: source.contrast,
        hue: source.hue,
        saturation: source.saturation,
    }
    return ret
}
/* bullet numbers */
export function exportBulletNumbers(source: types.BulletNumbers, ctx?: IExportContext): types.BulletNumbers {
    const ret = {
        behavior: source.behavior && (adaptor.exportBulletNumbersBehavior || exportBulletNumbersBehavior)(source.behavior, ctx),
        offset: source.offset,
        type: (adaptor.exportBulletNumbersType || exportBulletNumbersType)(source.type, ctx),
    }
    return ret
}
/* bullet & item number types */
export function exportBulletNumbersType(source: types.BulletNumbersType, ctx?: IExportContext): types.BulletNumbersType {
    return source
}
/* bullet & item number behavior */
export function exportBulletNumbersBehavior(source: types.BulletNumbersBehavior, ctx?: IExportContext): types.BulletNumbersBehavior {
    return source
}
/* border */
export function exportBorder(source: types.Border, ctx?: IExportContext): types.Border {
    const ret = {
        id: source.id,
        isEnabled: source.isEnabled,
        fillType: (adaptor.exportFillType || exportFillType)(source.fillType, ctx),
        color: (adaptor.exportColor || exportColor)(source.color, ctx),
        contextSettings: source.contextSettings && (adaptor.exportContextSettings || exportContextSettings)(source.contextSettings, ctx),
        position: (adaptor.exportBorderPosition || exportBorderPosition)(source.position, ctx),
        thickness: source.thickness,
        gradient: source.gradient && (adaptor.exportGradient || exportGradient)(source.gradient, ctx),
        borderStyle: (adaptor.exportBorderStyle || exportBorderStyle)(source.borderStyle, ctx),
        startMarkerType: (adaptor.exportMarkerType || exportMarkerType)(source.startMarkerType, ctx),
        endMarkerType: (adaptor.exportMarkerType || exportMarkerType)(source.endMarkerType, ctx),
    }
    return ret
}
/* border style */
export function exportBorderStyle(source: types.BorderStyle, ctx?: IExportContext): types.BorderStyle {
    const ret = {
        length: source.length,
        gap: source.gap,
    }
    return ret
}
/* border position */
export function exportBorderPosition(source: types.BorderPosition, ctx?: IExportContext): types.BorderPosition {
    return source
}
/* border options */
export function exportBorderOptions(source: types.BorderOptions, ctx?: IExportContext): types.BorderOptions {
    const ret = {
        isEnabled: source.isEnabled,
        lineCapStyle: (adaptor.exportLineCapStyle || exportLineCapStyle)(source.lineCapStyle, ctx),
        lineJoinStyle: (adaptor.exportLineJoinStyle || exportLineJoinStyle)(source.lineJoinStyle, ctx),
    }
    return ret
}
/* bool op types */
export function exportBoolOp(source: types.BoolOp, ctx?: IExportContext): types.BoolOp {
    return source
}
/* blur */
export function exportBlur(source: types.Blur, ctx?: IExportContext): types.Blur {
    const ret = {
        isEnabled: source.isEnabled,
        center: (adaptor.exportPoint2D || exportPoint2D)(source.center, ctx),
        motionAngle: source.motionAngle,
        radius: source.radius,
        saturation: source.saturation,
        type: (adaptor.exportBlurType || exportBlurType)(source.type, ctx),
    }
    return ret
}
/* blur types */
export function exportBlurType(source: types.BlurType, ctx?: IExportContext): types.BlurType {
    return source
}
/* blend mode */
export function exportBlendMode(source: types.BlendMode, ctx?: IExportContext): types.BlendMode {
    return source
}
/* text shape */
export function exportTextShape(source: types.TextShape, ctx?: IExportContext): types.TextShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        text: (adaptor.exportText || exportText)(source.text, ctx),
    }
    return ret
}
/* table shape */
export function exportTableShape(source: types.TableShape, ctx?: IExportContext): types.TableShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        childs: (() => {
            const ret = []
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (adaptor.exportTableCell || exportTableCell)(source.childs[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        rowHeights: (() => {
            const ret = []
            for (let i = 0, len = source.rowHeights.length; i < len; i++) {
                const r = source.rowHeights[i]
                if (r) ret.push(r)
            }
            return ret
        })(),
        colWidths: (() => {
            const ret = []
            for (let i = 0, len = source.colWidths.length; i < len; i++) {
                const r = source.colWidths[i]
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    return ret
}
/* table cell */
export function exportTableCell(source: types.TableCell, ctx?: IExportContext): types.TableCell {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        cellType: source.cellType && (adaptor.exportTableCellType || exportTableCellType)(source.cellType, ctx),
        text: source.text && (adaptor.exportText || exportText)(source.text, ctx),
        imageRef: source.imageRef,
        rowSpan: source.rowSpan,
        colSpan: source.colSpan,
    }
    return ret
}
/* symbol ref shape */
export function exportSymbolRefShape(source: types.SymbolRefShape, ctx?: IExportContext): types.SymbolRefShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        refId: source.refId,
        overrides: source.overrides && (() => {
            const ret = []
            for (let i = 0, len = source.overrides.length; i < len; i++) {
                const r = (adaptor.exportOverrideItem || exportOverrideItem)(source.overrides[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    return ret
}
/* span attr */
export function exportSpan(source: types.Span, ctx?: IExportContext): types.Span {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && (adaptor.exportColor || exportColor)(source.color, ctx),
        strikethrough: source.strikethrough && (adaptor.exportStrikethroughType || exportStrikethroughType)(source.strikethrough, ctx),
        underline: source.underline && (adaptor.exportUnderlineType || exportUnderlineType)(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && (adaptor.exportBulletNumbers || exportBulletNumbers)(source.bulletNumbers, ctx),
        highlight: source.highlight && (adaptor.exportColor || exportColor)(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && (adaptor.exportTextTransformType || exportTextTransformType)(source.transform, ctx),
        placeholder: source.placeholder,
        length: source.length,
    }
    return ret
}
/* path shape */
export function exportPathShape2(source: types.PathShape2, ctx?: IExportContext): types.PathShape2 {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        pathsegs: (() => {
            const ret = []
            for (let i = 0, len = source.pathsegs.length; i < len; i++) {
                const r = (adaptor.exportPathSegment || exportPathSegment)(source.pathsegs[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        fixedRadius: source.fixedRadius,
    }
    return ret
}
/* path shape */
export function exportPathShape(source: types.PathShape, ctx?: IExportContext): types.PathShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        points: (() => {
            const ret = []
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = (adaptor.exportCurvePoint || exportCurvePoint)(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        isClosed: source.isClosed,
        fixedRadius: source.fixedRadius,
    }
    return ret
}
/* rect shape */
export function exportRectShape(source: types.RectShape, ctx?: IExportContext): types.RectShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = (adaptor.exportCurvePoint || exportCurvePoint)(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        fixedRadius: source.fixedRadius,
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    return ret
}
/* span attr */
export function exportParaAttr(source: types.ParaAttr, ctx?: IExportContext): types.ParaAttr {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && (adaptor.exportColor || exportColor)(source.color, ctx),
        strikethrough: source.strikethrough && (adaptor.exportStrikethroughType || exportStrikethroughType)(source.strikethrough, ctx),
        underline: source.underline && (adaptor.exportUnderlineType || exportUnderlineType)(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && (adaptor.exportBulletNumbers || exportBulletNumbers)(source.bulletNumbers, ctx),
        highlight: source.highlight && (adaptor.exportColor || exportColor)(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && (adaptor.exportTextTransformType || exportTextTransformType)(source.transform, ctx),
        placeholder: source.placeholder,
        alignment: source.alignment && (adaptor.exportTextHorAlign || exportTextHorAlign)(source.alignment, ctx),
        paraSpacing: source.paraSpacing,
        minimumLineHeight: source.minimumLineHeight,
        maximumLineHeight: source.maximumLineHeight,
        indent: source.indent,
    }
    return ret
}
/* text attr */
export function exportTextAttr(source: types.TextAttr, ctx?: IExportContext): types.TextAttr {
    const ret = {
        alignment: source.alignment && (adaptor.exportTextHorAlign || exportTextHorAlign)(source.alignment, ctx),
        paraSpacing: source.paraSpacing,
        minimumLineHeight: source.minimumLineHeight,
        maximumLineHeight: source.maximumLineHeight,
        indent: source.indent,
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && (adaptor.exportColor || exportColor)(source.color, ctx),
        strikethrough: source.strikethrough && (adaptor.exportStrikethroughType || exportStrikethroughType)(source.strikethrough, ctx),
        underline: source.underline && (adaptor.exportUnderlineType || exportUnderlineType)(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && (adaptor.exportBulletNumbers || exportBulletNumbers)(source.bulletNumbers, ctx),
        highlight: source.highlight && (adaptor.exportColor || exportColor)(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && (adaptor.exportTextTransformType || exportTextTransformType)(source.transform, ctx),
        placeholder: source.placeholder,
        verAlign: source.verAlign && (adaptor.exportTextVerAlign || exportTextVerAlign)(source.verAlign, ctx),
        orientation: source.orientation && (adaptor.exportTextOrientation || exportTextOrientation)(source.orientation, ctx),
        textBehaviour: source.textBehaviour && (adaptor.exportTextBehaviour || exportTextBehaviour)(source.textBehaviour, ctx),
    }
    return ret
}
/* page */
export function exportPage(source: types.Page, ctx?: IExportContext): types.Page {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        childs: (() => {
            const ret = []
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {
                    if (typeof source.childs[i] != 'object') {
                        return source.childs[i]
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return (adaptor.exportShape || exportShape)(source.childs[i] as types.Shape, ctx)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return (adaptor.exportFlattenShape || exportFlattenShape)(source.childs[i] as types.FlattenShape, ctx)
                    }
                    if (source.childs[i].typeId == 'group-shape') {
                        return (adaptor.exportGroupShape || exportGroupShape)(source.childs[i] as types.GroupShape, ctx)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return (adaptor.exportImageShape || exportImageShape)(source.childs[i] as types.ImageShape, ctx)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return (adaptor.exportPathShape || exportPathShape)(source.childs[i] as types.PathShape, ctx)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return (adaptor.exportRectShape || exportRectShape)(source.childs[i] as types.RectShape, ctx)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return (adaptor.exportSymbolRefShape || exportSymbolRefShape)(source.childs[i] as types.SymbolRefShape, ctx)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return (adaptor.exportTextShape || exportTextShape)(source.childs[i] as types.TextShape, ctx)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return (adaptor.exportOvalShape || exportOvalShape)(source.childs[i] as types.OvalShape, ctx)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return (adaptor.exportLineShape || exportLineShape)(source.childs[i] as types.LineShape, ctx)
                    }
                    if (source.childs[i].typeId == 'artboard') {
                        return (adaptor.exportArtboard || exportArtboard)(source.childs[i] as types.Artboard, ctx)
                    }
                    if (source.childs[i].typeId == 'symbol-shape') {
                        return (adaptor.exportSymbolShape || exportSymbolShape)(source.childs[i] as types.SymbolShape, ctx)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return (adaptor.exportLineShape || exportLineShape)(source.childs[i] as types.LineShape, ctx)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return (adaptor.exportOvalShape || exportOvalShape)(source.childs[i] as types.OvalShape, ctx)
                    }
                    if (source.childs[i].typeId == 'table-shape') {
                        return (adaptor.exportTableShape || exportTableShape)(source.childs[i] as types.TableShape, ctx)
                    }
                    {
                        console.error(source.childs[i])
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    return ret
}
/* oval shape */
export function exportOvalShape(source: types.OvalShape, ctx?: IExportContext): types.OvalShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = (adaptor.exportCurvePoint || exportCurvePoint)(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        fixedRadius: source.fixedRadius,
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        ellipse: (adaptor.exportEllipse || exportEllipse)(source.ellipse, ctx),
    }
    return ret
}
/* line shape */
export function exportLineShape(source: types.LineShape, ctx?: IExportContext): types.LineShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = (adaptor.exportCurvePoint || exportCurvePoint)(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        fixedRadius: source.fixedRadius,
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    return ret
}
/* image shape */
export function exportImageShape(source: types.ImageShape, ctx?: IExportContext): types.ImageShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = (adaptor.exportCurvePoint || exportCurvePoint)(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        fixedRadius: source.fixedRadius,
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        imageRef: source.imageRef,
    }
    return ret
}
/* group shape */
export function exportGroupShape(source: types.GroupShape, ctx?: IExportContext): types.GroupShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        childs: (() => {
            const ret = []
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {
                    if (typeof source.childs[i] != 'object') {
                        return source.childs[i]
                    }
                    if (source.childs[i].typeId == 'group-shape') {
                        return (adaptor.exportGroupShape || exportGroupShape)(source.childs[i] as types.GroupShape, ctx)
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return (adaptor.exportShape || exportShape)(source.childs[i] as types.Shape, ctx)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return (adaptor.exportFlattenShape || exportFlattenShape)(source.childs[i] as types.FlattenShape, ctx)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return (adaptor.exportImageShape || exportImageShape)(source.childs[i] as types.ImageShape, ctx)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return (adaptor.exportPathShape || exportPathShape)(source.childs[i] as types.PathShape, ctx)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return (adaptor.exportRectShape || exportRectShape)(source.childs[i] as types.RectShape, ctx)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return (adaptor.exportSymbolRefShape || exportSymbolRefShape)(source.childs[i] as types.SymbolRefShape, ctx)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return (adaptor.exportTextShape || exportTextShape)(source.childs[i] as types.TextShape, ctx)
                    }
                    if (source.childs[i].typeId == 'artboard') {
                        return (adaptor.exportArtboard || exportArtboard)(source.childs[i] as types.Artboard, ctx)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return (adaptor.exportLineShape || exportLineShape)(source.childs[i] as types.LineShape, ctx)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return (adaptor.exportOvalShape || exportOvalShape)(source.childs[i] as types.OvalShape, ctx)
                    }
                    if (source.childs[i].typeId == 'table-shape') {
                        return (adaptor.exportTableShape || exportTableShape)(source.childs[i] as types.TableShape, ctx)
                    }
                    {
                        console.error(source.childs[i])
                    }
                })()
                if (r) ret.push(r)
            }
            return ret
        })(),
        isBoolOpShape: source.isBoolOpShape,
        fixedRadius: source.fixedRadius,
    }
    return ret
}
/* symbol shape */
export function exportSymbolShape(source: types.SymbolShape, ctx?: IExportContext): types.SymbolShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return (adaptor.exportGroupShape || exportGroupShape)(source.childs[i] as types.GroupShape, ctx)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return (adaptor.exportShape || exportShape)(source.childs[i] as types.Shape, ctx)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return (adaptor.exportFlattenShape || exportFlattenShape)(source.childs[i] as types.FlattenShape, ctx)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return (adaptor.exportImageShape || exportImageShape)(source.childs[i] as types.ImageShape, ctx)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return (adaptor.exportPathShape || exportPathShape)(source.childs[i] as types.PathShape, ctx)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return (adaptor.exportRectShape || exportRectShape)(source.childs[i] as types.RectShape, ctx)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return (adaptor.exportSymbolRefShape || exportSymbolRefShape)(source.childs[i] as types.SymbolRefShape, ctx)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return (adaptor.exportTextShape || exportTextShape)(source.childs[i] as types.TextShape, ctx)
                        }
                        if (source.childs[i].typeId == 'artboard') {
                            return (adaptor.exportArtboard || exportArtboard)(source.childs[i] as types.Artboard, ctx)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return (adaptor.exportLineShape || exportLineShape)(source.childs[i] as types.LineShape, ctx)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return (adaptor.exportOvalShape || exportOvalShape)(source.childs[i] as types.OvalShape, ctx)
                        }
                        if (source.childs[i].typeId == 'table-shape') {
                            return (adaptor.exportTableShape || exportTableShape)(source.childs[i] as types.TableShape, ctx)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isBoolOpShape: source.isBoolOpShape,
        fixedRadius: source.fixedRadius,
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    return ret
}
/* flatten shape */
export function exportFlattenShape(source: types.FlattenShape, ctx?: IExportContext): types.FlattenShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return (adaptor.exportGroupShape || exportGroupShape)(source.childs[i] as types.GroupShape, ctx)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return (adaptor.exportShape || exportShape)(source.childs[i] as types.Shape, ctx)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return (adaptor.exportFlattenShape || exportFlattenShape)(source.childs[i] as types.FlattenShape, ctx)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return (adaptor.exportImageShape || exportImageShape)(source.childs[i] as types.ImageShape, ctx)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return (adaptor.exportPathShape || exportPathShape)(source.childs[i] as types.PathShape, ctx)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return (adaptor.exportRectShape || exportRectShape)(source.childs[i] as types.RectShape, ctx)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return (adaptor.exportSymbolRefShape || exportSymbolRefShape)(source.childs[i] as types.SymbolRefShape, ctx)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return (adaptor.exportTextShape || exportTextShape)(source.childs[i] as types.TextShape, ctx)
                        }
                        if (source.childs[i].typeId == 'artboard') {
                            return (adaptor.exportArtboard || exportArtboard)(source.childs[i] as types.Artboard, ctx)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return (adaptor.exportLineShape || exportLineShape)(source.childs[i] as types.LineShape, ctx)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return (adaptor.exportOvalShape || exportOvalShape)(source.childs[i] as types.OvalShape, ctx)
                        }
                        if (source.childs[i].typeId == 'table-shape') {
                            return (adaptor.exportTableShape || exportTableShape)(source.childs[i] as types.TableShape, ctx)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isBoolOpShape: source.isBoolOpShape,
        fixedRadius: source.fixedRadius,
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    return ret
}
/* artboard shape */
export function exportArtboard(source: types.Artboard, ctx?: IExportContext): types.Artboard {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: (adaptor.exportShapeType || exportShapeType)(source.type, ctx),
        frame: (adaptor.exportShapeFrame || exportShapeFrame)(source.frame, ctx),
        style: (adaptor.exportStyle || exportStyle)(source.style, ctx),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return (adaptor.exportGroupShape || exportGroupShape)(source.childs[i] as types.GroupShape, ctx)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return (adaptor.exportShape || exportShape)(source.childs[i] as types.Shape, ctx)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return (adaptor.exportFlattenShape || exportFlattenShape)(source.childs[i] as types.FlattenShape, ctx)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return (adaptor.exportImageShape || exportImageShape)(source.childs[i] as types.ImageShape, ctx)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return (adaptor.exportPathShape || exportPathShape)(source.childs[i] as types.PathShape, ctx)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return (adaptor.exportRectShape || exportRectShape)(source.childs[i] as types.RectShape, ctx)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return (adaptor.exportSymbolRefShape || exportSymbolRefShape)(source.childs[i] as types.SymbolRefShape, ctx)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return (adaptor.exportTextShape || exportTextShape)(source.childs[i] as types.TextShape, ctx)
                        }
                        if (source.childs[i].typeId == 'artboard') {
                            return (adaptor.exportArtboard || exportArtboard)(source.childs[i] as types.Artboard, ctx)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return (adaptor.exportLineShape || exportLineShape)(source.childs[i] as types.LineShape, ctx)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return (adaptor.exportOvalShape || exportOvalShape)(source.childs[i] as types.OvalShape, ctx)
                        }
                        if (source.childs[i].typeId == 'table-shape') {
                            return (adaptor.exportTableShape || exportTableShape)(source.childs[i] as types.TableShape, ctx)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isBoolOpShape: source.isBoolOpShape,
        fixedRadius: source.fixedRadius,
        boolOp: source.boolOp && (adaptor.exportBoolOp || exportBoolOp)(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && (adaptor.exportExportOptions || exportExportOptions)(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && (adaptor.exportResizeType || exportResizeType)(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    return ret
}
