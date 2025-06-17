/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

/* 代码生成，勿手动修改 */
import * as impl from "./classes"
import * as types from "./typesdefine"
import { BasicArray, BasicMap } from "./basic"
import { uuid } from "../basic/uuid"
import { compatibleOldData } from "./basecompatible"
import { is_mac } from "./utils"
export interface IImportContext {
    document: impl.Document
    fmtVer: string
}
function objkeys(obj: any) {
    return obj instanceof Map ? obj : { forEach: (f: (v: any, k: string) => void) => Object.keys(obj).forEach((k) => f(obj[k], k)) };
}
type Artboard_guides = BasicArray<impl.Guide>
type Border_strokePaints = BasicArray<impl.Fill>
type DocumentMeta_pagesList = BasicArray<impl.PageListItem>
type DocumentMeta_stylelib = BasicArray<impl.StyleSheet>
type ExportOptions_exportFormats = BasicArray<impl.ExportFormat>
type FillMask_fills = BasicArray<impl.Fill>
type Gradient_stops = BasicArray<impl.Stop>
type GroupShape_childs = BasicArray<impl.GroupShape | impl.ImageShape | impl.PathShape | impl.PathShape2 | impl.RectShape | impl.SymbolRefShape | impl.SymbolShape | impl.SymbolUnionShape | impl.TextShape | impl.Artboard | impl.LineShape | impl.OvalShape | impl.TableShape | impl.ContactShape | impl.Shape | impl.CutoutShape | impl.BoolShape | impl.PolygonShape | impl.StarShape>
type Guide_crdtidx = BasicArray<number>
type Page_guides = BasicArray<impl.Guide>
type Page_connections = BasicArray<impl.Connection>
type Para_spans = BasicArray<impl.Span>
type PathSegment_points = BasicArray<impl.CurvePoint>
type PathShape_pathsegs = BasicArray<impl.PathSegment>
type PathShape2_pathsegs = BasicArray<impl.PathSegment>
type PrototypeInteraction_crdtidx = BasicArray<number>
type ShadowMask_shadows = BasicArray<impl.Shadow>
type Shape_prototypeInteractions = BasicArray<impl.PrototypeInteraction>
type StyleSheet_variables = BasicArray<impl.FillMask | impl.ShadowMask | impl.BlurMask | impl.BorderMask | impl.RadiusMask | impl.TextMask>
type Style_fills = BasicArray<impl.Fill>
type Style_shadows = BasicArray<impl.Shadow>
type Style_innerShadows = BasicArray<impl.Shadow>
type Style_contacts = BasicArray<impl.ContactRole>
type SymbolShape_guides = BasicArray<impl.Guide>
type TableShape_rowHeights = BasicArray<impl.CrdtNumber>
type TableShape_colWidths = BasicArray<impl.CrdtNumber>
type TableShape2_rowHeights = BasicArray<impl.CrdtNumber>
type TableShape2_colWidths = BasicArray<impl.CrdtNumber>
type Text_paras = BasicArray<impl.Para>
type Variable_0 = BasicArray<impl.Fill | impl.Shadow | impl.PrototypeInteraction>
export function importArtboard_guides(source: types.Artboard_guides, ctx?: IImportContext): Artboard_guides {
    const ret: Artboard_guides = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importGuide(source, ctx))
    })
    return ret
}
/* blend mode */
export function importBlendMode(source: types.BlendMode, ctx?: IImportContext): impl.BlendMode {
    return source
}
/* blur types */
export function importBlurType(source: types.BlurType, ctx?: IImportContext): impl.BlurType {
    return source
}
/* bool op types */
export function importBoolOp(source: types.BoolOp, ctx?: IImportContext): impl.BoolOp {
    return source
}
/* border position */
export function importBorderPosition(source: types.BorderPosition, ctx?: IImportContext): impl.BorderPosition {
    return source
}
/* border style */
export function importBorderStyle(source: types.BorderStyle, ctx?: IImportContext): impl.BorderStyle {
    const ret: impl.BorderStyle = new impl.BorderStyle (
        source.length,
        source.gap)
    return ret
}
export function importBorder_strokePaints(source: types.Border_strokePaints, ctx?: IImportContext): Border_strokePaints {
    const ret: Border_strokePaints = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importFill(source, ctx))
    })
    return ret
}
/* bullet & item number behavior */
export function importBulletNumbersBehavior(source: types.BulletNumbersBehavior, ctx?: IImportContext): impl.BulletNumbersBehavior {
    return source
}
/* bullet & item number types */
export function importBulletNumbersType(source: types.BulletNumbersType, ctx?: IImportContext): impl.BulletNumbersType {
    return source
}
/* bullet numbers */
function importBulletNumbersOptional(tar: impl.BulletNumbers, source: types.BulletNumbers, ctx?: IImportContext) {
    if (source.behavior !== undefined) tar.behavior = importBulletNumbersBehavior(source.behavior, ctx)
    if (source.offset !== undefined) tar.offset = source.offset
}
export function importBulletNumbers(source: types.BulletNumbers, ctx?: IImportContext): impl.BulletNumbers {
    const ret: impl.BulletNumbers = new impl.BulletNumbers (
        importBulletNumbersType(source.type, ctx))
    importBulletNumbersOptional(ret, source, ctx)
    return ret
}
/* color controls */
export function importColorControls(source: types.ColorControls, ctx?: IImportContext): impl.ColorControls {
    const ret: impl.ColorControls = new impl.ColorControls (
        source.isEnabled,
        source.brightness,
        source.contrast,
        source.hue,
        source.saturation)
    return ret
}
/* color */
export function importColor(source: types.Color, ctx?: IImportContext): impl.Color {
    const ret: impl.Color = new impl.Color (
        source.alpha,
        source.red,
        source.green,
        source.blue)
    return ret
}
/* contact role type */
export function importContactRoleType(source: types.ContactRoleType, ctx?: IImportContext): impl.ContactRoleType {
    return source
}
/* contact type */
export function importContactType(source: types.ContactType, ctx?: IImportContext): impl.ContactType {
    return source
}
/* context settings */
export function importContextSettings(source: types.ContextSettings, ctx?: IImportContext): impl.ContextSettings {
    const ret: impl.ContextSettings = new impl.ContextSettings (
        importBlendMode(source.blenMode, ctx),
        source.opacity)
    return ret
}
/* couner radius */
export function importCornerRadius(source: types.CornerRadius, ctx?: IImportContext): impl.CornerRadius {
    const ret: impl.CornerRadius = new impl.CornerRadius (
        source.id,
        source.lt,
        source.rt,
        source.lb,
        source.rb)
    return ret
}
/* corner type */
export function importCornerType(source: types.CornerType, ctx?: IImportContext): impl.CornerType {
    return source
}
/* crdtidx */
export function importCrdtidx(source: types.Crdtidx, ctx?: IImportContext): impl.Crdtidx {
    const ret: impl.Crdtidx = new BasicArray()
    source.forEach((source, i) => {
        ret.push(source)
    })
    return ret
}
/* curve mode */
export function importCurveMode(source: types.CurveMode, ctx?: IImportContext): impl.CurveMode {
    return source
}
/* curve point */
function importCurvePointOptional(tar: impl.CurvePoint, source: types.CurvePoint, ctx?: IImportContext) {
    if (source.radius !== undefined) tar.radius = source.radius
    if (source.fromX !== undefined) tar.fromX = source.fromX
    if (source.fromY !== undefined) tar.fromY = source.fromY
    if (source.toX !== undefined) tar.toX = source.toX
    if (source.toY !== undefined) tar.toY = source.toY
    if (source.hasFrom !== undefined) tar.hasFrom = source.hasFrom
    if (source.hasTo !== undefined) tar.hasTo = source.hasTo
}
export function importCurvePoint(source: types.CurvePoint, ctx?: IImportContext): impl.CurvePoint {
    const ret: impl.CurvePoint = new impl.CurvePoint (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.x,
        source.y,
        importCurveMode(source.mode, ctx))
    importCurvePointOptional(ret, source, ctx)
    return ret
}
export function importDocumentMeta_pagesList(source: types.DocumentMeta_pagesList, ctx?: IImportContext): DocumentMeta_pagesList {
    const ret: DocumentMeta_pagesList = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importPageListItem(source, ctx))
    })
    return ret
}
export function importDocumentMeta_stylelib(source: types.DocumentMeta_stylelib, ctx?: IImportContext): DocumentMeta_stylelib {
    const ret: DocumentMeta_stylelib = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importStyleSheet(source, ctx))
    })
    return ret
}
/* ellipse attributes */
export function importEllipse(source: types.Ellipse, ctx?: IImportContext): impl.Ellipse {
    const ret: impl.Ellipse = new impl.Ellipse (
        source.cx,
        source.cy,
        source.rx,
        source.ry)
    return ret
}
/* export file format */
export function importExportFileFormat(source: types.ExportFileFormat, ctx?: IImportContext): impl.ExportFileFormat {
    return source
}
/* export format nameing scheme */
export function importExportFormatNameingScheme(source: types.ExportFormatNameingScheme, ctx?: IImportContext): impl.ExportFormatNameingScheme {
    return source
}
export function importExportOptions_exportFormats(source: types.ExportOptions_exportFormats, ctx?: IImportContext): ExportOptions_exportFormats {
    const ret: ExportOptions_exportFormats = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importExportFormat(source, ctx))
    })
    return ret
}
/* visible scale type */
export function importExportVisibleScaleType(source: types.ExportVisibleScaleType, ctx?: IImportContext): impl.ExportVisibleScaleType {
    return source
}
export function importFillMask_fills(source: types.FillMask_fills, ctx?: IImportContext): FillMask_fills {
    const ret: FillMask_fills = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importFill(source, ctx))
    })
    return ret
}
/* fill rule */
export function importFillRule(source: types.FillRule, ctx?: IImportContext): impl.FillRule {
    return source
}
/* fill types */
export function importFillType(source: types.FillType, ctx?: IImportContext): impl.FillType {
    return source
}
/* gradient type */
export function importGradientType(source: types.GradientType, ctx?: IImportContext): impl.GradientType {
    return source
}
export function importGradient_stops(source: types.Gradient_stops, ctx?: IImportContext): Gradient_stops {
    const ret: Gradient_stops = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importStop(source, ctx))
    })
    return ret
}
/* graphics contex settings */
export function importGraphicsContextSettings(source: types.GraphicsContextSettings, ctx?: IImportContext): impl.GraphicsContextSettings {
    const ret: impl.GraphicsContextSettings = new impl.GraphicsContextSettings (
        importBlendMode(source.blendMode, ctx),
        source.opacity)
    return ret
}
export function importGroupShape_childs(source: types.GroupShape_childs, ctx?: IImportContext): GroupShape_childs {
    const ret: GroupShape_childs = new BasicArray()
    source.forEach((source, i) => {
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "group-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importGroupShape(source as types.GroupShape, ctx)
            }
            if (source.typeId === "image-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importImageShape(source as types.ImageShape, ctx)
            }
            if (source.typeId === "path-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importPathShape(source as types.PathShape, ctx)
            }
            if (source.typeId === "path-shape2") {
                return importPathShape2(source as types.PathShape2, ctx)
            }
            if (source.typeId === "rect-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importRectShape(source as types.RectShape, ctx)
            }
            if (source.typeId === "symbol-ref-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importSymbolRefShape(source as types.SymbolRefShape, ctx)
            }
            if (source.typeId === "symbol-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importSymbolShape(source as types.SymbolShape, ctx)
            }
            if (source.typeId === "symbol-union-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importSymbolUnionShape(source as types.SymbolUnionShape, ctx)
            }
            if (source.typeId === "text-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importTextShape(source as types.TextShape, ctx)
            }
            if (source.typeId === "artboard") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importArtboard(source as types.Artboard, ctx)
            }
            if (source.typeId === "line-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importLineShape(source as types.LineShape, ctx)
            }
            if (source.typeId === "oval-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importOvalShape(source as types.OvalShape, ctx)
            }
            if (source.typeId === "table-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importTableShape(source as types.TableShape, ctx)
            }
            if (source.typeId === "contact-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importContactShape(source as types.ContactShape, ctx)
            }
            if (source.typeId === "shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importShape(source as types.Shape, ctx)
            }
            if (source.typeId === "cutout-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importCutoutShape(source as types.CutoutShape, ctx)
            }
            if (source.typeId === "bool-shape") {
                return importBoolShape(source as types.BoolShape, ctx)
            }
            if (source.typeId === "polygon-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importPolygonShape(source as types.PolygonShape, ctx)
            }
            if (source.typeId === "star-shape") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importStarShape(source as types.StarShape, ctx)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* guide axis */
export function importGuideAxis(source: types.GuideAxis, ctx?: IImportContext): impl.GuideAxis {
    return source
}
export function importGuide_crdtidx(source: types.Guide_crdtidx, ctx?: IImportContext): Guide_crdtidx {
    const ret: Guide_crdtidx = new BasicArray()
    source.forEach((source, i) => {
        ret.push(source)
    })
    return ret
}
/* guide */
export function importGuide(source: types.Guide, ctx?: IImportContext): impl.Guide {
    const ret: impl.Guide = new impl.Guide (
        importGuide_crdtidx(source.crdtidx, ctx),
        source.id,
        importGuideAxis(source.axis, ctx),
        source.offset)
    return ret
}
/* image scale mode */
export function importImageScaleMode(source: types.ImageScaleMode, ctx?: IImportContext): impl.ImageScaleMode {
    return source
}
/* line cap style */
export function importLineCapStyle(source: types.LineCapStyle, ctx?: IImportContext): impl.LineCapStyle {
    return source
}
/* line join style */
export function importLineJoinStyle(source: types.LineJoinStyle, ctx?: IImportContext): impl.LineJoinStyle {
    return source
}
/* marker type */
export function importMarkerType(source: types.MarkerType, ctx?: IImportContext): impl.MarkerType {
    return source
}
/* overlayBackgroundInteraction */
export function importOverlayBackgroundInteraction(source: types.OverlayBackgroundInteraction, ctx?: IImportContext): impl.OverlayBackgroundInteraction {
    return source
}
/* interactionType */
export function importOverlayBackgroundType(source: types.OverlayBackgroundType, ctx?: IImportContext): impl.OverlayBackgroundType {
    return source
}
/* overlay margin */
export function importOverlayMargin(source: types.OverlayMargin, ctx?: IImportContext): impl.OverlayMargin {
    const ret: impl.OverlayMargin = new impl.OverlayMargin (
        source.top,
        source.bottom,
        source.left,
        source.right)
    return ret
}
/* overlayPositionType */
export function importOverlayPositionType(source: types.OverlayPositionType, ctx?: IImportContext): impl.OverlayPositionType {
    return source
}
/* overlay position */
export function importOverlayPosition(source: types.OverlayPosition, ctx?: IImportContext): impl.OverlayPosition {
    const ret: impl.OverlayPosition = new impl.OverlayPosition (
        importOverlayPositionType(source.position, ctx),
        importOverlayMargin(source.margin, ctx))
    return ret
}
/* override types */
export function importOverrideType(source: types.OverrideType, ctx?: IImportContext): impl.OverrideType {
    return source
}
/* padding */
function importPaddingOptional(tar: impl.Padding, source: types.Padding, ctx?: IImportContext) {
    if (source.left !== undefined) tar.left = source.left
    if (source.top !== undefined) tar.top = source.top
    if (source.right !== undefined) tar.right = source.right
    if (source.bottom !== undefined) tar.bottom = source.bottom
}
export function importPadding(source: types.Padding, ctx?: IImportContext): impl.Padding {
    const ret: impl.Padding = new impl.Padding ()
    importPaddingOptional(ret, source, ctx)
    return ret
}
/* page list item */
function importPageListItemOptional(tar: impl.PageListItem, source: types.PageListItem, ctx?: IImportContext) {
    if (source.versionId !== undefined) tar.versionId = source.versionId
}
export function importPageListItem(source: types.PageListItem, ctx?: IImportContext): impl.PageListItem {
    const ret: impl.PageListItem = new impl.PageListItem (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name)
    importPageListItemOptional(ret, source, ctx)
    return ret
}
export function importPage_guides(source: types.Page_guides, ctx?: IImportContext): Page_guides {
    const ret: Page_guides = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importGuide(source, ctx))
    })
    return ret
}
export function importPage_connections(source: types.Page_connections, ctx?: IImportContext): Page_connections {
    const ret: Page_connections = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importConnection(source, ctx))
    })
    return ret
}
/* paint filter */
export function importPaintFilter(source: types.PaintFilter, ctx?: IImportContext): impl.PaintFilter {
    const ret: impl.PaintFilter = new impl.PaintFilter (
        source.exposure,
        source.contrast,
        source.saturation,
        source.temperature,
        source.tint,
        source.shadow,
        source.hue)
    return ret
}
/* paint filter type */
export function importPaintFilterType(source: types.PaintFilterType, ctx?: IImportContext): impl.PaintFilterType {
    return source
}
export function importPara_spans(source: types.Para_spans, ctx?: IImportContext): Para_spans {
    const ret: Para_spans = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importSpan(source, ctx))
    })
    return ret
}
export function importPathSegment_points(source: types.PathSegment_points, ctx?: IImportContext): PathSegment_points {
    const ret: PathSegment_points = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importCurvePoint(source, ctx))
    })
    return ret
}
/* path segment */
export function importPathSegment(source: types.PathSegment, ctx?: IImportContext): impl.PathSegment {
    const ret: impl.PathSegment = new impl.PathSegment (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        importPathSegment_points(source.points, ctx),
        source.isClosed)
    return ret
}
export function importPathShape_pathsegs(source: types.PathShape_pathsegs, ctx?: IImportContext): PathShape_pathsegs {
    const ret: PathShape_pathsegs = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importPathSegment(source, ctx))
    })
    return ret
}
export function importPathShape2_pathsegs(source: types.PathShape2_pathsegs, ctx?: IImportContext): PathShape2_pathsegs {
    const ret: PathShape2_pathsegs = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importPathSegment(source, ctx))
    })
    return ret
}
/* pattern transform */
export function importPatternTransform(source: types.PatternTransform, ctx?: IImportContext): impl.PatternTransform {
    const ret: impl.PatternTransform = new impl.PatternTransform (
        source.m00,
        source.m01,
        source.m02,
        source.m10,
        source.m11,
        source.m12)
    return ret
}
/* point 2d */
export function importPoint2D(source: types.Point2D, ctx?: IImportContext): impl.Point2D {
    const ret: impl.Point2D = new impl.Point2D (
        source.x,
        source.y)
    return ret
}
/* connectionType */
export function importPrototypeConnectionType(source: types.PrototypeConnectionType, ctx?: IImportContext): impl.PrototypeConnectionType {
    return source
}
/* prototypeEasingBezier */
export function importPrototypeEasingBezier(source: types.PrototypeEasingBezier, ctx?: IImportContext): impl.PrototypeEasingBezier {
    const ret: impl.PrototypeEasingBezier = new impl.PrototypeEasingBezier (
        source.x1,
        source.y1,
        source.x2,
        source.y2)
    return ret
}
/* easingType */
export function importPrototypeEasingType(source: types.PrototypeEasingType, ctx?: IImportContext): impl.PrototypeEasingType {
    return source
}
/* interactionType */
export function importPrototypeEvents(source: types.PrototypeEvents, ctx?: IImportContext): impl.PrototypeEvents {
    return source
}
export function importPrototypeInteraction_crdtidx(source: types.PrototypeInteraction_crdtidx, ctx?: IImportContext): PrototypeInteraction_crdtidx {
    const ret: PrototypeInteraction_crdtidx = new BasicArray()
    source.forEach((source, i) => {
        ret.push(source)
    })
    return ret
}
/* navigationType */
export function importPrototypeNavigationType(source: types.PrototypeNavigationType, ctx?: IImportContext): impl.PrototypeNavigationType {
    return source
}
/* prototypeStartingPoint */
export function importPrototypeStartingPoint(source: types.PrototypeStartingPoint, ctx?: IImportContext): impl.PrototypeStartingPoint {
    const ret: impl.PrototypeStartingPoint = new impl.PrototypeStartingPoint (
        source.name,
        source.desc)
    return ret
}
/* transitionType */
export function importPrototypeTransitionType(source: types.PrototypeTransitionType, ctx?: IImportContext): impl.PrototypeTransitionType {
    return source
}
/* crdtidx */
export function importRadius(source: types.Radius, ctx?: IImportContext): impl.Radius {
    const ret: impl.Radius = new BasicArray()
    source.forEach((source, i) => {
        ret.push(source)
    })
    return ret
}
/* resize type */
export function importResizeType(source: types.ResizeType, ctx?: IImportContext): impl.ResizeType {
    return source
}
/* scrollBehavior */
export function importScrollBehavior(source: types.ScrollBehavior, ctx?: IImportContext): impl.ScrollBehavior {
    return source
}
/* scrollDirection */
export function importScrollDirection(source: types.ScrollDirection, ctx?: IImportContext): impl.ScrollDirection {
    return source
}
export function importShadowMask_shadows(source: types.ShadowMask_shadows, ctx?: IImportContext): ShadowMask_shadows {
    const ret: ShadowMask_shadows = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importShadow(source, ctx))
    })
    return ret
}
/* shadow position */
export function importShadowPosition(source: types.ShadowPosition, ctx?: IImportContext): impl.ShadowPosition {
    return source
}
/* shadow */
function importShadowOptional(tar: impl.Shadow, source: types.Shadow, ctx?: IImportContext) {
    if (source.contextSettings !== undefined) tar.contextSettings = importGraphicsContextSettings(source.contextSettings, ctx)
    if (source.mask !== undefined) tar.mask = source.mask
}
export function importShadow(source: types.Shadow, ctx?: IImportContext): impl.Shadow {
    const ret: impl.Shadow = new impl.Shadow (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.isEnabled,
        source.blurRadius,
        importColor(source.color, ctx),
        source.offsetX,
        source.offsetY,
        source.spread,
        importShadowPosition(source.position, ctx))
    importShadowOptional(ret, source, ctx)
    return ret
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export function importShapeFrame(source: types.ShapeFrame, ctx?: IImportContext): impl.ShapeFrame {
    const ret: impl.ShapeFrame = new impl.ShapeFrame (
        source.x,
        source.y,
        source.width,
        source.height)
    return ret
}
/* shape size */
export function importShapeSize(source: types.ShapeSize, ctx?: IImportContext): impl.ShapeSize {
    const ret: impl.ShapeSize = new impl.ShapeSize (
        source.width,
        source.height)
    return ret
}
/* shape types */
export function importShapeType(source: types.ShapeType, ctx?: IImportContext): impl.ShapeType {
    return source
}
export function importShape_prototypeInteractions(source: types.Shape_prototypeInteractions, ctx?: IImportContext): Shape_prototypeInteractions {
    const ret: Shape_prototypeInteractions = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importPrototypeInteraction(source, ctx))
    })
    return ret
}
/* side type */
export function importSideType(source: types.SideType, ctx?: IImportContext): impl.SideType {
    return source
}
/* stack align */
export function importStackAlign(source: types.StackAlign, ctx?: IImportContext): impl.StackAlign {
    return source
}
/* stack mode */
export function importStackMode(source: types.StackMode, ctx?: IImportContext): impl.StackMode {
    return source
}
/* stack positioning */
export function importStackPositioning(source: types.StackPositioning, ctx?: IImportContext): impl.StackPositioning {
    return source
}
/* stack size */
export function importStackSize(source: types.StackSize, ctx?: IImportContext): impl.StackSize {
    const ret: impl.StackSize = new impl.StackSize (
        source.x,
        source.y)
    return ret
}
/* stack sizing */
export function importStackSizing(source: types.StackSizing, ctx?: IImportContext): impl.StackSizing {
    return source
}
/* stack wrap */
export function importStackWrap(source: types.StackWrap, ctx?: IImportContext): impl.StackWrap {
    return source
}
/* stop */
export function importStop(source: types.Stop, ctx?: IImportContext): impl.Stop {
    const ret: impl.Stop = new impl.Stop (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.position,
        importColor(source.color, ctx))
    return ret
}
/* strikethrough types */
export function importStrikethroughType(source: types.StrikethroughType, ctx?: IImportContext): impl.StrikethroughType {
    return source
}
/* style library type */
export function importStyleLibType(source: types.StyleLibType, ctx?: IImportContext): impl.StyleLibType {
    return source
}
export function importStyleSheet_variables(source: types.StyleSheet_variables, ctx?: IImportContext): StyleSheet_variables {
    const ret: StyleSheet_variables = new BasicArray()
    source.forEach((source, i) => {
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "fill-mask") {
                return importFillMask(source as types.FillMask, ctx)
            }
            if (source.typeId === "shadow-mask") {
                return importShadowMask(source as types.ShadowMask, ctx)
            }
            if (source.typeId === "blur-mask") {
                return importBlurMask(source as types.BlurMask, ctx)
            }
            if (source.typeId === "border-mask") {
                return importBorderMask(source as types.BorderMask, ctx)
            }
            if (source.typeId === "radius-mask") {
                return importRadiusMask(source as types.RadiusMask, ctx)
            }
            if (source.typeId === "text-mask") {
                return importTextMask(source as types.TextMask, ctx)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* shape types */
export function importStyleVarType(source: types.StyleVarType, ctx?: IImportContext): impl.StyleVarType {
    return source
}
export function importStyle_fills(source: types.Style_fills, ctx?: IImportContext): Style_fills {
    const ret: Style_fills = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importFill(source, ctx))
    })
    return ret
}
export function importStyle_shadows(source: types.Style_shadows, ctx?: IImportContext): Style_shadows {
    const ret: Style_shadows = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importShadow(source, ctx))
    })
    return ret
}
export function importStyle_innerShadows(source: types.Style_innerShadows, ctx?: IImportContext): Style_innerShadows {
    const ret: Style_innerShadows = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importShadow(source, ctx))
    })
    return ret
}
export function importStyle_contacts(source: types.Style_contacts, ctx?: IImportContext): Style_contacts {
    const ret: Style_contacts = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importContactRole(source, ctx))
    })
    return ret
}
export function importSymbolShape_guides(source: types.SymbolShape_guides, ctx?: IImportContext): SymbolShape_guides {
    const ret: SymbolShape_guides = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importGuide(source, ctx))
    })
    return ret
}
/* table cell info */
function importTableCellAttrOptional(tar: impl.TableCellAttr, source: types.TableCellAttr, ctx?: IImportContext) {
    if (source.rowSpan !== undefined) tar.rowSpan = source.rowSpan
    if (source.colSpan !== undefined) tar.colSpan = source.colSpan
}
export function importTableCellAttr(source: types.TableCellAttr, ctx?: IImportContext): impl.TableCellAttr {
    const ret: impl.TableCellAttr = new impl.TableCellAttr ()
    importTableCellAttrOptional(ret, source, ctx)
    return ret
}
/* table cell types */
export function importTableCellType(source: types.TableCellType, ctx?: IImportContext): impl.TableCellType {
    return source
}
export function importTableShape_rowHeights(source: types.TableShape_rowHeights, ctx?: IImportContext): TableShape_rowHeights {
    const ret: TableShape_rowHeights = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importCrdtNumber(source, ctx))
    })
    return ret
}
export function importTableShape_colWidths(source: types.TableShape_colWidths, ctx?: IImportContext): TableShape_colWidths {
    const ret: TableShape_colWidths = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importCrdtNumber(source, ctx))
    })
    return ret
}
export function importTableShape2_rowHeights(source: types.TableShape2_rowHeights, ctx?: IImportContext): TableShape2_rowHeights {
    const ret: TableShape2_rowHeights = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importCrdtNumber(source, ctx))
    })
    return ret
}
export function importTableShape2_colWidths(source: types.TableShape2_colWidths, ctx?: IImportContext): TableShape2_colWidths {
    const ret: TableShape2_colWidths = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importCrdtNumber(source, ctx))
    })
    return ret
}
/* text behaviour */
export function importTextBehaviour(source: types.TextBehaviour, ctx?: IImportContext): impl.TextBehaviour {
    return source
}
/* text horizontal alignment */
export function importTextHorAlign(source: types.TextHorAlign, ctx?: IImportContext): impl.TextHorAlign {
    return source
}
/* text orientation */
export function importTextOrientation(source: types.TextOrientation, ctx?: IImportContext): impl.TextOrientation {
    return source
}
/* text transform types */
export function importTextTransformType(source: types.TextTransformType, ctx?: IImportContext): impl.TextTransformType {
    return source
}
/* text vertical alignment */
export function importTextVerAlign(source: types.TextVerAlign, ctx?: IImportContext): impl.TextVerAlign {
    return source
}
export function importText_paras(source: types.Text_paras, ctx?: IImportContext): Text_paras {
    const ret: Text_paras = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importPara(source, ctx))
    })
    return ret
}
/* transform */
export function importTransform(source: types.Transform, ctx?: IImportContext): impl.Transform {
    const ret: impl.Transform = new impl.Transform (
        source.m00,
        source.m01,
        source.m02,
        source.m10,
        source.m11,
        source.m12)
    return ret
}
/* underline types */
export function importUnderlineType(source: types.UnderlineType, ctx?: IImportContext): impl.UnderlineType {
    return source
}
/* user infomation */
export function importUserInfo(source: types.UserInfo, ctx?: IImportContext): impl.UserInfo {
    const ret: impl.UserInfo = new impl.UserInfo (
        source.userId,
        source.userNickname,
        source.avatar)
    return ret
}
/* variable types */
export function importVariableType(source: types.VariableType, ctx?: IImportContext): impl.VariableType {
    return source
}
export function importVariable_0(source: types.Variable_0, ctx?: IImportContext): Variable_0 {
    const ret: Variable_0 = new BasicArray()
    source.forEach((source, i) => {
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "fill") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importFill(source as types.Fill, ctx)
            }
            if (source.typeId === "shadow") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importShadow(source as types.Shadow, ctx)
            }
            if (source.typeId === "prototype-interaction") {
                return importPrototypeInteraction(source as types.PrototypeInteraction, ctx)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* winding rule */
export function importWindingRule(source: types.WindingRule, ctx?: IImportContext): impl.WindingRule {
    return source
}
/* auto layout */
function importAutoLayoutOptional(tar: impl.AutoLayout, source: types.AutoLayout, ctx?: IImportContext) {
    if (source.stackMode !== undefined) tar.stackMode = importStackMode(source.stackMode, ctx)
    if (source.stackWrap !== undefined) tar.stackWrap = importStackWrap(source.stackWrap, ctx)
    if (source.stackHorizontalGapSizing !== undefined) tar.stackHorizontalGapSizing = importStackSizing(source.stackHorizontalGapSizing, ctx)
    if (source.stackVerticalGapSizing !== undefined) tar.stackVerticalGapSizing = importStackSizing(source.stackVerticalGapSizing, ctx)
    if (source.stackCounterSizing !== undefined) tar.stackCounterSizing = importStackSizing(source.stackCounterSizing, ctx)
    if (source.stackPrimaryAlignItems !== undefined) tar.stackPrimaryAlignItems = importStackAlign(source.stackPrimaryAlignItems, ctx)
    if (source.stackCounterAlignItems !== undefined) tar.stackCounterAlignItems = importStackAlign(source.stackCounterAlignItems, ctx)
    if (source.stackReverseZIndex !== undefined) tar.stackReverseZIndex = source.stackReverseZIndex
    if (source.bordersTakeSpace !== undefined) tar.bordersTakeSpace = source.bordersTakeSpace
    if (source.minSize !== undefined) tar.minSize = importStackSize(source.minSize, ctx)
    if (source.maxSize !== undefined) tar.maxSize = importStackSize(source.maxSize, ctx)
}
export function importAutoLayout(source: types.AutoLayout, ctx?: IImportContext): impl.AutoLayout {
    const ret: impl.AutoLayout = new impl.AutoLayout (
        source.stackSpacing,
        source.stackCounterSpacing,
        source.stackHorizontalPadding,
        source.stackVerticalPadding,
        source.stackPaddingRight,
        source.stackPaddingBottom,
        importStackSizing(source.stackPrimarySizing, ctx))
    importAutoLayoutOptional(ret, source, ctx)
    return ret
}
/* blur */
function importBlurOptional(tar: impl.Blur, source: types.Blur, ctx?: IImportContext) {
    if (source.motionAngle !== undefined) tar.motionAngle = source.motionAngle
    if (source.radius !== undefined) tar.radius = source.radius
}
export function importBlur(source: types.Blur, ctx?: IImportContext): impl.Blur {
    const ret: impl.Blur = new impl.Blur (
        source.isEnabled,
        importPoint2D(source.center, ctx),
        source.saturation,
        importBlurType(source.type, ctx))
    importBlurOptional(ret, source, ctx)
    return ret
}
/* border options */
export function importBorderOptions(source: types.BorderOptions, ctx?: IImportContext): impl.BorderOptions {
    const ret: impl.BorderOptions = new impl.BorderOptions (
        source.isEnabled,
        importLineCapStyle(source.lineCapStyle, ctx),
        importLineJoinStyle(source.lineJoinStyle, ctx))
    return ret
}
/* border side setting */
export function importBorderSideSetting(source: types.BorderSideSetting, ctx?: IImportContext): impl.BorderSideSetting {
    const ret: impl.BorderSideSetting = new impl.BorderSideSetting (
        importSideType(source.sideType, ctx),
        source.thicknessTop,
        source.thicknessLeft,
        source.thicknessBottom,
        source.thicknessRight)
    return ret
}
/* contact form */
export function importContactForm(source: types.ContactForm, ctx?: IImportContext): impl.ContactForm {
    const ret: impl.ContactForm = new impl.ContactForm (
        importContactType(source.contactType, ctx),
        source.shapeId)
    return ret
}
/* contactstyle */
export function importContactRole(source: types.ContactRole, ctx?: IImportContext): impl.ContactRole {
    const ret: impl.ContactRole = new impl.ContactRole (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        importContactRoleType(source.roleType, ctx),
        source.shapeId)
    return ret
}
/* crdt number */
export function importCrdtNumber(source: types.CrdtNumber, ctx?: IImportContext): impl.CrdtNumber {
    const ret: impl.CrdtNumber = new impl.CrdtNumber (
        source.id,
        importCrdtidx(source.crdtidx, ctx),
        source.value)
    return ret
}
/* export format */
export function importExportFormat(source: types.ExportFormat, ctx?: IImportContext): impl.ExportFormat {
    const ret: impl.ExportFormat = new impl.ExportFormat (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.absoluteSize,
        importExportFileFormat(source.fileFormat, ctx),
        source.name,
        importExportFormatNameingScheme(source.namingScheme, ctx),
        source.scale,
        importExportVisibleScaleType(source.visibleScaleType, ctx))
    return ret
}
/* export options */
export function importExportOptions(source: types.ExportOptions, ctx?: IImportContext): impl.ExportOptions {
    const ret: impl.ExportOptions = new impl.ExportOptions (
        importExportOptions_exportFormats(source.exportFormats, ctx),
        source.childOptions,
        source.shouldTrim,
        source.trimTransparent,
        source.canvasBackground,
        source.unfold)
    return ret
}
/* gradient */
function importGradientOptional(tar: impl.Gradient, source: types.Gradient, ctx?: IImportContext) {
    if (source.elipseLength !== undefined) tar.elipseLength = source.elipseLength
    if (source.gradientOpacity !== undefined) tar.gradientOpacity = source.gradientOpacity
}
export function importGradient(source: types.Gradient, ctx?: IImportContext): impl.Gradient {
    const ret: impl.Gradient = new impl.Gradient (
        importPoint2D(source.from, ctx),
        importPoint2D(source.to, ctx),
        importGradientType(source.gradientType, ctx),
        importGradient_stops(source.stops, ctx))
    importGradientOptional(ret, source, ctx)
    return ret
}
/* overlay-background-appearance */
export function importOverlayBackgroundAppearance(source: types.OverlayBackgroundAppearance, ctx?: IImportContext): impl.OverlayBackgroundAppearance {
    const ret: impl.OverlayBackgroundAppearance = new impl.OverlayBackgroundAppearance (
        importOverlayBackgroundType(source.backgroundType, ctx),
        importColor(source.backgroundColor, ctx))
    return ret
}
/* actions */
function importPrototypeActionsOptional(tar: impl.PrototypeActions, source: types.PrototypeActions, ctx?: IImportContext) {
    if (source.targetNodeID !== undefined) tar.targetNodeID = source.targetNodeID
    if (source.transitionType !== undefined) tar.transitionType = importPrototypeTransitionType(source.transitionType, ctx)
    if (source.transitionDuration !== undefined) tar.transitionDuration = source.transitionDuration
    if (source.easingType !== undefined) tar.easingType = importPrototypeEasingType(source.easingType, ctx)
    if (source.connectionURL !== undefined) tar.connectionURL = source.connectionURL
    if (source.navigationType !== undefined) tar.navigationType = importPrototypeNavigationType(source.navigationType, ctx)
    if (source.easingFunction !== undefined) tar.easingFunction = importPrototypeEasingBezier(source.easingFunction, ctx)
    if (source.extraScrollOffset !== undefined) tar.extraScrollOffset = importPoint2D(source.extraScrollOffset, ctx)
}
export function importPrototypeActions(source: types.PrototypeActions, ctx?: IImportContext): impl.PrototypeActions {
    const ret: impl.PrototypeActions = new impl.PrototypeActions (
        importPrototypeConnectionType(source.connectionType, ctx),
        source.openUrlInNewTab)
    importPrototypeActionsOptional(ret, source, ctx)
    return ret
}
/* event */
function importPrototypeEventOptional(tar: impl.PrototypeEvent, source: types.PrototypeEvent, ctx?: IImportContext) {
    if (source.transitionTimeout !== undefined) tar.transitionTimeout = source.transitionTimeout
}
export function importPrototypeEvent(source: types.PrototypeEvent, ctx?: IImportContext): impl.PrototypeEvent {
    const ret: impl.PrototypeEvent = new impl.PrototypeEvent (
        importPrototypeEvents(source.interactionType, ctx))
    importPrototypeEventOptional(ret, source, ctx)
    return ret
}
/* prototypeInteraction */
function importPrototypeInteractionOptional(tar: impl.PrototypeInteraction, source: types.PrototypeInteraction, ctx?: IImportContext) {
    if (source.typeId !== undefined) tar.typeId = source.typeId
    if (source.isDeleted !== undefined) tar.isDeleted = source.isDeleted
}
export function importPrototypeInteraction(source: types.PrototypeInteraction, ctx?: IImportContext): impl.PrototypeInteraction {
    const ret: impl.PrototypeInteraction = new impl.PrototypeInteraction (
        importPrototypeInteraction_crdtidx(source.crdtidx, ctx),
        source.id,
        importPrototypeEvent(source.event, ctx),
        importPrototypeActions(source.actions, ctx))
    importPrototypeInteractionOptional(ret, source, ctx)
    return ret
}
/* radius mask */
function importRadiusMaskOptional(tar: impl.RadiusMask, source: types.RadiusMask, ctx?: IImportContext) {
    if (source.disabled !== undefined) tar.disabled = source.disabled
}
export function importRadiusMask(source: types.RadiusMask, ctx?: IImportContext): impl.RadiusMask {
    const ret: impl.RadiusMask = new impl.RadiusMask (
        importCrdtidx(source.crdtidx, ctx),
        source.sheet,
        source.id,
        source.name,
        source.description,
        importRadius(source.radius, ctx))
    importRadiusMaskOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);

    return ret
}
/* shadow mask */
function importShadowMaskOptional(tar: impl.ShadowMask, source: types.ShadowMask, ctx?: IImportContext) {
    if (source.disabled !== undefined) tar.disabled = source.disabled
}
export function importShadowMask(source: types.ShadowMask, ctx?: IImportContext): impl.ShadowMask {
    const ret: impl.ShadowMask = new impl.ShadowMask (
        importCrdtidx(source.crdtidx, ctx),
        source.sheet,
        source.id,
        source.name,
        source.description,
        importShadowMask_shadows(source.shadows, ctx))
    importShadowMaskOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);

    return ret
}
/* span attr */
function importSpanAttrOptional(tar: impl.SpanAttr, source: types.SpanAttr, ctx?: IImportContext) {
    if (source.fontName !== undefined) tar.fontName = source.fontName
    if (source.fontSize !== undefined) tar.fontSize = source.fontSize
    if (source.color !== undefined) tar.color = importColor(source.color, ctx)
    if (source.strikethrough !== undefined) tar.strikethrough = importStrikethroughType(source.strikethrough, ctx)
    if (source.underline !== undefined) tar.underline = importUnderlineType(source.underline, ctx)
    if (source.weight !== undefined) tar.weight = source.weight
    if (source.italic !== undefined) tar.italic = source.italic
    if (source.bulletNumbers !== undefined) tar.bulletNumbers = importBulletNumbers(source.bulletNumbers, ctx)
    if (source.highlight !== undefined) tar.highlight = importColor(source.highlight, ctx)
    if (source.kerning !== undefined) tar.kerning = source.kerning
    if (source.transform !== undefined) tar.transform = importTextTransformType(source.transform, ctx)
    if (source.placeholder !== undefined) tar.placeholder = source.placeholder
    if (source.fillType !== undefined) tar.fillType = importFillType(source.fillType, ctx)
    if (source.gradient !== undefined) tar.gradient = importGradient(source.gradient, ctx)
    if (source.textMask !== undefined) tar.textMask = source.textMask
}
export function importSpanAttr(source: types.SpanAttr, ctx?: IImportContext): impl.SpanAttr {
    const ret: impl.SpanAttr = new impl.SpanAttr ()
    importSpanAttrOptional(ret, source, ctx)
    return ret
}
/* span attr */
const importSpanOptional = importSpanAttrOptional
export function importSpan(source: types.Span, ctx?: IImportContext): impl.Span {
    const ret: impl.Span = new impl.Span (
        source.length)
    importSpanOptional(ret, source, ctx)
    return ret
}
/* blur mask */
function importBlurMaskOptional(tar: impl.BlurMask, source: types.BlurMask, ctx?: IImportContext) {
    if (source.disabled !== undefined) tar.disabled = source.disabled
}
export function importBlurMask(source: types.BlurMask, ctx?: IImportContext): impl.BlurMask {
    const ret: impl.BlurMask = new impl.BlurMask (
        importCrdtidx(source.crdtidx, ctx),
        source.sheet,
        source.id,
        source.name,
        source.description,
        importBlur(source.blur, ctx))
    importBlurMaskOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);

    return ret
}
/* border mask type */
export function importBorderMaskType(source: types.BorderMaskType, ctx?: IImportContext): impl.BorderMaskType {
    const ret: impl.BorderMaskType = new impl.BorderMaskType (
        importBorderPosition(source.position, ctx),
        importBorderSideSetting(source.sideSetting, ctx))
    return ret
}
/* border mask */
function importBorderMaskOptional(tar: impl.BorderMask, source: types.BorderMask, ctx?: IImportContext) {
    if (source.disabled !== undefined) tar.disabled = source.disabled
}
export function importBorderMask(source: types.BorderMask, ctx?: IImportContext): impl.BorderMask {
    const ret: impl.BorderMask = new impl.BorderMask (
        importCrdtidx(source.crdtidx, ctx),
        source.sheet,
        source.id,
        source.name,
        source.description,
        importBorderMaskType(source.border, ctx))
    importBorderMaskOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);

    return ret
}
/* fill */
function importFillOptional(tar: impl.Fill, source: types.Fill, ctx?: IImportContext) {
    if (source.contextSettings !== undefined) tar.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.gradient !== undefined) tar.gradient = importGradient(source.gradient, ctx)
    if (source.imageRef !== undefined) tar.imageRef = source.imageRef
    if (source.fillRule !== undefined) tar.fillRule = importFillRule(source.fillRule, ctx)
    if (source.imageScaleMode !== undefined) tar.imageScaleMode = importImageScaleMode(source.imageScaleMode, ctx)
    if (source.rotation !== undefined) tar.rotation = source.rotation
    if (source.scale !== undefined) tar.scale = source.scale
    if (source.originalImageWidth !== undefined) tar.originalImageWidth = source.originalImageWidth
    if (source.originalImageHeight !== undefined) tar.originalImageHeight = source.originalImageHeight
    if (source.paintFilter !== undefined) tar.paintFilter = importPaintFilter(source.paintFilter, ctx)
    if (source.transform !== undefined) tar.transform = importPatternTransform(source.transform, ctx)
}
export function importFill(source: types.Fill, ctx?: IImportContext): impl.Fill {
    const ret: impl.Fill = new impl.Fill (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.isEnabled,
        importFillType(source.fillType, ctx),
        importColor(source.color, ctx))
    importFillOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);

    return ret
}
/* span attr */
function importParaAttrOptional(tar: impl.ParaAttr, source: types.ParaAttr, ctx?: IImportContext) {
    importSpanAttrOptional(tar, source)
    if (source.alignment !== undefined) tar.alignment = importTextHorAlign(source.alignment, ctx)
    if (source.paraSpacing !== undefined) tar.paraSpacing = source.paraSpacing
    if (source.minimumLineHeight !== undefined) tar.minimumLineHeight = source.minimumLineHeight
    if (source.maximumLineHeight !== undefined) tar.maximumLineHeight = source.maximumLineHeight
    if (source.autoLineHeight !== undefined) tar.autoLineHeight = source.autoLineHeight
    if (source.indent !== undefined) tar.indent = source.indent
}
export function importParaAttr(source: types.ParaAttr, ctx?: IImportContext): impl.ParaAttr {
    const ret: impl.ParaAttr = new impl.ParaAttr ()
    importParaAttrOptional(ret, source, ctx)
    return ret
}
/* para */
function importParaOptional(tar: impl.Para, source: types.Para, ctx?: IImportContext) {
    if (source.attr !== undefined) tar.attr = importParaAttr(source.attr, ctx)
}
export function importPara(source: types.Para, ctx?: IImportContext): impl.Para {
    const ret: impl.Para = new impl.Para (
        source.text,
        importPara_spans(source.spans, ctx))
    importParaOptional(ret, source, ctx)
    return ret
}
/* text attr */
function importTextAttrOptional(tar: impl.TextAttr, source: types.TextAttr, ctx?: IImportContext) {
    importParaAttrOptional(tar, source)
    if (source.verAlign !== undefined) tar.verAlign = importTextVerAlign(source.verAlign, ctx)
    if (source.orientation !== undefined) tar.orientation = importTextOrientation(source.orientation, ctx)
    if (source.textBehaviour !== undefined) tar.textBehaviour = importTextBehaviour(source.textBehaviour, ctx)
    if (source.padding !== undefined) tar.padding = importPadding(source.padding, ctx)
}
export function importTextAttr(source: types.TextAttr, ctx?: IImportContext): impl.TextAttr {
    const ret: impl.TextAttr = new impl.TextAttr ()
    importTextAttrOptional(ret, source, ctx)
    return ret
}
/* text mask */
function importTextMaskOptional(tar: impl.TextMask, source: types.TextMask, ctx?: IImportContext) {
    if (source.disabled !== undefined) tar.disabled = source.disabled
}
export function importTextMask(source: types.TextMask, ctx?: IImportContext): impl.TextMask {
    const ret: impl.TextMask = new impl.TextMask (
        importCrdtidx(source.crdtidx, ctx),
        source.sheet,
        source.id,
        source.name,
        source.description,
        importTextAttr(source.text, ctx))
    importTextMaskOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);

    return ret
}
/* text */
function importTextOptional(tar: impl.Text, source: types.Text, ctx?: IImportContext) {
    if (source.attr !== undefined) tar.attr = importTextAttr(source.attr, ctx)
    if (source.fixed !== undefined) tar.fixed = source.fixed
}
export function importText(source: types.Text, ctx?: IImportContext): impl.Text {
    const ret: impl.Text = new impl.Text (
        importText_paras(source.paras, ctx))
    importTextOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ret.setStylesMgr(ctx.document.stylesMgr);

    return ret
}
/* border */
function importBorderOptional(tar: impl.Border, source: types.Border, ctx?: IImportContext) {
    if (source.fillsMask !== undefined) tar.fillsMask = source.fillsMask
}
export function importBorder(source: types.Border, ctx?: IImportContext): impl.Border {
    const ret: impl.Border = new impl.Border (
        importBorderPosition(source.position, ctx),
        importBorderStyle(source.borderStyle, ctx),
        importCornerType(source.cornerType, ctx),
        importBorderSideSetting(source.sideSetting, ctx),
        importBorder_strokePaints(source.strokePaints, ctx))
    importBorderOptional(ret, source, ctx)
    return ret
}
/* fill mask */
function importFillMaskOptional(tar: impl.FillMask, source: types.FillMask, ctx?: IImportContext) {
    if (source.disabled !== undefined) tar.disabled = source.disabled
}
export function importFillMask(source: types.FillMask, ctx?: IImportContext): impl.FillMask {
    const ret: impl.FillMask = new impl.FillMask (
        importCrdtidx(source.crdtidx, ctx),
        source.sheet,
        source.id,
        source.name,
        source.description,
        importFillMask_fills(source.fills, ctx))
    importFillMaskOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);

    return ret
}
/* style sheet */
export function importStyleSheet(source: types.StyleSheet, ctx?: IImportContext): impl.StyleSheet {
    const ret: impl.StyleSheet = new impl.StyleSheet (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importStyleSheet_variables(source.variables, ctx))
    return ret
}
/* style */
function importStyleOptional(tar: impl.Style, source: types.Style, ctx?: IImportContext) {
    if (source.miterLimit !== undefined) tar.miterLimit = source.miterLimit
    if (source.windingRule !== undefined) tar.windingRule = importWindingRule(source.windingRule, ctx)
    if (source.blur !== undefined) tar.blur = importBlur(source.blur, ctx)
    if (source.borderOptions !== undefined) tar.borderOptions = importBorderOptions(source.borderOptions, ctx)
    if (source.colorControls !== undefined) tar.colorControls = importColorControls(source.colorControls, ctx)
    if (source.contextSettings !== undefined) tar.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.innerShadows !== undefined) tar.innerShadows = importStyle_innerShadows(source.innerShadows, ctx)
    if (source.contacts !== undefined) tar.contacts = importStyle_contacts(source.contacts, ctx)
    if (source.startMarkerType !== undefined) tar.startMarkerType = importMarkerType(source.startMarkerType, ctx)
    if (source.endMarkerType !== undefined) tar.endMarkerType = importMarkerType(source.endMarkerType, ctx)
    if (source.varbinds !== undefined) tar.varbinds = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.varbinds as any
        objkeys(_val).forEach((val, k) => {
            ret.set(k, val)
        })
        return ret
    })()
    if (source.fillsMask !== undefined) tar.fillsMask = source.fillsMask
    if (source.shadowsMask !== undefined) tar.shadowsMask = source.shadowsMask
    if (source.blursMask !== undefined) tar.blursMask = source.blursMask
    if (source.bordersMask !== undefined) tar.bordersMask = source.bordersMask
}
export function importStyle(source: types.Style, ctx?: IImportContext): impl.Style {
    const ret: impl.Style = new impl.Style (
        importStyle_fills(source.fills, ctx),
        importStyle_shadows(source.shadows, ctx),
        importBorder(source.borders, ctx))
    importStyleOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ret.setStylesMgr(ctx.document.stylesMgr);

    return ret
}
/* shape */
function importShapeOptional(tar: impl.Shape, source: types.Shape, ctx?: IImportContext) {
    if (source.boolOp !== undefined) tar.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport !== undefined) tar.isFixedToViewport = source.isFixedToViewport
    if (source.isLocked !== undefined) tar.isLocked = source.isLocked
    if (source.isVisible !== undefined) tar.isVisible = source.isVisible
    if (source.exportOptions !== undefined) tar.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed !== undefined) tar.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint !== undefined) tar.resizingConstraint = source.resizingConstraint
    if (source.resizingType !== undefined) tar.resizingType = importResizeType(source.resizingType, ctx)
    if (source.constrainerProportions !== undefined) tar.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode !== undefined) tar.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask !== undefined) tar.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain !== undefined) tar.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.varbinds !== undefined) tar.varbinds = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.varbinds as any
        objkeys(_val).forEach((val, k) => {
            ret.set(k, val)
        })
        return ret
    })()
    if (source.haveEdit !== undefined) tar.haveEdit = source.haveEdit
    if (source.prototypeStartingPoint !== undefined) tar.prototypeStartingPoint = importPrototypeStartingPoint(source.prototypeStartingPoint, ctx)
    if (source.prototypeInteractions !== undefined) tar.prototypeInteractions = importShape_prototypeInteractions(source.prototypeInteractions, ctx)
    if (source.overlayPosition !== undefined) tar.overlayPosition = importOverlayPosition(source.overlayPosition, ctx)
    if (source.overlayBackgroundInteraction !== undefined) tar.overlayBackgroundInteraction = importOverlayBackgroundInteraction(source.overlayBackgroundInteraction, ctx)
    if (source.overlayBackgroundAppearance !== undefined) tar.overlayBackgroundAppearance = importOverlayBackgroundAppearance(source.overlayBackgroundAppearance, ctx)
    if (source.scrollDirection !== undefined) tar.scrollDirection = importScrollDirection(source.scrollDirection, ctx)
    if (source.scrollBehavior !== undefined) tar.scrollBehavior = importScrollBehavior(source.scrollBehavior, ctx)
    if (source.mask !== undefined) tar.mask = source.mask
    if (source.stackPositioning !== undefined) tar.stackPositioning = importStackPositioning(source.stackPositioning, ctx)
    if (source.radiusMask !== undefined) tar.radiusMask = source.radiusMask
}
export function importShape(source: types.Shape, ctx?: IImportContext): impl.Shape {
    const ret: impl.Shape = new impl.Shape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx))
    importShapeOptional(ret, source, ctx)
    return ret
}
/* table cell */
function importTableCellOptional(tar: impl.TableCell, source: types.TableCell, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.imageRef !== undefined) tar.imageRef = source.imageRef
    if (source.rowSpan !== undefined) tar.rowSpan = source.rowSpan
    if (source.colSpan !== undefined) tar.colSpan = source.colSpan
}
export function importTableCell(source: types.TableCell, ctx?: IImportContext): impl.TableCell {
    compatibleOldData(source, ctx)
    const ret: impl.TableCell = new impl.TableCell (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importTableCellType(source.cellType, ctx),
        importText(source.text, ctx))
    importTableCellOptional(ret, source, ctx)
    return ret
}
/* table shape */
function importTableShapeOptional(tar: impl.TableShape, source: types.TableShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.textAttr !== undefined) tar.textAttr = importTextAttr(source.textAttr, ctx)
}
export function importTableShape(source: types.TableShape, ctx?: IImportContext): impl.TableShape {
    compatibleOldData(source, ctx)
    const ret: impl.TableShape = new impl.TableShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        (() => {
            const ret = new BasicMap<string, impl.TableCell>()
            const _val = source.cells as any
            objkeys(_val).forEach((val, k) => {
                ret.set(k, importTableCell(val, ctx))
            })
            return ret
        })(),
        importTableShape_rowHeights(source.rowHeights, ctx),
        importTableShape_colWidths(source.colWidths, ctx))
    importTableShapeOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);

    return ret
}
/* text shape */
function importTextShapeOptional(tar: impl.TextShape, source: types.TextShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.fixedRadius !== undefined) tar.fixedRadius = source.fixedRadius
}
export function importTextShape(source: types.TextShape, ctx?: IImportContext): impl.TextShape {
    compatibleOldData(source, ctx)
    const ret: impl.TextShape = new impl.TextShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importText(source.text, ctx))
    importTextShapeOptional(ret, source, ctx)
    return ret
}
/* color */
export function importVariable(source: types.Variable, ctx?: IImportContext): impl.Variable {
    const ret: impl.Variable = new impl.Variable (
        source.id,
        importVariableType(source.type, ctx),
        source.name,
        (() => {
            if (typeof source.value!== "object" || source.value == null) {
                return source.value == null? undefined : source.value
            }
            if (Array.isArray(source.value)) {
                return importVariable_0(source.value, ctx)
            }
            if (source.value.typeId === "color") {
                return importColor(source.value as types.Color, ctx)
            }
            if (source.value.typeId === "text") {
                return importText(source.value as types.Text, ctx)
            }
            if (source.value.typeId === "gradient") {
                return importGradient(source.value as types.Gradient, ctx)
            }
            if (source.value.typeId === "style") {
                return importStyle(source.value as types.Style, ctx)
            }
            if (source.value.typeId === "border") {
                return importBorder(source.value as types.Border, ctx)
            }
            if (source.value.typeId === "context-settings") {
                return importContextSettings(source.value as types.ContextSettings, ctx)
            }
            if (source.value.typeId === "table-cell") {
                return importTableCell(source.value as types.TableCell, ctx)
            }
            if (source.value.typeId === "export-options") {
                return importExportOptions(source.value as types.ExportOptions, ctx)
            }
            if (source.value.typeId === "corner-radius") {
                return importCornerRadius(source.value as types.CornerRadius, ctx)
            }
            if (source.value.typeId === "blur") {
                return importBlur(source.value as types.Blur, ctx)
            }
            if (source.value.typeId === "auto-layout") {
                return importAutoLayout(source.value as types.AutoLayout, ctx)
            }
            throw new Error("unknow typeId: " + source.value.typeId)
        })())
    return ret
}
/* comment */
function importCommentOptional(tar: impl.Comment, source: types.Comment, ctx?: IImportContext) {
    if (source.parentId !== undefined) tar.parentId = source.parentId
    if (source.rootId !== undefined) tar.rootId = source.rootId
}
export function importComment(source: types.Comment, ctx?: IImportContext): impl.Comment {
    const ret: impl.Comment = new impl.Comment (
        source.pageId,
        source.id,
        importShapeFrame(source.frame, ctx),
        importUserInfo(source.user, ctx),
        source.createAt,
        source.content,
        importShape(source.parasiticBody, ctx))
    importCommentOptional(ret, source, ctx)
    return ret
}
/* path shape */
function importPathShapeOptional(tar: impl.PathShape, source: types.PathShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.fixedRadius !== undefined) tar.fixedRadius = source.fixedRadius
}
export function importPathShape(source: types.PathShape, ctx?: IImportContext): impl.PathShape {
    compatibleOldData(source, ctx)
    const ret: impl.PathShape = new impl.PathShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx))
    importPathShapeOptional(ret, source, ctx)
    return ret
}
/* path shape */
function importPathShape2Optional(tar: impl.PathShape2, source: types.PathShape2, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.fixedRadius !== undefined) tar.fixedRadius = source.fixedRadius
}
export function importPathShape2(source: types.PathShape2, ctx?: IImportContext): impl.PathShape2 {
    compatibleOldData(source, ctx)
    const ret: impl.PathShape2 = new impl.PathShape2 (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape2_pathsegs(source.pathsegs, ctx))
    importPathShape2Optional(ret, source, ctx)
    return ret
}
/* polygon shape */
const importPolygonShapeOptional = importPathShapeOptional
export function importPolygonShape(source: types.PolygonShape, ctx?: IImportContext): impl.PolygonShape {
    compatibleOldData(source, ctx)
    const ret: impl.PolygonShape = new impl.PolygonShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.counts)
    importPolygonShapeOptional(ret, source, ctx)
    return ret
}
/* rect shape */
const importRectShapeOptional = importPathShapeOptional
export function importRectShape(source: types.RectShape, ctx?: IImportContext): impl.RectShape {
    compatibleOldData(source, ctx)
    const ret: impl.RectShape = new impl.RectShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx))
    importRectShapeOptional(ret, source, ctx)
    return ret
}
/* star shape */
const importStarShapeOptional = importPathShapeOptional
export function importStarShape(source: types.StarShape, ctx?: IImportContext): impl.StarShape {
    compatibleOldData(source, ctx)
    const ret: impl.StarShape = new impl.StarShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.counts,
        source.innerAngle)
    importStarShapeOptional(ret, source, ctx)
    return ret
}
/* symbol ref shape */
function importSymbolRefShapeOptional(tar: impl.SymbolRefShape, source: types.SymbolRefShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.overrides !== undefined) tar.overrides = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.overrides as any
        objkeys(_val).forEach((val, k) => {
            ret.set(k, val)
        })
        return ret
    })()
    if (source.isCustomSize !== undefined) tar.isCustomSize = source.isCustomSize
    if (source.cornerRadius !== undefined) tar.cornerRadius = importCornerRadius(source.cornerRadius, ctx)
    if (source.innerEnvScale !== undefined) tar.innerEnvScale = source.innerEnvScale
    if (source.uniformScale !== undefined) tar.uniformScale = source.uniformScale
}
export function importSymbolRefShape(source: types.SymbolRefShape, ctx?: IImportContext): impl.SymbolRefShape {
    compatibleOldData(source, ctx)
    const ret: impl.SymbolRefShape = new impl.SymbolRefShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        source.refId,
        (() => {
            const ret = new BasicMap<string, impl.Variable>()
            const _val = source.variables as any
            objkeys(_val).forEach((val, k) => {
                ret.set(k, importVariable(val, ctx))
            })
            return ret
        })())
    importSymbolRefShapeOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) {
        ret.setSymbolMgr(ctx.document.symbolsMgr);
        ret.setImageMgr(ctx.document.mediasMgr);
    }

    return ret
}
/* connection */
function importConnectionOptional(tar: impl.Connection, source: types.Connection, ctx?: IImportContext) {
    importPathShapeOptional(tar, source)
    if (source.from !== undefined) tar.from = importContactForm(source.from, ctx)
    if (source.to !== undefined) tar.to = importContactForm(source.to, ctx)
}
export function importConnection(source: types.Connection, ctx?: IImportContext): impl.Connection {
    const ret: impl.Connection = new impl.Connection (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.isEdited)
    importConnectionOptional(ret, source, ctx)
    return ret
}
/* contact shape */
function importContactShapeOptional(tar: impl.ContactShape, source: types.ContactShape, ctx?: IImportContext) {
    importPathShapeOptional(tar, source)
    if (source.from !== undefined) tar.from = importContactForm(source.from, ctx)
    if (source.to !== undefined) tar.to = importContactForm(source.to, ctx)
}
export function importContactShape(source: types.ContactShape, ctx?: IImportContext): impl.ContactShape {
    compatibleOldData(source, ctx)
    const ret: impl.ContactShape = new impl.ContactShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.isEdited,
        importText(source.text, ctx),
        source.mark)
    importContactShapeOptional(ret, source, ctx)
    return ret
}
/* cutout shape */
const importCutoutShapeOptional = importPathShapeOptional
export function importCutoutShape(source: types.CutoutShape, ctx?: IImportContext): impl.CutoutShape {
    compatibleOldData(source, ctx)
    const ret: impl.CutoutShape = new impl.CutoutShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx))
    importCutoutShapeOptional(ret, source, ctx)
    return ret
}
/* image shape */
const importImageShapeOptional = importPathShapeOptional
export function importImageShape(source: types.ImageShape, ctx?: IImportContext): impl.ImageShape {
    compatibleOldData(source, ctx)
    const ret: impl.ImageShape = new impl.ImageShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.imageRef)
    importImageShapeOptional(ret, source, ctx)
    return ret
}
/* line shape */
const importLineShapeOptional = importPathShapeOptional
export function importLineShape(source: types.LineShape, ctx?: IImportContext): impl.LineShape {
    compatibleOldData(source, ctx)
    const ret: impl.LineShape = new impl.LineShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx))
    importLineShapeOptional(ret, source, ctx)
    return ret
}
/* oval shape */
function importOvalShapeOptional(tar: impl.OvalShape, source: types.OvalShape, ctx?: IImportContext) {
    importPathShapeOptional(tar, source)
    if (source.startingAngle !== undefined) tar.startingAngle = source.startingAngle
    if (source.endingAngle !== undefined) tar.endingAngle = source.endingAngle
    if (source.innerRadius !== undefined) tar.innerRadius = source.innerRadius
}
export function importOvalShape(source: types.OvalShape, ctx?: IImportContext): impl.OvalShape {
    compatibleOldData(source, ctx)
    const ret: impl.OvalShape = new impl.OvalShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        importEllipse(source.ellipse, ctx))
    importOvalShapeOptional(ret, source, ctx)
    return ret
}
/* artboard shape */
function importArtboardOptional(tar: impl.Artboard, source: types.Artboard, ctx?: IImportContext) {
    importGroupShapeOptional(tar, source)
    if (source.cornerRadius !== undefined) tar.cornerRadius = importCornerRadius(source.cornerRadius, ctx)
    if (source.guides !== undefined) tar.guides = importArtboard_guides(source.guides, ctx)
    if (source.autoLayout !== undefined) tar.autoLayout = importAutoLayout(source.autoLayout, ctx)
    if (source.frameMaskDisabled !== undefined) tar.frameMaskDisabled = source.frameMaskDisabled
}
export function importArtboard(source: types.Artboard, ctx?: IImportContext): impl.Artboard {
    compatibleOldData(source, ctx)
    const ret: impl.Artboard = new impl.Artboard (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx),
        importShapeSize(source.size, ctx))
    importArtboardOptional(ret, source, ctx)
    return ret
}
/* bool shape */
const importBoolShapeOptional = importGroupShapeOptional
export function importBoolShape(source: types.BoolShape, ctx?: IImportContext): impl.BoolShape {
    compatibleOldData(source, ctx)
    const ret: impl.BoolShape = new impl.BoolShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx))
    importBoolShapeOptional(ret, source, ctx)
    return ret
}
/* document meta */
function importDocumentMetaOptional(tar: impl.DocumentMeta, source: types.DocumentMeta, ctx?: IImportContext) {
    if (source.freesymbols !== undefined) tar.freesymbols = (() => {
        const ret = new BasicMap<string, impl.SymbolShape | impl.SymbolUnionShape>()
        const _val = source.freesymbols as any
        objkeys(_val).forEach((val, k) => {
            ret.set(k, (() => {
                if (typeof val !== "object") {
                    return val
                }
                if (val.typeId === "symbol-shape") {
                    return importSymbolShape(val as types.SymbolShape, ctx)
                }
                if (val.typeId === "symbol-union-shape") {
                    return importSymbolUnionShape(val as types.SymbolUnionShape, ctx)
                }
                throw new Error("unknow typeId: " + val.typeId)
            })())
        })
        return ret
    })()
    if (source.stylelib !== undefined) tar.stylelib = importDocumentMeta_stylelib(source.stylelib, ctx)
    if (source.thumbnailViewId !== undefined) tar.thumbnailViewId = source.thumbnailViewId
}
export function importDocumentMeta(source: types.DocumentMeta, ctx?: IImportContext): impl.DocumentMeta {
    const ret: impl.DocumentMeta = new impl.DocumentMeta (
        source.id,
        source.name,
        source.fmtVer,
        importDocumentMeta_pagesList(source.pagesList, ctx),
        source.lastCmdVer,
        (() => {
            const ret = new BasicMap<string, string>()
            const _val = source.symbolregist as any
            objkeys(_val).forEach((val, k) => {
                ret.set(k, val)
            })
            return ret
        })())
    importDocumentMetaOptional(ret, source, ctx)
    return ret
}
/* group shape */
function importGroupShapeOptional(tar: impl.GroupShape, source: types.GroupShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.fixedRadius !== undefined) tar.fixedRadius = source.fixedRadius
}
export function importGroupShape(source: types.GroupShape, ctx?: IImportContext): impl.GroupShape {
    compatibleOldData(source, ctx)
    const ret: impl.GroupShape = new impl.GroupShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx))
    importGroupShapeOptional(ret, source, ctx)
    return ret
}
/* page */
function importPageOptional(tar: impl.Page, source: types.Page, ctx?: IImportContext) {
    importGroupShapeOptional(tar, source)
    if (source.backgroundColor !== undefined) tar.backgroundColor = importColor(source.backgroundColor, ctx)
    if (source.guides !== undefined) tar.guides = importPage_guides(source.guides, ctx)
    if (source.connections !== undefined) tar.connections = importPage_connections(source.connections, ctx)
}
export function importPage(source: types.Page, ctx?: IImportContext): impl.Page {
    compatibleOldData(source, ctx)
    const ret: impl.Page = new impl.Page (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx))
    importPageOptional(ret, source, ctx)
    return ret
}
/* symbol shape */
function importSymbolShapeOptional(tar: impl.SymbolShape, source: types.SymbolShape, ctx?: IImportContext) {
    importGroupShapeOptional(tar, source)
    if (source.symtags !== undefined) tar.symtags = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.symtags as any
        objkeys(_val).forEach((val, k) => {
            ret.set(k, val)
        })
        return ret
    })()
    if (source.cornerRadius !== undefined) tar.cornerRadius = importCornerRadius(source.cornerRadius, ctx)
    if (source.guides !== undefined) tar.guides = importSymbolShape_guides(source.guides, ctx)
    if (source.autoLayout !== undefined) tar.autoLayout = importAutoLayout(source.autoLayout, ctx)
    if (source.frameMaskDisabled !== undefined) tar.frameMaskDisabled = source.frameMaskDisabled
}
export function importSymbolShape(source: types.SymbolShape, ctx?: IImportContext): impl.SymbolShape {
    compatibleOldData(source, ctx)
    const ret: impl.SymbolShape = new impl.SymbolShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx),
        importShapeSize(source.size, ctx),
        (() => {
            const ret = new BasicMap<string, impl.Variable>()
            const _val = source.variables as any
            objkeys(_val).forEach((val, k) => {
                ret.set(k, importVariable(val, ctx))
            })
            return ret
        })())
    importSymbolShapeOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) {
        // const registed = ctx.document.symbolregist.get(ret.id);
        // if (!registed || registed === 'freesymbols' || registed === ctx.curPage) {
        ctx.document.symbolsMgr.add(ret.id, ret);
        // }
    }

    return ret
}
/* symbol union shape */
const importSymbolUnionShapeOptional = importSymbolShapeOptional
export function importSymbolUnionShape(source: types.SymbolUnionShape, ctx?: IImportContext): impl.SymbolUnionShape {
    compatibleOldData(source, ctx)
    const ret: impl.SymbolUnionShape = new impl.SymbolUnionShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx),
        importShapeSize(source.size, ctx),
        (() => {
            const ret = new BasicMap<string, impl.Variable>()
            const _val = source.variables as any
            objkeys(_val).forEach((val, k) => {
                ret.set(k, importVariable(val, ctx))
            })
            return ret
        })())
    importSymbolUnionShapeOptional(ret, source, ctx)
    return ret
}
/* table shape2 */
function importTableShape2Optional(tar: impl.TableShape2, source: types.TableShape2, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.textAttr !== undefined) tar.textAttr = importTextAttr(source.textAttr, ctx)
}
export function importTableShape2(source: types.TableShape2, ctx?: IImportContext): impl.TableShape2 {
    const ret: impl.TableShape2 = new impl.TableShape2 (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importTransform(source.transform, ctx),
        importStyle(source.style, ctx),
        importShapeSize(source.size, ctx),
        (() => {
            const ret = new BasicMap<string, impl.Artboard>()
            const _val = source.cells as any
            objkeys(_val).forEach((val, k) => {
                ret.set(k, importArtboard(val, ctx))
            })
            return ret
        })(),
        (() => {
            const ret = new BasicMap<string, impl.TableCellAttr>()
            const _val = source.cellAttrs as any
            objkeys(_val).forEach((val, k) => {
                ret.set(k, importTableCellAttr(val, ctx))
            })
            return ret
        })(),
        importTableShape2_rowHeights(source.rowHeights, ctx),
        importTableShape2_colWidths(source.colWidths, ctx))
    importTableShape2Optional(ret, source, ctx)
    return ret
}