/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

import * as types from "../data/typesdefine"


export interface IExportContext {
    afterExport(obj: any): void
}
/* winding rule */
export function exportWindingRule(ctx: IExportContext, source: types.WindingRule): types.WindingRule {
    return source
}
/* user infomation */
export function exportUserInfo(ctx: IExportContext, source: types.UserInfo): types.UserInfo {
    const ret = {
        userId: source.userId,
        userNickname: source.userNickname,
        avatar: source.avatar,
    }
    ctx.afterExport(source)
    return ret
}
/* text */
export function exportText(ctx: IExportContext, source: types.Text): types.Text {
    const ret = {
        paras: (() => {
            const ret = []
            for (let i = 0, len = source.paras.length; i < len; i++) {
                const r = exportPara(ctx, source.paras[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        attr: source.attr && exportTextAttr(ctx, source.attr),
    }
    ctx.afterExport(source)
    return ret
}
/* text vertical alignment */
export function exportTextVerAlign(ctx: IExportContext, source: types.TextVerAlign): types.TextVerAlign {
    return source
}
/* text orientation */
export function exportTextOrientation(ctx: IExportContext, source: types.TextOrientation): types.TextOrientation {
    return source
}
/* text horizontal alignment */
export function exportTextHorAlign(ctx: IExportContext, source: types.TextHorAlign): types.TextHorAlign {
    return source
}
/* text behaviour */
export function exportTextBehaviour(ctx: IExportContext, source: types.TextBehaviour): types.TextBehaviour {
    return source
}
/* style */
export function exportStyle(ctx: IExportContext, source: types.Style): types.Style {
    const ret = {
        typeId: source.typeId,
        miterLimit: source.miterLimit,
        windingRule: exportWindingRule(ctx, source.windingRule),
        blur: exportBlur(ctx, source.blur),
        borderOptions: exportBorderOptions(ctx, source.borderOptions),
        borders: (() => {
            const ret = []
            for (let i = 0, len = source.borders.length; i < len; i++) {
                const r = exportBorder(ctx, source.borders[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        colorControls: source.colorControls && exportColorControls(ctx, source.colorControls),
        contextSettings: exportContextSettings(ctx, source.contextSettings),
        fills: (() => {
            const ret = []
            for (let i = 0, len = source.fills.length; i < len; i++) {
                const r = exportFill(ctx, source.fills[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        innerShadows: (() => {
            const ret = []
            for (let i = 0, len = source.innerShadows.length; i < len; i++) {
                const r = exportShadow(ctx, source.innerShadows[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        shadows: (() => {
            const ret = []
            for (let i = 0, len = source.shadows.length; i < len; i++) {
                const r = exportShadow(ctx, source.shadows[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    ctx.afterExport(source)
    return ret
}
/* stop */
export function exportStop(ctx: IExportContext, source: types.Stop): types.Stop {
    const ret = {
        position: source.position,
        color: source.color && exportColor(ctx, source.color),
    }
    ctx.afterExport(source)
    return ret
}
/* span attr */
export function exportSpanAttr(ctx: IExportContext, source: types.SpanAttr): types.SpanAttr {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(ctx, source.color),
    }
    ctx.afterExport(source)
    return ret
}
/* shape */
export function exportShape(ctx: IExportContext, source: types.Shape): types.Shape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        name: source.name,
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    ctx.afterExport(source)
    return ret
}
/* shape types */
export function exportShapeType(ctx: IExportContext, source: types.ShapeType): types.ShapeType {
    return source
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export function exportShapeFrame(ctx: IExportContext, source: types.ShapeFrame): types.ShapeFrame {
    const ret = {
        x: source.x,
        y: source.y,
        width: source.width,
        height: source.height,
    }
    ctx.afterExport(source)
    return ret
}
/* shadow */
export function exportShadow(ctx: IExportContext, source: types.Shadow): types.Shadow {
    const ret = {
        isEnabled: source.isEnabled,
        blurRadius: source.blurRadius,
        color: exportColor(ctx, source.color),
        contextSettings: exportGraphicsContextSettings(ctx, source.contextSettings),
        offsetX: source.offsetX,
        offsetY: source.offsetY,
        spread: source.spread,
    }
    ctx.afterExport(source)
    return ret
}
/* resize type */
export function exportResizeType(ctx: IExportContext, source: types.ResizeType): types.ResizeType {
    return source
}
/* rect radius */
export function exportRectRadius(ctx: IExportContext, source: types.RectRadius): types.RectRadius {
    const ret = {
        rlt: source.rlt,
        rrt: source.rrt,
        rrb: source.rrb,
        rlb: source.rlb,
    }
    ctx.afterExport(source)
    return ret
}
/* point 2d */
export function exportPoint2D(ctx: IExportContext, source: types.Point2D): types.Point2D {
    const ret = {
        x: source.x,
        y: source.y,
    }
    ctx.afterExport(source)
    return ret
}
/* para */
export function exportPara(ctx: IExportContext, source: types.Para): types.Para {
    const ret = {
        text: source.text,
        spans: (() => {
            const ret = []
            for (let i = 0, len = source.spans.length; i < len; i++) {
                const r = exportSpan(ctx, source.spans[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        attr: source.attr && exportParaAttr(ctx, source.attr),
    }
    ctx.afterExport(source)
    return ret
}
/* page list item */
export function exportPageListItem(ctx: IExportContext, source: types.PageListItem): types.PageListItem {
    const ret = {
        id: source.id,
        name: source.name,
    }
    ctx.afterExport(source)
    return ret
}
/* override list item */
export function exportOverrideItem(ctx: IExportContext, source: types.OverrideItem): types.OverrideItem {
    const ret = {
        id: source.id,
        value: (() => {
            if (typeof source.value != 'object') {
                return source.value
            }
            if (source.value.typeId == 'style') {
                return exportStyle(ctx, source.value as types.Style)
            }
            {
                console.error(source.value)
            }
        })(),
    }
    ctx.afterExport(source)
    return ret
}
/* marker type */
export function exportMarkerType(ctx: IExportContext, source: types.MarkerType): types.MarkerType {
    return source
}
/* line join style */
export function exportLineJoinStyle(ctx: IExportContext, source: types.LineJoinStyle): types.LineJoinStyle {
    return source
}
/* line cap style */
export function exportLineCapStyle(ctx: IExportContext, source: types.LineCapStyle): types.LineCapStyle {
    return source
}
/* graphics contex settings */
export function exportGraphicsContextSettings(ctx: IExportContext, source: types.GraphicsContextSettings): types.GraphicsContextSettings {
    const ret = {
        blendMode: exportBlendMode(ctx, source.blendMode),
        opacity: source.opacity,
    }
    ctx.afterExport(source)
    return ret
}
/* gradient */
export function exportGradient(ctx: IExportContext, source: types.Gradient): types.Gradient {
    const ret = {
        elipseLength: source.elipseLength,
        from: exportPoint2D(ctx, source.from),
        to: exportPoint2D(ctx, source.to),
        stops: (() => {
            const ret = []
            for (let i = 0, len = source.stops.length; i < len; i++) {
                const r = exportStop(ctx, source.stops[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        gradientType: exportGradientType(ctx, source.gradientType),
    }
    ctx.afterExport(source)
    return ret
}
/* gradient type */
export function exportGradientType(ctx: IExportContext, source: types.GradientType): types.GradientType {
    return source
}
/* fill */
export function exportFill(ctx: IExportContext, source: types.Fill): types.Fill {
    const ret = {
        isEnabled: source.isEnabled,
        fillType: exportFillType(ctx, source.fillType),
        color: exportColor(ctx, source.color),
        contextSettings: exportContextSettings(ctx, source.contextSettings),
        gradient: source.gradient && exportGradient(ctx, source.gradient),
    }
    ctx.afterExport(source)
    return ret
}
/* fill types */
export function exportFillType(ctx: IExportContext, source: types.FillType): types.FillType {
    return source
}
/* visible scale type */
export function exportExportVisibleScaleType(ctx: IExportContext, source: types.ExportVisibleScaleType): types.ExportVisibleScaleType {
    return source
}
/* export options */
export function exportExportOptions(ctx: IExportContext, source: types.ExportOptions): types.ExportOptions {
    const ret = {
        exportFormats: (() => {
            const ret = []
            for (let i = 0, len = source.exportFormats.length; i < len; i++) {
                const r = exportExportFormat(ctx, source.exportFormats[i])
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
    ctx.afterExport(source)
    return ret
}
/* export format */
export function exportExportFormat(ctx: IExportContext, source: types.ExportFormat): types.ExportFormat {
    const ret = {
        absoluteSize: source.absoluteSize,
        fileFormat: source.fileFormat && exportExportFileFormat(ctx, source.fileFormat),
        name: source.name,
        namingScheme: source.namingScheme && exportExportFormatNameingScheme(ctx, source.namingScheme),
        scale: source.scale,
        visibleScaleType: source.visibleScaleType && exportExportVisibleScaleType(ctx, source.visibleScaleType),
    }
    ctx.afterExport(source)
    return ret
}
/* export format nameing scheme */
export function exportExportFormatNameingScheme(ctx: IExportContext, source: types.ExportFormatNameingScheme): types.ExportFormatNameingScheme {
    return source
}
/* export file format */
export function exportExportFileFormat(ctx: IExportContext, source: types.ExportFileFormat): types.ExportFileFormat {
    return source
}
/* ellipse attributes */
export function exportEllipse(ctx: IExportContext, source: types.Ellipse): types.Ellipse {
    const ret = {
        cx: source.cx,
        cy: source.cy,
        rx: source.rx,
        ry: source.ry,
    }
    ctx.afterExport(source)
    return ret
}
/* document meta */
export function exportDocumentMeta(ctx: IExportContext, source: types.DocumentMeta): types.DocumentMeta {
    const ret = {
        name: source.name,
        pagesList: (() => {
            const ret = []
            for (let i = 0, len = source.pagesList.length; i < len; i++) {
                const r = exportPageListItem(ctx, source.pagesList[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    ctx.afterExport(source)
    return ret
}
/* curve point */
export function exportCurvePoint(ctx: IExportContext, source: types.CurvePoint): types.CurvePoint {
    const ret = {
        cornerRadius: source.cornerRadius,
        curveFrom: exportPoint2D(ctx, source.curveFrom),
        curveTo: exportPoint2D(ctx, source.curveTo),
        hasCurveFrom: source.hasCurveFrom,
        hasCurveTo: source.hasCurveTo,
        curveMode: exportCurveMode(ctx, source.curveMode),
        point: exportPoint2D(ctx, source.point),
    }
    ctx.afterExport(source)
    return ret
}
/* curve mode */
export function exportCurveMode(ctx: IExportContext, source: types.CurveMode): types.CurveMode {
    return source
}
/* context settings */
export function exportContextSettings(ctx: IExportContext, source: types.ContextSettings): types.ContextSettings {
    const ret = {
        blenMode: exportBlendMode(ctx, source.blenMode),
        opacity: source.opacity,
    }
    ctx.afterExport(source)
    return ret
}
/* comment */
export function exportComment(ctx: IExportContext, source: types.Comment): types.Comment {
    const ret = {
        pageId: source.pageId,
        id: source.id,
        frame: exportShapeFrame(ctx, source.frame),
        user: exportUserInfo(ctx, source.user),
        createAt: source.createAt,
        content: source.content,
        parasiticBody: exportShape(ctx, source.parasiticBody),
        parentId: source.parentId,
        rootId: source.rootId,
    }
    ctx.afterExport(source)
    return ret
}
/* color */
export function exportColor(ctx: IExportContext, source: types.Color): types.Color {
    const ret = {
        alpha: source.alpha,
        red: source.red,
        green: source.green,
        blue: source.blue,
    }
    ctx.afterExport(source)
    return ret
}
/* color controls */
export function exportColorControls(ctx: IExportContext, source: types.ColorControls): types.ColorControls {
    const ret = {
        isEnabled: source.isEnabled,
        brightness: source.brightness,
        contrast: source.contrast,
        hue: source.hue,
        saturation: source.saturation,
    }
    ctx.afterExport(source)
    return ret
}
/* border */
export function exportBorder(ctx: IExportContext, source: types.Border): types.Border {
    const ret = {
        isEnabled: source.isEnabled,
        fillType: exportFillType(ctx, source.fillType),
        color: exportColor(ctx, source.color),
        contextSettings: exportContextSettings(ctx, source.contextSettings),
        position: exportBorderPosition(ctx, source.position),
        thickness: source.thickness,
        gradient: source.gradient && exportGradient(ctx, source.gradient),
        borderStyle: exportBorderStyle(ctx, source.borderStyle),
        startMarkerType: exportMarkerType(ctx, source.startMarkerType),
        endMarkerType: exportMarkerType(ctx, source.endMarkerType),
    }
    ctx.afterExport(source)
    return ret
}
/* border style */
export function exportBorderStyle(ctx: IExportContext, source: types.BorderStyle): types.BorderStyle {
    const ret = {
        length: source.length,
        gap: source.gap,
    }
    ctx.afterExport(source)
    return ret
}
/* border position */
export function exportBorderPosition(ctx: IExportContext, source: types.BorderPosition): types.BorderPosition {
    return source
}
/* border options */
export function exportBorderOptions(ctx: IExportContext, source: types.BorderOptions): types.BorderOptions {
    const ret = {
        isEnabled: source.isEnabled,
        lineCapStyle: exportLineCapStyle(ctx, source.lineCapStyle),
        lineJoinStyle: exportLineJoinStyle(ctx, source.lineJoinStyle),
    }
    ctx.afterExport(source)
    return ret
}
/* bool op types */
export function exportBoolOp(ctx: IExportContext, source: types.BoolOp): types.BoolOp {
    return source
}
/* blur */
export function exportBlur(ctx: IExportContext, source: types.Blur): types.Blur {
    const ret = {
        isEnabled: source.isEnabled,
        center: exportPoint2D(ctx, source.center),
        motionAngle: source.motionAngle,
        radius: source.radius,
        saturation: source.saturation,
        type: exportBlurType(ctx, source.type),
    }
    ctx.afterExport(source)
    return ret
}
/* blur types */
export function exportBlurType(ctx: IExportContext, source: types.BlurType): types.BlurType {
    return source
}
/* blend mode */
export function exportBlendMode(ctx: IExportContext, source: types.BlendMode): types.BlendMode {
    return source
}
/* text shape */
export function exportTextShape(ctx: IExportContext, source: types.TextShape): types.TextShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        text: exportText(ctx, source.text),
    }
    ctx.afterExport(source)
    return ret
}
/* symbol ref shape */
export function exportSymbolRefShape(ctx: IExportContext, source: types.SymbolRefShape): types.SymbolRefShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        refId: source.refId,
        overrides: source.overrides && (() => {
            const ret = []
            for (let i = 0, len = source.overrides.length; i < len; i++) {
                const r = exportOverrideItem(ctx, source.overrides[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
    }
    ctx.afterExport(source)
    return ret
}
/* span attr */
export function exportSpan(ctx: IExportContext, source: types.Span): types.Span {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(ctx, source.color),
        length: source.length,
    }
    ctx.afterExport(source)
    return ret
}
/* path shape */
export function exportPathShape(ctx: IExportContext, source: types.PathShape): types.PathShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        points: (() => {
            const ret = []
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = exportCurvePoint(ctx, source.points[i])
                if (r) ret.push(r)
            }
            return ret
        })(),
        isClosed: source.isClosed,
    }
    ctx.afterExport(source)
    return ret
}
/* rect shape */
export function exportRectShape(ctx: IExportContext, source: types.RectShape): types.RectShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = exportCurvePoint(ctx, source.points[i])
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        fixedRadius: exportRectRadius(ctx, source.fixedRadius),
    }
    ctx.afterExport(source)
    return ret
}
/* span attr */
export function exportParaAttr(ctx: IExportContext, source: types.ParaAttr): types.ParaAttr {
    const ret = {
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(ctx, source.color),
        alignment: source.alignment && exportTextHorAlign(ctx, source.alignment),
        paraSpacing: source.paraSpacing,
        kerning: source.kerning,
        minimumLineHeight: source.minimumLineHeight,
        maximumLineHeight: source.maximumLineHeight,
    }
    ctx.afterExport(source)
    return ret
}
/* text attr */
export function exportTextAttr(ctx: IExportContext, source: types.TextAttr): types.TextAttr {
    const ret = {
        alignment: source.alignment && exportTextHorAlign(ctx, source.alignment),
        paraSpacing: source.paraSpacing,
        kerning: source.kerning,
        minimumLineHeight: source.minimumLineHeight,
        maximumLineHeight: source.maximumLineHeight,
        fontName: source.fontName,
        fontSize: source.fontSize,
        color: source.color && exportColor(ctx, source.color),
        verAlign: source.verAlign && exportTextVerAlign(ctx, source.verAlign),
        orientation: source.orientation && exportTextOrientation(ctx, source.orientation),
        textBehaviour: source.textBehaviour && exportTextBehaviour(ctx, source.textBehaviour),
    }
    ctx.afterExport(source)
    return ret
}
/* page */
export function exportPage(ctx: IExportContext, source: types.Page): types.Page {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
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
                        return exportShape(ctx, source.childs[i] as types.Shape)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return exportFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                    }
                    if (source.childs[i].typeId == 'group-shape') {
                        return exportGroupShape(ctx, source.childs[i] as types.GroupShape)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return exportImageShape(ctx, source.childs[i] as types.ImageShape)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return exportPathShape(ctx, source.childs[i] as types.PathShape)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return exportRectShape(ctx, source.childs[i] as types.RectShape)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return exportSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return exportTextShape(ctx, source.childs[i] as types.TextShape)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return exportOvalShape(ctx, source.childs[i] as types.OvalShape)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return exportLineShape(ctx, source.childs[i] as types.LineShape)
                    }
                    if (source.childs[i].typeId == 'artboard') {
                        return exportArtboard(ctx, source.childs[i] as types.Artboard)
                    }
                    if (source.childs[i].typeId == 'symbol-shape') {
                        return exportSymbolShape(ctx, source.childs[i] as types.SymbolShape)
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
    ctx.afterExport(source)
    return ret
}
/* oval shape */
export function exportOvalShape(ctx: IExportContext, source: types.OvalShape): types.OvalShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = exportCurvePoint(ctx, source.points[i])
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        ellipse: exportEllipse(ctx, source.ellipse),
    }
    ctx.afterExport(source)
    return ret
}
/* line shape */
export function exportLineShape(ctx: IExportContext, source: types.LineShape): types.LineShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = exportCurvePoint(ctx, source.points[i])
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    ctx.afterExport(source)
    return ret
}
/* image shape */
export function exportImageShape(ctx: IExportContext, source: types.ImageShape): types.ImageShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        imageRef: source.imageRef,
    }
    ctx.afterExport(source)
    return ret
}
/* group shape */
export function exportGroupShape(ctx: IExportContext, source: types.GroupShape): types.GroupShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
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
                        return exportGroupShape(ctx, source.childs[i] as types.GroupShape)
                    }
                    if (source.childs[i].typeId == 'shape') {
                        return exportShape(ctx, source.childs[i] as types.Shape)
                    }
                    if (source.childs[i].typeId == 'flatten-shape') {
                        return exportFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                    }
                    if (source.childs[i].typeId == 'image-shape') {
                        return exportImageShape(ctx, source.childs[i] as types.ImageShape)
                    }
                    if (source.childs[i].typeId == 'path-shape') {
                        return exportPathShape(ctx, source.childs[i] as types.PathShape)
                    }
                    if (source.childs[i].typeId == 'rect-shape') {
                        return exportRectShape(ctx, source.childs[i] as types.RectShape)
                    }
                    if (source.childs[i].typeId == 'symbol-ref-shape') {
                        return exportSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                    }
                    if (source.childs[i].typeId == 'text-shape') {
                        return exportTextShape(ctx, source.childs[i] as types.TextShape)
                    }
                    if (source.childs[i].typeId == 'oval-shape') {
                        return exportOvalShape(ctx, source.childs[i] as types.OvalShape)
                    }
                    if (source.childs[i].typeId == 'line-shape') {
                        return exportLineShape(ctx, source.childs[i] as types.LineShape)
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
    ctx.afterExport(source)
    return ret
}
/* symbol shape */
export function exportSymbolShape(ctx: IExportContext, source: types.SymbolShape): types.SymbolShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return exportGroupShape(ctx, source.childs[i] as types.GroupShape)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return exportShape(ctx, source.childs[i] as types.Shape)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return exportFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return exportImageShape(ctx, source.childs[i] as types.ImageShape)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return exportPathShape(ctx, source.childs[i] as types.PathShape)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return exportRectShape(ctx, source.childs[i] as types.RectShape)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return exportTextShape(ctx, source.childs[i] as types.TextShape)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return exportOvalShape(ctx, source.childs[i] as types.OvalShape)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return exportLineShape(ctx, source.childs[i] as types.LineShape)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    ctx.afterExport(source)
    return ret
}
/* flatten shape */
export function exportFlattenShape(ctx: IExportContext, source: types.FlattenShape): types.FlattenShape {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return exportGroupShape(ctx, source.childs[i] as types.GroupShape)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return exportShape(ctx, source.childs[i] as types.Shape)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return exportFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return exportImageShape(ctx, source.childs[i] as types.ImageShape)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return exportPathShape(ctx, source.childs[i] as types.PathShape)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return exportRectShape(ctx, source.childs[i] as types.RectShape)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return exportTextShape(ctx, source.childs[i] as types.TextShape)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return exportOvalShape(ctx, source.childs[i] as types.OvalShape)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return exportLineShape(ctx, source.childs[i] as types.LineShape)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
    }
    ctx.afterExport(source)
    return ret
}
/* artboard shape */
export function exportArtboard(ctx: IExportContext, source: types.Artboard): types.Artboard {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        if (typeof source.childs[i] != 'object') {
                            return source.childs[i]
                        }
                        if (source.childs[i].typeId == 'group-shape') {
                            return exportGroupShape(ctx, source.childs[i] as types.GroupShape)
                        }
                        if (source.childs[i].typeId == 'shape') {
                            return exportShape(ctx, source.childs[i] as types.Shape)
                        }
                        if (source.childs[i].typeId == 'flatten-shape') {
                            return exportFlattenShape(ctx, source.childs[i] as types.FlattenShape)
                        }
                        if (source.childs[i].typeId == 'image-shape') {
                            return exportImageShape(ctx, source.childs[i] as types.ImageShape)
                        }
                        if (source.childs[i].typeId == 'path-shape') {
                            return exportPathShape(ctx, source.childs[i] as types.PathShape)
                        }
                        if (source.childs[i].typeId == 'rect-shape') {
                            return exportRectShape(ctx, source.childs[i] as types.RectShape)
                        }
                        if (source.childs[i].typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(ctx, source.childs[i] as types.SymbolRefShape)
                        }
                        if (source.childs[i].typeId == 'text-shape') {
                            return exportTextShape(ctx, source.childs[i] as types.TextShape)
                        }
                        if (source.childs[i].typeId == 'oval-shape') {
                            return exportOvalShape(ctx, source.childs[i] as types.OvalShape)
                        }
                        if (source.childs[i].typeId == 'line-shape') {
                            return exportLineShape(ctx, source.childs[i] as types.LineShape)
                        }
                        {
                            console.error(source.childs[i])
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        hasBackgroundColor: source.hasBackgroundColor,
        includeBackgroundColorInExport: source.includeBackgroundColorInExport,
        backgroundColor: source.backgroundColor && exportColor(ctx, source.backgroundColor),
    }
    ctx.afterExport(source)
    return ret
}
/* artboard ref shape */
export function exportArtboardRef(ctx: IExportContext, source: types.ArtboardRef): types.ArtboardRef {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        name: source.name,
        type: exportShapeType(ctx, source.type),
        frame: exportShapeFrame(ctx, source.frame),
        style: exportStyle(ctx, source.style),
        boolOp: exportBoolOp(ctx, source.boolOp),
        isFixedToViewport: source.isFixedToViewport,
        isFlippedHorizontal: source.isFlippedHorizontal,
        isFlippedVertical: source.isFlippedVertical,
        isLocked: source.isLocked,
        isVisible: source.isVisible,
        exportOptions: source.exportOptions && exportExportOptions(ctx, source.exportOptions),
        nameIsFixed: source.nameIsFixed,
        resizingConstraint: source.resizingConstraint,
        resizingType: source.resizingType && exportResizeType(ctx, source.resizingType),
        rotation: source.rotation,
        constrainerProportions: source.constrainerProportions,
        clippingMaskMode: source.clippingMaskMode,
        hasClippingMask: source.hasClippingMask,
        shouldBreakMaskChain: source.shouldBreakMaskChain,
        refId: source.refId,
    }
    ctx.afterExport(source)
    return ret
}
