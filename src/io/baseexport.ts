/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

import * as types from "../data/typesdefine"


export interface IExportContext {
    afterExport(obj: any): void
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
    if (ctx) ctx.afterExport(source)
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
                const r = exportPara(source.paras[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        attr: source.attr && exportTextAttr(source.attr, ctx),
    }
    if (ctx) ctx.afterExport(source)
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
/* style */
export function exportStyle(source: types.Style, ctx?: IExportContext): types.Style {
    const ret = {
        typeId: source.typeId,
        miterLimit: source.miterLimit,
        windingRule: exportWindingRule(source.windingRule, ctx),
        blur: exportBlur(source.blur, ctx),
        borderOptions: exportBorderOptions(source.borderOptions, ctx),
        borders: (() => {
            const ret = []
            for (let i = 0, len = source.borders.length; i < len; i++) {
                const r = exportBorder(source.borders[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        colorControls: source.colorControls && exportColorControls(source.colorControls, ctx),
        contextSettings: exportContextSettings(source.contextSettings, ctx),
        fills: (() => {
            const ret = []
            for (let i = 0, len = source.fills.length; i < len; i++) {
                const r = exportFill(source.fills[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        innerShadows: (() => {
            const ret = []
            for (let i = 0, len = source.innerShadows.length; i < len; i++) {
                const r = exportShadow(source.innerShadows[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        shadows: (() => {
            const ret = []
            for (let i = 0, len = source.shadows.length; i < len; i++) {
                const r = exportShadow(source.shadows[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    if (ctx) ctx.afterExport(source)
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
        color: source.color && exportColor(source.color, ctx),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* span attr */
export function exportSpanAttr(source: types.SpanAttr, ctx?: IExportContext): types.SpanAttr {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(source.color, ctx),
        strikethrough: source.strikethrough && exportStrikethroughType(source.strikethrough, ctx),
        underline: source.underline && exportUnderlineType(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && exportBulletNumbers(source.bulletNumbers, ctx),
        highlight: source.highlight && exportColor(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && exportTextTransformType(source.transform, ctx),
        placeholder: source.placeholder,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* shape */
export function exportShape(source: types.Shape, ctx?: IExportContext): types.Shape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        name: source.name,
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    if (ctx) ctx.afterExport(source)
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
    if (ctx) ctx.afterExport(source)
    return ret
}
/* shadow */
export function exportShadow(source: types.Shadow, ctx?: IExportContext): types.Shadow {
    const ret = {
        isEnabled: source.isEnabled,
        blurRadius: source.blurRadius,
        color: exportColor(source.color, ctx),
        contextSettings: exportGraphicsContextSettings(source.contextSettings, ctx),
        offsetX: source.offsetX,
        offsetY: source.offsetY,
        spread: source.spread,
    }
    if (ctx) ctx.afterExport(source)
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
    if (ctx) ctx.afterExport(source)
    return ret
}
/* para */
export function exportPara(source: types.Para, ctx?: IExportContext): types.Para {
    const ret = {
        text: source.text,
        spans: (() => {
            const ret = []
            for (let i = 0, len = source.spans.length; i < len; i++) {
                const r = exportSpan(source.spans[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        attr: source.attr && exportParaAttr(source.attr, ctx),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* page list item */
export function exportPageListItem(source: types.PageListItem, ctx?: IExportContext): types.PageListItem {
    const ret = {
        id: source.id,
        name: source.name,
        versionId: source.versionId,
    }
    if (ctx) ctx.afterExport(source)
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
                return exportStyle(source.value as types.Style, ctx)
            }
            {
                console.error(source.value)
            }
        })(),
    }
    if (ctx) ctx.afterExport(source)
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
        blendMode: exportBlendMode(source.blendMode, ctx),
        opacity: source.opacity,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* gradient */
export function exportGradient(source: types.Gradient, ctx?: IExportContext): types.Gradient {
    const ret = {
        elipseLength: source.elipseLength,
        from: exportPoint2D(source.from, ctx),
        to: exportPoint2D(source.to, ctx),
        stops: (() => {
            const ret = []
            for (let i = 0, len = source.stops.length; i < len; i++) {
                const r = exportStop(source.stops[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        gradientType: exportGradientType(source.gradientType, ctx),
    }
    if (ctx) ctx.afterExport(source)
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
        fillType: exportFillType(source.fillType, ctx),
        color: exportColor(source.color, ctx),
        contextSettings: exportContextSettings(source.contextSettings, ctx),
        gradient: source.gradient && exportGradient(source.gradient, ctx),
        imageRef: source.imageRef,
    }
    if (ctx) ctx.afterExport(source)
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
                const r = exportExportFormat(source.exportFormats[i], ctx)
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
    if (ctx) ctx.afterExport(source)
    return ret
}
/* export format */
export function exportExportFormat(source: types.ExportFormat, ctx?: IExportContext): types.ExportFormat {
    const ret = {
        absoluteSize: source.absoluteSize,
        fileFormat: source.fileFormat && exportExportFileFormat(source.fileFormat, ctx),
        name: source.name,
        namingScheme: source.namingScheme && exportExportFormatNameingScheme(source.namingScheme, ctx),
        scale: source.scale,
        visibleScaleType: source.visibleScaleType && exportExportVisibleScaleType(source.visibleScaleType, ctx),
    }
    if (ctx) ctx.afterExport(source)
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
    if (ctx) ctx.afterExport(source)
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
    if (ctx) ctx.afterExport(source)
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
                const r = exportPageListItem(source.pagesList[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        versionId: source.versionId,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* curve point */
export function exportCurvePoint(source: types.CurvePoint, ctx?: IExportContext): types.CurvePoint {
    const ret = {
        id: source.id,
        cornerRadius: source.cornerRadius,
        curveFrom: exportPoint2D(source.curveFrom, ctx),
        curveTo: exportPoint2D(source.curveTo, ctx),
        hasCurveFrom: source.hasCurveFrom,
        hasCurveTo: source.hasCurveTo,
        curveMode: exportCurveMode(source.curveMode, ctx),
        point: exportPoint2D(source.point, ctx),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* curve mode */
export function exportCurveMode(source: types.CurveMode, ctx?: IExportContext): types.CurveMode {
    return source
}
/* context settings */
export function exportContextSettings(source: types.ContextSettings, ctx?: IExportContext): types.ContextSettings {
    const ret = {
        blenMode: exportBlendMode(source.blenMode, ctx),
        opacity: source.opacity,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* comment */
export function exportComment(source: types.Comment, ctx?: IExportContext): types.Comment {
    const ret = {
        pageId: source.pageId,
        id: source.id,
        frame: exportShapeFrame(source.frame, ctx),
        user: exportUserInfo(source.user, ctx),
        createAt: source.createAt,
        content: source.content,
        parasiticBody: exportShape(source.parasiticBody, ctx),
        parentId: source.parentId,
        rootId: source.rootId,
    }
    if (ctx) ctx.afterExport(source)
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
    if (ctx) ctx.afterExport(source)
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
    if (ctx) ctx.afterExport(source)
    return ret
}
/* bullet numbers */
export function exportBulletNumbers(source: types.BulletNumbers, ctx?: IExportContext): types.BulletNumbers {
    const ret = {
        behavior: source.behavior && exportBulletNumbersBehavior(source.behavior, ctx),
        offset: source.offset,
        type: exportBulletNumbersType(source.type, ctx),
    }
    if (ctx) ctx.afterExport(source)
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
        fillType: exportFillType(source.fillType, ctx),
        color: exportColor(source.color, ctx),
        contextSettings: exportContextSettings(source.contextSettings, ctx),
        position: exportBorderPosition(source.position, ctx),
        thickness: source.thickness,
        gradient: source.gradient && exportGradient(source.gradient, ctx),
        borderStyle: exportBorderStyle(source.borderStyle, ctx),
        startMarkerType: exportMarkerType(source.startMarkerType, ctx),
        endMarkerType: exportMarkerType(source.endMarkerType, ctx),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* border style */
export function exportBorderStyle(source: types.BorderStyle, ctx?: IExportContext): types.BorderStyle {
    const ret = {
        length: source.length,
        gap: source.gap,
    }
    if (ctx) ctx.afterExport(source)
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
        lineCapStyle: exportLineCapStyle(source.lineCapStyle, ctx),
        lineJoinStyle: exportLineJoinStyle(source.lineJoinStyle, ctx),
    }
    if (ctx) ctx.afterExport(source)
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
        center: exportPoint2D(source.center, ctx),
        motionAngle: source.motionAngle,
        radius: source.radius,
        saturation: source.saturation,
        type: exportBlurType(source.type, ctx),
    }
    if (ctx) ctx.afterExport(source)
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
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        text: exportText(source.text, ctx),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* table shape */
export function exportTableShape(source: types.TableShape, ctx?: IExportContext): types.TableShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        childs: (() => {
            const ret = []
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = exportTableCell(source.childs[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* table cell */
export function exportTableCell(source: types.TableCell, ctx?: IExportContext): types.TableCell {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
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
                    if (source.childs[i].typeId == 'image-shape') {
                        return exportImageShape(source.childs[i] as types.ImageShape, ctx)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return exportTextShape(source.childs[i] as types.TextShape, ctx)
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
    if (ctx) ctx.afterExport(source)
    return ret
}
/* symbol ref shape */
export function exportSymbolRefShape(source: types.SymbolRefShape, ctx?: IExportContext): types.SymbolRefShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        refId: source.refId,
        overrides: source.overrides && (() => {
            const ret = []
            for (let i = 0, len = source.overrides.length; i < len; i++) {
                const r = exportOverrideItem(source.overrides[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* span attr */
export function exportSpan(source: types.Span, ctx?: IExportContext): types.Span {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(source.color, ctx),
        strikethrough: source.strikethrough && exportStrikethroughType(source.strikethrough, ctx),
        underline: source.underline && exportUnderlineType(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && exportBulletNumbers(source.bulletNumbers, ctx),
        highlight: source.highlight && exportColor(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && exportTextTransformType(source.transform, ctx),
        placeholder: source.placeholder,
        length: source.length,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* path shape */
export function exportPathShape(source: types.PathShape, ctx?: IExportContext): types.PathShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        points: (() => {
            const ret = []
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = exportCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        isClosed: source.isClosed,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* rect shape */
export function exportRectShape(source: types.RectShape, ctx?: IExportContext): types.RectShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = exportCurvePoint(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* span attr */
export function exportParaAttr(source: types.ParaAttr, ctx?: IExportContext): types.ParaAttr {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(source.color, ctx),
        strikethrough: source.strikethrough && exportStrikethroughType(source.strikethrough, ctx),
        underline: source.underline && exportUnderlineType(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && exportBulletNumbers(source.bulletNumbers, ctx),
        highlight: source.highlight && exportColor(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && exportTextTransformType(source.transform, ctx),
        placeholder: source.placeholder,
        alignment: source.alignment && exportTextHorAlign(source.alignment, ctx),
        paraSpacing: source.paraSpacing,
        minimumLineHeight: source.minimumLineHeight,
        maximumLineHeight: source.maximumLineHeight,
        indent: source.indent,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* text attr */
export function exportTextAttr(source: types.TextAttr, ctx?: IExportContext): types.TextAttr {
    const ret = {
        alignment: source.alignment && exportTextHorAlign(source.alignment, ctx),
        paraSpacing: source.paraSpacing,
        minimumLineHeight: source.minimumLineHeight,
        maximumLineHeight: source.maximumLineHeight,
        indent: source.indent,
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(source.color, ctx),
        strikethrough: source.strikethrough && exportStrikethroughType(source.strikethrough, ctx),
        underline: source.underline && exportUnderlineType(source.underline, ctx),
        bold: source.bold,
        italic: source.italic,
        bulletNumbers: source.bulletNumbers && exportBulletNumbers(source.bulletNumbers, ctx),
        highlight: source.highlight && exportColor(source.highlight, ctx),
        kerning: source.kerning,
        transform: source.transform && exportTextTransformType(source.transform, ctx),
        placeholder: source.placeholder,
        verAlign: source.verAlign && exportTextVerAlign(source.verAlign, ctx),
        orientation: source.orientation && exportTextOrientation(source.orientation, ctx),
        textBehaviour: source.textBehaviour && exportTextBehaviour(source.textBehaviour, ctx),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* page */
export function exportPage(source: types.Page, ctx?: IExportContext): types.Page {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
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
                        return exportShape(source.childs[i] as types.Shape, ctx)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return exportFlattenShape(source.childs[i] as types.FlattenShape, ctx)
                    }
                    if (source.childs[i].typeId == 'group-shape') {
                        return exportGroupShape(source.childs[i] as types.GroupShape, ctx)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return exportImageShape(source.childs[i] as types.ImageShape, ctx)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return exportPathShape(source.childs[i] as types.PathShape, ctx)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return exportRectShape(source.childs[i] as types.RectShape, ctx)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return exportSymbolRefShape(source.childs[i] as types.SymbolRefShape, ctx)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return exportTextShape(source.childs[i] as types.TextShape, ctx)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return exportOvalShape(source.childs[i] as types.OvalShape, ctx)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return exportLineShape(source.childs[i] as types.LineShape, ctx)
                    }
                    if (source.childs[i].typeId == 'artboard') {
                        return exportArtboard(source.childs[i] as types.Artboard, ctx)
                    }
                    if (source.childs[i].typeId == 'symbol-shape') {
                        return exportSymbolShape(source.childs[i] as types.SymbolShape, ctx)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return exportLineShape(source.childs[i] as types.LineShape, ctx)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return exportOvalShape(source.childs[i] as types.OvalShape, ctx)
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
    if (ctx) ctx.afterExport(source)
    return ret
}
/* oval shape */
export function exportOvalShape(source: types.OvalShape, ctx?: IExportContext): types.OvalShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = exportCurvePoint(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        ellipse: exportEllipse(source.ellipse, ctx),
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* line shape */
export function exportLineShape(source: types.LineShape, ctx?: IExportContext): types.LineShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = exportCurvePoint(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* image shape */
export function exportImageShape(source: types.ImageShape, ctx?: IExportContext): types.ImageShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        imageRef: source.imageRef,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* group shape */
export function exportGroupShape(source: types.GroupShape, ctx?: IExportContext): types.GroupShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
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
                        return exportGroupShape(source.childs[i] as types.GroupShape, ctx)
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return exportShape(source.childs[i] as types.Shape, ctx)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return exportFlattenShape(source.childs[i] as types.FlattenShape, ctx)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return exportImageShape(source.childs[i] as types.ImageShape, ctx)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return exportPathShape(source.childs[i] as types.PathShape, ctx)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return exportRectShape(source.childs[i] as types.RectShape, ctx)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return exportSymbolRefShape(source.childs[i] as types.SymbolRefShape, ctx)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return exportTextShape(source.childs[i] as types.TextShape, ctx)
                    }
                    if (source.childs[i].typeId == 'artboard') {
                        return exportArtboard(source.childs[i] as types.Artboard, ctx)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return exportLineShape(source.childs[i] as types.LineShape, ctx)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return exportOvalShape(source.childs[i] as types.OvalShape, ctx)
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
    if (ctx) ctx.afterExport(source)
    return ret
}
/* symbol shape */
export function exportSymbolShape(source: types.SymbolShape, ctx?: IExportContext): types.SymbolShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return exportGroupShape(source.childs[i] as types.GroupShape, ctx)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return exportShape(source.childs[i] as types.Shape, ctx)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return exportFlattenShape(source.childs[i] as types.FlattenShape, ctx)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return exportImageShape(source.childs[i] as types.ImageShape, ctx)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return exportPathShape(source.childs[i] as types.PathShape, ctx)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return exportRectShape(source.childs[i] as types.RectShape, ctx)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(source.childs[i] as types.SymbolRefShape, ctx)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return exportTextShape(source.childs[i] as types.TextShape, ctx)
                        }
                        if (source.childs[i].typeId == 'artboard') {
                            return exportArtboard(source.childs[i] as types.Artboard, ctx)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return exportLineShape(source.childs[i] as types.LineShape, ctx)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return exportOvalShape(source.childs[i] as types.OvalShape, ctx)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* flatten shape */
export function exportFlattenShape(source: types.FlattenShape, ctx?: IExportContext): types.FlattenShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return exportGroupShape(source.childs[i] as types.GroupShape, ctx)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return exportShape(source.childs[i] as types.Shape, ctx)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return exportFlattenShape(source.childs[i] as types.FlattenShape, ctx)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return exportImageShape(source.childs[i] as types.ImageShape, ctx)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return exportPathShape(source.childs[i] as types.PathShape, ctx)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return exportRectShape(source.childs[i] as types.RectShape, ctx)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(source.childs[i] as types.SymbolRefShape, ctx)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return exportTextShape(source.childs[i] as types.TextShape, ctx)
                        }
                        if (source.childs[i].typeId == 'artboard') {
                            return exportArtboard(source.childs[i] as types.Artboard, ctx)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return exportLineShape(source.childs[i] as types.LineShape, ctx)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return exportOvalShape(source.childs[i] as types.OvalShape, ctx)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
/* artboard shape */
export function exportArtboard(source: types.Artboard, ctx?: IExportContext): types.Artboard {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return exportGroupShape(source.childs[i] as types.GroupShape, ctx)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return exportShape(source.childs[i] as types.Shape, ctx)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return exportFlattenShape(source.childs[i] as types.FlattenShape, ctx)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return exportImageShape(source.childs[i] as types.ImageShape, ctx)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return exportPathShape(source.childs[i] as types.PathShape, ctx)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return exportRectShape(source.childs[i] as types.RectShape, ctx)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(source.childs[i] as types.SymbolRefShape, ctx)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return exportTextShape(source.childs[i] as types.TextShape, ctx)
                        }
                        if (source.childs[i].typeId == 'artboard') {
                            return exportArtboard(source.childs[i] as types.Artboard, ctx)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return exportLineShape(source.childs[i] as types.LineShape, ctx)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return exportOvalShape(source.childs[i] as types.OvalShape, ctx)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        boolOp: source.boolOp && exportBoolOp(source.boolOp, ctx),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(source.exportOptions, ctx),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(source.resizingType, ctx),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    if (ctx) ctx.afterExport(source)
    return ret
}
