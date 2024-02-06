import { PathShape2, Shape, ShapeFrame, SymbolRefShape, SymbolShape } from "../data/classes";
import { Path } from "../data/path";
import { parsePath } from "../data/pathparser";
import { ShapeView, matrix2parent, transformPoints } from "./shape";
import { Matrix } from "../basic/matrix";
import { PathSegment } from "../data/typesdefine";
import { RenderTransform } from "./basic";
import { DViewCtx, PropsType } from "./viewctx";

export class PathShapeView2 extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props, false);
        this.afterInit();
    }

    m_pathsegs?: PathSegment[];

    protected _layout(shape: Shape, transform: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        this.m_pathsegs = undefined;
        super._layout(shape, transform, varsContainer);
    }

    layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
        const shape = this.m_data as PathShape2;
        m.preScale(shape.frame.width, shape.frame.height); // points投影到parent坐标系的矩阵

        const matrix2 = matrix2parent(bbox.x, bbox.y, bbox.width, bbox.height, 0, false, false);
        matrix2.preScale(bbox.width, bbox.height); // 当对象太小时，求逆矩阵会infinity
        m.multiAtLeft(matrix2.inverse); // 反向投影到新的坐标系

        const pathsegs = shape.pathsegs;
        const newpathsegs = pathsegs.map((seg) => {
            return { crdtidx: seg.crdtidx, points: transformPoints(seg.points, m), isClosed: seg.isClosed }
        });
        this.m_pathsegs = newpathsegs;

        const frame = this.frame;
        const parsed = newpathsegs.map((seg) => parsePath(seg.points, !!seg.isClosed, 0, 0, frame.width, frame.height, this.fixedRadius));
        const concat = Array.prototype.concat.apply([], parsed);
        this.m_path = new Path(concat);
        this.m_pathstr = this.m_path.toString();
    }
}