/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

export {
    WindingRule,
    VariableType,
    UnderlineType,
    TextVerAlign,
    TextTransformType,
    TextOrientation,
    TextHorAlign,
    TextBehaviour,
    TableCellType,
    StrikethroughType,
    SideType,
    ShapeType,
    ShadowPosition,
    ResizeType,
    OverrideType,
    MarkerType,
    LineJoinStyle,
    LineCapStyle,
    GradientType,
    FillType,
    FillRule,
    ExportVisibleScaleType,
    ExportFormatNameingScheme,
    ExportFileFormat,
    CurveMode,
    CornerType,
    ContactType,
    ContactRoleType,
    BulletNumbersType,
    BulletNumbersBehavior,
    BorderPosition,
    BoolOp,
    BlurType,
    BlendMode
} from "./typesdefine"
import {
    WindingRule,
    VariableType,
    UnderlineType,
    TextVerAlign,
    TextTransformType,
    TextOrientation,
    TextHorAlign,
    TextBehaviour,
    TableCellType,
    StrikethroughType,
    SideType,
    ShapeType,
    ShadowPosition,
    ResizeType,
    OverrideType,
    MarkerType,
    LineJoinStyle,
    LineCapStyle,
    GradientType,
    FillType,
    FillRule,
    ExportVisibleScaleType,
    ExportFormatNameingScheme,
    ExportFileFormat,
    CurveMode,
    CornerType,
    ContactType,
    ContactRoleType,
    BulletNumbersType,
    BulletNumbersBehavior,
    BorderPosition,
    BoolOp,
    BlurType,
    BlendMode
} from "./typesdefine"
import {
    Basic, BasicArray, BasicMap
    } from "./basic"
/**
 * color 
 */
export class Variable extends Basic {
    typeId = 'variable'
    id: string
    type: VariableType
    name: string
    value: (number | string | boolean | Color | Text | Gradient | Style | BasicArray<(Border | Fill | Shadow) > | ContextSettings | TableCell | ExportOptions | CornerRadius | Blur)
    constructor(
        id: string,
        type: VariableType,
        name: string,
        value: (number | string | boolean | Color | Text | Gradient | Style | BasicArray<(Border | Fill | Shadow) > | ContextSettings | TableCell | ExportOptions | CornerRadius | Blur)
    ) {
        super()
        this.id = id
        this.type = type
        this.name = name
        this.value = value
    }
}
/**
 * user infomation 
 */
export class UserInfo extends Basic {
    typeId = 'user-info'
    userId: string
    userNickname: string
    avatar: string
    constructor(
        userId: string,
        userNickname: string,
        avatar: string
    ) {
        super()
        this.userId = userId
        this.userNickname = userNickname
        this.avatar = avatar
    }
}
/**
 * text 
 */
export class Text extends Basic {
    typeId = 'text'
    paras: BasicArray<Para >
    attr?: TextAttr
    constructor(
        paras: BasicArray<Para >
    ) {
        super()
        this.paras = paras
    }
}
/**
 * style 
 */
export class Style extends Basic {
    typeId = 'style'
    miterLimit?: number
    windingRule?: WindingRule
    blur?: Blur
    borderOptions?: BorderOptions
    borders: BasicArray<Border >
    colorControls?: ColorControls
    contextSettings?: ContextSettings
    fills: BasicArray<Fill >
    innerShadows?: BasicArray<Shadow >
    shadows: BasicArray<Shadow >
    contacts?: BasicArray<ContactRole >
    startMarkerType?: MarkerType
    endMarkerType?: MarkerType
    varbinds?: BasicMap<string, string>
    constructor(
        borders: BasicArray<Border >,
        fills: BasicArray<Fill >,
        shadows: BasicArray<Shadow >
    ) {
        super()
        this.borders = borders
        this.fills = fills
        this.shadows = shadows
    }
}
/**
 * stop 
 */
export class Stop extends Basic {
    typeId = 'stop'
    crdtidx: BasicArray<number >
    id: string
    position: number
    color: Color
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        position: number,
        color: Color
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.position = position
        this.color = color
    }
}
/**
 * span attr 
 */
export class SpanAttr extends Basic {
    typeId = 'span-attr'
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
    constructor(
    ) {
        super()
    }
}
/**
 * shape 
 */
export class Shape extends Basic {
    typeId = 'shape'
    crdtidx: BasicArray<number >
    id: string
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
    name: string
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
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.name = name
        this.type = type
        this.frame = frame
        this.style = style
    }
}
/**
 * shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 
 */
export class ShapeFrame extends Basic {
    typeId = 'shape-frame'
    x: number
    y: number
    width: number
    height: number
    constructor(
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        super()
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }
}
/**
 * shadow 
 */
export class Shadow extends Basic {
    typeId = 'shadow'
    crdtidx: BasicArray<number >
    id: string
    isEnabled: boolean
    blurRadius: number
    color: Color
    position: ShadowPosition
    contextSettings?: GraphicsContextSettings
    offsetX: number
    offsetY: number
    spread: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        isEnabled: boolean,
        blurRadius: number,
        color: Color,
        offsetX: number,
        offsetY: number,
        spread: number,
        position: ShadowPosition
    ) {
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
/**
 * point 2d 
 */
export class Point2D extends Basic {
    typeId = 'point-2d'
    x: number
    y: number
    constructor(
        x: number,
        y: number
    ) {
        super()
        this.x = x
        this.y = y
    }
}
/**
 * path segment 
 */
export class PathSegment extends Basic {
    typeId = 'path-segment'
    crdtidx: BasicArray<number >
    id: string
    points: BasicArray<CurvePoint >
    isClosed: boolean
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        points: BasicArray<CurvePoint >,
        isClosed: boolean
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.points = points
        this.isClosed = isClosed
    }
}
/**
 * para 
 */
export class Para extends Basic {
    typeId = 'para'
    text: string
    spans: BasicArray<Span >
    attr?: ParaAttr
    constructor(
        text: string,
        spans: BasicArray<Span >
    ) {
        super()
        this.text = text
        this.spans = spans
    }
}
/**
 * page list item 
 */
export class PageListItem extends Basic {
    typeId = 'page-list-item'
    crdtidx: BasicArray<number >
    id: string
    name: string
    versionId?: string
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.name = name
    }
}
/**
 * padding 
 */
export class Padding extends Basic {
    typeId = 'padding'
    left?: number
    top?: number
    right?: number
    bottom?: number
    constructor(
    ) {
        super()
    }
}
/**
 * graphics contex settings 
 */
export class GraphicsContextSettings extends Basic {
    typeId = 'graphics-context-settings'
    blendMode: BlendMode
    opacity: number
    constructor(
        blendMode: BlendMode,
        opacity: number
    ) {
        super()
        this.blendMode = blendMode
        this.opacity = opacity
    }
}
/**
 * gradient 
 */
export class Gradient extends Basic {
    typeId = 'gradient'
    elipseLength?: number
    from: Point2D
    to: Point2D
    stops: BasicArray<Stop >
    gradientType: GradientType
    gradientOpacity?: number
    constructor(
        from: Point2D,
        to: Point2D,
        gradientType: GradientType,
        stops: BasicArray<Stop >
    ) {
        super()
        this.from = from
        this.to = to
        this.gradientType = gradientType
        this.stops = stops
    }
}
/**
 * fill 
 */
export class Fill extends Basic {
    typeId = 'fill'
    crdtidx: BasicArray<number >
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    gradient?: Gradient
    imageRef?: string
    fillRule?: FillRule
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
    }
}
/**
 * export options 
 */
export class ExportOptions extends Basic {
    typeId = 'export-options'
    exportFormats: BasicArray<ExportFormat >
    childOptions: number
    shouldTrim: boolean
    trimTransparent: boolean
    canvasBackground: boolean
    unfold: boolean
    constructor(
        exportFormats: BasicArray<ExportFormat >,
        childOptions: number,
        shouldTrim: boolean,
        trimTransparent: boolean,
        canvasBackground: boolean,
        unfold: boolean
    ) {
        super()
        this.exportFormats = exportFormats
        this.childOptions = childOptions
        this.shouldTrim = shouldTrim
        this.trimTransparent = trimTransparent
        this.canvasBackground = canvasBackground
        this.unfold = unfold
    }
}
/**
 * export format 
 */
export class ExportFormat extends Basic {
    typeId = 'export-format'
    crdtidx: BasicArray<number >
    id: string
    absoluteSize: number
    fileFormat: ExportFileFormat
    name: string
    namingScheme: ExportFormatNameingScheme
    scale: number
    visibleScaleType: ExportVisibleScaleType
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        absoluteSize: number,
        fileFormat: ExportFileFormat,
        name: string,
        namingScheme: ExportFormatNameingScheme,
        scale: number,
        visibleScaleType: ExportVisibleScaleType
    ) {
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
/**
 * ellipse attributes 
 */
export class Ellipse extends Basic {
    typeId = 'ellipse'
    cx: number
    cy: number
    rx: number
    ry: number
    constructor(
        cx: number,
        cy: number,
        rx: number,
        ry: number
    ) {
        super()
        this.cx = cx
        this.cy = cy
        this.rx = rx
        this.ry = ry
    }
}
/**
 * document meta 
 */
export class DocumentMeta extends Basic {
    typeId = 'document-meta'
    id: string
    name: string
    pagesList: BasicArray<PageListItem >
    lastCmdId: string
    symbolregist: BasicMap<string, string>
    freesymbolsVersionId?: string
    constructor(
        id: string,
        name: string,
        pagesList: BasicArray<PageListItem >,
        lastCmdId: string,
        symbolregist: BasicMap<string, string>
    ) {
        super()
        this.id = id
        this.name = name
        this.pagesList = pagesList
        this.lastCmdId = lastCmdId
        this.symbolregist = symbolregist
    }
}
/**
 * curve point 
 */
export class CurvePoint extends Basic {
    typeId = 'curve-point'
    crdtidx: BasicArray<number >
    id: string
    radius?: number
    fromX?: number
    fromY?: number
    toX?: number
    toY?: number
    hasFrom?: boolean
    hasTo?: boolean
    mode: CurveMode
    x: number
    y: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        x: number,
        y: number,
        mode: CurveMode
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.x = x
        this.y = y
        this.mode = mode
    }
}
/**
 * crdt number 
 */
export class CrdtNumber extends Basic {
    typeId = 'crdt-number'
    id: string
    crdtidx: BasicArray<number >
    value: number
    constructor(
        id: string,
        crdtidx: BasicArray<number >,
        value: number
    ) {
        super()
        this.id = id
        this.crdtidx = crdtidx
        this.value = value
    }
}
/**
 * couner radius 
 */
export class CornerRadius extends Basic {
    typeId = 'corner-radius'
    lt: number
    rt: number
    lb: number
    rb: number
    constructor(
        lt: number,
        rt: number,
        lb: number,
        rb: number
    ) {
        super()
        this.lt = lt
        this.rt = rt
        this.lb = lb
        this.rb = rb
    }
}
/**
 * context settings 
 */
export class ContextSettings extends Basic {
    typeId = 'context-settings'
    blenMode: BlendMode
    opacity: number
    constructor(
        blenMode: BlendMode,
        opacity: number
    ) {
        super()
        this.blenMode = blenMode
        this.opacity = opacity
    }
}
/**
 * contactstyle 
 */
export class ContactRole extends Basic {
    typeId = 'contact-role'
    crdtidx: BasicArray<number >
    id: string
    roleType: ContactRoleType
    shapeId: string
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        roleType: ContactRoleType,
        shapeId: string
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.roleType = roleType
        this.shapeId = shapeId
    }
}
/**
 * contact form 
 */
export class ContactForm extends Basic {
    typeId = 'contact-form'
    contactType: ContactType
    shapeId: string
    constructor(
        contactType: ContactType,
        shapeId: string
    ) {
        super()
        this.contactType = contactType
        this.shapeId = shapeId
    }
}
/**
 * comment 
 */
export class Comment extends Basic {
    typeId = 'comment'
    pageId: string
    id: string
    frame: ShapeFrame
    user: UserInfo
    createAt: string
    content: string
    parasiticBody: Shape
    parentId?: string
    rootId?: string
    constructor(
        pageId: string,
        id: string,
        frame: ShapeFrame,
        user: UserInfo,
        createAt: string,
        content: string,
        parasiticBody: Shape
    ) {
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
/**
 * color 
 */
export class Color extends Basic {
    typeId = 'color'
    alpha: number
    red: number
    green: number
    blue: number
    constructor(
        alpha: number,
        red: number,
        green: number,
        blue: number
    ) {
        super()
        this.alpha = alpha
        this.red = red
        this.green = green
        this.blue = blue
    }
}
/**
 * color controls 
 */
export class ColorControls extends Basic {
    typeId = 'color-controls'
    isEnabled: boolean
    brightness: number
    contrast: number
    hue: number
    saturation: number
    constructor(
        isEnabled: boolean,
        brightness: number,
        contrast: number,
        hue: number,
        saturation: number
    ) {
        super()
        this.isEnabled = isEnabled
        this.brightness = brightness
        this.contrast = contrast
        this.hue = hue
        this.saturation = saturation
    }
}
/**
 * bullet numbers 
 */
export class BulletNumbers extends Basic {
    typeId = 'bullet-numbers'
    behavior?: BulletNumbersBehavior
    offset?: number
    type: BulletNumbersType
    constructor(
        type: BulletNumbersType
    ) {
        super()
        this.type = type
    }
}
/**
 * border 
 */
export class Border extends Basic {
    typeId = 'border'
    crdtidx: BasicArray<number >
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    position: BorderPosition
    thickness: number
    gradient?: Gradient
    borderStyle: BorderStyle
    cornerType: CornerType
    sideSetting: BorderSideSetting
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        position: BorderPosition,
        thickness: number,
        borderStyle: BorderStyle,
        cornerType: CornerType,
        sideSetting: BorderSideSetting
    ) {
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
/**
 * border style 
 */
export class BorderStyle extends Basic {
    typeId = 'border-style'
    length: number
    gap: number
    constructor(
        length: number,
        gap: number
    ) {
        super()
        this.length = length
        this.gap = gap
    }
}
/**
 * border side setting 
 */
export class BorderSideSetting extends Basic {
    typeId = 'border-side-setting'
    sideType: SideType
    thicknessTop: number
    thicknessLeft: number
    thicknessBottom: number
    thicknessRight: number
    constructor(
        sideType: SideType,
        thicknessTop: number,
        thicknessLeft: number,
        thicknessBottom: number,
        thicknessRight: number
    ) {
        super()
        this.sideType = sideType
        this.thicknessTop = thicknessTop
        this.thicknessLeft = thicknessLeft
        this.thicknessBottom = thicknessBottom
        this.thicknessRight = thicknessRight
    }
}
/**
 * border options 
 */
export class BorderOptions extends Basic {
    typeId = 'border-options'
    isEnabled: boolean
    lineCapStyle: LineCapStyle
    lineJoinStyle: LineJoinStyle
    constructor(
        isEnabled: boolean,
        lineCapStyle: LineCapStyle,
        lineJoinStyle: LineJoinStyle
    ) {
        super()
        this.isEnabled = isEnabled
        this.lineCapStyle = lineCapStyle
        this.lineJoinStyle = lineJoinStyle
    }
}
/**
 * blur 
 */
export class Blur extends Basic {
    typeId = 'blur'
    isEnabled: boolean
    center: Point2D
    motionAngle?: number
    radius?: number
    saturation: number
    type: BlurType
    constructor(
        isEnabled: boolean,
        center: Point2D,
        saturation: number,
        type: BlurType
    ) {
        super()
        this.isEnabled = isEnabled
        this.center = center
        this.saturation = saturation
        this.type = type
    }
}
/**
 * text shape 
 */
export class TextShape extends Shape {
    typeId = 'text-shape'
    text: Text
    fixedRadius?: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        text: Text
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.text = text
    }
}
/**
 * table shape 
 */
export class TableShape extends Shape {
    typeId = 'table-shape'
    cells: BasicMap<string, TableCell>
    rowHeights: BasicArray<CrdtNumber >
    colWidths: BasicArray<CrdtNumber >
    textAttr?: TextAttr
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        cells: BasicMap<string, TableCell>,
        rowHeights: BasicArray<CrdtNumber >,
        colWidths: BasicArray<CrdtNumber >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.cells = cells
        this.rowHeights = rowHeights
        this.colWidths = colWidths
    }
}
/**
 * table cell 
 */
export class TableCell extends Shape {
    typeId = 'table-cell'
    cellType: TableCellType
    text: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        cellType: TableCellType,
        text: Text
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.cellType = cellType
        this.text = text
    }
}
/**
 * symbol ref shape 
 */
export class SymbolRefShape extends Shape {
    typeId = 'symbol-ref-shape'
    refId: string
    overrides?: BasicMap<string, string>
    variables: BasicMap<string, Variable>
    isCustomSize?: boolean
    cornerRadius?: CornerRadius
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        refId: string,
        variables: BasicMap<string, Variable>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.refId = refId
        this.variables = variables
    }
}
/**
 * span attr 
 */
export class Span extends SpanAttr {
    typeId = 'span'
    length: number
    constructor(
        length: number
    ) {
        super(
        )
        this.length = length
    }
}
/**
 * path shape 
 */
export class PathShape2 extends Shape {
    typeId = 'path-shape2'
    pathsegs: BasicArray<PathSegment >
    fixedRadius?: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.pathsegs = pathsegs
    }
}
/**
 * path shape 
 */
export class PathShape extends Shape {
    typeId = 'path-shape'
    pathsegs: BasicArray<PathSegment >
    fixedRadius?: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.pathsegs = pathsegs
    }
}
/**
 * star shape 
 */
export class StarShape extends PathShape {
    typeId = 'star-shape'
    counts: number
    innerAngle: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >,
        counts: number,
        innerAngle: number
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
        this.counts = counts
        this.innerAngle = innerAngle
    }
}
/**
 * rect shape 
 */
export class RectShape extends PathShape {
    typeId = 'rect-shape'
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
    }
}
/**
 * polygon shape 
 */
export class PolygonShape extends PathShape {
    typeId = 'polygon-shape'
    counts: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >,
        counts: number
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
        this.counts = counts
    }
}
/**
 * span attr 
 */
export class ParaAttr extends SpanAttr {
    typeId = 'para-attr'
    alignment?: TextHorAlign
    paraSpacing?: number
    minimumLineHeight?: number
    maximumLineHeight?: number
    indent?: number
    constructor(
    ) {
        super(
        )
    }
}
/**
 * text attr 
 */
export class TextAttr extends ParaAttr {
    typeId = 'text-attr'
    verAlign?: TextVerAlign
    orientation?: TextOrientation
    textBehaviour?: TextBehaviour
    padding?: Padding
    constructor(
    ) {
        super(
        )
    }
}
/**
 * oval shape 
 */
export class OvalShape extends PathShape {
    typeId = 'oval-shape'
    ellipse: Ellipse
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >,
        ellipse: Ellipse
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
        this.ellipse = ellipse
    }
}
/**
 * line shape 
 */
export class LineShape extends PathShape {
    typeId = 'line-shape'
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
    }
}
/**
 * image shape 
 */
export class ImageShape extends PathShape {
    typeId = 'image-shape'
    imageRef: string
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >,
        imageRef: string
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
        this.imageRef = imageRef
    }
}
/**
 * group shape 
 */
export class GroupShape extends Shape {
    typeId = 'group-shape'
    childs: BasicArray<(GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape) >
    fixedRadius?: number
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape) >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.childs = childs
    }
}
/**
 * symbol shape 
 */
export class SymbolShape extends GroupShape {
    typeId = 'symbol-shape'
    variables: BasicMap<string, Variable>
    symtags?: BasicMap<string, string>
    cornerRadius?: CornerRadius
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape) >,
        variables: BasicMap<string, Variable>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            childs
        )
        this.variables = variables
    }
}
/**
 * symbol union shape 
 */
export class SymbolUnionShape extends SymbolShape {
    typeId = 'symbol-union-shape'
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape) >,
        variables: BasicMap<string, Variable>
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            childs,
            variables
        )
    }
}
/**
 * page 
 */
export class Page extends GroupShape {
    typeId = 'page'
    backgroundColor?: Color
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape) >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            childs
        )
    }
}
/**
 * cutout shape 
 */
export class CutoutShape extends PathShape {
    typeId = 'cutout-shape'
    scalingStroke: boolean
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >,
        scalingStroke: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
        this.scalingStroke = scalingStroke
    }
}
/**
 * contact shape 
 */
export class ContactShape extends PathShape {
    typeId = 'contact-shape'
    from?: ContactForm
    to?: ContactForm
    isEdited: boolean
    mark: boolean
    text: Text
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        pathsegs: BasicArray<PathSegment >,
        isEdited: boolean,
        text: Text,
        mark: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            pathsegs
        )
        this.isEdited = isEdited
        this.text = text
        this.mark = mark
    }
}
/**
 * bool shape 
 */
export class BoolShape extends GroupShape {
    typeId = 'bool-shape'
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape) >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            childs
        )
    }
}
/**
 * artboard shape 
 */
export class Artboard extends GroupShape {
    typeId = 'artboard'
    cornerRadius?: CornerRadius
    constructor(
        crdtidx: BasicArray<number >,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape) >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            childs
        )
    }
}
