/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    Artboard,
    BasicArray,
    BasicMap,
    BlendMode,
    Blur,
    BlurType,
    BoolOp,
    BoolShape,
    Border,
    BorderPosition,
    BorderSideSetting,
    BorderStyle,
    ContextSettings,
    CornerRadius,
    CornerType,
    CurveMode,
    CurvePoint,
    CutoutShape,
    ExportFileFormat,
    ExportFormat,
    ExportFormatNameingScheme,
    ExportOptions,
    ExportVisibleScaleType,
    Fill,
    FillRule,
    FillType,
    Gradient,
    GradientType,
    GroupShape, ImageScaleMode,
    MarkerType,
    OvalShape,
    OverrideType,
    Page,
    PathSegment,
    PathShape,
    PatternTransform,
    Point2D,
    PolygonShape,
    RectShape,
    ResizingConstraints2,
    Shadow,
    ShadowPosition,
    Shape,
    ShapeFrame,
    ShapeSize,
    ShapeType,
    SideType,
    StarShape,
    Stop,
    Style,
    SymbolRefShape,
    SymbolShape,
    SymbolUnionShape,
    Text,
    TextShape,
    Transform,
    Variable,
    VariableType,
} from "../../../data";
import { uuid } from "../../../basic/uuid";
import { IJSON, ImportFun, LoadContext } from "./basic";
import * as shapeCreator from "../../../editor/creator/creator";
import * as types from "../../../data/typesdefine";
import { v4 } from "uuid";
import { float_accuracy } from "../../../basic/consts";
import { ColVector3D } from "../../../basic/matrix2";
import { getPolygonPoints, getPolygonVertices } from "../../../editor/utils/path";
import { importText } from "./textio";
import { importColor } from "./common";

export function toStrId(id?: {
    localID: string,
    sessionID: string,
}) {
    if (!id) return '';
    return [id.localID, id.sessionID].join(',');
}

function makeTransform(transform: IJSON) {
    return new Transform(transform.m00, transform.m01, transform.m02, transform.m10, transform.m11, transform.m12)
}

export function parseGradient(
    data: IJSON,
    size = { x: 1, y: 1 },
) {
    const type = data.type;
    const transform = data.transform ? makeTransform(data.transform).getInverse() : new Transform();
    const stops = data.stops as {
        color: {
            r: number,
            g: number,
            b: number,
            a: number,
        },
        position: number,
    }[];
    const opacity = data.opacity;

    if (type === 'GRADIENT_LINEAR') {
        const ps = transform.transform([
            ColVector3D.FromXY(0, 0.5),
            ColVector3D.FromXY(1, 0.5),
        ]);
        const from = ps[0]
        const to = ps[1]

        const from1 = new Point2D(from.x, from.y);
        const to1 = new Point2D(to.x, to.y);
        const colorType = GradientType.Linear;
        const stops1 = stops.map((item, i) => {
            return new Stop([i] as BasicArray<number>, uuid(), item.position, importColor(item.color))
        }) as BasicArray<Stop>;

        return new Gradient(from1, to1, colorType, stops1 as BasicArray<Stop>, undefined, opacity);
    } else if (type === 'GRADIENT_RADIAL' || type === 'GRADIENT_ANGULAR') {
        const ps = transform.transform([
            ColVector3D.FromXY(0.5, 0.5),
            ColVector3D.FromXY(1, 0.5),
        ]);
        const from = ps[0]
        const to = ps[1]
        const decompose = transform.decomposeScale();

        const from1 = new Point2D(from.x, from.y);
        const to1 = new Point2D(to.x, to.y);
        const colorType = type === 'GRADIENT_RADIAL' ? GradientType.Radial : GradientType.Angular;
        const elipseLength = decompose.y / decompose.x * size.y / size.x;
        const stops1 = stops.map((item, i) => {
            return new Stop([i] as BasicArray<number>, uuid(), item.position, importColor(item.color))
        }) as BasicArray<Stop>;

        return new Gradient(from1, to1, colorType, stops1 as BasicArray<Stop>, elipseLength, opacity);
    }
}

function setGradient(
    data: IJSON,
    size: any,
    item: Fill,
) {
    const gradient = parseGradient(data, size);
    if (gradient) {
        item.gradient = gradient;
        item.fillType = FillType.Gradient;
    }
}

const fillStyleKeys = [
    'fillPaints',
]

function hasFillProp(data: any) {
    return fillStyleKeys.some(key => key in data);
}

function parseFills(
    ctx: LoadContext,
    fills: {
        fillPaints: IJSON[],
    },
    fillsIndex: number = 0,
    size?: { x: number, y: number },
) {
    const fillPaints = fills.fillPaints;
    if (!Array.isArray(fillPaints)) return;
    size = size || { x: 1, y: 1 };

    const result = new BasicArray<Fill>();
    for (let i = 0; i < fillPaints.length; i++) {
        const fill = fillPaints[i];
        const type = fill.type;

        const opacity = fill.opacity;
        const visible = fill.visible;
        const blendMode = fill.blendMode;

        const color = fill.color || {
            r: 1,
            g: 1,
            b: 1,
            a: 1,
        };
        const f = new Fill([fillsIndex + i] as BasicArray<number>, uuid(), visible, FillType.SolidColor, importColor(color, opacity));
        f.fillRule = FillRule.Nonzero;

        setGradient(fill, size, f);

        const imageHash = fill.image?.hash;
        if (type === 'IMAGE' && (imageHash instanceof Uint8Array)) {
            f.setImageMgr(ctx.mediasMgr);
            f.fillType = FillType.Pattern;
            let hexString = "";
            for (let i = 0; i < imageHash.length; i++) {
                hexString += imageHash[i].toString(16).padStart(2, '0');
            }
            f.imageRef = `${hexString}.png`;

            let imageScaleMode;
            if (fill.imageScaleMode === 'FILL') imageScaleMode = ImageScaleMode.Fill;
            else if (fill.imageScaleMode === 'STRETCH') imageScaleMode = ImageScaleMode.Stretch;
            else if (fill.imageScaleMode === 'FIT') imageScaleMode = ImageScaleMode.Fit;
            else if (fill.imageScaleMode === 'CROP') imageScaleMode = ImageScaleMode.Crop;
            else if (fill.imageScaleMode === 'TILE') imageScaleMode = ImageScaleMode.Tile;
            else imageScaleMode = ImageScaleMode.Fill;
            f.imageScaleMode = imageScaleMode;

            f.originalImageWidth = fill.originalImageWidth;
            f.originalImageHeight = fill.originalImageHeight;
            f.scale = fill.scale;
            const t = fill.transform;
            if (t) f.transform = new PatternTransform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12);
        }

        result.push(f);
    }

    return result;
}

function importFills(ctx: LoadContext, style: Style, data: IJSON) {
    const fills = parseFills(ctx, data as any, style.fills.length, data.size);
    if (fills) style.fills.push(...fills);
}


const strokeStyleKeys = [
    'strokePaints', 'strokeAlign', 'strokeWeight', 'strokeJoin', 'dashPattern', 'borderStrokeWeightsIndependent',
    'borderTopWeight', 'borderBottomWeight', 'borderLeftWeight', 'borderRightWeight',
]

function hasStrokeProp(data: any) {
    return strokeStyleKeys.some(key => key in data);
}

function parseStroke(strokes: {
    strokePaints: IJSON[],
    strokeAlign: string,
    strokeWeight: number,
    strokeJoin: string,
    dashPattern: number[],
    borderStrokeWeightsIndependent?: boolean,
    borderTopWeight?: number,
    borderBottomWeight?: number,
    borderLeftWeight?: number,
    borderRightWeight?: number,
}, strokesIndex: number = 0, size?: IJSON) {
    const strokePaints = strokes.strokePaints;
    if (!Array.isArray(strokePaints)) return;

    const strokeAlign = strokes.strokeAlign;
    const strokeWeight = strokes.strokeWeight;
    const strokeJoin = strokes.strokeJoin;
    const dashPattern = strokes.dashPattern || [0, 0];
    let position: BorderPosition;
    if (strokeAlign === "INSIDE") position = BorderPosition.Inner;
    else if (strokeAlign === "CENTER") position = BorderPosition.Center;
    else position = BorderPosition.Outer;

    const borderStyle = new BorderStyle(dashPattern[0], dashPattern[1]);
    const thicknessTop = strokes.borderStrokeWeightsIndependent ? (strokes.borderTopWeight || 0) : strokeWeight;
    const thicknessBottom = strokes.borderStrokeWeightsIndependent ? (strokes.borderBottomWeight || 0) : strokeWeight;
    const thicknessLeft = strokes.borderStrokeWeightsIndependent ? (strokes.borderLeftWeight || 0) : strokeWeight;
    const thicknessRight = strokes.borderStrokeWeightsIndependent ? (strokes.borderRightWeight || 0) : strokeWeight;
    let sideType = SideType.Normal;
    if (strokes.borderStrokeWeightsIndependent) {
        if ([thicknessTop, thicknessBottom, thicknessLeft, thicknessRight].filter(item => item !== 0).length === 1) {
            if (thicknessTop !== 0) sideType = SideType.Top;
            else if (thicknessBottom !== 0) sideType = SideType.Bottom;
            else if (thicknessLeft !== 0) sideType = SideType.Left;
            else if (thicknessRight !== 0) sideType = SideType.Right;
        } else {
            sideType = SideType.Custom;
        }
    }
    const side = new BorderSideSetting(sideType, thicknessTop, thicknessLeft, thicknessBottom, thicknessRight);

    let cornerType: CornerType;
    if (strokeJoin) {
        if (strokeJoin === "MITER") cornerType = CornerType.Miter;
        else if (strokeJoin === "ROUND") cornerType = CornerType.Round;
        else cornerType = CornerType.Bevel;
    } else {
        cornerType = CornerType.Miter;
    }
    const result = new BasicArray<Fill>();
    for (let i = 0; i < strokePaints.length; i++) {
        const stroke = strokePaints[i];
        const visible = stroke.visible;
        const blendMode = stroke.blendMode;
        const color = stroke.color || {
            r: 1,
            g: 1,
            b: 1,
            a: 1,
        }
        const opacity = stroke.opacity;

        const strokePaint = new Fill(
            [strokesIndex + i] as BasicArray<number>,
            uuid(),
            visible,
            FillType.SolidColor,
            importColor(color, opacity),
        );

        setGradient(stroke, size, strokePaint);

        result.push(strokePaint);
    }

    return new Border(
        position,
        borderStyle,
        cornerType,
        side,
        result
    );
}

function importStroke(ctx: LoadContext, style: Style, data: IJSON) {
    const strokes = parseStroke(data as any, style.fills.length, data.size);
    if (strokes) style.borders = strokes;
}


const effectStyleKeys = [
    'effects',
]

function hasEffectProp(data: any) {
    return effectStyleKeys.some(key => key in data);
}

function parseEffects(effects0: {
    effects: IJSON[],
}, effectsIndex: number = 0) {
    const effects = effects0.effects;
    if (!Array.isArray(effects)) return;

    const result = new BasicArray<Shadow>();
    for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        const type = effect.type;

        const visible = effect.visible;
        const blendMode = effect.blendMode;

        const color = effect.color;
        const offset = effect.offset;
        const radius = effect.radius;
        const spread = effect.spread;
        const showShadowBehindNode = effect.showShadowBehindNode;

        let shadowType;
        if (type === 'DROP_SHADOW') shadowType = ShadowPosition.Outer;
        else if (type === 'INNER_SHADOW') shadowType = ShadowPosition.Inner;

        if (shadowType) result.push(new Shadow(
            [effectsIndex + i] as BasicArray<number>,
            uuid(),
            visible,
            radius,
            importColor(color),
            offset.x,
            offset.y,
            spread,
            shadowType,
        ));
    }

    return result;
}

const textStyleKeys = [
    'fontSize', 'letterSpacing', 'fontName', 'lineHeight', 'strokePaints', 'textAlignHorizontal', 'textAlignVertical',
    'textDecoration', 'textCase', 'paragraphSpacing', 'listSpacing', 'textAutoResize',
]

const textStyleKeys1 = [
    'fillPaints',
]

function hasTextProp(data: any, ancestorData: any) {
    return data.textData || textStyleKeys.some(key => key in data)
        || (ancestorData.type === 'TEXT' && textStyleKeys1.some(key => key in ancestorData));
}

function getProps(obj: any, keys: string[]) {
    const result: any = {};
    for (const key of keys) if (key in obj) result[key] = obj[key];
    return result;
}

function importStyleFromId(styleKeyName: string, styleKeys: string[], data: any, result: any, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>) {
    const styleId = data[styleKeyName];
    if (!styleId) return;
    const styleIdGuid = styleId.guid;
    const styleIdRefKey = styleId.assetRef?.key;
    const styleIdNode = styleIdGuid ? nodeChangesMap.get(toStrId(styleIdGuid)) : nodeKeyMap.get(styleIdRefKey);
    if (styleIdNode) {
        Object.assign(result, getProps(styleIdNode, styleKeys));
        result[styleKeyName + 'Node'] = styleIdNode;
    }
}

function importTextStyleFromId(data: any, result: any, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>) {
    return importStyleFromId('styleIdForText', [...textStyleKeys, ...textStyleKeys1], data, result, nodeChangesMap, nodeKeyMap);
}

function importFillStyleFromId(data: any, result: any, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>) {
    return importStyleFromId('styleIdForFill', fillStyleKeys, data, result, nodeChangesMap, nodeKeyMap);
}

export function importStylesFromId(data: any, result: any, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>) {
    importTextStyleFromId(data, result, nodeChangesMap, nodeKeyMap);
    importFillStyleFromId(data, result, nodeChangesMap, nodeKeyMap);
}

function importEffects(ctx: LoadContext, style: Style, data: IJSON) {
    const effects = parseEffects(data as any, style.shadows.length);
    if (effects) style.shadows.push(...effects);

    const effects1 = data.effects;
    if (!Array.isArray(effects1)) return;
    const gaussian = effects1.find(effect => effect.type === 'FOREGROUND_BLUR');
    if (!gaussian) return;
    style.blur = new Blur(true, new Point2D(0, 0), gaussian.radius || 4, BlurType.Gaussian);
}

function importStyle(ctx: LoadContext, style: Style, data: IJSON) {
    importFills(ctx, style, data);
    importStroke(ctx, style, data);
    importEffects(ctx, style, data);
}

function importShapeFrame(data: IJSON) {
    const size = data.size || { x: 1, y: 1 };
    const trans = data.transform || { m00: 1, m10: 0, m01: 0, m11: 1, m02: 0, m12: 0 };
    return {
        size: new ShapeSize(size.x, size.y),
        trans: new Transform(trans.m00, trans.m01, trans.m02, trans.m10, trans.m11, trans.m12)
    }
}

function importComponentPropRefs(ctx: LoadContext, data: IJSON, shape: Shape, rawVariables: Map<string, IJSON>, variables: BasicMap<string, Variable>) {
    const componentPropRefs = data.componentPropRefs;
    if (!Array.isArray(componentPropRefs)) return;

    function getVarbinds() {
        let varbinds = shape.varbinds;
        if (!varbinds) varbinds = shape.varbinds = new BasicMap();
        return varbinds;
    }

    function getParentPropDef(rawVariable?: IJSON) {
        if (!rawVariable) return;
        let res = rawVariable;
        while (res.parentPropDefId) {
            const next = rawVariables.get(toStrId(res.parentPropDefId));
            if (!next) return;
            res = next;
        }
        return res;
    }

    for (const componentPropRef of componentPropRefs) {
        const defId = toStrId(componentPropRef.defID);
        const componentPropNodeField = componentPropRef.componentPropNodeField;
        const rawVariable = getParentPropDef(rawVariables.get(defId));
        const variable = rawVariable?.kcVariable;
        if (!variable) continue;
        const varId = variable.id;

        if (componentPropNodeField === 'VISIBLE') {
            const varbinds = getVarbinds();
            varbinds.set(OverrideType.Visible, varId)
        } else if (componentPropNodeField === 'OVERRIDDEN_SYMBOL_ID') {
            const varbinds = getVarbinds();
            varbinds.set(OverrideType.SymbolID, varId)
        }
    }
}

function importSymbolOverrides(ctx: LoadContext, data: IJSON, shape: Shape, rawVariables: Map<string, IJSON>, variables: BasicMap<string, Variable>, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>) {
    const symbolOverrides = data.symbolData?.symbolOverrides;
    if (!Array.isArray(symbolOverrides)) return;

    const shapeVariables = (shape as SymbolRefShape).variables;
    if (!shapeVariables) return;

    let shapeOverrides = (shape as SymbolRefShape).overrides;
    if (!shapeOverrides) {
        shapeOverrides = new BasicMap();
        (shape as SymbolRefShape).overrides = shapeOverrides;
    }

    for (const symbolOverride of symbolOverrides) {
        const guidPath = symbolOverride.guidPath;
        const guids = guidPath?.guids;
        if (!Array.isArray(guids) || guids.length === 0) continue;

        const guidsNodes = guids.map(guid => nodeChangesMap.get(toStrId(guid)));
        if (guidsNodes.some(node => !node)) continue;
        guidPath.guidsNodes = guidsNodes;

        const shapeIds = guidsNodes.map(node => node!.kcId);
        const joinId = shapeIds.join('/');

        // 叠加的属性
        const _guids = [...guids].reverse();
        const ancestorData = nodeChangesMap.get(toStrId(_guids[0]));
        let overlayProps = {
            ...ancestorData,
        };
        for (let i = 1; i < _guids.length; i++) {
            const guid = _guids[i];
            const item = nodeChangesMap.get(toStrId(guid));
            if (!item) continue;
            const itemSymbolOverrides = item.symbolData?.symbolOverrides
            if (!Array.isArray(itemSymbolOverrides)) continue;
            const itemSymbolOverride = itemSymbolOverrides.find(item => {
                const itemGuids = item.guidPath.guids as [];
                if (itemGuids.length !== i) return false;
                // 每一级guid都相等
                return itemGuids.find((v, j) => {
                    return toStrId(v) !== toStrId(_guids[i - 1 - j]);
                }) === undefined;
            });
            if (!itemSymbolOverride) continue;
            overlayProps = {
                ...overlayProps,
                ...itemSymbolOverride,
            }
        }
        overlayProps = {
            ...overlayProps,
            ...symbolOverride,
        };

        importStylesFromId(symbolOverride, overlayProps, nodeChangesMap, nodeKeyMap);

        if (hasTextProp(symbolOverride, ancestorData) && overlayProps.textData) {
            const text = importText(overlayProps);
            if (text) {
                const varId = uuid();
                shapeVariables.set(varId, new Variable(varId, VariableType.Text, 'text', text));
                shapeOverrides.set(`${joinId}/${OverrideType.Text}`, varId);
            }

            continue;
        }

        if (hasFillProp(symbolOverride)) {
            const fills = parseFills(ctx, overlayProps as any);
            if (fills) {
                const varId = uuid();
                shapeVariables.set(varId, new Variable(varId, VariableType.Fills, 'fills', fills));
                shapeOverrides.set(`${joinId}/${OverrideType.Fills}`, varId);
            }
        }

        if (hasStrokeProp(symbolOverride)) {
            const strokes = parseStroke(overlayProps as any);
            if (strokes) {
                const varId = uuid();
                shapeVariables.set(varId, new Variable(varId, VariableType.Borders, 'borders', strokes));
                shapeOverrides.set(`${joinId}/${OverrideType.Borders}`, varId);
            }
        }

        if (hasRadiusProp(symbolOverride)) {
            const radius = importRadius(ctx, overlayProps as any);
            if (radius) {
                const varId = uuid();
                shapeVariables.set(varId, new Variable(varId, VariableType.CornerRadius, 'radius', radius));
                shapeOverrides.set(`${joinId}/${OverrideType.CornerRadius}`, varId);
            }
        }

        if (hasEffectProp(symbolOverride)) {
            const effects = parseEffects(overlayProps as any);
            if (effects) {
                const varId = uuid();
                shapeVariables.set(varId, new Variable(varId, VariableType.Shadows, 'effects', effects));
                shapeOverrides.set(`${joinId}/${OverrideType.Shadows}`, varId);
            }
        }
    }
}

function importLocked(ctx: LoadContext, data: IJSON, shape: Shape) {
    shape.constrainerProportions = data.proportionsConstrained;
    shape.isLocked = data.locked;
}

function hasRadiusProp(data: any) {
    return data.cornerRadius || data.rectangleCornerRadiiIndependent || data.rectangleTopLeftCornerRadius || data.rectangleTopRightCornerRadius || data.rectangleBottomRightCornerRadius || data.rectangleBottomLeftCornerRadius;
}

function importRadius(ctx: LoadContext, data: IJSON, shape?: Shape) {
    const cornerRadius = data.cornerRadius;
    const rectangleCornerRadiiIndependent = data.rectangleCornerRadiiIndependent;
    const rectangleTopLeftCornerRadius = rectangleCornerRadiiIndependent ? data.rectangleTopLeftCornerRadius : cornerRadius;
    const rectangleTopRightCornerRadius = rectangleCornerRadiiIndependent ? data.rectangleTopRightCornerRadius : cornerRadius;
    const rectangleBottomRightCornerRadius = rectangleCornerRadiiIndependent ? data.rectangleBottomRightCornerRadius : cornerRadius;
    const rectangleBottomLeftCornerRadius = rectangleCornerRadiiIndependent ? data.rectangleBottomLeftCornerRadius : cornerRadius;

    const _cornerRadius = new CornerRadius(v4(), rectangleTopLeftCornerRadius, rectangleTopRightCornerRadius, rectangleBottomRightCornerRadius, rectangleBottomLeftCornerRadius);
    if (!shape) return _cornerRadius;

    const pathsegs = (shape as PathShape).pathsegs;
    if (pathsegs) {
        if (cornerRadius && !rectangleCornerRadiiIndependent) {
            for (const segment of pathsegs) {
                for (const point of segment.points) {
                    point.radius = cornerRadius;
                }
            }
        } else if (rectangleCornerRadiiIndependent) {
            pathsegs[0].points[0].radius = rectangleTopLeftCornerRadius;
            pathsegs[0].points[1].radius = rectangleTopRightCornerRadius;
            pathsegs[0].points[2].radius = rectangleBottomRightCornerRadius;
            pathsegs[0].points[3].radius = rectangleBottomLeftCornerRadius;
        }
    }

    if (shape instanceof Artboard || shape instanceof SymbolShape || shape instanceof SymbolRefShape) {
        shape.cornerRadius = _cornerRadius;
    }

    return _cornerRadius;
}

function importBlend(ctx: LoadContext, data: IJSON, shape: Shape) {
    const blendMode = data.blendMode;

    let blendMode1;
    if (blendMode === 'NORMAL') blendMode1 = BlendMode.Normal;
    else if (blendMode === 'DARKEN') blendMode1 = BlendMode.Darken;
    else if (blendMode === 'MULTIPLY') blendMode1 = BlendMode.Multiply;
    else if (blendMode === 'PLUS_DARKER') blendMode1 = BlendMode.PlusDarker;
    else if (blendMode === 'COLOR_BURN') blendMode1 = BlendMode.ColorBurn;
    else if (blendMode === 'LIGHTEN') blendMode1 = BlendMode.Lighten;
    else if (blendMode === 'SCREEN') blendMode1 = BlendMode.Screen;
    else if (blendMode === 'LINEAR_DODGE') blendMode1 = BlendMode.PlusLighter;
    else if (blendMode === 'COLOR_DODGE') blendMode1 = BlendMode.ColorDodge;
    else if (blendMode === 'OVERLAY') blendMode1 = BlendMode.Overlay;
    else if (blendMode === 'SOFT_LIGHT') blendMode1 = BlendMode.SoftLight;
    else if (blendMode === 'HARD_LIGHT') blendMode1 = BlendMode.HardLight;
    else if (blendMode === 'DIFFERENCE') blendMode1 = BlendMode.Difference;
    else if (blendMode === 'EXCLUSION') blendMode1 = BlendMode.Exclusion;
    else if (blendMode === 'HUE') blendMode1 = BlendMode.Hue;
    else if (blendMode === 'SATURATION') blendMode1 = BlendMode.Saturation;
    else if (blendMode === 'COLOR') blendMode1 = BlendMode.Color;
    else if (blendMode === 'LUMINOSITY') blendMode1 = BlendMode.Luminosity;
    else blendMode1 = BlendMode.Normal;

    shape.style.contextSettings = new ContextSettings(blendMode1, data.opacity || 1);
}

function importExportOptions(ctx: LoadContext, data: IJSON, shape: Shape) {
    const exportSettings = data.exportSettings;
    if (!Array.isArray(exportSettings)) return;

    const exportFormatList: ExportFormat[] = [];
    for (const exportSetting of exportSettings) {
        let imageType = exportSetting.imageType;
        let fileFormat;
        if (imageType === 'PNG') fileFormat = ExportFileFormat.Png;
        else if (imageType === 'JPG') fileFormat = ExportFileFormat.Jpg;
        else if (imageType === 'SVG') fileFormat = ExportFileFormat.Svg;
        else if (imageType === 'PDF') fileFormat = ExportFileFormat.Pdf;
        else fileFormat = ExportFileFormat.Png;

        exportFormatList.push(new ExportFormat(
            new BasicArray(),
            uuid(),
            0,
            fileFormat,
            exportSetting.suffix || '',
            ExportFormatNameingScheme.Suffix,
            exportSetting.constraint?.value || 1,
            ExportVisibleScaleType.Scale,
        ));
    }

    if (exportFormatList.length === 0) return;

    let exportOptions = shape.exportOptions;
    if (!exportOptions) {
        exportOptions = new ExportOptions(new BasicArray(), 0, false, false, false, false);
        shape.exportOptions = exportOptions;
    }
    exportOptions.exportFormats.push(...exportFormatList);
}

function importMask(ctx: LoadContext, data: IJSON, shape: Shape) {
    if (data.mask) shape.mask = data.mask;
}

function importConstraint(ctx: LoadContext, data: IJSON, shape: Shape) {
    const horizontalConstraint = data.horizontalConstraint || 'MIN';
    const verticalConstraint = data.verticalConstraint || 'MIN';

    let status = ResizingConstraints2.Default;

    if (horizontalConstraint === 'MIN') status = ResizingConstraints2.setToFixedLeft(status);
    else if (horizontalConstraint === 'MAX') status = ResizingConstraints2.setToFixedRight(status);
    else if (horizontalConstraint === 'STRETCH') status = ResizingConstraints2.setToFixedLeftAndRight(status);
    else if (horizontalConstraint === 'CENTER') status = ResizingConstraints2.setToHorizontalJustifyCenter(status);
    else if (horizontalConstraint === 'SCALE') status = ResizingConstraints2.setToScaleByWidth(status);

    if (verticalConstraint === 'MIN') status = ResizingConstraints2.setToFixedTop(status);
    else if (verticalConstraint === 'MAX') status = ResizingConstraints2.setToFixedBottom(status);
    else if (verticalConstraint === 'STRETCH') status = ResizingConstraints2.setToFixedTopAndBottom(status);
    else if (verticalConstraint === 'CENTER') status = ResizingConstraints2.setToVerticalJustifyCenter(status);
    else if (verticalConstraint === 'SCALE') status = ResizingConstraints2.setToScaleByHeight(status);

    shape.resizingConstraint = status;
}

function importShapeProperty(ctx: LoadContext, data: IJSON, shape: Shape, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>) {
    importComponentPropRefs(ctx, data, shape, ctx.rawVariables, ctx.variables);
    importSymbolOverrides(ctx, data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap, nodeKeyMap);
    importLocked(ctx, data, shape);
    importRadius(ctx, data, shape);
    importBlend(ctx, data, shape);
    importExportOptions(ctx, data, shape);
    importMask(ctx, data, shape);
    importConstraint(ctx, data, shape);
}

export function importPage(ctx: LoadContext, data: IJSON, f: ImportFun, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): Page {
    const visible = data.visible;
    const frame = importShapeFrame(data);
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new Page(new BasicArray<number>(), data.id, data.name, ShapeType.Page, frame.trans, style, new BasicArray<Shape>(...childs));

    shape.isVisible = visible;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    const backgroundColor = data.backgroundColor;
    if (backgroundColor) shape.backgroundColor = importColor(backgroundColor);

    data.shape = shape;

    return shape;
}

function importSegments(data: IJSON): {
    segments: PathSegment[],
    startStrokeCap?: MarkerType,
    endStrokeCap?: MarkerType,
} {
    const vectorData = data.vectorData;
    const vectorNetwork = vectorData?.vectorNetwork;
    const vertices = vectorNetwork?.vertices as any[];
    const segments = vectorNetwork?.segments as any[];
    const regions = vectorNetwork?.regions as any[];
    const normalizedSize = vectorData?.normalizedSize as any;

    if (!Array.isArray(vertices) || !Array.isArray(segments) || !Array.isArray(regions) || !normalizedSize) {
        return {
            segments: [],
        };
    }

    const styleOverrideTable = vectorData?.styleOverrideTable;
    const styleOverrideTableMap = new Map();
    if (Array.isArray(styleOverrideTable)) for (const item of styleOverrideTable) {
        styleOverrideTableMap.set(item.styleID, item);
    }

    function getCycleIndex(length: number, i: number) {
        i %= length;
        if (i < 0) i += length;
        return i;
    }

    function getVertex(index: {
        vertex: number,
        dx?: number,
        dy?: number,
    }) {
        const vertex = { ...vertices[index.vertex] };
        vertex.x += (index.dx || 0);
        vertex.y += (index.dy || 0);
        vertex.x /= (normalizedSize.x || 1);
        vertex.y /= (normalizedSize.y || 1);
        return vertex;
    }

    function toCurvePoints(points: {
        from?: any,
        to?: any,
    }[]) {
        return points.map((item, i) => {
            const basePoint = getVertex({ vertex: item.from ? item.from.vertex : item.to.vertex });
            const p = new CurvePoint([i] as BasicArray<number>, uuid(), basePoint.x, basePoint.y, CurveMode.Straight);
            const hasCurveFrom = item.from && (Math.abs(item.from.dx) > float_accuracy || Math.abs(item.from.dy) > float_accuracy);
            const hasCurveTo = item.to && (Math.abs(item.to.dx) > float_accuracy || Math.abs(item.to.dy) > float_accuracy);
            if (hasCurveFrom) {
                const point = getVertex(item.from);
                p.mode = CurveMode.Disconnected;
                p.hasFrom = true;
                p.fromX = point.x;
                p.fromY = point.y;
            }
            if (hasCurveTo) {
                const point = getVertex(item.to);
                p.mode = CurveMode.Disconnected;
                p.hasTo = true;
                p.toX = point.x;
                p.toY = point.y;
            }
            return p;
        })
    }

    const segments1: PathSegment[] = [];
    const result: any = {
        segments: segments1,
    }

    if (regions.length > 0) {
        for (const region of regions) {
            const regionLoop = region?.loops?.[0]
            let regionLoopSegments = regionLoop?.segments;

            if (regionLoopSegments) {
                const points: {
                    from?: any,
                    to?: any,
                }[] = [];
                let isEqualLastPoint = false;
                const length = regionLoopSegments.length;
                for (let i = 0; i < length; i++) {
                    const currentSegmentsIndex = regionLoopSegments[getCycleIndex(length, i)];
                    const nextSegmentsIndex = regionLoopSegments[getCycleIndex(length, i + 1)];

                    const currentSegment = segments[currentSegmentsIndex];
                    const nextSegment = segments[nextSegmentsIndex];

                    if (!isEqualLastPoint) {
                        points.push({
                            from: currentSegment.start,
                        });
                    }

                    isEqualLastPoint = currentSegment.end.vertex === nextSegment.start.vertex;

                    if (i !== length - 1 || !isEqualLastPoint) {
                        const point1 = { to: currentSegment.end } as any;
                        if (isEqualLastPoint) point1.from = nextSegment.start;
                        points.push(point1);
                    } else { // 是最后一个且isEqualLastPoint为true
                        points[0].to = currentSegment.end;
                    }
                }

                const isClosed = segments[regionLoopSegments[0]].start.vertex === segments[regionLoopSegments[regionLoopSegments.length - 1]].end.vertex;
                segments1.push(new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...toCurvePoints(points)), isClosed));
            }
        }
    } else if (segments.length > 0) {
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const points = toCurvePoints([
                { from: segment.start },
                { to: segment.end },
            ]);
            segments1.push(new PathSegment([i] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), false))
        }

        function getStrokeCap(strokeCap: string) {
            if (strokeCap === 'ARROW_LINES') return MarkerType.OpenArrow;
            else if (strokeCap === 'ARROW_EQUILATERAL') return MarkerType.FilledArrow;
            // else if (strokeCap === 'TRIANGLE_FILLED') return MarkerType.OpenArrow;
            else if (strokeCap === 'CIRCLE_FILLED') return MarkerType.FilledCircle;
            else if (strokeCap === 'DIAMOND_FILLED') return MarkerType.FilledSquare;
            else if (strokeCap === 'ROUND') return MarkerType.Round;
            else if (strokeCap === 'SQUARE') return MarkerType.Square;
            else return MarkerType.Line;
        }

        const startVertexStyleID = vertices[segments[0].start.vertex].styleID;
        const startStyleOverride = styleOverrideTableMap.get(startVertexStyleID);
        const startStrokeCap = startStyleOverride?.strokeCap;
        if (startStrokeCap) result.startStrokeCap = getStrokeCap(startStrokeCap);

        const endVertexStyleID = vertices[segments[segments.length - 1].end.vertex].styleID;
        const endStyleOverride = styleOverrideTableMap.get(endVertexStyleID);
        const endStrokeCap = endStyleOverride?.strokeCap;
        if (endStrokeCap) result.endStrokeCap = getStrokeCap(endStrokeCap);
    }

    return result;
}

export function importPathShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): PathShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    if (frame.size.width === 0 || frame.size.height === 0) {
        frame.size.width = frame.size.width || 1;
        frame.size.height = frame.size.height || 1;
    }

    let cls = PathShape;
    let shapeType = types.ShapeType.Path;
    let { segments, startStrokeCap, endStrokeCap } = importSegments(data);
    if (segments.length === 0) {
        segments = [new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(
            new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight), // lt
            new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight), // rt
            new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight), // rb
            new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight), // lb
        ), true)];
        cls = RectShape;
        shapeType = types.ShapeType.Rectangle;
    }
    const shape = new cls([index] as BasicArray<number>, id, data.name, shapeType, frame.trans, style, frame.size, new BasicArray<PathSegment>(...segments));
    style.startMarkerType = startStrokeCap;
    style.endMarkerType = endStrokeCap;

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importPolygon(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): PathShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const count = data.count || 3;
    const vertices = getPolygonVertices(count);
    const points = getPolygonPoints(vertices);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), true)
    const shape = new PolygonShape([index] as BasicArray<number>, id, data.name, types.ShapeType.Polygon, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment), count);

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importStar(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): PathShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const count = data.count || 5;
    const cornerRadius = data.cornerRadius || 0;
    const starInnerScale = data.starInnerScale || 0.382;
    const vertices = getPolygonVertices(count * 2, starInnerScale);
    const points = getPolygonPoints(vertices, cornerRadius);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), true)
    const shape = new StarShape([index] as BasicArray<number>, id, data.name, types.ShapeType.Star, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment), count, starInnerScale);

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importLine(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): PathShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Center, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    frame.size.width = frame.size.width || 1;
    frame.size.height = frame.size.height || 1;

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(
        new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight),
        new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight),
    ), false)
    const shape = new PathShape([index] as BasicArray<number>, id, data.name, ShapeType.Path, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment));

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importEllipse(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): OvalShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const __frame = new ShapeFrame(frame.trans.translateX, frame.trans.translateY, frame.size.width, frame.size.height)
    const shape = shapeCreator.newOvalShape(data.name, __frame, ctx.styleMgr);

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importGroup(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): GroupShape {
    const booleanOperation = data.booleanOperation;
    if (!data.resizeToFit && !booleanOperation) {
        return importArtboard(ctx, data, f, index, nodeChangesMap, nodeKeyMap);
    }

    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];

    const cls = !booleanOperation ? GroupShape : BoolShape;
    const shapeType = !booleanOperation ? types.ShapeType.Group : types.ShapeType.BoolShape;
    const shape = new cls(new BasicArray(), id, data.name, shapeType, frame.trans, style, new BasicArray<Shape>(...childs));

    if (booleanOperation) {
        let boolOp;
        if (booleanOperation === 'UNION') boolOp = BoolOp.Union;
        else if (booleanOperation === 'SUBTRACT') boolOp = BoolOp.Subtract;
        else if (booleanOperation === 'INTERSECT') boolOp = BoolOp.Intersect;
        else if (booleanOperation === 'XOR') boolOp = BoolOp.Diff;
        else boolOp = BoolOp.None;
        for (const child of childs) child.boolOp = boolOp;
    }

    shape.isVisible = visible;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importArtboard(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): Artboard {
    if (data.isStateGroup) {
        return importSymbolUnion(ctx, data, f, index, nodeChangesMap, nodeKeyMap);
    }

    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new Artboard([index] as BasicArray<number>, id, data.name, ShapeType.Artboard, frame.trans, style, new BasicArray<Shape>(...childs), frame.size);
    shape.isVisible = visible;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importTextShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): TextShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    // importStyle(ctx, style, data);
    importEffects(ctx, style, data); // FILL,BORDERS都是应用到文本上的
    const id = data.kcId || uuid();

    // const textStyle = data.style && data.style['textStyle'];
    const text: Text = data.textData && importText(data);

    const shape = new TextShape([index] as BasicArray<number>, id, data.name, ShapeType.Text, frame.trans, style, frame.size, text);
    shape.isVisible = visible;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

function importVariables(rawVariables: Map<string, IJSON>, variables: BasicMap<string, Variable>, data: IJSON, nodeChangesMap: Map<string, IJSON>)
    : [Map<string, IJSON>, BasicMap<string, Variable>] {

    const componentPropDefs = data.componentPropDefs;

    const rawVariables1 = new Map<string, IJSON>();
    const variables1 = new BasicMap<string, Variable>();

    if (componentPropDefs) for (const componentPropDef of componentPropDefs) {
        let type = componentPropDef.type;
        const rawVarId = toStrId(componentPropDef.id);
        let varName = componentPropDef.name;
        const varId = uuid();
        let rawVarValue = componentPropDef.varValue;

        rawVariables.set(rawVarId, componentPropDef);
        rawVariables1.set(rawVarId, componentPropDef);

        const parentPropDefId = toStrId(componentPropDef.parentPropDefId);
        if (parentPropDefId) {
            const rawParentPropDef = rawVariables.get(parentPropDefId);
            if (rawParentPropDef) {
                componentPropDef.rawParentPropDef = rawParentPropDef;
                type = rawParentPropDef.type;
                varName = rawParentPropDef.name;
                rawVarValue = rawParentPropDef.varValue;
            }
        }

        let varType, varValue;
        if (type === 'BOOL') {
            varType = VariableType.Visible;
            varValue = rawVarValue.value.boolValue;
        } else if (type === 'INSTANCE_SWAP') {
            varType = VariableType.SymbolRef;
            const symbolId = toStrId(rawVarValue.value.symbolIdValue.guid);
            const symbol = nodeChangesMap.get(symbolId);
            varValue = symbol?.kcId;
        } else {
            continue;
        }

        const variable = new Variable(varId, varType, varName, varValue);
        componentPropDef.kcVariable = variable;
        variables.set(varId, variable);
        variables1.set(varId, variable);
    }

    const stateGroupPropertyValueOrders = data.stateGroupPropertyValueOrders;
    if (Array.isArray(stateGroupPropertyValueOrders)) for (const stateGroupPropertyValueOrder of stateGroupPropertyValueOrders) {
        const property = stateGroupPropertyValueOrder.property;
        const values = stateGroupPropertyValueOrder.values;
        const varId = uuid();
        const variable = new Variable(varId, VariableType.Status, property, '');
        variables.set(varId, variable);
        variables1.set(varId, variable);
        stateGroupPropertyValueOrder.kcVariable = variable;
    }

    return [rawVariables1, variables1];
}

export function importSymbol(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): SymbolShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const variablesRes = importVariables(ctx.rawVariables, ctx.variables, data, nodeChangesMap);

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new SymbolShape([index] as BasicArray<number>, id, data.name, ShapeType.Symbol, frame.trans, style, new BasicArray<Shape>(...childs), frame.size, variablesRes[1]);
    shape.isVisible = visible;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importSymbolRef(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): SymbolRefShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const variablesRes = importVariables(ctx.rawVariables, ctx.variables, data, nodeChangesMap);

    const symbolId = toStrId(data.symbolData.symbolID);
    const symbol = nodeChangesMap.get(symbolId);
    const symbolRawID = symbol?.kcId;
    data.symbolData.symbolData = symbol;

    const shape = new SymbolRefShape([index] as BasicArray<number>, id, data.name, ShapeType.SymbolRef, frame.trans, style, frame.size, symbolRawID, variablesRes[1]);
    shape.isVisible = visible;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importSymbolUnion(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): SymbolUnionShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const variablesRes = importVariables(ctx.rawVariables, ctx.variables, data, nodeChangesMap);

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];

    const stateGroupPropertyValueOrders = data.stateGroupPropertyValueOrders;
    if (Array.isArray(stateGroupPropertyValueOrders) && stateGroupPropertyValueOrders.length > 0) for (const child of childs) {
        const name = child.name;
        let symtags = (child as SymbolShape).symtags;
        if (!symtags) {
            symtags = new BasicMap<string, string>();
            (child as SymbolShape).symtags = symtags;
        }

        for (const stateGroupPropertyValueOrder of stateGroupPropertyValueOrders) {
            const property = stateGroupPropertyValueOrder.property;
            const values = stateGroupPropertyValueOrder.values;
            const variable = stateGroupPropertyValueOrder.kcVariable;
            if (!variable) continue;
            const varId = variable.id;
            const regex = new RegExp(`(?:^|,\\s*)${property}=([^,]+)`);
            const match = name.match(regex);
            if (match) symtags.set(varId, match[1].trim());
        }
    }

    const shape = new SymbolUnionShape([index] as BasicArray<number>, id, data.name, ShapeType.SymbolUnion, frame.trans, style, new BasicArray<Shape>(...childs), frame.size, variablesRes[1]);
    shape.isVisible = visible;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}

export function importSlice(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>): CutoutShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(new BasicArray(), new BasicArray(), border);
    importStyle(ctx, style, data);
    const id = data.kcId || uuid();

    const curvePoint = new BasicArray<CurvePoint>();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    const p5 = new CurvePoint([4] as BasicArray<number>, uuid(), 0, 0.00001, CurveMode.Straight); // lt
    curvePoint.push(p1, p2, p3, p4, p5);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);
    const shape = new CutoutShape([index] as BasicArray<number>, id, data.name, ShapeType.Cutout, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment));

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(ctx, data, shape, nodeChangesMap, nodeKeyMap);

    data.shape = shape;

    return shape;
}
