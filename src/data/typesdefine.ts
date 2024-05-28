/* 代码生成，勿手动修改 */
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
/* bullet & item number behavior */
export enum BulletNumbersBehavior {
    Inherit = "inherit",
    Renew = "renew",
}
/* bullet & item number types */
export enum BulletNumbersType {
    None = "none",
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
export type GroupShape_childs = Array<GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape>
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
export type PathShape2_pathsegs = Array<PathSegment>
/* point 2d */
export type Point2D = {
    x: number,
    y: number,
}
/* resize type */
export enum ResizeType {
    Stretch = "stretch",
    PinToEdge = "pinToEdge",
    Resize = "resize",
    Float = "float",
}
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
    Path2 = "path2",
    Group = "group",
    Artboard = "artboard",
    Image = "image",
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
/* side type */
export enum SideType {
    Normal = "normal",
    Top = "top",
    Bottom = "bottom",
    Left = "left",
    Right = "right",
    Custom = "custom",
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
export type Style_borders = Array<Border>
export type Style_fills = Array<Fill>
export type Style_shadows = Array<Shadow>
export type Style_innerShadows = Array<Shadow>
export type Style_contacts = Array<ContactRole>
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
}
export type Variable_0 = Array<Border | Fill | Shadow>
/* winding rule */
export enum WindingRule {
    NonZero = "non-zero",
    EvenOdd = "even-odd",
}
/* blur */
export type Blur = {
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
/* document meta */
export type DocumentMeta = {
    id: string,
    name: string,
    fmtVer: number,
    pagesList: DocumentMeta_pagesList,
    lastCmdId: string,
    symbolregist: Map<string, string>,
    freesymbolsVersionId?: string,
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
}
/* span attr */
export type Span = SpanAttr & {
    length: number,
}
/* border */
export type Border = {
    crdtidx: Crdtidx,
    typeId: string,
    id: string,
    isEnabled: boolean,
    fillType: FillType,
    color: Color,
    position: BorderPosition,
    thickness: number,
    borderStyle: BorderStyle,
    cornerType: CornerType,
    sideSetting: BorderSideSetting,
    contextSettings?: ContextSettings,
    gradient?: Gradient,
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
}
/* span attr */
export type ParaAttr = SpanAttr & {
    alignment?: TextHorAlign,
    paraSpacing?: number,
    minimumLineHeight?: number,
    maximumLineHeight?: number,
    indent?: number,
}
/* para */
export type Para = {
    text: string,
    spans: Para_spans,
    attr?: ParaAttr,
}
/* style */
export type Style = {
    typeId: string,
    borders: Style_borders,
    fills: Style_fills,
    shadows: Style_shadows,
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
}
/* text attr */
export type TextAttr = ParaAttr & {
    verAlign?: TextVerAlign,
    orientation?: TextOrientation,
    textBehaviour?: TextBehaviour,
    padding?: Padding,
}
/* text */
export type Text = {
    typeId: string,
    paras: Text_paras,
    attr?: TextAttr,
}
/* shape */
export type Shape = {
    crdtidx: Crdtidx,
    typeId: string,
    id: string,
    name: string,
    type: ShapeType,
    transform: Transform,
    size: ShapeSize,
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
    cells: Map<string, TableCell>,
    rowHeights: TableShape_rowHeights,
    colWidths: TableShape_colWidths,
    textAttr?: TextAttr,
}
/* text shape */
export type TextShape = Shape & {
    text: Text,
    fixedRadius?: number,
}
/* color */
export type Variable = {
    id: string,
    type: VariableType,
    name: string,
    value: number | string | boolean | Color | Text | Gradient | Style | Variable_0 | ContextSettings | TableCell | ExportOptions | CornerRadius,
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
    pathsegs: PathShape_pathsegs,
    fixedRadius?: number,
}
/* path shape */
export type PathShape2 = Shape & {
    pathsegs: PathShape2_pathsegs,
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
    refId: string,
    variables: Map<string, Variable>,
    overrides?: Map<string, string>,
    isCustomSize?: boolean,
    cornerRadius?: CornerRadius,
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
export type CutoutShape = PathShape & {
    scalingStroke: boolean,
}
/* image shape */
export type ImageShape = PathShape & {
    imageRef: string,
}
/* line shape */
export type LineShape = PathShape
/* oval shape */
export type OvalShape = PathShape & {
    ellipse: Ellipse,
}
/* artboard shape */
export type Artboard = GroupShape & {
    cornerRadius?: CornerRadius,
}
/* bool shape */
export type BoolShape = GroupShape
/* group shape */
export type GroupShape = Shape & {
    childs: GroupShape_childs,
    fixedRadius?: number,
}
/* page */
export type Page = GroupShape & {
    backgroundColor?: Color,
}
/* symbol shape */
export type SymbolShape = GroupShape & {
    variables: Map<string, Variable>,
    symtags?: Map<string, string>,
    cornerRadius?: CornerRadius,
}
/* symbol union shape */
export type SymbolUnionShape = SymbolShape