/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

import * as types from "./typesdefine"


export interface IExportContext {
    symbols?:Set<string>
    medias?:Set<string>
}
/* winding rule */
export function exportWindingRule(source: types.WindingRule, ctx?: IExportContext): types.WindingRule {
    return source
}
/* color */
export function exportVariable(source: types.Variable, ctx?: IExportContext): types.Variable {
    const ret = {
        id: source.id,
        type: exportVariableType(source.type, ctx),
        name: source.name,
        value: (() => {
            const val = source.value;
            if (typeof val != 'object') {
                return val
            }
            if (val instanceof Array) {
                const _val = val;
                return (() => {
                    const ret = []
                    for (let i = 0, len = _val.length; i < len; i++) {
                        const r = (() => {
                            const val = _val[i];
                            if (typeof val != 'object') {
                                return val
                            }
                            if (val.typeId == 'border') {
                                return exportBorder(val as types.Border, ctx)
                            }
                            if (val.typeId == 'fill') {
                                return exportFill(val as types.Fill, ctx)
                            }
                            {
                                throw new Error('unknow val: ' + val)
                            }
                        })()
                        if (r) ret.push(r)
                    }
                    return ret
                })()
            }
            if (val.typeId == 'color') {
                return exportColor(val as types.Color, ctx)
            }
            if (val.typeId == 'text') {
                return exportText(val as types.Text, ctx)
            }
            if (val.typeId == 'gradient') {
                return exportGradient(val as types.Gradient, ctx)
            }
            if (val.typeId == 'style') {
                return exportStyle(val as types.Style, ctx)
            }
            {
                throw new Error('unknow val: ' + val)
            }
        })(),
    }
    return ret
}
/* variable types */
export function exportVariableType(source: types.VariableType, ctx?: IExportContext): types.VariableType {
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
        typeId: source.typeId,
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
        windingRule: source.windingRule && exportWindingRule(source.windingRule, ctx),
        blur: source.blur && exportBlur(source.blur, ctx),
        borderOptions: source.borderOptions && exportBorderOptions(source.borderOptions, ctx),
        borders: (() => {
            const ret = []
            for (let i = 0, len = source.borders.length; i < len; i++) {
                const r = exportBorder(source.borders[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        colorControls: source.colorControls && exportColorControls(source.colorControls, ctx),
        contextSettings: source.contextSettings && exportContextSettings(source.contextSettings, ctx),
        fills: (() => {
            const ret = []
            for (let i = 0, len = source.fills.length; i < len; i++) {
                const r = exportFill(source.fills[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        innerShadows: source.innerShadows && (() => {
            const ret = []
            for (let i = 0, len = source.innerShadows.length; i < len; i++) {
                const r = exportShadow(source.innerShadows[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        shadows: source.shadows && (() => {
            const ret = []
            for (let i = 0, len = source.shadows.length; i < len; i++) {
                const r = exportShadow(source.shadows[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        contacts: source.contacts && (() => {
            const ret = []
            for (let i = 0, len = source.contacts.length; i < len; i++) {
                const r = exportContactRole(source.contacts[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        startMarkerType: source.startMarkerType && exportMarkerType(source.startMarkerType, ctx),
        endMarkerType: source.endMarkerType && exportMarkerType(source.endMarkerType, ctx),
        varbinds: source.varbinds && (() => {
            const val = source.varbinds;
            const ret: any = {};
            val.forEach((v, k) => {
                ret[k] = v
            });
            return ret;
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
        color: source.color && exportColor(source.color, ctx),
    }
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
        varbinds: source.varbinds && (() => {
            const val = source.varbinds;
            const ret: any = {};
            val.forEach((v, k) => {
                ret[k] = v
            });
            return ret;
        })(),
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
        color: exportColor(source.color, ctx),
        contextSettings: source.contextSettings && exportGraphicsContextSettings(source.contextSettings, ctx),
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
                const r = exportCurvePoint(source.points[i], ctx)
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
                const r = exportSpan(source.spans[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        attr: source.attr && exportParaAttr(source.attr, ctx),
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
/* padding */
export function exportPadding(source: types.Padding, ctx?: IExportContext): types.Padding {
    const ret = {
        left: source.left,
        top: source.top,
        right: source.right,
        bottom: source.bottom,
    }
    return ret
}
/* override types */
export function exportOverrideType(source: types.OverrideType, ctx?: IExportContext): types.OverrideType {
    return source
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
    return ret
}
/* gradient */
export function exportGradient(source: types.Gradient, ctx?: IExportContext): types.Gradient {
    const ret = {
        typeId: source.typeId,
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
    return ret
}
/* gradient type */
export function exportGradientType(source: types.GradientType, ctx?: IExportContext): types.GradientType {
    return source
}
/* fill */
export function exportFill(source: types.Fill, ctx?: IExportContext): types.Fill {
    const ret = {
        typeId: source.typeId,
        id: source.id,
        isEnabled: source.isEnabled,
        fillType: exportFillType(source.fillType, ctx),
        color: exportColor(source.color, ctx),
        contextSettings: source.contextSettings && exportContextSettings(source.contextSettings, ctx),
        gradient: source.gradient && exportGradient(source.gradient, ctx),
        imageRef: source.imageRef,
    }
    // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
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
                const r = exportPageListItem(source.pagesList[i], ctx)
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
        curveFrom: exportPoint2D(source.curveFrom, ctx),
        curveTo: exportPoint2D(source.curveTo, ctx),
        hasCurveFrom: source.hasCurveFrom,
        hasCurveTo: source.hasCurveTo,
        curveMode: exportCurveMode(source.curveMode, ctx),
        point: exportPoint2D(source.point, ctx),
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
        blenMode: exportBlendMode(source.blenMode, ctx),
        opacity: source.opacity,
    }
    return ret
}
/* contact type */
export function exportContactType(source: types.ContactType, ctx?: IExportContext): types.ContactType {
    return source
}
/* contactstyle */
export function exportContactRole(source: types.ContactRole, ctx?: IExportContext): types.ContactRole {
    const ret = {
        id: source.id,
        roleType: exportContactRoleType(source.roleType, ctx),
        shapeId: source.shapeId,
    }
    return ret
}
/* contact role type */
export function exportContactRoleType(source: types.ContactRoleType, ctx?: IExportContext): types.ContactRoleType {
    return source
}
/* contact form */
export function exportContactForm(source: types.ContactForm, ctx?: IExportContext): types.ContactForm {
    const ret = {
        contactType: exportContactType(source.contactType, ctx),
        shapeId: source.shapeId,
    }
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
    return ret
}
/* color */
export function exportColor(source: types.Color, ctx?: IExportContext): types.Color {
    const ret = {
        typeId: source.typeId,
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
        behavior: source.behavior && exportBulletNumbersBehavior(source.behavior, ctx),
        offset: source.offset,
        type: exportBulletNumbersType(source.type, ctx),
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
        typeId: source.typeId,
        id: source.id,
        isEnabled: source.isEnabled,
        fillType: exportFillType(source.fillType, ctx),
        color: exportColor(source.color, ctx),
        contextSettings: source.contextSettings && exportContextSettings(source.contextSettings, ctx),
        position: exportBorderPosition(source.position, ctx),
        thickness: source.thickness,
        gradient: source.gradient && exportGradient(source.gradient, ctx),
        borderStyle: exportBorderStyle(source.borderStyle, ctx),
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
        lineCapStyle: exportLineCapStyle(source.lineCapStyle, ctx),
        lineJoinStyle: exportLineJoinStyle(source.lineJoinStyle, ctx),
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
        center: exportPoint2D(source.center, ctx),
        motionAngle: source.motionAngle,
        radius: source.radius,
        saturation: source.saturation,
        type: exportBlurType(source.type, ctx),
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        text: exportText(source.text, ctx),
        fixedRadius: source.fixedRadius,
    }
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        datas: (() => {
            const ret = []
            for (let i = 0, len = source.datas.length; i < len; i++) {
                const r = (() => {
                    const val = source.datas[i];
                    if (typeof val != 'object') {
                        return val
                    }
                    if (val.typeId == 'table-cell') {
                        return exportTableCell(val as types.TableCell, ctx)
                    }
                    {
                        throw new Error('unknow val: ' + val)
                    }
                })()
                ret.push(r)
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
        textAttr: source.textAttr && exportTextAttr(source.textAttr, ctx),
    }
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        cellType: source.cellType && exportTableCellType(source.cellType, ctx),
        text: source.text && exportText(source.text, ctx),
        imageRef: source.imageRef,
        rowSpan: source.rowSpan,
        colSpan: source.colSpan,
    }
    // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        refId: source.refId,
        overrides: source.overrides && (() => {
            const val = source.overrides;
            const ret: any = {};
            val.forEach((v, k) => {
                ret[k] = v
            });
            return ret;
        })(),
        variables: (() => {
            const val = source.variables;
            const ret: any = {};
            val.forEach((v, k) => {
                ret[k] = exportVariable(v, ctx)
            });
            return ret;
        })(),
    }
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
    return ret
}
/* path shape */
export function exportPathShape2(source: types.PathShape2, ctx?: IExportContext): types.PathShape2 {
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        pathsegs: (() => {
            const ret = []
            for (let i = 0, len = source.pathsegs.length; i < len; i++) {
                const r = exportPathSegment(source.pathsegs[i], ctx)
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        points: (() => {
            const ret = []
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = exportCurvePoint(source.points[i], ctx)
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
        fixedRadius: source.fixedRadius,
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
    }
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
        padding: source.padding && exportPadding(source.padding, ctx),
    }
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        childs: (() => {
            const ret = []
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {
                    const val = source.childs[i];
                    if (typeof val != 'object') {
                        return val
                    }
                    if (val.typeId == 'shape') {
                        return exportShape(val as types.Shape, ctx)
                    }
                    if (val.typeId == 'flatten-shape') {
                        return exportFlattenShape(val as types.FlattenShape, ctx)
                    }
                    if (val.typeId == 'group-shape') {
                        return exportGroupShape(val as types.GroupShape, ctx)
                    }
                    if (val.typeId == 'image-shape') {
                        return exportImageShape(val as types.ImageShape, ctx)
                    }
                    if (val.typeId == 'path-shape') {
                        return exportPathShape(val as types.PathShape, ctx)
                    }
                    if (val.typeId == 'rect-shape') {
                        return exportRectShape(val as types.RectShape, ctx)
                    }
                    if (val.typeId == 'text-shape') {
                        return exportTextShape(val as types.TextShape, ctx)
                    }
                    if (val.typeId == 'oval-shape') {
                        return exportOvalShape(val as types.OvalShape, ctx)
                    }
                    if (val.typeId == 'line-shape') {
                        return exportLineShape(val as types.LineShape, ctx)
                    }
                    if (val.typeId == 'artboard') {
                        return exportArtboard(val as types.Artboard, ctx)
                    }
                    if (val.typeId == 'contact-shape') {
                        return exportContactShape(val as types.ContactShape, ctx)
                    }
                    if (val.typeId == 'symbol-ref-shape') {
                        return exportSymbolRefShape(val as types.SymbolRefShape, ctx)
                    }
                    if (val.typeId == 'table-shape') {
                        return exportTableShape(val as types.TableShape, ctx)
                    }
                    if (val.typeId == 'symbol-shape') {
                        return exportSymbolShape(val as types.SymbolShape, ctx)
                    }
                    {
                        throw new Error('unknow val: ' + val)
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
        fixedRadius: source.fixedRadius,
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        ellipse: exportEllipse(source.ellipse, ctx),
    }
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
        fixedRadius: source.fixedRadius,
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
    }
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
        points: (() => {
                const ret = []
                for (let i = 0, len = source.points.length; i < len; i++) {
                    const r = exportCurvePoint(source.points[i], ctx)
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isClosed: source.isClosed,
        fixedRadius: source.fixedRadius,
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        imageRef: source.imageRef,
    }
    // inject code
    if (ctx?.medias) ctx.medias.add(ret.imageRef);
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        childs: (() => {
            const ret = []
            for (let i = 0, len = source.childs.length; i < len; i++) {
                const r = (() => {
                    const val = source.childs[i];
                    if (typeof val != 'object') {
                        return val
                    }
                    if (val.typeId == 'group-shape') {
                        return exportGroupShape(val as types.GroupShape, ctx)
                    }
                    if (val.typeId == 'image-shape') {
                        return exportImageShape(val as types.ImageShape, ctx)
                    }
                    if (val.typeId == 'path-shape') {
                        return exportPathShape(val as types.PathShape, ctx)
                    }
                    if (val.typeId == 'rect-shape') {
                        return exportRectShape(val as types.RectShape, ctx)
                    }
                    if (val.typeId == 'symbol-ref-shape') {
                        return exportSymbolRefShape(val as types.SymbolRefShape, ctx)
                    }
                    if (val.typeId == 'symbol-shape') {
                        return exportSymbolShape(val as types.SymbolShape, ctx)
                    }
                    if (val.typeId == 'text-shape') {
                        return exportTextShape(val as types.TextShape, ctx)
                    }
                    if (val.typeId == 'artboard') {
                        return exportArtboard(val as types.Artboard, ctx)
                    }
                    if (val.typeId == 'line-shape') {
                        return exportLineShape(val as types.LineShape, ctx)
                    }
                    if (val.typeId == 'oval-shape') {
                        return exportOvalShape(val as types.OvalShape, ctx)
                    }
                    if (val.typeId == 'table-shape') {
                        return exportTableShape(val as types.TableShape, ctx)
                    }
                    if (val.typeId == 'contact-shape') {
                        return exportContactShape(val as types.ContactShape, ctx)
                    }
                    if (val.typeId == 'shape') {
                        return exportShape(val as types.Shape, ctx)
                    }
                    if (val.typeId == 'flatten-shape') {
                        return exportFlattenShape(val as types.FlattenShape, ctx)
                    }
                    {
                        throw new Error('unknow val: ' + val)
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
        type: exportShapeType(source.type, ctx),
        frame: exportShapeFrame(source.frame, ctx),
        style: exportStyle(source.style, ctx),
        childs: (() => {
                const ret = []
                for (let i = 0, len = source.childs.length; i < len; i++) {
                    const r = (() => {
                        const val = source.childs[i];
                        if (typeof val != 'object') {
                            return val
                        }
                        if (val.typeId == 'group-shape') {
                            return exportGroupShape(val as types.GroupShape, ctx)
                        }
                        if (val.typeId == 'image-shape') {
                            return exportImageShape(val as types.ImageShape, ctx)
                        }
                        if (val.typeId == 'path-shape') {
                            return exportPathShape(val as types.PathShape, ctx)
                        }
                        if (val.typeId == 'rect-shape') {
                            return exportRectShape(val as types.RectShape, ctx)
                        }
                        if (val.typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(val as types.SymbolRefShape, ctx)
                        }
                        if (val.typeId == 'symbol-shape') {
                            return exportSymbolShape(val as types.SymbolShape, ctx)
                        }
                        if (val.typeId == 'text-shape') {
                            return exportTextShape(val as types.TextShape, ctx)
                        }
                        if (val.typeId == 'artboard') {
                            return exportArtboard(val as types.Artboard, ctx)
                        }
                        if (val.typeId == 'line-shape') {
                            return exportLineShape(val as types.LineShape, ctx)
                        }
                        if (val.typeId == 'oval-shape') {
                            return exportOvalShape(val as types.OvalShape, ctx)
                        }
                        if (val.typeId == 'table-shape') {
                            return exportTableShape(val as types.TableShape, ctx)
                        }
                        if (val.typeId == 'contact-shape') {
                            return exportContactShape(val as types.ContactShape, ctx)
                        }
                        if (val.typeId == 'shape') {
                            return exportShape(val as types.Shape, ctx)
                        }
                        if (val.typeId == 'flatten-shape') {
                            return exportFlattenShape(val as types.FlattenShape, ctx)
                        }
                        {
                            throw new Error('unknow val: ' + val)
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isBoolOpShape: source.isBoolOpShape,
        fixedRadius: source.fixedRadius,
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        isUnionSymbolShape: source.isUnionSymbolShape,
        overrides: source.overrides && (() => {
            const val = source.overrides;
            const ret: any = {};
            val.forEach((v, k) => {
                ret[k] = v
            });
            return ret;
        })(),
        variables: (() => {
            const val = source.variables;
            const ret: any = {};
            val.forEach((v, k) => {
                ret[k] = exportVariable(v, ctx)
            });
            return ret;
        })(),
        vartag: source.vartag && (() => {
            const val = source.vartag;
            const ret: any = {};
            val.forEach((v, k) => {
                ret[k] = v
            });
            return ret;
        })(),
    }
    // inject code
    if (ctx?.symbols) ctx.symbols.add(ret.id);
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
                        const val = source.childs[i];
                        if (typeof val != 'object') {
                            return val
                        }
                        if (val.typeId == 'group-shape') {
                            return exportGroupShape(val as types.GroupShape, ctx)
                        }
                        if (val.typeId == 'image-shape') {
                            return exportImageShape(val as types.ImageShape, ctx)
                        }
                        if (val.typeId == 'path-shape') {
                            return exportPathShape(val as types.PathShape, ctx)
                        }
                        if (val.typeId == 'rect-shape') {
                            return exportRectShape(val as types.RectShape, ctx)
                        }
                        if (val.typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(val as types.SymbolRefShape, ctx)
                        }
                        if (val.typeId == 'symbol-shape') {
                            return exportSymbolShape(val as types.SymbolShape, ctx)
                        }
                        if (val.typeId == 'text-shape') {
                            return exportTextShape(val as types.TextShape, ctx)
                        }
                        if (val.typeId == 'artboard') {
                            return exportArtboard(val as types.Artboard, ctx)
                        }
                        if (val.typeId == 'line-shape') {
                            return exportLineShape(val as types.LineShape, ctx)
                        }
                        if (val.typeId == 'oval-shape') {
                            return exportOvalShape(val as types.OvalShape, ctx)
                        }
                        if (val.typeId == 'table-shape') {
                            return exportTableShape(val as types.TableShape, ctx)
                        }
                        if (val.typeId == 'contact-shape') {
                            return exportContactShape(val as types.ContactShape, ctx)
                        }
                        if (val.typeId == 'shape') {
                            return exportShape(val as types.Shape, ctx)
                        }
                        if (val.typeId == 'flatten-shape') {
                            return exportFlattenShape(val as types.FlattenShape, ctx)
                        }
                        {
                            throw new Error('unknow val: ' + val)
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isBoolOpShape: source.isBoolOpShape,
        fixedRadius: source.fixedRadius,
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
    }
    return ret
}
/* contact shape */
export function exportContactShape(source: types.ContactShape, ctx?: IExportContext): types.ContactShape {
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
        points: (() => {
            const ret = []
            for (let i = 0, len = source.points.length; i < len; i++) {
                const r = exportCurvePoint(source.points[i], ctx)
                if (r) ret.push(r)
            }
            return ret
        })(),
        from: source.from && exportContactForm(source.from, ctx),
        to: source.to && exportContactForm(source.to, ctx),
        isEdited: source.isEdited,
        isClosed: source.isClosed,
        mark: source.mark,
        text: exportText(source.text, ctx),
        fixedRadius: source.fixedRadius,
    }
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
                        const val = source.childs[i];
                        if (typeof val != 'object') {
                            return val
                        }
                        if (val.typeId == 'group-shape') {
                            return exportGroupShape(val as types.GroupShape, ctx)
                        }
                        if (val.typeId == 'image-shape') {
                            return exportImageShape(val as types.ImageShape, ctx)
                        }
                        if (val.typeId == 'path-shape') {
                            return exportPathShape(val as types.PathShape, ctx)
                        }
                        if (val.typeId == 'rect-shape') {
                            return exportRectShape(val as types.RectShape, ctx)
                        }
                        if (val.typeId == 'symbol-ref-shape') {
                            return exportSymbolRefShape(val as types.SymbolRefShape, ctx)
                        }
                        if (val.typeId == 'symbol-shape') {
                            return exportSymbolShape(val as types.SymbolShape, ctx)
                        }
                        if (val.typeId == 'text-shape') {
                            return exportTextShape(val as types.TextShape, ctx)
                        }
                        if (val.typeId == 'artboard') {
                            return exportArtboard(val as types.Artboard, ctx)
                        }
                        if (val.typeId == 'line-shape') {
                            return exportLineShape(val as types.LineShape, ctx)
                        }
                        if (val.typeId == 'oval-shape') {
                            return exportOvalShape(val as types.OvalShape, ctx)
                        }
                        if (val.typeId == 'table-shape') {
                            return exportTableShape(val as types.TableShape, ctx)
                        }
                        if (val.typeId == 'contact-shape') {
                            return exportContactShape(val as types.ContactShape, ctx)
                        }
                        if (val.typeId == 'shape') {
                            return exportShape(val as types.Shape, ctx)
                        }
                        if (val.typeId == 'flatten-shape') {
                            return exportFlattenShape(val as types.FlattenShape, ctx)
                        }
                        {
                            throw new Error('unknow val: ' + val)
                        }
                    })()
                    if (r) ret.push(r)
                }
                return ret
            })(),
        isBoolOpShape: source.isBoolOpShape,
        fixedRadius: source.fixedRadius,
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
        varbinds: source.varbinds && (() => {
                const val = source.varbinds;
                const ret: any = {};
                val.forEach((v, k) => {
                    ret[k] = v
                });
                return ret;
            })(),
    }
    return ret
}
