import {
    PathShape,
    PathShape2,
    Shape,
    ShapeFrame,
    ShapeType,
    SymbolRefShape,
    SymbolShape
} from "../data/classes";
import { Path } from "../data/path";
import { parsePath } from "../data/pathparser";
import { ShapeView, matrix2parent, transformPoints } from "./shape";
import { Matrix } from "../basic/matrix";
import { RenderTransform } from "./basic";
import { DViewCtx, PropsType } from "./viewctx";
import { EL, elh } from "./el";
import { innerShadowId, renderBorders } from "../render";
import { objectId } from "../basic/objectid";
import { PathSegment } from "../data/typesdefine";

export class PathShapeView extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType, isTopClass: boolean = true) {
        super(ctx, props, isTopClass);
        this.afterInit();
    }

    m_pathsegs?: PathSegment[];

    get segments() {
        return this.m_pathsegs || (this.m_data as PathShape2).pathsegs;
    }

    get data(): PathShape {
        return this.m_data as PathShape;
    }

    get isClosed() {
        return this.data.isClosed;
    }

    protected _layout(frame: ShapeFrame, shape: Shape, transform: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        this.m_pathsegs = undefined;
        super._layout(frame, shape, transform, varsContainer);
    }

    // layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
    //     const shape = this.m_data as PathShape2;
    //     m.preScale(shape.frame.width, shape.frame.height); // points投影到parent坐标系的矩阵

    //     const matrix2 = matrix2parent(bbox.x, bbox.y, bbox.width, bbox.height, 0, false, false);
    //     matrix2.preScale(bbox.width, bbox.height); // 当对象太小时，求逆矩阵会infinity
    //     m.multiAtLeft(matrix2.inverse); // 反向投影到新的坐标系

    //     const pathsegs = shape.pathsegs;
    //     const newpathsegs = pathsegs.map((seg) => {
    //         return { crdtidx: seg.crdtidx, id: seg.id, points: transformPoints(seg.points, m), isClosed: seg.isClosed }
    //     });
    //     this.m_pathsegs = newpathsegs;

    //     const frame = this.frame;
    //     const parsed = newpathsegs.map((seg) => parsePath(seg.points, !!seg.isClosed, frame.width, frame.height, this.fixedRadius));
    //     const concat = Array.prototype.concat.apply([], parsed);
    //     this.m_path = new Path(concat);
    //     this.m_pathstr = this.m_path.toString();
    // }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.m_data);
    }

    render(): number {

        // const tid = this.id;
        const isDirty = this.checkAndResetDirty();
        if (!isDirty) {
            return this.m_render_version;
        }

        if (!this.isVisible) {
            this.reset("g"); // 还是要给个节点，不然后后面可见了挂不上dom
            return ++this.m_render_version;
        }

        // fill
        const fills = this.renderFills() || []; // cache
        // childs
        const childs = this.renderContents(); // VDomArray
        // border
        const borders = this.renderBorders() || []; // ELArray

        const props = this.renderProps();
        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);

        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (inner_url.length) props.filter = inner_url;
            } else {
                props.filter = `url(#pd_outer-${filterId}) ${inner_url}`;
            }
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            this.reset("g", ex_props, [...shadows, body])
        } else {
            this.reset("g", props, [...fills, ...childs, ...borders]);
        }
        return ++this.m_render_version;
    }

    renderStatic() {
        const fills = this.renderFills() || []; // cache
        // childs
        const childs = this.renderContents(); // VDomArray
        // border
        const borders = this.renderBorders() || []; // ELArray

        const props = this.renderStaticProps();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);

        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (inner_url.length) props.filter = inner_url;
            } else {
                props.filter = `url(#pd_outer-${filterId}) ${inner_url}`;
            }
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            return elh("g", ex_props, [...shadows, body]);
        } else {
            return elh("g", props, [...fills, ...childs, ...borders])
        }
    }
}