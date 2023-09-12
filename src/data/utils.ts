import { v4 } from "uuid";
import { Matrix } from "../basic/matrix";
import { CurvePoint, Point2D, Shape } from "./shape";
import { ContactType, CurveMode } from "./typesdefine";

/**
 * @description root -> 图形自身上且单位为比例系数的矩阵
 */
export function gen_matrix1(shape: Shape, prem?: Matrix) {
    const f = shape.frame;
    let m = prem || shape.matrix2Root();
    m.preScale(f.width, f.height);
    m = new Matrix(m.inverse);
    return m;
}
interface PageXY {
    x: number
    y: number
}
interface XY {
    x: number
    y: number
}
/**
 * @description 根据连接类型获取页面坐标系上的连接点
 */
function get_pagexy(shape: Shape, type: ContactType, m2r: Matrix) {
    const f = shape.frame;
    switch (type) {
        case ContactType.Top: return m2r.computeCoord2(f.width / 2, 0);
        case ContactType.Right: return m2r.computeCoord2(f.width, f.height / 2);
        case ContactType.Bottom: return m2r.computeCoord2(f.width / 2, f.height);
        case ContactType.Left: return m2r.computeCoord2(0, f.height / 2);
        default: return false
    }
}
export function get_box_pagexy(shape: Shape) {
    const p = shape.parent;
    if (!p) return false;
    const p2r = p.matrix2Root();
    const box = shape.boundingBox();
    const xy1 = p2r.computeCoord2(box.x, box.y);
    const xy2 = p2r.computeCoord(box.x + box.width, box.y + box.height);
    return { xy1, xy2 }
}
export function get_nearest_border_point2(shape: Shape, contactType: ContactType, m2r: Matrix, xy1: PageXY, xy2: PageXY) { // 寻找距离外围最近的一个点
    const box = { left: xy1.x, right: xy2.x, top: xy1.y, bottom: xy2.y };
    const offset = AStar.OFFSET;
    box.left -= offset, box.right += offset, box.top -= offset, box.bottom += offset;
    let op = get_pagexy(shape, contactType, m2r);
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
function XYsBoundingPoints(points: PageXY[]) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        xs.push(p.x), ys.push(p.y);
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
/**
 * @description 一定误差范围内的相等判定
 */
function isEqu(a: number, b: number) {
    return Math.abs(a - b) < 0.0001;
}
/**
 * @description 获取两条线的焦点
 */
function get_intersection(line1: [PageXY, PageXY], line2: [PageXY, PageXY]) {
    if (isEqu(line1[0].x, line1[1].x) && isEqu(line2[0].x, line2[1].x)) return false;
    if (isEqu(line1[0].y, line1[1].y) && isEqu(line2[0].y, line2[1].y)) return false;
    if (isEqu(line1[0].y, line1[1].y) && isEqu(line2[0].x, line2[1].x)) return { x: line2[0].x, y: line1[0].y };
    if (isEqu(line1[0].x, line1[1].x) && isEqu(line2[0].y, line2[1].y)) return { x: line1[0].x, y: line2[0].y };
}
/**
 * @description 去除重复点
 */
function remove_duplicate_point(points: PageXY[]) {
    const result: PageXY[] = [], cache: any = {};
    for (let i = 0, len = points.length; i < len; i++) {
        const { x, y } = points[i];
        if (cache[`${x}_${y}`]) continue;
        result.push(points[i]);
        cache[`${x}_${y}`] = true;
    }
    return result;
}

/**
 * @description 生成寻路计算的必要参数，其中点位是关键
 */
export function gen_baisc_params(shape1: Shape, type1: ContactType, shape2: Shape, type2: ContactType, m1: Matrix, m2: Matrix) {
    const OFFSET = 20;
    const p1 = shape1.parent, p2 = shape2.parent;
    if (!p1 || !p2) return false;
    const p2r1 = p1.matrix2Root(), p2r2 = p2.matrix2Parent();
    const box1 = shape1.boundingBox(), box2 = shape2.boundingBox();
    const s1xy1 = p2r1.computeCoord2(box1.x, box1.y), s2xy1 = p2r2.computeCoord2(box2.x, box2.y);
    const s1xy2 = p2r1.computeCoord(box1.x + box1.width, box1.y + box1.height), s2xy2 = p2r2.computeCoord2(box2.x + box2.width, box2.y + box2.height);
    const s1w = s1xy2.x - s1xy1.x, s1h = s1xy2.y - s1xy1.y;
    const s2w = s2xy2.x - s2xy1.x, s2h = s2xy2.y - s2xy1.y;
    const ff1 = { x: s1xy1.x, y: s1xy1.y, width: s1w, height: s1h };
    const ff2 = { x: s2xy1.x, y: s2xy1.y, width: s2w, height: s2h };
    const start_point = get_pagexy(shape1, type1, m1), end_point = get_pagexy(shape2, type2, m2);
    if (!start_point || !end_point) return false;
    let preparation_point: PageXY[] = [];
    const b_start_point = get_nearest_border_point2(shape1, type1, m1, s1xy1, s1xy2);
    const b_end_point = get_nearest_border_point2(shape2, type2, m2, s2xy1, s2xy2);
    if (!b_start_point || !b_end_point) return false;

    preparation_point.push(b_start_point, b_end_point); // 获取伪起点和伪终点,并将它们添加到数组里

    const t1 = { x: s1xy1.x - OFFSET, y: s1xy1.y - OFFSET }, t2 = { x: s1xy2.x + OFFSET, y: s1xy2.y + OFFSET };
    preparation_point.push(...XYsBoundingPoints([b_start_point, b_end_point, t1, t2])); // 伪起点和伪终点形成的矩形 和 起点元素包围框 组成一个大矩形 的四个顶点

    const t3 = { x: s2xy1.x - OFFSET, y: s2xy1.y - OFFSET }, t4 = { x: s2xy2.x + OFFSET, y: s2xy2.y + OFFSET };
    preparation_point.push(...XYsBoundingPoints([b_start_point, b_end_point, t3, t4])); // 伪起点和伪终点形成的矩形 和 终点元素包围框 组成一个大矩形 的四个顶点

    const t5 = get_intersection([start_point, b_start_point], [end_point, b_end_point]);
    if (t5) preparation_point.push(t5);
    if (!t5) {
        const t7 = get_intersection([start_point, b_start_point], [b_end_point, { x: b_end_point.x + OFFSET, y: b_end_point.y }]);
        if (t7) preparation_point.push(t7);

        const t9 = get_intersection([start_point, b_start_point], [b_end_point, { x: b_end_point.x, y: b_end_point.y + OFFSET }]);
        if (t9) preparation_point.push(t9);

        const t11 = get_intersection([end_point, b_end_point], [b_start_point, { x: b_start_point.x + OFFSET, y: b_start_point.y }]);
        if (t11) preparation_point.push(t11);

        const t13 = get_intersection([end_point, b_end_point], [b_end_point, { x: b_start_point.x, y: b_start_point.y + OFFSET }]);
        if (t13) preparation_point.push(t13);
    }

    preparation_point = remove_duplicate_point(preparation_point);
    return { start_point, end_point, b_start_point, b_end_point, preparation_point, ff1, ff2 };
}
/**
 * @description 一定范围误差内，判定ab为同一个点
 */
function check_is_same_point(a: PageXY, b: PageXY) {
    return isEqu(a.x, b.x) && isEqu(a.y, b.y);
}
interface AP {
    id: string
    point: PageXY
    cost: number
    parent: AP | null
}
interface ShapeFrameLike {
    x: number
    y: number
    width: number
    height: number
}
// A*
class AStar {
    static OFFSET = 20;
    startPoint: PageXY;
    endPoint: PageXY;
    pointList: PageXY[];
    openList: AP[];
    closeList: AP[];
    shapeFrame1: ShapeFrameLike
    shapeFrame2: ShapeFrameLike
    constructor(f1: ShapeFrameLike, f2: ShapeFrameLike, sp: PageXY, ep: PageXY, ps: PageXY[]) {
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
                this.remove_from_openlist(point); // 先将point从openList中删除，并推入closeList
                this.closeList.push(point);
                const nextPoints: PageXY[] = this.next_points(point.point, this.pointList) as PageXY[]; // 寻找下一个点
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
                this.remove_from_openlist(point); // 先将point从openList中删除，并推入closeList
                this.closeList.push(point);
                const nextPoints: PageXY[] = this.next_points2(point.point, this.pointList) as PageXY[]; // 寻找下一个点
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
    remove_from_openlist(point: AP) {
        const index = this.openList.findIndex((item) => item.id === point.id);
        this.openList.splice(index, 1);
    }

    // 检查点是否在列表中
    is_exist_list(point: PageXY, list: AP[]) {
        return list.find((item) => check_is_same_point(item.point, point));
    }
    next_points(point: PageXY, points: PageXY[]) {
        const { x, y } = point;
        const xSamePoints: PageXY[] = [];
        const ySamePoints: PageXY[] = [];
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
    next_points2(point: PageXY, points: PageXY[]) {
        const { x, y } = point;
        const xSamePoints: PageXY[] = [];
        const ySamePoints: PageXY[] = [];
        // 找出x或y坐标相同的点
        for (let i = 0, len = points.length; i < len; i++) {
            const item = points[i];
            if (check_is_same_point(point, item)) continue;
            if (isEqu(item.x, x)) xSamePoints.push(item);
            if (isEqu(item.y, y)) ySamePoints.push(item);
        }
        // 找出x方向最近的点
        const xNextPoints = this.next_point_d2(x, y, ySamePoints, "x", this.shapeFrame1, this.shapeFrame2);
        // 找出y方向最近的点
        const yNextPoints = this.next_point_d2(x, y, xSamePoints, "y", this.shapeFrame1, this.shapeFrame2);
        return [...xNextPoints, ...yNextPoints];
    }
    is_through(a: PageXY, b: PageXY, f1: ShapeFrameLike, f2: ShapeFrameLike) {
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
    next_point_d(x: number, y: number, list: PageXY[], dir: 'x' | 'y', f1: ShapeFrameLike, f2: ShapeFrameLike) {
        const value = dir === "x" ? x : y;
        let nextLeftTopPoint = null;
        let nextRIghtBottomPoint = null;
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
                if (nextRIghtBottomPoint) {
                    if (cur[dir] < nextRIghtBottomPoint[dir]) nextRIghtBottomPoint = cur;
                } else {
                    nextRIghtBottomPoint = cur;
                }
            }
        }
        return [nextLeftTopPoint, nextRIghtBottomPoint].filter((point) => !!point);
    }
    next_point_d2(x: number, y: number, list: PageXY[], dir: 'x' | 'y', f1: ShapeFrameLike, f2: ShapeFrameLike) {
        const value = dir === "x" ? x : y;
        let nextLeftTopPoint = null;
        let nextRIghtBottomPoint = null;
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
                if (nextRIghtBottomPoint) {
                    if (cur[dir] < nextRIghtBottomPoint[dir]) nextRIghtBottomPoint = cur;
                } else {
                    nextRIghtBottomPoint = cur;
                }
            }
        }
        return [nextLeftTopPoint, nextRIghtBottomPoint].filter((point) => !!point);
    }
    // 计算一个点的代价
    cost_assessment(point: AP) {
        // point.cost = this.g_cost(point) + this.h_cost(point);
        point.cost = this.g_cost(point);
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
export function gen_path(shape1: Shape, type1: ContactType, shape2: Shape, type2: ContactType, m1: Matrix, m2: Matrix, m3: Matrix) {
    const params = gen_baisc_params(shape1, type1, shape2, type2, m1, m2);
    if (!params) return false;
    let { start_point, end_point, b_start_point, b_end_point, preparation_point, ff1, ff2 } = params;
    const aStar = new AStar(ff1, ff2, b_start_point, b_end_point, preparation_point);
    let path = aStar.run();
    if (!path.length) { // 第二次寻找
        preparation_point = [start_point, ...preparation_point, end_point];
        const aStar2 = new AStar(ff1, ff2, start_point, end_point, preparation_point);
        path = aStar2.run_easy()
    }
    if (!path.length) return false;
    path = [start_point, ...path, end_point];
    const points: CurvePoint[] = [];
    for (let i = 0, len = path.length; i < len; i++) {
        const p = m3.computeCoord3(path[i]);
        points.push(new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(p.x, p.y)));
    }
    return points;
}
export function slice_invalid_point(points: CurvePoint[]) {
    //  如果不处理两轴上相等的点，会造成线段折叠的路径片段，属于无效片段，处理过程即为切除无效片段
    let result_x = [points[0]];
    for (let i = 1, len = points.length - 1; i < len; i++) {
        let p1 = points[i - 1].point;
        let p2 = points[i].point;
        let p3 = points[i + 1].point;
        if (p1 && p2 && p3) {
            if (Math.abs(p3.y - p1.y) > 0.00001) result_x.push(points[i]);
        }
    }
    result_x.push(points[points.length - 1]);
    let result_y = [result_x[0]];
    for (let i = 1, len = result_x.length - 1; i < len; i++) {
        let p1 = result_x[i - 1].point;
        let p2 = result_x[i].point;
        let p3 = result_x[i + 1].point;
        if (p1 && p2 && p3) {
            if (Math.abs(p3.x - p1.x) > 0.00001) result_y.push(result_x[i]);
        }
    }
    result_y.push(result_x[result_x.length - 1]);
    return result_y;
}
export function d(a: PageXY, b: XY): 'ver' | 'hor' | false {
    if (Math.abs(a.x - b.x) < 0.00001) return 'hor';
    if (Math.abs(a.y - b.y) < 0.00001) return 'ver';
    return false;
}