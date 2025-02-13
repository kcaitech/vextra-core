import { Api } from "../../coop/recordapi";
import { BorderPosition, CornerType, CurveMode, MarkerType, ShapeType } from "../../data/typesdefine";
import { CurvePoint, PathShape, PathShape2, Point2D, Shape } from "../../data/shape";
import { Page } from "../../data/page";
import { v4 } from "uuid";
import { uuid } from "../../basic/uuid";
import { BasicArray } from "../../data/basic";
import { Matrix } from "../../basic/matrix";
import { PathType } from "../../data/consts";
import { importCurvePoint } from "../../data/baseimport";
import { Border, makeShapeTransform1By2, makeShapeTransform2By1 } from "../../data";
import { ColVector3D } from "../../basic/matrix2";
import { ContactLineView, PathShapeView, ShapeView } from "../../dataview";
import { Cap, gPal, IPalPath, Join } from "../../basic/pal";
import { Path } from "@kcdesign/path";
import { qua2cube, splitCubicBezierAtT } from "../../data/pathparser";
import { Transform } from "../../data/transform";

const minimum_WH = 1; // 用户可设置最小宽高值。以防止宽高在缩放后为0

export function update_frame_by_points(api: Api, page: Page, s: Shape, reLayout = false) {
    const box = s.boundingBox3();
    if (!box) return;

    const m = s.matrix2Root();

    const f = s.frame;
    const w = f.width;
    const h = f.height;

    const m1 = (s.matrix2Parent());
    m1.preScale(w, h);

    const targetWidth = Math.max(box.width, minimum_WH);
    const targetHeight = Math.max(box.height, minimum_WH);

    let frameChange = false;
    if (w !== targetWidth || h !== targetHeight) {
        api.shapeModifyWH(page, s, targetWidth, targetHeight);
        frameChange = true;
    }

    const rootXY = m.computeCoord3(box);
    const targetXY = s.parent!.matrix2Root().inverseCoord(rootXY);
    const dx = targetXY.x - s.transform.translateX;
    const dy = targetXY.y - s.transform.translateY;

    if (dx || dy) {
        api.shapeModifyTransform(page, s, makeShapeTransform1By2(makeShapeTransform2By1(s.transform).setTranslate(ColVector3D.FromXY(targetXY.x, targetXY.y))));
        frameChange = true;
    }

    if (!(frameChange || reLayout)) return; // 只有宽高被改变，才会需要重排2D points.

    const m3 = (s.matrix2Parent());
    m3.preScale(s.size.width, s.size.height);
    m1.multiAtLeft(m3.inverse);

    (s as PathShape).pathsegs.forEach((segment, index) => exe(index, m1, segment.points));

    function exe(segment: number, m: Transform, points: CurvePoint[]) {
        if (!points || !points.length) return false;

        for (let i = 0, len = points.length; i < len; i++) {
            const p = points[i];
            if (!p) continue;

            if (p.hasFrom) {
                api.shapeModifyCurvFromPoint(page, s, i, m.computeCoord2(p.fromX || 0, p.fromY || 0), segment);
            }

            if (p.hasTo) {
                api.shapeModifyCurvToPoint(page, s, i, m.computeCoord2(p.toX || 0, p.toY || 0), segment);
            }

            api.shapeModifyCurvPoint(page, s, i, m.computeCoord2(p.x, p.y), segment);
        }
    }
}

/**
 * @description 计算三次贝塞尔曲线上的点
 * @param t 0~1
 * @param p0 起点
 * @param p1 控制点
 * @param p2 控制点
 * @param p3 终点
 * @returns
 */
export function bezierCurvePoint(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
    return {
        x: Math.pow(1 - t, 3) * p0.x + 3 * Math.pow(1 - t, 2) * t * p1.x + 3 * (1 - t) * Math.pow(t, 2) * p2.x + Math.pow(t, 3) * p3.x,
        y: Math.pow(1 - t, 3) * p0.y + 3 * Math.pow(1 - t, 2) * t * p1.y + 3 * (1 - t) * Math.pow(t, 2) * p2.y + Math.pow(t, 3) * p3.y
    } as Point2D;
}

export function __round_curve_point(points: CurvePoint[], index: number) {
    const previous_index = index === 0 ? points.length - 1 : index - 1;
    const next_index = index === points.length - 1 ? 0 : index + 1;
    return {
        previous: points[previous_index],
        next: points[next_index],
        previous_index,
        next_index
    }
}

export function init_curve(order: 2 | 3, shape: Shape, page: Page, api: Api, curve_point: CurvePoint, index: number, segmentIndex: number, init = (Math.sqrt(2) / 4)) {
    const __shape = shape as PathShape2;
    const points = __shape.pathsegs[segmentIndex]?.points;

    if (!points?.length) return;

    const apex = getApex(points, index);

    if (!apex) return;

    const { from, to } = apex;

    if (order === 3) {
        api.shapeModifyCurvFromPoint(page, __shape, index, from, segmentIndex);
        api.shapeModifyCurvToPoint(page, __shape, index, to, segmentIndex);
        api.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
        api.modifyPointHasTo(page, __shape, index, true, segmentIndex);
    } else {
        api.shapeModifyCurvFromPoint(page, __shape, index, from, segmentIndex);
        api.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
    }

    function getApex(points: CurvePoint[], index: number) {
        const round = __round_curve_point(points, index);

        const { previous, next } = round;
        const minL = Math.min(Math.hypot(curve_point.x - next.x, curve_point.y - next.y), Math.hypot(curve_point.x - previous.x, curve_point.y - previous.y));
        const k = Math.atan2(next.x - previous.x, next.y - previous.y);
        const dx = minL * init * Math.sin(k);
        const dy = minL * init * Math.cos(k);
        const from = { x: curve_point.x + dx, y: curve_point.y + dy };
        const to = { x: curve_point.x - dx, y: curve_point.y - dy };

        return { from, to };
    }
}

export function init_straight(shape: Shape, page: Page, api: Api, index: number, segmentIndex: number) {
    api.shapeModifyCurvFromPoint(page, shape, index, { x: 0, y: 0 }, segmentIndex);
    api.shapeModifyCurvToPoint(page, shape, index, { x: 0, y: 0 }, segmentIndex);
    api.modifyPointHasFrom(page, shape, index, false, segmentIndex);
    api.modifyPointHasTo(page, shape, index, false, segmentIndex);
}

export function align_from(shape: Shape, page: Page, api: Api, curve_point: CurvePoint, index: number, segmentIndex: number) {
    if (curve_point.fromX === undefined || curve_point.fromY === undefined) {
        return;
    }
    const delta_x = 2 * curve_point.x - curve_point.fromX;
    const delta_y = 2 * curve_point.y - curve_point.fromY;
    api.shapeModifyCurvToPoint(page, shape, index, { x: delta_x, y: delta_y }, segmentIndex);
}

export function _typing_modify(shape: Shape, page: Page, api: Api, index: number, to_mode: CurveMode, segmentIndex: number) {
    let point: CurvePoint | undefined;

    point = (shape as PathShape)?.pathsegs[segmentIndex]?.points[index];

    if (!point) return;

    if (point.mode === CurveMode.Straight && to_mode !== CurveMode.Straight) {
        init_curve(3, shape, page, api, point, index, segmentIndex, (Math.sqrt(2) / 4));
        return;
    }

    if (point.mode === CurveMode.Mirrored && to_mode === CurveMode.Straight) {
        init_straight(shape, page, api, index, segmentIndex);
        return;
    }

    if (point.mode === CurveMode.Disconnected) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index, segmentIndex);
        } else if (to_mode === CurveMode.Mirrored || to_mode === CurveMode.Asymmetric) {
            align_from(shape, page, api, point, index, segmentIndex);
        }
        return;
    }

    if (point.mode === CurveMode.Asymmetric) {
        if (to_mode === CurveMode.Straight) {
            init_straight(shape, page, api, index, segmentIndex);
        } else if (to_mode === CurveMode.Mirrored) {
            align_from(shape, page, api, point, index, segmentIndex);
        }
    }
}

function is_curve(p: CurvePoint, n: CurvePoint) {
    return p.hasFrom || n.hasTo;
}

function get_curve(p: CurvePoint, n: CurvePoint) {
    const start = { x: p.x, y: p.y } as Point2D;
    const from = { x: 0, y: 0 } as Point2D;
    const to = { x: 0, y: 0 } as Point2D;
    const end = { x: n.x, y: n.y } as Point2D;

    if (p.hasFrom && n.hasTo) {
        from.x = p.fromX!;
        from.y = p.fromY!;
        to.x = n.toX!;
        to.y = n.toY!;
    } else if (p.hasFrom) {
        const curve = qua2cube(start, { x: p.fromX!, y: p.fromY! }, end);
        from.x = curve[1].x;
        from.y = curve[1].y;
        to.x = curve[2].x;
        to.y = curve[2].y;
    } else {
        const curve = qua2cube(start, { x: n.toX!, y: n.toY! }, end);
        from.x = curve[1].x;
        from.y = curve[1].y;
        to.x = curve[2].x;
        to.y = curve[2].y;
    }

    return { start, from, to, end };
}

function get_node_xy_by_round(p: CurvePoint, n: CurvePoint) {
    if (is_curve(p, n)) {
        const { start, from, to, end } = get_curve(p, n);
        return bezierCurvePoint(0.5, start, from, to, end);
    } else {
        return {
            x: (p.x + n.x) / 2,
            y: (p.y + n.y) / 2
        }
    }
}

function modify_previous_from_by_slice(page: Page, api: Api, path_shape: Shape, slice: Point2D[], previous: CurvePoint, index: number, segmentIndex: number) {
    if (!previous.hasTo) {
        api.modifyPointHasFrom(page, path_shape, index, true, segmentIndex);
    }
    if (previous.mode === CurveMode.Straight) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Disconnected, segmentIndex);
    }
    if (previous.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segmentIndex);
    }
    api.shapeModifyCurvFromPoint(page, path_shape, index, slice[1], segmentIndex);
}

function modify_next_to_by_slice(page: Page, api: Api, path_shape: Shape, slice: Point2D[], next: CurvePoint, index: number, segmentIndex: number) {
    if (!next.hasTo) {
        api.modifyPointHasTo(page, path_shape, index, true, segmentIndex);
    }
    if (next.mode === CurveMode.Straight) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Disconnected, segmentIndex);
    }
    if (next.mode === CurveMode.Mirrored) {
        api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, segmentIndex);
    }
    api.shapeModifyCurvToPoint(page, path_shape, index, slice[2], segmentIndex);
}

function modify_current_handle_slices(page: Page, api: Api, path_shape: Shape, slices: Point2D[][], index: number, segmentIndex: number) {
    api.modifyPointHasTo(page, path_shape, index, true, segmentIndex);
    api.modifyPointHasFrom(page, path_shape, index, true, segmentIndex);
    api.shapeModifyCurvToPoint(page, path_shape, index, slices[0][2], segmentIndex);
    api.shapeModifyCurvFromPoint(page, path_shape, index, slices[1][1], segmentIndex);
}

export function after_insert_point(page: Page, api: Api, path_shape: Shape, index: number, segmentIndex: number, apex?: { xy: Point2D, t?: number }) {
    let __segment = segmentIndex;

    let points: CurvePoint[] = (path_shape as PathShape)?.pathsegs[segmentIndex]?.points;

    if (!points) return;

    const { previous, next, previous_index, next_index } = __round_curve_point(points, index);

    const xy = apex?.xy ?? get_node_xy_by_round(previous, next);
    api.shapeModifyCurvPoint(page, path_shape, index, xy, __segment);

    if (!is_curve(previous, next)) return;

    api.modifyPointCurveMode(page, path_shape, index, CurveMode.Asymmetric, __segment);
    const { start, from, to, end } = get_curve(previous, next);
    const slices = splitCubicBezierAtT(start, from, to, end, apex?.t ?? 0.5) as Point2D[][];
    modify_previous_from_by_slice(page, api, path_shape, slices[0], previous, previous_index, __segment);
    modify_next_to_by_slice(page, api, path_shape, slices[1], next, next_index, __segment);
    modify_current_handle_slices(page, api, path_shape, slices, index, __segment);
}

export function __pre_curve(order: 2 | 3, page: Page, api: Api, path_shape: Shape, index: number, segmentIndex: number) {
    let point: CurvePoint | undefined = undefined;

    point = (path_shape as PathShape)?.pathsegs[segmentIndex]?.points[index];

    if (!point) {
        return;
    }

    if (order === 3) {
        if (point.mode !== CurveMode.Mirrored) {
            api.modifyPointCurveMode(page, path_shape, index, CurveMode.Mirrored, segmentIndex);
        }
    } else {
        if (point.mode !== CurveMode.Disconnected) {
            api.modifyPointCurveMode(page, path_shape, index, CurveMode.Disconnected, segmentIndex);
        }
    }

    init_curve(order, path_shape, page, api, point, index, segmentIndex, 0.01);
}

export function modify_points_xy(api: Api, page: Page, s: Shape, actions: {
    segment: number;
    index: number;
    x: number;
    y: number;
}[]) {
    let m = (s.matrix2Parent());
    const f = s.size;
    m.preScale(f.width, f.height);

    m = (m.inverse);

    if (s.pathType !== PathType.Editable) {
        return;
    }

    for (let i = 0, l = actions.length; i < l; i++) {
        const action = actions[i];
        const new_xy = m.computeCoord2(action.x, action.y);
        api.shapeModifyCurvPoint(page, s, action.index, new_xy, action.segment);
    }

    update_frame_by_points(api, page, s);
}

export function is_straight(shape: Shape) {
    if (!(shape instanceof PathShape || shape.type === ShapeType.Contact)) {
        return false;
    }

    const points = (shape as PathShape).pathsegs[0].points;

    return points.length === 2 && !points[0].hasFrom && !points[1].hasTo; // 两个点的，那就是直线
}

// 生成一个顶点为 (0.5, 0)，中心点为 (0.5, 0.5)，边数为 n 的等边多边形的顶点坐标
export function getPolygonVertices(sidesCount: number, offsetPercent?: number) {
    const cx = 0.5;
    const cy = 0.5;
    const angleStep = (2 * Math.PI) / sidesCount;

    let vertices = [{ x: 0.5, y: 0 }];
    for (let i = 1; i < sidesCount; i++) {
        const angle = i * angleStep;
        let x = cx + (0.5 - cx) * Math.cos(angle) - (0 - cy) * Math.sin(angle);
        let y = cy + (0.5 - cx) * Math.sin(angle) + (0 - cy) * Math.cos(angle);
        if (i % 2 === 1 && offsetPercent) {
            // 计算偏移后的点
            const offsetX = (x - cx) * offsetPercent;
            const offsetY = (y - cy) * offsetPercent;
            x = cx + offsetX;
            y = cy + offsetY;
        }
        vertices.push({ x, y });
    }

    return vertices;
}

export function getPolygonPoints(counts: { x: number, y: number }[], radius?: number) {
    const curvePoint = new BasicArray<CurvePoint>();
    for (let i = 0; i < counts.length; i++) {
        const count = counts[i];
        const point = new CurvePoint([i] as BasicArray<number>, uuid(), count.x, count.y, CurveMode.Straight);
        if (radius) point.radius = radius;
        curvePoint.push(point);
    }
    return curvePoint;
}

export function calculateInnerAnglePosition(percent: number, angle: number) {
    const cx = 0.5;
    const cy = 0.5;
    let x = cx + (0.5 - cx) * Math.cos(angle) - (0 - cy) * Math.sin(angle);
    let y = cy + (0.5 - cx) * Math.sin(angle) + (0 - cy) * Math.cos(angle);
    const maxpoint = { x, y }

    const newX = cx + ((maxpoint.x - cx) * percent);
    const newY = cy + ((maxpoint.y - cy) * percent);

    return { x: newX, y: newY };
}

export function border2path(shape: ShapeView, border: Border, width: number, height: number) {
    const stack: IPalPath[] = [];

    const make = (path: string) => {
        stack.push(gPal.makePalPath(path));
        return stack[stack.length - 1];
    }
    const dashPath = (p: IPalPath) => p.dash(10, 10, 1);

    const position = border.position;
    const setting = border.sideSetting;
    const isDash = border.borderStyle.gap;

    const startMarker = shape.startMarkerType;
    const endMarker = shape.endMarkerType;

    // 尺寸小于或等于14，会出现线条走样，这里把它放到到20，返回出去的时候再等比例放回来
    const radio = Math.min(width / 20, height / 20);

    const mark = (shape instanceof PathShapeView)
        && !!(startMarker || endMarker)
        && shape.segments.length === 1
        && !shape.segments[0].isClosed;

    const isEven = (setting.thicknessTop + setting.thicknessRight + setting.thicknessBottom + setting.thicknessLeft) / 4 === setting.thicknessLeft;

    let __path_str = '';

    const join = (() => {
        const type = border.cornerType;
        if (type === CornerType.Round) return Join.ROUND;
        else if (type === CornerType.Bevel) return Join.BEVEL;
        else return Join.MITER;
    })();

    const cap = (() => {
        const end = shape.style.endMarkerType;
        const start = shape.style.startMarkerType;
        if (end === MarkerType.Round && start === MarkerType.Round) return Cap.ROUND;
        else if (end === MarkerType.Square && start === MarkerType.Square) return Cap.SQUARE;
        else return Cap.BUTT;
    })();

    const basicParams: any = {
        join: { value: join },
        cap: { value: cap }
    };

    const path = getPathStr();
    const thickness = getThickness();

    if (mark) {
        const p0 = make(path);
        if (isDash) dashPath(p0);
        p0.stroke(Object.assign(basicParams, { width: thickness }));

        const startCap = getStartCap();
        if (startCap) p0.union(startCap);

        const endCap = getEndCap();
        if (endCap) p0.union(endCap);

        const __start = getStartMarkPath();
        if (__start) p0.union(__start);

        const __end = getEndMarkPath();
        if (__end) p0.union(__end);

        __path_str = p0.toSVGString();
    } else if (isEven) {
        const __open = (shape instanceof PathShapeView) && shape.segments.some(i => !i.isClosed);
        if (__open) {
            const p0 = make(path);
            if (isDash) dashPath(p0);
            p0.stroke(Object.assign(basicParams, { width: thickness }));
            __path_str = p0.toSVGString();
        } else {
            if (position === BorderPosition.Outer) {
                const p0 = make(path);
                const p1 = make(path);
                if (isDash) dashPath(p0);
                p0.stroke(Object.assign(basicParams, { width: thickness * 2 }));
                p0.subtract(p1);
                __path_str = p0.toSVGString();
            } else if (position === BorderPosition.Center) {
                const p0 = make(path);
                if (isDash) dashPath(p0);
                p0.stroke(Object.assign(basicParams, { width: thickness }));
                __path_str = p0.toSVGString();
            } else {
                const path = getPathStr();
                const p0 = make(path);
                const p1 = make(path);
                if (isDash) dashPath(p0);
                p0.stroke(Object.assign(basicParams, { width: thickness * 2 }));
                p0.intersection(p1);
                __path_str = p0.toSVGString();
            }
        }
    } else {
        if (!shape.data.haveEdit) {
            const path = strokeOdd()
            if (path) __path_str = path.toSVGString();
        }
    }

    stack.forEach(i => i?.delete());

    const result = Path.fromSVGString(__path_str);
    if (radio < 1) {
        const matrix = new Matrix();
        matrix.scale(radio);
        result.transform(matrix);
    }
    return result;

    function getRadians(pre: CurvePoint, next: CurvePoint, isEnd?: boolean) {
        if (!pre.hasFrom && !next.hasTo) {
            const deltaX = (next.x - pre.x) * width;
            const deltaY = (next.y - pre.y) * height;
            return Math.atan2(deltaY, deltaX);
        } else {
            const p0 = { x: pre.x * width, y: pre.y * height } as Point2D;
            const p3 = { x: next.x * width, y: next.y * height } as Point2D;

            const p1 = { x: (pre.fromX || pre.x) * width, y: (pre.fromY || pre.y) * height } as Point2D;
            const p2 = { x: (next.toX || next.x) * width, y: (next.toY || next.y) * height } as Point2D;

            return tangent(p0, p1, p2, p3, isEnd ? 1 : 0);
        }

        function tangent(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number) {
            if (pre.fromX !== undefined && next.toX !== undefined) {
                const tangent = {
                    x: 3 * (1 - t) ** 2 * (p1.x - p0.x) + 6 * (1 - t) * t * (p2.x - p1.x) + 3 * t ** 2 * (p3.x - p2.x),
                    y: 3 * (1 - t) ** 2 * (p1.y - p0.y) + 6 * (1 - t) * t * (p2.y - p1.y) + 3 * t ** 2 * (p3.y - p2.y),
                }
                return Math.atan2(tangent.y, tangent.x);
            } else if (next.toX !== undefined) {
                let dx = 2 * ((1 - t) * (p2.x - p0.x) + t * (p3.x - p2.x));
                let dy = 2 * ((1 - t) * (p2.y - p0.y) + t * (p3.y - p2.y));
                return Math.atan2(dy, dx);
            } else {
                let dx = 2 * ((1 - t) * (p1.x - p0.x) + t * (p3.x - p1.x));
                let dy = 2 * ((1 - t) * (p1.y - p0.y) + t * (p3.y - p1.y));
                return Math.atan2(dy, dx)
            }
        }
    }

    function getStartCap() {
        if (startMarker !== MarkerType.Round && startMarker !== MarkerType.Square) return;
        const round = make(path);
        const cap = startMarker === MarkerType.Round ? Cap.ROUND : Cap.SQUARE;
        round.stroke({ cap: { value: cap } as any, width: thickness, join: { value: join } as any });
        return round;
    }

    function getEndCap() {
        if (endMarker !== MarkerType.Round && endMarker !== MarkerType.Square) return;
        const round = make(path);
        const cap = endMarker === MarkerType.Round ? Cap.ROUND : Cap.SQUARE;
        round.stroke({ cap: { value: cap } as any, width: thickness, join: { value: join } as any });
        return round;
    }

    function getStartMarkPath() {
        if (!startMarker) return undefined;
        let points = (shape as PathShapeView).segments[0].points;
        if (shape instanceof ContactLineView) points = shape.getPoints();
        const first = points[0];
        const second = points[1];

        if (startMarker === MarkerType.OpenArrow) {
            const radians = getRadians(first as CurvePoint, second as CurvePoint);
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const __mark_points = [
                { x: fixedX + 3.5 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX - 0.5 * thickness, y: fixedY },
                { x: fixedX + 3.5 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y}`;
            const __end = make(pathstr);
            const p = {
                res_scale: 10000,
                width: thickness,
                cap: { value: Cap.ROUND } as any,
                join: { value: Join.ROUND } as any,
            }
            __end.stroke(p);
            return __end;
        } else if (startMarker === MarkerType.FilledArrow) {
            const radians = getRadians(first as CurvePoint, second as CurvePoint);
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const __mark_points = [
                { x: fixedX + 3 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX - 3 * thickness, y: fixedY },
                { x: fixedX + 3 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} z`;
            return make(pathstr);
        } else if (startMarker === MarkerType.FilledCircle) {
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const radius = thickness * 3;
            const pathstr = `M${fixedX} ${fixedY} h ${-radius} a${radius} ${radius} 0 1 0 ${2 * radius} 0 a${radius} ${radius} 0 1 0 ${-2 * radius} 0`;

            return make(pathstr);
        } else if (startMarker === MarkerType.FilledSquare) {
            const radians = getRadians(first as CurvePoint, second as CurvePoint);
            const fixedX = first.x * width;
            const fixedY = first.y * height;
            const __mark_points = [
                { x: fixedX, y: fixedY - 3 * thickness },
                { x: fixedX - 3 * thickness, y: fixedY },
                { x: fixedX, y: fixedY + 3 * thickness },
                { x: fixedX + 3 * thickness, y: fixedY }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3, p4] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} z`;
            return make(pathstr);
        }
    }

    function getEndMarkPath() {
        if (!endMarker) return;
        let points = (shape as PathShapeView).segments[0].points;
        if (shape instanceof ContactLineView) points = shape.getPoints();
        const lastPoint = points[points.length - 1];
        const preLastPoint = points[points.length - 2];
        if (endMarker === MarkerType.OpenArrow) {
            const radians = getRadians(preLastPoint as CurvePoint, lastPoint as CurvePoint, true);
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const __mark_points = [
                { x: fixedX - 3.5 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX + 0.5 * thickness, y: fixedY },
                { x: fixedX - 3.5 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y}`;
            const __end = make(pathstr);
            __end.stroke({
                width: thickness,
                cap: { value: Cap.ROUND } as any,
                join: { value: Join.ROUND } as any,
            });

            return __end;
        } else if (endMarker === MarkerType.FilledArrow) {
            const radians = getRadians(preLastPoint as CurvePoint, lastPoint as CurvePoint, true);
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const __mark_points = [
                { x: fixedX - 3 * thickness, y: fixedY - 3 * thickness },
                { x: fixedX + 3 * thickness, y: fixedY },
                { x: fixedX - 3 * thickness, y: fixedY + 3 * thickness }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} z`;
            return make(pathstr);
        } else if (endMarker === MarkerType.FilledCircle) {
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const radius = thickness * 3;
            const pathstr = `M${fixedX} ${fixedY} h ${-radius} a${radius} ${radius} 0 1 0 ${2 * radius} 0 a${radius} ${radius} 0 1 0 ${-2 * radius} 0`;
            return make(pathstr);
        } else if (endMarker === MarkerType.FilledSquare) {
            const radians = getRadians(preLastPoint as CurvePoint, lastPoint as CurvePoint, true);
            const fixedX = lastPoint.x * width;
            const fixedY = lastPoint.y * height;
            const __mark_points = [
                { x: fixedX, y: fixedY - 3 * thickness },
                { x: fixedX + 3 * thickness, y: fixedY },
                { x: fixedX, y: fixedY + 3 * thickness },
                { x: fixedX - 3 * thickness, y: fixedY }
            ];
            const m = new Matrix();
            m.rotate(radians, fixedX, fixedY);
            __mark_points.forEach(i => {
                const __p = m.computeCoord3(i);
                i.x = __p.x;
                i.y = __p.y;
            });
            const [p1, p2, p3, p4] = __mark_points;
            const pathstr = `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y} L${p4.x} ${p4.y} z`;
            return make(pathstr);
        }
    }

    function getOddSide(thickness: number, path: string) {
        if (!(thickness > 0)) return;
        if (position === BorderPosition.Inner) {
            const p0 = make(getPathStr());
            const p1 = make(path);
            if (isDash) dashPath(p1);
            p1.stroke(Object.assign(basicParams, { width: thickness * 2 }));
            p1.intersection(p0);
            return p1;
        } else if (position === BorderPosition.Center) {
            const p1 = make(path);
            if (isDash) dashPath(p1);
            p1.stroke(Object.assign(basicParams, { width: thickness }));
            return p1;
        } else {
            const p0 = make(getPathStr());
            const p1 = make(path);
            if (isDash) dashPath(p1);
            p1.stroke(Object.assign(basicParams, { width: thickness * 2 }));
            p1.subtract(p0);
            return p1;
        }
    }

    function strokeOdd() {
        let path = getOddSide(setting.thicknessTop, `M0 0 h${width}`);

        const right = getOddSide(setting.thicknessRight, `M${width} 0 L${width} ${height}`);
        if (right && path) {
            path.union(right);
        } else if (right) {
            path = right;
        }

        const bottom = getOddSide(setting.thicknessBottom, `M${width} ${height} L0 ${height}`);
        if (bottom && path) {
            path.union(bottom);
        } else if (bottom) {
            path = bottom;
        }

        const left = getOddSide(setting.thicknessLeft, `M0 ${height} L0 0`);
        if (left && path) {
            path.union(left);
        } else if (left) {
            path = left;
        }

        const __cor = corner();
        if (path && __cor) path.union(__cor);

        return path;
    }

    function corner() {
        const type = border.cornerType;
        if (border.position === BorderPosition.Inner) return;
        let { thicknessBottom: b, thicknessRight: r, thicknessLeft: l, thicknessTop: t } = setting;
        if (border.position === BorderPosition.Center) {
            b /= 2;
            r /= 2;
            l /= 2;
            t /= 2;
        }
        const w = width;
        const h = height;
        let cornerPathStr = '';
        if (type === CornerType.Bevel) {
            if (t && r) {
                cornerPathStr += `M${w} ${-t} L${w + r} 0 h${-r} z`;
            }
            if (r && b) {
                cornerPathStr += `M${w + r} ${h} L${w} ${h + b} v${-b} z`;
            }
            if (b && l) {
                cornerPathStr += `M0 ${h + b} L${-l} ${h} h${l} z`;
            }
            if (l && t) {
                cornerPathStr += `M${-l} 0 L0 ${-t} v${t} z`;
            }
        } else if (type === CornerType.Round) {
            if (t && r) {
                if (t > r) {
                    cornerPathStr += `M${w} ${-t} a${r} ${r} 0 0 1 ${r} ${r} L${w + r} 0 h${-r} z`;
                } else {
                    cornerPathStr += `M${w} ${-t} L${w + r - t} ${-t} a${t} ${t} 0 0 1 ${t} ${t} h${-r} z`;
                }
            }
            if (r && b) {
                if (r > b) {
                    cornerPathStr += `M${w + r} ${h} a${b} ${b} 0 0 1 ${-b} ${b} L${w} ${h + b} v${-b}z`;
                } else {
                    cornerPathStr += `M${w + r} ${h} L${w + r} ${h + b - r} a${r} ${r} 0 0 1 ${-r} ${r} v${-b} z`;
                }
            }
            if (b && l) {
                if (b > l) {
                    cornerPathStr += `M0 ${h + b} a${l} ${l} 0 0 1 ${-l} ${-l} L${-l} ${h} h${l} z`;
                } else {
                    cornerPathStr += `M0 ${h + b} h${-l + b} a${b} ${b} 0 0 1 ${-b} ${-b} h${l} z`;
                }
            }
            if (l && t) {
                if (l > t) {
                    cornerPathStr += `M${-l} 0 a${t} ${t} 0 0 1 ${t} ${-t} L0 ${-t} v${t} z`;
                } else {
                    cornerPathStr += `M${-l} 0 L${-l} ${-t + l} a${l} ${l} 0 0 1 ${l} ${-l} v${t}`;
                }
            }
        } else {
            if (t && r) {
                cornerPathStr += `M${w} ${-t} h${r} v${t} h${-r} z`;
            }
            if (r && b) {
                cornerPathStr += `M${w + r} ${h} v${b} h${-r} v${-b} z`;
            }
            if (b && l) {
                cornerPathStr += `M0 ${h + b} h${-l} v${-b} h${l} z`;
            }
            if (l && t) {
                cornerPathStr += `M${-l} 0 v${-t} h${l} v${t} z`;
            }
        }

        if (cornerPathStr) return make(cornerPathStr);
    }

    function getPathStr() {
        const path = shape.getPath().clone();
        if (radio < 1) {
            const matrix = new Matrix();
            matrix.scale(1 / radio)
            path.transform(matrix);
            return path.toString();
        } else {
            return shape.getPathStr();
        }
    }

    function getThickness() {
        if (radio < 1) {
            return setting.thicknessTop / radio;
        } else return setting.thicknessTop;
    }
}
