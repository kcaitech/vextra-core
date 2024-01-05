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
    ShapeType,
    ShadowPosition,
    ResizeType,
    OverrideType,
    MarkerType,
    LineJoinStyle,
    LineCapStyle,
    GradientType,
    FillType,
    ExportVisibleScaleType,
    ExportFormatNameingScheme,
    ExportFileFormat,
    CurveMode,
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
    ShapeType,
    ShadowPosition,
    ResizeType,
    OverrideType,
    MarkerType,
    LineJoinStyle,
    LineCapStyle,
    GradientType,
    FillType,
    ExportVisibleScaleType,
    ExportFormatNameingScheme,
    ExportFileFormat,
    CurveMode,
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
    value: (number | string | boolean | Color | Text | Gradient | Style | BasicArray<(Border | Fill) >)
    constructor(
        id: string,
        type: VariableType,
        name: string,
        value: (number | string | boolean | Color | Text | Gradient | Style | BasicArray<(Border | Fill) >)
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
    position: number
    color?: Color
    constructor(
        position: number
    ) {
        super()
        this.position = position
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
    bold?: boolean
    italic?: boolean
    bulletNumbers?: BulletNumbers
    highlight?: Color
    kerning?: number
    transform?: TextTransformType
    placeholder?: boolean
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
    crdtidx: CrdtIndex
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
    constructor(
        crdtidx: CrdtIndex,
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
    crdtidx: CrdtIndex
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
        crdtidx: CrdtIndex,
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
    points: BasicArray<CurvePoint >
    isClosed: boolean
    constructor(
        points: BasicArray<CurvePoint >,
        isClosed: boolean
    ) {
        super()
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
    id: string
    name: string
    versionId?: string
    constructor(
        id: string,
        name: string
    ) {
        super()
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
    elipseLength: number
    from: Point2D
    to: Point2D
    stops: BasicArray<Stop >
    gradientType: GradientType
    constructor(
        elipseLength: number,
        from: Point2D,
        to: Point2D,
        gradientType: GradientType,
        stops: BasicArray<Stop >
    ) {
        super()
        this.elipseLength = elipseLength
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
    crdtidx: CrdtIndex
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    gradient?: Gradient
    imageRef?: string
    constructor(
        crdtidx: CrdtIndex,
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
    includedChildIds: BasicArray<string >
    childOptions: number
    shouldTrim: boolean
    trimTransparent: boolean
    canvasBackground: boolean
    unfold: boolean
    constructor(
        exportFormats: BasicArray<ExportFormat >,
        includedChildIds: BasicArray<string >,
        childOptions: number,
        shouldTrim: boolean,
        trimTransparent: boolean,
        canvasBackground: boolean,
        unfold: boolean
    ) {
        super()
        this.exportFormats = exportFormats
        this.includedChildIds = includedChildIds
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
    id: string
    absoluteSize: number
    fileFormat: ExportFileFormat
    name: string
    namingScheme: ExportFormatNameingScheme
    scale: number
    visibleScaleType: ExportVisibleScaleType
    constructor(
        id: string,
        absoluteSize: number,
        fileFormat: ExportFileFormat,
        name: string,
        namingScheme: ExportFormatNameingScheme,
        scale: number,
        visibleScaleType: ExportVisibleScaleType
    ) {
        super()
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
 * document syms 
 */
export class DocumentSyms extends Basic {
    typeId = 'document-syms'
    pageId: string
    symbols: BasicArray<string >
    constructor(
        pageId: string,
        symbols: BasicArray<string >
    ) {
        super()
        this.pageId = pageId
        this.symbols = symbols
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
    constructor(
        id: string,
        name: string,
        pagesList: BasicArray<PageListItem >,
        lastCmdId: string
    ) {
        super()
        this.id = id
        this.name = name
        this.pagesList = pagesList
        this.lastCmdId = lastCmdId
    }
}
/**
 * curve point 
 */
export class CurvePoint extends Basic {
    typeId = 'curve-point'
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
        id: string,
        x: number,
        y: number,
        mode: CurveMode
    ) {
        super()
        this.id = id
        this.x = x
        this.y = y
        this.mode = mode
    }
}
/**
 * crdt table index 
 */
export class CrdtIndex2 extends Basic {
    typeId = 'crdt-index2'
    x: CrdtIndex
    y: CrdtIndex
    constructor(
        x: CrdtIndex,
        y: CrdtIndex
    ) {
        super()
        this.x = x
        this.y = y
    }
}
/**
 * crdt array index 
 */
export class CrdtIndex extends Basic {
    typeId = 'crdt-index'
    index?: BasicArray<number >
    order: number
    uid: string
    constructor(
        order: number,
        uid: string
    ) {
        super()
        this.order = order
        this.uid = uid
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
    id: string
    roleType: ContactRoleType
    shapeId: string
    constructor(
        id: string,
        roleType: ContactRoleType,
        shapeId: string
    ) {
        super()
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
    crdtidx: CrdtIndex
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    position: BorderPosition
    thickness: number
    gradient?: Gradient
    borderStyle: BorderStyle
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        position: BorderPosition,
        thickness: number,
        borderStyle: BorderStyle
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
        crdtidx: CrdtIndex,
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
    datas: BasicArray<TableCell >
    rowHeights: BasicArray<number >
    colWidths: BasicArray<number >
    textAttr?: TextAttr
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        datas: BasicArray<TableCell >,
        rowHeights: BasicArray<number >,
        colWidths: BasicArray<number >
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.datas = datas
        this.rowHeights = rowHeights
        this.colWidths = colWidths
    }
}
/**
 * table cell 
 */
export class TableCell extends Shape {
    typeId = 'table-cell'
    crdtidx2: CrdtIndex2
    cellType?: TableCellType
    text?: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        crdtidx2: CrdtIndex2
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.crdtidx2 = crdtidx2
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
    constructor(
        crdtidx: CrdtIndex,
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
        crdtidx: CrdtIndex,
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
    points: BasicArray<CurvePoint >
    isClosed: boolean
    fixedRadius?: number
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint >,
        isClosed: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style
        )
        this.points = points
        this.isClosed = isClosed
    }
}
/**
 * rect shape 
 */
export class RectShape extends PathShape {
    typeId = 'rect-shape'
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint >,
        isClosed: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
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
 * page 
 */
export class Page extends Shape {
    typeId = 'page'
    childs: BasicArray<(Shape | FlattenShape | GroupShape | ImageShape | PathShape | RectShape | TextShape | OvalShape | LineShape | Artboard | ContactShape | SymbolRefShape | TableShape | CutoutShape | SymbolUnionShape | SymbolShape) >
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(Shape | FlattenShape | GroupShape | ImageShape | PathShape | RectShape | TextShape | OvalShape | LineShape | Artboard | ContactShape | SymbolRefShape | TableShape | CutoutShape | SymbolUnionShape | SymbolShape) >
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
 * oval shape 
 */
export class OvalShape extends PathShape {
    typeId = 'oval-shape'
    ellipse: Ellipse
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint >,
        isClosed: boolean,
        ellipse: Ellipse
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
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
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint >,
        isClosed: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
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
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint >,
        isClosed: boolean,
        imageRef: string
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
        this.imageRef = imageRef
    }
}
/**
 * group shape 
 */
export class GroupShape extends Shape {
    typeId = 'group-shape'
    childs: BasicArray<(GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | FlattenShape | CutoutShape) >
    isBoolOpShape?: boolean
    fixedRadius?: number
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | FlattenShape | CutoutShape) >
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
    overrides?: BasicMap<string, string>
    variables: BasicMap<string, Variable>
    symtags?: BasicMap<string, string>
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | FlattenShape | CutoutShape) >,
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
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | FlattenShape | CutoutShape) >,
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
 * flatten shape 
 */
export class FlattenShape extends GroupShape {
    typeId = 'flatten-shape'
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | FlattenShape | CutoutShape) >
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
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint >,
        isClosed: boolean,
        scalingStroke: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
        this.scalingStroke = scalingStroke
    }
}
/**
 * contact shape 
 */
export class ContactShape extends Shape {
    typeId = 'contact-shape'
    points: BasicArray<CurvePoint >
    from?: ContactForm
    to?: ContactForm
    isEdited: boolean
    isClosed: boolean
    mark: boolean
    text: Text
    fixedRadius?: number
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint >,
        isClosed: boolean,
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
            style
        )
        this.points = points
        this.isClosed = isClosed
        this.isEdited = isEdited
        this.text = text
        this.mark = mark
    }
}
/**
 * artboard shape 
 */
export class Artboard extends GroupShape {
    typeId = 'artboard'
    constructor(
        crdtidx: CrdtIndex,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | FlattenShape | CutoutShape) >
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
