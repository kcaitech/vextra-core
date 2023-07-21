/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

export {
    WindingRule,
    UnderlineType,
    TextVerAlign,
    TextTransformType,
    TextOrientation,
    TextHorAlign,
    TextBehaviour,
    StrikethroughType,
    ShapeType,
    ResizeType,
    MarkerType,
    LineJoinStyle,
    LineCapStyle,
    GradientType,
    FillType,
    ExportVisibleScaleType,
    ExportFormatNameingScheme,
    ExportFileFormat,
    CurveMode,
    BulletNumbersType,
    BulletNumbersBehavior,
    BorderPosition,
    BoolOp,
    BlurType,
    BlendMode
} from "./typesdefine"
import {
    WindingRule,
    UnderlineType,
    TextVerAlign,
    TextTransformType,
    TextOrientation,
    TextHorAlign,
    TextBehaviour,
    StrikethroughType,
    ShapeType,
    ResizeType,
    MarkerType,
    LineJoinStyle,
    LineCapStyle,
    GradientType,
    FillType,
    ExportVisibleScaleType,
    ExportFormatNameingScheme,
    ExportFileFormat,
    CurveMode,
    BulletNumbersType,
    BulletNumbersBehavior,
    BorderPosition,
    BoolOp,
    BlurType,
    BlendMode
} from "./typesdefine"
import {
    Basic, BasicArray
    } from "./basic"
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
    miterLimit: number
    windingRule: WindingRule
    blur: Blur
    borderOptions: BorderOptions
    borders: BasicArray<Border >
    colorControls?: ColorControls
    contextSettings: ContextSettings
    fills: BasicArray<Fill >
    innerShadows: BasicArray<Shadow >
    shadows: BasicArray<Shadow >
    constructor(
        miterLimit: number,
        windingRule: WindingRule,
        blur: Blur,
        borderOptions: BorderOptions,
        borders: BasicArray<Border >,
        contextSettings: ContextSettings,
        fills: BasicArray<Fill >,
        innerShadows: BasicArray<Shadow >,
        shadows: BasicArray<Shadow >
    ) {
        super()
        this.miterLimit = miterLimit
        this.windingRule = windingRule
        this.blur = blur
        this.borderOptions = borderOptions
        this.borders = borders
        this.contextSettings = contextSettings
        this.fills = fills
        this.innerShadows = innerShadows
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
    id: string
    type: ShapeType
    frame: ShapeFrame
    style: Style
    boolOp: BoolOp
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
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp
    ) {
        super()
        this.id = id
        this.name = name
        this.type = type
        this.frame = frame
        this.style = style
        this.boolOp = boolOp
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
    isEnabled: boolean
    blurRadius: number
    color: Color
    contextSettings: GraphicsContextSettings
    offsetX: number
    offsetY: number
    spread: number
    constructor(
        isEnabled: boolean,
        blurRadius: number,
        color: Color,
        contextSettings: GraphicsContextSettings,
        offsetX: number,
        offsetY: number,
        spread: number
    ) {
        super()
        this.isEnabled = isEnabled
        this.blurRadius = blurRadius
        this.color = color
        this.contextSettings = contextSettings
        this.offsetX = offsetX
        this.offsetY = offsetY
        this.spread = spread
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
 * override list item 
 */
export class OverrideItem extends Basic {
    typeId = 'override-item'
    id: string
    value?: Style
    constructor(
        id: string
    ) {
        super()
        this.id = id
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
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings: ContextSettings
    gradient?: Gradient
    constructor(
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        contextSettings: ContextSettings
    ) {
        super()
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
        this.contextSettings = contextSettings
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
    constructor(
        exportFormats: BasicArray<ExportFormat >,
        includedChildIds: BasicArray<string >,
        childOptions: number,
        shouldTrim: boolean
    ) {
        super()
        this.exportFormats = exportFormats
        this.includedChildIds = includedChildIds
        this.childOptions = childOptions
        this.shouldTrim = shouldTrim
    }
}
/**
 * export format 
 */
export class ExportFormat extends Basic {
    typeId = 'export-format'
    absoluteSize?: number
    fileFormat?: ExportFileFormat
    name?: string
    namingScheme?: ExportFormatNameingScheme
    scale?: number
    visibleScaleType?: ExportVisibleScaleType
    constructor(
    ) {
        super()
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
    versionId?: string
    constructor(
        id: string,
        name: string,
        pagesList: BasicArray<PageListItem >
    ) {
        super()
        this.id = id
        this.name = name
        this.pagesList = pagesList
    }
}
/**
 * curve point 
 */
export class CurvePoint extends Basic {
    typeId = 'curve-point'
    id: string
    cornerRadius: number
    curveFrom: Point2D
    curveTo: Point2D
    hasCurveFrom: boolean
    hasCurveTo: boolean
    curveMode: CurveMode
    point: Point2D
    constructor(
        id: string,
        cornerRadius: number,
        curveFrom: Point2D,
        curveTo: Point2D,
        hasCurveFrom: boolean,
        hasCurveTo: boolean,
        curveMode: CurveMode,
        point: Point2D
    ) {
        super()
        this.id = id
        this.cornerRadius = cornerRadius
        this.curveFrom = curveFrom
        this.curveTo = curveTo
        this.hasCurveFrom = hasCurveFrom
        this.hasCurveTo = hasCurveTo
        this.curveMode = curveMode
        this.point = point
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
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings: ContextSettings
    position: BorderPosition
    thickness: number
    gradient?: Gradient
    borderStyle: BorderStyle
    startMarkerType: MarkerType
    endMarkerType: MarkerType
    constructor(
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        contextSettings: ContextSettings,
        position: BorderPosition,
        thickness: number,
        borderStyle: BorderStyle,
        startMarkerType: MarkerType,
        endMarkerType: MarkerType
    ) {
        super()
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
        this.contextSettings = contextSettings
        this.position = position
        this.thickness = thickness
        this.borderStyle = borderStyle
        this.startMarkerType = startMarkerType
        this.endMarkerType = endMarkerType
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
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        text: Text
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.text = text
    }
}
/**
 * symbol ref shape 
 */
export class SymbolRefShape extends Shape {
    typeId = 'symbol-ref-shape'
    refId: string
    overrides?: BasicArray<OverrideItem >
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        refId: string
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.refId = refId
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
export class PathShape extends Shape {
    typeId = 'path-shape'
    points: BasicArray<CurvePoint >
    isClosed?: boolean
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        points: BasicArray<CurvePoint >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.points = points
    }
}
/**
 * rect shape 
 */
export class RectShape extends PathShape {
    typeId = 'rect-shape'
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        points: BasicArray<CurvePoint >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            points
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
    childs: BasicArray<(Shape | FlattenShape | GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | OvalShape | LineShape | Artboard | SymbolShape | LineShape | OvalShape) >
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(Shape | FlattenShape | GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | OvalShape | LineShape | Artboard | SymbolShape | LineShape | OvalShape) >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
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
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        points: BasicArray<CurvePoint >,
        ellipse: Ellipse
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            points
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
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        points: BasicArray<CurvePoint >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            points
        )
    }
}
/**
 * image shape 
 */
export class ImageShape extends Shape {
    typeId = 'image-shape'
    imageRef: string
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        imageRef: string
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.imageRef = imageRef
    }
}
/**
 * group shape 
 */
export class GroupShape extends Shape {
    typeId = 'group-shape'
    childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | Artboard | LineShape | OvalShape) >
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | Artboard | LineShape | OvalShape) >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp
        )
        this.childs = childs
    }
}
/**
 * symbol shape 
 */
export class SymbolShape extends GroupShape {
    typeId = 'symbol-shape'
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | Artboard | LineShape | OvalShape) >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            childs
        )
    }
}
/**
 * flatten shape 
 */
export class FlattenShape extends GroupShape {
    typeId = 'flatten-shape'
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | Artboard | LineShape | OvalShape) >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            childs
        )
    }
}
/**
 * artboard shape 
 */
export class Artboard extends GroupShape {
    typeId = 'artboard'
    hasBackgroundColor?: boolean
    includeBackgroundColorInExport?: boolean
    backgroundColor?: Color
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        boolOp: BoolOp,
        childs: BasicArray<(GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | Artboard | LineShape | OvalShape) >
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            boolOp,
            childs
        )
    }
}
