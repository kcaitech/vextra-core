/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { parsePath, types } from "../../../data"
import * as resultTypes from "./types"
export function exportArtboard_guides(source: types.Artboard_guides, depth?: number): resultTypes.Artboard_guides {
    const ret: resultTypes.Artboard_guides = []
    source.forEach((source) => {
        ret.push(exportGuide(source, depth))
    })
    return ret
}
/* blend mode */
export function exportBlendMode(source: types.BlendMode, depth?: number): resultTypes.BlendMode {
    return source
}
/* blur types */
export function exportBlurType(source: types.BlurType, depth?: number): resultTypes.BlurType {
    return source
}
/* bool op types */
export function exportBoolOp(source: types.BoolOp, depth?: number): resultTypes.BoolOp {
    return source
}
/* border position */
export function exportBorderPosition(source: types.BorderPosition, depth?: number): resultTypes.BorderPosition {
    return source
}
/* border style */
export function exportBorderStyle(source: types.BorderStyle, depth?: number): resultTypes.BorderStyle {
    const ret: resultTypes.BorderStyle = {} as resultTypes.BorderStyle
    ret.length = source.length
    ret.gap = source.gap
    return ret
}
export function exportBorder_strokePaints(source: types.Border_strokePaints, depth?: number): resultTypes.Border_strokePaints {
    const ret: resultTypes.Border_strokePaints = []
    source.forEach((source) => {
        if (source.isEnabled) ret.push(exportFill(source, depth))
    })
    return ret
}
/* bullet & item number behavior */
export function exportBulletNumbersBehavior(source: types.BulletNumbersBehavior, depth?: number): resultTypes.BulletNumbersBehavior {
    return source
}
/* bullet & item number types */
export function exportBulletNumbersType(source: types.BulletNumbersType, depth?: number): resultTypes.BulletNumbersType {
    return source
}
/* bullet numbers */
export function exportBulletNumbers(source: types.BulletNumbers, depth?: number): resultTypes.BulletNumbers {
    const ret: resultTypes.BulletNumbers = {} as resultTypes.BulletNumbers
    ret.type = exportBulletNumbersType(source.type, depth)
    if (source.behavior !== undefined) ret.behavior = exportBulletNumbersBehavior(source.behavior, depth)
    if (source.offset !== undefined) ret.offset = source.offset
    return ret
}
/* color controls */
export function exportColorControls(source: types.ColorControls, depth?: number): resultTypes.ColorControls {
    const ret: resultTypes.ColorControls = {} as resultTypes.ColorControls
    ret.isEnabled = source.isEnabled
    ret.brightness = source.brightness
    ret.contrast = source.contrast
    ret.hue = source.hue
    ret.saturation = source.saturation
    return ret
}
/* color */
export function exportColor(source: types.Color, depth?: number): resultTypes.Color {
    const a = Math.round(source.alpha * 100) / 100;
    if (a === 1) return `#${source.red.toString(16)}${source.green.toString(16)}${source.blue.toString(16)}`
    if (a === 0) return 'transparent'

    const r = Math.round(source.red);
    const g = Math.round(source.green);
    const b = Math.round(source.blue);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}
/* contact role type */
export function exportContactRoleType(source: types.ContactRoleType, depth?: number): resultTypes.ContactRoleType {
    return source
}
/* contactstyle */
export function exportContactRole(source: types.ContactRole, depth?: number): resultTypes.ContactRole {
    const ret: resultTypes.ContactRole = {} as resultTypes.ContactRole
    ret.id = source.id
    ret.roleType = exportContactRoleType(source.roleType, depth)
    ret.shapeId = source.shapeId
    return ret
}
/* contact type */
export function exportContactType(source: types.ContactType, depth?: number): resultTypes.ContactType {
    return source
}
/* context settings */
export function exportContextSettings(source: types.ContextSettings, depth?: number): resultTypes.ContextSettings {
    const ret: resultTypes.ContextSettings = {} as resultTypes.ContextSettings
    ret.blenMode = exportBlendMode(source.blenMode, depth)
    ret.opacity = source.opacity
    return ret
}
/* couner radius */
export function exportCornerRadius(source: types.CornerRadius, depth?: number): resultTypes.CornerRadius {
    const ret: resultTypes.CornerRadius = {} as resultTypes.CornerRadius
    ret.id = source.id
    ret.lt = source.lt
    ret.rt = source.rt
    ret.lb = source.lb
    ret.rb = source.rb
    return ret
}
/* corner type */
export function exportCornerType(source: types.CornerType, depth?: number): resultTypes.CornerType {
    return source
}
/* crdt number */
export function exportCrdtNumber(source: types.CrdtNumber, depth?: number): resultTypes.CrdtNumber {
    const ret: resultTypes.CrdtNumber = {} as resultTypes.CrdtNumber
    ret.id = source.id
    ret.value = source.value
    return ret
}
/* curve mode */
export function exportCurveMode(source: types.CurveMode, depth?: number): resultTypes.CurveMode {
    return source
}
/* curve point */
export function exportCurvePoint(source: types.CurvePoint, depth?: number): resultTypes.CurvePoint {
    const ret: resultTypes.CurvePoint = {} as resultTypes.CurvePoint
    ret.x = source.x
    ret.y = source.y
    ret.mode = exportCurveMode(source.mode, depth)
    if (source.radius !== undefined) ret.radius = source.radius
    if (source.fromX !== undefined) ret.fromX = source.fromX
    if (source.fromY !== undefined) ret.fromY = source.fromY
    if (source.toX !== undefined) ret.toX = source.toX
    if (source.toY !== undefined) ret.toY = source.toY
    if (source.hasFrom !== undefined) ret.hasFrom = source.hasFrom
    if (source.hasTo !== undefined) ret.hasTo = source.hasTo
    return ret
}
/* ellipse attributes */
export function exportEllipse(source: types.Ellipse, depth?: number): resultTypes.Ellipse {
    const ret: resultTypes.Ellipse = {} as resultTypes.Ellipse
    ret.cx = source.cx
    ret.cy = source.cy
    ret.rx = source.rx
    ret.ry = source.ry
    return ret
}
export function exportFillMask_fills(source: types.FillMask_fills, depth?: number): resultTypes.FillMask_fills {
    const ret: resultTypes.FillMask_fills = []
    source.forEach((source) => {
        if (source.isEnabled) ret.push(exportFill(source, depth))
    })
    return ret
}
/* fill rule */
export function exportFillRule(source: types.FillRule, depth?: number): resultTypes.FillRule {
    return source
}
/* fill types */
export function exportFillType(source: types.FillType, depth?: number): resultTypes.FillType {
    return source
}
/* gradient type */
export function exportGradientType(source: types.GradientType, depth?: number): resultTypes.GradientType {
    return source
}
export function exportGradient_stops(source: types.Gradient_stops, depth?: number): resultTypes.Gradient_stops {
    const ret: resultTypes.Gradient_stops = []
    source.forEach((source) => {
        ret.push(exportStop(source, depth))
    })
    return ret
}
/* graphics contex settings */
export function exportGraphicsContextSettings(source: types.GraphicsContextSettings, depth?: number): resultTypes.GraphicsContextSettings {
    const ret: resultTypes.GraphicsContextSettings = {} as resultTypes.GraphicsContextSettings
    ret.blendMode = exportBlendMode(source.blendMode, depth)
    ret.opacity = source.opacity
    return ret
}
export function exportGroupShape_childs(source: types.GroupShape_childs, depth?: number): resultTypes.GroupShape_childs {
    const ret: resultTypes.GroupShape_childs = []
    source.forEach((source) => {
        if (!source.isVisible) return; // 不可见的不输出
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "group-shape") {
                return exportGroupShape(source as types.GroupShape, depth)
            }
            if (source.typeId === "path-shape") {
                return exportPathShape(source as types.PathShape, depth)
            }
            if (source.typeId === "rect-shape") {
                return exportRectShape(source as types.RectShape, depth)
            }
            if (source.typeId === "symbol-ref-shape") {
                return exportSymbolRefShape(source as types.SymbolRefShape, depth)
            }
            if (source.typeId === "symbol-shape") {
                return exportSymbolShape(source as types.SymbolShape, depth)
            }
            if (source.typeId === "symbol-union-shape") {
                return exportSymbolUnionShape(source as types.SymbolUnionShape, depth)
            }
            if (source.typeId === "text-shape") {
                return exportTextShape(source as types.TextShape, depth)
            }
            if (source.typeId === "artboard") {
                return exportArtboard(source as types.Artboard, depth)
            }
            if (source.typeId === "line-shape") {
                return exportLineShape(source as types.LineShape, depth)
            }
            if (source.typeId === "oval-shape") {
                return exportOvalShape(source as types.OvalShape, depth)
            }
            if (source.typeId === "contact-shape") {
                return exportContactShape(source as types.ContactShape, depth)
            }
            if (source.typeId === "shape") {
                return exportShape(source as types.Shape, depth)
            }
            if (source.typeId === "cutout-shape") {
                return exportCutoutShape(source as types.CutoutShape, depth)
            }
            if (source.typeId === "bool-shape") {
                return exportBoolShape(source as types.BoolShape, depth)
            }
            if (source.typeId === "polygon-shape") {
                return exportPolygonShape(source as types.PolygonShape, depth)
            }
            if (source.typeId === "star-shape") {
                return exportStarShape(source as types.StarShape, depth)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* guide axis */
export function exportGuideAxis(source: types.GuideAxis, depth?: number): resultTypes.GuideAxis {
    return source
}
/* guide */
export function exportGuide(source: types.Guide, depth?: number): resultTypes.Guide {
    const ret: resultTypes.Guide = {} as resultTypes.Guide
    ret.id = source.id
    ret.axis = exportGuideAxis(source.axis, depth)
    ret.offset = source.offset
    return ret
}
/* image scale mode */
export function exportImageScaleMode(source: types.ImageScaleMode, depth?: number): resultTypes.ImageScaleMode {
    return source
}
/* line cap style */
export function exportLineCapStyle(source: types.LineCapStyle, depth?: number): resultTypes.LineCapStyle {
    return source
}
/* line join style */
export function exportLineJoinStyle(source: types.LineJoinStyle, depth?: number): resultTypes.LineJoinStyle {
    return source
}
/* marker type */
export function exportMarkerType(source: types.MarkerType, depth?: number): resultTypes.MarkerType {
    return source
}
/* overlayBackgroundInteraction */
export function exportOverlayBackgroundInteraction(source: types.OverlayBackgroundInteraction, depth?: number): resultTypes.OverlayBackgroundInteraction {
    return source
}
/* interactionType */
export function exportOverlayBackgroundType(source: types.OverlayBackgroundType, depth?: number): resultTypes.OverlayBackgroundType {
    return source
}
/* overlay margin */
export function exportOverlayMargin(source: types.OverlayMargin, depth?: number): resultTypes.OverlayMargin {
    const ret: resultTypes.OverlayMargin = {} as resultTypes.OverlayMargin
    ret.top = source.top
    ret.bottom = source.bottom
    ret.left = source.left
    ret.right = source.right
    return ret
}
/* overlayPositionType */
export function exportOverlayPositionType(source: types.OverlayPositionType, depth?: number): resultTypes.OverlayPositionType {
    return source
}
/* overlay position */
export function exportOverlayPosition(source: types.OverlayPosition, depth?: number): resultTypes.OverlayPosition {
    const ret: resultTypes.OverlayPosition = {} as resultTypes.OverlayPosition
    ret.position = exportOverlayPositionType(source.position, depth)
    ret.margin = exportOverlayMargin(source.margin, depth)
    return ret
}
/* override types */
export function exportOverrideType(source: types.OverrideType, depth?: number): resultTypes.OverrideType {
    return source
}
/* padding */
export function exportPadding(source: types.Padding, depth?: number): resultTypes.Padding {
    const ret: resultTypes.Padding = {} as resultTypes.Padding
    if (source.left !== undefined) ret.left = source.left
    if (source.top !== undefined) ret.top = source.top
    if (source.right !== undefined) ret.right = source.right
    if (source.bottom !== undefined) ret.bottom = source.bottom
    return ret
}
/* page list item */
export function exportPageListItem(source: types.PageListItem, depth?: number): resultTypes.PageListItem {
    const ret: resultTypes.PageListItem = {} as resultTypes.PageListItem
    ret.id = source.id
    ret.name = source.name
    if (source.versionId !== undefined) ret.versionId = source.versionId
    return ret
}
export function exportPage_guides(source: types.Page_guides, depth?: number): resultTypes.Page_guides {
    const ret: resultTypes.Page_guides = []
    source.forEach((source) => {
        ret.push(exportGuide(source, depth))
    })
    return ret
}
export function exportPage_connections(source: types.Page_connections, depth?: number): resultTypes.Page_connections {
    const ret: resultTypes.Page_connections = []
    source.forEach((source) => {
        ret.push(exportConnection(source, depth))
    })
    return ret
}
/* paint filter */
export function exportPaintFilter(source: types.PaintFilter, depth?: number): resultTypes.PaintFilter {
    const ret: resultTypes.PaintFilter = {} as resultTypes.PaintFilter
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
export function exportPaintFilterType(source: types.PaintFilterType, depth?: number): resultTypes.PaintFilterType {
    return source
}
export function exportPara_spans(source: types.Para_spans, depth?: number): resultTypes.Para_spans {
    const ret: resultTypes.Para_spans = []
    source.forEach((source) => {
        ret.push(exportSpan(source, depth))
    })
    return ret
}
// export function exportPathSegment_points(source: types.PathSegment_points, depth?: number): resultTypes.PathSegment_points {
//     const ret: resultTypes.PathSegment_points = []
//     source.forEach((source) => {
//         ret.push(exportCurvePoint(source, depth))
//     })
//     return ret
// }
/* path segment */
export function exportPathSegment(source: types.PathSegment, size: types.ShapeSize, depth?: number): resultTypes.PathSegment {
    // 将curvePoint转换为svg path
    const path = parsePath(source.points, source.isClosed, size.width, size.height)
    return path.toString()
}
export function exportPathShape_pathsegs(source: types.PathShape_pathsegs, size: types.ShapeSize, depth?: number, ): resultTypes.PathShape_pathsegs {
    const ret: resultTypes.PathShape_pathsegs = []
    source.forEach((source) => {
        ret.push(exportPathSegment(source, size, depth))
    })
    return ret
}
// export function exportPathShape2_pathsegs(source: types.PathShape2_pathsegs, depth?: number): resultTypes.PathShape2_pathsegs {
//     const ret: resultTypes.PathShape2_pathsegs = []
//     source.forEach((source) => {
//         ret.push(exportPathSegment(source, depth))
//     })
//     return ret
// }
/* pattern transform */
export function exportPatternTransform(source: types.PatternTransform, depth?: number): resultTypes.PatternTransform {
    // const ret: resultTypes.PatternTransform = {} as resultTypes.PatternTransform
    // ret.m00 = source.m00
    // ret.m01 = source.m01
    // ret.m02 = source.m02
    // ret.m10 = source.m10
    // ret.m11 = source.m11
    // ret.m12 = source.m12
    // return ret
    return 'matrix(' + [source.m00, source.m10, source.m01, source.m11, source.m02, source.m12].join(',') + ')';
}
/* point 2d */
export function exportPoint2D(source: types.Point2D, depth?: number): resultTypes.Point2D {
    const ret: resultTypes.Point2D = {} as resultTypes.Point2D
    ret.x = source.x
    ret.y = source.y
    return ret
}
/* connectionType */
export function exportPrototypeConnectionType(source: types.PrototypeConnectionType, depth?: number): resultTypes.PrototypeConnectionType {
    return source
}
/* prototypeEasingBezier */
export function exportPrototypeEasingBezier(source: types.PrototypeEasingBezier, depth?: number): resultTypes.PrototypeEasingBezier {
    const ret: resultTypes.PrototypeEasingBezier = {} as resultTypes.PrototypeEasingBezier
    ret.x1 = source.x1
    ret.y1 = source.y1
    ret.x2 = source.x2
    ret.y2 = source.y2
    return ret
}
/* easingType */
export function exportPrototypeEasingType(source: types.PrototypeEasingType, depth?: number): resultTypes.PrototypeEasingType {
    return source
}
/* interactionType */
export function exportPrototypeEvents(source: types.PrototypeEvents, depth?: number): resultTypes.PrototypeEvents {
    return source
}
/* navigationType */
export function exportPrototypeNavigationType(source: types.PrototypeNavigationType, depth?: number): resultTypes.PrototypeNavigationType {
    return source
}
/* prototypeStartingPoint */
export function exportPrototypeStartingPoint(source: types.PrototypeStartingPoint, depth?: number): resultTypes.PrototypeStartingPoint {
    const ret: resultTypes.PrototypeStartingPoint = {} as resultTypes.PrototypeStartingPoint
    ret.name = source.name
    ret.desc = source.desc
    return ret
}
/* transitionType */
export function exportPrototypeTransitionType(source: types.PrototypeTransitionType, depth?: number): resultTypes.PrototypeTransitionType {
    return source
}
/* crdtidx */
export function exportRadius(source: types.Radius, depth?: number): resultTypes.Radius {
    const ret: resultTypes.Radius = []
    source.forEach((source) => {
        ret.push(source)
    })
    return ret
}
/* resize type */
export function exportResizeType(source: types.ResizeType, depth?: number): resultTypes.ResizeType {
    return source
}
/* scrollBehavior */
export function exportScrollBehavior(source: types.ScrollBehavior, depth?: number): resultTypes.ScrollBehavior {
    return source
}
/* scrollDirection */
export function exportScrollDirection(source: types.ScrollDirection, depth?: number): resultTypes.ScrollDirection {
    return source
}
export function exportShadowMask_shadows(source: types.ShadowMask_shadows, depth?: number): resultTypes.ShadowMask_shadows {
    const ret: resultTypes.ShadowMask_shadows = []
    source.forEach((source) => {
        ret.push(exportShadow(source, depth))
    })
    return ret
}
/* shadow position */
export function exportShadowPosition(source: types.ShadowPosition, depth?: number): resultTypes.ShadowPosition {
    return source
}
/* shadow */
export function exportShadow(source: types.Shadow, depth?: number): resultTypes.Shadow {
    const ret: resultTypes.Shadow = {} as resultTypes.Shadow
    ret.id = source.id
    ret.isEnabled = source.isEnabled
    ret.blurRadius = source.blurRadius
    ret.color = exportColor(source.color, depth)
    ret.offsetX = source.offsetX
    ret.offsetY = source.offsetY
    ret.spread = source.spread
    ret.position = exportShadowPosition(source.position, depth)
    if (source.contextSettings !== undefined) ret.contextSettings = exportGraphicsContextSettings(source.contextSettings, depth)
    if (source.mask !== undefined) ret.mask = source.mask
    return ret
}
/* shape frame
 * x,y为parent坐标系里的点
 * width,height为当前shape的坐标空间大小 */
export function exportShapeFrame(source: types.ShapeFrame, depth?: number): resultTypes.ShapeFrame {
    const ret: resultTypes.ShapeFrame = {} as resultTypes.ShapeFrame
    ret.x = source.x
    ret.y = source.y
    ret.width = source.width
    ret.height = source.height
    return ret
}
/* shape size */
export function exportShapeSize(source: types.ShapeSize, depth?: number): resultTypes.ShapeSize {
    const ret: resultTypes.ShapeSize = {} as resultTypes.ShapeSize
    ret.width = source.width
    ret.height = source.height
    return ret
}
/* shape types */
export function exportShapeType(source: types.ShapeType, depth?: number): resultTypes.ShapeType {
    return source as resultTypes.ShapeType
}
export function exportShape_prototypeInteractions(source: types.Shape_prototypeInteractions, depth?: number): resultTypes.Shape_prototypeInteractions {
    const ret: resultTypes.Shape_prototypeInteractions = []
    source.forEach((source) => {
        ret.push(exportPrototypeInteraction(source, depth))
    })
    return ret
}
/* side type */
export function exportSideType(source: types.SideType, depth?: number): resultTypes.SideType {
    return source
}
/* stack align */
export function exportStackAlign(source: types.StackAlign, depth?: number): resultTypes.StackAlign {
    return source
}
/* stack mode */
export function exportStackMode(source: types.StackMode, depth?: number): resultTypes.StackMode {
    return source
}
/* stack positioning */
export function exportStackPositioning(source: types.StackPositioning, depth?: number): resultTypes.StackPositioning {
    return source
}
/* stack size */
export function exportStackSize(source: types.StackSize, depth?: number): resultTypes.StackSize {
    const ret: resultTypes.StackSize = {} as resultTypes.StackSize
    ret.x = source.x
    ret.y = source.y
    return ret
}
/* stack sizing */
export function exportStackSizing(source: types.StackSizing, depth?: number): resultTypes.StackSizing {
    return source
}
/* stack wrap */
export function exportStackWrap(source: types.StackWrap, depth?: number): resultTypes.StackWrap {
    return source
}
/* stop */
export function exportStop(source: types.Stop, depth?: number): resultTypes.Stop {
    const ret: resultTypes.Stop = {} as resultTypes.Stop
    ret.id = source.id
    ret.position = source.position
    ret.color = exportColor(source.color, depth)
    return ret
}
/* strikethrough types */
export function exportStrikethroughType(source: types.StrikethroughType, depth?: number): resultTypes.StrikethroughType {
    return source
}
/* style library type */
export function exportStyleLibType(source: types.StyleLibType, depth?: number): resultTypes.StyleLibType {
    return source
}
export function exportStyleSheet_variables(source: types.StyleSheet_variables, depth?: number): resultTypes.StyleSheet_variables {
    const ret: resultTypes.StyleSheet_variables = []
    source.forEach((source) => {
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "fill-mask") {
                return exportFillMask(source as types.FillMask, depth)
            }
            if (source.typeId === "shadow-mask") {
                return exportShadowMask(source as types.ShadowMask, depth)
            }
            if (source.typeId === "blur-mask") {
                return exportBlurMask(source as types.BlurMask, depth)
            }
            if (source.typeId === "border-mask") {
                return exportBorderMask(source as types.BorderMask, depth)
            }
            if (source.typeId === "radius-mask") {
                return exportRadiusMask(source as types.RadiusMask, depth)
            }
            if (source.typeId === "text-mask") {
                return exportTextMask(source as types.TextMask, depth)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* shape types */
export function exportStyleVarType(source: types.StyleVarType, depth?: number): resultTypes.StyleVarType {
    return source
}
export function exportStyle_fills(source: types.Style_fills, depth?: number): resultTypes.Style_fills {
    const ret: resultTypes.Style_fills = []
    source.forEach((source) => {
        if (source.isEnabled) ret.push(exportFill(source, depth))
    })
    return ret
}
export function exportStyle_shadows(source: types.Style_shadows, depth?: number): resultTypes.Style_shadows {
    const ret: resultTypes.Style_shadows = []
    source.forEach((source) => {
        ret.push(exportShadow(source, depth))
    })
    return ret
}
export function exportStyle_innerShadows(source: types.Style_innerShadows, depth?: number): resultTypes.Style_innerShadows {
    const ret: resultTypes.Style_innerShadows = []
    source.forEach((source) => {
        ret.push(exportShadow(source, depth))
    })
    return ret
}
export function exportStyle_contacts(source: types.Style_contacts, depth?: number): resultTypes.Style_contacts {
    const ret: resultTypes.Style_contacts = []
    source.forEach((source) => {
        ret.push(exportContactRole(source, depth))
    })
    return ret
}
export function exportSymbolShape_guides(source: types.SymbolShape_guides, depth?: number): resultTypes.SymbolShape_guides {
    const ret: resultTypes.SymbolShape_guides = []
    source.forEach((source) => {
        ret.push(exportGuide(source, depth))
    })
    return ret
}
/* text behaviour */
export function exportTextBehaviour(source: types.TextBehaviour, depth?: number): resultTypes.TextBehaviour {
    return source
}
/* text horizontal alignment */
export function exportTextHorAlign(source: types.TextHorAlign, depth?: number): resultTypes.TextHorAlign {
    return source
}
/* text orientation */
export function exportTextOrientation(source: types.TextOrientation, depth?: number): resultTypes.TextOrientation {
    return source
}
/* text transform types */
export function exportTextTransformType(source: types.TextTransformType, depth?: number): resultTypes.TextTransformType {
    return source
}
/* text vertical alignment */
export function exportTextVerAlign(source: types.TextVerAlign, depth?: number): resultTypes.TextVerAlign {
    return source
}
export function exportText_paras(source: types.Text_paras, depth?: number): resultTypes.Text_paras {
    const ret: resultTypes.Text_paras = []
    source.forEach((source) => {
        ret.push(exportPara(source, depth))
    })
    return ret
}
/* transform */
export function exportTransform(source: types.Transform, depth?: number): resultTypes.Transform {
    // const ret: resultTypes.Transform = {} as resultTypes.Transform
    // ret.m00 = source.m00
    // ret.m01 = source.m01
    // ret.m02 = source.m02
    // ret.m10 = source.m10
    // ret.m11 = source.m11
    // ret.m12 = source.m12
    // return ret
    return 'matrix(' + [source.m00, source.m10, source.m01, source.m11, source.m02, source.m12].join(',') + ')';
}
/* underline types */
export function exportUnderlineType(source: types.UnderlineType, depth?: number): resultTypes.UnderlineType {
    return source
}
/* user infomation */
export function exportUserInfo(source: types.UserInfo, depth?: number): resultTypes.UserInfo {
    const ret: resultTypes.UserInfo = {} as resultTypes.UserInfo
    ret.userId = source.userId
    ret.userNickname = source.userNickname
    ret.avatar = source.avatar
    return ret
}
/* variable types */
export function exportVariableType(source: types.VariableType, depth?: number): resultTypes.VariableType {
    return source
}
export function exportVariable_0(source: types.Variable_0, depth?: number): resultTypes.Variable_0 {
    const ret: resultTypes.Variable_0 = []
    source.forEach((source) => {
        ret.push((() => {
            if (typeof source !== "object") {
                return source
            }
            if (source.typeId === "fill") {
                return exportFill(source as types.Fill, depth)
            }
            if (source.typeId === "shadow") {
                return exportShadow(source as types.Shadow, depth)
            }
            if (source.typeId === "prototype-interaction") {
                return exportPrototypeInteraction(source as types.PrototypeInteraction, depth)
            }
            throw new Error("unknow typeId: " + source.typeId)
        })())
    })
    return ret
}
/* winding rule */
export function exportWindingRule(source: types.WindingRule, depth?: number): resultTypes.WindingRule {
    return source
}
/* auto layout */
export function exportAutoLayout(source: types.AutoLayout, depth?: number): resultTypes.AutoLayout {
    const ret: resultTypes.AutoLayout = {} as resultTypes.AutoLayout
    ret.stackSpacing = source.stackSpacing
    ret.stackCounterSpacing = source.stackCounterSpacing
    ret.stackHorizontalPadding = source.stackHorizontalPadding
    ret.stackVerticalPadding = source.stackVerticalPadding
    ret.stackPaddingRight = source.stackPaddingRight
    ret.stackPaddingBottom = source.stackPaddingBottom
    ret.stackPrimarySizing = exportStackSizing(source.stackPrimarySizing, depth)
    if (source.stackMode !== undefined) ret.stackMode = exportStackMode(source.stackMode, depth)
    if (source.stackWrap !== undefined) ret.stackWrap = exportStackWrap(source.stackWrap, depth)
    if (source.stackHorizontalGapSizing !== undefined) ret.stackHorizontalGapSizing = exportStackSizing(source.stackHorizontalGapSizing, depth)
    if (source.stackVerticalGapSizing !== undefined) ret.stackVerticalGapSizing = exportStackSizing(source.stackVerticalGapSizing, depth)
    if (source.stackCounterSizing !== undefined) ret.stackCounterSizing = exportStackSizing(source.stackCounterSizing, depth)
    if (source.stackPrimaryAlignItems !== undefined) ret.stackPrimaryAlignItems = exportStackAlign(source.stackPrimaryAlignItems, depth)
    if (source.stackCounterAlignItems !== undefined) ret.stackCounterAlignItems = exportStackAlign(source.stackCounterAlignItems, depth)
    if (source.stackReverseZIndex !== undefined) ret.stackReverseZIndex = source.stackReverseZIndex
    if (source.bordersTakeSpace !== undefined) ret.bordersTakeSpace = source.bordersTakeSpace
    if (source.minSize !== undefined) ret.minSize = exportStackSize(source.minSize, depth)
    if (source.maxSize !== undefined) ret.maxSize = exportStackSize(source.maxSize, depth)
    return ret
}
/* blur */
export function exportBlur(source: types.Blur, depth?: number): resultTypes.Blur {
    const ret: resultTypes.Blur = {} as resultTypes.Blur
    ret.isEnabled = source.isEnabled
    ret.center = exportPoint2D(source.center, depth)
    ret.saturation = source.saturation
    ret.type = exportBlurType(source.type, depth)
    if (source.motionAngle !== undefined) ret.motionAngle = source.motionAngle
    if (source.radius !== undefined) ret.radius = source.radius
    return ret
}
/* border options */
export function exportBorderOptions(source: types.BorderOptions, depth?: number): resultTypes.BorderOptions {
    const ret: resultTypes.BorderOptions = {} as resultTypes.BorderOptions
    ret.lineCapStyle = exportLineCapStyle(source.lineCapStyle, depth)
    ret.lineJoinStyle = exportLineJoinStyle(source.lineJoinStyle, depth)
    return ret
}
/* border side setting */
export function exportBorderSideSetting(source: types.BorderSideSetting, depth?: number): resultTypes.BorderSideSetting {
    const ret: resultTypes.BorderSideSetting = {} as resultTypes.BorderSideSetting
    ret.sideType = exportSideType(source.sideType, depth)
    ret.thicknessTop = source.thicknessTop
    ret.thicknessLeft = source.thicknessLeft
    ret.thicknessBottom = source.thicknessBottom
    ret.thicknessRight = source.thicknessRight
    return ret
}
/* contact form */
export function exportContactForm(source: types.ContactForm, depth?: number): resultTypes.ContactForm {
    const ret: resultTypes.ContactForm = {} as resultTypes.ContactForm
    ret.contactType = exportContactType(source.contactType, depth)
    ret.shapeId = source.shapeId
    return ret
}
/* gradient */
export function exportGradient(source: types.Gradient, depth?: number): resultTypes.Gradient {
    const ret: resultTypes.Gradient = {} as resultTypes.Gradient
    ret.from = exportPoint2D(source.from, depth)
    ret.to = exportPoint2D(source.to, depth)
    ret.gradientType = exportGradientType(source.gradientType, depth)
    ret.stops = exportGradient_stops(source.stops, depth)
    if (source.elipseLength !== undefined) ret.elipseLength = source.elipseLength
    if (source.gradientOpacity !== undefined) ret.gradientOpacity = source.gradientOpacity
    return ret
}
/* overlay-background-appearance */
export function exportOverlayBackgroundAppearance(source: types.OverlayBackgroundAppearance, depth?: number): resultTypes.OverlayBackgroundAppearance {
    const ret: resultTypes.OverlayBackgroundAppearance = {} as resultTypes.OverlayBackgroundAppearance
    ret.backgroundType = exportOverlayBackgroundType(source.backgroundType, depth)
    ret.backgroundColor = exportColor(source.backgroundColor, depth)
    return ret
}
/* actions */
export function exportPrototypeActions(source: types.PrototypeActions, depth?: number): resultTypes.PrototypeActions {
    const ret: resultTypes.PrototypeActions = {} as resultTypes.PrototypeActions
    ret.connectionType = exportPrototypeConnectionType(source.connectionType, depth)
    ret.openUrlInNewTab = source.openUrlInNewTab
    if (source.targetNodeID !== undefined) ret.targetNodeID = source.targetNodeID
    if (source.transitionType !== undefined) ret.transitionType = exportPrototypeTransitionType(source.transitionType, depth)
    if (source.transitionDuration !== undefined) ret.transitionDuration = source.transitionDuration
    if (source.easingType !== undefined) ret.easingType = exportPrototypeEasingType(source.easingType, depth)
    if (source.connectionURL !== undefined) ret.connectionURL = source.connectionURL
    if (source.navigationType !== undefined) ret.navigationType = exportPrototypeNavigationType(source.navigationType, depth)
    if (source.easingFunction !== undefined) ret.easingFunction = exportPrototypeEasingBezier(source.easingFunction, depth)
    if (source.extraScrollOffset !== undefined) ret.extraScrollOffset = exportPoint2D(source.extraScrollOffset, depth)
    return ret
}
/* event */
export function exportPrototypeEvent(source: types.PrototypeEvent, depth?: number): resultTypes.PrototypeEvent {
    const ret: resultTypes.PrototypeEvent = {} as resultTypes.PrototypeEvent
    ret.interactionType = exportPrototypeEvents(source.interactionType, depth)
    if (source.transitionTimeout !== undefined) ret.transitionTimeout = source.transitionTimeout
    return ret
}
/* prototypeInteraction */
export function exportPrototypeInteraction(source: types.PrototypeInteraction, depth?: number): resultTypes.PrototypeInteraction {
    const ret: resultTypes.PrototypeInteraction = {} as resultTypes.PrototypeInteraction
    ret.event = exportPrototypeEvent(source.event, depth)
    ret.actions = exportPrototypeActions(source.actions, depth)
    if (source.id !== undefined) ret.id = source.id
    if (source.isDeleted !== undefined) ret.isDeleted = source.isDeleted
    return ret
}
/* radius mask */
export function exportRadiusMask(source: types.RadiusMask, depth?: number): resultTypes.RadiusMask {
    const ret: resultTypes.RadiusMask = {} as resultTypes.RadiusMask
    ret.sheet = source.sheet
    ret.id = source.id
    ret.name = source.name
    ret.description = source.description
    ret.radius = exportRadius(source.radius, depth)
    if (source.disabled !== undefined) ret.disabled = source.disabled
    return ret
}
/* shadow mask */
export function exportShadowMask(source: types.ShadowMask, depth?: number): resultTypes.ShadowMask {
    const ret: resultTypes.ShadowMask = {} as resultTypes.ShadowMask
    ret.sheet = source.sheet
    ret.id = source.id
    ret.name = source.name
    ret.description = source.description
    ret.shadows = exportShadowMask_shadows(source.shadows, depth)
    if (source.disabled !== undefined) ret.disabled = source.disabled
    return ret
}
/* span attr */
export function exportSpanAttr(source: types.SpanAttr, depth?: number): resultTypes.SpanAttr {
    const ret: resultTypes.SpanAttr = {} as resultTypes.SpanAttr
    if (source.fontName !== undefined) ret.fontName = source.fontName
    if (source.fontSize !== undefined) ret.fontSize = source.fontSize
    if (source.color !== undefined) ret.color = exportColor(source.color, depth)
    if (source.strikethrough !== undefined) ret.strikethrough = exportStrikethroughType(source.strikethrough, depth)
    if (source.underline !== undefined) ret.underline = exportUnderlineType(source.underline, depth)
    if (source.weight !== undefined) ret.weight = source.weight
    if (source.italic !== undefined) ret.italic = source.italic
    if (source.bulletNumbers !== undefined) ret.bulletNumbers = exportBulletNumbers(source.bulletNumbers, depth)
    if (source.highlight !== undefined) ret.highlight = exportColor(source.highlight, depth)
    if (source.kerning !== undefined) ret.kerning = source.kerning
    if (source.transform !== undefined) ret.transform = exportTextTransformType(source.transform, depth)
    if (source.placeholder !== undefined) ret.placeholder = source.placeholder
    if (source.fillType !== undefined) ret.fillType = exportFillType(source.fillType, depth)
    if (source.gradient !== undefined) ret.gradient = exportGradient(source.gradient, depth)
    if (source.textMask !== undefined) ret.textMask = source.textMask
    return ret
}
/* span attr */
export function exportSpan(source: types.Span, depth?: number): resultTypes.Span {
    const ret: resultTypes.Span = exportSpanAttr(source, depth) as resultTypes.Span
    ret.length = source.length
    return ret
}
/* blur mask */
export function exportBlurMask(source: types.BlurMask, depth?: number): resultTypes.BlurMask {
    const ret: resultTypes.BlurMask = {} as resultTypes.BlurMask
    ret.sheet = source.sheet
    ret.id = source.id
    ret.name = source.name
    ret.description = source.description
    ret.blur = exportBlur(source.blur, depth)
    if (source.disabled !== undefined) ret.disabled = source.disabled
    return ret
}
/* border mask type */
export function exportBorderMaskType(source: types.BorderMaskType, depth?: number): resultTypes.BorderMaskType {
    const ret: resultTypes.BorderMaskType = {} as resultTypes.BorderMaskType
    ret.typeId = "border-mask-type"
    ret.typeId = source.typeId
    ret.position = exportBorderPosition(source.position, depth)
    ret.sideSetting = exportBorderSideSetting(source.sideSetting, depth)
    return ret
}
/* border mask */
export function exportBorderMask(source: types.BorderMask, depth?: number): resultTypes.BorderMask {
    const ret: resultTypes.BorderMask = {} as resultTypes.BorderMask
    ret.sheet = source.sheet
    ret.id = source.id
    ret.name = source.name
    ret.description = source.description
    ret.border = exportBorderMaskType(source.border, depth)
    if (source.disabled !== undefined) ret.disabled = source.disabled
    return ret
}
/* fill */
export function exportFill(source: types.Fill, depth?: number): resultTypes.Fill {
    const ret: resultTypes.Fill = {} as resultTypes.Fill
    ret.fillType = exportFillType(source.fillType, depth)
    ret.color = exportColor(source.color, depth)
    if (source.contextSettings !== undefined) ret.contextSettings = exportContextSettings(source.contextSettings, depth)
    if (source.gradient !== undefined) ret.gradient = exportGradient(source.gradient, depth)
    if (source.imageRef !== undefined) ret.imageRef = source.imageRef
    if (source.fillRule !== undefined) ret.fillRule = exportFillRule(source.fillRule, depth)
    if (source.imageScaleMode !== undefined) ret.imageScaleMode = exportImageScaleMode(source.imageScaleMode, depth)
    if (source.rotation !== undefined) ret.rotation = source.rotation
    if (source.scale !== undefined) ret.scale = source.scale
    if (source.originalImageWidth !== undefined) ret.originalImageWidth = source.originalImageWidth
    if (source.originalImageHeight !== undefined) ret.originalImageHeight = source.originalImageHeight
    if (source.paintFilter !== undefined) ret.paintFilter = exportPaintFilter(source.paintFilter, depth)
    if (source.transform !== undefined) ret.transform = exportPatternTransform(source.transform, depth)
    return ret
}
/* span attr */
export function exportParaAttr(source: types.ParaAttr, depth?: number): resultTypes.ParaAttr {
    const ret: resultTypes.ParaAttr = exportSpanAttr(source, depth) as resultTypes.ParaAttr
    if (source.alignment !== undefined) ret.alignment = exportTextHorAlign(source.alignment, depth)
    if (source.paraSpacing !== undefined) ret.paraSpacing = source.paraSpacing
    if (source.minimumLineHeight !== undefined) ret.minimumLineHeight = source.minimumLineHeight
    if (source.maximumLineHeight !== undefined) ret.maximumLineHeight = source.maximumLineHeight
    if (source.autoLineHeight !== undefined) ret.autoLineHeight = source.autoLineHeight
    if (source.indent !== undefined) ret.indent = source.indent
    return ret
}
/* para */
export function exportPara(source: types.Para, depth?: number): resultTypes.Para {
    const ret: resultTypes.Para = {} as resultTypes.Para
    ret.text = source.text
    ret.spans = exportPara_spans(source.spans, depth)
    if (source.attr !== undefined) ret.attr = exportParaAttr(source.attr, depth)
    return ret
}
/* text attr */
export function exportTextAttr(source: types.TextAttr, depth?: number): resultTypes.TextAttr {
    const ret: resultTypes.TextAttr = exportParaAttr(source, depth) as resultTypes.TextAttr
    if (source.verAlign !== undefined) ret.verAlign = exportTextVerAlign(source.verAlign, depth)
    if (source.orientation !== undefined) ret.orientation = exportTextOrientation(source.orientation, depth)
    if (source.textBehaviour !== undefined) ret.textBehaviour = exportTextBehaviour(source.textBehaviour, depth)
    if (source.padding !== undefined) ret.padding = exportPadding(source.padding, depth)
    return ret
}
/* text mask */
export function exportTextMask(source: types.TextMask, depth?: number): resultTypes.TextMask {
    const ret: resultTypes.TextMask = {} as resultTypes.TextMask
    ret.sheet = source.sheet
    ret.id = source.id
    ret.name = source.name
    ret.description = source.description
    ret.text = exportTextAttr(source.text, depth)
    if (source.disabled !== undefined) ret.disabled = source.disabled
    return ret
}
/* text */
export function exportText(source: types.Text, depth?: number): resultTypes.Text {
    const ret: resultTypes.Text = {} as resultTypes.Text
    ret.paras = exportText_paras(source.paras, depth)
    if (source.attr !== undefined) ret.attr = exportTextAttr(source.attr, depth)
    if (source.fixed !== undefined) ret.fixed = source.fixed
    return ret
}
/* border */
export function exportBorder(source: types.Border, depth?: number): resultTypes.Border {
    const ret: resultTypes.Border = {} as resultTypes.Border
    ret.position = exportBorderPosition(source.position, depth)
    ret.borderStyle = exportBorderStyle(source.borderStyle, depth)
    ret.cornerType = exportCornerType(source.cornerType, depth)
    ret.sideSetting = exportBorderSideSetting(source.sideSetting, depth)
    ret.strokePaints = exportBorder_strokePaints(source.strokePaints, depth)
    if (source.fillsMask !== undefined) ret.fillsMask = source.fillsMask
    return ret
}
/* fill mask */
export function exportFillMask(source: types.FillMask, depth?: number): resultTypes.FillMask {
    const ret: resultTypes.FillMask = {} as resultTypes.FillMask
    ret.sheet = source.sheet
    ret.id = source.id
    ret.name = source.name
    ret.description = source.description
    ret.fills = exportFillMask_fills(source.fills, depth)
    if (source.disabled !== undefined) ret.disabled = source.disabled
    return ret
}
/* style sheet */
export function exportStyleSheet(source: types.StyleSheet, depth?: number): resultTypes.StyleSheet {
    const ret: resultTypes.StyleSheet = {} as resultTypes.StyleSheet
    ret.id = source.id
    ret.name = source.name
    ret.variables = exportStyleSheet_variables(source.variables, depth)
    return ret
}
/* style */
export function exportStyle(source: types.Style, depth?: number): resultTypes.Style {
    const ret: resultTypes.Style = {} as resultTypes.Style
    if (source.fills.length > 0) {
        const fills = exportStyle_fills(source.fills, depth)
        if (fills.length > 0) {
            ret.fills = fills
        }
    }
    if (source.shadows.length > 0) {
        const shadows = exportStyle_shadows(source.shadows, depth)
        if (shadows.length > 0) {
            ret.shadows = shadows
        }
    }
    if (source.borders && source.borders.strokePaints.length > 0) {
        const borders = exportBorder(source.borders, depth)
        if (borders.strokePaints.length > 0) { // 非isEnabled的也会过滤掉
            ret.borders = borders
        }
    }
    // if (source.miterLimit !== undefined) ret.miterLimit = source.miterLimit
    // if (source.windingRule !== undefined) ret.windingRule = exportWindingRule(source.windingRule, depth)
    if (source.blur !== undefined) ret.blur = exportBlur(source.blur, depth)
    if (source.borderOptions !== undefined && source.borderOptions.isEnabled) ret.borderOptions = exportBorderOptions(source.borderOptions, depth)
    if (source.colorControls !== undefined) ret.colorControls = exportColorControls(source.colorControls, depth)
    if (source.contextSettings !== undefined) ret.contextSettings = exportContextSettings(source.contextSettings, depth)
    if (source.innerShadows !== undefined) ret.innerShadows = exportStyle_innerShadows(source.innerShadows, depth)
    // if (source.contacts !== undefined) ret.contacts = exportStyle_contacts(source.contacts, depth)
    // if (source.startMarkerType !== undefined) ret.startMarkerType = exportMarkerType(source.startMarkerType, depth)
    // if (source.endMarkerType !== undefined) ret.endMarkerType = exportMarkerType(source.endMarkerType, depth)
    // if (source.varbinds !== undefined) ret.varbinds = (() => {
    //     const ret: any = {}
    //     source.varbinds.forEach((source, k) => {
    //         ret[k] = source
    //     })
    //     return ret
    // })()
    if (source.fillsMask !== undefined) ret.fillsMask = source.fillsMask
    if (source.shadowsMask !== undefined) ret.shadowsMask = source.shadowsMask
    if (source.blursMask !== undefined) ret.blursMask = source.blursMask
    if (source.bordersMask !== undefined) ret.bordersMask = source.bordersMask
    return ret
}
/* color */
export function exportVariable(source: types.Variable, depth?: number): resultTypes.Variable {
    const ret: resultTypes.Variable = {} as resultTypes.Variable
    ret.id = source.id
    ret.type = exportVariableType(source.type, depth)
    ret.name = source.name
    ret.value = (() => {
        if (typeof source.value !== "object" || source.value == null) {
            return source.value == null ? undefined : source.value
        }
        if (Array.isArray(source.value)) {
            return exportVariable_0(source.value, depth)
        }
        if (source.value.typeId === "color") {
            return exportColor(source.value as types.Color, depth)
        }
        if (source.value.typeId === "text") {
            return exportText(source.value as types.Text, depth)
        }
        if (source.value.typeId === "gradient") {
            return exportGradient(source.value as types.Gradient, depth)
        }
        if (source.value.typeId === "style") {
            return exportStyle(source.value as types.Style, depth)
        }
        if (source.value.typeId === "border") {
            return exportBorder(source.value as types.Border, depth)
        }
        if (source.value.typeId === "context-settings") {
            return exportContextSettings(source.value as types.ContextSettings, depth)
        }
        if (source.value.typeId === "corner-radius") {
            return exportCornerRadius(source.value as types.CornerRadius, depth)
        }
        if (source.value.typeId === "blur") {
            return exportBlur(source.value as types.Blur, depth)
        }
        if (source.value.typeId === "auto-layout") {
            return exportAutoLayout(source.value as types.AutoLayout, depth)
        }
        throw new Error("unknow typeId: " + source.value.typeId)
    })()
    return ret
}
/* shape */
export function exportShape(source: types.Shape, depth?: number): resultTypes.Shape {
    const ret: resultTypes.Shape = {} as resultTypes.Shape
    ret.id = source.id
    ret.name = source.name
    ret.type = exportShapeType(source.type, depth)
    ret.transform = exportTransform(source.transform, depth)
    ret.style = exportStyle(source.style, depth)
    if (source.boolOp !== undefined) ret.boolOp = exportBoolOp(source.boolOp, depth)
    if (source.isFixedToViewport !== undefined) ret.isFixedToViewport = source.isFixedToViewport
    // if (source.nameIsFixed !== undefined) ret.nameIsFixed = source.nameIsFixed
    // if (source.resizingConstraint !== undefined) ret.resizingConstraint = source.resizingConstraint
    // if (source.resizingType !== undefined) ret.resizingType = exportResizeType(source.resizingType, depth)
    // if (source.constrainerProportions !== undefined) ret.constrainerProportions = source.constrainerProportions
    // if (source.clippingMaskMode !== undefined) ret.clippingMaskMode = source.clippingMaskMode
    // if (source.hasClippingMask !== undefined) ret.hasClippingMask = source.hasClippingMask
    // if (source.shouldBreakMaskChain !== undefined) ret.shouldBreakMaskChain = source.shouldBreakMaskChain
    // if (source.varbinds !== undefined) ret.varbinds = (() => {
    //     const ret: any = {}
    //     source.varbinds.forEach((source, k) => {
    //         ret[k] = source
    //     })
    //     return ret
    // })()
    // if (source.haveEdit !== undefined) ret.haveEdit = source.haveEdit
    // if (source.prototypeStartingPoint !== undefined) ret.prototypeStartingPoint = exportPrototypeStartingPoint(source.prototypeStartingPoint, depth)
    // if (source.prototypeInteractions !== undefined) ret.prototypeInteractions = exportShape_prototypeInteractions(source.prototypeInteractions, depth)
    // if (source.overlayPosition !== undefined) ret.overlayPosition = exportOverlayPosition(source.overlayPosition, depth)
    // if (source.overlayBackgroundInteraction !== undefined) ret.overlayBackgroundInteraction = exportOverlayBackgroundInteraction(source.overlayBackgroundInteraction, depth)
    // if (source.overlayBackgroundAppearance !== undefined) ret.overlayBackgroundAppearance = exportOverlayBackgroundAppearance(source.overlayBackgroundAppearance, depth)
    // if (source.scrollDirection !== undefined) ret.scrollDirection = exportScrollDirection(source.scrollDirection, depth)
    // if (source.scrollBehavior !== undefined) ret.scrollBehavior = exportScrollBehavior(source.scrollBehavior, depth)
    // if (source.mask !== undefined) ret.mask = source.mask
    // if (source.stackPositioning !== undefined) ret.stackPositioning = exportStackPositioning(source.stackPositioning, depth)
    // if (source.radiusMask !== undefined) ret.radiusMask = source.radiusMask
    return ret
}
/* symbol ref shape */
export function exportSymbolRefShape(source: types.SymbolRefShape, depth?: number): resultTypes.SymbolRefShape {
    const ret: resultTypes.SymbolRefShape = exportShape(source, depth) as resultTypes.SymbolRefShape
    ret.size = exportShapeSize(source.size, depth)
    ret.refId = source.refId
    ret.variables = (() => {
        const ret: any = {}
        source.variables.forEach((source, k) => {
            ret[k] = exportVariable(source, depth)
        })
        return ret
    })()
    if (source.overrides !== undefined) ret.overrides = (() => {
        const ret: any = {}
        source.overrides.forEach((source, k) => {
            ret[k] = source
        })
        return ret
    })()
    if (source.isCustomSize !== undefined) ret.isCustomSize = source.isCustomSize
    if (source.cornerRadius !== undefined) ret.cornerRadius = exportCornerRadius(source.cornerRadius, depth)
    if (source.innerEnvScale !== undefined) ret.innerEnvScale = source.innerEnvScale
    if (source.uniformScale !== undefined) ret.uniformScale = source.uniformScale
    return ret
}
/* text shape */
export function exportTextShape(source: types.TextShape, depth?: number): resultTypes.TextShape {
    const ret: resultTypes.TextShape = exportShape(source, depth) as resultTypes.TextShape
    ret.size = exportShapeSize(source.size, depth)
    ret.text = exportText(source.text, depth)
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    return ret
}
/* comment */
export function exportComment(source: types.Comment, depth?: number): resultTypes.Comment {
    const ret: resultTypes.Comment = {} as resultTypes.Comment
    ret.pageId = source.pageId
    ret.id = source.id
    ret.frame = exportShapeFrame(source.frame, depth)
    ret.user = exportUserInfo(source.user, depth)
    ret.createAt = source.createAt
    ret.content = source.content
    ret.parasiticBody = exportShape(source.parasiticBody, depth)
    if (source.parentId !== undefined) ret.parentId = source.parentId
    if (source.rootId !== undefined) ret.rootId = source.rootId
    return ret
}
/* path shape */
export function exportPathShape(source: types.PathShape, depth?: number): resultTypes.PathShape {
    const ret: resultTypes.PathShape = exportShape(source, depth) as resultTypes.PathShape
    ret.size = exportShapeSize(source.size, depth)
    ret.paths = exportPathShape_pathsegs(source.pathsegs, source.size, depth)
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    return ret
}
/* path shape */
// export function exportPathShape2(source: types.PathShape2, depth?: number): resultTypes.PathShape2 {
//     const ret: resultTypes.PathShape2 = exportShape(source, depth) as resultTypes.PathShape2
//     ret.size = exportShapeSize(source.size, depth)
//     ret.pathsegs = exportPathShape2_pathsegs(source.pathsegs, depth)
//     if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
//     return ret
// }
/* polygon shape */
export function exportPolygonShape(source: types.PolygonShape, depth?: number): resultTypes.PolygonShape {
    const ret: resultTypes.PolygonShape = exportPathShape(source, depth) as resultTypes.PolygonShape
    ret.counts = source.counts
    return ret
}
/* rect shape */
export function exportRectShape(source: types.RectShape, depth?: number): resultTypes.RectShape {
    const ret: resultTypes.RectShape = exportPathShape(source, depth) as resultTypes.RectShape
    return ret
}
/* star shape */
export function exportStarShape(source: types.StarShape, depth?: number): resultTypes.StarShape {
    const ret: resultTypes.StarShape = exportPathShape(source, depth) as resultTypes.StarShape
    ret.counts = source.counts
    ret.innerAngle = source.innerAngle
    return ret
}
/* connection */
export function exportConnection(source: types.Connection, depth?: number): resultTypes.Connection {
    const ret: resultTypes.Connection = exportPathShape(source, depth) as resultTypes.Connection
    ret.isEdited = source.isEdited
    if (source.from !== undefined) ret.from = exportContactForm(source.from, depth)
    if (source.to !== undefined) ret.to = exportContactForm(source.to, depth)
    return ret
}
/* contact shape */
export function exportContactShape(source: types.ContactShape, depth?: number): resultTypes.ContactShape {
    const ret: resultTypes.ContactShape = exportPathShape(source, depth) as resultTypes.ContactShape
    ret.isEdited = source.isEdited
    ret.text = exportText(source.text, depth)
    ret.mark = source.mark
    if (source.from !== undefined) ret.from = exportContactForm(source.from, depth)
    if (source.to !== undefined) ret.to = exportContactForm(source.to, depth)
    return ret
}
/* cutout shape */
export function exportCutoutShape(source: types.CutoutShape, depth?: number): resultTypes.CutoutShape {
    const ret: resultTypes.CutoutShape = exportPathShape(source, depth) as resultTypes.CutoutShape
    return ret
}
/* line shape */
export function exportLineShape(source: types.LineShape, depth?: number): resultTypes.LineShape {
    const ret: resultTypes.LineShape = exportPathShape(source, depth) as resultTypes.LineShape
    return ret
}
/* oval shape */
export function exportOvalShape(source: types.OvalShape, depth?: number): resultTypes.OvalShape {
    const ret: resultTypes.OvalShape = exportPathShape(source, depth) as resultTypes.OvalShape
    ret.ellipse = exportEllipse(source.ellipse, depth)
    if (source.startingAngle !== undefined) ret.startingAngle = source.startingAngle
    if (source.endingAngle !== undefined) ret.endingAngle = source.endingAngle
    if (source.innerRadius !== undefined) ret.innerRadius = source.innerRadius
    return ret
}
/* artboard shape */
export function exportArtboard(source: types.Artboard, depth?: number): resultTypes.Artboard {
    const ret: resultTypes.Artboard = exportGroupShape(source, depth) as resultTypes.Artboard
    ret.size = exportShapeSize(source.size, depth)
    if (source.cornerRadius !== undefined) ret.cornerRadius = exportCornerRadius(source.cornerRadius, depth)
    if (source.guides !== undefined) ret.guides = exportArtboard_guides(source.guides, depth)
    if (source.autoLayout !== undefined) ret.autoLayout = exportAutoLayout(source.autoLayout, depth)
    if (source.frameMaskDisabled !== undefined) ret.frameMaskDisabled = source.frameMaskDisabled
    return ret
}
/* bool shape */
export function exportBoolShape(source: types.BoolShape, depth?: number): resultTypes.BoolShape {
    const ret: resultTypes.BoolShape = exportGroupShape(source, depth) as resultTypes.BoolShape
    return ret
}
/* group shape */
export function exportGroupShape(source: types.GroupShape, depth?: number): resultTypes.GroupShape {
    const ret: resultTypes.GroupShape = exportShape(source, depth) as resultTypes.GroupShape
    let export_childs = true;
    if (depth !== undefined) {
        --depth;
        if (depth < 0) {
            export_childs = false;
        }
    }
    if (export_childs && source.childs.length > 0) {
        ret.childs = exportGroupShape_childs(source.childs, depth)
    }
    ret.hasChilds = source.childs.length > 0;
    if (source.fixedRadius !== undefined) ret.fixedRadius = source.fixedRadius
    return ret
}
/* page */
export function exportPage(source: types.Page, depth?: number): resultTypes.Page {
    const ret: resultTypes.Page = exportGroupShape(source, depth) as resultTypes.Page
    if (source.backgroundColor !== undefined) ret.backgroundColor = exportColor(source.backgroundColor, depth)
    if (source.guides !== undefined) ret.guides = exportPage_guides(source.guides, depth)
    if (source.connections !== undefined) ret.connections = exportPage_connections(source.connections, depth)
    return ret
}
/* symbol shape */
export function exportSymbolShape(source: types.SymbolShape, depth?: number): resultTypes.SymbolShape {
    const ret: resultTypes.SymbolShape = exportGroupShape(source, depth) as resultTypes.SymbolShape
    ret.size = exportShapeSize(source.size, depth)
    ret.variables = (() => {
        const ret: any = {}
        source.variables.forEach((source, k) => {
            ret[k] = exportVariable(source, depth)
        })
        return ret
    })()
    if (source.symtags !== undefined) ret.symtags = (() => {
        const ret: any = {}
        source.symtags.forEach((source, k) => {
            ret[k] = source
        })
        return ret
    })()
    if (source.cornerRadius !== undefined) ret.cornerRadius = exportCornerRadius(source.cornerRadius, depth)
    if (source.guides !== undefined) ret.guides = exportSymbolShape_guides(source.guides, depth)
    if (source.autoLayout !== undefined) ret.autoLayout = exportAutoLayout(source.autoLayout, depth)
    if (source.frameMaskDisabled !== undefined) ret.frameMaskDisabled = source.frameMaskDisabled
    return ret
}
/* symbol union shape */
export function exportSymbolUnionShape(source: types.SymbolUnionShape, depth?: number): resultTypes.SymbolUnionShape {
    const ret: resultTypes.SymbolUnionShape = exportSymbolShape(source, depth) as resultTypes.SymbolUnionShape
    return ret
}