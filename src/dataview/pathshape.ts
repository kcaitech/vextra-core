import {
    FillType, GradientType,
    makeShapeTransform1By2,
    makeShapeTransform2By1, OvalShape,
    PathShape,
    PathShape2,
    Shape,
    ShapeFrame,
    ShapeType,
    SymbolRefShape,
    SymbolShape,
    Transform
} from "../data";
import { ShapeView } from "./shape";
import { EL, elh } from "./el";
import { innerShadowId, renderBorders } from "../render";
import { objectId } from "../basic/objectid";
import { BlurType, PathSegment } from "../data/typesdefine";
import { render as renderLineBorders } from "../render/line_borders"
import { PageView } from "./page";
import { importBorder } from "../data/baseimport";
import { exportBorder } from "../data/baseexport";

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

    protected _layout(
        shape: Shape,
        parentFrame: ShapeFrame | undefined,
        varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
        scale: { x: number, y: number } | undefined,
        uniformScale: number | undefined
    ): void {
        this.m_pathsegs = undefined;
        super._layout(shape, parentFrame, varsContainer, scale, uniformScale);
    }

    protected renderBorders(): EL[] {
        let borders = this.getBorders();
        if (this.mask) {
            borders = borders.map(b => {
                const nb = importBorder(exportBorder(b));
                if (nb.fillType === FillType.Gradient && nb.gradient?.gradientType === GradientType.Angular) nb.fillType = FillType.SolidColor;
                return nb;
            })
        }
        if ((this.segments.length === 1 && !this.segments[0].isClosed) || this.segments.length > 1) {
            return renderLineBorders(elh, this.data.style, borders, this.startMarkerType, this.endMarkerType, this.getPathStr(), this.m_data);
        }
        return renderBorders(elh, borders, this.frame, this.getPathStr(), this.m_data);
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const masked = this.masked;
        if (masked) {
            (this.getPage() as PageView).getView(masked.id)?.render();
            this.reset("g");
            return ++this.m_render_version;
        }

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

        // 遮罩
        const _mask_space = this.renderMask();
        if (_mask_space) {
            Object.assign(props.style, { transform: _mask_space.toString() });
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformFromMask;
            const __body = elh("g", { style: { transform: __body_transform } }, children);
            this.bleach(__body);
            children = [__body];
            const mask = elh('mask', { id }, children);
            const rely = elh('g', { mask: `url(#${id})` }, this.relyLayers);
            children = [mask, rely];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }

    get relyLayers() {
        if (!this.m_transform_form_mask) this.m_transform_form_mask = this.renderMask();
        if (!this.m_transform_form_mask) return;

        const group = this.m_mask_group || [];
        if (group.length < 2) return;
        const inverse = makeShapeTransform2By1(this.m_transform_form_mask).getInverse();
        const els: EL[] = [];
        for (let i = 1; i < group.length; i++) {
            const __s = group[i];
            const dom = __s.dom;
            (dom.elattr as any)['style'] = { 'transform': makeShapeTransform1By2(__s.transform2.clone().addTransform(inverse)).toString() };
            els.push(dom);
        }

        return els;
    }

    get transformFromMask() {
        this.m_transform_form_mask = this.renderMask();
        if (!this.m_transform_form_mask) return;

        const space = makeShapeTransform2By1(this.m_transform_form_mask).getInverse();

        return makeShapeTransform1By2(this.transform2.clone().addTransform(space)).toString()
    }

    renderMask() {
        if (!this.mask) return;
        const parent = this.parent;
        if (!parent) return;
        const __children = parent.childs;
        let index = __children.findIndex(i => i.id === this.id);
        if (index === -1) return;
        const maskGroup: ShapeView[] = [this];
        this.m_mask_group = maskGroup;
        for (let i = index + 1; i < __children.length; i++) {
            const cur = __children[i];
            if (cur && !cur.mask) maskGroup.push(cur);
            else break;
        }
        let x = Infinity;
        let y = Infinity;

        maskGroup.forEach(s => {
            const box = s.boundingBox();
            if (box.x < x) x = box.x;
            if (box.y < y) y = box.y;
        });

        return new Transform(1, 0, x, 0, 1, y);
    }

    bleach(el: EL) {  // 漂白，mask元素内，白色的像素显示，黑色的像素隐藏
        if (el.elattr.fill && el.elattr.fill !== 'none' && !(el.elattr.fill as string).startsWith('url(#gradient')) {
            el.elattr.fill = '#FFF';
        }
        if (el.elattr.stroke && el.elattr.stroke !== 'none' && !(el.elattr.stroke as string).startsWith('url(#gradient')) {
            el.elattr.stroke = '#FFF';
        }
        // 漂白阴影
        if (el.eltag === 'feColorMatrix' && el.elattr.result) {
            let values: any = el.elattr.values;
            if (values) values = values.split(' ');
            if (values[3]) values[3] = 1;
            if (values[8]) values[8] = 1;
            if (values[13]) values[13] = 1;
            el.elattr.values = values.join(' ');
        }

        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }

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

    get startingAngle() {
        return (this.data as OvalShape).startingAngle;
    }

    get endingAngle() {
        return (this.data as OvalShape).endingAngle;
    }

    get innerRadius() {
        return (this.data as OvalShape).innerRadius;
    }

    get haveEdit() {
        return this.data.haveEdit;
    }
}