import {
    makeShapeTransform1By2,
    makeShapeTransform2By1,
    PathShape,
    PathShape2,
    Shape,
    ShapeSize,
    ShapeType,
    SymbolRefShape,
    SymbolShape, Transform
} from "../data";
import { ShapeView } from "./shape";
import { EL, elh } from "./el";
import { innerShadowId, renderBorders } from "../render";
import { objectId } from "../basic/objectid";
import { BlurType, PathSegment } from "../data/typesdefine";
import { render as renderLineBorders } from "../render/line_borders"
import { GroupShapeView } from "./groupshape";

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

    protected _layout(size: ShapeSize, shape: Shape, parentFrame: ShapeSize | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scale: {
        x: number,
        y: number
    } | undefined): void {
        this.m_pathsegs = undefined;
        super._layout(size, shape, parentFrame, varsContainer, scale);
    }

    protected renderBorders(): EL[] {
        if ((this.segments.length === 1 && !this.segments[0].isClosed) || this.segments.length > 1) {
            return renderLineBorders(elh, this.data.style, this.getBorders(), this.startMarkerType, this.endMarkerType, this.getPathStr(), this.m_data);
        }
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.m_data);
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills() || [];
        const borders = this.renderBorders() || [];
        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        let props = this.renderProps();
        let children = [...fills, ...borders];

        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (inner_url.length) filter = `${inner_url.join(' ')}`
            } else {
                filter = `url(#pd_outer-${filterId}) `;
                if (inner_url.length) filter += inner_url.join(' ');
            }
            children = [...shadows, elh("g", { filter }, children)];
        }

        // 模糊
        if (blur.length) {
            let filter: string = '';
            if (this.blur?.type === BlurType.Gaussian) filter = `url(#${blurId})`;
            children = [...blur, elh('g', { filter }, children)];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }

    // renderMasked() {
    //     const fills = this.renderFills() || [];
    //     const borders = this.renderBorders() || [];
    //
    //     const props = this.renderProps();
    //
    //     const t = makeShapeTransform2By1(this.maskTransform);
    //     const ot = this.transform2;
    //     ot.addTransform(t.getInverse());
    //     (props as any).style['transform'] = makeShapeTransform1By2(ot).toString();
    //     return elh("g", props, [...fills, ...borders]);
    // }

    // get maskTransform() {
    //     const parent = this.parent as GroupShapeView;
    //     const maskArea: ShapeView[] = [];
    //     let x = Infinity;
    //     let y = Infinity;
    //
    //     maskArea.forEach(s => {
    //         const box = s.boundingBox();
    //         if (box.x < x) x = box.x;
    //         if (box.y < y) y = box.y;
    //     });
    //
    //     return new Transform(1, 0, x, 0, 1, y);
    // }

    renderStatic() {
        const fills = this.renderFills() || []; // cache
        const childs = this.renderContents(); // VDomArray
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

    bleach(el: EL) {  // 漂白
        if (el.elattr.fill) el.elattr.fill = '#FFF';
        if (Array.isArray(el.elchilds)) {
            el.elchilds.forEach(e => this.bleach(e));
        }
    }
}