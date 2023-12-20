import { Style } from "./style";
import { Text } from "./text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, Ellipse, PathSegment } from "./baseclasses"
import { ShapeType, CurvePoint, ShapeFrame, Point2D } from "./baseclasses"
import { Path } from "./path";
import { Matrix } from "../basic/matrix";
import { TextLayout } from "./textlayout";
import { parsePath } from "./pathparser";
import { ContactForm, ContactType, CurveMode } from "./baseclasses";
import { v4 } from "uuid";
import { d, gen_baisc_params, gen_matrix1, gen_path, gen_raw, slice_invalid_point } from "./utils";
import { PathShape, Shape } from "./shape";
interface PageXY {
    x: number
    y: number
}
export class ContactShape extends PathShape implements classes.ContactShape {
    typeId = 'contact-shape'
    from?: ContactForm
    to?: ContactForm
    isEdited: boolean
    mark: boolean
    text: Text
    constructor(
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        points: BasicArray<CurvePoint>,
        isClosed: boolean,
        isEdited: boolean,
        text: Text,
        mark: boolean
    ) {
        super(
            id,
            name,
            type,
            frame,
            style,
            points,
            isClosed
        )
        this.isEdited = isEdited; // 路径是否已被编辑
        this.text = text;
        this.mark = mark;
    }
    /**
     * @description 根据连接类型，在图形身上找一个点。该点的坐标系为页面坐标系
     */
    private get_pagexy(shape: Shape, type: ContactType, m2r: Matrix) {
        const f = shape.frame;
        switch (type) {
            case ContactType.Top: return m2r.computeCoord2(f.width / 2, 0);
            case ContactType.Right: return m2r.computeCoord2(f.width, f.height / 2);
            case ContactType.Bottom: return m2r.computeCoord2(f.width / 2, f.height);
            case ContactType.Left: return m2r.computeCoord2(0, f.height / 2);
            default: return false
        }
    }
    /**
     * @description 根据连接类型，在外围寻找一个最合适的点。该点的坐标系为页面坐标系
     */
    private get_nearest_border_point(shape: Shape, contactType: ContactType) { // 寻找距离外围最近的一个点
        const f = shape.frame, m2r = shape.matrix2Root();
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
        let op = this.get_pagexy(shape, contactType, m2r);
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
    /**
     * @description 红点 —— points经过头尾加工、处理外围点、削减无效点，最后在页面上渲染的点
     */
    getPoints(): CurvePoint[] {
        const points = [...this.points];
        let page: any;
        let s1: false | { x: number, y: number } = false, s2: false | { x: number, y: number } = false; // 外围点：s1出发图形的外围点，s2目的图形的外围点
        let self_matrix: undefined | Matrix, from_matrix: undefined | Matrix, to_matrix: undefined | Matrix; // 一些可复用矩阵 self_matrix：连接线自身的坐标系，单位为宽高比例系数(0-1)
        let fromShape: undefined | Shape, toShape: undefined | Shape; // 出发图形、目的图形
        let type1: ContactType, type2: ContactType; // 首尾连接类型
        let start_point: PageXY, end_point: PageXY; // 首尾点(活点)

        if (this.from) {
            page = this.getPage();
            if (page) {
                fromShape = page.getShape((this.from as ContactForm).shapeId);
                if (fromShape) {
                    type1 = (this.from as ContactForm).contactType;
                    self_matrix = gen_matrix1(this);
                    from_matrix = fromShape.matrix2Root();
                    let p = this.get_pagexy(fromShape, (this.from as ContactForm).contactType, from_matrix); // 获取开始点p
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        start_point = p;
                        const fp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[0] = fp; // points的第一个点替换为开始点p
                    }
                    let border_p = this.get_nearest_border_point(fromShape, (this.from as ContactForm).contactType); // 获取第一个外围点
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p); // 在没有编辑的状态下，外围点需要作为一个活点加入到渲染点中。
                        points.splice(1, 0, new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight));
                        s1 = border_p;
                    }
                }
            }
        }
        if (this.to) {
            if (!page) page = this.getPage();
            if (page) {
                toShape = page.getShape((this.to as ContactForm).shapeId);
                if (toShape) {
                    type2 = (this.to as ContactForm).contactType;
                    if (!self_matrix) self_matrix = gen_matrix1(this);
                    to_matrix = toShape.matrix2Root();
                    let p = this.get_pagexy(toShape, (this.to as ContactForm).contactType, to_matrix); // 获取终点p
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        end_point = p;
                        const lp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[points.length - 1] = lp; // points的最后一个点替换为终点p
                    }
                    let border_p = this.get_nearest_border_point(toShape, (this.to as ContactForm).contactType); // 获取第二个外围点
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p);
                        points.splice(points.length - 1, 0, new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight));
                        s2 = border_p;
                    }
                }
            }
        }
        // 连接线被用户编辑过
        if (this.isEdited) {
            const result: CurvePoint[] = [...points];
            if (s1) result.splice(1, 1); // 编辑过后，不需要外围点再做为活点
            if (s2) result.splice(result.length - 2, 1);
            { // 在第一个点后面再寻找一个新的活点
                const flex_point1 = start_point!;
                const flex_point2 = result[1] ? {x: result[1].x, y: result[1].y} : undefined;
                if (flex_point1 && flex_point2) {
                    const _d = d(flex_point1, s1 as PageXY);
                    let p: undefined | CurvePoint;
                    if (_d === 'hor') {
                        p = new CurvePoint(v4(), flex_point2.x, flex_point1.y, CurveMode.Straight);
                    } else if (_d === 'ver') {
                        p = new CurvePoint(v4(), flex_point1.x, flex_point2.y, CurveMode.Straight);
                    }
                    if (p) result.splice(1, 1, p);
                }
            }
            {
                const len = result.length;
                const flex_point1 = end_point!;
                const flex_point2 = result[len - 2] ? {x: result[len - 2].x, y: result[len - 2].y} : undefined;
                if (flex_point1 && flex_point2) {
                    const _d = d(flex_point1, s2 as PageXY);
                    if (_d === 'hor') {
                        const p = new CurvePoint(v4(), flex_point2.x, flex_point1.y, CurveMode.Straight);
                        result.splice(len - 2, 1, p);
                    } else if (_d === 'ver') {
                        const p = new CurvePoint(v4(), flex_point1.x, flex_point2.y, CurveMode.Straight);
                        result.splice(len - 2, 1, p);
                    }
                }
            }
            return slice_invalid_point(result); // 最后削减无效点
        }
        // 未被编辑，由寻路算法计算连接线路径
        if (fromShape && toShape) {
            const result = gen_path(fromShape, type1!, toShape, type2!, from_matrix!, to_matrix!, self_matrix!);
            if (result && result.length) return slice_invalid_point(result);
        }
        if (!fromShape && !toShape) { }
        if (fromShape && !toShape) {
            const p = points.pop();
            if (p && s1) {
                points.push(new CurvePoint(v4(), p.x, s1.y, CurveMode.Straight), p);
            }
        }
        if (!fromShape && toShape) { }
        return slice_invalid_point(points);
    }
    /**
     * @description 计算路径时候可能会经过的点
     */
    getTemp() {
        if (this.isEdited) return [];
        const points = [...this.points];
        let page: any;
        let s1: false | { x: number, y: number } = false, s2: false | { x: number, y: number } = false; // 特殊点：s1出发图形的外围点，s2目的图形的外围点
        let self_matrix: undefined | Matrix, from_matrix: undefined | Matrix, to_matrix: undefined | Matrix; // 一些可复用矩阵 self_matrix：图形自身的坐标系，单位为比例系数
        let fromShape: undefined | Shape, toShape: undefined | Shape; //sides 出发图形、目的图形
        let type1, type2;
        if (this.from) {
            if (!page) page = this.getPage();
            if (page) {
                fromShape = page.getShape((this.from as ContactForm).shapeId);
                if (fromShape) {
                    type1 = (this.from as ContactForm).contactType;
                    if (!self_matrix) self_matrix = gen_matrix1(this);
                    if (!from_matrix) from_matrix = fromShape.matrix2Root();
                    let p = this.get_pagexy(fromShape, (this.from as ContactForm).contactType, from_matrix!);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        const fp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[0] = fp;
                    }
                    let border_p = this.get_nearest_border_point(fromShape, (this.from as ContactForm).contactType);
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p);
                        points.splice(1, 0, new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight));
                        s1 = border_p;
                    }
                }
            }
        }
        if (this.to) {
            if (!page) page = this.getPage();
            if (page) {
                toShape = page.getShape((this.to as ContactForm).shapeId);
                if (toShape) {
                    type2 = (this.to as ContactForm).contactType;
                    if (!self_matrix) self_matrix = gen_matrix1(this);
                    if (!to_matrix) to_matrix = toShape.matrix2Root();
                    let p = this.get_pagexy(toShape, (this.to as ContactForm).contactType, to_matrix);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        const lp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[points.length - 1] = lp;
                    }
                    let border_p = this.get_nearest_border_point(toShape, (this.to as ContactForm).contactType);
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p);
                        const t = points.pop();
                        if (t) points.push(new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight), t);
                        s2 = border_p;
                    }
                }
            }
        }
        // 寻找中间拐点
        if (fromShape && toShape && type1 && type2) {
            if (!self_matrix) self_matrix = gen_matrix1(this);
            if (!from_matrix) from_matrix = fromShape.matrix2Root();
            if (!to_matrix) to_matrix = toShape.matrix2Root();
            const params = gen_baisc_params(fromShape, type1, toShape, type2, from_matrix, to_matrix);
            if (!params) return [];
            const { preparation_point } = params;
            const path = preparation_point;
            const points: CurvePoint[] = [];
            for (let i = 0, len = path.length; i < len; i++) {
                const p = self_matrix.computeCoord3(path[i]);
                points.push(new CurvePoint(v4(), p.x, p.y, CurveMode.Straight));
            }
            return points;
        }

    }
    getTemp2() {
        if (this.isEdited) return [];
        const points = [...this.points];
        let page: any;
        let s1: false | { x: number, y: number } = false, s2: false | { x: number, y: number } = false; // 特殊点：s1出发图形的外围点，s2目的图形的外围点
        let self_matrix: undefined | Matrix, from_matrix: undefined | Matrix, to_matrix: undefined | Matrix; // 一些可复用矩阵 self_matrix：图形自身的坐标系，单位为比例系数
        let fromShape: undefined | Shape, toShape: undefined | Shape; //sides 出发图形、目的图形
        let type1, type2;
        if (this.from) {
            if (!page) page = this.getPage();
            if (page) {
                fromShape = page.getShape((this.from as ContactForm).shapeId);
                if (fromShape) {
                    type1 = (this.from as ContactForm).contactType;
                    if (!self_matrix) self_matrix = gen_matrix1(this);
                    if (!from_matrix) from_matrix = fromShape.matrix2Root();
                    let p = this.get_pagexy(fromShape, (this.from as ContactForm).contactType, from_matrix!);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        const fp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[0] = fp;
                    }
                    let border_p = this.get_nearest_border_point(fromShape, (this.from as ContactForm).contactType);
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p);
                        points.splice(1, 0, new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight));
                        s1 = border_p;
                    }
                }
            }
        }
        if (this.to) {
            if (!page) page = this.getPage();
            if (page) {
                toShape = page.getShape((this.to as ContactForm).shapeId);
                if (toShape) {
                    type2 = (this.to as ContactForm).contactType;
                    if (!self_matrix) self_matrix = gen_matrix1(this);
                    if (!to_matrix) to_matrix = toShape.matrix2Root();
                    let p = this.get_pagexy(toShape, (this.to as ContactForm).contactType, to_matrix);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        const lp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[points.length - 1] = lp;
                    }
                    let border_p = this.get_nearest_border_point(toShape, (this.to as ContactForm).contactType);
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p);
                        const t = points.pop();
                        if (t) points.push(new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight), t);
                        s2 = border_p;
                    }
                }
            }
        }
        // 寻找中间拐点
        if (fromShape && toShape && type1 && type2) {
            if (!self_matrix) self_matrix = gen_matrix1(this);
            if (!from_matrix) from_matrix = fromShape.matrix2Root();
            if (!to_matrix) to_matrix = toShape.matrix2Root();
            const params = gen_raw(fromShape, type1, toShape, type2, from_matrix, to_matrix);
            if (!params) return [];
            const { preparation_point_green, preparation_point_red, preparation_point_yellow } = params;
            const path1 = preparation_point_green;
            const path2 = preparation_point_red;
            const path3 = preparation_point_yellow;
            const points1: CurvePoint[] = [];
            const points2: CurvePoint[] = [];
            const points3: CurvePoint[] = [];
            for (let i = 0, len = path1.length; i < len; i++) {
                const p = self_matrix.computeCoord3(path1[i]);
                points1.push(new CurvePoint(v4(), p.x, p.y, CurveMode.Straight));
            }
            for (let i = 0, len = path2.length; i < len; i++) {
                const p = self_matrix.computeCoord3(path2[i]);
                points2.push(new CurvePoint(v4(), p.x, p.y, CurveMode.Straight));
            }
            for (let i = 0, len = path3.length; i < len; i++) {
                const p = self_matrix.computeCoord3(path3[i]);
                points3.push(new CurvePoint(v4(), p.x, p.y, CurveMode.Straight));
            }
            return { points1, points2, points3 };
        }

    }
    /**
     * @description 绿点 —— points经过头尾加工、处理外围点之后的点
     */
    green_points() {
        const points = [...this.points];
        let page: any;
        let self_matrix: undefined | Matrix, from_matrix: undefined | Matrix, to_matrix: undefined | Matrix;
        let fromShape: undefined | Shape, toShape: undefined | Shape; // 出发图形、目的图形
        let start_point: PageXY, end_point: PageXY;
        if (this.from) {
            if (!page) page = this.getPage();
            if (page) {
                fromShape = page.getShape((this.from as ContactForm).shapeId);
                if (fromShape) {
                    self_matrix = gen_matrix1(this);
                    from_matrix = fromShape.matrix2Root();
                    let p = this.get_pagexy(fromShape, (this.from as ContactForm).contactType, from_matrix!);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        start_point = p;
                        const fp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[0] = fp;
                    }
                    let border_p = this.get_nearest_border_point(fromShape, (this.from as ContactForm).contactType);
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p);
                        points.splice(1, 0, new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight));
                    }
                }
            }
        }
        if (this.to) {
            if (!page) page = this.getPage();
            if (page) {
                toShape = page.getShape((this.to as ContactForm).shapeId);
                if (toShape) {
                    if (!self_matrix) self_matrix = gen_matrix1(this);
                    to_matrix = toShape.matrix2Root();
                    let p = this.get_pagexy(toShape, (this.to as ContactForm).contactType, to_matrix);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        end_point = p;
                        const lp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[points.length - 1] = lp;
                    }
                    let border_p = this.get_nearest_border_point(toShape, (this.to as ContactForm).contactType);
                    if (border_p) {
                        border_p = self_matrix.computeCoord3(border_p);
                        points.splice(points.length - 1, 0, new CurvePoint(v4(), border_p.x, border_p.y, CurveMode.Straight));
                    }
                }
            }
        }
        return points;
    }
    /**
     * @description 黄点：数据层(points)上真实存在的，并经过头尾加工的点，这里不存在外围点、也不会削减无效点
     */
    yellow_points() {
        const points = [...this.points];
        let page: any;
        let self_matrix: undefined | Matrix, from_matrix: undefined | Matrix, to_matrix: undefined | Matrix; // 可复用矩阵
        let fromShape: undefined | Shape, toShape: undefined | Shape; // 出发图形、目的图形
        if (this.from) { // 加工头部 —— 头部存在图形，则根据头部的连接方式，把数据层(points)上的第一个点替换成头部图形上的某一点
            if (!page) page = this.getPage();
            if (page) {
                fromShape = page.getShape((this.from as ContactForm).shapeId);
                if (fromShape) {
                    self_matrix = gen_matrix1(this);
                    from_matrix = fromShape.matrix2Root();
                    let p = this.get_pagexy(fromShape, (this.from as ContactForm).contactType, from_matrix);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        const fp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[0] = fp; // 替换
                    }
                }
            }
        }
        if (this.to) { // 加工尾部
            if (!page) page = this.getPage();
            if (page) {
                toShape = page.getShape((this.to as ContactForm).shapeId);
                if (toShape) {
                    if (!self_matrix) self_matrix = gen_matrix1(this);
                    to_matrix = toShape.matrix2Root();
                    let p = this.get_pagexy(toShape, (this.to as ContactForm).contactType, to_matrix);
                    if (p) {
                        p = self_matrix.computeCoord3(p);
                        const lp = new CurvePoint(v4(), p.x, p.y, CurveMode.Straight);
                        points[points.length - 1] = lp;
                    }
                }
            }
        }
        return points;
    }
    private __pathCache: Path | undefined;
    getPath(): Path {
        return this.getPathOfFrame(this.frame, this.fixedRadius);
    }
    getPath2(): Path {
        return this.getPath();
    }
    getPathOfFrame(frame: ShapeFrame, fixedRadius?: number): Path {
        const offsetX = 0;
        const offsetY = 0;
        const width = frame.width;
        const height = frame.height;
        const points = this.getPoints();
        const path = parsePath(points, !!this.isClosed, offsetX, offsetY, width, height, fixedRadius);
        this.__pathCache = new Path(path);
        return this.__pathCache;
    }
    getTextLayout(): TextLayout | undefined {
        if (!this.text || !this.mark) return;
        this.text.updateSize(40, 100);
        return this.text.getLayout();
    }
    private __page: Shape | undefined;
    page() {
        if (!this.__page) {
            this.__page = this.getPage();
        }
        return this.__page;
    }
}