/* 代码生成，勿手动修改 */
import * as impl from "./classes"
import * as types from "./typesdefine"
import { BasicArray, BasicMap } from "./basic"
import { uuid } from "../basic/uuid"
export interface IImportContext {
    document: impl.Document
    curPage: string
}
type Artboard_guides = BasicArray<impl.Guide>
type Artboard_prototypeInteractions = BasicArray<impl.PrototypeInterAction>
type DocumentMeta_pagesList = BasicArray<impl.PageListItem>
type ExportOptions_exportFormats = BasicArray<impl.ExportFormat>
type Gradient_stops = BasicArray<impl.Stop>
type GroupShape_childs = BasicArray<impl.GroupShape | impl.ImageShape | impl.PathShape | impl.PathShape2 | impl.RectShape | impl.SymbolRefShape | impl.SymbolShape | impl.SymbolUnionShape | impl.TextShape | impl.Artboard | impl.LineShape | impl.OvalShape | impl.TableShape | impl.ContactShape | impl.Shape | impl.CutoutShape | impl.BoolShape | impl.PolygonShape | impl.StarShape>
type Guide_crdtidx = BasicArray<number>
type Page_guides = BasicArray<impl.Guide>
type Para_spans = BasicArray<impl.Span>
type PathSegment_points = BasicArray<impl.CurvePoint>
type PathShape_pathsegs = BasicArray<impl.PathSegment>
type PathShape2_pathsegs = BasicArray<impl.PathSegment>
type PrototypeActions_easingFunction = BasicArray<number>
type PrototypeInterAction_crdtidx = BasicArray<number>
type PrototypeInterAction_actions = BasicArray<impl.PrototypeActions>
type Style_borders = BasicArray<impl.Border>
type Style_fills = BasicArray<impl.Fill>
type Style_shadows = BasicArray<impl.Shadow>
type Style_innerShadows = BasicArray<impl.Shadow>
type Style_contacts = BasicArray<impl.ContactRole>
type SymbolRefShape_prototypeInteractions = BasicArray<impl.PrototypeInterAction>
type SymbolShape_guides = BasicArray<impl.Guide>
type SymbolShape_prototypeInteractions = BasicArray<impl.PrototypeInterAction>
type TableShape_rowHeights = BasicArray<impl.CrdtNumber>
type TableShape_colWidths = BasicArray<impl.CrdtNumber>
type Text_paras = BasicArray<impl.Para>
type Variable_0 = BasicArray<impl.Border | impl.Fill | impl.Shadow>
export function importArtboard_guides(source: types.Artboard_guides, ctx?: IImportContext): Artboard_guides {
    const ret: Artboard_guides = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importGuide(source, ctx))
    })
    return ret
}
export function importArtboard_prototypeInteractions(source: types.Artboard_prototypeInteractions, ctx?: IImportContext): Artboard_prototypeInteractions {
    const ret: Artboard_prototypeInteractions = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importPrototypeInterAction(source, ctx))
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
    if (source.behavior) tar.behavior = importBulletNumbersBehavior(source.behavior, ctx)
    if (source.offset) tar.offset = source.offset
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
    if (source.radius) tar.radius = source.radius
    if (source.fromX) tar.fromX = source.fromX
    if (source.fromY) tar.fromY = source.fromY
    if (source.toX) tar.toX = source.toX
    if (source.toY) tar.toY = source.toY
    if (source.hasFrom) tar.hasFrom = source.hasFrom
    if (source.hasTo) tar.hasTo = source.hasTo
}
export function importCurvePoint(source: types.CurvePoint, ctx?: IImportContext): impl.CurvePoint {
        // inject code
    const _source = source as any;
    if (_source.cornerRadius) _source.radius = _source.cornerRadius;
    if (_source.hasCurveFrom) {
        _source.hasFrom = true;
        _source.fromX = _source.curveFrom.x;
        _source.fromY = _source.curveFrom.y;
    }
    if (_source.hasCurveTo) {
        _source.hasTo = true;
        _source.toX = _source.curveTo.x;
        _source.toY = _source.curveTo.y;
    }
    if (_source.point) {
        _source.x = _source.point.x;
        _source.y = _source.point.y;
    }
    if (_source.curveMode) {
        _source.mode = _source.curveMode;
    }

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
/* overlayPositionType */
export function importOverlayPositions(source: types.OverlayPositions, ctx?: IImportContext): impl.OverlayPositions {
    return source
}
/* override types */
export function importOverrideType(source: types.OverrideType, ctx?: IImportContext): impl.OverrideType {
    return source
}
/* padding */
function importPaddingOptional(tar: impl.Padding, source: types.Padding, ctx?: IImportContext) {
    if (source.left) tar.left = source.left
    if (source.top) tar.top = source.top
    if (source.right) tar.right = source.right
    if (source.bottom) tar.bottom = source.bottom
}
export function importPadding(source: types.Padding, ctx?: IImportContext): impl.Padding {
    const ret: impl.Padding = new impl.Padding ()
    importPaddingOptional(ret, source, ctx)
    return ret
}
/* page list item */
function importPageListItemOptional(tar: impl.PageListItem, source: types.PageListItem, ctx?: IImportContext) {
    if (source.versionId) tar.versionId = source.versionId
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
/* point 2d */
export function importPoint2D(source: types.Point2D, ctx?: IImportContext): impl.Point2D {
    const ret: impl.Point2D = new impl.Point2D (
        source.x,
        source.y)
    return ret
}
export function importPrototypeActions_easingFunction(source: types.PrototypeActions_easingFunction, ctx?: IImportContext): PrototypeActions_easingFunction {
    const ret: PrototypeActions_easingFunction = new BasicArray()
    source.forEach((source, i) => {
        ret.push(source)
    })
    return ret
}
/* connectionType */
export function importPrototypeConnectionType(source: types.PrototypeConnectionType, ctx?: IImportContext): impl.PrototypeConnectionType {
    return source
}
/* easingType */
export function importPrototypeEasingType(source: types.PrototypeEasingType, ctx?: IImportContext): impl.PrototypeEasingType {
    return source
}
/* interactionType */
export function importPrototypeEvents(source: types.PrototypeEvents, ctx?: IImportContext): impl.PrototypeEvents {
    return source
}
/* extraScrollOffset */
export function importPrototypeExtrascrolloffset(source: types.PrototypeExtrascrolloffset, ctx?: IImportContext): impl.PrototypeExtrascrolloffset {
    const ret: impl.PrototypeExtrascrolloffset = new impl.PrototypeExtrascrolloffset (
        source.id,
        source.x,
        source.y)
    return ret
}
export function importPrototypeInterAction_crdtidx(source: types.PrototypeInterAction_crdtidx, ctx?: IImportContext): PrototypeInterAction_crdtidx {
    const ret: PrototypeInterAction_crdtidx = new BasicArray()
    source.forEach((source, i) => {
        ret.push(source)
    })
    return ret
}
export function importPrototypeInterAction_actions(source: types.PrototypeInterAction_actions, ctx?: IImportContext): PrototypeInterAction_actions {
    const ret: PrototypeInterAction_actions = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importPrototypeActions(source, ctx))
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
/* resize type */
export function importResizeType(source: types.ResizeType, ctx?: IImportContext): impl.ResizeType {
    return source
}
/* shadow position */
export function importShadowPosition(source: types.ShadowPosition, ctx?: IImportContext): impl.ShadowPosition {
    return source
}
/* shadow */
function importShadowOptional(tar: impl.Shadow, source: types.Shadow, ctx?: IImportContext) {
    if (source.contextSettings) tar.contextSettings = importGraphicsContextSettings(source.contextSettings, ctx)
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
/* shape types */
export function importShapeType(source: types.ShapeType, ctx?: IImportContext): impl.ShapeType {
    return source
}
/* side type */
export function importSideType(source: types.SideType, ctx?: IImportContext): impl.SideType {
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
export function importStyle_borders(source: types.Style_borders, ctx?: IImportContext): Style_borders {
    const ret: Style_borders = new BasicArray()
    source.forEach((source, i) => {
        if (!source.crdtidx) source.crdtidx = [i]
        ret.push(importBorder(source, ctx))
    })
    return ret
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
export function importSymbolRefShape_prototypeInteractions(source: types.SymbolRefShape_prototypeInteractions, ctx?: IImportContext): SymbolRefShape_prototypeInteractions {
    const ret: SymbolRefShape_prototypeInteractions = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importPrototypeInterAction(source, ctx))
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
export function importSymbolShape_prototypeInteractions(source: types.SymbolShape_prototypeInteractions, ctx?: IImportContext): SymbolShape_prototypeInteractions {
    const ret: SymbolShape_prototypeInteractions = new BasicArray()
    source.forEach((source, i) => {
        ret.push(importPrototypeInterAction(source, ctx))
    })
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
            if (source.typeId === "border") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importBorder(source as types.Border, ctx)
            }
            if (source.typeId === "fill") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importFill(source as types.Fill, ctx)
            }
            if (source.typeId === "shadow") {
                if (!source.crdtidx) source.crdtidx = [i]
                return importShadow(source as types.Shadow, ctx)
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
/* blur */
function importBlurOptional(tar: impl.Blur, source: types.Blur, ctx?: IImportContext) {
    if (source.motionAngle) tar.motionAngle = source.motionAngle
    if (source.radius) tar.radius = source.radius
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
/* document meta */
function importDocumentMetaOptional(tar: impl.DocumentMeta, source: types.DocumentMeta, ctx?: IImportContext) {
    if (source.freesymbolsVersionId) tar.freesymbolsVersionId = source.freesymbolsVersionId
}
export function importDocumentMeta(source: types.DocumentMeta, ctx?: IImportContext): impl.DocumentMeta {
        // inject code
    if (!(source as any).symbolregist) (source as any).symbolregist = {};

    const ret: impl.DocumentMeta = new impl.DocumentMeta (
        source.id,
        source.name,
        importDocumentMeta_pagesList(source.pagesList, ctx),
        source.lastCmdId,
        (() => {
            const ret = new BasicMap<string, string>()
            const _val = source.symbolregist as any
            Object.keys(source.symbolregist).forEach((k) => {
                const val = _val[k]
                ret.set(k, val)
            })
            return ret
        })())
    importDocumentMetaOptional(ret, source, ctx)
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
    if (source.elipseLength) tar.elipseLength = source.elipseLength
    if (source.gradientOpacity) tar.gradientOpacity = source.gradientOpacity
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
function importOverlayBackgroundAppearanceOptional(tar: impl.OverlayBackgroundAppearance, source: types.OverlayBackgroundAppearance, ctx?: IImportContext) {
    if (source.typeId) tar.typeId = source.typeId
}
export function importOverlayBackgroundAppearance(source: types.OverlayBackgroundAppearance, ctx?: IImportContext): impl.OverlayBackgroundAppearance {
    const ret: impl.OverlayBackgroundAppearance = new impl.OverlayBackgroundAppearance (
        importOverlayBackgroundType(source.backgroundType, ctx),
        importColor(source.backgroundColor, ctx))
    importOverlayBackgroundAppearanceOptional(ret, source, ctx)
    return ret
}
/* actions */
function importPrototypeActionsOptional(tar: impl.PrototypeActions, source: types.PrototypeActions, ctx?: IImportContext) {
    if (source.typeId) tar.typeId = source.typeId
    if (source.targetNodeID) tar.targetNodeID = source.targetNodeID
    if (source.transitionType) tar.transitionType = importPrototypeTransitionType(source.transitionType, ctx)
    if (source.transitionDuration) tar.transitionDuration = source.transitionDuration
    if (source.easingType) tar.easingType = importPrototypeEasingType(source.easingType, ctx)
    if (source.connectionURL) tar.connectionURL = source.connectionURL
    if (source.openUrlInNewTab) tar.openUrlInNewTab = source.openUrlInNewTab
    if (source.navigationType) tar.navigationType = importPrototypeNavigationType(source.navigationType, ctx)
    if (source.easingFunction) tar.easingFunction = importPrototypeActions_easingFunction(source.easingFunction, ctx)
    if (source.extraScrollOffset) tar.extraScrollOffset = importPrototypeExtrascrolloffset(source.extraScrollOffset, ctx)
}
export function importPrototypeActions(source: types.PrototypeActions, ctx?: IImportContext): impl.PrototypeActions {
    const ret: impl.PrototypeActions = new impl.PrototypeActions (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        importPrototypeConnectionType(source.connectionType, ctx))
    importPrototypeActionsOptional(ret, source, ctx)
    return ret
}
/* event */
function importPrototypeEventOptional(tar: impl.PrototypeEvent, source: types.PrototypeEvent, ctx?: IImportContext) {
    if (source.transitionTimeout) tar.transitionTimeout = source.transitionTimeout
}
export function importPrototypeEvent(source: types.PrototypeEvent, ctx?: IImportContext): impl.PrototypeEvent {
    const ret: impl.PrototypeEvent = new impl.PrototypeEvent (
        importPrototypeEvents(source.interactionType, ctx))
    importPrototypeEventOptional(ret, source, ctx)
    return ret
}
/* prototypeInteraction */
function importPrototypeInterActionOptional(tar: impl.PrototypeInterAction, source: types.PrototypeInterAction, ctx?: IImportContext) {
    if (source.typeId) tar.typeId = source.typeId
}
export function importPrototypeInterAction(source: types.PrototypeInterAction, ctx?: IImportContext): impl.PrototypeInterAction {
    const ret: impl.PrototypeInterAction = new impl.PrototypeInterAction (
        importPrototypeInterAction_crdtidx(source.crdtidx, ctx),
        source.id,
        importPrototypeEvent(source.event, ctx),
        importPrototypeInterAction_actions(source.actions, ctx))
    importPrototypeInterActionOptional(ret, source, ctx)
    return ret
}
/* span attr */
function importSpanAttrOptional(tar: impl.SpanAttr, source: types.SpanAttr, ctx?: IImportContext) {
    if (source.fontName) tar.fontName = source.fontName
    if (source.fontSize) tar.fontSize = source.fontSize
    if (source.color) tar.color = importColor(source.color, ctx)
    if (source.strikethrough) tar.strikethrough = importStrikethroughType(source.strikethrough, ctx)
    if (source.underline) tar.underline = importUnderlineType(source.underline, ctx)
    if (source.weight) tar.weight = source.weight
    if (source.italic) tar.italic = source.italic
    if (source.bulletNumbers) tar.bulletNumbers = importBulletNumbers(source.bulletNumbers, ctx)
    if (source.highlight) tar.highlight = importColor(source.highlight, ctx)
    if (source.kerning) tar.kerning = source.kerning
    if (source.transform) tar.transform = importTextTransformType(source.transform, ctx)
    if (source.placeholder) tar.placeholder = source.placeholder
    if (source.fillType) tar.fillType = importFillType(source.fillType, ctx)
    if (source.gradient) tar.gradient = importGradient(source.gradient, ctx)
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
/* border */
function importBorderOptional(tar: impl.Border, source: types.Border, ctx?: IImportContext) {
    if (source.contextSettings) tar.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.gradient) tar.gradient = importGradient(source.gradient, ctx)
}
export function importBorder(source: types.Border, ctx?: IImportContext): impl.Border {
        // inject code
    if (!(source as any).sideSetting) {
        source.sideSetting = {
            sideType: types.SideType.Normal,
            thicknessTop: source.thickness,
            thicknessLeft: source.thickness,
            thicknessBottom: source.thickness,
            thicknessRight: source.thickness,
        }
    }

    const ret: impl.Border = new impl.Border (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.isEnabled,
        importFillType(source.fillType, ctx),
        importColor(source.color, ctx),
        importBorderPosition(source.position, ctx),
        source.thickness,
        importBorderStyle(source.borderStyle, ctx),
        importCornerType(source.cornerType, ctx),
        importBorderSideSetting(source.sideSetting, ctx))
    importBorderOptional(ret, source, ctx)
    return ret
}
/* fill */
function importFillOptional(tar: impl.Fill, source: types.Fill, ctx?: IImportContext) {
    if (source.contextSettings) tar.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.gradient) tar.gradient = importGradient(source.gradient, ctx)
    if (source.imageRef) tar.imageRef = source.imageRef
    if (source.fillRule) tar.fillRule = importFillRule(source.fillRule, ctx)
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
    if (source.alignment) tar.alignment = importTextHorAlign(source.alignment, ctx)
    if (source.paraSpacing) tar.paraSpacing = source.paraSpacing
    if (source.minimumLineHeight) tar.minimumLineHeight = source.minimumLineHeight
    if (source.maximumLineHeight) tar.maximumLineHeight = source.maximumLineHeight
    if (source.indent) tar.indent = source.indent
}
export function importParaAttr(source: types.ParaAttr, ctx?: IImportContext): impl.ParaAttr {
    const ret: impl.ParaAttr = new impl.ParaAttr ()
    importParaAttrOptional(ret, source, ctx)
    return ret
}
/* para */
function importParaOptional(tar: impl.Para, source: types.Para, ctx?: IImportContext) {
    if (source.attr) tar.attr = importParaAttr(source.attr, ctx)
}
export function importPara(source: types.Para, ctx?: IImportContext): impl.Para {
    const ret: impl.Para = new impl.Para (
        source.text,
        importPara_spans(source.spans, ctx))
    importParaOptional(ret, source, ctx)
    return ret
}
/* style */
function importStyleOptional(tar: impl.Style, source: types.Style, ctx?: IImportContext) {
    if (source.miterLimit) tar.miterLimit = source.miterLimit
    if (source.windingRule) tar.windingRule = importWindingRule(source.windingRule, ctx)
    if (source.blur) tar.blur = importBlur(source.blur, ctx)
    if (source.borderOptions) tar.borderOptions = importBorderOptions(source.borderOptions, ctx)
    if (source.colorControls) tar.colorControls = importColorControls(source.colorControls, ctx)
    if (source.contextSettings) tar.contextSettings = importContextSettings(source.contextSettings, ctx)
    if (source.innerShadows) tar.innerShadows = importStyle_innerShadows(source.innerShadows, ctx)
    if (source.contacts) tar.contacts = importStyle_contacts(source.contacts, ctx)
    if (source.startMarkerType) tar.startMarkerType = importMarkerType(source.startMarkerType, ctx)
    if (source.endMarkerType) tar.endMarkerType = importMarkerType(source.endMarkerType, ctx)
    if (source.varbinds) tar.varbinds = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.varbinds as any
        Object.keys(source.varbinds).forEach((k) => {
            const val = _val[k]
            ret.set(k, val)
        })
        return ret
    })()
}
export function importStyle(source: types.Style, ctx?: IImportContext): impl.Style {
    const ret: impl.Style = new impl.Style (
        importStyle_borders(source.borders, ctx),
        importStyle_fills(source.fills, ctx),
        importStyle_shadows(source.shadows, ctx))
    importStyleOptional(ret, source, ctx)
    return ret
}
/* text attr */
function importTextAttrOptional(tar: impl.TextAttr, source: types.TextAttr, ctx?: IImportContext) {
    importParaAttrOptional(tar, source)
    if (source.verAlign) tar.verAlign = importTextVerAlign(source.verAlign, ctx)
    if (source.orientation) tar.orientation = importTextOrientation(source.orientation, ctx)
    if (source.textBehaviour) tar.textBehaviour = importTextBehaviour(source.textBehaviour, ctx)
    if (source.padding) tar.padding = importPadding(source.padding, ctx)
}
export function importTextAttr(source: types.TextAttr, ctx?: IImportContext): impl.TextAttr {
        // inject code
    // 兼容旧数据
    const _source = source as any;
    if (typeof _source.bold === 'boolean') {
        _source.bold = _source.bold ? 700 : 400;
    }
    if (_source.bold) {
        _source.weight = _source.bold;
    }

    const ret: impl.TextAttr = new impl.TextAttr ()
    importTextAttrOptional(ret, source, ctx)
    return ret
}
/* text */
function importTextOptional(tar: impl.Text, source: types.Text, ctx?: IImportContext) {
    if (source.attr) tar.attr = importTextAttr(source.attr, ctx)
}
export function importText(source: types.Text, ctx?: IImportContext): impl.Text {
    const ret: impl.Text = new impl.Text (
        importText_paras(source.paras, ctx))
    importTextOptional(ret, source, ctx)
    return ret
}
/* shape */
function importShapeOptional(tar: impl.Shape, source: types.Shape, ctx?: IImportContext) {
    if (source.boolOp) tar.boolOp = importBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport) tar.isFixedToViewport = source.isFixedToViewport
    if (source.isFlippedHorizontal) tar.isFlippedHorizontal = source.isFlippedHorizontal
    if (source.isFlippedVertical) tar.isFlippedVertical = source.isFlippedVertical
    if (source.isLocked) tar.isLocked = source.isLocked
    if (source.isVisible) tar.isVisible = source.isVisible
    if (source.exportOptions) tar.exportOptions = importExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed) tar.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint) tar.resizingConstraint = source.resizingConstraint
    if (source.resizingType) tar.resizingType = importResizeType(source.resizingType, ctx)
    if (source.rotation) tar.rotation = source.rotation
    if (source.constrainerProportions) tar.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode) tar.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask) tar.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain) tar.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.varbinds) tar.varbinds = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.varbinds as any
        Object.keys(source.varbinds).forEach((k) => {
            const val = _val[k]
            ret.set(k, val)
        })
        return ret
    })()
    if (source.haveEdit) tar.haveEdit = source.haveEdit
}
export function importShape(source: types.Shape, ctx?: IImportContext): impl.Shape {
    const ret: impl.Shape = new impl.Shape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx))
    importShapeOptional(ret, source, ctx)
    return ret
}
/* table cell */
function importTableCellOptional(tar: impl.TableCell, source: types.TableCell, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.imageRef) tar.imageRef = source.imageRef
    if (source.rowSpan) tar.rowSpan = source.rowSpan
    if (source.colSpan) tar.colSpan = source.colSpan
}
export function importTableCell(source: types.TableCell, ctx?: IImportContext): impl.TableCell {
        // inject code
    // 兼容旧数据
    if (!(source as any).crdtidx) (source as any).crdtidx = []
    if (!source.text) source.text = {
        typeId: "text",
        paras: [
            {
                text: "\n",
                spans: [
                    {
                        fontName: "PingFang SC",
                        fontSize: 14,
                        length: 1,
                        color: {
                            typeId: "color",
                            alpha: 0.85,
                            red: 0,
                            green: 0,
                            blue: 0
                        }
                    }
                ],
                attr: {
                    minimumLineHeight: 24
                }
            }
        ],
        attr: {
            textBehaviour: types.TextBehaviour.Fixed,
            padding: {
                left: 5,
                top: 0,
                right: 3,
                bottom: 0
            }
        }
    }

    const ret: impl.TableCell = new impl.TableCell (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importTableCellType(source.cellType, ctx),
        importText(source.text, ctx))
    importTableCellOptional(ret, source, ctx)
    return ret
}
/* table shape */
function importTableShapeOptional(tar: impl.TableShape, source: types.TableShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.textAttr) tar.textAttr = importTextAttr(source.textAttr, ctx)
}
export function importTableShape(source: types.TableShape, ctx?: IImportContext): impl.TableShape {
        // inject code
    // 兼容旧数据
    if ((source as any).datas || (source as any).childs) {
        source.colWidths = ((source as any).colWidths as number[]).map((v, i) => ({
            id: uuid(),
            crdtidx: [i],
            value: v
        } as types.CrdtNumber));
        source.rowHeights = ((source as any).rowHeights as number[]).map((v, i) => ({
            id: uuid(),
            crdtidx: [i],
            value: v
        } as types.CrdtNumber));

        const colCount = source.colWidths.length;
        const rowCount = source.rowHeights.length;
        const datas: types.TableCell[] = (source as any).datas || (source as any).childs;
        const cells: {[key: string]: types.TableCell} = {};
        for (let i = 0; i < datas.length; ++i) {
            const c = datas[i];
            if (!c) continue;
            const ri = Math.floor(i / colCount);
            const ci = i % colCount;
            if (ri >= rowCount) break;
            const id = source.rowHeights[ri].id + ',' + source.colWidths[ci].id;
            cells[id] = c;
            c.id = id;
        }
        source.cells = cells as any;
    }

    const ret: impl.TableShape = new impl.TableShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        (() => {
            const ret = new BasicMap<string, impl.TableCell>()
            const _val = source.cells as any
            Object.keys(source.cells).forEach((k) => {
                const val = _val[k]
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
    if (source.fixedRadius) tar.fixedRadius = source.fixedRadius
}
export function importTextShape(source: types.TextShape, ctx?: IImportContext): impl.TextShape {
    const ret: impl.TextShape = new impl.TextShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
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
            if (typeof source.value !== "object") {
                return source.value
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
            throw new Error("unknow typeId: " + source.value.typeId)
        })())
    return ret
}
/* comment */
function importCommentOptional(tar: impl.Comment, source: types.Comment, ctx?: IImportContext) {
    if (source.parentId) tar.parentId = source.parentId
    if (source.rootId) tar.rootId = source.rootId
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
    if (source.fixedRadius) tar.fixedRadius = source.fixedRadius
}
export function importPathShape(source: types.PathShape, ctx?: IImportContext): impl.PathShape {
        // inject code
     if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }

    const ret: impl.PathShape = new impl.PathShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx))
    importPathShapeOptional(ret, source, ctx)
    return ret
}
/* path shape */
function importPathShape2Optional(tar: impl.PathShape2, source: types.PathShape2, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.fixedRadius) tar.fixedRadius = source.fixedRadius
}
export function importPathShape2(source: types.PathShape2, ctx?: IImportContext): impl.PathShape2 {
    const ret: impl.PathShape2 = new impl.PathShape2 (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape2_pathsegs(source.pathsegs, ctx))
    importPathShape2Optional(ret, source, ctx)
    return ret
}
/* polygon shape */
const importPolygonShapeOptional = importPathShapeOptional
export function importPolygonShape(source: types.PolygonShape, ctx?: IImportContext): impl.PolygonShape {
    const ret: impl.PolygonShape = new impl.PolygonShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.counts)
    importPolygonShapeOptional(ret, source, ctx)
    return ret
}
/* rect shape */
const importRectShapeOptional = importPathShapeOptional
export function importRectShape(source: types.RectShape, ctx?: IImportContext): impl.RectShape {
        // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }

    const ret: impl.RectShape = new impl.RectShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx))
    importRectShapeOptional(ret, source, ctx)
    return ret
}
/* star shape */
const importStarShapeOptional = importPathShapeOptional
export function importStarShape(source: types.StarShape, ctx?: IImportContext): impl.StarShape {
    const ret: impl.StarShape = new impl.StarShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.counts,
        source.innerAngle)
    importStarShapeOptional(ret, source, ctx)
    return ret
}
/* symbol ref shape */
function importSymbolRefShapeOptional(tar: impl.SymbolRefShape, source: types.SymbolRefShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.overrides) tar.overrides = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.overrides as any
        Object.keys(source.overrides).forEach((k) => {
            const val = _val[k]
            ret.set(k, val)
        })
        return ret
    })()
    if (source.isCustomSize) tar.isCustomSize = source.isCustomSize
    if (source.cornerRadius) tar.cornerRadius = importCornerRadius(source.cornerRadius, ctx)
    if (source.prototypeStartingPoint) tar.prototypeStartingPoint = importPrototypeStartingPoint(source.prototypeStartingPoint, ctx)
    if (source.prototypeInteractions) tar.prototypeInteractions = importSymbolRefShape_prototypeInteractions(source.prototypeInteractions, ctx)
}
export function importSymbolRefShape(source: types.SymbolRefShape, ctx?: IImportContext): impl.SymbolRefShape {
        // inject code
    if (!source.variables) {
        source.variables = {} as any
    }
    if ((source as any).virbindsEx) {
        source.overrides = (source as any).virbindsEx
    }

    const ret: impl.SymbolRefShape = new impl.SymbolRefShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        source.refId,
        (() => {
            const ret = new BasicMap<string, impl.Variable>()
            const _val = source.variables as any
            Object.keys(source.variables).forEach((k) => {
                const val = _val[k]
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
/* contact shape */
function importContactShapeOptional(tar: impl.ContactShape, source: types.ContactShape, ctx?: IImportContext) {
    importPathShapeOptional(tar, source)
    if (source.from) tar.from = importContactForm(source.from, ctx)
    if (source.to) tar.to = importContactForm(source.to, ctx)
}
export function importContactShape(source: types.ContactShape, ctx?: IImportContext): impl.ContactShape {
        // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: false
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    } else {
        if (source?.pathsegs[0]?.isClosed) {
            source.pathsegs[0].isClosed = false;
        }
    }

    const ret: impl.ContactShape = new impl.ContactShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
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
        // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }

    const ret: impl.CutoutShape = new impl.CutoutShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.scalingStroke)
    importCutoutShapeOptional(ret, source, ctx)
    return ret
}
/* image shape */
const importImageShapeOptional = importPathShapeOptional
export function importImageShape(source: types.ImageShape, ctx?: IImportContext): impl.ImageShape {
        // inject code
    if (!source.pathsegs) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points.length) {
            seg.points.push(...(source as any)?.points);
        } else {
            // 需要用固定的，这样如果不同用户同时打开此文档，对points做的操作，对应的point id也是对的
            const id1 = "b259921b-4eba-461d-afc3-c4c58c1fa337"
            const id2 = "62ea3ee3-3378-4602-a918-7e05f426bb8e"
            const id3 = "1519da3c-c692-4e1d-beb4-01a85cc56738"
            const id4 = "e857f541-4e7f-491b-96e6-2ca38f1d4c09"
            const p1: types.CurvePoint = {
                crdtidx: [0],
                id: id1,
                mode: types.CurveMode.Straight,
                x: 0, y: 0
            }; // lt
            const p2: types.CurvePoint =
            {
                crdtidx: [1],
                id: id2,
                mode: types.CurveMode.Straight,
                x: 1, y: 0
            }; // rt
            const p3: types.CurvePoint = {
                crdtidx: [2],
                id: id3,
                mode: types.CurveMode.Straight,
                x: 1, y: 1
            }; // rb
            const p4: types.CurvePoint = {
                crdtidx: [3],
                id: id4,
                mode: types.CurveMode.Straight,
                x: 0, y: 1
            }; // lb
        
            seg.points.push(p1, p2, p3, p4);
        }
     
        source.pathsegs = [seg];
    }

    const ret: impl.ImageShape = new impl.ImageShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        source.imageRef)
    importImageShapeOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);

    return ret
}
/* line shape */
const importLineShapeOptional = importPathShapeOptional
export function importLineShape(source: types.LineShape, ctx?: IImportContext): impl.LineShape {
        // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: false
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }

    const ret: impl.LineShape = new impl.LineShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx))
    importLineShapeOptional(ret, source, ctx)
    return ret
}
/* oval shape */
const importOvalShapeOptional = importPathShapeOptional
export function importOvalShape(source: types.OvalShape, ctx?: IImportContext): impl.OvalShape {
        // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }

    const ret: impl.OvalShape = new impl.OvalShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importPathShape_pathsegs(source.pathsegs, ctx),
        importEllipse(source.ellipse, ctx))
    importOvalShapeOptional(ret, source, ctx)
    return ret
}
/* artboard shape */
function importArtboardOptional(tar: impl.Artboard, source: types.Artboard, ctx?: IImportContext) {
    importGroupShapeOptional(tar, source)
    if (source.cornerRadius) tar.cornerRadius = importCornerRadius(source.cornerRadius, ctx)
    if (source.guides) tar.guides = importArtboard_guides(source.guides, ctx)
    if (source.prototypeStartingPoint) tar.prototypeStartingPoint = importPrototypeStartingPoint(source.prototypeStartingPoint, ctx)
    if (source.prototypeInteractions) tar.prototypeInteractions = importArtboard_prototypeInteractions(source.prototypeInteractions, ctx)
    if (source.overlayPositionType) tar.overlayPositionType = importOverlayPositions(source.overlayPositionType, ctx)
    if (source.overlayBackgroundInteraction) tar.overlayBackgroundInteraction = importOverlayBackgroundInteraction(source.overlayBackgroundInteraction, ctx)
    if (source.overlayBackgroundAppearance) tar.overlayBackgroundAppearance = importOverlayBackgroundAppearance(source.overlayBackgroundAppearance, ctx)
}
export function importArtboard(source: types.Artboard, ctx?: IImportContext): impl.Artboard {
    const ret: impl.Artboard = new impl.Artboard (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx))
    importArtboardOptional(ret, source, ctx)
    return ret
}
/* bool shape */
const importBoolShapeOptional = importGroupShapeOptional
export function importBoolShape(source: types.BoolShape, ctx?: IImportContext): impl.BoolShape {
    const ret: impl.BoolShape = new impl.BoolShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx))
    importBoolShapeOptional(ret, source, ctx)
    return ret
}
/* group shape */
function importGroupShapeOptional(tar: impl.GroupShape, source: types.GroupShape, ctx?: IImportContext) {
    importShapeOptional(tar, source)
    if (source.fixedRadius) tar.fixedRadius = source.fixedRadius
}
export function importGroupShape(source: types.GroupShape, ctx?: IImportContext): impl.GroupShape {
        // inject code
    if ((source as any).isBoolOpShape) {
        source.typeId = "bool-shape";
        source.type = types.ShapeType.BoolShape;
        return importBoolShape(source, ctx);
    }

    const ret: impl.GroupShape = new impl.GroupShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx))
    importGroupShapeOptional(ret, source, ctx)
    return ret
}
/* page */
function importPageOptional(tar: impl.Page, source: types.Page, ctx?: IImportContext) {
    importGroupShapeOptional(tar, source)
    if (source.backgroundColor) tar.backgroundColor = importColor(source.backgroundColor, ctx)
    if (source.guides) tar.guides = importPage_guides(source.guides, ctx)
}
export function importPage(source: types.Page, ctx?: IImportContext): impl.Page {
        // inject code
    // 兼容旧数据
    if (!(source as any).crdtidx) (source as any).crdtidx = []

    const ret: impl.Page = new impl.Page (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx))
    importPageOptional(ret, source, ctx)
    return ret
}
/* symbol shape */
function importSymbolShapeOptional(tar: impl.SymbolShape, source: types.SymbolShape, ctx?: IImportContext) {
    importGroupShapeOptional(tar, source)
    if (source.symtags) tar.symtags = (() => {
        const ret = new BasicMap<string, string>()
        const _val = source.symtags as any
        Object.keys(source.symtags).forEach((k) => {
            const val = _val[k]
            ret.set(k, val)
        })
        return ret
    })()
    if (source.cornerRadius) tar.cornerRadius = importCornerRadius(source.cornerRadius, ctx)
    if (source.guides) tar.guides = importSymbolShape_guides(source.guides, ctx)
    if (source.prototypeStartingPoint) tar.prototypeStartingPoint = importPrototypeStartingPoint(source.prototypeStartingPoint, ctx)
    if (source.prototypeInteractions) tar.prototypeInteractions = importSymbolShape_prototypeInteractions(source.prototypeInteractions, ctx)
}
export function importSymbolShape(source: types.SymbolShape, ctx?: IImportContext): impl.SymbolShape {
    const ret: impl.SymbolShape = new impl.SymbolShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx),
        (() => {
            const ret = new BasicMap<string, impl.Variable>()
            const _val = source.variables as any
            Object.keys(source.variables).forEach((k) => {
                const val = _val[k]
                ret.set(k, importVariable(val, ctx))
            })
            return ret
        })())
    importSymbolShapeOptional(ret, source, ctx)
        // inject code
    if (ctx?.document) {
        const registed = ctx.document.symbolregist.get(ret.id);
        // if (!registed || registed === 'freesymbols' || registed === ctx.curPage) {
        ctx.document.symbolsMgr.add(ret.id, ret);
        // }
    }

    return ret
}
/* symbol union shape */
const importSymbolUnionShapeOptional = importSymbolShapeOptional
export function importSymbolUnionShape(source: types.SymbolUnionShape, ctx?: IImportContext): impl.SymbolUnionShape {
    const ret: impl.SymbolUnionShape = new impl.SymbolUnionShape (
        importCrdtidx(source.crdtidx, ctx),
        source.id,
        source.name,
        importShapeType(source.type, ctx),
        importShapeFrame(source.frame, ctx),
        importStyle(source.style, ctx),
        importGroupShape_childs(source.childs, ctx),
        (() => {
            const ret = new BasicMap<string, impl.Variable>()
            const _val = source.variables as any
            Object.keys(source.variables).forEach((k) => {
                const val = _val[k]
                ret.set(k, importVariable(val, ctx))
            })
            return ret
        })())
    importSymbolUnionShapeOptional(ret, source, ctx)
    return ret
}