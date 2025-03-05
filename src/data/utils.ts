import { v4 } from "uuid";
import { CurvePoint, Shape, SymbolShape, Variable } from "./shape";
import { ContactType, CurveMode, OverrideType } from "./typesdefine";
import { SymbolRefShape } from "./classes";
import { BasicArray } from "./basic";
import { Transform } from "./transform";

interface PageXY {
    x: number
    y: number
}

/**
 * @description 根据连接类型获取页面坐标系上的连接点
 */
function get_pagexy(shape: Shape, type: ContactType, m2r: Transform) {
    const f = shape.size;
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
    const xy2 = p2r.computeCoord2(box.x + box.width, box.y + box.height);
    return { xy1, xy2 }
}
export function get_nearest_border_point(shape: Shape, contactType: ContactType, m2r: Transform, xy1: PageXY, xy2: PageXY) { // 寻找距离外围最近的一个点
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

function isEqu(a: number, b: number) {
    return Math.abs(a - b) < 0.00001;
}

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

const __handle: { [key: string]: (points: CurvePoint[], start: CurvePoint, end: CurvePoint, width: number, height: number) => void } = {};
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

export function findVar(varId: string, ret: Variable[], varsContainer: (SymbolRefShape | SymbolShape)[], revertStart: number | undefined = undefined, fOverride: boolean = false) {
    let i = revertStart === undefined ? varsContainer.length - 1 : revertStart;
    for (; i >= 0; --i) {
        const container = varsContainer[i];
        const _var = (container instanceof SymbolShape) && container.getVar(varId);
        if (!_var) continue;
        ret.push(_var);
        const ov = findOverride(varId, OverrideType.Variable, varsContainer.slice(0, i));
        if (ov) ret.push(...ov);
        return ret;
    }
    if (!fOverride) return; // 查找被删除掉的变量
    i = revertStart === undefined ? varsContainer.length - 1 : revertStart;
    for (; i >= 0; --i) {
        const container = varsContainer[i];
        const _var = (container instanceof SymbolRefShape) && container.getOverrid(varId, OverrideType.Variable);
        if (!_var) continue;
        ret.push(_var.v);
        const ov = findOverride(varId, OverrideType.Variable, varsContainer.slice(0, i));
        if (ov) ret.push(...ov);
        return ret;
    }
}

export function findOverride(refId: string, type: OverrideType, varsContainer: (SymbolRefShape | SymbolShape)[]) {
    let ret;
    for (let i = varsContainer.length - 1; i >= 0; --i) {
        const container = varsContainer[i];
        if (container instanceof SymbolRefShape) {
            const override = container.getOverrid(refId, type);
            if (override) {
                ret = override;
            }
            refId = refId.length > 0 ? (container.id + '/' + refId) : container.id;
        }
    }
    return ret ? [ret.v] : undefined;
}

export function findOverrideAll(refId: string, type: OverrideType, varsContainer: (SymbolRefShape | SymbolShape)[]) {
    let ret: Variable[] = [];
    for (let i = varsContainer.length - 1; i >= 0; --i) {
        const container = varsContainer[i];
        if (container instanceof SymbolRefShape) {
            const override = container.getOverrid(refId, type);
            if (override) {
                ret.push(override.v);
            }
            refId = refId.length > 0 ? (container.id + '/' + refId) : container.id;
        }
    }
    return ret.length > 0 ? ret : undefined;
}

export function findOverrideAndVar(
    shape: Shape, // not proxyed
    overType: OverrideType,
    varsContainer: (SymbolRefShape | SymbolShape)[],
    fOverride: boolean = false) {
    // override优先
    // find override
    // id: xxx/xxx/xxx
    const id = shape.id;
    const _vars = findOverride(id, overType, varsContainer);
    if (_vars) return _vars;

    const varbinds = shape.varbinds;
    const varId = varbinds?.get(overType);
    if (varId) {
        const _vars: Variable[] = [];
        findVar(varId, _vars, varsContainer, undefined, fOverride);
        if (_vars && _vars.length > 0) return _vars;
    }
}

export function is_mac() {
    return navigator && /macintosh|mac os x/i.test(navigator.userAgent);
}