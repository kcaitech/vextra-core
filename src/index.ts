/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Path } from "@kcdesign/path"
import { gPal, MeasureFun, TextPathFun } from "./basic/pal"

// basic
export * from "./basic/matrix"
export * from "./basic/objectid"
export * from "./basic/utils"
export { IEventEmitter, EventEmitter } from "./basic/event"
export { ColVector2D, ColVector3D } from "./basic/matrix2"
export { NumberArray2D } from "./basic/number_array"

export * from "./basic/error"

// data
// 限制上层使用data,尽量使用view
// export * from "./data"
export {
    IWatchable,
    WatchableObject,
    Basic,
    BasicArray,
    GradientType,
    ShapeType,
    BlendMode,
    BorderPosition,
    ImageScaleMode,
    ExportFormatNameingScheme,
    BlurType,
    ShadowPosition,
    FillType,
    Gradient,
    Color,
    PaintFilter,
    PaintFilterType,
    Border,
    Fill,
    Stop,
    Shadow,
    CurveMode,
    PathType,
    TextBehaviour,
    RadiusType,
    Style,
    Blur,
    Point2D,
    MarkerType,
    SideType,
    ShapeFrame,
    ShapeSize,
    CornerType,
    BorderSideSetting,
    BorderStyle,
    ExportFormat,
    ExportFileFormat,
    ExportOptions,
    ExportVisibleScaleType,
    Text,
    Para,
    Variable,
    VariableType,
    OverrideType,
    ContextSettings,
    ResizingConstraints,
    ResizingConstraints2,
    AttrGetter,
    TableCellType,
    TextVerAlign,
    TextHorAlign,
    UnderlineType,
    StrikethroughType,
    TextTransformType,
    CurvePoint,
    ContactForm,
    BulletNumbersType,
    BulletNumbers,
    PageListItem,
    GuideAxis,
    BoolOp,
    ContactType,
    SpanAttr,
    TextAttr,
    FillRule,
    PatternTransform,

    TableGridItem,
    TableLayout,
    ResourceMgr,

    // todo
    Shape,
    Page,
    TextShape,
    SymbolShape,
    SymbolRefShape,
    TableCell,
    CutoutShape,
    GroupShape,
    Artboard,
    SymbolUnionShape,
    TableShape,
    ContactShape,
    BoolShape,
    PathShape,
    PolygonShape,
    RectShape,
    ImageShape,
    StarShape,

    Document,
    TransactDataGuard,

    AutoLayout,
    StackMode,
    StackAlign,
    StackSizing,
    StackWrap,
    StackSize,
    OverlayPosition,
    OverlayMargin,
    OverlayPositionType,
    OverlayBackgroundType,
    OverlayBackgroundInteraction,
    OverlayBackgroundAppearance,

    PrototypeStartingPoint,
    PrototypeInteraction,
    PrototypeConnectionType,
    PrototypeEasingType,
    PrototypeActions,
    PrototypeEvents,
    PrototypeEvent,
    PrototypeNavigationType,
    PrototypeTransitionType,
    PrototypeEasingBezier,

    ScrollDirection,
    ScrollBehavior,

    StackPositioning,

    parsePath,
    ShadowMask,
    FillMask,
    BlurMask,
    StyleMangerMember,
    CornerRadius,
    PathSegment,
    BorderMask,
    BorderMaskType,
    StyleSheet,
    RadiusMask,
    TextMask
} from "./data"
export * from "./data/shapedirlist"
export * from "./data/shapedirlist2"

export {
    importGradient
} from "./data"

// data view
export * from "./dataview"

// io
export * from "./io"
export * from "./io/import"
export * from "./io/export"
// export * from "./io/import/sketch/lzdata"
export * from "./io/cilpboard"
// export
export * from "./io/export/svg"
export * as svgParser from "./io/svg_parser";

// editor
export * from "./editor"
export * from "./editor/document"
export * from "./editor/page"
export * from "./editor/shape"
export * from "./editor/textshape"
export * from "./editor/table"
export * from "./editor/controller"
export * as creator from "./editor/creator/creator"


export * from "./editor/asyncapi"

// coop
export { PaddingDir } from "./coop/recordop"
export * from "./coop"

export { Transform } from "./data/transform"

// properties
export { exportBorder, exportFill, exportShadow, exportBlur, exportContextSettings } from './data/baseexport';

export { LinearApi } from './editor/linearapi/linearapi';

export { CircleChecker } from "./editor/basic/move/circle";

export { Path } from '@kcdesign/path'

export { FillModifier } from "./editor/style/fill";
export { BorderModifier } from "./editor/style/border";
export { RadiusModifier } from "./editor/style/radius";
export { ShadowsModifier } from "./editor/style/shadows";
export { BlurModifier } from "./editor/style/blur";
export { TextModifier } from "./editor/style/text";

export { ScreenPrinter } from "./printscreen";

export { convertGetFileResponse } from "./figmcpconvert/index";

export async function initModule(textMeasure: MeasureFun, text2path: TextPathFun) {
    gPal.text.textMeasure = textMeasure
    gPal.text.getTextPath = text2path
    await Path.init()
}
