import {
    ImageShape,
    PathShape,
    PathShape2,
    Shape,
    ShapeSize,
    ShapeType,
    SymbolRefShape,
    SymbolShape
} from "../data/classes";
import { ShapeView } from "./shape";
import { DViewCtx, PropsType } from "./viewctx";
import { EL, elh } from "./el";
import { innerShadowId, renderBorders } from "../render";
import { objectId } from "../basic/objectid";
import { BlurType, PathSegment } from "../data/typesdefine";

export class PathShapeView extends ShapeView {

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

    protected _layout(size: ShapeSize, shape: Shape, parentFrame: ShapeSize | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scale: { x: number, y: number } | undefined): void {
        this.m_pathsegs = undefined;
        super._layout(size, shape, parentFrame, varsContainer, scale);
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
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        const g_props: any = {}
        const contextSettings = this.style.contextSettings;
        if (contextSettings) {
            const style: any = {
                'mix-blend-mode': contextSettings.blenMode
            }
            if (blur.length) {
                g_props.style = style;
                g_props.opacity = props.opacity;
                delete props.opacity;
            } else {
                if (props.style) {
                    (props.style as any)['mix-blend-mode'] = contextSettings.blenMode;
                } else {
                    props.style = style;
                }
            }
        }
        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (blur.length && inner_url.length) {
                    props.filter = `${inner_url.join(' ')}`
                    if (this.blur?.type === BlurType.Gaussian) props.filter += ` url(#${blurId})`
                } else {
                    if (inner_url.length) props.filter = inner_url.join(' ');
                    if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
                }
            } else {
                props.filter = `url(#pd_outer-${filterId}) `;
                if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter += `url(#${blurId}) `;
                if (inner_url.length) props.filter += inner_url.join(' ');
            }
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            if (blur.length) {
                const g = elh('g', g_props, [...shadows, body]);
                this.reset("g", ex_props, [...blur, g])
            } else {
                this.reset("g", ex_props, [...shadows, body])
            }
        } else {
            if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
            if (blur.length) {
                const g = elh('g', g_props, [...fills, ...childs, ...borders]);
                this.reset("g", props, [...blur, g]);
            } else {
                this.reset("g", props, [...blur, ...fills, ...childs, ...borders]);
            }
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
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (blur.length && inner_url.length) {
                    props.filter = `${inner_url.join(' ')}`
                    if (this.blur?.type === BlurType.Gaussian) props.filter += ` url(#${blurId})`
                } else {
                    if (inner_url.length) props.filter = inner_url.join(' ');
                    if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
                }
            } else {
                props.filter = `url(#pd_outer-${filterId}) `;
                if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter += `url(#${blurId}) `;
                if (inner_url.length) props.filter += inner_url.join(' ');
            }
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            return elh("g", ex_props, [...shadows, ...blur, body]);
        } else {
            if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
            return elh("g", props, [...blur, ...fills, ...childs, ...borders]);
        }
    }
}