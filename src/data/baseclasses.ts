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
    GuideAxis,
    ImageScaleMode,
    LineCapStyle,
    LineJoinStyle,
    MarkerType,
    OverlayBackgroundInteraction,
    OverlayBackgroundType,
    OverlayPositionType,
    OverrideType,
    PaintFilterType,
    PrototypeConnectionType,
    PrototypeEasingType,
    PrototypeEvents,
    PrototypeNavigationType,
    PrototypeTransitionType,
    ResizeType,
    ScrollDirection,
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
    GuideAxis,
    ImageScaleMode,
    LineCapStyle,
    LineJoinStyle,
    MarkerType,
    OverlayBackgroundInteraction,
    OverlayBackgroundType,
    OverlayPositionType,
    OverrideType,
    PaintFilterType,
    PrototypeConnectionType,
    PrototypeEasingType,
    PrototypeEvents,
    PrototypeNavigationType,
    PrototypeTransitionType,
    ResizeType,
    ScrollDirection,
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
type Artboard_guides = BasicArray<Guide>
/* border style */
export class BorderStyle extends Basic {
    typeId = "border-style"
    length: number
    gap: number
    constructor(length: number = 0, gap: number = 0) {
        super()
        this.length = length
        this.gap = gap
    }
}
/* bullet numbers */
export class BulletNumbers extends Basic {
    typeId = "bullet-numbers"
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
    typeId = "color-controls"
    isEnabled: boolean
    brightness: number
    contrast: number
    hue: number
    saturation: number
    constructor(isEnabled: boolean = false, brightness: number = 0, contrast: number = 0, hue: number = 0, saturation: number = 0) {
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
    constructor(alpha: number = 0, red: number = 0, green: number = 0, blue: number = 0) {
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
    constructor(blenMode: BlendMode, opacity: number = 1) {
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
    constructor(lt: number = 0, rt: number = 0, lb: number = 0, rb: number = 0) {
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
    typeId = "curve-point"
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
    typeId = "ellipse"
    cx: number
    cy: number
    rx: number
    ry: number
    constructor(cx: number = 0, cy: number = 0, rx: number = 0, ry: number = 0) {
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
    typeId = "graphics-context-settings"
    blendMode: BlendMode
    opacity: number
    constructor(blendMode: BlendMode, opacity: number = 1) {
        super()
        this.blendMode = blendMode
        this.opacity = opacity
    }
}
type GroupShape_childs = BasicArray<GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape>
type Guide_crdtidx = BasicArray<number>
/* guide */
export class Guide extends Basic {
    typeId = "guide"
    crdtidx: Guide_crdtidx
    id: string
    axis: GuideAxis
    offset: number
    constructor(crdtidx: Guide_crdtidx, id: string, axis: GuideAxis, offset: number = 0) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.axis = axis
        this.offset = offset
    }
}
/* overlay margin */
export class OverlayMargin extends Basic {
    typeId = "overlay-margin"
    top: number
    bottom: number
    left: number
    right: number
    constructor(top: number = 0, bottom: number = 0, left: number = 0, right: number = 0) {
        super()
        this.top = top
        this.bottom = bottom
        this.left = left
        this.right = right
    }
}
/* overlay position */
export class OverlayPosition extends Basic {
    typeId = "overlay-position"
    position: OverlayPositionType
    margin: OverlayMargin
    constructor(position: OverlayPositionType, margin: OverlayMargin) {
        super()
        this.position = position
        this.margin = margin
    }
}
/* padding */
export class Padding extends Basic {
    typeId = "padding"
    left?: number
    top?: number
    right?: number
    bottom?: number
}
/* page list item */
export class PageListItem extends Basic {
    typeId = "page-list-item"
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
type Page_guides = BasicArray<Guide>
/* paint filter */
export class PaintFilter extends Basic {
    typeId = "paint-filter"
    exposure: number
    contrast: number
    saturation: number
    temperature: number
    tint: number
    shadow: number
    hue: number
    constructor(exposure: number = 0, contrast: number = 0, saturation: number = 0, temperature: number = 0, tint: number = 0, shadow: number = 0, hue: number = 0) {
        super()
        this.exposure = exposure
        this.contrast = contrast
        this.saturation = saturation
        this.temperature = temperature
        this.tint = tint
        this.shadow = shadow
        this.hue = hue
    }
}
type Para_spans = BasicArray<Span>
type PathSegment_points = BasicArray<CurvePoint>
/* path segment */
export class PathSegment extends Basic {
    typeId = "path-segment"
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
/* pattern transform */
export class PatternTransform extends Basic {
    typeId = "pattern-transform"
    m00: number
    m01: number
    m02: number
    m10: number
    m11: number
    m12: number
    constructor(m00: number = 1, m01: number = 0, m02: number = 0, m10: number = 1, m11: number = 0, m12: number = 0) {
        super()
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
    }
}
/* point 2d */
export class Point2D extends Basic {
    typeId = "point-2d"
    x: number
    y: number
    constructor(x: number = 0, y: number = 0) {
        super()
        this.x = x
        this.y = y
    }
}
/* prototypeEasingBezier */
export class PrototypeEasingBezier extends Basic {
    typeId = "prototype-easing-bezier"
    x1: number
    y1: number
    x2: number
    y2: number
    constructor(x1: number, y1: number, x2: number, y2: number) {
        super()
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
    }
}
type PrototypeInterAction_crdtidx = BasicArray<number>
/* prototypeStartingPoint */
export class PrototypeStartingPoint extends Basic {
    typeId = "prototype-starting-point"
    name: string
    desc: string
    constructor(name: string, desc: string) {
        super()
        this.name = name
        this.desc = desc
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
    typeId = "shape-frame"
    x: number
    y: number
    width: number
    height: number
    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        super()
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
}
/* shape size */
export class ShapeSize extends Basic {
    typeId = "shape-size"
    width: number
    height: number
    constructor(width: number = 0, height: number = 0) {
        super()
        this.width = width
        this.height = height
    }
}
type Shape_prototypeInteractions = BasicArray<PrototypeInterAction>
/* stop */
export class Stop extends Basic {
    typeId = "stop"
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
type SymbolShape_guides = BasicArray<Guide>
type TableShape_rowHeights = BasicArray<CrdtNumber>
type TableShape_colWidths = BasicArray<CrdtNumber>
type Text_paras = BasicArray<Para>
/* transform */
export class Transform extends Basic {
    typeId = "transform"
    m00: number
    m01: number
    m02: number
    m10: number
    m11: number
    m12: number
    constructor(m00: number = 1, m01: number = 0, m02: number = 0, m10: number = 0, m11: number = 1, m12: number = 0) {
        super()
        this.m00 = m00
        this.m01 = m01
        this.m02 = m02
        this.m10 = m10
        this.m11 = m11
        this.m12 = m12
    }
}
/* user infomation */
export class UserInfo extends Basic {
    typeId = "user-info"
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
type Variable_0 = BasicArray<Border | Fill | Shadow | PrototypeInterAction>
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
    typeId = "border-options"
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
    typeId = "border-side-setting"
    sideType: SideType
    thicknessTop: number
    thicknessLeft: number
    thicknessBottom: number
    thicknessRight: number
    constructor(sideType: SideType, thicknessTop: number = 1, thicknessLeft: number = 1, thicknessBottom: number = 1, thicknessRight: number = 1) {
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
    typeId = "contact-form"
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
    typeId = "contact-role"
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
    typeId = "crdt-number"
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
/* export format */
export class ExportFormat extends Basic {
    typeId = "export-format"
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
    constructor(exportFormats: ExportOptions_exportFormats, childOptions: number = 0, shouldTrim: boolean = false, trimTransparent: boolean = false, canvasBackground: boolean = false, unfold: boolean = false) {
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
/* overlay-background-appearance */
export class OverlayBackgroundAppearance extends Basic {
    typeId = "overlay-background-appearance"
    backgroundType: OverlayBackgroundType
    backgroundColor: Color
    constructor(backgroundType: OverlayBackgroundType, backgroundColor: Color) {
        super()
        this.backgroundType = backgroundType
        this.backgroundColor = backgroundColor
    }
}
/* actions */
export class PrototypeActions extends Basic {
    typeId = "prototype-actions"
    connectionType: PrototypeConnectionType
    targetNodeID?: string
    transitionType?: PrototypeTransitionType
    transitionDuration?: number
    easingType?: PrototypeEasingType
    connectionURL?: string
    openUrlInNewTab?: boolean
    navigationType?: PrototypeNavigationType
    easingFunction?: PrototypeEasingBezier
    extraScrollOffset?: Point2D
    constructor(connectionType: PrototypeConnectionType) {
        super()
        this.connectionType = connectionType
    }
}
/* event */
export class PrototypeEvent extends Basic {
    typeId = "prototype-event"
    interactionType: PrototypeEvents
    transitionTimeout?: number
    constructor(interactionType: PrototypeEvents) {
        super()
        this.interactionType = interactionType
    }
}
/* prototypeInteraction */
export class PrototypeInterAction extends Basic {
    typeId = "prototype-inter-action"
    crdtidx: PrototypeInterAction_crdtidx
    id: string
    event: PrototypeEvent
    actions: PrototypeActions
    isDeleted?: boolean
    constructor(crdtidx: PrototypeInterAction_crdtidx, id: string, event: PrototypeEvent, actions: PrototypeActions) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.event = event
        this.actions = actions
    }
}
/* span attr */
export class SpanAttr extends Basic {
    typeId = "span-attr"
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
    typeId = "span"
    length: number
    constructor(length: number = 0) {
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
    imageRef?: string
    imageScaleMode?: ImageScaleMode
    rotation?: number
    scale?: number
    originalImageWidth?: number
    originalImageHeight?: number
    paintFilter?: PaintFilter
    transform?: PatternTransform
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
    imageScaleMode?: ImageScaleMode
    rotation?: number
    scale?: number
    originalImageWidth?: number
    originalImageHeight?: number
    paintFilter?: PaintFilter
    transform?: PatternTransform
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
    typeId = "para-attr"
    alignment?: TextHorAlign
    paraSpacing?: number
    minimumLineHeight?: number
    maximumLineHeight?: number
    indent?: number
}
/* para */
export class Para extends Basic {
    typeId = "para"
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
    typeId = "text-attr"
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
    transform: Transform
    style: Style
    boolOp?: BoolOp
    isFixedToViewport?: boolean
    isLocked?: boolean
    isVisible?: boolean
    exportOptions?: ExportOptions
    nameIsFixed?: boolean
    resizingConstraint?: number
    resizingType?: ResizeType
    constrainerProportions?: boolean
    clippingMaskMode?: number
    hasClippingMask?: boolean
    shouldBreakMaskChain?: boolean
    varbinds?: BasicMap<string, string>
    haveEdit?: boolean
    prototypeStartingPoint?: PrototypeStartingPoint
    prototypeInteractions?: Shape_prototypeInteractions
    overlayPosition?: OverlayPosition
    overlayBackgroundInteraction?: OverlayBackgroundInteraction
    overlayBackgroundAppearance?: OverlayBackgroundAppearance
    scrollDirection?: ScrollDirection
    mask?: boolean
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.name = name
        this.type = type
        this.transform = transform
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
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, cellType: TableCellType, text: Text) {
        super(crdtidx, id, name, type, transform, style)
        this.cellType = cellType
        this.text = text
    }
}
/* table shape */
export class TableShape extends Shape {
    typeId = "table-shape"
    size: ShapeSize
    cells: BasicMap<string, TableCell>
    rowHeights: TableShape_rowHeights
    colWidths: TableShape_colWidths
    textAttr?: TextAttr
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, cells: BasicMap<string, TableCell>, rowHeights: TableShape_rowHeights, colWidths: TableShape_colWidths) {
        super(crdtidx, id, name, type, transform, style)
        this.size = size
        this.cells = cells
        this.rowHeights = rowHeights
        this.colWidths = colWidths
    }
}
/* text shape */
export class TextShape extends Shape {
    typeId = "text-shape"
    size: ShapeSize
    text: Text
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, text: Text) {
        super(crdtidx, id, name, type, transform, style)
        this.size = size
        this.text = text
    }
}
/* color */
export class Variable extends Basic {
    typeId = "variable"
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
    typeId = "comment"
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
    size: ShapeSize
    pathsegs: PathShape_pathsegs
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, pathsegs: PathShape_pathsegs) {
        super(crdtidx, id, name, type, transform, style)
        this.size = size
        this.pathsegs = pathsegs
    }
}
/* path shape */
export class PathShape2 extends Shape {
    typeId = "path-shape2"
    size: ShapeSize
    pathsegs: PathShape2_pathsegs
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, pathsegs: PathShape2_pathsegs) {
        super(crdtidx, id, name, type, transform, style)
        this.size = size
        this.pathsegs = pathsegs
    }
}
/* polygon shape */
export class PolygonShape extends PathShape {
    typeId = "polygon-shape"
    counts: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, pathsegs: PathShape_pathsegs, counts: number = 3) {
        super(crdtidx, id, name, type, transform, style, size, pathsegs)
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
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, pathsegs: PathShape_pathsegs, counts: number = 5, innerAngle: number = 0.382) {
        super(crdtidx, id, name, type, transform, style, size, pathsegs)
        this.counts = counts
        this.innerAngle = innerAngle
    }
}
/* symbol ref shape */
export class SymbolRefShape extends Shape {
    typeId = "symbol-ref-shape"
    size: ShapeSize
    refId: string
    variables: BasicMap<string, Variable>
    overrides?: BasicMap<string, string>
    isCustomSize?: boolean
    cornerRadius?: CornerRadius
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, refId: string, variables: BasicMap<string, Variable>) {
        super(crdtidx, id, name, type, transform, style)
        this.size = size
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
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, pathsegs: PathShape_pathsegs, isEdited: boolean, text: Text, mark: boolean) {
        super(crdtidx, id, name, type, transform, style, size, pathsegs)
        this.isEdited = isEdited
        this.text = text
        this.mark = mark
    }
}
/* cutout shape */
export class CutoutShape extends PathShape {
    typeId = "cutout-shape"
}
/* image shape */
export class ImageShape extends PathShape {
    typeId = "image-shape"
    imageRef: string
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, pathsegs: PathShape_pathsegs, imageRef: string) {
        super(crdtidx, id, name, type, transform, style, size, pathsegs)
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
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, size: ShapeSize, pathsegs: PathShape_pathsegs, ellipse: Ellipse) {
        super(crdtidx, id, name, type, transform, style, size, pathsegs)
        this.ellipse = ellipse
    }
}
/* group shape */
export class GroupShape extends Shape {
    typeId = "group-shape"
    childs: GroupShape_childs
    fixedRadius?: number
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, childs: GroupShape_childs) {
        super(crdtidx, id, name, type, transform, style)
        this.childs = childs
    }
}
/* page */
export class Page extends GroupShape {
    typeId = "page"
    backgroundColor?: Color
    guides?: Page_guides
}
/* symbol shape */
export class SymbolShape extends GroupShape {
    typeId = "symbol-shape"
    size: ShapeSize
    variables: BasicMap<string, Variable>
    symtags?: BasicMap<string, string>
    cornerRadius?: CornerRadius
    guides?: SymbolShape_guides
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, childs: GroupShape_childs, size: ShapeSize, variables: BasicMap<string, Variable>) {
        super(crdtidx, id, name, type, transform, style, childs)
        this.size = size
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
    size: ShapeSize
    cornerRadius?: CornerRadius
    guides?: Artboard_guides
    constructor(crdtidx: Crdtidx, id: string, name: string, type: ShapeType, transform: Transform, style: Style, childs: GroupShape_childs, size: ShapeSize) {
        super(crdtidx, id, name, type, transform, style, childs)
        this.size = size
    }
}
/* bool shape */
export class BoolShape extends GroupShape {
    typeId = "bool-shape"
}
/* document meta */
export class DocumentMeta extends Basic {
    typeId = "document-meta"
    id: string
    name: string
    fmtVer: number
    pagesList: DocumentMeta_pagesList
    lastCmdId: string
    symbolregist: BasicMap<string, string>
    freesymbols?: BasicMap<string, SymbolShape | SymbolUnionShape>
    constructor(id: string, name: string, fmtVer: number, pagesList: DocumentMeta_pagesList, lastCmdId: string, symbolregist: BasicMap<string, string>) {
        super()
        this.id = id
        this.name = name
        this.fmtVer = fmtVer
        this.pagesList = pagesList
        this.lastCmdId = lastCmdId
        this.symbolregist = symbolregist
    }
}