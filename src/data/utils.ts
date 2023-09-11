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
function get_nearest_border_point(shape: Shape, contactType: ContactType, m2r: Matrix) { // 寻找距离外围最近的一个点
    const f = shape.frame;
    const points = [{ x: 0, y: 0 }, { x: f.width, y: 0 }, { x: f.width, y: f.height }, { x: 0, y: f.height }];
    const t = m2r.computeCoord2(0, 0);
    const box = { left: t.x, right: t.x, top: t.y, bottom: t.y };
    for (let i = 1; i < 4; i++) {
        const p = points[i];
        const t = m2r.computeCoord2(p.x, p.y);
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
    box.left -= 20, box.right += 20, box.top -= 20, box.bottom += 20;
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
        xs.push(points[i].x);
        ys.push(points[i].y);
    }
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    return [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom },
    ];
}
function isEqu(a: number, b: number) {
    return Math.abs(a - b) < 0.0001;
}
function get_intersection(line1: [PageXY, PageXY], line2: [PageXY, PageXY]) {
    if (isEqu(line1[0].x, line1[1].x) && isEqu(line2[0].x, line2[1].x)) {
        return false;
    }
    if (isEqu(line1[0].y, line1[1].y) && isEqu(line2[0].y, line2[1].y)) {
        return false;
    }
    if (isEqu(line1[0].y, line1[1].y) && isEqu(line2[0].x, line2[1].x)) {
        return { x: line2[0].x, y: line1[0].y };
    }
    if (isEqu(line1[0].x, line1[1].x) && isEqu(line2[0].y, line2[1].y)) {
        return { x: line1[0].x, y: line2[0].y };
    }
};
function removeDuplicatePoint(points: PageXY[]) {
    const res: PageXY[] = [];
    const cache: any = {};
    for (let i = 0, len = points.length; i < len; i++) {
        const { x, y } = points[i];
        if (cache[`${x}_${y}`]) {
            continue;
        } else {
            cache[`${x}_${y}`] = true;
            res.push(points[i]);
        }
    }
    return res;
};

export function gen_baisc_params(shape1: Shape, type1: ContactType, shape2: Shape, type2: ContactType, m1: Matrix, m2: Matrix) {
    const OFFSET = 20;
    const f1 = shape1.frame, f2 = shape2.frame;
    const s1xy1 = m1.computeCoord2(0, 0), s2xy1 = m2.computeCoord2(0, 0);
    const s1xy2 = m1.computeCoord(f1.width, f1.height), s2xy2 = m2.computeCoord2(f2.width, f2.height);
    const s1w = s1xy2.x - s1xy1.x, s1h = s1xy2.y - s1xy1.y;
    const s2w = s2xy2.x - s2xy1.x, s2h = s2xy2.y - s2xy1.y;
    const ff1 = { x: s1xy1.x, y: s1xy1.y, width: s1w, height: s1h };
    const ff2 = { x: s2xy1.x, y: s2xy1.y, width: s2w, height: s2h };
    const start_point = get_pagexy(shape1, type1, m1), end_point = get_pagexy(shape2, type2, m2);
    if (!start_point || !end_point) return false;
    let preparation_point: PageXY[] = [];
    const fake_start_point1 = get_nearest_border_point(shape1, type1, m1);
    const fake_start_point2 = get_nearest_border_point(shape2, type2, m2);
    if (!fake_start_point1 || !fake_start_point2) return false;

    preparation_point.push(fake_start_point1, fake_start_point2); // 获取伪起点和伪终点,并将它们添加到数组里

    const t1 = { x: s1xy1.x - OFFSET, y: s1xy1.y - OFFSET }, t2 = { x: s1xy2.x + OFFSET, y: s1xy2.y + OFFSET };
    preparation_point.push(...XYsBoundingPoints([fake_start_point1, fake_start_point2, t1, t2])); // 伪起点和伪终点形成的矩形 和 起点元素包围框 组成一个大矩形 的四个顶点

    const t3 = { x: s2xy1.x - OFFSET, y: s2xy1.y - OFFSET }, t4 = { x: s2xy2.x + OFFSET, y: s2xy2.y + OFFSET };
    preparation_point.push(...XYsBoundingPoints([fake_start_point1, fake_start_point2, t3, t4])); // 伪起点和伪终点形成的矩形 和 终点元素包围框 组成一个大矩形 的四个顶点

    const t5 = get_intersection([start_point, fake_start_point1], [end_point, fake_start_point2]);
    if (t5) preparation_point.push(t5);
    if (!t5) {
        const t6 = { x: fake_start_point2.x + OFFSET, y: fake_start_point2.y }
        const t7 = get_intersection([start_point, fake_start_point1], [fake_start_point2, t6]);
        if (t7) preparation_point.push(t7);

        const t8 = { x: fake_start_point2.x, y: fake_start_point2.y + OFFSET };
        const t9 = get_intersection([start_point, fake_start_point1], [fake_start_point2, t8]);
        if (t9) preparation_point.push(t9);

        const t10 = { x: fake_start_point1.x + OFFSET, y: fake_start_point1.y };
        const t11 = get_intersection([end_point, fake_start_point2], [fake_start_point1, t10]);
        if (t11) preparation_point.push(t11);

        const t12 = { x: fake_start_point1.x, y: fake_start_point1.y + OFFSET };
        const t13 = get_intersection([end_point, fake_start_point2], [fake_start_point2, t12]);
        if (t13) preparation_point.push(t13);
    }
    preparation_point = removeDuplicatePoint(preparation_point);
    return { start_point, end_point, fake_start_point1, fake_start_point2, preparation_point, ff1, ff2 };
}
function checkIsSamePoint(a: PageXY | null, b: PageXY | undefined) {
    if (!a || !b) return false;
    return isEqu(a.x, b.x) && isEqu(a.y, b.y);
}
interface AP {
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
        // 存放待遍历的点
        this.openList = [];
        // 存放已经遍历的点
        this.closeList = [];
        this.shapeFrame1 = f1;
        this.shapeFrame2 = f2;
    }

    // 算法主流程
    start() {
        this.openList = [
            {
                point: this.startPoint, // 起点加入openList
                cost: 0, // 代价
                parent: null, // 父节点
            }
        ];
        this.closeList = [];
        while (this.openList.length) {
            // 在openList中找出优先级最高的点
            const point = this.getBestPoint();
            // point为终点，那么算法结束，输出最短路径
            if (checkIsSamePoint(point.point, this.endPoint)) {
                return this.getRoutes(point);
            } else {
                // 将point从openList中删除
                this.removeFromOpenList(point);
                // 将point添加到closeList中
                this.closeList.push(point);
                // 遍历point周围的点
                const nextPoints: PageXY[] = this.getNextPoints(point.point, this.pointList) as PageXY[];
                for (let i = 0; i < nextPoints.length; i++) {
                    let cur = nextPoints[i];
                    // 如果该点在closeList中，那么跳过该点
                    if (this.checkIsInList(cur, this.closeList)) {
                        continue;
                    } else if (!this.checkIsInList(cur, this.openList)) {
                        // 如果该点也不在openList中
                        const pointObj: AP = {
                            point: cur,
                            parent: point,// 设置point为当前点的父节点
                            cost: 0,
                        };
                        // 计算当前点的代价
                        this.computeCost(pointObj);
                        // 添加到openList中
                        this.openList.push(pointObj);
                    }
                }
            }
        }
        return []
    }

    // 获取openList中优先级最高的点，也就是代价最小的点
    getBestPoint() {
        let min = Infinity;
        let point = this.openList[0];
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
    getRoutes(point: AP) {
        let res = [point];
        let p = point.parent;
        while (p) {
            res.unshift(p);
            p = p.parent;
        }
        return res.map((item) => item.point);
    }

    // 将点从openList中删除
    removeFromOpenList(point: AP) {
        const index = this.openList.findIndex((item) => {
            return checkIsSamePoint(point.point, item.point);
        });
        this.openList.splice(index, 1);
    }

    // 检查点是否在列表中
    checkIsInList(point: PageXY, list: AP[]) {
        return list.find((item) => {
            return checkIsSamePoint(item.point, point);
        });
    }
    getNextPoints(point: PageXY, points: PageXY[]) {
        const { x, y } = point;
        const xSamePoints: PageXY[] = [];
        const ySamePoints: PageXY[] = [];
        // 找出x或y坐标相同的点
        for (let i = 0, len = points.length; i < len; i++) {
            const item = points[i];
            if (checkIsSamePoint(point, item)) continue;
            if (isEqu(item.x, x)) {
                xSamePoints.push(item);
            }
            if (isEqu(item.y, y)) {
                ySamePoints.push(item);
            }
        }
        // 找出x方向最近的点
        const xNextPoints = this.getNextPoint(x, y, ySamePoints, "x", this.shapeFrame1, this.shapeFrame2);
        // 找出y方向最近的点
        const yNextPoints = this.getNextPoint(x, y, xSamePoints, "y", this.shapeFrame1, this.shapeFrame2);
        return [...xNextPoints, ...yNextPoints];
    }
    checkLineThroughElements(a: PageXY, b: PageXY, f1: ShapeFrameLike, f2: ShapeFrameLike) {
        let rects: ShapeFrameLike[] = [f1, f2];
        let minX = Math.min(a.x, b.x);
        let maxX = Math.max(a.x, b.x);
        let minY = Math.min(a.y, b.y);
        let maxY = Math.max(a.y, b.y);
        const xxx = 0;
        // 水平线
        if (isEqu(a.y, b.y)) {
            for (let i = 0; i < rects.length; i++) {
                let rect = rects[i];
                if (minY >= rect.y - xxx &&
                    maxY <= rect.y + rect.height + xxx &&
                    minX <= rect.x + rect.width + xxx &&
                    maxX >= rect.x - xxx) {
                    return true;
                }
            }
        } else if (isEqu(a.x, b.x)) {
            // 垂直线
            for (let i = 0; i < rects.length; i++) {
                let rect = rects[i];
                if (minX >= rect.x - xxx &&
                    maxX <= rect.x + rect.width + xxx &&
                    minY <= rect.y + rect.height + xxx &&
                    maxY >= rect.y - xxx) {
                    return true;
                }
            }
        }
        return false;
    }
    getNextPoint(x: number, y: number, list: PageXY[], dir: 'x' | 'y', f1: ShapeFrameLike, f2: ShapeFrameLike) {
        const value = dir === "x" ? x : y;
        let nextLeftTopPoint = null;
        let nextRIghtBottomPoint = null;
        for (let i = 0; i < list.length; i++) {
            let cur = list[i];
            // 检查当前点和目标点的连线是否穿过起终点元素
            if (this.checkLineThroughElements({ x, y }, cur, f1, f2)) continue;
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
        return [nextLeftTopPoint, nextRIghtBottomPoint].filter((point) => {
            return !!point;
        });
    };
    // 计算一个点的代价
    computeCost(point: AP) {
        point.cost = this.computedGCost(point) + this.computedHCost(point);
    }
    computedGCost(point: AP) {
        let res = 0;
        let par = point.parent;
        while (par) {
            res += par.cost;
            par = par.parent;
        }
        return res;
    }
    computedHCost(point: AP) {
        return (
            Math.abs(this.endPoint!.x - point.point.x) +
            Math.abs(this.endPoint!.y - point.point.y)
        )
    }
}
export function gen_path(shape1: Shape, type1: ContactType, shape2: Shape, type2: ContactType, m1: Matrix, m2: Matrix, m3: Matrix) {
    const params = gen_baisc_params(shape1, type1, shape2, type2, m1, m2);
    if (!params) return false;
    const { start_point, end_point, fake_start_point1, fake_start_point2, preparation_point, ff1, ff2 } = params;
    const aStar = new AStar(ff1, ff2, fake_start_point1, fake_start_point2, preparation_point);
    let path = aStar.start();
    if (!path.length) return false;
    path = [start_point, ...path, end_point];
    const points: CurvePoint[] = [];
    for (let i = 0, len = path.length; i < len; i++) {
        const p = m3.computeCoord3(path[i]);
        points.push(new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(p.x, p.y)));
    }
    return points;
}