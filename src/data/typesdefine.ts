/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

/* winding rule */
export enum WindingRule {
    NonZero = 'non-zero',
    EvenOdd = 'even-odd',
}
/* user infomation */
export type UserInfo = {
    userId: string
    userNickname: string
    avatar: string
}
/* underline types */
export enum UnderlineType {
    None = 'none',
    Single = 'single',
    Double = 'double',
}
/* text */
export type Text = {
    paras: Para[]
    attr?: TextAttr
}
/* text vertical alignment */
export enum TextVerAlign {
    Top = 'top',
    Middle = 'middle',
    Bottom = 'bottom',
}
/* text transform types */
export enum TextTransformType {
    None = 'none',
    Uppercase = 'uppercase',
    Lowercase = 'lowercase',
    UppercaseFirst = 'uppercase-first',
}
/* text orientation */
export enum TextOrientation {
    Horizontal = 'horizontal',
    Vertical = 'vertical',
}
/* text horizontal alignment */
export enum TextHorAlign {
    Left = 'left',
    Right = 'right',
    Centered = 'centered',
    Justified = 'justified',
    Natural = 'natural',
}
/* text behaviour */
export enum TextBehaviour {
    Flexible = 'flexible',
    Fixed = 'fixed',
    FixWidthAndHeight = 'fixWidthAndHeight',
}
/* style */
export type Style = {
    typeId: string
    miterLimit: number
    windingRule: WindingRule
    blur: Blur
    borderOptions: BorderOptions
    borders: Border[]
    colorControls?: ColorControls
    contextSettings: ContextSettings
    fills: Fill[]
    innerShadows: Shadow[]
    shadows: Shadow[]
}
/* strikethrough types */
export enum StrikethroughType {
    None = 'none',
    Single = 'single',
    Double = 'double',
}
/* stop */
export type Stop = {
    position: number
    color?: Color
}
/* span attr */
export type SpanAttr = {
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
}
/* shape */
export type Shape = {
    typeId: string
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
}
/* shape types */
export enum ShapeType {
    Path = 'path',
    FlattenShape = 'flatten-shape',
    Group = 'group',
    Artboard = 'artboard',
    Image = 'image',
    Page = 'page',
    Text = 'text',
    Symbol = 'symbol',
    SymbolRef = 'symbol-ref',
    ArtboardRef = 'artboard-ref',
    Rectangle = 'rectangle',
    Triangle = 'triangle',
    Star = 'star',
    Polygon = 'polygon',
    Oval = 'oval',
    Line = 'line',
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export type ShapeFrame = {
    x: number
    y: number
    width: number
    height: number
}
/* shadow */
export type Shadow = {
    isEnabled: boolean
    blurRadius: number
    color: Color
    contextSettings: GraphicsContextSettings
    offsetX: number
    offsetY: number
    spread: number
}
/* resize type */
export enum ResizeType {
    Stretch = 'stretch',
    PinToEdge = 'pinToEdge',
    Resize = 'resize',
    Float = 'float',
}
/* point 2d */
export type Point2D = {
    x: number
    y: number
}
/* para */
export type Para = {
    text: string
    spans: Span[]
    attr?: ParaAttr
}
/* page list item */
export type PageListItem = {
    id: string
    name: string
}
/* override list item */
export type OverrideItem = {
    id: string
    value?: Style
}
/* marker type */
export enum MarkerType {
    OpenArrow = 'open-arrow',
    FilledArrow = 'filled-arrow',
    Line = 'line',
    OpenCircle = 'open-circle',
    FilledCircle = 'filled-circle',
    OpenSquare = 'open-square',
    FilledSquare = 'filled-square',
    FallT = 'fall-t',
}
/* line join style */
export enum LineJoinStyle {
    Miter = 'miter',
    Round = 'round',
    Bevel = 'bevel',
}
/* line cap style */
export enum LineCapStyle {
    Butt = 'butt',
    Round = 'round',
    Projecting = 'projecting',
}
/* graphics contex settings */
export type GraphicsContextSettings = {
    blendMode: BlendMode
    opacity: number
}
/* gradient */
export type Gradient = {
    elipseLength: number
    from: Point2D
    to: Point2D
    stops: Stop[]
    gradientType: GradientType
}
/* gradient type */
export enum GradientType {
    Linear = 'linear',
    Radial = 'radial',
    Angular = 'angular',
}
/* fill */
export type Fill = {
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings: ContextSettings
    gradient?: Gradient
}
/* fill types */
export enum FillType {
    SolidColor = 'solid-color',
    Gradient = 'gradient',
    Pattern = 'pattern',
}
/* visible scale type */
export enum ExportVisibleScaleType {
    Scale = 'scale',
    Width = 'width',
    Height = 'height',
}
/* export options */
export type ExportOptions = {
    exportFormats: ExportFormat[]
    includedChildIds: string[]
    childOptions: number
    shouldTrim: boolean
}
/* export format */
export type ExportFormat = {
    absoluteSize?: number
    fileFormat?: ExportFileFormat
    name?: string
    namingScheme?: ExportFormatNameingScheme
    scale?: number
    visibleScaleType?: ExportVisibleScaleType
}
/* export format nameing scheme */
export enum ExportFormatNameingScheme {
    Suffix = 'suffix',
    Prefix = 'prefix',
}
/* export file format */
export enum ExportFileFormat {
    Png = 'png',
    Jpg = 'jpg',
    Tiff = 'tiff',
    Eps = 'eps',
    Pdf = 'pdf',
    Webp = 'webp',
    Svg = 'svg',
}
/* ellipse attributes */
export type Ellipse = {
    cx: number
    cy: number
    rx: number
    ry: number
}
/* document syms */
export type DocumentSyms = {
    pageId: string
    symbols: string[]
}
/* document meta */
export type DocumentMeta = {
    id: string
    name: string
    pagesList: PageListItem[]
}
/* curve point */
export type CurvePoint = {
    id: string
    cornerRadius: number
    curveFrom: Point2D
    curveTo: Point2D
    hasCurveFrom: boolean
    hasCurveTo: boolean
    curveMode: CurveMode
    point: Point2D
}
/* curve mode */
export enum CurveMode {
    None = 'none',
    Straight = 'straight',
    Mirrored = 'mirrored',
    Asymmetric = 'asymmetric',
    Disconnected = 'disconnected',
}
/* context settings */
export type ContextSettings = {
    blenMode: BlendMode
    opacity: number
}
/* comment */
export type Comment = {
    pageId: string
    id: string
    frame: ShapeFrame
    user: UserInfo
    createAt: string
    content: string
    parasiticBody: Shape
    parentId?: string
    rootId?: string
}
/* color */
export type Color = {
    alpha: number
    red: number
    green: number
    blue: number
}
/* color controls */
export type ColorControls = {
    isEnabled: boolean
    brightness: number
    contrast: number
    hue: number
    saturation: number
}
/* bullet numbers */
export type BulletNumbers = {
    behavior?: BulletNumbersBehavior
    offset?: number
    type: BulletNumbersType
}
/* bullet & item number types */
export enum BulletNumbersType {
    None = 'none',
    Ordered1Ai = 'ordered-1ai',
    Disorded = 'disorded',
}
/* bullet & item number behavior */
export enum BulletNumbersBehavior {
    Inherit = 'inherit',
    Renew = 'renew',
}
/* border */
export type Border = {
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
}
/* border style */
export type BorderStyle = {
    length: number
    gap: number
}
/* border position */
export enum BorderPosition {
    Inner = 'inner',
    Center = 'center',
    Outer = 'outer',
}
/* border options */
export type BorderOptions = {
    isEnabled: boolean
    lineCapStyle: LineCapStyle
    lineJoinStyle: LineJoinStyle
}
/* bool op types */
export enum BoolOp {
    None = 'none',
    Union = 'union',
    Subtract = 'subtract',
    Intersect = 'intersect',
    Diff = 'diff',
}
/* blur */
export type Blur = {
    isEnabled: boolean
    center: Point2D
    motionAngle?: number
    radius?: number
    saturation: number
    type: BlurType
}
/* blur types */
export enum BlurType {
    Gaussian = 'gaussian',
    Motion = 'motion',
    Zoom = 'zoom',
    Background = 'background',
}
/* blend mode */
export enum BlendMode {
    Normal = 'normal',
    Darken = 'darken',
    Multiply = 'multiply',
    ColorBurn = 'color-burn',
    Lighten = 'lighten',
    Screen = 'screen',
    ColorDodge = 'color-dodge',
    Overlay = 'overlay',
    SoftLight = 'soft-light',
    HardLight = 'hard-light',
    Difference = 'difference',
    Exclusion = 'exclusion',
    Hue = 'hue',
    Saturation = 'saturation',
    Color = 'color',
    Luminosity = 'luminosity',
    PlusDarker = 'plus-darker',
    PlusLighter = 'plus-lighter',
}
/* text shape */
export type TextShape = Shape & {
    text: Text
}
/* table shape */
export type TableShape = Shape & {
    childs: TableCell[]
}
/* table cell */
export type TableCell = Shape & {
    childs: (ImageShape | TextShape)[]
}
/* symbol ref shape */
export type SymbolRefShape = Shape & {
    refId: string
    overrides?: OverrideItem[]
}
/* span attr */
export type Span = SpanAttr & {
    length: number
}
/* path shape */
export type PathShape = Shape & {
    points: CurvePoint[]
    isClosed?: boolean
}
/* rect shape */
export type RectShape = PathShape & {
}
/* span attr */
export type ParaAttr = SpanAttr & {
    alignment?: TextHorAlign
    paraSpacing?: number
    minimumLineHeight?: number
    maximumLineHeight?: number
    indent?: number
}
/* text attr */
export type TextAttr = ParaAttr & {
    verAlign?: TextVerAlign
    orientation?: TextOrientation
    textBehaviour?: TextBehaviour
}
/* page */
export type Page = Shape & {
    childs: (Shape | FlattenShape | GroupShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | OvalShape | LineShape | Artboard | SymbolShape | LineShape | OvalShape)[]
}
/* oval shape */
export type OvalShape = PathShape & {
    ellipse: Ellipse
}
/* line shape */
export type LineShape = PathShape & {
}
/* image shape */
export type ImageShape = Shape & {
    imageRef: string
}
/* group shape */
export type GroupShape = Shape & {
    childs: (GroupShape | Shape | FlattenShape | ImageShape | PathShape | RectShape | SymbolRefShape | TextShape | Artboard | LineShape | OvalShape)[]
}
/* symbol shape */
export type SymbolShape = GroupShape & {
}
/* flatten shape */
export type FlattenShape = GroupShape & {
}
/* artboard shape */
export type Artboard = GroupShape & {
    hasBackgroundColor?: boolean
    includeBackgroundColorInExport?: boolean
    backgroundColor?: Color
}
