import { Style } from "./style";
import { Text } from "./text/text";
import * as classes from "./baseclasses"
import { BasicArray } from "./basic";
export { CurveMode, ShapeType, BoolOp, ExportOptions, ResizeType, ExportFormat, Point2D, CurvePoint, ShapeFrame, Ellipse, PathSegment } from "./baseclasses"
import { ShapeType, CurvePoint } from "./baseclasses"
import { parsePath } from "./pathparser";
import { ContactForm, ContactType, PathSegment } from "./baseclasses";
import {PathShape, Shape, Transform, ShapeSize} from "./shape";
import { RadiusType } from "./consts";
import { Path } from "@kcdesign/path";

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

    getPoints(): CurvePoint[] {
        return [];
    }

    private __pathCache: Path | undefined;
    getPath(): Path {
        return this.getPathOfSize(this.size, this.fixedRadius);
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const width = frame.width;
        const height = frame.height;
        const points = this.getPoints();
        this.__pathCache = parsePath(points, this.isClosed, width, height, fixedRadius);
        return this.__pathCache;
    }

    private __page: Shape | undefined;
    page() {
        if (!this.__page) {
            this.__page = this.getPage();
        }
        return this.__page;
    }

    get isPathIcon() {
        return false;
    }

    get radiusType() {
        return RadiusType.Fixed;
    }
}