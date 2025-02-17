import { BorderPosition, Style } from "./style";
import { Text } from "./text/text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, Ellipse, PathSegment } from "./baseclasses"
import { ShapeType, CurvePoint, ShapeFrame } from "./baseclasses"
import { parsePath } from "./pathparser";
import { ContactForm, ContactType, PathSegment } from "./baseclasses";
import { gen_matrix1, gen_path, handle_contact_from, handle_contact_to, path_for_edited, path_for_free_contact, path_for_free_end_contact, path_for_free_start_contact, slice_invalid_point } from "./utils";
import {PathShape, Shape, Transform, ShapeSize} from "./shape";
import { Page } from "./page";
import { RadiusType } from "./consts";
import { Path } from "@kcdesign/path";
interface PageXY {
    x: number
    y: number
}
export class ContactShape extends PathShape implements classes.ContactShape {
    typeId = 'contact-shape'

    isEdited: boolean
    mark: boolean
    text: Text

    from?: ContactForm
    to?: ContactForm
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        pathsegs: BasicArray<PathSegment>,
        isEdited: boolean,
        text: Text,
        mark: boolean
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style,
            size,
            pathsegs
        )

        this.crdtidx = crdtidx;
        this.isEdited = isEdited; // 路径是否已被编辑
        this.text = text;
        this.mark = mark;
    }

    get points() {
        if (!this.pathsegs.length) {
            return new BasicArray<CurvePoint>();
        } else {
            return this.pathsegs[0].points;
        }
    }

    get isClosed() {
        return !!this.pathsegs[0]?.isClosed;
    }

    /**
     * @description 根据连接类型，在图形身上找一个点。该点的坐标系为页面坐标系
     */
    get_pagexy(shape: Shape, type: ContactType, m2r: Transform) {
        const f = shape.size;
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
    get_nearest_border_point(shape: Shape, contactType: ContactType) { // 寻找距离外围最近的一个点
        const f = shape.size, m2r = shape.matrix2Root();
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
     * @description points经过头尾加工、处理外围点、削减无效点，最后在页面上渲染的点
     */
    getPoints(): CurvePoint[] {
        const points = [...this.points];

        let page: any;

        let s1: undefined | { x: number, y: number } = undefined; // 外围点：s1出发图形的外围点，s2目的图形的外围点
        let s2: undefined | { x: number, y: number } = undefined;

        let self_matrix: undefined | Transform; // 一些可复用矩阵 self_matrix：连接线自身的坐标系，单位为宽高比例系数(0-1)
        let from_matrix: undefined | Transform;
        let to_matrix: undefined | Transform;

        let fromShape: undefined | Shape; // 出发图形、目的图形
        let toShape: undefined | Shape;

        let type1: ContactType; // 首尾连接类型
        let type2: ContactType;

        let start_point: PageXY | undefined = undefined; // 首尾点(活点)
        let end_point: PageXY | undefined = undefined;


        if (this.to || this.from) {
            self_matrix = gen_matrix1(this);
            page = this.getPage() as Page;
        }

        const from_params = handle_contact_from(page, this, points, self_matrix!);
        if (from_params) {
            fromShape = from_params.fromShape;
            type1 = from_params.type1;
            from_matrix = from_params.from_matrix;
            start_point = from_params.start_point;
            s1 = from_params.s1;
        }

        const to_params = handle_contact_to(page, this, points, self_matrix!);
        if (to_params) {
            toShape = to_params.toShape;
            type2 = to_params.type2;
            to_matrix = to_params.to_matrix;
            end_point = to_params.end_point;
            s2 = to_params.s2;
        }

        if (points.length <= 1) {
            console.log(this.name, ': points.length <= 1');
            return points;
        }

        // 连接线被编辑过
        if (this.isEdited) {
            if (!self_matrix) {
                self_matrix = gen_matrix1(this);
            }

            if (!start_point) {
                // const _p0 = points[0];
                // start_point = self_matrix.computeCoord2(_p0.x, _p0.y);
                start_point = points[0];
            }

            if (!end_point) {
                // const _p_end = points[points.length - 1];
                // end_point = self_matrix.computeCoord2(_p_end.x, _p_end.y);
                end_point = points[points.length - 1];
            }

            return path_for_edited(points, start_point, end_point, s1, s2); // 最后削减无效点
        }

        // 未被编辑，由寻路算法计算连接线路径
        if (fromShape && toShape) {
            const result = gen_path(fromShape, type1!, toShape, type2!, from_matrix!, to_matrix!, self_matrix!);
            if (result?.length) {
                return slice_invalid_point(result);
            }
        }

        if (!fromShape && !toShape) {
            path_for_free_contact(points, this.size.width, this.size.height);
        }

        if (fromShape && !toShape) {
            path_for_free_end_contact(this, points, s1);
        }

        if (!fromShape && toShape) {
            path_for_free_start_contact(points, end_point, this.size.width, this.size.height);
        }

        return slice_invalid_point(points);
    }

    private __pathCache: Path | undefined;
    getPath(): Path {
        return this.getPathOfSize(this.size, this.fixedRadius);
    }

    getPath2(): Path {
        return this.getPath();
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        // const offsetX = 0;
        // const offsetY = 0;
        const width = frame.width;
        const height = frame.height;
        const points = this.getPoints();
        this.__pathCache = parsePath(points, !!this.isClosed, width, height, fixedRadius);
        return this.__pathCache;
    }

    private __page: Shape | undefined;
    page() {
        if (!this.__page) {
            this.__page = this.getPage();
        }
        return this.__page;
    }

    // get isNoSupportDiamondScale() {
    //     return true;
    // }

    // get frameType() {
    //     return FrameType.None;
    // }

    get isPathIcon() {
        return false;
    }

    get radiusType() {
        return RadiusType.Fixed;
    }
    // get isImageFill() {
    //     return false;
    // }
}