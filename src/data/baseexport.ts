/* 代码生成，勿手动修改 */
import * as types from "./typesdefine"
export interface IExportContext {
    symbols?: Set<string>
    medias?: Set<string>
    refsymbols?: Set<string>
}
export function exportArtboard_guides(source: types.Artboard_guides, ctx?: IExportContext): types.Artboard_guides {
    const ret: types.Artboard_guides = []
    source.forEach((source) => {
        ret.push(exportGuide(source, ctx))
    })
    return ret
}
/* blend mode */
export function exportBlendMode(source: types.BlendMode, ctx?: IExportContext): types.BlendMode {
    return source
}
/* blur types */
export function exportBlurType(source: types.BlurType, ctx?: IExportContext): types.BlurType {
    return source
}
/* bool op types */
export function exportBoolOp(source: types.BoolOp, ctx?: IExportContext): types.BoolOp {
    return source
}
/* border position */
export function exportBorderPosition(source: types.BorderPosition, ctx?: IExportContext): types.BorderPosition {
    return source
}
/* border style */
export function exportBorderStyle(source: types.BorderStyle, ctx?: IExportContext): types.BorderStyle {
    const ret: types.BorderStyle = {} as types.BorderStyle
    ret.length = source.length
    ret.gap = source.gap
    return ret
}
/* bullet & item number behavior */
export function exportBulletNumbersBehavior(source: types.BulletNumbersBehavior, ctx?: IExportContext): types.BulletNumbersBehavior {
    return source
}
/* bullet & item number types */
export function exportBulletNumbersType(source: types.BulletNumbersType, ctx?: IExportContext): types.BulletNumbersType {
    return source
}
/* bullet numbers */
export function exportBulletNumbers(source: types.BulletNumbers, ctx?: IExportContext): types.BulletNumbers {
    const ret: types.BulletNumbers = {} as types.BulletNumbers
    ret.type = exportBulletNumbersType(source.type, ctx)
    if (source.behavior) ret.behavior = exportBulletNumbersBehavior(source.behavior, ctx)
    if (source.offset) ret.offset = source.offset
    return ret
}
/* color controls */
export function exportColorControls(source: types.ColorControls, ctx?: IExportContext): types.ColorControls {
    const ret: types.ColorControls = {} as types.ColorControls
    ret.isEnabled = source.isEnabled
    ret.brightness = source.brightness
    ret.contrast = source.contrast
    ret.hue = source.hue
    ret.saturation = source.saturation
    return ret
}
/* color */
export function exportColor(source: types.Color, ctx?: IExportContext): types.Color {
    const ret: types.Color = {} as types.Color
    ret.typeId = "color"
    ret.typeId = source.typeId
    ret.alpha = source.alpha
    ret.red = source.red
    ret.green = source.green
    ret.blue = source.blue
    return ret
}
/* contact role type */
export function exportContactRoleType(source: types.ContactRoleType, ctx?: IExportContext): types.ContactRoleType {
    return source
}
/* contact type */
export function exportContactType(source: types.ContactType, ctx?: IExportContext): types.ContactType {
    return source
}
/* context settings */
export function exportContextSettings(source: types.ContextSettings, ctx?: IExportContext): types.ContextSettings {
    const ret: types.ContextSettings = {} as types.ContextSettings
    ret.typeId = "context-settings"
    ret.typeId = source.typeId
    ret.blenMode = exportBlendMode(source.blenMode, ctx)
    ret.opacity = source.opacity
    return ret
}
/* couner radius */
export function exportCornerRadius(source: types.CornerRadius, ctx?: IExportContext): types.CornerRadius {
    const ret: types.CornerRadius = {} as types.CornerRadius
    ret.typeId = "corner-radius"
    ret.typeId = source.typeId
    ret.lt = source.lt
    ret.rt = source.rt
    ret.lb = source.lb
    ret.rb = source.rb
    return ret
}
/* corner type */
export function exportCornerType(source: types.CornerType, ctx?: IExportContext): types.CornerType {
    return source
}
/* crdtidx */
export function exportCrdtidx(source: types.Crdtidx, ctx?: IExportContext): types.Crdtidx {
    const ret: types.Crdtidx = []
    source.forEach((source) => {
        ret.push(source)
    })
    return ret
}
/* curve mode */
export function exportCurveMode(source: types.CurveMode, ctx?: IExportContext): types.CurveMode {
    return source
}
/* curve point */
export function exportCurvePoint(source: types.CurvePoint, ctx?: IExportContext): types.CurvePoint {
    const ret: types.CurvePoint = {} as types.CurvePoint
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.id = source.id
    ret.x = source.x
    ret.y = source.y
    ret.mode = exportCurveMode(source.mode, ctx)
    if (source.radius) ret.radius = source.radius
    if (source.fromX) ret.fromX = source.fromX
    if (source.fromY) ret.fromY = source.fromY
    if (source.toX) ret.toX = source.toX
    if (source.toY) ret.toY = source.toY
    if (source.hasFrom) ret.hasFrom = source.hasFrom
    if (source.hasTo) ret.hasTo = source.hasTo
    return ret
}
export function exportDocumentMeta_pagesList(source: types.DocumentMeta_pagesList, ctx?: IExportContext): types.DocumentMeta_pagesList {
    const ret: types.DocumentMeta_pagesList = []
    source.forEach((source) => {
        ret.push(exportPageListItem(source, ctx))
    })
    return ret
}
/* ellipse attributes */
export function exportEllipse(source: types.Ellipse, ctx?: IExportContext): types.Ellipse {
    const ret: types.Ellipse = {} as types.Ellipse
    ret.cx = source.cx
    ret.cy = source.cy
    ret.rx = source.rx
    ret.ry = source.ry
    return ret
}
/* export file format */
export function exportExportFileFormat(source: types.ExportFileFormat, ctx?: IExportContext): types.ExportFileFormat {
    return source
}
/* export format nameing scheme */
export function exportExportFormatNameingScheme(source: types.ExportFormatNameingScheme, ctx?: IExportContext): types.ExportFormatNameingScheme {
    return source
}
export function exportExportOptions_exportFormats(source: types.ExportOptions_exportFormats, ctx?: IExportContext): types.ExportOptions_exportFormats {
    const ret: types.ExportOptions_exportFormats = []
    source.forEach((source) => {
        ret.push(exportExportFormat(source, ctx))
    })
    return ret
}
/* visible scale type */
export function exportExportVisibleScaleType(source: types.ExportVisibleScaleType, ctx?: IExportContext): types.ExportVisibleScaleType {
    return source
}
/* fill rule */
export function exportFillRule(source: types.FillRule, ctx?: IExportContext): types.FillRule {
    return source
}
/* fill types */
export function exportFillType(source: types.FillType, ctx?: IExportContext): types.FillType {
    return source
}
/* gradient type */
export function exportGradientType(source: types.GradientType, ctx?: IExportContext): types.GradientType {
    return source
}
export function exportGradient_stops(source: types.Gradient_stops, ctx?: IExportContext): types.Gradient_stops {
    const ret: types.Gradient_stops = []
    source.forEach((source) => {
        ret.push(exportStop(source, ctx))
    })
    return ret
}
/* graphics contex settings */
export function exportGraphicsContextSettings(source: types.GraphicsContextSettings, ctx?: IExportContext): types.GraphicsContextSettings {
    const ret: types.GraphicsContextSettings = {} as types.GraphicsContextSettings
    ret.blendMode = exportBlendMode(source.blendMode, ctx)
    ret.opacity = source.opacity
    return ret
}
export function exportGroupShape_childs(source: types.GroupShape_childs, ctx?: IExportContext): types.GroupShape_childs {
    const ret: types.GroupShape_childs = []
    source.forEach((source) => {
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "group-shape") {
                return exportGroupShape(source as types.GroupShape, ctx)
            }
            if (source.typeId === "image-shape") {
                return exportImageShape(source as types.ImageShape, ctx)
            }
            if (source.typeId === "path-shape") {
                return exportPathShape(source as types.PathShape, ctx)
            }
            if (source.typeId === "path-shape2") {
                return exportPathShape2(source as types.PathShape2, ctx)
            }
            if (source.typeId === "rect-shape") {
                return exportRectShape(source as types.RectShape, ctx)
            }
            if (source.typeId === "symbol-ref-shape") {
                return exportSymbolRefShape(source as types.SymbolRefShape, ctx)
            }
            if (source.typeId === "symbol-shape") {
                return exportSymbolShape(source as types.SymbolShape, ctx)
            }
            if (source.typeId === "symbol-union-shape") {
                return exportSymbolUnionShape(source as types.SymbolUnionShape, ctx)
            }
            if (source.typeId === "text-shape") {
                return exportTextShape(source as types.TextShape, ctx)
            }
            if (source.typeId === "artboard") {
                return exportArtboard(source as types.Artboard, ctx)
            }
            if (source.typeId === "line-shape") {
                return exportLineShape(source as types.LineShape, ctx)
            }
            if (source.typeId === "oval-shape") {
                return exportOvalShape(source as types.OvalShape, ctx)
            }
            if (source.typeId === "table-shape") {
                return exportTableShape(source as types.TableShape, ctx)
            }
            if (source.typeId === "contact-shape") {
                return exportContactShape(source as types.ContactShape, ctx)
            }
            if (source.typeId === "shape") {
                return exportShape(source as types.Shape, ctx)
            }
            if (source.typeId === "cutout-shape") {
                return exportCutoutShape(source as types.CutoutShape, ctx)
            }
            if (source.typeId === "bool-shape") {
                return exportBoolShape(source as types.BoolShape, ctx)
            }
            if (source.typeId === "polygon-shape") {
                return exportPolygonShape(source as types.PolygonShape, ctx)
            }
            if (source.typeId === "star-shape") {
                return exportStarShape(source as types.StarShape, ctx)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* guide axis */
export function exportGuideAxis(source: types.GuideAxis, ctx?: IExportContext): types.GuideAxis {
    return source
}
export function exportGuide_crdtidx(source: types.Guide_crdtidx, ctx?: IExportContext): types.Guide_crdtidx {
    const ret: types.Guide_crdtidx = []
    source.forEach((source) => {
        ret.push(source)
    })
    return ret
}
/* guide */
export function exportGuide(source: types.Guide, ctx?: IExportContext): types.Guide {
    const ret: types.Guide = {} as types.Guide
    ret.typeId = "guide"
    ret.crdtidx = exportGuide_crdtidx(source.crdtidx, ctx)
    ret.typeId = source.typeId
    ret.id = source.id
    ret.axis = exportGuideAxis(source.axis, ctx)
    ret.offset = source.offset
    return ret
}
/* image scale mode */
export function exportImageScaleMode(source: types.ImageScaleMode, ctx?: IExportContext): types.ImageScaleMode {
    return source
}
/* line cap style */
export function exportLineCapStyle(source: types.LineCapStyle, ctx?: IExportContext): types.LineCapStyle {
    return source
}
/* line join style */
export function exportLineJoinStyle(source: types.LineJoinStyle, ctx?: IExportContext): types.LineJoinStyle {
    return source
}
/* marker type */
export function exportMarkerType(source: types.MarkerType, ctx?: IExportContext): types.MarkerType {
    return source
}
/* override types */
export function exportOverrideType(source: types.OverrideType, ctx?: IExportContext): types.OverrideType {
    return source
}
/* padding */
export function exportPadding(source: types.Padding, ctx?: IExportContext): types.Padding {
    const ret: types.Padding = {} as types.Padding
    if (source.left) ret.left = source.left
    if (source.top) ret.top = source.top
    if (source.right) ret.right = source.right
    if (source.bottom) ret.bottom = source.bottom
    return ret
}
/* page list item */
export function exportPageListItem(source: types.PageListItem, ctx?: IExportContext): types.PageListItem {
    const ret: types.PageListItem = {} as types.PageListItem
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.id = source.id
    ret.name = source.name
    if (source.versionId) ret.versionId = source.versionId
    return ret
}
export function exportPage_guides(source: types.Page_guides, ctx?: IExportContext): types.Page_guides {
    const ret: types.Page_guides = []
    source.forEach((source) => {
        ret.push(exportGuide(source, ctx))
    })
    return ret
}
/* paint filter */
export function exportPaintFilter(source: types.PaintFilter, ctx?: IExportContext): types.PaintFilter {
    const ret: types.PaintFilter = {} as types.PaintFilter
    ret.exposure = source.exposure
    ret.contrast = source.contrast
    ret.saturation = source.saturation
    ret.temperature = source.temperature
    ret.tint = source.tint
    ret.shadow = source.shadow
    ret.hue = source.hue
    return ret
}
/* paint filter type */
export function exportPaintFilterType(source: types.PaintFilterType, ctx?: IExportContext): types.PaintFilterType {
    return source
}
export function exportPara_spans(source: types.Para_spans, ctx?: IExportContext): types.Para_spans {
    const ret: types.Para_spans = []
    source.forEach((source) => {
        ret.push(exportSpan(source, ctx))
    })
    return ret
}
export function exportPathSegment_points(source: types.PathSegment_points, ctx?: IExportContext): types.PathSegment_points {
    const ret: types.PathSegment_points = []
    source.forEach((source) => {
        ret.push(exportCurvePoint(source, ctx))
    })
    return ret
}
/* path segment */
export function exportPathSegment(source: types.PathSegment, ctx?: IExportContext): types.PathSegment {
    const ret: types.PathSegment = {} as types.PathSegment
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.id = source.id
    ret.points = exportPathSegment_points(source.points, ctx)
    ret.isClosed = source.isClosed
    return ret
}
export function exportPathShape_pathsegs(source: types.PathShape_pathsegs, ctx?: IExportContext): types.PathShape_pathsegs {
    const ret: types.PathShape_pathsegs = []
    source.forEach((source) => {
        ret.push(exportPathSegment(source, ctx))
    })
    return ret
}
export function exportPathShape2_pathsegs(source: types.PathShape2_pathsegs, ctx?: IExportContext): types.PathShape2_pathsegs {
    const ret: types.PathShape2_pathsegs = []
    source.forEach((source) => {
        ret.push(exportPathSegment(source, ctx))
    })
    return ret
}
/* pattern transform */
export function exportPatternTransform(source: types.PatternTransform, ctx?: IExportContext): types.PatternTransform {
    const ret: types.PatternTransform = {} as types.PatternTransform
    ret.m00 = source.m00
    ret.m01 = source.m01
    ret.m02 = source.m02
    ret.m10 = source.m10
    ret.m11 = source.m11
    ret.m12 = source.m12
    return ret
}
/* point 2d */
export function exportPoint2D(source: types.Point2D, ctx?: IExportContext): types.Point2D {
    const ret: types.Point2D = {} as types.Point2D
    ret.x = source.x
    ret.y = source.y
    return ret
}
/* resize type */
export function exportResizeType(source: types.ResizeType, ctx?: IExportContext): types.ResizeType {
    return source
}
/* shadow position */
export function exportShadowPosition(source: types.ShadowPosition, ctx?: IExportContext): types.ShadowPosition {
    return source
}
/* shadow */
export function exportShadow(source: types.Shadow, ctx?: IExportContext): types.Shadow {
    const ret: types.Shadow = {} as types.Shadow
    ret.typeId = "shadow"
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.typeId = source.typeId
    ret.id = source.id
    ret.isEnabled = source.isEnabled
    ret.blurRadius = source.blurRadius
    ret.color = exportColor(source.color, ctx)
    ret.offsetX = source.offsetX
    ret.offsetY = source.offsetY
    ret.spread = source.spread
    ret.position = exportShadowPosition(source.position, ctx)
    if (source.contextSettings) ret.contextSettings = exportGraphicsContextSettings(source.contextSettings, ctx)
    return ret
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export function exportShapeFrame(source: types.ShapeFrame, ctx?: IExportContext): types.ShapeFrame {
    const ret: types.ShapeFrame = {} as types.ShapeFrame
    ret.x = source.x
    ret.y = source.y
    ret.width = source.width
    ret.height = source.height
    return ret
}
/* shape size */
export function exportShapeSize(source: types.ShapeSize, ctx?: IExportContext): types.ShapeSize {
    const ret: types.ShapeSize = {} as types.ShapeSize
    ret.width = source.width
    ret.height = source.height
    return ret
}
/* shape types */
export function exportShapeType(source: types.ShapeType, ctx?: IExportContext): types.ShapeType {
    return source
}
/* side type */
export function exportSideType(source: types.SideType, ctx?: IExportContext): types.SideType {
    return source
}
/* stop */
export function exportStop(source: types.Stop, ctx?: IExportContext): types.Stop {
    const ret: types.Stop = {} as types.Stop
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.id = source.id
    ret.position = source.position
    ret.color = exportColor(source.color, ctx)
    return ret
}
/* strikethrough types */
export function exportStrikethroughType(source: types.StrikethroughType, ctx?: IExportContext): types.StrikethroughType {
    return source
}
export function exportStyle_borders(source: types.Style_borders, ctx?: IExportContext): types.Style_borders {
    const ret: types.Style_borders = []
    source.forEach((source) => {
        ret.push(exportBorder(source, ctx))
    })
    return ret
}
export function exportStyle_fills(source: types.Style_fills, ctx?: IExportContext): types.Style_fills {
    const ret: types.Style_fills = []
    source.forEach((source) => {
        ret.push(exportFill(source, ctx))
    })
    return ret
}
export function exportStyle_shadows(source: types.Style_shadows, ctx?: IExportContext): types.Style_shadows {
    const ret: types.Style_shadows = []
    source.forEach((source) => {
        ret.push(exportShadow(source, ctx))
    })
    return ret
}
export function exportStyle_innerShadows(source: types.Style_innerShadows, ctx?: IExportContext): types.Style_innerShadows {
    const ret: types.Style_innerShadows = []
    source.forEach((source) => {
        ret.push(exportShadow(source, ctx))
    })
    return ret
}
export function exportStyle_contacts(source: types.Style_contacts, ctx?: IExportContext): types.Style_contacts {
    const ret: types.Style_contacts = []
    source.forEach((source) => {
        ret.push(exportContactRole(source, ctx))
    })
    return ret
}
export function exportSymbolShape_guides(source: types.SymbolShape_guides, ctx?: IExportContext): types.SymbolShape_guides {
    const ret: types.SymbolShape_guides = []
    source.forEach((source) => {
        ret.push(exportGuide(source, ctx))
    })
    return ret
}
/* table cell types */
export function exportTableCellType(source: types.TableCellType, ctx?: IExportContext): types.TableCellType {
    return source
}
export function exportTableShape_rowHeights(source: types.TableShape_rowHeights, ctx?: IExportContext): types.TableShape_rowHeights {
    const ret: types.TableShape_rowHeights = []
    source.forEach((source) => {
        ret.push(exportCrdtNumber(source, ctx))
    })
    return ret
}
export function exportTableShape_colWidths(source: types.TableShape_colWidths, ctx?: IExportContext): types.TableShape_colWidths {
    const ret: types.TableShape_colWidths = []
    source.forEach((source) => {
        ret.push(exportCrdtNumber(source, ctx))
    })
    return ret
}
/* text behaviour */
export function exportTextBehaviour(source: types.TextBehaviour, ctx?: IExportContext): types.TextBehaviour {
    return source
}
/* text horizontal alignment */
export function exportTextHorAlign(source: types.TextHorAlign, ctx?: IExportContext): types.TextHorAlign {
    return source
}
/* text orientation */
export function exportTextOrientation(source: types.TextOrientation, ctx?: IExportContext): types.TextOrientation {
    return source
}
/* text transform types */
export function exportTextTransformType(source: types.TextTransformType, ctx?: IExportContext): types.TextTransformType {
    return source
}
/* text vertical alignment */
export function exportTextVerAlign(source: types.TextVerAlign, ctx?: IExportContext): types.TextVerAlign {
    return source
}
export function exportText_paras(source: types.Text_paras, ctx?: IExportContext): types.Text_paras {
    const ret: types.Text_paras = []
    source.forEach((source) => {
        ret.push(exportPara(source, ctx))
    })
    return ret
}
/* transform */
export function exportTransform(source: types.Transform, ctx?: IExportContext): types.Transform {
    const ret: types.Transform = {} as types.Transform
    ret.m00 = source.m00
    ret.m01 = source.m01
    ret.m02 = source.m02
    ret.m10 = source.m10
    ret.m11 = source.m11
    ret.m12 = source.m12
    return ret
}
/* underline types */
export function exportUnderlineType(source: types.UnderlineType, ctx?: IExportContext): types.UnderlineType {
    return source
}
/* user infomation */
export function exportUserInfo(source: types.UserInfo, ctx?: IExportContext): types.UserInfo {
    const ret: types.UserInfo = {} as types.UserInfo
    ret.userId = source.userId
    ret.userNickname = source.userNickname
    ret.avatar = source.avatar
    return ret
}
/* variable types */
export function exportVariableType(source: types.VariableType, ctx?: IExportContext): types.VariableType {
    return source
}
export function exportVariable_0(source: types.Variable_0, ctx?: IExportContext): types.Variable_0 {
    const ret: types.Variable_0 = []
    source.forEach((source) => {
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "border") {
                return exportBorder(source as types.Border, ctx)
            }
            if (source.typeId === "fill") {
                return exportFill(source as types.Fill, ctx)
            }
            if (source.typeId === "shadow") {
                return exportShadow(source as types.Shadow, ctx)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* winding rule */
export function exportWindingRule(source: types.WindingRule, ctx?: IExportContext): types.WindingRule {
    return source
}
/* blur */
export function exportBlur(source: types.Blur, ctx?: IExportContext): types.Blur {
    const ret: types.Blur = {} as types.Blur
    ret.typeId = "blur"
    ret.typeId = source.typeId
    ret.isEnabled = source.isEnabled
    ret.center = exportPoint2D(source.center, ctx)
    ret.saturation = source.saturation
    ret.type = exportBlurType(source.type, ctx)
    if (source.motionAngle) ret.motionAngle = source.motionAngle
    if (source.radius) ret.radius = source.radius
    return ret
}
/* border options */
export function exportBorderOptions(source: types.BorderOptions, ctx?: IExportContext): types.BorderOptions {
    const ret: types.BorderOptions = {} as types.BorderOptions
    ret.isEnabled = source.isEnabled
    ret.lineCapStyle = exportLineCapStyle(source.lineCapStyle, ctx)
    ret.lineJoinStyle = exportLineJoinStyle(source.lineJoinStyle, ctx)
    return ret
}
/* border side setting */
export function exportBorderSideSetting(source: types.BorderSideSetting, ctx?: IExportContext): types.BorderSideSetting {
    const ret: types.BorderSideSetting = {} as types.BorderSideSetting
    ret.sideType = exportSideType(source.sideType, ctx)
    ret.thicknessTop = source.thicknessTop
    ret.thicknessLeft = source.thicknessLeft
    ret.thicknessBottom = source.thicknessBottom
    ret.thicknessRight = source.thicknessRight
    return ret
}
/* contact form */
export function exportContactForm(source: types.ContactForm, ctx?: IExportContext): types.ContactForm {
    const ret: types.ContactForm = {} as types.ContactForm
    ret.contactType = exportContactType(source.contactType, ctx)
    ret.shapeId = source.shapeId
    return ret
}
/* contactstyle */
export function exportContactRole(source: types.ContactRole, ctx?: IExportContext): types.ContactRole {
    const ret: types.ContactRole = {} as types.ContactRole
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.id = source.id
    ret.roleType = exportContactRoleType(source.roleType, ctx)
    ret.shapeId = source.shapeId
    return ret
}
/* crdt number */
export function exportCrdtNumber(source: types.CrdtNumber, ctx?: IExportContext): types.CrdtNumber {
    const ret: types.CrdtNumber = {} as types.CrdtNumber
    ret.id = source.id
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.value = source.value
    return ret
}
/* export format */
export function exportExportFormat(source: types.ExportFormat, ctx?: IExportContext): types.ExportFormat {
    const ret: types.ExportFormat = {} as types.ExportFormat
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.id = source.id
    ret.absoluteSize = source.absoluteSize
    ret.fileFormat = exportExportFileFormat(source.fileFormat, ctx)
    ret.name = source.name
    ret.namingScheme = exportExportFormatNameingScheme(source.namingScheme, ctx)
    ret.scale = source.scale
    ret.visibleScaleType = exportExportVisibleScaleType(source.visibleScaleType, ctx)
    return ret
}
/* export options */
export function exportExportOptions(source: types.ExportOptions, ctx?: IExportContext): types.ExportOptions {
    const ret: types.ExportOptions = {} as types.ExportOptions
    ret.typeId = "export-options"
    ret.typeId = source.typeId
    ret.exportFormats = exportExportOptions_exportFormats(source.exportFormats, ctx)
    ret.childOptions = source.childOptions
    ret.shouldTrim = source.shouldTrim
    ret.trimTransparent = source.trimTransparent
    ret.canvasBackground = source.canvasBackground
    ret.unfold = source.unfold
    return ret
}
/* gradient */
export function exportGradient(source: types.Gradient, ctx?: IExportContext): types.Gradient {
    const ret: types.Gradient = {} as types.Gradient
    ret.typeId = "gradient"
    ret.typeId = source.typeId
    ret.from = exportPoint2D(source.from, ctx)
    ret.to = exportPoint2D(source.to, ctx)
    ret.gradientType = exportGradientType(source.gradientType, ctx)
    ret.stops = exportGradient_stops(source.stops, ctx)
    if (source.elipseLength) ret.elipseLength = source.elipseLength
    if (source.gradientOpacity) ret.gradientOpacity = source.gradientOpacity
    return ret
}
/* span attr */
export function exportSpanAttr(source: types.SpanAttr, ctx?: IExportContext): types.SpanAttr {
    const ret: types.SpanAttr = {} as types.SpanAttr
    if (source.fontName) ret.fontName = source.fontName
    if (source.fontSize) ret.fontSize = source.fontSize
    if (source.color) ret.color = exportColor(source.color, ctx)
    if (source.strikethrough) ret.strikethrough = exportStrikethroughType(source.strikethrough, ctx)
    if (source.underline) ret.underline = exportUnderlineType(source.underline, ctx)
    if (source.weight) ret.weight = source.weight
    if (source.italic) ret.italic = source.italic
    if (source.bulletNumbers) ret.bulletNumbers = exportBulletNumbers(source.bulletNumbers, ctx)
    if (source.highlight) ret.highlight = exportColor(source.highlight, ctx)
    if (source.kerning) ret.kerning = source.kerning
    if (source.transform) ret.transform = exportTextTransformType(source.transform, ctx)
    if (source.placeholder) ret.placeholder = source.placeholder
    if (source.fillType) ret.fillType = exportFillType(source.fillType, ctx)
    if (source.gradient) ret.gradient = exportGradient(source.gradient, ctx)
    return ret
}
/* span attr */
export function exportSpan(source: types.Span, ctx?: IExportContext): types.Span {
    const ret: types.Span = exportSpanAttr(source, ctx) as types.Span
    ret.length = source.length
    return ret
}
/* border */
export function exportBorder(source: types.Border, ctx?: IExportContext): types.Border {
    const ret: types.Border = {} as types.Border
    ret.typeId = "border"
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.typeId = source.typeId
    ret.id = source.id
    ret.isEnabled = source.isEnabled
    ret.fillType = exportFillType(source.fillType, ctx)
    ret.color = exportColor(source.color, ctx)
    ret.position = exportBorderPosition(source.position, ctx)
    ret.thickness = source.thickness
    ret.borderStyle = exportBorderStyle(source.borderStyle, ctx)
    ret.cornerType = exportCornerType(source.cornerType, ctx)
    ret.sideSetting = exportBorderSideSetting(source.sideSetting, ctx)
    if (source.contextSettings) ret.contextSettings = exportContextSettings(source.contextSettings, ctx)
    if (source.gradient) ret.gradient = exportGradient(source.gradient, ctx)
    if (source.imageRef) ret.imageRef = source.imageRef
    if (source.imageScaleMode) ret.imageScaleMode = exportImageScaleMode(source.imageScaleMode, ctx)
    if (source.rotation) ret.rotation = source.rotation
    if (source.scale) ret.scale = source.scale
    if (source.originalImageWidth) ret.originalImageWidth = source.originalImageWidth
    if (source.originalImageHeight) ret.originalImageHeight = source.originalImageHeight
    if (source.paintFilter) ret.paintFilter = exportPaintFilter(source.paintFilter, ctx)
    if (source.transform) ret.transform = exportPatternTransform(source.transform, ctx)
    return ret
}
/* fill */
export function exportFill(source: types.Fill, ctx?: IExportContext): types.Fill {
    const ret: types.Fill = {} as types.Fill
    ret.typeId = "fill"
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.typeId = source.typeId
    ret.id = source.id
    ret.isEnabled = source.isEnabled
    ret.fillType = exportFillType(source.fillType, ctx)
    ret.color = exportColor(source.color, ctx)
    if (source.contextSettings) ret.contextSettings = exportContextSettings(source.contextSettings, ctx)
    if (source.gradient) ret.gradient = exportGradient(source.gradient, ctx)
    if (source.imageRef) ret.imageRef = source.imageRef
    if (source.fillRule) ret.fillRule = exportFillRule(source.fillRule, ctx)
    if (source.imageScaleMode) ret.imageScaleMode = exportImageScaleMode(source.imageScaleMode, ctx)
    if (source.rotation) ret.rotation = source.rotation
    if (source.scale) ret.scale = source.scale
    if (source.originalImageWidth) ret.originalImageWidth = source.originalImageWidth
    if (source.originalImageHeight) ret.originalImageHeight = source.originalImageHeight
    if (source.paintFilter) ret.paintFilter = exportPaintFilter(source.paintFilter, ctx)
    if (source.transform) ret.transform = exportPatternTransform(source.transform, ctx)
        // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);

    return ret
}
/* span attr */
export function exportParaAttr(source: types.ParaAttr, ctx?: IExportContext): types.ParaAttr {
    const ret: types.ParaAttr = exportSpanAttr(source, ctx) as types.ParaAttr
    if (source.alignment) ret.alignment = exportTextHorAlign(source.alignment, ctx)
    if (source.paraSpacing) ret.paraSpacing = source.paraSpacing
    if (source.minimumLineHeight) ret.minimumLineHeight = source.minimumLineHeight
    if (source.maximumLineHeight) ret.maximumLineHeight = source.maximumLineHeight
    if (source.indent) ret.indent = source.indent
    return ret
}
/* para */
export function exportPara(source: types.Para, ctx?: IExportContext): types.Para {
    const ret: types.Para = {} as types.Para
    ret.text = source.text
    ret.spans = exportPara_spans(source.spans, ctx)
    if (source.attr) ret.attr = exportParaAttr(source.attr, ctx)
    return ret
}
/* style */
export function exportStyle(source: types.Style, ctx?: IExportContext): types.Style {
    const ret: types.Style = {} as types.Style
    ret.typeId = "style"
    ret.typeId = source.typeId
    ret.borders = exportStyle_borders(source.borders, ctx)
    ret.fills = exportStyle_fills(source.fills, ctx)
    ret.shadows = exportStyle_shadows(source.shadows, ctx)
    if (source.miterLimit) ret.miterLimit = source.miterLimit
    if (source.windingRule) ret.windingRule = exportWindingRule(source.windingRule, ctx)
    if (source.blur) ret.blur = exportBlur(source.blur, ctx)
    if (source.borderOptions) ret.borderOptions = exportBorderOptions(source.borderOptions, ctx)
    if (source.colorControls) ret.colorControls = exportColorControls(source.colorControls, ctx)
    if (source.contextSettings) ret.contextSettings = exportContextSettings(source.contextSettings, ctx)
    if (source.innerShadows) ret.innerShadows = exportStyle_innerShadows(source.innerShadows, ctx)
    if (source.contacts) ret.contacts = exportStyle_contacts(source.contacts, ctx)
    if (source.startMarkerType) ret.startMarkerType = exportMarkerType(source.startMarkerType, ctx)
    if (source.endMarkerType) ret.endMarkerType = exportMarkerType(source.endMarkerType, ctx)
    if (source.varbinds) ret.varbinds = (() => {
        const ret: any = {}
        source.varbinds.forEach((source, k) => {
            ret[k] = source
        })
        return ret
    })()
    return ret
}
/* text attr */
export function exportTextAttr(source: types.TextAttr, ctx?: IExportContext): types.TextAttr {
    const ret: types.TextAttr = exportParaAttr(source, ctx) as types.TextAttr
    if (source.verAlign) ret.verAlign = exportTextVerAlign(source.verAlign, ctx)
    if (source.orientation) ret.orientation = exportTextOrientation(source.orientation, ctx)
    if (source.textBehaviour) ret.textBehaviour = exportTextBehaviour(source.textBehaviour, ctx)
    if (source.padding) ret.padding = exportPadding(source.padding, ctx)
    return ret
}
/* text */
export function exportText(source: types.Text, ctx?: IExportContext): types.Text {
    const ret: types.Text = {} as types.Text
    ret.typeId = "text"
    ret.typeId = source.typeId
    ret.paras = exportText_paras(source.paras, ctx)
    if (source.attr) ret.attr = exportTextAttr(source.attr, ctx)
    return ret
}
/* shape */
export function exportShape(source: types.Shape, ctx?: IExportContext): types.Shape {
    const ret: types.Shape = {} as types.Shape
    ret.typeId = "shape"
    ret.crdtidx = exportCrdtidx(source.crdtidx, ctx)
    ret.typeId = source.typeId
    ret.id = source.id
    ret.name = source.name
    ret.type = exportShapeType(source.type, ctx)
    ret.transform = exportTransform(source.transform, ctx)
    ret.style = exportStyle(source.style, ctx)
    if (source.boolOp) ret.boolOp = exportBoolOp(source.boolOp, ctx)
    if (source.isFixedToViewport) ret.isFixedToViewport = source.isFixedToViewport
    if (source.isLocked) ret.isLocked = source.isLocked
    if (source.isVisible) ret.isVisible = source.isVisible
    if (source.exportOptions) ret.exportOptions = exportExportOptions(source.exportOptions, ctx)
    if (source.nameIsFixed) ret.nameIsFixed = source.nameIsFixed
    if (source.resizingConstraint) ret.resizingConstraint = source.resizingConstraint
    if (source.resizingType) ret.resizingType = exportResizeType(source.resizingType, ctx)
    if (source.constrainerProportions) ret.constrainerProportions = source.constrainerProportions
    if (source.clippingMaskMode) ret.clippingMaskMode = source.clippingMaskMode
    if (source.hasClippingMask) ret.hasClippingMask = source.hasClippingMask
    if (source.shouldBreakMaskChain) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    if (source.varbinds) ret.varbinds = (() => {
        const ret: any = {}
        source.varbinds.forEach((source, k) => {
            ret[k] = source
        })
        return ret
    })()
    if (source.haveEdit) ret.haveEdit = source.haveEdit
    if (source.mask) ret.mask = source.mask
    return ret
}
/* table cell */
export function exportTableCell(source: types.TableCell, ctx?: IExportContext): types.TableCell {
    const ret: types.TableCell = exportShape(source, ctx) as types.TableCell
    ret.typeId = "table-cell"
    ret.cellType = exportTableCellType(source.cellType, ctx)
    ret.text = exportText(source.text, ctx)
    if (source.imageRef) ret.imageRef = source.imageRef
    if (source.rowSpan) ret.rowSpan = source.rowSpan
    if (source.colSpan) ret.colSpan = source.colSpan
        // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);

    return ret
}
/* table shape */
export function exportTableShape(source: types.TableShape, ctx?: IExportContext): types.TableShape {
    const ret: types.TableShape = exportShape(source, ctx) as types.TableShape
    ret.typeId = "table-shape"
    ret.size = exportShapeSize(source.size, ctx)
    ret.cells = (() => {
        const ret: any = {}
        source.cells.forEach((source, k) => {
            ret[k] = exportTableCell(source, ctx)
        })
        return ret
    })()
    ret.rowHeights = exportTableShape_rowHeights(source.rowHeights, ctx)
    ret.colWidths = exportTableShape_colWidths(source.colWidths, ctx)
    if (source.textAttr) ret.textAttr = exportTextAttr(source.textAttr, ctx)
    return ret
}
/* text shape */
export function exportTextShape(source: types.TextShape, ctx?: IExportContext): types.TextShape {
    const ret: types.TextShape = exportShape(source, ctx) as types.TextShape
    ret.typeId = "text-shape"
    ret.size = exportShapeSize(source.size, ctx)
    ret.text = exportText(source.text, ctx)
    if (source.fixedRadius) ret.fixedRadius = source.fixedRadius
    return ret
}
/* color */
export function exportVariable(source: types.Variable, ctx?: IExportContext): types.Variable {
    const ret: types.Variable = {} as types.Variable
    ret.id = source.id
    ret.type = exportVariableType(source.type, ctx)
    ret.name = source.name
    ret.value = (() => {
        if (typeof source.value !== "object") {
            return source.value
        }
        if (Array.isArray(source.value)) {
            return exportVariable_0(source.value, ctx)
        }
        if (source.value.typeId === "color") {
            return exportColor(source.value as types.Color, ctx)
        }
        if (source.value.typeId === "text") {
            return exportText(source.value as types.Text, ctx)
        }
        if (source.value.typeId === "gradient") {
            return exportGradient(source.value as types.Gradient, ctx)
        }
        if (source.value.typeId === "style") {
            return exportStyle(source.value as types.Style, ctx)
        }
        if (source.value.typeId === "context-settings") {
            return exportContextSettings(source.value as types.ContextSettings, ctx)
        }
        if (source.value.typeId === "table-cell") {
            return exportTableCell(source.value as types.TableCell, ctx)
        }
        if (source.value.typeId === "export-options") {
            return exportExportOptions(source.value as types.ExportOptions, ctx)
        }
        if (source.value.typeId === "corner-radius") {
            return exportCornerRadius(source.value as types.CornerRadius, ctx)
        }
        if (source.value.typeId === "blur") {
            return exportBlur(source.value as types.Blur, ctx)
        }
        throw new Error("unknow typeId: " + source.value.typeId)
    })()
    return ret
}
/* comment */
export function exportComment(source: types.Comment, ctx?: IExportContext): types.Comment {
    const ret: types.Comment = {} as types.Comment
    ret.pageId = source.pageId
    ret.id = source.id
    ret.frame = exportShapeFrame(source.frame, ctx)
    ret.user = exportUserInfo(source.user, ctx)
    ret.createAt = source.createAt
    ret.content = source.content
    ret.parasiticBody = exportShape(source.parasiticBody, ctx)
    if (source.parentId) ret.parentId = source.parentId
    if (source.rootId) ret.rootId = source.rootId
    return ret
}
/* path shape */
export function exportPathShape(source: types.PathShape, ctx?: IExportContext): types.PathShape {
    const ret: types.PathShape = exportShape(source, ctx) as types.PathShape
    ret.typeId = "path-shape"
    ret.size = exportShapeSize(source.size, ctx)
    ret.pathsegs = exportPathShape_pathsegs(source.pathsegs, ctx)
    if (source.fixedRadius) ret.fixedRadius = source.fixedRadius
    return ret
}
/* path shape */
export function exportPathShape2(source: types.PathShape2, ctx?: IExportContext): types.PathShape2 {
    const ret: types.PathShape2 = exportShape(source, ctx) as types.PathShape2
    ret.typeId = "path-shape2"
    ret.size = exportShapeSize(source.size, ctx)
    ret.pathsegs = exportPathShape2_pathsegs(source.pathsegs, ctx)
    if (source.fixedRadius) ret.fixedRadius = source.fixedRadius
    return ret
}
/* polygon shape */
export function exportPolygonShape(source: types.PolygonShape, ctx?: IExportContext): types.PolygonShape {
    const ret: types.PolygonShape = exportPathShape(source, ctx) as types.PolygonShape
    ret.typeId = "polygon-shape"
    ret.counts = source.counts
    return ret
}
/* rect shape */
export function exportRectShape(source: types.RectShape, ctx?: IExportContext): types.RectShape {
    const ret: types.RectShape = exportPathShape(source, ctx) as types.RectShape
    ret.typeId = "rect-shape"
    return ret
}
/* star shape */
export function exportStarShape(source: types.StarShape, ctx?: IExportContext): types.StarShape {
    const ret: types.StarShape = exportPathShape(source, ctx) as types.StarShape
    ret.typeId = "star-shape"
    ret.counts = source.counts
    ret.innerAngle = source.innerAngle
    return ret
}
/* symbol ref shape */
export function exportSymbolRefShape(source: types.SymbolRefShape, ctx?: IExportContext): types.SymbolRefShape {
    const ret: types.SymbolRefShape = exportShape(source, ctx) as types.SymbolRefShape
    ret.typeId = "symbol-ref-shape"
    ret.size = exportShapeSize(source.size, ctx)
    ret.refId = source.refId
    ret.variables = (() => {
        const ret: any = {}
        source.variables.forEach((source, k) => {
            ret[k] = exportVariable(source, ctx)
        })
        return ret
    })()
    if (source.overrides) ret.overrides = (() => {
        const ret: any = {}
        source.overrides.forEach((source, k) => {
            ret[k] = source
        })
        return ret
    })()
    if (source.isCustomSize) ret.isCustomSize = source.isCustomSize
    if (source.cornerRadius) ret.cornerRadius = exportCornerRadius(source.cornerRadius, ctx)
        // inject code
    if (ctx?.refsymbols) ctx.refsymbols.add(ret.refId);

    return ret
}
/* contact shape */
export function exportContactShape(source: types.ContactShape, ctx?: IExportContext): types.ContactShape {
    const ret: types.ContactShape = exportPathShape(source, ctx) as types.ContactShape
    ret.typeId = "contact-shape"
    ret.isEdited = source.isEdited
    ret.text = exportText(source.text, ctx)
    ret.mark = source.mark
    if (source.from) ret.from = exportContactForm(source.from, ctx)
    if (source.to) ret.to = exportContactForm(source.to, ctx)
    return ret
}
/* cutout shape */
export function exportCutoutShape(source: types.CutoutShape, ctx?: IExportContext): types.CutoutShape {
    const ret: types.CutoutShape = exportPathShape(source, ctx) as types.CutoutShape
    ret.typeId = "cutout-shape"
    return ret
}
/* image shape */
export function exportImageShape(source: types.ImageShape, ctx?: IExportContext): types.ImageShape {
    const ret: types.ImageShape = exportPathShape(source, ctx) as types.ImageShape
    ret.typeId = "image-shape"
    ret.imageRef = source.imageRef
        // inject code
    if (ctx?.medias) ctx.medias.add(ret.imageRef);

    return ret
}
/* line shape */
export function exportLineShape(source: types.LineShape, ctx?: IExportContext): types.LineShape {
    const ret: types.LineShape = exportPathShape(source, ctx) as types.LineShape
    ret.typeId = "line-shape"
    return ret
}
/* oval shape */
export function exportOvalShape(source: types.OvalShape, ctx?: IExportContext): types.OvalShape {
    const ret: types.OvalShape = exportPathShape(source, ctx) as types.OvalShape
    ret.typeId = "oval-shape"
    ret.ellipse = exportEllipse(source.ellipse, ctx)
    return ret
}
/* artboard shape */
export function exportArtboard(source: types.Artboard, ctx?: IExportContext): types.Artboard {
    const ret: types.Artboard = exportGroupShape(source, ctx) as types.Artboard
    ret.typeId = "artboard"
    ret.size = exportShapeSize(source.size, ctx)
    if (source.cornerRadius) ret.cornerRadius = exportCornerRadius(source.cornerRadius, ctx)
    if (source.guides) ret.guides = exportArtboard_guides(source.guides, ctx)
    return ret
}
/* bool shape */
export function exportBoolShape(source: types.BoolShape, ctx?: IExportContext): types.BoolShape {
    const ret: types.BoolShape = exportGroupShape(source, ctx) as types.BoolShape
    ret.typeId = "bool-shape"
    return ret
}
/* document meta */
export function exportDocumentMeta(source: types.DocumentMeta, ctx?: IExportContext): types.DocumentMeta {
    const ret: types.DocumentMeta = {} as types.DocumentMeta
    ret.id = source.id
    ret.name = source.name
    ret.fmtVer = source.fmtVer
    ret.pagesList = exportDocumentMeta_pagesList(source.pagesList, ctx)
    ret.lastCmdId = source.lastCmdId
    ret.symbolregist = (() => {
        const ret: any = {}
        source.symbolregist.forEach((source, k) => {
            ret[k] = source
        })
        return ret
    })()
    if (source.freesymbols) ret.freesymbols = (() => {
        const ret: any = {}
        source.freesymbols.forEach((source, k) => {
            ret[k] = (() => {
                if (typeof source !== "object") {
                    return source
                }
                if (source.typeId === "symbol-shape") {
                    return exportSymbolShape(source as types.SymbolShape, ctx)
                }
                if (source.typeId === "symbol-union-shape") {
                    return exportSymbolUnionShape(source as types.SymbolUnionShape, ctx)
                }
                throw new Error("unknow typeId: " + source.typeId)
            })()
        })
        return ret
    })()
    return ret
}
/* group shape */
export function exportGroupShape(source: types.GroupShape, ctx?: IExportContext): types.GroupShape {
    const ret: types.GroupShape = exportShape(source, ctx) as types.GroupShape
    ret.typeId = "group-shape"
    ret.childs = exportGroupShape_childs(source.childs, ctx)
    if (source.fixedRadius) ret.fixedRadius = source.fixedRadius
    return ret
}
/* page */
export function exportPage(source: types.Page, ctx?: IExportContext): types.Page {
    const ret: types.Page = exportGroupShape(source, ctx) as types.Page
    ret.typeId = "page"
    if (source.backgroundColor) ret.backgroundColor = exportColor(source.backgroundColor, ctx)
    if (source.guides) ret.guides = exportPage_guides(source.guides, ctx)
    return ret
}
/* symbol shape */
export function exportSymbolShape(source: types.SymbolShape, ctx?: IExportContext): types.SymbolShape {
    const ret: types.SymbolShape = exportGroupShape(source, ctx) as types.SymbolShape
    ret.typeId = "symbol-shape"
    ret.size = exportShapeSize(source.size, ctx)
    ret.variables = (() => {
        const ret: any = {}
        source.variables.forEach((source, k) => {
            ret[k] = exportVariable(source, ctx)
        })
        return ret
    })()
    if (source.symtags) ret.symtags = (() => {
        const ret: any = {}
        source.symtags.forEach((source, k) => {
            ret[k] = source
        })
        return ret
    })()
    if (source.cornerRadius) ret.cornerRadius = exportCornerRadius(source.cornerRadius, ctx)
    if (source.guides) ret.guides = exportSymbolShape_guides(source.guides, ctx)
        // inject code
    if (ctx?.symbols) ctx.symbols.add(ret.id);

    return ret
}
/* symbol union shape */
export function exportSymbolUnionShape(source: types.SymbolUnionShape, ctx?: IExportContext): types.SymbolUnionShape {
    const ret: types.SymbolUnionShape = exportSymbolShape(source, ctx) as types.SymbolUnionShape
    ret.typeId = "symbol-union-shape"
    return ret
}