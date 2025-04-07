/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */
import { ContactForm, ContactShape, Page, Shape, ShapeType, Fill, Blur } from "../data";
import {
    ContactType, CurveMode,
    CurvePoint,
    Transform
} from "../data";
import { DViewCtx, PropsType } from "./viewctx";
import { PathShapeView } from "./pathshape";
import { ShapeView } from "./shape";
import { BasicArray } from "../data";
import { PageView } from "./page";
import { v4 } from "uuid";
import { Point2D } from "../data/typesdefine";
import { ContactModifyEffect } from "./proxy/effects/contact";
import { ContactLineViewCache } from "./proxy/cache/contact";
import { ContactLayout } from "./proxy/layout/contact";
import { ContactFrameProxy } from "./proxy/frame/contact";

export class ContactLineView extends PathShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.update = this.update.bind(this);
        this.m_ctx.tails.add(this);
        this.frameProxy = new ContactFrameProxy(this);
        this.effect = new ContactModifyEffect(this);
        this.cache = new ContactLineViewCache(this);
        this.layoutProxy = new ContactLayout(this);
    }

    updateAtLast() {
        this.updateApex();
        this.cache.clearCacheByKeys(['m_path', 'm_pathstr']);
        this.layoutProxy.updateFrames();
    }

    /* ===private=== */
    /* 两端的环境，环境中改变会影响到连接线的路径生成 */
    private fromparents: Shape[] = [];
    private toparents: Shape[] = [];

    private update() {
        this.updateApex();
        this.cache.clearCacheByKeys(['m_path', 'm_pathstr']);
        this.m_ctx.setDirty(this);
        this.layoutProxy.updateFrames();
    }

    /* 监听端点view以及其所处环境 */
    private watchApex(shape: Shape, parents: Shape[]) {
        shape.watch(this.update);
        let p = shape.parent;
        while (p && p.type !== ShapeType.Page) {
            p.watch(this.update);
            parents.push(p);
            p = p.parent;
        }
    }

    /* 卸载watchApex挂载的监听 */
    private unwatchApex(shape: Shape, parents: Shape[]) {
        shape.unwatch(this.update);
        parents.forEach(p => {
            p.unwatch(this.update);
        });
        parents.length = 0;
    }

    /* ===维护from端以及其需要监听的views列表=== */
    private watchFromApex(apex: ContactForm | undefined) {
        if (!apex) {
            if (this.fromShape) {
                this.unwatchApex(this.fromShape, this.fromparents);
                this.fromShape = undefined;
            }
            return;
        }

        const page = this.getPage()?.data as Page;

        const apexShape = page?.getShape(apex.shapeId);
        if (apexShape) {
            if (this.fromShape) this.unwatchApex(this.fromShape, this.fromparents);
            this.fromShape = apexShape;
            this.watchApex(this.fromShape, this.fromparents);
        } else if (this.fromShape) {
            this.unwatchApex(this.fromShape, this.fromparents);
            this.fromShape = undefined;
        }
    }

    /* ===维护to端以及其需要监听的views列表=== */
    private watchToApex(apex: ContactForm | undefined) {
        if (!apex) {
            if (this.toShape) {
                this.unwatchApex(this.toShape, this.toparents);
                this.toShape = undefined;
            }
            return;
        }

        const page = this.getPage()?.data as Page;

        const apexShape = page?.getShape(apex.shapeId);

        if (apexShape) {
            if (this.toShape) this.unwatchApex(this.toShape, this.toparents);
            this.toShape = apexShape;
            this.watchApex(this.toShape, this.toparents);
        } else if (this.toShape) {
            this.unwatchApex(this.toShape, this.toparents);
            this.toShape = undefined;
        }
    }

     updateApex() {
        this.watchFromApex(this.contactFrom);
        this.watchToApex(this.contactTo)
    }

    /* ===public=== */
    fromShape: Shape | undefined;
    toShape: Shape | undefined;

    get contactFrom() {
        return this.data.from;
    }

    get contactTo() {
        return this.data.to;
    }

    get data(): ContactShape {
        return this.m_data as ContactShape;
    }

    get isClosed(): boolean {
        return false;
    }

    get isEdited(): boolean {
        return this.data.isEdited;
    }

    get points() {
        return (this.segments[0]?.points ?? new BasicArray<CurvePoint>()) as CurvePoint[];
    }

    onMounted() {
        super.onMounted();
        this.update();
    }

    /* 获取与端点的连接位置 */
    getApexXY(view: ShapeView, type: ContactType, transform: Transform) {
        const f = view.frame;
        switch (type) {
            case ContactType.Top:
                return transform.computeCoord2(f.x + f.width / 2, f.y);
            case ContactType.Right:
                return transform.computeCoord2(f.x + f.width, f.y + f.height / 2);
            case ContactType.Bottom:
                return transform.computeCoord2(f.x + f.width / 2, f.y + f.height);
            case ContactType.Left:
                return transform.computeCoord2(f.x, f.y + f.height / 2);
            default:
                return transform.computeCoord2(f.x + f.width / 2, f.y);
        }
    }

    /* 获取与端点的外围连接位置 */
    getBorderPoint(view: ShapeView, type: ContactType) {
        const f = view.frame;
        const transform = view.matrix2Root();
        const points = [
            { x: f.x, y: f.y },
            { x: f.x + f.width, y: f.y },
            { x: f.x + f.width, y: f.y + f.height },
            { x: f.x, y: f.y + f.height }
        ];
        const box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
        for (let i = 1; i < 4; i++) {
            const p = points[i];
            const t = transform.computeCoord2(p.x, p.y);
            if (t.x < box.left) {
                box.left = t.x;
            } else if (t.x > box.right) {
                box.right = t.x;
            }
            if (t.y < box.top) {
                box.top = t.y
            } else if (t.y > box.bottom) {
                box.bottom = t.y
            }
        }
        box.left -= 20;
        box.right += 20;
        box.top -= 20;
        box.bottom += 20;
        let op = this.getApexXY(view, type, transform);
        const d1 = Math.abs(op.y - box.top);
        const d2 = Math.abs(op.x - box.right);
        const d3 = Math.abs(op.y - box.bottom);
        const d4 = Math.abs(op.x - box.left);
        let min_dis = d1;
        const save = { x: op.x, y: op.y };
        op = { x: save.x, y: box.top };
        if (d2 < min_dis) {
            min_dis = d2;
            op = { x: box.right, y: save.y };
        }
        if (d3 < min_dis) {
            min_dis = d3;
            op = { x: save.x, y: box.bottom };
        }
        if (d4 < min_dis) op = { x: box.left, y: save.y };
        return op;
    }

    onDestroy(): void {
        super.onDestroy();
        if (this.fromShape) {
            this.unwatchApex(this.fromShape, this.fromparents);
            this.fromShape = undefined;
        }
        if (this.toShape) {
            this.unwatchApex(this.toShape, this.toparents);
            this.toShape = undefined;
        }
    }
    get isImageFill() {
        return false;
    }

    getFills(): BasicArray<Fill> {
        return new BasicArray();
    }

    get blur(): Blur | undefined {
        return undefined;
    }
    /* 获取生成连接线路径的点 */
    getPoints(): CurvePoint[] {
        const points = [...this.points] as CurvePoint[];
        const page: PageView = this.getPage() as PageView;
        if (!page) return points;
        let fromBorderPoint: undefined | Point2D = undefined;
        let toBorderPoint: undefined | Point2D = undefined;

        let self_matrix: undefined | Transform;
        let from_matrix: undefined | Transform;
        let to_matrix: undefined | Transform;

        let fromShape: undefined | ShapeView;
        let toShape: undefined | ShapeView;

        let fromContactType: ContactType;
        let toContactType: ContactType;

        let start: Point2D | undefined = undefined;
        let end: Point2D | undefined = undefined;

        if (this.contactFrom || this.contactTo) self_matrix = this.matrix2Root().inverse;

        const fromInfo = getContactForm(page, this, this.contactFrom);
        if (fromInfo) {
            fromShape = fromInfo.apex;
            fromContactType = this.contactFrom!.contactType;
            from_matrix = fromShape.matrix2Root();
            const point = self_matrix!.computeCoord3(fromInfo.point);
            points[0] = new CurvePoint([0] as BasicArray<number>, '', point.x, point.y, CurveMode.Straight);
            const borderPoint = self_matrix!.computeCoord3(fromInfo.borderPoint);
            points.splice(1, 0, new CurvePoint([1] as BasicArray<number>, '', borderPoint.x, borderPoint.y, CurveMode.Straight));
            start = point;
            fromBorderPoint = borderPoint;
        }

        const toInfo = getContactForm(page, this, this.contactTo);
        if (toInfo) {
            toShape = toInfo.apex;
            toContactType = this.contactTo!.contactType;
            to_matrix = toShape.matrix2Root();
            const point = self_matrix!.computeCoord3(toInfo.point);
            points[points.length - 1] = new CurvePoint(([points.length - 1] as BasicArray<number>), v4(), point.x, point.y, CurveMode.Straight);
            const borderPoint = self_matrix!.computeCoord3(toInfo.borderPoint);
            points.push(new CurvePoint(([points.length] as BasicArray<number>), v4(), borderPoint.x, borderPoint.y, CurveMode.Straight));
            end = point;
            toBorderPoint = borderPoint;
        }

        if (points.length < 2) return points;

        if (this.isEdited) {
            start = start ?? points[0];
            end = end ?? points[points.length - 1];
            return pathForEdited(points as CurvePoint[], start, end, fromBorderPoint, toBorderPoint);
        }

        if (fromShape && toShape) {
            const result = gen_path(fromShape, fromContactType!, toShape, toContactType!, from_matrix!, to_matrix!, self_matrix!);
            if (result?.length) return slice_invalid_point(result);
        }

        if (!fromShape && !toShape) path_for_free_contact(points, 1, 1);

        if (fromShape && !toShape) path_for_free_end_contact(this, points, fromBorderPoint);

        if (!fromShape && toShape) path_for_free_start_contact(points, end, 1, 1);

        return slice_invalid_point(points);
    }
}

/* 获取连接线的端点图层以及端点位置 */
function getContactForm(page: PageView, view: ContactLineView, contactForm: ContactForm | undefined) {
    if (!contactForm) return;
    const apex = page.getShape(contactForm.shapeId);
    if (!apex) return;
    const point = view.getApexXY(apex, contactForm.contactType, apex.matrix2Root());
    const borderPoint = view.getBorderPoint(apex, contactForm.contactType);
    return { apex, point, borderPoint };
}

/* 为编辑过的连接线生成路径 */
function pathForEdited(
    points: CurvePoint[],
    start_point: Point2D,
    end_point: Point2D,
    s1: Point2D | undefined,
    s2: Point2D | undefined
) {
    const result: CurvePoint[] = [...points];

    // 编辑过后，不需要外围点再做为活点
    if (s1) {
        result.splice(1, 1);
    } else {
        s1 = result[1];
    }

    if (s2) {
        result.splice(result.length - 2, 1);
    } else {
        s2 = result[result.length - 2];
    }

    { // 在第一个点后面再寻找一个新的活点
        const flex_point1 = start_point;
        let p: undefined | CurvePoint;

        const _d = d(flex_point1, s1 as Point2D);

        if (_d === 'hor') {
            const f2 = result[1];
            if (f2) {
                p = new CurvePoint([] as any, '--', f2.x, flex_point1.y, CurveMode.Straight);
            }
        } else if (_d === 'ver') {
            const f3 = result[2];
            if (f3) {
                p = new CurvePoint([] as any, '--', flex_point1.x, f3.y, CurveMode.Straight);
            }
        }

        if (p) result.splice(1, 1, p);
    }

    {
        const len = result.length;
        const flex_point1 = end_point;
        const _d = d(flex_point1, s2 as Point2D);
        if (_d === 'hor') {
            const last2 = result[len - 2];
            if (last2) {
                const p = new CurvePoint([] as any, '--', last2.x, flex_point1.y, CurveMode.Straight);
                result.splice(len - 2, 1, p);
            }
        } else if (_d === 'ver') {
            const last3 = result[len - 3];
            if (last3) {
                const p = new CurvePoint([] as any, '--', flex_point1.x, last3.y, CurveMode.Straight);
                result.splice(len - 2, 1, p);
            }
        }
        result[result.length - 1] = new CurvePoint([] as any, '--', flex_point1.x, flex_point1.y, CurveMode.Straight);
    }

    return slice_invalid_point(result);
}

/* 一定误差范围内的相等判定 */
function isEqu(a: number, b: number) {
    return Math.abs(a - b) < 0.00001;
}

/* 获取两条线的交点 */
function get_intersection(line1: [Point2D, Point2D], line2: [Point2D, Point2D]) {
    if (isEqu(line1[0].x, line1[1].x) && isEqu(line2[0].x, line2[1].x)) return false;
    if (isEqu(line1[0].y, line1[1].y) && isEqu(line2[0].y, line2[1].y)) return false;
    if (isEqu(line1[0].y, line1[1].y) && isEqu(line2[0].x, line2[1].x)) return { x: line2[0].x, y: line1[0].y };
    if (isEqu(line1[0].x, line1[1].x) && isEqu(line2[0].y, line2[1].y)) return { x: line1[0].x, y: line2[0].y };
}

/* 去除重复点 */
function remove_duplicate_point(points: Point2D[]) {
    const result: Point2D[] = [], cache: any = {};
    for (let i = 0, len = points.length; i < len; i++) {
        const { x, y } = points[i];
        if (cache[`${x}_${y}`]) {
            continue;
        }
        result.push(points[i]);
        cache[`${x}_${y}`] = true;
    }
    return result;
}

/* 根据连接类型获取页面坐标系上的连接点 */
function get_pagexy(shape: ShapeView, type: ContactType, m2r: Transform) {
    const f = shape.frame;
    switch (type) {
        case ContactType.Top:
            return m2r.computeCoord2(f.x + f.width / 2, f.y);
        case ContactType.Right:
            return m2r.computeCoord2(f.x + f.width, f.y + f.height / 2);
        case ContactType.Bottom:
            return m2r.computeCoord2(f.x + f.width / 2, f.y + f.height);
        case ContactType.Left:
            return m2r.computeCoord2(f.x, f.y + f.height / 2);
        default:
            return false
    }
}

function XYsBoundingPoints(points: Point2D[]) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        xs.push(p.x);
        ys.push(p.y);
    }
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    return [
        { x: left, y: top }, // 矩形顶点
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
    ];
}

/* 生成寻路计算的必要参数，其中确定点位(绘制寻路地图)是关键 */
function gen_basic_params(apexFrom: ShapeView, type1: ContactType, apexTo: ShapeView, type2: ContactType, m1: Transform, m2: Transform) {
    const OFFSET = 20;
    const p1 = apexFrom.parent
    const p2 = apexTo.parent;
    if (!p1 || !p2) return;
    const p2r1 = p1.matrix2Root();
    const p2r2 = p2.matrix2Root();
    const box1 = apexFrom.boundingBox();
    const box2 = apexTo.boundingBox();
    const s1xy1 = p2r1.computeCoord2(box1.x, box1.y);
    const s2xy1 = p2r2.computeCoord2(box2.x, box2.y);
    const s1xy2 = p2r1.computeCoord(box1.x + box1.width, box1.y + box1.height),
        s2xy2 = p2r2.computeCoord2(box2.x + box2.width, box2.y + box2.height);
    const s1w = s1xy2.x - s1xy1.x, s1h = s1xy2.y - s1xy1.y;
    const s2w = s2xy2.x - s2xy1.x, s2h = s2xy2.y - s2xy1.y;
    const ff1 = { x: s1xy1.x, y: s1xy1.y, width: s1w, height: s1h };
    const ff2 = { x: s2xy1.x, y: s2xy1.y, width: s2w, height: s2h };
    const start_point = get_pagexy(apexFrom, type1, m1), end_point = get_pagexy(apexTo, type2, m2);
    if (!start_point || !end_point) return;
    let preparation_point: Point2D[] = [];
    const b_start_point = get_nearest_border_point(apexFrom, type1, m1, s1xy1, s1xy2);
    const b_end_point = get_nearest_border_point(apexTo, type2, m2, s2xy1, s2xy2);
    if (!b_start_point || !b_end_point) return;

    preparation_point.push(b_start_point, b_end_point); // 获取伪起点和伪终点,并将它们添加到数组里

    const t1 = { x: s1xy1.x - OFFSET, y: s1xy1.y - OFFSET }, t2 = { x: s1xy2.x + OFFSET, y: s1xy2.y + OFFSET };
    preparation_point.push(...XYsBoundingPoints([b_start_point, b_end_point, t1, t2])); // 伪起点和伪终点形成的矩形 和 起点元素包围框 组成一个大矩形 的四个顶点

    const t3 = { x: s2xy1.x - OFFSET, y: s2xy1.y - OFFSET }, t4 = { x: s2xy2.x + OFFSET, y: s2xy2.y + OFFSET };
    preparation_point.push(...XYsBoundingPoints([b_start_point, b_end_point, t3, t4])); // 伪起点和伪终点形成的矩形 和 终点元素包围框 组成一个大矩形 的四个顶点

    const t5 = get_intersection([start_point, b_start_point], [end_point, b_end_point]);
    if (t5) {
        preparation_point.push(t5);
    } else {
        const t7 = get_intersection([start_point, b_start_point], [b_end_point, {
            x: b_end_point.x + OFFSET,
            y: b_end_point.y
        }]);
        if (t7) {
            preparation_point.push(t7);
        }

        const t9 = get_intersection([start_point, b_start_point], [b_end_point, {
            x: b_end_point.x,
            y: b_end_point.y + OFFSET
        }]);
        if (t9) {
            preparation_point.push(t9);
        }

        const t11 = get_intersection([end_point, b_end_point], [b_start_point, {
            x: b_start_point.x + OFFSET,
            y: b_start_point.y
        }]);
        if (t11) {
            preparation_point.push(t11);
        }

        const t13 = get_intersection([end_point, b_end_point], [b_end_point, {
            x: b_start_point.x,
            y: b_start_point.y + OFFSET
        }]);
        if (t13) {
            preparation_point.push(t13);
        }
    }

    preparation_point = remove_duplicate_point(preparation_point);

    return { start_point, end_point, b_start_point, b_end_point, preparation_point, ff1, ff2 };
}

/* 一定范围误差内，判定ab为同一个点 */
function check_is_same_point(a: Point2D, b: Point2D) {
    return isEqu(a.x, b.x) && isEqu(a.y, b.y);
}

interface AP {
    id: string
    point: Point2D
    cost: number
    parent: AP | null
}

interface ShapeFrameLike {
    x: number
    y: number
    width: number
    height: number
}

class AStar {
    static OFFSET = 20;
    startPoint: Point2D;
    endPoint: Point2D;
    pointList: Point2D[];
    openList: AP[];
    closeList: AP[];
    shapeFrame1: ShapeFrameLike
    shapeFrame2: ShapeFrameLike

    constructor(f1: ShapeFrameLike, f2: ShapeFrameLike, sp: Point2D, ep: Point2D, ps: Point2D[]) {
        this.startPoint = sp;
        this.endPoint = ep;
        this.pointList = ps;
        this.openList = []; // 存放待遍历的点
        this.closeList = [];  // 存放已经遍历的点
        this.shapeFrame1 = f1;
        this.shapeFrame2 = f2;
    }

    run() {
        this.openList = [
            {
                id: v4(),
                point: this.startPoint, // 起点加入openList
                cost: 0, // 代价
                parent: null, // 父节点
            }
        ];
        this.closeList = [];
        while (this.openList.length) {
            const point = this.most_advantageous_point();
            if (check_is_same_point(point.point, this.endPoint)) {
                return this.best_path(point);
            } else {
                this.remove_from_open_list(point); // 先将point从openList中删除，并推入closeList
                this.closeList.push(point);
                const nextPoints: Point2D[] = this.next_points(point.point, this.pointList) as Point2D[]; // 寻找下一个点
                for (let i = 0; i < nextPoints.length; i++) {
                    const cur = nextPoints[i];
                    // 如果该点在closeList中，那么跳过该点
                    if (this.is_exist_list(cur, this.closeList)) continue;
                    if (!this.is_exist_list(cur, this.openList)) {
                        const pointObj: AP = {
                            id: v4(),
                            point: cur,
                            parent: point, // 设置point为下一个点的父节点
                            cost: 0,
                        };
                        this.cost_assessment(pointObj); // 计算好代价之后推入openList
                        this.openList.push(pointObj);
                    }
                }
            }
        }
        return []
    }

    run_easy() {
        this.openList = [
            {
                id: v4(),
                point: this.startPoint, // 起点加入openList
                cost: 0, // 代价
                parent: null, // 父节点
            }
        ];
        this.closeList = [];
        while (this.openList.length) {
            const point = this.most_advantageous_point();
            if (check_is_same_point(point.point, this.endPoint)) {
                return this.best_path(point);
            } else {
                this.remove_from_open_list(point); // 先将point从openList中删除，并推入closeList
                this.closeList.push(point);
                const nextPoints: Point2D[] = this.next_points2(point.point, this.pointList) as Point2D[]; // 寻找下一个点
                for (let i = 0; i < nextPoints.length; i++) {
                    const cur = nextPoints[i];
                    // 如果该点在closeList中，那么跳过该点
                    if (this.is_exist_list(cur, this.closeList)) continue;
                    if (!this.is_exist_list(cur, this.openList)) {
                        const pointObj: AP = {
                            id: v4(),
                            point: cur,
                            parent: point, // 设置point为下一个点的父节点
                            cost: 0,
                        };
                        this.cost_assessment(pointObj); // 计算好代价之后推入openList
                        this.openList.push(pointObj);
                    }
                }
            }
        }
        return []
    }

    // 获取openList中优先级最高的点，也就是代价最小的点
    most_advantageous_point() {
        let min = Infinity, point = this.openList[0];
        for (let i = 0, len = this.openList.length; i < len; i++) {
            const item = this.openList[i];
            if (item.cost < min) {
                point = item;
                min = item.cost;
            }
        }
        return point;
    }

    // 从point出发，找出其所有祖宗节点，也就是最短路径
    best_path(point: AP) {
        const path_nodes = [point];
        let p = point.parent;
        while (p) {
            path_nodes.unshift(p);
            p = p.parent;
        }
        return path_nodes.map((item) => item.point);
    }

    // 将点从openList中删除
    remove_from_open_list(point: AP) {
        const index = this.openList.findIndex((item) => item.id === point.id);
        this.openList.splice(index, 1);
    }

    // 检查点是否在列表中
    is_exist_list(point: Point2D, list: AP[]) {
        return list.find((item) => check_is_same_point(item.point, point));
    }

    next_points(point: Point2D, points: Point2D[]) {
        const { x, y } = point;
        const xSamePoints: Point2D[] = [];
        const ySamePoints: Point2D[] = [];
        // 找出x或y坐标相同的点
        for (let i = 0, len = points.length; i < len; i++) {
            const item = points[i];
            if (check_is_same_point(point, item)) continue;
            if (isEqu(item.x, x)) xSamePoints.push(item);
            if (isEqu(item.y, y)) ySamePoints.push(item);
        }
        // 找出x方向最近的点
        const xNextPoints = this.next_point_d(x, y, ySamePoints, "x", this.shapeFrame1, this.shapeFrame2);
        // 找出y方向最近的点
        const yNextPoints = this.next_point_d(x, y, xSamePoints, "y", this.shapeFrame1, this.shapeFrame2);
        return [...xNextPoints, ...yNextPoints];
    }

    next_points2(point: Point2D, points: Point2D[]) {
        const { x, y } = point;
        const xSamePoints: Point2D[] = [];
        const ySamePoints: Point2D[] = [];
        // 找出x或y坐标相同的点
        for (let i = 0, len = points.length; i < len; i++) {
            const item = points[i];
            if (check_is_same_point(point, item)) continue;
            if (isEqu(item.x, x)) xSamePoints.push(item);
            if (isEqu(item.y, y)) ySamePoints.push(item);
        }
        // 找出x方向最近的点
        const xNextPoints = this.next_point_d2(x, y, ySamePoints, "x");
        // 找出y方向最近的点
        const yNextPoints = this.next_point_d2(x, y, xSamePoints, "y");
        return [...xNextPoints, ...yNextPoints];
    }

    is_through(a: Point2D, b: Point2D, f1: ShapeFrameLike, f2: ShapeFrameLike) {
        let rects: ShapeFrameLike[] = [f1, f2];
        let minX = Math.min(a.x, b.x);
        let maxX = Math.max(a.x, b.x);
        let minY = Math.min(a.y, b.y);
        let maxY = Math.max(a.y, b.y);
        const offset = AStar.OFFSET - 2;
        // 水平线
        if (isEqu(a.y, b.y)) {
            for (let i = 0; i < rects.length; i++) {
                let rect = rects[i];
                if (minY >= rect.y - offset &&
                    maxY <= rect.y + rect.height + offset &&
                    minX <= rect.x + rect.width + offset &&
                    maxX >= rect.x - offset) {
                    return true;
                }
            }
        } else if (isEqu(a.x, b.x)) {
            // 垂直线
            for (let i = 0; i < rects.length; i++) {
                let rect = rects[i];
                if (minX >= rect.x - offset &&
                    maxX <= rect.x + rect.width + offset &&
                    minY <= rect.y + rect.height + offset &&
                    maxY >= rect.y - offset) {
                    return true;
                }
            }
        }
        return false;
    }

    next_point_d(x: number, y: number, list: Point2D[], dir: 'x' | 'y', f1: ShapeFrameLike, f2: ShapeFrameLike) {
        const value = dir === "x" ? x : y;
        let nextLeftTopPoint = null;
        let nextRightBottomPoint = null;
        for (let i = 0; i < list.length; i++) {
            let cur = list[i];
            // 检查当前点和目标点的连线是否穿过起终点元素
            if (this.is_through({ x, y }, cur, f1, f2)) continue;
            // 左侧或上方最近的点
            if (cur[dir] < value) {
                if (nextLeftTopPoint) {
                    if (cur[dir] > nextLeftTopPoint[dir]) nextLeftTopPoint = cur;
                } else {
                    nextLeftTopPoint = cur;
                }
            }
            // 右侧或下方最近的点
            if (cur[dir] > value) {
                if (nextRightBottomPoint) {
                    if (cur[dir] < nextRightBottomPoint[dir]) nextRightBottomPoint = cur;
                } else {
                    nextRightBottomPoint = cur;
                }
            }
        }
        return [nextLeftTopPoint, nextRightBottomPoint].filter((point) => !!point);
    }

    next_point_d2(x: number, y: number, list: Point2D[], dir: 'x' | 'y') {
        const value = dir === "x" ? x : y;
        let nextLeftTopPoint = null;
        let nextRightBottomPoint = null;
        for (let i = 0; i < list.length; i++) {
            let cur = list[i];
            // 左侧或上方最近的点
            if (cur[dir] < value) {
                if (nextLeftTopPoint) {
                    if (cur[dir] > nextLeftTopPoint[dir]) nextLeftTopPoint = cur;
                } else {
                    nextLeftTopPoint = cur;
                }
            }
            // 右侧或下方最近的点
            if (cur[dir] > value) {
                if (nextRightBottomPoint) {
                    if (cur[dir] < nextRightBottomPoint[dir]) nextRightBottomPoint = cur;
                } else {
                    nextRightBottomPoint = cur;
                }
            }
        }
        return [nextLeftTopPoint, nextRightBottomPoint].filter((point) => !!point);
    }

    // 计算一个点的代价
    cost_assessment(point: AP) {
        point.cost = this.g_cost(point) + this.h_cost(point);
    }

    g_cost(point: AP) {
        let cost = 0;
        let par = point.parent;
        while (par) {
            cost += par.cost;
            par = par.parent;
        }
        return cost;
    }

    h_cost(point: AP) {
        return (
            Math.abs(this.endPoint.x - point.point.x) +
            Math.abs(this.endPoint.y - point.point.y)
        )
    }
}

/* 为未编辑过的带有首位端点的连接线生成路径 */
function gen_path(apexFrom: ShapeView, type1: ContactType, apexTo: ShapeView, type2: ContactType, m1: Transform, m2: Transform, m3: Transform) {
    const params = gen_basic_params(apexFrom, type1, apexTo, type2, m1, m2);

    if (!params) return;

    let { start_point, end_point, b_start_point, b_end_point, preparation_point, ff1, ff2 } = params;

    const aStar = new AStar(ff1, ff2, b_start_point, b_end_point, preparation_point);

    let path = aStar.run();

    if (!path.length) { // 第二次寻找
        preparation_point = [start_point, ...preparation_point, end_point];
        const aStar2 = new AStar(ff1, ff2, start_point, end_point, preparation_point);
        path = aStar2.run_easy()
    }

    if (!path.length) return;

    path = [start_point, ...path, end_point];

    const points: CurvePoint[] = [];
    for (let i = 0, len = path.length; i < len; i++) {
        const p = m3.computeCoord3(path[i]);
        points.push(new CurvePoint([i] as BasicArray<number>, '--', p.x, p.y, CurveMode.Straight));
    }

    return points;
}

/**
 * @description 削减无效点，如果连续多个(大于等于3个)点在一条水平线或者垂直线上，那除了第一个和最后一个剩下的点被认为是无效点，
 * 如果不处理无效点，会造成线段折叠的路径片段，属于无效片段，处理过程即为切除无效片段
 */
function slice_invalid_point(points: CurvePoint[]) {
    let result_x = [points[0]]; // 线处理水平方向上的无效点
    for (let i = 1, len = points.length - 1; i < len; i++) {
        const p1y = points[i - 1].y;
        const p3y = points[i + 1].y;
        if (Math.abs(p3y - p1y) > 0.0001) result_x.push(points[i]);
    }
    result_x.push(points[points.length - 1]); // 再处理垂直方向上的无效点
    let result_y = [result_x[0]];
    for (let i = 1, len = result_x.length - 1; i < len; i++) {
        let p1x = result_x[i - 1].x;
        let p3x = result_x[i + 1].x;
        if (Math.abs(p3x - p1x) > 0.0001) result_y.push(result_x[i]);
    }
    result_y.push(result_x[result_x.length - 1]);
    return result_y;
}

/* 给两点确定两点是否同一水平或同一垂线上 */
function d(a: Point2D, b: Point2D): 'ver' | 'hor' | false {
    if (Math.abs(a.x - b.x) < 0.0001) return 'ver';
    if (Math.abs(a.y - b.y) < 0.0001) return 'hor';
    return false;
}

function get_direction_for_free_contact(start: CurvePoint, end: CurvePoint) {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    return dx > dy ? 'horizontal' : 'vertical';
}

const __handle: {
    [key: string]: (points: CurvePoint[], start: CurvePoint, end: CurvePoint, width: number, height: number) => void
} = {};
__handle['horizontal'] = function (points: CurvePoint[], start: CurvePoint, end: CurvePoint, width: number, height: number) {
    points.length = 0;
    if (Math.abs(start.x - end.x) * width < 5) {
        points.push(start, new CurvePoint(([2] as BasicArray<number>), v4(), start.x, end.y, CurveMode.Straight));
    } else if (Math.abs(start.y - end.y) * height < 5) {
        points.push(start, new CurvePoint(([2] as BasicArray<number>), v4(), end.x, start.y, CurveMode.Straight));
    } else {
        const mid = (end.x + start.x) / 2;
        const _p1 = new CurvePoint([1] as BasicArray<number>, v4(), mid, start.y, CurveMode.Straight);
        const _p2 = new CurvePoint(([2] as BasicArray<number>), v4(), mid, end.y, CurveMode.Straight);
        points.push(start, _p1, _p2, end);
    }
}
__handle['vertical'] = function (points: CurvePoint[], start: CurvePoint, end: CurvePoint, width: number, height: number) {
    points.length = 0;
    if (Math.abs(start.x - end.x) * width < 5) {
        points.push(start, new CurvePoint(([2] as BasicArray<number>), v4(), start.x, end.y, CurveMode.Straight));
    } else if (Math.abs(start.y - end.y) * height < 5) {
        points.push(start, new CurvePoint(([2] as BasicArray<number>), v4(), end.x, start.y, CurveMode.Straight));
    } else {
        const mid = (end.y + start.y) / 2;
        const _p1 = new CurvePoint([1] as BasicArray<number>, v4(), start.x, mid, CurveMode.Straight);
        const _p2 = new CurvePoint(([2] as BasicArray<number>), v4(), end.x, mid, CurveMode.Straight);
        points.push(start, _p1, _p2, end);
    }
}

function path_for_free_contact(points: CurvePoint[], width: number, height: number) {
    const start = points[0];
    const end = points[points.length - 1];

    if (!start || !end) return;

    const _start = { x: start.x * width, y: start.y * height };
    const _end = { x: end.x * width, y: end.y * height };
    const direction = get_direction_for_free_contact(_start as CurvePoint, _end as CurvePoint);

    __handle[direction](points, start, end, width, height);
}

function path_for_free_end_contact(shape: ContactLineView, points: CurvePoint[], start: Point2D | undefined) {
    if (!start) {
        const _s = points[0];
        start = { x: _s.x, y: _s.y };
    }
    const end = points.pop()!;

    if (Math.abs(start.y - end.y) * shape.size.height < 5) {
        points.push(new CurvePoint(([0] as BasicArray<number>), '', end.x, start.y, CurveMode.Straight));
    } else if (Math.abs(start.x - end.x) * shape.size.width < 5) {
        points.push(new CurvePoint(([0] as BasicArray<number>), '', start.x, end.y, CurveMode.Straight));
    } else {
        points.push(new CurvePoint(([0] as BasicArray<number>), '', end.x, start.y, CurveMode.Straight), end);
    }
}

function path_for_free_start_contact(points: CurvePoint[], end: Point2D | undefined, width: number, height: number) {
    if (!end) {
        return path_for_free_contact(points, width, height);
    }
    const start = points[0];
    const _end = new CurvePoint(([points.length - 1] as BasicArray<number>), v4(), end.x, end.y, CurveMode.Straight);

    const _start = { x: start.x * width, y: start.y * height };
    const __end = { x: end.x * width, y: end.y * height };

    const direction = get_direction_for_free_contact(_start as CurvePoint, __end as CurvePoint);

    __handle[direction](points, start, _end, width, height);
}

export function get_nearest_border_point(view: ShapeView, contactType: ContactType, m2r: Transform, xy1: Point2D, xy2: Point2D) { // 寻找距离外围最近的一个点
    const box = { left: xy1.x, right: xy2.x, top: xy1.y, bottom: xy2.y };
    const offset = AStar.OFFSET;
    box.left -= offset;
    box.right += offset;
    box.top -= offset;
    box.bottom += offset;
    let op = get_pagexy(view, contactType, m2r);
    if (op) {
        const d1 = Math.abs(op.y - box.top);
        const d2 = Math.abs(op.x - box.right);
        const d3 = Math.abs(op.y - box.bottom);
        const d4 = Math.abs(op.x - box.left);
        let min_dis = d1;
        const save = { x: op.x, y: op.y };
        op = { x: save.x, y: box.top };
        if (d2 < min_dis) {
            min_dis = d2;
            op = { x: box.right, y: save.y };
        }
        if (d3 < min_dis) {
            min_dis = d3;
            op = { x: save.x, y: box.bottom };
        }
        if (d4 < min_dis) {
            op = { x: box.left, y: save.y };
        }
        return op;
    }
}