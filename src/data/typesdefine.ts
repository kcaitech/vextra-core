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
export type Artboard_guides = Array<Guide>
/* blend mode */
export enum BlendMode {
    Normal = "normal",
    Darken = "darken",
    Multiply = "multiply",
    ColorBurn = "color-burn",
    Lighten = "lighten",
    Screen = "screen",
    ColorDodge = "color-dodge",
    Overlay = "overlay",
    SoftLight = "soft-light",
    HardLight = "hard-light",
    Difference = "difference",
    Exclusion = "exclusion",
    Hue = "hue",
    Saturation = "saturation",
    Color = "color",
    Luminosity = "luminosity",
    PlusDarker = "plus-darker",
    PlusLighter = "plus-lighter",
}
/* blur types */
export enum BlurType {
    Gaussian = "gaussian",
    Motion = "motion",
    Zoom = "zoom",
    Background = "background",
}
/* bool op types */
export enum BoolOp {
    None = "none",
    Union = "union",
    Subtract = "subtract",
    Intersect = "intersect",
    Diff = "diff",
}
/* border position */
export enum BorderPosition {
    Inner = "inner",
    Center = "center",
    Outer = "outer",
}
/* border style */
export type BorderStyle = {
    length: number,
    gap: number,
}
export type Border_strokePaints = Array<Fill>
/* bullet & item number behavior */
export enum BulletNumbersBehavior {
    Inherit = "inherit",
    Renew = "renew",
}
/* bullet & item number types */
export enum BulletNumbersType {
    None = "none",
    Mixed = "mixed",
    Ordered1Ai = "ordered-1ai",
    Disorded = "disorded",
}
/* bullet numbers */
export type BulletNumbers = {
    type: BulletNumbersType,
    behavior?: BulletNumbersBehavior,
    offset?: number,
}
/* color controls */
export type ColorControls = {
    isEnabled: boolean,
    brightness: number,
    contrast: number,
    hue: number,
    saturation: number,
}
/* color */
export type Color = {
    typeId: string,
    alpha: number,
    red: number,
    green: number,
    blue: number,
}
/* contact role type */
export enum ContactRoleType {
    From = "from",
    To = "to",
}
/* contact type */
export enum ContactType {
    Top = "top",
    Right = "right",
    Bottom = "bottom",
    Left = "left",
}
/* context settings */
export type ContextSettings = {
    typeId: string,
    blenMode: BlendMode,
    opacity: number,
}
/* couner radius */
export type CornerRadius = {
    id: string,
    typeId: string,
    lt: number,
    rt: number,
    lb: number,
    rb: number,
}
/* corner type */
export enum CornerType {
    Miter = "miter",
    Bevel = "bevel",
    Round = "round",
}
/* crdtidx */
export type Crdtidx = Array<number>
/* curve mode */
export enum CurveMode {
    None = "none",
    Straight = "straight",
    Mirrored = "mirrored",
    Asymmetric = "asymmetric",
    Disconnected = "disconnected",
}
/* curve point */
export type CurvePoint = {
    crdtidx: Crdtidx,
    id: string,
    x: number,
    y: number,
    mode: CurveMode,
    radius?: number,
    fromX?: number,
    fromY?: number,
    toX?: number,
    toY?: number,
    hasFrom?: boolean,
    hasTo?: boolean,
}
export type DocumentMeta_pagesList = Array<PageListItem>
export type DocumentMeta_stylelib = Array<StyleSheet>
/* ellipse attributes */
export type Ellipse = {
    cx: number,
    cy: number,
    rx: number,
    ry: number,
}
/* export file format */
export enum ExportFileFormat {
    Png = "png",
    Jpg = "jpg",
    Tiff = "tiff",
    Eps = "eps",
    Pdf = "pdf",
    Webp = "webp",
    Svg = "svg",
}
/* export format nameing scheme */
export enum ExportFormatNameingScheme {
    Suffix = "suffix",
    Prefix = "prefix",
}
export type ExportOptions_exportFormats = Array<ExportFormat>
/* visible scale type */
export enum ExportVisibleScaleType {
    Scale = "scale",
    Width = "width",
    Height = "height",
}
export type FillMask_fills = Array<Fill>
/* fill rule */
export enum FillRule {
    Nonzero = "nonzero",
    Evenodd = "evenodd",
}
/* fill types */
export enum FillType {
    SolidColor = "solid-color",
    Gradient = "gradient",
    Pattern = "pattern",
}
/* gradient type */
export enum GradientType {
    Linear = "linear",
    Radial = "radial",
    Angular = "angular",
}
export type Gradient_stops = Array<Stop>
/* graphics contex settings */
export type GraphicsContextSettings = {
    blendMode: BlendMode,
    opacity: number,
}
export type GroupShape_childs = Array<GroupShape | PathShape | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape>
/* guide axis */
export enum GuideAxis {
    X = "X",
    Y = "Y",
}
export type Guide_crdtidx = Array<number>
/* guide */
export type Guide = {
    crdtidx: Guide_crdtidx,
    typeId: string,
    id: string,
    axis: GuideAxis,
    offset: number,
}
/* image scale mode */
export enum ImageScaleMode {
    Fill = "fill",
    Stretch = "stretch",
    Fit = "fit",
    Crop = "crop",
    Tile = "tile",
}
/* line cap style */
export enum LineCapStyle {
    Butt = "butt",
    Round = "round",
    Projecting = "projecting",
}
/* line join style */
export enum LineJoinStyle {
    Miter = "miter",
    Round = "round",
    Bevel = "bevel",
}
/* marker type */
export enum MarkerType {
    Line = "line",
    FilledArrow = "filled-arrow",
    OpenArrow = "open-arrow",
    FilledCircle = "filled-circle",
    FilledSquare = "filled-square",
    Round = "round",
    Square = "square",
}
/* overlayBackgroundInteraction */
export enum OverlayBackgroundInteraction {
    NONE = "NONE",
    CLOSEONCLICKOUTSIDE = "CLOSE_ON_CLICK_OUTSIDE",
}
/* interactionType */
export enum OverlayBackgroundType {
    NONE = "NONE",
    SOLIDCOLOR = "SOLID_COLOR",
}
/* overlay margin */
export type OverlayMargin = {
    top: number,
    bottom: number,
    left: number,
    right: number,
}
/* overlayPositionType */
export enum OverlayPositionType {
    TOPLEFT = "TOP_LEFT",
    TOPCENTER = "TOP_CENTER",
    TOPRIGHT = "TOP_RIGHT",
    CENTERLEFT = "CENTER_LEFT",
    CENTER = "CENTER",
    CENTERRIGHT = "CENTER_RIGHT",
    BOTTOMLEFT = "BOTTOM_LEFT",
    BOTTOMCENTER = "BOTTOM_CENTER",
    BOTTOMRIGHT = "BOTTOM_RIGHT",
}
/* overlay position */
export type OverlayPosition = {
    typeId: string,
    position: OverlayPositionType,
    margin: OverlayMargin,
}
/* override types */
export enum OverrideType {
    Name = "name",
    Text = "text",
    Image = "image",
    Fills = "fills",
    Borders = "borders",
    Shadows = "shadows",
    Visible = "visible",
    Lock = "lock",
    Variable = "variable",
    SymbolID = "symbolID",
    ContextSettings = "contextSettings",
    TableCell = "tableCell",
    StartMarkerType = "startMarkerType",
    EndMarkerType = "endMarkerType",
    ExportOptions = "exportOptions",
    CornerRadius = "cornerRadius",
    Blur = "blur",
    ProtoInteractions = "protoInteractions",
    AutoLayout = "autoLayout",
    FrameMaskDisabled = "frameMaskDisabled",
    FillsMask = "fillsMask",
    BorderFillsMask = "borderFillsMask",
    BordersMask = "bordersMask",
    ShadowsMask = "shadowsMask",
    BlursMask = "blursMask",
    RadiusMask = "radiusMask",
    TextMask = "textMask",
}
/* padding */
export type Padding = {
    left?: number,
    top?: number,
    right?: number,
    bottom?: number,
}
/* page list item */
export type PageListItem = {
    crdtidx: Crdtidx,
    id: string,
    name: string,
    versionId?: string,
}
export type Page_guides = Array<Guide>
export type Page_connections = Array<Connection>
/* paint filter */
export type PaintFilter = {
    exposure: number,
    contrast: number,
    saturation: number,
    temperature: number,
    tint: number,
    shadow: number,
    hue: number,
}
/* paint filter type */
export enum PaintFilterType {
    Exposure = "exposure",
    Contrast = "contrast",
    Saturation = "saturation",
    Temperature = "temperature",
    Tint = "tint",
    Shadow = "shadow",
    Hue = "hue",
}
export type Para_spans = Array<Span>
export type PathSegment_points = Array<CurvePoint>
/* path segment */
export type PathSegment = {
    crdtidx: Crdtidx,
    id: string,
    points: PathSegment_points,
    isClosed: boolean,
}
export type PathShape_pathsegs = Array<PathSegment>
/* pattern transform */
export type PatternTransform = {
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
}
/* point 2d */
export type Point2D = {
    x: number,
    y: number,
}
/* connectionType */
export enum PrototypeConnectionType {
    NONE = "NONE",
    INTERNALNODE = "INTERNAL_NODE",
    BACK = "BACK",
    URL = "URL",
    CLOSE = "CLOSE",
}
/* prototypeEasingBezier */
export type PrototypeEasingBezier = {
    typeId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
}
/* easingType */
export enum PrototypeEasingType {
    LINEAR = "LINEAR",
    INCUBIC = "IN_CUBIC",
    OUTCUBIC = "OUT_CUBIC",
    INOUTCUBIC = "INOUT_CUBIC",
    INBACKCUBIC = "IN_BACK_CUBIC",
    OUTBACKCUBIC = "OUT_BACK_CUBIC",
    INOUTBACKCUBIC = "INOUT_BACK_CUBIC",
    CUSTOMCUBIC = "CUSTOM_CUBIC",
}
/* interactionType */
export enum PrototypeEvents {
    ONCLICK = "ON_CLICK",
    DBCLICK = "DB_CLICK",
    RIGHTCLICK = "RIGHT_CLICK",
    DRAG = "DRAG",
    HOVER = "HOVER",
    MOUSEENTER = "MOUSE_ENTER",
    MOUSELEAVE = "MOUSE_LEAVE",
    MOUSEDOWN = "MOUSE_DOWN",
    MOUSEUP = "MOUSE_UP",
    AFTERTIMEOUT = "AFTER_TIMEOUT",
}
export type PrototypeInteraction_crdtidx = Array<number>
/* navigationType */
export enum PrototypeNavigationType {
    NAVIGATE = "NAVIGATE",
    SWAPSTATE = "SWAP_STATE",
    SCROLLTO = "SCROLL_TO",
    OVERLAY = "OVERLAY",
    SWAP = "SWAP",
}
/* prototypeStartingPoint */
export type PrototypeStartingPoint = {
    typeId: string,
    name: string,
    desc: string,
}
/* transitionType */
export enum PrototypeTransitionType {
    INSTANTTRANSITION = "INSTANT_TRANSITION",
    DISSOLVE = "DISSOLVE",
    MOVEFROMRIGHT = "MOVE_FROM_RIGHT",
    MOVEFROMLEFT = "MOVE_FROM_LEFT",
    MOVEFROMTOP = "MOVE_FROM_TOP",
    MOVEFROMBOTTOM = "MOVE_FROM_BOTTOM",
    MOVEOUTTORIGHT = "MOVE_OUT_TO_RIGHT",
    MOVEOUTTOLEFT = "MOVE_OUT_TO_LEFT",
    MOVEOUTTOTOP = "MOVE_OUT_TO_TOP",
    MOVEOUTTOBOTTOM = "MOVE_OUT_TO_BOTTOM",
    SLIDEFROMRIGHT = "SLIDE_FROM_RIGHT",
    SLIDEFROMLEFT = "SLIDE_FROM_LEFT",
    SLIDEFROMTOP = "SLIDE_FROM_TOP",
    SLIDEFROMBOTTOM = "SLIDE_FROM_BOTTOM",
    SLIDEOUTTORIGHT = "SLIDE_OUT_TO_RIGHT",
    SLIDEOUTTOLEFT = "SLIDE_OUT_TO_LEFT",
    SLIDEOUTTOTOP = "SLIDE_OUT_TO_TOP",
    SLIDEOUTTOBOTTOM = "SLIDE_OUT_TO_BOTTOM",
    PUSHFROMRIGHT = "PUSH_FROM_RIGHT",
    PUSHFROMLEFT = "PUSH_FROM_LEFT",
    PUSHFROMTOP = "PUSH_FROM_TOP",
    PUSHFROMBOTTOM = "PUSH_FROM_BOTTOM",
    SCROLLANIMATE = "SCROLL_ANIMATE",
    SMARTANIMATE = "SMART_ANIMATE",
}
/* crdtidx */
export type Radius = Array<number>
/* resize type */
export enum ResizeType {
    Stretch = "stretch",
    PinToEdge = "pinToEdge",
    Resize = "resize",
    Float = "float",
}
/* scrollBehavior */
export enum ScrollBehavior {
    SCROLLS = "SCROLLS",
    FIXEDWHENCHILDOFSCROLLINGFRAME = "FIXED_WHEN_CHILD_OF_SCROLLING_FRAME",
    STICKYSCROLLS = "STICKY_SCROLLS",
}
/* scrollDirection */
export enum ScrollDirection {
    NONE = "NONE",
    HORIZONTAL = "HORIZONTAL",
    VERTICAL = "VERTICAL",
    BOTH = "BOTH",
}
export type ShadowMask_shadows = Array<Shadow>
/* shadow position */
export enum ShadowPosition {
    Inner = "inner",
    Outer = "outer",
}
/* shadow */
export type Shadow = {
    crdtidx: Crdtidx,
    typeId: string,
    id: string,
    isEnabled: boolean,
    blurRadius: number,
    color: Color,
    offsetX: number,
    offsetY: number,
    spread: number,
    position: ShadowPosition,
    contextSettings?: GraphicsContextSettings,
    mask?: string,
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export type ShapeFrame = {
    x: number,
    y: number,
    width: number,
    height: number,
}
/* shape size */
export type ShapeSize = {
    width: number,
    height: number,
}
/* shape types */
export enum ShapeType {
    Path = "path",
    Group = "group",
    Artboard = "artboard",
    Page = "page",
    Text = "text",
    SymbolRef = "symbol-ref",
    Symbol = "symbol",
    SymbolUnion = "symbol-union",
    Rectangle = "rectangle",
    Triangle = "triangle",
    Star = "star",
    Polygon = "polygon",
    Oval = "oval",
    Line = "line",
    Table = "table",
    TableCell = "table-cell",
    Contact = "contact",
    Cutout = "cutout",
    BoolShape = "bool-shape",
}
export type Shape_prototypeInteractions = Array<PrototypeInteraction>
/* side type */
export enum SideType {
    Normal = "normal",
    Top = "top",
    Bottom = "bottom",
    Left = "left",
    Right = "right",
    Custom = "custom",
}
/* stack align */
export enum StackAlign {
    Min = "min",
    Center = "center",
    Max = "max",
    SpaceEvenly = "space-evenly",
}
/* stack mode */
export enum StackMode {
    Horizontal = "horizontal",
    Vertical = "vertical",
}
/* stack positioning */
export enum StackPositioning {
    AUTO = "AUTO",
    ABSOLUTE = "ABSOLUTE",
}
/* stack size */
export type StackSize = {
    x: number,
    y: number,
}
/* stack sizing */
export enum StackSizing {
    Fixed = "fixed",
    Auto = "auto",
}
/* stack wrap */
export enum StackWrap {
    Wrap = "wrap",
    NoWrap = "no-wrap",
}
/* stop */
export type Stop = {
    crdtidx: Crdtidx,
    id: string,
    position: number,
    color: Color,
}
/* strikethrough types */
export enum StrikethroughType {
    None = "none",
    Single = "single",
    Double = "double",
}
/* style library type */
export enum StyleLibType {
    Color = "color",
}
export type StyleSheet_variables = Array<FillMask | ShadowMask | BlurMask | BorderMask | RadiusMask | TextMask>
/* shape types */
export enum StyleVarType {
    Color = "color",
    Round = "round",
    Shadow = "shadow",
    Thickness = "thickness",
    Blur = "blur",
}
export type Style_fills = Array<Fill>
export type Style_shadows = Array<Shadow>
export type Style_innerShadows = Array<Shadow>
export type Style_contacts = Array<ContactRole>
export type SymbolShape_guides = Array<Guide>
/* table cell info */
export type TableCellAttr = {
    rowSpan?: number,
    colSpan?: number,
}
/* table cell types */
export enum TableCellType {
    None = "none",
    Text = "text",
    Image = "image",
}
export type TableShape_rowHeights = Array<CrdtNumber>
export type TableShape_colWidths = Array<CrdtNumber>
/* text behaviour */
export enum TextBehaviour {
    Flexible = "flexible",
    Fixed = "fixed",
    FixWidthAndHeight = "fixWidthAndHeight",
}
/* text horizontal alignment */
export enum TextHorAlign {
    Left = "left",
    Right = "right",
    Centered = "centered",
    Justified = "justified",
    Natural = "natural",
}
/* text orientation */
export enum TextOrientation {
    Horizontal = "horizontal",
    Vertical = "vertical",
}
/* text transform types */
export enum TextTransformType {
    None = "none",
    Uppercase = "uppercase",
    Lowercase = "lowercase",
    UppercaseFirst = "uppercase-first",
}
/* text vertical alignment */
export enum TextVerAlign {
    Top = "top",
    Middle = "middle",
    Bottom = "bottom",
}
export type Text_paras = Array<Para>
/* transform */
export type Transform = {
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
}
/* underline types */
export enum UnderlineType {
    None = "none",
    Single = "single",
    Double = "double",
}
/* user infomation */
export type UserInfo = {
    userId: string,
    userNickname: string,
    avatar: string,
}
/* variable types */
export enum VariableType {
    Name = "name",
    Color = "color",
    Gradient = "gradient",
    Text = "text",
    Visible = "visible",
    Lock = "lock",
    SymbolRef = "symbolRef",
    Status = "status",
    ImageRef = "imageRef",
    Fills = "fills",
    Borders = "borders",
    Shadows = "shadows",
    Style = "style",
    ContextSettings = "contextSettings",
    TableCell = "tableCell",
    MarkerType = "markerType",
    ExportOptions = "exportOptions",
    CornerRadius = "cornerRadius",
    Blur = "blur",
    ProtoInteractions = "protoInteractions",
    AutoLayout = "autoLayout",
    FrameMaskDisabled = "frameMaskDisabled",
    FillsMask = "fillsMask",
    BorderFillsMask = "borderFillsMask",
    BordersMask = "bordersMask",
    ShadowsMask = "shadowsMask",
    BlursMask = "blursMask",
    RadiusMask = "radiusMask",
    TextMask = "textMask",
}
export type Variable_0 = Array<Fill | Shadow | PrototypeInteraction>
/* winding rule */
export enum WindingRule {
    NonZero = "non-zero",
    EvenOdd = "even-odd",
}
/* auto layout */
export type AutoLayout = {
    typeId: string,
    stackSpacing: number,
    stackCounterSpacing: number,
    stackHorizontalPadding: number,
    stackVerticalPadding: number,
    stackPaddingRight: number,
    stackPaddingBottom: number,
    stackPrimarySizing: StackSizing,
    stackMode?: StackMode,
    stackWrap?: StackWrap,
    stackHorizontalGapSizing?: StackSizing,
    stackVerticalGapSizing?: StackSizing,
    stackCounterSizing?: StackSizing,
    stackPrimaryAlignItems?: StackAlign,
    stackCounterAlignItems?: StackAlign,
    stackReverseZIndex?: boolean,
    bordersTakeSpace?: boolean,
    minSize?: StackSize,
    maxSize?: StackSize,
}
/* blur */
export type Blur = {
    typeId: string,
    isEnabled: boolean,
    center: Point2D,
    saturation: number,
    type: BlurType,
    motionAngle?: number,
    radius?: number,
}
/* border options */
export type BorderOptions = {
    isEnabled: boolean,
    lineCapStyle: LineCapStyle,
    lineJoinStyle: LineJoinStyle,
}
/* border side setting */
export type BorderSideSetting = {
    typeId: string,
    sideType: SideType,
    thicknessTop: number,
    thicknessLeft: number,
    thicknessBottom: number,
    thicknessRight: number,
}
/* contact form */
export type ContactForm = {
    contactType: ContactType,
    shapeId: string,
}
/* contactstyle */
export type ContactRole = {
    crdtidx: Crdtidx,
    id: string,
    roleType: ContactRoleType,
    shapeId: string,
}
/* crdt number */
export type CrdtNumber = {
    id: string,
    crdtidx: Crdtidx,
    value: number,
}
/* export format */
export type ExportFormat = {
    crdtidx: Crdtidx,
    id: string,
    absoluteSize: number,
    fileFormat: ExportFileFormat,
    name: string,
    namingScheme: ExportFormatNameingScheme,
    scale: number,
    visibleScaleType: ExportVisibleScaleType,
}
/* export options */
export type ExportOptions = {
    typeId: string,
    exportFormats: ExportOptions_exportFormats,
    childOptions: number,
    shouldTrim: boolean,
    trimTransparent: boolean,
    canvasBackground: boolean,
    unfold: boolean,
}
/* gradient */
export type Gradient = {
    typeId: string,
    from: Point2D,
    to: Point2D,
    gradientType: GradientType,
    stops: Gradient_stops,
    elipseLength?: number,
    gradientOpacity?: number,
}
/* overlay-background-appearance */
export type OverlayBackgroundAppearance = {
    typeId: string,
    backgroundType: OverlayBackgroundType,
    backgroundColor: Color,
}
/* actions */
export type PrototypeActions = {
    typeId: string,
    connectionType: PrototypeConnectionType,
    openUrlInNewTab: boolean,
    targetNodeID?: string,
    transitionType?: PrototypeTransitionType,
    transitionDuration?: number,
    easingType?: PrototypeEasingType,
    connectionURL?: string,
    navigationType?: PrototypeNavigationType,
    easingFunction?: PrototypeEasingBezier,
    extraScrollOffset?: Point2D,
}
/* event */
export type PrototypeEvent = {
    interactionType: PrototypeEvents,
    transitionTimeout?: number,
}
/* prototypeInteraction */
export type PrototypeInteraction = {
    crdtidx: PrototypeInteraction_crdtidx,
    id: string,
    event: PrototypeEvent,
    actions: PrototypeActions,
    typeId?: string,
    isDeleted?: boolean,
}
/* radius mask */
export type RadiusMask = {
    crdtidx: Crdtidx,
    typeId: string,
    sheet: string,
    id: string,
    name: string,
    description: string,
    radius: Radius,
    disabled?: boolean,
}
/* shadow mask */
export type ShadowMask = {
    crdtidx: Crdtidx,
    typeId: string,
    sheet: string,
    id: string,
    name: string,
    description: string,
    shadows: ShadowMask_shadows,
    disabled?: boolean,
}
/* span attr */
export type SpanAttr = {
    fontName?: string,
    fontSize?: number,
    color?: Color,
    strikethrough?: StrikethroughType,
    underline?: UnderlineType,
    weight?: number,
    italic?: boolean,
    bulletNumbers?: BulletNumbers,
    highlight?: Color,
    kerning?: number,
    transform?: TextTransformType,
    placeholder?: boolean,
    fillType?: FillType,
    gradient?: Gradient,
    textMask?: string,
}
/* span attr */
export type Span = SpanAttr & {
    length: number,
}
/* blur mask */
export type BlurMask = {
    crdtidx: Crdtidx,
    typeId: string,
    sheet: string,
    id: string,
    name: string,
    description: string,
    blur: Blur,
    disabled?: boolean,
}
/* border mask type */
export type BorderMaskType = {
    typeId: string,
    position: BorderPosition,
    sideSetting: BorderSideSetting,
}
/* border mask */
export type BorderMask = {
    crdtidx: Crdtidx,
    typeId: string,
    sheet: string,
    id: string,
    name: string,
    description: string,
    border: BorderMaskType,
    disabled?: boolean,
}
/* fill */
export type Fill = {
    crdtidx: Crdtidx,
    typeId: string,
    id: string,
    isEnabled: boolean,
    fillType: FillType,
    color: Color,
    contextSettings?: ContextSettings,
    gradient?: Gradient,
    imageRef?: string,
    fillRule?: FillRule,
    imageScaleMode?: ImageScaleMode,
    rotation?: number,
    scale?: number,
    originalImageWidth?: number,
    originalImageHeight?: number,
    paintFilter?: PaintFilter,
    transform?: PatternTransform,
}
/* span attr */
export type ParaAttr = SpanAttr & {
    alignment?: TextHorAlign,
    paraSpacing?: number,
    minimumLineHeight?: number,
    maximumLineHeight?: number,
    autoLineHeight?: boolean,
    indent?: number,
}
/* para */
export type Para = {
    text: string,
    spans: Para_spans,
    attr?: ParaAttr,
}
/* text attr */
export type TextAttr = ParaAttr & {
    verAlign?: TextVerAlign,
    orientation?: TextOrientation,
    textBehaviour?: TextBehaviour,
    padding?: Padding,
}
/* text mask */
export type TextMask = {
    crdtidx: Crdtidx,
    typeId: string,
    sheet: string,
    id: string,
    name: string,
    description: string,
    text: TextAttr,
    disabled?: boolean,
}
/* text */
export type Text = {
    typeId: string,
    paras: Text_paras,
    attr?: TextAttr,
    fixed?: boolean,
}
/* border */
export type Border = {
    typeId: string,
    position: BorderPosition,
    borderStyle: BorderStyle,
    cornerType: CornerType,
    sideSetting: BorderSideSetting,
    strokePaints: Border_strokePaints,
    fillsMask?: string,
}
/* fill mask */
export type FillMask = {
    crdtidx: Crdtidx,
    typeId: string,
    sheet: string,
    id: string,
    name: string,
    description: string,
    fills: FillMask_fills,
    disabled?: boolean,
}
/* style sheet */
export type StyleSheet = {
    crdtidx: Crdtidx,
    id: string,
    name: string,
    variables: StyleSheet_variables,
}
/* style */
export type Style = {
    typeId: string,
    fills: Style_fills,
    shadows: Style_shadows,
    borders: Border,
    miterLimit?: number,
    windingRule?: WindingRule,
    blur?: Blur,
    borderOptions?: BorderOptions,
    colorControls?: ColorControls,
    contextSettings?: ContextSettings,
    innerShadows?: Style_innerShadows,
    contacts?: Style_contacts,
    startMarkerType?: MarkerType,
    endMarkerType?: MarkerType,
    varbinds?: Map<string, string>,
    fillsMask?: string,
    shadowsMask?: string,
    blursMask?: string,
    bordersMask?: string,
}
/* shape */
export type Shape = {
    crdtidx: Crdtidx,
    typeId: string,
    id: string,
    name: string,
    type: ShapeType,
    transform: Transform,
    style: Style,
    boolOp?: BoolOp,
    isFixedToViewport?: boolean,
    isLocked?: boolean,
    isVisible?: boolean,
    exportOptions?: ExportOptions,
    nameIsFixed?: boolean,
    resizingConstraint?: number,
    resizingType?: ResizeType,
    constrainerProportions?: boolean,
    clippingMaskMode?: number,
    hasClippingMask?: boolean,
    shouldBreakMaskChain?: boolean,
    varbinds?: Map<string, string>,
    haveEdit?: boolean,
    prototypeStartingPoint?: PrototypeStartingPoint,
    prototypeInteractions?: Shape_prototypeInteractions,
    overlayPosition?: OverlayPosition,
    overlayBackgroundInteraction?: OverlayBackgroundInteraction,
    overlayBackgroundAppearance?: OverlayBackgroundAppearance,
    scrollDirection?: ScrollDirection,
    scrollBehavior?: ScrollBehavior,
    mask?: boolean,
    stackPositioning?: StackPositioning,
    radiusMask?: string,
}
/* table cell */
export type TableCell = Shape & {
    cellType: TableCellType,
    text: Text,
    imageRef?: string,
    rowSpan?: number,
    colSpan?: number,
}
/* table shape */
export type TableShape = Shape & {
    size: ShapeSize,
    cells: Map<string, TableCell>,
    rowHeights: TableShape_rowHeights,
    colWidths: TableShape_colWidths,
    textAttr?: TextAttr,
}
/* text shape */
export type TextShape = Shape & {
    size: ShapeSize,
    text: Text,
    fixedRadius?: number,
}
/* color */
export type Variable = {
    id: string,
    type: VariableType,
    name: string,
    value: undefined | number | string | boolean | Color | Text | Gradient | Style | Variable_0 | Border | ContextSettings | TableCell | ExportOptions | CornerRadius | Blur | AutoLayout,
}
/* comment */
export type Comment = {
    pageId: string,
    id: string,
    frame: ShapeFrame,
    user: UserInfo,
    createAt: string,
    content: string,
    parasiticBody: Shape,
    parentId?: string,
    rootId?: string,
}
/* path shape */
export type PathShape = Shape & {
    size: ShapeSize,
    pathsegs: PathShape_pathsegs,
    fixedRadius?: number,
}
/* polygon shape */
export type PolygonShape = PathShape & {
    counts: number,
}
/* rect shape */
export type RectShape = PathShape
/* star shape */
export type StarShape = PathShape & {
    counts: number,
    innerAngle: number,
}
/* symbol ref shape */
export type SymbolRefShape = Shape & {
    size: ShapeSize,
    refId: string,
    variables: Map<string, Variable>,
    overrides?: Map<string, string>,
    isCustomSize?: boolean,
    cornerRadius?: CornerRadius,
    innerEnvScale?: number,
    uniformScale?: number,
}
/* connection */
export type Connection = PathShape & {
    isEdited: boolean,
    from?: ContactForm,
    to?: ContactForm,
}
/* contact shape */
export type ContactShape = PathShape & {
    isEdited: boolean,
    text: Text,
    mark: boolean,
    from?: ContactForm,
    to?: ContactForm,
}
/* cutout shape */
export type CutoutShape = PathShape
/* line shape */
export type LineShape = PathShape
/* oval shape */
export type OvalShape = PathShape & {
    ellipse: Ellipse,
    startingAngle?: number,
    endingAngle?: number,
    innerRadius?: number,
}
/* artboard shape */
export type Artboard = GroupShape & {
    size: ShapeSize,
    cornerRadius?: CornerRadius,
    guides?: Artboard_guides,
    autoLayout?: AutoLayout,
    frameMaskDisabled?: boolean,
}
/* bool shape */
export type BoolShape = GroupShape
/* document meta */
export type DocumentMeta = {
    id: string,
    name: string,
    fmtVer: string,
    pagesList: DocumentMeta_pagesList,
    lastCmdVer: number,
    symbolregist: Map<string, string>,
    freesymbols?: Map<string, SymbolShape | SymbolUnionShape>,
    stylelib?: DocumentMeta_stylelib,
    thumbnailViewId?: string,
}
/* group shape */
export type GroupShape = Shape & {
    childs: GroupShape_childs,
    fixedRadius?: number,
}
/* page */
export type Page = GroupShape & {
    backgroundColor?: Color,
    guides?: Page_guides,
    connections?: Page_connections,
}
/* symbol shape */
export type SymbolShape = GroupShape & {
    size: ShapeSize,
    variables: Map<string, Variable>,
    symtags?: Map<string, string>,
    cornerRadius?: CornerRadius,
    guides?: SymbolShape_guides,
    autoLayout?: AutoLayout,
    frameMaskDisabled?: boolean,
}
/* symbol union shape */
export type SymbolUnionShape = SymbolShape