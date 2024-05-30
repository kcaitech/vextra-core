/* 代码生成，勿手动修改 */
export {
    BlendMode,
    BlurType,
    BoolOp,
    BorderPosition,
    BulletNumbersBehavior,
    BulletNumbersType,
    ContactRoleType,
    ContactType,
    CornerType,
    CurveMode,
    ExportFileFormat,
    ExportFormatNameingScheme,
    ExportVisibleScaleType,
    FillRule,
    FillType,
    GradientType,
    LineCapStyle,
    LineJoinStyle,
    MarkerType,
    OverrideType,
    ResizeType,
    ShadowPosition,
    ShapeType,
    SideType,
    StrikethroughType,
    TableCellType,
    TextBehaviour,
    TextHorAlign,
    TextOrientation,
    TextTransformType,
    TextVerAlign,
    UnderlineType,
    VariableType,
    WindingRule
} from "./typesdefine"
import {
    BlendMode,
    BlurType,
    BoolOp,
    BorderPosition,
    BulletNumbersBehavior,
    BulletNumbersType,
    ContactRoleType,
    ContactType,
    CornerType,
    CurveMode,
    ExportFileFormat,
    ExportFormatNameingScheme,
    ExportVisibleScaleType,
    FillRule,
    FillType,
    GradientType,
    LineCapStyle,
    LineJoinStyle,
    MarkerType,
    OverrideType,
    ResizeType,
    ShadowPosition,
    ShapeType,
    SideType,
    StrikethroughType,
    TableCellType,
    TextBehaviour,
    TextHorAlign,
    TextOrientation,
    TextTransformType,
    TextVerAlign,
    UnderlineType,
    VariableType,
    WindingRule
} from "./typesdefine"
import { Basic, BasicArray, BasicMap } from "./basic"
/* border style */
export class BorderStyle extends Basic {
    length: number
    gap: number
    constructor(length: number, gap: number) {
        super()
        this.length = length
        this.gap = gap
    }
}
/* bullet numbers */
export class BulletNumbers extends Basic {
    type: BulletNumbersType
    behavior?: BulletNumbersBehavior
    offset?: number
    constructor(type: BulletNumbersType) {
        super()
        this.type = type
    }
}
/* color controls */
export class ColorControls extends Basic {
    isEnabled: boolean
    brightness: number
    contrast: number
    hue: number
    saturation: number
    constructor(isEnabled: boolean, brightness: number, contrast: number, hue: number, saturation: number) {
        super()
        this.isEnabled = isEnabled
        this.brightness = brightness
        this.contrast = contrast
        this.hue = hue
        this.saturation = saturation
    }
}
/* color */
export class Color extends Basic {
    typeId = "color"
    alpha: number
    red: number
    green: number
    blue: number
    constructor(alpha: number, red: number, green: number, blue: number) {
        super()
        this.alpha = alpha
        this.red = red
        this.green = green
        this.blue = blue
    }
}
/* context settings */
export class ContextSettings extends Basic {
    typeId = "context-settings"
    blenMode: BlendMode
    opacity: number
    constructor(blenMode: BlendMode, opacity: number) {
        super()
        this.blenMode = blenMode
        this.opacity = opacity
    }
}
/* couner radius */
export class CornerRadius extends Basic {
    typeId = "corner-radius"
    lt: number
    rt: number
    lb: number
    rb: number
    constructor(lt: number, rt: number, lb: number, rb: number) {
        super()
        this.lt = lt
        this.rt = rt
        this.lb = lb
        this.rb = rb
    }
}
/* crdtidx */
export type Crdtidx = BasicArray<number>
/* curve point */
export class CurvePoint extends Basic {
    crdtidx: Crdtidx
    id: string
    x: number
    y: number
    mode: CurveMode
    radius?: number
    fromX?: number
    fromY?: number
    toX?: number
    toY?: number
    hasFrom?: boolean
    hasTo?: boolean
    constructor(crdtidx: Crdtidx, id: string, x: number, y: number, mode: CurveMode) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.x = x
        this.y = y
        this.mode = mode
    }
}
type DocumentMeta_pagesList = BasicArray<PageListItem>
/* ellipse attributes */
export class Ellipse extends Basic {
    cx: number
    cy: number
    rx: number
    ry: number
    constructor(cx: number, cy: number, rx: number, ry: number) {
        super()
        this.cx = cx
        this.cy = cy
        this.rx = rx
        this.ry = ry
    }
}
type ExportOptions_exportFormats = BasicArray<ExportFormat>
type Gradient_stops = BasicArray<Stop>
/* graphics contex settings */
export class GraphicsContextSettings extends Basic {
    blendMode: BlendMode
    opacity: number
    constructor(blendMode: BlendMode, opacity: number) {
        super()
        this.blendMode = blendMode
        this.opacity = opacity
    }
}
type GroupShape_childs = BasicArray<GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape>
/* padding */
export class Padding extends Basic {
    left?: number
    top?: number
    right?: number
    bottom?: number
}
/* page list item */
export class PageListItem extends Basic {
    crdtidx: Crdtidx
    id: string
    name: string
    versionId?: string
    constructor(crdtidx: Crdtidx, id: string, name: string) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.name = name
    }
}
type Para_spans = BasicArray<Span>
type PathSegment_points = BasicArray<CurvePoint>
/* path segment */
export class PathSegment extends Basic {
    crdtidx: Crdtidx
    id: string
    points: PathSegment_points
    isClosed: boolean
    constructor(crdtidx: Crdtidx, id: string, points: PathSegment_points, isClosed: boolean) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.points = points
        this.isClosed = isClosed
    }
}
type PathShape_pathsegs = BasicArray<PathSegment>
type PathShape2_pathsegs = BasicArray<PathSegment>
/* point 2d */
export class Point2D extends Basic {
    x: number
    y: number
    constructor(x: number, y: number) {
        super()
        this.x = x
        this.y = y
    }
}
/* shadow */
export class Shadow extends Basic {
    typeId = "shadow"
    crdtidx: Crdtidx
    id: string
    isEnabled: boolean
    blurRadius: number
    color: Color
    offsetX: number
    offsetY: number
    spread: number
    position: ShadowPosition
    contextSettings?: GraphicsContextSettings
    constructor(crdtidx: Crdtidx, id: string, isEnabled: boolean, blurRadius: number, color: Color, offsetX: number, offsetY: number, spread: number, position: ShadowPosition) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.isEnabled = isEnabled
        this.blurRadius = blurRadius
        this.color = color
        this.offsetX = offsetX
        this.offsetY = offsetY
        this.spread = spread
        this.position = position
    }
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export class ShapeFrame extends Basic {
    x: number
    y: number
    width: number
    height: number
    constructor(x: number, y: number, width: number, height: number) {
        super()
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
}
/* stop */
export class Stop extends Basic {
    crdtidx: Crdtidx
    id: string
    position: number
    color: Color
    constructor(crdtidx: Crdtidx, id: string, position: number, color: Color) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.position = position
        this.color = color
    }
}
type Style_borders = BasicArray<Border>
type Style_fills = BasicArray<Fill>
type Style_shadows = BasicArray<Shadow>
type Style_innerShadows = BasicArray<Shadow>
type Style_contacts = BasicArray<ContactRole>
type TableShape_rowHeights = BasicArray<CrdtNumber>
type TableShape_colWidths = BasicArray<CrdtNumber>
type Text_paras = BasicArray<Para>
/* user infomation */
export class UserInfo extends Basic {
    userId: string
    userNickname: string
    avatar: string
    constructor(userId: string, userNickname: string, avatar: string) {
        super()
        this.userId = userId
        this.userNickname = userNickname
        this.avatar = avatar
    }
}
type Variable_0 = BasicArray<Border | Fill | Shadow>
/* blur */
export class Blur extends Basic {
    typeId = "blur"
    isEnabled: boolean
    center: Point2D
    saturation: number
    type: BlurType
    motionAngle?: number
    radius?: number
    constructor(isEnabled: boolean, center: Point2D, saturation: number, type: BlurType) {
        super()
        this.isEnabled = isEnabled
        this.center = center
        this.saturation = saturation
        this.type = type
    }
}
/* border options */
export class BorderOptions extends Basic {
    isEnabled: boolean
    lineCapStyle: LineCapStyle
    lineJoinStyle: LineJoinStyle
    constructor(isEnabled: boolean, lineCapStyle: LineCapStyle, lineJoinStyle: LineJoinStyle) {
        super()
        this.isEnabled = isEnabled
        this.lineCapStyle = lineCapStyle
        this.lineJoinStyle = lineJoinStyle
    }
}
/* border side setting */
export class BorderSideSetting extends Basic {
    sideType: SideType
    thicknessTop: number
    thicknessLeft: number
    thicknessBottom: number
    thicknessRight: number
    constructor(sideType: SideType, thicknessTop: number, thicknessLeft: number, thicknessBottom: number, thicknessRight: number) {
        super()
        this.sideType = sideType
        this.thicknessTop = thicknessTop
        this.thicknessLeft = thicknessLeft
        this.thicknessBottom = thicknessBottom
        this.thicknessRight = thicknessRight
    }
}
/* contact form */
export class ContactForm extends Basic {
    contactType: ContactType
    shapeId: string
    constructor(contactType: ContactType, shapeId: string) {
        super()
        this.contactType = contactType
        this.shapeId = shapeId
    }
}
/* contactstyle */
export class ContactRole extends Basic {
    crdtidx: Crdtidx
    id: string
    roleType: ContactRoleType
    shapeId: string
    constructor(crdtidx: Crdtidx, id: string, roleType: ContactRoleType, shapeId: string) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.roleType = roleType
        this.shapeId = shapeId
    }
}
/* crdt number */
export class CrdtNumber extends Basic {
    id: string
    crdtidx: Crdtidx
    value: number
    constructor(id: string, crdtidx: Crdtidx, value: number) {
        super()
        this.id = id
        this.crdtidx = crdtidx
        this.value = value
    }
}
/* document meta */
export class DocumentMeta extends Basic {
    id: string
    name: string
    pagesList: DocumentMeta_pagesList
    lastCmdId: string
    symbolregist: BasicMap<string, string>
    freesymbolsVersionId?: string
    constructor(id: string, name: string, pagesList: DocumentMeta_pagesList, lastCmdId: string, symbolregist: BasicMap<string, string>) {
        super()
        this.id = id
        this.name = name
        this.pagesList = pagesList
        this.lastCmdId = lastCmdId
        this.symbolregist = symbolregist
    }
}
/* export format */
export class ExportFormat extends Basic {
    crdtidx: Crdtidx
    id: string
    absoluteSize: number
    fileFormat: ExportFileFormat
    name: string
    namingScheme: ExportFormatNameingScheme
    scale: number
    visibleScaleType: ExportVisibleScaleType
    constructor(crdtidx: Crdtidx, id: string, absoluteSize: number, fileFormat: ExportFileFormat, name: string, namingScheme: ExportFormatNameingScheme, scale: number, visibleScaleType: ExportVisibleScaleType) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.absoluteSize = absoluteSize
        this.fileFormat = fileFormat
        this.name = name
        this.namingScheme = namingScheme
        this.scale = scale
        this.visibleScaleType = visibleScaleType
    }
}
/* export options */
export class ExportOptions extends Basic {
    typeId = "export-options"
    exportFormats: ExportOptions_exportFormats
    childOptions: number
    shouldTrim: boolean
    trimTransparent: boolean
    canvasBackground: boolean
    unfold: boolean
    constructor(exportFormats: ExportOptions_exportFormats, childOptions: number, shouldTrim: boolean, trimTransparent: boolean, canvasBackground: boolean, unfold: boolean) {
        super()
        this.exportFormats = exportFormats
        this.childOptions = childOptions
        this.shouldTrim = shouldTrim
        this.trimTransparent = trimTransparent
        this.canvasBackground = canvasBackground
        this.unfold = unfold
    }
}
/* gradient */
export class Gradient extends Basic {
    typeId = "gradient"
    from: Point2D
    to: Point2D
    gradientType: GradientType
    stops: Gradient_stops
    elipseLength?: number
    gradientOpacity?: number
    constructor(from: Point2D, to: Point2D, gradientType: GradientType, stops: Gradient_stops) {
        super()
        this.from = from
        this.to = to
        this.gradientType = gradientType
        this.stops = stops
    }
}
/* span attr */
export class SpanAttr extends Basic {
    fontName?: string
    fontSize?: number
    color?: Color
    strikethrough?: StrikethroughType
    underline?: UnderlineType
    weight?: number
    italic?: boolean
    bulletNumbers?: BulletNumbers
    highlight?: Color
    kerning?: number
    transform?: TextTransformType
    placeholder?: boolean
    fillType?: FillType
    gradient?: Gradient
}
/* span attr */
export class Span extends SpanAttr {
    length: number
    constructor(length: number) {
        super()
        this.length = length
    }
}
/* border */
export class Border extends Basic {
    typeId = "border"
    crdtidx: Crdtidx
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    position: BorderPosition
    thickness: number
    borderStyle: BorderStyle
    cornerType: CornerType
    sideSetting: BorderSideSetting
    contextSettings?: ContextSettings
    gradient?: Gradient
    constructor(crdtidx: Crdtidx, id: string, isEnabled: boolean, fillType: FillType, color: Color, position: BorderPosition, thickness: number, borderStyle: BorderStyle, cornerType: CornerType, sideSetting: BorderSideSetting) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
        this.position = position
        this.thickness = thickness
        this.borderStyle = borderStyle
        this.cornerType = cornerType
        this.sideSetting = sideSetting
    }
}
/* fill */
export class Fill extends Basic {
    typeId = "fill"
    crdtidx: Crdtidx
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    gradient?: Gradient
    imageRef?: string
    fillRule?: FillRule
    constructor(crdtidx: Crdtidx, id: string, isEnabled: boolean, fillType: FillType, color: Color) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
    }
}
/* span attr */
export class ParaAttr extends SpanAttr {
    alignment?: TextHorAlign
    paraSpacing?: number
    minimumLineHeight?: number
    maximumLineHeight?: number
    indent?: number
}
/* para */
export class Para extends Basic {
    text: string
    spans: Para_spans
    attr?: ParaAttr
    constructor(text: string, spans: Para_spans) {
        super()
        this.text = text
        this.spans = spans
    }
}
/* style */
export class Style extends Basic {
    typeId = "style"
    borders: Style_borders
    fills: Style_fills
    shadows: Style_shadows
    miterLimit?: number
    windingRule?: WindingRule
    blur?: Blur
    borderOptions?: BorderOptions
    colorControls?: ColorControls
    contextSettings?: ContextSettings
    innerShadows?: Style_innerShadows
    contacts?: Style_contacts
    startMarkerType?: MarkerType
    endMarkerType?: MarkerType
    varbinds?: BasicMap<string, string>
    constructor(borders: Style_borders, fills: Style_fills, shadows: Style_shadows) {
        super()
        this.borders = borders
        this.fills = fills
        this.shadows = shadows
    }
}
/* text attr */
export class TextAttr extends ParaAttr {
    verAlign?: TextVerAlign
    orientation?: TextOrientation
    textBehaviour?: TextBehaviour
    padding?: Padding
}
/* text */
export class Text extends Basic {
    typeId = "text"
    paras: Text_paras
    attr?: TextAttr
    constructor(paras: Text_paras) {
        super()
        this.paras = paras
    }
}
/* shape */
export class Shape extends Basic {
    typeId = "shape"
    crdtidx: Crdtidx
    id: string
    name: string
    type: ShapeType
    frame: ShapeFrame
    style: Style
    boolOp?: BoolOp
    isFixedToViewport?: boolean
    isFlippedHorizontal?: boolean
    isFlippedVertical?: boolean
    isLocked?: boolean
    isVisible?: boolean
    exportOptions?: ExportOptions
    nameIsFixed?: boolean
    resizingConstraint?: number
    resizingType?: ResizeType
    rotation?: number
    constrainerProportions?: boolean
    clippingMaskMode?: number
    hasClippingMask?: boolean
    shouldBreakMaskChain?: boolean
    varbinds?: BasicMap<string, string>
    haveEdit?: boolean
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.name = name
        this.type = type
        this.frame = frame
        this.style = style
    }
}
/* table cell */
export class TableCell extends Shape {
    typeId = "table-cell"
    cellType: TableCellType
    text: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, cellType: TableCellType, text: Text) {
        super(crdtidx, id, name, type, frame, style)
        this.cellType = cellType
        this.text = text
    }
}
/* table shape */
export class TableShape extends Shape {
    typeId = "table-shape"
    cells: BasicMap<string, TableCell>
    rowHeights: TableShape_rowHeights
    colWidths: TableShape_colWidths
    textAttr?: TextAttr
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, cells: BasicMap<string, TableCell>, rowHeights: TableShape_rowHeights, colWidths: TableShape_colWidths) {
        super(crdtidx, id, name, type, frame, style)
        this.cells = cells
        this.rowHeights = rowHeights
        this.colWidths = colWidths
    }
}
/* text shape */
export class TextShape extends Shape {
    typeId = "text-shape"
    text: Text
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, text: Text) {
        super(crdtidx, id, name, type, frame, style)
        this.text = text
    }
}
/* color */
export class Variable extends Basic {
    id: string
    type: VariableType
    name: string
    value: number | string | boolean | Color | Text | Gradient | Style | Variable_0 | ContextSettings | TableCell | ExportOptions | CornerRadius | Blur
    constructor(id: string, type: VariableType, name: string, value: number | string | boolean | Color | Text | Gradient | Style | Variable_0 | ContextSettings | TableCell | ExportOptions | CornerRadius | Blur) {
        super()
        this.id = id
        this.type = type
        this.name = name
        this.value = value
    }
}
/* comment */
export class Comment extends Basic {
    pageId: string
    id: string
    frame: ShapeFrame
    user: UserInfo
    createAt: string
    content: string
    parasiticBody: Shape
    parentId?: string
    rootId?: string
    constructor(pageId: string, id: string, frame: ShapeFrame, user: UserInfo, createAt: string, content: string, parasiticBody: Shape) {
        super()
        this.pageId = pageId
        this.id = id
        this.frame = frame
        this.user = user
        this.createAt = createAt
        this.content = content
        this.parasiticBody = parasiticBody
    }
}
/* path shape */
export class PathShape extends Shape {
    typeId = "path-shape"
    pathsegs: PathShape_pathsegs
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape_pathsegs) {
        super(crdtidx, id, name, type, frame, style)
        this.pathsegs = pathsegs
    }
}
/* path shape */
export class PathShape2 extends Shape {
    typeId = "path-shape2"
    pathsegs: PathShape2_pathsegs
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape2_pathsegs) {
        super(crdtidx, id, name, type, frame, style)
        this.pathsegs = pathsegs
    }
}
/* polygon shape */
export class PolygonShape extends PathShape {
    typeId = "polygon-shape"
    counts: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape_pathsegs, counts: number) {
        super(crdtidx, id, name, type, frame, style, pathsegs)
        this.counts = counts
    }
}
/* rect shape */
export class RectShape extends PathShape {
    typeId = "rect-shape"
}
/* star shape */
export class StarShape extends PathShape {
    typeId = "star-shape"
    counts: number
    innerAngle: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape_pathsegs, counts: number, innerAngle: number) {
        super(crdtidx, id, name, type, frame, style, pathsegs)
        this.counts = counts
        this.innerAngle = innerAngle
    }
}
/* symbol ref shape */
export class SymbolRefShape extends Shape {
    typeId = "symbol-ref-shape"
    refId: string
    variables: BasicMap<string, Variable>
    overrides?: BasicMap<string, string>
    isCustomSize?: boolean
    cornerRadius?: CornerRadius
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, refId: string, variables: BasicMap<string, Variable>) {
        super(crdtidx, id, name, type, frame, style)
        this.refId = refId
        this.variables = variables
    }
}
/* contact shape */
export class ContactShape extends PathShape {
    typeId = "contact-shape"
    isEdited: boolean
    text: Text
    mark: boolean
    from?: ContactForm
    to?: ContactForm
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape_pathsegs, isEdited: boolean, text: Text, mark: boolean) {
        super(crdtidx, id, name, type, frame, style, pathsegs)
        this.isEdited = isEdited
        this.text = text
        this.mark = mark
    }
}
/* cutout shape */
export class CutoutShape extends PathShape {
    typeId = "cutout-shape"
    scalingStroke: boolean
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape_pathsegs, scalingStroke: boolean) {
        super(crdtidx, id, name, type, frame, style, pathsegs)
        this.scalingStroke = scalingStroke
    }
}
/* image shape */
export class ImageShape extends PathShape {
    typeId = "image-shape"
    imageRef: string
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape_pathsegs, imageRef: string) {
        super(crdtidx, id, name, type, frame, style, pathsegs)
        this.imageRef = imageRef
    }
}
/* line shape */
export class LineShape extends PathShape {
    typeId = "line-shape"
}
/* oval shape */
export class OvalShape extends PathShape {
    typeId = "oval-shape"
    ellipse: Ellipse
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, pathsegs: PathShape_pathsegs, ellipse: Ellipse) {
        super(crdtidx, id, name, type, frame, style, pathsegs)
        this.ellipse = ellipse
    }
}
/* group shape */
export class GroupShape extends Shape {
    typeId = "group-shape"
    childs: GroupShape_childs
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, childs: GroupShape_childs) {
        super(crdtidx, id, name, type, frame, style)
        this.childs = childs
    }
}
/* page */
export class Page extends GroupShape {
    typeId = "page"
    backgroundColor?: Color
}
/* symbol shape */
export class SymbolShape extends GroupShape {
    typeId = "symbol-shape"
    variables: BasicMap<string, Variable>
    symtags?: BasicMap<string, string>
    cornerRadius?: CornerRadius
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, frame: ShapeFrame, style: Style, childs: GroupShape_childs, variables: BasicMap<string, Variable>) {
        super(crdtidx, id, name, type, frame, style, childs)
        this.variables = variables
    }
}
/* symbol union shape */
export class SymbolUnionShape extends SymbolShape {
    typeId = "symbol-union-shape"
}
/* artboard shape */
export class Artboard extends GroupShape {
    typeId = "artboard"
    cornerRadius?: CornerRadius
}
/* bool shape */
export class BoolShape extends GroupShape {
    typeId = "bool-shape"
}